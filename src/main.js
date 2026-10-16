import './styles/tokens.css';
import './styles/app.css';
import { configureLocale } from './i18n/index.js';
import { getSettings } from './core/settings.js';
import { initSettingsFeature } from './features/settings/index.js';
import { isPanelOpen, togglePanel } from './features/settings/panel.js';
import { applyGallerySettings, initGalleryFeature } from './gallery/index.js';
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
  if (isPanelOpen()) togglePanel(false);
}

function init() {
  configureLocale(getSettings().language);
  initSettingsFeature();
  initGalleryFeature();
  applyGallerySettings();
  watchNavigation(resetOverlaysOnNavigation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
