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

/** Target languages offered by the translation settings (Google-style codes). */
export const TRANSLATE_TARGET_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'be', name: 'Беларуская', flag: '🇧🇾' },
  { code: 'zh-CN', name: '中文（简体）', flag: '🇨🇳' },
  { code: 'zh-TW', name: '中文（繁體）', flag: '🇹🇼' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'sr', name: 'Српски', flag: '🇷🇸' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
];

/** GM storage key for the persistent translation cache. */
export const TRANSLATION_CACHE_KEY = 'gp_translation_cache_v1';

/** Longest translation cache lifetime, hours; 0 disables the cache. */
export const TRANSLATE_CACHE_HOURS_MAX = 168;

/** Soft size budget for the translation cache, bytes. */
export const TRANSLATE_CACHE_SOFT_LIMIT_BYTES = 512 * 1024;

/** Containers translated at the same time in automatic mode. */
export const TRANSLATE_MAX_CONCURRENCY = 2;

/** Segments joined into one provider request. */
export const TRANSLATE_BATCH_MAX_SEGMENTS = 8;
export const TRANSLATE_BATCH_MAX_CHARS = 4000;

/** Limits for one translated container. */
export const TRANSLATE_MAX_BLOCKS = 300;
export const TRANSLATE_MAX_BLOCK_CHARS = 12000;

/** Debounce for surface observers, and the bounded wait for late mounts. */
export const TRANSLATE_OBSERVE_DEBOUNCE_MS = 150;
export const TRANSLATE_SETTLE_MS = 250;
export const TRANSLATE_SETTLE_TRIES = 20;

/** Shades in the file-age colour scale (1 = oldest, N = newest). */
export const AGE_BUCKET_COUNT = 10;

/** Largest file whose contents the context menu puts on the clipboard. */
export const FILE_COPY_MAX_BYTES = 1024 * 1024;

/** Largest text or markdown file the preview renders from its raw address. */
export const PREVIEW_TEXT_MAX_BYTES = 2 * 1024 * 1024;

/** Largest PDF the preview embeds. */
export const PREVIEW_PDF_MAX_BYTES = 25 * 1024 * 1024;

/** Longest code text highlighted; longer files render as plain text. */
export const PREVIEW_HIGHLIGHT_MAX_CHARS = 500 * 1024;

/** Most sibling files the preview's navigation can span. */
export const PREVIEW_MAX_SIBLINGS = 500;

/** Rendered previews kept in memory for the session. */
export const PREVIEW_CACHE_ENTRIES = 12;

/** How long the PDF frame may take to load before its fallback card shows. */
export const PREVIEW_PDF_FRAME_TIMEOUT_MS = 5000;

/** Default time the left button must rest on a file link to open the preview. */
export const PREVIEW_LONG_PRESS_MS = 450;

/** Bounds for the configured hold time, ms. */
export const PREVIEW_LONG_PRESS_MIN_MS = 200;
export const PREVIEW_LONG_PRESS_MAX_MS = 2000;

/**
 * The progress ring waits this long before it appears, so a plain click never
 * flashes it; the fill then runs over the remaining time. A very short hold
 * time shortens the wait so at least 80 ms of fill remains.
 */
export const PREVIEW_RING_DELAY_MS = 150;

/** Movement past this many pixels makes the press a drag, not a long press. */
export const PREVIEW_LONG_PRESS_MOVE_PX = 8;

/** Toast corner placements. */
export const TOAST_POSITIONS = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
];

/** Longest auto-hide delay a toast may be configured with, ms. */
export const TOAST_MAX_DURATION_MS = 120000;

/** Diagnostics entries kept in memory while console logging is enabled. */
export const LOG_MAX_ENTRIES = 300;

/** Longest string kept in one sanitized log detail, characters. */
export const LOG_STRING_MAX_CHARS = 2000;

/** Deepest object nesting the log sanitizer walks. */
export const LOG_DETAIL_DEPTH = 4;

/** Most array items or object keys kept in one sanitized log detail. */
export const LOG_MAX_ITEMS = 50;

/** Diagnostics: optional console logging, silent while disabled. */
const DEFAULT_LOGGING = {
  enabled: false,
};

/** Gallery: image lightbox over rendered markdown (README and every other
 *  markdown surface on GitHub). */
const DEFAULT_GALLERY = {
  enabled: true,
  sources: {
    markdown: true,
  },
  skipBadges: true,
  upgradeFullSize: true,
  download: true,
  thumbnails: true,
  loop: true,
  maxZoom: GALLERY_DEFAULT_MAX_ZOOM,
};

const DEFAULT_TOASTS = {
  enabled: true,
  position: 'bottom-right',
  duration: 5000,
};

/** File icons: colored type icons for files and folders GitHub lists. */
const DEFAULT_FILE_ICONS = {
  enabled: true,
  folders: true,
  specialNames: true,
};

/** File ages: blame-style age colors next to each last-commit date. */
const DEFAULT_FILE_AGES = {
  enabled: true,
  folders: true,
};

/** File meta: size labels and download buttons in file listings. */
const DEFAULT_FILE_META = {
  enabled: true,
  sizes: true,
  download: true,
};

/** File and folder context menu: quick actions on listing rows and file pages. */
const DEFAULT_FILE_MENU = {
  enabled: true,
};

