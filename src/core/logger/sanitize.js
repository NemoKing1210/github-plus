import {
  LOG_DETAIL_DEPTH,
  LOG_MAX_ITEMS,
  LOG_STRING_MAX_CHARS,
} from '../constants.js';

/**
 * Turn arbitrary diagnostic details into JSON-safe data. The logger must never
 * retain a live DOM node, a huge object graph or a cycle, and must never throw
 * while the page is already failing.
 */

function isErrorLike(value) {
  return value instanceof Error || Object.prototype.toString.call(value) === '[object Error]';
}

function isDomNode(value) {
  if (typeof value !== 'object' || value === null) return false;
  if (typeof Node !== 'undefined' && value instanceof Node) return true;
  return typeof value.nodeType === 'number' && typeof value.nodeName === 'string';
}

function describeNode(node) {
  if (node.nodeType !== 1) return `[node ${node.nodeName || node.nodeType}]`;
  const tag = String(node.tagName || node.nodeName || 'element').toLowerCase();
  const id = node.id ? `#${node.id}` : '';
  let classes = [];
  try {
    classes = node.classList
      ? Array.from(node.classList)
      : String(node.className || '').split(/\s+/).filter(Boolean);
  } catch {
    classes = [];
  }
  return `${tag}${id}${classes.slice(0, 3).map((name) => `.${name}`).join('')}`;
}

/**
 * Follow an Error's cause chain up to three levels. Non-error values and
 * non-error causes yield null so they stay in the plain details payload.
 */
export function serializeError(error, depth = 0, seen = new WeakSet()) {
  if (!isErrorLike(error)) return null;
  const result = {
    name: String(error.name || 'Error'),
    message: String(error.message ?? ''),
    stack: String(error.stack || ''),
  };
  const cause = error.cause;
  if (depth < 2 && isErrorLike(cause) && !seen.has(cause)) {
    seen.add(error);
    const nested = serializeError(cause, depth + 1, seen);
    if (nested) result.cause = nested;
    seen.delete(error);
  }
  return result;
}

function sanitizeObject(value, depth, seen) {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return String(value);
  if (value instanceof Map) return `[Map(${value.size})]`;
  if (value instanceof Set) return `[Set(${value.size})]`;
  if (isErrorLike(value)) return serializeError(value);

  const isArray = Array.isArray(value);
  if (depth >= LOG_DETAIL_DEPTH) return isArray ? '[Array]' : '[Object]';
  if (seen.has(value)) return '[Circular]';

  seen.add(value);
  try {
    if (isArray) {
      return value.slice(0, LOG_MAX_ITEMS).map((item) => sanitizeValue(item, depth + 1, seen));
    }
    const result = {};
    for (const key of Object.keys(value).slice(0, LOG_MAX_ITEMS)) {
      try {
        result[key] = sanitizeValue(value[key], depth + 1, seen);
      } catch {
        result[key] = '[Unreadable]';
      }
    }
    return result;
  } finally {
    seen.delete(value);
  }
}

/**
 * JSON-safe copy of a value: strings truncated, collections capped, cycles and
 * unreadable getters marked. Never throws.
 */
export function sanitizeValue(value, depth = 0, seen = new WeakSet()) {
  try {
    if (value === undefined || value === null) return value;
    const type = typeof value;
    if (type === 'string') {
      return value.length > LOG_STRING_MAX_CHARS
        ? `${value.slice(0, LOG_STRING_MAX_CHARS)}…`
        : value;
    }
    if (type === 'number' || type === 'boolean') return value;
    if (type === 'bigint' || type === 'symbol') return String(value);
    if (type === 'function') return `[Function ${value.name || 'anonymous'}]`;
    if (isDomNode(value)) return describeNode(value);
    return sanitizeObject(value, depth, seen);
  } catch {
    return '[Unserializable]';
  }
}
