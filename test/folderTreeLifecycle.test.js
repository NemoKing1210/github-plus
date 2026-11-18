import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function installDom() {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div data-testid="directory-content">
        <table>
          <thead><tr>
            <th><span class="text-bold">Name</span></th>
            <th><span class="text-bold">Name</span></th>
            <th>Last commit message</th>
            <th>Last commit date</th>
          </tr></thead>
          <tbody>
            <tr class="react-directory-row">
              <td class="react-directory-filename-column">
                <svg class="octicon octicon-file-directory-fill"></svg>
                <a href="/o/r/tree/main/src" aria-label="src, (Directory)">src</a>
              </td>
              <td class="react-directory-row-commit-cell"></td>
              <td><div class="react-directory-commit-age"></div></td>
            </tr>
            <tr class="react-directory-row">
              <td class="react-directory-filename-column">
                <svg class="octicon octicon-file"></svg>
                <a href="/o/r/blob/main/a.js">a.js</a>
              </td>
              <td class="react-directory-row-commit-cell"></td>
              <td><div class="react-directory-commit-age"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </body></html>`,
    { pretendToBeVisual: true, url: 'https://github.com/o/r' },
  );
  dom.window.scrollTo = () => {};
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

async function waitFor(check, timeout = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (check()) return true;
    await wait(20);
  }
  return false;
}

function jsonResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function tree(items, total = items.length) {
  return jsonResponse({
    payload: { codeViewTreeRoute: { path: 'src', tree: { items, totalCount: total } } },
  });
}

function commits(entries) {
  return jsonResponse({ entries });
}

function installFetch(handler) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return handler(String(url), options);
  };
  return calls;
}

function folderRow() {
  return document.querySelector('[data-testid="directory-content"] tbody tr.react-directory-row');
}

function folderToggle() {
  return folderRow().querySelector('.gp-tree-toggle');
}

function click(node) {
  node.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

const childItems = [
  { name: 'utils', path: 'src/utils', contentType: 'directory' },
  { name: 'index.js', path: 'src/index.js', contentType: 'file' },
];

test('a chevron expands a folder into nested rows with dates and commit links', async () => {
  installDom();
  const { clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const { applyFolderTreeSettings } = await import('../src/features/folderTree/index.js');
  const calls = installFetch((url) => {
    if (url.includes('tree-commit-info')) {
      return commits({
        utils: {
          oid: 'c1',
          url: '/o/r/commit/c1',
          date: new Date(Date.now() - 86400000).toISOString(),
          shortMessageHtmlLink: { value: '<a title="Update utils">Update utils</a>' },
        },
      });
    }
    return tree(childItems);
  });
  applyFolderTreeSettings();

  assert.ok(folderRow().querySelector('.gp-tree-slot .gp-tree-toggle'));
  assert.equal(
    document.querySelectorAll('[data-testid="directory-content"] th .gp-tree-head-slot').length,
    2,
  );
  assert.ok(document.querySelector('[data-testid="directory-content"] tbody tr:nth-child(2) .gp-tree-slot'));
  assert.equal(
    document.querySelector('[data-testid="directory-content"] tbody tr:nth-child(2) .gp-tree-toggle'),
    null,
  );

  click(folderToggle());
  assert.ok(await waitFor(() => document.querySelectorAll('.gp-tree-row').length === 2));

  const rows = document.querySelectorAll('.gp-tree-row');
  assert.equal(rows[0].dataset.gpTreeOwner, '/o/r/tree/main/src');
  assert.equal(rows[0].dataset.gpTreeDepth, '1');
  assert.equal(rows[0].querySelector('a').getAttribute('href'), '/o/r/tree/main/src/utils');
  assert.equal(rows[1].querySelector('a').getAttribute('href'), '/o/r/blob/main/src/index.js');
  assert.ok(rows[0].querySelector('.gp-tree-toggle'));
  assert.equal(rows[1].querySelector('.gp-tree-toggle'), null);
  assert.equal(rows[0].querySelector('.gp-tree-commit-link').textContent, 'Update utils');
  assert.ok(rows[0].querySelector('relative-time[datetime]'));

  assert.equal(folderToggle().getAttribute('aria-expanded'), 'true');
  assert.equal(folderRow().dataset.gpTreeExpanded, 'true');
  assert.equal(calls.filter((call) => call.url.includes('tree-commit-info')).length, 1);
  assert.equal(calls.filter((call) => !call.url.includes('tree-commit-info')).length, 1);
});

test('the same chevron collapses every descendant row', async () => {
  installDom();
  const { clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const { applyFolderTreeSettings } = await import('../src/features/folderTree/index.js');
  installFetch(() => tree(childItems));
  applyFolderTreeSettings();

  click(folderToggle());
  assert.ok(await waitFor(() => document.querySelectorAll('.gp-tree-row').length === 2));
  click(folderToggle());
  assert.equal(document.querySelectorAll('.gp-tree-row').length, 0);
  assert.equal(folderToggle().getAttribute('aria-expanded'), 'false');
});

test('a nested folder expands one level deeper', async () => {
  installDom();
  const { clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const { applyFolderTreeSettings } = await import('../src/features/folderTree/index.js');
  installFetch((url) => {
    if (url.includes('/src/utils')) {
      return tree([{ name: 'deep.js', path: 'src/utils/deep.js', contentType: 'file' }]);
    }
    return tree(childItems);
  });
  applyFolderTreeSettings();

  click(folderToggle());
  assert.ok(await waitFor(() => document.querySelectorAll('.gp-tree-row').length === 2));
  const nested = document.querySelector('.gp-tree-row .gp-tree-toggle');
  click(nested);
  assert.ok(await waitFor(() => document.querySelectorAll('.gp-tree-row').length === 3));
  const deep = Array.from(document.querySelectorAll('.gp-tree-row'))
    .find((row) => row.dataset.gpTreeOwner === '/o/r/tree/main/src/utils');
  assert.ok(deep);
  assert.equal(deep.dataset.gpTreeDepth, '2');
  assert.equal(deep.querySelector('a').getAttribute('href'), '/o/r/blob/main/src/utils/deep.js');
});

test('an empty folder renders a note row', async () => {
  installDom();
  const { clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const { applyFolderTreeSettings } = await import('../src/features/folderTree/index.js');
  installFetch(() => tree([]));
  applyFolderTreeSettings();

  click(folderToggle());
  assert.ok(await waitFor(() => !!document.querySelector('.gp-tree-note--empty')));
  const note = folderRow().nextElementSibling;
  assert.ok(note.classList.contains('gp-tree-note-row'));
  assert.equal(note.textContent, 'This folder is empty');
});

test('a failed folder request leaves the row collapsed', async () => {
  installDom();
  const { clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const { applyFolderTreeSettings } = await import('../src/features/folderTree/index.js');
  installFetch(() => jsonResponse({}, 500));
  applyFolderTreeSettings();

  click(folderToggle());
  await wait(200);
  assert.equal(document.querySelectorAll('.gp-tree-row, .gp-tree-note-row').length, 0);
  assert.equal(folderToggle().getAttribute('aria-expanded'), 'false');
  assert.ok(document.querySelector('.gp-toasts')?.textContent.includes('src'));
});

test('rows a React re-render dropped are restored from cache', async () => {
  installDom();
  const { clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const { applyFolderTreeSettings } = await import('../src/features/folderTree/index.js');
  const calls = installFetch(() => tree(childItems));
  applyFolderTreeSettings();

  click(folderToggle());
  assert.ok(await waitFor(() => document.querySelectorAll('.gp-tree-row').length === 2));
  const requests = calls.length;

  document.querySelectorAll('.gp-tree-row').forEach((row) => row.remove());
  assert.ok(await waitFor(() => document.querySelectorAll('.gp-tree-row').length === 2, 3000));
  assert.equal(calls.length, requests);
});

test('disabling the feature removes every injected node', async () => {
  installDom();
  const { clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const { applyFolderTreeSettings } = await import('../src/features/folderTree/index.js');
  const { saveSettings } = await import('../src/core/settings.js');
  installFetch(() => tree(childItems));
  applyFolderTreeSettings();

  click(folderToggle());
  assert.ok(await waitFor(() => document.querySelectorAll('.gp-tree-row').length === 2));

  saveSettings({ folderTree: { enabled: false } });
  applyFolderTreeSettings();
  assert.equal(
    document.querySelectorAll(
      '.gp-tree-row, .gp-tree-note-row, .gp-tree-slot, .gp-tree-head-slot, .gp-tree-toggle',
    ).length,
    0,
  );
  saveSettings({ folderTree: { enabled: true } });
});
