# AGENTS.md — GitHub Plus

Instructions for AI coding agents working in this repository.

## Project

Userscript that improves GitHub (`github.com`, `gist.github.com`). A settings
panel drives an image gallery for rendered markdown, colored file and folder
icons, last-commit ages, file sizes and downloads, a file context menu, a quick
file preview and on-page translation of markdown, comments, commits and titles,
with more GitHub improvements planned. Built with Vite and
`vite-plugin-monkey` for Tampermonkey, Violentmonkey, ScriptCat, and compatible
managers.

- Source entry point: `src/main.js`
- Version source of truth: `package.json`
- Generated install artifacts: `github-plus.user.js` and
  `github-plus.meta.js` (produced only by `npm run build`)
- Docs: `README.md` plus its translations `README.<locale>.md` in the ten UI
  locales, `CHANGELOG.md` (Keep a Changelog + SemVer), and `DESIGN.md` (visual
  rules for all injected UI — see Design below)
- License: MIT

Edit files under `src/`. Never hand-edit generated `.user.js` / `.meta.js`
files; regenerate them with `npm run build`.

## Repository layout

```text
github-plus/
├── AGENTS.md               # This file: architecture and repo conventions
├── DESIGN.md               # Visual rules for every injected UI element
├── THIRD_PARTY_LICENSES    # Attribution for the bundled Material Icon Theme
├── src/
│   ├── main.js             # Entry: locale init, feature boot, nav overlay reset
│   ├── core/
│   │   ├── constants.js    # DEFAULT_SETTINGS, storage key, limits, timings
│   │   ├── settings.js     # Settings state, normalization, persistence
│   │   ├── bus.js          # Minimal pub/sub (on / off / emit)
│   │   └── logger/
│   │       ├── index.js    # State, console output, buffer, global capture (GP-####)
│   │       └── sanitize.js # JSON-safe details + error/cause serialization (pure)
│   ├── i18n/
│   │   ├── index.js        # configureLocale / t
│   │   ├── meta.js         # SUPPORTED_LOCALES, aliases, native names
│   │   └── locales/        # One file per locale + index.js registry
│   │       ├── index.js    # TRANSLATIONS map (en, ru, de, es, fr,
│   │       │               #   pt-BR, zh-CN, ja, ko, pl)
│   │       └── en.js ru.js de.js es.js fr.js pt-BR.js zh-CN.js ja.js ko.js pl.js
│   ├── gallery/
│   │   ├── sources.js      # Source registry (registerSource / listSources)
│   │   ├── collect.js      # Item collection: normalize, filter, de-duplicate, cap
│   │   ├── index.js        # Wiring: delegated click, cursor stylesheet, bus listener
│   │   └── sources/
│   │       └── markdown.js # Markdown images source (side-effect registration)
│   ├── features/
│   │   ├── logging/
│   │   │   └── index.js    # Applies logging.enabled to core/logger (boot + bus)
│   │   ├── settings/
│   │   │   ├── index.js    # Settings entry: user-menu row, pages
│   │   │   ├── userMenu.js # Settings row inside GitHub's user (avatar) menu
│   │   │   ├── panel.js    # Panel shell: grouped nav, search, pages, draft, Save/Reset/Cancel
│   │   │   ├── controls.js # Section / row / field / switch / select / input / button
│   │   │   ├── confirm.js  # Promise-based confirm dialog
│   │   │   └── tabs/
│   │   │       ├── general.js   # Interface language, notifications, diagnostics
│   │   │       ├── gallery.js   # Master switch, source switches, viewer behavior
│   │   │       ├── files.js     # File icons, ages, sizes, downloads, context menu, preview
│   │   │       ├── translate.js # Translation trigger, places, provider, cache
│   │   │       ├── backup.js    # Settings export (file/clipboard) + validated import
│   │   │       └── about.js     # Version, author, repository, license
│   │   ├── fileIcons/
│   │   │   ├── index.js    # Surface observers, injection, settings reaction
│   │   │   ├── surfaces.js # The places GitHub lists files + row readers
│   │   │   ├── match.js    # pickIcon(name, kind): filename → icon id (pure)
│   │   │   ├── inject.js   # renderIcon / placeIcon / clearIcons DOM primitives
│   │   │   └── iconSet.generated.js # Curated Material Icon Theme slice (generated)
│   │   ├── fileAges/
│   │   │   ├── index.js    # Surface observers, age injection, settings reaction
│   │   │   ├── surfaces.js # File rows that carry a last-commit date
│   │   │   ├── age.js      # ageBucket(datetime, now): date → 1–10 (pure)
│   │   │   └── inject.js   # paintAge / clearAges timestamp primitives
│   │   ├── fileMeta/
│   │   │   ├── index.js    # Surface observers, lazy size probes, settings reaction
│   │   │   ├── surfaces.js # File rows with a raw address
│   │   │   └── inject.js   # renderMeta / placeMeta / placeHead / clearMeta
│   │   ├── fileMenu/
│   │   │   ├── index.js    # Delegated contextmenu listener, actions, settings reaction
│   │   │   └── copy.js     # isCopyableContent(type, name): pure content check
│   │   ├── filePreview/
│   │   │   ├── index.js    # Surface observers, row buttons, open/close lifecycle
│   │   │   ├── surfaces.js # Listing rows, current ref, sibling set, hold targets
│   │   │   ├── inject.js   # renderPreviewButton / placeCell / placeHead / clearPreviewCells
│   │   │   ├── longPress.js# Delegated hold-on-a-file-link gesture
│   │   │   ├── holdRing.js # Transient hold-progress ring at the pointer
│   │   │   ├── kind.js     # previewKind(name, type), highlightLanguage, countLines (pure)
│   │   │   ├── links.js    # resolveMarkdownTarget(href, ctx, mode): relative → GitHub URL (pure)
│   │   │   ├── render.js   # loadPreview(file, { mode }): fetch + dispatch per kind
│   │   │   ├── markdown.js # marked + DOMPurify rendering and link rewriting
│   │   │   ├── highlight.js# highlight.js core + registered languages
│   │   │   ├── code.js     # Gutter + highlighted code block
│   │   │   └── cards.js    # Binary / empty / too-large / failure cards
│   │   ├── translate/
│   │   │   ├── index.js    # Lifecycle: observers, settle wait, auto queue, settings reaction
│   │   │   ├── surfaces.js # Surface registry: containers, roots, headers, preview pane
│   │   │   ├── state.js    # Per-container state, paint / reveal / restore / toggle
│   │   │   ├── blocks.js   # Block collection and tokenized extraction (DOM)
│   │   │   ├── tokens.js   # Private-use markers, escape/restore (pure)
│   │   │   ├── languages.js# Target languages and locale → code mapping (pure)
│   │   │   ├── api.js      # Batching, sentinel split, in-flight dedupe, fallback
│   │   │   ├── cache.js    # Persistent GM cache (TTL, size budget, stats, clear)
│   │   │   ├── inject.js   # Button, fallback bar, result box
│   │   │   ├── previewAction.js # Translate action for the quick preview header
│   │   │   └── providers/
│   │   │       ├── registry.js # Provider ids, fields, hints, defaults
│   │   │       ├── request.js  # GM_xmlhttpRequest / fetch transport
│   │   │       └── google.js deepl.js microsoft.js yandex.js openai.js libretranslate.js
│   │   └── commandPalette/
│   │       ├── index.js    # Lifecycle: hotkey, header entry, candidate assembly, loads, shell wiring
│   │       ├── context.js  # Page login/repo/ref and the effective identity (pure/DOM)
│   │       ├── rank.js     # parseQuery, scoreText, rankCandidates, markPinned (pure)
│   │       ├── search.js   # searchPalette: query → groups, the GitHub search fallback
│   │       ├── commands.js # Navigation, toggle and maintenance commands
│   │       ├── actions.js  # Action descriptors, runAction, navigate, searchUrl
│   │       ├── repos.js    # Repo normalization/merge, repoCandidates, ensureRepositories
│   │       ├── files.js    # Tree normalization, fileCandidates, ensureTree
│   │       ├── issues.js   # Open issues/PRs of the current repo: candidates, ensureIssues
│   │       ├── rowMenu.js  # Per-row action list for the palette context menu
│   │       ├── api.js      # GitHub REST client (ETags, pagination, rate limits)
│   │       ├── store.js    # Cache record, recents/pins, freshness, rate-limit state
│   │       ├── hotkey.js   # shortcutMatches, isEditableTarget, shouldOpenPalette
│   │       ├── detail.js   # Details pane content per row kind
│   │       └── format.js   # formatCount, relativeTime
│   ├── styles/
│   │   ├── tokens.css      # :root design tokens (--gp-* palette — DESIGN.md)
│   │   └── app.css         # Injected styles, gp- prefix (GM_addStyle via build)
│   ├── ui/
│   │   ├── icons.js        # 16×16 stroke SVG set (viewer toolbar, context-menu actions)
│   │   ├── headerActions.js# One registry for GitHub header entries (mount/sync/remove)
│   │   ├── toast.js        # Toast notifications (positions, dedup, actions)
│   │   ├── contextMenu.js  # Reusable fixed-position menu (items, keyboard, dismissal)
│   │   ├── filePreview.js  # Quick preview modal shell (header actions, footer, loading, keyboard)
│   │   ├── commandPalette.js # Palette shell: combobox, grouped listbox, details pane
│   │   └── viewer.js       # Fullscreen image viewer (zoom, pan, rotate, gallery)
│   └── utils/
│       ├── dom.js          # el, append, debounce, eachNode, toArray, escapeHtml, isOwnUi
│       ├── download.js     # File download (fetch → blob → <a download>)
│       ├── fileTarget.js   # rawUrlFor / fileTarget / resolveFileTarget (pure)
│       ├── http.js         # request(): status + headers, GM/fetch transport
│       ├── navigation.js   # watchNavigation (turbo/pjax/pushState URL watcher)
│       ├── scrollLock.js   # counted page scroll lock for modal overlays
│       ├── shortcut.js     # Shortcut parsing, matching and display (pure)
│       └── size.js         # formatSize(bytes): pure size formatting
├── scripts/
│   ├── lib/artifacts.mjs   # ARTIFACT_FILES list (single source of truth)
│   ├── build-file-icons.mjs# material-icon-theme → iconSet.generated.js
│   ├── copy-dist.mjs       # dist/ → root artifact copy
│   └── verify-artifacts.mjs# dist/ ↔ root byte-identity check
├── test/                   # Node test runner (match, age, fileMeta, fileMenu, filePreview,
│                           #   translate*, logger*, commandPalette* incl. issues/rowMenu/detail,
│                           #   headerActions, contextMenu, shortcut, locales, download)
├── dist/                   # Build output (gitignored)
├── github-plus.user.js     # Generated bundle (do not hand-edit)
├── github-plus.meta.js     # Generated metadata (do not hand-edit)
├── vite.config.js          # Build + ==UserScript== metadata
├── package.json            # Version source of truth
└── .github/workflows/ci.yml# Build + verify gate
```

## Module reference

### `src/main.js` — entry

`init()`: `initLoggingFeature()` → `configureLocale(getSettings().language)` →
`initSettingsFeature()` →
`initGalleryFeature()` + `applyGallerySettings()` → `initFileIconsFeature()` +
`applyFileIconsSettings()` → `initFileAgesFeature()` + `applyFileAgesSettings()`
→ `initFileMetaFeature()` + `applyFileMetaSettings()` → `initFileMenuFeature()`
+ `applyFileMenuSettings()` → `initFilePreviewFeature()` +
`applyFilePreviewSettings()` → `initTranslateFeature()` +
`applyTranslateSettings()` → `initCommandPaletteFeature()` +
`applyCommandPaletteSettings()` → `watchNavigation(resetOverlaysOnNavigation)`.

This project deliberately has **no global DOM scan loop and no
document-wide MutationObserver**: the gallery is CSS plus one delegated click
listener, and the file menu is one delegated `contextmenu` listener, so content
that GitHub renders after load behaves like server-rendered content with no
rescanning. The file-icons and translation features watch one observer per known
container or surface root (never the document); a surface whose selector stops
matching is a no-op, not a break. Only the header entries and the settings
user-menu row re-mount themselves: `ui/headerActions.js` owns the header
buttons (the palette entry registers with it), mounting them at the start of
GitHub's own action row and re-syncing the whole set when GitHub swaps the
header — the body's own children, an `<html>` observer for a replaced
body, a `childList` observer on the resolved header, a bounded poll and one
`watchNavigation`; `userMenu.js` re-adds the
avatar-menu row on every open through one observer on Primer's overlay portal
root (`#__primerPortalRoot__`), a container that holds overlays and nothing
else.

`resetOverlaysOnNavigation()` closes the viewer, the panel and the quick
preview when the URL changes. GitHub replaces `<body>` on soft navigation while the module state
lives on, so without this a "closed" viewer would keep reporting itself open
(and swallow `Escape`) and a pinned page would stay pinned. The context menu
is anchored to page coordinates, so `features/fileMenu` closes it through its
own `watchNavigation` hook instead. The command palette does the same: its
identity and repository list belong to the page that opened it, so
`features/commandPalette` closes it on navigation rather than leaving a stale
result set over the next page.

### `src/core/constants.js`

Single place for magic values.

- `SCRIPT_NAME`, `AUTHOR_NAME`, `AUTHOR_URL`, `REPO_URL`,
  `SETTINGS_KEY = 'gp_settings_v1'`.
- Gallery limits: `GALLERY_MAX_IMAGES` (500, sets are truncated),
  `GALLERY_MIN_SIZE_PX` (80 — an image smaller than this on *both* axes is
  chrome, not content), `ZOOM_OPTIONS` (2, 4, 6, 8, 12, 16),
  `GALLERY_MAX_ZOOM` (derived: the largest zoom option, used to clamp stored
  values), `GALLERY_DEFAULT_MAX_ZOOM` (8), `BADGE_HOSTS` (badge/status
  services), `IMAGE_EXTENSIONS` (extensions that count as a direct image file).
- Toasts: `TOAST_POSITIONS`, `TOAST_MAX_DURATION_MS` (120000).
- Diagnostics: `LOG_MAX_ENTRIES` (300, ring-buffer cap),
  `LOG_STRING_MAX_CHARS` (2000), `LOG_DETAIL_DEPTH` (4) and `LOG_MAX_ITEMS`
  (50 — array items and object keys per detail).
- File ages: `AGE_BUCKET_COUNT` (10 shades; the threshold table itself lives in
  `features/fileAges/age.js`).
