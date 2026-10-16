# GitHub Plus

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

A userscript that improves GitHub with a full settings panel and an image
gallery for rendered markdown — read every picture of a README, wiki page,
issue or comment in one fullscreen viewer instead of opening files one by one.

> **Status:** early (`0.1.0`). Settings panel (General · Gallery · Backup ·
> About) and the markdown image gallery. More GitHub improvements planned.

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
  renders `.markdown-body`) — and it opens fullscreen in the built-in viewer.
- **Browse the whole set** — `←`/`→` (or the arrows, or a swipe) walk the other
  images of the same container, a thumbnail strip jumps anywhere, and the
  counter shows where you are.
- **Zoom and pan** — wheel, `+`/`−`, double click and pinch zoom up to the
  configured ceiling; drag to move; `0` resets; `r` rotates; the neighbouring
  images are preloaded so browsing feels instant.
- **Full size on demand** — when an image links to a bigger file (a repository
  file behind a `/blob/` page, an uploaded attachment, any image URL), that
  file is probed and swapped in, so you get the original resolution without a
  broken image if it is unavailable.
- **Quiet by default** — badges, status snippets, emoji and tiny icons never
  take a gallery slot, and modified clicks (Ctrl/Cmd/Shift/Alt) plus middle
  clicks are left to GitHub, so opening a file in a new tab still works exactly
  as before.
- **Theme aware** — the viewer chrome is deliberately dark (a light stage
  washes out image colors); the settings panel adopts whichever GitHub theme
  you run.

### Settings panel

Open it from the image button in the GitHub header (or the userscript
manager's menu command). Changes are draft-based: nothing is stored until you
press **Save**; **Cancel**, the overlay click and `Escape` discard the draft;
**Reset to defaults** asks for confirmation first.

## Settings

Stored under `gp_settings_v1`.

| Key | Default | Notes |
|-----|---------|-------|
| `language` | `'auto'` | Settings-panel UI language (`'auto'` follows the browser) |
| `gallery.enabled` | `true` | Master switch for the markdown image gallery |
| `gallery.sources.markdown` | `true` | Per-source switch (one entry per registered source) |
| `gallery.skipBadges` | `true` | Skip badge services, emoji and images smaller than 80 px on both axes |
| `gallery.upgradeFullSize` | `true` | Probe and load the linked full-size original |
| `gallery.thumbnails` | `true` | Thumbnail strip in the viewer |
| `gallery.loop` | `true` | Wrap around from the last image to the first |
| `gallery.maxZoom` | `8` | Zoom ceiling (2× … 16×) |
| `toasts.enabled` | `true` | Toast notifications |
| `toasts.position` | `'bottom-right'` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `toasts.duration` | `5000` | Auto-hide delay in ms (`0` keeps a toast until dismissed) |

## How the gallery is built

The gallery is a small framework plus one source per place images live, so
adding a new place never touches the gallery itself:

| File | Role |
|------|------|
| `src/ui/viewer.js` | The lightbox: `openViewer({ images, index, loop, thumbnails, minZoom, maxZoom, resolveImage, labels, onClose })`, plus `closeViewer()` / `isViewerOpen()`. Self-contained — it can be reused by any feature. |
| `src/gallery/sources.js` | Source registry: `registerSource`, `listSources`. |
| `src/gallery/collect.js` | Collection: normalization, filtering (badges/emoji/small icons), de-duplication, cap. |
| `src/gallery/index.js` | Wiring: one capture-phase click listener, the generated cursor affordance stylesheet, settings listener. |
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
```

Edit files under `src/` only — `github-plus.user.js` and
`github-plus.meta.js` are generated. See
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for testing and debugging,
[CONTRIBUTING.md](CONTRIBUTING.md) for the rules,
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the module map and data flow,
and [DESIGN.md](DESIGN.md) before touching any visible element.

## License

[MIT](LICENSE).

An independent project, not affiliated with GitHub, Inc.
