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
 * until the footer Save. A grouped sidebar lists the pages and keeps one of
 * them open at all times. The header search indexes the rendered rows and
 * fields of every page, shows matches grouped by page and jumps to the chosen
 * setting. Reset refills the draft with the defaults, Cancel, Escape and the
 * overlay click discard it. The overlay is rebuilt on every open, so its
 * labels always follow the current interface language, and it is removed once
 * its exit animation has played.
 */
const PANEL_ID = 'gp-settings-panel';
const SEARCH_ID = 'gp-settings-search';
const SPOT_ATTR = 'data-gp-spot';
/** Matches the `gp-overlay-out` / `gp-panel-out` duration in app.css. */
const CLOSE_MS = 140;
/** How long a jumped-to setting stays highlighted, ms. */
const SPOTLIGHT_MS = 1600;
const NAV_GROUPS = [
  { id: 'preferences', labelKey: 'nav.preferences' },
  { id: 'more', labelKey: 'nav.more' },
];
const SEARCH_SPOT_SELECTOR = '.gp-card__head, .gp-row, .gp-field, .gp-grid__cell';
const SEARCH_LABEL_SELECTOR = '.gp-card__title, .gp-row__label, .gp-field__label';
const SEARCH_HINT_SELECTOR = '.gp-card__hint, .gp-row__hint, .gp-hint';

const pages = new Map();
let activePageId = null;
let panelOpen = false;
let draft = null;
let escapeInstalled = false;
let closeTimer = null;
let spotlightTimer = null;
let openerFocus = null;
let searchQuery = '';
let searchIndex = new Map();

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

function navGroups() {
  const order = new Map(NAV_GROUPS.map((group, index) => [group.id, index]));
  const groups = [];
  pages.forEach((page) => {
    const id = page.group || NAV_GROUPS[0].id;
    let group = groups.find((candidate) => candidate.id === id);
    if (!group) {
      group = {
        id,
        labelKey: NAV_GROUPS.find((candidate) => candidate.id === id)?.labelKey,
        pages: [],
      };
      groups.push(group);
    }
    group.pages.push(page);
  });
  groups.sort(
    (left, right) =>
      (order.get(left.id) ?? Number.MAX_SAFE_INTEGER)
      - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
  return groups;
}

function buildNav() {
  const nav = el('nav', 'gp-panel__nav');
  nav.setAttribute('aria-label', SCRIPT_NAME);
  for (const group of navGroups()) {
    const section = el('div', 'gp-nav-group');
    if (group.labelKey) section.appendChild(el('div', 'gp-nav-group__label', t(group.labelKey)));
    for (const page of group.pages) {
      const button = el('button', 'gp-nav-item');
      button.type = 'button';
      button.dataset.page = page.id;
      const icon = el('span', 'gp-nav-item__icon');
      icon.innerHTML = getIconSvg(page.icon);
      const count = el('span', 'gp-nav-item__count');
      count.hidden = true;
      button.append(icon, el('span', 'gp-nav-item__title', t(page.labelKey)), count);
      button.addEventListener('click', () => navigateToPage(page.id));
      section.appendChild(button);
    }
    nav.appendChild(section);
  }
  nav.addEventListener('keydown', (event) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const items = toArray(nav.querySelectorAll('.gp-nav-item'));
    if (!items.length) return;
    const found = items.findIndex((item) => item.dataset.page === activePageId);
    const current = found < 0 ? 0 : found;
    const next = (current + step + items.length) % items.length;
    event.preventDefault();
    navigateToPage(items[next].dataset.page);
    items[next].focus();
  });
  return nav;
}

function syncNav(overlay, counts = null) {
  const searching = !!searchQuery;
  overlay.classList.toggle('is-searching', searching);
  toArray(overlay.querySelectorAll('.gp-nav-item')).forEach((item) => {
    const active = !searching && item.dataset.page === activePageId;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
    const badge = item.querySelector('.gp-nav-item__count');
    if (!badge) return;
    const count = counts?.get(item.dataset.page) || 0;
    badge.hidden = !searching || !count;
    badge.textContent = count ? String(count) : '';
  });
}

function buildPageView(id) {
  const page = pages.get(id);
  const view = el('div', 'gp-panel__page');
  const head = el('div', 'gp-page__head');
  const icon = el('span', 'gp-page__icon');
  if (page) icon.innerHTML = getIconSvg(page.icon);
  const heading = el('div', 'gp-page__heading');
  heading.append(
    el('h3', 'gp-page__title', page ? t(page.labelKey) : ''),
    el('p', 'gp-page__desc', page?.descKey ? t(page.descKey) : ''),
  );
  head.append(icon, heading);
  const body = el('div', 'gp-page');
  view.append(head, body);
  if (page) page.render(body);
  return view;
}

