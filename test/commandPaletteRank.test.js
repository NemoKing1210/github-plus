import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, scoreText, rankCandidates } from '../src/features/commandPalette/rank.js';

test('prefixes split mode and text', () => {
  assert.deepEqual(parseQuery('> open'), { mode: 'commands', text: 'open' });
  assert.deepEqual(parseQuery('@react'), { mode: 'repos', text: 'react' });
  assert.deepEqual(parseQuery('#src/main'), { mode: 'files', text: 'src/main' });
  assert.deepEqual(parseQuery('?issue'), { mode: 'search', text: 'issue' });
  assert.deepEqual(parseQuery('  open  '), { mode: 'all', text: 'open' });
});

test('exact substrings outrank scattered subsequences and carry ranges', () => {
  const exact = scoreText('rea', 'react');
  const scattered = scoreText('rea', 'r-e-a-c-t');
  assert.deepEqual(exact.ranges, [[0, 3]]);
  assert.ok(exact.score > scattered.score);
  assert.equal(scoreText('zzz', 'react'), null);
});

const candidates = [
  { key: 'cmd:issues', kind: 'command', groupId: 'repository', groupTitle: 'This repository',
    title: 'Issues', rankFields: [{ text: 'Issues', weight: 4 }], sortKey: 1 },
  { key: 'repo:facebook/react', kind: 'repo', groupId: 'repos', groupTitle: 'Repositories',
    title: 'react', rankFields: [{ text: 'react', weight: 3 }, { text: 'facebook', weight: 1.5 }], sortKey: 2 },
  { key: 'file:o/r@main:src/react.js', kind: 'file', groupId: 'files', groupTitle: 'Files',
    title: 'react.js', rankFields: [{ text: 'react.js', weight: 3 }, { text: 'src/react.js', weight: 2 }], sortKey: 3 },
];

test('multi-term queries require every term', () => {
  const { groups } = rankCandidates(candidates, 'facebook rea', { pinnedKeys: [], recentKeys: [] });
  assert.deepEqual(groups.flatMap((group) => group.items.map((item) => item.key)), ['repo:facebook/react']);
});

test('empty query builds pinned and recent groups without duplicates', () => {
  const { groups } = rankCandidates(candidates, '', {
    pinnedKeys: ['repo:facebook/react'],
    recentKeys: ['repo:facebook/react', 'cmd:issues'],
  });
  assert.deepEqual(groups.map((group) => group.id), ['pinned', 'recent']);
  assert.deepEqual(groups[0].items.map((item) => item.key), ['repo:facebook/react']);
  assert.deepEqual(groups[1].items.map((item) => item.key), ['cmd:issues']);
});

test('a mode keeps only its kind', () => {
  assert.equal(rankCandidates(candidates, '#react', { pinnedKeys: [], recentKeys: [] }).groups[0].items[0].key,
    'file:o/r@main:src/react.js');
  assert.equal(rankCandidates(candidates, '> rea', { pinnedKeys: [], recentKeys: [] }).groups
    .flatMap((group) => group.items).length, 0);
});

test('the total cap trims groups in order', () => {
  const many = Array.from({ length: 40 }, (_, index) => ({
    key: `repo:o/r${index}`, kind: 'repo', groupId: 'repos', groupTitle: 'Repositories',
    title: `Repo ${index}`, rankFields: [{ text: `Repo ${index}`, weight: 3 }], sortKey: index,
  }));
  const { groups } = rankCandidates(many, 'repo', { pinnedKeys: [], recentKeys: [], maxResults: 10 });
  assert.equal(groups.flatMap((group) => group.items).length, 10);
});
