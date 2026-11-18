/**
 * Commit badge DOM primitives: wrap a parsed prefix in our spans and let the
 * caller take it back out again.
 *
 * The wrapper's own text is the original prefix, so restoring never needs a
 * saved HTML snapshot: replace the wrapper with its text and the title is
 * byte-identical to what GitHub rendered.
 */

import { el } from '../../utils/dom.js';

function leadingTextNode(node) {
  let current = node.firstChild;
  while (current) {
    if (current.nodeType === 3) return current;
    if (current.nodeType === 1) {
      const nested = leadingTextNode(current);
      if (nested) return nested;
    }
    current = current.nextSibling;
  }
  return null;
}

/** True when the title already carries our wrapper. */
export function hasCommitBadge(title) {
  return Boolean(title && title.querySelector('.gp-commit-prefix'));
}

function buildPrefix(parsed, options) {
  const prefix = el('span', 'gp-commit-prefix');
  const chip = el('span', 'gp-commit-chip');
  const typeClass = parsed.known ? parsed.typeKey : 'unknown';
  chip.appendChild(el('span', `gp-commit-type gp-commit-type--${typeClass}`, parsed.type));

  if (parsed.scope) {
    const scope = el('span', 'gp-commit-scope');
    scope.append(
      el('span', 'gp-commit-paren', '('),
      document.createTextNode(parsed.scope),
      el('span', 'gp-commit-paren', ')'),
    );
    chip.appendChild(scope);
  }
  prefix.appendChild(chip);

  if (parsed.breaking) {
    const marker = options && options.breaking === false ? 'gp-commit-bang--plain' : 'gp-commit-bang';
    prefix.appendChild(el('span', marker, '!'));
  }
  prefix.appendChild(el('span', 'gp-commit-colon', ':'));
  return prefix;
}

/**
 * Split the title's leading text node and wrap the prefix in our spans.
 * Returns false when the prefix does not fit entirely inside that one node —
 * GitHub splitting the type, scope or colon across elements leaves the title
 * untouched rather than risking a corrupt subject.
 */
export function decorateTitle(title, parsed, options = {}) {
  if (!title || !parsed || hasCommitBadge(title)) return false;
  const textNode = leadingTextNode(title);
  if (!textNode || parsed.prefixEnd > textNode.data.length) return false;

  const prefix = buildPrefix(parsed, options);
  textNode.data = textNode.data.slice(parsed.prefixEnd);
  textNode.parentNode.insertBefore(prefix, textNode);
  return true;
}

/** Replace every badge under `root` with its plain text. Returns the count. */
export function clearCommitBadges(root = document) {
  const prefixes = root.querySelectorAll('.gp-commit-prefix');
  let count = 0;
  for (let i = 0; i < prefixes.length; i += 1) {
    const node = prefixes[i];
    const parent = node.parentNode;
    if (!parent) continue;
    parent.replaceChild(document.createTextNode(node.textContent), node);
    parent.normalize();
    count += 1;
  }
  return count;
}
