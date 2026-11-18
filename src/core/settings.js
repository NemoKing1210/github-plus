import { SUPPORTED_LOCALES } from '../i18n/meta.js';
import {
  COMMAND_PALETTE_CACHE_HOURS_MAX,
  COMMAND_PALETTE_MAX_RESULTS_MAX,
  COMMAND_PALETTE_MAX_RESULTS_MIN,
  GALLERY_MAX_ZOOM,
  PREVIEW_LONG_PRESS_MAX_MS,
  PREVIEW_LONG_PRESS_MIN_MS,
  SETTINGS_KEY,
  TOAST_MAX_DURATION_MS,
  TOAST_POSITIONS,
  TRANSLATE_CACHE_HOURS_MAX,
  TRANSLATE_TARGET_LANGUAGES,
  getDefaults,
} from './constants.js';
import { Codes, createLogger } from './logger/index.js';
import { normalizeShortcutValue } from '../utils/shortcut.js';

const log = createLogger('settings');

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

function readStorage() {
  try {
    const raw = typeof GM_getValue === 'function'
      ? GM_getValue(SETTINGS_KEY, null)
      : localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (error) {
    log.error(Codes.SETTINGS_LOAD, 'reading settings failed, using defaults', { error });
    return null;
  }
}

function writeStorage(value) {
  try {
    const raw = JSON.stringify(value);
    if (typeof GM_setValue === 'function') GM_setValue(SETTINGS_KEY, raw);
    else localStorage.setItem(SETTINGS_KEY, raw);
  } catch (error) {
    log.error(Codes.SETTINGS_PERSIST, 'persisting settings failed', { error });
  }
}

/* ------------------------------------------------------------------ */
/* Normalizers                                                         */
/* ------------------------------------------------------------------ */

function normalizeLocale(value, fallback) {
  if (value === 'auto') return 'auto';
  return SUPPORTED_LOCALES.includes(value) ? value : fallback;
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeToastPosition(value, fallback) {
  return TOAST_POSITIONS.includes(value) ? value : fallback;
}

function normalizeToastDuration(value, fallback) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms < 0) return fallback;
  return Math.min(TOAST_MAX_DURATION_MS, Math.round(ms));
}

function normalizeToasts(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    position: normalizeToastPosition(source.position, fallback.position),
    duration: normalizeToastDuration(source.duration, fallback.duration),
  };
}

function normalizeZoom(value, fallback) {
  const zoom = Number(value);
  if (!Number.isFinite(zoom)) return fallback;
  return Math.min(GALLERY_MAX_ZOOM, Math.max(2, Math.round(zoom)));
}

/**
 * Per-source switches keyed by source id. Unknown ids are dropped and a
 * source missing from the stored payload falls back to its default, so a
 * source added to (or removed from) the registry never leaves a stale key
 * behind.
 */
function normalizeSources(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const result = {};
  for (const id of Object.keys(fallback)) {
    result[id] = normalizeBoolean(source[id], fallback[id]);
  }
  return result;
}

function normalizeLogging(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
  };
}

function normalizeGallery(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    sources: normalizeSources(source.sources, fallback.sources),
    skipBadges: normalizeBoolean(source.skipBadges, fallback.skipBadges),
    upgradeFullSize: normalizeBoolean(source.upgradeFullSize, fallback.upgradeFullSize),
    download: normalizeBoolean(source.download, fallback.download),
    thumbnails: normalizeBoolean(source.thumbnails, fallback.thumbnails),
    loop: normalizeBoolean(source.loop, fallback.loop),
    maxZoom: normalizeZoom(source.maxZoom, fallback.maxZoom),
  };
}

function normalizeFileIcons(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    folders: normalizeBoolean(source.folders, fallback.folders),
    specialNames: normalizeBoolean(source.specialNames, fallback.specialNames),
  };
}

function normalizeFileAges(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    folders: normalizeBoolean(source.folders, fallback.folders),
  };
}

function normalizeFileMeta(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    sizes: normalizeBoolean(source.sizes, fallback.sizes),
    download: normalizeBoolean(source.download, fallback.download),
  };
}

function normalizeFileMenu(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
  };
}

function normalizeLongPressMs(value, fallback) {
  const ms = Number(value);
  if (!Number.isFinite(ms)) return fallback;
  return Math.min(
    PREVIEW_LONG_PRESS_MAX_MS,
    Math.max(PREVIEW_LONG_PRESS_MIN_MS, Math.round(ms)),
  );
}

function normalizeFilePreview(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    rowButton: normalizeBoolean(source.rowButton, fallback.rowButton),
    longPress: normalizeBoolean(source.longPress, fallback.longPress),
    longPressMs: normalizeLongPressMs(source.longPressMs, fallback.longPressMs),
    longPressRing: normalizeBoolean(source.longPressRing, fallback.longPressRing),
  };
}

function normalizeCommitBadges(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    unknownTypes: normalizeBoolean(source.unknownTypes, fallback.unknownTypes),
    breaking: normalizeBoolean(source.breaking, fallback.breaking),
  };
}

function normalizeProviderId(value, fallback) {
  return Object.keys(fallback.providerConfig).includes(value)
    ? value
    : fallback.provider;
}

function normalizeProviderConfig(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const result = {};
  for (const id of Object.keys(fallback.providerConfig)) {
    const defaults = fallback.providerConfig[id];
    const stored = source[id] && typeof source[id] === 'object' ? source[id] : {};
    const entry = {};
    for (const key of Object.keys(defaults)) {
      const value = stored[key];
      if (key === 'plan') {
        entry[key] = value === 'free' || value === 'pro' ? value : defaults[key];
      } else {
        entry[key] = typeof value === 'string' ? value.slice(0, 500) : defaults[key];
      }
    }
    result[id] = entry;
  }
  return result;
}

