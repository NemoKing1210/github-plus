import { on } from '../../core/bus.js';
import { FILE_COPY_MAX_BYTES } from '../../core/constants.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { getFileMenuSettings, getFilePreviewSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { closeContextMenu, openContextMenu } from '../../ui/contextMenu.js';
import { ACTION_ICONS } from '../../ui/icons.js';
import { showToast } from '../../ui/toast.js';
import { isOwnUiChrome } from '../../utils/dom.js';
import { downloadFile } from '../../utils/download.js';
import { resolveFileTarget, resolveFolderTarget } from '../../utils/fileTarget.js';
import { watchNavigation } from '../../utils/navigation.js';
import { openPreviewForTarget } from '../filePreview/index.js';
import { folderRowExpansion, toggleFolderRow } from '../folderTree/index.js';
import { isCopyableContent } from './copy.js';

const log = createLogger('file-menu');

/**
 * File and folder context menu: right-click a file or a folder in the
 * repository listing, the file tree, on a file page or on a link in rendered
 * markdown for quick actions. One delegated `contextmenu` listener on the
 * document; the target is resolved from the live DOM at open time, so there is
 * nothing to invalidate on a GitHub re-render.
 *
 * The native menu is replaced only on a resolved file or folder target;
 * everywhere else the browser keeps its own menu. The menu itself lives in
 * `ui/contextMenu.js` and is reusable by other features.
 */

let listening = false;

function toast(titleKey, messageKey, type = 'success', vars = {}) {
  showToast({ type, title: t(titleKey), message: t(messageKey, vars) });
}

function failed(message, details) {
  log.error(Codes.FILE_MENU, message, details);
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

function copyName(target) {
  return writeClipboard(target.name, 'fileMenu.nameCopied', 'fileMenu.nameCopiedDesc', {
    name: target.name,
  });
}

function buildFileItems(target) {
  const items = [];
  if (getFilePreviewSettings().enabled) {
    items.push({
      label: t('preview.menuItem'),
      icon: ACTION_ICONS.eye,
      onSelect: () => openPreviewForTarget(target),
    });
    items.push(null);
  }
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
  items.push({
    label: t('fileMenu.copyName'),
    icon: ACTION_ICONS.name,
    onSelect: () => copyName(target),
  });
  return items;
}

/**
 * The folder row the folder tree can expand, if this target is one. Only a
 * listing row has a chevron; a sidebar-tree folder expands in GitHub's own
 * tree and a markdown link points at a page.
 */
function expandableFolder(target) {
  if (target.source !== 'listing' || !(target.anchor instanceof Element)) return null;
  const row = target.anchor.closest('tr.react-directory-row');
  if (!row) return null;
  const expansion = folderRowExpansion(row);
  return expansion ? { row, expansion } : null;
}

/**
 * A folder has no contents to copy and nothing to download, so its menu is the
 * navigation, the disclosure of a listing row and the three clipboard actions.
 */
function buildFolderItems(target) {
  const items = [
    {
      label: t('fileMenu.open'),
      icon: ACTION_ICONS.open,
      onSelect: () => window.location.assign(target.href),
    },
    {
      label: t('fileMenu.openNewTab'),
      icon: ACTION_ICONS.external,
      onSelect: () => window.open(target.href, '_blank', 'noopener'),
    },
  ];
  const folder = expandableFolder(target);
  if (folder) {
    const expanded = folder.expansion === 'expanded';
    items.push(null);
    items.push({
      label: t(expanded ? 'fileMenu.collapse' : 'fileMenu.expand'),
      icon: expanded ? ACTION_ICONS.collapse : ACTION_ICONS.expand,
      onSelect: () => toggleFolderRow(folder.row),
    });
  }
  items.push(null);
  items.push(
    {
      label: t('fileMenu.copyLink'),
      icon: ACTION_ICONS.link,
      onSelect: () => writeClipboard(target.href, 'fileMenu.linkCopied', 'fileMenu.linkCopiedDesc'),
    },
    {
      label: t('fileMenu.copyPath'),
      icon: ACTION_ICONS.path,
      onSelect: () => writeClipboard(target.relative, 'fileMenu.pathCopied', 'fileMenu.pathCopiedDesc'),
    },
    {
      label: t('fileMenu.copyName'),
      icon: ACTION_ICONS.name,
      onSelect: () => copyName(target),
    },
  );
  return items;
}

function onContextMenu(event) {
  if (event.defaultPrevented || isOwnUiChrome(event.target)) return;
  const target = resolveFileTarget(event.target) || resolveFolderTarget(event.target);
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  const keyboard = event.clientX === 0 && event.clientY === 0;
  const elevated = event.target instanceof Element
    && !!event.target.closest('.gp-preview-overlay');
  openContextMenu({
    x: event.clientX,
    y: event.clientY,
    anchor: keyboard ? target.anchor : null,
    keyboard,
    elevated,
    label: t('fileMenu.menuLabel', { name: target.name }),
    items: target.kind === 'folder' ? buildFolderItems(target) : buildFileItems(target),
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
