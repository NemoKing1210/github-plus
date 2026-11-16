import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><body><main>
  <div class="markdown-body"><p>Hello world.</p></div>
</main></body></html>`, { pretendToBeVisual: true, url: 'https://github.com/o/r' });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;
globalThis.MutationObserver = dom.window.MutationObserver;

const { saveSettings } = await import('../src/core/settings.js');
const { initTranslateFeature, applyTranslateSettings } = await import(
  '../src/features/translate/index.js'
);

test('boot decorates a markdown container and disabling removes it', () => {
  initTranslateFeature();
  applyTranslateSettings();
  assert.equal(document.querySelectorAll('.gp-translate-btn').length, 1);

  saveSettings({ translate: { enabled: false } });
  applyTranslateSettings();
  assert.equal(document.querySelectorAll('.gp-translate-btn').length, 0);
  assert.equal(document.querySelectorAll('.gp-translate-bar').length, 0);
});
