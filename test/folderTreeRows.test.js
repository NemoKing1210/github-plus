import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function installDom(html = '<!doctype html><html><body><div data-testid="directory-content"><table><tbody></tbody></table></div></body></html>') {
  const dom = new JSDOM(html, { url: 'https://github.com/o/r' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  return dom;
}

test('a child address is built from the parent tree address', async () => {
  const { childHref } = await import('../src/features/folderTree/surfaces.js');
  assert.equal(childHref('/o/r/tree/main', 'src', 'folder'), '/o/r/tree/main/src');
  assert.equal(childHref('/o/r/tree/main/src', 'a b.js', 'file'), '/o/r/blob/main/src/a%20b.js');
  assert.equal(childHref('/o/r/tree/feature/x/src', 'lib', 'folder'), '/o/r/tree/feature/x/src/lib');
});

test('a row target reads the folder and file links GitHub renders', async () => {
  installDom();
  const { rowTarget } = await import('../src/features/folderTree/surfaces.js');
  const container = document.querySelector('[data-testid="directory-content"]');
  container.querySelector('tbody').innerHTML = `
    <tr class="react-directory-row">
      <td class="react-directory-filename-column">
        <svg class="octicon octicon-file-directory-fill"></svg>
        <a href="/o/r/tree/main/src" aria-label="src, (Directory)">src</a>
      </td>
    </tr>
    <tr class="react-directory-row">
      <td class="react-directory-filename-column">
        <svg class="octicon octicon-file"></svg>
        <a href="/o/r/blob/main/a.js">a.js</a>
      </td>
    </tr>
    <tr class="react-directory-row">
      <td class="react-directory-filename-column">
        <svg class="octicon octicon-file-submodule"></svg>
        <a href="/o/r/tree/main/vendor" aria-label="vendor, (Submodule)">vendor</a>
      </td>
    </tr>`;

  const rows = container.querySelectorAll('tr');
  const folder = rowTarget(rows[0]);
  assert.equal(folder.kind, 'folder');
  assert.equal(folder.name, 'src');
  assert.equal(folder.href, '/o/r/tree/main/src');
  assert.equal(folder.key, '/o/r/tree/main/src');

  const file = rowTarget(rows[1]);
  assert.equal(file.kind, 'file');
  assert.equal(file.key, '');

  assert.equal(rowTarget(rows[2]), null);
});

test('a folder row carries two aligned name cells, a chevron and a date', async () => {
  installDom();
  const { buildRow } = await import('../src/features/folderTree/render.js');
  const commit = new Map([['src', {
    oid: 'abc123',
    url: '/o/r/commit/abc123',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    message: 'Move things around',
    title: 'Move things around',
  }]]);
  const labels = { expand: 'Expand src', collapse: 'Collapse src' };
  const row = buildRow({
    entry: { name: 'src', path: 'src', type: 'folder' },
    parentHref: '/o/r/tree/main',
    parentKey: '/o/r/tree/main',
    depth: 1,
    commit: commit.get('src'),
    labels,
  });

  assert.ok(row.classList.contains('react-directory-row'));
  assert.equal(row.dataset.gpTreeOwner, '/o/r/tree/main');
  assert.equal(row.dataset.gpTreeDepth, '1');
  assert.equal(row.dataset.gpTreeKey, '/o/r/tree/main/src');

  const columns = row.querySelectorAll('.react-directory-filename-column');
  assert.equal(columns.length, 2);
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    assert.ok(column.querySelector('.gp-tree-slot .gp-tree-toggle'));
    assert.ok(column.querySelector('svg.octicon-file-directory-fill'));
    const link = column.querySelector('a');
    assert.equal(link.getAttribute('href'), '/o/r/tree/main/src');
    assert.equal(link.getAttribute('aria-label'), 'src, (Directory)');
  }
  assert.equal(row.querySelector('td').style.paddingLeft, '32px');

  const age = row.querySelector('.react-directory-commit-age relative-time');
  assert.ok(age);
  assert.ok(age.getAttribute('datetime'));
  assert.ok(age.textContent.trim());

  const commitLink = row.querySelector('.gp-tree-commit-link');
  assert.equal(commitLink.getAttribute('href'), '/o/r/commit/abc123');
  assert.equal(commitLink.textContent, 'Move things around');
});

test('a file row keeps the slot but has no chevron and links to the blob', async () => {
  installDom();
  const { buildRow } = await import('../src/features/folderTree/render.js');
  const row = buildRow({
    entry: { name: 'a b.js', path: 'src/a b.js', type: 'file' },
    parentHref: '/o/r/tree/main/src',
    parentKey: '/o/r/tree/main/src',
    depth: 2,
    commit: null,
    labels: { expand: '', collapse: '' },
  });

  const column = row.querySelector('.react-directory-filename-column');
  assert.ok(column.querySelector('.gp-tree-slot'));
  assert.equal(column.querySelector('.gp-tree-toggle'), null);
  assert.ok(column.querySelector('svg.octicon-file'));
  assert.equal(column.querySelector('a').getAttribute('href'), '/o/r/blob/main/src/a%20b.js');
  assert.equal(row.querySelector('td').style.paddingLeft, '48px');
  assert.equal(row.querySelector('.react-directory-commit-age').textContent.trim(), '');
});

test('the chevron exposes its state and follows a language change', async () => {
  installDom();
  const { buildExpander, updateExpander } = await import('../src/features/folderTree/render.js');
  const button = buildExpander({ name: 'src', labels: { expand: 'Expand src', collapse: 'Collapse src' } });
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(button.getAttribute('aria-label'), 'Expand src');

  const row = document.createElement('tr');
  row.appendChild(button);
  updateExpander(row, true, { expand: 'Open src', collapse: 'Close src' });
  assert.equal(row.dataset.gpTreeExpanded, 'true');
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(button.getAttribute('aria-label'), 'Close src');
  assert.ok(button.classList.contains('is-open'));

  updateExpander(row, false, { expand: 'Open src', collapse: 'Close src' });
  assert.equal(button.getAttribute('aria-label'), 'Open src');
  assert.equal(button.classList.contains('is-open'), false);
});

test('a note row spans the table and carries its depth and owner', async () => {
  installDom();
  const { buildNoteRow } = await import('../src/features/folderTree/render.js');
  const row = buildNoteRow({
    text: 'This folder is empty',
    depth: 1,
    owner: '/o/r/tree/main/src',
    className: 'gp-tree-note--empty',
    colSpan: 6,
  });
  assert.ok(row.classList.contains('gp-tree-note-row'));
  assert.equal(row.dataset.gpTreeOwner, '/o/r/tree/main/src');
  assert.equal(row.dataset.gpTreeDepth, '1');
  const cell = row.querySelector('td');
  assert.equal(cell.colSpan, 6);
  assert.equal(cell.textContent, 'This folder is empty');
  assert.ok(cell.classList.contains('gp-tree-note--empty'));
});

test('a relative date is empty for a missing date and readable for a real one', async () => {
  const { relativeDate } = await import('../src/features/folderTree/render.js');
  assert.equal(relativeDate('not a date'), '');
  const now = Date.parse('2026-11-18T12:00:00.000Z');
  const text = relativeDate('2026-11-16T12:00:00.000Z', now);
  assert.ok(text.length > 0);
});
