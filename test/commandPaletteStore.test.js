import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let disk;
globalThis.localStorage = {
  getItem: (key) => (disk.has(key) ? disk.get(key) : null),
  setItem: (key, value) => disk.set(key, value),
  removeItem: (key) => disk.delete(key),
};

beforeEach(() => { disk = new Map(); });

const store = await import('../src/features/commandPalette/store.js');
const {
  readCacheRecord, writeCacheRecord, clearDataCache, readRecents, recordRecent,
  readPins, togglePin, isFresh, rateLimitFromHeaders, isRateBlocked,
} = store;

test('clearDataCache keeps the identity and drops data', () => {
  writeCacheRecord({
    version: 1, login: 'alice', tokenLogin: 'alice', tokenFingerprint: 'v1:00000000',
    sources: { repos: { pages: [{ items: [1] }], fetchedAt: 1 } }, trees: { 'a/b@main': {} },
    rateLimit: { remaining: 0 },
  });
  clearDataCache();
  const next = readCacheRecord();
  assert.equal(next.login, 'alice');
  assert.equal(next.tokenLogin, 'alice');
  assert.deepEqual(next.sources, {});
  assert.deepEqual(next.trees, {});
  assert.equal(next.rateLimit, null);
});

test('recents from another identity keep only commands', () => {
  recordRecent('alice', { key: 'repo:a/b', kind: 'repo', at: 1, snapshot: {} });
  recordRecent('alice', { key: 'cmd:issues', kind: 'command', at: 2, snapshot: {} });
  assert.deepEqual(readRecents('bob').map((item) => item.key), ['cmd:issues']);
  assert.deepEqual(readRecents('alice').map((item) => item.key), ['cmd:issues', 'repo:a/b']);
});

test('pins toggle, persist and stay per identity', () => {
  assert.equal(togglePin('alice', { key: 'repo:a/b', kind: 'repo', snapshot: {} }), true);
  assert.deepEqual(readPins('alice').map((item) => item.key), ['repo:a/b']);
  assert.deepEqual(readPins('bob'), []);
  assert.equal(togglePin('alice', { key: 'repo:a/b', kind: 'repo', snapshot: {} }), false);
  assert.deepEqual(readPins('alice'), []);
});

test('freshness disables at zero hours', () => {
  assert.equal(isFresh({ fetchedAt: 1000 }, 6, 1000 + 3600_000), true);
  assert.equal(isFresh({ fetchedAt: 1000 }, 6, 1000 + 7 * 3600_000), false);
  assert.equal(isFresh({ fetchedAt: 1000 }, 0, 1000), false);
  assert.equal(isFresh(null, 6, 1000), false);
});

test('rate limits parse from headers and block at exhaustion', () => {
  const resetSeconds = Math.floor((Date.now() + 60_000) / 1000);
  const parsed = rateLimitFromHeaders({
    'x-ratelimit-remaining': '0',
    'x-ratelimit-reset': String(resetSeconds),
    'x-ratelimit-limit': '60',
  });
  assert.equal(parsed.remaining, 0);
  assert.equal(parsed.resetAt, resetSeconds * 1000);
  assert.equal(parsed.limit, 60);
  assert.equal(isRateBlocked({ rateLimit: parsed }, parsed.checkedAt + 1000), true);
  assert.equal(isRateBlocked({ rateLimit: parsed }, parsed.resetAt + 31_000), false);
});

test('rate limiting starts below five remaining requests', () => {
  const resetSeconds = Math.floor((Date.now() + 60_000) / 1000);
  const at = (remaining) => ({
    rateLimit: rateLimitFromHeaders({
      'x-ratelimit-remaining': String(remaining),
      'x-ratelimit-reset': String(resetSeconds),
      'x-ratelimit-limit': '60',
    }),
  });
  assert.equal(isRateBlocked(at(4)), true);
  assert.equal(isRateBlocked(at(5)), false);
});

test('persistRateLimit records the limit for the current identity only', () => {
  const { persistRateLimit } = store;
  const resetSeconds = Math.floor((Date.now() + 60_000) / 1000);
  const limit = rateLimitFromHeaders({
    'x-ratelimit-remaining': '0',
    'x-ratelimit-reset': String(resetSeconds),
    'x-ratelimit-limit': '60',
  });
  persistRateLimit({ identity: 'alice', tokenLogin: null, fingerprint: '' }, limit);
  assert.equal(readCacheRecord().login, 'alice');
  assert.equal(readCacheRecord().rateLimit.remaining, 0);

  writeCacheRecord({
    version: 1, login: 'bob', tokenLogin: 'bob', tokenFingerprint: '',
    sources: { repos: { pages: [], fetchedAt: 1 } }, trees: {}, rateLimit: null,
  });
  persistRateLimit({ identity: 'alice', tokenLogin: null, fingerprint: '' }, limit);
  assert.equal(readCacheRecord().login, 'bob');
  assert.equal(readCacheRecord().rateLimit, null);
});

test('storage failures return safe defaults', () => {
  globalThis.localStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  assert.deepEqual(readRecents('alice'), []);
  assert.equal(readCacheRecord(), null);
});
