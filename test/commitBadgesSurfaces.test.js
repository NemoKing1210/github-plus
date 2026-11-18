import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const list = `<ul data-listview-component="items-list"><li data-testid="commit-row-item">
  <h4><span class="prc-Text-Text-9mHv3"><a id="list-title" data-pjax href="/o/r/commit/abc">style(palette): x</a></span></h4>
  <a data-component="Button" href="/o/r/commit/abc"><span data-component="buttonContent"><span
    class="prc-Button-Label" id="list-sha">abc1234</span></span></a></li></ul>`;

const classic = `<div data-testid="commit-message"><span class="commit-title" id="classic-title">fix: x</span>
  <div class="commit-desc">body</div></div>`;

const latest = `<div class="d-flex">
  <div class="Truncate flex-items-center f5"><span class="Truncate-text prc-Text-Text-9mHv3"
    data-testid="latest-commit-html"><a id="latest-title" data-pjax class="Link--secondary"
    href="/o/r/commit/abc">chore(deps): x</a></span></div>
  <div data-testid="latest-commit-details" class="d-none d-sm-flex"><span class="d-flex flex-nowrap fgColor-muted f6"><a
    class="Link--secondary prc-Link-Link-9ZwDx" data-component="Link" aria-label="Commit abc1234"
    href="/o/r/commit/abc">abc1234</a>&nbsp;·</span></div>
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

test('the commit list resolves the subject link, never the short-SHA button', () => {
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

test('the latest commit block resolves its subject, not the short SHA', () => {
  const found = surface('latest-commit');
  assert.ok(found.containers.includes('[data-testid="latest-commit-html"]'));
  const subject = document.querySelector('[data-testid="latest-commit-html"]');
  assert.equal(found.titleFor(subject).id, 'latest-title');

  // Older markup offers only the details block, whose own commit link is the
  // short SHA; the walk must skip it and find the subject.
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
