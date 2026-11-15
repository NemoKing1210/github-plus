import { rawUrlFor } from '../../utils/fileTarget.js';

/**
 * Where GitHub lists files with a link that can be resolved to a raw address.
 *
 * Each surface is independent: a selector that stops matching after a GitHub
 * redesign turns that one surface into a no-op and leaves the other alone.
 * `rows` is a selector inside each container, `header` the selector of the
 * table header row that gets the extra column's label, and `columnLabelKey`
 * the i18n key for that label.
 * `resolve(row)` returns `{ name, rawUrl }` for a file row and `{}` for any
 * other row of the listing, which still gets the (empty) column cell.
 */
function cleanText(node) {
  return (node?.textContent || '').trim();
}

function pageBase() {
  return typeof location === 'undefined' ? undefined : location.href;
}

export const SURFACES = [
  {
    id: 'repo-tree',
    containers: ['[data-testid="directory-content"]'],
    rows: 'tr.react-directory-row',
    header: 'table thead tr',
    columnLabelKey: 'files.column',
    resolve(row) {
      const link = row.querySelector('a[href*="/blob/"]');
      if (!link) return {};
      const rawUrl = rawUrlFor(link.getAttribute('href') || '', pageBase());
      if (!rawUrl) return {};
      return { name: cleanText(link), rawUrl };
    },
  },
];
