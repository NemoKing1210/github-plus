import { el } from '../../utils/dom.js';

/**
 * Reusable settings controls in GitHub's visual language (see DESIGN.md).
 * Controls are draft-only: they mutate the values the caller hands them and
 * report changes through callbacks. Nothing here reads or writes settings.
 */

const ICONS = {
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z"/><path d="M13.125 8.25h.008v.008h-.008V8.25Z"/></svg>',
  general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/></svg>',
  backup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 7.5 7.5 12m4.5-4.5V21"/></svg>',
  about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>',
};

export function getIconSvg(name) {
  return ICONS[name] || ICONS.settings;
}

/** Section card: title + optional hint, with rows appended to its body. */
export function createSection({ title, hint } = {}) {
  const card = el('section', 'gp-card');
  const body = el('div', 'gp-card__body');
  if (title || hint) {
    const head = el('div', 'gp-card__head');
    if (title) head.appendChild(el('div', 'gp-card__title', title));
    if (hint) head.appendChild(el('p', 'gp-card__hint', hint));
    card.appendChild(head);
  }
  card.appendChild(body);
  card.body = body;
  return card;
}

export function createHint(text) {
  return el('p', 'gp-hint', text);
}

/** Row: label + optional hint on the left, control on the right. */
export function createRow({ label, hint, control } = {}) {
  const row = el('div', 'gp-row');
  const text = el('div', 'gp-row__text');
  if (label) text.appendChild(el('div', 'gp-row__label', label));
  if (hint) text.appendChild(el('div', 'gp-row__hint', hint));
  const holder = el('div', 'gp-row__control');
  if (control) holder.appendChild(control);
  row.append(text, holder);
  return row;
}

/** Stacked field: label above the control (selects, inputs, textareas). */
export function createField({ label, hint, control } = {}) {
  const field = el('div', 'gp-field');
  if (label) field.appendChild(el('div', 'gp-field__label', label));
  if (control) field.appendChild(control);
  if (hint) field.appendChild(el('p', 'gp-hint', hint));
  return field;
}

/**
 * Switch control: `label.gp-switch` wrapping a checkbox and its track, so the
 * whole switch is one click target. Returns the wrapper (append it anywhere).
 */
export function createSwitch({ checked = false, onChange, label = '' } = {}) {
  const wrapper = el('label', 'gp-switch');
  const input = el('input', 'gp-switch__input');
  input.type = 'checkbox';
  input.checked = !!checked;
  if (label) input.setAttribute('aria-label', label);
  input.addEventListener('change', () => onChange?.(input.checked));
  wrapper.append(input, el('span', 'gp-switch__track'));
  return wrapper;
}

/** Switch row: label/hint text with the switch on the right. */
export function createSwitchRow({ checked = false, onChange, label, hint } = {}) {
  return createRow({ label, hint, control: createSwitch({ checked, onChange, label }) });
}

/**
 * Switch cell for the sources grid. The cell itself is the label (so the text
 * is clickable too) and the switch is plain markup inside it — never a nested
 * label, which is invalid HTML.
 */
export function createSwitchCell({ checked = false, onChange, label, hint } = {}) {
  const cell = el('label', 'gp-grid__cell');
  const toggle = el('span', 'gp-switch');
  const input = el('input', 'gp-switch__input');
  input.type = 'checkbox';
  input.checked = !!checked;
  input.addEventListener('change', () => onChange?.(input.checked));
  toggle.append(input, el('span', 'gp-switch__track'));
  const text = el('span', 'gp-grid__text');
  text.appendChild(el('span', 'gp-row__label', label));
  if (hint) text.appendChild(el('span', 'gp-row__hint', hint));
  cell.append(toggle, text);
  return cell;
}

export function createSelect({ options = [], value, onChange, label = '' } = {}) {
  const select = el('select', 'gp-select');
  if (label) select.setAttribute('aria-label', label);
  for (const option of options) {
    const node = el('option', null, option.label);
    node.value = option.value;
    if (option.value === value) node.selected = true;
    select.appendChild(node);
  }
  select.addEventListener('change', () => onChange?.(select.value));
  return select;
}

export function createNumberInput({ value = 0, min = 0, max = 120, onChange, label = '' } = {}) {
  const input = el('input', 'gp-input');
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  if (label) input.setAttribute('aria-label', label);
  input.addEventListener('change', () => {
    const next = Number(input.value);
    const clamped = Math.min(max, Math.max(min, Number.isFinite(next) ? next : min));
    input.value = String(clamped);
    onChange?.(clamped);
  });
  return input;
}

export function createTextarea({ value = '', placeholder = '', onInput, label = '' } = {}) {
  const textarea = el('textarea', 'gp-textarea');
  textarea.value = value;
  textarea.placeholder = placeholder;
  textarea.spellcheck = false;
  if (label) textarea.setAttribute('aria-label', label);
  textarea.addEventListener('input', () => onInput?.(textarea.value));
  return textarea;
}

export function createButton(label, onClick, className = '') {
  const button = el('button', `gp-button ${className}`.trim(), label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}
