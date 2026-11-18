import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'https://github.com/o/r/commits/main',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;

const { parseCommitSubject } = await import('../src/features/commitBadges/parse.js');
const { clearCommitBadges, decorateTitle, hasCommitBadge } = await import('../src/features/commitBadges/inject.js');

function subject(html) {
  document.body.innerHTML = `<a href="/o/r/commit/abc">${html}</a>`;
  return document.querySelector('a');
}

test('the badge is inserted and textContent is preserved exactly', () => {
  const title = subject('<span>style(palette): stack source tiles</span>');
  const span = title.querySelector('span');
  const before = span.textContent;
  assert.equal(decorateTitle(span, parseCommitSubject(before), { breaking: true }), true);
  assert.equal(span.textContent, before);
  assert.equal(span.querySelector('.gp-commit-type--style').textContent, 'style');
  assert.equal(span.querySelector('.gp-commit-scope').textContent, '(palette)');
  assert.equal(span.querySelector('.gp-commit-colon').textContent, ':');
  assert.equal(span.querySelector('.gp-commit-bang'), null);
});

test('a breaking mark is a separate red marker or plain text', () => {
  const breaking = subject('<span>feat(api)!: add endpoint</span>').querySelector('span');
  decorateTitle(breaking, parseCommitSubject(breaking.textContent), { breaking: true });
  assert.equal(breaking.querySelector('.gp-commit-bang').textContent, '!');
  assert.equal(breaking.textContent, 'feat(api)!: add endpoint');

  const plain = subject('<span>feat(api)!: add endpoint</span>').querySelector('span');
  decorateTitle(plain, parseCommitSubject(plain.textContent), { breaking: false });
  assert.equal(plain.querySelector('.gp-commit-bang'), null);
  assert.equal(plain.textContent, 'feat(api)!: add endpoint');
});

test('an unknown type uses the neutral class', () => {
  const title = subject('<span>deps(lock): bump vite</span>').querySelector('span');
  decorateTitle(title, parseCommitSubject(title.textContent), {});
  assert.ok(title.querySelector('.gp-commit-type--unknown'));
});

test('decorating twice is a no-op', () => {
  const title = subject('<span>fix: bug</span>').querySelector('span');
  const parsed = parseCommitSubject(title.textContent);
  assert.equal(decorateTitle(title, parsed, {}), true);
  assert.equal(decorateTitle(title, parsed, {}), false);
  assert.equal(title.querySelectorAll('.gp-commit-prefix').length, 1);
  assert.equal(title.textContent, 'fix: bug');
});

test('a prefix split across text nodes is left untouched', () => {
  const title = subject('<span><b>style</b>(palette): stack</span>').querySelector('span');
  assert.equal(decorateTitle(title, parseCommitSubject(title.textContent), {}), false);
  assert.equal(title.querySelector('.gp-commit-prefix'), null);
  assert.equal(title.textContent, 'style(palette): stack');
});

test('clearing restores the plain text', () => {
  const title = subject('<span>fix: bug</span>').querySelector('span');
  decorateTitle(title, parseCommitSubject(title.textContent), {});
  assert.equal(hasCommitBadge(title), true);
  assert.equal(clearCommitBadges(document), 1);
  assert.equal(hasCommitBadge(title), false);
  assert.equal(title.textContent, 'fix: bug');
  assert.equal(title.children.length, 0);
});
