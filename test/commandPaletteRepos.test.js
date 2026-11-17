import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let disk;
globalThis.localStorage = {
  getItem: (key) => (disk.has(key) ? disk.get(key) : null),
  setItem: (key, value) => disk.set(key, value),
  removeItem: (key) => disk.delete(key),
};
globalThis.location = { href: 'https://github.com/' };
globalThis.document = {
  querySelector: (selector) => {
    if (selector === 'meta[name="user-login"]') {
      return { getAttribute: (name) => (name === 'content' ? 'alice' : null) };
    }
    return null;
  },
};

beforeEach(() => { disk = new Map(); });

const {
  normalizeRepo, mergeRepoSources, repoCandidates, ensureRepositories,
} = await import('../src/features/commandPalette/repos.js');

test('normalizeRepo keeps known fields and defaults', () => {
  const repo = normalizeRepo({ full_name: 'o/r', owner: { login: 'o', type: 'User' }, name: 'r', stargazers_count: 3 });
  assert.equal(repo.fullName, 'o/r');
  assert.equal(repo.stars, 3);
  assert.equal(repo.private, false);
  assert.equal(repo.archived, false);
});

test('mergeRepoSources dedupes and marks the starred copy', () => {
  const mine = [{ fullName: 'o/r', name: 'r' }];
  const starred = [{ fullName: 'o/r', name: 'r' }, { fullName: 'x/y', name: 'y' }];
  const merged = mergeRepoSources(mine, starred);
  assert.equal(merged.repos.length, 1);
  assert.equal(merged.repos[0].starred, true);
  assert.deepEqual(merged.starred.map((repo) => repo.fullName), ['x/y']);
});

test('a cache written by another identity is never read', async () => {
  const { writeCacheRecord, readPaletteState } = await import('../src/features/commandPalette/store.js');
  writeCacheRecord({
    version: 1,
    login: 'bob',
    tokenLogin: 'bob',
    tokenFingerprint: '',
    sources: { repos: { pages: [{ items: [{ fullName: 'bob/private' }] }], fetchedAt: Date.now() } },
    trees: {},
    rateLimit: null,
  });
  const state = readPaletteState();
  assert.equal(state.cache, null);
  assert.deepEqual(repoCandidates(state), []);
});

test('repoCandidates honor source toggles and fork filters', () => {
  const state = {
    settings: { sources: { repositories: true, starred: true }, hideForks: true, hideArchived: false },
    cache: { sources: { repos: { pages: [{ items: [
      { fullName: 'o/fork', owner: 'o', name: 'fork', fork: true },
      { fullName: 'o/main', owner: 'o', name: 'main', fork: false },
    ] }] }, starred: { pages: [{ items: [] }] } } },
  };
  assert.deepEqual(repoCandidates(state).map((item) => item.data.fullName), ['o/main']);
});

test('ensureRepositories caches a successful load and refetches on force', async () => {
  const responses = [
    { status: 200, text: JSON.stringify([{ full_name: 'o/r', owner: { login: 'o', type: 'User' }, name: 'r' }]), headers: 'ETag: "a"\r\n' },
    { status: 200, text: JSON.stringify([]), headers: 'ETag: "b"\r\n' },
  ];
  globalThis.GM_xmlhttpRequest = (options) => {
    const next = responses.shift();
    options.onload({ status: next.status, responseText: next.text, responseHeaders: next.headers });
  };
  const first = await ensureRepositories();
  assert.equal(first.status, 'updated');
  const second = await ensureRepositories();
  assert.equal(second.status, 'cached');
  delete globalThis.GM_xmlhttpRequest;
});
