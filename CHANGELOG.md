# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.18.6] - 2026-11-16

### Fixed

- A Translate button left in the shared file header after switching markdown
  files now translates the file currently on the page instead of the detached
  content of the previous one; the click resolves the live container under the
  same header

[0.18.6]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.18.6

## [0.18.5] - 2026-11-16

### Changed

- The translation status no longer names the source language a translation was
  detected from; a successful run clears the status and leaves only the
  Translate / Show original control

### Fixed

- Markdown opened in the quick preview now behaves like page markdown: its
  images open the custom gallery, file links support hold-to-preview and the
  file context menu, and the viewer/hold feedback paint above the preview
  overlay. `Escape` closes the viewer first, leaving the preview open for the
  next press
- The Translate action in the quick preview is offered only for a rendered
  markdown file and disappears in source mode or when the preview moves to a
  file of another kind
- Switching between markdown files on a repository page no longer stacks one
  Translate button in the shared file header for every visited file: a
  detached container is now torn down together with its control

[0.18.5]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.18.5

## [0.18.4] - 2026-11-16

### Fixed

- The Translate action no longer adds a status bar above the container when it
  sits in a page header; progress, the detected language and failures are
  reported through the button's own tooltip instead, so the header row gains
  no extra block. The fallback bar remains only where GitHub exposes no header

[0.18.4]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.18.4

## [0.18.3] - 2026-11-16

### Changed

- The Translation settings page keeps its hints, usage line and Clear cache
  button off the card borders, and the cache card shows its fill level as a
  progress bar against the size budget

[0.18.3]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.18.3

## [0.18.2] - 2026-11-16

### Changed

- The Translate action for a repository README now sits in GitHub's README
  header slot beside the Edit and Outline controls and adopts that row's
  button styling, instead of appearing in the fallback bar above the file;
  the action is restored if a header re-render drops it

[0.18.2]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.18.2

## [0.18.1] - 2026-11-16

### Fixed

- Translation sent inline markup (links, images, inline code, task-list
  checkboxes) to the provider stripped of its placeholders, so the elements
  were reattached at the end of the block instead of their position; tokens now
  survive the request
- A translated link label could rewrite the link address when the label text
  also appeared in an attribute; labels are now replaced through explicit
  markers inside the anchor's text
- Issue and PR titles and commit messages produced no translatable blocks
  because the surface container is itself the text block
- Markdown translated inside the quick preview lost all its inline markup
- The persistent cache was written but never read, so every run sent the same
  text again; cache hits are now served before any request
- A provider missing a required field (an API key, a Yandex folder id) failed
  as a network error instead of showing the configuration message
- A provider that drops most placeholders now leaves that block in its
  original language instead of piling every inline element at its end
- Automatic translation moved keyboard focus to each Translate button as it ran
- A throttled or unreachable provider could trigger one request per segment
  (up to hundreds on a long README); 401/403/429 now fail the batch immediately,
  three consecutive failed batches stop the run, and the button reports
  `done / total` progress
- Translation observers stayed attached to a replaced app shell after a soft
  navigation; the feature now watches the shell and reattaches
- The provider privacy hint now also states that an exported settings backup
  contains the API keys

