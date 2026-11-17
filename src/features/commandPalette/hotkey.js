/**
 * Hotkey guards for the palette. A shortcut never fires while the user types
 * in a field, while another overlay owns the page, or on a key another
 * handler already claimed.
 */

import {
  formatShortcut, isMacPlatform, isValidShortcut, keyNameFromEvent, normalizeShortcutValue, shortcutFromEvent,
} from '../../utils/shortcut.js';

export { formatShortcut, isValidShortcut, normalizeShortcutValue, shortcutFromEvent };

const OVERLAY_SELECTOR = [
  '.gp-panel-overlay',
  '.gp-confirm-overlay',
  '.gp-viewer-overlay',
  '.gp-preview-overlay',
].join(', ');

const MODIFIERS = new Set(['mod', 'ctrl', 'meta', 'shift', 'alt']);

/** Whether the event carries exactly the modifiers and key a shortcut names. */
export function shortcutMatches(event, shortcut) {
  if (!shortcut || shortcut === 'off') return false;
  const parts = String(shortcut).toLowerCase().split('+').map((part) => part.trim()).filter(Boolean);
  const key = parts.pop();
  if (!key || parts.some((part) => !MODIFIERS.has(part))) return false;

  const mods = new Set(parts);
  const mac = isMacPlatform();
  const wantsCtrl = mods.has('ctrl') || (mods.has('mod') && !mac);
  const wantsMeta = mods.has('meta') || (mods.has('mod') && mac);

  if (Boolean(event.ctrlKey) !== wantsCtrl) return false;
  if (Boolean(event.metaKey) !== wantsMeta) return false;
  if (mods.has('shift') !== Boolean(event.shiftKey)) return false;
  if (mods.has('alt') !== Boolean(event.altKey)) return false;

  return keyNameFromEvent(event) === key;
}

/** A field, editor or contenteditable host must keep its own keys. */
export function isEditableTarget(node) {
  if (!node) return false;
  const element = node.nodeType === 1 ? node : node.parentElement;
  if (!element) return false;
  if (element.isContentEditable) return true;
  if (typeof element.closest !== 'function') return false;
  return Boolean(element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
}

/** True while one of our modal overlays owns the page. */
export function otherOverlayOpen(doc = document) {
  return Boolean(doc.querySelector(OVERLAY_SELECTOR));
}

export function shouldOpenPalette(event, { shortcut, doc = document } = {}) {
  if (!event || event.defaultPrevented || event.isComposing || event.repeat) return false;
  if (isEditableTarget(event.target)) return false;
  if (otherOverlayOpen(doc)) return false;
  return shortcutMatches(event, shortcut);
}
