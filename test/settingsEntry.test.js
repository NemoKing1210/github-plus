import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const disk = new Map();
globalThis.localStorage = {
  getItem: (key) => (disk.has(key) ? disk.get(key) : null),
  setItem: (key, value) => disk.set(key, value),
  removeItem: (key) => disk.delete(key),
};

const dom = new JSDOM(`<!doctype html><html><body>
  <header class="AppHeader"><div class="AppHeader-globalBar-end">
    <a class="AppHeader-user" href="/me">me</a>
  </div></header>
</body></html>`, { url: 'https://github.com/o/r', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.MutationObserver = dom.window.MutationObserver;

const { headerActionNode } = await import('../src/ui/headerActions.js');
const { initSettingsFeature } = await import('../src/features/settings/index.js');

initSettingsFeature();

test('the settings feature adds no header entry', () => {
  assert.equal(headerActionNode('settings'), null);
  assert.equal(document.querySelector('.gp-settings-btn'), null);
  assert.equal(document.querySelector('.AppHeader-globalBar-end .gp-header-btn'), null);
});
