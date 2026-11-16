import { on } from '../../core/bus.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { getFileIconsSettings } from '../../core/settings.js';
import { debounce } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { clearIcons, hideNative, isNativeHidden, placeIcon, renderIcon } from './inject.js';
import { pickIcon } from './match.js';
import { SURFACES } from './surfaces.js';

const log = createLogger('file-icons');

/**
 * File icons: a colored, type-aware icon in place of GitHub's generic file and
 * folder glyph, wherever GitHub lists files.
 *
 * Rendering philosophy: one MutationObserver per known surface container
 * (never one on the whole document), plus direct-children watchers on the
 * shell (`<html>` and `<body>`) so a soft navigation re-runs the surface query
 * without observing page content. GitHub's own icon is hidden with an inline
 * style and ours is inserted as a sibling, so no stylesheet rule targets page
 * markup and React reconciliation is not asked to account for removed nodes.
 */
const RESCAN_MS = 100;
const SHELL_MS = 200;
/** Bounded window for a file listing that mounts after the navigation shell. */
const SETTLE_MS = 250;
const SETTLE_TRIES = 20;

/**
 * Row element -> `{ icon, native }`, so a re-rendered row is decorated again
 * and a native glyph GitHub swaps in is hidden again.
 */
const decorated = new WeakMap();
/** Surface container -> observer. */
const observers = new Map();
let bodyObserver = null;
let observedBody = null;
let shellObserver = null;
let settleTimer = null;

function pickOptions() {
  const settings = getFileIconsSettings();
  return { folders: settings.folders, specialNames: settings.specialNames };
}

function processRow(row, surface) {
  const existing = decorated.get(row);
  if (existing && existing.icon.isConnected) {
    // React re-renders the row's own glyph without dropping our icon — an
    // expanded folder swaps its folder icon, for instance — so the newcomer
    // is visible next to ours until it is hidden again.
    const stale =
      existing.native && (!existing.native.isConnected || !isNativeHidden(existing.native));
    if (stale) {
      const found = surface.resolve(row);
      if (found?.nativeIcon) {
        hideNative(found.nativeIcon);
        existing.native = found.nativeIcon;
      }
    }
    return;
  }
  const found = surface.resolve(row);
  if (!found) return;
  const id = pickIcon(found.name, found.kind, pickOptions());
  const icon = renderIcon(id);
  if (!placeIcon(icon, found.nativeIcon, found.nameNode)) return;
  decorated.set(row, { icon, native: found.nativeIcon });
}

function processContainer(container, surface) {
  if (!getFileIconsSettings().enabled) return;
  let rows;
  try {
    rows = container.querySelectorAll(surface.rows);
  } catch (error) {
    log.warn(Codes.FILE_ICONS, 'file-icons surface has an invalid row selector', {
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

/**
 * Find every surface container currently in the page and make sure it is
 * watched. Returns how many containers this call attached, which is what tells
 * a late-mounting file list apart from one already in place.
 */
function syncSurfaces() {
  if (!getFileIconsSettings().enabled) return 0;
  for (const [container, observer] of observers) {
    if (!container.isConnected) {
      observer.disconnect();
      observers.delete(container);
    }
  }
  let attached = 0;
  let matched = 0;
  for (let s = 0; s < SURFACES.length; s += 1) {
    const surface = SURFACES[s];
    for (let c = 0; c < surface.containers.length; c += 1) {
      const found = document.querySelectorAll(surface.containers[c]);
      for (let i = 0; i < found.length; i += 1) {
        matched += 1;
        if (!observers.has(found[i])) {
          attach(found[i], surface);
          attached += 1;
        }
      }
    }
  }
  if (!matched) log.info('no file-list surface on this page yet');
  return attached;
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
    if (!getFileIconsSettings().enabled || syncSurfaces() > 0 || tries >= SETTLE_TRIES) {
      stopSettle();
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
  bodyObserver = new MutationObserver(debounce(applyFileIconsSettings, SHELL_MS));
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
      applyFileIconsSettings();
    }, SHELL_MS),
  );
  shellObserver.observe(document.documentElement, { childList: true });
}

/** Apply the current settings: watch the surfaces, or tear everything down. */
export function applyFileIconsSettings() {
  observeShell();
  if (!getFileIconsSettings().enabled) {
    stopSettle();
    teardown();
    return;
  }
  if (syncSurfaces() === 0) settleSurfaces();
  else stopSettle();
}

/** Boot the file-icons feature (idempotent). */
export function initFileIconsFeature() {
  on('settings:fileIcons', applyFileIconsSettings);
  watchNavigation(applyFileIconsSettings);
  observeBody();
  applyFileIconsSettings();
}
