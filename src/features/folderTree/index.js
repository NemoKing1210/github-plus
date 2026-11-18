import { on } from '../../core/bus.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { getFolderTreeSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { showToast } from '../../ui/toast.js';
import { debounce } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { fetchCommitInfo, fetchFolder } from './api.js';
import { buildExpander, buildNoteRow, buildRow, buildSlot, updateExpander } from './render.js';
import {
  LISTING_SELECTOR,
  ROW_SELECTOR,
  rowTarget,
  topLevelRows,
} from './surfaces.js';

const log = createLogger('folder-tree');

/**
 * Expandable folders in the repository file listing.
 *
 * Nested rows copy GitHub's stable row shape, so the file-icons, file-ages,
 * file-meta, file-preview and file-menu features decorate them with their
 * ordinary surface observers. This module owns only the disclosure chevrons,
 * the folder fetch, the session expansion state and the repair of rows a React
 * re-render dropped.
 */
const RESCAN_MS = 100;
const SHELL_MS = 200;
/** Bounded window for a file listing that mounts after the navigation shell. */
const SETTLE_MS = 250;
const SETTLE_TRIES = 20;

/** Container -> `{ expanded: Set<key>, loading: Set<key>, requests: Map<key, number> }`. */
const listings = new Map();
/** Surface container -> observer. */
const observers = new Map();
let bodyObserver = null;
let observedBody = null;
let shellObserver = null;
let settleTimer = null;
let noSurfaceReported = false;
let listening = false;

function labelsFor(name, expanded) {
  return {
    expand: t('folderTree.expand', { name }),
    collapse: t('folderTree.collapse', { name }),
  };
}

function stateFor(container) {
  let state = listings.get(container);
  if (!state) {
    state = { expanded: new Set(), loading: new Set(), requests: new Map() };
    listings.set(container, state);
  }
  return state;
}

function nextRequest(state, key) {
  const id = (state.requests.get(key) || 0) + 1;
  state.requests.set(key, id);
  return id;
}

function depthOf(row) {
  const value = Number(row?.dataset?.gpTreeDepth);
  return Number.isFinite(value) ? value : 0;
}

function setBusy(row, busy) {
  const toggles = row.querySelectorAll('.gp-tree-toggle');
  for (let index = 0; index < toggles.length; index += 1) {
    const button = toggles[index];
    button.classList.toggle('is-loading', busy);
    if (busy) button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
  }
}

function insertAfter(cursor, node) {
  cursor.parentNode.insertBefore(node, cursor.nextSibling);
  return node;
}

/** The folder row behind a key, from GitHub's rows and our nested ones. */
function findFolderRow(container, key) {
  const rows = container.querySelectorAll(ROW_SELECTOR);
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.dataset.gpTreeKey === key) return row;
    if (row.hasAttribute('data-gp-tree-owner')) continue;
    const found = rowTarget(row);
    if (found && found.kind === 'folder' && found.key === key) return row;
  }
  return null;
}

function hasChildRows(row, key) {
  const next = row.nextElementSibling;
  return !!next && next.dataset?.gpTreeOwner === key;
}

function noteText(entries, totalCount) {
  if (!entries.length) {
    return { text: t('folderTree.empty'), className: 'gp-tree-note--empty' };
  }
  if (totalCount > entries.length) {
    return {
      text: t('folderTree.truncated', { count: entries.length }),
      className: 'gp-tree-note--truncated',
    };
  }
  return null;
}

function columnCount(container) {
  const header = container.querySelector('thead tr');
  return Math.max(4, header ? header.querySelectorAll('th').length : 4);
}

function reportFailure(row, name, restore) {
  setBusy(row, false);
  updateExpander(row, false, labelsFor(name, false));
  if (restore) {
    log.warn(Codes.FOLDER_TREE, 'restoring an expanded folder failed', { folder: name });
    return;
  }
  log.error(Codes.FOLDER_TREE, 'expanding a folder failed', { folder: name });
  showToast({
    type: 'error',
    title: t('folderTree.failed', { name }),
    message: t('folderTree.failedDesc'),
  });
}

