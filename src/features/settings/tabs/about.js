import { AUTHOR_NAME, AUTHOR_URL, REPO_URL, SCRIPT_NAME } from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';
import { createHint, createSection, getIconSvg } from '../controls.js';
import { getScriptVersion } from '../panel.js';

function aboutRow(label, value) {
  const row = el('div', 'gp-about__row');
  const valueNode = el('span', 'gp-about__value');
  if (typeof value === 'string') valueNode.textContent = value;
  else valueNode.appendChild(value);
  row.append(el('span', 'gp-about__label', label), valueNode);
  return row;
}

function externalLink(text, href) {
  const link = el('a', null, text);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

/** About page: product hero, version, author, repository and license. */
export function renderAbout(container) {
  const about = el('div', 'gp-about');
  const hero = el('div', 'gp-about__hero');
  const logo = el('span', 'gp-about__logo');
  logo.innerHTML = getIconSvg('gallery');
  const text = el('div', null);
  const name = el('div', 'gp-about__name');
  name.append(el('span', null, SCRIPT_NAME), el('span', 'gp-badge', `v${getScriptVersion()}`));
  text.append(name, el('p', 'gp-about__tagline', t('about.blurb')));
  hero.append(logo, text);

  const card = createSection();
  card.body.append(
    aboutRow(t('about.version'), `v${getScriptVersion()}`),
    aboutRow(t('about.author'), externalLink(AUTHOR_NAME, AUTHOR_URL)),
    aboutRow(t('about.repo'), externalLink(REPO_URL.replace('https://', ''), REPO_URL)),
    aboutRow(t('about.license'), externalLink('LICENSE', `${REPO_URL}/blob/main/LICENSE`)),
  );

  about.append(hero, card);
  about.appendChild(createHint(t('about.affiliation')));
  container.appendChild(about);
}
