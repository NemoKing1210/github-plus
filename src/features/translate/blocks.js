import { TRANSLATE_MAX_BLOCKS, TRANSLATE_MAX_BLOCK_CHARS } from '../../core/constants.js';
import { isOwnUi, toArray } from '../../utils/dom.js';
import {
  LABEL_END, LABEL_START, hasLetters, makeToken, restoreTokens, stripTokens,
} from './tokens.js';

export const BLOCK_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,dt,dd,td,th,blockquote,figcaption,caption,summary';
export const SKIP_SELECTOR = 'pre,code,.highlight,script,style,textarea,[data-gp-translate-ui],.gp-translate-bar,.gp-translate-result,.anchor';

const LIST_TAGS = new Set(['UL', 'OL']);
const SKIP_SUBTREE_TAGS = new Set(['PRE', 'SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'TEXTAREA']);
const TOKEN_TAGS = new Set([
  'A', 'CODE', 'KBD', 'SAMP', 'IMG', 'PICTURE', 'SVG', 'BR', 'INPUT', 'HR', 'VIDEO', 'AUDIO',
]);
const BOLD_TAGS = new Set(['STRONG', 'B']);
const ITALIC_TAGS = new Set(['EM', 'I']);
const PLAIN_LINE_SELECTOR = '.react-file-line';

/** The preview overlay is our UI, but the markdown rendered inside it is page content. */
function isOwnChrome(node) {
  return isOwnUi(node) && !node.closest('.gp-preview-overlay');
}

function isSkipped(node) {
  return node.matches(SKIP_SELECTOR) || isOwnChrome(node);
}

function isInsideSkipped(node, stop) {
  let current = node;
  while (current && current !== stop) {
    if (current.nodeType === Node.ELEMENT_NODE && isSkipped(current)) return true;
    current = current.parentElement;
  }
  return false;
}

function hasCandidate(el) {
  return toArray(el.querySelectorAll(BLOCK_SELECTOR))
    .some((candidate) => !isInsideSkipped(candidate, el));
}

function nestedListsOnly(li) {
  const lists = toArray(li.children).filter((child) => LIST_TAGS.has(child.tagName));
  if (!lists.length) return false;
  const candidates = toArray(li.querySelectorAll(BLOCK_SELECTOR))
    .filter((candidate) => !isInsideSkipped(candidate, li));
  return candidates.length > 0
    && candidates.every((candidate) => lists.some((list) => list.contains(candidate)));
}

/**
 * Leaf text blocks of a container in document order. A list item that only
 * wraps a nested list is still translatable; code and our own UI are skipped.
 * @param {Element} container
 * @param {{ maxBlocks?: number }} [options]
 * @returns {Element[]}
 */
export function collectBlocks(container, { maxBlocks = TRANSLATE_MAX_BLOCKS } = {}) {
  const blocks = [];
  if (!container) return blocks;
  const seen = new Set();

  const visit = (parent) => {
    const children = toArray(parent.children);
    for (let index = 0; index < children.length; index += 1) {
      if (blocks.length >= maxBlocks) return;
      const child = children[index];
      if (isSkipped(child)) continue;
      if (child.matches(BLOCK_SELECTOR)) {
        if (child.tagName === 'LI' && nestedListsOnly(child)) {
          if (!seen.has(child)) {
            seen.add(child);
            blocks.push(child);
          }
          toArray(child.children).forEach((list) => {
            if (LIST_TAGS.has(list.tagName) && !isSkipped(list)) visit(list);
          });
        } else if (hasCandidate(child)) {
          visit(child);
        } else if (!seen.has(child)) {
          seen.add(child);
          blocks.push(child);
        }
      } else {
        visit(child);
      }
    }
  };

  visit(container);
  // A surface container that is itself the text block (an issue title, a
  // commit message) has no descendant candidates to collect.
  if (!blocks.length && !isSkipped(container) && extractBlock(container)) {
    blocks.push(container);
  }
  return blocks;
}

function skipSubtree(node) {
  if (SKIP_SUBTREE_TAGS.has(node.tagName)) return true;
  if (node.classList && (node.classList.contains('highlight') || node.classList.contains('anchor'))) {
    return true;
  }
  if (node.hasAttribute('data-gp-translate-ui')) return true;
  // The preview overlay is our UI, but its rendered markdown is page content.
  return isOwnChrome(node);
}

/** Wrap the anchor's visible label in markers, never a copy inside an attribute. */
function markLabel(clone, label) {
  const doc = clone.ownerDocument;
  const nodes = [];
  const walker = doc.createTreeWalker(clone, 4);
  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }
  const starts = [];
  let text = '';
  nodes.forEach((node) => {
    starts.push(text.length);
    text += node.nodeValue;
  });
  const start = text.indexOf(label);
  if (start < 0) return;
  const end = start + label.length;

  const locate = (offset) => {
    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      if (starts[index] <= offset) {
        return { node: nodes[index], offset: offset - starts[index] };
      }
    }
    return null;
  };
  const from = locate(start);
  const to = locate(end);
  if (!from || !to) return;

  const range = doc.createRange();
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset);
  const wrapper = doc.createDocumentFragment();
  wrapper.appendChild(doc.createTextNode(LABEL_START));
  wrapper.appendChild(range.extractContents());
  wrapper.appendChild(doc.createTextNode(LABEL_END));
  range.insertNode(wrapper);
}

