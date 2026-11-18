import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

/**
 * The file menu's listener is document-wide and only installed once per
 * process, so every case shares one document.
 */
let dom = null;
let clipboard = '';

function setup() {
  if (dom) return dom.window.document;
  dom = new JSDOM(
    `<!doctype html><html><body>
      <button data-testid="anchor-button">main</button>
      <div data-testid="directory-content">
        <table><tbody>
          <tr class="react-directory-row">
            <td class="react-directory-filename-column">
              <a href="/o/r/tree/main/src" data-case="folder">src</a>
            </td>
          </tr>
          <tr class="react-directory-row">
            <td class="react-directory-filename-column">
              <a href="/o/r/tree/main/vendor" aria-label="vendor, (Submodule)" data-case="submodule">vendor</a>
            </td>
          </tr>
          <tr class="react-directory-row">
            <td class="react-directory-filename-column">
              <a href="/o/r/blob/main/a.js" data-case="file">a.js</a>
            </td>
          </tr>
        </tbody></table>
      </div>
      <div id="repos-file-tree">
        <ul>
          <li role="treeitem" aria-expanded="false" id="docs-item">
            <div class="PRIVATE_TreeView-item-content-text" data-case="tree-folder">docs</div>
          </li>
        </ul>
      </div>
      <div class="markdown-body">
        <p><a href="/o/r/tree/main/guide" data-case="markdown-folder">guide</a></p>
      </div>
    </body></html>`,
    { pretendToBeVisual: true, url: 'https://github.com/o/r/tree/main' },
  );
  dom.window.scrollTo = () => {};
  const clipboardStub = {
    writeText: async (text) => {
      clipboard = text;
    },
  };
  Object.defineProperty(dom.window.navigator, 'clipboard', {
    configurable: true,
    value: clipboardStub,
  });
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: clipboardStub,
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.location = dom.window.location;
  globalThis.localStorage = dom.window.localStorage;
  return dom.window.document;
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('a folder row opens the folder menu, which has no file-only actions', async () => {
  const document = setup();
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  applyFileMenuSettings();

  const event = contextMenu(document.querySelector('[data-case="folder"]'));
  assert.equal(event.defaultPrevented, true);
  const menu = document.getElementById('gp-context-menu');
  assert.ok(menu);
  assert.equal(menu.getAttribute('aria-label'), 'Actions for src');
  assert.deepEqual(menuLabels(), [
    'Open',
    'Open in new tab',
    'Copy link',
    'Copy path',
    'Copy name',
  ]);
  closeContextMenu();
});

test('copying a folder name writes the folder name to the clipboard', async () => {
  const document = setup();
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  applyFileMenuSettings();

  clipboard = '';
  contextMenu(document.querySelector('[data-case="folder"]'));
  const labels = document.querySelectorAll('#gp-context-menu .gp-context-menu__label');
  labels[labels.length - 1].closest('button').click();
  await wait(10);
  assert.equal(clipboard, 'src');
});

test('a submodule row keeps the browser menu', async () => {
  const document = setup();
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  applyFileMenuSettings();

  const event = contextMenu(document.querySelector('[data-case="submodule"]'));
  assert.equal(event.defaultPrevented, false);
  assert.equal(document.getElementById('gp-context-menu'), null);
  closeContextMenu();
});

test('a file row still offers the file actions and copy name', async () => {
  const document = setup();
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  applyFileMenuSettings();

  const event = contextMenu(document.querySelector('[data-case="file"]'));
  assert.equal(event.defaultPrevented, true);
  const labels = menuLabels();
  assert.ok(labels.includes('Download'));
  assert.ok(labels.includes('Copy contents'));
  assert.equal(labels[labels.length - 1], 'Copy name');
  closeContextMenu();
});

test('a folder of the sidebar file tree opens the folder menu', async () => {
  const document = setup();
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  applyFileMenuSettings();

  const event = contextMenu(document.querySelector('[data-case="tree-folder"]'));
  assert.equal(event.defaultPrevented, true);
  assert.equal(
    document.getElementById('gp-context-menu').getAttribute('aria-label'),
    'Actions for docs',
  );
  assert.ok(menuLabels().includes('Copy name'));
  closeContextMenu();
});

test('a folder link in rendered markdown opens the folder menu', async () => {
  const document = setup();
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  applyFileMenuSettings();

  const event = contextMenu(document.querySelector('[data-case="markdown-folder"]'));
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(menuLabels(), [
    'Open',
    'Open in new tab',
    'Copy link',
    'Copy path',
    'Copy name',
  ]);
  closeContextMenu();
});
