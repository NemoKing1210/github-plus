import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://github.com/o/r' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const { closeContextMenu, openContextMenu } = await import('../src/ui/contextMenu.js');

test('the palette layer floats above the palette overlay', () => {
  openContextMenu({ x: 10, y: 10, label: 'Actions', layer: 'palette', items: [{ label: 'Open', onSelect() {} }] });
  assert.ok(document.querySelector('.gp-context-menu.gp-context-menu--palette'));
  closeContextMenu();
});

test('elevated remains the preview layer', () => {
  openContextMenu({ x: 0, y: 0, label: 'Actions', elevated: true, items: [{ label: 'Open', onSelect() {} }] });
  assert.ok(document.querySelector('.gp-context-menu--elevated'));
  closeContextMenu();
});

test('a menu reports its close after restoring focus', () => {
  const anchor = document.createElement('button');
  anchor.tabIndex = -1;
  document.body.appendChild(anchor);
  anchor.focus();
  let focusedAtClose = null;
  openContextMenu({
    anchor,
    keyboard: true,
    label: 'Actions',
    layer: 'palette',
    items: [{ label: 'Open', onSelect() {} }],
    onClose: () => {
      focusedAtClose = document.activeElement;
    },
  });
  document.querySelector('.gp-context-menu').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.querySelector('.gp-context-menu'), null);
  assert.equal(focusedAtClose, anchor);
  anchor.remove();
});
