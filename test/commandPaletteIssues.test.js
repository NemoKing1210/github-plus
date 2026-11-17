import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {} };

const { issueCandidates, normalizeIssue } = await import('../src/features/commandPalette/issues.js');

test('pull requests and issues share a shape and a badge', () => {
  const pr = normalizeIssue({ number: 7, title: 'Fix it', html_url: 'https://github.com/o/r/pull/7', user: { login: 'ann' }, updated_at: '2026-11-01T00:00:00Z', pull_request: {} }, 'o/r');
  const issue = normalizeIssue({ number: 8, title: 'Bug', html_url: 'https://github.com/o/r/issues/8', user: { login: 'bob' }, updated_at: '2026-11-02T00:00:00Z' }, 'o/r');
  assert.equal(pr.kindLabel, 'pullRequest');
  assert.equal(issue.kindLabel, 'issue');
  assert.equal(pr.repo, 'o/r');
  assert.equal(issue.number, 8);
});

test('candidates are labelled with number and author', () => {
  const state = {
    settings: { sources: { issues: true } },
    context: { repo: 'o/r' },
    cache: { issues: { 'o/r': { etag: '"i"', items: [
      { number: 7, title: 'Fix it', url: 'https://github.com/o/r/pull/7', author: 'ann', updatedAt: '2026-11-01T00:00:00Z', kindLabel: 'pullRequest', repo: 'o/r' },
    ] } } },
  };
  const [item] = issueCandidates(state);
  assert.equal(item.kind, 'issue');
  assert.equal(item.groupId, 'issues');
  assert.match(item.title, /^#7 /);
  assert.ok(item.badges.includes('pullRequest'));
  assert.equal(item.data.run.url, 'https://github.com/o/r/pull/7');
});
