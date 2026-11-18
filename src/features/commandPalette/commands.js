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

/** GitHub code search limited to one repository. */
export function searchUrlInRepo(repo, query) {
  return `https://github.com/search?q=${encodeURIComponent(`repo:${repo} ${query}`).replace(/%20/g, '+')}&type=code`;
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
  { id: 'code', suffix: '', labelKey: 'palette.cmd.code' },
  { id: 'issues', suffix: '/issues', labelKey: 'palette.cmd.issues' },
  { id: 'pulls', suffix: '/pulls', labelKey: 'palette.cmd.pulls' },
  { id: 'actions', suffix: '/actions', labelKey: 'palette.cmd.actions' },
  { id: 'projects', suffix: '/projects', labelKey: 'palette.cmd.projects' },
  { id: 'discussions', suffix: '/discussions', labelKey: 'palette.cmd.discussions' },
  { id: 'releases', suffix: '/releases', labelKey: 'palette.cmd.releases' },
  { id: 'wiki', suffix: '/wiki', labelKey: 'palette.cmd.wiki' },
  { id: 'security', suffix: '/security', labelKey: 'palette.cmd.security' },
  { id: 'insights', suffix: '/pulse', labelKey: 'palette.cmd.insights' },
];

const USER_COMMANDS = [
  { id: 'profile', path: '', labelKey: 'palette.cmd.profile' },
  { id: 'repos', path: '?tab=repositories', labelKey: 'palette.cmd.repos' },
  { id: 'stars', path: '?tab=stars', labelKey: 'palette.cmd.stars' },
  { id: 'notifications', url: 'https://github.com/notifications', labelKey: 'palette.cmd.notifications' },
  { id: 'gists', url: 'https://gist.github.com/', labelKey: 'palette.cmd.gists' },
  { id: 'githubSettings', url: 'https://github.com/settings/profile', labelKey: 'palette.cmd.githubSettings' },
  { id: 'dashboard', url: 'https://github.com/dashboard', labelKey: 'palette.cmd.dashboard' },
];

function buildCandidate({ id, label, groupId, groupTitle, icon, run, sortKey, description = '', shortcut = '' }) {
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
    data: { run },
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
    url: `https://github.com/${repo}${command.suffix}`,
  }));
  if (ownsRepository(state, repo)) {
    commands.push({
      id: 'repo.settings',
      label: t('palette.cmd.repoSettings'),
      url: `https://github.com/${repo}/settings`,
    });
  }
  return commands.map((command, offset) => buildCandidate({
    id: command.id,
    label: command.label,
    groupId: 'repository',
    groupTitle: t('palette.group.repository'),
    icon: 'repo',
    run: { type: 'navigate', url: command.url },
    sortKey: startIndex + offset,
  }));
}

function userCommands(state, startIndex) {
  const login = state.context.login;
  return USER_COMMANDS.map((command, offset) => {
    const base = command.url || `https://github.com/${login}`;
    return buildCandidate({
      id: `user.${command.id}`,
      label: t(command.labelKey),
      groupId: 'github',
      groupTitle: t('palette.group.github'),
      icon: 'gear',
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
  if (state.context.repo) {
    commands.push({ id: 'refreshTree', label: t('palette.cmd.refreshTree'), icon: 'refresh', run: { type: 'refreshTree' } });
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
  if (state.context.repo || state.scope?.repo) commands.push(...repositoryCommands(state, commands.length + 100));
  if (state.context.login) commands.push(...userCommands(state, commands.length + 200));
  commands.push(...plusCommands(state, commands.length + 300));
  return commands;
}

/** The GitHub search command for a free-text query, scoped when asked. */
export function searchCommands(query, { scope } = {}) {
  const repo = scope?.repo || '';
  const url = repo ? searchUrlInRepo(repo, query) : searchUrl('repositories', query);
  const label = repo
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
      searchScopes: ['repositories', 'code', 'issues', 'users'],
      query,
    },
    detail: { id: 'search', label, description: '', shortcut: '' },
  }];
}
