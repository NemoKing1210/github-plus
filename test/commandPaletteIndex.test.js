import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><head>
  <meta name="user-login" content="alice">
  <meta name="octolytics-dimension-repository_default_branch" content="main">
</head><body></body></html>`, { url: 'https://github.com/alice/repo', pretendToBeVisual: true });

for (const key of [
  'window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'KeyboardEvent', 'MouseEvent',
]) {
  globalThis[key] = dom.window[key];
}
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;
dom.window.Element.prototype.scrollIntoView = () => {};
dom.window.scrollTo = () => {};

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, value),
  removeItem: (key) => store.delete(key),
};

globalThis.GM_xmlhttpRequest = (options) => {
  if (options.url.includes('/starred')) {
    options.onload({ status: 200, responseText: '[]', responseHeaders: '' });
    return;
  }
  if (options.url.includes('/git/trees/')) {
    options.onload({
      status: 200,
      responseText: JSON.stringify({
        truncated: true,
        tree: [{ path: 'a.js', type: 'blob', size: 10 }],
      }),
      responseHeaders: '',
    });
    return;
  }
  options.onload({
    status: 200,
    responseText: JSON.stringify([
      { full_name: 'alice/repo', owner: { login: 'alice', type: 'User' }, name: 'repo' },
    ]),
    responseHeaders: '',
  });
};

const palette = await import('../src/features/commandPalette/index.js');
const shell = await import('../src/ui/commandPalette.js');
const { t } = await import('../src/i18n/index.js');

afterEach(() => {
  shell.closeCommandPalette();
});

test('a cold open shows the loaded repositories, files and the truncated-tree note', async () => {
  palette.openPalette();
  await new Promise((resolve) => setTimeout(resolve, 50));

  assert.ok(document.querySelector('.gp-command__row[data-key="repo:alice/repo"]'));
  assert.equal(document.querySelector('.gp-command__note').textContent, t('palette.status.incomplete'));

  const input = document.querySelector('.gp-command__input');
  input.value = '#a';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.ok(document.querySelector('.gp-command__row[data-key="file:alice/repo@main:a.js"]'));
});

test('the palette never opens over another GitHub Plus overlay', () => {
  shell.closeCommandPalette();
  const panel = document.createElement('div');
  panel.className = 'gp-panel-overlay';
  document.body.appendChild(panel);
  palette.openPalette();
  assert.equal(shell.isCommandPaletteOpen(), false);
  panel.remove();
});
