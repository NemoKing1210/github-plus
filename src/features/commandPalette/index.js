/**
 * Command palette lifecycle: settings, hotkey, data loads and the glue
 * between the shell and the data layers. This is the only module that reads
 * the persisted cache for display and the only one that reaches into the
 * settings panel and the translation cache.
 */

import { getLocale, t } from '../../i18n/index.js';
import { on } from '../../core/bus.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { getCommandPaletteSettings } from '../../core/settings.js';
import { showToast } from '../../ui/toast.js';
import { closeCommandPalette, isCommandPaletteOpen, openCommandPalette } from '../../ui/commandPalette.js';
import { openContextMenu } from '../../ui/contextMenu.js';
import { PALETTE_ICONS } from '../../ui/icons.js';
import { registerHeaderAction } from '../../ui/headerActions.js';
import { watchNavigation } from '../../utils/navigation.js';
import { formatShortcut, otherOverlayOpen, shouldOpenPalette, shortcutMatches } from './hotkey.js';
import { markPinned } from './rank.js';
import { cloneAddress, rowMenuItems } from './rowMenu.js';
import { searchPalette } from './search.js';
import { commandCandidates } from './commands.js';
import { ensureRepositories, forgetRepositories, repoCandidates } from './repos.js';
import { ensureTree, fileCandidates, forgetTrees, hasFileItems, treeKey } from './files.js';
import { ensureIssues, forgetIssues, issueCandidates } from './issues.js';
import { navigate, runAction } from './actions.js';
import {
  clearDataCache, isFresh, isRateBlocked, readPaletteState, readPins, readRecents, recordRecent,
  togglePin,
} from './store.js';
import { togglePanel } from '../settings/panel.js';
import { clearCache } from '../translate/cache.js';

const log = createLogger('command-palette');
const IDLE_FALLBACK_MS = 2000;

let hotkeyHandler = null;
let headerAction = null;
let menuCommandId = null;
let handle = null;
let paletteState = null;
let idleScheduled = false;
const sessionRefreshes = new Set();

function paletteLabels() {
  return {
    title: t('palette.title'),
    placeholder: t('palette.placeholder'),
    empty: t('palette.empty'),
    emptyHint: t('palette.emptyHint'),
    loading: t('palette.loading'),
    results: t('palette.results'),
    tip: t('palette.tip'),
    tipScoped: t('palette.tipScoped'),
    tipHelp: t('palette.tipHelp'),
    hintOpen: t('palette.hint.open'),
    hintScope: t('palette.hint.scope'),
    badges: {
      pinned: t('palette.badge.pinned'),
      recent: t('palette.badge.recent'),
      private: t('palette.badge.private'),
      starred: t('palette.badge.starred'),
      fork: t('palette.badge.fork'),
      archived: t('palette.badge.archived'),
      issue: t('palette.badge.issue'),
      pullRequest: t('palette.badge.pullRequest'),
    },
  };
}

function paletteHelpLabels() {
  return {
    title: t('palette.help.title'),
    prefixes: [
      { key: '>', label: t('palette.help.prefix.commands') },
      { key: '#', label: t('palette.help.prefix.issues') },
      { key: '/', label: t('palette.help.prefix.files') },
      { key: '@', label: t('palette.help.prefix.repos') },
    ],
    keys: t('palette.help.keys'),
    close: t('palette.help.close'),
  };
}

function rowMenuLabels() {
  return {
    ...paletteLabels(),
    open: t('palette.details.open'),
    openNewTab: t('palette.details.openNewTab'),
    copyLink: t('palette.details.copyLink'),
    copyPath: t('palette.details.copyPath'),
    copyNumber: t('palette.details.copyNumber'),
    copyClone: t('palette.details.copyClone'),
    pin: t('palette.details.pin'),
    unpin: t('palette.details.unpin'),
    run: t('palette.details.run'),
  };
}

