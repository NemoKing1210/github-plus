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

test('the folder tree is enabled by default and accepts an explicit false', async () => {
  const { normalizeImportedSettings } = await import('../src/core/settings.js');
  const empty = normalizeImportedSettings({});
  assert.equal(empty.folderTree.enabled, true);

  const off = normalizeImportedSettings({ folderTree: { enabled: false } });
  assert.equal(off.folderTree.enabled, false);
});

test('the folder tree falls back to the default on junk', async () => {
  const { normalizeImportedSettings } = await import('../src/core/settings.js');
  const junk = normalizeImportedSettings({ folderTree: { enabled: 'yes' } });
  assert.equal(junk.folderTree.enabled, true);
});

test('list avatars are on by default and accept an explicit false', async () => {
  const { normalizeImportedSettings } = await import('../src/core/settings.js');
  assert.equal(normalizeImportedSettings({}).listAvatars.enabled, true);
  assert.equal(
    normalizeImportedSettings({ listAvatars: { enabled: false } }).listAvatars.enabled,
    false,
  );
  assert.equal(
    normalizeImportedSettings({ listAvatars: { enabled: 'yes' } }).listAvatars.enabled,
    true,
  );
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
