import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><head>
  <meta name="user-login" content="alice">
</head><body></body></html>`, { url: 'https://github.com/alice/repo', pretendToBeVisual: true });

for (const key of [
  'window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'KeyboardEvent', 'MouseEvent',
]) {
  globalThis[key] = dom.window[key];
}
globalThis.location = dom.window.location;

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, value),
  removeItem: (key) => store.delete(key),
};

globalThis.GM_xmlhttpRequest = (options) => {
  options.onload({
    status: 200,
    responseText: JSON.stringify({ login: 'bob' }),
    responseHeaders: '',
  });
};

const paletteStore = await import('../src/features/commandPalette/store.js');
const { renderCommandPalette } = await import('../src/features/settings/tabs/commandPalette.js');
const { getDefaults } = await import('../src/core/constants.js');

test('verifying a token for another account wipes every cached data set', async () => {
  paletteStore.writeCacheRecord({
    version: 1,
    login: 'alice',
    tokenLogin: 'alice',
    tokenFingerprint: 'alice-print',
    sources: { repos: { etag: '"r"', items: [], fetchedAt: Date.now() } },
    trees: { 'alice/repo@main': { etag: '"t"', items: [], fetchedAt: Date.now() } },
    issues: { 'alice/repo': { etag: '"i"', items: [{ number: 1, title: 'Private issue' }], fetchedAt: Date.now() } },
    rateLimit: { remaining: 1, resetAt: Date.now() + 60000 },
  });

  const draft = { commandPalette: { ...getDefaults().commandPalette, token: 'ghp_new' } };
  const container = document.createElement('div');
  renderCommandPalette(container, draft);
  const check = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Check token');
  assert.ok(check, 'the Check token button renders');
  check.click();
  await new Promise((resolve) => setTimeout(resolve, 20));

  const record = paletteStore.readCacheRecord();
  assert.equal(record.login, 'bob');
  assert.deepEqual(record.sources, {});
  assert.deepEqual(record.trees, {});
  assert.deepEqual(record.issues, {});
  assert.equal(record.rateLimit, null);
});
