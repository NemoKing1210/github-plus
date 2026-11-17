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
      command('cmd:repo.code', 'repository', 'This repository', 'Code'),
      command('cmd:user.profile', 'github', 'GitHub', 'Profile'),
      command('cmd:plus.settings', 'plus', 'GitHub Plus', 'Open settings'),
      repo('repo:o/a', 'repos', 'Repositories', 'alpha'),
      repo('repo:o/s', 'starred', 'Starred', 'sigma'),
      file('file:o/r@main:a.js', 'alpha.js'),
    ],
  };
}

test('the empty query follows the browse order and hides files', () => {
  const { groups } = searchPalette(makeState(), '');
  assert.deepEqual(groups.map((group) => group.id), ['repository', 'github', 'plus', 'repos', 'starred']);
});

test('prefixes restrict the result kinds', () => {
  assert.deepEqual(
    searchPalette(makeState(), '#alpha').groups.flatMap((group) => group.items.map((item) => item.key)),
    ['file:o/r@main:a.js'],
  );
  assert.deepEqual(
    searchPalette(makeState(), '@alpha').groups.flatMap((group) => group.items.map((item) => item.key)),
    ['repo:o/a'],
  );
  assert.equal(
    searchPalette(makeState(), '> code').groups.flatMap((group) => group.items.map((item) => item.key)).includes('cmd:repo.code'),
    true,
  );
});

test('a query with no match falls back to the GitHub search command', () => {
  const { groups } = searchPalette(makeState(), 'zzz');
  assert.equal(groups.length, 1);
  assert.equal(groups[0].id, 'search');
  assert.equal(groups[0].items[0].key, 'cmd:search');
  assert.equal(groups[0].items[0].data.run.url, 'https://github.com/search?q=zzz&type=repositories');
});

test('a matching query does not add the search command', () => {
  const { groups } = searchPalette(makeState(), 'code');
  assert.equal(groups.flatMap((group) => group.items).some((item) => item.key === 'cmd:search'), false);
});
