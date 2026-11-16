import { ACTION_ICONS } from '../../ui/icons.js';
import { t } from '../../i18n/index.js';

/** Translation button with its glyph and label span. */
export function createButton(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gp-translate-btn';
  button.setAttribute('data-gp-translate-ui', '');
  button.innerHTML = ACTION_ICONS.translate;
  const span = document.createElement('span');
  span.className = 'gp-translate-btn__label';
  span.textContent = label || t('translate.button');
  button.appendChild(span);
  return button;
}

/** Write the button's visual state, label and optional progress count. */
export function setButtonState(button, state, { label, count } = {}) {
  if (!button) return;
  button.dataset.gpTranslateState = state;
  if (state === 'loading') button.setAttribute('aria-busy', 'true');
  else button.removeAttribute('aria-busy');
  const span = button.querySelector('.gp-translate-btn__label');
  if (!span) return;
  const text = label === undefined ? span.textContent : label;
  span.textContent = count === undefined || count === null || count === ''
    ? text
    : `${text} · ${count}`;
}

function findBar(container) {
  const previous = container.previousElementSibling;
  return previous && previous.classList && previous.classList.contains('gp-translate-bar')
    ? previous
    : null;
}

/**
 * Put the translate control into a page header, or into our own bar right
 * before the container when no header is available. Idempotent.
 */
export function ensureChrome(container, { header, button } = {}) {
  const control = button || createButton(t('translate.button'));
  let bar = findBar(container);
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'gp-translate-bar';
    bar.setAttribute('data-gp-translate-ui', '');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', t('translate.barLabel'));
    if (container.parentNode) container.parentNode.insertBefore(bar, container);
  }
  if (header) {
    if (control.parentElement !== header) header.appendChild(control);
  } else if (control.parentElement !== bar) {
    bar.insertBefore(control, bar.firstChild);
  }
  return { button: control, bar };
}

/** Remove the button and the bar owned by a container state. */
export function removeChrome(container, state) {
  if (state && state.button && state.button.parentNode) state.button.remove();
  const bar = state && state.bar ? state.bar : findBar(container);
  if (bar && bar.classList && bar.classList.contains('gp-translate-bar')) bar.remove();
}

/** Write or clear the bar's status text. */
export function setBarStatus(container, text, { error = false } = {}) {
  let bar = findBar(container);
  if (!bar) {
    if (!text) return;
    bar = ensureChrome(container).bar;
  }
  let status = bar.querySelector('.gp-translate-status');
  if (!text) {
    if (status) status.remove();
    return;
  }
  if (!status) {
    status = document.createElement('span');
    status.className = 'gp-translate-status';
    status.setAttribute('data-gp-translate-ui', '');
    bar.appendChild(status);
  }
  status.classList.toggle('is-error', error);
  status.textContent = text;
}

/** A translated copy shown under the original block in below mode. */
export function createResultBox(html) {
  const box = document.createElement('div');
  box.className = 'gp-translate-result';
  box.setAttribute('data-gp-translate-ui', '');
  box.innerHTML = html;
  return box;
}
