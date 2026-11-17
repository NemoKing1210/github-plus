import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

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

const { headerActionNode, registerHeaderAction, syncHeaderActions } = await import('../src/ui/headerActions.js');

const click = () => {};

test('actions mount in order before the user menu', () => {
  const gear = registerHeaderAction({ id: 'gear', order: 20, className: 'gp-gear-btn', icon: '<svg></svg>', label: 'Settings', onClick: click });
  const palette = registerHeaderAction({ id: 'palette', order: 10, className: 'gp-palette-btn', label: 'Palette', onClick: click });
  syncHeaderActions();
  const end = document.querySelector('.AppHeader-globalBar-end');
  const buttons = Array.from(end.querySelectorAll(':scope > .gp-header-btn'));
  assert.deepEqual(buttons.map((node) => node.classList.contains('gp-gear-btn') ? 'gear' : 'palette'), ['palette', 'gear']);
  assert.equal(end.lastElementChild.className, 'AppHeader-user');
  assert.equal(headerActionNode('gear'), gear.node);
  gear.remove();
  palette.remove();
});

test('update changes the label and visibility', () => {
  const action = registerHeaderAction({ id: 'palette', order: 10, label: 'Palette', onClick: click });
  syncHeaderActions();
  action.update({ label: 'Command palette (Ctrl+K)' });
  assert.equal(action.node.getAttribute('aria-label'), 'Command palette (Ctrl+K)');
  action.update({ visible: false });
  assert.equal(document.querySelector('.gp-palette-btn, .gp-header-btn'), null);
  action.update({ visible: true });
  assert.ok(document.querySelector('.gp-header-btn'));
  action.remove();
});

test('a ul header gets an li host', () => {
  document.querySelector('.AppHeader-globalBar-end').outerHTML = '<ul id="user-links"></ul>';
  const action = registerHeaderAction({ id: 'palette', order: 10, label: 'Palette', onClick: click });
  syncHeaderActions();
  assert.equal(action.node.parentElement.tagName, 'LI');
  assert.ok(action.node.parentElement.classList.contains('gp-header-item'));
  action.remove();
});

test('a replaced body gets the actions again', async () => {
  const action = registerHeaderAction({ id: 'palette', order: 10, label: 'Palette', onClick: click });
  syncHeaderActions();
  document.body.innerHTML = '<header class="AppHeader"><div class="AppHeader-globalBar-end"><a class="AppHeader-user"></a></div></header>';
  await new Promise((resolve) => setTimeout(resolve, 250));
  assert.ok(document.querySelector('.gp-header-btn'));
  action.remove();
});
