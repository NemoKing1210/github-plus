import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { t } from '../src/i18n/index.js';
import { getIconSvg } from '../src/features/settings/controls.js';
import { isOwnUi } from '../src/utils/dom.js';

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
