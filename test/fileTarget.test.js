import test from 'node:test';
import assert from 'node:assert/strict';
import { fileTarget, markdownFileTarget, rawUrlFor } from '../src/utils/fileTarget.js';

test('resolves a blob link into its raw address and relative path', () => {
  const target = fileTarget('/o/r/blob/main/src/a.js', 'https://github.com', 'main');
  assert.deepEqual(target, {
    href: 'https://github.com/o/r/blob/main/src/a.js',
    rawUrl: '/o/r/raw/main/src/a.js',
    relative: 'src/a.js',
    name: 'a.js',
  });
});

test('strips a branch name that contains slashes', () => {
  const target = fileTarget('/o/r/blob/feat/ui/src/a.js', 'https://github.com', 'feat/ui');
  assert.equal(target.relative, 'src/a.js');
  assert.equal(target.rawUrl, '/o/r/raw/feat/ui/src/a.js');
});

test('falls back to the first segment as the ref when the ref is unknown', () => {
  const target = fileTarget('/o/r/blob/main/docs/readme.md', 'https://github.com');
  assert.equal(target.relative, 'docs/readme.md');
});

test('ignores a ref the address does not start with', () => {
  const target = fileTarget('/o/r/blob/main/a.js', 'https://github.com', 'other');
  assert.equal(target.relative, 'a.js');
});

test('decodes percent-encoded segments', () => {
  const target = fileTarget('/o/r/blob/main/docs/my%20notes.md', 'https://github.com', 'main');
  assert.equal(target.relative, 'docs/my notes.md');
  assert.equal(target.name, 'my notes.md');
});

test('keeps the name of a file at the repository root', () => {
  const target = fileTarget('/o/r/blob/main/README.md', 'https://github.com', 'main');
  assert.equal(target.relative, 'README.md');
  assert.equal(target.name, 'README.md');
});

test('resolves a blame page address the same way as a blob one', () => {
  const target = fileTarget('/o/r/blame/main/src/a.js', 'https://github.com', 'main');
  assert.deepEqual(target, {
    href: 'https://github.com/o/r/blame/main/src/a.js',
    rawUrl: '/o/r/raw/main/src/a.js',
    relative: 'src/a.js',
    name: 'a.js',
  });
});

test('returns null for anything that is not a file view', () => {
  assert.equal(fileTarget('/o/r/tree/main/src', 'https://github.com'), null);
  assert.equal(fileTarget('/o/r', 'https://github.com'), null);
  assert.equal(fileTarget('', 'https://github.com'), null);
  assert.equal(fileTarget(null, 'https://github.com'), null);
});

test('accepts an absolute address and ignores its query and hash', () => {
  const target = fileTarget('https://github.com/o/r/blob/main/a.js?plain=1#L20', 'https://github.com', 'main');
  assert.equal(target.href, 'https://github.com/o/r/blob/main/a.js');
  assert.equal(target.rawUrl, '/o/r/raw/main/a.js');
});

test('turns a blob path into a raw path', () => {
  assert.equal(rawUrlFor('/o/r/blob/main/docs/a.md'), '/o/r/raw/main/docs/a.md');
});

test('turns a blame path into a raw path', () => {
  assert.equal(rawUrlFor('/o/r/blame/main/docs/a.md'), '/o/r/raw/main/docs/a.md');
});

test('strips the query and the hash', () => {
  assert.equal(rawUrlFor('/o/r/blob/main/a.js?plain=1#L20'), '/o/r/raw/main/a.js');
});

test('keeps a repository named blob intact', () => {
  assert.equal(rawUrlFor('/owner/blob/blob/main/x.txt'), '/owner/blob/raw/main/x.txt');
});

test('accepts an absolute address', () => {
  assert.equal(rawUrlFor('https://github.com/o/r/blob/main/a.js'), '/o/r/raw/main/a.js');
});

test('does not rewrite a folder link', () => {
  assert.equal(rawUrlFor('/o/r/tree/main/src'), '');
  assert.equal(rawUrlFor(''), '');
});

test('resolves a markdown link relative to the page it was rendered on', () => {
  const target = markdownFileTarget(
    'src/a.js',
    'https://github.com/o/r/blob/main/docs/README.md',
    'main',
  );
  assert.deepEqual(target, {
    href: 'https://github.com/o/r/blob/main/docs/src/a.js',
    rawUrl: '/o/r/raw/main/docs/src/a.js',
    relative: 'docs/src/a.js',
    name: 'a.js',
  });
});

test('resolves an absolute markdown file link with a branch that has slashes', () => {
  const target = markdownFileTarget(
    '/o/r/blob/feat/ui/src/a.js',
    'https://github.com/o/r/issues/1',
    'feat/ui',
  );
  assert.equal(target.relative, 'src/a.js');
  assert.equal(target.rawUrl, '/o/r/raw/feat/ui/src/a.js');
});

test('accepts a github.com file link on a gist page', () => {
  const target = markdownFileTarget(
    'https://github.com/o/r/blob/main/a.js',
    'https://gist.github.com/u/abc',
    '',
  );
  assert.equal(target.relative, 'a.js');
});

test('ignores markdown links that do not reach a file', () => {
  const base = 'https://github.com/o/r/blob/main/README.md';
  assert.equal(markdownFileTarget('#install', base, 'main'), null);
  assert.equal(markdownFileTarget('?plain=1', base, 'main'), null);
  assert.equal(markdownFileTarget('/o/r/tree/main/src', base, 'main'), null);
  assert.equal(markdownFileTarget('mailto:x@example.com', base, 'main'), null);
  assert.equal(
    markdownFileTarget('https://gitlab.com/o/r/blob/main/a.js', base, 'main'),
    null,
  );
});
