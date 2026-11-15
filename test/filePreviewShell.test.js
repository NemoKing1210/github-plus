import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    pretendToBeVisual: true,
    url: 'https://github.com/',
  });
  dom.window.scrollTo = () => {};
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.KeyboardEvent = dom.window.KeyboardEvent;
  return dom;
}

const FILES = [
  { name: 'a.txt', href: '/o/r/blob/main/a.txt', rawUrl: '/o/r/raw/main/a.txt', relative: 'a.txt' },
  { name: 'b.txt', href: '/o/r/blob/main/b.txt', rawUrl: '/o/r/raw/main/b.txt', relative: 'b.txt' },
];

async function openPreviewWithMenu() {
  installDom();
  const { openFilePreview, closeFilePreview } = await import('../src/ui/filePreview.js');
  const { openContextMenu, closeContextMenu } = await import('../src/ui/contextMenu.js');
  const load = async () => ({ node: document.createElement('div') });
  openFilePreview({ files: FILES, index: 0, load });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(document.querySelector('.gp-preview__name').textContent, 'a.txt');
  openContextMenu({ x: 10, y: 10, label: 'a.txt', items: [{ label: 'Copy', onSelect() {} }] });
  return { closeFilePreview, closeContextMenu };
}

test('an elevated menu carries the class that lifts it above the preview overlay', async () => {
  installDom();
  const { openContextMenu, closeContextMenu } = await import('../src/ui/contextMenu.js');
  openContextMenu({
    x: 10,
    y: 10,
    label: 'a.txt',
    items: [{ label: 'Copy', onSelect() {} }],
    elevated: true,
  });
  const root = document.getElementById('gp-context-menu');
  assert.ok(root);
  assert.ok(root.classList.contains('gp-context-menu--elevated'));
  closeContextMenu();
});

test('arrow keys leave the preview alone while its copy menu is open', async () => {
  const { closeFilePreview, closeContextMenu } = await openPreviewWithMenu();
  const active = document.activeElement;
  active.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await Promise.resolve();
  assert.equal(document.querySelector('.gp-preview__name').textContent, 'a.txt');
  closeContextMenu();
  closeFilePreview();
});
