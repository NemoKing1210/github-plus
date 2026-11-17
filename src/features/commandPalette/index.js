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
import { PALETTE_ICONS } from '../../ui/icons.js';
import { registerHeaderAction } from '../../ui/headerActions.js';
import { watchNavigation } from '../../utils/navigation.js';
import { formatShortcut, otherOverlayOpen, shouldOpenPalette, shortcutMatches } from './hotkey.js';
import { markPinned } from './rank.js';
import { searchPalette } from './search.js';
import { commandCandidates } from './commands.js';
import { ensureRepositories, repoCandidates } from './repos.js';
import { ensureTree, fileCandidates, forgetTrees, treeKey } from './files.js';
import { renderDetail } from './detail.js';
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
    navigate: t('palette.navigate'),
    open: t('palette.open'),
    newTab: t('palette.newTab'),
    close: t('palette.close'),
    noSelection: t('palette.noSelection'),
    rowMenu: t('palette.rowMenu'),
    badges: {
      pinned: t('palette.badge.pinned'),
      recent: t('palette.badge.recent'),
      private: t('palette.badge.private'),
      starred: t('palette.badge.starred'),
      fork: t('palette.badge.fork'),
      archived: t('palette.badge.archived'),
    },
  };
}

function detailLabels() {
  return {
    ...paletteLabels(),
    locale: getLocale(),
    updated: t('palette.details.updated'),
    stars: t('palette.details.stars'),
    forks: t('palette.details.forks'),
    private: t('palette.details.private'),
    owned: t('palette.details.owned'),
    starred: t('palette.details.starred'),
    org: t('palette.details.org'),
    open: t('palette.details.open'),
    openNewTab: t('palette.details.openNewTab'),
    copyLink: t('palette.details.copyLink'),
    copyPath: t('palette.details.copyPath'),
    pin: t('palette.details.pin'),
    unpin: t('palette.details.unpin'),
    run: t('palette.details.run'),
    ref: t('palette.details.ref'),
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

/**
 * Pins and recents whose source has not loaded yet. Once a source is loaded
 * its own builder wins, so a removed repository does not come back from a
 * snapshot — it only stays pinned in storage.
 */
function snapshotCandidates(state) {
  const reposCold = !hasPages(state.cache?.sources?.repos) && !hasPages(state.cache?.sources?.starred);
  const filesCold = fileCandidates(state).length === 0;
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
    candidates.push({
      ...snapshot,
      key: entry.key,
      kind: entry.kind,
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
  return markPinned(dedupe([
    ...commandCandidates(state),
    ...repoCandidates(state),
    ...fileCandidates(state),
    ...snapshotCandidates(state),
  ]), state.pinnedKeys);
}

function repositoriesEnabled(settings) {
  return settings.sources.repositories !== false || settings.sources.starred !== false;
}

function currentTree(state) {
  if (!state.context.repo || !state.context.ref) return null;
  return state.cache?.trees?.[treeKey(state.context.repo, state.context.ref)] || null;
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
  const tree = currentTree(state);
  if (state.treeIncomplete || tree?.incomplete) return t('palette.status.incomplete');
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
  if (result?.status === 'error') {
    const status = result.error?.status;
    paletteState.status = status === 401 || status === 403
      ? (result.error?.rateLimit ? 'rateLimited' : 'invalidToken')
      : 'offline';
  } else {
    paletteState.status = 'ready';
  }
  if (result?.truncated !== undefined) paletteState.treeIncomplete = Boolean(result.truncated);
  syncCacheFromStore();
  refreshView();
}

function kickLoads() {
  const state = paletteState;
  if (!state || !state.identity) return;
  const tasks = [];
  if (repositoriesEnabled(state.settings) && !sessionRefreshes.has('repos')) {
    sessionRefreshes.add('repos');
    tasks.push(ensureRepositories());
  }
  if (state.settings.sources.files !== false && state.context.repo && state.context.ref) {
    const key = `tree:${treeKey(state.context.repo, state.context.ref)}`;
    if (!sessionRefreshes.has(key)) {
      sessionRefreshes.add(key);
      tasks.push(ensureTree());
    }
  }
  if (!tasks.length) return;
  state.status = 'loading';
  handle?.refresh();
  for (const task of tasks) {
    task.then(settleLoad, (error) => settleLoad({ status: 'error', error }));
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
      forgetTrees();
      sessionRefreshes.clear();
      if (paletteState) {
        paletteState.cache = null;
        paletteState.treeIncomplete = false;
      }
    },
    clearTranslationCache: () => clearCache(),
  };
}

function copyTextFor(item) {
  if (item.kind === 'repo') return `https://github.com/${item.data?.fullName || ''}`;
  if (item.kind === 'file') return item.data?.url || '';
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

function handleDetailAction(actionId, item) {
  if (actionId === 'open' || actionId === 'run') return onSelect(item, { newTab: false });
  if (actionId === 'newTab') return onSelect(item, { newTab: true });
  if (actionId === 'pin') return onPin(item);
  if (actionId === 'copyLink') return runAction({ type: 'copy', text: copyTextFor(item) }, actionOptions());
  if (actionId === 'copyPath') return runAction({ type: 'copy', text: item.data?.path || '' }, actionOptions());
  return undefined;
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
  state.treeIncomplete = false;
  state.candidates = buildCandidates(state);
  paletteState = state;

  handle = openCommandPalette({
    labels: paletteLabels(),
    showDetails: state.settings.showDetails,
    search: (query) => ({
      ...searchPalette(state, query, {
        pinned: t('palette.group.pinned'),
        recent: t('palette.group.recent'),
      }),
      status: state.status === 'loading' ? 'loading' : 'ready',
      note: noteFor(state),
    }),
    renderDetail: (item) => renderDetail(item, {
      labels: detailLabels(),
      pinned: Boolean(paletteState?.pinnedKeys.includes(item.key)),
      onAction: handleDetailAction,
    }),
    onSelect,
    onPin,
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

/** Subscribe the palette to settings, language and navigation changes once. */
export function initCommandPaletteFeature() {
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(t('menu.palette'), openPalette);
  }
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
  });
  watchNavigation(() => {
    closeCommandPalette();
  });
}
