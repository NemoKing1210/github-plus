import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatShortcut, isValidShortcut, keyNameFromEvent, normalizeShortcutValue, shortcutFromEvent,
} from '../src/utils/shortcut.js';

test('a recorded shortcut is canonical', () => {
  assert.equal(shortcutFromEvent({ key: 'k', ctrlKey: true }, { mac: false }), 'mod+k');
  assert.equal(shortcutFromEvent({ key: 'k', metaKey: true }, { mac: true }), 'mod+k');
  assert.equal(shortcutFromEvent({ key: 'k', ctrlKey: true }, { mac: true }), 'ctrl+k');
  assert.equal(shortcutFromEvent({ key: 'K', ctrlKey: true, shiftKey: true }, { mac: false }), 'mod+shift+k');
  assert.equal(shortcutFromEvent({ key: 'k', altKey: true }, { mac: false }), 'alt+k');
});

test('special keys get a canonical name', () => {
  assert.equal(keyNameFromEvent({ key: ' ' }), 'space');
  assert.equal(keyNameFromEvent({ key: '+' }), 'plus');
  assert.equal(keyNameFromEvent({ key: 'K' }), 'k');
  assert.equal(shortcutFromEvent({ key: '+', ctrlKey: true }, { mac: false }), 'mod+plus');
});

test('a bare modifier and Escape record nothing', () => {
  assert.equal(shortcutFromEvent({ key: 'Control', ctrlKey: true }), '');
  assert.equal(shortcutFromEvent({ key: 'Shift', shiftKey: true }), '');
  assert.equal(shortcutFromEvent({ key: 'Escape' }), '');
});

test('validity needs a modifier and exactly one key', () => {
  assert.equal(isValidShortcut('off'), true);
  assert.equal(isValidShortcut('mod+k'), true);
  assert.equal(isValidShortcut('ctrl+alt+delete'), true);
  assert.equal(isValidShortcut('alt+space'), true);
  assert.equal(isValidShortcut('k'), false);
  assert.equal(isValidShortcut('shift'), false);
  assert.equal(isValidShortcut('ctrl+'), false);
  assert.equal(isValidShortcut('hyper+k'), false);
  assert.equal(isValidShortcut('ctrl+alt+k+j'), false);
  assert.equal(isValidShortcut(`mod+${'k'.repeat(60)}`), false);
  assert.equal(normalizeShortcutValue(' Mod+Shift+K '), 'mod+shift+k');
  assert.equal(normalizeShortcutValue('nonsense'), '');
});

test('a shortcut reads the way its platform writes it', () => {
  assert.equal(formatShortcut('mod+shift+k', { mac: true }), '⇧⌘K');
  assert.equal(formatShortcut('mod+shift+k', { mac: false }), 'Ctrl+Shift+K');
  assert.equal(formatShortcut('alt+space', { mac: false }), 'Alt+Space');
  assert.equal(formatShortcut('mod+plus', { mac: false }), 'Ctrl++');
  assert.equal(formatShortcut('off', { mac: false }), '');
});
