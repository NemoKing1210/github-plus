import { fileTarget } from './paths.js';

/**
 * Where a right-click resolves to a file, and to nothing everywhere else.
 *
 * Two surfaces: a file row of the repository listing and the file view of a
 * blob page. Folders, submodules and anything that is not a file view return
 * null, so the browser keeps its own menu there. Links, images and media
 * inside a rendered file are left alone too — the native menu is the useful
 * one for them — except the file's own header link.
 */
const LISTING = '[data-testid="directory-content"]';
const BLOB_PATH = /^\/[^/]+\/[^/]+\/blob\//;
const BLOB_CONTENT = [
  '[data-testid="breadcrumbs"]',
  '[data-testid="read-only-cursor-text-area"]',
  '.react-code-file-contents',
  '.markdown-body',
].join(', ');
const NATIVE_MEDIA = 'img, video, audio, picture, canvas';

function cleanText(node) {
  return (node?.textContent || '').trim();
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

function fromBlobPage(node) {
  if (!BLOB_PATH.test(location.pathname)) return null;
  if (!node.closest(BLOB_CONTENT)) return null;
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
 *   source: 'listing'|'blob', anchor: Element} | null}
 */
export function resolveFileTarget(node) {
  if (!(node instanceof Element)) return null;
  return fromListing(node) || fromBlobPage(node);
}
