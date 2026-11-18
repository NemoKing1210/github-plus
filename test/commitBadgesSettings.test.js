import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const { normalizeImportedSettings } = await import('../src/core/settings.js');

test('commit badge settings default to on', () => {
  const settings = normalizeImportedSettings({});
  assert.deepEqual(settings.commitBadges, { enabled: true, unknownTypes: true, breaking: true });
});

test('booleans are preserved and junk falls back', () => {
  const off = normalizeImportedSettings({ commitBadges: { enabled: false, unknownTypes: false, breaking: false } });
  assert.deepEqual(off.commitBadges, { enabled: false, unknownTypes: false, breaking: false });
  const junk = normalizeImportedSettings({ commitBadges: { enabled: 'yes', unknownTypes: 1, breaking: null } });
  assert.deepEqual(junk.commitBadges, { enabled: true, unknownTypes: true, breaking: true });
});

test('unknown keys are dropped', () => {
  const settings = normalizeImportedSettings({ commitBadges: { color: 'red' } });
  assert.equal('color' in settings.commitBadges, false);
});
