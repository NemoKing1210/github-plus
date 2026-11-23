import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {} };

const { fetchSimilar, ApiError } = await import('../src/features/similarRepos/api.js');

function jsonResponse(status, body, headers = {}) {
  return {
    status,
    headers,
    text: JSON.stringify(body),
  };
}

async function expectCode(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof ApiError, 'expected an ApiError');
    assert.equal(error.code, code);
    return true;
  });
}

test('an unknown provider is rejected before any request', async () => {
  await expectCode(fetchSimilar({ provider: 'nope', repo: 'a/b' }), 'invalid');
});

test('simrepo maps not-in-dataset and star-required to typed errors', async () => {
  await expectCode(
    fetchSimilar({
      provider: 'simrepo',
      repo: 'a/b',
      page: 1,
      request: async () => ({ status: 404, headers: {}, text: 'Repo not included in the dataset yet' }),
    }),
    'not-in-dataset',
  );
  await expectCode(
    fetchSimilar({
      provider: 'simrepo',
      repo: 'a/b',
      page: 2,
      request: async () => ({ status: 400, headers: {}, text: 'Only the first page is available' }),
    }),
    'star-required',
  );
});

test('simrepo reports a rate limit with its reset time', async () => {
  const before = Date.now();
  const error = await fetchSimilar({
    provider: 'simrepo',
    repo: 'a/b',
    page: 1,
    request: async () => ({ status: 429, headers: { 'retry-after': '120' }, text: 'slow down' }),
  }).catch((caught) => caught);
  assert.equal(error.code, 'rate-limited');
  assert.ok(error.resetAt >= before + 120000);
  assert.ok(error.resetAt <= Date.now() + 120000);
});

test('simrepo parses rows, relative percentages and a full page as more', async () => {
  const out = await fetchSimilar({
    provider: 'simrepo',
    repo: 'sveltejs/svelte',
    page: 1,
    request: async () =>
      jsonResponse(200, {
        repos: [
          {
            repo: 'sveltejs/kit',
            score: 2,
            meta: { description: 'd', language: 'JS', stars_total: 5, forks_count: 1, archived: false },
          },
          { repo: 'sveltejs/sapper', score: 1, meta: { language: 'JS' } },
        ],
      }),
  });
  assert.equal(out.items.length, 2);
  assert.equal(out.items[0].repo, 'sveltejs/kit');
  assert.equal(out.items[0].percent, 100);
  assert.equal(out.items[1].percent, 50);
  assert.equal(out.hasMore, false);
});

test('a non-JSON simrepo body is an invalid response, never a crash', async () => {
  await expectCode(
    fetchSimilar({
      provider: 'simrepo',
      repo: 'a/b',
      page: 1,
      request: async () => ({ status: 200, headers: {}, text: '<html>nope</html>' }),
    }),
    'invalid',
  );
});

test('github searches after the metadata and sends the token only when set', async () => {
  const calls = [];
  const request = async (options) => {
    calls.push(options);
    if (options.url.includes('/search/repositories')) {
      return jsonResponse(200, {
        items: [
          { full_name: 'a/c', topics: ['x'], language: 'Go', stargazers_count: 50, forks_count: 2 },
        ],
      });
    }
    return jsonResponse(200, { full_name: 'a/b', topics: ['x'], language: 'Go', stargazers_count: 40 });
  };
  const out = await fetchSimilar({ provider: 'github', repo: 'a/b', page: 1, token: 'secret', request });
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /search\/repositories\?q=topic%3Ax%20language%3AGo/);
  assert.equal(calls[1].headers.Authorization, 'Bearer secret');
  assert.equal(out.items[0].repo, 'a/c');
  assert.equal(out.hasMore, false);
});

test('github without a token sends no Authorization header', async () => {
  const calls = [];
  await fetchSimilar({
    provider: 'github',
    repo: 'a/b',
    page: 1,
    token: '   ',
    request: async (options) => {
      calls.push(options);
      return options.url.includes('/search/')
        ? jsonResponse(200, { items: [] })
        : jsonResponse(200, { topics: ['x'], language: 'Go', stargazers_count: 5 });
    },
  });
  assert.equal(calls[1].headers.Authorization, undefined);
});

test('github with no topics and no language makes one request only', async () => {
  const calls = [];
  const out = await fetchSimilar({
    provider: 'github',
    repo: 'a/b',
    page: 1,
    request: async (options) => {
      calls.push(options);
      return jsonResponse(200, { topics: [], language: null });
    },
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(out.items, []);
  assert.equal(out.hasMore, false);
});

test('github maps rate limits to a reset time', async () => {
  const reset = Math.floor(Date.now() / 1000) + 60;
  const error = await fetchSimilar({
    provider: 'github',
    repo: 'a/b',
    page: 1,
    request: async () => jsonResponse(403, { message: 'rate limited' }, { 'x-ratelimit-reset': String(reset) }),
  }).catch((caught) => caught);
  assert.equal(error.code, 'rate-limited');
  assert.equal(error.resetAt, reset * 1000);
});

test('a network rejection becomes a network error and an abort stays an abort', async () => {
  await expectCode(
    fetchSimilar({
      provider: 'github',
      repo: 'a/b',
      request: async () => {
        throw new Error('Failed to fetch');
      },
    }),
    'network',
  );
  const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
  const error = await fetchSimilar({
    provider: 'github',
    repo: 'a/b',
    request: async () => {
      throw abort;
    },
  }).catch((caught) => caught);
  assert.equal(error, abort);
});
