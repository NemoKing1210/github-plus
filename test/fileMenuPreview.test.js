import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function installDom() {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div class="gp-preview-overlay">
        <div class="gp-preview">
          <header class="gp-preview__header">
            <button class="gp-preview__tool" type="button">close</button>
          </header>
          <div class="gp-preview__content">
            <div class="gp-preview__md">
              <p><a href="/o/r/blob/main/src/a.js">a.js</a></p>
            </div>
          </div>
        </div>
      </div>
    </body></html>`,
    { pretendToBeVisual: true, url: 'https://github.com/o/r/blob/main/docs/README.md' },
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.location = dom.window.location;
  globalThis.localStorage = dom.window.localStorage;
  return dom;
}

function contextMenu(target) {
  const event = new window.MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    button: 2,
    clientX: 24,
    clientY: 24,
  });
  target.dispatchEvent(event);
  return event;
}

test('a file link in the preview opens an elevated file menu', async () => {
  installDom();
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  applyFileMenuSettings();
  const event = contextMenu(document.querySelector('.gp-preview__md a'));
  assert.equal(event.defaultPrevented, true);
  const menu = document.getElementById('gp-context-menu');
  assert.ok(menu);
  assert.ok(menu.classList.contains('gp-context-menu--elevated'));
  assert.match(menu.getAttribute('aria-label'), /a\.js/);
  closeContextMenu();
});

test('the preview chrome keeps the browser menu', async () => {
  installDom();
  const { applyFileMenuSettings } = await import('../src/features/fileMenu/index.js');
  const { closeContextMenu } = await import('../src/ui/contextMenu.js');
  applyFileMenuSettings();
  const event = contextMenu(document.querySelector('.gp-preview__tool'));
  assert.equal(event.defaultPrevented, false);
  assert.equal(document.getElementById('gp-context-menu'), null);
  closeContextMenu();
});