- File menu: `FILE_COPY_MAX_BYTES` (1 MiB — the ceiling for "copy contents").
- File preview: `PREVIEW_TEXT_MAX_BYTES` (2 MiB), `PREVIEW_PDF_MAX_BYTES`
  (25 MiB), `PREVIEW_HIGHLIGHT_MAX_CHARS`, `PREVIEW_MAX_SIBLINGS` (cap on the
  sibling set collected from one directory), `PREVIEW_CACHE_ENTRIES` (rendered
  previews kept for the session), `PREVIEW_PDF_FRAME_TIMEOUT_MS` (how long a
  PDF frame may load before its fallback card shows), `PREVIEW_LONG_PRESS_MS`
  (450, the default hold time), `PREVIEW_LONG_PRESS_MIN_MS` / `_MAX_MS`
  (200…2000, the bounds a configured hold time is clamped to),
  `PREVIEW_RING_DELAY_MS` (150 — how long the progress ring waits before it
  appears; a short hold time shortens the wait so at least 80 ms of fill
  remains) and
  `PREVIEW_LONG_PRESS_MOVE_PX` (8 — movement past it is a drag, not a long
  press).
- Translation: `TRANSLATE_TARGET_LANGUAGES` (40 codes with native names and
  flags), `TRANSLATION_CACHE_KEY` (`gp_translation_cache_v1`),
  `TRANSLATE_CACHE_HOURS_MAX` (168), `TRANSLATE_CACHE_SOFT_LIMIT_BYTES`
  (512 KiB), `TRANSLATE_MAX_CONCURRENCY` (2 auto translations at once),
  `TRANSLATE_BATCH_MAX_SEGMENTS` (8) / `_MAX_CHARS` (4000),
  `TRANSLATE_MAX_BLOCKS` (300) / `_MAX_BLOCK_CHARS` (12000), and the surface
  observer timings `TRANSLATE_OBSERVE_DEBOUNCE_MS` (150), `TRANSLATE_SETTLE_MS`
  (250) × `TRANSLATE_SETTLE_TRIES` (20).
- Command palette: `COMMAND_PALETTE_SHORTCUTS` (`mod+k`, `mod+shift+k`,
  `alt+k`, `off` — the presets; a stored value may also be any combination
  recorded on the settings page, parsed by `utils/shortcut.js`), the three
  storage keys `gp_palette_cache_v1` /
  `gp_palette_recents_v1` / `gp_palette_pins_v1`,
  `COMMAND_PALETTE_CACHE_HOURS_MAX` (168) and
  `COMMAND_PALETTE_MAX_RESULTS_MIN` / `_MAX` (10…100). The issues source's
  pagination caps (`PER_PAGE` 100, 3 pages with a token, 1 without, 5
  repositories and 300 KB per record) live in `features/commandPalette/issues.js`.
- `DEFAULT_SETTINGS` (`language`, `logging`, `gallery`, `toasts`, `fileIcons`,
  `fileAges`, `fileMeta`, `fileMenu`, `filePreview`, `translate`,
  `commandPalette`) plus
  `getDefaults()`, which returns a deep clone — never mutate the shared
  constants. `DEFAULT_LOGGING` is `{ enabled: false }`; `DEFAULT_FILE_ICONS` is
  `{ enabled, folders, specialNames }`, `DEFAULT_FILE_AGES` is
  `{ enabled, folders }`, `DEFAULT_FILE_META` is `{ enabled, sizes, download }`,
  `DEFAULT_FILE_MENU` is `{ enabled }`, `DEFAULT_FILE_PREVIEW` is
  `{ enabled, rowButton, longPress, longPressMs, longPressRing }` and
  `DEFAULT_TRANSLATE` is `{ enabled, provider, providerConfig, targetLang, mode,
  display, reveal, linkLabels, surfaces, cacheHours }`;
  `DEFAULT_COMMAND_PALETTE` is `{ enabled, shortcut, token, sources, hideForks,
  hideArchived, showDetails, cacheHours, maxResults }`.

### `src/core/settings.js`

Module-level `settings` loaded once at import, normalizers per field,
`saveSettings(patch)` merges → normalizes → persists → returns the new state.
Public API: `loadSettings`, `getSettings`, `getLoggingSettings`, `getGallerySettings`,
`getFileIconsSettings`, `getFileAgesSettings`, `getFileMetaSettings`,
`getFileMenuSettings`, `getFilePreviewSettings`, `getTranslateSettings`,
`getCommandPaletteSettings`, `saveSettings`, `toExportableSettings`,
`normalizeImportedSettings`, `hasCustomSettings`.

Key facts that must survive refactors:

- `saveSettings()` does **not** notify features — the caller (settings UI)
  emits the matching bus event afterwards. Keep that separation: persistence in
  `core`, reactions in the UI/features via the bus.
- Every value is normalized on load and on save: locale whitelist, the
  `logging` boolean, booleans,
  toast positions from `TOAST_POSITIONS`, toast duration clamped to
  `TOAST_MAX_DURATION_MS`, zoom clamped to 2…`GALLERY_MAX_ZOOM`, source
  switches restricted to the keys present in the defaults (a source removed
  from the registry leaves no stale key), the `fileIcons` / `fileAges` /
  `fileMeta` / `fileMenu` / `filePreview` booleans, and the long-press time
  clamped to `PREVIEW_LONG_PRESS_MIN_MS`…`PREVIEW_LONG_PRESS_MAX_MS`. The
  `translate` section normalizes its enums (`mode`, `display`, `reveal`), the
  target-language whitelist, the provider id whitelist, the per-provider config
  record (only known provider keys, each field coerced to a string), the
  surface switches keyed by the defaults, and `cacheHours` clamped to
  0…`TRANSLATE_CACHE_HOURS_MAX`. Unknown values fall back to defaults, never
  crash.
- The `commandPalette` section normalizes the shortcut through
  `utils/shortcut.js` (a preset or any recorded combination; `off` disables the
  hotkey), the six source switches (`commands`, `repositories`, `starred`,
  `files`, `issues`, `recent`), the fork/archived/
  details booleans, `cacheHours` (0…`COMMAND_PALETTE_CACHE_HOURS_MAX`) and
  `maxResults` (10…100). The token is trimmed to 400 characters and **never
  leaves the browser**: `toExportableSettings()` blanks it for a backup and
  `normalizeImportedSettings()` blanks it on import, because a token pasted
  into a backup file is a leak.
- `normalizeImportedSettings(payload)` returns a normalized settings object or
  `null` (not an object) *without* persisting — the caller decides.
- GM storage is wrapped in try/catch — a userscript sandbox without storage
  must not break the page.

### `src/core/bus.js`

Minimal pub/sub: `on(event, fn)` (returns an unsubscribe fn), `off`,
`emit(event, payload)`. Listener exceptions are caught and logged with code
`GP-1001` — one bad listener never kills the others. Emitted events:

- `settings:gallery` — emitted by the panel footer Save (and by a backup
  import). The `gallery` feature listens and repaints its stylesheet.
- `settings:toasts` — emitted by the same Save; reserved for toast listeners.
- `settings:logging` — emitted by the same Save and by a backup import; the
  logging feature applies the switch to `core/logger` without a reload.
- `settings:language` — emitted by the same Save; the palette entry relabels
  itself and the settings user-menu row follows the new language, and the
  file-meta feature repaints its localized
  column label and download labels.
- `settings:fileIcons` — emitted by the same Save; the file-icons feature listens
  to attach or tear down its surface observers.
- `settings:fileAges` — emitted by the same Save; the file-ages feature listens
  to rescan its surfaces (the folder toggle needs a full repaint) and reattach
  its surface observers.
- `settings:fileMeta` — emitted by the same Save; the file-meta feature listens
  to tear down and repaint its size labels and download buttons, and to
  reattach its surface observers.
- `settings:fileMenu` — emitted by the same Save; the file-menu feature listens
  and attaches or removes its delegated `contextmenu` listener (and closes an
  open menu).
- `settings:filePreview` — emitted by the same Save; the file-preview feature
  listens to tear down and repaint its listing buttons and to reattach its
  surface observers, closing an open preview when disabled.
- `settings:translate` — emitted by the same Save; the translate feature tears
  every container down (painted text and chrome), then scans and re-attaches
  its observers when the feature is on, so a provider, target-language or mode
  change never leaves stale output.
- `settings:commandPalette` — emitted by the same Save and by a backup import;
  the command palette closes, forgets its session attempts, relabels or removes
  its header entry and reinstalls or
  removes its document hotkey. The settings page also writes palette data (a verified token) on its
  own, outside Save, because verification is an immediate network check.
- The same Save also emits `settings:language`, which the preview feature
  listens to for repainting its header, footer and card labels, and the
  translate feature for its button labels.

### `src/core/logger/` — diagnostics

Opt-in structured logging, silent until **Console logging** on the General
settings page is on (`logging.enabled`, off by default). While off, every
helper returns after one boolean check: no console call, no entry, no global
listener, no `window.__GP_LOG__`.

- `sanitize.js`: `sanitizeValue(value)` and `serializeError(error)` (pure)
  turn arbitrary details into JSON-safe data — strings truncate at
  `LOG_STRING_MAX_CHARS`, arrays and objects cap at `LOG_MAX_ITEMS`, nesting
  stops at `LOG_DETAIL_DEPTH`, DOM nodes become `tag#id.class` descriptors,
  cycles become `[Circular]`, throwing getters `[Unreadable]`; an Error keeps
  `name`, `message`, `stack` and up to two nested `cause` levels. Neither
  function throws.
- `index.js`: `Codes` (the `GP-####` registry), `configureLogger({ enabled })`,
  `isLoggingEnabled()`, `createLogger(module)`, `getLogEntries()`, `dumpLog()`,
  `clearLog()`, `copyLog()` and `isScriptFailure(text)`.
  `createLogger('file-icons')` returns frozen `error(code, message, details?)`,
  `warn(...)` and `info(message, details?)` helpers; the module name is part of
  every entry. An entry carries `seq`, `time`, `elapsedMs`, `level`, `code`
  (`null` for info), `module`, `message`, sanitized `details`, a parsed `error`
  and `repeats`. Consecutive identical entries bump `repeats` instead of
  printing again; the buffer holds `LOG_MAX_ENTRIES`.
- Enabling installs `error` and `unhandledrejection` listeners (capture) and
  publishes `window.__GP_LOG__` (`dump()`, `copy()`, `clear()`, and a live
  `entries` getter); disabling removes both and clears the buffer. Global
  failures are recorded only when `isScriptFailure()` finds `github-plus`,
  `github plus` or the `GM_info` script name in the decoded `filename`/stack,
  so GitHub's own errors and resource-load failures never enter the journal.
  `GP-9001` is an uncaught error, `GP-9002` an unhandled rejection.
- `copyLog()` resolves `{ ok, method }` (`clipboard`, `console` or `disabled`)
  and never rejects.
- `window.__GP_LOG__` lives in the context the script runs in; in a sandboxed
  manager, switch the devtools console context to the userscript to read it. No
  `unsafeWindow` grant is added.
- Codes in use: `GP-1001` bus listener, `GP-1002` settings persist, `GP-1003`
  settings load, `GP-1004` settings import, `GP-1101` gallery open, `GP-1102`
  gallery source, `GP-1103` gallery image load, `GP-1104` gallery download
  button, `GP-1201` UI mount, `GP-1301` file-icons surface, `GP-1302` file-ages
  surface, `GP-1303` file-meta surface, `GP-1401` file-menu action, `GP-1501`
  file-preview load, `GP-1601` translation run, `GP-1602` translation cache,
  `GP-1701` palette load/action, `GP-1702` palette cache, `GP-9001` uncaught
  error, `GP-9002` unhandled rejection. Rules: log once per
  user-visible failure at the outermost point; layers below only throw, they
  never log.

### `src/gallery/sources.js` — source registry

`registerSource(source)` (throws on a missing `id` or `collect`),
`listSources()`. A source is the only thing that knows where
images live:

| Field | Meaning |
|-------|---------|
| `id` | stable id, also the `gallery.sources.<id>` settings switch |
| `labelKey`, `hintKey` | i18n keys for the settings switch |
| `containerSelector` | one container = one gallery set |
| `cursorSelector` | selector(s) that get the zoom-in cursor while enabled |
| `collect(container)` | returns `[{ node, src, alt?, title?, href? }]` |
| `resolveFull(item)` | best full-size URL for an item, `''` when unknown |
| `match(node)` | optional container lookup override |

`src/gallery/sources/markdown.js` registers the `markdown` source by import
side effect (the gallery imports it). It covers GitHub's `.markdown-body`
containers and the markdown/image content rendered by the quick preview
(`.gp-preview__md` / `.gp-preview__content`), so the preview is one gallery
set too. Adding a source touches four places
together: the source module + its import, `DEFAULT_GALLERY.sources.<id>` in
`core/constants.js`, and the `source.<id>` / `source.<id>Desc` keys in **all
ten** locales. The settings panel builds its source switches from the registry,
so nothing else changes. A source missing from any of these is a bug.

### `src/gallery/collect.js`

`isBadgeUrl(url)`, `resolveContainer(source, node)`, `collectGallery(container,
source, settings)` → `[{ image, node }]`, `matchIndex(entries, node)`.

`collectGallery` is where every gallery rule lives: `data:` URLs are dropped,
GitHub emoji markup (`img.emoji`), `role="presentation"` images and
`data-gp-gallery="ignore"` nodes are always skipped; sets are de-duplicated by
URL and capped at `GALLERY_MAX_IMAGES`. Each entry's `image` is
`{ src, link, alt, title, fullSrc? }` — plain data, so the viewer never touches
page nodes.

With `skipBadges` on (the default), decoration is filtered out:

- `isBadgeUrl(url)` matches a `BADGE_HOSTS` host, a badge-only path
  (`/workflows/<file>/badge.svg` for Actions status badges, any `badge.<ext>`),
  or a proxied address that decodes to one of those — GitHub serves every
  external image through `camo.githubusercontent.com/<hash>/<hex url>`, so a
  shields.io badge hides behind a camo host and is judged by its decoded
  target. The item's `canonical` (from `data-canonical-src`) is checked too.
- An image whose rendered height is at most `GALLERY_BADGE_MAX_HEIGHT_PX` (40)
  is a badge/stripe whatever its width; the check only runs when the height is
  known, so a lazily loaded image is never guessed at.
- An image smaller than `GALLERY_MIN_SIZE_PX` on **both** axes is chrome.

Turning the setting off collects all of them again — the filter, not the
markup, is what keeps badges out.

### `src/gallery/index.js` — gallery wiring

- `applyGallerySettings()` installs the click and pointer listeners (once),
  repaints the injected stylesheet and hides the page download button.
- The stylesheet (`#gp-gallery-style`) is built from the registry: one
  `cursorSelector { cursor: zoom-in }` rule per enabled source and nothing
  else — page images keep GitHub's own look, so no border, outline or overlay
  is ever added to them. No enabled source means no stylesheet at all, so a
  disabled gallery leaves the page as stock GitHub. This is the *only* CSS that
  targets page markup, and it exists only while the feature is on.
