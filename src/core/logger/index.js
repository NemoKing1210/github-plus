import { LOG_MAX_ENTRIES } from '../constants.js';
import { sanitizeValue, serializeError } from './sanitize.js';

/**
 * Structured diagnostics for GitHub Plus. Every failure carries a stable
 * `GP-####` code and the module that raised it. The logger is silent until
 * `configureLogger({ enabled: true })`; while it is off no console call is
 * made, no entry is stored and no global listener is installed.
 */

export const Codes = {
  /** A bus listener threw while handling an event. */
  BUS_LISTENER: 'GP-1001',
  /** Persisting settings to GM storage failed. */
  SETTINGS_PERSIST: 'GP-1002',
  /** Reading settings from GM storage failed. */
  SETTINGS_LOAD: 'GP-1003',
  /** Importing a settings backup failed (invalid payload). */
  SETTINGS_IMPORT: 'GP-1004',
  /** Collecting or opening a gallery failed (logged once at the click). */
  GALLERY_FAILED: 'GP-1101',
  /** A registered gallery source threw while collecting its images. */
  GALLERY_SOURCE: 'GP-1102',
  /** A gallery image failed to load in the viewer. */
  GALLERY_IMAGE: 'GP-1103',
  /** The page-level download button could not be shown for an image. */
  GALLERY_DOWNLOAD: 'GP-1104',
  /** A file-icons surface or its selectors failed. */
  FILE_ICONS: 'GP-1301',
  /** A file-ages surface or its selectors failed. */
  FILE_AGES: 'GP-1302',
  /** A file-meta surface or its selectors failed. */
  FILE_META: 'GP-1303',
  /** The file context menu failed to resolve or run an action. */
  FILE_MENU: 'GP-1401',
  /** A quick-preview file failed to load or render. */
  FILE_PREVIEW: 'GP-1501',
  /** A container could not be translated at all. */
  TRANSLATE: 'GP-1601',
  /** Reading or persisting the translation cache failed. */
  TRANSLATE_CACHE: 'GP-1602',
  /** Palette repository, starred or tree loading failed. */
  PALETTE_LOAD: 'GP-1701',
  /** Reading or persisting the palette cache failed. */
  PALETTE_CACHE: 'GP-1702',
  /** Mounting the settings entry or panel failed. */
  UI_MOUNT: 'GP-1201',
  /** An uncaught runtime error attributable to this script. */
  UNCAUGHT_ERROR: 'GP-9001',
  /** An unhandled promise rejection attributable to this script. */
  UNHANDLED_REJECTION: 'GP-9002',
};

const BADGES = {
  error: 'background:#8a3030;color:#fff;border-radius:2px;padding:1px 6px;font-weight:bold',
  warn: 'background:#6b5416;color:#ffe1a8;border-radius:2px;padding:1px 6px;font-weight:bold',
  info: 'background:#30363d;color:#8f98a0;border-radius:2px;padding:1px 6px;font-weight:bold',
};
const CODE_STYLE = 'font-weight:bold';

const BASE_MARKERS = ['github-plus', 'github plus'];

let enabled = false;
let entries = [];
let seq = 0;
let startedAt = Date.now();
let markers = BASE_MARKERS.slice();
let boundWindow = null;

function isErrorLike(value) {
  return value instanceof Error || Object.prototype.toString.call(value) === '[object Error]';
}

function scriptVersion() {
  try {
    return (typeof GM_info !== 'undefined' && GM_info?.script?.version) || '';
  } catch {
    return '';
  }
}

function pageUrl() {
  try {
    return typeof location !== 'undefined' ? String(location.href) : '';
  } catch {
    return '';
  }
}

function userAgent() {
  try {
    return typeof navigator !== 'undefined' ? String(navigator.userAgent) : '';
  } catch {
    return '';
  }
}

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

function clockTime(iso) {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

/**
 * Split an `error` property out of the details so the entry keeps a parsed
 * error next to the plain payload. A non-error `error` key stays in `rest`.
 */
function splitDetails(details) {
  if (details === undefined) return {};
  if (isErrorLike(details)) return { error: details };
  if (!details || typeof details !== 'object') return { rest: details };

  let nestedError = null;
  try {
    if (isErrorLike(details.error)) nestedError = details.error;
  } catch {
    nestedError = null;
  }

  const rest = {};
  for (const key of Object.keys(details)) {
    if (key === 'error' && nestedError) continue;
    try {
      rest[key] = details[key];
    } catch {
      rest[key] = '[Unreadable]';
    }
  }
  return { error: nestedError, rest };
}

function buildEntry(level, code, moduleName, message, details) {
  const entry = {
    seq: seq + 1,
    time: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    level,
    code: code || null,
    module: moduleName,
    message: String(message),
    repeats: 1,
  };
  const split = splitDetails(details);
  if (split.error) entry.error = serializeError(split.error);
  const sanitized = sanitizeValue(split.rest);
  if (sanitized !== undefined) entry.details = sanitized;
  return entry;
}

function printEntry(entry) {
  try {
    const method = entry.level === 'warn' ? 'warn' : entry.level === 'info' ? 'info' : 'error';
    const badge = entry.code || entry.level.toUpperCase();
    console[method](
      `%c${badge}%c ${entry.module} · ${clockTime(entry.time)} · ${entry.message}`,
      BADGES[entry.level],
      CODE_STYLE,
      entry,
    );
  } catch {
    // A console the page has replaced must never break the failing operation.
  }
}

function isRepeat(last, level, code, moduleName, message) {
  return Boolean(last)
    && last.level === level
    && last.code === (code || null)
    && last.module === moduleName
    && last.message === String(message);
}

function write(level, code, moduleName, message, details) {
  if (!enabled) return;
  try {
    const last = entries[entries.length - 1];
    if (isRepeat(last, level, code, moduleName, message)) {
      last.repeats += 1;
      return;
    }
    const entry = buildEntry(level, code, moduleName, message, details);
    seq = entry.seq;
    entries.push(entry);
    if (entries.length > LOG_MAX_ENTRIES) entries.shift();
    printEntry(entry);
  } catch {
    // Diagnostics must never throw out of the code that is reporting a failure.
  }
}

function scriptMarkers() {
  const list = BASE_MARKERS.slice();
  try {
    const name = typeof GM_info !== 'undefined' && GM_info?.script?.name;
    if (name) list.push(String(name).toLowerCase());
  } catch {
    // GM_info is optional; the bundle-name markers still work.
  }
  return list;
}

/** True when a filename or stack names this script, never GitHub's own code. */
export function isScriptFailure(text) {
  if (!text) return false;
  let decoded = String(text);
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // A malformed escape sequence still carries readable markers often enough.
  }
  const haystack = decoded.toLowerCase();
  return markers.some((marker) => haystack.includes(marker));
}

