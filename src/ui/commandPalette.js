/**
 * Command palette shell: a modal search field with an editable scope path, a
 * grouped listbox and a tip strip. It knows nothing about what it lists —
 * `search(query)` supplies groups for the current path, `path` supplies the
 * breadcrumb segments, and the caller's callbacks run the selection — so the
 * feature owns data and this module owns interaction.
 */

import { el } from '../utils/dom.js';
import { lockPageScroll, unlockPageScroll } from '../utils/scrollLock.js';
import { PALETTE_ICONS } from './icons.js';
import { closeContextMenu } from './contextMenu.js';

const CLOSE_MS = 120;
const DEBOUNCE_MS = 80;

let state = null;
let optionSeq = 0;

function buildShell(labels) {
  const root = el('div', 'gp-command-overlay');
  root.setAttribute('role', 'presentation');

  const dialog = el('div', 'gp-command');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', labels.title || '');

  const top = el('div', 'gp-command__top');
  const field = el('div', 'gp-command__field');
  const glyph = el('span', 'gp-command__glyph');
  glyph.innerHTML = PALETTE_ICONS.search;

  const input = el('input', 'gp-command__input');
  input.type = 'text';
  input.id = 'gp-command-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = labels.placeholder || '';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-controls', 'gp-command-list');

  const path = el('span', 'gp-command__path');
  const hint = el('kbd', 'gp-command__kbd', 'Esc');
  field.append(glyph, path, input, hint);
  top.append(field);

  const main = el('div', 'gp-command__main');
  const list = el('div', 'gp-command__list');
  list.id = 'gp-command-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', labels.title || '');
  main.append(list);

  const tip = el('div', 'gp-command__tip');
  const tipText = el('span', 'gp-command__tip-text', labels.tip || '');
  const tipHelp = el('button', 'gp-command__tip-help', labels.tipHelp || '');
  tipHelp.type = 'button';
  tipHelp.hidden = !labels.tipHelp;
  const note = el('span', 'gp-command__tip-note');
  const bar = el('div', 'gp-command__bar');
  tip.append(tipText, tipHelp, note, bar);

  const empty = el('div', 'gp-command__empty');
  empty.hidden = true;
  const emptyIcon = el('div', 'gp-command__empty-icon');
  emptyIcon.innerHTML = PALETTE_ICONS.search;
  empty.append(
    emptyIcon,
    el('p', 'gp-command__empty-title', labels.empty || ''),
    el('p', 'gp-command__empty-hint', labels.emptyHint || ''),
  );

  const announcer = el('div', 'gp-command__announcer');
  announcer.setAttribute('aria-live', 'polite');

  dialog.append(top, main, tip, empty);
  root.append(dialog, announcer);
  // `tipBox`, not `tip`: `state.tip` is the tip string and the spread must not
  // overwrite it with the strip element.
  return { root, dialog, field, path, input, list, tipBox: tip, tipText, tipHelp, note, empty, announcer, bar };
}

function renderPath(current) {
  current.path.replaceChildren();
  current.tipText.textContent = current.tip || current.labels.tip || '';
  for (const [index, segment] of current.pathSegments.entries()) {
    const button = el('button', 'gp-command__seg', segment.label || '');
    button.type = 'button';
    // Keep the caret in the field: a segment click must not blur the combobox.
    button.addEventListener('pointerdown', (event) => event.preventDefault());
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      current.onPathClick?.(index);
    });
    current.path.appendChild(button);
    current.path.appendChild(el('span', 'gp-command__sep', '/'));
  }
  current.field.classList.toggle('is-scoped', current.pathSegments.length > 0);
}

function toggleHelp(current) {
  if (current.helpNode) {
    current.helpNode.remove();
    current.helpNode = null;
    return;
  }
  if (!current.help) return;
  const help = el('div', 'gp-command__help');
  help.setAttribute('role', 'group');
  if (current.help.title) help.appendChild(el('div', 'gp-command__help-title', current.help.title));
  const addRow = (key, label) => {
    const row = el('div', 'gp-command__help-row');
    row.append(el('kbd', 'gp-command__help-key', key), el('span', 'gp-command__help-label', label));
    help.appendChild(row);
  };
  for (const prefix of current.help.prefixes || []) {
    help.appendChild(el('div', 'gp-command__help-prefix', prefix.label));
  }
  if (current.help.close) addRow('Esc', current.help.close);
  if (Array.isArray(current.help.keys)) {
    for (const entry of current.help.keys) addRow(entry.key, entry.label);
  } else if (current.help.keys) {
    help.appendChild(el('div', 'gp-command__help-keys', current.help.keys));
  }
  current.dialog.appendChild(help);
  current.helpNode = help;
}