/** File preview: a modal that renders a file without leaving the page. */
const DEFAULT_FILE_PREVIEW = {
  enabled: true,
  rowButton: true,
  longPress: true,
  longPressMs: PREVIEW_LONG_PRESS_MS,
  longPressRing: true,
};

/** Most entries one expanded folder renders; larger folders show a note. */
export const FOLDER_TREE_MAX_ENTRIES = 1000;

/** How long a fetched folder listing and its commit info stay cached, ms. */
export const FOLDER_TREE_CACHE_MS = 5 * 60 * 1000;

/** A folder listing or commit-info request that takes longer is abandoned. */
export const FOLDER_TREE_TIMEOUT_MS = 15000;

/** Extra left padding per expansion depth, px. */
export const FOLDER_TREE_INDENT_PX = 16;

/** Folder tree: expand folders inline in the repository file listing. */
const DEFAULT_FOLDER_TREE = {
  enabled: true,
};

/** List avatars: the author's avatar beside the login in issue/PR lists. */
const DEFAULT_LIST_AVATARS = {
  enabled: true,
};

/** Commit badges: Conventional Commit types and scopes on commit subjects. */
const DEFAULT_COMMIT_BADGES = {
  enabled: true,
  unknownTypes: true,
  breaking: true,
};

/**
 * Translation: block-level translation of markdown, commit messages and
 * titles. The `providerConfig` keys are the provider whitelist and the
 * `surfaces` keys are the surface whitelist.
 */
const DEFAULT_TRANSLATE = {
  enabled: true,
  provider: 'google',
  providerConfig: {
    google: {},
    deepl: { apiKey: '', plan: 'free' },
    microsoft: { apiKey: '', region: 'global' },
    yandex: { apiKey: '', folderId: '' },
    openai: { apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
    libretranslate: { apiUrl: 'https://libretranslate.com', apiKey: '' },
  },
  targetLang: 'auto',
  mode: 'button',
  display: 'replace',
  reveal: 'button',
  linkLabels: true,
  surfaces: { markdown: true, plaintext: true, commits: true, titles: true, preview: true },
  cacheHours: 24,
};

/** Similar repositories: providers offer the panel's data source. */
export const SIMILAR_REPOS_PROVIDERS = ['github', 'simrepo'];

/** Bounds for the results-per-page setting. */
export const SIMILAR_REPOS_RESULTS_MIN = 3;
export const SIMILAR_REPOS_RESULTS_MAX = 20;

/** Longest cache lifetime, hours; 0 keeps nothing between page loads. */
export const SIMILAR_REPOS_CACHE_HOURS_MAX = 168;

/** Third-party endpoint behind the opt-in `simrepo` provider. */
export const SIMILAR_REPOS_SIMREPO_URL = 'https://simrepo.dera.page/similar-repos';

/** GitHub repository metadata and search endpoints. */
export const GITHUB_API_URL = 'https://api.github.com';

/** One similar-repositories request that takes longer is abandoned. */
export const SIMILAR_REPOS_TIMEOUT_MS = 15000;

/** Bounded wait for the repository sidebar to mount after navigation. */
export const SIMILAR_REPOS_SETTLE_MS = 250;
export const SIMILAR_REPOS_SETTLE_TRIES = 12;

/** Similar repositories: a sidebar panel recommending related projects. */
const DEFAULT_SIMILAR_REPOS = {
  enabled: true,
  provider: 'github',
  results: 5,
  cacheHours: 24,
};

export const COMMAND_PALETTE_SHORTCUTS = ['mod+k', 'mod+shift+k', 'mod+space', 'alt+k', 'off'];export const COMMAND_PALETTE_CACHE_KEY = 'gp_palette_cache_v1';
export const COMMAND_PALETTE_RECENTS_KEY = 'gp_palette_recents_v1';
export const COMMAND_PALETTE_PINS_KEY = 'gp_palette_pins_v1';
export const COMMAND_PALETTE_CACHE_HOURS_MAX = 168;
export const COMMAND_PALETTE_MAX_RESULTS_MIN = 10;
export const COMMAND_PALETTE_MAX_RESULTS_MAX = 100;

/** Command palette: keyboard search over repositories, files and actions. */
const DEFAULT_COMMAND_PALETTE = {
  enabled: true,
  shortcut: 'mod+k',
  token: '',
  sources: {
    commands: true,
    repositories: true,
    starred: true,
    files: true,
    issues: true,
    recent: true,
  },
  hideForks: false,
  hideArchived: false,
  cacheHours: 6,
  maxResults: 30,
};

export const DEFAULT_SETTINGS = {
  language: 'auto',
  logging: DEFAULT_LOGGING,
  gallery: DEFAULT_GALLERY,
  toasts: DEFAULT_TOASTS,
  fileIcons: DEFAULT_FILE_ICONS,
  fileAges: DEFAULT_FILE_AGES,
  fileMeta: DEFAULT_FILE_META,
  fileMenu: DEFAULT_FILE_MENU,
  filePreview: DEFAULT_FILE_PREVIEW,
  folderTree: DEFAULT_FOLDER_TREE,
  listAvatars: DEFAULT_LIST_AVATARS,
  commitBadges: DEFAULT_COMMIT_BADGES,
  translate: DEFAULT_TRANSLATE,
  commandPalette: DEFAULT_COMMAND_PALETTE,
  similarRepos: DEFAULT_SIMILAR_REPOS,
};

/** Deep-cloned defaults, used on reset. */
export function getDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}