function snapshotFor(item) {
  return {
    key: item.key,
    kind: item.kind,
    at: Date.now(),
    snapshot: {
      kind: item.kind,
      title: item.title,
      titleMuted: item.titleMuted,
      meta: item.meta,
      icon: item.icon,
      avatar: item.avatar,
      groupId: item.groupId,
      groupTitle: item.groupTitle,
      rankFields: item.rankFields,
      badges: item.badges,
      data: item.data,
      detail: item.detail,
    },
  };
}

function hasPages(source) {
  return Array.isArray(source?.pages);
}

function scopeRepo(state) {
  return state.scope?.repo || '';
}

function scopeDir(state) {
  return state.scope?.dir || '';
}

/**
 * The ref a scope browses: the page's own ref when the scope is its
 * repository, and HEAD for any other repository.
 */
function scopeRef(state) {
  const repo = scopeRepo(state);
  if (!repo) return state.context.ref || 'HEAD';
  return repo === state.context.repo ? state.context.ref || 'HEAD' : 'HEAD';
}

function scopeLabel(state) {
  const repo = scopeRepo(state);
  const dir = scopeDir(state);
  return dir ? `${repo}/${dir}` : repo;
}

/**
 * Pins and recents whose source has not loaded yet. Once a source is loaded
 * its own builder wins, so a removed repository does not come back from a
 * snapshot — it only stays pinned in storage.
 */
function snapshotCandidates(state) {
  const reposCold = !hasPages(state.cache?.sources?.repos) && !hasPages(state.cache?.sources?.starred);
  const scoped = scopeRepo(state);
  const fileRepo = scoped || state.context.repo;
  const filesCold = !hasFileItems(state, {
    repo: fileRepo,
    ref: scoped ? scopeRef(state) : state.context.ref,
  });
  const entries = [
    ...state.pins.map((entry) => ({ entry, badge: 'pinned' })),
    ...state.recents.map((entry) => ({ entry, badge: 'recent' })),
  ];
  const candidates = [];
  for (const { entry, badge } of entries) {
    if (!entry?.snapshot || entry.kind === 'command') continue;
    if (entry.kind === 'repo' && !reposCold) continue;
    if (entry.kind === 'file' && !filesCold) continue;
    const snapshot = entry.snapshot;
    const badges = [...new Set([...(snapshot.badges || []), badge])];
    // A snapshot keeps only what a row renders, so the scope target is derived
    // from the kind and the stored data instead of the original candidate.
    const scopeable = entry.kind === 'repo'
      || (entry.kind === 'file' && snapshot.data?.type === 'tree' && Boolean(snapshot.data?.repo));
    candidates.push({
      ...snapshot,
      key: entry.key,
      kind: entry.kind,
      scopeable,
      hint: snapshot.hint || (entry.kind === 'repo' ? t('palette.hint.jump') : ''),
      title: snapshot.title || entry.key,
      rankFields: snapshot.rankFields || [{ text: snapshot.title || '', weight: 3 }],
      badges,
      snapshot: { ...snapshot, pinned: badge === 'pinned' },
    });
  }
  return candidates;
}

function dedupe(candidates) {
  const seen = new Set();
  const list = [];
  for (const item of candidates) {
    if (!item?.key || seen.has(item.key)) continue;
    seen.add(item.key);
    list.push(item);
  }
  return list;
}

function buildCandidates(state) {
  const scoped = scopeRepo(state);
  return markPinned(dedupe([
    ...commandCandidates(state),
    ...(scoped ? [] : repoCandidates(state)),
    ...(scoped
      ? fileCandidates(state, { repo: scoped, ref: scopeRef(state), dir: scopeDir(state) })
      : []),
    ...(scoped ? issueCandidates(state, { repo: scoped }) : []),
    ...snapshotCandidates(state),
  ]), state.pinnedKeys);
}

