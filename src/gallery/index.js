import { on } from '../core/bus.js';
import { Codes, logWarn } from '../core/debug.js';
import { getGallerySettings } from '../core/settings.js';
import { t } from '../i18n/index.js';
import { VIEWER_ICONS } from '../ui/icons.js';
import { openViewer } from '../ui/viewer.js';
import { el, isOwnUiChrome } from '../utils/dom.js';
import { downloadImage } from '../utils/download.js';
import { watchNavigation } from '../utils/navigation.js';
import { collectGallery, matchIndex, resolveContainer } from './collect.js';
import { listSources } from './sources.js';
// Registers the markdown source (side effect).
import './sources/markdown.js';

/**
 * Image gallery: clicking an image in rendered markdown opens it in the
 * built-in viewer, with the other images of the same markdown container as
 * the set.
 *
 * How it stays out of the way of GitHub's re-renders:
 * - The click affordance is one injected stylesheet built from the source
 *   registry and it only sets a cursor: page images keep GitHub's own look
 *   (no border, outline or overlay), and no per-image listeners or DOM
 *   mutations are needed, so a React re-render cannot strip anything and a
 *   scan loop is never required.
 * - The one extra affordance is a floating download button of our own, shown
 *   while an eligible image is hovered. It lives in `<body>`, never inside
 *   GitHub's markup, and delegated pointer listeners drive it.
 * - A single capture-phase click listener resolves the source, collects the
 *   set and opens the viewer; it walks the live DOM on every click, so
 *   content that arrived after load behaves exactly like content that was
 *   server-rendered.
 * - Modified clicks (Ctrl/Cmd/Shift/Alt) and middle clicks are left to the
 *   browser, so GitHub's own link behavior stays reachable.
 */

const STYLE_ID = 'gp-gallery-style';
const DOWNLOAD_CLASS = 'gp-download-btn';
/** Grace period for the pointer to travel from the image onto the button. */
const DOWNLOAD_HIDE_MS = 140;

let installed = false;

let downloadButton = null;
let downloadNode = null;
let downloadTimer = null;

function isSourceEnabled(source, settings) {
  return settings.sources[source.id] !== false;
}

/** The enabled sources of the current settings, in registration order. */
function activeSources(settings) {
  if (!settings.enabled) return [];
  const sources = [];
  const all = listSources();
  for (let index = 0; index < all.length; index += 1) {
    if (isSourceEnabled(all[index], settings)) sources.push(all[index]);
  }
  return sources;
}

/**
 * Keep the injected stylesheet in sync: one cursor rule per enabled source.
 * The images themselves are left untouched — no border, outline or overlay is
 * added to page markup. No enabled source means no stylesheet at all, so a
 * disabled gallery leaves the page byte-identical to stock GitHub.
 */
function paintStyles() {
  const sources = activeSources(getGallerySettings());
  const existing = document.getElementById(STYLE_ID);
  if (!sources.length) {
    if (existing) existing.remove();
    return;
  }
  let css = '';
  for (let index = 0; index < sources.length; index += 1) {
    const selector = sources[index].cursorSelector;
    if (!selector) continue;
    css += `${selector} { cursor: zoom-in; }\n`;
  }
  const style = existing || el('style');
  style.id = STYLE_ID;
  if (style.textContent !== css) style.textContent = css;
  if (!existing) document.head.appendChild(style);
}

/** Container + source of the gallery set the image belongs to, or null. */
function locate(node, settings) {
  const sources = activeSources(settings);
  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    const container = resolveContainer(source, node);
    if (container) return { source, container };
  }
  return null;
}

/**
 * Swap in the full-size original once it is confirmed to load; a URL that
 * cannot be fetched is dropped so the viewer never shows a broken image.
 */
async function upgradeImage(item) {
  const full = item.fullSrc;
  if (!full || full === item.src) return null;
  const ok = await new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = full;
  });
  return ok ? full : null;
}

function openGallery(entries, index, settings) {
  hideDownloadButton();
  const images = [];
  for (let i = 0; i < entries.length; i += 1) images.push(entries[i].image);
  openViewer({
    images,
    index,
    loop: settings.loop,
    thumbnails: settings.thumbnails,
    download: settings.download,
    maxZoom: settings.maxZoom,
    resolveImage: settings.upgradeFullSize ? upgradeImage : null,
  });
}

function cancelDownloadHide() {
  if (downloadTimer) {
    clearTimeout(downloadTimer);
    downloadTimer = null;
  }
}

function hideDownloadButton() {
  cancelDownloadHide();
  downloadNode = null;
  if (downloadButton) downloadButton.hidden = true;
}

function scheduleDownloadHide() {
  cancelDownloadHide();
  downloadTimer = setTimeout(hideDownloadButton, DOWNLOAD_HIDE_MS);
}

/** Drop the element entirely: GitHub replaces `<body>` on soft navigation. */
function removeDownloadButton() {
  cancelDownloadHide();
  downloadNode = null;
  if (downloadButton) downloadButton.remove();
  downloadButton = null;
}

