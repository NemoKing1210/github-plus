import { t } from '../i18n/index.js';
import { el } from '../utils/dom.js';
import { downloadFile } from '../utils/download.js';
import { formatSize } from '../utils/size.js';
import { lockPageScroll, unlockPageScroll } from '../utils/scrollLock.js';
import { closeContextMenu, isContextMenuOpen, openContextMenu } from './contextMenu.js';
import { ACTION_ICONS, VIEWER_ICONS } from './icons.js';
import { showToast } from './toast.js';
import { isViewerOpen } from './viewer.js';

/**
 * Modal shell for the quick file preview: header tools, a content pane the
 * caller fills through `load`, and sibling navigation. The shell knows
 * nothing about file kinds — `load(file, { mode, signal })` returns
 * `{ node, meta?, copyText?, sourceMode?, dispose? }` and owns rendering.
 * One instance per page; opening while open switches the file list.
 */

const ROOT_ID = 'gp-file-preview-overlay';
const CLOSE_MS = 160;

/** @type {ReturnType<typeof buildShell> | null} */
let shell = null;
let state = null;
let closeTimer = null;

function tool(markup, label, tag = 'button') {
  const node = el(tag, 'gp-preview__tool');
  if (tag === 'button') node.type = 'button';
  node.innerHTML = markup;
  node.title = label;
  node.setAttribute('aria-label', label);
  return node;
}

function buildShell() {
  const root = el('div', 'gp-preview-overlay');
  root.id = ROOT_ID;
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');

  const dialog = el('div', 'gp-preview');
  dialog.tabIndex = -1;

  const heading = el('div', 'gp-preview__heading');
  const name = el('h2', 'gp-preview__name');
  const meta = el('p', 'gp-preview__meta');
  heading.append(name, meta);

  const segmented = el('div', 'gp-preview__seg');
  segmented.hidden = true;
  const segPreview = el('button', 'gp-preview__seg-btn');
  segPreview.type = 'button';
  segPreview.dataset.mode = 'preview';
  const segSource = el('button', 'gp-preview__seg-btn');
  segSource.type = 'button';
  segSource.dataset.mode = 'source';
  segmented.append(segPreview, segSource);

  const extra = el('div', 'gp-preview__extra');
  extra.hidden = true;

  const tools = el('div', 'gp-preview__tools');
  const openLink = tool(ACTION_ICONS.external, '', 'a');
  openLink.target = '_blank';
  openLink.rel = 'noopener noreferrer';
  const rawLink = tool(ACTION_ICONS.link, '', 'a');
  rawLink.target = '_blank';
  rawLink.rel = 'noopener noreferrer';
  const download = tool(ACTION_ICONS.download, '');
  const copy = tool(ACTION_ICONS.copy, '');
  const close = tool(VIEWER_ICONS.close, '', 'button');
  close.classList.add('gp-preview__tool--close');
  tools.append(openLink, rawLink, download, copy, close);

  const header = el('header', 'gp-preview__header');
  header.append(heading, segmented, extra, tools);

  const content = el('div', 'gp-preview__content');
  content.tabIndex = 0;
  const spinner = el('div', 'gp-preview__spinner');
  spinner.hidden = true;
  spinner.setAttribute('role', 'status');
  spinner.append(el('span', 'gp-preview__spinner-ring'), el('span', 'gp-preview__loading'));
  content.appendChild(spinner);

  const footer = el('footer', 'gp-preview__footer');
  const prev = el('button', 'gp-preview__nav');
  prev.type = 'button';
  prev.innerHTML = VIEWER_ICONS.chevronLeft;
  const counter = el('span', 'gp-preview__counter');
  counter.setAttribute('aria-live', 'polite');
  const next = el('button', 'gp-preview__nav');
  next.type = 'button';
  next.innerHTML = VIEWER_ICONS.chevronRight;
  footer.append(prev, counter, next);

  dialog.append(header, content, footer);
  root.appendChild(dialog);
  document.body.appendChild(root);

  root.addEventListener('click', (event) => {
    if (event.target === root) closeFilePreview();
  });
  segPreview.addEventListener('click', () => setMode('preview'));
  segSource.addEventListener('click', () => setMode('source'));
  download.addEventListener('click', () => downloadCurrent());
  copy.addEventListener('click', () => openCopyMenu());
  close.addEventListener('click', () => closeFilePreview());
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  return {
    root,
    dialog,
    name,
    meta,
    segmented,
    segPreview,
    segSource,
    extra,
    openLink,
    rawLink,
    download,
    copy,
    close,
    content,
    spinner,
    footer,
    prev,
    counter,
    next,
  };
}