function indexPage(pageId, container) {
  const page = pages.get(pageId);
  if (!page || !container) return;
  const entries = [{
    spot: 'head',
    title: t(page.labelKey),
    hint: page.descKey ? t(page.descKey) : '',
  }];
  toArray(container.querySelectorAll(SEARCH_SPOT_SELECTOR)).forEach((node) => {
    const title = node.querySelector(SEARCH_LABEL_SELECTOR)?.textContent?.trim() || '';
    if (!title) return;
    const hint = node.querySelector(SEARCH_HINT_SELECTOR)?.textContent?.trim() || '';
    const spot = String(entries.length - 1);
    node.setAttribute(SPOT_ATTR, spot);
    entries.push({ spot, title, hint });
  });
  searchIndex.set(pageId, entries);
}

/** Render a page off-screen once, so search can see pages never opened. */
function ensurePageIndexed(pageId) {
  if (searchIndex.has(pageId)) return;
  const page = pages.get(pageId);
  if (!page) return;
  const host = el('div', 'gp-panel__page');
  page.render(host);
  indexPage(pageId, host);
}

function renderCurrentView({ keepScroll = false } = {}) {
  const overlay = ensurePanel();
  const body = overlay.querySelector('.gp-panel__body');
  if (!body) return;
  const top = keepScroll ? body.scrollTop : 0;
  clearTimeout(spotlightTimer);
  body.textContent = '';
  if (searchQuery) {
    const tokens = tokenize(searchQuery);
    const groups = collectSearchGroups(tokens);
    body.appendChild(buildSearchView(groups, tokens));
    syncNav(overlay, resultCounts(groups));
  } else {
    const view = buildPageView(activePageId);
    body.appendChild(view);
    indexPage(activePageId, view);
    syncNav(overlay);
  }
  body.scrollTop = top;
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

function navigateToPage(id) {
  if (!pages.has(id)) return;
  const wasSearching = !!searchQuery;
  if (wasSearching) setSearchValue('');
  if (id !== activePageId || wasSearching) {
    activePageId = id;
    renderCurrentView();
  }
}

export function switchPanelPage(id) {
  navigateToPage(id);
}

/** Re-read persisted settings into the draft and repaint (external changes). */
export function refreshPanelDraft() {
  if (!panelOpen) return;
  draft = cloneSettings();
  setSearchValue('');
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
    emit('settings:fileIcons', saved.fileIcons);
    emit('settings:fileAges', saved.fileAges);
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
  emit('settings:fileIcons', saved.fileIcons);
  emit('settings:fileAges', saved.fileAges);
  if (panelOpen) refreshPanelDraft();
  return saved;
}

function resetDraft() {
  draft = getDefaults();
  setSearchValue('');
  renderCurrentView({ keepScroll: true });
}

function tokenize(value) {
  const seen = new Set();
  const tokens = [];
  String(value || '').toLowerCase().split(/\s+/).forEach((token) => {
    if (!token || seen.has(token)) return;
    seen.add(token);
    tokens.push(token);
  });
  return tokens;
}

function entryMatches(entry, tokens) {
  const haystack = `${entry.title}\n${entry.hint}`.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function collectSearchGroups(tokens) {
  const groups = [];
  if (!tokens.length) return groups;
  pages.forEach((page, id) => {
    ensurePageIndexed(id);
    const entries = (searchIndex.get(id) || []).filter((entry) => entryMatches(entry, tokens));
    if (entries.length) groups.push({ id, page, entries });
  });
  return groups;
}

function resultCounts(groups) {
  const counts = new Map();
  for (const group of groups) counts.set(group.id, group.entries.length);
  return counts;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function appendHighlighted(parent, text, tokens) {
  const value = String(text || '');
  if (!value) return;
  if (!tokens.length) {
    parent.textContent = value;
    return;
  }
  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = value.split(pattern);
  for (const part of parts) {
    if (!part) continue;
    if (tokens.includes(part.toLowerCase())) parent.appendChild(el('mark', 'gp-search__mark', part));
    else parent.appendChild(document.createTextNode(part));
  }
}

function buildSearchView(groups, tokens) {
  const view = el('div', 'gp-search');
  view.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = toArray(view.querySelectorAll('.gp-search__item'));
    if (!items.length) return;
    const found = items.indexOf(document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = found < 0
      ? (step === 1 ? 0 : items.length - 1)
      : (found + step + items.length) % items.length;
    event.preventDefault();
    items[next].focus();
  });

  const total = groups.reduce((sum, group) => sum + group.entries.length, 0);
  const summary = el('div', 'gp-search__summary');
  summary.appendChild(el('span', 'gp-search__summary-text', t('search.results', { query: searchQuery })));
  if (total) summary.appendChild(el('span', 'gp-search__summary-count', String(total)));
  view.appendChild(summary);

  if (!total) {
    const empty = el('div', 'gp-search__empty');
    const icon = el('span', 'gp-search__empty-icon');
    icon.innerHTML = getIconSvg('search');
    empty.append(
      icon,
      el('p', 'gp-search__empty-title', t('search.empty', { query: searchQuery })),
      el('p', 'gp-search__empty-hint', t('search.emptyHint')),
    );
    view.appendChild(empty);
    return view;
  }

  for (const group of groups) {
    const section = el('section', 'gp-search__group');
    const head = el('div', 'gp-search__group-head');
    const icon = el('span', 'gp-search__group-icon');
    icon.innerHTML = getIconSvg(group.page.icon);
    head.append(
      icon,
      el('span', 'gp-search__group-title', t(group.page.labelKey)),
      el('span', 'gp-search__group-count', String(group.entries.length)),
    );
    section.appendChild(head);
    for (const entry of group.entries) {
      const item = el('button', 'gp-search__item');
      item.type = 'button';
      const title = el('span', 'gp-search__item-title');
      appendHighlighted(title, entry.title, tokens);
      item.appendChild(title);
      if (entry.hint) {
        const hint = el('span', 'gp-search__item-hint');
        appendHighlighted(hint, entry.hint, tokens);
        item.appendChild(hint);
      }
      item.addEventListener('click', () => openSearchTarget(group.id, entry.spot));
      section.appendChild(item);
    }
    view.appendChild(section);
  }
  return view;
}

function openSearchTarget(pageId, spot) {
  navigateToPage(pageId);
  if (spot === 'head') return;
  const target = document.querySelector(`#${PANEL_ID} .gp-panel__body [${SPOT_ATTR}="${spot}"]`);
  if (!target) return;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  target.classList.add('is-spotlit');
  clearTimeout(spotlightTimer);
  spotlightTimer = setTimeout(() => target.classList.remove('is-spotlit'), SPOTLIGHT_MS);
}

function setSearchValue(value) {
  searchQuery = value;
  const input = document.getElementById(SEARCH_ID);
  if (input && input.value !== value) input.value = value;
}

function performSearch() {
  const input = document.getElementById(SEARCH_ID);
  const value = input ? input.value.trim() : '';
  if (value === searchQuery) return;
  searchQuery = value;
  renderCurrentView();
}

function buildSearchBar() {
  const wrap = el('div', 'gp-searchbar');
  wrap.setAttribute('role', 'search');
  const icon = el('span', 'gp-searchbar__icon');
  icon.innerHTML = getIconSvg('search');

  const input = el('input', 'gp-searchbar__input');
  input.id = SEARCH_ID;
  input.type = 'search';
  input.placeholder = t('search.placeholder');
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', t('search.label'));
  input.addEventListener('input', performSearch);
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'Enter') return;
    const first = document.querySelector(`#${PANEL_ID} .gp-search__item`);
    if (!first) return;
    event.preventDefault();
    if (event.key === 'Enter') first.click();
    else first.focus();
  });

  const kbd = el('kbd', 'gp-searchbar__kbd', '/');
  kbd.setAttribute('aria-hidden', 'true');

  const clear = el('button', 'gp-searchbar__clear');
  clear.type = 'button';
  clear.innerHTML = getIconSvg('close');
  clear.title = t('search.clear');
  clear.setAttribute('aria-label', t('search.clear'));
  clear.addEventListener('click', () => {
    setSearchValue('');
    renderCurrentView();
    input.focus();
  });

  wrap.append(icon, input, kbd, clear);
  return wrap;
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
  header.append(brand, buildSearchBar(), close);

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

