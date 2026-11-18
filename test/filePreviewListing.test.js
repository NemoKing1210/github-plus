import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

function installDom() {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div data-testid="directory-content">
        <table>
          <thead><tr><th>Name</th><th>Last commit</th></tr></thead>
          <tbody>
            <tr class="react-directory-row">
              <td><a href="/o/r/tree/main/src">src</a></td><td>2 days ago</td>
            </tr>
            <tr class="react-directory-row">
              <td><a href="/o/r/blob/main/a.js">a.js</a></td><td>yesterday</td>
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

test('every listing row gets the preview column, folders with an empty cell', async () => {
  installDom();
  const { applyFilePreviewSettings } = await import('../src/features/filePreview/index.js');
  applyFilePreviewSettings();
  const rows = document.querySelectorAll('tr.react-directory-row');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].querySelectorAll('.gp-file-preview-cell').length, 1);
  assert.equal(rows[0].querySelector('.gp-file-preview-btn'), null);
  assert.equal(rows[1].querySelectorAll('.gp-file-preview-cell').length, 1);
  assert.ok(rows[1].querySelector('.gp-file-preview-btn'));
  assert.ok(document.querySelector('.gp-file-preview-head'));
});

test('the preview column leaves a gap at the table edge', async () => {
  const css = await readFile(new URL('../src/styles/app.css', import.meta.url), 'utf8');
  const start = css.indexOf('.gp-file-preview-cell,');
  assert.notEqual(start, -1, 'the preview column rule is missing');
  const block = css.slice(start, css.indexOf('}', start));
  // `!important` is required: GitHub's own row-cell rules zero the padding of
  // a plain `td`, which pulled the button back to the table edge.
  const right = Number(/padding-right:\s*(\d+)px\s*!important/.exec(block)?.[1] || 0);
  assert.ok(right >= 12, `the button sits ${right}px from the edge`);
});

test('the preview set stays inside the expanded folder that owns the row', async () => {
  installDom();
  document.querySelector('[data-testid="directory-content"] tbody').innerHTML = `
    <tr class="react-directory-row" id="root">
      <td><a href="/o/r/blob/main/root.js">root.js</a></td>
    </tr>
    <tr class="react-directory-row gp-tree-row" data-gp-tree-owner="/o/r/tree/main/a">
      <td><a href="/o/r/blob/main/a/one.js">one.js</a></td>
    </tr>
    <tr class="react-directory-row gp-tree-row" data-gp-tree-owner="/o/r/tree/main/a">
      <td><a href="/o/r/blob/main/a/two.js">two.js</a></td>
    </tr>
    <tr class="react-directory-row gp-tree-row" data-gp-tree-owner="/o/r/tree/main/b">
      <td><a href="/o/r/blob/main/b/other.js">other.js</a></td>
    </tr>`;
  const { siblingsForRow } = await import('../src/features/filePreview/surfaces.js');
  const nested = document.querySelector('[data-gp-tree-owner="/o/r/tree/main/a"]');

  const set = siblingsForRow(nested);
  assert.deepEqual(set.files.map((file) => file.name), ['one.js', 'two.js']);
  assert.equal(set.index, 0);

  const root = document.getElementById('root');
  const top = siblingsForRow(root);
  assert.deepEqual(top.files.map((file) => file.name), ['root.js']);
  assert.equal(top.index, 0);
});