function ensureShell() {
  if (!shell || !shell.root.isConnected) shell = buildShell();
  return shell;
}

function currentFile() {
  return state ? state.files[state.index] : null;
}

function refreshChrome() {
  const node = ensureShell();
  node.openLink.title = t('preview.open');
  node.openLink.setAttribute('aria-label', t('preview.open'));
  node.rawLink.title = t('preview.raw');
  node.rawLink.setAttribute('aria-label', t('preview.raw'));
  node.download.title = t('preview.download');
  node.download.setAttribute('aria-label', t('preview.download'));
  node.copy.title = t('fileMenu.copyContents');
  node.copy.setAttribute('aria-label', t('fileMenu.copyContents'));
  node.close.title = t('viewer.close');
  node.close.setAttribute('aria-label', t('viewer.close'));
  node.segPreview.textContent = t('preview.markdownPreview');
  node.segSource.textContent = t('preview.markdownSource');
  node.spinner.querySelector('.gp-preview__loading').textContent = t('preview.loading');
}

function refreshHeader(file) {
  const node = ensureShell();
  node.name.textContent = file.name;
  node.root.setAttribute('aria-label', `${t('preview.title')} — ${file.name}`);
  node.openLink.href = file.href || file.rawUrl;
  node.rawLink.href = file.rawUrl;
  node.meta.textContent = [file.relative, file.ref].filter(Boolean).join(' · ');
  refreshHeaderActions(file);
}

/**
 * Caller-supplied header actions may be static or depend on the file and
 * render mode. Rebuilding only when that pair changes keeps a static action
 * mounted while the user steps through a listing, and lets a markdown-only
 * action disappear on a source view or on a sibling of another kind.
 */
function refreshHeaderActions(file) {
  const node = ensureShell();
  if (state.headerActionsFile === file && state.headerActionsMode === state.mode) return;
  state.headerActionsFile = file;
  state.headerActionsMode = state.mode;
  const actions = typeof state.headerActions === 'function'
    ? state.headerActions(file, state.mode) || []
    : state.headerActions || [];
  while (node.extra.firstChild) node.extra.removeChild(node.extra.firstChild);
  actions.forEach((action) => node.extra.appendChild(action));
  node.extra.hidden = actions.length === 0;
}

function updateMeta(file, meta) {
  const parts = [file.relative, file.ref];
  if (meta?.lines) parts.push(t('preview.lines', { count: meta.lines }));
  if (meta?.size !== undefined && meta.size !== null) parts.push(formatSize(meta.size));
  shell.meta.textContent = parts.filter(Boolean).join(' · ');
}

function updateSegmented(sourceMode, mode) {
  shell.segmented.hidden = !sourceMode;
  shell.segPreview.setAttribute('aria-pressed', String(mode !== 'source'));
  shell.segSource.setAttribute('aria-pressed', String(mode === 'source'));
}

function renderFooter() {
  const { files, index } = state;
  const previous = files[index - 1];
  const upcoming = files[index + 1];
  shell.prev.disabled = !previous;
  shell.next.disabled = !upcoming;
  shell.prev.title = previous ? `${t('preview.prev')} — ${previous.name}` : t('preview.prev');
  shell.prev.setAttribute('aria-label', shell.prev.title);
  shell.next.title = upcoming ? `${t('preview.next')} — ${upcoming.name}` : t('preview.next');
  shell.next.setAttribute('aria-label', shell.next.title);
  shell.counter.textContent = t('preview.counter', { current: index + 1, total: files.length });
}

