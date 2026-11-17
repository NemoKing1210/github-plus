import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const disk = new Map();
globalThis.localStorage = {
  getItem: (key) => (disk.has(key) ? disk.get(key) : null),
  setItem: (key, value) => disk.set(key, value),
  removeItem: (key) => disk.delete(key),
};

const dom = new JSDOM(`<!doctype html><html><body>
  <header class="AppHeader"><div class="AppHeader-globalBar-end">
    <a class="AppHeader-user" href="/me">me</a>
  </div></header>
</body></html>`, { url: 'https://github.com/o/r', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.MutationObserver = dom.window.MutationObserver;

const { headerActionNode } = await import('../src/ui/headerActions.js');
const { initCommandPaletteFeature, applyCommandPaletteSettings } = await import('../src/features/commandPalette/index.js');
const { getSettings, saveSettings } = await import('../src/core/settings.js');
const { isCommandPaletteOpen } = await import('../src/ui/commandPalette.js');

initCommandPaletteFeature();
applyCommandPaletteSettings();

test('the palette button carries the shortcut and follows the setting', () => {
  const button = headerActionNode('palette');
  assert.ok(button);
  assert.match(button.getAttribute('aria-label'), /Command palette/);
  assert.match(button.getAttribute('aria-label'), /Ctrl\+K/);

  saveSettings({ commandPalette: { ...getSettings().commandPalette, enabled: false } });
  applyCommandPaletteSettings();
  assert.equal(headerActionNode('palette'), null);

  saveSettings({ commandPalette: { ...getSettings().commandPalette, enabled: true } });
  applyCommandPaletteSettings();
  assert.ok(headerActionNode('palette'));
});

test('the header button respects another open overlay', () => {
  const overlay = document.createElement('div');
  overlay.className = 'gp-panel-overlay';
  document.body.appendChild(overlay);
  headerActionNode('palette').click();
  assert.equal(isCommandPaletteOpen(), false);
  overlay.remove();
});
