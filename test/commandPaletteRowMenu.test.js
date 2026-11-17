import test from 'node:test';
import assert from 'node:assert/strict';

const { rowMenuItems } = await import('../src/features/commandPalette/rowMenu.js');

const labels = {
  open: 'Open', openNewTab: 'Open in new tab', copyLink: 'Copy link', copyPath: 'Copy path',
  copyNumber: 'Copy number', copyClone: 'Copy clone URL', pin: 'Add to favorites', unpin: 'Remove from favorites',
  run: 'Run',
};

function ids(item) {
  const seen = [];
  for (const entry of rowMenuItems(item, { labels, onAction: (id) => seen.push(id), pinned: item.pinned })) {
    if (entry) entry.onSelect();
  }
  return seen;
}

test('a repository menu covers open, links, clone and favorites', () => {
  const item = { key: 'repo:o/r', kind: 'repo', title: 'o/r', data: { fullName: 'o/r', url: 'https://github.com/o/r' } };
  assert.deepEqual(ids(item), ['open', 'newTab', 'copyLink', 'copyClone', 'pin']);
  assert.equal(rowMenuItems(item, { labels, onAction() {}, pinned: true })[5].label, 'Remove from favorites');
});

test('a file menu copies the path', () => {
  const item = { key: 'file:o/r@main:a.js', kind: 'file', title: 'a.js', data: { path: 'a.js' } };
  assert.deepEqual(ids(item), ['open', 'newTab', 'copyPath', 'copyLink', 'pin']);
});

test('a command menu runs and pins', () => {
  const item = { key: 'cmd:repo.code', kind: 'command', title: 'Code' };
  assert.deepEqual(ids(item), ['run', 'pin']);
});
