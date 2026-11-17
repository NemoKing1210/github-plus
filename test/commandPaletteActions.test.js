import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://github.com/' });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event']) {
  globalThis[key] = dom.window[key];
}
globalThis.location = dom.window.location;

let disk;
globalThis.localStorage = {
  getItem: (key) => (disk.has(key) ? disk.get(key) : null),
  setItem: (key, value) => disk.set(key, value),
  removeItem: (key) => disk.delete(key),
};

beforeEach(() => { disk = new Map(); });

const { getSettings, saveSettings } = await import('../src/core/settings.js');
const { togglePatch, runAction } = await import('../src/features/commandPalette/actions.js');

test('a palette toggle preserves the section it does not touch', () => {
  saveSettings({
    translate: {
      provider: 'deepl',
      providerConfig: { deepl: { apiKey: 'secret' } },
      targetLang: 'de',
      cacheHours: 48,
    },
  });
  const patch = togglePatch('translate', false);
  assert.equal(patch.translate.enabled, false);
  assert.equal(patch.translate.provider, 'deepl');
  assert.equal(patch.translate.providerConfig.deepl.apiKey, 'secret');
  assert.equal(patch.translate.targetLang, 'de');
  assert.equal(patch.translate.cacheHours, 48);
});

test('turning a feature off from the palette keeps its other settings', async () => {
  saveSettings({
    translate: {
      provider: 'deepl',
      providerConfig: { deepl: { apiKey: 'secret' } },
      targetLang: 'de',
    },
  });
  await runAction({ type: 'toggle', section: 'translate', enabled: false });
  const saved = getSettings().translate;
  assert.equal(saved.enabled, false);
  assert.equal(saved.provider, 'deepl');
  assert.equal(saved.providerConfig.deepl.apiKey, 'secret');
  assert.equal(saved.targetLang, 'de');
});

test('clearing the cache runs the lifecycle clearer when one is supplied', async () => {
  let cleared = 0;
  await runAction(
    { type: 'clearCache' },
    { clearPaletteCache: () => { cleared += 1; }, refresh: () => {} },
  );
  assert.equal(cleared, 1);
});
