# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