/**
 * Load and insert one folder's children. A second call for a folder already in
 * flight is ignored; collapse invalidates the in-flight request through
 * `state.requests`.
 */
async function expandFolder(container, state, row, key, restore = false) {
  if (state.loading.has(key)) return;
  const target = rowTarget(row);
  if (!target || target.kind !== 'folder') return;
  state.loading.add(key);
  const request = nextRequest(state, key);
  setBusy(row, true);

  try {
    const [folder, commits] = await Promise.allSettled([
      fetchFolder(target.href),
      fetchCommitInfo(target.href),
    ]);
    if (folder.status === 'rejected') {
      if (state.requests.get(key) !== request) return;
      state.loading.delete(key);
      state.expanded.delete(key);
      reportFailure(row, target.name, restore);
      return;
    }
    if (!row.isConnected || state.requests.get(key) !== request) {
      if (!row.isConnected) state.loading.delete(key);
      return;
    }
    const value = folder.value;
    const commitMap = commits.status === 'fulfilled' ? commits.value : new Map();
    const notes = noteText(value.entries, value.totalCount);
    let cursor = row;
    for (let index = 0; index < value.entries.length; index += 1) {
      const entry = value.entries[index];
      const child = buildRow({
        entry,
        parentHref: target.href,
        parentKey: key,
        depth: depthOf(row) + 1,
        commit: commitMap.get(entry.name) || null,
        labels: labelsFor(entry.name, false),
      });
      insertAfter(cursor, child);
      cursor = child;
    }
    if (notes) {
      insertAfter(cursor, buildNoteRow({
        text: notes.text,
        className: notes.className,
        depth: depthOf(row) + 1,
        owner: key,
        colSpan: columnCount(container),
      }));
    }
    state.loading.delete(key);
    state.expanded.add(key);
    updateExpander(row, true, labelsFor(target.name, true));
    setBusy(row, false);
  } catch (error) {
    if (state.requests.get(key) === request) {
      state.loading.delete(key);
      state.expanded.delete(key);
      reportFailure(row, target.name, restore);
    }
    log.warn(Codes.FOLDER_TREE, 'building a folder row failed', { folder: target.name, error });
  }
}

/** Remove every descendant row of a folder, deepest rows included. */
function collapseFolder(state, row, key) {
  const depth = depthOf(row);
  const removed = [];
  let next = row.nextElementSibling;
  while (next && next.hasAttribute('data-gp-tree-depth') && depthOf(next) > depth) {
    removed.push(next);
    next = next.nextElementSibling;
  }
  const active = document.activeElement;
  const keepsFocus = removed.some((node) => node.contains(active));
  for (let index = 0; index < removed.length; index += 1) {
    const child = removed[index];
    if (child.dataset.gpTreeKey) state.expanded.delete(child.dataset.gpTreeKey);
    if (child.dataset.gpTreeKey) state.loading.delete(child.dataset.gpTreeKey);
    child.remove();
  }
  state.expanded.delete(key);
  state.loading.delete(key);
  nextRequest(state, key);
  const target = rowTarget(row);
  updateExpander(row, false, labelsFor(target?.name || '', false));
  if (keepsFocus) row.querySelector('.gp-tree-toggle')?.focus();
}

function toggleFolder(container, row) {
  const target = rowTarget(row);
  if (!target || target.kind !== 'folder') return;
  const state = stateFor(container);
  if (state.expanded.has(target.key)) {
    collapseFolder(state, row, target.key);
    return;
  }
  expandFolder(container, state, row, target.key);
}

function onClick(event) {
  if (!getFolderTreeSettings().enabled) return;
  const button = event.target instanceof Element ? event.target.closest('.gp-tree-toggle') : null;
  if (!button) return;
  const row = button.closest(ROW_SELECTOR);
  const container = button.closest(LISTING_SELECTOR);
  if (!row || !container) return;
  event.preventDefault();
  event.stopPropagation();
  toggleFolder(container, row);
}