function ensureDownloadButton() {
  if (downloadButton && downloadButton.isConnected) return downloadButton;
  const button = el('button', DOWNLOAD_CLASS);
  button.type = 'button';
  button.hidden = true;
  button.innerHTML = VIEWER_ICONS.download;
  button.addEventListener('pointerenter', cancelDownloadHide);
  button.addEventListener('pointerleave', scheduleDownloadHide);
  button.addEventListener('click', onDownloadClick);
  document.body.appendChild(button);
  downloadButton = button;
  return button;
}

function positionDownloadButton() {
  if (!downloadButton || !downloadNode) return;
  const rect = downloadNode.getBoundingClientRect();
  const size = downloadButton.offsetWidth || 30;
  const margin = 8;
  if (rect.width < size || rect.height < size || rect.bottom < 0 || rect.top > window.innerHeight) {
    hideDownloadButton();
    return;
  }
  const top = Math.max(margin, Math.min(window.innerHeight - size - margin, rect.top + margin));
  const left = Math.max(margin, Math.min(window.innerWidth - size - margin, rect.right - size - margin));
  downloadButton.style.top = `${Math.round(top)}px`;
  downloadButton.style.left = `${Math.round(left)}px`;
}

function showDownloadButton(node) {
  const button = ensureDownloadButton();
  cancelDownloadHide();
  downloadNode = node;
  const label = t('viewer.download');
  button.title = label;
  button.setAttribute('aria-label', label);
  button.hidden = false;
  positionDownloadButton();
}

function onDownloadClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const node = downloadNode;
  hideDownloadButton();
  if (!node) return;
  const src = node.currentSrc || node.src || '';
  if (src) void downloadImage(src);
}

/** Keep the button while the pointer is on it or on the image's own link. */
function isDownloadHover(node) {
  if (!(node instanceof Node)) return false;
  if (downloadButton && downloadButton.contains(node)) return true;
  const anchor = downloadNode?.closest('a');
  return !!(anchor && anchor.contains(node));
}

function onPointerOver(event) {
  if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  // A React re-render can replace the image under the pointer without a
  // pointerout, leaving the button pinned over content that is gone.
  if (downloadNode && !downloadNode.isConnected) hideDownloadButton();
  const target = event.target;
  if (!(target instanceof Element) || isOwnUiChrome(target)) return;
  const node = target.closest('img');
  if (!node) {
    if (downloadNode && isDownloadHover(target)) cancelDownloadHide();
    return;
  }
  if (node === downloadNode) {
    cancelDownloadHide();
    return;
  }
  if (node.closest('a.anchor')) {
    hideDownloadButton();
    return;
  }
  const settings = getGallerySettings();
  if (!settings.enabled || !settings.download) {
    hideDownloadButton();
    return;
  }
  try {
    const hit = locate(node, settings);
    if (!hit) {
      hideDownloadButton();
      return;
    }
    const entries = collectGallery(hit.container, hit.source, settings);
    if (matchIndex(entries, node) < 0) {
      hideDownloadButton();
      return;
    }
    showDownloadButton(node);
  } catch (error) {
    hideDownloadButton();
    logWarn(Codes.GALLERY_DOWNLOAD, 'could not show the image download button', {
      error,
      src: node.getAttribute('src'),
    });
  }
}

function onPointerOut(event) {
  if (!downloadNode) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const surface = downloadNode.closest('a') || downloadNode;
  if (target !== downloadNode && !surface.contains(target)) return;
  if (isDownloadHover(event.relatedTarget)) return;
  scheduleDownloadHide();
}

function onClick(event) {
  const settings = getGallerySettings();
  if (!settings.enabled) return;
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target;
  if (!(target instanceof Element) || isOwnUiChrome(target)) return;
  const node = target.closest('img');
  if (!node || node.closest('a.anchor')) return;
  try {
    const hit = locate(node, settings);
    if (!hit) return;
    const entries = collectGallery(hit.container, hit.source, settings);
    const index = matchIndex(entries, node);
    if (index < 0) return;
    event.preventDefault();
    event.stopPropagation();
    openGallery(entries, index, settings);
  } catch (error) {
    logWarn(Codes.GALLERY_FAILED, 'could not open the image gallery', {
      error,
      src: node.getAttribute('src'),
    });
  }
}

function install() {
  if (installed) return;
  installed = true;
  // Capture phase: GitHub's own delegated handlers must never see the click.
  document.addEventListener('click', onClick, true);
  document.addEventListener('pointerover', onPointerOver, true);
  document.addEventListener('pointerout', onPointerOut, true);
  window.addEventListener('scroll', hideDownloadButton, true);
  window.addEventListener('resize', hideDownloadButton);
}

/** Apply the current settings: install listeners and repaint the stylesheet. */
export function applyGallerySettings() {
  install();
  paintStyles();
  hideDownloadButton();
}

/** Boot the gallery feature (idempotent). */
export function initGalleryFeature() {
  install();
  paintStyles();
  on('settings:gallery', applyGallerySettings);
  watchNavigation(removeDownloadButton);
}
