import { COMMAND_PALETTE_CACHE_HOURS_MAX, COMMAND_PALETTE_SHORTCUTS } from '../../../core/constants.js';
import { getLocale, t } from '../../../i18n/index.js';
import { showToast } from '../../../ui/toast.js';
import { el } from '../../../utils/dom.js';
import { fetchUser } from '../../commandPalette/api.js';
import { readContext, tokenFingerprint } from '../../commandPalette/context.js';
import { forgetTrees } from '../../commandPalette/files.js';
import { forgetIssues } from '../../commandPalette/issues.js';
import { forgetRepositories } from '../../commandPalette/repos.js';
import { relativeTime } from '../../commandPalette/format.js';
import {
  clearDataCache, readCacheRecord, writeCacheRecord,
} from '../../commandPalette/store.js';
import {
  createButton,
  createField,
  createNumberInput,
  createRow,
  createSection,
  createSelect,
  createShortcutRecorder,
  createSwitchCell,
  createSwitchRow,
  createTextInput,
} from '../controls.js';
import { getDraft } from '../panel.js';

const SHORTCUT_LABELS = {
  'mod+k': 'palette.shortcut.modK',
  'mod+shift+k': 'palette.shortcut.modShiftK',
  'mod+space': 'palette.shortcut.modSpace',
  'alt+k': 'palette.shortcut.altK',
  off: 'palette.shortcut.off',
};

const SOURCE_IDS = ['commands', 'repositories', 'starred', 'files', 'issues', 'recent'];

const EMPTY_RECORD = {
  version: 1,
  login: null,
  tokenLogin: null,
  tokenFingerprint: '',
  sources: {},
  trees: {},
  issues: {},
  rateLimit: null,
};

function countItems(source) {
  let count = 0;
  for (const page of source?.pages || []) count += (page.items || []).length;
  return count;
}

function cacheStatsText() {
  const record = readCacheRecord();
  if (!record) return t('palette.cacheEmpty');
  const trees = Object.values(record.trees || {});
  const files = trees.reduce((sum, tree) => sum + (tree.items?.length || 0), 0);
  const stamps = [
    record.sources?.repos?.fetchedAt,
    record.sources?.starred?.fetchedAt,
    ...trees.map((tree) => tree.fetchedAt),
  ].filter(Boolean);
  if (!stamps.length) return t('palette.cacheEmpty');
  const when = relativeTime(new Date(Math.max(...stamps)).toISOString(), { locale: getLocale() });
  return t('palette.cacheStats', {
    repos: countItems(record.sources?.repos),
    starred: countItems(record.sources?.starred),
    files,
    when,
  });
}

function activationSection(draft) {
  const section = createSection({
    title: t('palette.activation'),
    hint: t('palette.activationDesc'),
  });
  section.body.appendChild(createSwitchRow({
    checked: draft.commandPalette.enabled,
    label: t('palette.enabled'),
    hint: t('palette.enabledDesc'),
    onChange: (value) => {
      draft.commandPalette.enabled = value;
    },
  }));
  const isCustom = (value) => !SHORTCUT_LABELS[value];
  const recorderField = createField({
    label: t('palette.shortcut'),
    hint: t('palette.shortcut.invalid'),
    control: createShortcutRecorder({
      value: isCustom(draft.commandPalette.shortcut) ? draft.commandPalette.shortcut : '',
      onChange: (value) => {
        draft.commandPalette.shortcut = value || 'mod+k';
      },
      label: t('palette.shortcut'),
      emptyLabel: t('palette.shortcut.press'),
    }),
  });
  recorderField.hidden = !isCustom(draft.commandPalette.shortcut);
  section.body.appendChild(createField({
    label: t('palette.shortcut'),
    hint: t('palette.shortcutDesc'),
    control: createSelect({
      options: [
        ...COMMAND_PALETTE_SHORTCUTS.map((value) => ({
          value,
          label: t(SHORTCUT_LABELS[value]),
        })),
        { value: 'custom', label: t('palette.shortcut.custom') },
      ],
      value: isCustom(draft.commandPalette.shortcut) ? 'custom' : draft.commandPalette.shortcut,
      label: t('palette.shortcut'),
      onChange: (value) => {
        if (value === 'custom') {
          draft.commandPalette.shortcut = 'mod+k';
          recorderField.hidden = false;
          recorderField.querySelector('.gp-shortcut-field')?.setValue('mod+k');
          return;
        }
        draft.commandPalette.shortcut = value;
        recorderField.hidden = true;
      },
    }),
  }));
  section.body.appendChild(recorderField);
  return section;
}

