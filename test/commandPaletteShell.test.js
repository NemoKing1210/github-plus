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
    tipHelp: 'shortcuts',
    hintOpen: 'open',
    hintScope: 'scope',
    hintExpand: 'actions',
    scopeRemove: 'remove scope',
    help: { title: 'Keyboard shortcuts', prefixes: [], keys: [], close: 'close' },
    rowMenu: 'Actions',
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
  contextMenu = await import('../src/ui/contextMenu.js');
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
    search: () => ({ groups: makeGroups(), status: 'ready' }),
    renderExpansion: (item) => {
      const node = document.createElement('div');
      node.textContent = `details:${item.title}`;
      node.appendChild(Object.assign(document.createElement('button'), { textContent: 'Open' }));
      return node;
    },
    onSelect: (item, options) => seen.push([item.key, options.newTab]),
    onPin: (item) => seen.push(['pin', item.key]),
    onClose: () => {},
  });
}

test('ArrowRight expands the active row and ArrowLeft collapses it', () => {
  open();
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  const row = document.querySelector('.gp-command__row[aria-selected="true"]');
  assert.equal(row.getAttribute('aria-expanded'), 'true');
  assert.match(document.querySelector('.gp-command__expansion').textContent, /details:Open issues/);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert.equal(document.querySelector('.gp-command__expansion'), null);
  assert.equal(
    document.querySelector('.gp-command__row[aria-selected="true"]').getAttribute('aria-expanded'),
    'false',
  );
});

test('moving the selection collapses the expansion', () => {
  open();
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(document.querySelector('.gp-command__expansion'), null);
});

test('Tab moves focus into the expanded actions and Shift+Tab returns', () => {
  open();
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  assert.equal(document.activeElement, document.querySelector('.gp-command__expansion button'));
  document.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
  assert.equal(document.activeElement, input);
});

test('Tab scopes a repository row and the chip clears it', () => {
  const scopes = [];
  shell.openCommandPalette({
    labels: labels(),
    scope: null,
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [
      { key: 'repo:o/a', kind: 'repo', title: 'o/a' },
      { key: 'cmd:x', kind: 'command', title: 'Run' },
    ] }] }),
    onScope: (item) => { scopes.push(item.key); return item.kind === 'repo'; },
    onClearScope: () => scopes.push('clear'),
  });
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  assert.deepEqual(scopes, ['repo:o/a']);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  assert.deepEqual(scopes, ['repo:o/a']);
});

test('the scope chip renders and clears the scope', () => {
  let handle;
  handle = shell.openCommandPalette({
    labels: labels(), scope: { label: 'vuejs / core' }, search: () => ({ groups: [] }),
    onClearScope: () => handle.setScope(null),
  });
  const chip = document.querySelector('.gp-command__scope');
  assert.match(chip.textContent, /vuejs \/ core/);
  chip.click();
  assert.equal(document.querySelector('.gp-command__scope'), null);
});

test('Backspace pops the scope before it edits text', () => {
  let cleared = 0;
  shell.openCommandPalette({
    labels: labels(), scope: { label: 'o/a' }, search: () => ({ groups: [] }),
    onClearScope: () => { cleared += 1; },
  });
  document.querySelector('.gp-command__input')
    .dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
  assert.equal(cleared, 1);
});

test('Escape walks back help, expansion, query, scope, then closes', () => {
  let cleared = 0;
  let handle;
  handle = shell.openCommandPalette({
    labels: labels(), scope: { label: 'o/a' }, search: () => ({ groups: makeGroups() }),
    renderExpansion: () => { const n = document.createElement('div'); n.appendChild(document.createElement('button')); return n; },
    onClearScope: () => { cleared += 1; handle.setScope(null); },
  });
  const input = document.querySelector('.gp-command__input');
  input.value = 'x'; handle.refresh();
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.querySelector('.gp-command__expansion'), null);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(input.value, '');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(cleared, 1);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(shell.isCommandPaletteOpen(), false);
});

test('Ctrl+C copies the active row only when no text is selected', () => {
  const copied = [];
  shell.openCommandPalette({
    labels: labels(), search: () => ({ groups: makeGroups() }),
    onCopy: (item) => copied.push(item.key),
  });
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
  assert.deepEqual(copied, ['cmd:one']);
  input.value = 'abc';
  input.setSelectionRange(0, 3);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
  assert.deepEqual(copied, ['cmd:one']);
});

test('? opens the help popover when the query is empty', () => {
  shell.openCommandPalette({
    labels: labels(), search: () => ({ groups: [] }),
    help: { title: 'Keys', prefixes: [{ key: '>', label: 'commands' }], keys: [{ key: 'Tab', label: 'inside' }], close: 'Esc' },
  });
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '?', bubbles: true }));
  assert.match(document.querySelector('.gp-command__help').textContent, /commands/);
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.querySelector('.gp-command__help'), null);
});

