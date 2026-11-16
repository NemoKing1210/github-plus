import { on } from '../../core/bus.js';
import {
  TRANSLATE_MAX_CONCURRENCY,
  TRANSLATE_OBSERVE_DEBOUNCE_MS,
  TRANSLATE_SETTLE_MS,
  TRANSLATE_SETTLE_TRIES,
} from '../../core/constants.js';
import { getTranslateSettings } from '../../core/settings.js';
import { debounce, toArray } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { persistCacheNow } from './cache.js';
import {
  ensureContainer, repaintTranslateLabels, runContainer, stateFor, teardownAllContainers,
} from './state.js';
import { enabledSurfaces, findContainers, surfaceRoots } from './surfaces.js';

const SHELL_MS = 200;

let initialized = false;
let observers = [];
let settleTimer = null;
let settleTries = 0;
let autoObserver = null;
let autoObserved = new WeakSet();
let autoQueue = [];
let autoInFlight = 0;
let bodyObserver = null;
let observedBody = null;
let shellObserver = null;

const debouncedScan = debounce(() => scanTranslateSurfaces(), TRANSLATE_OBSERVE_DEBOUNCE_MS);

function stopObservers() {
  observers.forEach(({ observer }) => observer.disconnect());
  observers = [];
}

function stopSettle() {
  if (settleTimer) clearInterval(settleTimer);
  settleTimer = null;
  settleTries = 0;
}

function stopAuto() {
  if (autoObserver) autoObserver.disconnect();
  autoObserver = null;
  autoQueue = [];
  autoObserved = new WeakSet();
}

function pumpAuto() {
  while (autoInFlight < TRANSLATE_MAX_CONCURRENCY && autoQueue.length) {
    const container = autoQueue.shift();
    const state = stateFor(container);
    if (!state || state.status !== 'idle') continue;
    autoInFlight += 1;
    runContainer(state)
      .catch(() => {})
      .then(() => {
        autoInFlight -= 1;
        pumpAuto();
      });
  }
}

function enqueueAuto(container) {
  if (autoQueue.indexOf(container) !== -1) return;
  autoQueue.push(container);
  pumpAuto();
}

function ensureAutoObserver() {
  if (autoObserver || typeof IntersectionObserver !== 'function') return autoObserver;
  autoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      autoObserver.unobserve(entry.target);
      autoObserved.delete(entry.target);
      enqueueAuto(entry.target);
    });
  }, { threshold: 0 });
  return autoObserver;
}

function observeForAuto(container) {
  const observer = ensureAutoObserver();
  if (!observer || autoObserved.has(container)) return;
  autoObserved.add(container);
  observer.observe(container);
}

function startAuto() {
  if (typeof IntersectionObserver !== 'function') return;
  ensureAutoObserver();
}

/** Decorate every translatable container that is on the page right now. */
export function scanTranslateSurfaces() {
  const settings = getTranslateSettings();
  if (!settings.enabled) return;
  enabledSurfaces().forEach((surface) => {
    findContainers(surface).forEach((container) => {
      const current = stateFor(container);
      if (current && current.status === 'loading') return;
      const state = ensureContainer(container, surface);
      if (state && settings.mode === 'auto') observeForAuto(state.container);
    });
  });
}

/**
 * Keep one observer per live surface root: attach new roots, prune the ones a
 * soft navigation disconnected.
 */
function syncObservers() {
  if (typeof MutationObserver !== 'function') return;
  observers = observers.filter(({ root, observer }) => {
    if (root.isConnected) return true;
    observer.disconnect();
    return false;
  });
  const attached = new Set(observers.map(({ root }) => root));
  surfaceRoots().forEach((selector) => {
    toArray(document.querySelectorAll(selector)).forEach((root) => {
      if (attached.has(root)) return;
      const observer = new MutationObserver(() => debouncedScan());
      observer.observe(root, { childList: true, subtree: true });
      observers.push({ root, observer });
    });
  });
}

/** Reattach to the shell after GitHub swaps the body or a direct child. */
function onShellChange() {
  if (!getTranslateSettings().enabled) return;
  syncObservers();
  scanTranslateSurfaces();
}

function observeBody() {
  if (typeof MutationObserver !== 'function') return;
  const body = document.body;
  if (!body || (bodyObserver && observedBody === body)) return;
  if (bodyObserver) bodyObserver.disconnect();
  observedBody = body;
  bodyObserver = new MutationObserver(debounce(onShellChange, SHELL_MS));
  bodyObserver.observe(body, { childList: true });
}

/**
 * Watch the navigation shell through direct children only. A replaced body
 * leaves both the root observers and the old body observer dead.
 */
function observeShell() {
  observeBody();
  if (shellObserver || typeof MutationObserver !== 'function' || !document.documentElement) return;
  shellObserver = new MutationObserver(debounce(() => {
    if (observedBody === document.body) return;
    observeBody();
    onShellChange();
  }, SHELL_MS));
  shellObserver.observe(document.documentElement, { childList: true });
}

/** A decorated page surface — the preview's header action does not count. */
function hasSurfaceButton() {
  return toArray(document.querySelectorAll('.gp-translate-btn'))
    .some((node) => !node.closest('.gp-preview-overlay'));
}

function startSettle() {
  if (hasSurfaceButton()) return;
  settleTries = 0;
  settleTimer = setInterval(() => {
    settleTries += 1;
    scanTranslateSurfaces();
    if (hasSurfaceButton() || settleTries >= TRANSLATE_SETTLE_TRIES) {
      stopSettle();
    }
  }, TRANSLATE_SETTLE_MS);
}

/**
 * Single entry point: restore everything first, then decorate afresh when the
 * feature is on. Observers are attached only to the registered surface roots.
 */
export function applyTranslateSettings() {
  observeShell();
  stopObservers();
  stopSettle();
  stopAuto();
  teardownAllContainers();

  const settings = getTranslateSettings();
  if (!settings.enabled) return;
  scanTranslateSurfaces();
  syncObservers();
  startSettle();
  if (settings.mode === 'auto') startAuto();
}

/** Wire the feature to settings changes, navigation and page unload. */
export function initTranslateFeature() {
  if (initialized) return;
  initialized = true;
  on('settings:translate', () => applyTranslateSettings());
  on('settings:language', () => repaintTranslateLabels());
  watchNavigation(() => applyTranslateSettings());
  observeShell();
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => persistCacheNow());
  }
}
