/**
 * Repository-relative markdown addresses rewritten to GitHub's own raw and
 * blob routes, so they keep working in a private repository where the raw
 * host would reject an anonymous request. Only relative addresses are
 * rewritten: anchors, absolute paths, protocol-relative and scheme URLs are
 * left for the browser.
 */

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

function encodeSegments(value) {
  return value.split('/').map(encodeURIComponent).join('/');
}

/**
 * Same-origin route for a relative markdown link or image, '' when the
 * address is not repository-relative.
 * @param {string} href
 * @param {{owner: string, repo: string, ref: string, dir: string}} context
 *   the repository and the directory of the file the markdown lives in
 * @param {'link'|'image'} mode
 * @returns {string}
 */
export function resolveMarkdownTarget(href, context, mode) {
  const address = String(href || '').trim();
  if (!address || address.startsWith('#') || address.startsWith('//') || address.startsWith('/')) {
    return '';
  }
  if (SCHEME.test(address)) return '';
  const cut = address.search(/[?#]/);
  const path = cut < 0 ? address : address.slice(0, cut);
  const suffix = cut < 0 ? '' : address.slice(cut);
  const stack = [];
  const source = context.dir ? `${context.dir}/${path}` : path;
  for (const segment of source.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      stack.pop();
      continue;
    }
    stack.push(segment);
  }
  if (!stack.length) return '';
  const route = mode === 'image' ? 'raw' : 'blob';
  const owner = encodeURIComponent(context.owner);
  const repo = encodeURIComponent(context.repo);
  const ref = encodeSegments(context.ref);
  const file = stack.map(encodeURIComponent).join('/');
  return `/${owner}/${repo}/${route}/${ref}/${file}${suffix}`;
}
