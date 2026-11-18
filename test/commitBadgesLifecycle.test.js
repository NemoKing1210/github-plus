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
    href="/o/r/commit/abc" id="latest-sha">abc1234</a>&nbsp;·</span></div>
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
  assert.equal(document.querySelectorAll('#latest-title .gp-commit-prefix').length, 1);
  // The rows' short-SHA links are commit links too and must stay plain.
  assert.equal(document.querySelector('#list-sha .gp-commit-prefix'), null);
  assert.equal(document.querySelector('#latest-sha .gp-commit-prefix'), null);
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

test('a re-render that drops the badge but keeps the text re-decorates it', async () => {
  saveSettings({ commitBadges: { enabled: true } });
  applyCommitBadgesSettings();
  const title = document.querySelector('#list-title');
  title.textContent = 'fix(core): y';
  await sleep(250);
  assert.ok(title.querySelector('.gp-commit-type--fix'));

  // React replacing the title's children puts the plain subject back: the
  // badge is gone while the text still matches the stored signature.
  title.replaceChildren(document.createTextNode('fix(core): y'));
  await sleep(250);
  assert.ok(title.querySelector('.gp-commit-type--fix'));
  assert.equal(title.textContent, 'fix(core): y');
});
