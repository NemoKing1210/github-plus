/**
 * The file-listing rows that carry a last-commit date.
 *
 * Each surface is independent: a selector that stops matching after a GitHub
 * redesign turns that surface into a no-op. `resolve(row)` returns
 * `{ cell, time, kind }` or null; `cell` is the element tracked by the
 * feature, `time` the `<relative-time>` that holds the commit date.
 */
const TIME_SELECTOR = 'relative-time[datetime], time[datetime], time-ago[datetime]';

/** Folder recognition borrowed from GitHub's own row links and glyphs. */
function hasFolderMark(row) {
  if (!row) return false;
  if (row.querySelector('svg.octicon-file-directory, svg.octicon-file-submodule')) return true;
  const links = row.querySelectorAll('a[href]');
  for (let index = 0; index < links.length; index += 1) {
    const link = links[index];
    if (/\(directory\)|\(submodule\)/i.test(link.getAttribute('aria-label') || '')) return true;
    if (/\/tree\//.test(link.getAttribute('href') || '')) return true;
  }
  return false;
}

export const SURFACES = [
  {
    id: 'repo-tree',
    containers: ['[data-testid="directory-content"]'],
    rows: '.react-directory-commit-age',
    resolve(cell) {
      const time = cell.querySelector(TIME_SELECTOR);
      if (!time) return null;
      const row = cell.closest('[role="row"]') || cell.parentElement;
      return { cell, time, kind: hasFolderMark(row) ? 'folder' : 'file' };
    },
  },
  {
    id: 'classic-tree',
    containers: ['.js-navigation-container'],
    rows: '.js-navigation-item',
    resolve(cell) {
      const time = cell.querySelector(TIME_SELECTOR);
      if (!time) return null;
      return { cell, time, kind: hasFolderMark(cell) ? 'folder' : 'file' };
    },
  },
];
