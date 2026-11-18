import './styles/tokens.css';
import './styles/app.css';
import { configureLocale } from './i18n/index.js';
import { getSettings } from './core/settings.js';
import { initLoggingFeature } from './features/logging/index.js';
import { initSettingsFeature } from './features/settings/index.js';
import { isPanelOpen, togglePanel } from './features/settings/panel.js';
import { applyFileAgesSettings, initFileAgesFeature } from './features/fileAges/index.js';
import { applyFileIconsSettings, initFileIconsFeature } from './features/fileIcons/index.js';
import { applyFileMetaSettings, initFileMetaFeature } from './features/fileMeta/index.js';
import { applyFileMenuSettings, initFileMenuFeature } from './features/fileMenu/index.js';
import { applyFilePreviewSettings, initFilePreviewFeature } from './features/filePreview/index.js';
import { applyTranslateSettings, initTranslateFeature } from './features/translate/index.js';
import { applyCommitBadgesSettings, initCommitBadgesFeature } from './features/commitBadges/index.js';
import { applyCommandPaletteSettings, initCommandPaletteFeature } from './features/commandPalette/index.js';
import { applyGallerySettings, initGalleryFeature } from './gallery/index.js';
import { closeFilePreview, isFilePreviewOpen } from './ui/filePreview.js';
import { closeViewer, isViewerOpen } from './ui/viewer.js';
import { watchNavigation } from './utils/navigation.js';

/**
 * Entry point.
 *
 * There is no global DOM scan loop: the gallery works through one delegated
 * click listener plus one injected stylesheet, so nothing has to be re-run
 * when GitHub re-renders a page. Only the header entry needs re-mounting on
 * client-side navigation, and it asks for that itself.
 */

/**
 * Overlays live in `<body>`, which GitHub replaces on soft navigation. Their
 * module state would otherwise outlive the elements: a "closed" viewer that
 * still reports itself open would swallow Escape, and a pinned page would
 * stay pinned forever.
 */
function resetOverlaysOnNavigation() {
  if (isViewerOpen()) closeViewer();
  if (isFilePreviewOpen()) closeFilePreview();
  if (isPanelOpen()) togglePanel(false);
}

function init() {
  initLoggingFeature();
  configureLocale(getSettings().language);
  initSettingsFeature();
  initGalleryFeature();
  applyGallerySettings();
  initFileIconsFeature();
  applyFileIconsSettings();
  initFileAgesFeature();
  applyFileAgesSettings();
  initFileMetaFeature();
  applyFileMetaSettings();
  initFileMenuFeature();
  applyFileMenuSettings();
  initFilePreviewFeature();
  applyFilePreviewSettings();
  initTranslateFeature();
  applyTranslateSettings();
  initCommitBadgesFeature();
  applyCommitBadgesSettings();
  initCommandPaletteFeature();
  applyCommandPaletteSettings();
  watchNavigation(resetOverlaysOnNavigation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
