import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, scoreText, rankCandidates, markPinned } from '../src/features/commandPalette/rank.js';

test('prefixes match GitHub meanings', () => {
  assert.deepEqual(parseQuery('> open'), { mode: 'commands', text: 'open' });
  assert.deepEqual(parseQuery('#1'), { mode: 'issues', text: '1' });
  assert.deepEqual(parseQuery('/src'), { mode: 'files', text: 'src' });
  assert.deepEqual(parseQuery('@react'), { mode: 'repos', text: 'react' });
  assert.deepEqual(parseQuery('?help'), { mode: 'all', text: '?help' });
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
  assert.equal(rankCandidates(candidates, '/react', { pinnedKeys: [], recentKeys: [] }).groups[0].items[0].key,
    'file:o/r@main:src/react.js');
  const issue = {
    key: 'issue:o/r#42', kind: 'issue', groupId: 'issues', groupTitle: 'Issues',
    title: '#42 react bug', rankFields: [{ text: 'react bug', weight: 3 }, { text: '#42', weight: 2 }],
  };
  assert.equal(rankCandidates([...candidates, issue], '#42', { pinnedKeys: [], recentKeys: [] })
    .groups[0].items[0].key, 'issue:o/r#42');
  assert.equal(rankCandidates(candidates, '> rea', { pinnedKeys: [], recentKeys: [] }).groups
    .flatMap((group) => group.items).length, 0);
});

test('the total cap trims groups in order and exempts the top result', () => {
  const many = Array.from({ length: 40 }, (_, index) => ({
    key: `repo:o/r${index}`, kind: 'repo', groupId: 'repos', groupTitle: 'Repositories',
    title: `Repo ${index}`, rankFields: [{ text: `Repo ${index}`, weight: 3 }], sortKey: index,
  }));
  const { groups } = rankCandidates(many, 'repo', { pinnedKeys: [], recentKeys: [], maxResults: 10 });
  assert.equal(groups[0].id, 'top');
  assert.equal(groups.slice(1).flatMap((group) => group.items).length, 10);
});

test('a typed query promotes the best match above favorites', () => {
  const candidates = [
    { key: 'repo:a', kind: 'repo', groupId: 'repos', title: 'alpha', rankFields: [{ text: 'alpha', weight: 3 }] },
    { key: 'repo:b', kind: 'repo', groupId: 'repos', title: 'alphabet', rankFields: [{ text: 'alphabet', weight: 3 }] },
  ];
  const result = rankCandidates(candidates, 'alpha', {
    pinnedKeys: ['repo:a'],
    titles: { top: 'Top result', pinned: 'Favorites', recent: 'Recent' },
  });
  assert.equal(result.groups[0].id, 'top');
  assert.deepEqual(result.groups[0].items.map((item) => item.key), ['repo:a']);
  const rest = result.groups.flatMap((group) => group.items.map((item) => item.key));
  assert.equal(rest.filter((key) => key === 'repo:a').length, 1);
  assert.deepEqual(result.groups.find((group) => group.id === 'repos').items.map((item) => item.key), ['repo:b']);
});

test('markPinned adds the badge once and keeps the rest intact', () => {
  const marked = markPinned([
    { key: 'repo:a', badges: ['starred'] },
    { key: 'file:x', badges: ['pinned'] },
  ], ['repo:a', 'file:x']);
  assert.deepEqual(marked[0].badges, ['starred', 'pinned']);
  assert.equal(marked[0].pinned, true);
  assert.deepEqual(marked[1].badges, ['pinned']);
});

test('a prefix mode keeps only favorites of that kind', () => {
  const candidates = [
    { key: 'repo:a', kind: 'repo', groupId: 'repos', title: 'alpha', rankFields: [{ text: 'alpha', weight: 3 }] },
    { key: 'file:a.js', kind: 'file', groupId: 'files', title: 'a.js', rankFields: [{ text: 'a.js', weight: 3 }] },
  ];
  const result = rankCandidates(candidates, '/a', {
    pinnedKeys: ['repo:a', 'file:a.js'],
    titles: { pinned: 'Favorites', recent: 'Recent' },
  });
  assert.deepEqual(result.groups[0].items.map((item) => item.key), ['file:a.js']);
});

