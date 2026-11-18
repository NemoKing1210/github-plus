/**
 * The raw-file address behind a blob, blame or raw address, which is what both
 * the size probe and the download fetch need. GitHub's own raw route resolves
 * any ref, including branch names that contain slashes, so the path is
 * rewritten rather than rebuilt from parts.
 */
const FILE_VIEW_PATH = /^\/([^/]+)\/([^/]+)\/(?:blob|blame|raw)\/(.+)$/;

/**
 * Raw path for a file-view link or the current file view, '' when the address
 * does not point at one.
 * @param {string} href
 * @param {string} [base]
 * @returns {string}
 */
export function rawUrlFor(href, base = 'https://github.com') {
  if (!href) return '';
  let path;
  try {
    path = new URL(href, base).pathname;
  } catch {
    return '';
  }
  const match = FILE_VIEW_PATH.exec(path);
  if (!match) return '';
  return `/${match[1]}/${match[2]}/raw/${match[3]}`;
}

/**
 * The addresses behind a file link that the context menu acts on.
 *
 * GitHub does not mark where a ref ends inside a file view, and a branch may
 * contain slashes, so the page's current ref (the branch selector) is passed
 * in when known; without it the first segment after the marker is assumed to
 * be the ref, which is right for ordinary branch names.
 */
const FILE_PATH = FILE_VIEW_PATH;

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * @param {string} href blob link or the current blob page
 * @param {string} [base]
 * @param {string} [ref] the page's current branch or tag, when known
 * @returns {{href: string, rawUrl: string, relative: string, name: string} | null}
 */
export function fileTarget(href, base = 'https://github.com', ref = '') {
  if (!href) return null;
  let url;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  const match = FILE_PATH.exec(url.pathname);
  if (!match) return null;
  const rawUrl = rawUrlFor(url.pathname);
  if (!rawUrl) return null;
  let rest = match[3];
  if (ref && rest.startsWith(`${ref}/`)) rest = rest.slice(ref.length + 1);
  else {
    const slash = rest.indexOf('/');
    if (slash < 0) return null;
    rest = rest.slice(slash + 1);
  }
  if (!rest) return null;
  const relative = decode(rest);
  return {
    href: `${url.origin}${url.pathname}`,
    rawUrl,
    relative,
    name: relative.slice(relative.lastIndexOf('/') + 1),
  };
}

/** The repository folder behind a tree address; the root is not a folder. */
const FOLDER_PATH = /^\/([^/]+)\/([^/]+)\/tree\/(.+)$/;

/**
 * The repository folder behind a tree link.
 *
 * The repository root (`/owner/repo/tree/<ref>` with nothing after the ref) is
 * the listing itself, not a folder row, so it resolves to null. `owner` and
 * `repo` let a caller tell a folder of the current repository from a submodule
 * that points into another one.
 *
 * @param {string} href
 * @param {string} [base]
 * @param {string} [ref] the page's current branch or tag, when known
 * @returns {{href: string, relative: string, name: string, owner: string,
 *   repo: string} | null}
 */
export function folderTarget(href, base = 'https://github.com', ref = '') {
  if (!href) return null;
  let url;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  const match = FOLDER_PATH.exec(url.pathname);
  if (!match) return null;
  let rest = match[3];
  if (ref && rest.startsWith(`${ref}/`)) rest = rest.slice(ref.length + 1);
  else {
    const slash = rest.indexOf('/');
    if (slash < 0) return null;
    rest = rest.slice(slash + 1);
  }
  if (!rest) return null;
  const relative = decode(rest);
  return {
    href: `${url.origin}${url.pathname}`,
    relative,
    name: relative.slice(relative.lastIndexOf('/') + 1),
    owner: match[1],
    repo: match[2],
  };
}

/**
 * Where a right-click or a preview request resolves to a file, and to nothing
 * everywhere else.
 *
 * Four surfaces: a file row of the repository listing, a file of the sidebar
 * file tree, a file link inside rendered markdown, and the file view of a blob
 * or blame page. Folders, submodules and anything that is not a file view
 * return null here; `resolveFolderTarget` below covers the folder surfaces.
 * Images, media and ordinary links are skipped as well, as is everything in
 * the file view except the file's own header link and a link to another file.
 */
