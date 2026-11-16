import { TRANSLATE_MAX_BLOCKS, TRANSLATE_MAX_BLOCK_CHARS } from '../../core/constants.js';
import { isOwnUi, toArray } from '../../utils/dom.js';
import {
  hasLetters, makeToken, restoreTokens, stripTokens,
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

function isSkipped(node) {
  return node.matches(SKIP_SELECTOR) || isOwnUi(node);
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
  return blocks;
}

function skipSubtree(node) {
  if (SKIP_SUBTREE_TAGS.has(node.tagName)) return true;
  if (node.classList && (node.classList.contains('highlight') || node.classList.contains('anchor'))) {
    return true;
  }
  if (node.hasAttribute('data-gp-translate-ui')) return true;
  return isOwnUi(node);
}

function serializeToken(node) {
  if (node.tagName !== 'INPUT') return node.outerHTML;
  const clone = node.cloneNode(true);
  if (node.checked) clone.setAttribute('checked', '');
  if (node.disabled) clone.setAttribute('disabled', '');
  return clone.outerHTML;
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
        tokens.push({
          html: serializeToken(child),
          label: tag === 'A' ? (child.textContent || '').trim() || null : null,
        });
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

/** Rebuild a block from its translated text, restoring inline markup. */
export function renderBlockHtml(extracted, translated, labels = []) {
  const { html } = restoreTokens(translated, extracted.tokens, labels);
  let result = html;
  if (extracted.italic) result = `<em>${result}</em>`;
  if (extracted.bold) result = `<strong>${result}</strong>`;
  return result;
}
