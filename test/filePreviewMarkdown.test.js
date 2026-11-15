import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

test('markdown is sanitized and relative images are rewritten', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  const { renderMarkdown } = await import('../src/features/filePreview/markdown.js');
  const node = await renderMarkdown(
    '# Hi\n\n<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n'
      + '<style>body{display:none}</style>\n\n<form action="/x"><input name="q"></form>\n\n'
      + '[bad](javascript:alert(1))\n\n![pic](img.png)',
    { name: 'README.md', relative: 'docs/README.md', owner: 'o', repo: 'r', ref: 'main' },
  );
  assert.equal(node.querySelector('script'), null);
  assert.equal(node.querySelector('[onerror]'), null);
  assert.equal(node.querySelector('style'), null);
  assert.equal(node.querySelector('form'), null);
  assert.equal(node.querySelector('input'), null);
  assert.equal(node.querySelector('a[href^="javascript:"]'), null);
  assert.equal(node.querySelector('h1')?.textContent, 'Hi');
  assert.equal(node.querySelector('img[alt="pic"]')?.getAttribute('src'), '/o/r/raw/main/docs/img.png');
});
