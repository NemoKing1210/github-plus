import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  parseRepoPath, parseRef, readContext, resolveIdentity, tokenFingerprint,
} from '../src/features/commandPalette/context.js';

test('reserved roots are not repositories', () => {
  assert.equal(parseRepoPath('/NemoKing1210/github-plus/tree/main/src'), 'NemoKing1210/github-plus');
  assert.equal(parseRepoPath('/settings/profile'), null);
  assert.equal(parseRepoPath('/orgs/acme/repositories'), null);
  assert.equal(parseRepoPath('/'), null);
});

test('URL ref parsing is a first-segment fallback', () => {
  assert.equal(parseRef('/o/r/blob/feature/x/a.js'), 'feature');
  assert.equal(parseRef('/o/r'), null);
});

test('embedded page data wins for refs with slashes', () => {
  const doc = new JSDOM(`<meta name="octolytics-dimension-repository_nwo" content="o/r">
    <meta name="user-login" content="alice">
    <react-app data-target="react-app.embeddedData"
      data-payload='{"payload":{"refInfo":{"name":"feature/x"}}}'></react-app>`).window.document;
  const context = readContext(doc, new URL('https://github.com/o/r/blob/feature/x/a.js'));
  assert.equal(context.login, 'alice');
  assert.equal(context.repo, 'o/r');
  assert.equal(context.ref, 'feature/x');
});

test('default branch meta is the next fallback', () => {
  const doc = new JSDOM(`<meta name="octolytics-dimension-repository_nwo" content="o/r">
    <meta name="octolytics-dimension-repository_default_branch" content="trunk">`).window.document;
  assert.equal(readContext(doc, new URL('https://github.com/o/r')).ref, 'trunk');
});

test('gist pages have no repository', () => {
  const doc = new JSDOM('<meta name="user-login" content="alice">').window.document;
  assert.equal(readContext(doc, new URL('https://gist.github.com/alice/abc')).repo, null);
});

test('identity follows a verified token, then the page login', () => {
  assert.equal(resolveIdentity({ token: '', pageLogin: 'alice', tokenLogin: null }), 'alice');
  assert.equal(resolveIdentity({ token: 't', pageLogin: 'alice', tokenLogin: 'bob' }), 'bob');
  assert.equal(resolveIdentity({ token: 't', pageLogin: 'alice', tokenLogin: null }), null);
});

test('token fingerprints are stable and never contain the token', () => {
  const fingerprint = tokenFingerprint('ghp_secret');
  assert.match(fingerprint, /^v1:[0-9a-f]{8}$/);
  assert.equal(fingerprint, tokenFingerprint('ghp_secret'));
  assert.equal(tokenFingerprint(''), '');
});
