import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSize } from '../src/utils/size.js';

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
