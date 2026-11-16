import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body><img id="pic"></body>', {
  pretendToBeVisual: true,
  url: 'https://github.com/o/r',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.Element = dom.window.Element;

const {
  configureLogger, createLogger, getLogEntries, clearLog, isScriptFailure, copyLog,
} = await import('../src/core/logger/index.js');

function errorEvent(filename, message = 'boom') {
  return new dom.window.ErrorEvent('error', { message, filename });
}

function rejectionEvent(reason) {
  const event = new dom.window.Event('unhandledrejection');
  event.reason = reason;
  return event;
}

test('attribution accepts this bundle and rejects the page', () => {
  configureLogger({ enabled: true });
  assert.equal(isScriptFailure('https://x/github-plus.user.js:1:1'), true);
  assert.equal(isScriptFailure('userscript.html?name=GitHub%20Plus.user.js'), true);
  assert.equal(isScriptFailure('https://github.githubassets.com/assets/app.js:1:1'), false);
  assert.equal(isScriptFailure(''), false);
});

test('only our uncaught errors are recorded', () => {
  configureLogger({ enabled: true });
  clearLog();
  window.dispatchEvent(errorEvent('https://github.githubassets.com/assets/app.js'));
  assert.equal(getLogEntries().length, 0);
  window.dispatchEvent(errorEvent('https://x/github-plus.user.js', 'ours'));
  const entries = getLogEntries();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].code, 'GP-9001');
  assert.equal(entries[0].module, 'global');
});

test('resource-load errors are ignored even with our filename absent', () => {
  configureLogger({ enabled: true });
  clearLog();
  const image = document.getElementById('pic');
  image.dispatchEvent(new dom.window.Event('error'));
  assert.equal(getLogEntries().length, 0);
});

test('rejections need an attributable stack', () => {
  configureLogger({ enabled: true });
  clearLog();
  const pageError = new Error('unattributed');
  pageError.stack = 'Error: unattributed\n    at https://github.githubassets.com/assets/app.js:1:1';
  window.dispatchEvent(rejectionEvent(pageError));
  assert.equal(getLogEntries().length, 0);

  const error = new Error('ours');
  error.stack = 'Error: ours\n    at https://x/github-plus.user.js:2:3';
  window.dispatchEvent(rejectionEvent(error));
  const entries = getLogEntries();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].code, 'GP-9002');
});

test('the window API exists only while enabled and disable removes it', () => {
  configureLogger({ enabled: true });
  assert.equal(typeof window.__GP_LOG__, 'object');
  assert.equal(window.__GP_LOG__.entries.length, getLogEntries().length);
  configureLogger({ enabled: false });
  assert.equal(window.__GP_LOG__, undefined);
});

test('copyLog reports disabled, console fallback and clipboard', async () => {
  configureLogger({ enabled: false });
  assert.deepEqual(await copyLog(), { ok: false, method: 'disabled' });

  const calls = [];
  const originalInfo = console.info;
  console.info = (...args) => calls.push(args);
  try {
    configureLogger({ enabled: true });
    createLogger('settings').info('copy me');
    calls.length = 0;
    assert.deepEqual(await copyLog(), { ok: true, method: 'console' });
    assert.match(String(calls[0][0]), /"entries"/);
  } finally {
    console.info = originalInfo;
  }

  Object.defineProperty(dom.window.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => {} },
  });
  assert.deepEqual(await copyLog(), { ok: true, method: 'clipboard' });
});
