/**
 * Save an image under its own filename.
 *
 * A plain `<a download>` cannot name a cross-origin file: the browser ignores
 * the attribute and navigates to the image instead. Fetching the bytes first
 * and downloading an object URL keeps the filename for every host; when CORS
 * or a CSP blocks the fetch, the image opens in a new tab so the action still
 * does something visible.
 */

const CAMO_HOST = /(^|\.)camo\.githubusercontent\.com$/;
const HEX_PAYLOAD = /^[0-9a-f]+$/i;

const MIME_EXTENSIONS = {
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * The address a camo URL proxies. GitHub serves every external markdown image
 * from `camo.githubusercontent.com/<hash>/<hex url>`, so the URL's own last
 * path segment is a hash, not a filename — the decoded target carries it.
 */
function camoTarget(url) {
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
  return /^https?:/i.test(decoded) ? decoded : '';
}

function basename(url) {
  let path = url;
  try {
    path = new URL(url, location.href).pathname;
  } catch {
    /* keep the raw string */
  }
  const segments = path.split('/');
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    if (segments[index]) return decodeSegment(segments[index]);
  }
  return '';
}

/** Filename to save `url` under, with the proxy's original name unwrapped. */
export function filenameFor(url) {
  if (!url) return 'image';
  return basename(camoTarget(url) || url) || 'image';
}

function ensureExtension(name, type) {
  if (/\.[a-z0-9]{2,5}$/i.test(name)) return name;
  const extension = MIME_EXTENSIONS[type] || '';
  return extension ? `${name}.${extension}` : name;
}

function saveBlob(blob, url, name) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = ensureExtension(name || filenameFor(url), blob.type);
  link.rel = 'noopener';
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // The download reads the object URL asynchronously; revoking it in the same
  // tick cancels the save in some browsers.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
}

/**
 * Download the image at `url`, optionally under an explicit `name`.
 * @param {string} url
 * @param {string} [name]
 * @returns {Promise<boolean>} whether the bytes were saved directly
 */
export async function downloadImage(url, name = '') {
  if (!url) return false;
  try {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    saveBlob(blob, url, name);
    return true;
  } catch {
    window.open(url, '_blank', 'noopener');
    return false;
  }
}