- `onClick` is a capture-phase listener: it ignores modified clicks
  (Ctrl/Cmd/Shift/Alt), middle clicks and already-handled events, resolves the
  source + container, collects the set, and only then calls `preventDefault()`
  + `stopPropagation()` so GitHub's own delegated handlers never see the click.
  Everything runs against the live DOM at click time — there is no per-image
  state to invalidate.
- The page-level download button is one floating `.gp-download-btn` appended
  to `<body>`, driven by delegated `pointerover`/`pointerout` listeners. It is
  shown only while an eligible image is hovered — the same `locate` +
  `collectGallery` + `matchIndex` path as a click, gated by `gallery.enabled`
  and `gallery.download` — positioned over the image's top-right corner, and
  hidden on pointer-out, scroll, resize and navigation. It is never inserted
  into GitHub's markup, and `isOwnUi()` keeps the gallery from treating its
  click as an image click.
- `upgradeImage(item)` (used as the viewer's `resolveImage` hook) probes
  `item.fullSrc` and returns it only if it loads; failures fall back silently.

### `src/ui/viewer.js` — fullscreen image viewer

GitHub-themed lightbox (one instance per page): `openViewer({ images, index,
loop, thumbnails, download, minZoom, maxZoom, labels, resolveImage, onClose })` takes a
gallery of `{ src, link?, title?, alt?, fullSrc? }`, `closeViewer()` /
`isViewerOpen()` complete the API. The toolbar is built from the 16×16 stroke
glyphs in `ui/icons.js` (no text glyphs), and the stage supports zoom (wheel
around the pointer, `+`/`−`, double click, pinch), pan (drag at any zoom — the
offset is clamped so the image slides inside the stage but never leaves it),
90° rotation, a thumbnail strip with a broken-image fallback, prev/next with
optional wrap-around, preloading of the neighbouring images and a
danger-bordered status card when an image fails, with a link to the original.
The zoom pill shows the scale relative to the image's natural pixels and
clicking it jumps to actual size / back to fit; the scale can go below
fit-to-screen (down to a quarter of it), so an image can shrink below its own
size. The loaded image's pixel size appears next to the title. A `?` shortcut popover (also in the toolbar) lists
the keys, `Escape` closes it before the viewer, and `Tab` stays inside the open
viewer. The optional async `resolveImage(image, index)` hook lets the caller
upgrade the shown image to a higher resolution after the fact. The `open` tool
links to `item.link || item.src` in a new tab; the `download` tool saves the
shown image under its own filename through `utils/download.js`, and
`openViewer({ download: false })` hides it. The toolbar and its labels adapt to
the call's `labels`. Keyboard: `Esc`, `←`/`→`,
`Home`/`End`, `+`, `−`, `0`, `r`, `?`/`h`. The stage captures the pointer while
panning, so clicks inside it are resolved from the element that was pressed
(recorded on `pointerdown`) — never from `event.target`, which the capture
retargets to the stage — and any drag past `DRAG_THRESHOLD` never counts as a
click. Controls and links inside the stage are exempt from the capture, so the
nav arrows, the error link and the help card keep their own clicks. It locks
the page behind it with `utils/scrollLock.js`, restores focus on close and
renders all labels through `viewer.*` locale keys, overridable per call via
`labels`. Excluded from page interaction (`isOwnUi`).

### `src/ui/toast.js` — notifications

`showToast({ type, icon, title, message, duration, key, onClick, actions })`
(dedup by `key`, at most three on screen, hover-paused timers, optional
auto-hide progress bar). Honors `toasts.enabled`, `toasts.position` and
`toasts.duration` from settings at call time. Save, import and copy actions
report through it.

### `src/ui/headerActions.js` — GitHub header entries

`registerHeaderAction({ id, order, className, icon, label, onClick })` mounts
one button into GitHub's header and returns `{ node, update(patch), remove() }`;
`headerActionNode(id)` and `syncHeaderActions()` complete the API. `HEADER_TARGETS`
is ordered most to least specific (`[data-testid="top-nav-center"]`, the
header's breadcrumb/search container, then `.AppHeader-globalBar-end`,
`.AppHeader-globalBar`, `#user-links`). When none matches, the registry falls
back to the page's `header:not([data-marketing-header])` and uses the row
around the signed-in avatar (found through `img.avatar`, an avatar test id, the
profile link or a profile-labelled control), so a renamed header degrades to a
different container instead of no entries at all. Actions are kept in one
registry Map keyed by `id` and sorted by `order` (the palette is 10), and
always lead the container — inserted before GitHub's own first button, inside
an `li.gp-header-item` when the target is a `ul` — so our entry is the first
control there. Every button carries `.gp-header-btn` plus its registered class,
an icon `.gp-header-btn__icon` and the label as both `title` and `aria-label`,
so `isOwnUi()` has one root class to scan. The button is styled like GitHub's
own invisible header buttons: transparent fill and border, a muted 16px glyph,
and the hover fill. A sync applies labels and then writes DOM only when a host
is missing, detached, out of order or not leading the target — it never
re-creates placed buttons. The registry installs the
watchers once on the first registration — direct-children observers on `<html>`
and `<body>` for an app-shell swap, a `childList` observer on the resolved
header so a React re-render that drops a button is repaired, a bounded
poll (12 × 500 ms) for a header rendered late, and one `watchNavigation` — never
a document-wide observer. A page with no header target simply has no buttons
until one appears.

### `src/ui/contextMenu.js` — reusable menu

`openContextMenu({ x, y, anchor, keyboard, label, items, layer })`,
`closeContextMenu()` and `isContextMenuOpen()` for a fixed-position menu
appended to `<body>` (one instance at a time; opening replaces an open menu).
`layer: 'preview'` lifts the menu above the quick preview's overlay and
`layer: 'palette'` above the command palette (`elevated: true` is the older
name for the preview layer); the palette's row menu is the only `palette`
caller.
`items` is `[{ label, icon?, disabled?, onSelect }]` with a `null` entry as a
separator; `label` becomes the menu's `aria-label`, and the entries are plain
`button[role="menuitem"]` rows (icons are decorative). Pointer opens place the
menu at the click point, clamped to the viewport by an 8px edge; keyboard opens
(`keyboard: true`) place it under `anchor` and restore focus to that anchor on
close — pointer opens restore nothing. Keyboard inside the menu: arrows with
wrap-around, `Home`/`End`, `Escape` and `Tab` close. It is dismissed by an
outside `pointerdown`, any `scroll` (capture), `resize`, focus leaving the
menu and navigation (the file-menu feature calls `closeContextMenu` from its
`watchNavigation` hook; the palette closes it when the palette closes). The menu
renders only `gp-context-menu*` classes and
never touches page markup; `isOwnUi()` covers it.

### `src/features/logging/` — diagnostics lifecycle

`applyLoggingSettings()` hands `getLoggingSettings()` to `configureLogger()`;
`initLoggingFeature()` runs it first in `main.js` and subscribes to
`settings:logging`, so Save (and a backup import) turns logging on or off
without a reload. Nothing else in the feature layer touches the logger.

### `src/features/settings/` — panel

- `index.js`: registers the pages and the user-menu entry, and opens the panel
  from `GM_registerMenuCommand`. The settings panel has no header button of its
  own — the palette's header entry and its settings command are the other way
  in — so nothing here touches `ui/headerActions.js`. Every settings event and
  a language change repaint the user-menu row through `refreshUserMenuItem()`,
  so its label and its "settings differ from defaults" dot never go stale.
- `userMenu.js`: the second entry point, as a row in GitHub's user (avatar)
  menu next to GitHub's own "Settings" row. That menu is a Primer portal:
  React mounts it into `#__primerPortalRoot__` when it opens and unmounts it
  when it closes, whatever opened it and however long its lazy chunk took to
  arrive. `observePortalRoot()` therefore watches that one container
  (`{ childList: true, subtree: true }`, always in `main.js`'s "no document-wide
  observer" spirit: the container holds overlays only, and the callback returns
  immediately once the row is mounted), while `installUserMenuEntry()` keeps
  header clicks (capture, filtered to `.AppHeader, #user-links`) as a fallback
  that starts a bounded wait (20 × 100 ms) for a menu rendered elsewhere. Both
  paths call `ensureUserMenuItem()`, which is idempotent — a React re-render
  that drops the row puts it back. The row is matched through the overlay's
  `aria-labelledby="global-nav-user-menu-header"` hook, or — if GitHub renames
  it — through GitHub's own `a[href$="/settings/profile"]` item, and placed
  after that item, else before the last group divider. Clicking the row
  dispatches the `Escape` keydown the menu already closes on *before* opening
  the panel, so the panel's own `Escape` listener still sees a closed panel and
  ignores it. The row carries its own `gp-` classes (GitHub's hashed
  `ActionList` ones are never copied) and the "settings differ from
  defaults" dot while any setting is customized.
- `panel.js`: page registry (`registerPage`, each page carries a `group` of
  `preferences` or `more`), one modal overlay (`#gp-settings-panel`), rebuilt
  on every open (so labels follow the current language) and removed `CLOSE_MS`
  after close, once its exit animation has played. Text-only header with
  product name + `v` version chip (from `GM_info.script.version`) + subtitle,
  the settings search field and close; a grouped sidebar `nav` listing the
  registered pages (a horizontal tab strip on narrow screens; the open page is
  marked by its raised fill, pill, bold label and accent glyph); the body
  shows the open page under its icon well, title and description
  (`switchPanelPage`); sticky footer with the note + Reset / Cancel / Save.
  One page is always open — the first registered, then the last used.
  The header search indexes the rendered labels, hints and section headers of
  every page (pages never opened are rendered off-screen once on first
  search), matches every whitespace-separated term, groups results by page
  with the matched text highlighted, shows per-page counts in the sidebar and
  jumps to the chosen row with a temporary `.is-spotlit`. `/` or
  `Ctrl`/`Cmd`+`K` focuses the field, and `Escape` clears a non-empty query
  before it closes the panel. The footer note switches to `panel.unsaved`
  while the draft differs from the stored settings (`updateDirty()`, driven by
  `input`/`change` bubbling from the body). Pages render into the draft on
  open, and `getDraft()` is what they mutate; nothing is persisted until Save
  (`saveSettings` + `configureLocale` + every `settings:*` bus event). Cancel,
  the overlay click and `Escape` discard the draft. `applyExternalSettings(next)` is the path for settings that arrive
  from outside the panel (backup import): it persists, notifies and repaints.
  Scroll locking is the shared counted `utils/scrollLock.js`; `installPanelKeys()`
  ignores `Escape` while the viewer or the confirm dialog is open (both sit
  above the panel).
- `confirm.js`: promise-based `confirmDialog({ title, message, confirmLabel,
  cancelLabel, tone })` modal above the panel, used by the footer Reset.
- `controls.js`: reusable controls — `createSection` (title + hint card,
  optional header `action` and `withBody: false` for a header-only feature
  card), `createRow`, `createField`, `createHint`, `createSwitch`,
  `createSwitchRow`, `createSwitchCell` (grid cell; the cell is the `label` and
  the switch inside it is plain markup, never a nested `label`), `createSelect`,
  `createNumberInput`, `createTextarea`, `createButton`, `createShortcutRecorder`
  (a button that records a key combination through `utils/shortcut.js`;
  `Escape` is ignored, `Backspace`/`Delete` clears it), `getIconSvg`.
- `tabs/general.js`: interface language select (`auto` + `SUPPORTED_LOCALES`
  native names), toast switch, corner select, auto-hide seconds input, and the
  Diagnostics card (console-logging switch plus a **Copy log** button that
  follows the applied logger and reports the `copyLog()` outcome through a
  toast).
- `tabs/gallery.js`: gallery master switch in the section header, source grid
  from `listSources()`, badge filtering, full-size upgrade, thumbnail strip,
  wrap-around, zoom ceiling.
- `tabs/files.js`: the single page for every file-listing enhancement — one
  card per feature (file icons, file ages, file sizes and downloads, the
  context menu, the quick preview), each with its own master switch in the card
  header, its scope toggles and fields in the body, and the ten-shade age scale
  preview inside the ages card. The preview card carries the hold-time number
  input and the progress-circle switch (`icons.*`, `ages.*`, `files.*`,
  `fileMenu.*`, `preview.*` keys). The features stay independent, so the page
  has no switch of its own.
- `tabs/commandPalette.js`: activation (switch, preset select plus a
  `createShortcutRecorder` field revealed for **Custom**), GitHub
  access (password token field, **Check token**, **Remove token**, an
  identity-mismatch hint), the six source switches, fork/archived filters, the
  details-pane switch, and cache lifetime with a stats line and **Clear
  cache**. Verification is an immediate `GET /user`, so this page writes the
  cache record outside the draft; the token itself is saved only by the footer
  Save (`palette.*` keys).
- `tabs/backup.js`: export to file (`Blob` + `<a download>`) or clipboard,
  import from a textarea through `normalizeImportedSettings` +
  `applyExternalSettings`, with an inline invalid-payload message.
- `tabs/about.js`: product hero, version, author, repository, license.

### `src/features/fileIcons/` — colored file and folder icons

Replaces GitHub's single grey file/folder glyph with a colored, type-aware
icon. The feature is registry-driven; every surface degrades on its own.

- `iconSet.generated.js`: a curated slice of Material Icon Theme (MIT),
  produced by `scripts/build-file-icons.mjs` (`npm run icons:build`). It holds
  `ICON_BODIES` (SVG inner markup), `ICON_VIEWBOXES` (the coordinate system
  each body was authored in), `EXTENSIONS`, `FILE_NAMES`,
  `FOLDER_NAMES`, and the default file/folder ids. Committed, never hand-edited.
  The generator keeps a fixed id allowlist and drops decorative folder-name
  variants (`_rust`, `-rust`, `__rust__`), while keeping real hidden folders
  (`.github`, `.vscode`).
- `match.js`: `pickIcon(name, kind, { folders, specialNames })` — pure, no DOM.
  Folder names first (exact, case-insensitive), then well-known filenames, then
  the longest extension suffix (`a.spec.ts` → `spec.ts`, `ts`), else the
  default. Unit-tested by `test/match.test.js` under `npm test`.
- `surfaces.js`: the surfaces GitHub lists files on, each independent:
  `repo-tree` (`[data-testid="directory-content"]`, rows are the two
  `.react-directory-filename-column` cells, so both screen sizes are
  decorated), `file-header` (the filename heading of the code view, a sibling
  of the breadcrumb nav, on blob, tree and blame pages), `file-tree-pane` (the
  sidebar file tree, `#repos-file-tree`, rows are its `li[role="treeitem"]`
  entries, folders told apart by `aria-expanded` and GitHub's folder glyphs),
  `pr-file-header`, `diff-file-tree`, `commit-files`, `search-results`,
  `gist-files`, `release-assets`. A surface
  declares `containers` (selectors), `rows` (selector) and
  `resolve(row)` → `{ name, kind, nameNode, nativeIcon }` or null. A selector
  that stops matching after a GitHub redesign turns that surface into a no-op;
  it never affects the others.
- `inject.js`: `renderIcon(id)` builds `<svg class="gp-fi">` from the icon body;
  `placeIcon()` inserts it right before GitHub's icon (or the filename) and
  hides the native glyph with an inline `display: none !important` plus the
  `gp-fi-native` marker; `clearIcons()` removes every `.gp-fi` and restores
  every native icon. No stylesheet rule ever targets page markup, so the
  project's CSS invariant holds.
- `index.js`: one `MutationObserver` per surface container
  (`{ childList: true, subtree: true }`, processing debounced ~100 ms).
  `syncSurfaces()` attaches observers to containers that are currently present
  and prunes disconnected ones; it runs on boot, on `watchNavigation`, and from
  direct-children observers on `<html>` and `<body>` that notice an app-shell
  swap (`{ childList: true }`, no subtree — a replaced body leaves an observer
  on the old body dead, so the `<html>` one re-attaches it). GitHub mounts the
  file list *after* the navigation shell, so every navigation event can fire
  before the surface exists: `settleSurfaces()` retries the registry query on a
  bounded interval (20 × 250 ms, stopped as soon as a surface is present); a
  window that expires without one logs a single info line, so a page with no
  file listing is not re-reported on every retry. That bounded wait is not a
  scan loop. Rows are tracked in a `WeakMap`
  (row → injected icon plus the native glyph it hid) so a React re-render that
  drops the icon is decorated again, and a native glyph GitHub replaces in
  place — an expanded folder swaps its folder icon — is hidden again instead of
  showing up next to ours. `applyFileIconsSettings()` is the single entry
  point: enabled → sync plus settle when nothing is attached yet, disabled →
  disconnect every observer, remove our icons and restore the native ones.
  `settings:fileIcons` triggers it.

### `src/features/fileAges/` — blame-style ages for listed files

Tints the last-commit date of every file and folder in a repository listing,
mirroring the GitHub blame legend. The feature never inserts an element or
changes the date's text: it adds its own `gp-age-date` + `gp-age--N` classes to
GitHub's timestamp, so the relative wording and its accessibility stay exactly
as GitHub rendered them and removing the classes restores the original color.

- `age.js`: `ageBucket(datetime, now)` — pure, no DOM, unit-tested by
  `test/age.test.js`. Returns 1 (oldest) … `AGE_BUCKET_COUNT` (newest), or 0
  when the timestamp cannot be parsed. The bands are narrow near the present
  and widen toward the past (`AGE_THRESHOLDS_DAYS`: 3, 7, 14, 30, 60, 90, 120,
  240, 548 days), so a four-month-old file already reads as old while recent
  commits stay distinguishable.
- `surfaces.js`: file-listing rows that carry a timestamp. `repo-tree`
  (`.react-directory-commit-age` inside `[data-testid="directory-content"]`)
  and `classic-tree` (`.js-navigation-item` inside `.js-navigation-container`)
  are independent; `resolve(cell)` returns `{ cell, time, kind }`, reading
  `relative-time[datetime]` / `time[datetime]` / `time-ago[datetime]` and
  recognizing folders from GitHub's own `/tree/` links and directory glyphs.
- `inject.js`: `paintAge(time, bucket)` adds the feature classes to the
  timestamp; `clearAges()` removes them from every painted timestamp.
- `index.js`: one observer per surface container, same shapes, shell watchers
  and bounded settle wait as file icons. Rows are tracked in a `WeakMap`; a
  React re-render that drops the classes is repainted.
  `applyFileAgesSettings()` is the single entry point: it tears down first
  (which clears every timestamp and observer) and, when enabled, rescans every
  surface — required because turning the folder toggle off must also recolor
  folder rows already painted. `settings:fileAges` and `watchNavigation` trigger
  it.
- The palette lives in `src/styles/tokens.css` as `--gp-age-1` … `--gp-age-10`:
  the newest date is warm (GitHub's attention gold on light, `#ffd78d` on dark)
  and older dates fade to that theme's muted grey. A light and a dark ramp are
  selected through GitHub's own `data-color-mode` (and its `auto` media query),
  so the date text keeps a strong contrast in either theme. `app.css` styles
  only the classes this feature adds.

### `src/features/fileMeta/` — file sizes and downloads

Adds a size column to the repository file tree: every listing row gets a last
cell, file rows fill it with the size and a download button, and folder rows
keep it empty so the table's column count stays uniform. The size starts at
the column's left edge and the button is pushed to its right edge, following
GitHub's own icon buttons (28×28, 6px radius, 16px glyph, neutral fill on
hover). Our own header cell names the column
for assistive tech; GitHub collapses its listing header row to `font-size: 0`,
so the same is done to ours and no header band appears. GitHub's own cells are
never restyled or reordered, and the column is removed on teardown. The blob
page is deliberately not decorated: GitHub already shows a file's size and a
download button in its own file header, so adding ours would duplicate GitHub's
chrome.

- `formatSize` and `rawUrlFor` live in `utils/size.js` and `utils/fileTarget.js`
  and are shared with the file menu and the quick preview (see
  `src/utils/` below).
- `surfaces.js`: `repo-tree` (`tr.react-directory-row` inside
  `[data-testid="directory-content"]`, file links only), plus the `header`
  selector of the table header row and the `columnLabelKey` for its label.
  `resolve(row)` returns `{ name, rawUrl }` for a file row and `{}` for any
  other row, which still gets the empty cell.
- `inject.js`: `renderMeta` builds the cell's content (size label and/or
  download button), `placeCell` appends the new last cell with that content (or
  empty for a folder), `placeHead` names the column in the header row for
  assistive tech (idempotent; visually collapsed like GitHub's own header
  cells), `setMetaSize` fills a size that arrived later, and `clearMeta` removes
  every cell, strip and header label.
- `index.js`: one observer per surface container (same shapes, shell watchers
  and bounded settle wait as the other file features). Sizes are not in GitHub's
  tree markup, so a row's raw address is probed with a `HEAD` request; a shared
  `IntersectionObserver` defers the probe until the row is near the viewport, a
  queue caps concurrency at 4, and results are cached per raw address for the
  session. A failed probe leaves the size out. `applyFileMetaSettings()` tears
  down first (the two toggles repaint existing rows) and, when enabled with at
  least one toggle on, syncs the surfaces. `settings:fileMeta`,
  `settings:language` and `watchNavigation` trigger it. The column follows
  GitHub's own breakpoints: the full cell is shown from 1012px, the button-only
  compact cell between 768 and 1012 (the listing shares its width with the
  repository sidebar there), and the column is hidden below 768.
- Download goes through `utils/download.js` (`downloadFile`): bytes → object
  URL → `<a download>` under the file's own name; the same-origin raw route
  carries the session for private repositories, and a blocked fetch falls back
  to a new tab.

### `src/features/fileMenu/` — file context menu

Right-clicking a file in the repository listing, in the sidebar file tree, on
a blob or blame page, or on a file link in rendered markdown opens the
project's own menu instead of the browser's:
open, open in a new tab, download, copy contents, copy link, copy path. One
delegated capture-phase `contextmenu` listener on the document — the same shape
as the gallery's click listener, with no per-row state to invalidate — and the
native menu is replaced **only** when the click resolves to a file. Folders,
submodules, images, media and foreign links keep the browser menu.

- `utils/fileTarget.js` supplies `resolveFileTarget(node)` (see `src/utils/`
  below) for every surface, plus `fileTarget` for the download address and
  path.
- `copy.js`: `isCopyableContent(contentType, name)` (pure) — a known content
  type decides; an empty type falls back to a textual extension or a
  well-known name (`Dockerfile`, `Makefile`, …). Binary types win over a
  textual extension.
- `utils/fileTarget.js`: `resolveFileTarget(node)` → `{ name, href, rawUrl,
  relative, source, anchor }` or `null`. `listing` reads the row's
  `a[href*="/blob/"]` inside `[data-testid="directory-content"]`; `tree` reads a
  file row of the sidebar file tree (`li[role="treeitem"]` in
  `#repos-file-tree`, path from the row's `-item` id, blob address rebuilt from
  the page's repo and the current ref); `markdown` reads a file link inside a
  `.markdown-body` container or the preview's `.gp-preview__md` — the only
  surface that resolves a *link* rather than the page it sits on, with
  hash-only, query-only, media and foreign-host links skipped; `blob` applies
  only when the path is a blob or blame view and
  the node sits inside GitHub's file content (breadcrumbs and the filename
  heading, code area, `.markdown-body`), skipping native media and foreign
  links but allowing the file's own header link.
  `anchor` is the row link, the markdown link or the breadcrumb filename, used
  for keyboard opens. A tree row for the file already open is reported as
  `blob`, so it offers no redundant **Open**.
- `index.js`: `buildItems()` builds the action list through `ui/contextMenu.js`
  and `ACTION_ICONS`; open is omitted when the file is the page itself (already
  there), download uses `utils/download.js`, copy contents fetches the
  same-origin raw address
  (declared `content-length` and blob size checked against
  `FILE_COPY_MAX_BYTES`, then `isCopyableContent`), and every clipboard write
  reports through `ui/toast.js` — success and the three refusals (too large,
  not text, clipboard failure) each have their own localized message.
  `applyFileMenuSettings()` installs or removes the listener (closing an open
  menu on removal), `initFileMenuFeature()` also closes the menu on
  `watchNavigation` and subscribes to `settings:fileMenu`. A failed action logs
  `GP-1401` once and shows an error toast.
- The first menu entry is **Preview** (`ACTION_ICONS.eye`) when the preview
  feature is on; it calls `openPreviewForTarget(target)` from
  `features/filePreview` — the one-way `fileMenu → filePreview` import.

### `src/features/filePreview/` — quick file preview

Opens a file in a modal without leaving the page, from the eye button in a
repository listing row, from **Preview** in the file context menu, or by
holding the left mouse button on a file name. The files of the current
directory form one set, so the footer's previous/next buttons and the arrow
keys move between siblings.

- `kind.js`: `previewKind(name, contentType = '')` (pure) — `'markdown'`,
  `'image'`, `'video'`, `'audio'`, `'pdf'`, `'code'` or `'binary'`. The
  extension decides first (compound extensions included), the content type is
  the fallback; `highlightLanguage(name)` maps a filename to a highlight.js
  language, `countLines(text)` feeds the footer's line count.
- `links.js`: `resolveMarkdownTarget(href, ctx, mode)` (pure) — a relative
  link or image inside rendered markdown becomes a same-origin
  `/owner/repo/(raw|blob)/<ref>/<path>` address, so a private README keeps its
  images. Fragments, bare schemes and root-absolute paths are left alone;
  `.`/`..` are normalized and each segment encoded.
- `markdown.js`: `renderMarkdown(text, context)` runs `marked` (GFM) and
  sanitizes the result with DOMPurify (created lazily against the page window;
  `style`, `form` and form controls are forbidden tags — DOMPurify keeps
  `<style>` by default, which would let repository markdown restyle the page),
  then rewrites relative links and images through `links.js`, marks external
  links `target="_blank" rel="noopener noreferrer"`, sets `loading="lazy"` and
  `referrerpolicy="no-referrer"` on images, and highlights fenced code.
- `highlight.js`: the highlight.js core plus its registered language modules;
  `highlightHtml(text, language)` returns `''` for an unknown language or text
  over `PREVIEW_HIGHLIGHT_MAX_CHARS`, so a huge file renders as plain text.
- `code.js`: `renderCode(text, language)` — a line-number gutter beside a
  `<pre><code>`; highlighted innerHTML, else plain `textContent`.
- `cards.js`: `renderBinaryCard`, `renderEmptyCard`, `renderTooLargeCard`,
  `renderFailureCard` — an honest card with **Open on GitHub** and **Download**
  instead of a broken frame.
- `render.js`: `loadPreview(file, { mode, signal })` fetches the same-origin raw
  address and dispatches on `previewKind`; text and markdown are gated by
  `PREVIEW_TEXT_MAX_BYTES`, PDFs by `PREVIEW_PDF_MAX_BYTES`. A PDF blob is
  rebuilt with the `application/pdf` type (the raw route may answer
  `application/octet-stream`, which the browser will not hand to its viewer),
  and its frame falls back to a failure card when a `frame-src` CSP violation
  names the blob or the frame does not load within
  `PREVIEW_PDF_FRAME_TIMEOUT_MS` — github.com's CSP does not allow `blob:`
  frames. A media element that fires `error` (an unsupported codec, a blocked
  request) is replaced by the binary card. Results are cached only when they
  carry no `dispose` (so a revoked object URL is never re-shown). A failure
  logs `GP-1501` and returns a failure card; an `AbortError` is rethrown for
  the caller's staleness check.
- `surfaces.js`: `PREVIEW_SURFACE` (rows `tr.react-directory-row` inside
  `[data-testid="directory-content"]`, header `table thead tr`, column label
  `preview.column`), `currentRef()`, `siblingsForRow(row)` (capped at
  `PREVIEW_MAX_SIBLINGS`; returns null when the clicked row is past the cap),
  `resolvePreviewRow(row)` and `resolvePreviewLink(node)` (the file behind a
  node inside the row's name link or a file link in rendered markdown, plus
  that link and its `source` — null for folders, other columns and links that
  point at no file).
- `longPress.js`: `installLongPress(handler)` / `uninstallLongPress()` — one
  delegated capture-phase `pointerdown` listener on the document, the same
  shape as the gallery and the file menu. A left-button press on a listing file
  name or a rendered markdown file link (including a file link in the preview's
  own markdown) starts a timer for the configured
  `filePreview.longPressMs` (default `PREVIEW_LONG_PRESS_MS`); moving past
  `PREVIEW_LONG_PRESS_MOVE_PX`, releasing, `pointercancel` or a touch pointer
  cancels it and hides the ring, so a drag, a text selection and a plain click
  keep their normal behavior. With `filePreview.longPressRing` on, the ring
  appears after a short beat (`PREVIEW_RING_DELAY_MS`, so a plain click never
  flashes it) and its fill runs over the remaining time. When the timer fires
  the
  handler opens the preview with that link as the anchor (for a listing row the
  whole directory becomes the set; a markdown link opens one file), and the
  following `click` on the link is swallowed once — otherwise the browser would
  also navigate to the file.
- `holdRing.js`: `mountHoldRing()`, `showHoldRing(x, y, durationMs)` /
  `hideHoldRing()` — a `.gp-hold-ring` disc at the pointer whose accent arc
  fills over the hold time through one CSS animation (`--gp-hold-duration` set
  inline, like the toast's progress duration). The host is mounted once by
  `applyFilePreviewSettings()` **before** `observeShell()` attaches a body
  observer, and showing/hiding only flips `hidden`: a new direct child of
  `<body>` would read as an app-shell swap and the re-apply would tear the
  long-press listener down mid-gesture. A hidden element cancels its animation,
  so the next show restarts the fill. It is `pointer-events: none` and listed
  in `isOwnUi()`.
- `inject.js`: `renderPreviewButton` (28×28 eye, `preventDefault` +
  `stopPropagation`), `placeCell` (an empty cell for a folder row, so every row
  keeps the column count), `placeHead` (a visually collapsed header label like
  file meta's, written only when its text actually changes — a blind
  `textContent` assignment would fire the container observer and restart its
  debounced rescan forever) and `clearPreviewCells`.
- `index.js`: one observer per surface container, the same shell watchers and
  bounded settle wait as the other file features; rows are tracked in a
  `WeakMap`. `visibleSettings()` is `enabled && rowButton`; the long press is
  independent of it, so it keeps working with the eye column off.
  `openPreviewForTarget(target)` builds a single-file set or the listing's
  sibling set and calls `openFilePreview`. `applyFilePreviewSettings()` tears
  down first, installs the long-press listener when its toggle is on, then
  syncs and settles the surfaces; `settings:filePreview`, `settings:language`
  and `watchNavigation` trigger it, and navigation closes an open preview.
- `ui/filePreview.js`: the modal shell — `openFilePreview({ files, index,
  load, headerActions = [] })`, `closeFilePreview()`, `isFilePreviewOpen()`.
  Header with the file name, a preview/source segmented control for Markdown,
  an `.gp-preview__extra` row for caller-supplied header actions (the translate
  feature's button, offered only while the file resolves to rendered markdown
  and the preview mode is on), and the tools (open on
  GitHub, copy contents/link/path through an elevated `ui/contextMenu.js`,
  download through `utils/download.js`); body with a spinner, the rendered
  result and a `@`-style meta line; footer with the position and prev/next. A
  stale load is dropped by an abort controller plus a request token, `Escape`
  and the focus trap are handled only outside the content pane (so links inside
  stay usable), all shell keys are ignored while the copy menu is open, and
  every shell key is ignored while the image viewer is open above it (one
  `Escape` must not close both overlays). It takes the shared scroll lock and
  closes with a 160 ms exit animation. The
  shell never imports a feature; `features/filePreview/index.js` passes the
  translate action in when that surface is on.

### `src/features/translate/` — on-page translation

Translates markdown bodies (READMEs, issues, pull requests, discussions,
releases, wikis, comments), commit messages, issue/PR titles and the quick
preview's rendered markdown. Translation is block-level: every text block keeps
its inline markup through private-use tokens, so links, images, inline code and
task-list checkboxes survive the round trip. The feature is off in the sense
that nothing is sent anywhere until the user presses **Translate** — the
default `mode` is `button`; `auto` is opt-in.

- `surfaces.js`: the registry of places translation happens, each independent
  like a gallery source: `markdown` (`.markdown-body` outside the preview),
  `plaintext` (`.react-code-lines` files with `.react-file-line.html-div`
  lines — licenses and notices GitHub renders as plain text; marked `plain: true`,
  and skipped for syntax-highlighted code), `commits`
  (`[data-testid="commit-message"]`, `.commit-title`, `.commit-desc`), `titles`
  (issue/PR title elements) and `preview`
  (`.gp-preview-overlay .gp-preview__md`). A surface declares `containers`,
  observation `roots`, `headerFor(container)` (the row that should host the
  button: GitHub's comment action row — the inner flex row of
  `.timeline-comment-actions` (the wrapper itself would stack the button above
  its kebab and reply controls), the `[data-testid="comment-header-actions"]`
  row, or the new shell's `[class*="ActionsButtonsContainer"]` row in a comment
  header — the
  file/release header (the blob view uses its
  `[class*="react-blob-header-edit-and-raw-actions"]:not([class*="-combined"])`
  row of Raw/copy/download/edit actions), or
  the repository README's `readmeHeaderSlot`, the new issue/PR page's own
  actions row (`[data-component="PH_Actions"]`, where GitHub's copy-link icon
  button lives), or the description card's compact icon actions row
  (`[class*="actionsSection"]` inside `[data-testid="issue-body"]`, beside the
  kebab menu) — both remembered in a second `WeakMap` with their icon-button
  size so `iconActionSize()` can give the action the icon-only shape (32px in
  the page header, 28px in the description header); a page whose markup has no
  comment classes is resolved through the description's edit block
  (`[class*="editMetadata"]`, the row holding "Edited" and the edit pencil) or
  the edit control nearest the container (including
  `button[data-dd-action-name*=".edit"]`), and a header found that way is
  remembered in a `WeakSet` so `isActionRow()`
  can tell a real action row from a page header that merely contains an Edit
  link) or null for the fallback bar) and `skip(node)`. A
  `plain` surface can only be displayed below its source, never replace it. The
  preview surface can never be auto-translated (`roots: []`); its action lives
  in the preview header. `findContainers` returns live containers in document
  order and keeps only the outermost of any nested matches (GitHub nests one
  `.markdown-body` inside another on an issue/PR description, so decorating
  both would stack two controls over one body);
  `surfaceForContainer`, `previewSurface`, `previewContainer`, `enabledSurfaces`
  and `surfaceRoots` are the rest of the API.
- `blocks.js`: `collectBlocks(container)` walks to the leaf text blocks
  (`h1–h6`, `p`, `li`, `dt`, `dd`, `td`, `th`, `blockquote`, `figcaption`,
  `caption`, `summary`), skipping `pre`, code, our own UI and GitHub's heading
  anchors. A block that contains another candidate recurses instead of being
  collected; a list item that only wraps a nested list is still collected, and
  its nested lists are excluded from its own content. A surface container with
  no descendant candidates (an issue title, a commit message) is collected as
  the block itself. `extractBlock(block)` turns a block into
  `{ source, tokens, bold, italic }` — text nodes plus a token per `a`, `code`,
  `kbd`, `samp`, `img`, `picture`, `svg`, `br`, `input`, `hr`, `video`, `audio`
  (the element's `outerHTML` is recorded; an anchor's label is wrapped in the
  label markers at the exact text-node range, never located by substring),
  `null` when there is nothing to translate or the block exceeds
  `TRANSLATE_MAX_BLOCK_CHARS`. Inline emphasis is inlined per the design;
  `renderBlockResult` reassembles the translated block, escaping the provider
  text and restoring the tokens (the report carries `missing`/`duplicated`).
  For a plain-text container the block's `.react-file-line` elements are joined
  with their line breaks (`plainTextSource`), so a license keeps its paragraph
  structure and the extracted source carries no inline tokens.
- `tokens.js`: pure marker code. `TOKEN_START`/`TOKEN_END`
  (U+E000/U+E001) wrap an inline-element index; `SEGMENT_START`/`SEGMENT_END`
  (U+E100/U+E101) mark batch segments; `LABEL_START`/`LABEL_END`
  (U+E200/U+E201) wrap an anchor's visible label. `restoreTokens(translated,
  tokens, labels)` returns `{ html, missing, duplicated }`: missing tokens are
  appended in order, duplicates render once, unknown ids stay escaped text.
  `stripTokens` removes page text that would collide with any marker;
  `stripSegmentMarkers` removes sentinels only, so inline tokens reach the
  provider. `hasLetters` gates blocks with no letters.
- `languages.js`: `TRANSLATE_TARGET_LANGUAGES` presentation,
  `resolveTargetLang(preference, locale)` (`auto` maps the UI locale, else
  English) and `targetLanguageLabel(code)` for the picker.
- `providers/registry.js`: the ordered provider list — `google` (default, free,
  keyless), `deepl`, `microsoft`, `yandex`, `openai` (OpenAI-compatible),
  `libretranslate` — each with a name, a `hintKey` and field definitions that
  drive both the settings form and the config whitelist; `missingProviderFields`
  reports the `required` fields with no value. `providers/request.js`
  is the transport (`GM_xmlhttpRequest` when present, `fetch` otherwise, 20 s
  timeout). Each provider module parses its own response shape and maps the
  canonical target code; failures throw, the layers above decide.
- `api.js`: `buildBatches(segments)` joins up to 8 segments / 4000 characters
  with a sentinel before each segment's text; inline tokens are preserved.
  `splitBatchResponse` requires the sentinels exactly once and in order, else
  the batch is rejected; `translateSegments(segments, target, { translate,
  onResult, onProgress })` serves cache hits first, translates batch by batch,
  retries a failed split per segment, dedupes identical in-flight requests and
  writes results to the cache when no `translate` override is injected. A
  401/403/429 fails the whole batch without per-segment retries, and three
  consecutive all-failed batches stop the remaining requests. `onResult`/`onProgress`
  fire per settled segment, cached ones included.
- `cache.js`: the persistent cache under `TRANSLATION_CACHE_KEY`. Keys are
  `provider|target|FNV-1a(text)|length`, entries carry `{ text, detected, at }`,
  and reads honor the TTL from `translate.cacheHours`. Writes are debounced
  (400 ms) and flushed on `pagehide`; the store is pruned by TTL and evicted
  oldest-first past `TRANSLATE_CACHE_SOFT_LIMIT_BYTES`. `clearCache`,
  `getCacheUsageStats` and `persistCacheNow` complete the API. Storage failures
  log `GP-1602`, never throw.
- `inject.js`: `createButton(label)` (glyph + progress ring + label span),
  `setButtonState` (`data-gp-translate-state`, `aria-busy`, and the ring inside
  the button filled from a 0…1 `progress`; nothing is printed as a count, and
  a ring with nothing settled yet turns as a loader),
  `ensureChrome(container, { header, button })` (the button goes into the page
  header when there is one — prepended into GitHub's own action row so it sits
  beside the edit control and marked `.gp-translate-btn--actions`, taking the
  `.gp-translate-btn--header` look inside the repository README slot and the
  compact `.gp-translate-btn--small` shape (28px, 12px label) inside the new
  shell's `editMetadata` block, comment `ActionsButtonsContainer` row and the
  blob file header actions row, and the bare-icon
  `.gp-translate-btn--icon` shape (label visually hidden) in the page header's
  actions row of an issue or pull request title (32px) and in the description
  card's header (28px, prepended before the kebab menu), and
  creating no bar: `ensureChrome` returns `{ button, bar: null }` — otherwise
  into our own `.gp-translate-bar` before the container), `createResultBox(html, { preformatted })` (a `plain` surface's box
  keeps the source line breaks) and `removeChrome`.
- `state.js`: the per-container state machine (`idle`, `loading`, `shown`,
  `partial`, `error`) keyed by container in a `Map`. `ensureContainer` decorates
  a container (returns the existing state when the content signature is
  unchanged, re-inserting a control a React re-render dropped from its header),
  `runContainer` translates every block (missing-config preflight
  before any request, button states, partial-failure handling,
  unchanged-response detection, `GP-1601` and a toast on total failure). No
  status text is attached to the button at all — no status line beside it and
  no `title` tooltip: the button label, its filled ring and its state carry the
  outcome, and failures report through a toast. The fallback bar holds only the
  button. Translation progress is never text: `onProgress` fills the button's
  ring with the settled share, so a header-hosted action and a bar-hosted one
  report it the same way. A block
  whose provider response lost more than half
  of its inline tokens is left untouched and counts as failed, so markup is
  never piled up at the end. `toggleContainer` restores the exact original HTML
  or starts a run, and is the only caller that focuses the button, so auto mode
  never steals focus. A `plain` surface is always painted `below`: its container
  is a code view, so rewriting its lines would destroy the layout.
  `teardownContainer`/`teardownAllContainers` restore and
  remove chrome, and `pruneDetached` runs the same teardown on a container that
  left the DOM — dropping the state alone would leave its button stacked in a
  page header shared with the next file. A click on a button whose container
  has already left the DOM is rebound (`activate` → `rebindContainer`) to the
  live container under the same header, so a header that survives navigation
  never translates detached content. `runId` makes an in-flight response
  stale after a teardown.
  Painted blocks keep their original `innerHTML`; a list item keeps its nested
  lists. `reveal: hover` shows the source while the pointer or focus is inside
  the container and repaints on leave. A caller-supplied button (the preview
  action) is not bound by `ensureContainer` — its owner toggles instead.
- `index.js`: the lifecycle. `scanTranslateSurfaces()` prunes containers that
  left the DOM (which removes their chrome from a shared page header) and
  decorates live containers; one `MutationObserver` per enabled surface root
  (debounced, pruned and reattached by `syncObservers`) plus the bounded settle
  wait (`TRANSLATE_SETTLE_MS` × `TRANSLATE_SETTLE_TRIES`, stopped as soon as a
  page surface is decorated — a preview action does not count) catch late
  mounts. Navigation forces a short settle pass that re-syncs the observers and
  rescans a few times, so chrome left by the previous page disappears even when
  the next page has nothing translatable.
  Direct-children watchers on `<html>` and `<body>` rescan after an app-shell
  swap, since a replaced body leaves the root observers dead;
  `applyTranslateSettings()` tears everything down and reapplies. In `auto` mode
  one shared `IntersectionObserver` queues visible containers through a
  concurrency-2 queue. `initTranslateFeature()` subscribes
  to `settings:translate` and `settings:language`, re-applies on navigation and
  flushes the cache on `pagehide`.
- `previewAction.js`: `isPreviewTranslationEnabled()` (`enabled &&
  surfaces.preview`) and `createPreviewTranslateAction()` — a button that
  resolves the live `.gp-preview__md` at click time and toggles its state.
  `features/filePreview/index.js` passes it as the shell's `headerActions`; this
  is the only `filePreview → translate` import.

The block walk intentionally excludes markdown inside `.gp-preview-overlay` from
`isOwnUi()` (that pane is page content), while the feature's own button, bar and
result boxes are skipped. No rule in `app.css` selects GitHub's markup for the
feature: the button, bar and result box are our own nodes with `gp-`
classes.

### `src/features/commandPalette/` — command palette

A modal search surface on `Ctrl/⌘+K` (a preset or any recorded combination, or
off), opened from that hotkey, the palette button in the GitHub header or the
manager's menu: the user's repositories, starred repositories, the current
repository's open issues and pull requests, its files, GitHub pages, GitHub
Plus controls and a GitHub search fallback, with favorites (pins), recents, a
per-row context menu and an optional details pane. Without a token it reads
public data and commands still work; with a verified token it also sees private
repositories.

- `index.js` — the only module that assembles display state: reads
  `readPaletteState()`, builds candidates through `commandCandidates`,
  `repoCandidates`, `fileCandidates`, `issueCandidates` and
  `snapshotCandidates`, opens `ui/commandPalette.js`, installs the document
  hotkey, registers the header entry through `ui/headerActions.js` (`order: 10`,
  label `t('palette.title')` plus the current shortcut) and owns the load
  lifecycle. `kickLoads()` starts `ensureRepositories()`, `ensureTree()` and
  `ensureIssues()` without awaiting them, flips `state.status` to `loading` and
  refreshes the shell over the cached rows; each load settles into
  `refreshView()`. Every source is attempted once per page session
  (`sessionRefreshes`, trees keyed by `tree:<repo@ref>`, issues by
  `issues:<repo>`), a manual refresh bypasses that, and an idle-time refresh
  runs only when the cache is warm and stale. `openPalette` wires `onPin`,
  `onContextMenu` (a `layer: 'palette'` menu built by `rowMenu.js`) and
  `renderDetail`; `handleRowAction` maps every row action to `onSelect`,
  `onPin` or a copy `runAction`. The palette rebuilds candidates from storage on
  every open, so a settings change or a manual refresh never needs a stale
  in-memory list.
- `store.js` — all persistence. Cache record
  `{ version, login, tokenLogin, tokenFingerprint, sources, trees, issues,
  rateLimit }` under `gp_palette_cache_v1`; `readPaletteState()` returns the page
  context, settings, identity and the cache **only when the record belongs to
  that identity**, so switching accounts can never render another account's
  data.
  Recents (`gp_palette_recents_v1`, cap 20) and pins — the favorites
  (`gp_palette_pins_v1`, cap 50) — are stored per identity; another identity's
  non-command entries are hidden while commands survive. `isFresh()` honors
  `cacheHours` (0 disables), `rateLimitFromHeaders()`/`isRateBlocked()` guard
  exhausted limits, `clearDataCache()` keeps the identity fields. Every storage
  call is try/catch and logs `GP-1702`.
- `api.js` — GitHub REST with `utils/http.js`: `GET /user` for verification,
  `/user/repos` or `/users/{login}/repos`, `/user/starred`,
  `/repos/{owner}/{repo}/issues?state=open&sort=updated&direction=desc` and the
  recursive `git/trees/{ref}`. Sends `Accept`, `X-GitHub-Api-Version`,
  `Authorization: Bearer` when a token exists and `If-None-Match` for every
  cached page; a `304` reuses the cached page, a `200` replaces it with its new
  ETag.
  Pagination stops at a page shorter than 100 items (10 pages with a token, 2
  without); the starred source retries once without `star+json` after a 415/404
  on its first page. Non-2xx responses throw an error carrying `status`,
  `headers` and `rateLimit`; the API layer never logs.
- `repos.js` — `normalizeRepo`, `mergeRepoSources` (owned repos first, starred
  flag, starred-only second), `repoCandidates` (source toggles, fork/archived
  filters, rank fields, sort key from push or star time) and
  `ensureRepositories` (single-flight, both sources in `Promise.allSettled`,
  each successful source committed on its own, records trimmed to 1000 items,
  `GP-1701` once per failed source and never with a token). At write time it
  re-reads the record so a tree written by a parallel load survives.
- `files.js` — `treeKey`, `normalizeTree` (blobs and trees only),
  `fileCandidates` (path-sorted rows with encoded GitHub URLs and
  `formatSize`) and `ensureTree` (single-flight per tree + token fingerprint,
  ETag revalidation, 20 000-item cap, disk records capped to the three newest
  and 1.5 MB each, oversized records kept in a session map, `GP-1701` on a real
  failure only).
- `issues.js` — `normalizeIssue` (the cached shape: number, title, url, author,
  updatedAt, kindLabel `issue`/`pullRequest` from GitHub's `pull_request` field,
  comments, repo), `issueCandidates` (source toggle, the page's repository,
  group `issues`, `#N Title`, an issue or pull-request icon and badge, rank
  fields for title, `#N` and author, data with the URL, author, update time,
  comments and `state: 'open'`), `ensureIssues` (identity guard, single-flight
  per repo + token fingerprint, ETag revalidation, 3 pages with a token and 1
  without, `GP-1701` on a real failure) and `forgetIssues`. The record is capped
  at 5 repositories and 300 KB and its write re-reads the disk record so
  repository and tree loads survive.
