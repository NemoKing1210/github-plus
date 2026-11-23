/**
 * Typed failures for the similar-repositories providers. A caller maps `code`
 * to a panel state and a localized message; nothing here touches the DOM.
 */
export class ApiError extends Error {
  /**
   * @param {string} code one of `invalid`, `not-in-dataset`, `star-required`,
   *   `rate-limited`, `private`, `network`
   * @param {string} message developer-facing detail, never shown raw
   * @param {{ resetAt?: number, status?: number }} [extra]
   */
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    if (extra.resetAt) this.resetAt = extra.resetAt;
    if (extra.status) this.status = extra.status;
  }
}

/** False for an abort, which the lifecycle owns and rethrows untouched. */
export function isAbort(error) {
  return error?.name === 'AbortError';
}

/** Turn a transport rejection into a typed error, abort aside. */
export function networkError(error) {
  return new ApiError('network', error?.message || 'Network request failed');
}

/** Read a whole-second or millisecond reset header into an epoch timestamp. */
export function resetFromHeaders(headers = {}) {
  const retryAfter = Number(headers['retry-after']);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Date.now() + retryAfter * 1000;
  const reset = Number(headers['x-ratelimit-reset']);
  if (Number.isFinite(reset) && reset > 0) {
    return reset > 1e12 ? reset : reset * 1000;
  }
  return 0;
}
