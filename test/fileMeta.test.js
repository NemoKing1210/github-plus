import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSize } from '../src/features/fileMeta/size.js';
import { rawUrlFor } from '../src/features/fileMeta/paths.js';

test('formats whole bytes below one kilobyte', () => {
  assert.equal(formatSize(0), '0 B');
  assert.equal(formatSize(512), '512 B');
});

test('uses GitHub’s binary units and labels', () => {
  assert.equal(formatSize(1024), '1 KB');
  assert.equal(formatSize(2929), '2.86 KB');
});

test('keeps three significant digits across units', () => {
  assert.equal(formatSize(10 * 1024), '10 KB');
  assert.equal(formatSize(45.6 * 1024), '45.6 KB');
  assert.equal(formatSize(1.5 * 1024 * 1024), '1.5 MB');
});

test('returns an empty string for an unusable value', () => {
  assert.equal(formatSize(null), '');
  assert.equal(formatSize(Number.NaN), '');
  assert.equal(formatSize(-1), '');
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
