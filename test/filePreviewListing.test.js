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
  const right = Number(/padding-right:\s*(\d+)px/.exec(block)?.[1] || 0);
  assert.ok(right >= 8, `the button sits ${right}px from the edge`);
});
