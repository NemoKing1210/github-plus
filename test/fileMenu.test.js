import test from 'node:test';
import assert from 'node:assert/strict';
import { isCopyableContent } from '../src/features/fileMenu/copy.js';

test('treats textual content types as copyable', () => {
  assert.equal(isCopyableContent('text/plain; charset=utf-8', 'a.txt'), true);
  assert.equal(isCopyableContent('application/json', 'a.json'), true);
  assert.equal(isCopyableContent('application/xml', 'a.xml'), true);
  assert.equal(isCopyableContent('application/javascript', 'a.js'), true);
  assert.equal(isCopyableContent('application/x-sh', 'a.sh'), true);
  assert.equal(isCopyableContent('image/svg+xml', 'a.svg'), true);
});

test('rejects binary content types even with a textual extension', () => {
  assert.equal(isCopyableContent('image/png', 'a.md'), false);
  assert.equal(isCopyableContent('application/pdf', 'a.txt'), false);
  assert.equal(isCopyableContent('application/octet-stream', 'a.md'), false);
});

test('falls back to the extension when the type is unknown', () => {
  assert.equal(isCopyableContent('', 'src/a.js'), true);
  assert.equal(isCopyableContent('', 'README.md'), true);
  assert.equal(isCopyableContent('', 'Dockerfile'), true);
  assert.equal(isCopyableContent('', 'a.png'), false);
  assert.equal(isCopyableContent('', 'archive.zip'), false);
});
