# GitHub Plus

**English** · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.32.0-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

A userscript that improves GitHub with a full settings panel, a `Ctrl/⌘+K`
command palette, an image gallery for rendered markdown, colored file icons
wherever GitHub lists files, blame-style age colors for those files, expandable
folders in the repository listing, file sizes with one-click downloads, a
context menu for file and folder actions, a quick preview for any file,
Conventional
Commit badges on commit subjects, and on-page translation of markdown, comments,
commits and titles.

> **Status:** early (`0.32.0`). Settings panel with instant search (General ·
> Gallery · Files · Commits · Translation · Palette · Backup · About), a
> `Ctrl/⌘+K`
> command palette, the markdown image gallery, colored file icons, blame-style
> file age colors, expandable folder rows, file sizes with download buttons, a
> file and folder context menu, a quick file preview, Conventional Commit badges,
> and
> on-page translation. More GitHub improvements
> planned.

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

### Expandable folders

A repository listing shows only one level at a time, so following a path means
a full page load per folder. GitHub Plus turns the listing into a tree:

- **One click to look inside** — every folder row leads with a chevron; the
  folder's contents appear directly under it as ordinary rows, indented one
  step per level, and the same chevron collapses them again. Nested folders
  expand the same way, as deep as you go.
- **The folder name still navigates** — only the chevron expands, so a plain
  click on the name opens the folder exactly as before; the chevron is a real
  button (`aria-expanded`, a label per folder) and keyboard-operable.
- **Everything else keeps working** — nested rows are GitHub-shaped, so the
  file icons, blame-style age colors, sizes, download buttons, quick preview
  (with previous/next staying inside the folder) and the file context menu all
  work on them without a second thought.
- **Dates and messages included** — each nested row shows its last commit
  message and the age color, read from the same session as the page, so
  private repositories work and no API token is spent.
- **Honest limits** — an empty folder says so, a folder over 1000 entries shows
  its first 1000 with a note, and a failed request leaves the folder collapsed
  with a toast instead of a half-rendered tree.
- **Quiet** — disabling the feature removes every chevron and nested row,
  leaving stock GitHub; a navigation starts with every folder collapsed again.

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

### File and folder context menu

Right-clicking a file or folder is the fastest path to what you want to do with
it — and GitHub's own menu does not offer any of it. GitHub Plus replaces it for
files and folders:

- **Quick actions** — right-click a file in a repository listing, in the file
  tree sidebar or a file link in rendered markdown for **Open**, **Open in new
  tab**, **Download**, **Copy contents**, **Copy link**, **Copy path** and
  **Copy name**. On a file or blame page the same menu appears (without
  **Open**, since you are already there).
- **Folders too** — a folder row in the listing or the sidebar tree, or a folder
  link in rendered markdown, gets its own shorter menu: **Open**, **Open in new
  tab**, **Copy link**, **Copy path** and **Copy name**. There is nothing to
  download or read in a folder, so those actions are left out.
- **Expand from the menu** — a folder in the repository listing also offers
  **Expand** or **Collapse**: the same disclosure as the row's chevron, without
  having to hit it.
- **Copy the contents** — a text file's contents go straight to the clipboard
  without opening the page; binary files and anything over 1 MiB are refused
  with a clear toast instead of pasting garbage or freezing the tab.
- **Copy the path** — the repository-relative path (`src/main.js`), ready to
  paste into a terminal, an import or a link.
- **Copy the name** — just the entry's own name (`src`, `README.md`), for an
  import, a commit message or a search.
- **Only where it helps** — the native menu stays untouched for submodules,
  images, media and ordinary links (including markdown links that point at no
  repository file); a right-click you did not aim at a file or folder behaves
  exactly as before.
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

### Commit badges

Conventional Commit subjects get their `type(scope):` prefix rendered as a
single token on the page:

- **One two-tone token** — the type sits in a colored segment and the scope in
  a muted one inside one rounded outline, with a muted colon after it, so
  `fix(parser): handle empty input` reads at a glance without changing a
  character of the subject.
- **Colored by kind, honest about the rest** — `feat`, `fix`, `docs`, `style`,
  `refactor`, `perf`, `test`, `build`, `ci`, `chore` and `revert` each get their
  own color; other lowercase types get a neutral one (and can be left plain),
  and a `!` prefix shows a red breaking-change marker.
