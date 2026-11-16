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
const { saveSettings } = await import('../src/core/settings.js');
const { renderGeneral } = await import('../src/features/settings/tabs/general.js');

function renderInto(container = document.createElement('div')) {
  document.body.appendChild(container);
  renderGeneral(container, getDefaults());
  return container;
}

function findButton(root, label = 'Copy log') {
  return [...root.querySelectorAll('.gp-button')]
    .find((button) => button.textContent === label);
}

function toastText(selector) {
  return document.querySelector(`.gp-toast ${selector}`)?.textContent || '';
}

async function flush() {
  await new Promise((resolve) => { setTimeout(resolve, 0); });
}

function clearToasts() {
  document.querySelectorAll('.gp-toasts').forEach((node) => node.remove());
}

test('the diagnostics card ships with logging off and copy disabled', () => {
  configureLogger({ enabled: false });
  const draft = getDefaults();
  renderGeneral(document.getElementById('host'), draft);
  const switchInput = [...document.querySelectorAll('.gp-switch__input')]
    .find((input) => input.getAttribute('aria-label') === 'Console logging');
  assert.ok(switchInput);
  assert.equal(switchInput.checked, false);

  const copy = findButton(document);
  assert.ok(copy);
  assert.equal(copy.disabled, true);

  switchInput.checked = true;
  switchInput.dispatchEvent(new dom.window.Event('change'));
  assert.equal(draft.logging.enabled, true);
});

test('the copy button follows the applied logger and reports a clipboard copy', async () => {
  configureLogger({ enabled: false });
  saveSettings({ toasts: { duration: 0 } });
  const originalInfo = console.info;
  console.info = () => {};
  let host = null;
  try {
    configureLogger({ enabled: true });
    Object.defineProperty(dom.window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    });
    host = renderInto();
    const copy = findButton(host);
    assert.equal(copy.disabled, false);

    copy.click();
    await flush();
    assert.equal(toastText('.gp-toast__title'), 'Log copied');
    assert.match(toastText('.gp-toast__message'), /clipboard/);
  } finally {
    console.info = originalInfo;
    clearToasts();
    host?.remove();
    configureLogger({ enabled: false });
  }
});

test('a console fallback says the log was printed, not copied', async () => {
  configureLogger({ enabled: false });
  saveSettings({ toasts: { duration: 0 } });
  const originalInfo = console.info;
  console.info = () => {};
  let host = null;
  try {
    configureLogger({ enabled: true });
    Object.defineProperty(dom.window.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    host = renderInto();
    findButton(host).click();
    await flush();
    assert.equal(toastText('.gp-toast__title'), 'Log printed');
    assert.match(toastText('.gp-toast__message'), /console/);
  } finally {
    console.info = originalInfo;
    clearToasts();
    host?.remove();
    configureLogger({ enabled: false });
  }
});
