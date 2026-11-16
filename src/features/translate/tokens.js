import { escapeHtml } from '../../utils/dom.js';

/** Private-use markers for inline elements and batch segments. */
export const TOKEN_START = '\uE000';
export const TOKEN_END = '\uE001';
export const SEGMENT_START = '\uE100';
export const SEGMENT_END = '\uE101';
export const LABEL_START = '\uE200';
export const LABEL_END = '\uE201';
export const TOKEN_RE = /\uE000\s*(\d+)\s*\uE001/g;

const MARKER_RE = /[\uE000\uE001\uE100\uE101\uE200\uE201]/g;
const SEGMENT_MARKER_RE = /[\uE100\uE101]/g;
const LABEL_MARKER_RE = /[\uE200\uE201]/g;
const LABEL_SPAN_RE = /\uE200([\s\S]*?)\uE201/;

/** Placeholder for the token with this id. */
export function makeToken(id) {
  return `${TOKEN_START}${id}${TOKEN_END}`;
}

/** Remove marker characters from page text so they cannot collide with tokens. */
export function stripTokens(text) {
  return String(text ?? '').replace(MARKER_RE, '');
}

/**
 * Remove only the batch-sentinel markers. Inline tokens must reach the
 * provider, otherwise every link, image and inline code is restored out of
 * order at the end of the block.
 */
export function stripSegmentMarkers(text) {
  return String(text ?? '').replace(SEGMENT_MARKER_RE, '');
}

/** Whether the text contains at least one letter (CJK counts). */
export function hasLetters(text) {
  return /\p{L}/u.test(String(text ?? ''));
}

/**
 * Render one inline element. The anchor label is wrapped in explicit markers
 * at extraction time, so a translation replaces exactly the visible text and
 * never a copy of it inside an attribute.
 */
function renderToken(token, label) {
  const html = String(token.html ?? '').replace(LABEL_SPAN_RE, (match, original) => {
    // `original` is already escaped markup; only a translation is escaped here.
    if (typeof label !== 'string' || !label) return original;
    return escapeHtml(label);
  });
  return html.replace(LABEL_MARKER_RE, '');
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
