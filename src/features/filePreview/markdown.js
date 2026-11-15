import createDOMPurify from 'dompurify';
import { marked } from 'marked';
import { eachNode, el } from '../../utils/dom.js';
import { resolveMarkdownTarget } from './links.js';
import { highlightHtml } from './highlight.js';

let purifier = null;

/** DOMPurify bound to the current window, created once per page. */
function sanitizer() {
  if (!purifier) purifier = createDOMPurify(globalThis.window);
  return purifier;
}

function directoryOf(relative) {
  const slash = relative.lastIndexOf('/');
  return slash < 0 ? '' : relative.slice(0, slash);
}

function isExternal(href) {
  return /^(https?:)?\/\//i.test(href);
}

/**
 * Sanitized markdown as a `.gp-preview__md` container: repository-relative
 * links and images go through GitHub's own routes, external images load
 * without a referrer, and fenced code is highlighted.
 * @param {string} text
 * @param {{name: string, relative: string, owner: string, repo: string, ref: string}} context
 * @returns {Promise<HTMLElement>}
 */
export async function renderMarkdown(text, context) {
  const container = el('div', 'gp-preview__md');
  const html = marked.parse(text, { gfm: true, breaks: false, async: false });
  container.innerHTML = sanitizer().sanitize(html, {
    // DOMPurify keeps `<style>` by default; repository markdown must not be
    // able to restyle the page behind the preview. Form controls are inert
    // here, so they go too.
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'select', 'textarea'],
  });
  const target = {
    owner: context.owner,
    repo: context.repo,
    ref: context.ref,
    dir: directoryOf(context.relative),
  };
  eachNode(container.querySelectorAll('a[href]'), (link) => {
    const resolved = resolveMarkdownTarget(link.getAttribute('href'), target, 'link');
    if (resolved) link.setAttribute('href', resolved);
    if (isExternal(link.getAttribute('href'))) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  eachNode(container.querySelectorAll('img[src]'), (image) => {
    const resolved = resolveMarkdownTarget(image.getAttribute('src'), target, 'image');
    if (resolved) image.setAttribute('src', resolved);
    image.setAttribute('loading', 'lazy');
    image.setAttribute('referrerpolicy', 'no-referrer');
  });
  eachNode(container.querySelectorAll('pre code'), (block) => {
    const match = /(?:^|\s)language-([\w-]+)/.exec(block.className);
    if (!match) return;
    const highlighted = highlightHtml(block.textContent, match[1]);
    if (highlighted) {
      block.className = `${block.className} hljs`;
      block.innerHTML = highlighted;
    }
  });
  return container;
}
