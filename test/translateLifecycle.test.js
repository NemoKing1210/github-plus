import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><body><main>
  <h1 class="js-issue-title">Fix the parser</h1>
  <div class="markdown-body"><p>Hello world.</p></div>
</main></body></html>`, { pretendToBeVisual: true, url: 'https://github.com/o/r' });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.history = dom.window.history;
globalThis.localStorage = dom.window.localStorage;
globalThis.MutationObserver = dom.window.MutationObserver;

const { saveSettings } = await import('../src/core/settings.js');
const { initTranslateFeature, applyTranslateSettings } = await import(
  '../src/features/translate/index.js'
);

test('boot decorates markdown and title containers, and disabling removes them', () => {
  initTranslateFeature();
  applyTranslateSettings();
  assert.equal(document.querySelectorAll('.gp-translate-btn').length, 2);
  const title = document.querySelector('.js-issue-title');
  assert.ok(title.parentElement.querySelector('.gp-translate-btn'));

  saveSettings({ translate: { enabled: false } });
  applyTranslateSettings();
  assert.equal(document.querySelectorAll('.gp-translate-btn').length, 0);
  assert.equal(document.querySelectorAll('.gp-translate-bar').length, 0);
});

test('a replaced shell is decorated again without a navigation event', async () => {
  saveSettings({ translate: { enabled: true } });
  applyTranslateSettings();
  assert.equal(document.querySelectorAll('.gp-translate-btn').length, 2);

  const nextBody = document.createElement('body');
  nextBody.innerHTML = '<main><div class="markdown-body"><p>Another page.</p></div></main>';
  document.documentElement.replaceChild(nextBody, document.body);

  await new Promise((resolve) => { setTimeout(resolve, 700); });
  assert.equal(document.querySelectorAll('.gp-translate-btn').length, 1);
  applyTranslateSettings();
});

test('a control left by the previous page is removed when nothing is translatable', async () => {
  saveSettings({ translate: { enabled: true } });
  document.body.innerHTML = '<main><div class="readmeHeaderSlot__test">'
    + '<div class="markdown-body"><p>Old page.</p></div></div></main>';
  applyTranslateSettings();
  assert.equal(document.querySelectorAll('.gp-translate-btn').length, 1);

  history.pushState({}, '', '/o/r/blob/main/LICENSE');
  const markdown = document.querySelector('.markdown-body');
  const plain = document.createElement('div');
  plain.className = 'react-code-lines';
  plain.textContent = 'MIT License';
  markdown.replaceWith(plain);

  await new Promise((resolve) => { setTimeout(resolve, 1400); });
  assert.equal(document.querySelectorAll('.gp-translate-btn').length, 0);
  applyTranslateSettings();
});
