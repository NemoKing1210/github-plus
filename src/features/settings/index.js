import { on } from '../../core/bus.js';
import { t } from '../../i18n/index.js';
import { watchNavigation } from '../../utils/navigation.js';
import { registerPage, togglePanel } from './panel.js';
import { renderAbout } from './tabs/about.js';
import { renderBackup } from './tabs/backup.js';
import { renderCommandPalette } from './tabs/commandPalette.js';
import { renderCommits } from './tabs/commits.js';
import { renderDiscovery } from './tabs/discovery.js';
import { renderFiles } from './tabs/files.js';
import { renderGallery } from './tabs/gallery.js';
import { renderGeneral } from './tabs/general.js';
import { renderTranslate } from './tabs/translate.js';
import { ensureUserMenuItem, installUserMenuEntry, refreshUserMenuItem } from './userMenu.js';

/**
 * Settings entry points: the user-menu row (with a menu-command fallback for
 * userscript managers), the page registry and the mount/remount logic for
 * GitHub's client-side navigation. The panel has no header button of its own;
 * the command palette's header entry and its settings command are the other
 * way in, so the header stays as sparse as GitHub's own.
 */

function installMenuCommand() {
  if (typeof GM_registerMenuCommand !== 'function') return;
  try {
    GM_registerMenuCommand(t('menu.settings'), openSettingsPanel);
  } catch {
    /* manager without menu commands */
  }
}

function registerPages() {
  registerPage({
    id: 'general',
    group: 'preferences',
    icon: 'general',
    labelKey: 'tab.general',
    descKey: 'tab.general.desc',
    render: renderGeneral,
  });
  registerPage({
    id: 'gallery',
    group: 'preferences',
    icon: 'gallery',
    labelKey: 'tab.gallery',
    descKey: 'tab.gallery.desc',
    render: renderGallery,
  });
  registerPage({
    id: 'files',
    group: 'preferences',
    icon: 'files',
    labelKey: 'tab.files',
    descKey: 'tab.files.desc',
    render: renderFiles,
  });
  registerPage({
    id: 'commits',
    group: 'preferences',
    icon: 'commit',
    labelKey: 'tab.commits',
    descKey: 'tab.commits.desc',
    render: renderCommits,
  });
  registerPage({
    id: 'translate',
    group: 'preferences',
    icon: 'translate',
    labelKey: 'tab.translate',
    descKey: 'tab.translate.desc',
    render: renderTranslate,
  });
  registerPage({
    id: 'commandPalette',
    group: 'preferences',
    icon: 'palette',
    labelKey: 'tab.palette',
    descKey: 'tab.palette.desc',
    render: renderCommandPalette,
  });
  registerPage({
    id: 'discovery',
    group: 'preferences',
    icon: 'discover',
    labelKey: 'tab.discovery',
    descKey: 'tab.discovery.desc',
    render: renderDiscovery,
  });
  registerPage({
    id: 'backup',
    group: 'more',
    icon: 'backup',
    labelKey: 'tab.backup',
    descKey: 'tab.backup.desc',
    render: renderBackup,
  });
  registerPage({
    id: 'about',
    group: 'more',
    icon: 'about',
    labelKey: 'tab.about',
    descKey: 'tab.about.desc',
    render: renderAbout,
  });
}

/** Open the settings panel (menu command entry point). */
export function openSettingsPanel() {
  togglePanel(true);
}

export function initSettingsFeature() {
  registerPages();
  installMenuCommand();
  installUserMenuEntry();
  ensureUserMenuItem();
  watchNavigation(() => {
    installUserMenuEntry();
    ensureUserMenuItem();
  });
  on('settings:gallery', refreshUserMenuItem);
  on('settings:toasts', refreshUserMenuItem);
  on('settings:fileIcons', refreshUserMenuItem);
  on('settings:fileAges', refreshUserMenuItem);
  on('settings:fileMeta', refreshUserMenuItem);
  on('settings:fileMenu', refreshUserMenuItem);
  on('settings:commitBadges', refreshUserMenuItem);
  on('settings:translate', refreshUserMenuItem);
  on('settings:language', refreshUserMenuItem);
  on('settings:similarRepos', refreshUserMenuItem);
}
