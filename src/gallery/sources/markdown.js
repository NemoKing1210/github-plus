import { IMAGE_EXTENSIONS } from '../../core/constants.js';
import { eachNode } from '../../utils/dom.js';
import { registerSource } from '../sources.js';

/**
 * Markdown images: every rendered `.markdown-body` on GitHub (repository
 * READMEs, blob views of `.md` files, wikis, issues, pull requests, review
 * comments, discussions). One container is one gallery set, so the arrows
 * walk the images of the file you are reading.
 */

const CONTAINER_SELECTOR = '.markdown-body';

/** Clickable affordance: the image itself and the link GitHub wraps it in. */
const CURSOR_SELECTOR = [
  '.markdown-body img:not(.emoji)',
  '.markdown-body a:has(> img:not(.emoji))',
].join(', ');

const REPO_BLOB_PATH = /^\/[^/]+\/[^/]+\/blob\//;
const REPO_RAW_PATH = /^\/[^/]+\/[^/]+\/raw\//;

/** Hosts that already serve the full image file, extension or not. */
const ASSET_HOSTS = [
  'user-images.githubusercontent.com',
  'private-user-images.githubusercontent.com',
  'objects.githubusercontent.com',
  'camo.githubusercontent.com',
  'avatars.githubusercontent.com',
  'media.githubusercontent.com',
];

function isImagePath(pathname) {
  const dot = pathname.lastIndexOf('.');
  if (dot < 0) return false;
  const extension = pathname.slice(dot + 1).toLowerCase();
  return IMAGE_EXTENSIONS.includes(extension);
}

function toAbsolute(url) {
  if (!url) return '';
  try {
    return new URL(url, location.href).href;
  } catch {
    return '';
  }
}

/**
 * The largest known source of one image. A repository file linked through a
 * `/blob/` page is fetched from `/raw/`; uploaded attachments, camo and any
 * other host are used as they are (only when the URL names an image file).
 */
function toImageUrl(url) {
  if (!url) return '';
  let parsed;
  try {
    parsed = new URL(url, location.href);
  } catch {
    return '';
  }
  const host = parsed.hostname.toLowerCase();
  if (host === 'github.com' || host === 'www.github.com') {
    if (REPO_BLOB_PATH.test(parsed.pathname) && isImagePath(parsed.pathname)) {
      return `${parsed.origin}${parsed.pathname.replace('/blob/', '/raw/')}`;
    }
    if (REPO_RAW_PATH.test(parsed.pathname) && isImagePath(parsed.pathname)) return parsed.href;
    return '';
  }
  if (ASSET_HOSTS.includes(host) || host === 'raw.githubusercontent.com') return parsed.href;
  return isImagePath(parsed.pathname) ? parsed.href : '';
}

/** Prefer the file behind the wrapping link, fall back to what is rendered. */
function resolveFull(item) {
  const linked = toImageUrl(item.href);
  if (linked) return linked;
  return toImageUrl(item.src);
}

function collect(container) {
  const items = [];
  eachNode(container.querySelectorAll('img'), (node) => {
    if (node.closest('a.anchor')) return;
    const anchor = node.closest('a');
    items.push({
      node,
      src: node.currentSrc || node.getAttribute('src') || '',
      alt: (node.getAttribute('alt') || '').trim(),
      title: (node.getAttribute('title') || '').trim(),
      href: anchor ? toAbsolute(anchor.getAttribute('href')) : '',
    });
  });
  return items;
}

registerSource({
  id: 'markdown',
  labelKey: 'source.markdown',
  hintKey: 'source.markdownDesc',
  containerSelector: CONTAINER_SELECTOR,
  cursorSelector: CURSOR_SELECTOR,
  collect,
  resolveFull,
});
