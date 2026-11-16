import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { t } from '../src/i18n/index.js';
import { getIconSvg } from '../src/features/settings/controls.js';
import { isOwnUi } from '../src/utils/dom.js';
import { createButton, ensureChrome } from '../src/features/translate/inject.js';

const dom = new JSDOM('<!doctype html><body><div class="gp-translate-bar"></div></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;

test('runtime labels are localized', () => {
  assert.equal(t('translate.button'), 'Translate');
  assert.equal(t('translate.showOriginal'), 'Show original');
  assert.equal(t('tab.translate'), 'Translation');
});

test('the settings page has a translate glyph', () => {
  const svg = getIconSvg('translate');
  assert.match(svg, /<svg/);
  assert.notEqual(svg, getIconSvg('settings'));
});

test('our translation chrome is own UI', () => {
  assert.equal(isOwnUi(document.querySelector('.gp-translate-bar')), true);
});

test('the README header action takes the header button look', () => {
  const slot = document.createElement('div');
  slot.className = 'readmeHeaderSlot__EGBTUW';
  const markdown = document.createElement('div');
  document.body.append(slot, markdown);
  const button = createButton('Translate');
  ensureChrome(markdown, { header: slot, button });
  assert.equal(button.parentElement, slot);
  assert.ok(button.classList.contains('gp-translate-btn--header'));
  button.remove();
  markdown.previousElementSibling.remove();
  markdown.remove();
});

test('a page header outside the README slot keeps the default look', () => {
  const header = document.createElement('header');
  const markdown = document.createElement('div');
  document.body.append(header, markdown);
  const button = createButton('Translate');
  ensureChrome(markdown, { header, button });
  assert.equal(button.parentElement, header);
  assert.ok(!button.classList.contains('gp-translate-btn--header'));
  button.remove();
  markdown.previousElementSibling.remove();
  markdown.remove();
});
