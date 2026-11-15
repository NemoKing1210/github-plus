import { append, el } from '../../utils/dom.js';
import { countLines } from './kind.js';
import { highlightHtml } from './highlight.js';

/**
 * A code surface with a line-number gutter. Highlighted markup comes from
 * highlight.js, which escapes the text it wraps; plain files are set through
 * `textContent`.
 * @param {string} text
 * @param {string} language
 * @returns {HTMLElement}
 */
export function renderCode(text, language) {
  const root = el('div', 'gp-preview__code');
  const gutter = append(root, el('div', 'gp-preview__gutter'));
  gutter.setAttribute('aria-hidden', 'true');
  const lines = countLines(text);
  for (let index = 1; index <= lines; index += 1) {
    append(gutter, el('span', 'gp-preview__line-no', String(index)));
  }
  const pre = append(root, el('pre', 'gp-preview__pre'));
  const code = append(pre, el('code'));
  const highlighted = highlightHtml(text, language);
  if (highlighted) {
    code.className = `hljs language-${language}`;
    code.innerHTML = highlighted;
  } else {
    code.textContent = text;
  }
  return root;
}
