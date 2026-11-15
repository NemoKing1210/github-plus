import { t } from '../i18n/index.js';
import { el } from '../utils/dom.js';
import { downloadImage } from '../utils/download.js';
import { lockPageScroll, unlockPageScroll } from '../utils/scrollLock.js';
import { VIEWER_ICONS } from './icons.js';

/**
 * Fullscreen image viewer for injected content: fit-to-screen by default with
 * zoom, pan, rotate, a thumbnail strip and gallery navigation (ViewerJS-style,
 * GitHub-themed). One instance; opening while open replaces the gallery.
 *
 * The image can be dragged at any zoom — including when it fits the stage —
 * and the offset is clamped so it never leaves the stage entirely.
 *
 * @typedef {Object} ViewerImage
 * @property {string} src        URL to display
 * @property {string} [link]     URL the “open” tool points at (defaults to `src`)
 * @property {string} [title]    caption shown in the viewer bar
 * @property {string} [alt]      alternative text
 * @property {string} [fullSrc]  higher-resolution source for `resolveImage` callers
 */

const ROOT_ID = 'gp-viewer-overlay';
const HELP_ID = 'gp-viewer-help';
/** Smallest scale relative to fit, so an image can shrink below its own size. */
const MIN_ZOOM = 0.25;
/** Zoom stops shared by the buttons and the keyboard. */
const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16];
/** Pointer travel that turns a press into a drag (and so not into a click). */
const DRAG_THRESHOLD = 3;
const ROTATION_STEP = 90;

const HELP_ROWS = [
  { keys: ['←', '→'], labelKey: 'shortcutBrowse' },
  { keys: ['+', '−'], labelKey: 'shortcutZoom' },
  { keys: ['R'], labelKey: 'rotate' },
  { keys: ['0'], labelKey: 'reset' },
  { keys: ['?'], labelKey: 'help' },
  { keys: ['Esc'], labelKey: 'close' },
];

const LABEL_KEYS = {
  'zoom-out': 'zoomOut',
  'zoom-in': 'zoomIn',
  rotate: 'rotate',
  fit: 'reset',
  close: 'close',
  prev: 'prev',
  next: 'next',
  open: 'open',
  download: 'download',
};

const defaults = {
  images: [],
  index: 0,
  loop: true,
  thumbnails: true,
  download: true,
  minZoom: MIN_ZOOM,
  maxZoom: 8,
  labels: null,
  resolveImage: null,
  onClose: null,
};

/** @type {ReturnType<typeof buildState> | null} */
let state = null;
let listenersInstalled = false;

function buildState(options) {
  // Copy into a plain array of this realm: the gallery may arrive as an
  // array-like, and every consumer below indexes it directly (no iterator
  // protocol), so a sandboxed or foreign array can never break the viewer.
  const source = Array.isArray(options.images) ? options.images : [];
  const images = [];
  for (let i = 0; i < source.length; i += 1) {
    const image = source[i];
    if (image && typeof image.src === 'string' && image.src) images.push(image);
  }
  return {
    images,
    index: Math.min(Math.max(0, Number(options.index) || 0), Math.max(0, images.length - 1)),
    opts: { ...defaults, ...options },
    zoom: 1,
    rotation: 0,
    offset: { x: 0, y: 0 },
    helpOpen: false,
    pointers: new Map(),
    drag: null,
    pinch: null,
    press: null,
    token: 0,
    focusReturn: document.activeElement instanceof HTMLElement ? document.activeElement : null,
  };
}

function label(key, vars) {
  return state?.opts.labels?.[key] || t(`viewer.${key}`, vars);
}

