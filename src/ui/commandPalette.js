/**
 * Command palette shell: a modal search field, a grouped listbox and an
 * expansion block under the active row. It knows nothing about what it lists —
 * `search(query)` supplies groups, `renderExpansion(item)` supplies the block,
 * and the caller's callbacks run the selection — so the feature owns data and
 * this module owns interaction.
 */

import { el } from '../utils/dom.js';
import { lockPageScroll, unlockPageScroll } from '../utils/scrollLock.js';
import { PALETTE_ICONS } from './icons.js';
import { closeContextMenu } from './contextMenu.js';

const CLOSE_MS = 120;
const DEBOUNCE_MS = 80;
const EXPANDABLE_KINDS = new Set(['repo', 'file', 'issue', 'command']);

let state = null;
let closeTimer = null;
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

  const hint = el('kbd', 'gp-command__kbd', 'Esc');
  field.append(glyph, input, hint);
  top.append(field);

  const main = el('div', 'gp-command__main');
  const list = el('div', 'gp-command__list');
  list.id = 'gp-command-list';
  list.setAttribute('role', 'listbox');
  main.append(list);

  const tip = el('div', 'gp-command__tip');
  const tipText = el('span', 'gp-command__tip-text', labels.tip || '');
  const note = el('span', 'gp-command__tip-note');
  const bar = el('div', 'gp-command__bar');
  tip.append(tipText, note, bar);

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
  return { root, dialog, input, list, tip, note, empty, announcer, bar };
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
  if (item.kind === 'repo') parts.push(`Tab ${labels.hintScope || ''}`);
  parts.push(`↵ ${labels.hintOpen || ''}`);
  if (EXPANDABLE_KINDS.has(item.kind)) parts.push(`→ ${labels.hintExpand || ''}`);
  return parts.join(' · ');
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
  icon.innerHTML = PALETTE_ICONS[item.icon] || '';
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
  if (key === 'Enter') {
    event.preventDefault();
    const item = activeItem();
    if (item) choose(item, ctrlKey || metaKey);
    return;
  }
  if (key === 'Escape') {
    event.preventDefault();
    if (state.input.value) {
      state.input.value = '';
      refresh();
      return;
    }
    closeCommandPalette();
    return;
  }
  if (key === 'Tab') trapFocus(event);
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
 *   renderExpansion?: (item: object) => Node | null, scope?: {label: string}|null,
 *   help?: object|null, onSelect?: (item: object, options: {newTab: boolean}) => void,
 *   onPin?: (item: object) => void, onClose?: () => void,
 *   onScope?: (item: object) => void, onClearScope?: () => void,
 *   onCopy?: (item: object) => void,
 *   onContextMenu?: (item: object, position: {x?: number, y?: number, anchor: Element|null, keyboard: boolean}) => void}} options
 * @returns {{refresh: () => void, close: () => void, setQuery: (value: string) => void}}
 */
export function openCommandPalette({
  labels = {},
  search,
  renderExpansion,
  scope = null,
  help = null,
  onSelect,
  onPin,
  onContextMenu,
  onClose,
  onScope,
  onClearScope,
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
    renderExpansion,
    scope,
    help,
    onSelect,
    onPin,
    onContextMenu,
    onClose,
    onScope,
    onClearScope,
    onCopy,
    ...node,
    itemsByKey: new Map(),
    rowByKey: new Map(),
    activeKey: null,
    focusReturn: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    debounceTimer: null,
  };

  node.input.addEventListener('input', onInput);
  node.list.addEventListener('pointermove', onPointerMove);
  node.list.addEventListener('click', onClick);
  node.list.addEventListener('contextmenu', onRowContextMenu);
  node.root.addEventListener('pointerdown', onPointerDown);
  node.dialog.addEventListener('keydown', onKeyDown);
  lockPageScroll();
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
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => current.root.remove(), CLOSE_MS);
  if (current.focusReturn && current.focusReturn.isConnected) {
    current.focusReturn.focus({ preventScroll: true });
  }
  current.onClose?.();
}

export function isCommandPaletteOpen() {
  return Boolean(state);
}
