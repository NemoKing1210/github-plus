import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

let dom;
let shell;
let seen;

function labels() {
  return {
    title: 'Command palette',
    placeholder: 'Search',
    empty: 'Nothing found',
    emptyHint: 'Try another word',
    loading: 'Loading…',
    results: '{count} results',
    navigate: 'navigate',
    open: 'open',
    newTab: 'new tab',
    close: 'close',
    noSelection: 'Select a result',
    badges: { pinned: 'pinned', recent: 'recent', private: 'private', fork: 'fork', archived: 'archived' },
  };
}

function makeGroups() {
  return [{
    id: 'github',
    title: 'GitHub',
    items: [
      { key: 'cmd:one', kind: 'command', icon: 'terminal', title: 'Open issues', groupTitle: 'GitHub' },
      { key: 'cmd:two', kind: 'command', icon: 'terminal', title: 'Open pulls', groupTitle: 'GitHub' },
    ],
  }];
}

beforeEach(async () => {
  dom = new JSDOM('<!doctype html><html><body><button id="opener">open</button></body></html>', {
    url: 'https://github.com/',
    pretendToBeVisual: true,
  });
  for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'KeyboardEvent', 'Event', 'MouseEvent']) {
    globalThis[key] = dom.window[key];
  }
  globalThis.location = dom.window.location;
  dom.window.Element.prototype.scrollIntoView = () => {};
  dom.window.scrollTo = () => {};
  shell = await import('../src/ui/commandPalette.js');
  seen = [];
  document.getElementById('opener').focus();
});

afterEach(() => {
  shell.closeCommandPalette();
  dom.window.close();
});

function open() {
  return shell.openCommandPalette({
    labels: labels(),
    showDetails: true,
    search: () => ({ groups: makeGroups(), status: 'ready' }),
    renderDetail: (item) => {
      const node = document.createElement('div');
      node.textContent = `details:${item.title}`;
      return node;
    },
    onSelect: (item, options) => seen.push([item.key, options.newTab]),
    onPin: (item) => seen.push(['pin', item.key]),
    onClose: () => {},
  });
}

test('opening mounts the dialog, focuses the input and marks the first result', () => {
  open();
  const overlay = document.querySelector('.gp-command-overlay');
  const input = document.querySelector('.gp-command__input');
  assert.ok(overlay);
  assert.equal(document.activeElement, input);
  assert.equal(input.getAttribute('aria-expanded'), 'true');
  const active = document.querySelector('.gp-command__row[aria-selected="true"]');
  assert.ok(active);
  assert.equal(input.getAttribute('aria-activedescendant'), active.id);
  assert.match(document.querySelector('.gp-command__detail').textContent, /details:Open issues/);
});

test('arrows move the selection, Enter opens and closes', async () => {
  open();
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.deepEqual(seen, [['cmd:two', false]]);
  assert.equal(shell.isCommandPaletteOpen(), false);
});

test('Ctrl/⌘+Enter opens in a new tab', () => {
  open();
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
  assert.deepEqual(seen, [['cmd:one', true]]);
});

test('Escape clears the query before it closes', async () => {
  open();
  const input = document.querySelector('.gp-command__input');
  input.value = 'rea';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 120));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(input.value, '');
  assert.equal(shell.isCommandPaletteOpen(), true);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(shell.isCommandPaletteOpen(), false);
});

test('an outside pointer closes and focus returns to the opener', () => {
  open();
  const overlay = document.querySelector('.gp-command-overlay');
  overlay.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
  assert.equal(shell.isCommandPaletteOpen(), false);
  assert.equal(document.activeElement, document.getElementById('opener'));
});

test('refresh keeps the selected key and Alt+P pins it', () => {
  const handle = open();
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  handle.refresh();
  assert.equal(
    document.querySelector('.gp-command__row[aria-selected="true"]').dataset.key,
    'cmd:two',
  );
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'p', altKey: true, bubbles: true }));
  assert.deepEqual(seen, [['pin', 'cmd:two']]);
});