function parts() {
  const root = document.getElementById(ROOT_ID);
  return {
    root,
    dialog: root?.querySelector('.gp-viewer'),
    title: root?.querySelector('[data-gp-viewer="title"]'),
    size: root?.querySelector('[data-gp-viewer="size"]'),
    counter: root?.querySelector('[data-gp-viewer="counter"]'),
    stage: root?.querySelector('[data-gp-viewer="stage"]'),
    image: root?.querySelector('[data-gp-viewer="image"]'),
    spinner: root?.querySelector('[data-gp-viewer="spinner"]'),
    status: root?.querySelector('[data-gp-viewer="status"]'),
    statusText: root?.querySelector('[data-gp-viewer="status-text"]'),
    statusLink: root?.querySelector('[data-gp-viewer="status-link"]'),
    thumbs: root?.querySelector('[data-gp-viewer="thumbs"]'),
    help: root?.querySelector('[data-gp-viewer="help-card"]'),
    helpButton: root?.querySelector('[data-gp-viewer="help"]'),
    prev: root?.querySelector('[data-gp-viewer="prev"]'),
    next: root?.querySelector('[data-gp-viewer="next"]'),
    open: root?.querySelector('[data-gp-viewer="open"]'),
    download: root?.querySelector('[data-gp-viewer="download"]'),
    zoom: root?.querySelector('[data-gp-viewer="zoom"]'),
  };
}

function toolButton(action, icon, labelKey, extraClass = '', tag = 'button') {
  const node = el(tag, `gp-viewer__tool ${extraClass}`.trim());
  if (tag === 'button') node.type = 'button';
  node.dataset.gpViewer = action;
  node.innerHTML = VIEWER_ICONS[icon] || '';
  node.title = label(labelKey);
  node.setAttribute('aria-label', label(labelKey));
  return node;
}

function ensureOverlay() {
  const existing = document.getElementById(ROOT_ID);
  if (existing) return existing;

  const root = el('div', 'gp-viewer-overlay');
  root.id = ROOT_ID;
  root.hidden = true;

  const dialog = el('div', 'gp-viewer');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', t('viewer.title'));
  dialog.tabIndex = -1;

  const bar = el('div', 'gp-viewer__bar');
  const meta = el('div', 'gp-viewer__meta');
  const title = el('span', 'gp-viewer__title');
  title.dataset.gpViewer = 'title';
  const size = el('span', 'gp-viewer__size');
  size.dataset.gpViewer = 'size';
  size.hidden = true;
  const counter = el('span', 'gp-viewer__counter');
  counter.dataset.gpViewer = 'counter';
  counter.setAttribute('aria-live', 'polite');
  counter.hidden = true;
  meta.append(title, size, counter);

  const zoom = el('button', 'gp-viewer__zoom');
  zoom.type = 'button';
  zoom.dataset.gpViewer = 'zoom';
  zoom.textContent = '100%';

  const openTool = toolButton('open', 'external', 'open', '', 'a');
  openTool.target = '_blank';
  openTool.rel = 'noopener noreferrer';
  openTool.hidden = true;

  const downloadTool = toolButton('download', 'download', 'download');
  downloadTool.hidden = true;

  const helpTool = toolButton('help', 'help', 'help', 'gp-viewer__tool--help');
  helpTool.setAttribute('aria-expanded', 'false');
  helpTool.setAttribute('aria-controls', HELP_ID);

  const tools = el('div', 'gp-viewer__tools');
  tools.append(
    toolButton('zoom-out', 'zoomOut', 'zoomOut'),
    zoom,
    toolButton('zoom-in', 'zoomIn', 'zoomIn'),
    el('span', 'gp-viewer__sep'),
    toolButton('rotate', 'rotate', 'rotate'),
    toolButton('fit', 'fit', 'reset'),
    el('span', 'gp-viewer__sep'),
    openTool,
    downloadTool,
    helpTool,
    toolButton('close', 'close', 'close', 'gp-viewer__tool--close'),
  );
  bar.append(meta, tools);

  const stage = el('div', 'gp-viewer__stage');
  stage.dataset.gpViewer = 'stage';
  const prev = el('button', 'gp-viewer__nav gp-viewer__nav--prev');
  prev.type = 'button';
  prev.dataset.gpViewer = 'prev';
  prev.innerHTML = VIEWER_ICONS.chevronLeft;
  prev.title = label('prev');
  prev.setAttribute('aria-label', label('prev'));
  const next = el('button', 'gp-viewer__nav gp-viewer__nav--next');
  next.type = 'button';
  next.dataset.gpViewer = 'next';
  next.innerHTML = VIEWER_ICONS.chevronRight;
  next.title = label('next');
  next.setAttribute('aria-label', label('next'));
  const image = el('img', 'gp-viewer__image');
  image.dataset.gpViewer = 'image';
  image.alt = '';
  image.draggable = false;
  const spinner = el('span', 'gp-viewer__spinner');
  spinner.dataset.gpViewer = 'spinner';

  const status = el('div', 'gp-viewer__status');
  status.dataset.gpViewer = 'status';
  status.hidden = true;
  status.setAttribute('role', 'alert');
  const statusIcon = el('span', 'gp-viewer__status-icon');
  statusIcon.innerHTML = VIEWER_ICONS.imageOff;
  const statusText = el('p', 'gp-viewer__status-text');
  statusText.dataset.gpViewer = 'status-text';
  const statusLink = el('a', 'gp-viewer__status-link');
  statusLink.dataset.gpViewer = 'status-link';
  statusLink.target = '_blank';
  statusLink.rel = 'noopener noreferrer';
  statusLink.hidden = true;
  status.append(statusIcon, statusText, statusLink);

  const help = el('div', 'gp-viewer__help');
  help.id = HELP_ID;
  help.dataset.gpViewer = 'help-card';
  help.hidden = true;
  help.tabIndex = -1;
  help.setAttribute('role', 'dialog');
  help.setAttribute('aria-label', label('help'));

  stage.append(prev, image, spinner, status, next, help);

  const thumbs = el('div', 'gp-viewer__thumbs');
  thumbs.dataset.gpViewer = 'thumbs';
  thumbs.setAttribute('aria-label', t('viewer.thumbs'));

  dialog.append(bar, stage, thumbs);
  root.appendChild(dialog);
  document.body.appendChild(root);
  return root;
}

