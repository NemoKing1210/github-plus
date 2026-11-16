import { requestJson } from './request.js';

/** Read Yandex Translate's response. */
export function parseYandexResponse(data) {
  const row = data && Array.isArray(data.translations) ? data.translations[0] : null;
  const text = row && typeof row.text === 'string' ? row.text : '';
  if (!text) throw new Error('Yandex returned an empty translation');
  const detected = row && typeof row.detectedLanguageCode === 'string'
    ? row.detectedLanguageCode
    : null;
  return { text, detectedSourceLang: detected };
}

/** Translate through the Yandex Cloud Translate API. */
export async function translateWithYandex(text, target, config = {}) {
  if (!config.apiKey) throw new Error('Yandex requires an API key');
  const targetLanguageCode = target === 'zh-CN' ? 'zh' : target;
  const data = await requestJson({
    url: 'https://translate.api.cloud.yandex.net/translate/v2/translate',
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folderId: config.folderId || '',
      targetLanguageCode,
      texts: [text],
    }),
  });
  return parseYandexResponse(data);
}