function isTypingTarget(node) {
  if (!(node instanceof HTMLElement)) return false;
  return node.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName);
}

function installPanelKeys() {
  if (escapeInstalled) return;
  escapeInstalled = true;
  document.addEventListener('keydown', (event) => {
    if (!panelOpen) return;
    // The confirm dialog and the viewer sit above the panel and own their keys.
    if (document.querySelector('.gp-confirm-overlay')) return;
    if (isViewerOpen()) return;
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      document.getElementById(SEARCH_ID)?.focus();
      return;
    }
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      document.getElementById(SEARCH_ID)?.focus();
      return;
    }
    if (event.key !== 'Escape') return;
    const input = document.getElementById(SEARCH_ID);
    if (input && document.activeElement === input && input.value) {
      event.preventDefault();
      event.stopPropagation();
      setSearchValue('');
      renderCurrentView({ keepScroll: true });
      return;
    }
    event.preventDefault();
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
  searchQuery = '';
  searchIndex = new Map();
  const overlay = ensurePanel();
  renderCurrentView();
  lockPageScroll();
  overlay.querySelector('.gp-panel')?.focus?.();
}

function closePanel() {
  if (!panelOpen) return;
  panelOpen = false;
  draft = null;
  clearTimeout(spotlightTimer);
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
  installPanelKeys();
  const shouldOpen = force === undefined ? !panelOpen : !!force;
  if (shouldOpen) openPanel();
  else closePanel();
}

export function isPanelOpen() {
  return panelOpen;
}
