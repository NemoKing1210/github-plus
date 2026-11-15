# Architecture

How the pieces fit together and why they are arranged this way. Per-module
detail lives in [`../AGENTS.md`](../AGENTS.md); this document is the map.

## Repository layout

```text
src/
├── main.js                  # Entry: locale init, feature boot, nav overlay reset
├── core/
│   ├── constants.js         # DEFAULT_SETTINGS, storage key, limits
│   ├── settings.js          # load/save + normalization (single source of truth)
│   └── bus.js               # minimal pub/sub (settings:gallery/toasts/language/fileIcons/fileAges)
├── i18n/
│   ├── meta.js              # SUPPORTED_LOCALES, aliases, native names
│   ├── index.js             # configureLocale(), t()
│   └── locales/             # one file per locale, registry in locales/index.js
├── gallery/
│   ├── sources.js           # source registry (registerSource / listSources)
│   ├── collect.js           # normalize, filter, de-duplicate, cap
│   ├── index.js             # delegated click + hover, cursor stylesheet, download button
│   └── sources/markdown.js  # the markdown source (side-effect registration)
├── features/settings/
│   ├── index.js             # settings entry: header button, user-menu row, pages
│   ├── userMenu.js          # settings row inside GitHub's user (avatar) menu
│   ├── panel.js             # panel shell: grouped nav, search, pages, draft
│   ├── controls.js          # section / row / field / switch / select / input / button
│   ├── confirm.js           # promise-based confirm dialog
│   └── tabs/                # general.js, gallery.js, fileIcons.js, fileAges.js, backup.js, about.js
├── features/fileIcons/
│   ├── index.js             # per-surface observers, injection, settings reaction
│   ├── surfaces.js          # where GitHub lists files + row readers
│   ├── match.js             # pickIcon(name, kind) — pure filename matching
│   ├── inject.js            # renderIcon / placeIcon / clearIcons
│   └── iconSet.generated.js # curated Material Icon Theme slice (generated)
├── features/fileAges/
│   ├── index.js             # per-surface observers, date tinting, settings reaction
│   ├── surfaces.js          # file rows that carry a last-commit date
│   ├── age.js               # ageBucket(datetime, now) — pure date → 1…10
│   └── inject.js            # paintAge / clearAges
├── styles/
│   ├── tokens.css           # :root design tokens (--gp-* palette)
│   └── app.css              # injected stylesheet (gp- prefix)
├── ui/
│   ├── icons.js             # 16×16 stroke glyphs for the viewer toolbar
│   ├── toast.js             # notifications (positions, dedup, actions)
│   └── viewer.js            # fullscreen image viewer (reusable lightbox)
└── utils/
    ├── dom.js               # el, append, debounce, eachNode, toArray, isOwnUi
    ├── download.js          # fetch → blob → <a download>, new-tab fallback
    ├── navigation.js        # watchNavigation (turbo/pjax/history URL watcher)
    └── scrollLock.js        # counted page scroll lock for modal overlays
```

## Module graph

```mermaid
graph TD
  main --> core
  main --> settingsFeature[features/settings]
  main --> fileIcons[features/fileIcons]
  main --> fileAges[features/fileAges]
  main --> gallery
  main --> ui
  main --> utils
  gallery --> core
  gallery --> ui
  gallery --> utils
  gallery --> i18n
  settingsFeature --> core
  settingsFeature --> ui
  settingsFeature --> utils
  settingsFeature --> i18n
  settingsFeature --> galleryRegistry[gallery/sources]
  fileIcons --> core
  fileIcons --> utils
  fileAges --> core
  fileAges --> utils
  ui --> core
  ui --> utils
  ui --> i18n
  core --> i18n
  core --> utils
```

Import direction: `utils ← core ← gallery ← features`. `main.js` may import
from anywhere but owns no feature state; `core/settings.js` knows nothing about
features or the bus; `ui/*` stay reusable primitives that only depend on
`i18n`, `utils` and `core` helpers.

## Feature lifecycle

There is **no scan loop and no document-wide MutationObserver**. Everything
that has to survive GitHub's re-renders is either (a) CSS, (b) a delegated
listener that walks the live DOM at event time, (c) a re-mount triggered by an
explicit navigation event, or (d) one observer on a container GitHub itself
owns — `features/settings/userMenu.js` watches Primer's overlay portal root
(`#__primerPortalRoot__`), which holds nothing but overlays and stays empty
otherwise. `features/fileIcons/` and `features/fileAges/` follow the same rule
at a smaller scale: one observer per known file-list container (repository
tree, PR header list, last-commit cells, and so on), never one on the document,
and a surface whose selector stops matching turns into a no-op instead of
breaking the pagination.