- `rowMenu.js` — pure: `rowMenuItems(item, { labels, onAction, pinned })` and
  `cloneAddress(item)`. Repos offer open, new tab, copy link, copy clone
  address, pin; files open, new tab, copy path, copy link, pin; issues open,
  new tab, copy link, copy number, pin; commands run and pin. A `null` entry is
  the separator.
- `context.js` — `readContext()` for the login, repository and ref (embedded
  React payload first, then URL, then the default-branch meta, then `HEAD`),
  `tokenFingerprint()` (FNV-1a, never the token) and `resolveIdentity()`: a
  token account wins, but only once verified; a page login carries the
  anonymous path; an unverified token yields no identity, so no request is
  sent with it and no page data is mixed in.
- `rank.js` — pure: prefix modes (`>` commands, `@` repos, `#` files,
  `?` GitHub search), exact-substring and subsequence scoring with highlight
  ranges, pinned (+1000) and recent (+100) boosts, per-group caps
  (command 8, file 12, repo 15) and the `maxResults` total cap. The empty query
  builds the favorites and recent groups, then the browse order
  (`repository, issues, github, plus, repos, starred, search`) and never lists
  files. On a typed query `markPinned`-flagged candidates form their own first
  `pinned` group (cap 8) and are removed from their kind's group; the two
  synthetic group titles (`palette.group.pinned` / `.recent`) arrive through
  `options.titles`, so `rank.js` stays free of i18n.
