import { requestJson } from './request.js';

/** DeepL's target-language codes. */
export function deeplTarget(code) {
  if (code === 'pt') return 'PT-BR';
  if (code === 'zh-CN') return 'ZH';
  return String(code || '').toUpperCase();
}

/** Read DeepL's translation response. */
export function parseDeepLResponse(data) {
  const row = data && Array.isArray(data.translations) ? data.translations[0] : null;
  const text = row && typeof row.text === 'string' ? row.text : '';
  if (!text) throw new Error('DeepL returned an empty translation');
  const detected = typeof row.detected_source_language === 'string'
    ? row.detected_source_language.toLowerCase()
    : null;
  return { text, detectedSourceLang: detected };
}

/** Translate through the DeepL API. */
export async function translateWithDeepL(text, target, config = {}) {
  if (!config.apiKey) throw new Error('DeepL requires an API key');
  const host = config.plan === 'pro' ? 'https://api.deepl.com' : 'https://api-free.deepl.com';
  const body = new URLSearchParams({ text, target_lang: deeplTarget(target) }).toString();
  const data = await requestJson({
    url: `${host}/v2/translate`,
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${config.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  return parseDeepLResponse(data);
}
