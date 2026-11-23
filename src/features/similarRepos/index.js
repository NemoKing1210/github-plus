/**
 * Similar-repositories lifecycle: resolve the repository sidebar, fetch one
 * page for a public repository, render it and follow settings and soft
 * navigation. Mirrors the other page features — one observer per resolved
 * container, shell watchers, a bounded settle wait, and no document-wide
 * observer.
 */
import { getSettings, getSimilarReposSettings } from '../../core/settings.js';
import { on } from '../../core/bus.js';
import { createLogger, Codes } from '../../core/logger/index.js';
import {
  SIMILAR_REPOS_SETTLE_MS,
  SIMILAR_REPOS_SETTLE_TRIES,
} from '../../core/constants.js';
import { t } from '../../i18n/index.js';
import { debounce } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { fetchSimilar as defaultFetchSimilar, isAbort } from './api.js';
import { PANEL_CLASS, renderPanel } from './render.js';
import { currentRepo, isPublicRepo, resolveSidebar } from './surfaces.js';

const log = createLogger('similar-repos');
const OBSERVE_DEBOUNCE_MS = 150;

/** Session cache: request key → `{ at, items, hasMore }`. */
const cache = new Map();
/** In-flight requests keyed like the cache. */
const inflight = new Map();
/** Errors that are shown once per page session, not refetched on every pass. */
const settledErrors = new Map();

let enabled = false;
let fetchSimilar = defaultFetchSimilar;
let observers = new Map();
let shellObservers = [];
let stopNavigation = null;
let settleTimer = null;
let generation = 0;
let controller = null;
let pagesLoaded = 1;
/** Rows of every page loaded so far for the current page session. */
let collected = [];
let lastHasMore = false;
let loadingMore = false;

function labels() {
  return {
    title: t('similarRepos.title'),
    more: t('similarRepos.more'),
    archived: t('similarRepos.archived'),
    match: t('similarRepos.match'),
    stars: t('similarRepos.stars'),
    forks: t('similarRepos.forks'),
    states: {
      loading: t('similarRepos.loading'),
      empty: t('similarRepos.empty'),
      'not-in-dataset': t('similarRepos.notInDataset'),
      'rate-limited': t('similarRepos.rateLimitedWait'),
      'star-required': t('similarRepos.starRequired'),
      failed: t('similarRepos.failed'),
    },
  };
}

function cacheKey(settings, repo) {
  return `${settings.provider}|${repo}|${settings.results}|${pagesLoaded}`;
}

function cacheTtlMs(settings) {
  return Math.max(0, Number(settings.cacheHours) || 0) * 60 * 60 * 1000;
}

function readCache(key, settings) {
  const ttl = cacheTtlMs(settings);
  if (ttl === 0) return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > ttl) {
    cache.delete(key);
    return null;
  }
  return entry;
}

function stateForError(error) {
  const code = error?.code;
  if (code === 'not-in-dataset') return 'not-in-dataset';
  if (code === 'star-required') return 'star-required';
  if (code === 'rate-limited') return 'rate-limited';
  return 'failed';
}

function removePanel() {
  const existing = document.querySelector(`.${PANEL_CLASS}`);
  if (existing) existing.remove();
}

function mountPanel(node) {
  const resolved = resolveSidebar();
  if (!resolved) return false;
  removePanel();
  resolved.container.appendChild(node);
  return true;
}

function renderState(state, message) {
  const node = renderPanel({ labels: labels(), rows: [], state });
  if (message) {
    const paragraph = node.querySelector('.gp-similar__state');
    if (paragraph) paragraph.textContent = message;
  }
  mountPanel(node);
}

function resetPaging() {
  pagesLoaded = 1;
  collected = [];
  lastHasMore = false;
  loadingMore = false;
}

function mergeRows(rows) {
  const seen = new Set(collected.map((row) => row.repo));
  for (const row of rows) {
    if (seen.has(row.repo)) continue;
    seen.add(row.repo);
    collected.push(row);
  }
}

function renderRows() {
  const node = renderPanel({
    labels: labels(),
    rows: collected,
    hasMore: lastHasMore,
    moreBusy: loadingMore,
    onMore: () => {
      if (loadingMore) return;
      const hadFocus = document.activeElement?.classList.contains('gp-similar__more');
      loadingMore = true;
      pagesLoaded += 1;
      renderRows();
      load(false).then(() => {
        if (hadFocus) document.querySelector('.gp-similar__more')?.focus();
      });
    },
  });
  mountPanel(node);
}