- **Everywhere GitHub shows a subject** — the commit history, a pull request's
  **Commits** tab, the single-commit page, the repository home's latest-commit
  block and the classic commit views. The text is unchanged, so copy, search
  and translation behave exactly as before, and turning the feature off
  restores GitHub's own rendering.

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
- **Plain-text files too** — license and notice files shown as code (LICENSE,
  COPYING) get the same button; the translation appears under the file, and the
  code itself is never rewritten.
- **Six providers** — free Google by default (no key, unofficial and
  rate-limited), or DeepL, Microsoft, Yandex, an OpenAI-compatible endpoint or
  your own LibreTranslate instance. Translated text is sent to the selected
  provider; API keys stay in this browser, so a settings backup contains them.
- **Cached** — a translation is reused for 24 hours by default (configurable;
  0 disables it) and can be cleared from the settings page.

### Command palette

Press `Ctrl/⌘+K` anywhere on GitHub for one search field over everything you do
there:

- **Starts where you are** — on a repository page the palette opens with that
  repository already in its path, so the first list is that repository's pages.
- **Drill down with `Tab`** — the field is a path (`owner / repo / folder /
  query`). Press `Tab` on a repository row to add it, and `Tab` again on a
  folder row to step inside it: the list becomes that folder's files, with
  paths relative to where you are, and `Tab` keeps going as deep as the tree
  allows. `→` and `←` do the same on an empty field, so you can walk the path
  without leaving the arrow keys. `Backspace` removes the last level,
  `Ctrl/⌘+Backspace` clears the path and the query, and clicking a path segment
  leaves everything below it.
- **Your repositories** — every repository you own, owned ones first, with
  stars, language, last push and visibility on the row. Type `@` to search
  repositories only.
- **Starred repositories** — the projects you keep coming back to, merged after
  your own and marked with a star.
- **Files in the repository in the path** — type `/` for every path there, or a
  query that matches one; folder rows are marked and can be opened as a level
  with `Tab`, and a file opens on GitHub at the ref you are browsing.
- **Open issues and pull requests** — type `#` for the repository's open issues
  and pull requests, marked with an issue or pull-request badge and carrying the
  author and update time; search them by title, number or author. Press `Tab` on
  the repository's Issues or Pull requests row to read that list as its own
  level, with no `#` needed.
- **Forgiving matching** — queries ignore case and Latin accents (`cafe` finds
  `Café`), prefer word starts and whole words, and split on spaces with every
  term required, so a few letters in the right places are enough.
- **Pages as rows** — the scoped repository's own pages (Code, Issues, Pull
  requests, New issue, Compare changes, Actions, Projects, Discussions,
  Releases, Wiki, Security, Insights and Settings when you own it) or, at the
  root, your account's pages (profile, repositories, stars, new repository,
  notifications, gists, GitHub settings, dashboard), each one row away; a
  repository row is hinted `Jump to`, and a GitHub search row closes every
  query — code inside a repository path, issues for `#`, repositories for `@`
  and for a free query outside a path.
- **GitHub Plus actions** — open the panel, toggle its features or refresh the
  cache; type `>` for commands.
- **Favorites and recents** — pin what you use constantly (`Alt+P`); pinned
  rows carry a star and come first, on the empty list and on typed queries, and
  recently opened rows come back to the top on the next open, per GitHub
  account.
- **Actions on any row** — right-click a row or press `Shift+F10` to open it,
  open it in a new tab, copy its link, path, clone address or issue number, and
  pin or unpin it.
- **Fast and quiet** — the palette renders the cached list instantly, refreshes
  it in the background and keeps your selection in place. Results are cached
  with ETags for the session and across reloads, so browsing the palette does
  not burn API quota; without a token it reads public data and every command
  still works.
- **Optional GitHub token** — add one on the palette's settings page to see
  private repositories and complete lists (5,000 requests per hour instead of
  60). The token is verified before use, stored only in this browser, never
  written to a backup export, sent only to `api.github.com`, and cached data is
  kept per account, so switching accounts never shows another account's
  repositories.