test('the empty query browses pages and repositories but not files or issues', () => {
  const result = rankCandidates([
    { key: 'cmd:home', kind: 'command', groupId: 'pages', title: 'Code', rankFields: [{ text: 'Code', weight: 3 }] },
    { key: 'issue:1', kind: 'issue', groupId: 'issues', title: '#1 Bug', rankFields: [{ text: '#1 Bug', weight: 3 }] },
    { key: 'repo:o/r', kind: 'repo', groupId: 'repos', title: 'o/r', rankFields: [{ text: 'o/r', weight: 3 }] },
  ], '', { titles: { pinned: 'Favorites', recent: 'Recent' } });
  assert.deepEqual(result.groups.map((group) => group.id), ['pages', 'repos']);
});

function scopedCandidates() {
  return [
    { key: 'cmd:settings', kind: 'command', groupId: 'plus', groupTitle: 'Plus',
      title: 'Settings', rankFields: [{ text: 'Settings', weight: 4 }] },
    { key: 'repo:o/a', kind: 'repo', groupId: 'repos', groupTitle: 'Repositories',
      title: 'o/a', data: { fullName: 'o/a' }, rankFields: [{ text: 'o/a', weight: 3 }] },
    { key: 'repo:o/b', kind: 'repo', groupId: 'repos', groupTitle: 'Repositories',
      title: 'o/b', data: { fullName: 'o/b' }, rankFields: [{ text: 'o/b', weight: 3 }] },
    { key: 'file:o/a@HEAD:x.js', kind: 'file', groupId: 'files', groupTitle: 'Files',
      title: 'x.js', data: { repo: 'o/a' }, rankFields: [{ text: 'x.js', weight: 3 }] },
    { key: 'issue:o/b#2', kind: 'issue', groupId: 'issues', groupTitle: 'Issues',
      title: '#2 Bug', data: { repo: 'o/b' }, rankFields: [{ text: 'Bug', weight: 3 }] },
  ];
}

test('a scope keeps only the scoped rows and asks for files by prefix', () => {
  const keys = (query) => rankCandidates(scopedCandidates(), query, {
    scope: { repo: 'o/a' }, titles: { top: 'Top result' },
  }).groups.flatMap((group) => group.items.map((item) => item.key)).sort();
  // The empty scoped list is the repository's pages; the candidate builder
  // leaves repository rows out of a scope, so only this fixture's row is left.
  // Plus, files and issues stay one prefix away.
  assert.deepEqual(keys(''), ['repo:o/a']);
  assert.deepEqual(keys('/x'), ['file:o/a@HEAD:x.js']);
  assert.deepEqual(keys('a'), ['repo:o/a']);
});

test('the best match is promoted to a Top result group and not repeated', () => {
  const result = rankCandidates(scopedCandidates(), 'o/a', {
    titles: { top: 'Top result', pinned: 'Favorites', recent: 'Recent' },
  });
  assert.equal(result.groups[0].id, 'top');
  assert.deepEqual(result.groups[0].items.map((item) => item.key), ['repo:o/a']);
  const all = result.groups.flatMap((group) => group.items.map((item) => item.key));
  assert.equal(all.filter((key) => key === 'repo:o/a').length, 1);
});

test('a pinned best match moves to Top result instead of Favorites', () => {
  const result = rankCandidates(scopedCandidates(), 'o/a', {
    pinnedKeys: ['repo:o/a'],
    titles: { top: 'Top result', pinned: 'Favorites', recent: 'Recent' },
  });
  assert.equal(result.groups[0].id, 'top');
  assert.equal(result.groups.some((group) => group.id === 'pinned'), false);
});

test('an empty query has no Top result group', () => {
  const result = rankCandidates(scopedCandidates(), '', { titles: { top: 'Top result' } });
  assert.equal(result.groups.some((group) => group.id === 'top'), false);
});

test('favorites and recents stay global inside a scope', () => {
  const result = rankCandidates(scopedCandidates(), '', {
    scope: { repo: 'o/a' },
    pinnedKeys: ['repo:o/b'],
    recentKeys: ['issue:o/b#2'],
    titles: { pinned: 'Favorites', recent: 'Recent' },
  });
  const ids = result.groups.map((group) => group.id);
  assert.ok(ids.includes('pinned'));
  assert.ok(ids.includes('recent'));
  const keys = result.groups.flatMap((group) => group.items.map((item) => item.key));
  assert.ok(keys.includes('repo:o/b'));
  assert.ok(keys.includes('issue:o/b#2'));
});
