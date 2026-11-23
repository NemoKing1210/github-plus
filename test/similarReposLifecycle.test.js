import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function installDom(path = '/o/r') {
  const dom = new JSDOM(
    `<!doctype html><html><head>
      <meta name="octolytics-dimension-repository_public" content="true">
    </head><body>
      <main>
        <div class="sidebar">
          <h2><span>Releases</span></h2>
          <h2><span>Languages</span></h2>
        </div>
      </main>
    </body></html>`,
    { pretendToBeVisual: true, url: `https://github.com${path}` },
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.location = dom.window.location;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.MutationObserver = dom.window.MutationObserver;
  return dom;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (check()) return true;
    await wait(20);
  }
  return false;
}

const okResponse = (body) => ({ status: 200, headers: {}, text: JSON.stringify(body) });

test('a public repository renders the panel with its first page', async () => {
  installDom();
  const { initSimilarReposFeature } = await import('../src/features/similarRepos/index.js');
  const calls = [];
  const api = await import('../src/features/similarRepos/api.js');
  initSimilarReposFeature({
    fetchSimilar: async (options) => {
      calls.push(options);
      return {
        items: [{ repo: 'sveltejs/kit', description: 'kit', language: 'JS', stars: 5, forks: 1, archived: false, percent: 100 }],
        hasMore: true,
      };
    },
  });
  assert.ok(await waitFor(() => document.querySelector('.gp-similar')));
  assert.equal(calls[0].provider, 'github');
  assert.equal(calls[0].repo, 'o/r');
  assert.ok(document.querySelector('.gp-similar__name'));
});

test('no request is sent on a private or unknown page', async () => {
  installDom();
  document.querySelector('meta[name="octolytics-dimension-repository_public"]').content = 'false';
  const { initSimilarReposFeature } = await import('../src/features/similarRepos/index.js?v=private');
  let calls = 0;
  initSimilarReposFeature({
    fetchSimilar: async () => {
      calls += 1;
      return { items: [], hasMore: false };
    },
  });
  await wait(300);
  assert.equal(calls, 0);
  assert.equal(document.querySelector('.gp-similar'), null);
});

test('turning the feature off removes the panel and stops requests', async () => {
  installDom();
  const { initSimilarReposFeature, applySimilarReposSettings } = await import(
    '../src/features/similarRepos/index.js?v=off'
  );
  initSimilarReposFeature({
    fetchSimilar: async () => ({
      items: [{ repo: 'a/c', description: '', language: '', stars: 1, forks: 0, archived: false, percent: 100 }],
      hasMore: false,
    }),
  });
  assert.ok(await waitFor(() => document.querySelector('.gp-similar')));
  applySimilarReposSettings({ enabled: false, provider: 'github', results: 5, cacheHours: 24 });
  assert.equal(document.querySelector('.gp-similar'), null);
});

test('a slow response from a previous repository is dropped after navigation', async () => {
  const dom = installDom('/o/r');
  const { initSimilarReposFeature, applySimilarReposSettings } = await import(
    '../src/features/similarRepos/index.js?v=nav'
  );
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  initSimilarReposFeature({
    fetchSimilar: async (options) => {
      if (options.repo === 'o/r') await pending;
      return {
        items: [{
          repo: options.repo === 'o/r' ? 'old/stale' : 'new/fresh',
          description: '',
          language: '',
          stars: 1,
          forks: 0,
          archived: false,
          percent: 100,
        }],
        hasMore: false,
      };
    },
  });
  await wait(150);
  // Simulate a soft navigation to another repository before the fetch settles.
  dom.window.history.pushState({}, '', '/o/other');
  applySimilarReposSettings({ enabled: true, provider: 'github', results: 5, cacheHours: 24 });
  release();
  await wait(300);
  const text = document.body.textContent;
  assert.ok(!text.includes('old/stale'), 'stale rows never render');
  assert.ok(text.includes('new/fresh'), 'the new repository renders its own rows');
});

test('View more appends the next page to the rows already shown', async () => {
  installDom('/pages/repo');
  const { initSimilarReposFeature, clearSimilarReposCache } = await import(
    '../src/features/similarRepos/index.js?v=paging'
  );
  clearSimilarReposCache();
  const pages = [];
  initSimilarReposFeature({
    fetchSimilar: async (options) => {
      pages.push(options.page);
      return {
        items: [{
          repo: `owner/page-${options.page}`,
          description: '',
          language: '',
          stars: 1,
          forks: 0,
          archived: false,
          percent: 100,
        }],
        hasMore: options.page < 2,
      };
    },
  });
  assert.ok(await waitFor(() => document.querySelector('.gp-similar__more')));
  document.querySelector('.gp-similar__more').click();
  assert.ok(await waitFor(() => document.querySelectorAll('.gp-similar__row').length === 2));
  const names = [...document.querySelectorAll('.gp-similar__repo')].map((node) => node.textContent);
  assert.deepEqual(names, ['page-1', 'page-2'], 'page 1 survives page 2');
  assert.equal(document.querySelector('.gp-similar__more'), null, 'the last page drops the button');
  assert.deepEqual(pages, [1, 2]);
});

test('the session cache serves a repeat open without a second request', async () => {
  installDom('/cache/repo');
  const { initSimilarReposFeature, applySimilarReposSettings } = await import(
    '../src/features/similarRepos/index.js?v=cache'
  );
  let calls = 0;
  const fetchSimilar = async () => {
    calls += 1;
    return {
      items: [{ repo: 'a/c', description: '', language: '', stars: 1, forks: 0, archived: false, percent: 100 }],
      hasMore: false,
    };
  };
  initSimilarReposFeature({ fetchSimilar });
  assert.ok(await waitFor(() => document.querySelector('.gp-similar')));
  applySimilarReposSettings({ enabled: false, provider: 'github', results: 5, cacheHours: 24 });
  applySimilarReposSettings({ enabled: true, provider: 'github', results: 5, cacheHours: 24 });
  assert.ok(await waitFor(() => document.querySelector('.gp-similar')));
  assert.equal(calls, 1);
});
