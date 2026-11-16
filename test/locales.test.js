import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS } from '../src/i18n/locales/index.js';

test('every locale has the same keys in the same order as English', () => {
  const english = Object.keys(TRANSLATIONS.en);
  for (const [locale, messages] of Object.entries(TRANSLATIONS)) {
    assert.deepEqual(Object.keys(messages), english, `locale ${locale} drifted`);
  }
});