/** Displayed scale relative to the image's natural pixels (1 = 100%). */
function baseScale() {
  const { image } = parts();
  if (!state || !image || !image.naturalWidth || !image.clientWidth) return 1;
  return image.clientWidth / image.naturalWidth;
}

function zoomPercent() {
  if (!state) return 100;
  return Math.max(1, Math.round(baseScale() * state.zoom * 100));
}

function paint() {
  const { dialog, image, counter, thumbs, prev, next, open, download, zoom } = parts();
  if (!state || !dialog || !image) return;
  const { zoom: scale, rotation, offset, images, index } = state;

  // The image can be dragged at any zoom; the offset is clamped so it slides
  // inside the stage without ever leaving it.
  const stage = image.parentElement;
  const swapped = rotation % 180 !== 0;
  const width = (swapped ? image.clientHeight : image.clientWidth) * scale;
  const height = (swapped ? image.clientWidth : image.clientHeight) * scale;
  const maxX = Math.abs(stage.clientWidth - width) / 2;
  const maxY = Math.abs(stage.clientHeight - height) / 2;
  offset.x = Math.min(maxX, Math.max(-maxX, offset.x));
  offset.y = Math.min(maxY, Math.max(-maxY, offset.y));
  const moved = offset.x !== 0 || offset.y !== 0;
  image.style.transform = !moved && scale === 1 && rotation % 360 === 0
    ? ''
    : `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`;
  dialog.classList.toggle('is-rotated', rotation % 360 !== 0);

  if (counter) {
    const multiple = images.length > 1;
    counter.hidden = !multiple;
    counter.textContent = multiple ? label('counter', { current: index + 1, total: images.length }) : '';
  }
  if (zoom) {
    const atActualSize = Math.abs(zoomPercent() - 100) <= 1;
    const target = atActualSize ? 'fit' : 'actualSize';
    zoom.textContent = `${zoomPercent()}%`;
    zoom.title = label(target);
    zoom.setAttribute('aria-label', label(target));
  }
  if (open) {
    const item = images[index];
    const href = (item && (item.link || item.src)) || '';
    open.hidden = !href;
    if (href) open.href = href;
    else open.removeAttribute('href');
  }
  if (download) {
    download.hidden = state.opts.download === false || !(images[index] && images[index].src);
  }
  const multiple = images.length > 1;
  if (prev) prev.hidden = !multiple;
  if (next) next.hidden = !multiple;
  if (prev) prev.disabled = !multiple || (!state.opts.loop && index === 0);
  if (next) next.disabled = !multiple || (!state.opts.loop && index === images.length - 1);

  if (thumbs) {
    thumbs.hidden = state.opts.thumbnails === false || !multiple;
    const buttons = thumbs.querySelectorAll('[data-gp-viewer-thumb]');
    for (let i = 0; i < buttons.length; i += 1) {
      buttons[i].classList.toggle('is-active', Number(buttons[i].dataset.gpViewerThumb) === index);
    }
    thumbs.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
}

function preload() {
  if (!state || state.images.length < 2) return;
  const next = state.images[wrap(state.index + 1)];
  if (next) new Image().src = next.src;
  const previous = state.images[wrap(state.index - 1)];
  if (previous) new Image().src = previous.src;
}

function refreshLabels() {
  const { root, dialog, help, helpButton } = parts();
  if (!root) return;
  const nodes = root.querySelectorAll('[data-gp-viewer]');
  for (let i = 0; i < nodes.length; i += 1) {
    const key = LABEL_KEYS[nodes[i].dataset.gpViewer];
    if (!key) continue;
    nodes[i].title = label(key);
    nodes[i].setAttribute('aria-label', label(key));
  }
  if (dialog) dialog.setAttribute('aria-label', label('title'));
  if (help) help.setAttribute('aria-label', label('help'));
  if (helpButton) {
    helpButton.title = label('help');
    helpButton.setAttribute('aria-label', label('help'));
  }
  const thumbs = root.querySelector('[data-gp-viewer="thumbs"]');
  if (thumbs) thumbs.setAttribute('aria-label', label('thumbs'));
  buildHelp();
}

function buildHelp() {
  const { help } = parts();
  if (!help) return;
  help.textContent = '';
  const head = el('div', 'gp-viewer__help-head');
  const title = el('span', 'gp-viewer__help-title', label('help'));
  const close = el('button', 'gp-viewer__help-close');
  close.type = 'button';
  close.dataset.gpViewer = 'help-close';
  close.innerHTML = VIEWER_ICONS.close;
  close.title = label('close');
  close.setAttribute('aria-label', label('close'));
  head.append(title, close);
  const list = el('div', 'gp-viewer__help-list');
  for (let i = 0; i < HELP_ROWS.length; i += 1) {
    const row = el('div', 'gp-viewer__help-row');
    const text = el('span', 'gp-viewer__help-label', label(HELP_ROWS[i].labelKey));
    const keys = el('span', 'gp-viewer__help-keys');
    for (let k = 0; k < HELP_ROWS[i].keys.length; k += 1) {
      keys.appendChild(el('kbd', null, HELP_ROWS[i].keys[k]));
    }
    row.append(text, keys);
    list.appendChild(row);
  }
  help.append(head, list);
}

function syncHelpButton() {
  const { helpButton } = parts();
  if (helpButton) helpButton.setAttribute('aria-expanded', state?.helpOpen ? 'true' : 'false');
}

function toggleHelp(open) {
  if (!state) return;
  const next = typeof open === 'boolean' ? open : !state.helpOpen;
  state.helpOpen = next;
  const { help, helpButton } = parts();
  if (help) {
    const hadFocus = help.contains(document.activeElement);
    help.hidden = !next;
    if (next) help.focus();
    else if (hadFocus) helpButton?.focus();
  }
  syncHelpButton();
}

function buildThumbs() {
  const { thumbs } = parts();
  if (!thumbs) return;
  thumbs.textContent = '';
  for (let index = 0; index < state.images.length; index += 1) {
    const item = state.images[index];
    const button = el('button', 'gp-viewer__thumb');
    button.type = 'button';
    button.dataset.gpViewerThumb = String(index);
    button.title = item.title || item.alt || label('imageTitle', { current: index + 1 });
    button.setAttribute('aria-label', label('imageTitle', { current: index + 1 }));
    const image = el('img', 'gp-viewer__thumb-img');
    image.src = item.src;
    image.alt = '';
    image.loading = 'lazy';
    image.draggable = false;
    const fallback = el('span', 'gp-viewer__thumb-fallback');
    fallback.innerHTML = VIEWER_ICONS.imageOff;
    image.addEventListener('error', () => {
      button.classList.add('is-broken');
      image.hidden = true;
    });
    button.append(image, fallback);
    thumbs.appendChild(button);
  }
}

function resetView() {
  state.zoom = 1;
  state.rotation = 0;
  state.offset = { x: 0, y: 0 };
  paint();
}

function show(index) {
  if (!state || !state.images.length) return;
  state.index = wrap(index);
  state.token += 1;
  state.helpOpen = false;
  const item = state.images[state.index];
  const { image, spinner, status, title, size, help, open } = parts();
  resetView();
  if (help) help.hidden = true;
  syncHelpButton();
  if (title) title.textContent = item.title || item.alt || label('imageTitle', { current: state.index + 1 });
  if (size) {
    size.hidden = true;
    size.textContent = '';
  }
  if (status) status.hidden = true;
  if (spinner) spinner.hidden = false;
  if (open) open.hidden = true;
  image.classList.add('is-loading');
  image.src = item.src;
  image.alt = item.alt || item.title || '';
  preload();
  void upgrade(state.token, state.index, item);
  paint();
}

/**
 * Optional `resolveImage` hook: ask the caller for a higher-resolution source
 * of the image being shown and swap it in without resetting the view.
 */
async function upgrade(token, index, item) {
  const resolve = state?.opts.resolveImage;
  if (!resolve || !item) return;
  let better = null;
  try {
    better = await resolve(item, index);
  } catch {
    return;
  }
  const { image, spinner, thumbs, size } = parts();
  if (!better || better === item.src || !state || state.token !== token || state.index !== index) return;
  state.images[index] = { ...item, src: better };
  if (spinner) spinner.hidden = false;
  if (size) {
    size.hidden = true;
    size.textContent = '';
  }
  image?.classList.add('is-loading');
  if (image) image.src = better;
  const thumb = thumbs?.querySelector(`[data-gp-viewer-thumb="${index}"] img`);
  if (thumb) {
    thumb.hidden = false;
    thumb.parentElement?.classList.remove('is-broken');
    thumb.src = better;
  }
}

function wrap(index) {
  const total = state.images.length;
  if (!total) return 0;
  if (state.opts.loop) return ((index % total) + total) % total;
  return Math.min(total - 1, Math.max(0, index));
}

function step(delta) {
  if (!state) return;
  const next = state.index + delta;
  if (!state.opts.loop && (next < 0 || next >= state.images.length)) return;
  show(next);
}

function zoomLevels() {
  const levels = [];
  for (let i = 0; i < ZOOM_LEVELS.length; i += 1) {
    const level = ZOOM_LEVELS[i];
    if (level >= state.opts.minZoom && level <= state.opts.maxZoom) levels.push(level);
  }
  if (!levels.length) levels.push(state.opts.minZoom);
  return levels;
}

/**
 * Move one stop up or down. An anchor (stage-relative point) keeps the pixel
 * under the cursor fixed while the scale changes.
 */
function zoomStep(direction, anchor = null) {
  if (!state) return;
  const levels = zoomLevels();
  const current = state.zoom;
  let next = current;
  if (direction > 0) {
    for (let i = 0; i < levels.length; i += 1) {
      if (levels[i] > current + 0.001) {
        next = levels[i];
        break;
      }
    }
    if (next === current) next = levels[levels.length - 1];
  } else {
    for (let i = levels.length - 1; i >= 0; i -= 1) {
      if (levels[i] < current - 0.001) {
        next = levels[i];
        break;
      }
    }
    if (next === current) next = levels[0];
  }
  setZoom(next, anchor);
}

function setZoom(zoom, anchor = null) {
  if (!state) return;
  const from = state.zoom;
  const to = Math.min(state.opts.maxZoom, Math.max(state.opts.minZoom, Number(zoom.toFixed(3))));
  if (anchor && from > 0) {
    const factor = to / from;
    state.offset = {
      x: anchor.x + factor * (state.offset.x - anchor.x),
      y: anchor.y + factor * (state.offset.y - anchor.y),
    };
  }
  state.zoom = to;
  paint();
}

/** Stage-relative coordinates of a pointer, for anchored zoom. */
function anchorAt(event) {
  const stage = parts().stage;
  if (!stage) return null;
  const rect = stage.getBoundingClientRect();
  return {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2,
  };
}

/** Toggle between fit-to-screen and the image's natural pixels. */
function toggleActualSize(anchor = null) {
  if (!state) return;
  if (Math.abs(zoomPercent() - 100) <= 1) {
    resetView();
    return;
  }
  setZoom(1 / baseScale(), anchor);
}

function rotate() {
  if (!state) return;
  state.rotation = (state.rotation + ROTATION_STEP) % 360;
  paint();
}

function close() {
  if (!state) return;
  const { root } = parts();
  const { focusReturn, opts } = state;
  state = null;
  if (root) root.hidden = true;
  document.removeEventListener('keydown', onKeyDown);
  unlockPageScroll();
  focusReturn?.focus?.();
  opts.onClose?.();
}

function focusables() {
  const { root } = parts();
  if (!root) return [];
  const nodes = root.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
  const list = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
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
  if (!state) return;
  const tag = event.target instanceof Element ? event.target.tagName : '';
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
  if (event.key === 'Tab') {
    trapFocus(event);
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    if (state.helpOpen) toggleHelp(false);
    else close();
    return;
  }
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const keys = {
    ArrowLeft: () => step(-1),
    ArrowRight: () => step(1),
    Home: () => show(0),
    End: () => show(state.images.length - 1),
    '+': () => zoomStep(1),
    '=': () => zoomStep(1),
    '-': () => zoomStep(-1),
    '0': resetView,
    r: rotate,
    '?': () => toggleHelp(),
    h: () => toggleHelp(),
  };
  const action = keys[key];
  if (!action) return;
  event.preventDefault();
  action();
}

function onWheel(event) {
  if (!state) return;
  event.preventDefault();
  // Continuous zoom: a mouse notch and a trackpad's small deltas both feel
  // proportional. deltaMode 1/2 are lines/pages and need normalizing.
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
  setZoom(state.zoom * Math.exp(-event.deltaY * unit * 0.0015), anchorAt(event));
}

function onDoubleClick(event) {
  if (!state) return;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('button, a[href], .gp-viewer__help')) return;
  toggleActualSize(anchorAt(event));
}

