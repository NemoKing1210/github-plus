import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const {
  DEFAULT_SETTINGS,
  TRANSLATE_CACHE_HOURS_MAX,
  TRANSLATE_TARGET_LANGUAGES,
} = await import('../src/core/constants.js');
const { normalizeImportedSettings } = await import('../src/core/settings.js');

const section = (patch) => normalizeImportedSettings({ translate: patch }).translate;

test('translation defaults ship enabled in button mode', () => {
  assert.equal(section({}).enabled, true);
  assert.equal(section({}).provider, 'google');
  assert.equal(section({}).mode, 'button');
  assert.equal(section({}).display, 'replace');
  assert.equal(section({}).reveal, 'button');
  assert.equal(section({}).targetLang, 'auto');
  assert.equal(section({}).cacheHours, 24);
});

test('unknown provider falls back and its config stays complete', () => {
  const out = section({ provider: 'bogus', providerConfig: { bogus: { apiKey: 'x' } } });
  assert.equal(out.provider, 'google');
  assert.deepEqual(
    Object.keys(out.providerConfig).sort(),
    Object.keys(DEFAULT_SETTINGS.translate.providerConfig).sort(),
  );
});

test('provider config keeps strings, drops wrong types and normalizes the plan', () => {
  const out = section({ providerConfig: { deepl: { apiKey: 42, plan: 'enterprise' } } });
  assert.equal(out.providerConfig.deepl.apiKey, '');
  assert.equal(out.providerConfig.deepl.plan, 'free');
});

test('target language is whitelisted', () => {
  assert.ok(TRANSLATE_TARGET_LANGUAGES.some((lang) => lang.code === 'ru'));
  assert.equal(section({ targetLang: 'ru' }).targetLang, 'ru');
  assert.equal(section({ targetLang: 'xx' }).targetLang, 'auto');
});

test('mode, display and reveal are enums', () => {
  assert.equal(section({ mode: 'auto' }).mode, 'auto');
  assert.equal(section({ mode: 'later' }).mode, 'button');
  assert.equal(section({ display: 'below' }).display, 'below');
  assert.equal(section({ display: 'side' }).display, 'replace');
  assert.equal(section({ reveal: 'hover' }).reveal, 'hover');
  assert.equal(section({ reveal: 'peek' }).reveal, 'button');
});

test('surface switches follow the defaults exactly', () => {
  const out = section({ surfaces: { markdown: false, nope: true } });
  assert.deepEqual(out.surfaces, {
    markdown: false,
    commits: true,
    titles: true,
    preview: true,
  });
});

test('cache hours clamp to 0..max and reject junk', () => {
  assert.equal(section({ cacheHours: -5 }).cacheHours, 0);
  assert.equal(
    section({ cacheHours: TRANSLATE_CACHE_HOURS_MAX + 1 }).cacheHours,
    TRANSLATE_CACHE_HOURS_MAX,
  );
  assert.equal(section({ cacheHours: 'x' }).cacheHours, 24);
});
