/**
 * Page context for the command palette: who is signed in, which repository
 * and ref the page shows, and which identity owns the cached data.
 */

/** First path segments GitHub uses for its own pages, never for repositories. */
export const RESERVED_ROOTS = new Set([
  'settings',
  'notifications',
  'explore',
  'marketplace',
  'orgs',
  'sponsors',
  'topics',
  'collections',
  'trending',
  'new',
  'login',
  'join',
  'search',
  'dashboard',
  'apps',
  'features',
  'enterprise',
  'pricing',
  'site',
  'about',
  'contact',
  'security',
  'readme',
  'codespaces',
  'copilot',
]);

function pathParts(pathname) {
  return String(pathname || '').split('/').filter(Boolean);
}

/** `owner/repo` from a page path, or null for a page outside repositories. */
export function parseRepoPath(pathname) {
  const parts = pathParts(pathname);
  if (parts.length < 2) return null;
  if (RESERVED_ROOTS.has(parts[0].toLowerCase())) return null;
  return `${parts[0]}/${parts[1]}`;
}

/**
 * The first segment after `blob`/`tree`. A ref containing slashes is only
 * recoverable from the page's embedded data; this is the fallback.
 */
export function parseRef(pathname) {
  const parts = pathParts(pathname);
  const marker = parts.findIndex((part) => part === 'blob' || part === 'tree');
  if (marker === -1) return null;
  return parts[marker + 1] || null;
}

function metaContent(doc, name) {
  const node = doc.querySelector(`meta[name="${name}"]`);
  const value = node?.getAttribute('content');
  return value ? value.trim() : '';
}

function embeddedRef(doc) {
  const node = doc.querySelector('react-app[data-target="react-app.embeddedData"]');
  if (!node) return '';
  try {
    const payload = JSON.parse(node.getAttribute('data-payload') || '');
    return payload?.payload?.refInfo?.name || '';
  } catch {
    return '';
  }
}

/** Read the login, repository and ref of the page currently on screen. */
export function readContext(doc = document, url = new URL(location.href)) {
  const isGist = url.hostname === 'gist.github.com';
  const login = metaContent(doc, 'user-login') || null;
  if (isGist) return { login, repo: null, ref: null, isGist: true };

  const repo = metaContent(doc, 'octolytics-dimension-repository_nwo')
    || parseRepoPath(url.pathname);
  const ref = embeddedRef(doc)
    || parseRef(url.pathname)
    || metaContent(doc, 'octolytics-dimension-repository_default_branch')
    || 'HEAD';
  return { login, repo: repo || null, ref, isGist: false };
}

/** FNV-1a 32-bit fingerprint of a token, never the token itself. */
export function tokenFingerprint(token) {
  if (!token) return '';
  let hash = 0x811c9dc5;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `v1:${hash.toString(16).padStart(8, '0')}`;
}

/**
 * The token account wins once the token has been verified; an unverified
 * token yields no identity, so its data is never mixed with page data.
 */
export function resolveIdentity({ token, pageLogin, tokenLogin }) {
  if (token) return tokenLogin || null;
  return pageLogin || null;
}
