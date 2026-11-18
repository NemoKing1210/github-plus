/**
 * Palette commands: navigation for the current repository and account, plus
 * the GitHub Plus controls. Every command carries the action it runs so the
 * shell never has to know what a command means.
 */

import { t } from '../../i18n/index.js';
import { getSettings } from '../../core/settings.js';

/** GitHub's search page address for one scope and query. */
export function searchUrl(scope, query) {
  return `https://github.com/search?q=${encodeURIComponent(query)}&type=${scope}`;
}

/** A GitHub search limited to one repository, with the requested result type. */
export function scopedSearchUrl(repo, query, type) {
  return `https://github.com/search?q=${encodeURIComponent(`repo:${repo} ${query}`).replace(/%20/g, '+')}&type=${type}`;
}

/** Settings sections the palette can switch, with the label each one shows. */
export const TOGGLE_LABEL_KEYS = {
  gallery: 'gallery.enabled',
  fileIcons: 'icons.enabled',
  fileAges: 'ages.enabled',
  fileMeta: 'files.enabled',
  fileMenu: 'fileMenu.title',
  filePreview: 'preview.enabled',
  translate: 'translate.enabled',
};

const REPO_COMMANDS = [
  { id: 'code', suffix: '', labelKey: 'palette.cmd.code', icon: 'repo' },
  { id: 'issues', suffix: '/issues', labelKey: 'palette.cmd.issues', icon: 'issueOpened', listing: 'issue' },
  { id: 'pulls', suffix: '/pulls', labelKey: 'palette.cmd.pulls', icon: 'pullRequest', listing: 'pullRequest' },
  { id: 'newIssue', suffix: '/issues/new', labelKey: 'palette.cmd.newIssue', icon: 'issueOpened' },
  { id: 'compare', suffix: '/compare', labelKey: 'palette.cmd.compare', icon: 'pullRequest' },
  { id: 'actions', suffix: '/actions', labelKey: 'palette.cmd.actions', icon: 'terminal' },
  { id: 'projects', suffix: '/projects', labelKey: 'palette.cmd.projects', icon: 'folder' },
  { id: 'discussions', suffix: '/discussions', labelKey: 'palette.cmd.discussions', icon: 'comment' },
  { id: 'releases', suffix: '/releases', labelKey: 'palette.cmd.releases', icon: 'star' },
  { id: 'wiki', suffix: '/wiki', labelKey: 'palette.cmd.wiki', icon: 'file' },
  { id: 'security', suffix: '/security', labelKey: 'palette.cmd.security', icon: 'shield' },
  { id: 'insights', suffix: '/pulse', labelKey: 'palette.cmd.insights', icon: 'graph' },
];

const USER_COMMANDS = [
  { id: 'profile', path: '', labelKey: 'palette.cmd.profile', icon: 'repo' },
  { id: 'repos', path: '?tab=repositories', labelKey: 'palette.cmd.repos', icon: 'repo' },
  { id: 'stars', path: '?tab=stars', labelKey: 'palette.cmd.stars', icon: 'star' },
  { id: 'newRepo', url: 'https://github.com/new', labelKey: 'palette.cmd.newRepo', icon: 'repo' },
  { id: 'notifications', url: 'https://github.com/notifications', labelKey: 'palette.cmd.notifications', icon: 'bell' },
  { id: 'gists', url: 'https://gist.github.com/', labelKey: 'palette.cmd.gists', icon: 'file' },
  { id: 'githubSettings', url: 'https://github.com/settings/profile', labelKey: 'palette.cmd.githubSettings', icon: 'gear' },
  { id: 'dashboard', url: 'https://github.com/dashboard', labelKey: 'palette.cmd.dashboard', icon: 'home' },
];

function buildCandidate({ id, label, groupId, groupTitle, icon, run, sortKey, hint = '', description = '', shortcut = '', repo = '', listing = '' }) {
  return {
    key: `cmd:${id}`,
    kind: 'command',
    groupId,
    groupTitle,
    icon,
    title: label,
    titleMuted: '',
    meta: '',
    rankFields: [
      { text: label, weight: 4 },
      { text: description, weight: 1 },
    ],
    sortKey,
    // A row with a listing is a level of its own: Tab opens that list instead
    // of leaving the palette for GitHub.
    scopeable: Boolean(listing),
    listing,
    hint: hint || (listing ? t('palette.hint.jump') : ''),
    data: {
      run,
      ...(repo ? { repo } : {}),
      ...(listing ? { listing } : {}),
    },
    detail: { id, label, description, shortcut },
  };
}

function ownsRepository(state, fullName) {
  const pages = state?.cache?.sources?.repos?.pages;
  if (!Array.isArray(pages)) return false;
  for (const page of pages) {
    for (const repo of Array.isArray(page.items) ? page.items : []) {
      if (repo.fullName === fullName || repo.full_name === fullName) return true;
    }
  }
  return false;
}