function setBusy(busy) {
  shell.content.setAttribute('aria-busy', String(busy));
  shell.spinner.hidden = !busy;
}

/** Replace the rendered surface, keeping the spinner as the pane's own child. */
function setContent(node) {
  const children = shell.content.children;
  for (let index = children.length - 1; index >= 0; index -= 1) {
    if (children[index] !== shell.spinner) children[index].remove();
  }
  if (node) shell.content.appendChild(node);
}

function failureCard(file) {
  const card = el('div', 'gp-preview__card');
  const icon = el('div', 'gp-preview__card-icon');
  icon.innerHTML = ACTION_ICONS.open;
  card.append(icon, el('h3', 'gp-preview__card-title', t('preview.failed')));
  card.append(el('p', 'gp-preview__card-desc', t('preview.failedDesc')));
  const actions = el('div', 'gp-preview__card-actions');
  const open = el('a', 'gp-preview__card-action', t('preview.open'));
  open.href = file.href || file.rawUrl;
  open.target = '_blank';
  open.rel = 'noopener noreferrer';
  const raw = el('a', 'gp-preview__card-action', t('preview.raw'));
  raw.href = file.rawUrl;
  raw.target = '_blank';
  raw.rel = 'noopener noreferrer';
  actions.append(open, raw);
  card.appendChild(actions);
  return card;
}

function paintFailure(file) {
  updateMeta(file, null);
  updateSegmented(false, 'preview');
  setContent(failureCard(file));
  shell.content.scrollTop = 0;
}

function paint(result, file) {
  updateMeta(file, result.meta);
  updateSegmented(result.sourceMode, state.mode);
  setContent(result.node);
  shell.content.scrollTop = 0;
}

async function show(index, mode = 'preview') {
  if (!state) return;
  const file = state.files[index];
  if (!file) return;
  state.index = index;
  state.mode = mode;
  state.abort?.abort();
  const controller = new AbortController();
  state.abort = controller;
  const token = (state.token += 1);
  refreshHeader(file);
  renderFooter();
  setBusy(true);
  try {
    const result = await state.load(file, { mode, signal: controller.signal });
    if (!state || token !== state.token) {
      result?.dispose?.();
      return;
    }
    state.result?.dispose?.();
    state.result = result;
    paint(result, file);
  } catch (error) {
    if (!state || token !== state.token || error?.name === 'AbortError') return;
    state.result?.dispose?.();
    state.result = null;
    paintFailure(file);
  } finally {
    if (state && token === state.token) setBusy(false);
  }
}

function move(delta) {
  if (!state) return;
  const next = state.index + delta;
  if (next < 0 || next >= state.files.length) return;
  show(next);
}

function setMode(mode) {
  if (!state || state.mode === mode) return;
  show(state.index, mode);
}

function downloadCurrent() {
  const file = currentFile();
  if (file) downloadFile(file.rawUrl, file.name);
}

async function writeClipboard(text, titleKey, messageKey, vars) {
  try {
    await navigator.clipboard.writeText(text);
    showToast({ type: 'success', title: t(titleKey), message: t(messageKey, vars) });
  } catch {
    showToast({
      type: 'error',
      title: t('fileMenu.copyFailed'),
      message: t('fileMenu.copyFailedDesc'),
    });
  }
}

function openCopyMenu() {
  const file = currentFile();
  if (!file) return;
  const copyText = state?.result?.copyText;
  const rect = shell.copy.getBoundingClientRect();
  openContextMenu({
    x: rect.left,
    y: rect.bottom + 4,
    label: t('fileMenu.menuLabel', { name: file.name }),
    // The preview overlay sits above a normal page menu.
    elevated: true,
    items: [
      {
        label: t('fileMenu.copyContents'),
        disabled: !copyText,
        onSelect: () => writeClipboard(
          copyText,
          'fileMenu.contentCopied',
          'fileMenu.contentCopiedDesc',
          { name: file.name },
        ),
      },
      {
        label: t('fileMenu.copyLink'),
        onSelect: () => writeClipboard(file.href || file.rawUrl, 'fileMenu.linkCopied', 'fileMenu.linkCopiedDesc'),
      },
      {
        label: t('fileMenu.copyPath'),
        onSelect: () => writeClipboard(file.relative, 'fileMenu.pathCopied', 'fileMenu.pathCopiedDesc'),
      },
    ],
  });
}

