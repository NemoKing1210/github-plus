# Development

Build, test and release workflow for GitHub Plus. Architecture lives in
[ARCHITECTURE.md](ARCHITECTURE.md), visual rules in [`../DESIGN.md`](../DESIGN.md);
contributor rules and the pull-request process live in
[../CONTRIBUTING.md](../CONTRIBUTING.md).

GitHub Plus is a userscript built with Vite and `vite-plugin-monkey`. The
source is vanilla-JS ESM under `src/`; the two `github-plus.user.js` /
`github-plus.meta.js` files at the repository root are generated build output.

## Requirements

- Node.js 22 (see `.nvmrc`). `package.json` declares `"engines": { "node": ">=20" }`.
- npm (bundled with Node).
- A userscript manager for manual testing: Violentmonkey (recommended, it can
  track a local file) or Tampermonkey.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Installs the three dev dependencies (`vite`, `vite-plugin-monkey`, `terser`). |
| `npm run dev` | Starts the Vite dev server. `vite-plugin-monkey` serves a live copy of the script (its URLs carry the `dev:` prefix) that a manager can install and keep updated while you edit `src/`. |
| `npm run build` | Runs `vite build` into `dist/`, then `node scripts/copy-dist.mjs` copies `dist/github-plus.user.js` and `dist/github-plus.meta.js` to the repository root. |
| `npm run verify:artifacts` | Hashes both root artifacts and the matching files in `dist/` (sha256) and fails when a pair differs — a byte-for-byte comparison. |
| `npm run ci` | `npm run build && npm run verify:artifacts` — the exact gate GitHub Actions runs on every push and pull request to `main`. |
| `npm run preview` | `vite preview`: serves the built output locally. |

`dist/` is git-ignored, but the two root userscript files are not, so a build
that changes them is committed together with the source change. Never hand-edit
them; edit `src/` and rebuild (see [../CONTRIBUTING.md](../CONTRIBUTING.md)).

## Local testing

Install the userscript once, then keep rebuilding.

### Violentmonkey

1. `npm install && npm run build`, then use the manager's **Install from file**
   action on the root `github-plus.user.js`.
2. Enable **Track local file** before closing the install dialog, so the
   manager re-reads the file from disk.
3. Edit `src/`, run `npm run build` again and reload the page — the script
   reloads from the rebuilt file without reinstalling.

### Tampermonkey

Tampermonkey cannot track a local file, so either:

- reinstall the rebuilt `github-plus.user.js` after each build, or
- serve the file over HTTP (e.g. `npm run dev`) and temporarily point
  `@updateURL` / `@downloadURL` at `http://localhost:…`.

Never commit a local update URL: the shipped header must keep the raw GitHub
URLs produced by `vite.config.js` (`https://raw.githubusercontent.com/…`).

## Manual test checklist

Run this before a release and after any change that touches the gallery, the
viewer, the settings panel, the backup page or toasts. All checks are on
`github.com` (the script also matches `gist.github.com`).

### Entry point

- [ ] The settings entry appears in the site header. When the app header is
      missing the button falls back to `#user-links`; a manager that supports
      menu commands also exposes a **GitHub Plus settings** command that opens
      the same panel.
- [ ] The entry survives GitHub's client-side navigation (navigate between
      repository pages and confirm it stays put).
- [ ] Opening the avatar menu shows a **GitHub Plus settings** row right after
      GitHub's own **Settings** row; clicking it closes the menu and opens the
      panel, and the row carries the accent dot while settings differ from
      defaults (same signal as the header button).
- [ ] The row also appears when the menu is opened without a header click
      (keyboard `Enter`/`Space` on the avatar) — that path is the portal-root
      observer, not the click fallback.

### Gallery and viewer

- [ ] Clicking an image in rendered markdown (repository README, a `.md` blob
      view, an issue, a pull request, a comment) opens it in the viewer.
- [ ] `←` / `→` move between the images of the same markdown container;
      `Home` / `End` jump to the ends; the counter reads `n / total`.
- [ ] The thumbnail strip shows the set and clicking a thumbnail jumps to it.
- [ ] `+` / `-` and the wheel zoom; double-click toggles 2×; `0` resets the
      zoom and rotation; `r` rotates; drag pans; `Esc` and a click on the empty
      backdrop close the viewer and restore the page scroll.
- [ ] Badges and tiny images are skipped: with **Skip badges and icons** on, an
      image smaller than 80 px on both axes and an image from a known badge
      host (shields.io, codecov.io, …) never enter the set.
- [ ] The full-size upgrade fires when an image links to a bigger file: a
      markdown image wrapped in a link to a repository `/blob/` file is swapped
      for its `/raw/` version; a link that does not load is dropped instead of
      showing a broken image.
