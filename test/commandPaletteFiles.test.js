import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let disk;
globalThis.localStorage = {
  getItem: (key) => (disk.has(key) ? disk.get(key) : null),
  setItem: (key, value) => disk.set(key, value),
  removeItem: (key) => disk.delete(key),
};
globalThis.location = { href: 'https://github.com/' };

const META = {
  'meta[name="user-login"]': 'alice',
  'meta[name="octolytics-dimension-repository_nwo"]': 'o/r',
  'meta[name="octolytics-dimension-repository_default_branch"]': 'main',
};
globalThis.document = {
  querySelector: (selector) => (
    selector in META
      ? { getAttribute: (name) => (name === 'content' ? META[selector] : null) }
      : null
  ),
};

beforeEach(() => { disk = new Map(); });

const files = await import('../src/features/commandPalette/files.js');
const {
  treeKey, normalizeTree, fileCandidates, ensureTree,
} = files;
const { clearDataCache, readPaletteState } = await import('../src/features/commandPalette/store.js');

test('normalizeTree drops commits and empty paths', () => {
  const { items, truncated } = normalizeTree({
    truncated: true,
    tree: [
      { path: 'src', type: 'tree' },
      { path: 'src/main.js', type: 'blob', size: 120 },
      { path: '', type: 'blob' },
      { path: 'sub', type: 'commit', sha: 'x' },
    ],
  });
  assert.deepEqual(items.map((item) => item.path), ['src', 'src/main.js']);
  assert.equal(items[1].size, 120);
  assert.equal(truncated, true);
});

test('fileCandidates build blob and tree rows for the current ref', () => {
  const state = {
    context: { repo: 'o/r', ref: 'main' },
    settings: { sources: { files: true } },
    cache: { trees: { [treeKey('o/r', 'main')]: { items: [
      { path: 'src', type: 'tree' },
      { path: 'src/main.js', type: 'blob', size: 2929 },
    ] } } },
  };
  const candidates = fileCandidates(state);
  assert.equal(candidates[0].key, 'file:o/r@main:src');
  assert.equal(candidates[0].title, 'src/');
  assert.equal(candidates[0].data.url, 'https://github.com/o/r/tree/main/src');
  assert.equal(candidates[1].title, 'main.js');
  assert.equal(candidates[1].titleMuted, 'src /');
  assert.equal(candidates[1].meta, '2.86 KB');
  assert.equal(candidates[1].data.url, 'https://github.com/o/r/blob/main/src/main.js');
});

test('fileCandidates honor the files switch and a missing tree', () => {
  const state = {
    context: { repo: 'o/r', ref: 'main' },
    settings: { sources: { files: false } },
    cache: { trees: {} },
  };
  assert.deepEqual(fileCandidates(state), []);
  state.settings.sources.files = true;
  assert.deepEqual(fileCandidates(state), []);
});

test('clearing the cache also drops the trees held for the session', async () => {
  globalThis.GM_xmlhttpRequest = (options) => options.onload({
    status: 200,
    responseText: JSON.stringify({ truncated: false, tree: [{ path: 'a.js', type: 'blob', size: 10 }] }),
    responseHeaders: '',
  });
  await ensureTree();
  assert.equal(fileCandidates(readPaletteState()).length, 1);
  clearDataCache();
  files.forgetTrees();
  assert.deepEqual(fileCandidates(readPaletteState()), []);
  delete globalThis.GM_xmlhttpRequest;
});

test('ensureTree caches a successful load and reports truncation', async () => {
  globalThis.GM_xmlhttpRequest = (options) => options.onload({
    status: 200,
    responseText: JSON.stringify({
      truncated: true,
      tree: [{ path: 'a.js', type: 'blob', size: 10 }],
    }),
    responseHeaders: 'ETag: "tree-1"\r\n',
  });
  const first = await ensureTree();
  assert.equal(first.status, 'updated');
  assert.equal(first.truncated, true);
  const second = await ensureTree();
  assert.equal(second.status, 'cached');
  delete globalThis.GM_xmlhttpRequest;
});