/** The scope path rendered in the field: owner, repository and folded folder names. */
function pathSegments(state) {
  const repo = scopeRepo(state);
  if (!repo) return [];
  const labels = repo.split('/');
  const dir = scopeDir(state);
  if (dir) labels.push(...dir.split('/'));
  return labels.map((label) => ({ label }));
}

function scopedTip(path) {
  return path ? t('palette.tipScoped', { repo: path }) : t('palette.tip');
}

function syncPath() {
  if (!paletteState) return;
  handle?.setPath(pathSegments(paletteState), scopedTip(scopeLabel(paletteState)));
}

function repositoriesEnabled(settings) {
  return settings.sources.repositories !== false || settings.sources.starred !== false;
}

function noteFor(state) {
  if (state.status === 'rateLimited') {
    const resetAt = state.cache?.rateLimit?.resetAt;
    const time = resetAt
      ? new Date(resetAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })
      : '';
    return t('palette.status.rateLimited', { time });
  }
  if (state.status === 'offline') return t('palette.status.offline');
  if (state.status === 'invalidToken') return t('palette.status.invalidToken');
  if (!state.identity && repositoriesEnabled(state.settings)) return t('palette.status.anonymous');
  const repo = scopeRepo(state) || state.context.repo;
  const ref = scopeRepo(state) ? scopeRef(state) : state.context.ref;
  if (repo && ref) {
    const key = treeKey(repo, ref);
    const incomplete = state.treeInfo?.[key] ?? state.cache?.trees?.[key]?.incomplete;
    if (incomplete) return t('palette.status.incomplete');
  }
  return '';
}

function refreshView() {
  if (!paletteState) return;
  paletteState.candidates = buildCandidates(paletteState);
  handle?.refresh();
}

/**
 * Loads write to storage (and the session tree map), not to the state object
 * captured on open; take the cache again so the results reach the open palette.
 */
function syncCacheFromStore() {
  if (!paletteState?.identity) return;
  const fresh = readPaletteState();
  if (fresh.identity !== paletteState.identity) return;
  paletteState.cache = fresh.cache;
  paletteState.record = fresh.record;
}

function settleLoad(result) {
  if (!paletteState) return;
  if (result?.treeKey && result.truncated !== undefined) {
    paletteState.treeInfo[result.treeKey] = Boolean(result.truncated);
  }
  if (result?.status === 'error') {
    const status = result.error?.status;
    paletteState.loadError = status === 401 || status === 403
      ? (result.error?.rateLimit ? 'rateLimited' : 'invalidToken')
      : 'offline';
    paletteState.status = paletteState.loadError;
  } else if (!paletteState.loadError) {
    paletteState.status = 'ready';
  }
  syncCacheFromStore();
  refreshView();
}

function kickLoads() {
  const state = paletteState;
  if (!state || !state.identity) return;
  const tasks = [];
  if (repositoriesEnabled(state.settings) && !sessionRefreshes.has('repos')) {
    sessionRefreshes.add('repos');
    tasks.push({ promise: ensureRepositories() });
  }
  // Only a scoped repository has files and issues to list; the root level is
  // the account's pages and repositories, as in GitHub's own palette.
  const scoped = scopeRepo(state);
  if (state.settings.sources.files !== false && scoped) {
    const ref = scopeRef(state);
    const key = `tree:${treeKey(scoped, ref)}`;
    if (!sessionRefreshes.has(key)) {
      sessionRefreshes.add(key);
      tasks.push({
        promise: ensureTree({ repo: scoped, ref }),
        treeKey: treeKey(scoped, ref),
      });
    }
  }
  if (state.settings.sources.issues !== false && scoped) {
    const key = `issues:${scoped}`;
    if (!sessionRefreshes.has(key)) {
      sessionRefreshes.add(key);
      tasks.push({ promise: ensureIssues({ repo: scoped }) });
    }
  }
  if (!tasks.length) return;
  state.loadError = null;
  state.status = 'loading';
  handle?.refresh();
  for (const task of tasks) {
    task.promise.then(
      (result) => settleLoad({ ...result, treeKey: task.treeKey }),
      (error) => settleLoad({ status: 'error', error }),
    );
  }
}

