import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTargetLang, targetLanguageLabel } from '../src/features/translate/languages.js';

test('an explicit target wins over the locale', () => {
  assert.equal(resolveTargetLang('de', 'ru'), 'de');
});

test('auto follows the UI locale with region mapping', () => {
  assert.equal(resolveTargetLang('auto', 'ru'), 'ru');
  assert.equal(resolveTargetLang('auto', 'pt-BR'), 'pt');
  assert.equal(resolveTargetLang('auto', 'zh-CN'), 'zh-CN');
  assert.equal(resolveTargetLang('auto', 'xx'), 'en');
});

test('labels use the native name and flag', () => {
  assert.equal(targetLanguageLabel('ru'), '🇷🇺 Русский');
  assert.equal(targetLanguageLabel('xx'), 'xx');
});
