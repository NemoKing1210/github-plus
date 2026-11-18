import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://github.com/o/r',
});
globalThis.DOMParser = dom.window.DOMParser;

function installFetch(handler) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return handler(String(url), options, calls.length);
  };
  return calls;
}

function jsonResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

const FOLDER_URL = '/o/r/tree/main/src';

test('a folder listing parses items, sorts folders first and builds the key', async () => {
  const { fetchFolder, folderKey, clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const calls = installFetch(() => jsonResponse({
    payload: {
      codeViewTreeRoute: {
        path: 'src',
        tree: {
          items: [
            { name: 'b.js', path: 'src/b.js', contentType: 'file' },
            { name: 'Zeta', path: 'src/Zeta', contentType: 'directory' },
            { name: 'a.js', path: 'src/a.js', contentType: 'file' },
            { name: 'Alpha', path: 'src/Alpha', contentType: 'directory' },
          ],
          totalCount: 4,
        },
      },
    },
  }));

  assert.equal(folderKey(FOLDER_URL), FOLDER_URL);
  const folder = await fetchFolder(FOLDER_URL);
  assert.equal(folder.path, 'src');
  assert.equal(folder.totalCount, 4);
  assert.deepEqual(folder.entries.map((entry) => `${entry.type}:${entry.name}`), [
    'folder:Alpha',
    'folder:Zeta',
    'file:a.js',
    'file:b.js',
  ]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `https://github.com${FOLDER_URL}`);
  assert.equal(calls[0].options.headers.Accept, 'application/json');
  assert.equal(calls[0].options.credentials, 'same-origin');
});

test('a folder listing is capped and keeps the reported total', async () => {
  const { fetchFolder, clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const items = Array.from({ length: 1200 }, (_, index) => ({
    name: `f${index}.js`,
    path: `src/f${index}.js`,
    contentType: 'file',
  }));
  installFetch(() => jsonResponse({
    payload: { codeViewTreeRoute: { path: 'src', tree: { items, totalCount: 1200 } } },
  }));

  const folder = await fetchFolder(FOLDER_URL);
  assert.equal(folder.entries.length, 1000);
  assert.equal(folder.totalCount, 1200);
});

test('an unsuccessful or malformed folder response throws', async () => {
  const { fetchFolder, clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  installFetch(() => jsonResponse({}, 404));
  await assert.rejects(fetchFolder(FOLDER_URL), /404/);

  installFetch(() => jsonResponse({ meta: {} }));
  await assert.rejects(fetchFolder(FOLDER_URL), /folder/);
});

test('a folder listing is cached until forced', async () => {
  const { fetchFolder, clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const calls = installFetch(() => jsonResponse({
    payload: { codeViewTreeRoute: { path: 'src', tree: { items: [], totalCount: 0 } } },
  }));

  await fetchFolder(FOLDER_URL);
  await fetchFolder(FOLDER_URL);
  assert.equal(calls.length, 1);

  await fetchFolder(FOLDER_URL, { force: true });
  assert.equal(calls.length, 2);
});

test('commit info parses the message and its title', async () => {
  const { fetchCommitInfo, clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const calls = installFetch(() => jsonResponse({
    entries: {
      'a.js': {
        oid: 'abc123',
        url: '/o/r/commit/abc123',
        date: '2026-11-17T22:47:35.000Z',
        shortMessageHtmlLink: {
          value: '<a data-pjax="true" title="Fix the thing&#10;&#10;With details" class="Link--primary" href="/o/r/commit/abc123">Fix the thing</a>',
        },
      },
    },
  }));

  const info = await fetchCommitInfo(FOLDER_URL);
  assert.equal(calls[0].url, 'https://github.com/o/r/tree-commit-info/main/src');
  assert.equal(calls[0].options.headers.Accept, 'application/json');
  assert.deepEqual(info.get('a.js'), {
    oid: 'abc123',
    url: '/o/r/commit/abc123',
    date: '2026-11-17T22:47:35.000Z',
    message: 'Fix the thing',
    title: 'Fix the thing\n\nWith details',
  });
});

test('a failed commit-info request resolves to an empty map', async () => {
  const { fetchCommitInfo, clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  installFetch(() => jsonResponse({}, 500));
  const info = await fetchCommitInfo(FOLDER_URL);
  assert.equal(info.size, 0);
});
