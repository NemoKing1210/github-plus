/**
 * The panel's markup. Every node carries a `gp-` class; page markup is never
 * restyled, and each state is a plain localized paragraph so a failure never
 * leaves an empty box in GitHub's sidebar.
 */
import { el } from '../../utils/dom.js';
import { SIMILAR_ICONS } from '../../ui/icons.js';

export const PANEL_CLASS = 'gp-similar';

const LANGUAGE_SLUG = /[^a-z0-9]+/g;

/** Linguist spells some language ids differently from their token slug. */
const LANGUAGE_SLUGS = {
  'c++': 'cpp',
  'c#': 'csharp',
  'f#': 'fsharp',
  'objective-c': 'objective-c',
  'objective-c++': 'objective-cpp',
  'jupyter notebook': 'jupyter',
  'vim script': 'vim-script',
  'emacs lisp': 'emacs-lisp',
  'common lisp': 'common-lisp',
  'visual basic .net': 'vbnet',
  'standard ml': 'standard-ml',
  'shell': 'shell',
};

function languageSlug(language) {
  const name = String(language || '').trim().toLowerCase();
  if (LANGUAGE_SLUGS[name]) return LANGUAGE_SLUGS[name];
  return name.replace(LANGUAGE_SLUG, '-').replace(/^-|-$/g, '');
}

function languageColor(language) {
  const slug = languageSlug(language);
  return slug ? `var(--gp-lang-${slug}, var(--gp-text-muted))` : 'var(--gp-text-muted)';
}

/** GitHub's compact count (`20,908` → `20.9k`). */
function formatCount(value) {
  const number = Number(value) || 0;
  if (number >= 1e6) return `${(number / 1e6).toFixed(1).replace(/\.0$/, '')}m`;
  if (number >= 1e3) return `${(number / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  return String(number);
}

function icon(name) {
  const node = el('span', 'gp-similar__glyph');
  node.innerHTML = SIMILAR_ICONS[name];
  return node;
}

function avatar(repo) {
  const [owner, name] = String(repo).split('/');
  const host = el('span', 'gp-similar__avatar');
  host.setAttribute('aria-hidden', 'true');
  const image = el('img', 'gp-similar__avatar-img');
  image.src = `https://github.com/${encodeURIComponent(owner)}.png?size=64`;
  image.alt = '';
  image.loading = 'lazy';
  image.width = 20;
  image.height = 20;
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => host.classList.add('is-broken'));
  const fallback = el('span', 'gp-similar__avatar-fallback', (name || owner || '?').charAt(0).toUpperCase());
  host.append(image, fallback);
  return host;
}

function nameLine(row, labels) {
  const line = el('span', 'gp-similar__head');
  const name = el('span', 'gp-similar__name-text');
  const [owner, repo] = String(row.repo).split('/');
  name.append(
    el('span', 'gp-similar__owner', `${owner}/`),
    el('span', 'gp-similar__repo', repo || ''),
  );
  line.appendChild(name);
  if (row.archived) line.appendChild(el('span', 'gp-similar__archived', labels.archived));
  return line;
}

function countNode(kind, value, labels) {
  const label = labels?.[kind];
  const node = el('span', 'gp-similar__count');
  const number = formatCount(value);
  const full = String(Number(value) || 0);
  node.setAttribute('aria-label', label ? label.replace('{count}', full) : number);
  node.append(icon(kind), el('span', 'gp-similar__count-text', number));
  return node;
}

function metaLine(row, labels) {
  const line = el('span', 'gp-similar__meta');
  if (row.language) {
    const language = el('span', 'gp-similar__lang');
    const dot = el('span', 'gp-similar__lang-dot');
    dot.style.background = languageColor(row.language);
    language.append(dot, el('span', 'gp-similar__lang-name', row.language));
    line.appendChild(language);
  }
  if (row.stars > 0) line.appendChild(countNode('stars', row.stars, labels));
  if (row.forks > 0) line.appendChild(countNode('forks', row.forks, labels));
  const percent = Number(row.percent) || 0;
  if (percent > 0) {
    line.appendChild(
      el('span', 'gp-similar__match', labels.match.replace('{percent}', String(percent))),
    );
  }
  return line;
}

function rowNode(row, labels) {
  const item = el('li', 'gp-similar__row');
  const card = el('a', 'gp-similar__name gp-similar__card');
  card.href = `/${row.repo}`;

  card.appendChild(avatar(row.repo));

  const body = el('span', 'gp-similar__body');
  body.appendChild(nameLine(row, labels));
  if (row.description) body.appendChild(el('span', 'gp-similar__desc', row.description));
  body.appendChild(metaLine(row, labels));
  card.appendChild(body);
  item.appendChild(card);
  return item;
}

function skeletonBar(modifier) {
  const bar = el('span', `gp-similar__skeleton-bar gp-similar__skeleton-${modifier}`);
  return bar;
}

/** A placeholder in the shape of the row that is about to arrive. */
function skeletonRow() {
  const item = el('li', 'gp-similar__row');
  item.setAttribute('aria-hidden', 'true');
  const row = el('span', 'gp-similar__card gp-similar__skeleton');
  const body = el('span', 'gp-similar__body');
  body.append(skeletonBar('name'), skeletonBar('desc'), skeletonBar('desc-short'), skeletonBar('meta'));
  row.append(skeletonBar('avatar'), body);
  item.appendChild(row);
  return item;
}

function skeletonList(count) {
  const list = el('ul', 'gp-similar__list');
  for (let index = 0; index < count; index += 1) list.appendChild(skeletonRow());
  return list;
}

/** How many placeholder rows stand in for the first page. */
const SKELETON_ROWS = 3;

/**
 * Build the panel. `state` one of `loading`, `ready`, `empty`,
 * `not-in-dataset`, `rate-limited`, `star-required`, `failed`; `loading` paints
 * skeleton rows and announces the state to assistive tech. `moreBusy` disables
 * **View more** and appends one placeholder row while its page is in flight.
 */
export function renderPanel({ labels, rows = [], state = 'ready', hasMore = false, moreBusy = false, onMore } = {}) {
  const panel = el('section', PANEL_CLASS);
  panel.dataset.gpSimilar = 'true';
  panel.setAttribute('aria-label', labels.title);

  panel.appendChild(el('h2', 'gp-similar__title', labels.title));

  if (state === 'loading') {
    panel.setAttribute('aria-busy', 'true');
    panel.appendChild(skeletonList(SKELETON_ROWS));
    panel.appendChild(el('span', 'gp-similar__announcer', labels.states?.loading || ''));
    return panel;
  }

  if (state !== 'ready' && state !== 'empty') {
    const message = labels.states?.[state] || labels.states?.failed || '';
    panel.appendChild(el('p', 'gp-similar__state', message));
    return panel;
  }

  if (!rows.length) {
    panel.appendChild(el('p', 'gp-similar__state', labels.states?.empty || ''));
    return panel;
  }

  const list = el('ul', 'gp-similar__list');
  for (const row of rows) list.appendChild(rowNode(row, labels));
  if (moreBusy) list.appendChild(skeletonRow());
  panel.appendChild(list);

  if (hasMore) {
    const more = el('button', 'gp-similar__more', labels.more);
    more.type = 'button';
    if (moreBusy) {
      panel.setAttribute('aria-busy', 'true');
      more.disabled = true;
      more.setAttribute('aria-busy', 'true');
    }
    more.addEventListener('click', () => onMore?.());
    panel.appendChild(more);
  }
  return panel;
}
