import test from 'node:test';
import assert from 'node:assert/strict';
import { KNOWN_TYPES, TYPE_ORDER, parseCommitSubject } from '../src/features/commitBadges/parse.js';

test('a known type and scope are parsed and the prefix end is exact', () => {
  const text = 'style(palette): stack source tiles';
  const parsed = parseCommitSubject(text);
  assert.equal(parsed.type, 'style');
  assert.equal(parsed.typeKey, 'style');
  assert.equal(parsed.scope, 'palette');
  assert.equal(parsed.breaking, false);
  assert.equal(parsed.known, true);
  assert.equal(text.slice(0, parsed.prefixEnd), 'style(palette):');
});

test('breaking marks are accepted after the type or the scope', () => {
  assert.equal(parseCommitSubject('feat!: add').breaking, true);
  assert.equal(parseCommitSubject('feat(api)!: add').breaking, true);
});

test('a prefix without a scope leaves scope empty', () => {
  assert.equal(parseCommitSubject('fix: bug').scope, '');
});

test('known types are recognised case-insensitively', () => {
  const parsed = parseCommitSubject('Feat(ui): add');
  assert.equal(parsed.known, true);
  assert.equal(parsed.typeKey, 'feat');
  assert.equal(parsed.type, 'Feat');
});

test('lowercase unknown types are styled as unknown', () => {
  const parsed = parseCommitSubject('deps(lock): bump vite');
  assert.equal(parsed.known, false);
  assert.equal(parsed.typeKey, 'deps');
});

test('uppercase unknown types are prose, not a prefix', () => {
  assert.equal(parseCommitSubject('Note: explain this'), null);
});

test('invalid prefixes are rejected', () => {
  assert.equal(parseCommitSubject('feat:no space'), null);
  assert.equal(parseCommitSubject('feat: '), null);
  assert.equal(parseCommitSubject('feat(): x'), null);
  assert.equal(parseCommitSubject('feat( ui ): x'), null);
  assert.equal(parseCommitSubject('Merge pull request #1 from x'), null);
});

test('a type may contain digits and hyphens and still be unknown', () => {
  const parsed = parseCommitSubject('my-type2: x');
  assert.equal(parsed.typeKey, 'my-type2');
  assert.equal(parsed.known, false);
});

test('scopes may contain a slash and only the first line is matched', () => {
  const scoped = parseCommitSubject('feat(core/ui): add');
  assert.equal(scoped.scope, 'core/ui');
  const multiline = parseCommitSubject('fix: one\n\nbody text');
  assert.equal(multiline.type, 'fix');
  assert.equal(multiline.prefixEnd, 'fix:'.length);
});

test('the known-type registry is complete and ordered', () => {
  assert.deepEqual(TYPE_ORDER, ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']);
  assert.equal(KNOWN_TYPES.size, TYPE_ORDER.length);
});
