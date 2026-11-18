import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { formatSize } from '../src/utils/size.js';
import { renderMeta, setMetaSize } from '../src/features/fileMeta/inject.js';

test('formats whole bytes below one kilobyte', () => {
  assert.equal(formatSize(0), '0 B');
  assert.equal(formatSize(512), '512 B');
});

test('uses GitHub’s binary units and labels', () => {
  assert.equal(formatSize(1024), '1 KB');
  assert.equal(formatSize(2929), '2.86 KB');
});

test('keeps three significant digits across units', () => {
  assert.equal(formatSize(10 * 1024), '10 KB');
  assert.equal(formatSize(45.6 * 1024), '45.6 KB');
  assert.equal(formatSize(1.5 * 1024 * 1024), '1.5 MB');
});

test('returns an empty string for an unusable value', () => {
  assert.equal(formatSize(null), '');
  assert.equal(formatSize(Number.NaN), '');
  assert.equal(formatSize(-1), '');
});

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.document = dom.window.document;
  return dom.window.document;
}

test('the size slot holds a loading placeholder until the probe answers', () => {
  const document = installDom();
  const meta = renderMeta({ name: 'a.js', showSize: true, showDownload: true, onDownload() {} });
  document.body.appendChild(meta);

  const skeleton = meta.querySelector('.gp-file-size-skeleton');
  assert.ok(skeleton, 'the placeholder was rendered');
  assert.equal(skeleton.getAttribute('aria-hidden'), 'true');
  assert.equal(meta.querySelector('.gp-file-size').hidden, true);

  setMetaSize(meta, '2.86 KB');
  assert.equal(meta.querySelector('.gp-file-size-skeleton'), null, 'the placeholder was removed');
  assert.equal(meta.querySelector('.gp-file-size').hidden, false);
  assert.equal(meta.querySelector('.gp-file-size').textContent, '2.86 KB');
});

test('a probe with no answer drops the placeholder and leaves no gap', () => {
  const document = installDom();
  const meta = renderMeta({ name: 'a.js', showSize: true, showDownload: true, onDownload() {} });
  document.body.appendChild(meta);

  setMetaSize(meta, '');
  assert.equal(meta.querySelector('.gp-file-size-skeleton'), null);
  assert.equal(meta.querySelector('.gp-file-size').hidden, true);
});

test('no placeholder is drawn while the size column is off', () => {
  installDom();
  const meta = renderMeta({ name: 'a.js', showSize: false, showDownload: true, onDownload() {} });
  assert.equal(meta.querySelector('.gp-file-size-skeleton'), null);
  assert.ok(meta.querySelector('.gp-file-download'));
});
