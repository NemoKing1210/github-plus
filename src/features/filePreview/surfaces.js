import { PREVIEW_MAX_SIBLINGS } from '../../core/constants.js';
import { fileTarget, resolveFileTarget } from '../../utils/fileTarget.js';

/**
 * The repository listing is the only place a preview button is injected: each
 * file row can open the preview, and the rows around it become the sibling
 * set the modal navigates. Folders have no raw address, so they are skipped.
 */
export const PREVIEW_SURFACE = {
  containers: ['[data-testid="directory-content"]'],
  rows: 'tr.react-directory-row',
  header: 'table thead tr',
  columnLabelKey: 'preview.column',
};

/** The branch or tag the page is showing, when GitHub renders its selector. */
export function currentRef() {
  const selector = document.querySelector('[data-testid="anchor-button"]');
  return (selector?.textContent || '').trim();
}

function resolveRow(row) {
  const link = row.querySelector('a[href*="/blob/"]');
  if (!link) return null;
  const target = fileTarget(link.getAttribute('href') || '', location.href, currentRef());
  if (!target) return null;
  return {
    row,
    name: (link.textContent || '').trim() || target.name,
    file: {
      name: (link.textContent || '').trim() || target.name,
      href: target.href,
      rawUrl: target.rawUrl,
      relative: target.relative,
      ref: currentRef(),
    },
  };
}

/**
 * File set for the row's directory, in DOM order, capped so a huge directory
 * cannot build an unbounded list. Null when the row is not a file row.
 * @param {Element} row
 * @returns {{files: Array<object>, index: number} | null}
 */
export function siblingsForRow(row) {
  const container = row?.closest(PREVIEW_SURFACE.containers[0]);
  if (!container) return null;
  const group = row.getAttribute('data-gp-tree-owner') || '';
  const rows = container.querySelectorAll(PREVIEW_SURFACE.rows);
  const files = [];
  let index = -1;
  for (let i = 0; i < rows.length; i += 1) {
    // A folder tree row belongs to the folder that owns it; the page's own
    // rows have no owner, so navigation never crosses directory boundaries.
    if ((rows[i].getAttribute('data-gp-tree-owner') || '') !== group) continue;
    const found = resolveRow(rows[i]);
    if (!found) continue;
    if (files.length < PREVIEW_MAX_SIBLINGS) {
      if (found.row === row) index = files.length;
      files.push(found.file);
    } else if (found.row === row) {
      // The clicked row is past the cap: no set to navigate.
      return null;
    }
  }
  return index < 0 ? null : { files, index };
}

/**
 * Resolve a listing row for injection; null for folders and anything that is
 * not a file row.
 * @param {Element} row
 * @returns {{row: Element, name: string, file: object} | null}
 */
export function resolvePreviewRow(row) {
  return resolveRow(row);
}

/**
 * The file behind a node inside a listing row's name link or a file link in
 * rendered markdown, plus that link. Null for folders, other columns, links
 * that point at no file and anything outside those surfaces.
 * @param {Node} node
 * @returns {{name: string, file: object, link: Element,
 *   source: 'listing'|'markdown', row?: Element} | null}
 */
export function resolvePreviewLink(node) {
  const link = node instanceof Element ? node.closest('a[href]') : null;
  if (!link) return null;
  const row = link.closest(PREVIEW_SURFACE.rows);
  if (row && row.closest(PREVIEW_SURFACE.containers[0])) {
    // Only the row's name link counts, not its commit or other columns.
    if (!(link.getAttribute('href') || '').includes('/blob/')) return null;
    const found = resolveRow(row);
    return found ? { ...found, link, source: 'listing' } : null;
  }
  const target = resolveFileTarget(node);
  if (!target || target.source !== 'markdown') return null;
  return {
    name: target.name,
    file: {
      name: target.name,
      href: target.href,
      rawUrl: target.rawUrl,
      relative: target.relative,
      ref: currentRef(),
    },
    link,
    source: 'markdown',
  };
}