function placeHeaderSlots(container) {
  const header = container.querySelector('thead tr');
  if (!header) return;
  const cells = header.querySelectorAll('th');
  const count = Math.min(2, cells.length);
  for (let index = 0; index < count; index += 1) {
    if (cells[index].querySelector('.gp-tree-head-slot')) continue;
    const slot = document.createElement('span');
    slot.className = 'gp-tree-head-slot';
    slot.setAttribute('aria-hidden', 'true');
    cells[index].insertBefore(slot, cells[index].firstChild);
  }
}

function ensureSlots(container, state) {
  const rows = topLevelRows(container);
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const target = rowTarget(row);
    if (!target) continue;
    const columns = row.querySelectorAll('.react-directory-filename-column');
    for (let c = 0; c < columns.length; c += 1) {
      const column = columns[c];
      if (column.querySelector('.gp-tree-slot')) continue;
      const child = target.kind === 'folder'
        ? buildExpander({ name: target.name, labels: labelsFor(target.name, false) })
        : null;
      column.insertBefore(buildSlot(child), column.firstChild);
    }
    if (target.kind === 'folder') {
      updateExpander(row, state.expanded.has(target.key), labelsFor(target.name, state.expanded.has(target.key)));
    }
  }
}

/** Re-insert children an expansion already owns after a re-render removed them. */
function restoreExpanded(container, state) {
  const keys = Array.from(state.expanded);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (state.loading.has(key)) continue;
    const row = findFolderRow(container, key);
    if (!row) continue;
    if (!hasChildRows(row, key)) expandFolder(container, state, row, key, true);
  }
}

function processContainer(container) {
  if (!getFolderTreeSettings().enabled) return;
  const state = stateFor(container);
  placeHeaderSlots(container);
  ensureSlots(container, state);
  restoreExpanded(container, state);
}

function attach(container) {
  const observer = new MutationObserver(
    debounce(() => processContainer(container), RESCAN_MS),
  );
  observer.observe(container, { childList: true, subtree: true });
  observers.set(container, observer);
  processContainer(container);
}

/** Remove every injected node, listener and piece of state. */
function teardown() {
  if (listening) {
    document.removeEventListener('click', onClick, true);
    listening = false;
  }
  for (const observer of observers.values()) observer.disconnect();
  observers.clear();
  listings.clear();
  const injected = document.querySelectorAll(
    'tr.gp-tree-row, tr.gp-tree-note-row, .gp-tree-slot, .gp-tree-head-slot',
  );
  for (let index = 0; index < injected.length; index += 1) injected[index].remove();
  const marked = document.querySelectorAll('[data-gp-tree-expanded]');
  for (let index = 0; index < marked.length; index += 1) {
    marked[index].removeAttribute('data-gp-tree-expanded');
  }
}

function syncSurfaces() {
  if (!getFolderTreeSettings().enabled) return 0;
  for (const [container, observer] of observers) {
    if (!container.isConnected) {
      observer.disconnect();
      observers.delete(container);
      listings.delete(container);
    }
  }
  const containers = document.querySelectorAll(LISTING_SELECTOR);
  let matched = 0;
  for (let index = 0; index < containers.length; index += 1) {
    matched += 1;
    if (!observers.has(containers[index])) attach(containers[index]);
    else processContainer(containers[index]);
  }
  if (matched) noSurfaceReported = false;
  return matched;
}

function stopSettle() {
  if (settleTimer === null) return;
  clearInterval(settleTimer);
  settleTimer = null;
}

function settleSurfaces() {
  stopSettle();
  let tries = 0;
  settleTimer = setInterval(() => {
    tries += 1;
    if (!getFolderTreeSettings().enabled || syncSurfaces() > 0) {
      stopSettle();
      return;
    }
    if (tries >= SETTLE_TRIES) {
      stopSettle();
      // One line per page without a file listing — never one per retry.
      if (!noSurfaceReported) {
        noSurfaceReported = true;
        log.info('no file-listing surface on this page');
      }
    }
  }, SETTLE_MS);
}

