import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const list = `<ul data-listview-component="items-list"><li data-testid="commit-row-item">
  <h4><a href="/o/r/commit/abc"><span id="list-title">style(palette): x</span></a></h4></li></ul>`;

const classic = `<div data-testid="commit-message"><span class="commit-title" id="classic-title">fix: x</span>
  <div class="commit-desc">body</div></div>`;

const latest = `<div><div data-testid="latest-commit-details"></div>
  <div><a class="Link--secondary" href="/o/r/commit/abc" id="latest-title">chore(deps): x</a></div>
  <a href="/o/r/commits/main/">History</a></div>`;

const dom = new JSDOM(`<!doctype html><html><body>${list}${classic}${latest}</body></html>`, {
  pretendToBeVisual: true,
  url: 'https://github.com/o/r/commits/main',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const { SURFACES } = await import('../src/features/commitBadges/surfaces.js');

function surface(id) {
  const found = SURFACES.find((item) => item.id === id);
  assert.ok(found, `missing surface ${id}`);
  return found;
}

// GitHub's React tree really does put a <div> inside a <span>; an HTML parser
// would auto-close the span, so this fixture is built with DOM calls instead.
function commitPageFixture() {
  const container = document.createElement('div');
  container.className = 'commitMessageContainer__abc';
  const line = document.createElement('span');
  const title = document.createElement('div');
  title.id = 'page-title';
  title.textContent = 'feat(api)!: x';
  line.appendChild(title);
  const description = document.createElement('span');
  description.className = 'extended-commit-description-container';
  description.textContent = 'body';
  container.append(line, description);
  return container;
}

test('the commit list resolves the subject span in a row', () => {
  const found = surface('commit-list');
  assert.deepEqual(found.containers, ['[data-listview-component="items-list"]']);
  assert.equal(found.rows, '[data-testid="commit-row-item"]');
  const row = document.querySelector('[data-testid="commit-row-item"]');
  assert.equal(found.titleFor(row).id, 'list-title');
});

test('the commit page resolves the title line, not the description', () => {
  const found = surface('commit-page');
  const container = commitPageFixture();
  document.body.appendChild(container);
  const title = found.titleFor(container);
  assert.equal(title.id, 'page-title');
  assert.notEqual(title.className, 'extended-commit-description-container');
});

test('the classic view resolves its title element', () => {
  const found = surface('classic-commit');
  const container = document.querySelector('[data-testid="commit-message"]');
  assert.equal(found.titleFor(container).id, 'classic-title');
});

test('the latest commit block resolves the subject link, not the history link', () => {
  const found = surface('latest-commit');
  const details = document.querySelector('[data-testid="latest-commit-details"]');
  assert.equal(found.titleFor(details).id, 'latest-title');
});

test('every surface skips our own UI and accepts page rows', () => {
  const overlay = document.createElement('div');
  overlay.className = 'gp-preview-overlay';
  const inside = document.createElement('div');
  overlay.appendChild(inside);
  const plain = document.createElement('div');
  document.body.append(overlay, plain);
  for (const found of SURFACES) {
    assert.equal(found.skip(inside), true, found.id);
    assert.equal(found.skip(plain), false, found.id);
  }
});
