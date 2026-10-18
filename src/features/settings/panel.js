import { SCRIPT_NAME, getDefaults } from '../../core/constants.js';
import { emit } from '../../core/bus.js';
import { getSettings, normalizeImportedSettings, saveSettings } from '../../core/settings.js';
import { Codes, logError } from '../../core/debug.js';
import { configureLocale, t } from '../../i18n/index.js';
import { el, toArray } from '../../utils/dom.js';
import { lockPageScroll, unlockPageScroll } from '../../utils/scrollLock.js';
import { showToast } from '../../ui/toast.js';
import { isViewerOpen } from '../../ui/viewer.js';
import { createButton, getIconSvg } from './controls.js';
import { confirmDialog } from './confirm.js';

/**
 * Settings panel shell.
 *
 * Pages are registered through `registerPage`; each one renders into a
 * container and edits the panel draft (`getDraft()`), so nothing is persisted
 * until the footer Save. A sidebar lists the pages and keeps one of them open
 * at all times. Reset refills the draft with the defaults, Cancel, Escape and
 * the overlay click discard it. The overlay is rebuilt on every open, so its
 * labels always follow the current interface language, and it is removed once
 * its exit animation has played.
 */
const PANEL_ID = 'gp-settings-panel';
/** Matches the `gp-overlay-out` / `gp-panel-out` duration in app.css. */
const CLOSE_MS = 140;
const pages = new Map();
let activePageId = null;
let panelOpen = false;
let draft = null;
let escapeInstalled = false;
let closeTimer = null;
let openerFocus = null;

