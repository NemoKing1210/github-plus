import {
  BADGE_HOSTS,
  GALLERY_BADGE_MAX_HEIGHT_PX,
  GALLERY_MAX_IMAGES,
  GALLERY_MIN_SIZE_PX,
} from '../core/constants.js';

/** Paths that only ever serve a status badge, whatever the host. */
const BADGE_PATHS = [
  // Workflow status badge: /<owner>/<repo>[/actions]/workflows/<file>/badge.svg
  /\/workflows\/[^/]+\/badge(\.[a-z0-9]+)?$/i,
  // The README convention: a repository file called `badge.svg`, `badge.png`, …
  /\/badge(\.[a-z0-9]+)?$/i,
];

const CAMO_HOST = /(^|\.)camo\.githubusercontent\.com$/;
const HEX_PAYLOAD = /^[0-9a-f]+$/;

/**
 * The real address a proxy carries in its path. GitHub's camo proxy serves
 * every external image from `camo.githubusercontent.com/<hash>/<hex url>`, so a
 * shields.io badge hides behind a camo host and must be judged by its decoded
 * target, never by the proxy.
 */
function decodeProxyUrl(url) {
  if (!url) return '';
  let parsed;
  try {
    parsed = new URL(url, location.href);
  } catch {
    return '';
  }
  if (!CAMO_HOST.test(parsed.hostname.toLowerCase())) return '';
  const segments = parsed.pathname.split('/').filter(Boolean);
  const payload = segments[segments.length - 1] || '';
  if (payload.length < 8 || payload.length % 2 !== 0 || !HEX_PAYLOAD.test(payload)) return '';
  let decoded = '';
  for (let index = 0; index < payload.length; index += 2) {
    decoded += String.fromCharCode(parseInt(payload.slice(index, index + 2), 16));
  }
  return decoded.startsWith('http') ? decoded : '';
}

/**
 * True when the URL belongs to a badge or status service: a known badge host,
 * a badge-only path, or a proxied address that decodes to one of those.
 */
export function isBadgeUrl(url, depth = 0) {
  if (!url) return false;
  let parsed;
  try {
    parsed = new URL(url, location.href);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  for (let index = 0; index < BADGE_HOSTS.length; index += 1) {
    const badge = BADGE_HOSTS[index];
    if (host === badge || host.endsWith(`.${badge}`)) return true;
  }
  for (let index = 0; index < BADGE_PATHS.length; index += 1) {
    if (BADGE_PATHS[index].test(parsed.pathname)) return true;
  }
  // One level of proxying is all GitHub does; stop there.
  if (depth > 0) return false;
  return isBadgeUrl(decodeProxyUrl(url), depth + 1);
}

/**
 * Decoration that never belongs in a gallery: GitHub emoji markup,
 * presentational images and (when the corresponding setting is on) badges
 * and small icons.
 */
function isDecorative(item, settings) {
  const node = item.node;
  if (node.classList && node.classList.contains('emoji')) return true;
  if (node.getAttribute('role') === 'presentation') return true;
  if (node.getAttribute('data-gp-gallery') === 'ignore') return true;
  if (!settings.skipBadges) return false;
  if (isBadgeUrl(item.src) || isBadgeUrl(item.canonical)) return true;
  const width = node.naturalWidth || Number(node.getAttribute('width')) || 0;
  const height = node.naturalHeight || Number(node.getAttribute('height')) || 0;
  if (height > 0 && height <= GALLERY_BADGE_MAX_HEIGHT_PX) return true;
  return width > 0 && height > 0 && width < GALLERY_MIN_SIZE_PX && height < GALLERY_MIN_SIZE_PX;
}

/** The container holding the gallery set the node belongs to, or null. */
export function resolveContainer(source, node) {
  if (typeof source.match === 'function') return source.match(node);
  if (!source.containerSelector) return null;
  return node.closest(source.containerSelector) || null;
}

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function filenameOf(url) {
  if (!url) return '';
  let path = url;
  try {
    path = new URL(url, location.href).pathname;
  } catch {
    /* keep the raw string */
  }
  const segments = path.split('/');
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (segment) return decodeSegment(segment);
  }
  return '';
}

function titleOf(item, full, src) {
  if (item.title) return item.title;
  if (item.alt) return item.alt;
  return filenameOf(full || src);
}

/**
 * Turn the raw items of one source into viewer entries: normalized, filtered
 * (decorative/badge/small images) and de-duplicated by URL, capped at
 * `GALLERY_MAX_IMAGES`.
 *
 * @returns {{ image: { src: string, fullSrc?: string, link: string, alt: string, title: string }, node: HTMLImageElement }[]}
 */
export function collectGallery(container, source, settings) {
  const items = source.collect(container) || [];
  const entries = [];
  const seen = new Set();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item || !item.node) continue;
    const src = String(item.src || '').trim();
    if (!src || src.startsWith('data:')) continue;
    if (seen.has(src) || isDecorative(item, settings)) continue;
    seen.add(src);
    const full = source.resolveFull ? source.resolveFull(item, settings) || '' : '';
    const image = {
      src,
      link: full || src,
      alt: item.alt || '',
      title: titleOf(item, full, src),
    };
    if (full && full !== src) image.fullSrc = full;
    entries.push({ image, node: item.node });
    if (entries.length >= GALLERY_MAX_IMAGES) break;
  }
  return entries;
}

/** Index of the entry rendered by `node`, or -1. */
export function matchIndex(entries, node) {
  for (let index = 0; index < entries.length; index += 1) {
    if (entries[index].node === node) return index;
  }
  return -1;
}
