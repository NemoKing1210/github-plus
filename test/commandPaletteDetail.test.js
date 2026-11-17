import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://github.com/o/r' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const { renderDetail } = await import('../src/features/commandPalette/detail.js');

test('an issue shows its number, state and actions', () => {
  const node = renderDetail({
    key: 'issue:o/r#7', kind: 'issue', title: '#7 Fix it',
    data: { number: 7, repo: 'o/r', url: 'https://github.com/o/r/pull/7', author: 'ann', state: 'open', comments: 3, kindLabel: 'pullRequest' },
  }, { labels: { open: 'Open', openNewTab: 'New tab', copyLink: 'Copy link', copyNumber: 'Copy number', pin: 'Add to favorites', stateOpen: 'Open', comments: '{count} comments' }, onAction() {} });
  assert.match(node.textContent, /#7/);
  assert.match(node.textContent, /ann/);
  assert.equal(node.querySelectorAll('.gp-detail__action').length, 4);
});
