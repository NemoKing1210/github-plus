/**
 * File-tree data for the command palette: one recursive tree per repository
 * and ref, cached by ETag and addressable as file rows.
 */

import { t } from '../../i18n/index.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { formatSize } from '../../utils/size.js';
import { fetchTreePage } from './api.js';
import {
  isFresh, isRateBlocked, persistRateLimit, readCacheRecord, readPaletteState, writeCacheRecord,
} from './store.js';

const log = createLogger('command-palette');
const TREE_MAX_ITEMS = 20000;
const TREE_MAX_BYTES = 1.5 * 1024 * 1024;
const TREE_KEEP = 3;
const MEMORY_KEEP = 10;
const memoryTrees = new Map();
const sortedTrees = new WeakMap();
const inflight = new Map();
let generation = 0;

export function treeKey(repo, ref) {
  return `${repo}@${ref}`;
}

function sortedItems(items) {
  let sorted = sortedTrees.get(items);
  if (!sorted) {
    sorted = [...items].sort((left, right) => {
      if (left.path === right.path) return 0;
      return left.path < right.path ? -1 : 1;
    });
    sortedTrees.set(items, sorted);
  }
  return sorted;
}

/** Keep the blobs and trees GitHub lists, in payload order. */
export function normalizeTree(payload) {
  const items = [];
  for (const entry of Array.isArray(payload?.tree) ? payload.tree : []) {
    const path = typeof entry?.path === 'string' ? entry.path : '';
    const type = entry?.type;
    if (!path || (type !== 'blob' && type !== 'tree')) continue;
    items.push({
      path,
      type,
      size: type === 'tree' ? 0 : Number(entry.size) || 0,
    });
  }
  return { items, truncated: payload?.truncated === true };
}

function encodePath(path) {
  return String(path).split('/').map(encodeURIComponent).join('/');
}

function buildFileCandidate(item, repo, ref, scopeDir = '') {
  const segments = item.path.split('/');
  const base = segments.pop();
  const directory = segments.join('/');
  const relativeDir = !scopeDir || directory === scopeDir
    ? (scopeDir ? '' : directory)
    : directory.startsWith(`${scopeDir}/`)
      ? directory.slice(scopeDir.length + 1)
      : directory;
  const isTree = item.type === 'tree';
  return {
    key: `file:${repo}@${ref}:${item.path}`,
    kind: 'file',
    groupId: 'files',
    groupTitle: t('palette.group.files'),
    icon: isTree ? 'folder' : 'file',
    // A folder row can be narrowed into with Tab, like a repository row.
    scopeable: isTree,
    title: isTree ? `${base}/` : base,
    titleMuted: relativeDir ? `${relativeDir} /` : '',
    meta: isTree ? '' : formatSize(item.size),
    rankFields: [
      { text: base, weight: 3 },
      { text: item.path, weight: 2 },
    ],
    data: {
      repo,
      ref,
      path: item.path,
      type: item.type,
      size: item.size || 0,
      url: `https://github.com/${repo}/${isTree ? 'tree' : 'blob'}/${encodeURIComponent(ref)}/${encodePath(item.path)}`,
    },
  };
}

function memoryKeyFor(state, key) {
  return `${state.identity || ''}|${key}`;
}

function treeRecordFor(state, key) {
  const memory = memoryTrees.get(memoryKeyFor(state, key));
  if (memory) return memory;
  return state.cache?.trees?.[key] || null;
}

/** File rows for the requested repository and ref, or the page's own. */
export function fileCandidates(state, { repo, ref, dir = '' } = {}) {
  if (state?.settings?.sources?.files === false) return [];
  const targetRepo = repo || state?.context?.repo;
  const targetRef = ref || state?.context?.ref;
  if (!targetRepo || !targetRef) return [];
  const tree = treeRecordFor(state, treeKey(targetRepo, targetRef));
  if (!tree || !Array.isArray(tree.items)) return [];

  const prefix = dir ? `${dir}/` : '';
  const items = sortedItems(tree.items)
    .filter((item) => !prefix || item.path.startsWith(prefix));
  return items.map((item) => buildFileCandidate(item, targetRepo, targetRef, dir));
}

/** Whether a loaded tree has any file row, without building the candidates. */
export function hasFileItems(state, { repo, ref } = {}) {
  if (state?.settings?.sources?.files === false) return false;
  const targetRepo = repo || state?.context?.repo;
  const targetRef = ref || state?.context?.ref;
  if (!targetRepo || !targetRef) return false;
  const tree = treeRecordFor(state, treeKey(targetRepo, targetRef));
  return Boolean(tree && Array.isArray(tree.items) && tree.items.length);
}

