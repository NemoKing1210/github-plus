import { requestJson } from './request.js';

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

/** Read Google's segmented translation response. */
export function parseGoogleResponse(data) {
  const segments = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
  const text = segments
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
    .join('');
  if (!text) throw new Error('Google returned an empty translation');
  const detected = typeof data[2] === 'string'
    ? data[2]
    : (Array.isArray(data[8]) && Array.isArray(data[8][0]) ? data[8][0][0] : null);
  return { text, detectedSourceLang: detected || null };
}

/** Translate through Google's free web endpoint. */
export async function translateWithGoogle(text, target) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: target,
    dt: 't',
    q: text,
  });
  const query = params.toString();
  const url = `${ENDPOINT}?${query}`;
  const data = url.length > 1500
    ? await requestJson({
      url: ENDPOINT,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: query,
    })
    : await requestJson({ url });
  return parseGoogleResponse(data);
}
