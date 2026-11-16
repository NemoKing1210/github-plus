import {
  TRANSLATE_BATCH_MAX_CHARS,
  TRANSLATE_BATCH_MAX_SEGMENTS,
} from '../../core/constants.js';
import { getTranslateSettings } from '../../core/settings.js';
import { cacheKey, getCached, setCached } from './cache.js';
import { SEGMENT_END, SEGMENT_START, stripSegmentMarkers } from './tokens.js';
import { translateWithDeepL } from './providers/deepl.js';
import { translateWithGoogle } from './providers/google.js';
import { translateWithLibreTranslate } from './providers/libretranslate.js';
import { translateWithMicrosoft } from './providers/microsoft.js';
import { translateWithOpenAI } from './providers/openai.js';
import { translateWithYandex } from './providers/yandex.js';

const SENTINEL_RE = /\uE100\s*(\d+)\s*\uE101/g;

function joinPiece(index, text) {
  return `${SEGMENT_START}${index}${SEGMENT_END}\n${stripSegmentMarkers(text)}`;
}

/**
 * Group segments into provider batches. A batch stays within the segment and
 * character caps; one oversized segment still gets a batch of its own.
 * @param {Array<{ id: number | string, text: string }>} segments
 * @returns {Array<{ ids: Array<number | string>, text: string }>}
 */
export function buildBatches(segments, {
  maxSegments = TRANSLATE_BATCH_MAX_SEGMENTS,
  maxChars = TRANSLATE_BATCH_MAX_CHARS,
} = {}) {
  const batches = [];
  let current = { ids: [], text: '' };

  (Array.isArray(segments) ? segments : []).forEach((segment) => {
    const index = current.ids.length;
    const piece = joinPiece(index, segment.text);
    const nextText = current.text ? `${current.text}\n${piece}` : piece;
    const full = current.ids.length >= maxSegments
      || (current.ids.length > 0 && nextText.length > maxChars);
    if (full) {
      batches.push(current);
      current = { ids: [segment.id], text: joinPiece(0, segment.text) };
    } else {
      current.ids.push(segment.id);
      current.text = nextText;
    }
  });

  if (current.ids.length) batches.push(current);
  return batches;
}

/**
 * Split a provider's sentinel-delimited batch response back into segment
 * texts. A missing, duplicated or out-of-order sentinel rejects the batch.
 * @param {string} raw
 * @param {Array<number | string>} ids
 * @returns {Map<number | string, string> | null}
 */
export function splitBatchResponse(raw, ids) {
  const text = String(raw ?? '');
  const order = Array.isArray(ids) ? ids : [];
  const marks = [];
  SENTINEL_RE.lastIndex = 0;
  let match = SENTINEL_RE.exec(text);
  while (match) {
    marks.push({
      index: Number(match[1]),
      start: match.index,
      end: match.index + match[0].length,
    });
    match = SENTINEL_RE.exec(text);
  }
  if (marks.length !== order.length) return null;

  const out = new Map();
  for (let position = 0; position < marks.length; position += 1) {
    const mark = marks[position];
    if (mark.index !== position) return null;
    const next = marks[position + 1];
    const body = text.slice(mark.end, next ? next.start : text.length).trim();
    out.set(order[position], body);
  }
  return out;
}

function dispatch(providerId, text, target, config) {
  switch (providerId) {
    case 'deepl': return translateWithDeepL(text, target, config);
    case 'microsoft': return translateWithMicrosoft(text, target, config);
    case 'yandex': return translateWithYandex(text, target, config);
    case 'openai': return translateWithOpenAI(text, target, config);
    case 'libretranslate': return translateWithLibreTranslate(text, target, config);
    default: return translateWithGoogle(text, target);
  }
}

const inflight = new Map();

function defaultTranslate(text, targetLang) {
  const settings = getTranslateSettings();
  const providerId = settings.provider;
  const key = `${providerId}|${targetLang}|${text}`;
  const existing = inflight.get(key);
  if (existing) return existing;
  const config = settings.providerConfig[providerId] || {};
  const promise = dispatch(providerId, text, targetLang, config);
  inflight.set(key, promise);
  promise.then(
    () => inflight.delete(key),
    () => inflight.delete(key),
  );
  return promise;
}

