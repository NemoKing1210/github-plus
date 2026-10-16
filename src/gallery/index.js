import { on } from '../core/bus.js';
import { Codes, logWarn } from '../core/debug.js';
import { getGallerySettings } from '../core/settings.js';
import { openViewer } from '../ui/viewer.js';
import { el, isOwnUi } from '../utils/dom.js';
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
 *   registry (no per-image listeners, no DOM mutation, so a React re-render
 *   cannot strip it and a scan loop is never needed).
 * - A single capture-phase click listener resolves the source, collects the
 *   set and opens the viewer; it walks the live DOM on every click, so
 *   content that arrived after load behaves exactly like content that was
 *   server-rendered.
 * - Modified clicks (Ctrl/Cmd/Shift/Alt) and middle clicks are left to the
 *   browser, so GitHub's own link behavior stays reachable.
 */

const STYLE_ID = 'gp-gallery-style';
const HOVER_OUTLINE = 'outline: 2px solid var(--gp-accent, #1f6feb); outline-offset: 1px;';

let installed = false;

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
 * Keep the injected stylesheet in sync: one cursor/hover rule per enabled
 * source. No enabled source means no stylesheet at all, so a disabled
 * gallery leaves the page byte-identical to stock GitHub.
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
    css += `${selector} { cursor: zoom-in; }\n${selector}:hover { ${HOVER_OUTLINE} }\n`;
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
  const images = [];
  for (let i = 0; i < entries.length; i += 1) images.push(entries[i].image);
  openViewer({
    images,
    index,
    loop: settings.loop,
    thumbnails: settings.thumbnails,
    maxZoom: settings.maxZoom,
    resolveImage: settings.upgradeFullSize ? upgradeImage : null,
  });
}

function onClick(event) {
  const settings = getGallerySettings();
  if (!settings.enabled) return;
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target;
  if (!(target instanceof Element) || isOwnUi(target)) return;
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
}

/** Apply the current settings: install listeners and repaint the stylesheet. */
export function applyGallerySettings() {
  install();
  paintStyles();
}

/** Boot the gallery feature (idempotent). */
export function initGalleryFeature() {
  install();
  paintStyles();
  on('settings:gallery', applyGallerySettings);
}
