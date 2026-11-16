import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!doctype html><html><body><main>
  <div class="js-comment">
    <div class="timeline-comment-header"><span>Comment</span></div>
    <div class="markdown-body">Comment text</div>
  </div>
  <div id="repos-split-pane-content">
    <header data-testid="file-header"><span data-testid="breadcrumbs-filename">README.md</span></header>
    <div class="markdown-body">File text</div>
  </div>
  <div class="gp-preview-overlay"><div class="gp-preview__md markdown-body">Preview</div></div>
  <section class="readme-shell">
    <div itemscope itemtype="https://schema.org/abstract" class="Box_3__Na7qEQ">
      <nav aria-label="Repository files"></nav>
      <div class="readmeHeaderSlot__EGBTUW"></div>
      <button class="editButton__tKaHj8">Edit file</button>
    </div>
    <article class="markdown-body">Root README</article>
  </section>
  <h1 data-testid="issue-title">A title</h1>
  <div data-testid="commit-message">A commit message</div>
</main></body></html>`, { pretendToBeVisual: true, url: 'https://github.com/o/r' });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;

const {
  enabledSurfaces, findContainers, headerFor, surfaceForContainer, previewContainer,
} = await import('../src/features/translate/surfaces.js');

test('enabled surfaces come from settings', () => {
  const ids = enabledSurfaces().map((surface) => surface.id);
  assert.deepEqual(ids, ['markdown', 'plaintext', 'commits', 'titles', 'preview']);
});

test('markdown containers skip our preview overlay', () => {
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const containers = findContainers(markdown);
  assert.equal(containers.length, 3);
  assert.ok(containers.every((node) => !node.closest('.gp-preview-overlay')));
});

test('a comment header is the markdown header', () => {
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const comment = document.querySelector('.js-comment .markdown-body');
  assert.equal(headerFor(comment, markdown).className, 'timeline-comment-header');
});

test('the blob file header is found through the filename', () => {
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const file = document.querySelector('#repos-split-pane-content .markdown-body');
  assert.equal(headerFor(file, markdown).getAttribute('data-testid'), 'file-header');
});

test('the repository README header slot hosts the action', () => {
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const readme = document.querySelector('.readme-shell .markdown-body');
  assert.equal(headerFor(readme, markdown).className, 'readmeHeaderSlot__EGBTUW');
});

test('a comment action row hosts the translate button', () => {
  const comment = document.createElement('div');
  comment.className = 'js-comment';
  comment.innerHTML = '<div class="timeline-comment-header"></div>'
    + '<div class="timeline-comment-actions"><button aria-label="Edit comment">pencil</button></div>'
    + '<div class="markdown-body">Comment body</div>';
  document.body.appendChild(comment);
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const body = comment.querySelector('.markdown-body');
  assert.equal(headerFor(body, markdown), comment.querySelector('.timeline-comment-actions'));
  comment.remove();
});

test('an edit control marks the header row on a page without comment classes', () => {
  const card = document.createElement('div');
  card.className = 'prc-IssueBody';
  card.innerHTML = '<div class="prc-Header"><button aria-label="Edit comment">pencil</button></div>'
    + '<div class="markdown-body">Description body</div>';
  document.body.appendChild(card);
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const body = card.querySelector('.markdown-body');
  const host = headerFor(body, markdown);
  assert.ok(host);
  assert.equal(host.querySelector('[aria-label="Edit comment"]').getAttribute('aria-label'), 'Edit comment');
  card.remove();
});

test('the description edit block hosts the translate button', () => {
  const section = document.createElement('section');
  section.className = 'container__qcj0r_';
  section.innerHTML = '<div class="body__fphukB">'
    + '<div class="editMetadata__ws0CPo">'
    + '<div><div class="editHistoryContainer__0eLRCM">'
    + '<button data-component="ActionMenu.Button" class="prc-Button-ButtonBase-9n-Xk">Edited</button>'
    + '</div></div>'
    + '<button data-component="IconButton" data-dd-action-name="pull_requests.description.edit"'
    + ' class="prc-Button-ButtonBase-9n-Xk editButton__kkP1ND">pencil</button>'
    + '</div>'
    + '<div><div><div class="markdown-body">Description body</div></div></div>'
    + '</div>';
  document.body.appendChild(section);
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const body = section.querySelector('.markdown-body');
  assert.equal(headerFor(body, markdown), section.querySelector('.editMetadata__ws0CPo'));
  section.remove();
});

test('a new-shell comment header hosts the translate button in its actions', () => {
  const article = document.createElement('article');
  article.className = 'container__rfx-3s';
  article.innerHTML = '<div class="header__8DCKRC">'
    + '<div data-testid="comment-header" class="ActivityHeaderContainer__sf0_ID">'
    + '<div class="activityHeader__V45NcJ ActivityHeaderGridLayout__Ip6-X-">'
    + '<div data-testid="comment-header-left-side-items">FenixUzb</div>'
    + '<div data-testid="comment-header-right-side-items" class="ActionsContainer__acCGII">'
    + '<div class="EditsContainer__yFuvcF"></div>'
    + '<div class="BadgesContainer__muaZQX"><span>Contributor</span></div>'
    + '<div class="ActionsButtonsContainer__ZaEPJ0">'
    + '<button data-component="IconButton" class="prc-Button-IconButton-fyge7">more</button>'
    + '</div></div></div></div></div>'
    + '<div class="body__APdwN2"><div class="prc-Stack-Stack-UQ9k6">'
    + '<div class="markdown-body">Comment text</div></div></div>';
  document.body.appendChild(article);
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const body = article.querySelector('.markdown-body');
  assert.equal(
    headerFor(body, markdown),
    article.querySelector('.ActionsButtonsContainer__ZaEPJ0'),
  );
  article.remove();
});

test('a blob file header hosts the button in its raw-actions row', () => {
  const pane = document.createElement('div');
  pane.id = 'repos-split-pane-content';
  pane.innerHTML = '<div class="Box_1__1bJV7g">'
    + '<div class="react-blob-header-edit-and-raw-actions Box_4__C-NqPq">'
    + '<div class="prc-ButtonGroup-ButtonGroup-vFUrY">'
    + '<a data-testid="raw-button" href="/o/r/raw/main/file.md">Raw</a></div></div>'
    + '<div class="react-blob-header-edit-and-raw-actions-combined">'
    + '<button data-testid="more-file-actions-button">kebab</button></div>'
    + '</div>'
    + '<div class="blobContentWrapper__Nr-ksB"><article class="markdown-body entry-content">Text</article></div>';
  document.body.appendChild(pane);
  const markdown = enabledSurfaces().find((surface) => surface.id === 'markdown');
  const body = pane.querySelector('.markdown-body');
  assert.equal(
    headerFor(body, markdown),
    pane.querySelector('[class*="react-blob-header-edit-and-raw-actions"]:not([class*="-combined"])'),
  );
  pane.remove();
});

test('the preview container is resolved separately', () => {
  assert.equal(previewContainer().textContent, 'Preview');
  assert.equal(surfaceForContainer(previewContainer()).id, 'preview');
});
