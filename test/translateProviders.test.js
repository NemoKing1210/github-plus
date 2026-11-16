import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from '../src/core/constants.js';
import { PROVIDER_IDS } from '../src/features/translate/providers/registry.js';
import { parseGoogleResponse } from '../src/features/translate/providers/google.js';
import { deeplTarget, parseDeepLResponse } from '../src/features/translate/providers/deepl.js';
import { parseMicrosoftResponse } from '../src/features/translate/providers/microsoft.js';
import { parseYandexResponse } from '../src/features/translate/providers/yandex.js';
import { parseLibreResponse } from '../src/features/translate/providers/libretranslate.js';

test('the provider registry matches the settings whitelist', () => {
  assert.deepEqual(PROVIDER_IDS, Object.keys(DEFAULT_SETTINGS.translate.providerConfig));
});

test('google parses segments and detected language', () => {
  const out = parseGoogleResponse([[['Hola ', 'Hello '], ['mundo', 'world']], null, 'en']);
  assert.deepEqual(out, { text: 'Hola mundo', detectedSourceLang: 'en' });
  assert.throws(() => parseGoogleResponse([[[]], null, 'en']));
});

test('deepl parses translations and maps target codes', () => {
  assert.deepEqual(
    parseDeepLResponse({ translations: [{ text: 'Hola', detected_source_language: 'EN' }] }),
    { text: 'Hola', detectedSourceLang: 'en' },
  );
  assert.equal(deeplTarget('ru'), 'RU');
  assert.equal(deeplTarget('pt'), 'PT-BR');
  assert.equal(deeplTarget('zh-CN'), 'ZH');
});

test('microsoft parses its response shape', () => {
  assert.deepEqual(
    parseMicrosoftResponse([{ translations: [{ text: 'Hola' }], detectedLanguage: { language: 'en' } }]),
    { text: 'Hola', detectedSourceLang: 'en' },
  );
});

test('yandex parses its response shape', () => {
  assert.deepEqual(
    parseYandexResponse({ translations: [{ text: 'Hola', detectedLanguageCode: 'en' }] }),
    { text: 'Hola', detectedSourceLang: 'en' },
  );
});

test('libretranslate parses its response shape', () => {
  assert.deepEqual(
    parseLibreResponse({ translatedText: 'Hola', detectedLanguage: { language: 'en' } }),
    { text: 'Hola', detectedSourceLang: 'en' },
  );
});
