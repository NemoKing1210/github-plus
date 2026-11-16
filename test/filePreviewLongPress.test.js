import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function installDom() {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div data-testid="directory-content">
        <table><tbody>
          <tr class="react-directory-row">
            <td><a href="/o/r/tree/main/src">src</a></td>
          </tr>
          <tr class="react-directory-row">
            <td><a href="/o/r/blob/main/a.js">a.js</a></td>
          </tr>
          <tr class="react-directory-row">
            <td><a href="/o/r/blob/main/b.js">b.js</a></td>
          </tr>
        </tbody></table>
      </div>
    </body></html>`,
    { pretendToBeVisual: true, url: 'https://github.com/o/r' },
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.location = dom.window.location;
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  return dom;
}

function installPreviewDom() {
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
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  return dom;
}

function pointer(type, target, { x = 10, y = 10 } = {}) {
  const event = new window.MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  target.dispatchEvent(event);
  return event;
}

async function pressFile(t, { hold = true, move = 0 } = {}) {
  const calls = [];
  const { installLongPress, uninstallLongPress } = await import(
    '../src/features/filePreview/longPress.js'
  );
  installLongPress((target) => calls.push(target));
  const link = document.querySelector('a[href*="/blob/"]');
  pointer('pointerdown', link);
  if (move) pointer('pointermove', link, { x: 10 + move, y: 10 });
  if (hold) {
    t.mock.timers.tick(600);
  } else {
    pointer('pointerup', link);
    t.mock.timers.tick(600);
  }
  return { calls, link, uninstall: uninstallLongPress };
}

test('holding the left button on a file name opens the preview', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { calls, uninstall } = await pressFile(t);
  uninstall();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'a.js');
});

test('moving the pointer cancels the long press', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { calls, uninstall } = await pressFile(t, { move: 20 });
  uninstall();
  assert.equal(calls.length, 0);
});

test('releasing before the delay keeps the normal click', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { calls, uninstall } = await pressFile(t, { hold: false });
  uninstall();
  assert.equal(calls.length, 0);
});

test('the long press suppresses the click that would open the file', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { calls, link, uninstall } = await pressFile(t);
  assert.equal(calls.length, 1);
  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  link.dispatchEvent(click);
  uninstall();
  assert.equal(click.defaultPrevented, true);
});

test('a click on another file right after a long press still navigates', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { calls, uninstall } = await pressFile(t);
  assert.equal(calls.length, 1);
  const other = document.querySelector('a[href="/o/r/blob/main/b.js"]');
  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  other.dispatchEvent(click);
  uninstall();
  assert.equal(click.defaultPrevented, false);
});

test('the hold ring waits a beat, then fills over the remaining time', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { installLongPress, uninstallLongPress } = await import(
    '../src/features/filePreview/longPress.js'
  );
  installLongPress(() => {});
  const link = document.querySelector('a[href*="/blob/"]');
  pointer('pointerdown', link, { x: 40, y: 60 });
  t.mock.timers.tick(149);
  assert.equal(document.querySelector('.gp-hold-ring'), null);
  t.mock.timers.tick(1);
  const ring = document.querySelector('.gp-hold-ring');
  assert.ok(ring);
  assert.equal(ring.hidden, false);
  assert.equal(ring.style.left, '40px');
  assert.equal(ring.style.top, '60px');
  assert.equal(ring.style.getPropertyValue('--gp-hold-duration'), '300ms');
  pointer('pointerup', link);
  assert.equal(ring.hidden, true);
  assert.equal(document.querySelectorAll('.gp-hold-ring').length, 1);
  uninstallLongPress();
});

test('a plain click never shows the ring', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { installLongPress, uninstallLongPress } = await import(
    '../src/features/filePreview/longPress.js'
  );
  installLongPress(() => {});
  const link = document.querySelector('a[href*="/blob/"]');
  pointer('pointerdown', link);
  pointer('pointerup', link);
  t.mock.timers.tick(300);
  const ring = document.querySelector('.gp-hold-ring');
  assert.ok(!ring || ring.hidden);
  uninstallLongPress();
});

test('the ring reuses one body node so a hold never mutates the body', async () => {
  installDom();
  const { hideHoldRing, mountHoldRing, showHoldRing } = await import(
    '../src/features/filePreview/holdRing.js'
  );
  const before = document.body.childNodes.length;
  mountHoldRing();
  mountHoldRing();
  assert.equal(document.body.childNodes.length, before + 1);
  showHoldRing(1, 2, 450);
  hideHoldRing();
  showHoldRing(3, 4, 450);
  assert.equal(document.body.childNodes.length, before + 1);
  assert.equal(document.querySelectorAll('.gp-hold-ring').length, 1);
});

test('the hold ring can be disabled in the settings', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { getSettings, saveSettings } = await import('../src/core/settings.js');
  const original = getSettings().filePreview;
  saveSettings({ filePreview: { ...original, longPressRing: false } });
  const { installLongPress, uninstallLongPress } = await import(
    '../src/features/filePreview/longPress.js'
  );
  installLongPress(() => {});
  const link = document.querySelector('a[href*="/blob/"]');
  pointer('pointerdown', link);
  const ring = document.querySelector('.gp-hold-ring');
  assert.ok(!ring || ring.hidden);
  pointer('pointerup', link);
  uninstallLongPress();
  saveSettings({ filePreview: original });
});

test('the configured hold time delays the preview', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { getSettings, saveSettings } = await import('../src/core/settings.js');
  const original = getSettings().filePreview;
  saveSettings({ filePreview: { ...original, longPressMs: 900 } });
  const calls = [];
  const { installLongPress, uninstallLongPress } = await import(
    '../src/features/filePreview/longPress.js'
  );
  installLongPress((target) => calls.push(target));
  const link = document.querySelector('a[href*="/blob/"]');
  pointer('pointerdown', link);
  t.mock.timers.tick(600);
  assert.equal(calls.length, 0);
  t.mock.timers.tick(300);
  assert.equal(calls.length, 1);
  uninstallLongPress();
  saveSettings({ filePreview: original });
});

test('a folder name does not start a preview', async (t) => {
  installDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const { installLongPress, uninstallLongPress } = await import(
    '../src/features/filePreview/longPress.js'
  );
  installLongPress((target) => calls.push(target));
  pointer('pointerdown', document.querySelector('a[href*="/tree/"]'));
  t.mock.timers.tick(600);
  uninstallLongPress();
  assert.equal(calls.length, 0);
});

test('holding a file link inside the quick preview opens its preview', async (t) => {
  installPreviewDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const { installLongPress, uninstallLongPress } = await import(
    '../src/features/filePreview/longPress.js'
  );
  installLongPress((target) => calls.push(target));
  const link = document.querySelector('.gp-preview__md a');
  pointer('pointerdown', link);
  t.mock.timers.tick(600);
  uninstallLongPress();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'a.js');
  assert.equal(calls[0].source, 'markdown');
});

test('the quick preview chrome never starts a long press', async (t) => {
  installPreviewDom();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const { installLongPress, uninstallLongPress } = await import(
    '../src/features/filePreview/longPress.js'
  );
  installLongPress((target) => calls.push(target));
  pointer('pointerdown', document.querySelector('.gp-preview__tool'));
  t.mock.timers.tick(600);
  uninstallLongPress();
  assert.equal(calls.length, 0);
});
