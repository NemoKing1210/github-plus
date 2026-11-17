/**
 * Details pane content for one palette row. The shell supplies every visible
 * string through `labels`; this module only arranges it.
 */

import { el } from '../../utils/dom.js';
import { formatSize } from '../../utils/size.js';
import { PALETTE_ICONS } from '../../ui/icons.js';
import { formatCount, relativeTime } from './format.js';

function fact(iconMarkup, template, vars) {
  const node = el('span', 'gp-detail__fact');
  const icon = el('span', 'gp-detail__fact-icon');
  icon.innerHTML = iconMarkup;
  const text = String(template || '');
  const rendered = Object.keys(vars || {}).reduce(
    (value, name) => value.replace(`{${name}}`, String(vars[name])),
    text,
  );
  node.append(icon, el('span', 'gp-detail__fact-text', rendered));
  return node;
}

function tag(text) {
  return el('span', 'gp-detail__tag', text || '');
}

function actionList(labels, item, onAction, entries) {
  const actions = el('div', 'gp-detail__actions');
  for (const [id, label, icon] of entries) {
    const button = el('button', 'gp-detail__action');
    button.type = 'button';
    button.dataset.gpDetailAction = id;
    button.dataset.key = item.key;
    if (icon) {
      const glyph = el('span', 'gp-detail__action-icon');
      glyph.innerHTML = icon;
      button.appendChild(glyph);
    }
    button.appendChild(el('span', 'gp-detail__action-label', label || ''));
    button.addEventListener('click', () => onAction?.(id, item));
    actions.appendChild(button);
  }
  return actions;
}

function renderRepo(item, labels, onAction, pinned) {
  const repo = item.data || {};
  const root = el('div', 'gp-detail');
  root.appendChild(el('h2', 'gp-detail__title', repo.fullName || item.title));

  if (repo.description) root.appendChild(el('p', 'gp-detail__desc', repo.description));

  const facts = el('div', 'gp-detail__facts');
  if (repo.language) {
    const language = el('span', 'gp-detail__fact');
    const dot = el('span', 'gp-detail__dot');
    language.append(dot, el('span', 'gp-detail__fact-text', repo.language));
    facts.appendChild(language);
  }
  if (repo.stars) facts.appendChild(fact(PALETTE_ICONS.star, labels.stars, { count: formatCount(repo.stars) }));
  if (repo.forks) facts.appendChild(fact(PALETTE_ICONS.repo, labels.forks, { count: formatCount(repo.forks) }));
  const updated = relativeTime(repo.updatedAt || repo.pushedAt, { locale: labels.locale || 'en' });
  if (updated) facts.appendChild(fact(PALETTE_ICONS.refresh, labels.updated, { when: updated }));
  if (facts.childElementCount) root.appendChild(facts);

  const tags = el('div', 'gp-detail__tags');
  if (repo.private) tags.appendChild(tag(labels.private));
  else if (item.groupId === 'repos') tags.appendChild(tag(labels.owned));
  if (repo.starred) tags.appendChild(tag(labels.starred));
  if (repo.ownerType === 'Organization') {
    tags.appendChild(tag(String(labels.org || '').replace('{org}', repo.owner)));
  }
  if (repo.fork) tags.appendChild(tag(labels.badges?.fork));
  if (repo.archived) tags.appendChild(tag(labels.badges?.archived));
  if (tags.childElementCount) root.appendChild(tags);

  root.appendChild(actionList(labels, item, onAction, [
    ['open', labels.open, PALETTE_ICONS.external],
    ['newTab', labels.openNewTab, PALETTE_ICONS.external],
    ['copyLink', labels.copyLink, PALETTE_ICONS.copy],
    ['pin', pinned ? labels.unpin : labels.pin, PALETTE_ICONS.pin],
  ]));
  return root;
}

function renderFile(item, labels, onAction) {
  const file = item.data || {};
  const root = el('div', 'gp-detail');
  root.appendChild(el('h2', 'gp-detail__title', file.path || item.title));

  const facts = el('div', 'gp-detail__facts');
  if (file.repo) facts.appendChild(fact(PALETTE_ICONS.repo, '{name}', { name: file.repo }));
  if (file.ref) facts.appendChild(fact(PALETTE_ICONS.terminal, labels.ref || '{ref}', { ref: file.ref }));
  if (file.size) facts.appendChild(fact(PALETTE_ICONS.file, '{size}', { size: formatSize(file.size) }));
  if (facts.childElementCount) root.appendChild(facts);

  root.appendChild(actionList(labels, item, onAction, [
    ['open', labels.open, PALETTE_ICONS.external],
    ['copyPath', labels.copyPath, PALETTE_ICONS.copy],
  ]));
  return root;
}

function renderCommand(item, labels, onAction) {
  const detail = item.detail || {};
  const root = el('div', 'gp-detail');
  root.appendChild(el('h2', 'gp-detail__title', detail.label || item.title));
  if (detail.description) root.appendChild(el('p', 'gp-detail__desc', detail.description));
  if (detail.shortcut) {
    const keys = el('p', 'gp-detail__shortcut');
    keys.appendChild(el('kbd', 'gp-detail__kbd', detail.shortcut));
    root.appendChild(keys);
  }
  root.appendChild(actionList(labels, item, onAction, [
    ['run', labels.run, PALETTE_ICONS.terminal],
  ]));
  return root;
}

function renderIssue(item, labels, onAction) {
  const issue = item.data || {};
  const root = el('div', 'gp-detail');
  root.appendChild(el('h2', 'gp-detail__title', item.title || (issue.number ? `#${issue.number}` : '')));

  const facts = el('div', 'gp-detail__facts');
  if (issue.author) facts.appendChild(fact(PALETTE_ICONS.repo, labels.author || '{login}', { login: issue.author }));
  const updated = relativeTime(issue.updatedAt, { locale: labels.locale || 'en' });
  if (updated) facts.appendChild(fact(PALETTE_ICONS.refresh, labels.updated, { when: updated }));
  if (issue.comments) {
    facts.appendChild(fact(PALETTE_ICONS.issueOpened, labels.comments || '{count} comments', { count: issue.comments }));
  }
  if (facts.childElementCount) root.appendChild(facts);

  const tags = el('div', 'gp-detail__tags');
  if (issue.state === 'open' && labels.stateOpen) tags.appendChild(tag(labels.stateOpen));
  const kindLabel = issue.kindLabel === 'pullRequest' ? labels.badges?.pullRequest : labels.badges?.issue;
  if (kindLabel) tags.appendChild(tag(kindLabel));
  if (tags.childElementCount) root.appendChild(tags);

  root.appendChild(actionList(labels, item, onAction, [
    ['open', labels.open, PALETTE_ICONS.external],
    ['newTab', labels.openNewTab, PALETTE_ICONS.external],
    ['copyLink', labels.copyLink, PALETTE_ICONS.copy],
    ['copyNumber', labels.copyNumber, PALETTE_ICONS.copy],
  ]));
  return root;
}

/** Render the aside for a repo, file, issue or command row; null for anything else. */
export function renderDetail(item, { labels = {}, onAction, pinned } = {}) {
  if (!item) return null;
  const isPinned = pinned ?? Boolean(item.snapshot?.pinned);
  if (item.kind === 'repo') return renderRepo(item, labels, onAction, isPinned);
  if (item.kind === 'file') return renderFile(item, labels, onAction);
  if (item.kind === 'issue') return renderIssue(item, labels, onAction);
  if (item.kind === 'command') return renderCommand(item, labels, onAction);
  return null;
}