function normalizeResult(result) {
  const text = result && typeof result.text === 'string' ? result.text : '';
  if (!text) throw new Error('The provider returned an empty translation');
  return { text, detectedSourceLang: result.detectedSourceLang || null };
}

/** Statuses where retrying per segment only multiplies load on a closed door. */
const FATAL_STATUSES = [401, 403, 429];
/** Consecutive all-failed batches after which the provider is treated as down. */
const MAX_FAILED_BATCHES = 3;

function isFatal(error) {
  return FATAL_STATUSES.includes(Number(error && error.status));
}

/**
 * Translate segments through the configured provider (or an injected
 * `translate`), serving cache hits first and falling back to one request per
 * segment when a batch cannot be split. An auth or throttle status fails the
 * whole batch instead of retrying each of its segments.
 * @param {Array<{ id: number | string, text: string }>} segments
 * @param {string} targetLang
 * @param {{ translate?: Function, onResult?: Function,
 *   onProgress?: (done: number, total: number) => void }} [options]
 * @returns {Promise<{ results: Map<number | string, { text: string,
 *   detectedSourceLang: string | null }>, failed: Array<number | string> }>}
 */
export async function translateSegments(
  segments,
  targetLang,
  { translate, onResult, onProgress } = {},
) {
  const results = new Map();
  const failed = [];
  const list = Array.isArray(segments) ? segments : [];
  if (!list.length) return { results, failed };

  const runner = typeof translate === 'function' ? translate : defaultTranslate;
  const useCache = typeof translate !== 'function';
  const providerId = getTranslateSettings().provider;
  let settled = 0;

  const advance = () => {
    settled += 1;
    if (typeof onProgress !== 'function') return;
    try {
      onProgress(settled, list.length);
    } catch {
      // A progress callback must never fail the translation itself.
    }
  };

  const commit = (segment, result) => {
    results.set(segment.id, result);
    if (useCache) {
      setCached(cacheKey(providerId, targetLang, segment.text), {
        text: result.text,
        detected: result.detectedSourceLang,
        len: segment.text.length,
      });
    }
    if (typeof onResult === 'function') {
      try {
        onResult(segment.id, result);
      } catch {
        // A display callback must never fail the translation itself.
      }
    }
    advance();
  };

  const reject = (segment) => {
    failed.push(segment.id);
    advance();
  };

  const translateOne = async (segment) => {
    try {
      commit(segment, normalizeResult(await runner(segment.text, targetLang)));
    } catch {
      reject(segment);
    }
  };

  const pending = [];
  list.forEach((segment) => {
    const cached = useCache
      ? getCached(cacheKey(providerId, targetLang, segment.text))
      : null;
    if (cached && cached.text) {
      commit(segment, { text: cached.text, detectedSourceLang: cached.detected || null });
    } else {
      pending.push(segment);
    }
  });

  let failedBatches = 0;
  const noteBatch = (members, failedBefore) => {
    const failedInBatch = failed.length - failedBefore;
    failedBatches = failedInBatch > 0 && failedInBatch === members.length
      ? failedBatches + 1
      : 0;
  };
  for (const batch of buildBatches(pending)) {
    const members = batch.ids
      .map((id) => pending.find((segment) => segment.id === id))
      .filter(Boolean);
    if (failedBatches >= MAX_FAILED_BATCHES) {
      members.forEach(reject);
      continue;
    }
    const failedBefore = failed.length;
    let fatal = false;
    try {
      const response = await runner(batch.text, targetLang);
      const normalized = normalizeResult(response);
      const mapped = splitBatchResponse(normalized.text, batch.ids);
      if (mapped) {
        members.forEach((segment) => {
          const text = mapped.get(segment.id);
          if (!text) {
            reject(segment);
            return;
          }
          commit(segment, { text, detectedSourceLang: normalized.detectedSourceLang });
        });
        noteBatch(members, failedBefore);
        continue;
      }
    } catch (error) {
      fatal = isFatal(error);
    }
    if (fatal) {
      members.forEach(reject);
      noteBatch(members, failedBefore);
      continue;
    }
    for (const segment of members) await translateOne(segment);
    noteBatch(members, failedBefore);
  }

  return { results, failed };
}
