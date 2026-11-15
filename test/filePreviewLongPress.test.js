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
