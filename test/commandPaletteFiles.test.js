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

test('file rows can be built for an explicit repository and HEAD', () => {
  const state = {
    context: { repo: 'o/page', ref: 'main' },
    settings: { sources: { files: true } },
    cache: { trees: { [treeKey('o/other', 'HEAD')]: { items: [
      { path: 'src/x.js', type: 'blob', size: 12 },
    ] } } },
  };
  const rows = fileCandidates(state, { repo: 'o/other', ref: 'HEAD' });
  assert.equal(rows[0].key, 'file:o/other@HEAD:src/x.js');
  assert.equal(rows[0].data.url, 'https://github.com/o/other/blob/HEAD/src/x.js');
});

test('ensureTree loads an explicit repository at HEAD', async () => {
  const urls = [];
  globalThis.GM_xmlhttpRequest = (options) => {
    urls.push(options.url);
    options.onload({
      status: 200,
      responseText: JSON.stringify({ truncated: false, tree: [{ path: 'a.js', type: 'blob', size: 10 }] }),
      responseHeaders: '',
    });
  };
  const result = await ensureTree({ repo: 'o/other', ref: 'HEAD' });
  assert.equal(result.status, 'updated');
  assert.ok(urls.some((url) => url.includes('/repos/o/other/git/trees/HEAD')));
  delete globalThis.GM_xmlhttpRequest;
  files.forgetTrees();
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

test('fileCandidates narrow to a directory and keep the path relative to it', () => {
  const state = {
    context: { repo: 'o/r', ref: 'main' },
    settings: { sources: { files: true } },
    cache: { trees: { [treeKey('o/r', 'main')]: { items: [
      { path: 'src', type: 'tree' },
      { path: 'src/x.js', type: 'blob', size: 12 },
      { path: 'src/deep', type: 'tree' },
      { path: 'src/deep/y.js', type: 'blob', size: 24 },
      { path: 'test/z.js', type: 'blob', size: 36 },
    ] } } },
  };
  const rows = fileCandidates(state, { repo: 'o/r', ref: 'main', dir: 'src' });
  assert.deepEqual(rows.map((row) => row.data.path), ['src/deep', 'src/deep/y.js', 'src/x.js']);
  const x = rows.find((row) => row.data.path === 'src/x.js');
  const y = rows.find((row) => row.data.path === 'src/deep/y.js');
  const folder = rows.find((row) => row.data.path === 'src/deep');
  assert.equal(x.titleMuted, '');
  assert.equal(y.titleMuted, 'deep /');
  assert.equal(folder.scopeable, true);
  assert.equal(folder.title, 'deep/');
  assert.equal(rows.some((row) => row.data.path === 'test/z.js'), false);
});

test('hasFileItems reports a loaded tree without building rows', () => {
  const state = {
    context: { repo: 'o/r', ref: 'main' },
    settings: { sources: { files: true } },
    cache: { trees: { [treeKey('o/r', 'main')]: { items: [{ path: 'a.js', type: 'blob', size: 1 }] } } },
  };
  assert.equal(files.hasFileItems(state), true);
  state.cache.trees[treeKey('o/r', 'main')].items = [];
  assert.equal(files.hasFileItems(state), false);
});

test('a forced ensureTree does not join an in-flight non-forced load', async () => {
  const pending = [];
  globalThis.GM_xmlhttpRequest = (options) => pending.push(options);
  const first = ensureTree({ repo: 'o/force', ref: 'HEAD' });
  const second = ensureTree({ repo: 'o/force', ref: 'HEAD', force: true });
  await Promise.resolve();
  assert.equal(pending.length, 2);
  for (const request of pending) {
    request.onload({
      status: 200,
      responseText: JSON.stringify({ truncated: false, tree: [{ path: 'a.js', type: 'blob', size: 10 }] }),
      responseHeaders: '',
    });
  }
  const [one, two] = await Promise.all([first, second]);
  assert.equal(one.status, 'updated');
  assert.equal(two.status, 'updated');
  delete globalThis.GM_xmlhttpRequest;
});

test('a cleared cache discards an in-flight tree instead of writing it back', async () => {
  const pending = [];
  globalThis.GM_xmlhttpRequest = (options) => pending.push(options);
  const loading = ensureTree({ repo: 'o/discard', ref: 'HEAD' });
  files.forgetTrees();
  pending[0].onload({
    status: 200,
    responseText: JSON.stringify({ truncated: false, tree: [{ path: 'a.js', type: 'blob', size: 10 }] }),
    responseHeaders: '',
  });
  const result = await loading;
  assert.equal(result.status, 'discarded');
  const record = readPaletteState().record;
  assert.deepEqual(record?.trees || {}, {});
  delete globalThis.GM_xmlhttpRequest;
});