/** Two active pointers as `[a, b]` (pinch), or null. */
function activePair() {
  const points = [];
  state.pointers.forEach((point) => points.push(point));
  return points.length === 2 ? points : null;
}

function onPointerDown(event) {
  if (!state) return;
  const pressed = event.target instanceof Element ? event.target : null;
  // Controls inside the stage (arrows, the status link) own their clicks:
  // capturing the pointer here would retarget the click to the stage and
  // close the viewer or swallow the link.
  const onControl = !!(pressed && pressed.closest('button, a[href]'));
  state.press = {
    control: onControl,
    image: !!(pressed && pressed.closest('[data-gp-viewer="image"]')),
    help: !!(pressed && pressed.closest('.gp-viewer__help')),
    status: !!(pressed && pressed.closest('.gp-viewer__status')),
    moved: false,
  };
  if (onControl) return;
  const stage = parts().stage;
  stage?.setPointerCapture?.(event.pointerId);
  state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const pair = activePair();
  if (pair) {
    state.pinch = {
      distance: Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1,
      zoom: state.zoom,
    };
    state.drag = null;
    return;
  }
  state.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: state.offset.x, oy: state.offset.y };
}

function onPointerMove(event) {
  if (!state?.pointers.has(event.pointerId)) return;
  state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const pair = state.pinch ? activePair() : null;
  if (state.pinch && pair) {
    const distance = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1;
    setZoom(state.pinch.zoom * (distance / state.pinch.distance));
    return;
  }
  if (!state.drag || state.drag.id !== event.pointerId) return;
  const dx = event.clientX - state.drag.x;
  const dy = event.clientY - state.drag.y;
  if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) state.press.moved = true;
  state.offset = { x: state.drag.ox + dx, y: state.drag.oy + dy };
  const { dialog } = parts();
  dialog?.classList.add('is-dragging');
  paint();
}