function focusables() {
  const nodes = shell.root.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
  const list = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.hidden || node.disabled || !node.getClientRects().length) continue;
    list.push(node);
  }
  return list;
}

function trapFocus(event) {
  const list = focusables();
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
  // The copy menu owns its keys while it is open.
  if (!state || isContextMenuOpen()) return;
  // The image viewer sits above the preview: it owns Escape and the arrow keys
  // until it closes, otherwise one Escape would close both overlays.
  if (isViewerOpen()) return;
  const tag = event.target instanceof Element ? event.target.tagName : '';
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
  if (event.key === 'Tab') {
    trapFocus(event);
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    closeFilePreview();
    return;
  }
  if (state.files.length < 2) return;
  const active = document.activeElement;
  // The content pane scrolls with the arrow keys and owns the keys of a
  // focused player, so navigation would fight it there.
  if (active === shell.content || (active && shell.content.contains(active))) return;
  const keys = {
    ArrowLeft: () => move(-1),
    ArrowRight: () => move(1),
    Home: () => show(0),
    End: () => show(state.files.length - 1),
  };
  const action = keys[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

/**
 * Open the preview over the current page.
 * @param {{files: Array<{name: string, href: string, rawUrl: string,
 *   relative: string, ref?: string}>, index?: number,
 *   load: (file: object, options: {mode: string, signal: AbortSignal}) => Promise<object>,
 *   headerActions?: Array<HTMLElement> | ((file: object, mode: string) => Array<HTMLElement>)}} options
 * @returns {boolean} whether the preview opened
 */
export function openFilePreview({ files, index = 0, load, headerActions = [] }) {
  const list = Array.isArray(files) ? files.filter((file) => file && file.rawUrl) : [];
  if (!list.length || typeof load !== 'function') return false;
  const node = ensureShell();
  clearTimeout(closeTimer);
  node.root.classList.remove('is-closing');
  const opening = !state;
  if (opening) {
    state = {
      focusReturn: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      result: null,
      abort: null,
      token: 0,
      mode: 'preview',
      headerActions: [],
      headerActionsFile: null,
      headerActionsMode: null,
    };
    document.addEventListener('keydown', onKeyDown);
    lockPageScroll();
  }
  state.files = list;
  state.index = Math.min(Math.max(0, Number(index) || 0), list.length - 1);
  state.load = load;
  state.headerActions = headerActions;
  state.headerActionsFile = null;
  state.headerActionsMode = null;
  state.result?.dispose?.();
  state.result = null;
  state.abort?.abort();
  state.abort = null;
  refreshChrome();
  renderFooter();
  node.root.hidden = false;
  show(state.index, 'preview');
  node.dialog.focus?.();
  return true;
}

/** Close the preview and release everything it held. */
export function closeFilePreview() {
  if (!state) return;
  const focusReturn = state.focusReturn;
  state.abort?.abort();
  state.result?.dispose?.();
  state = null;
  document.removeEventListener('keydown', onKeyDown);
  closeContextMenu();
  if (shell) {
    setContent(null);
    setBusy(false);
    shell.root.classList.add('is-closing');
  }
  unlockPageScroll();
  closeTimer = setTimeout(() => {
    if (state || !shell) return;
    shell.root.hidden = true;
    shell.root.classList.remove('is-closing');
  }, CLOSE_MS);
  if (focusReturn && focusReturn.isConnected) focusReturn.focus({ preventScroll: true });
}

export function isFilePreviewOpen() {
  return !!state;
}
