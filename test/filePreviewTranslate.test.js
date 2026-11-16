import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'https://github.com/o/r',
});
dom.window.scrollTo = () => {};
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;

const { openFilePreview, closeFilePreview } = await import('../src/ui/filePreview.js');
const { createPreviewTranslateAction, isPreviewTranslationEnabled } = await import(
  '../src/features/translate/previewAction.js'
);
const { openPreviewForTarget } = await import('../src/features/filePreview/index.js');
const { stateFor, teardownAllContainers } = await import('../src/features/translate/state.js');

const FILE = {
  name: 'README.md',
  rawUrl: '/o/r/raw/main/README.md',
  href: '/o/r/blob/main/README.md',
  relative: 'README.md',
  ref: 'main',
};

function markdownPane() {
  const node = document.createElement('div');
  node.className = 'gp-preview__md';
  node.innerHTML = '<p>Hello <a href="https://x">docs</a>.</p>';
  return node;
}

async function openPreview(headerActions) {
  openFilePreview({
    files: [FILE],
    load: async () => ({ node: markdownPane() }),
    headerActions,
  });
  await Promise.resolve();
  await Promise.resolve();
}

test('supplied header actions are mounted in the preview header', async () => {
  const action = document.createElement('button');
  action.id = 'translate-action';
  await openPreview([action]);
  assert.ok(document.querySelector('.gp-preview__extra #translate-action'));
  closeFilePreview();
});

test('the preview translate action translates the markdown pane', async () => {
  globalThis.fetch = async () => { throw new Error('offline'); };
  await openPreview([createPreviewTranslateAction()]);
  const action = document.querySelector('.gp-preview__extra .gp-translate-btn');
  assert.ok(action);
  action.click();
  const pane = document.querySelector('.gp-preview__md');
  const state = stateFor(pane);
  assert.ok(state);
  assert.equal(state.status, 'loading');
  assert.equal(action.dataset.gpTranslateState, 'loading');
  assert.ok(document.querySelector('.gp-preview__extra .gp-translate-btn'), 'the action stays in the header');
  assert.equal(document.querySelector('.gp-preview__content .gp-translate-btn'), null);
  teardownAllContainers();
  closeFilePreview();
});

test('the action is offered only while the preview surface is on', async () => {
  const { saveSettings } = await import('../src/core/settings.js');
  assert.equal(isPreviewTranslationEnabled(), true);
  saveSettings({ translate: { surfaces: { preview: false } } });
  assert.equal(isPreviewTranslationEnabled(), false);
  saveSettings({ translate: { surfaces: { preview: true } } });
  assert.equal(isPreviewTranslationEnabled(), true);
});

test('header actions can follow the file and preview mode', async () => {
  const modes = [];
  openFilePreview({
    files: [FILE],
    load: async () => ({ node: markdownPane(), sourceMode: true }),
    headerActions: (file, mode) => {
      modes.push(`${file.name}:${mode}`);
      const action = document.createElement('button');
      action.className = 'dynamic-action';
      return mode === 'preview' ? [action] : [];
    },
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.ok(document.querySelector('.gp-preview__extra .dynamic-action'));
  document.querySelector('.gp-preview__seg-btn[data-mode="source"]').click();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(document.querySelector('.gp-preview__extra .dynamic-action'), null);
  assert.equal(document.querySelector('.gp-preview__extra').hidden, true);
  document.querySelector('.gp-preview__seg-btn[data-mode="preview"]').click();
  await Promise.resolve();
  await Promise.resolve();
  assert.ok(document.querySelector('.gp-preview__extra .dynamic-action'));
  assert.deepEqual(modes, [
    'README.md:preview',
    'README.md:source',
    'README.md:preview',
  ]);
  closeFilePreview();
});

test('the quick preview offers translation only for rendered markdown files', async () => {
  globalThis.Blob = window.Blob;
  globalThis.fetch = async (url) => {
    const text = String(url).endsWith('.md') ? '# Hello' : 'const answer = 42;';
    return {
      ok: true,
      headers: { get: () => null },
      blob: async () => new window.Blob([text], { type: 'text/plain' }),
    };
  };
  const target = (name) => ({
    name,
    href: `/o/r/blob/main/${name}`,
    rawUrl: `/o/r/raw/main/${name}`,
    relative: name,
    source: 'markdown',
  });

  openPreviewForTarget(target('a.js'));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(document.querySelector('.gp-preview__extra .gp-translate-btn'), null);
  closeFilePreview();

  openPreviewForTarget(target('README.md'));
  await Promise.resolve();
  await Promise.resolve();
  assert.ok(document.querySelector('.gp-preview__extra .gp-translate-btn'));
  closeFilePreview();
});
