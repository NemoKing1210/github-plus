import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

/** The menu listener and the folder tree install once per process, so the document is shared. */
let dom = null;

function installDom() {
  if (dom) return dom.window.document;
  dom = new JSDOM(
    `<!doctype html><html><body>
      <button data-testid="anchor-button">main</button>
      <div data-testid="directory-content">
        <table>
          <thead><tr><th>Name</th><th>Name</th><th>Last commit message</th><th>Last commit date</th></tr></thead>
          <tbody>
            <tr class="react-directory-row">
              <td class="react-directory-filename-column">
                <svg class="octicon octicon-file-directory-fill"></svg>
                <a href="/o/r/tree/main/src" aria-label="src, (Directory)" data-case="folder">src</a>
              </td>
              <td class="react-directory-row-commit-cell"></td>
              <td><div class="react-directory-commit-age"></div></td>
            </tr>
            <tr class="react-directory-row">
              <td class="react-directory-filename-column">
                <svg class="octicon octicon-file"></svg>
                <a href="/o/r/blob/main/a.js" data-case="file">a.js</a>
              </td>
              <td class="react-directory-row-commit-cell"></td>
              <td><div class="react-directory-commit-age"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="markdown-body"><a href="/o/r/tree/main/docs" data-case="markdown-folder">docs</a></div>
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
  return dom.window.document;
}

function installFetch() {
  globalThis.fetch = async (url) => {
    const address = String(url);
    if (address.includes('tree-commit-info')) {
      return { ok: true, status: 200, json: async () => ({ entries: {} }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        payload: {
          codeViewTreeRoute: {
            path: 'src',
            tree: {
              items: [
                { name: 'utils', path: 'src/utils', contentType: 'directory' },
                { name: 'index.js', path: 'src/index.js', contentType: 'file' },
              ],
              totalCount: 2,
            },
          },
        },
      }),
    };
  };
}

function contextMenu(target) {
  const event = new window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    button: 2,
    clientX: 24,
    clientY: 24,
  });
  target.dispatchEvent(event);
  return event;
}

function menuLabels() {
  const nodes = document.querySelectorAll('#gp-context-menu .gp-context-menu__label');
  const labels = [];
  for (let index = 0; index < nodes.length; index += 1) labels.push(nodes[index].textContent);
  return labels;
}

function selectMenuLabel(label) {
  const nodes = document.querySelectorAll('#gp-context-menu .gp-context-menu__label');
  for (let index = 0; index < nodes.length; index += 1) {
    if (nodes[index].textContent === label) {
      nodes[index].closest('button').click();
      return;
    }
  }
  assert.fail(`no "${label}" menu item`);
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

test('the folder menu expands and collapses a listing row', async () => {
  const document = installDom();
  const { clearFolderCache } = await import('../src/features/folderTree/api.js');
  clearFolderCache();
  const { applyFolderTreeSettings } = await import('../src/features/folderTree/index.js');
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  installFetch();
  applyFolderTreeSettings();
  applyFileMenuSettings();

  contextMenu(document.querySelector('[data-case="folder"]'));
  assert.deepEqual(menuLabels(), [
    'Open',
    'Open in new tab',
    'Expand',
    'Copy link',
    'Copy path',
    'Copy name',
  ]);
  selectMenuLabel('Expand');
  assert.ok(await waitFor(() => document.querySelectorAll('.gp-tree-row').length === 2));

  contextMenu(document.querySelector('[data-case="folder"]'));
  assert.deepEqual(menuLabels(), [
    'Open',
    'Open in new tab',
    'Collapse',
    'Copy link',
    'Copy path',
    'Copy name',
  ]);
  selectMenuLabel('Collapse');
  assert.equal(document.querySelectorAll('.gp-tree-row').length, 0);
  closeContextMenu();
});

test('a file row and a markdown folder link offer no disclosure', async () => {
  const document = installDom();
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  applyFileMenuSettings();

  contextMenu(document.querySelector('[data-case="file"]'));
  assert.ok(!menuLabels().includes('Expand'));
  closeContextMenu();

  contextMenu(document.querySelector('[data-case="markdown-folder"]'));
  assert.ok(!menuLabels().includes('Expand'));
  closeContextMenu();
});

test('no disclosure is offered while the folder tree is off', async () => {
  const document = installDom();
  const { applyFolderTreeSettings } = await import('../src/features/folderTree/index.js');
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { saveSettings } = await import('../src/core/settings.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  applyFileMenuSettings();

  saveSettings({ folderTree: { enabled: false } });
  applyFolderTreeSettings();

  contextMenu(document.querySelector('[data-case="folder"]'));
  assert.ok(!menuLabels().includes('Expand'));
  closeContextMenu();

  saveSettings({ folderTree: { enabled: true } });
  applyFolderTreeSettings();
});
