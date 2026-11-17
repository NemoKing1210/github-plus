import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

let dom;
let hotkey;

beforeEach(async () => {
  dom = new JSDOM(`<!doctype html><html><body>
    <input id="field">
    <textarea id="area"></textarea>
    <div id="editable" contenteditable="true"></div>
    <div id="plain"></div>
  </body></html>`, { url: 'https://github.com/' });
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  hotkey = await import('../src/features/commandPalette/hotkey.js');
});

function event(overrides = {}) {
  return {
    key: 'k',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    isComposing: false,
    repeat: false,
    target: dom.window.document.getElementById('plain'),
    ...overrides,
  };
}

test('mod matches Ctrl and ⌘ but no extra modifier', () => {
  assert.equal(hotkey.shortcutMatches(event({ ctrlKey: true }), 'mod+k'), true);
  assert.equal(hotkey.shortcutMatches(event({ metaKey: true }), 'mod+k'), true);
  assert.equal(hotkey.shortcutMatches(event({ ctrlKey: true, shiftKey: true }), 'mod+k'), false);
  assert.equal(hotkey.shortcutMatches(event({ ctrlKey: true, shiftKey: true }), 'mod+shift+k'), true);
  assert.equal(hotkey.shortcutMatches(event({ altKey: true }), 'alt+k'), true);
  assert.equal(hotkey.shortcutMatches(event({ altKey: true }), 'mod+k'), false);
  assert.equal(hotkey.shortcutMatches(event({ key: 'j', ctrlKey: true }), 'mod+k'), false);
});

test('off never matches', () => {
  assert.equal(hotkey.shortcutMatches(event({ ctrlKey: true }), 'off'), false);
  assert.equal(hotkey.shouldOpenPalette(event({ ctrlKey: true }), { shortcut: 'off' }), false);
});

test('editable fields keep GitHub’s Ctrl+K', () => {
  for (const id of ['field', 'area', 'editable']) {
    const target = dom.window.document.getElementById(id);
    assert.equal(hotkey.isEditableTarget(target), true, id);
    assert.equal(hotkey.shouldOpenPalette(event({ ctrlKey: true, target }), { shortcut: 'mod+k' }), false, id);
  }
});

test('handled, composing and repeated keys are ignored', () => {
  for (const overrides of [{ defaultPrevented: true }, { isComposing: true }, { repeat: true }]) {
    assert.equal(hotkey.shouldOpenPalette(event({ ctrlKey: true, ...overrides }), { shortcut: 'mod+k' }), false);
  }
});

test('another GitHub Plus overlay blocks the palette', () => {
  const overlay = dom.window.document.createElement('div');
  overlay.className = 'gp-preview-overlay';
  dom.window.document.body.appendChild(overlay);
  assert.equal(hotkey.otherOverlayOpen(), true);
  assert.equal(hotkey.shouldOpenPalette(event({ ctrlKey: true }), { shortcut: 'mod+k' }), false);
  overlay.remove();
  assert.equal(hotkey.shouldOpenPalette(event({ ctrlKey: true }), { shortcut: 'mod+k' }), true);
});
