import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://github.com/sveltejs/svelte' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.HTMLElement = dom.window.HTMLElement;

const { resolveSidebar, isPublicRepo, currentRepo, SIDEBAR_HEADING } = await import(
  '../src/features/similarRepos/surfaces.js'
);
const { renderPanel, PANEL_CLASS } = await import('../src/features/similarRepos/render.js');

function page(body) {
  document.body.innerHTML = body;
}

const HEADING = (text) => `<h2><span>${text}</span></h2>`;

test('resolves the shared parent of two sidebar headings', () => {
  page(`
    <main>
      <article>${HEADING('Releases')}</article>
      <div class="sidebar">${HEADING('Releases')}${HEADING('Contributors')}</div>
    </main>
  `);
  const result = resolveSidebar();
  assert.ok(result);
  assert.equal(result.container.className, 'sidebar');
});

test('ignores a Releases heading inside the README and needs two headings or a lone section', () => {
  page(`
    <main>
      <article id="readme">${HEADING('Releases')}</article>
    </main>
  `);
  assert.equal(resolveSidebar(), null);
});

test('falls back to the layout sidebar when no heading matches', () => {
  page('<main><div class="Layout-sidebar">about</div></main>');
  const result = resolveSidebar();
  assert.equal(result.container.className, 'Layout-sidebar');
});

test('an empty page has no sidebar', () => {
  page('<main><article>nothing</article></main>');
  assert.equal(resolveSidebar(), null);
});

test('matches a heading with a count suffix', () => {
  assert.match('Contributors 1,234', SIDEBAR_HEADING);
  assert.match('Languages 42 (3)', SIDEBAR_HEADING);
  assert.doesNotMatch('Releases and downloads', SIDEBAR_HEADING);
});

test('visibility: a true meta is public, a false meta, a Private label or no marker is not', () => {
  page('<meta name="octolytics-dimension-repository_public" content="true">');
  assert.equal(isPublicRepo(), true);
  page('<meta name="octolytics-dimension-repository_public" content="false">');
  assert.equal(isPublicRepo(), false);
  page('<span class="Label">Private</span>');
  assert.equal(isPublicRepo(), false);
  page('<div>no marker at all</div>');
  assert.equal(isPublicRepo(), false);
});

test('reads owner/name from the page address', () => {
  assert.equal(currentRepo(), 'sveltejs/svelte');
});

