import { getTranslateSettings } from '../../core/settings.js';
import { isOwnUi, toArray } from '../../utils/dom.js';

const SKIP_MARKDOWN = '.gp-preview-overlay, .gp-preview__md, [data-gp-translate-ui], .previewable-comment-form';

/**
 * The slot GitHub renders beside the repository README nav for header actions.
 * The class suffix is hashed, so only the stable prefix is matched.
 */
export const README_HEADER_SLOT = '[class*="readmeHeaderSlot"]';

/** GitHub's row of comment/description header actions, where the edit control lives. */
export const COMMENT_ACTION_ROW = '.timeline-comment-actions, [data-testid="comment-header-actions"],'
  + ' [class*="ActionsButtonsContainer"]';

/**
 * The description edit block of the new issue/PR shell: "Edited", the edit
 * pencil and their tooltip, all in one row above the body. The class suffix is
 * hashed, so only the stable prefix is matched.
 */
export const EDIT_METADATA_ROW = '[class*="editMetadata"]';

/** Action rows whose neighbouring buttons are GitHub's compact (28px) ones. */
export const COMPACT_ACTION_ROW = `${EDIT_METADATA_ROW}, [class*="ActionsButtonsContainer"],`
  + ' [class*="react-blob-header-edit-and-raw-actions"]:not([class*="-combined"])';

/**
 * The new issue/PR page header's regular actions, where GitHub's own copy-link
 * icon button lives. Class suffixes are hashed, so only the stable
 * `data-component` hook is matched; the context-area row is its narrow-screen
 * twin and carries a duplicate of the same actions.
 */
export const PAGE_HEADER_ACTIONS = '[data-component="PH_Actions"],'
  + ' [data-component="PageHeader.Actions"]';

/** The description card of the new issue and pull request shell. */
export const ISSUE_BODY = '[data-testid="issue-body"]';

/** The compact icon actions row in that card's header (the kebab menu lives there). */
const BODY_ACTION_ROW = '[class*="actionsSection"]';

/**
 * The blob file header's own actions row (Raw, copy, download and the edit
 * pencil). The `-combined` sibling only holds the kebab menu.
 */
const BLOB_ACTION_ROW = '[class*="react-blob-header-edit-and-raw-actions"]:not([class*="-combined"])';

const EDIT_CONTROL = [
  'a[href$="/edit"]',
  'a[aria-label*="Edit" i]',
  'button[aria-label*="Edit" i]',
  'summary[aria-label*="Edit" i]',
  'button[data-dd-action-name*=".edit"]',
  '[data-testid="edit-button"]',
].join(', ');

function editControl(scope) {
  const control = scope.querySelector ? scope.querySelector(EDIT_CONTROL) : null;
  if (!control || control.closest('form, .previewable-comment-form')) return null;
  return control;
}

/**
 * The element GitHub lays its own header controls out in. The classic
 * `.timeline-comment-actions` is a wrapper around one flex row, so inserting
 * into the wrapper stacks the button above that row instead of beside the
 * edit and kebab controls.
 */
function actionRow(row) {
  if (!row || !row.matches('.timeline-comment-actions')) return row;
  const inner = row.firstElementChild;
  return inner && inner.matches('[class*="d-flex"]') ? inner : row;
}

const actionRows = new WeakSet();
// Header → the icon-button size it lays out ('small' 28px or 'medium' 32px).
const iconRows = new WeakMap();

/** Remember a header that is really a row of GitHub's own header actions. */
function markActionRow(node) {
  if (node) actionRows.add(node);
  return node;
}

/** Remember a header that should host a bare icon button. */
function markIconRow(node, size = 'medium') {
  if (node) iconRows.set(node, size);
  return node;
}

/** Whether a header element is a row of GitHub header actions. */
export function isActionRow(node) {
  return Boolean(node) && actionRows.has(node);
}

/** Whether a header hosts icon-only buttons, like the page-header actions. */
export function isIconActionRow(node) {
  return Boolean(node) && iconRows.has(node);
}

/** The icon-button size a header lays out, or null when it is not an icon row. */
export function iconActionSize(node) {
  return (node && iconRows.get(node)) || null;
}


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

/**
 * The row that holds GitHub's own header actions near this container, found by
 * the action row itself or by the edit control it lives with. New issue pages
 * render their description without comment classes, so the edit control is the
 * stable hook.
 */
function actionsNear(container) {
  let scope = container.parentElement;
  for (let depth = 0; scope && scope !== document.body && depth < 8; depth += 1) {
    // A wider scope that holds other bodies is the timeline, not this card;
    // binding there would put the button beside another comment's edit control.
    if (scope.querySelectorAll('.markdown-body').length > 1) break;
    const row = scope.querySelector(COMMENT_ACTION_ROW);
    if (row) return actionRow(row);
    const metadata = scope.querySelector(EDIT_METADATA_ROW);
    if (metadata) return metadata;
    const edit = editControl(scope);
    if (edit) return actionRow(edit.closest(COMMENT_ACTION_ROW)) || edit.parentElement;
    scope = scope.parentElement;
  }
  return null;
}

function markdownHeader(container) {
  const comment = container.closest('.js-comment, .timeline-comment, .review-comment');
  if (comment) {
    // The button belongs beside the edit control, not at the start of the header.
    const actions = comment.querySelector(COMMENT_ACTION_ROW);
    if (actions) return markActionRow(actionRow(actions));
    const header = comment.querySelector('.timeline-comment-header, [data-testid="comment-header"]');
    if (header) return header;
  }
  const pane = container.closest('#repos-split-pane-content');
  if (pane) {
    // The current file view has no `<header>` around the filename; its actions
    // row is the stable hook.
    const actions = pane.querySelector(BLOB_ACTION_ROW);
    if (actions) return markActionRow(actions);
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
  const body = container.closest(ISSUE_BODY);
  if (body) {
    // The description card's header row holds GitHub's own compact icon
    // actions, so the action joins them as a bare icon.
    const actions = body.querySelector(BODY_ACTION_ROW);
    if (actions) return markIconRow(actions, 'small');
  }
  return readmeHeader(container) || markActionRow(actionsNear(container));
}

function commitHeader(container) {
  return container.closest('header, [data-testid="commit-header"]');
}

/**
 * The issue/PR title's action row: the page header's own icon actions, beside
 * the copy-link control, so the button takes GitHub's icon-button shape there
 * instead of sitting inside the heading.
 */
function titleHeader(container) {
  const page = container.closest('[data-component="PageHeader"]');
  const actions = page && page.querySelector(PAGE_HEADER_ACTIONS);
  // The inner flex row is what lays the icon buttons out; the wrapper itself
  // would stack the action under them.
  const row = actions && (actions.querySelector('[class*="menuActionsContainer"]') || actions);
  if (row) return markIconRow(row);
  return container.parentElement;
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
    headerFor: titleHeader,
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
  // GitHub nests one `.markdown-body` inside another on an issue or pull
  // request description; the inner copy is the same content, not a second
  // container — decorating both would stack two controls over one body.
  return inDocumentOrder(
    found.filter((node) => !found.some((other) => other !== node && other.contains(node))),
  );
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
