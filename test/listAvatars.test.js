import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'https://github.com/o/r/issues',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const { avatarUrlFor, authorLogin, resolveRowAuthor } = await import(
  '../src/features/listAvatars/surfaces.js'
);
const { clearAvatars, placeAvatar } = await import('../src/features/listAvatars/inject.js');

function row(html) {
  document.body.innerHTML = `<ul data-listview-component="items-list"><li id="row">${html}</li></ul>`;
  return document.querySelector('#row');
}

const issueAuthor =
  '<button data-testid="author-filter-link" data-hovercard-url="/users/KRU-OFFY/hovercard">'
  + '<span class="prc-VisuallyHidden-VisuallyHidden-Q0qSB">Filter by author </span>KRU-OFFY</button>';

const pullAuthor =
  '<a data-testid="author-filter-link" aria-label="Filter by author princeizhere" '
  + 'href="/react/react/pulls?q=is%3Apr+state%3Aopen+author%3Aprinceizhere">princeizhere</a>';

test('an issue row resolves the login from the hovercard route', () => {
  const author = resolveRowAuthor(row(`<span>opened by ${issueAuthor}</span>`));
  assert.equal(author.login, 'KRU-OFFY');
  assert.equal(author.node.dataset.testid, 'author-filter-link');
});

test('the hidden filter label is never read as the login', () => {
  const node = row(issueAuthor).querySelector('[data-testid="author-filter-link"]');
  assert.equal(authorLogin(node), 'KRU-OFFY');
});

test('a pull-request row resolves the login from its author query', () => {
  const author = resolveRowAuthor(row(pullAuthor));
  assert.equal(author.login, 'princeizhere');
});

test('a row without an author control is skipped', () => {
  assert.equal(resolveRowAuthor(row('<span>#42 by someone</span>')), null);
});

test('the avatar address strips the bot suffix and encodes the login', () => {
  assert.equal(avatarUrlFor('dependabot[bot]'), 'https://github.com/dependabot.png?size=40');
  assert.equal(avatarUrlFor('KRU-OFFY'), 'https://github.com/KRU-OFFY.png?size=40');
  assert.equal(avatarUrlFor(''), '');
});

test('placing an avatar twice keeps exactly one image', () => {
  const node = row(issueAuthor).querySelector('[data-testid="author-filter-link"]');
  placeAvatar(node, 'KRU-OFFY');
  placeAvatar(node, 'KRU-OFFY');
  assert.equal(document.querySelectorAll('.gp-list-avatar').length, 1);
  assert.equal(node.previousElementSibling.tagName, 'IMG');
  assert.equal(node.previousElementSibling.alt, '');
  assert.equal(node.previousElementSibling.getAttribute('aria-hidden'), 'true');
});

test('a recycled row swaps the avatar for the new login', () => {
  const node = row(issueAuthor).querySelector('[data-testid="author-filter-link"]');
  placeAvatar(node, 'KRU-OFFY');
  placeAvatar(node, 'dependabot[bot]');
  assert.equal(document.querySelectorAll('.gp-list-avatar').length, 1);
  assert.equal(
    document.querySelector('.gp-list-avatar').dataset.gpAvatar,
    'dependabot[bot]',
  );
  assert.match(document.querySelector('.gp-list-avatar').src, /dependabot\.png/);
});

test('teardown leaves GitHub markup without avatars', () => {
  const node = row(issueAuthor).querySelector('[data-testid="author-filter-link"]');
  placeAvatar(node, 'KRU-OFFY');
  clearAvatars(document);
  assert.equal(document.querySelectorAll('.gp-list-avatar').length, 0);
  assert.equal(node.previousElementSibling, null);
  assert.match(node.parentElement.textContent, /KRU-OFFY/);
});

test('a broken image removes itself instead of leaving a gap', () => {
  const node = row(issueAuthor).querySelector('[data-testid="author-filter-link"]');
  placeAvatar(node, 'github-actions[bot]');
  const image = document.querySelector('.gp-list-avatar');
  image.dispatchEvent(new dom.window.Event('error'));
  assert.equal(document.querySelectorAll('.gp-list-avatar').length, 0);
});
