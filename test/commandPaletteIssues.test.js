import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.location = { href: 'https://github.com/' };
globalThis.document = {
  querySelector: (selector) => (
    selector === 'meta[name="user-login"]'
      ? { getAttribute: () => 'alice' }
      : null
  ),
};

const { issueCandidates, normalizeIssue, ensureIssues, forgetIssues } = await import('../src/features/commandPalette/issues.js');
const { readCacheRecord } = await import('../src/features/commandPalette/store.js');

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

test('issue rows can be built for an explicit repository', () => {
  const state = {
    settings: { sources: { issues: true } },
    context: { repo: 'o/page' },
    cache: { issues: { 'o/other': { items: [
      { number: 7, title: 'Scoped bug', url: 'u', author: 'a', updatedAt: '2026-11-01T00:00:00Z', kindLabel: 'issue', comments: 0, repo: 'o/other' },
    ] } } },
  };
  const rows = issueCandidates(state, { repo: 'o/other' });
  assert.equal(rows[0].key, 'issue:o/other#7');
});

test('ensureIssues loads an explicit repository', async () => {
  const urls = [];
  globalThis.GM_xmlhttpRequest = (options) => {
    urls.push(options.url);
    options.onload({ status: 200, responseText: '[]', responseHeaders: '' });
  };
  const result = await ensureIssues({ repo: 'o/other' });
  assert.equal(result.status, 'updated');
  assert.ok(urls.some((url) => url.includes('/repos/o/other/issues')));
  delete globalThis.GM_xmlhttpRequest;
});


test('a forced ensureIssues does not join an in-flight list', async () => {
  const pending = [];
  globalThis.GM_xmlhttpRequest = (options) => pending.push(options);
  const first = ensureIssues({ repo: 'o/force' });
  const second = ensureIssues({ repo: 'o/force', force: true });
  await Promise.resolve();
  assert.equal(pending.length, 2);
  for (const request of pending) {
    request.onload({ status: 200, responseText: '[]', responseHeaders: '' });
  }
  const [one, two] = await Promise.all([first, second]);
  assert.equal(one.status, 'updated');
  assert.equal(two.status, 'updated');
  delete globalThis.GM_xmlhttpRequest;
});

test('a cleared issue cache discards an in-flight list', async () => {
  const pending = [];
  globalThis.GM_xmlhttpRequest = (options) => pending.push(options);
  const loading = ensureIssues({ repo: 'o/discard' });
  forgetIssues();
  pending[0].onload({
    status: 200,
    responseText: JSON.stringify([{ number: 1, title: 'Bug' }]),
    responseHeaders: '',
  });
  const result = await loading;
  assert.equal(result.status, 'discarded');
  assert.deepEqual(readCacheRecord()?.issues || {}, {});
  delete globalThis.GM_xmlhttpRequest;
});
