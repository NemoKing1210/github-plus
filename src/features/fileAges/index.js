import { on } from '../../core/bus.js';
import { Codes, logInfo, logWarn } from '../../core/debug.js';
import { getFileAgesSettings } from '../../core/settings.js';
import { debounce } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { ageBucket } from './age.js';
import { clearAges, paintAge } from './inject.js';
import { SURFACES } from './surfaces.js';

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

/** Row element -> painted timestamp, so a re-rendered row is painted again. */
let decorated = new WeakMap();
/** Surface container -> observer. */
const observers = new Map();
let bodyObserver = null;

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
    logWarn(Codes.FILE_AGES, 'file-ages surface has an invalid row selector', {
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

/** Find every surface container currently in the page and make sure it is watched. */
function syncSurfaces() {
  if (!getFileAgesSettings().enabled) return;
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
  if (!matched) logInfo('file-ages', 'no file-list surface on this page yet');
}

function observeBody() {
  if (bodyObserver || typeof MutationObserver !== 'function') return;
  bodyObserver = new MutationObserver(debounce(() => applyFileAgesSettings(), SHELL_MS));
  bodyObserver.observe(document.body, { childList: true });
}

/**
 * Apply the current settings. A settings change may also flip the folder
 * toggle, so existing dates are repainted rather than only the observers being
 * synced.
 */
export function applyFileAgesSettings() {
  teardown();
  if (!getFileAgesSettings().enabled) return;
  syncSurfaces();
}

/** Boot the file-ages feature (idempotent). */
export function initFileAgesFeature() {
  on('settings:fileAges', applyFileAgesSettings);
  watchNavigation(applyFileAgesSettings);
  observeBody();
  applyFileAgesSettings();
}
