import { rawUrlFor } from '../fileMeta/paths.js';

/**
 * The addresses behind a file link that the context menu acts on.
 *
 * GitHub does not mark where a ref ends inside a file view, and a branch may
 * contain slashes, so the page's current ref (the branch selector) is passed
 * in when known; without it the first segment after the marker is assumed to
 * be the ref, which is right for ordinary branch names.
 */
const FILE_PATH = /^\/([^/]+)\/([^/]+)\/(?:blob|blame|raw)\/(.+)$/;

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
