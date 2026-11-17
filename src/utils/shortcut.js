/**
 * Pure shortcut parsing and formatting shared by settings, the palette hotkey
 * and the recorder. No DOM access; platform detection is injectable.
 */

const MODIFIERS = new Set(['mod', 'ctrl', 'meta', 'alt', 'shift']);
const NON_MODIFIER_MODIFIERS = new Set(['mod', 'ctrl', 'meta', 'alt']);
const MODIFIER_KEYS = new Set(['control', 'shift', 'alt', 'meta', 'os']);
const KEY_NAMES = { ' ': 'space', spacebar: 'space', '+': 'plus' };
const KEY_LABELS = { space: 'Space', plus: '+' };
const PLATFORM_NAMES = { mod: 'Ctrl', ctrl: 'Ctrl', meta: 'Meta', alt: 'Alt', shift: 'Shift' };
const MAX_LENGTH = 40;

export function isMacPlatform() {
  if (typeof navigator === 'undefined') return false;
  const platform = navigator.platform || '';
  const agent = navigator.userAgent || '';
  return /mac|iphone|ipad/i.test(platform) || /mac os x|iphone|ipad/i.test(agent);
}

export function keyNameFromEvent(event) {
  const raw = String(event?.key || '');
  if (!raw) return '';
  return KEY_NAMES[raw.toLowerCase()] || raw.toLowerCase();
}

export function shortcutFromEvent(event, { mac = isMacPlatform() } = {}) {
  const key = keyNameFromEvent(event);
  if (!key || MODIFIER_KEYS.has(key) || key === 'escape') return '';
  const parts = [];
  if (mac) {
    if (event.metaKey) parts.push('mod');
    if (event.ctrlKey) parts.push('ctrl');
  } else {
    if (event.ctrlKey) parts.push('mod');
    if (event.metaKey) parts.push('meta');
  }
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  parts.push(key);
  return parts.join('+');
}

function partsOf(value) {
  if (typeof value !== 'string' || !value || value.length > MAX_LENGTH) return null;
  const parts = value.toLowerCase().split('+');
  if (parts.some((part) => !part)) return null;
  const key = parts.pop();
  if (!key || MODIFIERS.has(key)) return null;
  let hasModifier = false;
  for (const part of parts) {
    if (!MODIFIERS.has(part)) return null;
    if (NON_MODIFIER_MODIFIERS.has(part)) hasModifier = true;
  }
  return hasModifier ? { parts, key } : null;
}

export function isValidShortcut(value) {
  if (value === 'off') return true;
  return partsOf(value) !== null;
}

/** Trim, lowercase and validate; `''` when the value is not a shortcut. */
export function normalizeShortcutValue(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'off') return 'off';
  return isValidShortcut(raw) ? raw : '';
}

function keyLabel(key) {
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  return key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1);
}

export function formatShortcut(value, { mac = isMacPlatform() } = {}) {
  if (!value || value === 'off') return '';
  const parsed = partsOf(value);
  if (!parsed) return '';
  const { parts, key } = parsed;
  if (mac) {
    const glyphs = [];
    if (parts.includes('ctrl')) glyphs.push('⌃');
    if (parts.includes('alt')) glyphs.push('⌥');
    if (parts.includes('shift')) glyphs.push('⇧');
    if (parts.includes('mod') || parts.includes('meta')) glyphs.push('⌘');
    return `${glyphs.join('')}${keyLabel(key)}`;
  }
  return [...parts.map((part) => PLATFORM_NAMES[part] || part), keyLabel(key)].join('+');
}
