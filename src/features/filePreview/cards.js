import { t } from '../../i18n/index.js';
import { ACTION_ICONS } from '../../ui/icons.js';
import { append, el } from '../../utils/dom.js';
import { formatSize } from '../../utils/size.js';

function actionLink({ label, href, download }) {
  const link = el('a', 'gp-preview__card-action', label);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (download) link.setAttribute('download', '');
  return link;
}

function card({ title, description, meta, actions = [] }) {
  const root = el('div', 'gp-preview__card');
  const glyph = append(root, el('div', 'gp-preview__card-icon'));
  glyph.innerHTML = ACTION_ICONS.open;
  append(root, el('h2', 'gp-preview__card-title', title));
  if (description) append(root, el('p', 'gp-preview__card-desc', description));
  if (meta) append(root, el('p', 'gp-preview__card-meta', meta));
  if (actions.length) {
    const row = append(root, el('div', 'gp-preview__card-actions'));
    for (const action of actions) {
      if (action.href) append(row, actionLink(action));
    }
  }
  return root;
}

function externalLinks(file, { raw = false, download = false } = {}) {
  const actions = [];
  if (file.href) actions.push({ label: t('preview.open'), href: file.href });
  if (raw && file.rawUrl) actions.push({ label: t('preview.raw'), href: file.rawUrl });
  if (download && file.rawUrl) {
    actions.push({ label: t('preview.download'), href: file.rawUrl, download: true });
  }
  return actions;
}

/**
 * Fallback for a file the preview cannot render, naming its path and size.
 * @param {{ name: string, relative: string, size?: string, href: string, rawUrl: string }} file
 * @returns {HTMLElement}
 */
export function renderBinaryCard(file) {
  return card({
    title: t('preview.unsupported'),
    description: t('preview.unsupportedDesc'),
    meta: [file.relative, file.size].filter(Boolean).join(' · '),
    actions: externalLinks(file, { download: true }),
  });
}

/**
 * Zero-byte file: there is nothing to render or fetch.
 * @returns {HTMLElement}
 */
export function renderEmptyCard() {
  return card({ title: t('preview.empty') });
}

/**
 * A text or PDF file above the preview's size ceiling.
 * @param {{ name: string, limit: number, href: string, rawUrl: string }} file
 * @returns {HTMLElement}
 */
export function renderTooLargeCard(file) {
  return card({
    title: t('preview.tooLarge'),
    description: t('preview.tooLargeDesc', { size: formatSize(file.limit) }),
    actions: externalLinks(file, { raw: true, download: true }),
  });
}

/**
 * The load failed; the file itself is still reachable on GitHub.
 * @param {{ name: string, href: string, rawUrl: string }} file
 * @returns {HTMLElement}
 */
export function renderFailureCard(file) {
  return card({
    title: t('preview.failed'),
    description: t('preview.failedDesc'),
    actions: externalLinks(file, { raw: true }),
  });
}
