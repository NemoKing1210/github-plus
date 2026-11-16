import { on } from '../../core/bus.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { getFileAgesSettings } from '../../core/settings.js';
import { debounce } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { ageBucket } from './age.js';
import { clearAges, paintAge } from './inject.js';
import { SURFACES } from './surfaces.js';

const log = createLogger('file-ages');

/**
 * File ages: blame-style coloring of the last-commit date of every file and
 * folder GitHub lists.
 *
 * Like file icons, this runs one MutationObserver per known file-list
 * container (never one on the document). It only adds its own class to
 * GitHub's timestamp — the element keeps its text and markup — so no stylesheet
 * rule targets a GitHub-owned class.
 */
const RESCAN_MS = 100;
const SHELL_MS = 200;
/** Bounded window for a file listing that mounts after the navigation shell. */
const SETTLE_MS = 250;
const SETTLE_TRIES = 20;

/** Row element -> painted timestamp, so a re-rendered row is painted again. */
let decorated = new WeakMap();
/** Surface container -> observer. */
const observers = new Map();
let bodyObserver = null;
let observedBody = null;
let shellObserver = null;
let settleTimer = null;
let noSurfaceReported = false;

function processRow(cell, surface) {
  const existing = decorated.get(cell);
  if (existing && existing.isConnected && existing.classList.contains('gp-age-date')) return;
  const found = surface.resolve(cell);
  if (!found) return;
  if (found.kind === 'folder' && !getFileAgesSettings().folders) return;
  const bucket = ageBucket(found.time.getAttribute('datetime'));
  if (!bucket) return;
  paintAge(found.time, bucket);
  decorated.set(cell, found.time);
}

function processContainer(container, surface) {
  if (!getFileAgesSettings().enabled) return;
  let rows;
  try {
    rows = container.querySelectorAll(surface.rows);
  } catch (error) {
    log.warn(Codes.FILE_AGES, 'file-ages surface has an invalid row selector', {
      surface: surface.id,
      error,
    });
    return;
  }
  for (let index = 0; index < rows.length; index += 1) processRow(rows[index], surface);
}

function attach(container, surface) {
  const observer = new MutationObserver(debounce(() => processContainer(container, surface), RESCAN_MS));
  observer.observe(container, { childList: true, subtree: true });
  observers.set(container, observer);
  processContainer(container, surface);
}

function teardown() {
  for (const observer of observers.values()) observer.disconnect();
  observers.clear();
  clearAges();
  decorated = new WeakMap();
}

/**
 * Find every surface container currently in the page and make sure it is
 * watched. Returns how many containers matched, which is what tells a page
 * without a file listing apart from one where the surface is already attached.
 */
function syncSurfaces() {
  if (!getFileAgesSettings().enabled) return 0;
  for (const [container, observer] of observers) {
    if (!container.isConnected) {
      observer.disconnect();
      observers.delete(container);
    }
  }
  let matched = 0;
  for (let s = 0; s < SURFACES.length; s += 1) {
    const surface = SURFACES[s];
    for (let c = 0; c < surface.containers.length; c += 1) {
      const found = document.querySelectorAll(surface.containers[c]);
      for (let i = 0; i < found.length; i += 1) {
        matched += 1;
        if (!observers.has(found[i])) attach(found[i], surface);
      }
    }
  }
  if (matched) noSurfaceReported = false;
  return matched;
}

function stopSettle() {
  if (settleTimer === null) return;
  clearInterval(settleTimer);
  settleTimer = null;
}

/**
 * GitHub mounts the file list after the navigation shell, so every navigation
 * event can fire before the surface exists. Retry the registry query for a
 * bounded time (never a scan loop) and stop as soon as a surface is attached.
 */
function settleSurfaces() {
  stopSettle();
  let tries = 0;
  settleTimer = setInterval(() => {
    tries += 1;
    if (!getFileAgesSettings().enabled || syncSurfaces() > 0) {
      stopSettle();
      return;
    }
    if (tries >= SETTLE_TRIES) {
      stopSettle();
      // One line per page without a file listing — never one per retry.
      if (!noSurfaceReported) {
        noSurfaceReported = true;
        log.info('no file-list surface on this page');
      }
    }
  }, SETTLE_MS);
}

/** Watch the current body; a replaced body leaves the previous observer dead. */
function observeBody() {
  if (typeof MutationObserver !== 'function') return;
  const body = document.body;
  if (!body || (bodyObserver && observedBody === body)) return;
  if (bodyObserver) bodyObserver.disconnect();
  observedBody = body;
  bodyObserver = new MutationObserver(debounce(applyFileAgesSettings, SHELL_MS));
  bodyObserver.observe(body, { childList: true });
}

/**
 * Watch the navigation shell: GitHub swaps `<body>` — or its direct children —
 * on soft navigation, and the file list mounts afterwards, so either swap must
 * re-run the surface query. Both observers see direct children only, never a
 * subtree.
 */
function observeShell() {
  observeBody();
  if (shellObserver || typeof MutationObserver !== 'function') return;
  if (!document.documentElement) return;
  shellObserver = new MutationObserver(
    debounce(() => {
      // Head additions reach this observer too; only a new body needs a rescan.
      if (observedBody === document.body) return;
      observeBody();
      applyFileAgesSettings();
    }, SHELL_MS),
  );
  shellObserver.observe(document.documentElement, { childList: true });
}

/**
 * Apply the current settings. A settings change may also flip the folder
 * toggle, so existing dates are repainted rather than only the observers being
 * synced.
 */
export function applyFileAgesSettings() {
  observeShell();
  stopSettle();
  teardown();
  if (!getFileAgesSettings().enabled) return;
  if (syncSurfaces() === 0) settleSurfaces();
}

/** Boot the file-ages feature (idempotent). */
export function initFileAgesFeature() {
  on('settings:fileAges', applyFileAgesSettings);
  watchNavigation(applyFileAgesSettings);
  observeBody();
  applyFileAgesSettings();
}
