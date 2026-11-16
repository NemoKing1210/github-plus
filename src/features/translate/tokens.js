import { escapeHtml } from '../../utils/dom.js';

/** Private-use markers for inline elements and batch segments. */
export const TOKEN_START = '\uE000';
export const TOKEN_END = '\uE001';
export const SEGMENT_START = '\uE100';
export const SEGMENT_END = '\uE101';
export const TOKEN_RE = /\uE000\s*(\d+)\s*\uE001/g;

const MARKER_RE = /[\uE000\uE001\uE100\uE101]/g;

/** Placeholder for the token with this id. */
export function makeToken(id) {
  return `${TOKEN_START}${id}${TOKEN_END}`;
}

/** Remove marker characters from page text so they cannot collide with tokens. */
export function stripTokens(text) {
  return String(text ?? '').replace(MARKER_RE, '');
}

/** Whether the text contains at least one letter (CJK counts). */
export function hasLetters(text) {
  return /\p{L}/u.test(String(text ?? ''));
}

function renderToken(token, label) {
  const original = typeof token.label === 'string' ? token.label : '';
  if (!original || typeof label !== 'string' || !label) return token.html;
  const escapedOriginal = escapeHtml(original);
  const index = token.html.indexOf(escapedOriginal);
  if (index < 0) return token.html;
  return (
    token.html.slice(0, index)
    + escapeHtml(label)
    + token.html.slice(index + escapedOriginal.length)
  );
}

/**
 * Rebuild a block: escaped translated text with the recorded inline elements
 * restored at their tokens. Missing tokens are appended so nothing is lost;
 * a duplicated token is rendered once.
 * @param {string} translated
 * @param {Array<{ html: string, label: string | null }>} tokens
 * @param {string[]} [labels] translated link labels, parallel to `tokens`
 * @returns {{ html: string, missing: number[], duplicated: boolean }}
 */
export function restoreTokens(translated, tokens, labels = []) {
  const source = String(translated ?? '');
  const list = Array.isArray(tokens) ? tokens : [];
  const used = new Set();
  let html = '';
  let last = 0;
  let duplicated = false;

  TOKEN_RE.lastIndex = 0;
  let match;
  while ((match = TOKEN_RE.exec(source))) {
    html += escapeHtml(source.slice(last, match.index));
    const id = Number(match[1]);
    const token = list[id];
    if (!token) {
      html += escapeHtml(match[0]);
    } else if (used.has(id)) {
      duplicated = true;
    } else {
      used.add(id);
      html += renderToken(token, labels[id]);
    }
    last = match.index + match[0].length;
  }
  html += escapeHtml(source.slice(last));

  const missing = [];
  for (let id = 0; id < list.length; id += 1) {
    if (used.has(id)) continue;
    missing.push(id);
    html += `${html ? ' ' : ''}${renderToken(list[id], labels[id])}`;
  }

  return { html, missing, duplicated };
}