- `search.js` — `searchPalette(state, query)`: the `?` mode and a query with no
  match both become the GitHub search command.
- `commands.js` — repository commands (only on a repository page; Settings only
  when the repository appears in the cached owned list), user commands, and
  GitHub Plus controls (open settings, seven feature toggles, refresh
  repositories/tree, clear palette/translation cache). Every candidate carries
  `data.run` and `detail { id, label, description, shortcut }`; `TOGGLE_LABEL_KEYS`
  maps a section to the locale key that names it.
- `actions.js` — the action descriptors and `runAction()`: navigate, settings,
  toggle (`saveSettings` + the matching bus event + toast), refresh (the
  `ensure*({ force: true })` call), clear caches, copy, search. Feature edges
  arrive as callbacks (`openSettings`, `clearTranslationCache`) so this module
  imports no other feature. `searchUrl` is defined in `commands.js` and
  re-exported here to keep the two modules acyclic.
- `hotkey.js` — re-exports `utils/shortcut.js` and adds `shortcutMatches` (mod
  = Ctrl or ⌘; every other modifier must match exactly), `isEditableTarget`
  (input, textarea, select, contenteditable), `otherOverlayOpen` (settings,
  confirm, viewer, preview — never the palette itself) and `shouldOpenPalette`
  (also ignores handled, composing and repeated keys).
