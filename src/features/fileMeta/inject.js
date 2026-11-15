import { t } from '../../i18n/index.js';
import { VIEWER_ICONS } from '../../ui/icons.js';
import { el } from '../../utils/dom.js';

const META_CLASS = 'gp-file-meta';
const CELL_CLASS = 'gp-file-meta-cell';
const HEAD_CLASS = 'gp-file-meta-head';

/**
 * The size/download strip that goes into the column. It is our own node,
 * inserted into our own cell, never over GitHub's markup.
 * @param {{name: string, showSize: boolean, showDownload: boolean, onDownload: () => void}} options
 */
export function renderMeta({ name, showSize, showDownload, onDownload }) {
  const meta = el('span', META_CLASS);
  if (showSize) {
    const size = el('span', 'gp-file-size');
    size.hidden = true;
    meta.appendChild(size);
  }
  if (showDownload) {
    const button = el('button', 'gp-file-download');
    button.type = 'button';
    const label = t('files.downloadFile', { name: name || t('files.download') });
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = VIEWER_ICONS.download;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onDownload();
    });
    meta.appendChild(button);
  }
  return meta;
}

/**
 * Append the new last cell of a listing row. A file row passes its strip;
 * every other row (a folder, a submodule) passes nothing and keeps the cell
 * empty, so all rows share the same column count. Returns the cell, which
 * `clearMeta()` removes.
 */
export function placeCell(row, meta = null) {
  const cell = el('td', CELL_CLASS);
  if (meta) cell.appendChild(meta);
  row.appendChild(cell);
  return cell;
}

/**
 * Label the new column in the table header; idempotent per header row. The
 * label stays in the DOM for assistive tech but is not painted: GitHub keeps
 * its own header row collapsed with `font-size: 0`, and `app.css` does the
 * same, so the listing does not gain a header band.
 */
export function placeHead(headRow, label) {
  if (!headRow || headRow.querySelector(`.${HEAD_CLASS}`)) return;
  const head = el('th', HEAD_CLASS, label);
  head.scope = 'col';
  headRow.appendChild(head);
}

/** Fill in a size that arrived after the strip was rendered. */
export function setMetaSize(meta, text) {
  const size = meta.querySelector('.gp-file-size');
  if (!size || !text) return;
  size.textContent = text;
  size.hidden = false;
}

/** Remove every cell, strip and header label the feature added. */
export function clearMeta() {
  const cells = document.querySelectorAll(`.${CELL_CLASS}`);
  for (let index = 0; index < cells.length; index += 1) cells[index].remove();
  const strips = document.querySelectorAll(`.${META_CLASS}`);
  for (let index = 0; index < strips.length; index += 1) strips[index].remove();
  const heads = document.querySelectorAll(`.${HEAD_CLASS}`);
  for (let index = 0; index < heads.length; index += 1) heads[index].remove();
}
