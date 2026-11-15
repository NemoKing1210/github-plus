import { on } from '../../core/bus.js';
import { Codes, logInfo, logWarn } from '../../core/debug.js';
import { getFileIconsSettings } from '../../core/settings.js';
import { debounce } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { clearIcons, placeIcon, renderIcon } from './inject.js';
import { pickIcon } from './match.js';
import { SURFACES } from './surfaces.js';

/**
 * File icons: a colored, type-aware icon in place of GitHub's generic file and
 * folder glyph, wherever GitHub lists files.
 *
 * Rendering philosophy: one MutationObserver per known surface container
 * (never one on the whole document), plus the body-children watcher the
 * settings entry already uses to notice an app-shell swap. GitHub's own icon
 * is hidden with an inline style and ours is inserted as a sibling, so no
 * stylesheet rule targets page markup and React reconciliation is not asked to
 * account for removed nodes.
 */
const RESCAN_MS = 100;
const SHELL_MS = 200;

/** Row element -> injected icon, so a re-rendered row is decorated again. */
const decorated = new WeakMap();
/** Surface container -> observer. */
const observers = new Map();
let bodyObserver = null;

function pickOptions() {
  const settings = getFileIconsSettings();
  return { folders: settings.folders, specialNames: settings.specialNames };
}

function processRow(row, surface) {
  const existing = decorated.get(row);
  if (existing && existing.isConnected) return;
  const found = surface.resolve(row);
  if (!found) return;
  const id = pickIcon(found.name, found.kind, pickOptions());
  const icon = renderIcon(id);
  if (!placeIcon(icon, found.nativeIcon, found.nameNode)) return;
  decorated.set(row, icon);
}

function processContainer(container, surface) {
  if (!getFileIconsSettings().enabled) return;
  let rows;
  try {
    rows = container.querySelectorAll(surface.rows);
  } catch (error) {
    logWarn(Codes.FILE_ICONS, 'file-icons surface has an invalid row selector', {
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
  clearIcons();
}

/** Find every surface container currently in the page and make sure it is watched. */
function syncSurfaces() {
  if (!getFileIconsSettings().enabled) return;
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
  if (!matched) logInfo('file-icons', 'no file-list surface on this page yet');
}

function observeBody() {
  if (bodyObserver || typeof MutationObserver !== 'function') return;
  bodyObserver = new MutationObserver(debounce(() => applyFileIconsSettings(), SHELL_MS));
  bodyObserver.observe(document.body, { childList: true });
}

/** Apply the current settings: watch the surfaces, or tear everything down. */
export function applyFileIconsSettings() {
  if (!getFileIconsSettings().enabled) {
    teardown();
    return;
  }
  syncSurfaces();
}

/** Boot the file-icons feature (idempotent). */
export function initFileIconsFeature() {
  on('settings:fileIcons', applyFileIconsSettings);
  watchNavigation(applyFileIconsSettings);
  observeBody();
  applyFileIconsSettings();
}
