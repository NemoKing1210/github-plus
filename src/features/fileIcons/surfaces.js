/**
 * Where GitHub lists files, and how to read a row.
 *
 * Each surface is independent: a selector that stops matching after a GitHub
 * redesign turns that one surface into a no-op and leaves the others alone.
 * `resolve(row)` returns `{ name, kind, nameNode, nativeIcon }` or null.
 */

/** Folder often enough to trust the link target over the label. */
function isFolderLink(link, nativeIcon) {
  const label = link.getAttribute('aria-label') || '';
  if (/\(directory\)|\(submodule\)/i.test(label)) return true;
  if (/\/tree\//.test(link.getAttribute('href') || '')) return true;
  return /octicon-file-directory/.test(nativeIcon?.getAttribute('class') || '');
}

function cleanName(node) {
  return (node.textContent || '').trim().replace(/\/+$/, '');
}

/** Fallback reader for surfaces whose markup follows the classic file row. */
function resolveClassicFileRow(row) {
  const nativeIcon = row.querySelector('svg[class*="octicon-file"]');
  const link = row.querySelector('.file-info a, a[title], a.Link--primary, a[href]');
  if (!link) return null;
  return {
    name: cleanName(link),
    kind: isFolderLink(link, nativeIcon) ? 'folder' : 'file',
    nameNode: link,
    nativeIcon,
  };
}

export const SURFACES = [
  {
    id: 'repo-tree',
    containers: ['[data-testid="directory-content"]'],
    // Two name cells share each row (small and large screens); treating each
    // column as the unit decorates both without a second pass.
    rows: '.react-directory-filename-column',
    resolve(column) {
      const link = column.querySelector('a[href]');
      if (!link) return null;
      const nativeIcon = column.querySelector('svg.octicon');
      return {
        name: cleanName(link),
        kind: isFolderLink(link, nativeIcon) ? 'folder' : 'file',
        nameNode: link,
        nativeIcon,
      };
    },
  },
  {
    id: 'blob-header',
    containers: ['[data-testid="breadcrumbs"]'],
    rows: '[data-testid="breadcrumbs-filename"]',
    resolve(row) {
      const link = row.querySelector('a[href], span') || row;
      const name = cleanName(link);
      if (!name) return null;
      return { name, kind: 'file', nameNode: link, nativeIcon: null };
    },
  },
  {
    id: 'pr-file-header',
    containers: ['.js-file-list', '.files-bucket', '.diff-view'],
    rows: '.file-header',
    resolve: resolveClassicFileRow,
  },
  {
    id: 'diff-file-tree',
    containers: ['.file-tree', '.js-diff-file-tree', '[data-testid="diff-file-tree"]'],
    rows: '[role="treeitem"], .file-tree-item, .js-tree-list-item',
    resolve: resolveClassicFileRow,
  },
  {
    id: 'commit-files',
    containers: ['[data-testid="commit-content"]', '.js-commit-files'],
    rows: '[data-testid="commit-row-item"], .js-file-list-item',
    resolve: resolveClassicFileRow,
  },
  {
    id: 'search-results',
    containers: ['[data-testid="results-list"]'],
    rows: ':scope > div',
    resolve(row) {
      const link = row.querySelector('.search-title a, a[href]');
      if (!link) return null;
      return {
        name: cleanName(link),
        kind: isFolderLink(link, null) ? 'folder' : 'file',
        nameNode: link,
        nativeIcon: row.querySelector('svg[class*="octicon-file"]'),
      };
    },
  },
  {
    id: 'gist-files',
    containers: ['.gist', '.gist-content'],
    rows: '.file-box',
    resolve: resolveClassicFileRow,
  },
  {
    id: 'release-assets',
    containers: ['[data-testid="release-assets"]', '.release-assets'],
    rows: '[data-testid="release-asset"], .Box-row',
    resolve: resolveClassicFileRow,
  },
];
