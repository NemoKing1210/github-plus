/**
 * Structured console diagnostics for GitHub Plus.
 *
 * Every failure carries a stable `GP-####` code: grep the codebase for the
 * code to jump straight to the throw site. Errors and warnings always
 * print; `logInfo` traces print only in verbose mode, enabled via
 * `localStorage.setItem('gp_debug', '1')` or `window.__GP_DEBUG__ = true`
 * in the page console.
 */

export const Codes = {
  /** A bus listener threw while handling an event. */
  BUS_LISTENER: 'GP-1001',
  /** Persisting settings to GM storage failed. */
  SETTINGS_PERSIST: 'GP-1002',
  /** Reading settings from GM storage failed. */
  SETTINGS_LOAD: 'GP-1003',
  /** Importing a settings backup failed (invalid payload). */
  SETTINGS_IMPORT: 'GP-1004',
  /** Collecting or opening a gallery failed (logged once at the click). */
  GALLERY_FAILED: 'GP-1101',
  /** A registered gallery source threw while collecting its images. */
  GALLERY_SOURCE: 'GP-1102',
  /** A gallery image failed to load in the viewer. */
  GALLERY_IMAGE: 'GP-1103',
  /** Mounting the settings entry or panel failed. */
  UI_MOUNT: 'GP-1201',
};

const BADGE_STYLE =
  'background:#8a3030;color:#fff;border-radius:2px;padding:1px 6px;font-weight:bold';
const WARN_BADGE_STYLE =
  'background:#6b5416;color:#ffe1a8;border-radius:2px;padding:1px 6px;font-weight:bold';
const CODE_STYLE = 'font-weight:bold';
const INFO_STYLE = 'color:#8f98a0';

export function isVerbose() {
  if (window.__GP_DEBUG__ === true) return true;
  try {
    return localStorage.getItem('gp_debug') === '1';
  } catch {
    return false;
  }
}

function print(printer, badgeStyle, code, message, details) {
  printer(
    `%c${code}%c ${message}`,
    badgeStyle,
    CODE_STYLE,
    details === undefined ? '' : details,
  );
}

/** Always printed: a failure the user or developer must see. */
export function logError(code, message, details) {
  print(console.error, BADGE_STYLE, code, message, details);
}

/** Always printed: degraded behavior that recovered on its own. */
export function logWarn(code, message, details) {
  print(console.warn, WARN_BADGE_STYLE, code, message, details);
}

/** Printed only in verbose mode: traces for development. */
export function logInfo(area, message, details) {
  if (!isVerbose()) return;
  print(console.info, `background:${INFO_STYLE};border-radius:2px;padding:1px 6px`, `${area}: ${message}`, details);
}
