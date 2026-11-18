/**
 * The places GitHub renders a commit subject. Each surface is independent and
 * degrades to a no-op when a selector stops matching, so a GitHub redesign
 * costs one surface, never the feature.
 */

import { isOwnUi } from '../../utils/dom.js';

function closestCommitAnchors(container) {
  let scope = container;
  for (let depth = 0; depth < 5 && scope; depth += 1) {
    const anchor =
      scope.querySelector('a[href*="/commit/"].Link--secondary') ||
      scope.querySelector('a[href*="/commit/"]');
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
    titleFor: (row) => row.querySelector('a[href*="/commit/"] > span'),
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
    containers: ['[data-testid="latest-commit-details"]'],
    // The block is rendered from a React endpoint after the page shell; the
    // nearest ancestor that also holds a commit link is the reliable hook.
    titleFor: (container) => closestCommitAnchors(container),
    skip: (node) => isOwnUi(node),
  },
];
