import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  fileTarget,
  folderTarget,
  markdownFileTarget,
  markdownFolderTarget,
  rawUrlFor,
  resolveFolderTarget,
} from '../src/utils/fileTarget.js';

test('resolves a blob link into its raw address and relative path', () => {
  const target = fileTarget('/o/r/blob/main/src/a.js', 'https://github.com', 'main');
  assert.deepEqual(target, {
    href: 'https://github.com/o/r/blob/main/src/a.js',
    rawUrl: '/o/r/raw/main/src/a.js',
    relative: 'src/a.js',
    name: 'a.js',
  });
});

test('strips a branch name that contains slashes', () => {
  const target = fileTarget('/o/r/blob/feat/ui/src/a.js', 'https://github.com', 'feat/ui');
  assert.equal(target.relative, 'src/a.js');
  assert.equal(target.rawUrl, '/o/r/raw/feat/ui/src/a.js');
});

test('falls back to the first segment as the ref when the ref is unknown', () => {
  const target = fileTarget('/o/r/blob/main/docs/readme.md', 'https://github.com');
  assert.equal(target.relative, 'docs/readme.md');
});

test('ignores a ref the address does not start with', () => {
  const target = fileTarget('/o/r/blob/main/a.js', 'https://github.com', 'other');
  assert.equal(target.relative, 'a.js');
});

test('decodes percent-encoded segments', () => {
  const target = fileTarget('/o/r/blob/main/docs/my%20notes.md', 'https://github.com', 'main');
  assert.equal(target.relative, 'docs/my notes.md');
  assert.equal(target.name, 'my notes.md');
});

test('keeps the name of a file at the repository root', () => {
  const target = fileTarget('/o/r/blob/main/README.md', 'https://github.com', 'main');
  assert.equal(target.relative, 'README.md');
  assert.equal(target.name, 'README.md');
});

test('resolves a blame page address the same way as a blob one', () => {
  const target = fileTarget('/o/r/blame/main/src/a.js', 'https://github.com', 'main');
  assert.deepEqual(target, {
    href: 'https://github.com/o/r/blame/main/src/a.js',
    rawUrl: '/o/r/raw/main/src/a.js',
    relative: 'src/a.js',
    name: 'a.js',
  });
});

test('returns null for anything that is not a file view', () => {
  assert.equal(fileTarget('/o/r/tree/main/src', 'https://github.com'), null);
  assert.equal(fileTarget('/o/r', 'https://github.com'), null);
  assert.equal(fileTarget('', 'https://github.com'), null);
  assert.equal(fileTarget(null, 'https://github.com'), null);
});

test('accepts an absolute address and ignores its query and hash', () => {
  const target = fileTarget('https://github.com/o/r/blob/main/a.js?plain=1#L20', 'https://github.com', 'main');
  assert.equal(target.href, 'https://github.com/o/r/blob/main/a.js');
  assert.equal(target.rawUrl, '/o/r/raw/main/a.js');
});

test('turns a blob path into a raw path', () => {
  assert.equal(rawUrlFor('/o/r/blob/main/docs/a.md'), '/o/r/raw/main/docs/a.md');
});

test('turns a blame path into a raw path', () => {
  assert.equal(rawUrlFor('/o/r/blame/main/docs/a.md'), '/o/r/raw/main/docs/a.md');
});

test('strips the query and the hash', () => {
  assert.equal(rawUrlFor('/o/r/blob/main/a.js?plain=1#L20'), '/o/r/raw/main/a.js');
});

test('keeps a repository named blob intact', () => {
  assert.equal(rawUrlFor('/owner/blob/blob/main/x.txt'), '/owner/blob/raw/main/x.txt');
});

test('accepts an absolute address', () => {
  assert.equal(rawUrlFor('https://github.com/o/r/blob/main/a.js'), '/o/r/raw/main/a.js');
});

test('does not rewrite a folder link', () => {
  assert.equal(rawUrlFor('/o/r/tree/main/src'), '');
  assert.equal(rawUrlFor(''), '');
});

test('resolves a markdown link relative to the page it was rendered on', () => {
  const target = markdownFileTarget(
    'src/a.js',
    'https://github.com/o/r/blob/main/docs/README.md',
    'main',
  );
  assert.deepEqual(target, {
    href: 'https://github.com/o/r/blob/main/docs/src/a.js',
    rawUrl: '/o/r/raw/main/docs/src/a.js',
    relative: 'docs/src/a.js',
    name: 'a.js',
  });
});

