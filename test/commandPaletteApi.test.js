import test from 'node:test';
import assert from 'node:assert/strict';
import { reposUrl, starredUrl, treeUrl, userUrl } from '../src/features/commandPalette/api.js';

test('URLs switch between authenticated and public endpoints', () => {
  assert.equal(userUrl(), 'https://api.github.com/user');
  assert.equal(
    reposUrl({ page: 2 }),
    'https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=pushed&direction=desc&per_page=100&page=2',
  );
  assert.equal(
    reposUrl({ login: 'alice', page: 1 }),
    'https://api.github.com/users/alice/repos?sort=pushed&direction=desc&per_page=100&page=1',
  );
  assert.equal(
    starredUrl({ page: 1 }),
    'https://api.github.com/user/starred?sort=created&direction=desc&per_page=100&page=1',
  );
});

test('a slashed ref is encoded in the tree URL', () => {
  assert.equal(
    treeUrl({ owner: 'o', repo: 'r', ref: 'feature/x' }),
    'https://api.github.com/repos/o/r/git/trees/feature%2Fx?recursive=1',
  );
});

function stubGm(responses) {
  let index = 0;
  globalThis.GM_xmlhttpRequest = (options) => {
    const next = responses[index++];
    if (!next) throw new Error('unexpected request');
    options.onload({
      status: next.status,
      responseText: next.text ?? '',
      responseHeaders: next.headers ?? '',
    });
  };
}

test('304 reuses a cached page and pagination stops at a short page', async () => {
  const { fetchRepoSource } = await import('../src/features/commandPalette/api.js');
  stubGm([
    { status: 304, headers: 'ETag: "one"\r\n' },
    { status: 200, text: JSON.stringify([{ full_name: 'o/r' }]), headers: 'ETag: "two"\r\n' },
  ]);
  const result = await fetchRepoSource({
    source: 'repos',
    token: 't',
    cachedPages: [{ etag: '"one"', items: [{ full_name: 'cached/r' }] }],
  });
  assert.equal(result.pages[0].items[0].full_name, 'cached/r');
  assert.equal(result.pages[1].items[0].full_name, 'o/r');
  assert.equal(result.complete, true);
  delete globalThis.GM_xmlhttpRequest;
});

test('requests carry the API version, the media type and the token', async () => {
  const { fetchUser } = await import('../src/features/commandPalette/api.js');
  let headers = null;
  globalThis.GM_xmlhttpRequest = (options) => {
    headers = options.headers;
    options.onload({ status: 200, responseText: '{"login":"alice"}', responseHeaders: '' });
  };
  await fetchUser({ token: 't' });
  assert.equal(headers.Accept, 'application/vnd.github+json');
  assert.equal(headers['X-GitHub-Api-Version'], '2022-11-28');
  assert.equal(headers.Authorization, 'Bearer t');
  delete globalThis.GM_xmlhttpRequest;
});

test('a 403 carries the rate limit on the error', async () => {
  const { fetchRepoSource } = await import('../src/features/commandPalette/api.js');
  stubGm([{ status: 403, headers: 'X-RateLimit-Remaining: 0\r\nX-RateLimit-Reset: 2000\r\nX-RateLimit-Limit: 60\r\n' }]);
  await assert.rejects(fetchRepoSource({ source: 'repos', token: 't' }), (error) => {
    assert.equal(error.status, 403);
    assert.equal(error.rateLimit.remaining, 0);
    return true;
  });
  delete globalThis.GM_xmlhttpRequest;
});

test('the issues URL is state=open and desc by update', async () => {
  const { issuesUrl } = await import('../src/features/commandPalette/api.js');
  assert.equal(
    issuesUrl({ owner: 'o', repo: 'r', page: 2 }),
    'https://api.github.com/repos/o/r/issues?state=open&sort=updated&direction=desc&per_page=100&page=2',
  );
});

test('an unchanged issues page is reused, pull requests included', async () => {
  const { fetchIssuesPage } = await import('../src/features/commandPalette/api.js');
  stubGm([{ status: 304, headers: 'ETag: "i1"\r\n' }]);
  const page = await fetchIssuesPage({ owner: 'o', repo: 'r', cached: { etag: '"i1"', items: [{ number: 1 }] } });
  assert.equal(page.notModified, true);
  assert.equal(page.items[0].number, 1);
  delete globalThis.GM_xmlhttpRequest;
});
