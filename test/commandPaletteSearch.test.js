import test from 'node:test';
import assert from 'node:assert/strict';
import { searchPalette } from '../src/features/commandPalette/search.js';

function command(key, groupId, groupTitle, title) {
  return {
    key, kind: 'command', groupId, groupTitle, title,
    rankFields: [{ text: title, weight: 4 }], sortKey: 0,
  };
}

function repo(key, groupId, groupTitle, title) {
  return {
    key, kind: 'repo', groupId, groupTitle, title,
    rankFields: [{ text: title, weight: 3 }], sortKey: 0,
  };
}

function file(key, title) {
  return {
    key, kind: 'file', groupId: 'files', groupTitle: 'Files', title,
    rankFields: [{ text: title, weight: 3 }], sortKey: 0,
  };
}

function makeState() {
  return {
    settings: { maxResults: 30 },
    pinnedKeys: [],
    recentKeys: [],
    candidates: [
      command('cmd:repo.code', 'pages', 'Pages', 'Code'),
      command('cmd:user.profile', 'pages', 'Pages', 'Profile'),
      command('cmd:plus.settings', 'plus', 'GitHub Plus', 'Open settings'),
      repo('repo:o/a', 'repos', 'Repositories', 'alpha'),
      repo('repo:o/s', 'starred', 'Starred', 'sigma'),
      file('file:o/r@main:a.js', 'alpha.js'),
    ],
  };
}

test('the empty query follows the browse order and hides files', () => {
  const { groups } = searchPalette(makeState(), '');
  assert.deepEqual(groups.map((group) => group.id), ['pages', 'repos', 'starred', 'plus']);
});

test('prefixes restrict the result kinds', () => {
  assert.deepEqual(
    searchPalette(makeState(), '/alpha').groups.flatMap((group) => group.items.map((item) => item.key)),
    ['file:o/r@main:a.js', 'cmd:search'],
  );
  assert.deepEqual(
    searchPalette(makeState(), '@alpha').groups.flatMap((group) => group.items.map((item) => item.key)),
    ['repo:o/a', 'cmd:search'],
  );
  assert.equal(
    searchPalette(makeState(), '> code').groups.flatMap((group) => group.items.map((item) => item.key)).includes('cmd:repo.code'),
    true,
  );
  assert.equal(searchPalette(makeState(), '> code').groups.some((group) => group.id === 'search'), false);
});

test('a typed query always ends with the search fallback row', () => {
  const { groups } = searchPalette(makeState(), 'code');
  const last = groups.at(-1);
  assert.equal(last.id, 'search');
  assert.equal(last.items[0].key, 'cmd:search');
  assert.equal(last.items[0].data.run.url, 'https://github.com/search?q=code&type=repositories');
});

test('no match still returns only the fallback row', () => {
  const { groups } = searchPalette(makeState(), 'zzz');
  assert.deepEqual(groups.map((group) => group.id), ['search']);
});

test('an empty query has no fallback row', () => {
  assert.equal(searchPalette(makeState(), '').groups.some((group) => group.id === 'search'), false);
});

test('a scoped query labels and addresses the in-repository search', () => {
  const state = { ...makeState(), scope: { repo: 'vuejs/core' } };
  const { groups } = searchPalette(state, 'pin');
  const row = groups.at(-1).items[0];
  assert.match(row.title, /vuejs\/core/);
  assert.equal(row.data.run.url,
    'https://github.com/search?q=repo%3Avuejs%2Fcore+pin&type=code');
});
