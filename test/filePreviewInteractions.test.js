import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function installDom(html) {
  const dom = new JSDOM(
    `<!doctype html><html><body>${html}</body></html>`,
    { pretendToBeVisual: true, url: 'https://github.com/o/r/blob/main/docs/README.md' },
  );
  dom.window.scrollTo = () => {};
  dom.window.Element.prototype.scrollIntoView = () => {};
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.Image = dom.window.Image;
  globalThis.HTMLImageElement = dom.window.HTMLImageElement;
  globalThis.location = dom.window.location;
  globalThis.localStorage = dom.window.localStorage;
  return dom;
}

const PREVIEW_HTML = `
  <div class="markdown-body">
    <img id="page-image" src="https://github.com/o/r/raw/main/docs/page.png" alt="">
  </div>
  <div class="gp-preview-overlay">
    <div class="gp-preview">
      <header class="gp-preview__header">
        <button class="gp-preview__tool" id="preview-tool" type="button"></button>
      </header>
      <div class="gp-preview__content" id="preview-content">
        <div class="gp-preview__md" id="preview-markdown">
          <p><a id="file-link" href="/o/r/blob/main/src/a.js">a.js</a></p>
          <p>
            <a id="image-link" href="/o/r/blob/main/docs/big.png">
              <img id="preview-image" src="https://github.com/o/r/raw/main/docs/pic.png" alt="pic">
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
  <div class="gp-preview-overlay">
    <div class="gp-preview">
      <div class="gp-preview__content">
        <img id="file-image" class="gp-preview__image"
          src="https://github.com/o/r/raw/main/docs/photo.png" alt="photo">
      </div>
    </div>
  </div>
`;

test('preview markdown is page content, while the preview chrome stays our UI', async () => {
  installDom(PREVIEW_HTML);
  const { isOwnUiChrome } = await import('../src/utils/dom.js');
  assert.equal(isOwnUiChrome(document.getElementById('preview-image')), false);
  assert.equal(isOwnUiChrome(document.getElementById('file-link')), false);
  assert.equal(isOwnUiChrome(document.getElementById('preview-tool')), true);
  assert.equal(isOwnUiChrome(document.getElementById('page-image')), false);
});

test('a file link inside the preview resolves to the same file target as a page link', async () => {
  installDom(PREVIEW_HTML);
  const { resolvePreviewLink } = await import('../src/features/filePreview/surfaces.js');
  const found = resolvePreviewLink(document.getElementById('file-link'));
  assert.ok(found);
  assert.equal(found.source, 'markdown');
  assert.equal(found.name, 'a.js');
  assert.equal(found.file.rawUrl, '/o/r/raw/main/src/a.js');
  assert.equal(found.file.relative, 'src/a.js');
});

test('preview markdown images join the gallery set and open the viewer on click', async () => {
  installDom(PREVIEW_HTML);
  const { initGalleryFeature } = await import('../src/gallery/index.js');
  const { closeViewer, isViewerOpen } = await import('../src/ui/viewer.js');
  initGalleryFeature();
  const image = document.getElementById('preview-image');
  const click = new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
  });
  image.dispatchEvent(click);
  assert.equal(click.defaultPrevented, true);
  assert.equal(isViewerOpen(), true);
  const overlay = document.getElementById('gp-viewer-overlay');
  assert.ok(overlay);
  assert.equal(overlay.hidden, false);
  closeViewer();
  const fileImage = document.getElementById('file-image');
  const secondClick = new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
  });
  fileImage.dispatchEvent(secondClick);
  assert.equal(isViewerOpen(), true);
  assert.equal(document.querySelector('.gp-viewer__title').textContent, 'photo');
  closeViewer();
});
