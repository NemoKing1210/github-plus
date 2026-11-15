import test from 'node:test';
import assert from 'node:assert/strict';
import { fileTarget } from '../src/features/fileMenu/paths.js';
import { isCopyableContent } from '../src/features/fileMenu/copy.js';

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

test('treats textual content types as copyable', () => {
  assert.equal(isCopyableContent('text/plain; charset=utf-8', 'a.txt'), true);
  assert.equal(isCopyableContent('application/json', 'a.json'), true);
  assert.equal(isCopyableContent('application/xml', 'a.xml'), true);
  assert.equal(isCopyableContent('application/javascript', 'a.js'), true);
  assert.equal(isCopyableContent('application/x-sh', 'a.sh'), true);
  assert.equal(isCopyableContent('image/svg+xml', 'a.svg'), true);
});

test('rejects binary content types even with a textual extension', () => {
  assert.equal(isCopyableContent('image/png', 'a.md'), false);
  assert.equal(isCopyableContent('application/pdf', 'a.txt'), false);
  assert.equal(isCopyableContent('application/octet-stream', 'a.md'), false);
});

test('falls back to the extension when the type is unknown', () => {
  assert.equal(isCopyableContent('', 'src/a.js'), true);
  assert.equal(isCopyableContent('', 'README.md'), true);
  assert.equal(isCopyableContent('', 'Dockerfile'), true);
  assert.equal(isCopyableContent('', 'a.png'), false);
  assert.equal(isCopyableContent('', 'archive.zip'), false);
});