export function getScriptVersion() {
  try {
    return (typeof GM_info !== 'undefined' && GM_info?.script?.version) || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/** The settings draft the open panel edits. */
export function getDraft() {
  return draft;
}

export function registerPage(page) {
  if (!page || !page.id || typeof page.render !== 'function') return;
  pages.set(page.id, page);
}

function buildNav() {
  const nav = el('nav', 'gp-panel__nav');
  nav.setAttribute('aria-label', SCRIPT_NAME);
  pages.forEach((page) => {
    const button = el('button', 'gp-nav-item');
    button.type = 'button';
    button.dataset.page = page.id;
    const icon = el('span', 'gp-nav-item__icon');
    icon.innerHTML = getIconSvg(page.icon);
    button.append(icon, el('span', 'gp-nav-item__title', t(page.labelKey)));
    button.addEventListener('click', () => switchPanelPage(page.id));
    nav.appendChild(button);
  });
  nav.addEventListener('keydown', (event) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const ids = Array.from(pages.keys());
    const next = ids[(ids.indexOf(activePageId) + step + ids.length) % ids.length];
    event.preventDefault();
    switchPanelPage(next);
    toArray(nav.children).find((item) => item.dataset.page === next)?.focus();
  });
  return nav;
}

function syncNav(overlay) {
  toArray(overlay.querySelector('.gp-panel__nav')?.children || []).forEach((item) => {
    const active = item.dataset.page === activePageId;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

function buildPageView(id) {
  const page = pages.get(id);
  const view = el('div', 'gp-panel__page');
  const head = el('div', 'gp-page__head');
  head.append(
    el('h3', 'gp-page__title', page ? t(page.labelKey) : ''),
    el('p', 'gp-page__desc', page?.descKey ? t(page.descKey) : ''),
  );
  const body = el('div', 'gp-page');
  view.append(head, body);
  if (page) page.render(body);
  return view;
}

function renderCurrentView({ keepScroll = false } = {}) {
  const overlay = ensurePanel();
  const body = overlay.querySelector('.gp-panel__body');
  if (!body) return;
  const top = keepScroll ? body.scrollTop : 0;
  body.textContent = '';
  body.appendChild(buildPageView(activePageId));
  body.scrollTop = top;
  syncNav(overlay);
  updateDirty();
}

/** Footer cue: the draft differs from what is stored. */
function updateDirty() {
  const overlay = document.getElementById(PANEL_ID);
  if (!overlay || !draft) return;
  const stored = JSON.stringify(getSettings());
  const dirty = JSON.stringify(normalizeImportedSettings(draft)) !== stored;
  overlay.classList.toggle('is-dirty', dirty);
  const text = overlay.querySelector('.gp-panel__footer-text');
  const label = dirty ? t('panel.unsaved') : t('general.saveHint');
  if (text && text.textContent !== label) text.textContent = label;
}

export function switchPanelPage(id) {
  if (!pages.has(id) || id === activePageId) return;
  activePageId = id;
  renderCurrentView();
}

/** Re-read persisted settings into the draft and repaint (external changes). */
export function refreshPanelDraft() {
  if (!panelOpen) return;
  draft = cloneSettings();
  renderCurrentView({ keepScroll: true });
}

function cloneSettings() {
  return JSON.parse(JSON.stringify(getSettings()));
}

function persist() {
  try {
    const saved = saveSettings(draft);
    configureLocale(saved.language);
    emit('settings:gallery', saved.gallery);
    emit('settings:toasts', saved.toasts);
    emit('settings:language', saved.language);
    showToast({ type: 'success', title: t('toast.saved'), message: t('toast.savedDesc') });
  } catch (error) {
    logError(Codes.SETTINGS_PERSIST, 'saving settings from the panel failed', { error });
  }
  closePanel();
}

/**
 * Apply a settings payload that arrived from outside the panel (backup
 * import): persist it, notify features and repaint the open panel.
 */
export function applyExternalSettings(next) {
  const saved = saveSettings(next);
  configureLocale(saved.language);
  emit('settings:gallery', saved.gallery);
  emit('settings:toasts', saved.toasts);
  emit('settings:language', saved.language);
  if (panelOpen) refreshPanelDraft();
  return saved;
}

function resetDraft() {
  draft = getDefaults();
  renderCurrentView({ keepScroll: true });
}

function ensurePanel() {
  const existing = document.getElementById(PANEL_ID);
  if (existing) return existing;

  const overlay = el('div', 'gp-panel-overlay');
  overlay.id = PANEL_ID;
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closePanel();
  });

  const panel = el('div', 'gp-panel');
  panel.tabIndex = -1;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', SCRIPT_NAME);

  const header = el('header', 'gp-panel__header');
  const brand = el('div', 'gp-panel__brand');
  const titleRow = el('div', 'gp-panel__title-row');
  titleRow.append(
    el('h2', 'gp-panel__title', SCRIPT_NAME),
    el('span', 'gp-panel__version', `v${getScriptVersion()}`),
  );
  brand.append(titleRow, el('p', 'gp-panel__subtitle', t('panel.subtitle')));
  const close = el('button', 'gp-panel__close');
  close.type = 'button';
  close.innerHTML = getIconSvg('close');
  close.title = t('common.close');
  close.setAttribute('aria-label', t('common.close'));
  close.addEventListener('click', closePanel);
  header.append(brand, close);

  const body = el('div', 'gp-panel__body');
  body.addEventListener('input', updateDirty);
  body.addEventListener('change', updateDirty);
  const main = el('div', 'gp-panel__main');
  main.append(buildNav(), body);

  const footer = el('footer', 'gp-panel__footer');
  const note = el('p', 'gp-panel__footer-note');
  note.setAttribute('aria-live', 'polite');
  note.append(el('span', 'gp-panel__dirty-dot'), el('span', 'gp-panel__footer-text', t('general.saveHint')));
  const reset = createButton(t('common.reset'), async () => {
    const confirmed = await confirmDialog({
      title: t('common.reset'),
      message: t('reset.confirm'),
      confirmLabel: t('common.reset'),
    });
    if (confirmed) resetDraft();
  }, 'gp-button--ghost');
  const cancel = createButton(t('common.cancel'), closePanel);
  const save = createButton(t('common.save'), persist, 'gp-button--primary');
  footer.append(note, reset, cancel, save);

  panel.append(header, main, footer);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  return overlay;
}

function installEscapeClose() {
  if (escapeInstalled) return;
  escapeInstalled = true;
  document.addEventListener('keydown', (event) => {
    if (!panelOpen || event.key !== 'Escape') return;
    // The image viewer sits above the panel and owns Escape while open.
    if (isViewerOpen()) return;
    event.stopPropagation();
    closePanel();
  }, true);
}

function openPanel() {
  if (panelOpen) return;
  clearTimeout(closeTimer);
  document.getElementById(PANEL_ID)?.remove();
  draft = cloneSettings();
  if (!pages.has(activePageId)) activePageId = pages.keys().next().value ?? null;
  openerFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  panelOpen = true;
  const overlay = ensurePanel();
  renderCurrentView();
  lockPageScroll();
  overlay.querySelector('.gp-panel')?.focus?.();
}

function closePanel() {
  if (!panelOpen) return;
  panelOpen = false;
  draft = null;
  unlockPageScroll();
  const overlay = document.getElementById(PANEL_ID);
  if (overlay) {
    overlay.classList.add('is-closing');
    closeTimer = setTimeout(() => overlay.remove(), CLOSE_MS);
  }
  if (openerFocus?.isConnected) openerFocus.focus();
  openerFocus = null;
}

/** Open, close or toggle the settings panel. */
export function togglePanel(force) {
  installEscapeClose();
  const shouldOpen = force === undefined ? !panelOpen : !!force;
  if (shouldOpen) openPanel();
  else closePanel();
}

export function isPanelOpen() {
  return panelOpen;
}