function actionOptions() {
  return {
    refresh: refreshView,
    openSettings: () => {
      closeCommandPalette();
      togglePanel(true);
    },
    clearPaletteCache: () => {
      clearDataCache();
      forgetRepositories();
      forgetTrees();
      forgetIssues();
      sessionRefreshes.clear();
      if (paletteState) {
        paletteState.cache = null;
        paletteState.treeInfo = {};
      }
    },
    clearTranslationCache: () => clearCache(),
  };
}

function copyTextFor(item) {
  if (item.kind === 'repo') return `https://github.com/${item.data?.fullName || ''}`;
  if (item.kind === 'file') return item.data?.url || '';
  if (item.kind === 'issue') return item.data?.run?.url || item.data?.url || '';
  return '';
}

async function onSelect(item, { newTab = false } = {}) {
  if (!item) return;
  const state = paletteState;
  if (state?.identity) recordRecent(state.identity, snapshotFor(item));
  closeCommandPalette();
  try {
    if (item.data?.run) {
      await runAction(item.data.run, { newTab, ...actionOptions() });
      return;
    }
    if (item.data?.url) navigate(item.data.url, newTab);
  } catch (error) {
    log.error(Codes.PALETTE_LOAD, 'palette action failed', { error });
    showToast({
      type: 'error',
      title: t('palette.refreshFailed'),
      message: t('palette.refreshFailedDesc'),
    });
  }
}

function onPin(item) {
  const state = paletteState;
  if (!state?.identity || !item) return;
  togglePin(state.identity, snapshotFor(item));
  state.pins = readPins(state.identity);
  state.pinnedKeys = state.pins.map((entry) => entry.key);
  state.recents = readRecents(state.identity);
  state.recentKeys = state.settings.sources.recent ? state.recents.map((entry) => entry.key) : [];
  refreshView();
}

function handleRowAction(actionId, item) {
  if (actionId === 'open' || actionId === 'run') return onSelect(item, { newTab: false });
  if (actionId === 'newTab') return onSelect(item, { newTab: true });
  if (actionId === 'pin') return onPin(item);
  if (actionId === 'copyLink') return runAction({ type: 'copy', text: copyTextFor(item) }, actionOptions());
  if (actionId === 'copyPath') return runAction({ type: 'copy', text: item.data?.path || '' }, actionOptions());
  if (actionId === 'copyClone') return runAction({ type: 'copy', text: cloneAddress(item) }, actionOptions());
  if (actionId === 'copyNumber') {
    const number = item.data?.number;
    return runAction({ type: 'copy', text: number ? `#${number}` : '' }, actionOptions());
  }
  return undefined;
}

/**
 * Tab on a repository row opens that repository as a level; Tab on a folder
 * row inside it opens that folder as the next level.
 */
function handleScope(item) {
  if (!paletteState || !item) return false;
  if (item.kind === 'repo') {
    const repo = item.data?.fullName || item.title || '';
    if (!repo) return false;
    paletteState.scope = { repo };
  } else if (item.kind === 'file' && item.data?.type === 'tree' && item.data.repo) {
    paletteState.scope = { repo: item.data.repo, dir: item.data.path };
  } else {
    return false;
  }
  paletteState.loadError = null;
  paletteState.status = isRateBlocked(paletteState.cache) ? 'rateLimited' : 'ready';
  syncPath();
  handle?.setQuery('');
  refreshView();
  kickLoads();
  return true;
}

