import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    pretendToBeVisual: true,
    url: 'https://github.com/',
  });
  dom.window.scrollTo = () => {};
  dom.window.Element.prototype.scrollIntoView = () => {};
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

function stubFetch(blob) {
  globalThis.fetch = async () => ({
    ok: true,
    headers: { get: () => null },
    blob: async () => blob,
  });
}

test('a PDF is rebuilt as application/pdf before it is embedded', async () => {
  installDom();
  globalThis.Blob = window.Blob;
  const embedded = [];
  globalThis.URL.createObjectURL = (blob) => {
    embedded.push(blob.type);
    return 'blob:pdf';
  };
  globalThis.URL.revokeObjectURL = () => {};
  stubFetch(new Blob(['%PDF-1.4'], { type: 'application/octet-stream' }));
  const { loadPreview } = await import('../src/features/filePreview/render.js');
  const result = await loadPreview({
    name: 'paper.pdf',
    href: '/o/r/blob/main/paper.pdf',
    rawUrl: '/o/r/raw/main/paper.pdf',
    relative: 'paper.pdf',
  });
  assert.deepEqual(embedded, ['application/pdf']);
  result.dispose();
});

test('a PDF frame blocked by CSP falls back to a card', async () => {
  installDom();
  globalThis.Blob = window.Blob;
  globalThis.URL.createObjectURL = () => 'blob:blocked-pdf';
  globalThis.URL.revokeObjectURL = () => {};
  stubFetch(new Blob(['%PDF-1.4'], { type: 'application/octet-stream' }));
  const { loadPreview } = await import('../src/features/filePreview/render.js');
  const result = await loadPreview({
    name: 'blocked.pdf',
    href: '/o/r/blob/main/blocked.pdf',
    rawUrl: '/o/r/raw/main/blocked.pdf',
    relative: 'blocked.pdf',
  });
  assert.equal(result.node.querySelector('.gp-preview__card'), null);
  const event = new window.Event('securitypolicyviolation');
  Object.defineProperty(event, 'violatedDirective', { value: 'frame-src' });
  Object.defineProperty(event, 'blockedURI', { value: 'blob:blocked-pdf' });
  document.dispatchEvent(event);
  assert.ok(result.node.querySelector('.gp-preview__card'));
  result.dispose();
});

test('media that fails to play falls back to a card', async () => {
  installDom();
  const { loadPreview } = await import('../src/features/filePreview/render.js');
  const result = await loadPreview({
    name: 'clip.mkv',
    href: '/o/r/blob/main/clip.mkv',
    rawUrl: '/o/r/raw/main/clip.mkv',
    relative: 'clip.mkv',
  });
  const media = result.node.querySelector('video');
  assert.ok(media);
  media.dispatchEvent(new window.Event('error'));
  assert.ok(result.node.querySelector('.gp-preview__card'));
});

test('the toast layer paints above the preview overlay', async () => {
  const css = await readFile(new URL('../src/styles/app.css', import.meta.url), 'utf8');
  const zIndex = (selector) => {
    const start = css.indexOf(`${selector} {`);
    assert.notEqual(start, -1, `${selector} is missing`);
    const block = css.slice(start, css.indexOf('}', start));
    return Number(/z-index:\s*(\d+)/.exec(block)[1]);
  };
  assert.ok(zIndex('.gp-toasts') > zIndex('.gp-preview-overlay'));
});

test('the viewer and hold feedback paint above the preview overlay', async () => {
  const css = await readFile(new URL('../src/styles/app.css', import.meta.url), 'utf8');
  const zIndex = (selector) => {
    const start = css.indexOf(`${selector} {`);
    assert.notEqual(start, -1, `${selector} is missing`);
    const block = css.slice(start, css.indexOf('}', start));
    return Number(/z-index:\s*(\d+)/.exec(block)[1]);
  };
  const preview = zIndex('.gp-preview-overlay');
  assert.ok(zIndex('.gp-viewer-overlay') > preview);
  assert.ok(zIndex('.gp-download-btn') > preview);
  assert.ok(zIndex('.gp-hold-ring') > preview);
});

test('Escape closes the viewer above the preview before the preview itself', async () => {
  installDom();
  const { openFilePreview, closeFilePreview, isFilePreviewOpen } = await import(
    '../src/ui/filePreview.js'
  );
  const { openViewer, isViewerOpen } = await import('../src/ui/viewer.js');
  const load = async () => ({ node: document.createElement('div') });
  openFilePreview({ files: FILES, index: 0, load });
  await Promise.resolve();
  await Promise.resolve();
  openViewer({ images: [{ src: 'https://example.com/a.png' }], index: 0 });
  assert.equal(isViewerOpen(), true);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(isViewerOpen(), false);
  assert.equal(isFilePreviewOpen(), true);
  closeFilePreview();
});
