import test from 'node:test';
import assert from 'node:assert/strict';
import { previewKind, highlightLanguage, countLines } from '../src/features/filePreview/kind.js';

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
