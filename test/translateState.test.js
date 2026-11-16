import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><body>
  <div class="markdown-body">
    <p>Read <a href="https://x">docs</a>.</p>
    <p>Second paragraph.</p>
  </div>
</body></html>`, { pretendToBeVisual: true, url: 'https://github.com/o/r' });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;

const { ensureContainer, runContainer, toggleContainer, teardownAllContainers } = await import(
  '../src/features/translate/state.js'
);
const container = document.querySelector('.markdown-body');
const surface = { id: 'markdown', labelKey: 'translate.surfaceMarkdown' };

const upper = async (text) => ({ text: text.toUpperCase(), detectedSourceLang: 'en' });

test('translates blocks in place and restores the exact original', async () => {
  const original = container.innerHTML;
  const state = ensureContainer(container, surface);
  assert.ok(state.button.classList.contains('gp-translate-btn'));
  await runContainer(state, { translate: upper });
  assert.match(container.textContent, /READ/);
  assert.match(container.innerHTML, /href="https:\/\/x"/);
  assert.equal(state.button.dataset.gpTranslateState, 'shown');
  toggleContainer(state);
  assert.equal(container.innerHTML, original);
  teardownAllContainers();
});

test('below mode keeps the original and appends result boxes', async () => {
  const original = container.innerHTML;
  const state = ensureContainer(container, surface);
  state.display = 'below';
  await runContainer(state, { translate: upper });
  assert.equal(container.querySelectorAll('.gp-translate-result').length, 2);
  assert.ok(container.innerHTML.startsWith(original.slice(0, 20)));
  toggleContainer(state);
  assert.equal(container.querySelectorAll('.gp-translate-result').length, 0);
  teardownAllContainers();
});

test('a provider that drops a link token still keeps the link', async () => {
  const state = ensureContainer(container, surface);
  await runContainer(state, { translate: async () => ({ text: 'Перевод.', detectedSourceLang: 'en' }) });
  assert.match(container.innerHTML, /href="https:\/\/x"/);
  teardownAllContainers();
});

test('inline elements keep their place inside the translated block', async () => {
  const state = ensureContainer(container, surface);
  await runContainer(state, { translate: upper });
  assert.match(
    container.querySelector('p').innerHTML,
    /^READ <a href="https:\/\/x">DOCS<\/a>\.$/,
  );
  teardownAllContainers();
});

test('a provider that drops most placeholders leaves the block untouched', async () => {
  const state = ensureContainer(container, surface);
  const paragraph = container.querySelector('p');
  const original = paragraph.innerHTML;
  await runContainer(state, {
    translate: async () => ({ text: 'Перевод.', detectedSourceLang: 'en' }),
  });
  assert.equal(paragraph.innerHTML, original);
  assert.equal(state.status, 'partial');
  teardownAllContainers();
});

test('a provider missing its API key is reported before any request', async () => {
  const { saveSettings } = await import('../src/core/settings.js');
  saveSettings({ translate: { provider: 'deepl' } });
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error('offline');
  };
  const state = ensureContainer(container, surface);
  try {
    await runContainer(state, {});
  } finally {
    globalThis.fetch = originalFetch;
    saveSettings({ translate: { provider: 'google' } });
  }
  assert.equal(calls, 0);
  assert.equal(state.status, 'error');
  assert.match(document.querySelector('.gp-translate-status').textContent, /API key/);
  teardownAllContainers();
});

test('an automatic run does not move focus to the button', async () => {
  const state = ensureContainer(container, surface);
  await runContainer(state, { translate: upper });
  assert.notEqual(document.activeElement, state.button);
  teardownAllContainers();
});

test('a partial failure keeps the blocks that succeeded', async () => {
  const state = ensureContainer(container, surface);
  const translate = async (text) => {
    if (text.includes('Second')) throw new Error('boom');
    return { text: text.toUpperCase(), detectedSourceLang: 'en' };
  };
  await runContainer(state, { translate });
  assert.match(container.textContent, /READ/);
  assert.equal(state.status, 'partial');
  teardownAllContainers();
});

test('a response for a stale run is discarded', async () => {
  const state = ensureContainer(container, surface);
  const original = container.innerHTML;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const run = runContainer(state, {
    translate: async (text) => { await pending; return { text: text.toUpperCase(), detectedSourceLang: 'en' }; },
  });
  state.runId += 1;
  release();
  await run;
  assert.equal(container.innerHTML, original);
  teardownAllContainers();
});

test('a header that dropped the button gets it back on the next scan', () => {
  const slot = document.createElement('header');
  const host = document.createElement('div');
  host.className = 'markdown-body';
  host.innerHTML = '<p>Text with changes.</p>';
  document.body.append(slot, host);
  const withHeader = { ...surface, headerFor: () => slot };
  const state = ensureContainer(host, withHeader);
  assert.equal(state.button.parentElement, slot);
  state.button.remove();
  ensureContainer(host, withHeader);
  assert.equal(state.button.parentElement, slot);
  teardownAllContainers();
  host.remove();
  slot.remove();
});

test('a caller-supplied button is not bound to toggle the container', async () => {
  const button = document.createElement('button');
  button.className = 'gp-translate-btn';
  const state = ensureContainer(container, surface, { button });
  assert.ok(state);
  button.click();
  assert.equal(state.status, 'idle');
  teardownAllContainers();
});

test('a nested list inside a painted item survives the translation', async () => {
  const host = document.createElement('div');
  host.className = 'markdown-body';
  host.innerHTML = '<ul><li>Parent text<ul><li>Child text</li></ul></li></ul>';
  document.body.appendChild(host);
  const state = ensureContainer(host, surface);
  await runContainer(state, { translate: upper });
  assert.equal(host.querySelectorAll('li').length, 2);
  assert.ok(host.querySelector('li > ul > li'));
  assert.match(host.textContent, /PARENT/);
  assert.match(host.textContent, /CHILD/);
  teardownAllContainers();
  host.remove();
});

test('hover reveal shows the original while the pointer is over the container', async () => {
  const { saveSettings } = await import('../src/core/settings.js');
  saveSettings({ translate: { reveal: 'hover' } });
  const original = container.textContent;
  const state = ensureContainer(container, surface);
  await runContainer(state, { translate: upper });
  assert.match(container.textContent, /READ/);
  container.dispatchEvent(new window.Event('pointerenter'));
  assert.equal(container.textContent, original);
  container.dispatchEvent(new window.Event('pointerleave'));
  assert.match(container.textContent, /READ/);
  teardownAllContainers();
  saveSettings({ translate: { reveal: 'button' } });
});

test('a total failure marks the bar status as an error', async () => {
  const state = ensureContainer(container, surface);
  const originalError = console.error;
  console.error = () => {};
  try {
    await runContainer(state, { translate: async () => { throw new Error('down'); } });
  } finally {
    console.error = originalError;
  }
  const status = document.querySelector('.gp-translate-status');
  assert.ok(status);
  assert.ok(status.classList.contains('is-error'));
  teardownAllContainers();
});

test('a header-hosted action reports status on the button, not in a bar', async () => {
  const slot = document.createElement('header');
  const host = document.createElement('div');
  host.className = 'markdown-body';
  host.innerHTML = '<p>Read <a href="https://x">docs</a>.</p>';
  document.body.append(slot, host);
  const withHeader = { ...surface, headerFor: () => slot };
  const state = ensureContainer(host, withHeader);
  await runContainer(state, { translate: upper });
  assert.equal(host.previousElementSibling, slot);
  assert.equal(document.querySelectorAll('.gp-translate-bar').length, 0);
  assert.equal(state.button.parentElement, slot);
  assert.equal(state.button.title, '');
  assert.doesNotMatch(document.body.textContent, /Translated from/);
  teardownAllContainers();
  host.remove();
  slot.remove();
});

test('a successful translation never names the source language', async () => {
  const state = ensureContainer(container, surface);
  await runContainer(state, { translate: upper });
  assert.equal(state.button.title, '');
  assert.equal(document.querySelector('.gp-translate-status'), null);
  assert.doesNotMatch(document.body.textContent, /Translated from/);
  teardownAllContainers();
});

test('a header-hosted action shows progress in its label', async () => {
  const slot = document.createElement('header');
  const host = document.createElement('div');
  host.className = 'markdown-body';
  host.innerHTML = '<p>Read <a href="https://x">docs</a>.</p><p>Second paragraph.</p>';
  document.body.append(slot, host);
  const withHeader = { ...surface, headerFor: () => slot };
  const state = ensureContainer(host, withHeader);
  const labels = [];
  const observer = new window.MutationObserver(() => labels.push(state.button.textContent));
  observer.observe(state.button, { childList: true, subtree: true, characterData: true });
  await runContainer(state, { translate: upper });
  await Promise.resolve();
  observer.disconnect();
  assert.ok(
    labels.some((label) => /Translating.*·.*\d+\s*\/\s*\d+/.test(label)),
    `progress never reached the button: ${labels.join(' | ')}`,
  );
  teardownAllContainers();
  host.remove();
  slot.remove();
});

test('switching files does not stack buttons in a shared header', () => {
  const slot = document.createElement('header');
  const first = document.createElement('div');
  first.className = 'markdown-body';
  first.innerHTML = '<p>First file.</p>';
  document.body.append(slot, first);
  const withHeader = { ...surface, headerFor: () => slot };
  ensureContainer(first, withHeader);
  assert.equal(slot.querySelectorAll('.gp-translate-btn').length, 1);

  first.remove();
  const second = document.createElement('div');
  second.className = 'markdown-body';
  second.innerHTML = '<p>Second file.</p>';
  document.body.append(second);
  ensureContainer(second, withHeader);

  assert.equal(slot.querySelectorAll('.gp-translate-btn').length, 1);
  teardownAllContainers();
  second.remove();
  slot.remove();
});