const LISTING = '[data-testid="directory-content"]';
const MARKDOWN_BODY = '.markdown-body, .gp-preview__md';
const FILE_VIEW_ONLY_PATH = /^\/[^/]+\/[^/]+\/(?:blob|blame)\//;
const FILE_VIEW_CONTENT = [
  '[data-testid="breadcrumbs"]',
  '[data-testid="breadcrumbs-filename"]',
  '[data-testid="read-only-cursor-text-area"]',
  '[data-testid="code-cell"]',
  '.react-code-file-contents',
  '.markdown-body',
].join(', ');
const TREE_PANE = '#repos-file-tree';
const TREE_ITEM = 'li[role="treeitem"]';
const TREE_ID_SUFFIX = '-item';
/* The path ends at the repository name on a repository home page, so the
 * separator after it is optional. */
const REPO_PATH = /^\/([^/]+)\/([^/]+)(?:\/|$)/;
const NATIVE_MEDIA = 'img, video, audio, picture, canvas';

function cleanText(node) {
  return (node?.textContent || '').trim();
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

/** The branch or tag the page is showing, when GitHub renders its selector. */
function currentRef() {
  const selector = document.querySelector('[data-testid="anchor-button"]');
  return cleanText(selector);
}

function ownFileLink(node) {
  const link = node.closest('a[href]');
  if (!link) return false;
  try {
    return new URL(link.getAttribute('href'), location.href).pathname === location.pathname;
  } catch {
    return false;
  }
}

/**
 * The absolute address of a markdown link that can reach this site (pure). A
 * hash-only or query-only link never reaches another page, and a link on a
 * foreign host belongs to the browser, so both return null.
 */
function markdownUrl(href, base) {
  if (!href || href.startsWith('#') || href.startsWith('?')) return null;
  let url;
  let host;
  try {
    url = new URL(href, base);
    host = new URL(base).hostname;
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.hostname !== 'github.com' && url.hostname !== host) return null;
  return url;
}

/**
 * The file behind a rendered markdown link (pure). GitHub rewrites relative
 * markdown links into repository file views, so the address alone is enough.
 * @param {string} href
 * @param {string} [base] the page the link was rendered on
 * @param {string} [ref] the page's current branch or tag, when known
 * @returns {{href: string, rawUrl: string, relative: string, name: string} | null}
 */
export function markdownFileTarget(href, base = 'https://github.com', ref = '') {
  const url = markdownUrl(href, base);
  return url ? fileTarget(url.href, base, ref) : null;
}

/**
 * The folder behind a rendered markdown link (pure), by the same rules as
 * `markdownFileTarget`.
 * @param {string} href
 * @param {string} [base] the page the link was rendered on
 * @param {string} [ref] the page's current branch or tag, when known
 * @returns {{href: string, relative: string, name: string, owner: string,
 *   repo: string} | null}
 */
export function markdownFolderTarget(href, base = 'https://github.com', ref = '') {
  const url = markdownUrl(href, base);
  return url ? folderTarget(url.href, base, ref) : null;
}

function fromMarkdownLink(node) {
  const link = node.closest('a[href]');
  if (!link || !link.closest(MARKDOWN_BODY)) return null;
  if (node.closest(NATIVE_MEDIA)) return null;
  const target = markdownFileTarget(link.getAttribute('href') || '', location.href, currentRef());
  if (!target) return null;
  return { ...target, source: 'markdown', anchor: link };
}

function fromMarkdownFolder(node) {
  const link = node.closest('a[href]');
  if (!link || !link.closest(MARKDOWN_BODY)) return null;
  if (node.closest(NATIVE_MEDIA)) return null;
  const target = markdownFolderTarget(link.getAttribute('href') || '', location.href, currentRef());
  if (!target) return null;
  return { ...target, source: 'markdown', anchor: link };
}

function fromListing(node) {
  const row = node.closest('tr.react-directory-row');
  if (!row || !row.closest(LISTING)) return null;
  const link = row.querySelector('a[href*="/blob/"]');
  if (!link) return null;
  const target = fileTarget(link.getAttribute('href') || '', location.href, currentRef());
  if (!target) return null;
  return {
    ...target,
    name: cleanText(link) || target.name,
    source: 'listing',
    anchor: link,
  };
}

function fromListingFolder(node) {
  const row = node.closest('tr.react-directory-row');
  if (!row || !row.closest(LISTING)) return null;
  const link = row.querySelector('a[href*="/tree/"]');
  if (!link) return null;
  // A submodule row links into another repository, so its address is not a
  // folder of this listing and its path is not relative to this repository.
  if (/\(submodule\)/i.test(link.getAttribute('aria-label') || '')) return null;
  const target = folderTarget(link.getAttribute('href') || '', location.href, currentRef());
  if (!target) return null;
  const repo = REPO_PATH.exec(location.pathname);
  if (!repo || target.owner !== repo[1] || target.repo !== repo[2]) return null;
  // GitHub collapses a chain of single-child folders into one row whose label
  // is the whole chain (`.github/workflows`), so the name comes from the
  // address rather than from the link text.
  return {
    ...target,
    source: 'listing',
    anchor: link,
  };
}

/** The repository-relative path a sidebar tree row stands for. */
function treeRelative(row) {
  const id = row.id || '';
  return id.endsWith(TREE_ID_SUFFIX) ? id.slice(0, -TREE_ID_SUFFIX.length) : '';
}

function isTreeFolder(row) {
  if (row.hasAttribute('aria-expanded')) return true;
  const icon = row.querySelector('.PRIVATE_TreeView-item-visual svg.octicon');
  return /octicon-(file-directory|file-submodule|file-symlink-directory)/.test(
    icon?.getAttribute('class') || '',
  );
}

function fromFileTree(node) {
  const row = node.closest(TREE_ITEM);
  if (!row || !row.closest(TREE_PANE) || isTreeFolder(row)) return null;
  const relative = treeRelative(row);
  const ref = currentRef();
  const repo = REPO_PATH.exec(location.pathname);
  if (!relative || !ref || !repo) return null;
  const href = `${location.origin}/${repo[1]}/${repo[2]}/blob/${encodePath(ref)}/${encodePath(relative)}`;
  const target = fileTarget(href, location.href, ref);
  if (!target) return null;
  const pageTarget = fileTarget(location.pathname, location.href, ref);
  const label = row.querySelector('.PRIVATE_TreeView-item-content-text');
  return {
    ...target,
    name: cleanText(label) || target.name,
    // The current file is already open, so its row offers no redundant "Open".
    source: pageTarget && pageTarget.relative === target.relative ? 'blob' : 'tree',
    anchor: row,
  };
}

function fromFileTreeFolder(node) {
  const row = node.closest(TREE_ITEM);
  if (!row || !row.closest(TREE_PANE) || !isTreeFolder(row)) return null;
  const relative = treeRelative(row);
  const ref = currentRef();
  const repo = REPO_PATH.exec(location.pathname);
  if (!relative || !ref || !repo) return null;
  const href = `${location.origin}/${repo[1]}/${repo[2]}/tree/${encodePath(ref)}/${encodePath(relative)}`;
  const target = folderTarget(href, location.href, ref);
  if (!target) return null;
  const label = row.querySelector('.PRIVATE_TreeView-item-content-text');
  return {
    ...target,
    name: cleanText(label) || target.name,
    source: 'tree',
    anchor: row,
  };
}

function fromFileView(node) {
  if (!FILE_VIEW_ONLY_PATH.test(location.pathname)) return null;
  if (!node.closest(FILE_VIEW_CONTENT)) return null;
  if (node.closest(NATIVE_MEDIA)) return null;
  if (node.closest('a[href]') && !ownFileLink(node)) return null;
  const target = fileTarget(location.pathname, location.href, currentRef());
  if (!target) return null;
  const title = document.querySelector('[data-testid="breadcrumbs-filename"]');
  return {
    ...target,
    source: 'blob',
    anchor: title || node,
  };
}

/**
 * @param {EventTarget|null} node
 * @returns {{name: string, href: string, rawUrl: string, relative: string,
 *   source: 'listing'|'tree'|'markdown'|'blob', anchor: Element} | null}
 */
export function resolveFileTarget(node) {
  if (!(node instanceof Element)) return null;
  return fromListing(node) || fromFileTree(node) || fromMarkdownLink(node) || fromFileView(node);
}

/**
 * The folder of the current repository behind a right-click, and nothing
 * everywhere else: a folder row of the repository listing (including the rows
 * the folder tree inserts), a folder of the sidebar file tree, or a folder link
 * in rendered markdown. Submodules, images and links into another repository
 * keep the browser's own menu.
 *
 * Kept apart from `resolveFileTarget` so the preview and the long press keep
 * acting on files only.
 *
 * @param {EventTarget|null} node
 * @returns {{kind: 'folder', name: string, href: string, relative: string,
 *   source: 'listing'|'tree'|'markdown', anchor: Element} | null}
 */
export function resolveFolderTarget(node) {
  if (!(node instanceof Element)) return null;
  const target = fromListingFolder(node) || fromFileTreeFolder(node) || fromMarkdownFolder(node);
  return target ? { ...target, kind: 'folder' } : null;
}