```mermaid
sequenceDiagram
  participant U as User
  participant D as document
  participant G as gallery/index.js
  participant C as gallery/collect.js
  participant V as ui/viewer.js

  U->>D: click on an image in .markdown-body
  D->>G: click (capture phase)
  G->>G: enabled? plain left click? not own UI?
  G->>C: resolveContainer + collectGallery
  C-->>G: [{ image, node }] (filtered, deduped, capped)
  G->>G: preventDefault + stopPropagation
  G->>V: openViewer({ images, index, ...settings })
  V-->>U: fullscreen gallery, arrows + thumbnails + zoom
  V->>G: resolveImage(item)
  G->>G: probe item.fullSrc
  G-->>V: full-size URL or null
```

Why capture phase: GitHub attaches its own delegated click handlers. Resolving
the gallery first and stopping propagation means a gallery image can never both
open the viewer and trigger GitHub's link handling, while modified and middle
clicks stay with the browser.

Why the affordance is generated CSS: the zoom-in cursor is the only thing that
must be applied to page markup — images keep GitHub's own look, with no border
or overlay added — so it lives in one stylesheet built from the registry
(`#gp-gallery-style`). A React re-render cannot strip a stylesheet, and images
rendered long after load are decorated for free. When no source is enabled the
stylesheet is removed entirely, leaving the page stock.

The hover download button follows the same rule: one delegated
`pointerover`/`pointerout` pair resolves the hovered image through the same
`collectGallery`/`matchIndex` path and positions a single
`.gp-download-btn` element appended to `<body>`. Nothing is inserted into
GitHub's markup, there is no per-image state, and the element is dropped on
navigation. Its click is excluded through `isOwnUi()`, so it never opens the
viewer.

## Settings lifecycle

```mermaid
sequenceDiagram
  participant U as User
  participant P as features/settings
  participant S as core/settings.js
  participant B as core/bus.js
  participant F as features (gallery, entry)

  U->>P: header button / avatar-menu row / menu command
  P->>S: getSettings()
  S-->>P: persisted state → deep-cloned draft
  U->>P: edit pages (draft only)
  U->>P: Save
  P->>S: saveSettings(draft)
  S-->>P: normalized + persisted state
  P->>B: emit settings:gallery / toasts / language / fileIcons / fileAges
  B->>F: listeners react (repaint stylesheet, rescan rows, relabel entry)
  P-->>U: success toast, panel closed
```

`saveSettings()` never notifies; the caller emits. That split keeps persistence
in `core` and reactions in the UI/features, and it is what makes a backup import
(`applyExternalSettings`) behave exactly like a footer Save.

## Navigation and overlays

GitHub navigates without a reload (Turbo, plus classic `pushState`), and it
replaces `<body>` while module state lives on. `main.js` subscribes to
`watchNavigation()` and closes the viewer and the panel on every URL change;
otherwise a "closed" viewer would keep reporting itself open (and swallow
`Escape` for the panel) and a pinned page would stay pinned. The settings entry
subscribes to the same watcher to re-mount its header button; the avatar-menu
row needs no reset, because GitHub unmounts that menu on navigation itself.

## Extension points

| Goal | Touch |
|------|-------|
| A new place with images (diff view, project board, …) | Register a source in `src/gallery/sources/`, import it from `src/gallery/index.js`, add its default switch in `core/constants.js`, add its two locale keys in all ten locales. The settings panel picks it up from the registry. |
| A new settings page | `registerPage({ id, icon, labelKey, descKey, render })` and a module in `features/settings/tabs/`. The page reads and mutates `getDraft()`. |
| A new place GitHub lists files | Add a surface to `src/features/fileIcons/surfaces.js` (`containers`, `rows`, `resolve(row)`); if the rows also show a last-commit date, add it to `src/features/fileAges/surfaces.js`. Observers and injection are shared per feature. |
| A new setting | Add it to `DEFAULT_SETTINGS` + a normalizer in `core/settings.js`, expose a getter, add the control to a tab, and document the key in `README.md` / `AGENTS.md`. Emit the matching bus event on Save if a feature must react. |
| A lightbox somewhere else | `openViewer({ images })` from `ui/viewer.js` — it is a standalone component with localizable, per-call overridable labels. |

## Invariants

- Every injected class is `gp-`-prefixed; no rule targets page markup except the
  gallery affordance stylesheet, which exists only while the gallery is on.
- Nothing is persisted from a panel page render; only the footer Save (or an
  import) writes settings.
- Any value read from storage or a backup goes through normalization — unknown
  values fall back to defaults, never crash the page.
- Injected UI never touches GitHub's own header/markup nodes; it only inserts
  siblings next to them. File icons additionally hide GitHub's glyph with an
  inline style and restore it on teardown, and file ages add their `.gp-age-date`
  classes to GitHub's own timestamp; neither writes a page-markup CSS rule.
- DOM collections are iterated with `eachNode`/`toArray`, never `for...of`.
