import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {} };

const { getDefaults } = await import('../src/core/constants.js');
const { normalizeSimilarRepos } = await import('../src/core/settings.js');
const {
  buildSearchQuery,
  normalizeGithubItem,
  normalizeSimrepoItem,
  relativePercentages,
  scoreGithubCandidate,
} = await import('../src/features/similarRepos/score.js');

test('similarRepos ships disabled-safe defaults and normalizes junk', () => {
  assert.deepEqual(getDefaults().similarRepos, {
    enabled: true,
    provider: 'github',
    results: 5,
    cacheHours: 24,
  });
  const bad = normalizeSimilarRepos(
    { provider: 'other', results: 999, cacheHours: -3 },
    getDefaults().similarRepos,
  );
  assert.equal(bad.provider, 'github');
  assert.equal(bad.results, 20);
  assert.equal(bad.cacheHours, 0);
  assert.equal(normalizeSimilarRepos(null, getDefaults().similarRepos).provider, 'github');
});

test('github query caps topics at three operators and needs a signal', () => {
  assert.equal(buildSearchQuery({ topics: [], language: '' }), '');
  assert.equal(buildSearchQuery({ topics: null, language: '' }), '');
  assert.equal(
    buildSearchQuery({ topics: ['a', 'b', 'c', 'd'], language: 'Go' }),
    'topic:a topic:b topic:c language:Go',
  );
  assert.equal(buildSearchQuery({ topics: [], language: 'Rust' }), 'language:Rust');
});

test('github scoring rewards shared topics, language and star proximity', () => {
  const meta = { topics: ['x', 'y'], language: 'Go', stars: 1000 };
  const near = scoreGithubCandidate(meta, {
    topics: ['x', 'y', 'z'],
    language: 'Go',
    stars_total: 900,
  });
  const far = scoreGithubCandidate(meta, {
    topics: [],
    language: 'Rust',
    stars_total: 5,
  });
  assert.ok(near > far);
  assert.ok(near <= 1 && far >= 0);
});

test('items normalize missing fields without throwing', () => {
  assert.deepEqual(normalizeSimrepoItem({ repo: 'a/b' }), {
    repo: 'a/b',
    description: '',
    language: '',
    stars: 0,
    forks: 0,
    archived: false,
    score: 0,
  });
  assert.equal(normalizeGithubItem({ full_name: 'a/b' }).repo, 'a/b');
  assert.equal(normalizeGithubItem({}).repo, '');
  assert.equal(normalizeSimrepoItem(null).repo, '');
});

test('relative percentages make the strongest row 100% and never divide by zero', () => {
  const rows = relativePercentages([
    { repo: 'a', score: 20 },
    { repo: 'b', score: 10 },
  ]);
  assert.equal(rows[0].percent, 100);
  assert.equal(rows[1].percent, 50);
  assert.deepEqual(
    relativePercentages([{ repo: 'a', score: 0 }]).map((row) => row.percent),
    [0],
  );
  assert.deepEqual(relativePercentages([]), []);
});