function onPointerUp(event) {
  if (!state) return;
  const drag = state.drag;
  state.pointers.delete(event.pointerId);
  if (state.pointers.size < 2) state.pinch = null;
  if (!drag || drag.id !== event.pointerId) return;
  state.drag = null;
  parts().stage?.releasePointerCapture?.(event.pointerId);
  parts().dialog?.classList.remove('is-dragging');
}

function onOverlayClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const pressed = state?.press ?? null;
  if (state) state.press = null;
  // A drag (pan) is not a click: never act on it.
  if (pressed?.moved) return;
  // The error card and its link own their clicks for the same reason.
  if (pressed?.status) return;
  const action = target.closest('[data-gp-viewer]')?.dataset.gpViewer;
  if (action === 'help-close') return toggleHelp(false);
  // A click on the help card itself must not fall through to "close".
  if (pressed?.help && action !== 'help') return;
  if (state?.helpOpen && !target.closest('.gp-viewer__help') && action !== 'help') {
    toggleHelp(false);
    if (!action || action === 'stage' || action === 'image') return;
  }
  if (action === 'close') return close();
  if (action === 'prev') return step(-1);
  if (action === 'next') return step(1);
  if (action === 'zoom-in') return zoomStep(1);
  if (action === 'zoom-out') return zoomStep(-1);
  if (action === 'zoom') return toggleActualSize();
  if (action === 'fit') return resetView();
  if (action === 'rotate') return rotate();
  if (action === 'help') return toggleHelp();
  if (action === 'download') {
    const item = state?.images[state.index];
    if (item && item.src) void downloadImage(item.src);
    return;
  }
  const thumb = target.closest('[data-gp-viewer-thumb]');
  if (thumb) return show(Number(thumb.dataset.gpViewerThumb));
  // The pointer was captured by the stage, so a click on the image also
  // reports the stage as its target — never treat that as "close".
  if (pressed?.image || action === 'image') return;
  if (action === 'stage' || target === parts().root) close();
}