test('renders rows with name, description, language colour, counts and a match', () => {
  const panel = renderPanel({
    repo: 'sveltejs/svelte',
    labels: { title: 'Similar repositories', more: 'View more', archived: 'archived', match: '{percent}% match' },
    rows: [
      {
        repo: 'sveltejs/kit',
        description: 'web development, streamlined',
        language: 'JavaScript',
        stars: 20908,
        forks: 2385,
        archived: false,
        percent: 100,
      },
    ],
    onMore: () => {},
  });
  document.body.appendChild(panel);
  assert.ok(panel.classList.contains(PANEL_CLASS));
  const link = panel.querySelector('a.gp-similar__name');
  assert.equal(link.getAttribute('href'), '/sveltejs/kit');
  assert.match(link.textContent, /sveltejs\//);
  assert.match(link.textContent, /kit/);
  assert.match(panel.textContent, /web development, streamlined/);
  assert.match(panel.textContent, /JavaScript/);
  assert.match(panel.textContent, /20\.9k|20,908/);
  assert.match(panel.textContent, /100% match/);
  assert.equal(panel.querySelector('.gp-similar__more'), null);
});

test('an archived row is labelled and a full page offers View more', () => {
  let more = 0;
  const panel = renderPanel({
    repo: 'a/b',
    labels: { title: 'Similar repositories', more: 'View more', archived: 'archived', match: '{percent}% match' },
    rows: [{ repo: 'c/d', description: '', language: '', stars: 0, forks: 0, archived: true, percent: 40 }],
    hasMore: true,
    onMore: () => {
      more += 1;
    },
  });
  assert.ok(panel.querySelector('.gp-similar__archived'));
  const button = panel.querySelector('.gp-similar__more');
  assert.ok(button);
  button.click();
  assert.equal(more, 1);
});

test('every state renders its own localized paragraph', () => {
  for (const state of ['empty', 'not-in-dataset', 'rate-limited', 'star-required', 'failed']) {
    const panel = renderPanel({
      repo: 'a/b',
      labels: {
        title: 'Similar repositories',
        more: 'View more',
        archived: 'archived',
        match: '{percent}% match',
        states: { [state]: `${state} message` },
      },
      rows: [],
      state,
    });
    const paragraph = panel.querySelector('.gp-similar__state');
    assert.ok(paragraph, `state ${state} has a paragraph`);
    assert.match(paragraph.textContent, new RegExp(state));
  }
});

test('the loading state draws placeholder rows in the shape of a result', () => {
  const panel = renderPanel({
    labels: {
      title: 'Similar repositories',
      more: 'View more',
      archived: 'archived',
      match: '{percent}% match',
      states: { loading: 'Loading similar repositories' },
    },
    rows: [],
    state: 'loading',
  });
  assert.equal(panel.getAttribute('aria-busy'), 'true');
  assert.equal(panel.querySelector('.gp-similar__state'), null, 'no text block while the skeleton shows');
  const rows = panel.querySelectorAll('.gp-similar__skeleton');
  assert.equal(rows.length, 3);
  assert.equal(rows[0].getAttribute('aria-hidden'), null, 'the item carries aria-hidden');
  assert.equal(rows[0].parentElement.getAttribute('aria-hidden'), 'true');
  assert.ok(rows[0].querySelector('.gp-similar__skeleton-avatar'));
  assert.ok(rows[0].querySelector('.gp-similar__skeleton-name'));
  assert.ok(rows[0].querySelector('.gp-similar__skeleton-desc'));
  assert.ok(rows[0].querySelector('.gp-similar__skeleton-meta'));
  const announcer = panel.querySelector('.gp-similar__announcer');
  assert.equal(announcer.textContent, 'Loading similar repositories');
});

test('a row is one link with an avatar, a language swatch and labelled counts', () => {
  const panel = renderPanel({
    labels: {
      title: 'Similar repositories',
      more: 'View more',
      archived: 'archived',
      match: '{percent}% match',
      stars: '{count} stars',
      forks: '{count} forks',
    },
    rows: [{
      repo: 'sveltejs/kit',
      description: 'web development, streamlined',
      language: 'JavaScript',
      stars: 20908,
      forks: 2385,
      archived: false,
      percent: 100,
    }],
  });

  const card = panel.querySelector('a.gp-similar__card');
  assert.ok(card);
  assert.equal(card.getAttribute('href'), '/sveltejs/kit');
  assert.equal(card.querySelector('.gp-similar__owner').textContent, 'sveltejs/');
  assert.equal(card.querySelector('.gp-similar__repo').textContent, 'kit');

  const dot = card.querySelector('.gp-similar__lang-dot');
  assert.ok(dot);
  assert.match(dot.getAttribute('style'), /--gp-lang-javascript/);
  assert.equal(card.querySelector('.gp-similar__lang-name').textContent, 'JavaScript');

  const image = card.querySelector('.gp-similar__avatar-img');
  assert.equal(image.getAttribute('src'), 'https://github.com/sveltejs.png?size=64');
  assert.equal(image.getAttribute('alt'), '');
  const avatar = card.querySelector('.gp-similar__avatar');
  avatar.querySelector('img').dispatchEvent(new window.Event('error'));
  assert.ok(avatar.classList.contains('is-broken'));
  assert.equal(card.querySelector('.gp-similar__avatar-fallback').textContent, 'K');

  const counts = [...panel.querySelectorAll('.gp-similar__count')];
  assert.equal(counts.length, 2);
  assert.equal(counts[0].getAttribute('aria-label'), '20908 stars');
  assert.equal(counts[1].getAttribute('aria-label'), '2385 forks');
  assert.equal(counts[0].querySelector('.gp-similar__glyph svg') !== null, true);
  assert.equal(panel.querySelector('.gp-similar__rail'), null, 'no rail: the row is a GitHub list item');
});

test('a busy page disables View more and marks it busy', () => {
  let more = 0;
  const panel = renderPanel({
    labels: { title: 'Similar repositories', more: 'View more', archived: 'archived', match: '{percent}% match' },
    rows: [{ repo: 'c/d', description: '', language: '', stars: 0, forks: 0, archived: false, percent: 40 }],
    hasMore: true,
    moreBusy: true,
    onMore: () => {
      more += 1;
    },
  });
  const button = panel.querySelector('.gp-similar__more');
  assert.ok(button);
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute('aria-busy'), 'true');
  assert.equal(
    panel.querySelectorAll('.gp-similar__skeleton').length,
    1,
    'an appended page shows its placeholder after the rows already shown',
  );
  assert.equal(
    panel.querySelector('.gp-similar__skeleton').closest('li'),
    panel.querySelector('.gp-similar__list').lastElementChild,
  );
  button.click();
  assert.equal(more, 0);
});
