import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><body><main>
  <div class="js-comment">
    <div class="timeline-comment-header"><span>Comment</span></div>
    <div class="markdown-body">Comment text</div>
  </div>
  <div id="repos-split-pane-content">
    <header data-testid="file-header"><span data-testid="breadcrumbs-filename">README.md</span></header>
    <div class="markdown-body">File text</div>
  </div>
  <div class="gp-preview-overlay"><div class="gp-preview__md markdown-body">Preview</div></div>
  <section class="readme-shell">
    <div itemscope itemtype="https://schema.org/abstract" class="Box_3__Na7qEQ">
      <nav aria-label="Repository files"></nav>
      <div class="readmeHeaderSlot__EGBTUW"></div>
      <button class="editButton__tKaHj8">Edit file</button>
    </div>
    <article class="markdown-body">Root README</article>
  </section>
  <h1 data-testid="issue-title">A title</h1>
  <div data-testid="commit-message">A commit message</div>
</main></body></html>`, { pretendToBeVisual: true, url: 'https://github.com/o/r' });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;

const {
  enabledSurfaces, findContainers, headerFor, surfaceForContainer, previewContainer,
} = await import('../src/features/translate/surfaces.js');

test('enabled surfaces come from settings', () => {
  const ids = enabledSurfaces().map((surface) => surface.id);
  assert.deepEqual(ids, ['markdown', 'plaintext', 'commits', 'titles', 'preview']);
});

test('markdown containers skip our preview overlay', () => {
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const containers = findContainers(markdown);
  assert.equal(containers.length, 3);
  assert.ok(containers.every((node) => !node.closest('.gp-preview-overlay')));
});

test('a comment header is the markdown header', () => {
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const comment = document.querySelector('.js-comment .markdown-body');
  assert.equal(headerFor(comment, markdown).className, 'timeline-comment-header');
});

test('the blob file header is found through the filename', () => {
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const file = document.querySelector('#repos-split-pane-content .markdown-body');
  assert.equal(headerFor(file, markdown).getAttribute('data-testid'), 'file-header');
});

test('the repository README header slot hosts the action', () => {
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const readme = document.querySelector('.readme-shell .markdown-body');
  assert.equal(headerFor(readme, markdown).className, 'readmeHeaderSlot__EGBTUW');
});

test('the preview container is resolved separately', () => {
  assert.equal(previewContainer().textContent, 'Preview');
  assert.equal(surfaceForContainer(previewContainer()).id, 'preview');
});