async function load(showLoading) {
  const settings = getSimilarReposSettings();
  const repo = currentRepo();
  if (!enabled || !repo || !isPublicRepo() || !resolveSidebar()) {
    loadingMore = false;
    return;
  }

  const key = cacheKey(settings, repo);
  const cached = readCache(key, settings);
  if (cached) {
    loadingMore = false;
    mergeRows(cached.items);
    lastHasMore = cached.hasMore;
    renderRows();
    return;
  }
  if (settledErrors.has(key)) {
    loadingMore = false;
    if (collected.length) {
      lastHasMore = false;
      renderRows();
      return;
    }
    renderState(settledErrors.get(key));
    return;
  }
  if (inflight.has(key)) return;
  if (showLoading) renderState('loading');

  const myGeneration = generation;
  controller?.abort();
  controller = new AbortController();
  const mine = controller;

  const promise = fetchSimilar({
    provider: settings.provider,
    repo,
    page: pagesLoaded,
    limit: settings.results,
    token: getSettings().commandPalette.token,
    signal: mine.signal,
  });
  inflight.set(key, promise);

  try {
    const result = await promise;
    if (myGeneration !== generation) return;
    cache.set(key, { at: Date.now(), items: result.items, hasMore: result.hasMore });
    loadingMore = false;
    mergeRows(result.items);
    lastHasMore = result.hasMore;
    renderRows();
  } catch (error) {
    if (isAbort(error) || myGeneration !== generation) return;
    const state = stateForError(error);
    settledErrors.set(key, state);
    loadingMore = false;
    if (state === 'failed') {
      log.error(Codes.SIMILAR_REPOS, 'similar repositories could not be loaded', { error });
    }
    if (collected.length) {
      // A deeper page failed: keep the rows the reader already has and stop paging.
      lastHasMore = false;
      renderRows();
      return;
    }
    if (state === 'rate-limited' && error.resetAt) {
      const time = new Date(error.resetAt).toLocaleTimeString();
      renderState(state, t('similarRepos.rateLimited', { time }));
    } else {
      renderState(state);
    }
  } finally {
    inflight.delete(key);
  }
}

function disconnect() {
  for (const observer of observers.values()) observer.disconnect();
  observers.clear();
  for (const observer of shellObservers) observer.disconnect();
  shellObservers = [];
  if (settleTimer) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
  controller?.abort();
  controller = null;
}

function observeContainer(container) {
  if (observers.has(container)) return;
  const observer = new MutationObserver(
    debounce(() => {
      if (!enabled) return;
      if (!document.querySelector(`.${PANEL_CLASS}`)) load(false);
    }, OBSERVE_DEBOUNCE_MS),
  );
  observer.observe(container, { childList: true, subtree: true });
  observers.set(container, observer);
}

function observeShell() {
  if (shellObservers.length) return;
  const onShellChange = () => {
    if (!enabled) return;
    observeContainer(resolveSidebar()?.container);
  };
  for (const root of [document.documentElement, document.body]) {
    if (!root) continue;
    const observer = new MutationObserver(onShellChange);
    observer.observe(root, { childList: true });
    shellObservers.push(observer);
  }
}

/** Drop observers whose sidebar React removed, so a re-render cannot pile them up. */
function pruneObservers() {
  for (const [container, observer] of observers) {
    if (container.isConnected) continue;
    observer.disconnect();
    observers.delete(container);
  }
}

let settleAttempts = 0;

function settle() {
  if (!enabled) return;
  pruneObservers();
  const resolved = resolveSidebar();
  if (resolved) {
    settleAttempts = 0;
    observeContainer(resolved.container);
    if (!document.querySelector(`.${PANEL_CLASS}`)) load(true);
    return;
  }
  if (settleAttempts >= SIMILAR_REPOS_SETTLE_TRIES) {
    settleAttempts = 0;
    return;
  }
  settleAttempts += 1;
  settleTimer = setTimeout(settle, SIMILAR_REPOS_SETTLE_MS);
}

/** Single entry point: teardown first, then observe and load when enabled. */
export function applySimilarReposSettings(settings = getSimilarReposSettings()) {
  const next = settings.enabled === true;
  if (!next) {
    enabled = false;
    generation += 1;
    disconnect();
    removePanel();
    return;
  }
  enabled = true;
  generation += 1;
  removePanel();
  resetPaging();
  settleAttempts = 0;
  observeShell();
  settle();
}

export function initSimilarReposFeature({ fetchSimilar: injected } = {}) {
  if (typeof injected === 'function') fetchSimilar = injected;
  applySimilarReposSettings();
  stopNavigation = watchNavigation(() => {
    if (!enabled) return;
    generation += 1;
    resetPaging();
    controller?.abort();
    removePanel();
    settleAttempts = 0;
    settle();
  });
  let previous = getSimilarReposSettings();
  on('settings:similarRepos', (next) => {
    // A provider or page-size change invalidates every cached page; the stored
    // section already holds the new value, so compare against the last applied one.
    if (next?.provider !== previous.provider || next?.results !== previous.results) {
      clearSimilarReposCache();
    }
    previous = next || getSimilarReposSettings();
    applySimilarReposSettings(next);
  });
  on('settings:language', () => {
    if (!enabled) return;
    const panel = document.querySelector(`.${PANEL_CLASS}`);
    if (panel) load(false);
  });
  return () => stopNavigation?.();
}

/** Empty the session cache; used by the tests and a provider switch. */
export function clearSimilarReposCache() {
  cache.clear();
  inflight.clear();
  settledErrors.clear();
}