/** Backspace on an empty query: leave one folder, or the repository itself. */
function popPath() {
  const state = paletteState;
  if (!state?.scope) return;
  if (state.scope.dir) {
    const parts = state.scope.dir.split('/');
    parts.pop();
    state.scope = parts.length
      ? { repo: state.scope.repo, dir: parts.join('/') }
      : { repo: state.scope.repo };
    state.loadError = null;
  } else {
    state.scope = null;
    state.loadError = null;
    state.status = isRateBlocked(state.cache) ? 'rateLimited' : 'ready';
  }
  syncPath();
  refreshView();
  kickLoads();
}

/** Clicking a path segment leaves every level below it. */
function handlePathClick(index) {
  const state = paletteState;
  if (!state?.scope) return;
  const segments = pathSegments(state);
  handle?.setQuery('');
  // The owner segment has no level of its own: the root list is where another
  // repository is chosen.
  if (index <= 0) {
    clearPath();
    return;
  }
  if (index === 1) {
    state.scope = { repo: state.scope.repo };
  } else {
    const dir = segments.slice(2, index + 1).map((segment) => segment.label).join('/');
    state.scope = { repo: state.scope.repo, dir };
  }
  state.loadError = null;
  syncPath();
  refreshView();
}

function clearPath() {
  if (!paletteState?.scope) return;
  paletteState.scope = null;
  paletteState.loadError = null;
  paletteState.status = isRateBlocked(paletteState.cache) ? 'rateLimited' : 'ready';
  syncPath();
  refreshView();
}

function copyActive(item) {
  const text = copyTextFor(item);
  if (!text) return;
  runAction({ type: 'copy', text }, actionOptions()).catch((error) => {
    log.error(Codes.PALETTE_LOAD, 'palette copy failed', { error });
  });
}

/** Open the palette over the current page. */
export function openPalette() {
  const settings = getCommandPaletteSettings();
  if (!settings.enabled || isCommandPaletteOpen() || otherOverlayOpen()) return;

  const state = readPaletteState();
  state.pins = readPins(state.identity);
  state.recents = readRecents(state.identity);
  state.pinnedKeys = state.pins.map((entry) => entry.key);
  state.recentKeys = state.settings.sources.recent ? state.recents.map((entry) => entry.key) : [];
  state.status = isRateBlocked(state.cache) ? 'rateLimited' : 'ready';
  state.treeInfo = {};
  state.loadError = null;
  // GitHub opens the palette at the visitor's current location, so a
  // repository page starts with that repository already in the path.
  state.scope = state.context.repo ? { repo: state.context.repo } : null;
  state.candidates = buildCandidates(state);
  paletteState = state;

  handle = openCommandPalette({
    labels: paletteLabels(),
    path: pathSegments(state),
    tip: scopedTip(scopeLabel(state)),
    help: paletteHelpLabels(),
    search: (query) => ({
      ...searchPalette(state, query, {
        pinned: t('palette.group.pinned'),
        recent: t('palette.group.recent'),
        top: t('palette.group.top'),
      }),
      status: state.status === 'loading' ? 'loading' : 'ready',
      note: noteFor(state),
    }),
    onSelect,
    onPin,
    onScope: handleScope,
    onPathPop: popPath,
    onPathClick: handlePathClick,
    onClearPath: clearPath,
    onCopy: copyActive,
    onContextMenu: (item, position) => openContextMenu({
      ...position,
      label: item.title || '',
      layer: 'palette',
      // A menu action can rebuild the row that anchored the menu; without this
      // the palette would stay open but stop receiving keys.
      onClose: () => handle?.focus(),
      items: rowMenuItems(item, {
        labels: rowMenuLabels(),
        pinned: Boolean(paletteState?.pinnedKeys.includes(item.key)),
        onAction: (actionId) => handleRowAction(actionId, item),
      }),
    }),
    onClose: () => {
      handle = null;
      paletteState = null;
    },
  });
  kickLoads();
}

