/**
 * The raw-file address behind a blob address, which is what both the size
 * probe and the download fetch need. GitHub's own raw route resolves any ref,
 * including branch names that contain slashes, so the path is rewritten
 * rather than rebuilt from parts.
 */
const BLOB_PATH = /^\/([^/]+)\/([^/]+)\/blob\/(.+)$/;

/**
 * Raw path for a blob link or the current blob page, '' when the address does
 * not point at a file view.
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
  const match = BLOB_PATH.exec(path);
  if (!match) return '';
  return `/${match[1]}/${match[2]}/raw/${match[3]}`;
}
