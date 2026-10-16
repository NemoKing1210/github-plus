# AGENTS.md — GitHub Plus

Instructions for AI coding agents working in this repository.

## Project

Userscript that improves GitHub (`github.com`, `gist.github.com`). Stage 1
ships a full settings panel and an image gallery for rendered markdown, with
more GitHub improvements planned. Built with Vite and `vite-plugin-monkey` for
Tampermonkey, Violentmonkey, ScriptCat, and compatible managers.

- Source entry point: `src/main.js`
- Version source of truth: `package.json`
- Generated install artifacts: `github-plus.user.js` and
  `github-plus.meta.js` (produced only by `npm run build`)
- Docs: `README.md`, `CHANGELOG.md` (Keep a Changelog + SemVer), and
  `DESIGN.md` (visual rules for all injected UI — see Design below)
- License: MIT

Edit files under `src/`. Never hand-edit generated `.user.js` / `.meta.js`
files; regenerate them with `npm run build`.

## Repository layout

```text
github-plus/
├── AGENTS.md               # This file: architecture and repo conventions
├── DESIGN.md               # Visual rules for every injected UI element
├── src/
│   ├── main.js             # Entry: locale init, feature boot, nav overlay reset
│   ├── core/
│   │   ├── constants.js    # DEFAULT_SETTINGS, storage key, limits, timings
│   │   ├── settings.js     # Settings state, normalization, persistence
│   │   ├── bus.js          # Minimal pub/sub (on / off / emit)
│   │   └── debug.js        # Structured console diagnostics (GP-#### codes)
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
│   │   └── settings/
│   │       ├── index.js    # Settings entry: header button, menu command, pages
│   │       ├── panel.js    # Panel shell: home nav + pages, draft, Save/Reset/Cancel
│   │       ├── controls.js # Section / row / field / switch / select / input / button
│   │       ├── confirm.js  # Promise-based confirm dialog
│   │       └── tabs/
│   │           ├── general.js # Interface language, toast notifications
│   │           ├── gallery.js # Master switch, source switches, viewer behavior
│   │           ├── backup.js  # Settings export (file/clipboard) + validated import
│   │           └── about.js   # Version, author, repository, license
│   ├── styles/
│   │   ├── tokens.css      # :root design tokens (--gp-* palette — DESIGN.md)
│   │   └── app.css         # Injected styles, gp- prefix (GM_addStyle via build)
│   ├── ui/
│   │   ├── toast.js        # Toast notifications (positions, dedup, actions)
│   │   └── viewer.js       # Fullscreen image viewer (zoom, pan, rotate, gallery)
│   └── utils/
│       ├── dom.js          # el, append, debounce, eachNode, toArray, isOwnUi
│       ├── navigation.js   # watchNavigation (turbo/pjax/pushState URL watcher)
│       └── scrollLock.js   # counted page scroll lock for modal overlays
├── scripts/
│   ├── lib/artifacts.mjs   # ARTIFACT_FILES list (single source of truth)
│   ├── copy-dist.mjs       # dist/ → root artifact copy
│   └── verify-artifacts.mjs# dist/ ↔ root byte-identity check
├── dist/                   # Build output (gitignored)
├── github-plus.user.js     # Generated bundle (do not hand-edit)
├── github-plus.meta.js     # Generated metadata (do not hand-edit)
├── vite.config.js          # Build + ==UserScript== metadata
├── package.json            # Version source of truth
└── .github/workflows/ci.yml# Build + verify gate
```

## Module reference

### `src/main.js` — entry

`init()`: `configureLocale(getSettings().language)` → `initSettingsFeature()` →
`initGalleryFeature()` + `applyGallerySettings()` → `watchNavigation(resetOverlaysOnNavigation)`.

This project deliberately has **no global DOM scan loop and no
document-wide MutationObserver**: the gallery is CSS plus one delegated click
listener, so content that GitHub renders after load behaves like
server-rendered content with no rescanning. Only the header entry re-mounts
itself (see `features/settings/index.js`).

`resetOverlaysOnNavigation()` closes the viewer and the panel when the URL
changes. GitHub replaces `<body>` on soft navigation while the module state
lives on, so without this a "closed" viewer would keep reporting itself open
(and swallow `Escape`) and a pinned page would stay pinned.

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
- `DEFAULT_SETTINGS` (`language`, `gallery`, `toasts`) plus `getDefaults()`,
  which returns a deep clone — never mutate the shared constants.

### `src/core/settings.js`

Module-level `settings` loaded once at import, normalizers per field,
`saveSettings(patch)` merges → normalizes → persists → returns the new state.
Public API: `loadSettings`, `getSettings`, `getGallerySettings`,
`saveSettings`, `normalizeImportedSettings`, `hasCustomSettings`.

