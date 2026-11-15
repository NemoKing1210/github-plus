import { on } from '../../core/bus.js';
import { FILE_COPY_MAX_BYTES } from '../../core/constants.js';
import { Codes, logError } from '../../core/debug.js';
import { getFileMenuSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { closeContextMenu, openContextMenu } from '../../ui/contextMenu.js';
import { ACTION_ICONS } from '../../ui/icons.js';
import { showToast } from '../../ui/toast.js';
import { isOwnUi } from '../../utils/dom.js';
import { downloadFile } from '../../utils/download.js';
import { resolveFileTarget } from '../../utils/fileTarget.js';
import { watchNavigation } from '../../utils/navigation.js';
import { isCopyableContent } from './copy.js';

/**
 * File context menu: right-click a file in the repository listing or on a
 * file page for quick actions. One delegated `contextmenu` listener on the
 * document; the target is resolved from the live DOM at open time, so there
 * is nothing to invalidate on a GitHub re-render.
 *
 * The native menu is replaced only on a resolved file target; everywhere else
 * the browser keeps its own menu. The menu itself lives in `ui/contextMenu.js`
 * and is reusable by other features.
 */

let listening = false;

function toast(titleKey, messageKey, type = 'success', vars = {}) {
  showToast({ type, title: t(titleKey), message: t(messageKey, vars) });
}

function failed(message, details) {
  logError(Codes.FILE_MENU, message, details);
  toast('fileMenu.copyFailed', 'fileMenu.copyFailedDesc', 'error');
}

async function writeClipboard(text, titleKey, messageKey, vars = {}) {
  try {
    await navigator.clipboard.writeText(text);
    toast(titleKey, messageKey, 'success', vars);
  } catch (error) {
    failed('writing the clipboard failed', { error });
  }
}

async function copyContents(target) {
  try {
    const response = await fetch(target.rawUrl, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > FILE_COPY_MAX_BYTES) {
      toast('fileMenu.tooLarge', 'fileMenu.tooLargeDesc', 'warning', {
        size: `${Math.round(FILE_COPY_MAX_BYTES / (1024 * 1024))} MB`,
      });
      return;
    }
    const blob = await response.blob();
    if (blob.size > FILE_COPY_MAX_BYTES) {
      toast('fileMenu.tooLarge', 'fileMenu.tooLargeDesc', 'warning', {
        size: `${Math.round(FILE_COPY_MAX_BYTES / (1024 * 1024))} MB`,
      });
      return;
    }
    const type = blob.type || response.headers.get('content-type') || '';
    if (!isCopyableContent(type, target.name)) {
      toast('fileMenu.notText', 'fileMenu.notTextDesc', 'warning', { name: target.name });
      return;
    }
    await writeClipboard(await blob.text(), 'fileMenu.contentCopied', 'fileMenu.contentCopiedDesc', {
      name: target.name,
    });
  } catch (error) {
    failed('copying the file contents failed', { error, rawUrl: target.rawUrl });
  }
}

function buildItems(target) {
  const items = [];
  if (target.source !== 'blob') {
    items.push({
      label: t('fileMenu.open'),
      icon: ACTION_ICONS.open,
      onSelect: () => window.location.assign(target.href),
    });
  }
  items.push({
    label: t('fileMenu.openNewTab'),
    icon: ACTION_ICONS.external,
    onSelect: () => window.open(target.href, '_blank', 'noopener'),
  });
  items.push(null);
  items.push({
    label: t('fileMenu.download'),
    icon: ACTION_ICONS.download,
    onSelect: () => downloadFile(target.rawUrl, target.name),
  });
  items.push({
    label: t('fileMenu.copyContents'),
    icon: ACTION_ICONS.copy,
    onSelect: () => copyContents(target),
  });
  items.push(null);
  items.push({
    label: t('fileMenu.copyLink'),
    icon: ACTION_ICONS.link,
    onSelect: () => writeClipboard(target.href, 'fileMenu.linkCopied', 'fileMenu.linkCopiedDesc'),
  });
  items.push({
    label: t('fileMenu.copyPath'),
    icon: ACTION_ICONS.path,
    onSelect: () => writeClipboard(target.relative, 'fileMenu.pathCopied', 'fileMenu.pathCopiedDesc'),
  });
  return items;
}

function onContextMenu(event) {
  if (event.defaultPrevented || isOwnUi(event.target)) return;
  const target = resolveFileTarget(event.target);
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  const keyboard = event.clientX === 0 && event.clientY === 0;
  openContextMenu({
    x: event.clientX,
    y: event.clientY,
    anchor: keyboard ? target.anchor : null,
    keyboard,
    label: t('fileMenu.menuLabel', { name: target.name }),
    items: buildItems(target),
  });
}

function install() {
  if (listening) return;
  document.addEventListener('contextmenu', onContextMenu, true);
  listening = true;
}

function uninstall() {
  if (!listening) return;
  document.removeEventListener('contextmenu', onContextMenu, true);
  closeContextMenu();
  listening = false;
}

/** Single entry point for boot and the `settings:fileMenu` event. */
export function applyFileMenuSettings() {
  if (getFileMenuSettings().enabled) install();
  else uninstall();
}

export function initFileMenuFeature() {
  applyFileMenuSettings();
  watchNavigation(() => closeContextMenu());
  on('settings:fileMenu', applyFileMenuSettings);
}
