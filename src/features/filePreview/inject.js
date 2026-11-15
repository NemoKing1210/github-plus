import { t } from '../../i18n/index.js';
import { ACTION_ICONS } from '../../ui/icons.js';
import { eachNode, el } from '../../utils/dom.js';

/**
 * 28×28 eye button, matching GitHub's own icon buttons. The row link's own
 * click must not navigate, hence both stops.
 * @param {{name: string, onOpen: () => void}} options
 * @returns {HTMLButtonElement}
 */
export function renderPreviewButton({ name, onOpen }) {
  const button = el('button', 'gp-file-preview-btn');
  button.type = 'button';
  button.innerHTML = ACTION_ICONS.eye;
  const label = t('preview.button', { name });
  button.title = label;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onOpen();
  });
  return button;
}

/**
 * Append the button's own last cell to a listing row. A folder row gets the
 * same empty cell, so every row keeps the table's column count.
 * @param {Element} row
 * @param {HTMLElement} [button]
 */
export function placeCell(row, button = null) {
  const cell = el('td', 'gp-file-preview-cell');
  if (button) cell.appendChild(button);
  row.appendChild(cell);
  return cell;
}

/** Name the extra column for assistive tech; the header band stays collapsed. */
export function placeHead(headRow, label) {
  let head = headRow.querySelector('.gp-file-preview-head');
  if (!head) {
    head = el('th', 'gp-file-preview-head');
    head.scope = 'col';
    headRow.appendChild(head);
  }
  // Assigning the same text would still fire the container's observer and
  // restart its debounced rescan, forever.
  if (head.textContent !== label) head.textContent = label;
}

/** Remove every injected cell and header label. */
export function clearPreviewCells() {
  eachNode(document.querySelectorAll('.gp-file-preview-cell, .gp-file-preview-head'), (node) => {
    node.remove();
  });
}
