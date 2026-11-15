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

/** The sidebar tree marks folders with its own folder glyphs. */
function isFolderIcon(icon) {
  return /octicon-(file-directory|file-submodule|file-symlink-directory)/.test(
    icon?.getAttribute('class') || '',
  );
}

/** A tree page's breadcrumb names a folder; every other page names a file. */
function isTreePage() {
  return /^\/[^/]+\/[^/]+\/tree\//.test(location.pathname);
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
    id: 'file-header',
    // The filename is a sibling of the breadcrumb nav, not inside it, and each
    // screen width gets its own copy; the code view's split pane holds them all.
    // The breadcrumb nav stays a container for older markup.
    containers: ['#repos-split-pane-content', '[data-testid="breadcrumbs"]'],
    rows: '[data-testid="breadcrumbs-filename"]',
    resolve(row) {
      // The name is a heading now; the spans around it are path separators,
      // and older markup wrapped it in a link.
      const label = row.querySelector('h1, a[href]') || row;
      const name = cleanName(label);
      if (!name) return null;
      return {
        name,
        kind: isTreePage() ? 'folder' : 'file',
        nameNode: label,
        nativeIcon: null,
      };
    },
  },
  {
    id: 'file-tree-pane',
    containers: ['#repos-file-tree'],
    rows: 'li[role="treeitem"]',
    resolve(row) {
      const nameNode = row.querySelector('.PRIVATE_TreeView-item-content-text');
      if (!nameNode) return null;
      const name = cleanName(nameNode);
      if (!name) return null;
      const nativeIcon = row.querySelector('.PRIVATE_TreeView-item-visual svg.octicon');
      return {
        name,
        kind: row.hasAttribute('aria-expanded') || isFolderIcon(nativeIcon) ? 'folder' : 'file',
        nameNode,
        nativeIcon,
      };
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
