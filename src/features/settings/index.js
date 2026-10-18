import { on } from '../../core/bus.js';
import { hasCustomSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { debounce, el } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { getIconSvg } from './controls.js';
import { registerPage, togglePanel } from './panel.js';
import { renderAbout } from './tabs/about.js';
import { renderBackup } from './tabs/backup.js';
import { renderGallery } from './tabs/gallery.js';
import { renderGeneral } from './tabs/general.js';
import { ensureUserMenuItem, installUserMenuEntry, refreshUserMenuItem } from './userMenu.js';

/**
 * Settings entry points: the header button and the user-menu row (with a
 * menu-command fallback for userscript managers), the page registry and the
 * mount/remount logic for GitHub's client-side navigation.
 *
 * The button is a sibling of GitHub's own header actions rather than a
 * replacement of them, and it is re-placed whenever the header is swapped.
 * The user-menu row is owned by `userMenu.js`.
 */
const BUTTON_CLASS = 'gp-settings-btn';
const ITEM_CLASS = 'gp-settings-item';

/** Header containers that host the entry, most specific first. */
const HEADER_TARGETS = [
  '.AppHeader-globalBar-end',
  '.AppHeader-globalBar',
  '#user-links',
];

/** Debounce for chrome re-mounts, ms. */
const CHROME_DEBOUNCE_MS = 200;
/** Bounded wait for a late-rendered header (GitHub hydrates it), ms. */
const HEADER_POLL_MS = 500;
const HEADER_POLL_TRIES = 12;

let button = null;
let chromeObserver = null;
let headerPoll = null;

function buildButton() {
  const node = el('button', `${BUTTON_CLASS} gp-header-btn`);
  node.type = 'button';
  const icon = el('span', 'gp-header-btn__icon');
  icon.innerHTML = getIconSvg('gear');
  node.appendChild(icon);
  node.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    togglePanel(true);
  });
  return node;
}

function findHeaderTarget() {
  for (const selector of HEADER_TARGETS) {
    const node = document.querySelector(selector);
    if (node) return node;
  }
  return null;
}

/** A `ul` header needs an `li` host; other containers take the button as is. */
function placementHost(target) {
  if (target.tagName !== 'UL') return button;
  let item = target.querySelector(`:scope > .${ITEM_CLASS}`);
  if (!item) {
    item = el('li', ITEM_CLASS);
    item.appendChild(button);
  }
  return item;
}

function refreshLabels() {
  if (button) {
    const label = t('settings.open');
    button.title = label;
    button.setAttribute('aria-label', label);
  }
  refreshUserMenuItem();
}

function updateSettingsButtonState() {
  if (button) button.classList.toggle('gp-header-btn--custom', hasCustomSettings());
  refreshUserMenuItem();
}

function stopHeaderPoll() {
  if (headerPoll === null) return;
  clearInterval(headerPoll);
  headerPoll = null;
}

/** Mount (or re-mount) the settings button into the current header. */
export function ensureSettingsButton() {
  const target = findHeaderTarget();
  if (!target) {
    document.querySelector(`.${ITEM_CLASS}`)?.remove();
    button?.remove();
    return;
  }
  stopHeaderPoll();
  if (!button) button = buildButton();
  refreshLabels();
  const host = placementHost(target);
  if (host.parentElement !== target) {
    const userMenu = target.querySelector('.AppHeader-user');
    if (userMenu) target.insertBefore(host, userMenu);
    else target.appendChild(host);
  }
  updateSettingsButtonState();
}

function pollForHeader() {
  if (headerPoll !== null || findHeaderTarget()) return;
  let tries = 0;
  headerPoll = setInterval(() => {
    tries += 1;
    if (findHeaderTarget()) ensureSettingsButton();
    else if (tries >= HEADER_POLL_TRIES) stopHeaderPoll();
  }, HEADER_POLL_MS);
}

/**
 * GitHub replaces body children on soft navigation; watching the body's own
 * children (no subtree) is enough to notice a swapped app shell, and costs
 * nothing on content re-renders.
 */
function observeChrome() {
  if (chromeObserver || typeof MutationObserver !== 'function') return;
  const schedule = debounce(() => ensureSettingsButton(), CHROME_DEBOUNCE_MS);
  chromeObserver = new MutationObserver(schedule);
  chromeObserver.observe(document.body, { childList: true });
}

function installMenuCommand() {
  if (typeof GM_registerMenuCommand !== 'function') return;
  try {
    GM_registerMenuCommand(t('menu.settings'), openSettingsPanel);
  } catch {
    /* manager without menu commands */
  }
}

function registerPages() {
  registerPage({
    id: 'general',
    icon: 'general',
    labelKey: 'tab.general',
    descKey: 'tab.general.desc',
    render: renderGeneral,
  });
  registerPage({
    id: 'gallery',
    icon: 'gallery',
    labelKey: 'tab.gallery',
    descKey: 'tab.gallery.desc',
    render: renderGallery,
  });
  registerPage({
    id: 'backup',
    icon: 'backup',
    labelKey: 'tab.backup',
    descKey: 'tab.backup.desc',
    render: renderBackup,
  });
  registerPage({
    id: 'about',
    icon: 'about',
    labelKey: 'tab.about',
    descKey: 'tab.about.desc',
    render: renderAbout,
  });
}

/** Open the settings panel (menu command entry point). */
export function openSettingsPanel() {
  togglePanel(true);
}

export function initSettingsFeature() {
  registerPages();
  installMenuCommand();
  ensureSettingsButton();
  pollForHeader();
  observeChrome();
  installUserMenuEntry();
  ensureUserMenuItem();
  watchNavigation(() => {
    ensureSettingsButton();
    installUserMenuEntry();
  });
  on('settings:gallery', updateSettingsButtonState);
  on('settings:toasts', updateSettingsButtonState);
  on('settings:language', () => {
    refreshLabels();
    updateSettingsButtonState();
  });
}
