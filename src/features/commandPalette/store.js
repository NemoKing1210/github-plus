import {
  COMMAND_PALETTE_CACHE_KEY,
  COMMAND_PALETTE_PINS_KEY,
  COMMAND_PALETTE_RECENTS_KEY,
} from '../../core/constants.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { getCommandPaletteSettings } from '../../core/settings.js';
import { readContext, resolveIdentity, tokenFingerprint } from './context.js';

const log = createLogger('command-palette');

const RECENTS_MAX = 20;
const PINS_MAX = 50;
const RATE_LIMIT_MARGIN_MS = 30_000;

function readJson(key) {
  try {
    const raw = typeof GM_getValue === 'function' ? GM_getValue(key, null) : globalThis.localStorage?.getItem(key);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (error) {
    log.error(Codes.PALETTE_CACHE, 'reading palette storage failed', { error, key });
    return null;
  }
}

function writeJson(key, value) {
  try {
    const raw = JSON.stringify(value);
    if (typeof GM_setValue === 'function') GM_setValue(key, raw);
    else globalThis.localStorage?.setItem(key, raw);
    return true;
  } catch (error) {
    log.error(Codes.PALETTE_CACHE, 'persisting palette storage failed', { error, key });
    return false;
  }
}

function emptyRecord() {
  return {
    version: 1,
    login: null,
    tokenLogin: null,
    tokenFingerprint: '',
    sources: {},
    trees: {},
    issues: {},
    rateLimit: null,
  };
}

/** The persisted cache, or null when absent, malformed or from another version. */
export function readCacheRecord() {
  const record = readJson(COMMAND_PALETTE_CACHE_KEY);
  if (!record || typeof record !== 'object' || record.version !== 1) return null;
  return {
    version: 1,
    login: typeof record.login === 'string' ? record.login : null,
    tokenLogin: typeof record.tokenLogin === 'string' ? record.tokenLogin : null,
    tokenFingerprint: typeof record.tokenFingerprint === 'string' ? record.tokenFingerprint : '',
    sources: record.sources && typeof record.sources === 'object' ? record.sources : {},
    trees: record.trees && typeof record.trees === 'object' ? record.trees : {},
    issues: record.issues && typeof record.issues === 'object' ? record.issues : {},
    rateLimit: record.rateLimit && typeof record.rateLimit === 'object' ? record.rateLimit : null,
  };
}

export function writeCacheRecord(record) {
  writeJson(COMMAND_PALETTE_CACHE_KEY, { ...emptyRecord(), ...record, version: 1 });
}

/** Drop fetched data but keep which identity the store belongs to. */
export function clearDataCache() {
  const record = readCacheRecord() || emptyRecord();
  record.sources = {};
  record.trees = {};
  record.issues = {};
  record.rateLimit = null;
  writeCacheRecord(record);
}

/**
 * Page context plus the settings and the cache that belongs to the effective
 * identity. A cache written by another account is cold, never rendered.
 */
export function readPaletteState() {
  const context = readContext();
  const settings = getCommandPaletteSettings();
  const record = readCacheRecord();
  const fingerprint = tokenFingerprint(settings.token);
  const tokenLogin = record && record.tokenFingerprint === fingerprint ? record.tokenLogin : null;
  const identity = resolveIdentity({
    token: settings.token,
    pageLogin: context.login,
    tokenLogin,
  });
  const cache = identity && record?.login === identity ? record : null;
  return { context, settings, record, cache, identity, tokenLogin, fingerprint };
}

function readList(key, identity, mapItems) {
  const stored = readJson(key);
  const items = Array.isArray(stored?.items) ? stored.items : [];
  return mapItems(items, stored?.identity === identity);
}

function writeList(key, identity, items) {
  writeJson(key, { version: 1, identity, items });
}

/** Recents of the current identity; another identity's non-commands are hidden. */
export function readRecents(identity) {
  return readList(COMMAND_PALETTE_RECENTS_KEY, identity, (items, sameIdentity) => (
    sameIdentity ? items : items.filter((item) => item.kind === 'command')
  ));
}

export function recordRecent(identity, entry) {
  const existing = readRecents(identity);
  const items = [
    { ...entry, at: entry.at ?? Date.now() },
    ...existing.filter((item) => item.key !== entry.key),
  ].slice(0, RECENTS_MAX);
  writeList(COMMAND_PALETTE_RECENTS_KEY, identity, items);
}

export function readPins(identity) {
  return readList(COMMAND_PALETTE_PINS_KEY, identity, (items, sameIdentity) => (
    sameIdentity ? items : []
  ));
}

/** Toggle a pin; returns whether the entry is pinned afterwards. */
export function togglePin(identity, entry) {
  const items = readPins(identity);
  const index = items.findIndex((item) => item.key === entry.key);
  if (index !== -1) {
    items.splice(index, 1);
    writeList(COMMAND_PALETTE_PINS_KEY, identity, items);
    return false;
  }
  const next = [{ ...entry, at: entry.at ?? Date.now() }, ...items].slice(0, PINS_MAX);
  writeList(COMMAND_PALETTE_PINS_KEY, identity, next);
  return true;
}

export function isPinned(identity, key) {
  return readPins(identity).some((item) => item.key === key);
}

/** A record is fresh while its TTL is unexpired; zero hours disables refresh. */
export function isFresh(record, hours, now = Date.now()) {
  if (!(hours > 0) || !record) return false;
  if (!Number.isFinite(record.fetchedAt)) return false;
  return now - record.fetchedAt < hours * 3600_000;
}

/** Parse GitHub's rate-limit headers; null unless all three are present. */
export function rateLimitFromHeaders(headers) {
  const remaining = Number(headers?.['x-ratelimit-remaining']);
  const reset = Number(headers?.['x-ratelimit-reset']);
  const limit = Number(headers?.['x-ratelimit-limit']);
  if (!Number.isFinite(remaining) || !Number.isFinite(reset) || !Number.isFinite(limit)) return null;
  return { remaining, resetAt: reset * 1000, limit, checkedAt: Date.now() };
}

/** True while the reset is still ahead (plus a safety margin). */
export function isRateBlocked(cache, now = Date.now()) {
  const limit = cache?.rateLimit;
  if (!limit) return false;
  return limit.remaining < 5 && now < limit.resetAt + RATE_LIMIT_MARGIN_MS;
}

/**
 * Keep a limit learned from a failed request, so the next session does not
 * retry into an exhausted quota. Never writes over another account's record.
 */
export function persistRateLimit(state, rateLimit) {
  if (!rateLimit || !state?.identity) return;
  const latest = readCacheRecord();
  if (latest?.login && latest.login !== state.identity) return;
  writeCacheRecord({
    version: 1,
    login: state.identity,
    tokenLogin: state.tokenLogin,
    tokenFingerprint: state.fingerprint,
    sources: latest?.sources || {},
    trees: latest?.trees || {},
    issues: latest?.issues || {},
    rateLimit,
  });
}
