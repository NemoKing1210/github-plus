import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {} };

test('command palette defaults', async () => {
  const { getDefaults } = await import('../src/core/constants.js');
  assert.deepEqual(getDefaults().commandPalette, {
    enabled: true,
    shortcut: 'mod+k',
    token: '',
    sources: { commands: true, repositories: true, starred: true, files: true, recent: true },
    hideForks: false,
    hideArchived: false,
    showDetails: true,
    cacheHours: 6,
    maxResults: 30,
  });
});

test('normalization clamps, whitelists and trims', async () => {
  const { getDefaults } = await import('../src/core/constants.js');
  const { normalizeCommandPalette } = await import('../src/core/settings.js');
  const next = normalizeCommandPalette({
    shortcut: 'hyper+k',
    token: `  ${'x'.repeat(900)}  `,
    sources: { commands: false, nonsense: true },
    cacheHours: 9999,
    maxResults: 5,
  }, getDefaults().commandPalette);
  assert.equal(next.shortcut, 'mod+k');
  assert.equal(next.token.length, 400);
  assert.equal(next.sources.commands, false);
  assert.equal('nonsense' in next.sources, false);
  assert.equal(next.cacheHours, 168);
  assert.equal(next.maxResults, 10);
});

test('backups never carry a token', async () => {
  const { getDefaults } = await import('../src/core/constants.js');
  const { normalizeImportedSettings, toExportableSettings } = await import('../src/core/settings.js');
  const imported = normalizeImportedSettings({ commandPalette: { token: 'ghp_secret' } });
  assert.equal(imported.commandPalette.token, '');
  const live = getDefaults();
  live.commandPalette.token = 'ghp_secret';
  const exported = toExportableSettings(live);
  assert.equal(exported.commandPalette.token, '');
  assert.equal(live.commandPalette.token, 'ghp_secret');
});

test('palette diagnostics codes are registered', async () => {
  const { Codes } = await import('../src/core/logger/index.js');
  assert.equal(Codes.PALETTE_LOAD, 'GP-1701');
  assert.equal(Codes.PALETTE_CACHE, 'GP-1702');
});

test('a custom shortcut is accepted and nonsense falls back', async () => {
  const { getDefaults } = await import('../src/core/constants.js');
  const { normalizeCommandPalette } = await import('../src/core/settings.js');
  const defaults = getDefaults().commandPalette;
  assert.equal(normalizeCommandPalette({ shortcut: 'ctrl+alt+p' }, defaults).shortcut, 'ctrl+alt+p');
  assert.equal(normalizeCommandPalette({ shortcut: ' Mod+Shift+K ' }, defaults).shortcut, 'mod+shift+k');
  assert.equal(normalizeCommandPalette({ shortcut: 'k' }, defaults).shortcut, 'mod+k');
  assert.equal(normalizeCommandPalette({ shortcut: 'hyper+k' }, defaults).shortcut, 'mod+k');
});