[0.18.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.18.1

## [0.18.0] - 2026-11-15

### Added

- **Translation** — translate rendered markdown (READMEs, issues, pull
  requests, discussions, releases, wikis, comments), commit messages,
  issue/PR titles and the quick file preview into forty languages. A
  **Translate** action sits in the block's own header; translated text replaces
  the original in place or appears below it, and every inline element — links,
  images, code, task-list checkboxes — survives the round trip
- **Trigger choice** — translate on demand, or automatically for containers
  that scroll into view; **Show original** restores the exact source, and
  `reveal: hover` peeks at it while the pointer or focus is inside the
  container
- **Six providers** — free Google by default (no key), plus DeepL, Microsoft,
  Yandex, OpenAI-compatible endpoints and LibreTranslate, each with its own
  fields and hints. API keys stay in userscript storage, so a settings backup
  contains them
- **Persistent cache** — translations are reused for a configurable number of
  hours, kept under a size budget and cleared from the settings page
- **Translation settings page** — master switch, target language, trigger,
  display mode, reveal mode, per-place switches, provider credentials and cache
  controls, all behind the usual Save/Reset/Cancel

[0.18.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.18.0

## [0.17.2] - 2026-11-15

### Fixed

- Overlay shadows turned into a milky light-grey halo on dark GitHub themes:
  the elevation token pointed at `--shadow-large`, which GitHub no longer
  defines, so it always used its light-theme fallback. The toast, confirm
  dialog, viewer status and help cards, the image download button and the file
  context menu now use Primer's current floating shadows and their documented
  dark ramp

[0.17.2]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.17.2

## [0.17.1] - 2026-11-15

### Fixed

- The long-press progress ring appeared the instant the button went down, so
  even a plain click flashed it. It now waits a short beat (150 ms, shortened
  for very short hold times) and fills over the remaining time, so a quick
  click never shows it

[0.17.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.17.1

## [0.17.0] - 2026-11-15

### Added

- **Hold time** — `filePreview.longPressMs` sets how long a file name or a
  markdown file link must be held before the preview opens, in milliseconds
  (200–2000, 450 by default)
- **Progress circle** — `filePreview.longPressRing` draws a small transparent
  ring at the pointer whose accent arc fills over the hold time, so the gesture
  is visible without covering the file name;
  like the viewer spinner and the toast countdown, it stays animated under
  reduced motion because it carries progress information

[0.17.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.17.0

## [0.16.0] - 2026-11-15

### Added

- File links in rendered markdown (a README, an issue, a discussion or a wiki
  page) now get the same quick preview as files in a repository listing: hold
  the left mouse button on the link, or choose **Preview** in its context menu
- Right-clicking a file link in rendered markdown opens the file context menu
  instead of the browser's, with open, open in a new tab, download, copy
  contents, copy link and copy path

[0.16.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.16.0

## [0.15.1] - 2026-11-15

### Fixed

- A folder in the sidebar file tree showed two icons after it was expanded or
  collapsed: GitHub replaces its own folder glyph on that toggle, so the new
  glyph appeared next to the injected icon. A replaced native glyph is now
  hidden again as soon as it shows up

[0.15.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.15.1

## [0.15.0] - 2026-11-15

### Added

- Hold to preview: holding the left mouse button on a file name in a repository
  listing opens the quick preview. A quick click still opens the file, moving
  the pointer or releasing early cancels the gesture, and the click that would
  navigate to the file is swallowed once
- A **Long-press a file name** toggle (`filePreview.longPress`) in the **Quick
  file preview** card, on by default

[0.15.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.15.0

## [0.14.2] - 2026-11-15

### Fixed

- The eye button still sat against the table's right edge: GitHub's own row-cell
  rules won over the injected column's padding, so the column now sets its width
  and padding with `!important` and keeps a wider gap

[0.14.2]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.14.2

## [0.14.1] - 2026-11-15

### Fixed

- The eye column in a repository listing: folder rows now keep an empty cell so
  every row has the same column count, the button no longer sits against the
  table's right edge, and the column header no longer restarts the listing's
  debounced rescan on every pass — the surface used to rescan endlessly

[0.14.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.14.1

## [0.14.0] - 2026-11-15

### Added

- A quick file preview. Opening a file from the file list's eye button or from
  **Preview** in the file context menu shows it in a modal without leaving the
  page: Markdown is rendered and sanitized, source files get syntax highlighting
  and line numbers, images, video and audio play in place, and PDFs open in the
  browser's own viewer. Any other file gets an honest card with **Open on
  GitHub** and **Download** instead of a broken frame
- Sibling navigation inside the preview: the files of the current directory form
  one set, so the previous/next buttons and the arrow keys move between them,
  with the position shown in the footer
- Header actions in the preview — open on GitHub, copy contents, link or path,
  and download under the file's own name — plus a preview/source switch for
  Markdown, which keeps the Preview/Source control available in both modes
- A **Quick file preview** card on the **Files** settings page with its own
  master switch (`filePreview.enabled`) and a row button toggle
  (`filePreview.rowButton`); `preview.*` keys in all ten locales
- The preview modal is documented in `DESIGN.md` (its own component section,
  tokens and stacking), and the bundled Markdown, sanitizer and highlighter
  engines are attributed in `THIRD_PARTY_LICENSES`

### Changed

- `rawUrlFor`, `fileTarget` and `resolveFileTarget` moved to
  `src/utils/fileTarget.js`, and `formatSize` to `src/utils/size.js`, so the
  file menu, file sizes and the preview share one implementation
- Toasts now paint above every overlay, so the feedback from a preview action
  (copy, download) stays visible; the preview's copy menu takes an elevated
  layer instead of hiding behind the modal

### Fixed

- PDFs showed an empty pane on github.com: the blob kept the raw route's
  generic type and the page's policy blocks a `blob:` frame. The blob is now
  typed as a PDF, and a blocked or stalled frame falls back to a card with
  **Open on GitHub** and the raw file
- A video or audio file the browser cannot play left an empty player; it now
  falls back to the binary card
- Rendered README markdown could carry a `<style>` element and restyle the
  whole GitHub page; the sanitizer now forbids `style`, `form` and form controls

[0.14.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.14.0

## [0.13.0] - 2026-11-15

### Added

- File icons in the file tree sidebar of code pages and in the filename header
  of blob, tree and blame pages, so the colored glyphs appear everywhere GitHub
  lists a file
- The file context menu on files in the sidebar file tree and in the Blame view
  of a file; a tree row for the file already open omits **Open**, like the file
  page itself

### Fixed

- The filename header of a blob page showed no icon. GitHub moved the name out
  of the breadcrumb nav into a sibling heading, which the old selector never
  matched

[0.13.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.13.0

## [0.12.0] - 2026-11-15

### Added

- A file context menu. Right-clicking a file in a repository listing or on a
  file page replaces the browser menu with **Open**, **Open in new tab**,
  **Download**, **Copy contents**, **Copy link** and **Copy path**; folders,
  images, media and ordinary links keep the native menu. Copy contents fetches
  the file's own raw address and refuses binary files and anything over 1 MiB
  with a clear toast, and every action reports its outcome. The menu is fully
  keyboard-operable (context-menu key, arrows, `Home`/`End`, `Escape` with
  focus restored) and closes on an outside click, scroll, resize or navigation
- A **File context menu** card on the **Files** settings page with its own
  master switch (`fileMenu.enabled`), plus `fileMenu.*` keys in all ten locales
  and a reusable `ui/contextMenu.js` component
- The context menu is documented in `DESIGN.md` (its own component section,
  tokens, stacking and keyboard rules)

### Fixed

- The context menu's shadow in the dark theme. It now uses GitHub's current
  floating-overlay shadow token, which resolves per theme; the previous token
  is no longer defined by GitHub, so its light-theme fallback showed as a pale
  halo around the menu on dark pages. The token's 1px ring replaces the menu's
  own border, so the edge stays a single hairline in every theme

[0.12.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.12.0

## [0.11.0] - 2026-11-15

### Changed

- The **File icons**, **File ages** and **Files** settings pages are now one
  **Files** page. Each enhancement keeps its own master switch in a card
  header, with its toggles — and the age-scale preview — inside that card, so
  the sidebar lists five pages instead of seven. Settings, their storage and
  the features' behavior are unchanged

[0.11.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.11.0

## [0.10.0] - 2026-11-15

### Added

- File sizes and downloads in the repository file tree. Every row gains a last
  column: file rows show a muted size at the column's left edge and, on its
  right edge, a download button in GitHub's icon button style; folder rows keep
  the cell empty. The
  column is named for assistive tech and narrowed or hidden on smaller windows
  so GitHub's own columns keep their room; the blob page is left alone because
  GitHub already shows a size and a download button there. Sizes are probed
  with a HEAD request on the file's own raw address — never the GitHub API, so
  the anonymous 60-per-hour limit is untouched — only for rows near the
  viewport, cached for the session, and simply omitted when they cannot be
  read; downloading through the same-origin raw route keeps private
  repositories working
- A **Files** settings page with a master switch plus **File size** and
  **Download button** toggles, and new `tab.files` / `files.*` keys in all ten
  locales

[0.10.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.10.0

## [0.9.1] - 2026-11-15

### Fixed

- File icons and file ages no longer go missing after navigating away from a
  repository page and back. GitHub mounts the file list after the navigation
  shell, sometimes after every navigation event has fired, so the surface query
  now retries on a bounded interval and watches a swapped `<body>` (and its
  children) instead of relying on the navigation events alone

[0.9.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.9.1

## [0.9.0] - 2026-11-15

### Added

- Blame-style file ages: the last-commit date of every file and folder in a
  repository listing is tinted on a blame-style scale — the newest dates are
  warm (`#ffd78d` in the dark theme, attention gold in the light one) and older
  dates fade to the theme's muted grey, so a four-month-old file already reads
  as old. The date keeps GitHub's own text and relative wording; the color is
  the only addition
- A **File ages** settings page with a master switch (on by default), a folder
  toggle and a preview of the age scale, with new `tab.ages` and `ages.*` keys
  in all ten locales

[0.9.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.9.0

## [0.8.0] - 2026-11-15

### Added

- Download images from the viewer toolbar and from a floating button that
  appears over a markdown image while it is hovered. Both save the image under
  its own filename — a camo proxy address is unwrapped to the proxied file's
  name — and fall back to opening the image in a new tab when the bytes cannot
  be fetched
- A `gallery.download` setting (on by default) that hides both download
  buttons, with new `gallery.download`, `gallery.downloadDesc` and
  `viewer.download` keys in all ten locales

[0.8.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.8.0

## [0.7.1] - 2026-11-15

### Fixed

- The viewer's thumbnail strip could be squeezed — and its images cropped —
  when the open image was large. The rail now keeps its full height
  (`flex: none`) and only the image stage flexes

[0.7.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.7.1

## [0.7.0] - 2026-11-15

### Added

- The viewer can now zoom out below the fit-to-screen size, down to a quarter
  of it, so even a small image can be shown smaller than its own pixels. The
  percentage keeps falling below 100%, and the new stops (25%, 50% and 75% of
  fit) are reachable from the buttons, the wheel, pinch and the keyboard

[0.7.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.7.0

## [0.6.1] - 2026-11-15

### Removed

- The keyboard hint bar under the viewer's thumbnail strip. The same keys are
  listed in the `?` shortcut popover, so the footer no longer takes up space

[0.6.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.6.1

## [0.6.0] - 2026-11-15

### Added

- The viewer toolbar now uses a proper 16×16 SVG icon set (close, zoom,
  rotate, fit, open in a new tab, help, broken image) instead of text glyphs;
  the tools are quiet ghost buttons that light up on hover
- Zoom is shown as a real percentage relative to the image's natural pixels.
  Clicking the percentage toggles between fit-to-screen and actual size, and
  wheel, double-click and pinch zoom stay anchored on the pointer
- A keyboard-shortcut popover (`?` or the toolbar help button) and `Tab` focus
  trapping while the viewer is open
- The viewer bar shows the loaded image's pixel size, the counter is a pill
  announced by screen readers, and the thumbnail strip marks images that
  failed to load
- The viewer adapts to narrow screens: compact toolbar (shortcut help hidden),
  smaller navigation buttons, a full-width help card and a hidden keyboard hint

### Changed

- The viewer stage sits on the subtle surface so a white image keeps a visible
  edge, the zoom indicator and thumbnail rail are easier to read, and the
  failure card now has an icon and a link to open the original image
- New `viewer.help`, `viewer.size`, `viewer.actualSize`, `viewer.fit`,
  `viewer.imageTitle`, `viewer.shortcutBrowse` and `viewer.shortcutZoom` keys
  in all ten locales

[0.6.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.6.0

## [0.5.4] - 2026-11-15

### Added

- README translations in all ten UI locales — Russian, German, Spanish, French,
  Brazilian Portuguese, Simplified Chinese, Japanese, Korean and Polish — each
  with a language switcher at the top; English stays the reference and the
  version badge and status line stay in sync across every file

[0.5.4]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.5.4

## [0.5.3] - 2026-11-15

### Fixed

- File icons for most file types were cropped to their top-left corner: every
  glyph was drawn in a fixed 16×16 viewBox, while Material Icon Theme authors
  its icons on 16, 24, 32 and other grids. Each icon now renders in the
  coordinate system it was authored in, so the whole glyph scales into the
  16×16 box
- Files without a matching icon now fall back to the generic file glyph — the
  generated set was missing the `file` icon, so rendering the fallback failed

[0.5.3]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.5.3

## [0.5.2] - 2026-11-15

### Changed

- The settings panel's scroll areas now use a thin, rounded scrollbar that
  follows the theme — a translucent `var(--gp-line)` thumb that darkens on hover
  — instead of the native one; the body reserves its gutter so switching pages
  never shifts the content, and the narrow-screen page strip hides the
  scrollbar while staying scrollable

[0.5.2]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.5.2

## [0.5.1] - 2026-11-15

### Changed

- The settings panel no longer casts a drop shadow; the frosted scrim behind it
  carries the layering on its own

[0.5.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.5.1

## [0.5.0] - 2026-11-02

### Added

- Settings search: a field in the panel header (`/` or `Ctrl`/`Cmd`+`K`
  focuses it) that finds any setting across every page. Results are grouped by
  page with the matched text highlighted, the sidebar shows per-page match
  counts while searching, and choosing a result opens its page and spotlights
  the setting. `Escape` clears the query before it closes the panel
- Grouped sidebar navigation: pages are filed under **Preferences** and
  **More** with section labels
- Each page opens under a tinted icon well, and master switches (gallery,
  file icons) sit in their section header instead of a one-row card
- Section hints for notification behavior, toast position, viewer controls and
  file-icon matching

### Changed

- Redesigned the settings panel for easier scanning: a wider, taller dialog,
  subtle section-header surfaces, roomier rows and fields, and stronger label
  hierarchy
- `Escape` no longer closes the settings panel behind the reset confirmation

### Removed

- The unused `gallery.behavior` and `icons.behavior` locale keys

[0.5.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.5.0

## [0.4.0] - 2026-10-19

### Added

- File icons: colored, type-aware icons for files and folders wherever GitHub
  lists them — the repository tree and its subfolders, the blob header, pull
  request file headers and the diff tree, commit file lists, code search,
  gists and release assets. Matching covers languages by extension (including
  multi-part extensions such as `.d.ts` and `.spec.ts`), well-known filenames
  (`Dockerfile`, `package.json`, `README`, …) and common folder names
- A **File icons** settings page with a master switch plus folder-icon and
  well-known-filename toggles, reacting to Save through `settings:fileIcons`
- The icon set is a curated slice of Material Icon Theme (MIT) embedded in the
  bundle; `npm run icons:build` regenerates it and `THIRD_PARTY_LICENSES`
  carries the attribution

[0.4.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.4.0

## [0.3.2] - 2026-10-19

### Changed

- The settings panel header is text-only: the tinted product logo well is gone,
  so the brand block and the close button are the whole header
- Sidebar items in the settings panel no longer take a hover or active fill; the
  open page is marked only by its bold label, accent glyph and left accent pill

[0.3.2]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.3.2

## [0.3.1] - 2026-10-17

### Changed

- The settings backdrop now frosts the page behind it instead of only dimming
  it: `blur(8px) saturate(120%)` on the panel overlay, so the content behind the
  panel reads as a layer underneath rather than competing with it. Managers
  without `backdrop-filter` support keep the plain scrim

[0.3.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.3.1

## [0.3.0] - 2026-10-17

### Changed

- Redesigned settings panel in GitHub's own visual language: a sidebar lists
  the pages (General · Gallery · Backup · About) with an accent marker on the
  open one, so every page is one click away instead of going through a home
  list and a back link; each page opens under its own title and description.
  The panel is wider and keeps a fixed height, so switching pages no longer
  resizes it, and the product logo and an Octicons close button sit in the
  header. The panel remembers the last page used until the page reloads
- On narrow screens (<= 640px) the sidebar becomes a horizontal tab strip
- Footer note switches to **Unsaved changes** with an accent dot while the
  draft differs from the stored settings (the `panel.back` locale key is
  replaced by `panel.unsaved` in all ten locales)
- Enabled source tiles in the Gallery page are tinted with the accent color
- Closing the panel moves focus back to the element that opened it
- `Escape` now closes the panel directly (there is no home list to return to)
- The number input no longer renders taller than the select next to it

### Added

- Animations: the panel and the confirm dialog fade and rise in, the panel
  fades out on close, page content rises in with a short stagger, the sidebar
  marker slides, the switch knob springs and stretches while pressed, and
  controls ease their border and fill changes. Everything honors
  `prefers-reduced-motion`
- Arrow keys switch pages while the sidebar has focus

[0.3.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.3.0

## [0.2.1] - 2026-10-17

### Changed

- Both settings entries (header button and avatar-menu row) now use the Octicons
  `gear` glyph — 16×16, filled, `currentColor` — the same icon family and style
  as GitHub's own menu rows and header actions, instead of the outlined
  stroke icons used inside the panel; the header button no longer shows the
  gallery icon

[0.2.1]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.2.1

## [0.2.0] - 2026-10-16

### Added

- Settings entry in GitHub's user (avatar) menu: a **GitHub Plus settings** row
  placed right after GitHub's own **Settings** row, carrying the same accent dot
  as the header entry while settings differ from defaults. GitHub mounts that
  menu into Primer's overlay portal root (`#__primerPortalRoot__`) only while it
  is open, so the row is injected through an observer on that container — which
  catches the overlay however it was opened and however long its lazily loaded
  chunk took to arrive — with header clicks as a bounded-wait fallback; both
  paths are idempotent, so a re-render that drops the row puts it back. The row
  is located through the overlay's own hooks or, if they are renamed, through
  GitHub's own `Settings` item, and clicking it closes the menu with the
  `Escape` keydown GitHub's own overlay handles before opening the panel
- `isOwnUi()` now also excludes the injected avatar-menu row from page scanning
  (`.gp-user-menu-item`)

[0.2.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.2.0

## [0.1.0] - 2026-10-16

### Added

- Image viewer (`src/ui/viewer.js`): fullscreen lightbox themed through GitHub's own color tokens, fit-to-screen display, zoom (wheel, `+`/`−`, double click, pinch), drag to pan at any zoom (the offset is clamped so the image slides inside the stage but never leaves it), 90° rotation, prev/next with optional wrap-around, a centered thumbnail strip without scrollbars, neighbour preloading, an "open image in a new tab" tool, a failure card, focus restore and keyboard shortcuts (`Esc`, `←`/`→`, `Home`/`End`, `+`, `−`, `0`, `r`); labels are localizable and overridable per call
- Gallery framework (`src/gallery/`): source registry (`registerSource`), item collection with badge/emoji/small-icon filtering (badge hosts, badge-only paths such as Actions `/workflows/<file>/badge.svg`, `badge.<ext>` files, shields.io badges behind GitHub's camo proxy — decoded from the proxied URL or `data-canonical-src` — and any image at most 40 px tall), URL de-duplication and a 500-image cap, a generated cursor-only affordance built from the registry (page images keep GitHub's own look — no border, outline or overlay), and one delegated click listener instead of per-image wiring, so GitHub re-renders and client-side navigation need no rescans
- Markdown source (`src/gallery/sources/markdown.js`): clicking an image inside any rendered `.markdown-body` (repository README, blob view of a `.md` file, wiki, issue, pull request, discussion, comment) opens the viewer with the other images of that same container as the set; images linked to a repository `/blob/` page are resolved to their `/raw/` file, uploaded attachments, camo, `media.githubusercontent.com` and any other URL naming an image file are used as they are
- Full-size upgrade: the linked original is probed before being swapped in, and a source that cannot be fetched leaves the rendered image in place (no broken image)
- Settings feature: a header entry placed next to GitHub's own header actions (with an `li` host on the legacy `#user-links` header, a bounded wait for a late-rendered header and a re-mount on client-side navigation), a `GM_registerMenuCommand` fallback, and a "settings differ from defaults" dot on the entry
- Settings panel: home list plus General (interface language, toast notifications), Gallery (master switch, per-source switches from the registry, badge filtering, full-size upgrade, thumbnail strip, wrap-around, zoom ceiling), Backup (export to file or clipboard, validated JSON import) and About pages; the footer Save applies the draft, Reset asks for confirmation, Cancel/overlay click discards it, and `Escape` returns to the home list first
- Toasts (`src/ui/toast.js`): deduplicated notifications with four corner placements, auto-hide progress bars, hover-paused timers, actions and a settings-driven off switch
- Ten interface locales (`en`, `ru`, `de`, `es`, `fr`, `pt-BR`, `zh-CN`, `ja`, `ko`, `pl`) with `auto` browser-language matching
- Build and release tooling: Vite + `vite-plugin-monkey` build producing `github-plus.user.js` / `github-plus.meta.js`, byte-identity verification between `dist/` and the root artifacts, and a GitHub Actions CI gate

[0.1.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.1.0
