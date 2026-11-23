import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { t } from '../src/i18n/index.js';
import { getIconSvg } from '../src/features/settings/controls.js';
import { isOwnUi } from '../src/utils/dom.js';
import {
  createButton, ensureChrome, setButtonState,
} from '../src/features/translate/inject.js';
import { listSurfaces } from '../src/features/translate/surfaces.js';

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
  assert.equal(markdown.previousElementSibling, slot);
  button.remove();
  slot.remove();
  markdown.remove();
});

test('the issue title action is a bare icon in the page-header actions', () => {
  const page = document.createElement('div');
  page.setAttribute('data-component', 'PageHeader');
  page.innerHTML = '<div data-component="TitleArea"><h1>'
    + '<bdi data-testid="issue-title">A title</bdi></h1></div>'
    + '<div data-component="PH_Actions"><div class="menuActionsContainer__S_GMw3">'
    + '<button data-component="IconButton" aria-label="Copy link">copy</button>'
    + '</div></div>';
  document.body.append(page);
  const title = page.querySelector('[data-testid="issue-title"]');
  const titles = listSurfaces().find((surface) => surface.id === 'titles');
  const header = titles.headerFor(title);
  const button = createButton('Translate');
  ensureChrome(title, { header, button });
  assert.equal(button.parentElement, header);
  assert.ok(button.classList.contains('gp-translate-btn--icon'));
  assert.ok(!button.classList.contains('gp-translate-btn--actions'));
  assert.ok(!button.classList.contains('gp-translate-btn--small'));
  assert.equal(button.querySelector('.gp-translate-btn__label').textContent, 'Translate');
  button.remove();
  page.remove();
});

test('a compact icon header prepends the button before its kebab menu', () => {
  const body = document.createElement('div');
  body.setAttribute('data-testid', 'issue-body');
  body.innerHTML = '<div class="actionsSection__QKxX29">'
    + '<button data-component="IconButton" aria-haspopup="true">kebab</button></div>'
    + '<div class="markdown-body">Description</div>';
  document.body.append(body);
  const markdown = body.querySelector('.markdown-body');
  const header = listSurfaces().find((surface) => surface.id === 'markdown').headerFor(markdown);
  const button = createButton('Translate');
  ensureChrome(markdown, { header, button });
  assert.equal(button.parentElement, header);
  assert.equal(button.nextElementSibling.getAttribute('aria-haspopup'), 'true');
  assert.ok(button.classList.contains('gp-translate-btn--icon'));
  assert.ok(button.classList.contains('gp-translate-btn--small'));
  button.remove();
  body.remove();
});

test('a release page action is a compact labelled button before the compare control', () => {
  const page = document.createElement('div');
  page.innerHTML = '<div class="Box"><div class="Box-body">'
    + '<div class="d-flex flex-md-row flex-column">'
    + '<div class="d-flex flex-row flex-1"><div class="flex-1"><h1>A release</h1></div></div>'
    + '<div class="d-flex tmp-mb-3"><select-panel>'
    + '<dialog-helper><button class="Button--secondary Button--small">Compare</button></dialog-helper>'
    + '</select-panel></div>'
    + '</div>'
    + '<div data-test-selector="body-content" class="markdown-body"><p>Notes</p></div>'
    + '</div></div>';
  document.body.append(page);
  const body = page.querySelector('.markdown-body');
  const header = listSurfaces().find((surface) => surface.id === 'markdown').headerFor(body);
  const button = createButton('Translate');
  const chrome = ensureChrome(body, { header, button });
  assert.equal(chrome.bar, null);
  assert.equal(button.parentElement, header);
  assert.equal(header.firstElementChild, button);
  assert.equal(button.nextElementSibling.localName, 'select-panel');
  // The Compare control is a small labelled button, so the action keeps its
  // label and the compact button shape instead of becoming a bare icon.
  assert.ok(button.classList.contains('gp-translate-btn--button'));
  assert.ok(button.classList.contains('gp-translate-btn--small'));
  assert.ok(!button.classList.contains('gp-translate-btn--icon'));
  assert.ok(!button.classList.contains('gp-translate-btn--actions'));
  assert.ok(!button.classList.contains('gp-translate-btn--header'));
  const label = button.querySelector('.gp-translate-btn__label');
  assert.equal(label.textContent, 'Translate');
  button.remove();
  page.remove();
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
  header.remove();
  markdown.remove();
});

test('a header-hosted action adds no bar', () => {
  const slot = document.createElement('header');
  const markdown = document.createElement('div');
  document.body.append(slot, markdown);
  const button = createButton('Translate');
  const chrome = ensureChrome(markdown, { header: slot, button });
  assert.equal(chrome.bar, null);
  assert.equal(markdown.previousElementSibling, slot);
  button.remove();
  slot.remove();
  markdown.remove();
});

test('a header-hosted action removes a bar left from an earlier pass', () => {
  const header = document.createElement('header');
  const markdown = document.createElement('div');
  document.body.append(header, markdown);
  const button = createButton('Translate');
  const bars = document.querySelectorAll('.gp-translate-bar').length;
  ensureChrome(markdown, { button });
  assert.equal(document.querySelectorAll('.gp-translate-bar').length, bars + 1);
  ensureChrome(markdown, { header, button });
  assert.equal(document.querySelectorAll('.gp-translate-bar').length, bars);
  assert.equal(button.parentElement, header);
  button.remove();
  header.remove();
  markdown.remove();
});

test('progress fills a ring inside the button instead of printing numbers', () => {
  const button = createButton('Translate');
  setButtonState(button, 'loading', { label: 'Translating…', progress: 0.25 });
  const ring = button.querySelector('.gp-translate-ring');
  assert.ok(ring);
  assert.equal(ring.parentElement, button);
  const fill = ring.querySelector('.gp-translate-ring__fill');
  assert.equal(fill.style.strokeDashoffset, '75');
  assert.equal(button.dataset.gpTranslateState, 'loading');
  assert.equal(button.textContent, 'Translating…');
  assert.doesNotMatch(button.textContent, /\d/);
  assert.ok(!ring.classList.contains('is-pending'));

  setButtonState(button, 'loading', { label: 'Translating…' });
  assert.ok(ring.classList.contains('is-pending'));
  assert.equal(fill.style.strokeDashoffset, '');

  setButtonState(button, 'loading', { label: 'Translating…', progress: 1 });
  assert.equal(fill.style.strokeDashoffset, '0');
  button.remove();
});

test('a control without a header adds no status text beside the button', () => {
  const markdown = document.createElement('div');
  markdown.innerHTML = '<p>Text</p>';
  document.body.append(markdown);
  const button = createButton('Translate');
  const chrome = ensureChrome(markdown, { button });
  assert.ok(chrome.bar);
  assert.equal(chrome.bar.querySelectorAll('.gp-translate-status').length, 0);
  assert.equal(chrome.bar.lastElementChild, button);
  button.remove();
  chrome.bar.remove();
  markdown.remove();
});
