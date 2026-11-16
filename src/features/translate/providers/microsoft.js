import { requestJson } from './request.js';

/** Read Microsoft Translator's response. */
export function parseMicrosoftResponse(data) {
  const row = Array.isArray(data) ? data[0] : null;
  const translation = row && Array.isArray(row.translations) ? row.translations[0] : null;
  const text = translation && typeof translation.text === 'string' ? translation.text : '';
  if (!text) throw new Error('Microsoft returned an empty translation');
  const detected = row && row.detectedLanguage && typeof row.detectedLanguage.language === 'string'
    ? row.detectedLanguage.language
    : null;
  return { text, detectedSourceLang: detected };
}

/** Translate through the Microsoft Translator API. */
export async function translateWithMicrosoft(text, target, config = {}) {
  if (!config.apiKey) throw new Error('Microsoft requires an API key');
  const headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': config.apiKey,
  };
  if (config.region) headers['Ocp-Apim-Subscription-Region'] = config.region;
  const data = await requestJson({
    url: `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${encodeURIComponent(target)}`,
    method: 'POST',
    headers,
    body: JSON.stringify([{ Text: text }]),
  });
  return parseMicrosoftResponse(data);
}