function setPath(pathSegments, tip) {
  if (!state) return;
  state.pathSegments = Array.isArray(pathSegments) ? pathSegments : [];
  if (tip !== undefined) state.tip = tip;
  renderPath(state);
}

function activeItem() {
  return state && state.activeKey ? state.itemsByKey.get(state.activeKey) || null : null;
}

function appendHighlighted(parent, text, ranges) {
  const sorted = [...ranges].sort((left, right) => left[0] - right[0]);
  let cursor = 0;
  for (const [start, end] of sorted) {
    const from = Math.max(cursor, Math.min(start, text.length));
    const to = Math.max(from, Math.min(end, text.length));
    if (from > cursor) parent.appendChild(document.createTextNode(text.slice(cursor, from)));
    if (to > from) {
      const mark = el('span', 'gp-command__mark');
      mark.textContent = text.slice(from, to);
      parent.appendChild(mark);
    }
    cursor = Math.max(cursor, to);
  }
  if (cursor < text.length) parent.appendChild(document.createTextNode(text.slice(cursor)));
}

function hintText(item, labels) {
  const parts = [];
  if (item.scopeable) parts.push(`Tab ${labels.hintScope || ''}`);
  parts.push(`↵ ${item.hint || labels.hintOpen || ''}`);
  return parts.join(' · ');
}

/**
 * A row's avatar for the icon slot. A failed load (a renamed account, a blocked
 * request) swaps back to the row's glyph instead of leaving a hole in the
 * column.
 */
function avatarNode(item, icon) {
  const img = el('img', 'gp-command__avatar');
  img.src = item.avatar;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('error', () => {
    img.remove();
    icon.innerHTML = PALETTE_ICONS[item.icon] || '';
  }, { once: true });
  return img;
}

function buildRow(current, item) {
  const row = el('div', 'gp-command__row');
  row.id = `gp-command-option-${optionSeq}`;
  optionSeq += 1;
  row.dataset.key = item.key;
  row.setAttribute('role', 'option');
  row.setAttribute('aria-selected', 'false');
  // Focusable only programmatically, so a keyboard-opened row menu can restore
  // focus to its row and the dialog keeps receiving the palette's keys.
  row.tabIndex = -1;

  const icon = el('span', 'gp-command__icon');
  if (item.avatar) icon.appendChild(avatarNode(item, icon));
  else icon.innerHTML = PALETTE_ICONS[item.icon] || '';
  const muted = el('span', 'gp-command__muted', item.titleMuted || '');
  const title = el('span', 'gp-command__title');
  if (item.pinned) {
    const pin = el('span', 'gp-command__pin');
    pin.innerHTML = PALETTE_ICONS.star;
    pin.setAttribute('aria-hidden', 'true');
    title.appendChild(pin);
  }
  appendHighlighted(title, String(item.title || ''), item.highlight || []);
  const badges = el('span', 'gp-command__badges');
  for (const badge of item.badges || []) {
    const label = current.labels.badges?.[badge];
    if (label) badges.appendChild(el('span', 'gp-command__badge', label));
  }
  const meta = el('span', 'gp-command__meta', item.meta || '');
  const hint = el('span', 'gp-command__hint', hintText(item, current.labels));

  row.append(icon, muted, title, badges, meta, hint);
  current.rowByKey.set(item.key, row);
  return row;
}

function renderGroups(current, groups) {
  current.list.replaceChildren();
  current.rowByKey = new Map();
  for (const group of groups) {
    const items = Array.isArray(group.items) ? group.items : [];
    if (!items.length) continue;
    const title = el('div', 'gp-command__group-title', group.title || '');
    title.setAttribute('role', 'presentation');
    current.list.appendChild(title);
    for (const item of items) current.list.appendChild(buildRow(current, item));
  }
  current.empty.hidden = current.list.childElementCount > 0;
}

