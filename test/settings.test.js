import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = {
  getItem: () => null,
  setItem() {},
  removeItem() {},
};

test('file preview settings normalize the long-press toggle', async () => {
  const { normalizeImportedSettings } = await import('../src/core/settings.js');
  const settings = normalizeImportedSettings({ filePreview: { longPress: false } });
  assert.equal(settings.filePreview.longPress, false);
  assert.equal(settings.filePreview.enabled, true);
  assert.equal(settings.filePreview.rowButton, true);
});
