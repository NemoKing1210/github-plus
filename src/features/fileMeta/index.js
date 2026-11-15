import { on } from '../../core/bus.js';
import { Codes, logInfo, logWarn } from '../../core/debug.js';
import { getFileMetaSettings } from '../../core/settings.js';
import { debounce } from '../../utils/dom.js';
import { downloadFile } from '../../utils/download.js';
import { watchNavigation } from '../../utils/navigation.js';
import { t } from '../../i18n/index.js';
import { clearMeta, placeCell, placeHead, renderMeta, setMetaSize } from './inject.js';
import { formatSize } from './size.js';
import { SURFACES } from './surfaces.js';

/**
 * File sizes and downloads in a column of their own in the repository file
 * tree. The column is appended to each row and labelled in the table header,
 * so GitHub's own cells keep their width and meaning.
 *
 * The blob page is deliberately not a surface: GitHub already shows a file's
 * size and a download button in its own file header, so decorating it would
 * duplicate GitHub's chrome. Listing rows carry neither, which is what this
 * feature fills in.
 *
 * Like file icons and file ages, this runs one MutationObserver per known
 * surface container (never one on the document). Sizes are not in GitHub's
 * tree markup, so each row's blob address is rewritten to its raw address and
 * probed with a HEAD request; a shared IntersectionObserver defers that work
 * until the row is near the viewport, and a small queue keeps the page from
 * opening dozens of connections at once. Sizes are cached per raw address for
 * the session.
 */
const RESCAN_MS = 100;
const SHELL_MS = 200;
/** Bounded window for a file listing that mounts after the navigation shell. */
const SETTLE_MS = 250;
const SETTLE_TRIES = 20;
/** Concurrent HEAD probes; a directory can hold hundreds of rows. */
const SIZE_CONCURRENCY = 4;

/** Row element -> injected strip, so a re-rendered row is decorated again. */
let decorated = new WeakMap();
/** Strip -> deferred size loader while it waits to enter the viewport. */
let loads = new WeakMap();
/** Raw address -> size promise, kept for the session so navigation is free. */
const sizeCache = new Map();
const sizeQueue = [];
/** Surface container -> observer. */
const observers = new Map();
let visibility = null;
let sizeActive = 0;
let bodyObserver = null;
let observedBody = null;
let shellObserver = null;
let settleTimer = null;

function visibleSettings() {
  const settings = getFileMetaSettings();
  return settings.enabled && (settings.sizes || settings.download);
}

async function headSize(rawUrl) {
  try {
    const response = await fetch(rawUrl, {
      method: 'HEAD',
      credentials: 'same-origin',
      redirect: 'follow',
    });
    if (!response.ok) return null;
    const header = response.headers.get('content-length');
    if (header === null) return null;
    const bytes = Number(header);
    return Number.isFinite(bytes) && bytes >= 0 ? bytes : null;
  } catch {
    return null;
  }
}

function pumpQueue() {
  while (sizeActive < SIZE_CONCURRENCY && sizeQueue.length) {
    const job = sizeQueue.shift();
    sizeActive += 1;
    headSize(job.rawUrl).then((bytes) => job.resolve(bytes), () => job.resolve(null)).then(() => {
      sizeActive -= 1;
      pumpQueue();
    });
  }
}

function requestSize(rawUrl) {
  if (!rawUrl) return Promise.resolve(null);
  const cached = sizeCache.get(rawUrl);
  if (cached) return cached;
  const promise = new Promise((resolve) => {
    sizeQueue.push({ rawUrl, resolve });
    pumpQueue();
  });
  sizeCache.set(rawUrl, promise);
  return promise;
}

function ensureVisibility() {
  if (visibility || typeof IntersectionObserver !== 'function') return;
  visibility = new IntersectionObserver(
    (entries) => {
      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        if (!entry.isIntersecting) continue;
        const load = loads.get(entry.target);
        if (!load) continue;
        loads.delete(entry.target);
        if (visibility) visibility.unobserve(entry.target);
        load();
      }
    },
    { rootMargin: '200px' },
  );
}

/** Fill a strip's size once the row is close enough to the viewport. */
function queueSize(meta, rawUrl) {
  const load = () => {
    requestSize(rawUrl).then((bytes) => {
      if (!meta.isConnected) return;
      const text = formatSize(bytes);
      if (text) setMetaSize(meta, text);
    });
  };
  if (visibility) {
    loads.set(meta, load);
    visibility.observe(meta);
  } else {
    load();
  }
}

function processRow(row, surface) {
  if (!visibleSettings()) return;
  const existing = decorated.get(row);
  if (existing && existing.isConnected) return;
  const found = surface.resolve(row);
  if (!found) return;
  const settings = getFileMetaSettings();
  const meta = found.rawUrl
    ? renderMeta({
      name: found.name,
      showSize: settings.sizes,
      showDownload: settings.download,
      onDownload: () => downloadFile(found.rawUrl, found.name),
    })
    : null;
  decorated.set(row, placeCell(row, meta));
  if (meta && settings.sizes) queueSize(meta, found.rawUrl);
}