function onImageLoad() {
  const { spinner, status, size, image } = parts();
  if (spinner) spinner.hidden = true;
  if (status) status.hidden = true;
  image?.classList.remove('is-loading');
  if (size && image && image.naturalWidth) {
    size.textContent = label('size', { width: image.naturalWidth, height: image.naturalHeight });
    size.hidden = false;
  }
  paint();
}

function onImageError() {
  const { spinner, status, statusText, statusLink, image } = parts();
  if (spinner) spinner.hidden = true;
  image?.classList.remove('is-loading');
  const item = state?.images[state.index];
  const href = (item && (item.link || item.src)) || '';
  if (statusText) statusText.textContent = label('failed');
  if (statusLink) {
    statusLink.textContent = label('open');
    statusLink.hidden = !href;
    if (href) statusLink.href = href;
    else statusLink.removeAttribute('href');
  }
  if (status) status.hidden = false;
}

function installListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  const { root, stage, image, thumbs, help } = parts();
  root?.addEventListener('click', onOverlayClick);
  stage?.addEventListener('wheel', onWheel, { passive: false });
  stage?.addEventListener('pointerdown', onPointerDown);
  stage?.addEventListener('pointermove', onPointerMove);
  stage?.addEventListener('pointerup', onPointerUp);
  stage?.addEventListener('pointercancel', onPointerUp);
  stage?.addEventListener('dblclick', onDoubleClick);
  image?.addEventListener('load', onImageLoad);
  image?.addEventListener('error', onImageError);
  // The help card floats over the stage; wheel/drag there must not reach the
  // zoom and pan handlers.
  help?.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
  help?.addEventListener('pointerdown', (event) => event.stopPropagation());
  thumbs?.addEventListener('wheel', (event) => event.stopPropagation());
}

/**
 * Open the viewer over the current page.
 * @param {typeof defaults & { images: ViewerImage[] }} options
 */
export function openViewer(options = {}) {
  const next = buildState({ ...defaults, ...options });
  if (!next.images.length) return false;
  ensureOverlay();
  installListeners();
  if (!state) {
    document.addEventListener('keydown', onKeyDown);
    lockPageScroll();
  }
  state = next;
  const { root, dialog } = parts();
  root.hidden = false;
  refreshLabels();
  buildThumbs();
  show(next.index);
  dialog?.focus?.();
  return true;
}

export function closeViewer() {
  close();
}

export function isViewerOpen() {
  return !!state;
}
