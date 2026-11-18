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

test('repository pages replace the account pages inside a repository scope', () => {
  const scoped = commandCandidates({
    context: { repo: 'o/r', login: 'alice' }, scope: { repo: 'o/r' }, settings, cache: null,
  });
  const keys = scoped.map((item) => item.key);
  assert.ok(keys.includes('cmd:repo.home'));
  assert.ok(keys.includes('cmd:repo.code'));
  assert.ok(keys.includes('cmd:repo.issues'));
  assert.equal(keys.includes('cmd:user.profile'), false);
  const root = commandCandidates({ context: { repo: 'o/r', login: 'alice' }, scope: null, settings, cache: null });
  assert.equal(root.some((item) => item.key === 'cmd:repo.code'), false);
  assert.ok(root.some((item) => item.key === 'cmd:user.profile'));
});

test('the Issues and Pull requests page rows open a list level', () => {
  const scoped = commandCandidates({
    context: { repo: 'o/r', login: 'alice' }, scope: { repo: 'o/r' }, settings, cache: null,
  });
  const issues = scoped.find((item) => item.key === 'cmd:repo.issues');
  const pulls = scoped.find((item) => item.key === 'cmd:repo.pulls');
  assert.equal(issues.scopeable, true);
  assert.equal(issues.listing, 'issue');
  assert.equal(issues.data.repo, 'o/r');
  assert.equal(issues.hint, 'Jump to');
  assert.equal(pulls.scopeable, true);
  assert.equal(pulls.listing, 'pullRequest');
  assert.equal(scoped.find((item) => item.key === 'cmd:repo.code').scopeable, false);
});

test('a listing level searches its kind inside the repository', () => {
  const [row] = searchCommands('bug', { scope: { repo: 'o/r', listing: 'issue' }, mode: 'all' });
  assert.match(row.data.run.url, /type=issues/);
  assert.match(row.data.run.url, /repo%3Ao%2Fr\+bug/);
});

test('repository commands follow the palette scope', () => {
  const state = {
    context: { repo: 'o/page', login: 'alice' },
    scope: { repo: 'vuejs/core' },
    settings,
    cache: null,
  };
  const urls = commandCandidates(state)
    .filter((item) => item.groupId === 'pages')
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

test('the search command follows the prefix and the scope', () => {
  const [command] = searchCommands('a b');
  assert.equal(command.key, 'cmd:search');
  assert.equal(command.data.run.url, 'https://github.com/search?q=a%20b&type=repositories');
  assert.equal(command.data.searchType, 'repositories');
  assert.equal(command.title, 'Search GitHub for “a b”');
  assert.equal(searchUrl('code', 'a b'), 'https://github.com/search?q=a%20b&type=code');
  assert.equal(searchUrl('users', 'x'), 'https://github.com/search?q=x&type=users');
});

test('prefixes hand a query to the matching GitHub search', () => {
  const scope = { repo: 'o/r' };
  const urlFor = (mode) => searchCommands('x', { scope, mode })[0]?.data.run.url;
  assert.equal(urlFor('all'), 'https://github.com/search?q=repo%3Ao%2Fr+x&type=code');
  assert.equal(urlFor('files'), 'https://github.com/search?q=repo%3Ao%2Fr+x&type=code');
  assert.equal(urlFor('issues'), 'https://github.com/search?q=repo%3Ao%2Fr+x&type=issues');
  assert.equal(urlFor('repos'), 'https://github.com/search?q=x&type=repositories');
  assert.deepEqual(searchCommands('x', { mode: 'commands' }), []);
});

test('togglePatch carries the live section, not just the switch', () => {
  const patch = togglePatch('fileIcons', false);
  assert.equal(patch.fileIcons.enabled, false);
  assert.equal(patch.fileIcons.folders, true);
  assert.equal(patch.fileIcons.specialNames, true);
});

test('a token identity supplies the account when the page has no login', () => {
  const commands = commandCandidates({
    context: { repo: null, login: null }, identity: 'alice', scope: null, settings, cache: null,
  });
  const urls = commands.filter((item) => item.groupId === 'pages').map((item) => item.data.run.url);
  assert.ok(urls.includes('https://github.com/alice'));
  assert.ok(urls.includes('https://github.com/alice?tab=repositories'));
  assert.ok(!urls.some((url) => url.includes('/null')));
});

test('account and repository pages include creation shortcuts', () => {
  const scoped = commandCandidates({
    context: { repo: 'o/r', login: 'alice' }, scope: { repo: 'o/r' }, settings, cache: null,
  });
  assert.ok(scoped.some((item) => item.data.run.url === 'https://github.com/o/r/issues/new'));
  assert.ok(scoped.some((item) => item.data.run.url === 'https://github.com/o/r/compare'));
  const root = commandCandidates({
    context: { repo: 'o/r', login: 'alice' }, scope: null, settings, cache: null,
  });
  assert.ok(root.some((item) => item.data.run.url === 'https://github.com/new'));
});

test('the refresh command carries the scoped repository and ref', () => {
  const scoped = commandCandidates({
    context: { repo: 'o/page', ref: 'dev', login: 'alice' },
    scope: { repo: 'o/other' },
    settings,
    cache: null,
  });
  const refresh = scoped.find((item) => item.data.run.type === 'refreshTree');
  assert.deepEqual(refresh.data.run, { type: 'refreshTree', repo: 'o/other', ref: 'HEAD' });

  const page = commandCandidates({
    context: { repo: 'o/page', ref: 'dev', login: 'alice' }, scope: null, settings, cache: null,
  });
  const pageRefresh = page.find((item) => item.data.run.type === 'refreshTree');
  assert.deepEqual(pageRefresh.data.run, { type: 'refreshTree', repo: 'o/page', ref: 'dev' });
});

test('the palette can toggle commit badges', () => {
  const commands = commandCandidates({
    context: { repo: 'o/r', login: 'alice' }, settings, cache: null,
  });
  const toggle = commands.find((item) => item.key === 'cmd:toggle.commitBadges');
  assert.ok(toggle);
  assert.equal(toggle.data.run.type, 'toggle');
  assert.equal(toggle.data.run.section, 'commitBadges');
  assert.equal(toggle.data.run.enabled, false);
});