function idleRefresh() {
  idleScheduled = false;
  const state = readPaletteState();
  if (!state.settings.enabled || !state.identity || !state.cache) return;
  if (repositoriesEnabled(state.settings)) ensureRepositories().catch(() => {});
  if (state.settings.sources.files !== false && state.context.repo && state.context.ref) {
    ensureTree().catch(() => {});
  }
  if (state.settings.sources.issues !== false && state.context.repo) {
    ensureIssues().catch(() => {});
  }
}

function scheduleIdleRefresh() {
  if (idleScheduled) return;
  const state = readPaletteState();
  if (!state.settings.enabled || !state.settings.cacheHours) return;
  if (!state.cache) return;
  const sources = [];
  if (state.settings.sources.repositories !== false) sources.push(state.cache.sources?.repos);
  if (state.settings.sources.starred !== false) sources.push(state.cache.sources?.starred);
  const stale = sources.some((source) => !isFresh(source, state.settings.cacheHours));
  if (!stale) return;
  idleScheduled = true;
  if (typeof requestIdleCallback === 'function') requestIdleCallback(idleRefresh, { timeout: 5000 });
  else setTimeout(idleRefresh, IDLE_FALLBACK_MS);
}

/** Install or remove the document hotkey for the current settings. */
export function applyCommandPaletteSettings() {
  if (hotkeyHandler) document.removeEventListener('keydown', hotkeyHandler);
  hotkeyHandler = null;
  const settings = getCommandPaletteSettings();
  syncHeaderAction(settings);
  if (!settings.enabled || settings.shortcut === 'off') return;

  hotkeyHandler = (event) => {
    if (event.defaultPrevented) return;
    if (isCommandPaletteOpen()) {
      if (!shortcutMatches(event, settings.shortcut)) return;
      event.preventDefault();
      closeCommandPalette();
      return;
    }
    if (!shouldOpenPalette(event, { shortcut: settings.shortcut })) return;
    event.preventDefault();
    openPalette();
  };
  document.addEventListener('keydown', hotkeyHandler);
  scheduleIdleRefresh();
}

function headerLabel() {
  const title = t('palette.title');
  const shortcut = getCommandPaletteSettings().shortcut;
  return shortcut === 'off' ? title : `${title} (${formatShortcut(shortcut)})`;
}

/** The header entry exists only while the feature is on, so `off` removes it. */
function syncHeaderAction(settings) {
  if (!settings.enabled) {
    headerAction?.remove();
    headerAction = null;
    return;
  }
  if (!headerAction) {
    headerAction = registerHeaderAction({
      id: 'palette',
      order: 10,
      className: 'gp-palette-btn',
      icon: PALETTE_ICONS.palette,
      label: headerLabel(),
      onClick: openPalette,
    });
    return;
  }
  headerAction.update({ label: headerLabel() });
}

/** Register the manager menu entry, replacing it after a language change. */
function registerMenuCommand(replace = false) {
  if (typeof GM_registerMenuCommand !== 'function') return;
  if (replace) {
    // Without an id to unregister, adding the entry again would leave two menu
    // commands; keeping the old label is the lesser evil.
    if (typeof menuCommandId !== 'number' || typeof GM_unregisterMenuCommand !== 'function') return;
    try {
      GM_unregisterMenuCommand(menuCommandId);
    } catch {
      return;
    }
  }
  menuCommandId = GM_registerMenuCommand(t('menu.palette'), openPalette);
}

/** Subscribe the palette to settings, language and navigation changes once. */
export function initCommandPaletteFeature() {
  registerMenuCommand();
  on('settings:commandPalette', () => {
    closeCommandPalette();
    paletteState = null;
    handle = null;
    sessionRefreshes.clear();
    applyCommandPaletteSettings();
  });
  on('settings:language', () => {
    closeCommandPalette();
    headerAction?.update({ label: headerLabel() });
    if (menuCommandId !== null) registerMenuCommand(true);
  });
  watchNavigation(() => {
    closeCommandPalette();
  });
}