function accessSection(draft) {
  const section = createSection({
    title: t('palette.access'),
    hint: t('palette.accessDesc'),
  });

  const feedback = createField({});
  feedback.hidden = true;

  const record = readCacheRecord();
  const pageLogin = readContext().login;
  if (record?.tokenLogin && pageLogin && pageLogin !== record.tokenLogin) {
    feedback.hidden = false;
    feedback.appendChild(createRow({
      label: t('palette.identityMismatch', { page: pageLogin, token: record.tokenLogin }),
    }));
  }

  const tokenInput = createTextInput({
    type: 'password',
    value: draft.commandPalette.token,
    placeholder: t('palette.tokenPlaceholder'),
    label: t('palette.token'),
    onChange: (value) => {
      draft.commandPalette.token = value;
      feedback.hidden = true;
    },
  });
  section.body.appendChild(createField({
    label: t('palette.token'),
    hint: t('palette.tokenDesc'),
    control: tokenInput,
  }));

  const verifyToken = async () => {
    const token = draft.commandPalette.token.trim();
    if (!token) {
      showToast({ type: 'error', title: t('palette.tokenInvalid'), message: t('palette.tokenInvalidDesc') });
      return;
    }
    try {
      const user = await fetchUser({ token });
      if (!user.login) throw new Error('The token has no account');
      const next = readCacheRecord() || { ...EMPTY_RECORD, sources: {}, trees: {} };
      if (next.login !== user.login) {
        next.sources = {};
        next.trees = {};
        next.issues = {};
        next.rateLimit = null;
      }
      next.login = user.login;
      next.tokenLogin = user.login;
      next.tokenFingerprint = tokenFingerprint(token);
      writeCacheRecord(next);
      feedback.replaceChildren(createRow({ label: t('palette.tokenValidDesc', { login: user.login }) }));
      feedback.hidden = false;
      showToast({
        type: 'success',
        title: t('palette.tokenValid'),
        message: t('palette.tokenValidDesc', { login: user.login }),
      });
    } catch {
      showToast({
        type: 'error',
        title: t('palette.tokenInvalid'),
        message: t('palette.tokenInvalidDesc'),
      });
    }
  };

  const buttons = createRow({
    label: t('palette.tokenCheck'),
    control: (() => {
      const holder = el('div', 'gp-row__buttons');
      holder.append(
        createButton(t('palette.tokenCheck'), verifyToken),
        createButton(t('palette.tokenClear'), () => {
          draft.commandPalette.token = '';
          tokenInput.value = '';
          feedback.hidden = true;
          showToast({ type: 'info', title: t('palette.tokenCleared'), message: t('palette.tokenClearedDesc') });
        }, 'gp-button--ghost'),
      );
      return holder;
    })(),
  });
  section.body.append(buttons, feedback);
  return section;
}

function sourcesSection(draft) {
  const section = createSection({
    title: t('palette.sources'),
    hint: t('palette.sourcesDesc'),
  });
  const grid = document.createElement('div');
  grid.className = 'gp-grid';
  for (const id of SOURCE_IDS) {
    grid.appendChild(createSwitchCell({
      checked: draft.commandPalette.sources[id] !== false,
      label: t(`palette.source.${id}`),
      hint: t(`palette.source.${id}Desc`),
      onChange: (value) => {
        draft.commandPalette.sources[id] = value;
      },
    }));
  }
  section.body.appendChild(grid);
  return section;
}

function filtersSection(draft) {
  const section = createSection({
    title: t('palette.filters'),
    hint: t('palette.filtersDesc'),
  });
  section.body.appendChild(createSwitchRow({
    checked: draft.commandPalette.hideForks,
    label: t('palette.hideForks'),
    hint: t('palette.hideForksDesc'),
    onChange: (value) => {
      draft.commandPalette.hideForks = value;
    },
  }));
  section.body.appendChild(createSwitchRow({
    checked: draft.commandPalette.hideArchived,
    label: t('palette.hideArchived'),
    hint: t('palette.hideArchivedDesc'),
    onChange: (value) => {
      draft.commandPalette.hideArchived = value;
    },
  }));
  return section;
}

function cacheSection(draft) {
  const section = createSection({
    title: t('palette.cache'),
    hint: t('palette.cacheDesc'),
  });
  section.body.appendChild(createField({
    label: t('palette.cacheHours'),
    hint: t('palette.cacheHoursDesc'),
    control: createNumberInput({
      value: draft.commandPalette.cacheHours,
      min: 0,
      max: COMMAND_PALETTE_CACHE_HOURS_MAX,
      label: t('palette.cacheHours'),
      onChange: (value) => {
        draft.commandPalette.cacheHours = value;
      },
    }),
  }));

  let stats = createRow({ label: cacheStatsText() });
  const clear = createButton(t('palette.clearCache'), () => {
    clearDataCache();
    forgetRepositories();
    forgetTrees();
    forgetIssues();
    const fresh = createRow({ label: cacheStatsText() });
    stats.replaceWith(fresh);
    stats = fresh;
    showToast({
      type: 'success',
      title: t('palette.cacheCleared'),
      message: t('palette.cacheClearedDesc'),
    });
  }, 'gp-button--ghost');
  section.body.append(stats, createRow({ label: t('palette.clearCache'), control: clear }));
  return section;
}

/** Command palette page: activation, access, sources, filters, cache. */
export function renderCommandPalette(container, draft = getDraft()) {
  container.append(
    activationSection(draft),
    accessSection(draft),
    sourcesSection(draft),
    filtersSection(draft),
    cacheSection(draft),
  );
}
