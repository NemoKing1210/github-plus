import { isOwnUi } from '../../utils/dom.js';

/**
 * GitHub renders the Issues and Pull Requests lists with one shared React list
 * view, so one container selector covers both the repository lists and the
 * account dashboards. Rows are the container's direct `li` children and the
 * author is the control that filters the list by its login.
 */

export const CONTAINER_SELECTOR = '[data-listview-component="items-list"]';

const AUTHOR_SELECTOR = '[data-testid="author-filter-link"]';

function decodeLogin(value) {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function loginFromHovercard(node) {
  const url = node.getAttribute('data-hovercard-url') || '';
  const match = url.match(/\/users\/([^/?#]+)\/hovercard/);
  return match ? decodeLogin(match[1]) : '';
}

/** Pull-request rows link to `?q=… author:<login>` instead of carrying a hovercard. */
function loginFromHref(node) {
  const href = node.getAttribute('href') || '';
  if (!href) return '';
  try {
    const query = new URL(href, 'https://github.com').searchParams.get('q') || '';
    const match = query.match(/(?:^|\s)author:([^\s]+)/);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

/** The issues row hides a "Filter by author" label inside the button. */
function visibleText(node) {
  let text = '';
  for (let i = 0; i < node.childNodes.length; i += 1) {
    const child = node.childNodes[i];
    if (child.nodeType === 3) {
      text += child.nodeValue;
      continue;
    }
    if (child.nodeType !== 1) continue;
    if (child.getAttribute('aria-hidden') === 'true') continue;
    if (/VisuallyHidden/.test(String(child.className || ''))) continue;
    text += child.textContent;
  }
  return text.trim();
}

/** The author login behind a resolved author control, or '' when unknown. */
export function authorLogin(node) {
  return loginFromHovercard(node) || loginFromHref(node) || visibleText(node);
}

/** The author behind one list row, or null when the row has none. */
export function resolveRowAuthor(row) {
  if (!row || row.tagName !== 'LI' || isOwnUi(row)) return null;
  const node = row.querySelector(AUTHOR_SELECTOR);
  if (!node || isOwnUi(node)) return null;
  const login = authorLogin(node);
  return login ? { node, login } : null;
}

/**
 * GitHub serves `<login>.png` for users and for bot accounts; a GitHub App
 * (`github-actions[bot]`) has no such avatar, and its image removes itself.
 */
export function avatarUrlFor(login) {
  const clean = String(login || '').replace(/\[bot\]$/i, '').trim();
  return clean ? `https://github.com/${encodeURIComponent(clean)}.png?size=40` : '';
}
