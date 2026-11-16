import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const {
  cacheKey, cacheTtlMs, evictStore, getCacheUsage, hashSource, pruneStore,
} = await import('../src/features/translate/cache.js');

test('hashSource is stable FNV-1a', () => {
  assert.equal(hashSource('a'), 'e40c292c');
  assert.equal(hashSource('a'), hashSource('a'));
  assert.notEqual(hashSource('a'), hashSource('b'));
});

test('cacheKey carries provider, target, hash and length', () => {
  const key = cacheKey('google', 'ru', 'hello');
  assert.match(key, /^google\|ru\|[0-9a-f]{8}\|5$/);
});

test('cacheTtlMs disables at zero and clamps', () => {
  assert.equal(cacheTtlMs(0), 0);
  assert.equal(cacheTtlMs(24), 24 * 3600 * 1000);
  assert.equal(cacheTtlMs(9999), 168 * 3600 * 1000);
});

test('pruneStore drops expired entries', () => {
  const store = { a: { at: 1 }, b: { at: 1000 } };
  assert.equal(pruneStore(store, 500, 1200), 1);
  assert.deepEqual(Object.keys(store), ['b']);
});

test('evictStore removes the oldest entries first', () => {
  const make = (at, size) => ({ at, value: { text: 'x'.repeat(size) } });
  const store = { a: make(1, 200), b: make(2, 200), c: make(3, 200) };
  evictStore(store, 700);
  assert.deepEqual(Object.keys(store), ['c']);
});

test('getCacheUsage counts entries and bytes', () => {
  const store = { a: { at: 1, value: { text: 'hello' } }, b: { at: 2, value: { text: 'world' } } };
  const usage = getCacheUsage(store, 24);
  assert.equal(usage.entryCount, 2);
  assert.ok(usage.usedBytes > 0);
  assert.equal(usage.enabled, true);
  assert.equal(getCacheUsage(store, 0).enabled, false);
});
