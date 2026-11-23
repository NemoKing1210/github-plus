import { ACTION_ICONS } from '../../ui/icons.js';
import { t } from '../../i18n/index.js';
import {
  actionRowLook, COMPACT_ACTION_ROW, iconActionAnchor, iconActionSize, isActionRow,
  README_HEADER_SLOT,
} from './surfaces.js';

const RING_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true">'
  + '<circle class="gp-translate-ring__track" cx="8" cy="8" r="6.5" pathLength="100"></circle>'
  + '<circle class="gp-translate-ring__fill" cx="8" cy="8" r="6.5" pathLength="100"></circle>'
  + '</svg>';

/** Translation button with its glyph, progress ring and label span. */
export function createButton(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gp-translate-btn';
  button.setAttribute('data-gp-translate-ui', '');
  button.innerHTML = ACTION_ICONS.translate;
  const ring = document.createElement('span');
  ring.className = 'gp-translate-ring';
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = RING_SVG;
  button.appendChild(ring);
  const span = document.createElement('span');
  span.className = 'gp-translate-btn__label';
  span.textContent = label || t('translate.button');
  button.appendChild(span);
  return button;
}

/**
 * Write the button's visual state, label and progress. Progress is the ring
 * inside the button, filled by `progress` (0…1): the label never carries
 * counts.
 */
export function setButtonState(button, state, { label, progress } = {}) {
  if (!button) return;
  button.dataset.gpTranslateState = state;
  if (state === 'loading') button.setAttribute('aria-busy', 'true');
  else button.removeAttribute('aria-busy');
  const span = button.querySelector('.gp-translate-btn__label');
  if (span && label !== undefined) span.textContent = label;
  const ring = button.querySelector('.gp-translate-ring');
  const fill = button.querySelector('.gp-translate-ring__fill');
  if (!fill) return;
  const value = typeof progress === 'number' && Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : 0;
  // With nothing settled yet the ring turns as a loader; as soon as a batch
  // lands it becomes the honest filled share.
  if (value === 0) fill.style.removeProperty('stroke-dashoffset');
  else fill.style.strokeDashoffset = String(100 - value * 100);
  if (ring) ring.classList.toggle('is-pending', value === 0);
}

function findBar(container) {
  const previous = container.previousElementSibling;
  return previous && previous.classList && previous.classList.contains('gp-translate-bar')
    ? previous
    : null;
}

/**
 * Put the translate control into a page header, or into our own bar right
 * before the container when no header is available. A header-hosted action
 * gets no bar: its status is reported on the button itself. Idempotent.
 */
export function ensureChrome(container, { header, button } = {}) {
  const control = button || createButton(t('translate.button'));
  if (header) {
    // A bar from an earlier pass must not linger beside a header-hosted action.
    const stale = findBar(container);
    if (stale) stale.remove();
    const actions = isActionRow(header);
    const iconSize = iconActionSize(header);
    // A release action group holds GitHub's own small buttons, so the action
    // there keeps its label as a compact button instead of shrinking to an icon.
    const compact = actions && actionRowLook(header) === 'compact';
    if (control.parentElement !== header) {
      // In GitHub's own action row the button joins the row before the edit
      // control instead of trailing it. A compact icon row keeps its overflow
      // (kebab) menu last, so the action goes in front of the row too.
      if (actions || iconSize === 'small') header.insertBefore(control, header.firstChild);
      else header.appendChild(control);
    }
    // A header that remembers an anchor keeps that element (the kebab menu) last.
    const anchor = iconActionAnchor(header);
    if (anchor && anchor.parentElement === header && control.nextElementSibling !== anchor) {
      header.insertBefore(control, anchor);
    }
    // The README header action sits among GitHub's own buttons and takes their look.
    control.classList.toggle(
      'gp-translate-btn--header',
      !compact && (actions || header.matches(README_HEADER_SLOT)),
    );
    control.classList.toggle('gp-translate-btn--actions', actions && !compact);
    control.classList.toggle('gp-translate-btn--button', compact);
    // The issue/PR header actions are bare icons like GitHub's own controls.
    control.classList.toggle('gp-translate-btn--icon', Boolean(iconSize));
    control.classList.toggle(
      'gp-translate-btn--small',
      compact || (iconSize
        ? iconSize === 'small'
        : header.matches(COMPACT_ACTION_ROW)),
    );
    return { button: control, bar: null };
  }
  let bar = findBar(container);
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'gp-translate-bar';
    bar.setAttribute('data-gp-translate-ui', '');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', t('translate.barLabel'));
    if (container.parentNode) container.parentNode.insertBefore(bar, container);
  }
  if (control.parentElement !== bar) bar.insertBefore(control, bar.firstChild);
  control.classList.remove('gp-translate-btn--header');
  control.classList.remove('gp-translate-btn--actions');
  control.classList.remove('gp-translate-btn--button');
  control.classList.remove('gp-translate-btn--icon');
  control.classList.remove('gp-translate-btn--small');
  return { button: control, bar };
}

/** Remove the button and the bar owned by a container state. */
export function removeChrome(container, state) {
  if (state && state.button && state.button.parentNode) state.button.remove();
  const bar = state && state.bar ? state.bar : findBar(container);
  if (bar && bar.classList && bar.classList.contains('gp-translate-bar')) bar.remove();
}

/** A translated copy shown under the original block in below mode. */
export function createResultBox(html, { preformatted = false } = {}) {
  const box = document.createElement('div');
  box.className = preformatted
    ? 'gp-translate-result gp-translate-result--plain'
    : 'gp-translate-result';
  box.setAttribute('data-gp-translate-ui', '');
  box.innerHTML = html;
  return box;
}