function repositoryCommands(state, startIndex) {
  const repo = state.scope?.repo || state.context.repo;
  const commands = REPO_COMMANDS.map((command) => ({
    id: `repo.${command.id}`,
    label: t(command.labelKey),
    icon: command.icon,
    url: `https://github.com/${repo}${command.suffix}`,
    listing: command.listing || '',
  }));
  if (ownsRepository(state, repo)) {
    commands.push({
      id: 'repo.settings',
      label: t('palette.cmd.repoSettings'),
      icon: 'gear',
      url: `https://github.com/${repo}/settings`,
      listing: '',
    });
  }
  const rows = commands.map((command, offset) => buildCandidate({
    id: command.id,
    label: command.label,
    groupId: 'pages',
    groupTitle: t('palette.group.pages'),
    icon: command.icon,
    run: { type: 'navigate', url: command.url },
    sortKey: startIndex + offset + 1,
    repo,
    listing: command.listing,
  }));
  // GitHub's first row inside a repository is the repository page itself.
  rows.unshift(buildCandidate({
    id: 'repo.home',
    label: repo,
    groupId: 'pages',
    groupTitle: t('palette.group.pages'),
    icon: 'repo',
    run: { type: 'navigate', url: `https://github.com/${repo}` },
    sortKey: startIndex,
    hint: t('palette.hint.jump'),
  }));
  return rows;
}

function userCommands(state, startIndex) {
  // The identity is the account the cached data belongs to: the token's login
  // once one is verified, else the page login. Reading the page login first
  // would point a token-only session at the wrong account.
  const login = state.identity || state.context.login;
  if (!login) return [];
  return USER_COMMANDS.map((command, offset) => {
    const base = command.url || `https://github.com/${login}`;
    return buildCandidate({
      id: `user.${command.id}`,
      label: t(command.labelKey),
      groupId: 'pages',
      groupTitle: t('palette.group.pages'),
      icon: command.icon,
      run: { type: 'navigate', url: `${base}${command.path || ''}` },
      sortKey: startIndex + offset,
    });
  });
}

function plusCommands(state, startIndex) {
  const current = getSettings();
  const commands = [{
    id: 'openSettings',
    label: t('palette.cmd.openSettings'),
    icon: 'gear',
    run: { type: 'settings' },
  }];

  for (const section of Object.keys(TOGGLE_LABEL_KEYS)) {
    const enabled = current?.[section]?.enabled !== false;
    commands.push({
      id: `toggle.${section}`,
      label: t(enabled ? 'palette.cmd.toggleOff' : 'palette.cmd.toggleOn', {
        feature: t(TOGGLE_LABEL_KEYS[section]),
      }),
      icon: 'check',
      run: { type: 'toggle', section, enabled: !enabled },
    });
  }

  commands.push(
    { id: 'refreshRepos', label: t('palette.cmd.refreshRepos'), icon: 'refresh', run: { type: 'refreshRepos' } },
  );
  if (state.context.repo || state.scope?.repo) {
    const repo = state.scope?.repo || state.context.repo;
    const ref = repo === state.context.repo ? state.context.ref || 'HEAD' : 'HEAD';
    commands.push({
      id: 'refreshTree',
      label: t('palette.cmd.refreshTree'),
      icon: 'refresh',
      run: { type: 'refreshTree', repo, ref },
    });
  }
  commands.push(
    { id: 'clearCache', label: t('palette.cmd.clearCache'), icon: 'trash', run: { type: 'clearCache' } },
    { id: 'clearTranslateCache', label: t('palette.cmd.clearTranslateCache'), icon: 'trash', run: { type: 'clearTranslateCache' } },
  );

  return commands.map((command, offset) => buildCandidate({
    id: command.id,
    label: command.label,
    groupId: 'plus',
    groupTitle: t('palette.group.plus'),
    icon: command.icon,
    run: command.run,
    sortKey: startIndex + offset,
  }));
}

/** Every command that does not depend on the query. */
export function commandCandidates(state) {
  if (state?.settings?.sources?.commands === false) return [];
  const commands = [];
  if (state.scope?.repo) commands.push(...repositoryCommands(state, commands.length + 100));
  else if (state.context.login || state.identity) commands.push(...userCommands(state, commands.length + 200));
  commands.push(...plusCommands(state, commands.length + 300));
  return commands;
}

/**
 * The GitHub search handoff for one query. A prefix keeps its own result type
 * (`#` issues, `/` code, `@` repositories); a free query searches code inside a
 * scope and repositories outside one. A command query has no GitHub equivalent,
 * so it gets no fallback row.
 */
export function searchCommands(query, { scope, mode = 'all' } = {}) {
  if (mode === 'commands') return [];
  const repo = scope?.repo || '';
  const listing = scope?.listing || '';
  // Repository search is account-wide by nature; the other modes narrow to the
  // repository when the palette is scoped to one.
  const scoped = Boolean(repo) && mode !== 'repos';
  let type = 'repositories';
  if (listing || mode === 'issues') type = 'issues';
  else if (mode === 'files' || (mode === 'all' && repo)) type = 'code';
  const url = scoped ? scopedSearchUrl(repo, query, type) : searchUrl(type, query);
  const label = scoped
    ? t('palette.fallback.scope', { query, repo })
    : t('palette.fallback.global', { query });
  return [{
    key: 'cmd:search',
    kind: 'command',
    groupId: 'search',
    groupTitle: t('palette.group.search'),
    icon: 'search',
    title: label,
    titleMuted: '',
    meta: '',
    rankFields: [{ text: label, weight: 4 }],
    sortKey: 0,
    data: {
      run: { type: 'navigate', url },
      query,
      searchType: type,
    },
    detail: { id: 'search', label, description: '', shortcut: '' },
  }];
}
