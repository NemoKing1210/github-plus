import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCount, relativeTime } from '../src/features/commandPalette/format.js';

test('counts use compact suffixes and three significant digits', () => {
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(999), '999');
  assert.equal(formatCount(1234), '1.2k');
  assert.equal(formatCount(12_345), '12.3k');
  assert.equal(formatCount(1_234_567), '1.2M');
});

test('relative dates reuse Intl instead of new strings', () => {
  const now = Date.parse('2026-11-18T12:00:00Z');
  assert.equal(relativeTime('2026-11-18T10:00:00Z', { now, locale: 'en' }), '2 hours ago');
  assert.equal(relativeTime('2026-11-17T09:00:00Z', { now, locale: 'en' }), 'yesterday');
  assert.equal(relativeTime('', { now, locale: 'en' }), '');
});
