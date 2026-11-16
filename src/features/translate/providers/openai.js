import { TRANSLATE_TARGET_LANGUAGES } from '../../../core/constants.js';
import { requestJson } from './request.js';

function languageName(code) {
  const row = TRANSLATE_TARGET_LANGUAGES.find((language) => language.code === code);
  return row ? row.name : code;
}

function systemPrompt(target) {
  return [
    `Translate the user's text into ${languageName(target)}.`,
    'Keep every private-use placeholder character (Unicode U+E000 to U+E101)',
    'exactly where it is, and do not add spaces or punctuation around it.',
    'Preserve the meaning and tone; do not add commentary, notes or quotes.',
    'If the text is already in the target language, return it unchanged.',
  ].join(' ');
}

/** Read the chat-completions response. */
export function parseOpenAIResponse(data) {
  const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
  const content = choice && choice.message ? choice.message.content : null;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenAI returned an empty translation');
  }
  return { text: content.trim(), detectedSourceLang: null };
}

/** Translate through any chat-completions-compatible endpoint. */
export async function translateWithOpenAI(text, target, config = {}) {
  if (!config.apiKey) throw new Error('OpenAI requires an API key');
  const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const data = await requestJson({
    url: `${baseUrl}/chat/completions`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt(target) },
        { role: 'user', content: text },
      ],
    }),
  });
  return parseOpenAIResponse(data);
}
