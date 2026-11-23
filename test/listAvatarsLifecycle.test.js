import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const list = `<ul id="issues" data-listview-component="items-list">
  <li id="row-a"><span>opened by <button data-testid="author-filter-link"
    data-hovercard-url="/users/KRU-OFFY/hovercard"><span
    class="prc-VisuallyHidden-VisuallyHidden-Q0qSB">Filter by author </span>KRU-OFFY</button></span></li>
  <li id="row-b"><span>#42 no author here</span></li>
</ul>
<ul id="pulls" data-listview-component="items-list">
  <li id="row-c"><span><a data-testid="author-filter-link"
    href="/react/react/pulls?q=is%3Apr+state%3Aopen+author%3Aprinceizhere">princeizhere</a></span></li>
</ul>`;

const dom = new JSDOM(`<!doctype html><html><body>${list}</body></html>`, {
  pretendToBeVisual: true,
  url: 'https://github.com/o/r/issues',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const { saveSettings } = await import('../src/core/settings.js');
const { applyListAvatarsSettings, initListAvatarsFeature } = await import(
  '../src/features/listAvatars/index.js'
);
initListAvatarsFeature();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('both lists are decorated and the authorless row is left alone', () => {
  saveSettings({ listAvatars: { enabled: true } });
  applyListAvatarsSettings();
  assert.equal(document.querySelectorAll('.gp-list-avatar').length, 2);
  assert.ok(document.querySelector('#row-a .gp-list-avatar'));
  assert.ok(document.querySelector('#row-c .gp-list-avatar'));
  assert.equal(document.querySelector('#row-b .gp-list-avatar'), null);
});

test('disabling removes every avatar from GitHub markup', () => {
  saveSettings({ listAvatars: { enabled: false } });
  applyListAvatarsSettings();
  assert.equal(document.querySelectorAll('.gp-list-avatar').length, 0);
  assert.match(document.querySelector('#row-a').textContent, /KRU-OFFY/);
});

test('a re-render that drops the avatar but keeps the row re-decorates it', async () => {
  saveSettings({ listAvatars: { enabled: true } });
  applyListAvatarsSettings();
  const cell = document.querySelector('#row-a span');
  cell.innerHTML = '<button data-testid="author-filter-link" '
    + 'data-hovercard-url="/users/KRU-OFFY/hovercard">KRU-OFFY</button>';
  await sleep(300);
  assert.equal(document.querySelectorAll('#row-a .gp-list-avatar').length, 1);
});

test('a recycled author control updates the avatar in place', async () => {
  saveSettings({ listAvatars: { enabled: true } });
  applyListAvatarsSettings();
  const author = document.querySelector('#row-a [data-testid="author-filter-link"]');
  author.setAttribute('data-hovercard-url', '/users/dependabot[bot]/hovercard');
  await sleep(300);
  assert.equal(document.querySelectorAll('#row-a .gp-list-avatar').length, 1);
  assert.match(document.querySelector('#row-a .gp-list-avatar').src, /dependabot\.png/);
});
