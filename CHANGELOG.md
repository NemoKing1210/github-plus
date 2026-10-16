# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-16

### Added

- Image viewer (`src/ui/viewer.js`): fullscreen lightbox with fit-to-screen display, zoom (wheel, `+`/`−`, double click, pinch), drag to pan, 90° rotation, prev/next with optional wrap-around, thumbnail strip, neighbour preloading, an "open image in a new tab" tool, a failure card, focus restore and keyboard shortcuts (`Esc`, `←`/`→`, `Home`/`End`, `+`, `−`, `0`, `r`); labels are localizable and overridable per call
- Gallery framework (`src/gallery/`): source registry (`registerSource`), item collection with badge/emoji/small-icon filtering, URL de-duplication and a 500-image cap, a generated cursor/hover affordance built from the registry, and one delegated click listener instead of per-image wiring, so GitHub re-renders and client-side navigation need no rescans
- Markdown source (`src/gallery/sources/markdown.js`): clicking an image inside any rendered `.markdown-body` (repository README, blob view of a `.md` file, wiki, issue, pull request, discussion, comment) opens the viewer with the other images of that same container as the set; images linked to a repository `/blob/` page are resolved to their `/raw/` file, uploaded attachments, camo, `media.githubusercontent.com` and any other URL naming an image file are used as they are
- Full-size upgrade: the linked original is probed before being swapped in, and a source that cannot be fetched leaves the rendered image in place (no broken image)
- Settings feature: a header entry placed next to GitHub's own header actions (with an `li` host on the legacy `#user-links` header, a bounded wait for a late-rendered header and a re-mount on client-side navigation), a `GM_registerMenuCommand` fallback, and a "settings differ from defaults" dot on the entry
- Settings panel: home list plus General (interface language, toast notifications), Gallery (master switch, per-source switches from the registry, badge filtering, full-size upgrade, thumbnail strip, wrap-around, zoom ceiling), Backup (export to file or clipboard, validated JSON import) and About pages; the footer Save applies the draft, Reset asks for confirmation, Cancel/overlay click discards it, and `Escape` returns to the home list first
- Toasts (`src/ui/toast.js`): deduplicated notifications with four corner placements, auto-hide progress bars, hover-paused timers, actions and a settings-driven off switch
- Ten interface locales (`en`, `ru`, `de`, `es`, `fr`, `pt-BR`, `zh-CN`, `ja`, `ko`, `pl`) with `auto` browser-language matching
- Build and release tooling: Vite + `vite-plugin-monkey` build producing `github-plus.user.js` / `github-plus.meta.js`, byte-identity verification between `dist/` and the root artifacts, and a GitHub Actions CI gate

[0.1.0]: https://github.com/NemoKing1210/github-plus/releases/tag/v0.1.0
