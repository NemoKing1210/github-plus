import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', {
  pretendToBeVisual: true, url: 'https://github.com/o/r',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;

const { getDefaults } = await import('../src/core/constants.js');
const { renderCommits } = await import('../src/features/settings/tabs/commits.js');

test('the commit page renders the master switch, two rows and a legend', () => {
  const host = document.getElementById('host');
  host.replaceChildren();
  renderCommits(host, getDefaults());
  assert.equal(document.querySelectorAll('.gp-card').length, 1);
  assert.equal(document.querySelectorAll('.gp-switch').length, 3); // master + 2 rows
  assert.equal(document.querySelectorAll('.gp-commit-legend .gp-commit-type').length, 11);
  assert.ok(document.querySelector('.gp-commit-type--feat'));
});

test('the switches mutate the draft', () => {
  const host = document.getElementById('host');
  host.replaceChildren();
  const draft = getDefaults();
  renderCommits(host, draft);
  // The master switch sits in the card head, so the two rows follow it.
  const inputs = document.querySelectorAll('.gp-switch__input');
  inputs[1].checked = false;
  inputs[1].dispatchEvent(new dom.window.Event('change'));
  assert.equal(draft.commitBadges.unknownTypes, false);
});