function applyActive(current, item) {
  for (const [key, row] of current.rowByKey) {
    row.setAttribute('aria-selected', String(Boolean(item) && key === item.key));
  }
  if (!item) {
    current.input.removeAttribute('aria-activedescendant');
    return;
  }
  const row = current.rowByKey.get(item.key);
  if (row) {
    current.input.setAttribute('aria-activedescendant', row.id);
    if (typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' });
  }
}

function renderStatus(current, result, count) {
  current.bar.classList.toggle('is-loading', result.status === 'loading');
  current.note.textContent = result.note || (result.status === 'loading' ? current.labels.loading || '' : '');
  current.announcer.textContent = String(current.labels.results || '').replace('{count}', String(count));
}

function refresh() {
  if (!state) return;
  const current = state;
  const result = current.search(current.input.value) || {};
  const groups = Array.isArray(result.groups) ? result.groups : [];
  const items = groups.flatMap((group) => (Array.isArray(group.items) ? group.items : []));
  const previousKey = current.activeKey;
  current.itemsByKey = new Map(items.map((item) => [item.key, item]));
  const active = (previousKey && current.itemsByKey.get(previousKey)) || items[0] || null;
  current.activeKey = active ? active.key : null;
  renderGroups(current, groups);
  applyActive(current, active);
  renderStatus(current, result, items.length);
}

function selectKey(key) {
  const item = state?.itemsByKey.get(key);
  if (!item || item.key === state.activeKey) return;
  state.activeKey = item.key;
  applyActive(state, item);
}

function move(delta) {
  const items = state?.itemsByKey ? [...state.itemsByKey.values()] : [];
  if (!items.length) return;
  const index = items.findIndex((item) => item.key === state.activeKey);
  const next = index === -1 ? 0 : (index + delta + items.length) % items.length;
  selectKey(items[next].key);
}

function jump(index) {
  const items = state?.itemsByKey ? [...state.itemsByKey.values()] : [];
  const item = items[Math.max(0, Math.min(index, items.length - 1))];
  if (item) selectKey(item.key);
}

function choose(item, newTab) {
  if (!state) return;
  const onSelect = state.onSelect;
  onSelect?.(item, { newTab });
  closeCommandPalette();
}

function trapFocus(event) {
  if (!state) return;
  const nodes = state.dialog.querySelectorAll('input, button, a[href], [tabindex]:not([tabindex="-1"])');
  const list = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!node.hidden && !node.disabled) list.push(node);
  }
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;
  const inside = list.indexOf(active) >= 0;
  if (event.shiftKey) {
    if (!inside || active === first) {
      event.preventDefault();
      last.focus();
    }
  } else if (!inside || active === last) {
    event.preventDefault();
    first.focus();
  }
}

function onKeyDown(event) {
  if (!state) return;
  const { key, ctrlKey, metaKey, altKey } = event;
  if ((ctrlKey || metaKey) && (key === 'k' || key === 'K')) {
    event.preventDefault();
    closeCommandPalette();
    return;
  }
  if (altKey && (key === 'p' || key === 'P')) {
    event.preventDefault();
    const item = activeItem();
    if (item) state.onPin?.(item);
    return;
  }
  if ((ctrlKey || metaKey) && (key === 'c' || key === 'C')) {
    const item = activeItem();
    if (item && state.onCopy && state.input.selectionStart === state.input.selectionEnd) {
      event.preventDefault();
      state.onCopy(item);
    }
    return;
  }
  if (!ctrlKey && !metaKey && !altKey && key === '?' && !state.input.value) {
    event.preventDefault();
    toggleHelp(state);
    return;
  }
  if (state.onContextMenu && (key === 'ContextMenu' || (key === 'F10' && event.shiftKey))) {
    event.preventDefault();
    const item = activeItem();
    if (!item) return;
    state.onContextMenu(item, { anchor: state.rowByKey.get(item.key) || null, keyboard: true });
    return;
  }
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    event.preventDefault();
    move(key === 'ArrowDown' ? 1 : -1);
    return;
  }
  if (key === 'Home' || key === 'End') {
    event.preventDefault();
    jump(key === 'Home' ? 0 : state.itemsByKey.size - 1);
    return;
  }
  // Left and right walk the path, but only while the field is empty: with text
  // in it they belong to the caret.
  if (!ctrlKey && !metaKey && !altKey && state.input.value === ''
    && (key === 'ArrowLeft' || key === 'ArrowRight')) {
    if (key === 'ArrowRight') {
      const item = activeItem();
      if (item?.scopeable && state.onScope?.(item)) {
        event.preventDefault();
        return;
      }
      return;
    }
    if (state.pathSegments.length) {
      event.preventDefault();
      state.onPathPop?.();
    }
    return;
  }
  if (key === 'Enter') {
    event.preventDefault();
    const item = activeItem();
    if (item) choose(item, ctrlKey || metaKey);
    return;
  }
  if ((ctrlKey || metaKey) && (key === 'Backspace' || key === 'Delete')) {
    event.preventDefault();
    state.input.value = '';
    state.onClearPath?.();
    refresh();
    return;
  }
  if ((key === 'Backspace' || key === 'Delete') && state.pathSegments.length && state.input.value === '') {
    event.preventDefault();
    state.onPathPop?.();
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    if (state.helpNode) {
      toggleHelp(state);
      return;
    }
    closeCommandPalette();
    return;
  }
  if (key === 'Tab') {
    const item = activeItem();
    if (item?.scopeable && state.onScope?.(item)) {
      event.preventDefault();
      return;
    }
    trapFocus(event);
  }
}

function onPointerMove(event) {
  if (!state) return;
  const target = event.target;
  const row = target instanceof Element ? target.closest('.gp-command__row') : null;
  if (row?.dataset.key) selectKey(row.dataset.key);
}

