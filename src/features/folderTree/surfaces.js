import { toArray } from '../../utils/dom.js';
import { folderKey } from './api.js';

/** The repository listing and the rows GitHub renders into it. */
export const LISTING_SELECTOR = '[data-testid="directory-content"]';
export const ROW_SELECTOR = 'tr.react-directory-row';
export const NOTE_CLASS = 'gp-tree-note-row';

/** GitHub's own rows of one listing, in document order. */
export function listingRows(container) {
  if (!container) return [];
  return toArray(container.querySelectorAll(`tbody > ${ROW_SELECTOR}`));
}

/** GitHub's own rows only; our nested rows carry `data-gp-tree-owner`. */
export function topLevelRows(container) {
  return listingRows(container).filter((row) => !row.hasAttribute('data-gp-tree-owner'));
}

/**
 * The name link behind a listing row.
 * @param {Element} row
 * @returns {{row: Element, link: Element, name: string, kind: 'folder'|'file',
 *   href: string, key: string} | null}
 */
export function rowTarget(row) {
  if (!(row instanceof Element) || row.classList.contains(NOTE_CLASS)) return null;
  const column = row.querySelector('.react-directory-filename-column');
  const link = column?.querySelector('a[href]') || row.querySelector('td a[href]');
  if (!link) return null;
  const href = link.getAttribute('href') || '';
  const label = link.getAttribute('aria-label') || '';
  // A submodule is a link into another repository, not a folder we can list.
  const folder = /\/tree\//.test(href) && !/\(submodule\)/i.test(label);
  const file = /\/blob\//.test(href);
  if (!folder && !file) return null;
  const path = folderKey(href);
  return {
    row,
    link,
    name: (link.textContent || '').trim().replace(/\/+$/, ''),
    kind: folder ? 'folder' : 'file',
    href: path,
    key: folder ? path : '',
  };
}

/**
 * The address of an entry inside a folder, derived from the folder's own
 * address so the branch or tag is carried over unchanged.
 * @param {string} parentHref
 * @param {string} name
 * @param {'folder'|'file'} kind
 * @returns {string}
 */
export function childHref(parentHref, name, kind) {
  const parent = folderKey(parentHref).replace(/\/+$/, '');
  if (!parent) return '';
  const segment = String(name)
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
  if (!segment) return '';
  if (kind === 'folder') return `${parent}/${segment}`;
  return `${parent.replace('/tree/', '/blob/')}/${segment}`;
}
