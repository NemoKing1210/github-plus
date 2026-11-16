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
const { configureLogger } = await import('../src/core/logger/index.js');
const { renderGeneral } = await import('../src/features/settings/tabs/general.js');

test('the diagnostics card ships with logging off and copy disabled', () => {
  configureLogger({ enabled: false });
  const draft = getDefaults();
  renderGeneral(document.getElementById('host'), draft);
  const switchInput = [...document.querySelectorAll('.gp-switch__input')]
    .find((input) => input.getAttribute('aria-label') === 'Console logging');
  assert.ok(switchInput);
  assert.equal(switchInput.checked, false);

  const copy = [...document.querySelectorAll('.gp-button')]
    .find((button) => button.textContent === 'Copy log');
  assert.ok(copy);
  assert.equal(copy.disabled, true);

  switchInput.checked = true;
  switchInput.dispatchEvent(new dom.window.Event('change'));
  assert.equal(draft.logging.enabled, true);
});
