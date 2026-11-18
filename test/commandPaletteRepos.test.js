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

test('a repo row carries the GitHub URL its selection navigates to', () => {
  const state = {
    settings: { sources: { repositories: true, starred: true }, hideForks: false, hideArchived: false },
    cache: { sources: { repos: { pages: [{ items: [
      { fullName: 'o/main', owner: 'o', name: 'main' },
    ] }] }, starred: { pages: [{ items: [] }] } } },
  };
  const [candidate] = repoCandidates(state);
  assert.equal(candidate.data.url, 'https://github.com/o/main');
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

test('without a token the public endpoints of the signed-in account are used', async () => {
  const urls = [];
  globalThis.GM_xmlhttpRequest = (options) => {
    urls.push(options.url);
    const starred = options.url.includes('/starred');
    options.onload({
      status: 200,
      responseText: starred
        ? '[]'
        : JSON.stringify([{ full_name: 'alice/repo', owner: { login: 'alice', type: 'User' }, name: 'repo' }]),
      responseHeaders: '',
    });
  };
  const result = await ensureRepositories({ force: true });
  assert.equal(result.status, 'updated');
  assert.ok(urls.some((url) => url.startsWith('https://api.github.com/users/alice/repos?')));
  assert.ok(urls.some((url) => url.startsWith('https://api.github.com/users/alice/starred?')));
  assert.ok(!urls.some((url) => url.includes('/user/repos')));
  delete globalThis.GM_xmlhttpRequest;
});

test('a failed load still records the rate limit and blocks the next refresh', async () => {
  const { readCacheRecord } = await import('../src/features/commandPalette/store.js');
  const resetSeconds = Math.floor((Date.now() + 60_000) / 1000);
  const headers = [
    'x-ratelimit-remaining: 0',
    `x-ratelimit-reset: ${resetSeconds}`,
    'x-ratelimit-limit: 60',
    '',
  ].join('\r\n');
  let requests = 0;
  globalThis.GM_xmlhttpRequest = (options) => {
    requests += 1;
    options.onload({ status: 403, responseText: '', responseHeaders: headers });
  };
  const first = await ensureRepositories({ force: true });
  assert.equal(first.status, 'error');
  assert.equal(readCacheRecord().rateLimit.remaining, 0);
  const second = await ensureRepositories();
  assert.equal(second.status, 'cached');
  assert.equal(requests, 2);
  delete globalThis.GM_xmlhttpRequest;
});

test('a repository refresh keeps a tree written while it was in flight', async () => {
  const { writeCacheRecord, readCacheRecord } = await import('../src/features/commandPalette/store.js');
  let requests = 0;
  globalThis.GM_xmlhttpRequest = (options) => {
    requests += 1;
    if (requests === 2) {
      writeCacheRecord({
        login: 'alice',
        tokenFingerprint: '',
        sources: {},
        trees: { 'o/r@main': { items: [], fetchedAt: 7 } },
        rateLimit: null,
      });
    }
    options.onload({ status: 200, responseText: '[]', responseHeaders: '' });
  };
  await ensureRepositories({ force: true });
  assert.deepEqual(readCacheRecord().trees, { 'o/r@main': { items: [], fetchedAt: 7 } });
  delete globalThis.GM_xmlhttpRequest;
});