- `detail.js` — the aside for a repo (description, language, stars, forks,
  updated, visibility badges, Open / New tab / Copy link / Pin), a file (path,
  repository, ref, size, Open / Copy path), an issue or pull request (author,
  update time, comment count, open-state and kind tags, Open / New tab / Copy
  link / Copy number) or a command (label, description, shortcut, Run). Every
  string comes from the caller's `labels`.
- `format.js` — `formatCount` (compact `k`/`M`) and `relativeTime`
  (`Intl.RelativeTimeFormat`, so no new translation keys).

`src/ui/commandPalette.js` is the generic shell: it imports only utils, the
scroll lock, `ui/contextMenu.js` and `ui/icons.js`, never a feature.
`openCommandPalette({ labels, search, renderDetail, onSelect, onPin,
onContextMenu, onClose, showDetails })` mounts the
overlay, locks the page, focuses the combobox and returns
`{ refresh, close, setQuery }`. The list is a single `role="listbox"` with
group titles and `role="option"` rows; the active row is tracked by key (so a
refresh keeps the selection) and mirrored to `aria-activedescendant`. A
favorite's row draws a star inside `.gp-command__title`.
`onContextMenu(item, { x, y, anchor, keyboard })` fires from a right-click on a
row (the pointer position), the row's `⋯` button (`anchor` + `keyboard: true`)
or `Shift+F10`/`ContextMenu` on the active row; every row carries the button in
a trailing grid column (`.gp-command__row--menued`) and it stays invisible and
untargetable until the row is hovered, active or the button is focused.
Keys:
arrows with wrap, Home/End, Enter (Ctrl/⌘ opens in a new tab), `Alt+P` to pin,
Escape clears a non-empty query before it closes, the shortcut closes, Tab
traps focus. An outside pointerdown closes; closing marks the palette closed
synchronously, restores focus, unlocks the page, closes any open row menu and
removes the overlay after
120 ms. Items with `highlight` ranges render marks from text nodes, never
`innerHTML`; `labels.badges` names the badge ids (including `issue` and
`pullRequest`).

The settings page (`features/settings/tabs/commandPalette.js`) edits the draft
only: activation (switch, preset select and the `createShortcutRecorder` field
that appears when **Custom** is chosen), GitHub access (password field, **Check
token**
through `fetchUser`, **Remove token**, an identity-mismatch hint), the six
source switches, fork/archived filters, the details-pane switch, and cache
lifetime plus a stats line and **Clear cache**. Verifying a token writes
`login`, `tokenLogin` and the fingerprint into the cache immediately and wipes
data that belonged to another account; the token itself is persisted only by
the panel footer Save. Selecting a preset hides the recorder and stores the
preset; recording a combination stores it as the shortcut and clears the
select back to **Custom** on the next open.

### `src/i18n/`

- `meta.js`: `SUPPORTED_LOCALES` (`en ru de es fr pt-BR zh-CN ja ko pl` —
  region-specific codes), `LOCALE_ALIASES` (e.g. `zh-cn`/`zh-sg`/`zh` →
  `zh-CN`, `pt-pt`/`pt` → `pt-BR`, base-language fallback),
  `LOCALE_NATIVE_NAMES`.
- `index.js`: `configureLocale(preference = 'auto')` matches
  `navigator.languages` through aliases with base-language fallback, else
  `'en'`; `t(key, vars)` falls back `active → en → key` and
  interpolates `{name}` placeholders.
- `locales/*.js`: one `export default { … }` map per locale (same key set, 417
  keys), all with **identical key order**; `locales/index.js` combines them
  into `TRANSLATIONS`.

### `src/utils/`

- `dom.js`: `el(tag, className, text)`, `append`, `debounce`, `eachNode`,
  `toArray`, `escapeHtml(text)`, `isOwnUi(node)` (true inside
  `.gp-panel-overlay`, `.gp-confirm-overlay`, `.gp-toasts`, `.gp-header-btn`,
  `.gp-user-menu-item`, `.gp-viewer-overlay`, `.gp-preview-overlay`,
  `.gp-download-btn`, `.gp-file-meta`, `.gp-context-menu`, `.gp-hold-ring`,
  `.gp-command-overlay`) and
  `isOwnUiChrome(node)` (the same check minus the repository content inside
  `.gp-preview__content`, whose images and file links must behave like page
  content). `eachNode`/`toArray` exist because DOM collections
  (`NodeList`, `HTMLCollection`, `addedNodes`, `classList`) are **not iterable
  in every engine** a userscript runs in — `for...of` over them throws
  "… is not iterable" there, so iterate DOM collections (and arrays handed in
  from the DOM) with them, never `for...of`.
- `fileTarget.js`: `rawUrlFor(href, base)`, `fileTarget(href, base, ref)` and
  `markdownFileTarget(href, base, ref)` (pure) — the raw address rewrite, the
  file-view parser and the rendered-markdown link parser shared by the file
  sizes, the file menu and the preview; `resolveFileTarget(node)` is the DOM
  resolver used by the context menu and by the preview's long press, covering
  listing rows, the sidebar tree, file links in rendered markdown and the
  current blob/blame view. Unit-tested by `test/fileTarget.test.js`.
- `size.js`: `formatSize(bytes)` (pure) — binary units with GitHub's labels and
  three significant digits (`2929` → `2.86 KB`). Unit-tested by
  `test/fileMeta.test.js`.
- `shortcut.js`: `isMacPlatform()`, `keyNameFromEvent(event)`,
  `shortcutFromEvent(event, { mac })`, `isValidShortcut(value)`,
  `normalizeShortcutValue(value)` and `formatShortcut(value, { mac })` — pure
  parsing and display for stored shortcuts, with platform detection
  injectable. The stored form is lowercase modifier names plus a key
  (`mod+shift+k`); `mod` is Ctrl on Windows/Linux and ⌘ on macOS, and anything
  that is not a valid combination (or `off`) normalizes to `''`. Shared by
  `core/settings.js` (so `core` imports this `utils` module), the palette
  hotkey and the settings recorder; unit-tested by `test/shortcut.test.js`.
- `http.js`: `request({ url, method, headers, body, timeout, signal })` and
  `normalizeHeaders(raw)` — one transport over `GM_xmlhttpRequest` (when the
  manager provides it) or `fetch`, resolving `{ status, text, headers }` for
  any HTTP status and rejecting only on network failure, timeout or abort.
  Shared by the translation providers and the palette's GitHub client, so a
  manager without `GM_xmlhttpRequest` still works; unit-tested by
  `test/http.test.js`.
- `download.js`: `downloadFile(url, name?)` fetches the bytes and saves them
  through an object URL, so a cross-origin file keeps its filename; a camo URL
  is unwrapped to the proxied file's name, and a blocked fetch falls back to
  opening the image in a new tab.
- `navigation.js`: `watchNavigation(fn)` — patches `pushState`/`replaceState`
  (guarded against double wrapping), listens to `popstate`, `hashchange`,
  `turbo:load`, `turbo:render` and `pjax:end`, and notifies with the current
  URL. One bad listener never breaks navigation.
- `scrollLock.js`: `lockPageScroll()` / `unlockPageScroll()` — counted page
  lock for modal overlays (pins `<body>` under `html.gp-modal-open` with
  scrollbar compensation and scroll-position restore). A lock taken while
  another owner already pinned the page is released without touching that
  owner's state, so the viewer and the panel never unlock each other.

### `src/styles/tokens.css` + `src/styles/app.css`

`tokens.css` defines the `:root` design tokens — the whole `--gp-*` palette
from DESIGN.md, expressed through GitHub's own Primer variables with literal
fallbacks, so injected UI follows the visitor's theme (light, dark, dimmed).
`app.css` is the injected stylesheet (header entry, panel, controls, confirm,
toasts, viewer, context menu, the quick preview and the command palette),
imported by `main.js` and applied as `GM_addStyle` by the
build. Every injected class carries the `gp-` prefix — never add an unprefixed
class to injected UI. Component styles consume tokens via `var(--gp-*)`; raw
hexes belong in `tokens.css` only (the viewer is themed like every other
surface: `--gp-bg-1` stage, `--gp-bg-2` bars).

## Import direction

`utils ← core ← gallery ← features`; `main.js` may import from anywhere but
must not own feature state. Rules that keep it acyclic:

