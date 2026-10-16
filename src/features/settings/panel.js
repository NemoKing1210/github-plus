import { SCRIPT_NAME, getDefaults } from '../../core/constants.js';
import { emit } from '../../core/bus.js';
import { getSettings, saveSettings } from '../../core/settings.js';
import { Codes, logError } from '../../core/debug.js';
import { configureLocale, t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';
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
 * until the footer Save. Reset refills the draft with the defaults, Cancel and
 * the overlay click discard it, Escape returns to the home list first.
 */
const PANEL_ID = 'gp-settings-panel';
const pages = new Map();
let activePageId = null;
let panelOpen = false;
let draft = null;
let escapeInstalled = false;

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

function buildHomeView() {
  const view = el('div', 'gp-panel__home');
  const nav = el('nav', 'gp-panel__nav');
  pages.forEach((page) => {
    const button = el('button', 'gp-nav-item');
    button.type = 'button';
    const icon = el('span', 'gp-nav-item__icon');
    icon.innerHTML = getIconSvg(page.icon);
    const text = el('span', 'gp-nav-item__text');
    text.append(
      el('span', 'gp-nav-item__title', t(page.labelKey)),
      el('span', 'gp-nav-item__desc', page.descKey ? t(page.descKey) : ''),
    );
    button.append(icon, text);
    button.addEventListener('click', () => switchPanelPage(page.id));
    nav.appendChild(button);
  });
  view.appendChild(nav);
  return view;
}

function buildPageView(id) {
  const page = pages.get(id);
  const view = el('div', 'gp-panel__page');
  const back = el('button', 'gp-page__back');
  back.type = 'button';
  back.append(el('span', null, '‹'), el('span', null, t('panel.back')));
  back.addEventListener('click', () => showHome());
  const body = el('div', 'gp-page');
  view.append(back, body);
  if (page) page.render(body);
  return view;
}

function renderCurrentView() {
  const panel = ensurePanel();
  const body = panel.querySelector('.gp-panel__body');
  if (!body) return;
  body.textContent = '';
  body.appendChild(activePageId ? buildPageView(activePageId) : buildHomeView());
  body.scrollTop = 0;
}

export function showHome() {
  activePageId = null;
  renderCurrentView();
}

export function switchPanelPage(id) {
  if (!pages.has(id)) return;
  activePageId = id;
  renderCurrentView();
}

/** Re-read persisted settings into the draft and repaint (external changes). */
export function refreshPanelDraft() {
  if (!panelOpen) return;
  draft = cloneSettings();
  renderCurrentView();
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
  renderCurrentView();
}

function ensurePanel() {
  const existing = document.getElementById(PANEL_ID);
  if (existing) return existing;

  const overlay = el('div', 'gp-panel-overlay');
  overlay.id = PANEL_ID;
  overlay.hidden = true;
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
  const close = el('button', 'gp-panel__close', '×');
  close.type = 'button';
  close.title = t('common.close');
  close.setAttribute('aria-label', t('common.close'));
  close.addEventListener('click', closePanel);
  header.append(brand, close);

  const body = el('div', 'gp-panel__body');

  const footer = el('footer', 'gp-panel__footer');
  const note = el('p', 'gp-panel__footer-note', t('general.saveHint'));
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

  panel.append(header, body, footer);
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
    if (activePageId) showHome();
    else closePanel();
  }, true);
}

function openPanel() {
  draft = cloneSettings();
  activePageId = null;
  const overlay = ensurePanel();
  renderCurrentView();
  overlay.hidden = false;
  panelOpen = true;
  lockPageScroll();
  overlay.querySelector('.gp-panel')?.focus?.();
}

function closePanel() {
  if (!panelOpen) return;
  const overlay = document.getElementById(PANEL_ID);
  if (overlay) overlay.hidden = true;
  panelOpen = false;
  draft = null;
  activePageId = null;
  unlockPageScroll();
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
