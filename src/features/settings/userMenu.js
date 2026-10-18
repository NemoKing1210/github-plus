import { hasCustomSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';
import { getIconSvg } from './controls.js';
import { togglePanel } from './panel.js';

/**
 * Settings entry inside GitHub's user (avatar) menu, next to GitHub's own
 * "Settings" row.
 *
 * GitHub's overlays are Primer portals: they are mounted into
 * `#__primerPortalRoot__` when they open and unmounted when they close, so
 * watching that one container catches the user menu whenever it appears —
 * whatever opened it, and however long its lazy chunk took to arrive. Header
 * clicks stay as a fallback for a menu that is not portaled, and both paths are
 * idempotent, so a re-render that drops the row simply puts it back.
 *
 * The menu is closed with the Escape keydown it already handles, dispatched
 * before the panel opens: the panel's own Escape listener still sees a closed
 * panel and ignores it.
 */
const PORTAL_ROOT_ID = '__primerPortalRoot__';
const MENU_ROOT_SELECTOR = '[aria-labelledby="global-nav-user-menu-header"]';
const MENU_LIST_SELECTOR = '[data-component="ActionList"]';
const NATIVE_SETTINGS_SELECTOR = 'a[href$="/settings/profile"]';
const DIVIDER_SELECTOR = 'li[data-component="ActionList.Divider"]';
/** Header regions that own the avatar trigger (current and legacy header). */
const HEADER_HINT_SELECTOR = '.AppHeader, #user-links';

const ROW_CLASS = 'gp-user-menu-item';

/** Bounded wait for a menu that React renders outside the portal root. */
const MENU_POLL_MS = 100;
const MENU_POLL_TRIES = 20;

let clickInstalled = false;
let portalObserver = null;
let portalRoot = null;
let menuPoll = null;
let row = null;

function buildRow() {
  const item = el('li', ROW_CLASS);
  const button = el('button', `${ROW_CLASS}__btn`);
  button.type = 'button';
  const icon = el('span', `${ROW_CLASS}__icon`);
  icon.innerHTML = getIconSvg('gear');
  button.append(
    icon,
    el('span', `${ROW_CLASS}__label`, t('settings.open')),
    el('span', `${ROW_CLASS}__dot`),
  );
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const menu = item.closest(MENU_ROOT_SELECTOR);
    if (menu) {
      menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    }
    togglePanel(true);
  });
  item.appendChild(button);
  return item;
}

/** After GitHub's own "Settings" row, else before the last group divider. */
function anchorFor(list) {
  const settingsItem = list.querySelector(NATIVE_SETTINGS_SELECTOR)?.closest('li');
  if (settingsItem) return settingsItem.nextSibling;
  const dividers = list.querySelectorAll(DIVIDER_SELECTOR);
  return dividers.length ? dividers[dividers.length - 1] : null;
}

/**
 * The menu's action list, found by the overlay's own hook or — if GitHub
 * renames it — by the Settings row the list contains.
 */
function findMenuList(scope) {
  const list = scope.querySelector(MENU_ROOT_SELECTOR)?.querySelector(MENU_LIST_SELECTOR);
  if (list) return list;
  return scope.querySelector(NATIVE_SETTINGS_SELECTOR)?.closest(MENU_LIST_SELECTOR) || null;
}

/** Relabel the injected row and repaint its "settings differ" dot. */
export function refreshUserMenuItem() {
  if (!row || !row.isConnected) return;
  const label = row.querySelector(`.${ROW_CLASS}__label`);
  const text = t('settings.open');
  if (label && label.textContent !== text) label.textContent = text;
  row.classList.toggle(`${ROW_CLASS}--custom`, hasCustomSettings());
}

/** Inject the row into the user menu inside `scope`; `true` once it is there. */
export function ensureUserMenuItem(scope = document) {
  observePortalRoot();
  const list = findMenuList(scope);
  if (!list) return false;
  let item = list.querySelector(`.${ROW_CLASS}`);
  if (!item) {
    item = buildRow();
    list.insertBefore(item, anchorFor(list));
  }
  row = item;
  refreshUserMenuItem();
  return true;
}

/**
 * Primer mounts overlays into its portal root and nowhere else, so watching
 * that container is precise: it stays empty until an overlay opens, and the
 * check is skipped the moment our row is in place.
 */
export function observePortalRoot() {
  if (typeof MutationObserver !== 'function') return;
  const root = document.getElementById(PORTAL_ROOT_ID);
  if (!root || root === portalRoot) return;
  if (portalObserver) portalObserver.disconnect();
  portalRoot = root;
  portalObserver = new MutationObserver(() => {
    if (row && row.isConnected) return;
    ensureUserMenuItem(root);
  });
  portalObserver.observe(root, { childList: true, subtree: true });
}

function requestUserMenuItem() {
  observePortalRoot();
  if (ensureUserMenuItem() || menuPoll !== null) return;
  let tries = 0;
  menuPoll = setInterval(() => {
    tries += 1;
    if (ensureUserMenuItem() || tries >= MENU_POLL_TRIES) {
      clearInterval(menuPoll);
      menuPoll = null;
    }
  }, MENU_POLL_MS);
}

/** Portal observation plus the header-click fallback. Safe to call again. */
export function installUserMenuEntry() {
  observePortalRoot();
  if (clickInstalled) return;
  clickInstalled = true;
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(HEADER_HINT_SELECTOR)) return;
    requestUserMenuItem();
  }, true);
}
