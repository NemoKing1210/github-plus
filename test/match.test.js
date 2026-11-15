import test from 'node:test';
import assert from 'node:assert/strict';
import { pickIcon } from '../src/features/fileIcons/match.js';
import { DEFAULT_FILE, DEFAULT_FOLDER } from '../src/features/fileIcons/iconSet.generated.js';

test('maps common languages by extension', () => {
  assert.equal(pickIcon('index.js', 'file'), 'javascript');
  assert.equal(pickIcon('main.go', 'file'), 'go');
  assert.equal(pickIcon('style.scss', 'file'), 'sass');
  assert.equal(pickIcon('App.tsx', 'file'), 'react_ts');
  assert.equal(pickIcon('types.ts', 'file'), 'typescript');
});

test('prefers the longest matching extension', () => {
  assert.equal(pickIcon('types.d.ts', 'file'), 'typescript-def');
});

test('matches well-known filenames case-insensitively', () => {
  assert.equal(pickIcon('Dockerfile', 'file'), 'docker');
  assert.equal(pickIcon('dockerfile', 'file'), 'docker');
  assert.equal(pickIcon('package.json', 'file'), 'nodejs');
  assert.equal(pickIcon('README.md', 'file'), 'readme');
  assert.equal(pickIcon('LICENSE', 'file'), 'license');
  assert.equal(pickIcon('.gitignore', 'file'), 'git');
});

test('falls back to the default file icon', () => {
  assert.equal(pickIcon('archive.unknownext', 'file'), DEFAULT_FILE);
  assert.equal(pickIcon('noextension', 'file'), DEFAULT_FILE);
  assert.equal(pickIcon('', 'file'), DEFAULT_FILE);
});

test('special names can be disabled, leaving the extension match', () => {
  assert.equal(pickIcon('package.json', 'file', { specialNames: false }), 'json');
  assert.equal(pickIcon('index.js', 'file', { specialNames: false }), 'javascript');
});

test('maps folders by name', () => {
  assert.equal(pickIcon('src', 'folder'), 'folder-src');
  assert.equal(pickIcon('node_modules', 'folder'), 'folder-node');
  assert.equal(pickIcon('.github', 'folder'), 'folder-github');
  assert.equal(pickIcon('SRC', 'folder'), 'folder-src');
});

test('falls back to the default folder icon', () => {
  assert.equal(pickIcon('somewhere', 'folder'), DEFAULT_FOLDER);
  assert.equal(pickIcon('src', 'folder', { folders: false }), DEFAULT_FOLDER);
});