function persistTree(state, key, record, rateLimit) {
  // A repository load can finish while this tree was in flight; the disk
  // record is read again so its sources survive this write.
  const latest = readCacheRecord();
  const sameIdentity = Boolean(latest && latest.login === state.identity);
  const trees = { ...(sameIdentity ? latest.trees || {} : {}) };

  if (JSON.stringify(record).length <= TREE_MAX_BYTES) trees[key] = record;
  else delete trees[key];

  const kept = {};
  const newest = Object.entries(trees)
    .sort((left, right) => (right[1].fetchedAt || 0) - (left[1].fetchedAt || 0))
    .slice(0, TREE_KEEP);
  for (const [treeId, entry] of newest) kept[treeId] = entry;

  writeCacheRecord({
    version: 1,
    login: state.identity,
    tokenLogin: state.tokenLogin,
    tokenFingerprint: state.fingerprint,
    sources: sameIdentity ? latest.sources || {} : {},
    trees: kept,
    issues: sameIdentity ? latest.issues || {} : {},
    rateLimit: rateLimit || (sameIdentity ? latest.rateLimit || null : null),
  });
}

/**
 * Drop the trees held in memory. Clearing the persistent cache without this
 * would leave the page session serving rows the user just asked to forget.
 * The generation bump makes an in-flight load discard its result instead of
 * writing the cleared data back.
 */
export function forgetTrees() {
  generation += 1;
  memoryTrees.clear();
  inflight.clear();
}

function rememberTree(key, record) {
  memoryTrees.set(key, record);
  if (memoryTrees.size <= MEMORY_KEEP) return;
  const oldest = [...memoryTrees.entries()]
    .sort((left, right) => (left[1].fetchedAt || 0) - (right[1].fetchedAt || 0))
    .slice(0, memoryTrees.size - MEMORY_KEEP);
  for (const [treeId] of oldest) memoryTrees.delete(treeId);
}

async function loadTree(state, { repo, ref, force, signal }) {
  const key = treeKey(repo, ref);
  const memoryKey = memoryKeyFor(state, key);
  const existing = treeRecordFor(state, key);
  const now = Date.now();
  const stamp = generation;

  if (!force) {
    if (isFresh(existing, state.settings.cacheHours, now)) {
      return { status: 'cached', truncated: Boolean(existing.truncated) };
    }
    if (isRateBlocked(state.cache, now)) {
      return { status: 'cached', truncated: Boolean(existing?.truncated) };
    }
  }

  const [owner, name] = repo.split('/');
  let page;
  try {
    page = await fetchTreePage({
      owner,
      repo: name,
      ref,
      token: state.settings.token,
      cached: existing,
      signal,
    });
  } catch (error) {
    log.error(Codes.PALETTE_LOAD, 'palette file tree failed', { source: 'tree', repo, error });
    persistRateLimit(state, error?.rateLimit);
    return { status: 'error', error };
  }

  if (stamp !== generation) return { status: 'discarded' };

  if (page.notModified) {
    if (!existing) {
      const error = new Error('GitHub returned 304 without a cached tree');
      log.error(Codes.PALETTE_LOAD, 'palette file tree failed', { source: 'tree', repo, error });
      return { status: 'error', error };
    }
    const refreshed = { ...existing, fetchedAt: Date.now(), etag: page.etag || existing.etag || null };
    rememberTree(memoryKey, refreshed);
    persistTree(state, key, refreshed, page.rateLimit);
    return { status: 'updated', truncated: Boolean(refreshed.truncated) };
  }

  const normalized = normalizeTree(page.payload);
  const record = {
    items: normalized.items.slice(0, TREE_MAX_ITEMS),
    truncated: normalized.truncated,
    incomplete: normalized.truncated,
    fetchedAt: Date.now(),
    etag: page.etag || null,
  };
  rememberTree(memoryKey, record);
  persistTree(state, key, record, page.rateLimit);
  return { status: 'updated', truncated: record.truncated };
}

/**
 * Load a tree once, revalidating the cached copy. Concurrent callers for the
 * same tree and token share the in-flight load.
 */
export function ensureTree({ repo, ref, force = false, signal } = {}) {
  const state = readPaletteState();
  const targetRepo = repo || state.context.repo;
  const targetRef = ref || state.context.ref;
  if (!targetRepo || !targetRef) return Promise.resolve({ status: 'unavailable' });
  if (state.settings.sources.files === false) return Promise.resolve({ status: 'disabled' });
  if (!state.identity) return Promise.resolve({ status: 'anonymous' });

  const key = `${treeKey(targetRepo, targetRef)}|${state.fingerprint}`;
  const running = inflight.get(key);
  if (running && !force) return running;
  const promise = loadTree(state, { repo: targetRepo, ref: targetRef, force, signal }).finally(() => {
    if (inflight.get(key) === promise) inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
