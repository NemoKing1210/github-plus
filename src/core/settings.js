import { SUPPORTED_LOCALES } from '../i18n/meta.js';
import {
  GALLERY_MAX_ZOOM,
  SETTINGS_KEY,
  TOAST_MAX_DURATION_MS,
  TOAST_POSITIONS,
  getDefaults,
} from './constants.js';
import { Codes, logError } from './debug.js';

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
    logError(Codes.SETTINGS_LOAD, 'reading settings failed, using defaults', { error });
    return null;
  }
}

function writeStorage(value) {
  try {
    const raw = JSON.stringify(value);
    if (typeof GM_setValue === 'function') GM_setValue(SETTINGS_KEY, raw);
    else localStorage.setItem(SETTINGS_KEY, raw);
  } catch (error) {
    logError(Codes.SETTINGS_PERSIST, 'persisting settings failed', { error });
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

function normalizeGallery(raw, fallback) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: normalizeBoolean(source.enabled, fallback.enabled),
    sources: normalizeSources(source.sources, fallback.sources),
    skipBadges: normalizeBoolean(source.skipBadges, fallback.skipBadges),
    upgradeFullSize: normalizeBoolean(source.upgradeFullSize, fallback.upgradeFullSize),
    thumbnails: normalizeBoolean(source.thumbnails, fallback.thumbnails),
    loop: normalizeBoolean(source.loop, fallback.loop),
    maxZoom: normalizeZoom(source.maxZoom, fallback.maxZoom),
  };
}

/** Normalize a whole settings payload against the shipped defaults. */
function normalizeSettings(raw) {
  const defaults = getDefaults();
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    language: normalizeLocale(source.language, defaults.language),
    gallery: normalizeGallery(source.gallery, defaults.gallery),
    toasts: normalizeToasts(source.toasts, defaults.toasts),
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

export function getGallerySettings() {
  return settings.gallery;
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
  return normalizeSettings(raw);
}

/** True when the current settings differ from the shipped defaults. */
export function hasCustomSettings() {
  return JSON.stringify(settings) !== JSON.stringify(getDefaults());
}