function serializeToken(node, label) {
  const clone = node.cloneNode(true);
  if (node.tagName === 'INPUT') {
    if (node.checked) clone.setAttribute('checked', '');
    if (node.disabled) clone.setAttribute('disabled', '');
  } else if (label) {
    markLabel(clone, label);
  }
  return clone.outerHTML;
}

/**
 * A plain-text file view renders one element per source line and its text
 * nodes carry no separators; join the lines so line breaks and paragraph
 * gaps survive the trip through the provider.
 */
function plainTextSource(block) {
  if (!block || typeof block.querySelectorAll !== 'function') return null;
  const lines = toArray(block.querySelectorAll(PLAIN_LINE_SELECTOR));
  if (!lines.length) return null;
  return lines
    .map((line) => stripTokens(line.textContent || '').replace(/ /g, ' '))
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Turn a block into translatable text plus inline-element tokens. Returns null
 * for a block with nothing to translate or one that is too large.
 * @param {Element} block
 * @returns {{ source: string, tokens: Array<{ html: string, label: string | null }>,
 *   bold: boolean, italic: boolean } | null}
 */
export function extractBlock(block) {
  if (!block) return null;
  const plain = plainTextSource(block);
  if (plain !== null) {
    return hasLetters(plain) && plain.length <= TRANSLATE_MAX_BLOCK_CHARS
      ? { source: plain, tokens: [], bold: false, italic: false }
      : null;
  }
  const tokens = [];
  let source = '';
  let letters = 0;
  let boldLetters = 0;
  let italicLetters = 0;

  const addText = (text, bold, italic) => {
    source += text;
    const count = (text.match(/\p{L}/gu) || []).length;
    letters += count;
    if (bold) boldLetters += count;
    if (italic) italicLetters += count;
  };

  const walk = (node, bold, italic) => {
    const children = toArray(node.childNodes);
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      if (child.nodeType === Node.TEXT_NODE) {
        addText(stripTokens(child.nodeValue).replace(/\u00A0/g, ' '), bold, italic);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      if (skipSubtree(child)) continue;
      const tag = child.tagName;
      if (block.tagName === 'LI' && LIST_TAGS.has(tag)) continue;
      if (TOKEN_TAGS.has(tag)) {
        source += makeToken(tokens.length);
        const label = tag === 'A' ? (child.textContent || '').trim() || null : null;
        tokens.push({ html: serializeToken(child, label), label });
        continue;
      }
      walk(child, bold || BOLD_TAGS.has(tag), italic || ITALIC_TAGS.has(tag));
    }
  };

  walk(block, false, false);
  const trimmed = source.trim();
  if (!hasLetters(trimmed) || trimmed.length > TRANSLATE_MAX_BLOCK_CHARS) return null;
  return {
    source: trimmed,
    tokens,
    bold: letters > 0 && boldLetters === letters,
    italic: letters > 0 && italicLetters === letters,
  };
}

/**
 * Rebuild a block from its translated text, restoring inline markup. The
 * token report lets the caller detect a provider that ate the placeholders.
 */
export function renderBlockResult(extracted, translated, labels = []) {
  const { html, missing, duplicated } = restoreTokens(translated, extracted.tokens, labels);
  let result = html;
  if (extracted.italic) result = `<em>${result}</em>`;
  if (extracted.bold) result = `<strong>${result}</strong>`;
  return { html: result, missing, duplicated };
}
