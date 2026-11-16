import { requestJson } from './request.js';

/** Read LibreTranslate's response. */
export function parseLibreResponse(data) {
  const text = data && typeof data.translatedText === 'string' ? data.translatedText : '';
  if (!text) throw new Error('LibreTranslate returned an empty translation');
  const detected = data && data.detectedLanguage && typeof data.detectedLanguage.language === 'string'
    ? data.detectedLanguage.language
    : null;
  return { text, detectedSourceLang: detected };
}

/** Translate through a LibreTranslate instance. */
export async function translateWithLibreTranslate(text, target, config = {}) {
  const apiUrl = (config.apiUrl || 'https://libretranslate.com').replace(/\/+$/, '');
  const body = {
    q: text,
    source: 'auto',
    target,
    format: 'text',
  };
  if (config.apiKey) body.api_key = config.apiKey;
  const data = await requestJson({
    url: `${apiUrl}/translate`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseLibreResponse(data);
}