function onPointerDown(event) {
  if (state && event.target === state.root) closeCommandPalette();
}

function onRowContextMenu(event) {
  if (!state?.onContextMenu) return;
  const row = event.target instanceof Element ? event.target.closest('.gp-command__row') : null;
  const item = row?.dataset.key ? state.itemsByKey.get(row.dataset.key) : null;
  if (!item) return;
  event.preventDefault();
  selectKey(item.key);
  state.onContextMenu(item, {
    x: event.clientX,
    y: event.clientY,
    anchor: row,
    keyboard: false,
  });
}

function onClick(event) {
  if (!state) return;
  const target = event.target instanceof Element ? event.target.closest('.gp-command__row') : null;
  const item = target?.dataset.key ? state.itemsByKey.get(target.dataset.key) : null;
  if (item) choose(item, event.ctrlKey || event.metaKey);
}

function onInput() {
  if (!state) return;
  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(() => {
    if (state) refresh();
  }, DEBOUNCE_MS);
}

/**
 * Open the palette over the current page.
 * @param {{labels: object, search: (query: string) => object,
 *   path?: Array<{label: string}>, tip?: string, help?: object|null,
 *   onSelect?: (item: object, options: {newTab: boolean}) => void,
 *   onPin?: (item: object) => void, onClose?: () => void,
 *   onScope?: (item: object) => void, onPathPop?: () => void,
 *   onPathClick?: (index: number) => void, onClearPath?: () => void,
 *   onCopy?: (item: object) => void,
 *   onContextMenu?: (item: object, position: {x?: number, y?: number, anchor: Element|null, keyboard: boolean}) => void}} options
 * @returns {{refresh: () => void, close: () => void, focus: () => void,
 *   setQuery: (value: string) => void, setPath: (path: Array<{label: string}>, tip?: string) => void}}
 */
export function openCommandPalette({
  labels = {},
  search,
  path = [],
  tip = '',
  help = null,
  onSelect,
  onPin,
  onContextMenu,
  onClose,
  onScope,
  onPathPop,
  onPathClick,
  onClearPath,
  onCopy,
}) {
  // A previous palette may still be fading out; its own timer removes it, so
  // clearing that timer here would strand a full-screen overlay over the page.
  if (state) closeCommandPalette();
  const node = buildShell(labels);
  document.body.appendChild(node.root);

  state = {
    labels,
    search,
    pathSegments: Array.isArray(path) ? path : [],
    tip,
    help,
    onSelect,
    onPin,
    onContextMenu,
    onClose,
    onScope,
    onPathPop,
    onPathClick,
    onClearPath,
    onCopy,
    ...node,
    itemsByKey: new Map(),
    rowByKey: new Map(),
    activeKey: null,
    helpNode: null,
    focusReturn: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    debounceTimer: null,
  };

  node.tipHelp.addEventListener('click', () => {
    if (state) toggleHelp(state);
  });
  node.input.addEventListener('input', onInput);
  node.list.addEventListener('pointermove', onPointerMove);
  node.list.addEventListener('click', onClick);
  node.list.addEventListener('contextmenu', onRowContextMenu);
  node.root.addEventListener('pointerdown', onPointerDown);
  node.dialog.addEventListener('keydown', onKeyDown);
  lockPageScroll();
  renderPath(state);
  refresh();
  node.input.focus();

  return {
    refresh,
    close: closeCommandPalette,
    focus() {
      if (state) state.input.focus();
    },
    setQuery(value) {
      if (!state) return;
      node.input.value = String(value ?? '');
      refresh();
      node.input.focus();
    },
    setPath(pathSegments, nextTip) {
      setPath(pathSegments, nextTip);
    },
  };
}

/** Close the palette, restore focus and release the page scroll lock. */
export function closeCommandPalette() {
  if (!state) return;
  closeContextMenu();
  const current = state;
  state = null;
  clearTimeout(current.debounceTimer);
  current.input.removeEventListener('input', onInput);
  current.list.removeEventListener('pointermove', onPointerMove);
  current.list.removeEventListener('click', onClick);
  current.list.removeEventListener('contextmenu', onRowContextMenu);
  current.root.removeEventListener('pointerdown', onPointerDown);
  current.dialog.removeEventListener('keydown', onKeyDown);
  current.root.classList.add('is-closing');
  unlockPageScroll();
  // Each closing overlay owns its removal: a shared timer would be cleared by
  // the next close and leave this root behind.
  setTimeout(() => current.root.remove(), CLOSE_MS);
  if (current.focusReturn && current.focusReturn.isConnected) {
    current.focusReturn.focus({ preventScroll: true });
  }
  current.onClose?.();
}

export function isCommandPaletteOpen() {
  return Boolean(state);
}
