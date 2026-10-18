import { el } from '../../utils/dom.js';

/**
 * Reusable settings controls in GitHub's visual language (see DESIGN.md).
 * Controls are draft-only: they mutate the values the caller hands them and
 * report changes through callbacks. Nothing here reads or writes settings.
 */

const ICONS = {
  close: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>',
  gear: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"/></svg>',
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
