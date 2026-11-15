import { on } from '../../core/bus.js';
import { Codes, logInfo, logWarn } from '../../core/debug.js';
import { getFilePreviewSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { closeFilePreview, openFilePreview } from '../../ui/filePreview.js';
import { debounce } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { clearPreviewCells, placeCell, placeHead, renderPreviewButton } from './inject.js';
import { installLongPress, uninstallLongPress } from './longPress.js';
import { loadPreview } from './render.js';
import { PREVIEW_SURFACE, currentRef, resolvePreviewRow, siblingsForRow } from './surfaces.js';

/**
 * Quick file preview: an eye button in every listing row, plus the entry
 * point the file context menu calls. The modal itself lives in
 * `ui/filePreview.js`; this feature owns the surface observers, the button
 * injection and the loader wiring.
 *
 * One MutationObserver per listing container, the same lifecycle shape as the
 * other file features: no document-wide observer, a bounded settle wait for a
 * listing mounted after the navigation shell, and a WeakMap so a re-rendered
 * row is decorated again.
 */
const RESCAN_MS = 100;
const SHELL_MS = 200;
const SETTLE_MS = 250;
const SETTLE_TRIES = 20;

/** Row element -> injected cell, so a re-rendered row is decorated again. */
let decorated = new WeakMap();
/** Surface container -> observer. */
const observers = new Map();
let bodyObserver = null;
let observedBody = null;
let shellObserver = null;
let settleTimer = null;

function visibleSettings() {
  return getFilePreviewSettings().rowButton && getFilePreviewSettings().enabled;
}

/**
 * Open the preview for a resolved file target. A listing row opens its whole
 * directory; a sidebar tree row, a blob page or a markdown file link opens a
 * single-file set.
 * @param {{name: string, href: string, rawUrl: string, relative: string,
 *   source?: string, anchor?: Element}} target
 */
export function openPreviewForTarget(target) {
  if (!target || !target.rawUrl) return;
  const single = {
    name: target.name,
    href: target.href,
    rawUrl: target.rawUrl,
    relative: target.relative,
    ref: currentRef(),
  };
  let files = [single];
  let index = 0;
  if (target.source === 'listing') {
    const row = target.anchor?.closest('tr.react-directory-row');
    const set = row ? siblingsForRow(row) : null;
    if (set) {
      files = set.files;
      index = set.index;
    }
  }
  openFilePreview({ files, index, load: loadPreview });
}

function processRow(row) {
  if (!visibleSettings()) return;
  const existing = decorated.get(row);
  if (existing && existing.isConnected) return;
  const found = resolvePreviewRow(row);
  if (!found) {
    decorated.set(row, placeCell(row));
    return;
  }
  const button = renderPreviewButton({
    name: found.name,
    onOpen: () => openPreviewForTarget({
      name: found.file.name,
      href: found.file.href,
      rawUrl: found.file.rawUrl,
      relative: found.file.relative,
      source: 'listing',
      anchor: found.row,
    }),
  });
  decorated.set(row, placeCell(row, button));
}

function ensureHeader(container) {
  const headRow = container.querySelector(PREVIEW_SURFACE.header);
  if (headRow) placeHead(headRow, t(PREVIEW_SURFACE.columnLabelKey));
}

function processContainer(container) {
  if (!visibleSettings()) return;
  ensureHeader(container);
  let rows;
  try {
    rows = container.querySelectorAll(PREVIEW_SURFACE.rows);
  } catch (error) {
    logWarn(Codes.FILE_PREVIEW, 'file-preview surface has an invalid row selector', { error });
    return;
  }
  for (let index = 0; index < rows.length; index += 1) processRow(rows[index]);
}

function attach(container) {
  const observer = new MutationObserver(debounce(() => processContainer(container), RESCAN_MS));
  observer.observe(container, { childList: true, subtree: true });
  observers.set(container, observer);
  processContainer(container);
}

function openFromLongPress(target) {
  openPreviewForTarget({ ...target.file, source: target.source, anchor: target.link });
}

function teardown() {
  for (const observer of observers.values()) observer.disconnect();
  observers.clear();
  uninstallLongPress();
  clearPreviewCells();
  decorated = new WeakMap();
}

function syncSurfaces() {
  if (!visibleSettings()) return 0;
  for (const [container, observer] of observers) {
    if (!container.isConnected) {
      observer.disconnect();
      observers.delete(container);
    }
  }
  let attached = 0;
  let matched = 0;
  for (let c = 0; c < PREVIEW_SURFACE.containers.length; c += 1) {
    const found = document.querySelectorAll(PREVIEW_SURFACE.containers[c]);
    for (let index = 0; index < found.length; index += 1) {
      matched += 1;
      if (!observers.has(found[index])) {
        attach(found[index]);
        attached += 1;
      }
    }
  }
  if (!matched) logInfo('file-preview', 'no file surface on this page yet');
  return attached;
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
    if (!visibleSettings() || syncSurfaces() > 0 || tries >= SETTLE_TRIES) stopSettle();
  }, SETTLE_MS);
}

function observeBody() {
  if (typeof MutationObserver !== 'function') return;
  const body = document.body;
  if (!body || (bodyObserver && observedBody === body)) return;
  if (bodyObserver) bodyObserver.disconnect();
  observedBody = body;
  bodyObserver = new MutationObserver(debounce(applyFilePreviewSettings, SHELL_MS));
  bodyObserver.observe(body, { childList: true });
}

function observeShell() {
  observeBody();
  if (shellObserver || typeof MutationObserver !== 'function') return;
  if (!document.documentElement) return;
  shellObserver = new MutationObserver(
    debounce(() => {
      if (observedBody === document.body) return;
      observeBody();
      applyFilePreviewSettings();
    }, SHELL_MS),
  );
  shellObserver.observe(document.documentElement, { childList: true });
}

/** Apply the current settings; a disabled feature also closes the modal. */
export function applyFilePreviewSettings() {
  observeShell();
  stopSettle();
  teardown();
  const settings = getFilePreviewSettings();
  if (!settings.enabled) {
    closeFilePreview();
    return;
  }
  if (settings.longPress) installLongPress(openFromLongPress);
  if (!visibleSettings()) return;
  if (syncSurfaces() === 0) settleSurfaces();
}

/** Boot the quick-preview feature (idempotent). */
export function initFilePreviewFeature() {
  on('settings:filePreview', applyFilePreviewSettings);
  on('settings:language', applyFilePreviewSettings);
  watchNavigation(() => {
    closeFilePreview();
    applyFilePreviewSettings();
  });
  observeBody();
  applyFilePreviewSettings();
}
