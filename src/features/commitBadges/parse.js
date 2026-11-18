/**
 * Conventional Commits prefixes: parsing only, no DOM and no settings.
 *
 * GitHub shows a commit subject as one line. This module finds a
 * `type(scope)!: description` prefix at the very start of that line and
 * reports where the prefix ends, so the decorator can split the title's text
 * node without changing a single character.
 */

/** Types with a dedicated colour. Everything else is a lowercase custom type. */
export const TYPE_ORDER = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];

export const KNOWN_TYPES = new Set(TYPE_ORDER);

const PATTERN = /^([A-Za-z][A-Za-z0-9-]{0,31})(?:\(([^()\r\n]{1,40})\))?(!)?:[ \t]+(\S[\s\S]*)$/;

/**
 * Parse the first line of a commit subject.
 * Returns `{ type, typeKey, scope, breaking, known, prefixEnd }` or null when
 * the subject carries no valid conventional prefix.
 */
export function parseCommitSubject(text) {
  const firstLine = String(text ?? '').split('\n')[0];
  const match = PATTERN.exec(firstLine);
  if (!match) return null;

  const type = match[1];
  const scope = match[2] || '';
  const typeKey = type.toLowerCase();
  const known = KNOWN_TYPES.has(typeKey);

  // A scope is decorative data and must already be trimmed: trimming it here
  // would silently disagree with the text the decorator must preserve.
  if (scope && scope !== scope.trim()) return null;
  // Known types may be written in any case; an unknown type is only a type
  // when it is entirely lowercase, so prose such as "Note: …" stays plain.
  if (!known && type !== typeKey) return null;

  const prefix = match[0].slice(0, match[0].length - match[4].length).replace(/[ \t]+$/, '');

  return {
    type,
    typeKey,
    scope,
    breaking: Boolean(match[3]),
    known,
    prefixEnd: prefix.length,
  };
}
