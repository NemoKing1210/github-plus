import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><main></main></body></html>', {
  pretendToBeVisual: true,
  url: 'https://github.com/o/r',
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;

const { getTranslateSettings } = await import('../src/core/settings.js');
const { findContainers, listSurfaces } = await import('../src/features/translate/surfaces.js');

test('plain-text files are a place translation can run', () => {
  const surface = listSurfaces().find((entry) => entry.id === 'plaintext');
  assert.ok(surface);
  assert.equal(surface.plain, true);
  assert.equal(getTranslateSettings().surfaces.plaintext, true);

  document.querySelector('main').innerHTML = '<div id="license" class="react-code-lines">'
    + '<div class="react-file-line html-div">MIT License</div></div>'
    + '<div id="code" class="react-code-lines">'
    + '<div class="react-file-line"><span>const x = 1;</span></div></div>';
  assert.deepEqual(findContainers(surface).map((node) => node.id), ['license']);
});
