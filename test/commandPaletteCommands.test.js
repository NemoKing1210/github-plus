import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

beforeEach(() => {
  delete globalThis.GM_xmlhttpRequest;
});

const { commandCandidates, searchCommands } = await import('../src/features/commandPalette/commands.js');
const { searchUrl, togglePatch } = await import('../src/features/commandPalette/actions.js');

const settings = {
  sources: { commands: true },
  shortcuts: {},
};

test('repository commands appear only on a repository page', () => {
  const withRepo = commandCandidates({ context: { repo: 'o/r', login: 'alice' }, settings, cache: null });
  const keys = withRepo.map((item) => item.key);
  assert.ok(keys.includes('cmd:repo.code'));
  assert.ok(keys.includes('cmd:repo.issues'));
  assert.ok(keys.includes('cmd:user.profile'));
  const withoutRepo = commandCandidates({ context: { repo: null, login: 'alice' }, settings, cache: null });
  assert.equal(withoutRepo.some((item) => item.key === 'cmd:repo.code'), false);
  assert.ok(withoutRepo.some((item) => item.key === 'cmd:user.profile'));
});

test('repository commands follow the palette scope', () => {
  const state = {
    context: { repo: 'o/page', login: 'alice' },
    scope: { repo: 'vuejs/core' },
    settings,
    cache: null,
  };
  const urls = commandCandidates(state)
    .filter((item) => item.groupId === 'repository')
    .map((item) => item.data.run.url);
  assert.ok(urls.length > 0);
  assert.ok(urls.every((url) => url.startsWith('https://github.com/vuejs/core')));
});

test('every command carries a run descriptor and a stable icon', () => {
  const commands = commandCandidates({ context: { repo: 'o/r', login: 'alice' }, settings, cache: null });
  for (const item of commands) {
    assert.equal(item.kind, 'command');
    assert.ok(item.data?.run?.type, item.key);
    assert.ok(item.icon, item.key);
    assert.ok(item.groupId, item.key);
  }
});

test('the search command encodes the query and its scopes', () => {
  const [command] = searchCommands('a b');
  assert.equal(command.key, 'cmd:search');
  assert.equal(command.data.run.url, 'https://github.com/search?q=a%20b&type=repositories');
  assert.deepEqual(command.data.searchScopes, ['repositories', 'code', 'issues', 'users']);
  assert.equal(command.title, 'Search GitHub for “a b”');
  assert.equal(searchUrl('code', 'a b'), 'https://github.com/search?q=a%20b&type=code');
  assert.equal(searchUrl('users', 'x'), 'https://github.com/search?q=x&type=users');
});

test('togglePatch carries the live section, not just the switch', () => {
  const patch = togglePatch('fileIcons', false);
  assert.equal(patch.fileIcons.enabled, false);
  assert.equal(patch.fileIcons.folders, true);
  assert.equal(patch.fileIcons.specialNames, true);
});
