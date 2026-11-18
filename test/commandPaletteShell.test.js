import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

let dom;
let shell;
let seen;
let contextMenu;

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
    tip: 'Tip: press ? for every shortcut',
    tipScoped: 'Tip: Backspace leaves {repo}',
    tipHelp: 'shortcuts',
    hintOpen: 'open',
    hintScope: 'scope',
    rowMenu: 'Actions',
    badges: { pinned: 'pinned', recent: 'recent', private: 'private', fork: 'fork', archived: 'archived' },
  };
}

function makeGroups() {
  return [{
    id: 'pages',
    title: 'Pages',
    items: [
      { key: 'cmd:one', kind: 'command', icon: 'terminal', title: 'Open issues', groupTitle: 'Pages' },
      { key: 'cmd:two', kind: 'command', icon: 'terminal', title: 'Open pulls', groupTitle: 'Pages' },
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
  contextMenu = await import('../src/ui/contextMenu.js');
  seen = [];
  document.getElementById('opener').focus();
});

afterEach(() => {
  shell.closeCommandPalette();
  dom.window.close();
});

function open(extra = {}) {
  return shell.openCommandPalette({
    labels: labels(),
    search: () => ({ groups: makeGroups(), status: 'ready' }),
    onSelect: (item, options) => seen.push([item.key, options.newTab]),
    onPin: (item) => seen.push(['pin', item.key]),
    onClose: () => {},
    ...extra,
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
});

test('the path renders one segment per level with separators', () => {
  open({ path: [{ label: 'vuejs' }, { label: 'core' }], tip: 'Tip: Backspace leaves vuejs/core' });
  const segments = document.querySelectorAll('.gp-command__path .gp-command__seg');
  assert.deepEqual([...segments].map((node) => node.textContent), ['vuejs', 'core']);
  assert.equal(document.querySelectorAll('.gp-command__path .gp-command__sep').length, 2);
  assert.match(document.querySelector('.gp-command__tip-text').textContent, /vuejs\/core/);
  assert.equal(document.querySelector('.gp-command__field').classList.contains('is-scoped'), true);
});

test('clicking a path segment reports its level without blurring the field', () => {
  const clicks = [];
  open({ path: [{ label: 'vuejs' }, { label: 'core' }], onPathClick: (index) => clicks.push(index) });
  const input = document.querySelector('.gp-command__input');
  const segment = document.querySelectorAll('.gp-command__seg')[0];
  segment.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
  segment.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(clicks, [0]);
  assert.equal(document.activeElement, input);
});

test('setPath swaps the levels and the tip in place', () => {
  const handle = open();
  assert.equal(document.querySelectorAll('.gp-command__seg').length, 0);
  handle.setPath([{ label: 'o' }, { label: 'a' }], 'Tip: inside o/a');
  assert.deepEqual(
    [...document.querySelectorAll('.gp-command__seg')].map((node) => node.textContent),
    ['o', 'a'],
  );
  assert.match(document.querySelector('.gp-command__tip-text').textContent, /o\/a/);
  handle.setPath([], 'Tip: press ? for every shortcut');
  assert.equal(document.querySelectorAll('.gp-command__seg').length, 0);
  assert.equal(document.querySelector('.gp-command__field').classList.contains('is-scoped'), false);
});

test('Tab on a repository row drills into it instead of moving focus', () => {
  const scopes = [];
  open({
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [
      { key: 'repo:o/a', kind: 'repo', title: 'o/a', scopeable: true },
    ] }] }),
    onScope: (item) => { scopes.push(item.key); return true; },
  });
  const input = document.querySelector('.gp-command__input');
  const event = new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  input.dispatchEvent(event);
  assert.deepEqual(scopes, ['repo:o/a']);
  assert.equal(event.defaultPrevented, true);
  assert.equal(document.activeElement, input);
});

test('Tab moves focus for a row that cannot be scoped', () => {
  const scopes = [];
  open({ onScope: (item) => { scopes.push(item.key); return true; } });
  const input = document.querySelector('.gp-command__input');
  const event = new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  input.dispatchEvent(event);
  assert.deepEqual(scopes, []);
  assert.equal(event.defaultPrevented, false);
});

test('Backspace with an empty query pops the last path level', () => {
  let pops = 0;
  open({ path: [{ label: 'o' }, { label: 'a' }], onPathPop: () => { pops += 1; } });
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
  assert.equal(pops, 1);
  input.value = 'src';
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
  assert.equal(pops, 1);
});

