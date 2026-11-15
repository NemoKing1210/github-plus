import test from 'node:test';
import assert from 'node:assert/strict';
import { filenameFor } from '../src/utils/download.js';

// `filenameFor` resolves addresses against the page, as it does in a browser.
globalThis.location = { href: 'https://github.com/NemoKing1210/github-plus' };

/** The camo address GitHub serves a proxied image from. */
function camo(url) {
  let hex = '';
  for (let index = 0; index < url.length; index += 1) {
    hex += url.charCodeAt(index).toString(16).padStart(2, '0');
  }
  return `https://camo.githubusercontent.com/abc123/${hex}`;
}

test('takes the filename from the URL path', () => {
  assert.equal(
    filenameFor('https://raw.githubusercontent.com/o/r/main/docs/screenshot.png'),
    'screenshot.png',
  );
});

test('ignores the query string', () => {
  assert.equal(filenameFor('https://example.com/img/photo.jpg?raw=true'), 'photo.jpg');
});

test('unwraps a camo proxied address to the original file name', () => {
  const target = 'https://user-images.githubusercontent.com/1/2/Diagram%20(1).PNG?raw=true';
  assert.equal(filenameFor(camo(target)), 'Diagram (1).PNG');
});

test('decodes percent-encoded path segments', () => {
  assert.equal(filenameFor('https://example.com/a/my%20photo.webp'), 'my photo.webp');
});

test('falls back to a generic name when the URL has none', () => {
  assert.equal(filenameFor('https://example.com/'), 'image');
  assert.equal(filenameFor(''), 'image');
});
