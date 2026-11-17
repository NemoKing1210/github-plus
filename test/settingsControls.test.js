import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://github.com/o/r',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const { createNumberInput, createShortcutRecorder, createTextInput } = await import('../src/features/settings/controls.js');

test('a text input fills its field, a number input keeps the control width', () => {
  const text = createTextInput({ placeholder: 'ghp_…', label: 'Token' });
  assert.ok(text.classList.contains('gp-input'));
  assert.ok(text.classList.contains('gp-input--wide'));

  const number = createNumberInput({ value: 450, label: 'Hold time' });
  assert.ok(number.classList.contains('gp-input'));
  assert.equal(number.classList.contains('gp-input--wide'), false);
});

test('the recorder captures, cancels and clears a combo', () => {
  const seen = [];
  const field = createShortcutRecorder({
    value: 'mod+k',
    onChange: (value) => seen.push(value),
    label: 'Shortcut',
    emptyLabel: 'Press keys…',
  });
  assert.equal(field.textContent, 'Ctrl+K');

  field.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key: 'P', ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true,
  }));
  assert.deepEqual(seen, ['mod+shift+p']);

  field.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key: 'Escape', bubbles: true, cancelable: true,
  }));
  assert.deepEqual(seen, ['mod+shift+p']);

  field.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key: 'Backspace', bubbles: true, cancelable: true,
  }));
  assert.deepEqual(seen, ['mod+shift+p', '']);

  field.dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key: 'a', bubbles: true, cancelable: true,
  }));
  assert.deepEqual(seen, ['mod+shift+p', '']);
});
