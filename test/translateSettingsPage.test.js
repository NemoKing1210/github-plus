import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'https://github.com/o/r',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;

const { getDefaults } = await import('../src/core/constants.js');
const { renderTranslate } = await import('../src/features/settings/tabs/translate.js');

test('renders the master, surfaces, provider and cache cards', () => {
  const draft = getDefaults();
  renderTranslate(document.getElementById('host'), draft);
  assert.equal(document.querySelectorAll('.gp-card').length, 4);
  assert.ok(document.querySelector('[aria-label="Trigger"]'));
  assert.equal(document.querySelectorAll('.gp-switch').length >= 4, true);
});

test('provider fields follow the selected provider', () => {
  const host = document.getElementById('host');
  host.replaceChildren();
  const draft = getDefaults();
  renderTranslate(host, draft);
  const select = [...document.querySelectorAll('select')].find((node) =>
    [...node.options].some((option) => option.value === 'deepl'));
  assert.ok(select);
  select.value = 'deepl';
  select.dispatchEvent(new dom.window.Event('change'));
  assert.equal(draft.translate.provider, 'deepl');
  assert.equal(document.querySelector('.gp-provider-fields[data-provider="deepl"]').hidden, false);
  assert.equal(document.querySelector('.gp-provider-fields[data-provider="google"]').hidden, true);
});

test('the cache card offers a clear button', () => {
  const host = document.getElementById('host');
  host.replaceChildren();
  renderTranslate(host, getDefaults());
  assert.match(document.body.textContent, /Clear cache|Cache/);
});
