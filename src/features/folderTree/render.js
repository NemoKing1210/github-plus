import { FOLDER_TREE_INDENT_PX } from '../../core/constants.js';
import { el } from '../../utils/dom.js';
import { childHref } from './surfaces.js';
import { folderKey } from './api.js';

/**
 * Rows we inject into the listing. They copy only the stable hooks GitHub's
 * own rows expose (`react-directory-row`, the name columns, the octicon
 * glyphs and the commit-age container), because the file features read those
 * hooks and decorate a nested row exactly like a native one.
 */
const SVG_NS = 'http://www.w3.org/2000/svg';
/** GitHub pads a listing cell by 16px; each depth adds one indent step. */
const CELL_PADDING_PX = 16;
const FOLDER_ICON = '<path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/>';
const FILE_ICON = '<path d="M3.75 1A1.75 1.75 0 0 0 2 2.75v10.5C2 14.216 2.784 15 3.75 15h8.5A1.75 1.75 0 0 0 14 13.25V5.5L9.5 1H3.75Zm5.25 1.8L12.2 6H9.5a.5.5 0 0 1-.5-.5V2.8Z"/>';
const CHEVRON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.25 3.5 10.5 8l-4.25 4.5"/></svg>';

/** A native GitHub-shaped glyph, hidden by the file-icons feature when it is on. */
function nativeIcon(kind) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute(
    'class',
    kind === 'folder' ? 'octicon octicon-file-directory-fill icon-directory' : 'octicon octicon-file',
  );
  svg.innerHTML = kind === 'folder' ? FOLDER_ICON : FILE_ICON;
  return svg;
}

/** The 20px slot every row gets, so icons stay aligned across folders and files. */
export function buildSlot(child = null) {
  const slot = el('span', 'gp-tree-slot');
  if (child) slot.appendChild(child);
  return slot;
}

/**
 * A disclosure button for a folder row. A delegated listener in the feature
 * handles the click, so a re-created button needs no new listener.
 * @param {{name: string, labels: {expand: string, collapse: string}}} options
 * @returns {HTMLButtonElement}
 */
export function buildExpander({ name, labels }) {
  const button = el('button', 'gp-tree-toggle');
  button.type = 'button';
  button.innerHTML = CHEVRON;
  button.dataset.gpTreeName = name;
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', labels.expand);
  button.title = labels.expand;
  return button;
}

/** Mirror an expand state onto every chevron of a row and the row itself. */
export function updateExpander(row, expanded, labels) {
  row.dataset.gpTreeExpanded = expanded ? 'true' : 'false';
  const toggles = row.querySelectorAll('.gp-tree-toggle');
  for (let index = 0; index < toggles.length; index += 1) {
    const button = toggles[index];
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    button.setAttribute('aria-label', expanded ? labels.collapse : labels.expand);
    button.title = expanded ? labels.collapse : labels.expand;
    button.classList.toggle('is-open', expanded);
  }
}

function nameLink(entry, href) {
  const link = el('a', 'Link--primary', entry.name);
  link.href = href;
  link.title = entry.name;
  link.setAttribute(
    'aria-label',
    entry.type === 'folder' ? `${entry.name}, (Directory)` : entry.name,
  );
  return link;
}

function nameCell(cellClass, colSpan, { entry, href, depth, labels }) {
  const cell = el('td', cellClass);
  cell.colSpan = colSpan;
  cell.style.paddingLeft = `${CELL_PADDING_PX + depth * FOLDER_TREE_INDENT_PX}px`;
  const column = el('div', 'react-directory-filename-column');
  const slot = buildSlot(
    entry.type === 'folder'
      ? buildExpander({ name: entry.name, labels })
      : null,
  );
  const wrapper = el('div', 'overflow-hidden');
  const filename = el('div', 'react-directory-filename-cell');
  const truncate = el('div', 'react-directory-truncate');
  truncate.appendChild(nameLink(entry, href));
  filename.appendChild(truncate);
  wrapper.appendChild(filename);
  column.append(slot, nativeIcon(entry.type), wrapper);
  cell.appendChild(column);
  return cell;
}

function commitCell(commit) {
  const cell = el('td', 'react-directory-row-commit-cell');
  if (commit && commit.message) {
    const wrap = el('div', 'gp-tree-commit');
    const link = el('a', 'gp-tree-commit-link', commit.message);
    link.href = commit.url;
    link.title = commit.title || commit.message;
    wrap.appendChild(link);
    cell.appendChild(wrap);
  }
  return cell;
}

/**
 * A readable fallback for GitHub's `<relative-time>` element, used before the
 * custom element upgrades (and in environments where it never does).
 * @param {string} date
 * @param {number} [now]
 * @returns {string}
 */
export function relativeDate(date, now = Date.now()) {
  const time = Date.parse(date);
  if (!Number.isFinite(time)) return '';
  const seconds = Math.round((time - now) / 1000);
  const absolute = Math.abs(seconds);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  for (let index = 0; index < units.length; index += 1) {
    const [unit, size] = units[index];
    if (absolute >= size || unit === 'second') {
      const value = Math.round(seconds / size);
      try {
        return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(value, unit);
      } catch {
        return '';
      }
    }
  }
  return '';
}

function ageCell(commit) {
  const cell = el('td');
  const age = el('div', 'react-directory-commit-age');
  if (commit && commit.date) {
    const time = document.createElement('relative-time');
    time.setAttribute('datetime', commit.date);
    // GitHub's custom element reformats this when it upgrades; the text keeps
    // the cell readable until then.
    time.textContent = relativeDate(commit.date);
    age.appendChild(time);
  }
  cell.appendChild(age);
  return cell;
}

/**
 * One nested entry row.
 * @param {{entry: {name: string, path: string, type: 'folder'|'file'},
 *   parentHref: string, parentKey: string, depth: number,
 *   commit?: {url: string, date: string, message: string, title: string}|null,
 *   labels: {expand: string, collapse: string}}} options
 * @returns {HTMLTableRowElement}
 */
export function buildRow({ entry, parentHref, parentKey, depth, commit, labels }) {
  const row = el('tr', 'react-directory-row gp-tree-row');
  row.dataset.gpTreeOwner = parentKey;
  row.dataset.gpTreeDepth = String(depth);
  const href = childHref(parentHref, entry.name, entry.type);
  if (entry.type === 'folder') row.dataset.gpTreeKey = folderKey(href);
  row.append(
    nameCell('react-directory-row-name-cell-small-screen', 2, { entry, href, depth, labels }),
    nameCell('react-directory-row-name-cell-large-screen', 1, { entry, href, depth, labels }),
    commitCell(commit),
    ageCell(commit),
  );
  return row;
}

/**
 * A full-width note under a folder: an empty folder or a truncated listing.
 * It is deliberately not a `react-directory-row`, so the file features leave
 * it alone.
 */
export function buildNoteRow({ text, depth, owner, className = '', colSpan = 4 }) {
  const row = el('tr', 'gp-tree-note-row');
  row.dataset.gpTreeOwner = owner;
  row.dataset.gpTreeDepth = String(depth);
  const cell = el('td', `gp-tree-note ${className}`.trim(), text);
  cell.colSpan = colSpan;
  row.appendChild(cell);
  return row;
}