function normalizeTargetLang(value, fallback) {
  if (value === 'auto') return 'auto';
  return TRANSLATE_TARGET_LANGUAGES.some((lang) => lang.code === value)
    ? value
    : fallback;
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizeTranslateSurfaces(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const result = {};
  for (const id of Object.keys(fallback)) {
    result[id] = normalizeBoolean(source[id], fallback[id]);
  }
  return result;
}

function normalizeCacheHours(value, fallback) {
  const hours = Number(value);
  if (!Number.isFinite(hours)) return fallback;
  return Math.min(TRANSLATE_CACHE_HOURS_MAX, Math.max(0, Math.round(hours)));
}

function normalizeTranslate(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    provider: normalizeProviderId(source.provider, fallback),
    providerConfig: normalizeProviderConfig(source.providerConfig, fallback),
    targetLang: normalizeTargetLang(source.targetLang, fallback.targetLang),
    mode: normalizeEnum(source.mode, ['button', 'auto'], fallback.mode),
    display: normalizeEnum(source.display, ['replace', 'below'], fallback.display),
    reveal: normalizeEnum(source.reveal, ['button', 'hover'], fallback.reveal),
    linkLabels: normalizeBoolean(source.linkLabels, fallback.linkLabels),
    surfaces: normalizeTranslateSurfaces(source.surfaces, fallback.surfaces),
    cacheHours: normalizeCacheHours(source.cacheHours, fallback.cacheHours),
  };
}

function normalizeClamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

/** Normalize the command palette section; the token is trimmed and bounded. */
export function normalizeCommandPalette(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    shortcut: normalizeShortcutValue(source.shortcut) || fallback.shortcut,
    token: typeof source.token === 'string' ? source.token.trim().slice(0, 400) : fallback.token,
    sources: normalizeSources(source.sources, fallback.sources),
    hideForks: normalizeBoolean(source.hideForks, fallback.hideForks),
    hideArchived: normalizeBoolean(source.hideArchived, fallback.hideArchived),
    cacheHours: normalizeClamp(source.cacheHours, 0, COMMAND_PALETTE_CACHE_HOURS_MAX, fallback.cacheHours),
    maxResults: normalizeClamp(
      source.maxResults,
      COMMAND_PALETTE_MAX_RESULTS_MIN,
      COMMAND_PALETTE_MAX_RESULTS_MAX,
      fallback.maxResults,
    ),
  };
}

/** Normalize a whole settings payload against the shipped defaults. */
function normalizeSettings(raw) {
  const defaults = getDefaults();
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    language: normalizeLocale(source.language, defaults.language),
    logging: normalizeLogging(source.logging, defaults.logging),
    gallery: normalizeGallery(source.gallery, defaults.gallery),
    toasts: normalizeToasts(source.toasts, defaults.toasts),
    fileIcons: normalizeFileIcons(source.fileIcons, defaults.fileIcons),
    fileAges: normalizeFileAges(source.fileAges, defaults.fileAges),
    fileMeta: normalizeFileMeta(source.fileMeta, defaults.fileMeta),
    fileMenu: normalizeFileMenu(source.fileMenu, defaults.fileMenu),
    filePreview: normalizeFilePreview(source.filePreview, defaults.filePreview),
    commitBadges: normalizeCommitBadges(source.commitBadges, defaults.commitBadges),
    translate: normalizeTranslate(source.translate, defaults.translate),
    commandPalette: normalizeCommandPalette(source.commandPalette, defaults.commandPalette),
  };
}

/* ------------------------------------------------------------------ */
/* Load / save                                                         */
/* ------------------------------------------------------------------ */

export function loadSettings() {
  return normalizeSettings(readStorage());
}

/** @type {ReturnType<typeof loadSettings>} */
let settings = loadSettings();

export function getSettings() {
  return settings;
}

export function getLoggingSettings() {
  return settings.logging;
}

export function getGallerySettings() {
  return settings.gallery;
}

export function getFileIconsSettings() {
  return settings.fileIcons;
}

export function getFileAgesSettings() {
  return settings.fileAges;
}

export function getFileMetaSettings() {
  return settings.fileMeta;
}

export function getFileMenuSettings() {
  return settings.fileMenu;
}

export function getFilePreviewSettings() {
  return settings.filePreview;
}

export function getCommitBadgesSettings() {
  return settings.commitBadges;
}

export function getTranslateSettings() {
  return settings.translate;
}

export function getCommandPaletteSettings() {
  return settings.commandPalette;
}

/** Settings as they may leave the browser: a token never belongs in a backup. */
export function toExportableSettings(value) {
  const copy = JSON.parse(JSON.stringify(value));
  if (copy.commandPalette) copy.commandPalette.token = '';
  return copy;
}

/**
 * Merge a partial patch, normalize it, persist it and return the new state.
 * Deliberately does not notify features: the caller emits the matching bus
 * event (persistence in `core`, reactions in the UI/features via the bus).
 * @param {Partial<ReturnType<typeof loadSettings>>} patch
 */
export function saveSettings(patch) {
  settings = normalizeSettings({ ...settings, ...patch });
  writeStorage(settings);
  return settings;
}

/**
 * Normalize a settings backup payload without touching persisted state.
 * Returns null when the payload is not an object; the caller applies the
 * result through `saveSettings`.
 */
export function normalizeImportedSettings(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const next = normalizeSettings(raw);
  next.commandPalette.token = '';
  return next;
}

/** True when the current settings differ from the shipped defaults. */
export function hasCustomSettings() {
  return JSON.stringify(settings) !== JSON.stringify(getDefaults());
}