function observeBody() {
  if (typeof MutationObserver !== 'function') return;
  const body = document.body;
  if (!body || (bodyObserver && observedBody === body)) return;
  if (bodyObserver) bodyObserver.disconnect();
  observedBody = body;
  // A toast or any other direct child of the body must not reset the tree;
  // only a replaced body (the shell observer) does that. This observer is
  // here to pick the listing up when the app shell rearranges itself.
  bodyObserver = new MutationObserver(debounce(resyncSurfaces, SHELL_MS));
  bodyObserver.observe(body, { childList: true });
}

/** Re-attach surface observers without touching the expansion state. */
function resyncSurfaces() {
  if (!getFolderTreeSettings().enabled) return;
  if (syncSurfaces() === 0) settleSurfaces();
  else stopSettle();
}

function observeShell() {
  observeBody();
  if (shellObserver || typeof MutationObserver !== 'function') return;
  if (!document.documentElement) return;
  shellObserver = new MutationObserver(
    debounce(() => {
      // Head additions reach this observer too; only a new body needs a rescan.
      if (observedBody === document.body) return;
      observeBody();
      applyFolderTreeSettings();
    }, SHELL_MS),
  );
  shellObserver.observe(document.documentElement, { childList: true });
}

/**
 * The expansion state of a row the file menu can act on: `'expanded'` or
 * `'collapsed'` for a listing folder row this feature currently owns, else
 * null. A row without a chevron must not offer an expansion.
 */
export function folderRowExpansion(row) {
  if (!getFolderTreeSettings().enabled || !(row instanceof Element)) return null;
  const container = row.closest(LISTING_SELECTOR);
  if (!container || !observers.has(container)) return null;
  const target = rowTarget(row);
  if (!target || target.kind !== 'folder') return null;
  const state = listings.get(container);
  return state && state.expanded.has(target.key) ? 'expanded' : 'collapsed';
}

/** Toggle the disclosure of a folder row this feature owns; false when it does not. */
export function toggleFolderRow(row) {
  if (!folderRowExpansion(row)) return false;
  toggleFolder(row.closest(LISTING_SELECTOR), row);
  return true;
}

/** Repaint every chevron's label in the current locale. */
export function refreshFolderTreeLabels() {
  const containers = document.querySelectorAll(LISTING_SELECTOR);
  for (let index = 0; index < containers.length; index += 1) {
    const container = containers[index];
    const state = listings.get(container);
    const toggles = container.querySelectorAll('.gp-tree-toggle');
    for (let t = 0; t < toggles.length; t += 1) {
      const row = toggles[t].closest(ROW_SELECTOR);
      const target = row ? rowTarget(row) : null;
      if (!row || !target || target.kind !== 'folder') continue;
      const expanded = state ? state.expanded.has(target.key) : row.dataset.gpTreeExpanded === 'true';
      updateExpander(row, expanded, labelsFor(target.name, expanded));
    }
  }
}

/** Apply the current settings: watch the listing, or remove everything. */
export function applyFolderTreeSettings() {
  observeShell();
  stopSettle();
  teardown();
  if (!getFolderTreeSettings().enabled) return;
  document.addEventListener('click', onClick, true);
  listening = true;
  if (syncSurfaces() === 0) settleSurfaces();
}

/** Boot the folder tree (idempotent). */
export function initFolderTreeFeature() {
  on('settings:folderTree', applyFolderTreeSettings);
  on('settings:language', refreshFolderTreeLabels);
  // A navigation replaces the listing, so the expansion set belongs to the
  // page that opened it and starts empty again. A hash-only change keeps the
  // page and therefore keeps the open folders.
  let lastPage = `${location.pathname}${location.search}`;
  watchNavigation(() => {
    const page = `${location.pathname}${location.search}`;
    if (page === lastPage) return;
    lastPage = page;
    applyFolderTreeSettings();
  });
  observeBody();
  applyFolderTreeSettings();
}
