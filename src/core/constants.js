export const SCRIPT_NAME = 'GitHub Plus';
export const AUTHOR_NAME = 'NemoKing1210';
export const AUTHOR_URL = 'https://github.com/NemoKing1210';
export const REPO_URL = 'https://github.com/NemoKing1210/github-plus';
export const SETTINGS_KEY = 'gp_settings_v1';

/** Max images collected into one gallery; huge markdown files are truncated. */
export const GALLERY_MAX_IMAGES = 500;

/** An image smaller than this on both axes is chrome (icon, badge), not content. */
export const GALLERY_MIN_SIZE_PX = 80;

/**
 * An image at most this tall is a status badge or stripe, however wide it is
 * (badge services render 20–40 px tall strips). Only applied when the rendered
 * height is known, so a lazily loaded image is never guessed at.
 */
export const GALLERY_BADGE_MAX_HEIGHT_PX = 40;

/** Zoom ceilings offered by the settings panel (largest wins as the cap). */
export const ZOOM_OPTIONS = [2, 4, 6, 8, 12, 16];

/** Highest zoom ceiling the viewer accepts (settings values are clamped to it). */
export const GALLERY_MAX_ZOOM = ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1];

/** Zoom ceiling the gallery ships with. */
export const GALLERY_DEFAULT_MAX_ZOOM = 8;

/**
 * Hosts that only ever serve badges and status snippets. Their images are
 * never worth a gallery slot, so they are skipped without a size check
 * (a badge host can render at any size and still be noise).
 */
export const BADGE_HOSTS = [
  'shields.io',
  'badgen.net',
  'badge.fury.io',
  'codecov.io',
  'coveralls.io',
  'travis-ci.org',
  'travis-ci.com',
  'circleci.com',
  'app.codacy.com',
  'snyk.io',
  'david-dm.org',
  'opencollective.com',
  'gitter.im',
  'discordapp.com',
  'api.netlify.com',
  'vercel.com',
  'isitmaintained.com',
];

/** File extensions the gallery accepts when upgrading to a linked original. */
export const IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'avif',
  'apng',
  'bmp',
  'svg',
];

/** Toast corner placements. */
export const TOAST_POSITIONS = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
];

/** Longest auto-hide delay a toast may be configured with, ms. */
export const TOAST_MAX_DURATION_MS = 120000;

/** Gallery: image lightbox over rendered markdown (README and every other
 *  markdown surface on GitHub). */
const DEFAULT_GALLERY = {
  enabled: true,
  sources: {
    markdown: true,
  },
  skipBadges: true,
  upgradeFullSize: true,
  thumbnails: true,
  loop: true,
  maxZoom: GALLERY_DEFAULT_MAX_ZOOM,
};

const DEFAULT_TOASTS = {
  enabled: true,
  position: 'bottom-right',
  duration: 5000,
};

export const DEFAULT_SETTINGS = {
  language: 'auto',
  gallery: DEFAULT_GALLERY,
  toasts: DEFAULT_TOASTS,
};

/** Deep-cloned defaults, used on reset. */
export function getDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}
