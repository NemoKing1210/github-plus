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
  assert.equal(settings.filePreview.longPressRing, true);
});

test('the long-press time is clamped to its bounds and falls back on junk', async () => {
  const { normalizeImportedSettings } = await import('../src/core/settings.js');
  const low = normalizeImportedSettings({ filePreview: { longPressMs: 10, longPressRing: false } });
  assert.equal(low.filePreview.longPressMs, 200);
  assert.equal(low.filePreview.longPressRing, false);

  const high = normalizeImportedSettings({ filePreview: { longPressMs: 99999 } });
  assert.equal(high.filePreview.longPressMs, 2000);

  const junk = normalizeImportedSettings({ filePreview: { longPressMs: 'soon' } });
  assert.equal(junk.filePreview.longPressMs, 450);
});