Key facts that must survive refactors:

- `saveSettings()` does **not** notify features — the caller (settings UI)
  emits the matching bus event afterwards. Keep that separation: persistence in
  `core`, reactions in the UI/features via the bus.
- Every value is normalized on load and on save: locale whitelist, booleans,
  toast positions from `TOAST_POSITIONS`, toast duration clamped to
  `TOAST_MAX_DURATION_MS`, zoom clamped to 2…`GALLERY_MAX_ZOOM`, source
  switches restricted to the keys present in the defaults (a source removed
  from the registry leaves no stale key). Unknown values fall back to defaults,
  never crash.
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
- `settings:language` — emitted by the same Save; the settings entry listens to
  relabel its header button.

### `src/core/debug.js` — diagnostics

Structured console logging. Every failure carries a stable `GP-####` code
(grep the code to find the throw site): the `Codes` registry, `logError` and
`logWarn` (always printed, styled badge + details object), `logInfo(area, …)`
(verbose only — enable with `localStorage gp_debug=1` or
`window.__GP_DEBUG__=true`), and `isVerbose()` for callers that want to skip
building expensive log payloads. Codes in use: `GP-1001` bus listener, `GP-1002` settings
persist, `GP-1003` settings load, `GP-1004` settings import, `GP-1101` gallery
open, `GP-1102` gallery source, `GP-1103` gallery image load, `GP-1201` UI
mount. Rules: log once per user-visible failure at the outermost point;
layers below only throw, they never log.

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
side effect (the gallery imports it). Adding a source touches four places
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

