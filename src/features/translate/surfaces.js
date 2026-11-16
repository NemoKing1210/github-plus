import { getTranslateSettings } from '../../core/settings.js';
import { isOwnUi, toArray } from '../../utils/dom.js';

const SKIP_MARKDOWN = '.gp-preview-overlay, .gp-preview__md, [data-gp-translate-ui], .previewable-comment-form';

/**
 * The slot GitHub renders beside the repository README nav for header actions.
 * The class suffix is hashed, so only the stable prefix is matched.
 */
export const README_HEADER_SLOT = '[class*="readmeHeaderSlot"]';

/** The README header slot above this container's page, or null. */
function readmeHeader(container) {
  let scope = container.parentElement;
  while (scope && scope !== document.body) {
    if (scope.matches && scope.matches(README_HEADER_SLOT)) return scope;
    const slot = scope.querySelector ? scope.querySelector(README_HEADER_SLOT) : null;
    if (slot) return slot;
    scope = scope.parentElement;
  }
  return null;
}

function markdownHeader(container) {
  const comment = container.closest('.js-comment, .timeline-comment, .review-comment');
  if (comment) {
    const header = comment.querySelector('.timeline-comment-header, [data-testid="comment-header"]');
    if (header) return header;
  }
  const pane = container.closest('#repos-split-pane-content');
  if (pane) {
    const filename = pane.querySelector('[data-testid="breadcrumbs-filename"]');
    if (filename) {
      const header = filename.closest('header, [data-testid="file-header"]');
      if (header) return header;
    }
  }
  const release = container.closest('.release');
  if (release) {
    const header = release.querySelector('.release-header');
    if (header) return header;
  }
  return readmeHeader(container);
}

function commitHeader(container) {
  return container.closest('header, [data-testid="commit-header"]');
}

const SURFACES = [
  {
    id: 'markdown',
    labelKey: 'translate.surfaceMarkdown',
    hintKey: 'translate.surfaceMarkdownHint',
    containers: ['.markdown-body'],
    roots: ['main', '[role="main"]'],
    headerFor: markdownHeader,
    skip: (node) => !!node.closest(SKIP_MARKDOWN) || isOwnUi(node),
  },
  {
    id: 'plaintext',
    labelKey: 'translate.surfacePlaintext',
    hintKey: 'translate.surfacePlaintextHint',
    containers: ['.react-code-lines'],
    roots: ['main', '[role="main"]'],
    headerFor: markdownHeader,
    // A syntax-highlighted file has no `html-div` lines and is left alone.
    skip: (node) => isOwnUi(node) || !node.querySelector('.react-file-line.html-div'),
    plain: true,
  },
  {
    id: 'commits',
    labelKey: 'translate.surfaceCommits',
    hintKey: 'translate.surfaceCommitsHint',
    containers: ['[data-testid="commit-message"]', '.commit-title', '.commit-desc'],
    roots: ['main'],
    headerFor: commitHeader,
    skip: (node) => isOwnUi(node),
  },
  {
    id: 'titles',
    labelKey: 'translate.surfaceTitles',
    hintKey: 'translate.surfaceTitlesHint',
    containers: ['[data-testid="issue-title"]', '.js-issue-title', '[data-testid="pr-title"]'],
    roots: ['main'],
    headerFor: (container) => container.parentElement,
    skip: (node) => isOwnUi(node),
  },
  {
    id: 'preview',
    labelKey: 'translate.surfacePreview',
    hintKey: 'translate.surfacePreviewHint',
    containers: ['.gp-preview-overlay .gp-preview__md'],
    roots: [],
    headerFor: (container) => {
      const overlay = container.closest('.gp-preview-overlay');
      return overlay ? overlay.querySelector('.gp-preview__extra') : null;
    },
    skip: () => false,
  },
];

/** Every registered surface, in settings order. */
export function listSurfaces() {
  return SURFACES.slice();
}

/** The preview surface definition. */
export function previewSurface() {
  return SURFACES.find((surface) => surface.id === 'preview');
}

/** The surface whose switch is on. */
export function enabledSurfaces() {
  const switches = getTranslateSettings().surfaces || {};
  return SURFACES.filter((surface) => switches[surface.id] !== false);
}

function inDocumentOrder(nodes) {
  return nodes.sort((a, b) => (
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ));
}

/** Live containers of one surface, in document order. */
export function findContainers(surface) {
  if (!surface) return [];
  const seen = new Set();
  const found = [];
  surface.roots.forEach((rootSelector) => {
    toArray(document.querySelectorAll(rootSelector)).forEach((root) => {
      surface.containers.forEach((selector) => {
        toArray(root.querySelectorAll(selector)).forEach((node) => {
          if (seen.has(node) || !node.isConnected) return;
          if (!node.textContent.trim()) return;
          if (surface.skip && surface.skip(node)) return;
          seen.add(node);
          found.push(node);
        });
      });
    });
  });
  return inDocumentOrder(found);
}

/** Unique root selectors of every enabled non-preview surface. */
export function surfaceRoots() {
  const roots = [];
  enabledSurfaces().forEach((surface) => {
    if (surface.id === 'preview') return;
    surface.roots.forEach((selector) => {
      if (roots.indexOf(selector) === -1) roots.push(selector);
    });
  });
  return roots;
}

/** The surface a live container belongs to, or null. */
export function surfaceForContainer(container) {
  if (!container) return null;
  if (container.matches('.gp-preview__md') && container.closest('.gp-preview-overlay')) {
    return previewSurface();
  }
  const surfaces = enabledSurfaces();
  for (let index = 0; index < surfaces.length; index += 1) {
    const surface = surfaces[index];
    if (surface.id === 'preview') continue;
    if (!surface.containers.some((selector) => container.matches(selector))) continue;
    if (surface.skip && surface.skip(container)) continue;
    return surface;
  }
  return null;
}

/** Header element a surface wants the translate button in, or null. */
export function headerFor(container, surface) {
  if (!container || !surface || typeof surface.headerFor !== 'function') return null;
  return surface.headerFor(container) || null;
}

/** The markdown body inside the open quick preview. */
export function previewContainer() {
  return document.querySelector('.gp-preview-overlay .gp-preview__md');
}
