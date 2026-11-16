import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = {
  getItem: () => null,
  setItem() {},
  removeItem() {},
};

const { normalizeImportedSettings, saveSettings } = await import('../src/core/settings.js');
const { isLoggingEnabled } = await import('../src/core/logger/index.js');
const { applyLoggingSettings } = await import('../src/features/logging/index.js');

test('logging is off by default and normalized to a boolean', () => {
  const defaults = normalizeImportedSettings({});
  assert.equal(defaults.logging.enabled, false);
  assert.equal(normalizeImportedSettings({ logging: { enabled: true } }).logging.enabled, true);
  assert.equal(normalizeImportedSettings({ logging: { enabled: 'yes' } }).logging.enabled, false);
});

test('applying the saved setting drives the logger', () => {
  const originalInfo = console.info;
  console.info = () => {};
  try {
    saveSettings({ logging: { enabled: true } });
    applyLoggingSettings();
    assert.equal(isLoggingEnabled(), true);

    saveSettings({ logging: { enabled: false } });
    applyLoggingSettings();
    assert.equal(isLoggingEnabled(), false);
  } finally {
    console.info = originalInfo;
  }
});