test('the chevron toggles the expansion without selecting the row', () => {
  open();
  const chev = document.querySelector('.gp-command__chev');
  chev.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(document.querySelector('.gp-command__expansion') !== null, true);
  assert.deepEqual(seen, []);
});

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

test('the tip strip replaces the footer hints', () => {
  open();
  const tip = document.querySelector('.gp-command__tip');
  assert.ok(tip);
  assert.match(tip.textContent, /Tip/);
  assert.equal(document.querySelector('.gp-command__foot'), null);
  assert.equal(document.querySelector('.gp-command__detail'), null);
});

test('the active row shows key hints', () => {
  open();
  const active = document.querySelector('.gp-command__row[aria-selected="true"]');
  assert.match(active.querySelector('.gp-command__hint').textContent, /open/);
  assert.match(active.querySelector('.gp-command__hint').textContent, /actions/);
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

test('a pinned row shows a star before its title', () => {
  shell.openCommandPalette({
    labels: labels(),
    search: () => ({
      groups: [{ id: 'pinned', title: 'Favorites', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha', pinned: true }] }],
    }),
    onSelect: () => {},
    onPin: () => {},
  });
  assert.ok(document.querySelector('.gp-command__row .gp-command__pin'));
});

test('a repository row hints at scoping', () => {
  shell.openCommandPalette({
    labels: labels(),
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha' }] }] }),
  });
  assert.match(document.querySelector('.gp-command__hint').textContent, /scope/);
});

test('the row menu opens from a right-click and the keyboard', () => {
  const calls = [];
  shell.openCommandPalette({
    labels: labels(),
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha' }] }] }),
    onContextMenu: (item, position) => calls.push([item.key, position.keyboard]),
  });
  document.querySelector('.gp-command__row').dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 60 }));
  document.querySelector('.gp-command__input').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true }));
  assert.deepEqual(calls, [['repo:a', false], ['repo:a', true]]);
});

test('a press inside an open row menu does not close the palette', () => {
  shell.openCommandPalette({
    labels: labels(),
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha' }] }] }),
    onContextMenu: () => contextMenu.openContextMenu({ x: 20, y: 20, label: 'Actions', layer: 'palette', items: [{ label: 'Open', onSelect() {} }] }),
  });
  document.querySelector('.gp-command__row').dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 60 }));
  const menu = document.querySelector('.gp-context-menu');
  menu.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true }));
  assert.equal(shell.isCommandPaletteOpen(), true);
});

test('focus stays inside the palette after a keyboard-opened row menu closes', () => {
  shell.openCommandPalette({
    labels: labels(),
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [{ key: 'repo:a', kind: 'repo', title: 'alpha' }] }] }),
    onContextMenu: (item) => {
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
  const handle = shell.openCommandPalette({
    labels: labels(),
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

test('Enter inside an expansion activates the focused action, not the row', () => {
  open();
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  const action = document.querySelector('.gp-command__expansion button');
  assert.equal(document.activeElement, action);
  action.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.deepEqual(seen, []);
  assert.equal(shell.isCommandPaletteOpen(), true);
});

test('collapsing an expansion that holds focus returns focus to the field', () => {
  open();
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  document.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(document.querySelector('.gp-command__expansion'), null);
  assert.equal(document.activeElement, input);
});

test('a background refresh rebuilds the expansion and keeps focus in the palette', () => {
  const handle = open();
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  assert.notEqual(document.activeElement, input);
  handle.refresh();
  assert.equal(document.querySelector('.gp-command__expansion') !== null, true);
  assert.equal(document.activeElement, input);
});

test('Tab inside a repository expansion never scopes the repository', () => {
  const scopes = [];
  shell.openCommandPalette({
    labels: labels(),
    search: () => ({ groups: [{ id: 'repos', title: 'Repos', items: [{ key: 'repo:o/a', kind: 'repo', title: 'o/a' }] }] }),
    renderExpansion: () => {
      const node = document.createElement('div');
      node.innerHTML = '<button type="button">One</button><button type="button">Two</button>';
      return node;
    },
    onScope: (item) => { scopes.push(item.key); return true; },
  });
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  document.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  assert.deepEqual(scopes, []);
});

test('Escape closes help before the expansion', () => {
  shell.openCommandPalette({
    labels: labels(),
    search: () => ({ groups: makeGroups() }),
    renderExpansion: () => { const node = document.createElement('div'); node.appendChild(document.createElement('button')); return node; },
    help: { title: 'Keys', prefixes: [{ key: '>', label: 'commands' }], keys: [{ key: 'Tab', label: 'inside' }], close: 'Esc' },
  });
  const input = document.querySelector('.gp-command__input');
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '?', bubbles: true }));
  assert.ok(document.querySelector('.gp-command__help'));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.querySelector('.gp-command__help'), null);
  assert.ok(document.querySelector('.gp-command__expansion'));
  input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.querySelector('.gp-command__expansion'), null);
});