- `applyGallerySettings()` installs the click listener (once) and repaints the
  injected stylesheet.
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
- `upgradeImage(item)` (used as the viewer's `resolveImage` hook) probes
  `item.fullSrc` and returns it only if it loads; failures fall back silently.

### `src/ui/viewer.js` — fullscreen image viewer

GitHub-themed lightbox (one instance per page): `openViewer({ images, index,
loop, thumbnails, minZoom, maxZoom, labels, resolveImage, onClose })` takes a
gallery of `{ src, link?, title?, alt?, fullSrc? }`, `closeViewer()` /
`isViewerOpen()` complete the API. It fits the image to the stage and supports
zoom (wheel, `+`/`−`, double click, pinch), pan (drag at any zoom — the offset
is clamped so the image slides inside the stage but never leaves it), 90°
rotation, a thumbnail strip, prev/next with optional wrap-around,
preloading of the neighbouring images and a danger-bordered status card when an
image fails. The optional async `resolveImage(image, index)` hook lets the
caller upgrade the shown image to a higher resolution after the fact. The
`open` tool links to `item.link || item.src` in a new tab. Keyboard: `Esc`,
`←`/`→`, `Home`/`End`, `+`, `−`, `0`, `r`. The stage captures the pointer while
panning, so clicks inside it are resolved from the element that was pressed
(recorded on `pointerdown`) — never from `event.target`, which the capture
retargets to the stage — and any drag past `DRAG_THRESHOLD` never counts as a
click. It locks the page behind it with `utils/scrollLock.js`, restores focus
on close and renders all labels through `viewer.*` locale keys, overridable per
call via `labels`. Excluded from page interaction (`isOwnUi`).

### `src/ui/toast.js` — notifications

`showToast({ type, icon, title, message, duration, key, onClick, actions })`
(dedup by `key`, at most three on screen, hover-paused timers, optional
auto-hide progress bar). Honors `toasts.enabled`, `toasts.position` and
`toasts.duration` from settings at call time. Save, import and copy actions
report through it.

### `src/features/settings/` — panel

- `index.js`: registers the pages, `ensureSettingsButton()` places the entry in
  the current header (`HEADER_TARGETS`, most specific first:
  `.AppHeader-globalBar-end`, `.AppHeader-globalBar`, `#user-links`) as a
  sibling of GitHub's own actions — inserted before `.AppHeader-user` when
  present, wrapped in an `li.gp-settings-item` when the target is a `ul`.
  `pollForHeader()` waits a bounded time (12 × 500 ms) for a late-rendered
  header, `observeChrome()` watches `document.body`'s own children
  (`{ childList: true }`, deliberately **no** `subtree`) for a swapped app
  shell, `watchNavigation(ensureSettingsButton)` covers client-side navigation,
  `updateSettingsButtonState()` lights the `gp-header-btn--custom` dot when
  settings differ from defaults, and `GM_registerMenuCommand` opens the panel
  from the manager's menu.
- `panel.js`: page registry (`registerPage`), one modal overlay
  (`#gp-settings-panel`, built lazily, `hidden` attribute), header with product
  name + `v` version chip (from `GM_info.script.version`) + subtitle + ×
  close, sticky footer with the save hint + Reset / Cancel / Save. The body
  shows the home list (page buttons with icon, title, description) or one page
  with a `‹ Back` crumb (`switchPanelPage` / `showHome`). Pages render into the
  draft on open, and `getDraft()` is what they mutate; nothing is persisted
  until Save (`saveSettings` + `configureLocale` + every `settings:*` bus
  event). Cancel, the overlay click and `Escape` (home first) discard the
  draft. `applyExternalSettings(next)` is the path for settings that arrive
  from outside the panel (backup import): it persists, notifies and repaints.
  Scroll locking is the shared counted `utils/scrollLock.js`; `installEscapeClose()`
  ignores `Escape` while the viewer is open (the viewer sits above the panel).
- `confirm.js`: promise-based `confirmDialog({ title, message, confirmLabel,
  cancelLabel, tone })` modal above the panel, used by the footer Reset.
- `controls.js`: reusable controls — `createSection` (title + hint card),
  `createRow`, `createField`, `createHint`, `createSwitch`,
  `createSwitchRow`, `createSwitchCell` (grid cell; the cell is the `label` and
  the switch inside it is plain markup, never a nested `label`), `createSelect`,
  `createNumberInput`, `createTextarea`, `createButton`, `getIconSvg`.
- `tabs/general.js`: interface language select (`auto` + `SUPPORTED_LOCALES`
  native names), toast switch, corner select, auto-hide seconds input.
- `tabs/gallery.js`: master switch, source grid from `listSources()`, badge
  filtering, full-size upgrade, thumbnail strip, wrap-around, zoom ceiling.
- `tabs/backup.js`: export to file (`Blob` + `<a download>`) or clipboard,
  import from a textarea through `normalizeImportedSettings` +
  `applyExternalSettings`, with an inline invalid-payload message.
- `tabs/about.js`: product hero, version, author, repository, license.

### `src/i18n/`

- `meta.js`: `SUPPORTED_LOCALES` (`en ru de es fr pt-BR zh-CN ja ko pl` —
  region-specific codes), `LOCALE_ALIASES` (e.g. `zh-cn`/`zh-sg`/`zh` →
  `zh-CN`, `pt-pt`/`pt` → `pt-BR`, base-language fallback),
  `LOCALE_NATIVE_NAMES`.
- `index.js`: `configureLocale(preference = 'auto')` matches
  `navigator.languages` through aliases with base-language fallback, else
  `'en'`; `t(key, vars)` falls back `active → en → key` and
  interpolates `{name}` placeholders.
- `locales/*.js`: one `export default { … }` map per locale (same key set, 93
  keys), all with **identical key order**; `locales/index.js` combines them
  into `TRANSLATIONS`.

### `src/utils/`

- `dom.js`: `el(tag, className, text)`, `append`, `debounce`, `eachNode`,
  `toArray`, `isOwnUi(node)` (true inside `.gp-panel-overlay`,
  `.gp-confirm-overlay`, `.gp-toasts`, `.gp-settings-btn`,
  `.gp-viewer-overlay`). `eachNode`/`toArray` exist because DOM collections
  (`NodeList`, `HTMLCollection`, `addedNodes`, `classList`) are **not iterable
  in every engine** a userscript runs in — `for...of` over them throws
  "… is not iterable" there, so iterate DOM collections (and arrays handed in
  from the DOM) with them, never `for...of`.
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
`app.css` is the injected stylesheet (settings entry, panel, controls, confirm,
toasts, viewer), imported by `main.js` and applied as `GM_addStyle` by the
build. Every injected class carries the `gp-` prefix — never add an unprefixed
class to injected UI. Component styles consume tokens via `var(--gp-*)`; raw
hexes belong in `tokens.css` only (the viewer is themed like every other
surface: `--gp-bg-1` stage, `--gp-bg-2` bars).

## Import direction

`utils ← core ← gallery ← features`; `main.js` may import from anywhere but
must not own feature state. Rules that keep it acyclic:

- `core/settings.js` knows nothing about features or the bus — notifying is the
  caller's job.
- `gallery` never imports from `features`; `features/settings` imports the
  gallery registry (`listSources`) but not the gallery wiring.
- `ui/viewer.js` and `ui/toast.js` import only `i18n`, `utils` and `core`
  helpers — they are reusable, not gallery-specific.
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

header button / menu command → `togglePanel(true)` → draft =
deep clone of persisted settings → page `render(container)` mutates the draft →
footer Save → `saveSettings(draft)` → `configureLocale(language)` →
`emit('settings:gallery' | 'settings:toasts' | 'settings:language')` → gallery
repaints its stylesheet, settings entry relabels itself and updates its dot →
success toast → panel closes and `unlockPageScroll()`.

## GitHub DOM notes

- GitHub swaps page content without a full reload (Turbo on modern pages,
  classic `pushState` navigation elsewhere) and re-renders parts of the page
  from React. Never cache DOM references across navigations; re-query from the
  click target. Route new page watchers through `utils/navigation.js`.
- Rendered markdown always lives in a `.markdown-body` container (repository
  README, blob view, wiki, issue, discussion, review comment). That container
  is the gallery set boundary.
- GitHub's header markup changes over time. Keep `HEADER_TARGETS` ordered from
  most to least specific and always insert *next to* GitHub's own actions
  (never replace, move or restyle them), so a header rework degrades to "no
  button" instead of a broken header.
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
| `gallery.enabled` | `true` | Master switch; disabling removes the injected affordance stylesheet |
| `gallery.sources.markdown` | `true` | Per-source switches keyed by source id |
| `gallery.skipBadges` | `true` | Skip badge hosts, emoji and images smaller than `GALLERY_MIN_SIZE_PX` |
| `gallery.upgradeFullSize` | `true` | Probe and load the linked original |
| `gallery.thumbnails` | `true` | Thumbnail strip in the viewer |
| `gallery.loop` | `true` | Wrap around at the ends |
| `gallery.maxZoom` | `8` | Zoom ceiling, clamped to 2…`GALLERY_MAX_ZOOM` |
| `toasts.enabled` | `true` | Master switch for toast notifications |
| `toasts.position` | `'bottom-right'` | Toast corner: `bottom/top` × `right/left` |
| `toasts.duration` | `5000` | Auto-hide ms (`0` = sticky until dismissed) |

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

## Design

All injected UI (settings entry, panel, controls, confirm dialog, toasts,
viewer) follows [DESIGN.md](DESIGN.md) — GitHub's own visual language through
Primer tokens, `gp-`-prefixed classes, colors from `src/styles/tokens.css`.
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
the version badge and the Status line in `README.md` synchronized with the
bumped version. The userscript metadata is generated from `package.json`; run
`npm run build` after every bump so the root `.user.js` / `.meta.js` headers
carry the new version.

## Build and verification

Requires Node.js 22.

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate, also in GitHub Actions)
```

Build facts agents need to know:

- `vite.config.js` declares `entry: src/main.js`, the full `==UserScript==`
  block (names/descriptions in all locales, `match: github.com` +
  `gist.github.com`, `run-at: document-idle`, `noframes`),
  `server.prefix: 'dev:'`, and `build.fileName: github-plus.user.js` with
  `metaFileName: true`. GM grants are auto-detected from the `GM_*` calls in
  the source — do not declare grants, `@connect`, or `@match` entries
  "just in case" (the gallery needs no cross-origin requests).
- `scripts/copy-dist.mjs` copies `ARTIFACT_FILES` from `dist/` to root;
  `verify-artifacts.mjs` enforces byte identity (CI fails on drift).
- `dist/` and `node_modules/` are gitignored; `package-lock.json` is
  committed.

After every source, style, metadata, or version change, run `npm run build` so
the root install artifacts stay synchronized. Before finishing, run `npm run ci`
and check diagnostics for edited files.

## Debugging

- GM storage key: `gp_settings_v1` (`localStorage.gp_settings_v1` in a plain
  browser) — delete it to test a cold start and the defaults.
- Verbose logs: `localStorage.setItem('gp_debug', '1')` or
  `window.__GP_DEBUG__ = true`; failures print with their `GP-####` code even
  without it.
- Gallery does not open on click: check the source is enabled, the click was a
  plain left click (no modifier), the image is inside a `.markdown-body`
  container, and the image is not a badge, emoji or small icon. Inspect
  `#gp-gallery-style` — no stylesheet means no enabled source.
- Viewer shows a smaller image than expected: the page's `src` is what is
  rendered; `fullSrc` only upgrades when the wrapping link points at an image
  file and that file actually loads.
- Header entry missing: check which of `HEADER_TARGETS` exists on the page and
  that `.gp-settings-btn` is inside it. A header rework on GitHub's side is the
  usual cause — extend the list, never restyle GitHub's own header.
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

- Hand-edit `github-plus.user.js` or `github-plus.meta.js`.
- Commit `node_modules/`, `dist/`, or development-only update URLs.
- Add a document-wide MutationObserver or a scan loop; extend the registry and
  the delegated listener instead.
- Carry Steam-era `sp-` identifiers, `SP-####` codes or any external project's
  naming into this repository.
- Break GitHub's header, navigation, or responsive layout — injected UI must
  never restyle page markup outside the gallery's own affordance stylesheet.
- Imply affiliation with GitHub, Inc. in docs or UI copy.