test('Ctrl/⌘+Backspace clears the query and the path', () => {
  let clears = 0;
  open({ path: [{ label: 'o' }, { label: 'a' }], onClearPath: () => { clears += 1; } });
  const input = document.querySelector('.gp-command__input');
  input.value = 'src';
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', ctrlKey: true, bubbles: true }));
  assert.equal(clears, 1);
  assert.equal(input.value, '');
  assert.equal(shell.isCommandPaletteOpen(), true);
});

test('Escape closes the palette even with a query', () => {
  open();
  const input = document.querySelector('.gp-command__input');
  input.value = 'rea';
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(shell.isCommandPaletteOpen(), false);
});

test('Ctrl+C copies the active row only when no text is selected', () => {
  const copied = [];
  open({ onCopy: (item) => copied.push(item.key) });
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
  assert.deepEqual(copied, ['cmd:one']);
  input.value = 'abc';
  input.setSelectionRange(0, 3);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
  assert.deepEqual(copied, ['cmd:one']);
});

test('? opens the help popover when the query is empty', () => {
  open({ help: { title: 'Keys', prefixes: [{ key: '>', label: 'commands' }], keys: [{ key: 'Tab', label: 'inside' }], close: 'Esc' } });
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '?', bubbles: true }));
  assert.match(document.querySelector('.gp-command__help').textContent, /commands/);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.querySelector('.gp-command__help'), null);
});

test('arrows move the selection, Enter opens and closes', () => {
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

test('an outside pointer closes and focus returns to the opener', () => {
  open();
  const overlay = document.querySelector('.gp-command-overlay');
  overlay.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
  assert.equal(shell.isCommandPaletteOpen(), false);
  assert.equal(document.activeElement, document.getElementById('opener'));
});

test('the tip strip replaces the footer hints', () => {
  open();
  const tip = document.querySelector('.gp-command__tip');
  assert.ok(tip);
  assert.match(tip.textContent, /Tip/);
  assert.equal(document.querySelector('.gp-command__foot'), null);
  assert.equal(document.querySelector('.gp-command__detail'), null);
});

test('the active row shows what Enter does', () => {
  open();
  const active = document.querySelector('.gp-command__row[aria-selected="true"]');
  assert.match(active.querySelector('.gp-command__hint').textContent, /open/);
});

test('a repository row hints at scoping and jumping', () => {
  open({
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [
      { key: 'repo:a', kind: 'repo', title: 'alpha', scopeable: true, hint: 'Jump to' },
    ] }] }),
  });
  const hint = document.querySelector('.gp-command__hint').textContent;
  assert.match(hint, /scope/);
  assert.match(hint, /Jump to/);
});

test('clicking a row opens it and Ctrl/⌘+click opens a new tab', () => {
  open();
  const rows = document.querySelectorAll('.gp-command__row');
  rows[1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(seen, [['cmd:two', false]]);
  assert.equal(shell.isCommandPaletteOpen(), false);

  open();
  const latest = [...document.querySelectorAll('.gp-command-overlay')].at(-1);
  latest.querySelectorAll('.gp-command__row')[0]
    .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, ctrlKey: true }));
  assert.deepEqual(seen.at(-1), ['cmd:one', true]);
});

test('reopening during the close animation removes the previous overlay', async () => {
  open();
  shell.closeCommandPalette();
  open();
  await new Promise((resolve) => setTimeout(resolve, 180));
  assert.equal(document.querySelectorAll('.gp-command-overlay').length, 1);
  assert.equal(document.querySelectorAll('.gp-command-overlay.is-closing').length, 0);
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

test('a repository row shows its owner avatar and falls back to the glyph', () => {
  open({
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [
      { key: 'repo:a', kind: 'repo', icon: 'repo', title: 'alpha', avatar: 'https://github.com/o.png?size=32' },
    ] }] }),
  });
  const row = document.querySelector('.gp-command__row');
  const img = row.querySelector('.gp-command__avatar');
  assert.ok(img);
  assert.equal(img.getAttribute('alt'), '');
  assert.equal(img.getAttribute('aria-hidden'), 'true');
  assert.equal(row.querySelector('.gp-command__icon svg'), null);
  img.dispatchEvent(new dom.window.Event('error'));
  assert.equal(row.querySelector('.gp-command__avatar'), null);
  assert.ok(row.querySelector('.gp-command__icon svg'));
});

test('a pinned row shows a star before its title', () => {
  open({
    search: () => ({
      groups: [{ id: 'pinned', title: 'Favorites', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha', pinned: true }] }],
    }),
  });
  assert.ok(document.querySelector('.gp-command__row .gp-command__pin'));
});

test('the row menu opens from a right-click and the keyboard', () => {
  const calls = [];
  open({
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha' }] }] }),
    onContextMenu: (item, position) => calls.push([item.key, position.keyboard]),
  });
  document.querySelector('.gp-command__row').dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 60 }));
  document.querySelector('.gp-command__input').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true }));
  assert.deepEqual(calls, [['repo:a', false], ['repo:a', true]]);
});

