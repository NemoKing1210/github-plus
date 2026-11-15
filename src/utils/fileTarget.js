/**
 * The raw-file address behind a blob, blame or raw address, which is what both
 * the size probe and the download fetch need. GitHub's own raw route resolves
 * any ref, including branch names that contain slashes, so the path is
 * rewritten rather than rebuilt from parts.
 */
const FILE_VIEW_PATH = /^\/([^/]+)\/([^/]+)\/(?:blob|blame|raw)\/(.+)$/;

/**
 * Raw path for a file-view link or the current file view, '' when the address
 * does not point at one.
 * @param {string} href
 * @param {string} [base]
 * @returns {string}
 */
export function rawUrlFor(href, base = 'https://github.com') {
  if (!href) return '';
  let path;
  try {
    path = new URL(href, base).pathname;
  } catch {
    return '';
  }
  const match = FILE_VIEW_PATH.exec(path);
  if (!match) return '';
  return `/${match[1]}/${match[2]}/raw/${match[3]}`;
}

/**
 * The addresses behind a file link that the context menu acts on.
 *
 * GitHub does not mark where a ref ends inside a file view, and a branch may
 * contain slashes, so the page's current ref (the branch selector) is passed
 * in when known; without it the first segment after the marker is assumed to
 * be the ref, which is right for ordinary branch names.
 */
const FILE_PATH = FILE_VIEW_PATH;

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * @param {string} href blob link or the current blob page
 * @param {string} [base]
 * @param {string} [ref] the page's current branch or tag, when known
 * @returns {{href: string, rawUrl: string, relative: string, name: string} | null}
 */
export function fileTarget(href, base = 'https://github.com', ref = '') {
  if (!href) return null;
  let url;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  const match = FILE_PATH.exec(url.pathname);
  if (!match) return null;
  const rawUrl = rawUrlFor(url.pathname);
  if (!rawUrl) return null;
  let rest = match[3];
  if (ref && rest.startsWith(`${ref}/`)) rest = rest.slice(ref.length + 1);
  else {
    const slash = rest.indexOf('/');
    if (slash < 0) return null;
    rest = rest.slice(slash + 1);
  }
  if (!rest) return null;
  const relative = decode(rest);
  return {
    href: `${url.origin}${url.pathname}`,
    rawUrl,
    relative,
    name: relative.slice(relative.lastIndexOf('/') + 1),
  };
}

/**
 * Where a right-click or a preview request resolves to a file, and to nothing
 * everywhere else.
 *
 * Three surfaces: a file row of the repository listing, a file of the sidebar
 * file tree, and the file view of a blob or blame page. Folders, submodules
 * and anything that is not a file view return null, so the browser keeps its
 * own menu there. Links, images and media inside a rendered file are left
 * alone too — the native menu is the useful one for them — except the file's
 * own header link.
 */
const LISTING = '[data-testid="directory-content"]';
const FILE_VIEW_ONLY_PATH = /^\/[^/]+\/[^/]+\/(?:blob|blame)\//;
const FILE_VIEW_CONTENT = [
  '[data-testid="breadcrumbs"]',
  '[data-testid="breadcrumbs-filename"]',
  '[data-testid="read-only-cursor-text-area"]',
  '[data-testid="code-cell"]',
  '.react-code-file-contents',
  '.markdown-body',
].join(', ');
const TREE_PANE = '#repos-file-tree';
const TREE_ITEM = 'li[role="treeitem"]';
const TREE_ID_SUFFIX = '-item';
const REPO_PATH = /^\/([^/]+)\/([^/]+)\//;
const NATIVE_MEDIA = 'img, video, audio, picture, canvas';

function cleanText(node) {
  return (node?.textContent || '').trim();
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

/** The branch or tag the page is showing, when GitHub renders its selector. */
function currentRef() {
  const selector = document.querySelector('[data-testid="anchor-button"]');
  return cleanText(selector);
}

function ownFileLink(node) {
  const link = node.closest('a[href]');
  if (!link) return false;
  try {
    return new URL(link.getAttribute('href'), location.href).pathname === location.pathname;
  } catch {
    return false;
  }
}

function fromListing(node) {
  const row = node.closest('tr.react-directory-row');
  if (!row || !row.closest(LISTING)) return null;
  const link = row.querySelector('a[href*="/blob/"]');
  if (!link) return null;
  const target = fileTarget(link.getAttribute('href') || '', location.href, currentRef());
  if (!target) return null;
  return {
    ...target,
    name: cleanText(link) || target.name,
    source: 'listing',
    anchor: link,
  };
}

/** The repository-relative path a sidebar tree row stands for. */
function treeRelative(row) {
  const id = row.id || '';
  return id.endsWith(TREE_ID_SUFFIX) ? id.slice(0, -TREE_ID_SUFFIX.length) : '';
}

function isTreeFolder(row) {
  if (row.hasAttribute('aria-expanded')) return true;
  const icon = row.querySelector('.PRIVATE_TreeView-item-visual svg.octicon');
  return /octicon-(file-directory|file-submodule|file-symlink-directory)/.test(
    icon?.getAttribute('class') || '',
  );
}

function fromFileTree(node) {
  const row = node.closest(TREE_ITEM);
  if (!row || !row.closest(TREE_PANE) || isTreeFolder(row)) return null;
  const relative = treeRelative(row);
  const ref = currentRef();
  const repo = REPO_PATH.exec(location.pathname);
  if (!relative || !ref || !repo) return null;
  const href = `${location.origin}/${repo[1]}/${repo[2]}/blob/${encodePath(ref)}/${encodePath(relative)}`;
  const target = fileTarget(href, location.href, ref);
  if (!target) return null;
  const pageTarget = fileTarget(location.pathname, location.href, ref);
  const label = row.querySelector('.PRIVATE_TreeView-item-content-text');
  return {
    ...target,
    name: cleanText(label) || target.name,
    // The current file is already open, so its row offers no redundant "Open".
    source: pageTarget && pageTarget.relative === target.relative ? 'blob' : 'tree',
    anchor: row,
  };
}

function fromFileView(node) {
  if (!FILE_VIEW_ONLY_PATH.test(location.pathname)) return null;
  if (!node.closest(FILE_VIEW_CONTENT)) return null;
  if (node.closest(NATIVE_MEDIA)) return null;
  if (node.closest('a[href]') && !ownFileLink(node)) return null;
  const target = fileTarget(location.pathname, location.href, currentRef());
  if (!target) return null;
  const title = document.querySelector('[data-testid="breadcrumbs-filename"]');
  return {
    ...target,
    source: 'blob',
    anchor: title || node,
  };
}

/**
 * @param {EventTarget|null} node
 * @returns {{name: string, href: string, rawUrl: string, relative: string,
 *   source: 'listing'|'tree'|'blob', anchor: Element} | null}
 */
export function resolveFileTarget(node) {
  if (!(node instanceof Element)) return null;
  return fromListing(node) || fromFileTree(node) || fromFileView(node);
}
