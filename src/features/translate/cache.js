import {
  TRANSLATION_CACHE_KEY,
  TRANSLATE_CACHE_HOURS_MAX,
  TRANSLATE_CACHE_SOFT_LIMIT_BYTES,
} from '../../core/constants.js';
import { getTranslateSettings } from '../../core/settings.js';
import { Codes, createLogger } from '../../core/logger/index.js';

const log = createLogger('translate');

const PERSIST_DEBOUNCE_MS = 400;
const HOUR_MS = 60 * 60 * 1000;

let store = null;
let dirty = false;
let timer = null;
let revision = 0;
let usageMemo = { revision: -1, entryCount: 0, usedBytes: 0 };

/** FNV-1a 32-bit hash, as eight lowercase hex characters. */
export function hashSource(text) {
  const source = String(text ?? '');
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Stable storage key for one provider/target/source triple. */
export function cacheKey(provider, target, source) {
  const text = String(source ?? '');
  return `${provider}|${target}|${hashSource(text)}|${text.length}`;
}

/** TTL in milliseconds; 0 disables the cache, the value is clamped to the max. */
export function cacheTtlMs(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, TRANSLATE_CACHE_HOURS_MAX) * HOUR_MS;
}

function resolveHours(hoursOverride) {
  const raw = hoursOverride === undefined ? getTranslateSettings().cacheHours : hoursOverride;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return Math.min(TRANSLATE_CACHE_HOURS_MAX, Math.max(0, value));
}

function entryBytes(key, entry) {
  return (JSON.stringify(key).length + JSON.stringify(entry).length) * 2;
}

/** Drop entries older than the TTL. Mutates the store, returns how many went. */
export function pruneStore(target, ttlMs, now) {
  const keys = Object.keys(target);
  let removed = 0;
  keys.forEach((key) => {
    const at = Number(target[key] && target[key].at);
    if (!Number.isFinite(at) || now - at > ttlMs) {
      delete target[key];
      removed += 1;
    }
  });
  return removed;
}

/** Delete the oldest entries until the store fits the byte budget. */
export function evictStore(target, limitBytes) {
  let total = 0;
  const keys = Object.keys(target);
  keys.forEach((key) => {
    total += entryBytes(key, target[key]);
  });
  let removed = 0;
  while (total > limitBytes && keys.length) {
    let oldestKey = keys[0];
    let oldestAt = Number(target[oldestKey] && target[oldestKey].at) || 0;
    keys.forEach((key) => {
      const at = Number(target[key] && target[key].at) || 0;
      if (at < oldestAt) {
        oldestAt = at;
        oldestKey = key;
      }
    });
    total -= entryBytes(oldestKey, target[oldestKey]);
    delete target[oldestKey];
    keys.splice(keys.indexOf(oldestKey), 1);
    removed += 1;
  }
  return removed;
}

/** Pure cache-usage summary for a store object. */
export function getCacheUsage(target, hoursOverride) {
  const entries = target && typeof target === 'object' ? target : {};
  const keys = Object.keys(entries);
  let usedBytes = 0;
  keys.forEach((key) => {
    usedBytes += entryBytes(key, entries[key]);
  });
  const ttlHours = resolveHours(hoursOverride);
  return {
    entryCount: keys.length,
    usedBytes,
    limitBytes: TRANSLATE_CACHE_SOFT_LIMIT_BYTES,
    pct: Math.min(100, (usedBytes / TRANSLATE_CACHE_SOFT_LIMIT_BYTES) * 100),
    enabled: ttlHours > 0,
    ttlHours,
  };
}

function parseStore(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string' || !raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function readStore() {
  try {
    if (typeof GM_getValue === 'function') {
      return parseStore(GM_getValue(TRANSLATION_CACHE_KEY, null));
    }
    if (typeof localStorage !== 'undefined') {
      return parseStore(localStorage.getItem(TRANSLATION_CACHE_KEY));
    }
  } catch (error) {
    log.warn(Codes.TRANSLATE_CACHE, 'Could not read the translation cache.', error);
  }
  return {};
}

function getStore() {
  if (!store) store = readStore();
  return store;
}

function touch() {
  revision += 1;
  dirty = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    persistCacheNow();
  }, PERSIST_DEBOUNCE_MS);
}

/** Return a cached translation value, or null when missing or expired. */
export function getCached(key) {
  const ttl = cacheTtlMs(getTranslateSettings().cacheHours);
  if (!ttl) return null;
  const entries = getStore();
  const entry = entries[key];
  if (!entry || !entry.value) return null;
  if (Date.now() - (Number(entry.at) || 0) > ttl) {
    delete entries[key];
    touch();
    return null;
  }
  return entry.value;
}

/** Store one translation value. A no-op while the cache is disabled. */
export function setCached(key, value) {
  const ttl = cacheTtlMs(getTranslateSettings().cacheHours);
  if (!ttl) return;
  getStore()[key] = { at: Date.now(), value };
  touch();
}

/** Empty the cache and write the empty store immediately. */
export function clearCache() {
  store = {};
  revision += 1;
  dirty = true;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  persistCacheNow();
}

/** Live usage statistics for the settings page. */
export function getCacheUsageStats(hoursOverride) {
  const entries = getStore();
  if (usageMemo.revision !== revision) {
    let usedBytes = 0;
    const keys = Object.keys(entries);
    keys.forEach((key) => {
      usedBytes += entryBytes(key, entries[key]);
    });
    usageMemo = { revision, entryCount: keys.length, usedBytes };
  }
  const ttlHours = resolveHours(hoursOverride);
  return {
    entryCount: usageMemo.entryCount,
    usedBytes: usageMemo.usedBytes,
    limitBytes: TRANSLATE_CACHE_SOFT_LIMIT_BYTES,
    pct: Math.min(100, (usageMemo.usedBytes / TRANSLATE_CACHE_SOFT_LIMIT_BYTES) * 100),
    enabled: ttlHours > 0,
    ttlHours,
  };
}

/** Prune, evict and write the store now. */
export function persistCacheNow() {
  if (!dirty) return;
  const entries = getStore();
  const ttl = cacheTtlMs(getTranslateSettings().cacheHours);
  pruneStore(entries, ttl, Date.now());
  evictStore(entries, TRANSLATE_CACHE_SOFT_LIMIT_BYTES);
  revision += 1;
  try {
    const raw = JSON.stringify(entries);
    if (typeof GM_setValue === 'function') {
      GM_setValue(TRANSLATION_CACHE_KEY, raw);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TRANSLATION_CACHE_KEY, raw);
    }
    dirty = false;
  } catch (error) {
    log.warn(Codes.TRANSLATE_CACHE, 'Could not persist the translation cache.', error);
  }
}
