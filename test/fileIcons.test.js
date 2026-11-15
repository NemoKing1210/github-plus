import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function installDom() {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="repos-file-tree">
        <ul role="tree">
          <li role="treeitem" aria-expanded="false" id="test-item">
            <div class="PRIVATE_TreeView-item-container">
              <div class="PRIVATE_TreeView-item-toggle">
                <svg class="octicon octicon-chevron-right"></svg>
              </div>
              <div class="PRIVATE_TreeView-item-content">
                <div class="PRIVATE_TreeView-item-visual">
                  <div class="PRIVATE_TreeView-directory-icon">
                    <svg class="octicon octicon-file-directory-fill"></svg>
                  </div>
                </div>
                <span class="PRIVATE_TreeView-item-content-text"><span>test</span></span>
              </div>
            </div>
          </li>
          <li role="treeitem" id="age.test.js-item">
            <div class="PRIVATE_TreeView-item-container">
              <div class="PRIVATE_TreeView-item-content">
                <div class="PRIVATE_TreeView-item-visual">
                  <svg class="octicon octicon-file"></svg>
                </div>
                <span class="PRIVATE_TreeView-item-content-text"><span>age.test.js</span></span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </body></html>`,
    { pretendToBeVisual: true, url: 'https://github.com/o/r/tree/main' },
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

function nativeIcon(row) {
  return row.querySelector('.PRIVATE_TreeView-item-visual svg.octicon');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('a folder row gains one icon and hides the native glyph', async () => {
  installDom();
  const { applyFileIconsSettings } = await import('../src/features/fileIcons/index.js');
  applyFileIconsSettings();
  const folder = document.getElementById('test-item');
  assert.equal(folder.querySelectorAll('svg.gp-fi').length, 1);
  assert.ok(nativeIcon(folder).classList.contains('gp-fi-native'));
  assert.equal(nativeIcon(folder).style.getPropertyValue('display'), 'none');
});

test('a native glyph React swaps in after expanding a folder is hidden again', async () => {
  installDom();
  const { applyFileIconsSettings } = await import('../src/features/fileIcons/index.js');
  applyFileIconsSettings();
  const folder = document.getElementById('test-item');
  const native = nativeIcon(folder);

  // GitHub re-renders the row's glyph when a folder opens: the old native svg
  // is replaced by a new, visible one while the injected icon stays in place.
  const replaced = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  replaced.setAttribute('class', 'octicon octicon-file-directory-open-fill');
  native.parentNode.replaceChild(replaced, native);
  folder.setAttribute('aria-expanded', 'true');
  await wait(250);

  assert.equal(folder.querySelectorAll('svg.gp-fi').length, 1);
  assert.ok(replaced.classList.contains('gp-fi-native'));
  assert.equal(replaced.style.getPropertyValue('display'), 'none');
});
