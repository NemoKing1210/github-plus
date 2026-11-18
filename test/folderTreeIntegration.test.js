import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function installDom() {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div data-testid="directory-content">
        <table>
          <thead><tr><th>Name</th><th>Name</th><th>Last commit message</th><th>Last commit date</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </body></html>`,
    { pretendToBeVisual: true, url: 'https://github.com/o/r/tree/main' },
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

test('a nested file row is decorated by every file feature', async () => {
  installDom();
  globalThis.fetch = async () => ({
    ok: true,
    headers: { get: (name) => (name === 'content-length' ? '2929' : null) },
  });

  const { buildRow } = await import('../src/features/folderTree/render.js');
  const row = buildRow({
    entry: { name: 'a.js', path: 'src/a.js', type: 'file' },
    parentHref: '/o/r/tree/main/src',
    parentKey: '/o/r/tree/main/src',
    depth: 1,
    commit: {
      oid: 'abc',
      url: '/o/r/commit/abc',
      date: new Date(Date.now() - 86400000).toISOString(),
      message: 'Add a.js',
      title: 'Add a.js',
    },
    labels: { expand: '', collapse: '' },
  });
  document.querySelector('[data-testid="directory-content"] tbody').appendChild(row);

  const { applyFileIconsSettings } = await import('../src/features/fileIcons/index.js');
  const { applyFileAgesSettings } = await import('../src/features/fileAges/index.js');
  const { applyFileMetaSettings } = await import('../src/features/fileMeta/index.js');
  const { applyFilePreviewSettings } = await import('../src/features/filePreview/index.js');
  applyFileIconsSettings();
  applyFileAgesSettings();
  applyFileMetaSettings();
  applyFilePreviewSettings();

  assert.ok(row.querySelector('svg.gp-fi'), 'the type icon was injected');
  assert.ok(row.querySelector('.gp-age-date'), 'the commit date was painted');
  assert.ok(row.querySelector('.gp-file-meta-cell .gp-file-download'), 'the download button was added');
  assert.ok(row.querySelector('.gp-file-preview-cell .gp-file-preview-btn'), 'the preview button was added');
  assert.ok(await waitFor(() => row.querySelector('.gp-file-size')?.textContent === '2.86 KB'), 'the size arrived');

  const { resolveFileTarget } = await import('../src/utils/fileTarget.js');
  const target = resolveFileTarget(row.querySelector('a'));
  assert.equal(target.source, 'listing');
  assert.equal(target.relative, 'src/a.js');

  const { resolvePreviewLink } = await import('../src/features/filePreview/surfaces.js');
  const link = resolvePreviewLink(row.querySelector('a'));
  assert.equal(link.source, 'listing');
  assert.equal(link.file.relative, 'src/a.js');
});
