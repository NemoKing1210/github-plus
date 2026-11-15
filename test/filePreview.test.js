import test from 'node:test';
import assert from 'node:assert/strict';
import { previewKind, highlightLanguage, countLines } from '../src/features/filePreview/kind.js';
import { resolveMarkdownTarget } from '../src/features/filePreview/links.js';

test('markdown wins over a generic text/plain raw response', () => {
  assert.equal(previewKind('README.md', 'text/plain; charset=utf-8'), 'markdown');
});

test('known extensions decide the kind', () => {
  assert.equal(previewKind('a.png'), 'image');
  assert.equal(previewKind('a.pdf'), 'pdf');
  assert.equal(previewKind('a.mp4'), 'video');
  assert.equal(previewKind('a.mp3'), 'audio');
  assert.equal(previewKind('a.js'), 'code');
});

test('content type decides an undecided extension', () => {
  assert.equal(previewKind('asset', 'image/webp'), 'image');
  assert.equal(previewKind('data.bin', 'application/pdf'), 'pdf');
  assert.equal(previewKind('notes.bin', 'text/plain'), 'code');
  assert.equal(previewKind('blob.bin', 'application/octet-stream'), 'binary');
  assert.equal(previewKind('blob.bin', ''), 'binary');
});

test('well-known names are code', () => {
  assert.equal(previewKind('Dockerfile'), 'code');
  assert.equal(previewKind('Makefile'), 'code');
});

test('highlightLanguage maps extensions and names', () => {
  assert.equal(highlightLanguage('a.ts'), 'typescript');
  assert.equal(highlightLanguage('Dockerfile'), 'dockerfile');
  assert.equal(highlightLanguage('unknown.zzz'), '');
});

test('countLines ignores a trailing newline', () => {
  assert.equal(countLines(''), 0);
  assert.equal(countLines('a'), 1);
  assert.equal(countLines('a\nb\n'), 2);
});

const ctx = { owner: 'o', repo: 'r', ref: 'main', dir: 'docs/guide' };

test('resolves relative image and link targets through the repository routes', () => {
  assert.equal(resolveMarkdownTarget('img.png', ctx, 'image'), '/o/r/raw/main/docs/guide/img.png');
  assert.equal(resolveMarkdownTarget('../a/b.md', ctx, 'link'), '/o/r/blob/main/docs/a/b.md');
  assert.equal(resolveMarkdownTarget('./x y.png', ctx, 'image'), '/o/r/raw/main/docs/guide/x%20y.png');
  assert.equal(resolveMarkdownTarget('sub/../b.js', ctx, 'image'), '/o/r/raw/main/docs/guide/b.js');
});

test('leaves everything that is not repository-relative alone', () => {
  assert.equal(resolveMarkdownTarget('#top', ctx, 'link'), '');
  assert.equal(resolveMarkdownTarget('https://x/y', ctx, 'link'), '');
  assert.equal(resolveMarkdownTarget('//cdn/x.png', ctx, 'image'), '');
  assert.equal(resolveMarkdownTarget('/abs/path', ctx, 'link'), '');
  assert.equal(resolveMarkdownTarget('mailto:a@b', ctx, 'link'), '');
});