test('a press inside an open row menu does not close the palette', () => {
  open({
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha' }] }] }),
    onContextMenu: () => contextMenu.openContextMenu({ x: 20, y: 20, label: 'Actions', layer: 'palette', items: [{ label: 'Open', onSelect() {} }] }),
  });
  document.querySelector('.gp-command__row').dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 60 }));
  const menu = document.querySelector('.gp-context-menu');
  menu.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true }));
  assert.equal(shell.isCommandPaletteOpen(), true);
});

test('focus stays inside the palette after a keyboard-opened row menu closes', () => {
  open({
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha' }] }] }),
    onContextMenu: () => {
      contextMenu.openContextMenu({
        anchor: document.querySelector('.gp-command__row'),
        keyboard: true,
        label: 'Actions',
        layer: 'palette',
        items: [{ label: 'Open', onSelect() {} }],
      });
    },
  });
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true }));
  assert.ok(document.querySelector('.gp-context-menu'));
  document.querySelector('.gp-context-menu').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(shell.isCommandPaletteOpen(), true);
  assert.notEqual(document.activeElement, document.body);
  assert.ok(document.querySelector('.gp-command').contains(document.activeElement));
});

test('the palette can take focus back after its row menu closes', () => {
  const handle = open({
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha' }] }] }),
    onContextMenu: () => {},
  });
  const outside = document.createElement('button');
  document.body.appendChild(outside);
  outside.focus();
  handle.focus();
  assert.equal(document.activeElement, document.querySelector('.gp-command__input'));
  outside.remove();
});

test('Tab drills into any scopeable row, not only a repository', () => {
  const scopes = [];
  open({
    search: () => ({ groups: [{ id: 'files', title: 'Files', items: [
      { key: 'file:folder', kind: 'file', title: 'src/', scopeable: true },
    ] }] }),
    onScope: (item) => { scopes.push(item.key); return true; },
  });
  const input = document.querySelector('.gp-command__input');
  const event = new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  input.dispatchEvent(event);
  assert.deepEqual(scopes, ['file:folder']);
  assert.equal(event.defaultPrevented, true);
});

test('right arrow drills into the active scopeable row while the field is empty', () => {
  const scopes = [];
  open({
    search: () => ({ groups: [{ id: 'files', title: 'Files', items: [
      { key: 'file:folder', kind: 'file', title: 'src/', scopeable: true },
    ] }] }),
    onScope: (item) => { scopes.push(item.key); return true; },
  });
  const input = document.querySelector('.gp-command__input');
  const event = new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
  input.dispatchEvent(event);
  assert.deepEqual(scopes, ['file:folder']);
  assert.equal(event.defaultPrevented, true);
});

test('left arrow leaves one path level while the field is empty', () => {
  const pops = [];
  open({
    path: [{ label: 'alice' }, { label: 'repo' }, { label: 'src' }],
    onPathPop: () => pops.push('pop'),
  });
  const input = document.querySelector('.gp-command__input');
  const event = new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
  input.dispatchEvent(event);
  assert.deepEqual(pops, ['pop']);
  assert.equal(event.defaultPrevented, true);
});

test('arrows move the caret, not the path, while a query is typed', () => {
  const scopes = [];
  const pops = [];
  open({
    path: [{ label: 'alice' }, { label: 'repo' }],
    search: () => ({ groups: [{ id: 'files', title: 'Files', items: [
      { key: 'file:folder', kind: 'file', title: 'src/', scopeable: true },
    ] }] }),
    onScope: (item) => { scopes.push(item.key); return true; },
    onPathPop: () => pops.push('pop'),
  });
  const input = document.querySelector('.gp-command__input');
  input.value = 'src';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const right = new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
  const left = new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
  input.dispatchEvent(right);
  input.dispatchEvent(left);
  assert.deepEqual(scopes, []);
  assert.deepEqual(pops, []);
  assert.equal(right.defaultPrevented, false);
  assert.equal(left.defaultPrevented, false);
});

test('closing, reopening and closing again removes every overlay', async () => {
  open();
  shell.closeCommandPalette();
  open();
  shell.closeCommandPalette();
  await new Promise((resolve) => setTimeout(resolve, 180));
  assert.equal(document.querySelectorAll('.gp-command-overlay').length, 0);
});
