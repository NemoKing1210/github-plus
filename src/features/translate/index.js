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

let initialized = false;
let observers = [];
let settleTimer = null;
let settleTries = 0;
let autoObserver = null;
let autoObserved = new WeakSet();
let autoQueue = [];
let autoInFlight = 0;

function stopObservers() {
  observers.forEach((observer) => observer.disconnect());
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

function startObservers() {
  if (typeof MutationObserver !== 'function') return;
  const debouncedScan = debounce(() => scanTranslateSurfaces(), TRANSLATE_OBSERVE_DEBOUNCE_MS);
  surfaceRoots().forEach((selector) => {
    toArray(document.querySelectorAll(selector)).forEach((root) => {
      const observer = new MutationObserver(() => debouncedScan());
      observer.observe(root, { childList: true, subtree: true });
      observers.push(observer);
    });
  });
}

function startSettle() {
  if (document.querySelector('.gp-translate-btn')) return;
  settleTries = 0;
  settleTimer = setInterval(() => {
    settleTries += 1;
    scanTranslateSurfaces();
    if (document.querySelector('.gp-translate-btn') || settleTries >= TRANSLATE_SETTLE_TRIES) {
      stopSettle();
    }
  }, TRANSLATE_SETTLE_MS);
}

/**
 * Single entry point: restore everything first, then decorate afresh when the
 * feature is on. Observers are attached only to the registered surface roots.
 */
export function applyTranslateSettings() {
  stopObservers();
  stopSettle();
  stopAuto();
  teardownAllContainers();

  const settings = getTranslateSettings();
  if (!settings.enabled) return;
  scanTranslateSurfaces();
  startObservers();
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
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => persistCacheNow());
  }
}
