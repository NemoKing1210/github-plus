import { debounce, el } from '../utils/dom.js';
import { watchNavigation } from '../utils/navigation.js';

/**
 * Header action registry: every GitHub Plus entry in GitHub's header mounts
 * through here, so several features can share the bar without each owning a
 * poll, a body observer and its own placement rules.
 */

/** Header containers that host actions, most specific first. */
export const HEADER_TARGETS = [
  '.AppHeader-globalBar-end',
  '.AppHeader-globalBar',
  '#user-links',
];

const CHROME_DEBOUNCE_MS = 200;
const HEADER_POLL_MS = 500;
const HEADER_POLL_TRIES = 12;

const actions = new Map();
const scheduleSync = debounce(() => syncHeaderActions(), CHROME_DEBOUNCE_MS);

let chromeObserver = null;
let chromeBody = null;
let rootObserver = null;
let headerPoll = null;
let navigationWatched = false;

function findHeaderTarget() {
  for (const selector of HEADER_TARGETS) {
    const node = document.querySelector(selector);
    if (node) return node;
  }
  return null;
}

function stopHeaderPoll() {
  if (headerPoll === null) return;
  clearInterval(headerPoll);
  headerPoll = null;
}

/** Bounded wait for a late-rendered header; GitHub hydrates it after the shell. */
function startHeaderPoll() {
  if (headerPoll !== null) return;
  let tries = 0;
  headerPoll = setInterval(() => {
    tries += 1;
    if (findHeaderTarget()) {
      syncHeaderActions();
      return;
    }
    if (tries >= HEADER_POLL_TRIES) stopHeaderPoll();
  }, HEADER_POLL_MS);
}

function observeChrome() {
  if (typeof MutationObserver !== 'function') return;
  const body = document.body;
  if (!body || (chromeObserver && chromeBody === body)) return;
  if (chromeObserver) chromeObserver.disconnect();
  chromeBody = body;
  chromeObserver = new MutationObserver(scheduleSync);
  chromeObserver.observe(body, { childList: true });
}

/** A replaced body leaves the previous observer dead; `<html>` notices the swap. */
function observeShell() {
  if (typeof MutationObserver !== 'function' || rootObserver) return;
  rootObserver = new MutationObserver(() => {
    observeChrome();
    scheduleSync();
  });
  rootObserver.observe(document.documentElement, { childList: true });
}

function installWatchers() {
  observeShell();
  observeChrome();
  if (navigationWatched) return;
  navigationWatched = true;
  watchNavigation(() => {
    observeChrome();
    syncHeaderActions();
  });
}

function apply(record) {
  record.node.className = `gp-header-btn ${record.className}`.trim();
  record.iconNode.innerHTML = record.icon;
  record.iconNode.hidden = !record.icon;
  if (record.label) {
    record.node.title = record.label;
    record.node.setAttribute('aria-label', record.label);
  } else {
    record.node.removeAttribute('title');
    record.node.removeAttribute('aria-label');
  }
}

function mountHost(target, record) {
  if (target.tagName !== 'UL') return record.node;
  const item = el('li', 'gp-header-item');
  item.appendChild(record.node);
  return item;
}

/**
 * Mount, reorder or remove every registered action. Runs on boot, navigation,
 * an app-shell swap and every `update()`, so it is idempotent by construction.
 */
export function syncHeaderActions() {
  for (const record of actions.values()) {
    record.host?.remove();
    record.host = null;
    apply(record);
  }
  const target = findHeaderTarget();
  if (!target) {
    startHeaderPoll();
    return;
  }
  stopHeaderPoll();
  const ordered = [...actions.values()]
    .filter((record) => record.visible)
    .sort((a, b) => a.order - b.order);
  const userMenu = target.querySelector('.AppHeader-user');
  const anchor = userMenu && userMenu.parentElement === target ? userMenu : null;
  for (const record of ordered) {
    const host = mountHost(target, record);
    if (anchor) target.insertBefore(host, anchor);
    else target.appendChild(host);
    record.host = host;
  }
}

/** The registered node for an id, or null — available even while hidden. */
export function headerActionNode(id) {
  return actions.get(id)?.node || null;
}

/**
 * Register one header button. Registration is idempotent: re-registering an id
 * replaces the previous entry, which is what a feature re-init after a body
 * swap relies on.
 */
export function registerHeaderAction({
  id,
  order = 100,
  className = '',
  icon = '',
  label = '',
  onClick,
} = {}) {
  if (!id) throw new Error('a header action needs an id');
  actions.get(id)?.remove();

  const node = el('button', 'gp-header-btn');
  node.type = 'button';
  node.dataset.gpHeaderAction = id;
  const iconNode = el('span', 'gp-header-btn__icon');
  node.appendChild(iconNode);
  node.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.(event);
  });

  const record = {
    id,
    order,
    className,
    icon,
    label,
    visible: true,
    node,
    iconNode,
    host: null,
    update({ label: nextLabel, icon: nextIcon, className: nextClass, visible } = {}) {
      if (nextLabel !== undefined) record.label = nextLabel;
      if (nextIcon !== undefined) record.icon = nextIcon;
      if (nextClass !== undefined) record.className = nextClass;
      if (visible !== undefined) record.visible = !!visible;
      syncHeaderActions();
    },
    remove() {
      record.host?.remove();
      record.host = null;
      actions.delete(id);
      if (!actions.size) stopHeaderPoll();
    },
  };

  actions.set(id, record);
  installWatchers();
  syncHeaderActions();
  return record;
}
