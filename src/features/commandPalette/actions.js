/**
 * Palette action descriptors and their runner. The runner owns persistence,
 * notifications and navigation, so a command is pure data.
 */

import { t } from '../../i18n/index.js';
import { emit } from '../../core/bus.js';
import { getSettings, saveSettings } from '../../core/settings.js';
import { showToast } from '../../ui/toast.js';
import { ensureRepositories } from './repos.js';
import { ensureTree } from './files.js';
import { clearDataCache } from './store.js';
import { TOGGLE_LABEL_KEYS, searchUrl } from './commands.js';

export { searchUrl };

/** The one-key settings patch a toggle saves. */
export function togglePatch(section, enabled) {
  return { [section]: { enabled } };
}

export function navigate(url, newTab = false) {
  if (newTab) window.open(url, '_blank', 'noopener');
  else location.assign(url);
}

function toggleLabel(enabled, section) {
  return t(enabled ? 'palette.cmd.toggleOn' : 'palette.cmd.toggleOff', {
    feature: t(TOGGLE_LABEL_KEYS[section]),
  });
}

async function toggleSection(section, enabled) {
  saveSettings(togglePatch(section, enabled));
  emit(`settings:${section}`, getSettings()[section]);
  showToast({ type: 'success', title: toggleLabel(enabled, section) });
  return undefined;
}

async function refresh(action, refresh) {
  const result = action.type === 'refreshRepos'
    ? await ensureRepositories({ force: true })
    : await ensureTree({ force: true });
  refresh();
  if (result?.status === 'error') {
    showToast({
      type: 'error',
      title: t('palette.refreshFailed'),
      message: t('palette.refreshFailedDesc'),
    });
  }
  return undefined;
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast({ type: 'success', title: t('palette.copied') });
  } catch {
    showToast({
      type: 'error',
      title: t('palette.copyFailed'),
      message: t('palette.copyFailedDesc'),
    });
  }
  return undefined;
}

/** Run one action descriptor; feature-specific work arrives through `options`. */
export async function runAction(action, options = {}) {
  const {
    newTab = false,
    refresh: refreshState = () => {},
    openSettings = () => {},
    clearTranslationCache = async () => {},
  } = options;

  switch (action?.type) {
    case 'navigate':
      navigate(action.url, newTab);
      return undefined;
    case 'settings':
      openSettings();
      return undefined;
    case 'toggle':
      return toggleSection(action.section, action.enabled);
    case 'refreshRepos':
    case 'refreshTree':
      return refresh(action, refreshState);
    case 'clearCache':
      clearDataCache();
      refreshState();
      showToast({ type: 'success', title: t('palette.cacheCleared') });
      return undefined;
    case 'clearTranslateCache':
      await clearTranslationCache();
      showToast({ type: 'success', title: t('palette.cacheCleared') });
      return undefined;
    case 'copy':
      return copy(action.text);
    case 'search':
      return runAction({ type: 'navigate', url: searchUrl(action.scope, action.query) }, options);
    default:
      return undefined;
  }
}
