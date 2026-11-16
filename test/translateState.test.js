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
const { listSurfaces } = await import('../src/features/translate/surfaces.js');
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
  assert.doesNotMatch(state.button.textContent, /API key/);
  assert.equal(document.querySelector('.gp-translate-status'), null);
  assert.match(document.querySelector('.gp-toasts').textContent, /API key/);
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

test('a comment action row gets the button beside the edit control', () => {
  const comment = document.createElement('div');
  comment.className = 'js-comment';
  const header = document.createElement('div');
  header.className = 'timeline-comment-header';
  const actions = document.createElement('div');
  actions.className = 'timeline-comment-actions';
  const edit = document.createElement('button');
  edit.setAttribute('aria-label', 'Edit comment');
  actions.appendChild(edit);
  const host = document.createElement('div');
  host.className = 'markdown-body';
  host.innerHTML = '<p>Text with changes.</p>';
  comment.append(header, actions, host);
  document.body.appendChild(comment);
  const markdown = listSurfaces().find((entry) => entry.id === 'markdown');
  const state = ensureContainer(host, markdown);
  assert.equal(state.button.parentElement, actions);
  assert.equal(actions.firstElementChild, state.button);
  assert.ok(state.button.classList.contains('gp-translate-btn--header'));
  assert.ok(state.button.classList.contains('gp-translate-btn--actions'));
  teardownAllContainers();
  comment.remove();
});

test('the description edit block gets the button before the edit control', () => {
  const section = document.createElement('section');
  section.className = 'container__qcj0r_';
  section.innerHTML = '<div class="body__fphukB">'
    + '<div class="editMetadata__ws0CPo">'
    + '<div><div class="editHistoryContainer__0eLRCM">'
    + '<button data-component="ActionMenu.Button" class="prc-Button-ButtonBase-9n-Xk">Edited</button>'
    + '</div></div>'
    + '<button data-component="IconButton" data-dd-action-name="pull_requests.description.edit"'
    + ' class="prc-Button-ButtonBase-9n-Xk editButton__kkP1ND">pencil</button>'
    + '</div>'
    + '<div><div><div class="markdown-body"><p>Text with changes.</p></div></div></div>'
    + '</div>';
  document.body.appendChild(section);
  const body = section.querySelector('.markdown-body');
  const markdown = listSurfaces().find((entry) => entry.id === 'markdown');
  const state = ensureContainer(body, markdown);
  const block = section.querySelector('.editMetadata__ws0CPo');
  assert.equal(state.button.parentElement, block);
  assert.equal(block.firstElementChild, state.button);
  assert.equal(document.querySelectorAll('.gp-translate-bar').length, 0);
  assert.ok(state.button.classList.contains('gp-translate-btn--actions'));
  assert.ok(state.button.classList.contains('gp-translate-btn--small'));
  teardownAllContainers();
  section.remove();
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

test('a total failure shows no status text beside the button', async () => {
  const state = ensureContainer(container, surface);
  const originalError = console.error;
  console.error = () => {};
  try {
    await runContainer(state, { translate: async () => { throw new Error('down'); } });
  } finally {
    console.error = originalError;
  }
  assert.equal(document.querySelector('.gp-translate-status'), null);
  assert.equal(state.button.parentElement.classList.contains('gp-translate-bar'), true);
  assert.equal(state.button.title, 'Translation failed');
  assert.match(document.querySelector('.gp-toasts').textContent, /Translation failed/);
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

test('a header-hosted action fills a ring inside its button', async () => {
  const slot = document.createElement('header');
  const host = document.createElement('div');
  host.className = 'markdown-body';
  host.innerHTML = Array.from({ length: 9 }, (_, i) => `<p>Paragraph ${i + 1}.</p>`).join('');
  document.body.append(slot, host);
  const withHeader = { ...surface, headerFor: () => slot };
  const state = ensureContainer(host, withHeader);
  const offsets = [];
  const observer = new window.MutationObserver(() => {
    const fill = state.button.querySelector('.gp-translate-ring__fill');
    if (fill) offsets.push(Number(fill.style.strokeDashoffset));
  });
  observer.observe(state.button, {
    subtree: true, attributes: true, childList: true, characterData: true,
  });
  await runContainer(state, { translate: upper });
  await Promise.resolve();
  observer.disconnect();
  assert.ok(
    offsets.some((offset) => offset > 0 && offset < 100),
    `progress never reached the ring: ${offsets.join(', ')}`,
  );
  assert.doesNotMatch(state.button.textContent, /\d/);
  assert.equal(state.button.title, '');
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

test('a button left in a shared header translates the file now on the page', async () => {
  const area = document.createElement('div');
  area.id = 'stale-header-test';
  const slot = document.createElement('header');
  const first = document.createElement('div');
  first.className = 'markdown-body';
  first.innerHTML = '<p>First file.</p>';
  area.append(slot, first);
  document.body.append(area);
  const withHeader = {
    ...surface,
    roots: ['#stale-header-test'],
    containers: ['.markdown-body'],
    headerFor: () => slot,
  };
  const stale = ensureContainer(first, withHeader);

  first.remove();
  const second = document.createElement('div');
  second.className = 'markdown-body';
  second.innerHTML = '<p>Second file.</p>';
  area.append(second);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const source = new URL(String(input)).searchParams.get('q') || '';
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([[[source.toUpperCase()]], null, 'en']),
    };
  };
  try {
    stale.button.click();
    for (let i = 0; i < 20 && !/SECOND/.test(second.textContent); i += 1) {
      await new Promise((resolve) => { setTimeout(resolve, 0); });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.match(second.textContent, /SECOND/);
  assert.equal(slot.querySelectorAll('.gp-translate-btn').length, 1);
  teardownAllContainers();
  area.remove();
});

test('a plain-text file keeps its lines and shows the translation below', async () => {
  const slot = document.createElement('header');
  const host = document.createElement('div');
  host.className = 'react-code-lines';
  host.innerHTML = '<div class="react-code-text"><div>'
    + '<div class="react-file-line html-div">MIT License</div></div></div>'
    + '<div class="react-code-text"><div>'
    + '<div class="react-file-line html-div">Second line.</div></div></div>';
  document.body.append(slot, host);
  const plainSurface = { id: 'plaintext', plain: true, headerFor: () => slot };
  const state = ensureContainer(host, plainSurface);
  assert.ok(state);
  await runContainer(state, { translate: upper });

  assert.equal(host.querySelectorAll('.react-file-line').length, 2);
  assert.equal(host.querySelector('.react-file-line').textContent, 'MIT License');
  const box = document.querySelector('.gp-translate-result--plain');
  assert.ok(box);
  assert.equal(box.previousElementSibling, host);
  assert.match(box.textContent, /MIT LICENSE\nSECOND LINE\./);
  teardownAllContainers();
  host.remove();
  slot.remove();
});
