/**
 * HTTP transport shared by every translation provider. Providers see only the
 * body and an error for a non-2xx status; the transport below reports status
 * and headers for callers that need them.
 */

import { request } from '../../../utils/http.js';

function requestError(status, body) {
  const error = new Error(`Request failed with status ${status}`);
  error.status = status;
  error.body = body;
  return error;
}

/** Fetch a URL as text, rejecting on a non-2xx status. */
export async function requestText(options) {
  const response = await request(options);
  if (response.status >= 200 && response.status < 300) return response.text;
  throw requestError(response.status, response.text);
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
