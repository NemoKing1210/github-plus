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

let enabled = false;
let entries = [];
let seq = 0;
let startedAt = Date.now();

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

/** @param {{ enabled?: boolean }} [options] */
export function configureLogger({ enabled: next } = {}) {
  if (Boolean(next) === enabled) return;
  enabled = Boolean(next);
  entries = [];
  seq = 0;
  startedAt = Date.now();
  if (enabled) {
    write('info', null, 'logger', 'logging enabled', { version: scriptVersion() });
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
