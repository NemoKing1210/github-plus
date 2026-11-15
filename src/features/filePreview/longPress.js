import { PREVIEW_LONG_PRESS_MOVE_PX, PREVIEW_LONG_PRESS_MS } from '../../core/constants.js';
import { isOwnUi } from '../../utils/dom.js';
import { resolvePreviewLink } from './surfaces.js';

let timer = null;
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
  pressed = null;
}

function onPointerDown(event) {
  if (!onOpen || event.button !== 0 || event.defaultPrevented) return;
  if (event.pointerType === 'touch' || isOwnUi(event.target)) return;
  cancel();
  const found = resolvePreviewLink(event.target);
  if (!found) return;
  startX = event.clientX;
  startY = event.clientY;
  pressed = found;
  timer = setTimeout(() => {
    timer = null;
    const target = pressed;
    pressed = null;
    if (!target || !target.link.isConnected) return;
    suppressed = target.link;
    suppressClickUntil = Date.now() + 1000;
    onOpen?.(target);
  }, PREVIEW_LONG_PRESS_MS);
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
