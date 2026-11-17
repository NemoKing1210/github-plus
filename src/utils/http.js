/**
 * HTTP transport that keeps the response status and headers, shared by the
 * translation providers and the command palette: the userscript manager's
 * request API when available, `fetch` otherwise. A caller that only needs the
 * body can throw on a non-2xx status itself; this layer never does.
 */

/** Parse a raw header block into lower-case names with trimmed values. */
export function normalizeHeaders(raw) {
  const headers = {};
  if (!raw) return headers;
  if (typeof raw.forEach === 'function') {
    raw.forEach((value, name) => {
      headers[String(name).toLowerCase()] = String(value).trim();
    });
    return headers;
  }
  for (const line of String(raw).split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const name = line.slice(0, colon).trim().toLowerCase();
    if (name) headers[name] = line.slice(colon + 1).trim();
  }
  return headers;
}

function abortError() {
  const error = new Error('The request was aborted');
  error.name = 'AbortError';
  return error;
}

function gmRequest({ url, method, headers, body, timeout, signal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const controller = GM_xmlhttpRequest({
      method,
      url,
      headers,
      data: body,
      timeout,
      responseType: 'text',
      onload: (response) => {
        resolve({
          status: response.status,
          text: response.responseText ?? response.response ?? '',
          headers: normalizeHeaders(response.responseHeaders),
        });
      },
      onerror: () => reject(new Error('Network request failed')),
      ontimeout: () => reject(new Error('Request timed out')),
    });
    signal?.addEventListener('abort', () => {
      controller?.abort?.();
      reject(abortError());
    }, { once: true });
  });
}

/** Resolve `{ status, text, headers }` for any HTTP status; reject on transport failure. */
export async function request({
  url,
  method = 'GET',
  headers = {},
  body,
  timeout = 20000,
  signal,
}) {
  if (typeof GM_xmlhttpRequest === 'function') {
    return gmRequest({ url, method, headers, body, timeout, signal });
  }
  if (typeof fetch !== 'function') throw new Error('No HTTP transport available');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort, { once: true });
  try {
    const response = await fetch(url, { method, headers, body, signal: controller.signal });
    const text = await response.text();
    return { status: response.status, text, headers: normalizeHeaders(response.headers) };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
