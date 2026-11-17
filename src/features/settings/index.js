import { on } from '../../core/bus.js';
import { hasCustomSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { registerHeaderAction } from '../../ui/headerActions.js';
import { watchNavigation } from '../../utils/navigation.js';
import { getIconSvg } from './controls.js';
import { registerPage, togglePanel } from './panel.js';
import { renderAbout } from './tabs/about.js';
import { renderBackup } from './tabs/backup.js';
import { renderCommandPalette } from './tabs/commandPalette.js';
import { renderFiles } from './tabs/files.js';
import { renderGallery } from './tabs/gallery.js';
import { renderGeneral } from './tabs/general.js';
import { renderTranslate } from './tabs/translate.js';
import { ensureUserMenuItem, installUserMenuEntry, refreshUserMenuItem } from './userMenu.js';

/**
 * Settings entry points: the header button and the user-menu row (with a
 * menu-command fallback for userscript managers), the page registry and the
 * mount/remount logic for GitHub's client-side navigation.
 *
 * The button itself is placed by `ui/headerActions.js`, next to GitHub's own
 * header actions; this module only registers it and keeps its label and the
 * "settings differ from defaults" dot in step. The user-menu row is owned by
 * `userMenu.js`.
 */
let settingsAction = null;

function refreshLabels() {
  settingsAction?.update({ label: t('settings.open') });
  refreshUserMenuItem();
}

function updateSettingsButtonState() {
  const custom = hasCustomSettings();
  settingsAction?.update({
    className: custom ? 'gp-settings-btn gp-header-btn--custom' : 'gp-settings-btn',
  });
  refreshUserMenuItem();
}

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
  settingsAction = registerHeaderAction({
    id: 'settings',
    order: 20,
    className: 'gp-settings-btn',
    icon: getIconSvg('gear'),
    label: t('settings.open'),
    onClick: () => togglePanel(true),
  });
  updateSettingsButtonState();
  installUserMenuEntry();
  ensureUserMenuItem();
  watchNavigation(() => {
    installUserMenuEntry();
    ensureUserMenuItem();
  });
  on('settings:gallery', updateSettingsButtonState);
  on('settings:toasts', updateSettingsButtonState);
  on('settings:fileIcons', updateSettingsButtonState);
  on('settings:fileAges', updateSettingsButtonState);
  on('settings:fileMeta', updateSettingsButtonState);
  on('settings:fileMenu', updateSettingsButtonState);
  on('settings:translate', updateSettingsButtonState);
  on('settings:language', () => {
    refreshLabels();
    updateSettingsButtonState();
  });
}
