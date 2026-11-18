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
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

// GitHub's React tree puts a <div> inside a <span>; an HTML parser would
// auto-close the span, so this fixture is built with DOM calls.
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
document.body.appendChild(commitPageFixture());

const { saveSettings } = await import('../src/core/settings.js');
const { emit } = await import('../src/core/bus.js');
const { applyCommitBadgesSettings, initCommitBadgesFeature } = await import(
  '../src/features/commitBadges/index.js'
);
initCommitBadgesFeature();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('every surface is decorated on apply', () => {
  saveSettings({ commitBadges: { enabled: true, unknownTypes: true, breaking: true } });
  applyCommitBadgesSettings();
  assert.ok(document.querySelector('#list-title .gp-commit-type--style'));
  assert.ok(document.querySelector('#page-title .gp-commit-type--feat'));
  assert.ok(document.querySelector('#classic-title .gp-commit-type--fix'));
  assert.ok(document.querySelector('#latest-title .gp-commit-type--chore'));
});

test('disabling removes every badge and restores the text', () => {
  saveSettings({ commitBadges: { enabled: false } });
  applyCommitBadgesSettings();
  assert.equal(document.querySelectorAll('.gp-commit-prefix').length, 0);
  assert.equal(document.querySelector('#list-title').textContent, 'style(palette): x');
});

test('unknown types follow their own switch', () => {
  const title = document.querySelector('#classic-title');
  title.textContent = 'deps(lock): bump vite';
  saveSettings({ commitBadges: { enabled: true, unknownTypes: false } });
  applyCommitBadgesSettings();
  assert.equal(title.querySelector('.gp-commit-prefix'), null);
  assert.equal(title.textContent, 'deps(lock): bump vite');
  saveSettings({ commitBadges: { enabled: true, unknownTypes: true } });
  applyCommitBadgesSettings();
  assert.ok(title.querySelector('.gp-commit-type--unknown'));
});

test('a recycled row updates its badge or drops it', async () => {
  saveSettings({ commitBadges: { enabled: true } });
  applyCommitBadgesSettings();
  const title = document.querySelector('#list-title');
  title.textContent = 'fix(core): y';
  await sleep(250);
  assert.equal(title.querySelector('.gp-commit-type--fix')?.textContent, 'fix');
  assert.equal(title.textContent, 'fix(core): y');
  title.textContent = 'Update README';
  await sleep(250);
  assert.equal(title.querySelector('.gp-commit-prefix'), null);
  assert.equal(title.textContent, 'Update README');
});

test('a title split across text nodes is never decorated', () => {
  saveSettings({ commitBadges: { enabled: true } });
  const title = document.querySelector('#page-title');
  title.textContent = '';
  const type = document.createElement('b');
  type.textContent = 'feat';
  title.append(type, '(api)!: x');
  applyCommitBadgesSettings();
  assert.equal(title.querySelector('.gp-commit-prefix'), null);
  assert.equal(title.textContent, 'feat(api)!: x');
});

test('translate:restored clears badges while disabled', () => {
  const container = document.querySelector('[data-testid="commit-message"]');
  const title = container.querySelector('.commit-title');
  title.textContent = 'fix: x';
  saveSettings({ commitBadges: { enabled: true } });
  applyCommitBadgesSettings();
  assert.ok(container.querySelector('.gp-commit-prefix'));
  saveSettings({ commitBadges: { enabled: false } });
  emit('translate:restored', { container });
  assert.equal(container.querySelector('.gp-commit-prefix'), null);
  assert.equal(container.querySelector('.commit-title').textContent, 'fix: x');
  assert.match(container.textContent, /body$/);
});