- `core/settings.js` knows nothing about features or the bus — notifying is the
  caller's job. Its one dependency below `core` is `utils/shortcut.js`, which
  is pure and also serves the palette hotkey and the settings recorder.
- Every header entry registers through `ui/headerActions.js` instead of
  touching the header itself; the registry knows no feature and features only
  pass `{ icon, label, onClick }`.
- `gallery` never imports from `features`; `features/settings` imports the
  gallery registry (`listSources`) but not the gallery wiring.
- `ui/viewer.js`, `ui/toast.js`, `ui/contextMenu.js`, `ui/headerActions.js` and
  `ui/filePreview.js`
  import only `i18n`, `utils`, `core` and sibling `ui` helpers — they are
  reusable, not gallery- or file-specific. The preview shell takes its content
  loader as a `load` callback, so the feature supplies rendering and the shell
  never imports it.
- `features/fileMenu` imports `features/filePreview` (for **Preview**); the
  reverse is never allowed.
- `features/filePreview` imports `features/translate/previewAction.js` (the
  preview header action); `features/translate` never imports `filePreview` or
  the preview shell.
- `features/commandPalette/index.js` is the only module that crosses into
  another feature, and only for things the palette cannot own: it imports
  `togglePanel` from `features/settings/panel.js` (via `actions.js`'s
  `openSettings` callback) and `clearCache` from
  `features/translate/cache.js` (via `clearTranslationCache`). No other
  commandPalette module imports a feature, and no feature imports
  `commandPalette` except `features/settings/index.js`, which registers the
  settings page's `render` function.
- `ui/commandPalette.js` is a generic shell like `ui/filePreview.js`: it
  imports only `i18n`, `utils`, `core`, `ui/icons.js` and sibling
  `ui/contextMenu.js` (to close an open row menu with the palette). Search,
  details, selection and the row menu's items arrive as callbacks, so the shell
  never imports a feature.
- Side-effect registrations (the markdown source, page registration in
  `features/settings/index.js`) run at import time — a module that must be
  registered is imported by the module that owns its lifecycle.

## End-to-end data flow (gallery)

document click (capture) → `onClick` filters (enabled source, plain left click,
not own UI) → `resolveContainer` → `collectGallery` (normalize + filter +
dedupe + cap) → `matchIndex` for the clicked image → `preventDefault` +
`stopPropagation` → `openViewer({ images, index, loop, thumbnails, maxZoom,
resolveImage })` → viewer renders the set → on `show()`, `resolveImage(item)`
probes `fullSrc` and swaps it in when it loads.

## End-to-end data flow (settings)

user-menu row, manager menu command or the palette's settings command →
`togglePanel(true)` → draft =
deep clone of persisted settings → page `render(container)` mutates the draft →
footer Save → `saveSettings(draft)` → `configureLocale(language)` →
`emit('settings:gallery' | 'settings:toasts' | 'settings:logging' |
'settings:language' | 'settings:fileIcons' | 'settings:fileAges' |
'settings:fileMeta' | 'settings:fileMenu' | 'settings:filePreview' |
'settings:translate' | 'settings:commandPalette')` → gallery repaints its
stylesheet, the logger applies
its switch, file and translate features rescan or tear down, the palette closes
and reinstalls its hotkey, the palette entry relabels itself and the
user-menu row updates its dot →
success toast → panel closes and `unlockPageScroll()`.

## End-to-end data flow (preview)

eye button click, **Preview** in the file menu, or a long press on a file name
or a rendered markdown file link → `openPreviewForTarget`
resolves the file's `{ name, rawUrl }` and, for a listing row, its sibling set
(`siblingsForRow`) →
`openFilePreview({ files, index, load: loadPreview })` → `show()` aborts any
stale request, renders a spinner and calls `load(file, { mode, signal })` →
`loadPreview` probes `HEAD` for unknown kinds, fetches the same-origin raw
address, and dispatches to the markdown/code/card renderer → the shell swaps in
`result.node`, updates the meta line and segmented control, and the footer's
prev/next call `show()` again with the same loader.

## End-to-end data flow (translation)

scan → `findContainers(surface)` → `ensureContainer` (blocks present, content
signature changed) → chrome in the page header or the fallback bar →
**Translate** click (or an intersecting container in `auto` mode) →
`collectBlocks` + `extractBlock` → `buildBatches` → provider request
(`GM_xmlhttpRequest`/`fetch`) → `splitBatchResponse` → tokens restored and
painted block by block → button state and ring updated, results cached. Missing config
stops before any request with a localized hint; a total failure logs `GP-1601`
and leaves the page untouched; **Show original** (or pointer leave after a
hover reveal) restores the exact source.

## End-to-end data flow (command palette)