test('resolves an absolute markdown file link with a branch that has slashes', () => {
  const target = markdownFileTarget(
    '/o/r/blob/feat/ui/src/a.js',
    'https://github.com/o/r/issues/1',
    'feat/ui',
  );
  assert.equal(target.relative, 'src/a.js');
  assert.equal(target.rawUrl, '/o/r/raw/feat/ui/src/a.js');
});

test('accepts a github.com file link on a gist page', () => {
  const target = markdownFileTarget(
    'https://github.com/o/r/blob/main/a.js',
    'https://gist.github.com/u/abc',
    '',
  );
  assert.equal(target.relative, 'a.js');
});

test('ignores markdown links that do not reach a file', () => {
  const base = 'https://github.com/o/r/blob/main/README.md';
  assert.equal(markdownFileTarget('#install', base, 'main'), null);
  assert.equal(markdownFileTarget('?plain=1', base, 'main'), null);
  assert.equal(markdownFileTarget('/o/r/tree/main/src', base, 'main'), null);
  assert.equal(markdownFileTarget('mailto:x@example.com', base, 'main'), null);
  assert.equal(
    markdownFileTarget('https://gitlab.com/o/r/blob/main/a.js', base, 'main'),
    null,
  );
});

test('resolves a folder link into its repository-relative path', () => {
  const target = folderTarget('/o/r/tree/main/src', 'https://github.com', 'main');
  assert.deepEqual(target, {
    href: 'https://github.com/o/r/tree/main/src',
    relative: 'src',
    name: 'src',
    owner: 'o',
    repo: 'r',
  });
});

test('keeps the whole folder path and the last segment as its name', () => {
  const target = folderTarget('/o/r/tree/main/src/lib', 'https://github.com', 'main');
  assert.equal(target.relative, 'src/lib');
  assert.equal(target.name, 'lib');
});

test('strips a folder branch name that contains slashes', () => {
  const target = folderTarget('/o/r/tree/feat/ui/src', 'https://github.com', 'feat/ui');
  assert.equal(target.relative, 'src');
});

test('a repository root tree address is not a folder', () => {
  assert.equal(folderTarget('/o/r/tree/main', 'https://github.com', 'main'), null);
  assert.equal(folderTarget('/o/r/tree/main', 'https://github.com'), null);
  assert.equal(folderTarget('/o/r/blob/main/a.js', 'https://github.com', 'main'), null);
  assert.equal(folderTarget('', 'https://github.com'), null);
});

test('decodes a percent-encoded folder path', () => {
  const target = folderTarget('/o/r/tree/main/my%20docs', 'https://github.com', 'main');
  assert.equal(target.relative, 'my docs');
  assert.equal(target.name, 'my docs');
});

test('resolves a markdown link that points at a folder', () => {
  const base = 'https://github.com/o/r/blob/main/README.md';
  const target = markdownFolderTarget('/o/r/tree/main/docs/api', base, 'main');
  assert.equal(target.relative, 'docs/api');
  assert.equal(target.name, 'api');
});

test('ignores markdown links that do not reach a folder', () => {
  const base = 'https://github.com/o/r/blob/main/README.md';
  assert.equal(markdownFolderTarget('/o/r/blob/main/a.js', base, 'main'), null);
  assert.equal(markdownFolderTarget('/o/r/tree/main', base, 'main'), null);
  assert.equal(markdownFolderTarget('#install', base, 'main'), null);
  assert.equal(
    markdownFolderTarget('https://gitlab.com/o/r/tree/main/src', base, 'main'),
    null,
  );
});

test('resolves a folder row on a repository home page', () => {
  const dom = new JSDOM(
    `<div data-testid="directory-content"><table><tbody>
      <tr class="react-directory-row">
        <td class="react-directory-filename-column">
          <a href="/o/r/tree/main/.github/workflows" aria-label=".github/workflows, (Directory)">
            <span class="react-directory-default-color">.github/</span><span>workflows</span>
          </a>
        </td>
      </tr>
    </tbody></table></div>`,
    { url: 'https://github.com/o/r' },
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.location = dom.window.location;

  const target = resolveFolderTarget(document.querySelector('a'));
  assert.equal(target.relative, '.github/workflows');
  assert.equal(target.name, 'workflows');
  assert.equal(target.source, 'listing');
});

test('a folder row of another repository keeps the browser menu', () => {
  const dom = new JSDOM(
    `<div data-testid="directory-content"><table><tbody>
      <tr class="react-directory-row">
        <td class="react-directory-filename-column">
          <a href="/other/repo/tree/main/src" aria-label="src, (Directory)">src</a>
        </td>
      </tr>
    </tbody></table></div>`,
    { url: 'https://github.com/o/r/tree/main' },
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.location = dom.window.location;

  assert.equal(resolveFolderTarget(document.querySelector('a')), null);
});
