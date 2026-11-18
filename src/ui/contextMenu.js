import { el } from '../utils/dom.js';

/**
 * One context menu for injected UI, built from design tokens and rendered at
 * `<body>` level. Rebuilt on every open; `openContextMenu` replaces an open
 * instance, so callers never hold on to nodes.
 *
 * Items are `{ label, icon?, disabled?, onSelect }`; a `null` entry renders a
 * separator. Keyboard: arrows, Home/End, Enter/Space, Escape and Tab; the
 * menu closes on an outside press, scroll, resize, navigation and when focus
 * leaves it.
 *
 * @typedef {Object} ContextMenuItem
 * @property {string} label
 * @property {string} [icon] SVG markup, 16×16
 * @property {boolean} [disabled]
 * @property {() => void} onSelect
 */

const ROOT_ID = 'gp-context-menu';
const EDGE = 8;

let menu = null;
let openedWith = null;
let anchorNode = null;
let teardown = null;
let closeHook = null;

function itemsOf(root) {
  const buttons = root.querySelectorAll('.gp-context-menu__item');
  const list = [];
  for (let index = 0; index < buttons.length; index += 1) {
    if (!buttons[index].disabled) list.push(buttons[index]);
  }
  return list;
}

function buildItem(item, close) {
  const button = el('button', 'gp-context-menu__item');
  button.type = 'button';
  button.setAttribute('role', 'menuitem');
  button.tabIndex = -1;
  if (item.icon) {
    const icon = el('span', 'gp-context-menu__icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = item.icon;
    button.appendChild(icon);
  }
  button.appendChild(el('span', 'gp-context-menu__label', item.label));
  if (item.disabled) button.disabled = true;
  else {
    button.addEventListener('click', () => {
      close();
      item.onSelect();
    });
  }
  return button;
}

function place(root, x, y) {
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  const maxX = window.innerWidth - width - EDGE;
  const maxY = window.innerHeight - height - EDGE;
  root.style.left = `${Math.max(EDGE, Math.min(x, maxX))}px`;
  root.style.top = `${Math.max(EDGE, Math.min(y, maxY))}px`;
}

/** Close the open menu, if any. Restores focus only for keyboard opens. */
export function closeContextMenu() {
  if (!menu) {
    closeHook = null;
    return;
  }
  const root = menu;
  const restore = openedWith === 'keyboard' ? anchorNode : null;
  const hook = closeHook;
  menu = null;
  openedWith = null;
  anchorNode = null;
  closeHook = null;
  if (teardown) teardown();
  teardown = null;
  root.remove();
  if (restore && restore.isConnected) restore.focus({ preventScroll: true });
  hook?.();
}

export function isContextMenuOpen() {
  return menu !== null;
}

/**
 * Open the menu at a point, or next to `anchor` for keyboard opens.
 * `layer: 'preview'` floats above the quick preview and `'palette'` above the
 * command palette; `elevated` is the older name for the preview layer.
 * `onClose` runs once the menu is gone and focus is restored, so a caller can
 * take focus back when its anchor was rebuilt (the palette's rows are).
 * @param {{x?: number, y?: number, anchor?: Element|null, keyboard?: boolean, label: string, items: ContextMenuItem[], layer?: 'default'|'preview'|'palette', elevated?: boolean, onClose?: () => void}} options
 */
export function openContextMenu({
  x = 0,
  y = 0,
  anchor = null,
  keyboard = false,
  label = '',
  items = [],
  layer = 'default',
  elevated = false,
  onClose = null,
}) {
  closeContextMenu();
  if (!items.length) return;

  const resolvedLayer = elevated ? 'preview' : layer;
  const classes = ['gp-context-menu'];
  if (resolvedLayer === 'preview') classes.push('gp-context-menu--elevated');
  if (resolvedLayer === 'palette') classes.push('gp-context-menu--palette');
  const root = el('div', classes.join(' '));
  root.id = ROOT_ID;
  root.setAttribute('role', 'menu');
  if (label) root.setAttribute('aria-label', label);
  anchorNode = anchor;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item) root.appendChild(el('div', 'gp-context-menu__sep'));
    else root.appendChild(buildItem(item, () => closeContextMenu()));
  }

  document.body.appendChild(root);
  menu = root;
  openedWith = keyboard ? 'keyboard' : 'pointer';
  closeHook = onClose;

  if (keyboard && anchor) {
    const rect = anchor.getBoundingClientRect();
    place(root, rect.left, rect.bottom + 4);
  } else {
    place(root, x, y);
  }

  const first = itemsOf(root)[0];
  if (first) first.focus({ preventScroll: true });

  root.addEventListener('keydown', (event) => {
    const list = itemsOf(root);
    if (!list.length) return;
    const active = list.indexOf(document.activeElement);
    let next = null;
    if (event.key === 'ArrowDown') next = list[(active + 1 + list.length) % list.length];
    else if (event.key === 'ArrowUp') next = list[(active - 1 + list.length) % list.length];
    else if (event.key === 'Home') next = list[0];
    else if (event.key === 'End') next = list[list.length - 1];
    else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeContextMenu();
      return;
    } else if (event.key === 'Tab') {
      event.preventDefault();
      closeContextMenu();
      return;
    }
    if (!next) return;
    event.preventDefault();
    next.focus({ preventScroll: true });
  });

  const onPointerDown = (event) => {
    if (!root.contains(event.target)) closeContextMenu();
  };
  const onScroll = () => closeContextMenu();
  const onResize = () => closeContextMenu();
  const onBlur = (event) => {
    if (!root.contains(event.relatedTarget)) closeContextMenu();
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onResize);
  root.addEventListener('focusout', onBlur);

  teardown = () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', onResize);
  };
}
