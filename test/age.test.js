import test from 'node:test';
import assert from 'node:assert/strict';
import { ageBucket } from '../src/features/fileAges/age.js';

const NOW = Date.parse('2026-11-15T12:00:00Z');

test('maps a commit date to the blame-style age scale', () => {
  assert.equal(ageBucket('2026-11-15T08:00:00Z', NOW), 10);
  assert.equal(ageBucket('2026-11-10T12:00:00Z', NOW), 9);
  assert.equal(ageBucket('2026-11-04T12:00:00Z', NOW), 8);
  assert.equal(ageBucket('2026-10-25T12:00:00Z', NOW), 7);
  assert.equal(ageBucket('2026-10-05T12:00:00Z', NOW), 6);
  assert.equal(ageBucket('2026-09-10T12:00:00Z', NOW), 5);
  assert.equal(ageBucket('2026-08-10T12:00:00Z', NOW), 4);
  assert.equal(ageBucket('2026-07-15T12:00:00Z', NOW), 3);
  assert.equal(ageBucket('2026-01-01T12:00:00Z', NOW), 2);
  assert.equal(ageBucket('2024-01-01T12:00:00Z', NOW), 1);
});

test('accepts Date objects and timestamps', () => {
  assert.equal(ageBucket(new Date('2026-11-15T08:00:00Z'), NOW), 10);
  assert.equal(ageBucket(Date.parse('2020-01-01T12:00:00Z'), NOW), 1);
});

test('treats future dates as newest and unreadable dates as unknown', () => {
  assert.equal(ageBucket('2027-01-01T00:00:00Z', NOW), 10);
  assert.equal(ageBucket('not-a-date', NOW), 0);
  assert.equal(ageBucket('', NOW), 0);
  assert.equal(ageBucket(null, NOW), 0);
});
