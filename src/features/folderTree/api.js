import { FOLDER_TREE_CACHE_MS, FOLDER_TREE_MAX_ENTRIES, FOLDER_TREE_TIMEOUT_MS } from '../../core/constants.js';

/**
 * The two same-origin JSON endpoints GitHub's own repository tree uses:
 * the folder page with `Accept: application/json` for entries, and
 * `tree-commit-info` for the last commit of every entry. They carry the
 * visitor's session (so private repositories work) and spend no API token.
 */
const ORIGIN = 'https://github.com';
const TREE_PATH = /^\/([^/]+)\/([^/]+)\/tree\/(.+)$/;

/** Folder key -> `{ at, value }`, kept for the session. */
const folderCache = new Map();
/** Folder key -> `{ at, value }` with the commit map. */
const commitCache = new Map();
const pendingFolder = new Map();
const pendingCommit = new Map();

function cached(store, key, force) {
  if (force) return null;
  const entry = store.get(key);
  return entry && Date.now() - entry.at < FOLDER_TREE_CACHE_MS ? entry.value : null;
}

async function requestJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FOLDER_TREE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error(`folder request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The URL pathname that identifies a folder row; the same value the page's
 * link carries, so a row can be found again after a React re-render.
 * @param {string} href
 * @returns {string}
 */
export function folderKey(href) {
  try {
    return new URL(href, ORIGIN).pathname;
  } catch {
    return '';
  }
}

function normalizeEntries(items) {
  const entries = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item || typeof item.name !== 'string' || !item.name) continue;
    const type = item.contentType === 'directory' ? 'folder' : 'file';
    entries.push({
      name: item.name,
      path: typeof item.path === 'string' ? item.path : item.name,
      type,
    });
  }
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
  return entries.slice(0, FOLDER_TREE_MAX_ENTRIES);
}

/**
 * List one folder. Throws on a network failure, a non-2xx response or a
 * payload without a tree; a failed call is never cached.
 * @param {string} href a folder's `/tree/...` address
 * @param {{force?: boolean}} [options]
 * @returns {Promise<{path: string, entries: Array<{name: string, path: string,
 *   type: 'folder'|'file'}>, totalCount: number}>}
 */
export function fetchFolder(href, { force = false } = {}) {
  const key = folderKey(href);
  if (!key) return Promise.reject(new Error('folder address is invalid'));
  const hit = cached(folderCache, key, force);
  if (hit) return Promise.resolve(hit);
  if (!force && pendingFolder.has(key)) return pendingFolder.get(key);

  const load = requestJson(`${ORIGIN}${key}`).then((data) => {
    const route = data?.payload?.codeViewTreeRoute;
    const tree = route?.tree;
    if (!tree || !Array.isArray(tree.items)) {
      throw new Error('folder response has no tree');
    }
    const value = {
      path: typeof route.path === 'string' ? route.path : '',
      entries: normalizeEntries(tree.items),
      totalCount: Number.isFinite(tree.totalCount) ? tree.totalCount : tree.items.length,
    };
    folderCache.set(key, { at: Date.now(), value });
    return value;
  }).finally(() => {
    pendingFolder.delete(key);
  });
  pendingFolder.set(key, load);
  return load;
}

function commitHtml(value) {
  if (!value) return { message: '', title: '' };
  if (typeof DOMParser !== 'function') {
    return { message: String(value).replace(/<[^>]*>/g, ' ').trim(), title: '' };
  }
  try {
    const doc = new DOMParser().parseFromString(String(value), 'text/html');
    const anchor = doc.querySelector('a');
    return {
      message: (anchor?.textContent || doc.body.textContent || '').trim(),
      title: (anchor?.getAttribute('title') || '').trim(),
    };
  } catch {
    return { message: '', title: '' };
  }
}

/**
 * Last-commit info for the entries of one folder, keyed by entry name.
 * A failure resolves to an empty map: the folder still expands without dates.
 * @param {string} href a folder's `/tree/...` address
 * @param {{force?: boolean}} [options]
 * @returns {Promise<Map<string, {oid: string, url: string, date: string,
 *   message: string, title: string}>>}
 */
export function fetchCommitInfo(href, { force = false } = {}) {
  const key = folderKey(href);
  const match = TREE_PATH.exec(key);
  if (!match) return Promise.resolve(new Map());
  const hit = cached(commitCache, key, force);
  if (hit) return Promise.resolve(hit);
  if (!force && pendingCommit.has(key)) return pendingCommit.get(key);

  const url = `${ORIGIN}/${match[1]}/${match[2]}/tree-commit-info/${match[3]}`;
  const load = requestJson(url).then((data) => {
    const value = new Map();
    const entries = data && typeof data.entries === 'object' ? data.entries : {};
    for (const [name, entry] of Object.entries(entries)) {
      if (!entry || typeof entry !== 'object') continue;
      const text = commitHtml(entry.shortMessageHtmlLink?.value);
      value.set(name, {
        oid: typeof entry.oid === 'string' ? entry.oid : '',
        url: typeof entry.url === 'string' ? entry.url : '',
        date: typeof entry.date === 'string' ? entry.date : '',
        message: text.message,
        title: text.title,
      });
    }
    commitCache.set(key, { at: Date.now(), value });
    return value;
  }).catch(() => new Map()).finally(() => {
    pendingCommit.delete(key);
  });
  pendingCommit.set(key, load);
  return load;
}

/** Forget every cached folder and commit response (tests and manual resets). */
export function clearFolderCache() {
  folderCache.clear();
  commitCache.clear();
}