function stackOf(value) {
  try {
    return value && value.stack ? String(value.stack) : '';
  } catch {
    return '';
  }
}

function onError(event) {
  if (!boundWindow || event.target !== boundWindow) return;
  const stack = stackOf(event.error);
  if (!isScriptFailure(`${event.filename || ''}\n${stack}`)) return;
  write('error', Codes.UNCAUGHT_ERROR, 'global', event.message || 'Uncaught error', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
}

function onRejection(event) {
  const reason = event.reason;
  const stack = stackOf(reason);
  if (!isScriptFailure(stack)) return;
  write('error', Codes.UNHANDLED_REJECTION, 'global', 'Unhandled promise rejection',
    isErrorLike(reason) ? reason : { reason });
}

function installGlobalHandlers() {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  boundWindow = window;
  boundWindow.addEventListener('error', onError, true);
  boundWindow.addEventListener('unhandledrejection', onRejection, true);
}

function removeGlobalHandlers() {
  if (!boundWindow) return;
  try {
    boundWindow.removeEventListener('error', onError, true);
    boundWindow.removeEventListener('unhandledrejection', onRejection, true);
  } catch {
    // A replaced window has already dropped its listeners.
  }
  boundWindow = null;
}

function publishApi() {
  if (typeof window === 'undefined') return;
  const api = { dump: dumpLog, copy: copyLog, clear: clearLog };
  Object.defineProperty(api, 'entries', { get: getLogEntries, enumerable: true });
  try {
    window.__GP_LOG__ = api;
  } catch {
    // A frozen page window simply gets no API object.
  }
}

function unpublishApi() {
  if (typeof window === 'undefined') return;
  try {
    delete window.__GP_LOG__;
  } catch {
    // Not deletable on a frozen window; the disabled logger writes nothing.
  }
}

/** @param {{ enabled?: boolean }} [options] */
export function configureLogger({ enabled: next } = {}) {
  if (Boolean(next) === enabled) return;
  enabled = Boolean(next);
  entries = [];
  seq = 0;
  startedAt = Date.now();
  if (enabled) {
    markers = scriptMarkers();
    installGlobalHandlers();
    publishApi();
    write('info', null, 'logger', 'logging enabled', { version: scriptVersion() });
  } else {
    removeGlobalHandlers();
    unpublishApi();
  }
}

/**
 * Copy the current journal as JSON. Resolves `{ ok, method }` and never
 * rejects; `console` means the clipboard was unavailable and the JSON was
 * printed instead.
 */
export async function copyLog() {
  if (!enabled) return { ok: false, method: 'disabled' };
  const text = JSON.stringify(dumpLog(), null, 2);
  try {
    const nav = typeof window !== 'undefined' ? window.navigator : null;
    const clipboard = (nav && nav.clipboard) || (typeof navigator !== 'undefined' && navigator.clipboard);
    if (clipboard && typeof clipboard.writeText === 'function') {
      await clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    }
  } catch {
    // Fall through to the console so the log is still recoverable.
  }
  try {
    console.info(text);
    return { ok: true, method: 'console' };
  } catch {
    return { ok: false, method: 'console' };
  }
}

export function isLoggingEnabled() {
  return enabled;
}

/** Bind a module name to the log helpers used across the codebase. */
export function createLogger(moduleName) {
  return Object.freeze({
    error: (code, message, details) => write('error', code, moduleName, message, details),
    warn: (code, message, details) => write('warn', code, moduleName, message, details),
    info: (message, details) => write('info', null, moduleName, message, details),
  });
}

export function getLogEntries() {
  return entries.slice();
}

export function clearLog() {
  entries = [];
  seq = 0;
}

export function dumpLog() {
  return {
    app: {
      version: scriptVersion(),
      url: pageUrl(),
      userAgent: userAgent(),
      startedAt: new Date(startedAt).toISOString(),
    },
    entries: getLogEntries(),
  };
}
