import { getTranslateSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { createButton } from './inject.js';
import { ensureContainer, toggleContainer } from './state.js';
import { previewContainer, previewSurface } from './surfaces.js';

/** Whether the quick preview offers a translate action. */
export function isPreviewTranslationEnabled() {
  const settings = getTranslateSettings();
  return !!(settings.enabled && settings.surfaces.preview);
}

/**
 * The translate control for the preview header. It owns its button, so
 * `ensureContainer` leaves the toggling to this handler.
 */
export function createPreviewTranslateAction() {
  const button = createButton(t('translate.button'));
  button.addEventListener('click', () => {
    const container = previewContainer();
    if (!container) return;
    const state = ensureContainer(container, previewSurface(), { button });
    if (state) toggleContainer(state);
  });
  return button;
}
