# GitHub Plus

**English** · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.18.6-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

A userscript that improves GitHub with a full settings panel, an image gallery
for rendered markdown, colored file icons wherever GitHub lists files,
blame-style age colors for those files, file sizes with one-click downloads,
a context menu for file actions, a quick preview for any file, and on-page
translation of markdown, comments, commits and titles.

> **Status:** early (`0.18.6`). Settings panel with instant search (General ·
> Gallery · Files · Translation · Backup · About), the markdown image gallery,
> colored file icons, blame-style file age colors, file sizes with download
> buttons, a file context menu, a quick file preview, and on-page translation.
> More GitHub improvements planned.

> The script's `@updateURL` / `@downloadURL` point at GitHub `main` — the raw
> install URL below is always the newest build.

## Quick install

1. Install a userscript manager ([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/), or
   [ScriptCat](https://scriptcat.org/) recommended).
2. Install from GitHub (raw URL below).

**Install URL (GitHub — newest):**

```
https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)

### Install from URL (dashboard)

| Manager | Path |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| Greasemonkey | Add-on menu → **New User Script** → paste the raw URL |
| ScriptCat | Install the [extension](https://scriptcat.org/), then **Install from URL** with the GitHub raw URL |

### Manual install

1. Open the built [`github-plus.user.js`](https://github.com/NemoKing1210/github-plus/blob/main/github-plus.user.js) in this repository (or run `npm run build` after cloning).
2. Copy the entire file contents.
3. In your userscript manager, create a new script and paste the code.
4. Save and enable the script.

## Updates

The script includes `@updateURL` and `@downloadURL` metadata pointing to the
raw GitHub file, so supported managers update it automatically.

Release steps for maintainers: see [docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing).

## Features

### Image gallery for markdown

Every rendered markdown container on GitHub is one gallery set:

- **Click any image** — in a repository README, a blob view of a `.md` file, a
  wiki page, an issue, a pull request, a review comment (anywhere GitHub
  renders `.markdown-body`) or in the quick preview's rendered markdown — and it
  opens fullscreen in the built-in viewer.
- **Browse the whole set** — `←`/`→` (or the arrows) walk the other images of
  the same container, a centered thumbnail strip jumps anywhere, and the
  counter shows where you are.
- **Zoom and pan** — wheel, `+`/`−`, double click and pinch zoom up to the
  configured ceiling; drag to move the image at any zoom; `0` resets; `r`
  rotates; the neighbouring images are preloaded so browsing feels instant.
- **Full size on demand** — when an image links to a bigger file (a repository
  file behind a `/blob/` page, an uploaded attachment, any image URL), that
  file is probed and swapped in, so you get the original resolution without a
  broken image if it is unavailable.
- **Download what you see** — hover a markdown image for a download button, or
  use the one in the viewer toolbar; the file is saved under its own name (a
  proxied address is unwrapped to the original filename), and one setting hides
  both buttons.
- **Quiet by default** — badges, status snippets, emoji and tiny icons never
  take a gallery slot; images keep GitHub's own look (only the cursor hints
  that they open the gallery), and modified clicks (Ctrl/Cmd/Shift/Alt) plus
  middle clicks are left to GitHub, so opening a file in a new tab still works
  exactly as before.
- **Theme aware** — the gallery and the settings panel render with GitHub's own
  color variables, so both follow whichever theme you run (light, dark,
  dimmed).

### File icons

GitHub draws every file and folder with the same grey glyph, so a `.ts` and a
`.css` look identical until you read the name. GitHub Plus colors them:

- **Type by extension** — languages, config and data formats, images, media,
  archives and documents get their own icon; multi-part extensions such as
  `.d.ts` and `.spec.ts` are matched before the base extension.
- **Known filenames** — `Dockerfile`, `package.json`, `README`, `.gitignore`,
  `tsconfig.json` and friends get a dedicated icon.
- **Folder roles** — `src`, `dist`, `node_modules`, `docs`, `.github`,
  `components`, `utils` and other common folders are marked too.
- **Everywhere GitHub lists files** — the repository tree and subfolders, the
  file tree sidebar on code pages, the file header of blob, tree and blame
  pages, pull request file headers and the diff tree, commit file lists,
  code search, gists and release assets.
- **Quiet** — the native GitHub glyph is hidden and replaced in place; no
  layout changes, no extra borders, and disabling the feature restores stock
  GitHub exactly.

Icons are a curated subset of
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
(MIT); attribution is in [THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

### File ages

GitHub already shows how long ago each file last changed, but every date looks
the same at a glance. GitHub Plus borrows the blame legend and colors the date
text itself:

- **One glance, one age** — the newest dates are warm (`#ffd78d` in the dark
  theme, attention gold in the light one) and older dates fade to the theme's
  muted grey, so a four-month-old file already reads as old. The scale is
  deliberately front-loaded: days, weeks and months stay distinct while
  anything over a year is plain grey, and each theme gets its own ramp so the
  color stays strong and readable in both.
- **Nothing moved** — the date keeps GitHub's own text, relative wording and
  tooltip; only its color changes, so no row is resized and the accessible
  label is exactly what GitHub rendered.
- **Files and folders** — folder rows are colored too (their last change is
  what the date means), and one setting limits the feature to files.
- **Quiet** — disabling the feature restores GitHub's own date color and leaves
  no trace.

### File sizes and downloads

GitHub's directory listing shows when a file last changed but not how big it is,
and saving one means opening it first. GitHub Plus adds both to the file rows:

- **Size at a glance** — every file in a repository listing gets a muted size in
  its own column. Sizes are fetched only for rows near the viewport, cached for
  the session, and a file whose size cannot be read simply shows none.
- **Download in place** — every file row shows its size at the left edge of
  the column and, at its right edge, a download button in GitHub's icon-button
  style. The file is saved under its own name; the same-origin raw route keeps
  private repositories working, and a blocked fetch falls back to opening the
  file in a new tab. GitHub's own blob page already shows a size and a download
  button, so it is left untouched.
- **No API quota** — sizes come from a HEAD request on the file's own raw
  address, not the GitHub API, so the anonymous 60-requests-per-hour limit is
  never touched.
- **Quiet** — folder rows keep an empty cell; disabling the feature removes
  every size, button and cell, leaving stock GitHub.

### File context menu

Right-clicking a file is the fastest path to what you want to do with it — and
GitHub's own menu does not offer any of it. GitHub Plus replaces it for files:

- **Quick actions** — right-click a file in a repository listing, in the file
  tree sidebar or a file link in rendered markdown for **Open**, **Open in new
  tab**, **Download**, **Copy contents**, **Copy link** and **Copy path**. On a
  file or blame page the same menu appears (without **Open**, since you are
  already there).
- **Copy the contents** — a text file's contents go straight to the clipboard
  without opening the page; binary files and anything over 1 MiB are refused
  with a clear toast instead of pasting garbage or freezing the tab.
- **Copy the path** — the repository-relative path (`src/main.js`), ready to
  paste into a terminal, an import or a link.
- **Only where it helps** — the native menu stays untouched for folders,
  images, media and ordinary links (including markdown links that point at no
  repository file); a right-click you did not aim at a file behaves exactly as
  before.
- **Keyboard too** — the context-menu key opens the same menu at the file's
  link, with full arrow-key navigation and focus restored on close; turning the
  feature off restores the browser's menu everywhere.

### Quick file preview

Open any file without leaving the page — from the eye button in a repository
listing, from a file link in rendered markdown, or from **Preview** in the file
context menu:

- **Rendered, not raw** — markdown is rendered and sanitized, source files get
  syntax highlighting and line numbers, images, video and audio play in place,
  and PDFs open in the browser's own viewer when GitHub's page policy allows
  the frame. Anything else — including a PDF the page blocks — gets an honest
  card with **Open on GitHub** and **Download** instead of a broken frame.
- **Move through the folder** — files in the same directory become a set:
  previous/next buttons and the arrow keys step between them, with the current
  position in the footer.
- **Hold to preview** — hold the left mouse button on a file name in a listing
  or on a file link in rendered markdown (including markdown already open in
  the preview) to open its preview; the hold time (450 ms by default) and the
  progress circle at the pointer are both configurable, a quick click still
  opens the file, and dragging or selecting text cancels.
- **Actions in the header** — open the file on GitHub, copy its raw contents,
  link or path, or download it under its own name.
- **Markdown preview or source** — a segmented control switches rendered
  markdown to its original text, highlighted as markdown.
- **Safe with private repositories** — relative images and links resolve
  through the same-origin raw route, so a private README keeps its pictures;
  markdown is sanitized, and every external image loads without a referrer.
- **Honest limits** — text and markdown up to 2 MiB, PDFs up to 25 MiB, and
  highlighting capped so a huge file cannot freeze the tab; over the limit the
  card points at GitHub and the raw file.

### Translation

Translate the text a page shows without losing its markup — a README, an
issue or discussion, a pull request, a comment, commit messages, a title, or
the markdown file open in the quick preview:

- **A button where the text lives** — in the README file header, a comment's
  action row, a commit or an issue title. Where GitHub has no header to host it,
  a small bar appears above the text instead.
- **Markup survives** — links, images, inline code, task-list checkboxes and
  emphasis keep working: translation replaces text blocks, never the structure
  around them.
- **Button or automatic** — the default waits for your click and sends nothing
  anywhere; the automatic mode translates a block when it scrolls into view and
  keeps its **Show original** button.
- **In place or below** — replace the source or show the translation under it;
  **Show original** restores the exact text, and hover reveal peeks at it while
  the pointer or focus is inside the block.
- **Six providers** — free Google by default (no key, unofficial and
  rate-limited), or DeepL, Microsoft, Yandex, an OpenAI-compatible endpoint or
  your own LibreTranslate instance. Translated text is sent to the selected
  provider; API keys stay in this browser, so a settings backup contains them.
- **Cached** — a translation is reused for 24 hours by default (configurable;
  0 disables it) and can be cleared from the settings page.

### Settings panel

Open it from the gear button in the GitHub header, from the **GitHub Plus
settings** row in your avatar menu (right under GitHub's own **Settings**), or
from the userscript manager's menu command. Changes are draft-based: nothing is
stored until you press **Save**; **Cancel**, the overlay click and `Escape`
discard the draft; **Reset to defaults** asks for confirmation first.

## Settings

Stored under `gp_settings_v1`.

| Key | Default | Notes |
|-----|---------|-------|
| `language` | `'auto'` | Settings-panel UI language (`'auto'` follows the browser) |
| `gallery.enabled` | `true` | Master switch for the markdown image gallery |
| `gallery.sources.markdown` | `true` | Per-source switch (one entry per registered source) |
| `gallery.skipBadges` | `true` | Skip badge services (including badges behind GitHub's camo proxy and Actions status badges), emoji, images ≤ 40 px tall and images smaller than 80 px on both axes |
| `gallery.upgradeFullSize` | `true` | Probe and load the linked full-size original |
| `gallery.download` | `true` | Download button in the viewer and on hovered markdown images |
| `gallery.thumbnails` | `true` | Thumbnail strip in the viewer |
| `gallery.loop` | `true` | Wrap around from the last image to the first |
| `gallery.maxZoom` | `8` | Zoom ceiling (2× … 16×) |
| `toasts.enabled` | `true` | Toast notifications |
| `toasts.position` | `'bottom-right'` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `toasts.duration` | `5000` | Auto-hide delay in ms (`0` keeps a toast until dismissed) |
| `fileIcons.enabled` | `true` | Master switch for file and folder icons |
| `fileIcons.folders` | `true` | Folder-specific icons for common folder names |
| `fileIcons.specialNames` | `true` | Dedicated icons for well-known filenames |
| `fileAges.enabled` | `true` | Master switch; blame-style age colors for listed files |
| `fileAges.folders` | `true` | Color folder rows too |
| `fileMeta.enabled` | `true` | Master switch for file sizes and download buttons |
| `fileMeta.sizes` | `true` | Show each file's size in repository listings |
| `fileMeta.download` | `true` | Download button in the repository file listings |
| `fileMenu.enabled` | `true` | Master switch for the file context menu |
| `filePreview.enabled` | `true` | Master switch for the quick file preview |
| `filePreview.rowButton` | `true` | Eye button in repository listing rows (the context menu always offers **Preview**) |
| `filePreview.longPress` | `true` | Hold the left mouse button on a file name or a markdown file link to open the preview |
| `filePreview.longPressMs` | `450` | Hold time in ms before the preview opens (200–2000) |
| `filePreview.longPressRing` | `true` | Progress circle at the pointer while holding |
| `translate.enabled` | `true` | Master switch for on-page translation |
| `translate.provider` | `'google'` | `google` (free), `deepl`, `microsoft`, `yandex`, `openai`, `libretranslate` |
| `translate.providerConfig.<id>` | per provider | Credentials and endpoint per provider (API key, region, folder, model, URL) |
| `translate.targetLang` | `'auto'` | `'auto'` follows the settings language, or any offered language code |
| `translate.mode` | `'button'` | `button` translates on click; `auto` translates blocks as they scroll into view |
| `translate.display` | `'replace'` | `replace` swaps the text in place; `below` adds the translation under the original |
| `translate.reveal` | `'button'` | Replace mode: `button` shows **Show original**; `hover` peeks at the source on hover or focus |
| `translate.linkLabels` | `true` | Translate the text of links too |
| `translate.surfaces.<id>` | `true` | Per-place switches: `markdown`, `commits`, `titles`, `preview` |
| `translate.cacheHours` | `24` | Cache lifetime in hours (0 disables the cache) |

## How the gallery is built

The gallery is a small framework plus one source per place images live, so
adding a new place never touches the gallery itself:

| File | Role |
|------|------|
| `src/ui/viewer.js` | The lightbox: `openViewer({ images, index, loop, thumbnails, download, minZoom, maxZoom, resolveImage, labels, onClose })`, plus `closeViewer()` / `isViewerOpen()`. Self-contained — it can be reused by any feature. |
| `src/gallery/sources.js` | Source registry: `registerSource`, `listSources`. |
| `src/gallery/collect.js` | Collection: normalization, filtering (badges/emoji/small icons), de-duplication, cap. |
| `src/gallery/index.js` | Wiring: one capture-phase click listener, the generated cursor affordance stylesheet, delegated hover listeners for the download button, settings listener. |
| `src/gallery/sources/markdown.js` | The markdown source: containers, image lookup, full-size resolution. |

Because the affordance is CSS built from the registry and the click handling is
a single delegated listener that walks the live DOM, the gallery keeps working
across GitHub's client-side navigation and React re-renders without a scan loop
or per-image bookkeeping.

### Adding a source

```js
import { registerSource } from '../sources.js';

registerSource({
  id: 'mySurface',            // also the settings switch key (gallery.sources.mySurface)
  labelKey: 'source.mySurface',
  hintKey: 'source.mySurfaceDesc',
  containerSelector: '.my-surface',   // one container = one gallery set
  cursorSelector: '.my-surface img',  // gets cursor: zoom-in while enabled
  collect(container) {
    // return [{ node, src, alt?, title?, href? }]
  },
  resolveFull(item) {
    // return the best full-size URL for item, or '' when unknown
  },
});
```

Then add the switches in four places together: the source module + its import,
`DEFAULT_GALLERY.sources.<id>` in `src/core/constants.js`, and the
`source.<id>` / `source.<id>Desc` keys in **all ten**
`src/i18n/locales/*.js` files. The settings panel picks the new source up from
the registry automatically.

## Development

Requires Node.js 22 (see `.nvmrc`).

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate)
npm run icons:build        # regenerate the embedded icon subset
npm test                   # Node test runner (unit tests)
```

Edit files under `src/` only — `github-plus.user.js` and
`github-plus.meta.js` are generated. See
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for testing and debugging,
[CONTRIBUTING.md](CONTRIBUTING.md) for the rules,
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the module map and data flow,
and [DESIGN.md](DESIGN.md) before touching any visible element.

## License

[MIT](LICENSE).

Bundled file icons come from Material Icon Theme (MIT); see
[THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

An independent project, not affiliated with GitHub, Inc.
