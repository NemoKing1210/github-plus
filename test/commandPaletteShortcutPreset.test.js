import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://github.com/o/r',
  pretendToBeVisual: true,
});

for (const key of [
  'window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'KeyboardEvent', 'MouseEvent',
]) {
  globalThis[key] = dom.window[key];
}
globalThis.location = dom.window.location;
globalThis.localStorage = { getItem: () => null, setItem() {} };

const { COMMAND_PALETTE_SHORTCUTS, getDefaults } = await import('../src/core/constants.js');
const { normalizeCommandPalette } = await import('../src/core/settings.js');
const { renderCommandPalette } = await import('../src/features/settings/tabs/commandPalette.js');

test('ctrl+space is a one-click palette preset', () => {
  assert.ok(COMMAND_PALETTE_SHORTCUTS.includes('mod+space'));
  const defaults = getDefaults().commandPalette;
  assert.equal(normalizeCommandPalette({ shortcut: 'mod+space' }, defaults).shortcut, 'mod+space');

  const draft = { commandPalette: { ...defaults, shortcut: 'mod+space' } };
  const container = document.createElement('div');
  renderCommandPalette(container, draft);
  const select = [...container.querySelectorAll('select')].find((node) =>
    [...node.options].some((option) => option.value === 'mod+space'));
  assert.ok(select, 'the activation select lists the Ctrl/⌘ + Space preset');
  assert.equal(select.value, 'mod+space');
  assert.match([...select.options].find((option) => option.value === 'mod+space').textContent, /Space/i);
});
