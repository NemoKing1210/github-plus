import { on } from '../../core/bus.js';
import { configureLogger } from '../../core/logger/index.js';
import { getLoggingSettings } from '../../core/settings.js';

/** Apply the persisted diagnostics switch to the logger. */
export function applyLoggingSettings() {
  configureLogger(getLoggingSettings());
}

/** Boot the logger and keep it in sync with the settings bus. */
export function initLoggingFeature() {
  applyLoggingSettings();
  on('settings:logging', applyLoggingSettings);
}
