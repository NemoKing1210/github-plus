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