- [ ] With **Image gallery** off, clicking a markdown image behaves like stock
      GitHub and no stylesheet is injected.

### Settings panel

- [ ] The panel opens on the General page with the sidebar listing all four
      pages; switching pages (click and arrow keys) animates the content; the
      language select relabels the panel after Save.
- [ ] Changing any control turns the footer note into "Unsaved changes" with
      an accent dot; undoing the change restores the save hint.
- [ ] **Save** persists the draft, shows the "Settings saved" toast, closes the
      panel and survives a reload.
- [ ] **Reset** asks for confirmation, refills the draft with defaults and
      still requires Save.
- [ ] **Cancel** and an overlay click discard the draft; `Esc` closes
      the panel (exit animation, then the overlay is removed). While the viewer
      is open it keeps `Esc` for itself. At <= 640px the sidebar becomes a
      horizontal tab strip.

### Backup

- [ ] **Export → Download file** writes `github-plus-settings-<date>.json`;
      **Copy to clipboard** copies the same JSON.
- [ ] **Import** of an exported JSON applies and saves immediately (no Save
      step) and shows the "Settings imported" toast.
- [ ] Pasting invalid JSON shows "Paste a valid settings JSON first." without
      changing anything.

### Toasts

- [ ] A toast appears in the configured corner (**General → Position on
      screen**: bottom-right by default, plus bottom-left, top-right,
      top-left).
- [ ] Auto-hide follows **Auto-hide after (seconds)**; `0` keeps the toast
      until dismissed; hovering pauses its timer.
- [ ] Turning **Toast notifications** off makes toasts a silent no-op.

## Debugging

Verbose tracing is off by default. Turn it on from the page console:

```js
localStorage.setItem('gp_debug', '1'); // persists across reloads
window.__GP_DEBUG__ = true;            // this page load only
```

`logInfo` traces print only in verbose mode; `logError` and `logWarn` always
print. The flag is read from `localStorage` (not from GM storage), so set it in
the page console of the github.com tab where the script runs.

Every failure carries a stable `GP-####` code — grep the repository for the
code to jump to the throw site. The codes come from `src/core/debug.js`:

| Code | Name | Meaning |
|---|---|---|
| `GP-1001` | `BUS_LISTENER` | A bus listener threw while handling an event. |
| `GP-1002` | `SETTINGS_PERSIST` | Persisting settings to GM storage failed. |
| `GP-1003` | `SETTINGS_LOAD` | Reading settings from GM storage failed. |
| `GP-1004` | `SETTINGS_IMPORT` | Importing a settings backup failed (invalid payload). |
| `GP-1101` | `GALLERY_FAILED` | Collecting or opening a gallery failed (logged once at the click). |
| `GP-1102` | `GALLERY_SOURCE` | A registered gallery source threw while collecting its images. |
| `GP-1103` | `GALLERY_IMAGE` | A gallery image failed to load in the viewer. |
| `GP-1201` | `UI_MOUNT` | Mounting the settings entry or panel failed. |

Settings persist under the key `gp_settings_v1` (`SETTINGS_KEY` in
`src/core/constants.js`): via `GM_setValue` when the manager provides it,
otherwise via `localStorage`. Delete that key for a cold start:

- localStorage-backed install: clear it in the page console —
  `localStorage.removeItem('gp_settings_v1')`.
- GM storage: delete the script's stored value from the manager dashboard.

## Configuration

- `src/core/constants.js` holds the defaults and limits: `SETTINGS_KEY`, the
  `gp-` class prefix, `GALLERY_MAX_IMAGES` (500), `GALLERY_MIN_SIZE_PX` (80),
  `ZOOM_OPTIONS`, `BADGE_HOSTS`, `IMAGE_EXTENSIONS`, `TOAST_POSITIONS`,
  `TOAST_MAX_DURATION_MS`, and `DEFAULT_SETTINGS` / `getDefaults()`.
- `src/i18n/locales/*.js` holds the UI strings, one file per locale (ten in
  total). New strings go into all ten files — see the localization rule in
  [../CONTRIBUTING.md](../CONTRIBUTING.md). The localized `@name` /
  `@description` metadata lives in `vite.config.js`.

## Releasing

1. Bump `version` in `package.json`.
2. Run `npm install` to refresh `package-lock.json`.
3. Add the release entry to `CHANGELOG.md` (Keep a Changelog format).
4. Run `npm run build` to regenerate the root `github-plus.user.js` and
   `github-plus.meta.js` with the new version.
5. Run `npm run ci` — build plus `verify:artifacts`; it must pass before the
   commit is pushed.
