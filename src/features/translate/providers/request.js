/**
 * HTTP transport shared by every translation provider: the userscript
 * manager's request API when available, `fetch` otherwise.
 */

function requestError(status, body) {
  const error = new Error(`Request failed with status ${status}`);
  error.status = status;
  error.body = body;
  return error;
}

function gmRequest(options) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: options.method,
      url: options.url,
      headers: options.headers,
      data: options.body,
      timeout: options.timeout,
      responseType: 'text',
      onload: (response) => {
        if (response.status >= 200 && response.status < 300) {
          resolve(response.responseText ?? response.response ?? '');
        } else {
          reject(requestError(response.status, response.responseText ?? response.response));
        }
      },
      onerror: () => reject(new Error('Network request failed')),
      ontimeout: () => reject(new Error('Request timed out')),
    });
  });
}

/** Fetch a URL as text, rejecting on a non-2xx status. */
export async function requestText({
  url,
  method = 'GET',
  headers = {},
  body,
  timeout = 20000,
}) {
  if (typeof GM_xmlhttpRequest === 'function') {
    return gmRequest({ url, method, headers, body, timeout });
  }
  if (typeof fetch !== 'function') throw new Error('No HTTP transport available');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { method, headers, body, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw requestError(response.status, text);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch a URL and parse its JSON body. */
export async function requestJson(options) {
  const text = await requestText(options);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The provider returned invalid JSON');
  }
}