hotkey, header entry or menu command → `shouldOpenPalette` guards (feature on,
shortcut match, not editable, no other overlay, not handled/repeated) →
`openPalette` → `readPaletteState()` (page context, settings, identity, that
identity's cache) → `buildCandidates` over cache-backed `commandCandidates`,
`repoCandidates`, `fileCandidates`, `issueCandidates` and the cold-source
snapshots from recents
and pins, then `markPinned` → `openCommandPalette({ search: searchPalette, ... })`
renders the
warm list immediately, with favorites starred and in their own first group →
`kickLoads()` starts `ensureRepositories()` /
`ensureTree()` / `ensureIssues()` without awaiting → each settles and calls
`refreshView()`,
which reruns `buildCandidates` from storage and `palette.refresh()` keeps the
active row by key → Enter (or click) records a recent, closes the palette and
runs the action: `navigate` for a URL, `saveSettings` + the matching bus event
+ toast for a toggle, `ensure*({ force: true })` for a refresh; a row's `⋯`,
right-click or `Shift+F10` opens the palette-layer context menu, whose entries
run the same select path, toggle the pin or copy a link, path, clone address or
issue number. Settings Save
emits `settings:commandPalette`, which closes an open palette, relabels the
header entry and installs or
removes the document hotkey.

## GitHub DOM notes

- GitHub swaps page content without a full reload (Turbo on modern pages,
  classic `pushState` navigation elsewhere) and re-renders parts of the page
  from React. Never cache DOM references across navigations; re-query from the
  click target. Route new page watchers through `utils/navigation.js`.
- Rendered markdown always lives in a `.markdown-body` container on GitHub
  (repository README, blob view, wiki, issue, discussion, review comment).
  That container is the gallery set boundary; the quick preview renders its
  own markdown into `.gp-preview__md`, which is a gallery boundary too.
- GitHub's header markup changes over time. Keep `HEADER_TARGETS` ordered from
  most to least specific and let `ui/headerActions.js` insert entries *next to*
  GitHub's own actions (never replace, move or restyle them), so a header
  rework degrades to "no button" instead of a broken header.
- Every GitHub overlay is a Primer portal. `AnchoredOverlay`, `ActionMenu` and
  their tooltips are mounted into
  `#__primerPortalRoot__ > div[data-component="Portal"]` when they open and
  unmounted when they close — nothing about them lives in the header. That
  container is the reliable hook for the user (avatar) menu:
  `features/settings/userMenu.js` observes it rather than guessing at mount
  timing, and falls back to a bounded wait after header clicks for a menu
  rendered outside it. The menu itself is only read through stable hooks
  (`aria-labelledby="global-nav-user-menu-header"`, `a[href$="/settings/profile"]`,
  `[data-component="ActionList"]`, `[data-component="ActionList.Divider"]`);
  GitHub's hashed `prc-*` class names are never copied. Closing it uses the
  `Escape` keydown GitHub's own overlay handles, which is why our row opens the
  panel only after that dispatch. Verify the portal root exists before assuming
  a mount will be seen: on a layout without it the click fallback is the only
  trigger.
- Do not rely on `naturalWidth` alone to classify an image: lazily loaded
  images report `0` until they load, which is why the size check only rejects
  images whose size is known and small.
- `img.emoji` and `role="presentation"` images are decoration in GitHub's
  markup; never treat them as gallery content.

## Settings

Stored under `gp_settings_v1` (only `getSettings()` reads, `saveSettings()`
writes). UI language: `'auto'` (browser) or one of the ten `SUPPORTED_LOCALES`.

| Key | Default | Notes |
|-----|---------|-------|
| `language` | `'auto'` | Settings-panel UI language, not the page language |
| `logging.enabled` | `false` | Console diagnostics: GP codes, module, details, stack; off by default |
| `gallery.enabled` | `true` | Master switch; disabling removes the injected affordance stylesheet |
| `gallery.sources.markdown` | `true` | Per-source switches keyed by source id |
| `gallery.skipBadges` | `true` | Skip badge hosts, emoji and images smaller than `GALLERY_MIN_SIZE_PX` |
| `gallery.upgradeFullSize` | `true` | Probe and load the linked original |
| `gallery.download` | `true` | Download button in the viewer and on hovered markdown images |
| `gallery.thumbnails` | `true` | Thumbnail strip in the viewer |
| `gallery.loop` | `true` | Wrap around at the ends |
| `gallery.maxZoom` | `8` | Zoom ceiling, clamped to 2…`GALLERY_MAX_ZOOM` |
| `toasts.enabled` | `true` | Master switch for toast notifications |
| `toasts.position` | `'bottom-right'` | Toast corner: `bottom/top` × `right/left` |
| `toasts.duration` | `5000` | Auto-hide ms (`0` = sticky until dismissed) |
| `fileIcons.enabled` | `true` | Master switch; disabling removes every injected icon and observer |
| `fileIcons.folders` | `true` | Folder-specific icons for common folder names |
| `fileIcons.specialNames` | `true` | Dedicated icons for well-known filenames |
| `fileAges.enabled` | `true` | Master switch; disabling removes every age tint and observer |
| `fileAges.folders` | `true` | Color folder rows by their last commit age too |
| `fileMeta.enabled` | `true` | Master switch; disabling removes every size label and download button |
| `fileMeta.sizes` | `true` | Show each file's size in its own column |
| `fileMeta.download` | `true` | Download button in the repository file tree |
| `fileMenu.enabled` | `true` | Master switch; disabling removes the delegated `contextmenu` listener |
| `filePreview.enabled` | `true` | Master switch; disabling clears the listing buttons and observers and closes an open preview |
| `filePreview.rowButton` | `true` | Eye button in listing rows (the context menu always offers **Preview**) |
| `filePreview.longPress` | `true` | Hold the left mouse button on a file name or a markdown file link to open the preview |
| `filePreview.longPressMs` | `450` | Hold time in ms, clamped to 200…2000 |
| `filePreview.longPressRing` | `true` | Progress circle at the pointer while holding |
| `translate.enabled` | `true` | Master switch; disabling restores every translated block and removes all chrome and observers |
| `translate.provider` | `'google'` | Provider id; the free, keyless Google endpoint is the default |
| `translate.providerConfig.<id>` | per provider | Credentials and endpoint fields, normalized to known keys and strings |
| `translate.targetLang` | `'auto'` | `'auto'` follows the UI language; otherwise a `TRANSLATE_TARGET_LANGUAGES` code |
| `translate.mode` | `'button'` | `button` sends nothing until **Translate**; `auto` translates containers as they scroll into view |
| `translate.display` | `'replace'` | `replace` swaps the block text; `below` keeps it and adds a result box |
| `translate.reveal` | `'button'` | Replace mode only: `button` = **Show original**, `hover` = peek at the source while hovering/focused |
| `translate.linkLabels` | `true` | Translate anchor labels as their own segments |
| `translate.surfaces.<id>` | `true` | Per-surface switches (`markdown`, `plaintext`, `commits`, `titles`, `preview`) |
| `translate.cacheHours` | `24` | Cache lifetime in hours (`0` disables it), clamped to 0…`TRANSLATE_CACHE_HOURS_MAX` |
| `commandPalette.enabled` | `true` | Master switch; off removes the header entry, the document hotkey and the menu command |
| `commandPalette.shortcut` | `'mod+k'` | A `COMMAND_PALETTE_SHORTCUTS` preset (`mod+k`, `mod+shift+k`, `alt+k`, `off`) or any combination recorded on the settings page |
| `commandPalette.token` | `''` | Optional GitHub token: private repositories, complete lists, 5000 requests/h; sent only to `api.github.com` |
| `commandPalette.sources.<id>` | `true` | Per-source switches (`commands`, `repositories`, `starred`, `files`, `issues`, `recent`) |
| `commandPalette.sources.issues` | `true` | Open issues and pull requests of the repository the page shows |
| `commandPalette.hideForks` | `false` | Hide forked repositories from the repository groups |
| `commandPalette.hideArchived` | `false` | Hide archived repositories |
| `commandPalette.showDetails` | `true` | Details pane beside the list (the shell hides it below 760px regardless) |
| `commandPalette.cacheHours` | `6` | Repository, tree and issue cache lifetime in hours (`0` disables it), clamped to 0…`COMMAND_PALETTE_CACHE_HOURS_MAX` |
| `commandPalette.maxResults` | `30` | Row cap per result set, clamped to `COMMAND_PALETTE_MAX_RESULTS_MIN`…`_MAX` |

## Localization

UI locales: `en`, `ru`, `de`, `es`, `fr`, `pt-BR`, `zh-CN`, `ja`, `ko`, `pl`.
`configureLocale('auto')` matches `navigator.languages` via `LOCALE_ALIASES`
with English fallback.

- Every new user-facing string is added to **all ten**
  `src/i18n/locales/*.js` files with identical key order — run a key diff over
  the files before finishing (a one-liner diffing `Object.keys` of every locale
  against `en.js` is enough).
- Source `labelKey`s and `hintKey`s resolve through `t()`, so a new source
  always carries keys in every locale.
- Localized `@name` / `@description` metadata in `vite.config.js` must stay
  aligned when the product description changes (generated into the userscript
  header).
- The README mirrors the ten UI locales as `README.md` plus nine
  `README.<locale>.md` files (English is the reference). Keep them in sync
  section for section when the description, install instructions, features,
  settings table or version change. Command blocks, setting keys, paths and
  URLs stay untranslated; the language switcher lists all ten entries with the
  current one in bold.

## Design

All injected UI (the palette header entry, panel, controls, confirm dialog, toasts,
context menu, viewer, file icons, file-age dates, the file size column and
download buttons, the quick file preview, and the translation button, bar and
result boxes)
follows [DESIGN.md](DESIGN.md) — GitHub's
own visual language through Primer tokens, `gp-`-prefixed classes, colors from
`src/styles/tokens.css`. File icons are the documented exception: their
fixed brand colors come from the generated Material Icon Theme data, not from
tokens. The file-age scale is the other fixed palette: commit age is data, so
`--gp-age-1` … `--gp-age-10` are literal shades that run from the theme's muted
grey (oldest) to a warm accent (newest), with separate light and dark ramps that
keep the tinted date readable in either theme. The Diagnostics card reuses the
existing section, switch-row and button controls, so DESIGN.md needs no new
rules for it.
Before touching any visible element, read DESIGN.md; visual changes update
DESIGN.md, `tokens.css` and the stylesheet in the same change, get rebuilt and
eyeballed on a live GitHub page.

## Language and comments

- **Write in English.** Code, comments, docs, commit messages and file
  contents are English. The only exception is translated user-facing strings:
  the values in `src/i18n/locales/*.js` and the localized metadata blocks in
  `vite.config.js`. Non-English text anywhere else is a defect.
- **Comment only what is not obvious.** A comment must explain a non-obvious
  *why*, a contract, or a fragile invariant — never restate what the code does.
  In particular:
  - No section-divider or decorative comments in JS (CSS section headers are
    the one exception: they are the file's table of contents).
  - No edit annotations (`// fix`, `// added here`, initials/dates) and no
    commented-out code.
  - Do not leave both a doc block and a comment saying the same thing; one
    short JSDoc per exported symbol is enough.
  - When changing code, delete comments the change made stale instead of
    rewriting them to fit.

## Versioning

Update the project version with every user-visible change — never leave a
change unversioned. Follow Semantic Versioning:

- **Major** (`X.0.0`) for incompatible behavior, storage migrations, or
  breaking changes that require user action.
- **Minor** (`0.X.0`) for new backward-compatible features or substantial
  enhancements.
- **Patch** (`0.0.X`) for bug fixes, styling adjustments, documentation, and
  other backward-compatible small changes.

Keep the version synchronized in `package.json` and `package-lock.json` (edit
`package.json` and run `npm install` to refresh the lockfile). `CHANGELOG.md`
versions with it: record every user-visible change under `[Unreleased]`; when
bumping, move those bullets into a new `## [X.Y.Z] - YYYY-MM-DD` section (with
a matching link reference at the bottom) and leave `[Unreleased]` empty. Keep
the version badge and the Status line in `README.md` and in every
`README.<locale>.md` synchronized with the bumped version. The userscript
metadata is generated from `package.json`; run `npm run build` after every bump
so the root `.user.js` / `.meta.js` headers carry the new version.

## Build and verification

Requires Node.js 22.

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate, also in GitHub Actions)
npm run icons:build        # regenerate iconSet.generated.js from the package
npm test                   # Node test runner (all unit and DOM suites)
```

Build facts agents need to know:

- `vite.config.js` declares `entry: src/main.js`, the full `==UserScript==`
  block (names/descriptions in all locales, `match: github.com` +
  `gist.github.com`, `run-at: document-idle`, `noframes`),
  `server.prefix: 'dev:'`, and `build.fileName: github-plus.user.js` with
  `metaFileName: true`. GM grants are auto-detected from the `GM_*` calls in
  the source — do not declare grants or `@match` entries "just in case". The
  one deliberate declaration is `connect: ['*']`: translation providers and
  self-hosted endpoints (LibreTranslate, OpenAI-compatible servers) are
  user-configurable, so a fixed host list cannot work.
- `scripts/copy-dist.mjs` copies `ARTIFACT_FILES` from `dist/` to root;
  `verify-artifacts.mjs` enforces byte identity (CI fails on drift).
- `dist/` and `node_modules/` are gitignored; `package-lock.json` is
  committed.
- `npm test` covers the pure modules and the DOM shells. The command palette
  is spread over `test/commandPalette*.test.js` — store, api, repos, files,
  issues, commands, rank, rowMenu, detail, format, settings, index, shell,
  hotkey and search — plus `test/http.test.js` for the shared transport,
  `test/headerActions.test.js` for the header registry, `test/contextMenu.test.js`
  for the menu layers and `test/shortcut.test.js` for shortcut parsing; a
  palette change that touches ranking or identity rules
  belongs in one of them, not in a manual check.

After every source, style, metadata, or version change, run `npm run build` so
the root install artifacts stay synchronized. Before finishing, run `npm run ci`
and check diagnostics for edited files.

## Debugging

- GM storage key: `gp_settings_v1` (`localStorage.gp_settings_v1` in a plain
  browser) — delete it to test a cold start and the defaults.
- Diagnostics: nothing is printed until **Console logging** is on under
  **General → Diagnostics**. While on, every entry carries a `GP-####` code,
  the module and the cause; expand the entry object in the console, or run
  `__GP_LOG__.dump()` / `__GP_LOG__.copy()` (switch the devtools console
  context to the userscript in a sandboxed manager). `__GP_LOG__.clear()`
  empties the buffer. Only uncaught errors and rejections attributable to this
  bundle are captured; GitHub's own failures stay out.
- Gallery does not open on click: check the source is enabled, the click was a
  plain left click (no modifier), the image is inside a `.markdown-body`
  container or the quick preview's `.gp-preview__md` / `.gp-preview__content`,
  and the image is not a badge, emoji or small icon. Inspect
  `#gp-gallery-style` — no stylesheet means no enabled source.
- File icons missing: check **File icons** is on and the row is one of the
  surfaces in `features/fileIcons/surfaces.js`. The sidebar file tree is
  `#repos-file-tree` (rows `li[role="treeitem"]`, names in
  `.PRIVATE_TreeView-item-content-text`, folders marked by `aria-expanded`), and
  the filename heading is `[data-testid="breadcrumbs-filename"]` inside the code
  view's `#repos-split-pane-content` — the heading is a sibling of the
  breadcrumb nav, not inside it. A GitHub redesign that renames those turns the
  surface into a no-op — extend the registry, never add a document-wide
  observer.
- Last-commit dates not colored: check **File ages** is on and, for folder
  rows, that **Folder rows** is on; the row must carry a
  `relative-time[datetime]` (or `time[datetime]`) inside one of the containers
  in `features/fileAges/surfaces.js`. A GitHub redesign that renames
  `.react-directory-commit-age` turns the surface into a no-op — extend the
  registry, never add a document-wide observer.
- Viewer shows a smaller image than expected: the page's `src` is what is
  rendered; `fullSrc` only upgrades when the wrapping link points at an image
  file and that file actually loads.
- Size labels or download buttons missing: check the **File sizes and
  downloads** card on the **Files** page is on and the row is
  a file link inside `[data-testid="directory-content"]` (folder rows keep an
  empty cell).
  A size label with no text means the HEAD probe returned no `Content-Length`
  (check the Network tab — a blocked request or a file served without a length
  is the usual cause). The column is a `td` appended to the row and a `th` in
  the header row (`table thead tr`), and it is hidden below 768px on purpose,
  so test at a wide window; a GitHub redesign that renames
  `.react-directory-row` or drops the table header turns the surface into a
  no-op — extend the registry, never add a document-wide observer.
- Header entry missing: check which of `HEADER_TARGETS` exists on the page and
  that the registered button (`.gp-header-btn` with `.gp-palette-btn`) leads
  it, or leads the row around the avatar on a renamed header. A header rework
  on GitHub's side is the
  usual cause — extend `HEADER_TARGETS` (the avatar fallback already mounts
  into the avatar's row on a renamed header), never restyle GitHub's own
  header. A page
  with no target at all has no buttons until one appears; the registry's
  bounded poll and shell observers are what catch it.
- File context menu not opening: check **File context menu** is on, the page is a
  repository listing, the sidebar file tree, a blob/blame view or rendered
  markdown, and the right-click landed on a file row link, a tree file row, a
  file link inside `.markdown-body` or inside the file content — folders,
  submodules, images, media, hash-only links and foreign links keep the browser
  menu by design. The menu claims `#gp-context-menu`; inspect its
  `aria-label` for the resolved file name. Copy contents refusing a file means
  `isCopyableContent()` saw a non-text type, the file exceeds
  `FILE_COPY_MAX_BYTES` (1 MiB) or the raw fetch failed (`GP-1401` in the
  console). A menu left open after a soft navigation means `watchNavigation`
  stopped firing.
- Page download button missing: the gallery and `gallery.download` must both be
  on, the image must sit inside an enabled source container and pass the
  collector's filters (badges, emoji and tiny images are skipped), and the
  pointer must be a mouse or pen — touch has no hover, so the viewer's download
  tool is the path there. A download whose fetch is blocked by CORS or a CSP
  falls back to opening the image in a new tab.
- Row missing from the avatar menu: check `#__primerPortalRoot__` while the
  menu is open — the row is injected from that container, so an empty portal
  root means the overlay is no longer portaled there and only the header-click
  fallback remains (then check `HEADER_HINT_SELECTOR` matches the header that
  owns the avatar). The row is found through
  `a[href$="/settings/profile"]` or `aria-labelledby="global-nav-user-menu-header"`;
  a menu with neither is not recognised. If the row is there but clicking it
  leaves the menu open behind the panel, GitHub's overlay stopped closing on
  the dispatched `Escape`.
- Quick preview not opening: check **Quick file preview** is on, and — for the
  eye button — that **Row button** is on, and — for the hold gesture — that
  **Long-press a file name** is on; the context menu entry appears regardless.
  The hold gesture needs a mouse: touch pointers are ignored, and moving more
  than 8 px before the configured `longPressMs` timer (450 ms by default) fires
  turns it into a drag. The hold works on a file link inside `.markdown-body`
  and on a file link in the preview's own markdown too, and the row must be a
  `tr.react-directory-row` inside `[data-testid="directory-content"]`; the
  menu also opens the preview on a blob
  or blame page, for the file itself. A card saying the file could not be shown
  means the raw fetch failed (`GP-1501` in the console) or the content type is
  not text. A preview stuck on "loading" with a huge file means it exceeds
  `PREVIEW_TEXT_MAX_BYTES` (2 MiB) or `PREVIEW_PDF_MAX_BYTES` (25 MiB) — those
  show the too-large card, so a real hang means the request never settled. A
  preview left open after a soft navigation means `watchNavigation` stopped
  firing.
- No **Translate** button: check **Translation** is on and the matching switch
  on its **Places** card; the container must be one of the surfaces in
  `features/translate/surfaces.js` and carry text blocks (an image-only README
  has none). A button inside a comment, description or file header means `headerFor`
  found GitHub's action row; a button in a bar above the container means it did
  not — extend `headerFor` (the fallback already looks for the edit control
  nearest the container), never add a document-wide observer. The quick
  preview's action
  needs the **Quick preview** place switch too. A plain-text file (a license or
  notice such as LICENSE) needs the **Plain-text files** switch; a
  syntax-highlighted file is not plain text and is left alone, and a file over
  `TRANSLATE_MAX_BLOCK_CHARS` (12 000) is served by no block, so it gets no
  button. After a navigation a button left on the previous page disappears
  within about a second; one that survives longer means the navigation hook or
  the prune in `scanTranslateSurfaces()` broke.
- Translation output wrong or missing: an unconfigured provider stops before
  any request with the localized setup message, and a failed one logs `GP-1601`
  — check the API key and the provider fields, then the Network tab (the
  request goes to the provider, `@connect *`). A failed cache write logs
  `GP-1602` and never breaks the page. A second translation of the same text is
  instant while `translate.cacheHours` has not expired and until **Clear
  cache**; 0 hours disables the cache.
- Palette does not open: check **Command palette** is on and the shortcut is
  not `off`, that the focus is not in an input, textarea, select or
  `contenteditable` (GitHub's editors keep `Ctrl/⌘+K` for links), that no other
  GitHub Plus overlay is open (panel, confirm, viewer, preview), and that
  GitHub itself did not call `preventDefault()` on the key. Settings Save
  reinstalls the hotkey through `settings:commandPalette`, so a save that went
  through is never the reason it stops firing; the header button and
  `GM_registerMenuCommand` open the same palette as fallbacks.
- Palette row menu not opening: the `⋯` button appears only on hover, on the
  active row or when focused; right-click must land on a row, and
  `Shift+F10`/the menu key needs an active row. The menu is the shared
  `#gp-context-menu` with `layer: 'palette'` — if it renders behind the
  palette, the layer was lost (it must not be `default`).
- Issues missing from the palette: the **Issues** source switch must be on and
  the page must be a repository (the source reads the repository the page
  shows); the row appears only after `ensureIssues()` has written a record —
  `GP-1701` in the console means the request failed. A pull request carries the
  pull-request badge because GitHub's issue endpoint returned its
  `pull_request` field; a row without a badge is an issue. The list is capped at
  3 pages with a token and 1 without, so a repository with many open items
  shows the most recently updated ones.
- Palette opens with no repositories: a token that has not been verified
  yields no identity and reads public data only until **Check token**
  succeeds; an identity-mismatch hint means the cache belongs to another
  account and is ignored by design. Anonymous mode lists only public data and
  hits 60 requests/h — an exhausted limit shows the rate-limit note and
  cached rows. `GP-1701` marks a failed source; the API layer itself never
  logs.
- Files missing in the palette: the file group needs the current repository
  and ref (`readContext()` — embedded payload, URL, default-branch meta, then
  `HEAD`), the **Files** source switch on, and a tree under
  `gp_palette_cache_v1.trees`; a tree over 20 000 entries is truncated and the
  footer says so. Files never appear in the empty-query browse list — type
  `#` or a query. A cache entry is dropped when its identity no longer matches
  the current one.
- Token rejected: **Check token** calls `GET /user`; a 401 means the token is
  expired or lacks `repo`, and nothing is written. Verifying a token wipes
  data that belonged to another account and stores `login`, `tokenLogin` and
  the FNV-1a fingerprint — never the token in the log; the token itself is
  persisted only by Save, and `normalizeImportedSettings` never imports it.
- Locale sanity: diff the key lists of all ten locale files; `t()` falls back
  to `en`, which masks a missing key in one locale — verify, don't eyeball.

## Local testing

- **Violentmonkey:** `npm run build`, install the local root `.user.js` +
  enable Track local file; rebuild + reload GitHub after edits.
- **Tampermonkey:** reinstall from file/URL, or temporary local server URLs
  (do not commit them).
- The gallery and the panel are page-level: verify on a real repository page
  (a README with several images, an issue with an image comment) after every
  change, including one navigation between two pages without a reload.

## Do not

- Hand-edit `github-plus.user.js`, `github-plus.meta.js`, or
  `src/features/fileIcons/iconSet.generated.js` (regenerate with
  `npm run icons:build`).
- Commit `node_modules/`, `dist/`, or development-only update URLs.
- Add a document-wide MutationObserver or an endless scan loop; extend the
  registry and the delegated listener instead. The bounded settle wait after a
  navigation (`SETTLE_MS × SETTLE_TRIES`, stopped as soon as a surface mounts)
  is the sanctioned way to catch a late-mounting container.
- Carry Steam-era `sp-` identifiers, `SP-####` codes or any external project's
  naming into this repository.
- Break GitHub's header, navigation, or responsive layout — injected UI must
  never restyle page markup outside the gallery's own affordance stylesheet.
- Imply affiliation with GitHub, Inc. in docs or UI copy.
