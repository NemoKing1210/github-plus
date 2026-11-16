import { PREVIEW_LONG_PRESS_MOVE_PX, PREVIEW_RING_DELAY_MS } from '../../core/constants.js';
import { getFilePreviewSettings } from '../../core/settings.js';
import { isOwnUiChrome } from '../../utils/dom.js';
import { hideHoldRing, showHoldRing } from './holdRing.js';
import { resolvePreviewLink } from './surfaces.js';

let timer = null;
let ringTimer = null;
let startX = 0;
let startY = 0;
let pressed = null;
let onOpen = null;
/** The link whose release must not also navigate, and when that stops applying. */
let suppressed = null;
let suppressClickUntil = 0;

function cancel() {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  if (ringTimer !== null) clearTimeout(ringTimer);
  ringTimer = null;
  pressed = null;
  hideHoldRing();
}

function onPointerDown(event) {
  if (!onOpen || event.button !== 0 || event.defaultPrevented) return;
  if (event.pointerType === 'touch' || isOwnUiChrome(event.target)) return;
  cancel();
  const found = resolvePreviewLink(event.target);
  if (!found) return;
  startX = event.clientX;
  startY = event.clientY;
  pressed = found;
  const settings = getFilePreviewSettings();
  const holdMs = settings.longPressMs;
  const ringDelay = Math.min(PREVIEW_RING_DELAY_MS, Math.max(0, holdMs - 80));
  if (settings.longPressRing) {
    // A plain click releases before this fires, so the ring never flashes.
    ringTimer = setTimeout(() => {
      ringTimer = null;
      if (timer === null || !pressed) return;
      showHoldRing(startX, startY, holdMs - ringDelay);
    }, ringDelay);
  }
  timer = setTimeout(() => {
    timer = null;
    if (ringTimer !== null) {
      clearTimeout(ringTimer);
      ringTimer = null;
    }
    const target = pressed;
    pressed = null;
    hideHoldRing();
    if (!target || !target.link.isConnected) return;
    suppressed = target.link;
    suppressClickUntil = Date.now() + 1000;
    onOpen?.(target);
  }, holdMs);
}

function onPointerMove(event) {
  if (timer === null) return;
  if (
    Math.abs(event.clientX - startX) > PREVIEW_LONG_PRESS_MOVE_PX
    || Math.abs(event.clientY - startY) > PREVIEW_LONG_PRESS_MOVE_PX
  ) {
    cancel();
  }
}

function onClick(event) {
  if (!suppressed) return;
  if (Date.now() > suppressClickUntil) {
    suppressed = null;
    return;
  }
  const found = resolvePreviewLink(event.target);
  if (!found || found.link !== suppressed) return;
  event.preventDefault();
  event.stopPropagation();
  suppressed = null;
}

/**
 * Watch for a long left-button press on a listing file name or a rendered
 * markdown file link. A drag past the movement threshold and a quick click both
 * leave the link alone.
 * @param {(target: {name: string, file: object, link: Element,
 *   source: string, row?: Element}) => void} handler
 */
export function installLongPress(handler) {
  uninstallLongPress();
  onOpen = handler;
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('pointermove', onPointerMove, true);
  document.addEventListener('pointerup', cancel, true);
  document.addEventListener('pointercancel', cancel, true);
  document.addEventListener('click', onClick, true);
}

export function uninstallLongPress() {
  cancel();
  suppressed = null;
  suppressClickUntil = 0;
  onOpen = null;
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('pointermove', onPointerMove, true);
  document.removeEventListener('pointerup', cancel, true);
  document.removeEventListener('pointercancel', cancel, true);
  document.removeEventListener('click', onClick, true);
}