- **Keyboard first** — `↑`/`↓` move, `Enter` opens, `Ctrl/⌘+Enter` opens in a
  new tab, `Tab` drills into a repository, folder or issue list, `←`/`→` walk the path,
  `Backspace` leaves a path level,
  `Alt+P` pins, `Ctrl/⌘+C` copies the row, `?` shows every key and prefix, and
  `Esc` closes (help first); the palette stays out of the way while you type in
  a comment or README editor, and closes itself on navigation. The shortcut is
  a preset or any combination you record on the palette's settings page.

### Settings panel

Open it from the **GitHub Plus settings** row in your avatar menu (right under
GitHub's own **Settings**), from the palette's settings command, or from the
userscript manager's menu command. Changes are draft-based: nothing is
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
| `logging.enabled` | `false` | Console diagnostics with GP codes, module, details and stack; off by default |
| `fileIcons.enabled` | `true` | Master switch for file and folder icons |
| `fileIcons.folders` | `true` | Folder-specific icons for common folder names |
| `fileIcons.specialNames` | `true` | Dedicated icons for well-known filenames |
| `fileAges.enabled` | `true` | Master switch; blame-style age colors for listed files |
| `fileAges.folders` | `true` | Color folder rows too |
| `fileMeta.enabled` | `true` | Master switch for file sizes and download buttons |
| `fileMeta.sizes` | `true` | Show each file's size in repository listings |
| `fileMeta.download` | `true` | Download button in the repository file listings |
| `fileMenu.enabled` | `true` | Master switch for the file and folder context menu |
| `filePreview.enabled` | `true` | Master switch for the quick file preview |
| `filePreview.rowButton` | `true` | Eye button in repository listing rows (the context menu always offers **Preview**) |
| `filePreview.longPress` | `true` | Hold the left mouse button on a file name or a markdown file link to open the preview |
| `filePreview.longPressMs` | `450` | Hold time in ms before the preview opens (200–2000) |
| `filePreview.longPressRing` | `true` | Progress circle at the pointer while holding |
| `folderTree.enabled` | `true` | Master switch for expandable folder rows in repository listings |
| `commitBadges.enabled` | `true` | Master switch for Conventional Commit badges |
| `commitBadges.unknownTypes` | `true` | Style lowercase types outside the conventional set too |
| `commitBadges.breaking` | `true` | Red marker for a `!` breaking-change prefix |
| `translate.enabled` | `true` | Master switch for on-page translation |
| `translate.provider` | `'google'` | `google` (free), `deepl`, `microsoft`, `yandex`, `openai`, `libretranslate` |
| `translate.providerConfig.<id>` | per provider | Credentials and endpoint per provider (API key, region, folder, model, URL) |
| `translate.targetLang` | `'auto'` | `'auto'` follows the settings language, or any offered language code |
| `translate.mode` | `'button'` | `button` translates on click; `auto` translates blocks as they scroll into view |
| `translate.display` | `'replace'` | `replace` swaps the text in place; `below` adds the translation under the original |
| `translate.reveal` | `'button'` | Replace mode: `button` shows **Show original**; `hover` peeks at the source on hover or focus |
| `translate.linkLabels` | `true` | Translate the text of links too |
| `translate.surfaces.<id>` | `true` | Per-place switches: `markdown`, `plaintext`, `commits`, `titles`, `preview` |
| `translate.cacheHours` | `24` | Cache lifetime in hours (0 disables the cache) |
| `commandPalette.enabled` | `true` | Master switch for the `Ctrl/⌘+K` command palette |
| `commandPalette.shortcut` | `'mod+k'` | `mod+k`, `mod+shift+k`, `mod+space`, `alt+k`, `off`, or a combination recorded on the settings page |
| `commandPalette.token` | `''` | Optional GitHub token for private repositories and higher limits (sent only to `api.github.com`, never exported) |
| `commandPalette.sources.<id>` | `true` | Per-source switches: `commands`, `repositories`, `starred`, `files`, `issues`, `recent` |
| `commandPalette.sources.issues` | `true` | Open issues and pull requests of the current repository |
| `commandPalette.hideForks` | `false` | Hide forked repositories |
| `commandPalette.hideArchived` | `false` | Hide archived repositories |
| `commandPalette.cacheHours` | `6` | Repository and file-tree cache lifetime in hours (0 disables the cache) |
| `commandPalette.maxResults` | `30` | Maximum number of rows in a result set (10–100) |

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