function ensureHeader(container, surface) {
  if (!surface.header || !surface.columnLabelKey) return;
  const headRow = container.querySelector(surface.header);
  if (!headRow) return;
  // With the size label off the column holds only the button, so a "Size"
  // header would misdescribe it.
  const settings = getFileMetaSettings();
  placeHead(headRow, settings.sizes ? t(surface.columnLabelKey) : '');
}

function processContainer(container, surface) {
  if (!visibleSettings()) return;
  ensureHeader(container, surface);
  let rows;
  try {
    rows = container.querySelectorAll(surface.rows);
  } catch (error) {
    logWarn(Codes.FILE_META, 'file-meta surface has an invalid row selector', {
      surface: surface.id,
      error,
    });
    return;
  }
  for (let index = 0; index < rows.length; index += 1) processRow(rows[index], surface);
}

function attach(container, surface) {
  const observer = new MutationObserver(debounce(() => processContainer(container, surface), RESCAN_MS));
  observer.observe(container, { childList: true, subtree: true });
  observers.set(container, observer);
  processContainer(container, surface);
}

function teardown() {
  for (const observer of observers.values()) observer.disconnect();
  observers.clear();
  if (visibility) {
    visibility.disconnect();
    visibility = null;
  }
  for (const job of sizeQueue) {
    sizeCache.delete(job.rawUrl);
    job.resolve(null);
  }
  sizeQueue.length = 0;
  clearMeta();
  decorated = new WeakMap();
  loads = new WeakMap();
}

/**
 * Find every surface container currently in the page and make sure it is
 * watched. Returns how many containers this call attached, which is what tells
 * a late-mounting file list apart from one already in place.
 */
function syncSurfaces() {
  if (!visibleSettings()) return 0;
  for (const [container, observer] of observers) {
    if (!container.isConnected) {
      observer.disconnect();
      observers.delete(container);
    }
  }
  let attached = 0;
  let matched = 0;
  for (let s = 0; s < SURFACES.length; s += 1) {
    const surface = SURFACES[s];
    for (let c = 0; c < surface.containers.length; c += 1) {
      const found = document.querySelectorAll(surface.containers[c]);
      for (let i = 0; i < found.length; i += 1) {
        matched += 1;
        if (!observers.has(found[i])) {
          attach(found[i], surface);
          attached += 1;
        }
      }
    }
  }
  if (!matched) logInfo('file-meta', 'no file surface on this page yet');
  return attached;
}

function stopSettle() {
  if (settleTimer === null) return;
  clearInterval(settleTimer);
  settleTimer = null;
}

/**
 * GitHub mounts the file list after the navigation shell, so every navigation
 * event can fire before the surface exists. Retry the registry query for a
 * bounded time (never a scan loop) and stop as soon as a surface is attached.
 */
function settleSurfaces() {
  stopSettle();
  let tries = 0;
  settleTimer = setInterval(() => {
    tries += 1;
    if (!visibleSettings() || syncSurfaces() > 0 || tries >= SETTLE_TRIES) stopSettle();
  }, SETTLE_MS);
}

/** Watch the current body; a replaced body leaves the previous observer dead. */
function observeBody() {
  if (typeof MutationObserver !== 'function') return;
  const body = document.body;
  if (!body || (bodyObserver && observedBody === body)) return;
  if (bodyObserver) bodyObserver.disconnect();
  observedBody = body;
  bodyObserver = new MutationObserver(debounce(applyFileMetaSettings, SHELL_MS));
  bodyObserver.observe(body, { childList: true });
}

/**
 * Watch the navigation shell: GitHub swaps `<body>` — or its direct children —
 * on soft navigation, and the file list mounts afterwards, so either swap must
 * re-run the surface query. Both observers see direct children only, never a
 * subtree.
 */
function observeShell() {
  observeBody();
  if (shellObserver || typeof MutationObserver !== 'function') return;
  if (!document.documentElement) return;
  shellObserver = new MutationObserver(
    debounce(() => {
      // Head additions reach this observer too; only a new body needs a rescan.
      if (observedBody === document.body) return;
      observeBody();
      applyFileMetaSettings();
    }, SHELL_MS),
  );
  shellObserver.observe(document.documentElement, { childList: true });
}

/**
 * Apply the current settings. Tears down first so a toggle change repaints the
 * existing rows (the size labels and buttons are separate switches).
 */
export function applyFileMetaSettings() {
  observeShell();
  stopSettle();
  teardown();
  if (!visibleSettings()) return;
  ensureVisibility();
  if (syncSurfaces() === 0) settleSurfaces();
}

/** Boot the file-meta feature (idempotent). */
export function initFileMetaFeature() {
  on('settings:fileMeta', applyFileMetaSettings);
  // The column label and the download buttons' labels are localized text, so a
  // language change has to repaint them even though the feature is unchanged.
  on('settings:language', applyFileMetaSettings);
  watchNavigation(applyFileMetaSettings);
  observeBody();
  applyFileMetaSettings();
}
