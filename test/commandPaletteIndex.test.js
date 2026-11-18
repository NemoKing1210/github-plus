import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><head>
  <meta name="user-login" content="alice">
  <meta name="octolytics-dimension-repository_default_branch" content="main">
</head><body></body></html>`, { url: 'https://github.com/alice/repo', pretendToBeVisual: true });

for (const key of [
  'window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'KeyboardEvent', 'MouseEvent',
]) {
  globalThis[key] = dom.window[key];
}
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;
dom.window.Element.prototype.scrollIntoView = () => {};
dom.window.scrollTo = () => {};

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, value),
  removeItem: (key) => store.delete(key),
};

let repoPayload = [
  { full_name: 'alice/repo', owner: { login: 'alice', type: 'User' }, name: 'repo' },
  { full_name: 'alice/other', owner: { login: 'alice', type: 'User' }, name: 'other' },
  { full_name: 'alice/broken', owner: { login: 'alice', type: 'User' }, name: 'broken' },
  { full_name: 'alice/leaky', owner: { login: 'alice', type: 'User' }, name: 'leaky' },
];

let issuePayload = [
  { number: 3, title: 'Broken build', html_url: 'https://github.com/alice/repo/issues/3', user: { login: 'ann' }, updated_at: '2026-11-01T00:00:00Z' },
];

globalThis.GM_xmlhttpRequest = (options) => {
  if (options.url.includes('/issues')) {
    options.onload({ status: 200, responseText: JSON.stringify(issuePayload), responseHeaders: '' });
    return;
  }
  if (options.url.includes('/starred')) {
    options.onload({ status: 200, responseText: '[]', responseHeaders: '' });
    return;
  }
  if (options.url.includes('/git/trees/')) {
    options.onload({
      status: 200,
      responseText: JSON.stringify({
        truncated: true,
        tree: [{ path: 'a.js', type: 'blob', size: 10 }],
      }),
      responseHeaders: '',
    });
    return;
  }
  options.onload({
    status: 200,
    responseText: JSON.stringify(repoPayload),
    responseHeaders: '',
  });
};

const palette = await import('../src/features/commandPalette/index.js');
const shell = await import('../src/ui/commandPalette.js');
const { writeCacheRecord } = await import('../src/features/commandPalette/store.js');
const { t } = await import('../src/i18n/index.js');

afterEach(() => {
  shell.closeCommandPalette();
});

test('a cold open starts at the page repository with its pages and files', async () => {
  palette.openPalette();
  await new Promise((resolve) => setTimeout(resolve, 60));

  const overlay = latestPalette();
  assert.deepEqual(
    [...overlay.querySelectorAll('.gp-command__seg')].map((node) => node.textContent),
    ['alice', 'repo'],
  );
  assert.ok(overlay.querySelector('.gp-command__row[data-key="cmd:repo.home"]'), 'repository page row');
  assert.ok(overlay.querySelector('.gp-command__row[data-key="cmd:repo.issues"]'), 'repository pages');
  assert.equal(overlay.querySelector('.gp-command__tip-note').textContent, t('palette.status.incomplete'));

  const input = overlay.querySelector('.gp-command__input');
  input.value = '/a';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.ok(overlay.querySelector('.gp-command__row[data-key="file:alice/repo@main:a.js"]'));
});

test('the palette never opens over another GitHub Plus overlay', () => {
  shell.closeCommandPalette();
  const panel = document.createElement('div');
  panel.className = 'gp-panel-overlay';
  document.body.appendChild(panel);
  palette.openPalette();
  assert.equal(shell.isCommandPaletteOpen(), false);
  panel.remove();
});

test('an empty cached issue list produces no rows and no failure note', async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  writeCacheRecord({
    version: 1, login: 'alice', tokenLogin: null, tokenFingerprint: '', sources: {}, trees: {}, rateLimit: null,
    issues: { 'alice/repo': { etag: '"i"', items: [], fetchedAt: Date.now() } },
  });
  palette.openPalette();
  assert.equal(document.querySelectorAll('.gp-command__row[data-key^="issue:"]').length, 0);
  await new Promise((resolve) => setTimeout(resolve, 30));
  // This fixture's tree is truncated, so the incomplete note is real; only a
  // failed load may add one of the failure notes.
  const note = document.querySelector('.gp-command__tip-note')?.textContent || '';
  for (const key of ['palette.status.offline', 'palette.status.rateLimited', 'palette.status.invalidToken']) {
    assert.notEqual(note, t(key));
  }
  shell.closeCommandPalette();
});

test('the issues prefix lists the cached repository issues', async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  writeCacheRecord({
    version: 1, login: 'alice', tokenLogin: null, tokenFingerprint: '', sources: {}, trees: {}, rateLimit: null,
    issues: { 'alice/repo': { etag: '"i"', items: [{ number: 3, title: 'Broken build', url: 'https://github.com/alice/repo/issues/3', author: 'ann', updatedAt: '2026-11-01T00:00:00Z', kindLabel: 'issue', repo: 'alice/repo' }], fetchedAt: Date.now() } },
  });
  palette.openPalette();
  const overlay = latestPalette();
  const input = overlay.querySelector('.gp-command__input');
  input.value = '#3';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.match(overlay.querySelector('.gp-command__list').textContent, /#3 Broken build/);
  shell.closeCommandPalette();
});

function latestPalette() {
  return [...document.querySelectorAll('.gp-command-overlay')].at(-1);
}

function cacheRepos(items) {
  writeCacheRecord({
    version: 1, login: 'alice', tokenLogin: null, tokenFingerprint: '',
    sources: { repos: { pages: [{ items }], fetchedAt: Date.now() } },
    trees: {}, issues: {}, rateLimit: null,
  });
}

test('Ctrl+Backspace leaves the page repository and Tab drills into another', async () => {
  cacheRepos(repoPayload);
  palette.openPalette();
  await new Promise((resolve) => setTimeout(resolve, 30));
  const overlay = latestPalette();
  const input = overlay.querySelector('.gp-command__input');
  assert.equal(overlay.querySelectorAll('.gp-command__seg').length, 2);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', ctrlKey: true, bubbles: true }));
  assert.equal(overlay.querySelectorAll('.gp-command__seg').length, 0);
  input.value = 'other';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 120));
  const row = overlay.querySelector('.gp-command__row[data-key="repo:alice/other"]');
  assert.ok(row, 'repository row is listed');
  row.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  assert.deepEqual(
    [...overlay.querySelectorAll('.gp-command__seg')].map((node) => node.textContent),
    ['alice', 'other'],
  );
  assert.equal(input.value, '');
  assert.match(overlay.querySelector('.gp-command__tip-text').textContent, /alice\/other/);
  await new Promise((resolve) => setTimeout(resolve, 60));
  input.value = '/a';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 120));
  const fileRow = [...overlay.querySelectorAll('.gp-command__row')]
    .find((node) => node.dataset.key?.startsWith('file:alice/other@HEAD:'));
  assert.ok(fileRow, 'scoped tree rows use HEAD');
  shell.closeCommandPalette();
});

test('a failed scoped tree keeps the palette open with a note', async () => {
  cacheRepos(repoPayload);
  const original = globalThis.GM_xmlhttpRequest;
  const requested = [];
  globalThis.GM_xmlhttpRequest = (options) => {
    requested.push(options.url);
    if (options.url.includes('/git/trees/')) {
      options.onload({ status: 500, responseText: '{}', responseHeaders: '' });
      return;
    }
    original(options);
  };
  try {
    palette.openPalette();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const overlay = latestPalette();
    const input = overlay.querySelector('.gp-command__input');
    input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', ctrlKey: true, bubbles: true }));
    input.value = 'broken';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 120));
    const row = overlay.querySelector('.gp-command__row[data-key="repo:alice/broken"]');
    assert.ok(row, 'repository row is listed');
    row.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true }));
    input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.ok(requested.some((url) => url.includes('/repos/alice/broken/git/trees/HEAD')));
    assert.equal(shell.isCommandPaletteOpen(), true);
    assert.notEqual(overlay.querySelector('.gp-command__tip-note').textContent, '');
  } finally {
    globalThis.GM_xmlhttpRequest = original;
    shell.closeCommandPalette();
  }
});

test('leaving a failed scope clears its note', async () => {
  cacheRepos(repoPayload);
  const original = globalThis.GM_xmlhttpRequest;
  globalThis.GM_xmlhttpRequest = (options) => {
    if (options.url.includes('/git/trees/')) {
      options.onload({ status: 500, responseText: '{}', responseHeaders: '' });
      return;
    }
    original(options);
  };
  try {
    palette.openPalette();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const overlay = latestPalette();
    const input = overlay.querySelector('.gp-command__input');
    input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', ctrlKey: true, bubbles: true }));
    input.value = 'leaky';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 120));
    const row = overlay.querySelector('.gp-command__row[data-key="repo:alice/leaky"]');
    assert.ok(row, 'repository row is listed');
    row.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true }));
    input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.notEqual(overlay.querySelector('.gp-command__tip-note').textContent, '');
    input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(overlay.querySelectorAll('.gp-command__seg').length, 0);
    assert.equal(overlay.querySelector('.gp-command__tip-note').textContent, '');
  } finally {
    globalThis.GM_xmlhttpRequest = original;
    shell.closeCommandPalette();
  }
});

test('a folder row becomes the next path level and leaves it again', async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const files = await import('../src/features/commandPalette/files.js');
  files.forgetTrees();
  writeCacheRecord({
    version: 1,
    login: 'alice',
    tokenLogin: null,
    tokenFingerprint: '',
    sources: { repos: { pages: [{ items: repoPayload }], fetchedAt: Date.now() } },
    trees: {
      [files.treeKey('alice/repo', 'main')]: {
        items: [
          { path: 'src', type: 'tree', size: 0 },
          { path: 'src/x.js', type: 'blob', size: 10 },
          { path: 'src/deep', type: 'tree', size: 0 },
          { path: 'src/deep/y.js', type: 'blob', size: 20 },
          { path: 'test/z.js', type: 'blob', size: 30 },
        ],
        fetchedAt: Date.now(),
      },
    },
    issues: {},
    rateLimit: null,
  });
  palette.openPalette();
  const overlay = latestPalette();
  const input = overlay.querySelector('.gp-command__input');
  const segments = () => [...overlay.querySelectorAll('.gp-command__seg')].map((node) => node.textContent);
  const type = async (value) => {
    input.value = value;
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 120));
  };

  await type('/src');
  const folder = overlay.querySelector('.gp-command__row[data-key="file:alice/repo@main:src"]');
  assert.ok(folder, 'folder row is listed');
  folder.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  assert.deepEqual(segments(), ['alice', 'repo', 'src']);
  const inside = [...overlay.querySelectorAll('.gp-command__row')].map((node) => node.dataset.key);
  assert.ok(inside.includes('file:alice/repo@main:src/x.js'), 'a folder level lists its files');
  assert.equal(inside.includes('file:alice/repo@main:test/z.js'), false);

  await type('/');
  const keys = [...overlay.querySelectorAll('.gp-command__row')].map((node) => node.dataset.key);
  assert.ok(keys.includes('file:alice/repo@main:src/x.js'));
  assert.ok(keys.includes('file:alice/repo@main:src/deep/y.js'));
  assert.equal(keys.includes('file:alice/repo@main:test/z.js'), false);

  await type('');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
  assert.deepEqual(segments(), ['alice', 'repo']);

  await type('/src');
  const again = overlay.querySelector('.gp-command__row[data-key="file:alice/repo@main:src"]');
  again.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  assert.deepEqual(segments(), ['alice', 'repo', 'src']);

  overlay.querySelectorAll('.gp-command__seg')[1]
    .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(segments(), ['alice', 'repo']);
  assert.equal(input.value, '');

  overlay.querySelectorAll('.gp-command__seg')[0]
    .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(segments(), []);
  shell.closeCommandPalette();
});

test('Tab on the Issues row opens that list as a level and Backspace returns', async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  writeCacheRecord({
    version: 1,
    login: 'alice',
    tokenLogin: null,
    tokenFingerprint: '',
    sources: { repos: { pages: [{ items: repoPayload }], fetchedAt: Date.now() } },
    trees: {},
    rateLimit: null,
    issues: {
      'alice/repo': {
        etag: '"i"',
        fetchedAt: Date.now(),
        items: [
          { number: 3, title: 'Broken build', url: 'https://github.com/alice/repo/issues/3', author: 'ann', updatedAt: '2026-11-01T00:00:00Z', kindLabel: 'issue', repo: 'alice/repo' },
          { number: 4, title: 'Faster build', url: 'https://github.com/alice/repo/pull/4', author: 'bob', updatedAt: '2026-11-02T00:00:00Z', kindLabel: 'pullRequest', repo: 'alice/repo' },
        ],
      },
    },
  });
  palette.openPalette();
  const overlay = latestPalette();
  const input = overlay.querySelector('.gp-command__input');
  const segments = () => [...overlay.querySelectorAll('.gp-command__seg')].map((node) => node.textContent);
  const keys = () => [...overlay.querySelectorAll('.gp-command__row')].map((node) => node.dataset.key);

  const row = overlay.querySelector('.gp-command__row[data-key="cmd:repo.issues"]');
  assert.ok(row, 'the Issues page row is listed');
  row.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  assert.deepEqual(segments(), ['alice', 'repo', t('palette.cmd.issues')]);
  // Only open issues: the repository row and its pull request stay out.
  assert.deepEqual(keys(), ['issue:alice/repo#3']);
  assert.equal(input.value, '');

  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
  assert.deepEqual(segments(), ['alice', 'repo']);
  assert.ok(keys().includes('cmd:repo.pulls'));
  shell.closeCommandPalette();
});

test('a pinned repository snapshot keeps its scope action before repositories load', async () => {
  const { COMMAND_PALETTE_PINS_KEY } = await import('../src/core/constants.js');
  writeCacheRecord({
    version: 1, login: 'alice', tokenLogin: null, tokenFingerprint: '',
    sources: {}, trees: {}, issues: {}, rateLimit: null,
  });
  localStorage.setItem(COMMAND_PALETTE_PINS_KEY, JSON.stringify({
    version: 1,
    identity: 'alice',
    items: [{
      key: 'repo:alice/other',
      kind: 'repo',
      at: Date.now(),
      snapshot: {
        kind: 'repo',
        title: 'other',
        titleMuted: 'alice /',
        groupId: 'repos',
        groupTitle: 'Repositories',
        data: { fullName: 'alice/other', name: 'other', owner: 'alice' },
      },
    }],
  }));
  try {
    palette.openPalette();
    const overlay = latestPalette();
    const row = overlay.querySelector('.gp-command__row[data-key="repo:alice/other"]');
    assert.ok(row, 'the pinned snapshot is listed while repositories are cold');
    assert.match(row.querySelector('.gp-command__hint').textContent, /^Tab /);
    row.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true }));
    overlay.querySelector('.gp-command__input')
      .dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    assert.deepEqual(
      [...overlay.querySelectorAll('.gp-command__seg')].map((node) => node.textContent),
      ['alice', 'other'],
    );
  } finally {
    localStorage.removeItem(COMMAND_PALETTE_PINS_KEY);
    shell.closeCommandPalette();
  }
});
