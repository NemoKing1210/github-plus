/**
 * The places GitHub renders a commit subject. Each surface is independent and
 * degrades to a no-op when a selector stops matching, so a GitHub redesign
 * costs one surface, never the feature.
 */

import { isOwnUi } from '../../utils/dom.js';

/** A subject is never a bare hex hash; the short-SHA links are. */
function isShaText(text) {
  return /^[0-9a-f]{7,40}$/i.test(text.trim());
}

function subjectAnchor(scope) {
  const anchors = scope.querySelectorAll('a[href*="/commit/"]');
  for (let i = 0; i < anchors.length; i += 1) {
    if (!isShaText(anchors[i].textContent)) return anchors[i];
  }
  return null;
}

/**
 * The commit list row also carries its short SHA as a commit link inside a
 * button control, so the subject is resolved from the heading first and from
 * any non-button anchor only as a fallback.
 */
function listTitle(row) {
  const heading = row.querySelector('h4 a[href*="/commit/"]');
  if (heading) return heading;
  const anchors = row.querySelectorAll('a[href*="/commit/"]');
  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = anchors[i];
    if (!anchor.closest('[data-component="Button"], button')) return anchor;
  }
  return null;
}

/**
 * Older repository-home markup exposes only the details block, which holds the
 * short SHA; a subject link in a nearby ancestor is the reliable hook.
 */
function nearestSubjectAnchor(container) {
  let scope = container;
  for (let depth = 0; depth < 5 && scope; depth += 1) {
    const anchor = subjectAnchor(scope);
    if (anchor) return anchor;
    scope = scope.parentElement;
  }
  return null;
}

export const SURFACES = [
  {
    id: 'commit-list',
    containers: ['[data-listview-component="items-list"]'],
    rows: '[data-testid="commit-row-item"]',
    titleFor: (row) => listTitle(row),
    skip: (node) => isOwnUi(node),
  },
  {
    id: 'commit-page',
    containers: ['[class*="commitMessageContainer"]'],
    titleFor: (container) =>
      container.firstElementChild?.firstElementChild || container.firstElementChild,
    skip: (node) => isOwnUi(node),
  },
  {
    id: 'classic-commit',
    containers: ['[data-testid="commit-message"]', '.commit-title'],
    titleFor: (container) =>
      container.matches('.commit-title')
        ? container
        : container.querySelector('.commit-title') || container,
    skip: (node) => isOwnUi(node),
  },
  {
    id: 'latest-commit',
    containers: ['[data-testid="latest-commit-html"]', '[data-testid="latest-commit-details"]'],
    titleFor: (container) =>
      container.matches('[data-testid="latest-commit-html"]')
        ? container.querySelector('a[href*="/commit/"]') || container
        : nearestSubjectAnchor(container),
    skip: (node) => isOwnUi(node),
  },
];
