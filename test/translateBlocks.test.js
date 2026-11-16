import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><body>
  <div class="markdown-body">
    <h2>Title <a class="anchor" href="#title"><svg></svg></a></h2>
    <p>Read <a href="https://x">docs</a> and <code>npm i</code>.</p>
    <ul><li>one<ul><li>nested</li></ul></li></ul>
    <pre><code>Do not touch</code></pre>
    <table><tbody><tr><td>cell</td></tr></tbody></table>
    <blockquote><p>quote</p></blockquote>
    <ul class="contains-task-list"><li><input type="checkbox" checked disabled> done</li></ul>
    <p><strong>All bold</strong></p>
  </div>
  <div class="gp-preview-overlay"><div class="gp-preview__md">
    <p>Read <a href="https://p">docs</a>.</p>
  </div></div>
</body></html>`, { pretendToBeVisual: true, url: 'https://github.com/o/r' });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;

const { collectBlocks, extractBlock, renderBlockResult } = await import(
  '../src/features/translate/blocks.js'
);
const { TOKEN_RE } = await import('../src/features/translate/tokens.js');
const container = document.querySelector('.markdown-body');

test('collects leaf blocks, keeps list items, and skips code', () => {
  const tags = collectBlocks(container).map((block) => block.tagName);
  assert.deepEqual(tags, ['H2', 'P', 'LI', 'LI', 'TD', 'P', 'LI', 'P']);
});

test('a nested list item does not swallow its nested list', () => {
  const outer = collectBlocks(container).find((block) => block.tagName === 'LI');
  const extracted = extractBlock(outer);
  assert.match(extracted.source, /one/);
  assert.doesNotMatch(extracted.source, /nested/);
});

test('links and inline code become tokens with their markup intact', () => {
  const paragraph = container.querySelector('p');
  const extracted = extractBlock(paragraph);
  assert.equal(extracted.tokens.length, 2);
  assert.match(extracted.tokens[0].html, /href="https:\/\/x"/);
  assert.equal(extracted.tokens[0].label, 'docs');
  assert.equal(extracted.tokens[1].html, '<code>npm i</code>');
  const found = extracted.source.match(TOKEN_RE);
  const { html } = renderBlockResult(extracted, `Lisez ${found[0]} et ${found[1]}.`);
  assert.match(html, /<a href="https:\/\/x">docs<\/a>/);
  assert.match(html, /<code>npm i<\/code>/);
});

test('task-list checkboxes keep checked and disabled', () => {
  const item = collectBlocks(container).at(-2);
  const extracted = extractBlock(item);
  assert.match(extracted.tokens[0].html, /checked/);
  assert.match(extracted.tokens[0].html, /disabled/);
});

test('a whole-block emphasis is preserved, inline emphasis is flattened', () => {
  const bold = extractBlock(container.querySelector('p strong').parentElement);
  assert.equal(bold.bold, true);
  assert.match(renderBlockResult(bold, 'Tout en gras').html, /^<strong>Tout en gras<\/strong>$/);
});

test('a block without letters is not translatable', () => {
  const empty = document.createElement('p');
  empty.textContent = '123 !!!';
  assert.equal(extractBlock(empty), null);
});

test('a translated link label never replaces text inside an attribute', () => {
  const paragraph = document.createElement('p');
  paragraph.innerHTML = '<a href="https://docs.example/docs" title="docs">docs</a> and more';
  const extracted = extractBlock(paragraph);
  const token = extracted.source.match(TOKEN_RE)[0];
  const { html } = renderBlockResult(extracted, `Читайте ${token} дальше`, ['документы']);
  assert.match(html, /href="https:\/\/docs\.example\/docs"/);
  assert.match(html, /title="docs"/);
  assert.match(html, />документы<\/a>/);
});

test('a container that is itself the text block is collected', () => {
  const title = document.createElement('div');
  title.className = 'js-issue-title';
  title.textContent = 'Fix the parser';
  const blocks = collectBlocks(title);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0], title);
});

test('inline markup inside the preview overlay is extracted', () => {
  const preview = document.querySelector('.gp-preview__md p');
  const extracted = extractBlock(preview);
  assert.equal(extracted.tokens.length, 1);
  assert.match(extracted.tokens[0].html, /href="https:\/\/p"/);
});
