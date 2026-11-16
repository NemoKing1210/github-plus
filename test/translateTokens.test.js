import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeToken, restoreTokens, stripTokens, hasLetters, SEGMENT_START, SEGMENT_END,
} from '../src/features/translate/tokens.js';

const tokens = [
  { html: '<a href="/x">docs</a>', label: 'docs' },
  { html: '<code>npm i</code>', label: null },
];

test('restores tokens in place and escapes the translated text', () => {
  const out = restoreTokens(`Lisez ${makeToken(0)} puis ${makeToken(1)} <script>`, tokens);
  assert.equal(
    out.html,
    'Lisez <a href="/x">docs</a> puis <code>npm i</code> &lt;script&gt;',
  );
  assert.deepEqual(out.missing, []);
  assert.equal(out.duplicated, false);
});

test('appends missing tokens instead of losing their elements', () => {
  const out = restoreTokens('Rien', tokens);
  assert.equal(out.html, 'Rien <a href="/x">docs</a> <code>npm i</code>');
  assert.deepEqual(out.missing, [0, 1]);
});

test('keeps a duplicated token once and reports it', () => {
  const out = restoreTokens(`A ${makeToken(0)} B ${makeToken(0)}`, [tokens[0]]);
  assert.equal(out.html, 'A <a href="/x">docs</a> B ');
  assert.equal(out.duplicated, true);
});

test('an unknown token id is kept as escaped text', () => {
  const out = restoreTokens(`A ${makeToken(9)}`, tokens);
  assert.match(out.html, /A /);
  assert.equal(out.missing.length, 2);
});

test('translated link labels replace the original label', () => {
  const out = restoreTokens(`Lisez ${makeToken(0)}`, [tokens[0]], ['la documentation']);
  assert.equal(out.html, 'Lisez <a href="/x">la documentation</a>');
});

test('private-use token characters are stripped from source text', () => {
  assert.equal(stripTokens(`a${makeToken(0)}b${SEGMENT_START}1${SEGMENT_END}`), 'a0b1');
});

test('hasLetters ignores punctuation, numbers and emoji', () => {
  assert.equal(hasLetters('123 !!! 🎉'), false);
  assert.equal(hasLetters('中文'), true);
  assert.equal(hasLetters('abc'), true);
});
