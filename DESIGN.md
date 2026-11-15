# DESIGN.md — GitHub Plus visual rules

This file is the single source of truth for how GitHub Plus looks and behaves.
Follow it for every change that adds, moves or restyles an injected element:
the settings entry button, the settings panel (sidebar, pages) and its controls, the confirm
dialog, toasts, the context menu, and the image viewer. Every rule below is derived from the
shipped `src/styles/tokens.css`, `src/styles/app.css` and the components that
build the markup, so the document and the stylesheet move together.

## 1. Purpose and scope

GitHub Plus injects UI into pages the visitor already sees through a GitHub
theme. GitHub ships several (light, dark, dark dimmed, high contrast) and
switches them by redefining Primer CSS custom properties on `:root`. A fixed
palette would either fight the visitor's theme (a white panel on a dark page,
dark-on-dark text) or need a theme picker of its own.

So injected UI does not own a palette:

- Colors are declared once in `src/styles/tokens.css` as `--gp-*` custom
  properties whose values are `var(--<Primer name>, <literal>)`. The Primer
  variable resolves at use time, so everything we render follows the active
  theme; the literal is the Primer **light** value and only takes effect if
  GitHub renames or drops the variable.
- Component CSS in `src/styles/app.css` reads `var(--gp-*)` and never reads a
  Primer variable or a raw color directly.
- There is therefore no `prefers-color-scheme` branch, no theme setting, and no
  second palette anywhere in the script.

Scope: every element GitHub Plus itself creates — the entry button and its
list host, the row inside GitHub's user menu, the panel (overlay, shell,
grouped sidebar, search field and results, pages, cards, rows, controls), the
confirm dialog, toasts, the context menu, the image viewer, the `.gp-fi` file
and folder glyphs, the `.gp-age-date` coloring of GitHub's last-commit
timestamps and its settings-page legend, the `.gp-file-meta` size column added
to file rows, and the gallery's page-level cursor/hover affordances
(§11). Anything GitHub already renders is out of scope except through those
affordances: no other rule may target page markup.

Two invariants hold for every selector:

- Every class we put on our own elements starts with `gp-`. Never add an
  unprefixed class to our own element, and never write a rule for an
  unprefixed selector.
- Every UI-root class that must be excluded from page scanning is listed in
  `isOwnUi()` in `src/utils/dom.js`
  (`.gp-panel-overlay, .gp-confirm-overlay, .gp-toasts, .gp-settings-btn,
  .gp-user-menu-item, .gp-viewer-overlay, .gp-preview-overlay, .gp-download-btn,
  .gp-file-meta, .gp-context-menu`).
  Rename a root class and that list must change with it.

## 2. Token layer (`src/styles/tokens.css`)

All `--gp-*` tokens, in declaration order.

| Token | Mirrors (Primer) | Literal fallback | Role |
|---|---|---|---|
| `--gp-font` | — | system UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif` + emoji fonts) | Family for every injected element |
| `--gp-mono` | — | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Version/badge chips, wide input, textarea |
| `--gp-radius` | — | `6px` | Default corner radius (controls, cards, rows, toasts, viewer tools) |
| `--gp-radius-lg` | — | `12px` | Large surfaces: panel, confirm dialog |
| `--gp-accent` | `--fgColor-accent` | `#0969da` | Links, primary button fill, checked switch, active/dot accents, icon tints |
| `--gp-accent-soft` | `--bgColor-accent-muted` | `#ddf4ff` | Tinted icon wells (about logo), checked source tiles |
| `--gp-bg-1` | `--bgColor-default` | `#ffffff` | Default surface: panel, cards, inputs, toasts |
| `--gp-bg-2` | `--bgColor-muted` | `#f6f8fa` | Subtle surface: header/footer bars, entry button, secondary button, grid cell, about hero |
| `--gp-text` | `--fgColor-default` | `#1f2328` | Body text, labels and titles (Primer exposes one emphasis level) |
| `--gp-text-muted` | `--fgColor-muted` | `#59636e` | Hints, descriptions, counters, secondary icons |
| `--gp-success` | `--fgColor-success` | `#1a7f37` | Success icon/progress tones |
| `--gp-danger` | `--fgColor-danger` | `#d1242f` | Danger button fills, error tones, viewer status border |
| `--gp-attention` | `--fgColor-attention` | `#9a6700` | Warning icon/progress tones |
| `--gp-border` | `--borderColor-default` | `#d1d9e0` | Control and surface outlines |
| `--gp-line` | `--borderColor-muted` | `#d1d9e0b3` | Internal dividers (card head, rows, fields, pills, progress track) |
| `--gp-highlight` | `--bgColor-neutral-muted` | `rgba(129, 139, 152, 0.12)` | Hover/selected wash on neutral surfaces (entry button, buttons, toast actions, panel close). Translucent, so it reads as a change over both surfaces |
| `--gp-shadow` | `--shadow-large` | `0 8px 24px rgba(140, 149, 159, 0.2)` | Elevation: confirm dialog, toast |
| `--gp-shadow-float` | `--shadow-floating-small` | `0 0 0 1px var(--gp-border), 0 8px 24px rgba(140, 149, 159, 0.2)` | Floating menu elevation; its 1px ring is the menu's edge (no separate border). Resolves to GitHub's current overlay shadow in every theme |
| `--gp-scrim` | `--overlay-backdrop-bgColor` | `rgba(31, 35, 40, 0.5)` | Overlay backdrop behind panel and confirm dialog |
| `--gp-focus` | `--focus-outlineColor` | `#0969da` | Focus ring color |
| `--gp-age-1` | — | `#59636e` | Age scale 1: oldest commit, GitHub's muted grey (light theme) |
| `--gp-age-2` | — | `#5d646a` | Age scale 2 |
| `--gp-age-3` | — | `#626466` | Age scale 3 |
| `--gp-age-4` | — | `#676561` | Age scale 4 |
| `--gp-age-5` | — | `#6c665c` | Age scale 5 |
| `--gp-age-6` | — | `#716656` | Age scale 6 |
| `--gp-age-7` | — | `#77674f` | Age scale 7 |
| `--gp-age-8` | — | `#7e6746` | Age scale 8 |
| `--gp-age-9` | — | `#876739` | Age scale 9 |
| `--gp-age-10` | — | `#9a6700` | Age scale 10: newest commit, GitHub's attention gold |
| `--gp-code-keyword` … `--gp-code-meta` | — | GitHub's own syntax palette (light) | Syntax highlighting in the quick preview: keyword, string, comment, number, function, variable, type, attr, tag, meta |

The age scale has a second ramp (`#9198a1` … `#ffd78d`, oldest to newest)
declared under
`:root[data-color-mode="dark"]`, and again for `[data-color-mode="auto"]`
inside the same `prefers-color-scheme: dark` query GitHub uses for its own auto
mode. It is documented in §3. The ten `--gp-code-*` syntax tokens have the same
three declarations (light, dark, auto) and take GitHub's own code-view colors,
so a highlighted file matches the blob page.

Rules:

- Never add a token that only one component uses; if a value is used once and
  is not a theme color, inline it in `app.css` (as `.gp-viewer__thumb` does
  with an explicit `border-radius` when it needs one).

## 3. Theming rules

- Colors live in `tokens.css` and nowhere else. A component rule that needs
  color uses `var(--gp-*)`.
- The only raw color literals in `app.css` are four `#ffffff` foregrounds on
  saturated fills: `.gp-button--primary` and `.gp-button--danger`,
  `.gp-toast__action--danger`, and `.gp-viewer__tool--close:hover`. A white
  foreground on a solid accent/danger fill is not a theme color — it must stay
  legible on that fill in every theme — so it is deliberately not derived from
  a token. Any other new literal is a bug.
- The image viewer is themed like everything else: the image sits on a
  `var(--gp-bg-2)` stage (so a white image keeps a visible edge), and the bars,
  hint, thumbnail rail and help popover use the same surfaces, so the gallery
  reads as part of GitHub in every theme.
- The `.gp-fi` file and folder glyphs keep the fixed brand colors of the
  embedded Material Icon Theme slice (generated into
  `iconSet.generated.js`). They are third-party marks, like a logo: not a
  theme surface, and not part of the light/dark palette. The rule about raw
  literals still holds for `app.css`; those colors live in generated data and
  never in a component rule.
- The `--gp-age-1` … `--gp-age-10` scale colors the last-commit date text.
  Commit age is data, so the ramp is fixed rather than derived from a Primer
  semantic color, but it is not theme-blind: each theme fades old dates toward
  its own muted grey and keeps the newest dates warm, with light surfaces using
  GitHub's attention gold where dark ones can use `#ffd78d`. The ramp is
  selected through GitHub's own `data-color-mode` and, for its `auto` mode, the
  same `prefers-color-scheme` media query GitHub itself uses. Every light-theme
  shade stays at or above
  roughly 4.5:1 on `#ffffff`; every dark-theme shade stays at or above 5:1 on
  `#0d1117`. This is the **only** place the script may mirror that media query —
  it does not invent a theme of its own. The values live in `tokens.css`, never
  in a component rule.
- Nothing else in the script may key off `prefers-color-scheme`. The single
  exception is the age scale's `[data-color-mode="auto"]` block, which mirrors
  the query GitHub itself uses to resolve `auto`; the selected light and dark
  themes still come from GitHub's `data-color-mode` attribute, not from an
  invented theme of our own.

## 4. Surfaces, rounding, borders, shadows

| Property | Value | Applied to |
|---|---|---|
| Surface, default | `var(--gp-bg-1)` | `.gp-panel`, `.gp-card`, `.gp-confirm`, `.gp-toast`, `.gp-searchbar`, `.gp-search__group`, `.gp-search__item` (transparent, on its group), `.gp-select`, `.gp-input`, `.gp-textarea`, version/badge chip, `.gp-viewer-overlay`, `.gp-viewer__nav`, `.gp-viewer__status`, `.gp-viewer__thumb`, `.gp-viewer__help`, `.gp-viewer__counter`, `.gp-context-menu` |
| Surface, subtle | `var(--gp-bg-2)` | `.gp-panel__header`, `.gp-panel__nav`, `.gp-panel__footer`, `.gp-card__head`, `.gp-search__group-head`, `.gp-searchbar__kbd`, `.gp-search__summary-count`, `.gp-search__group-count`, `.gp-nav-item__count`, `.gp-header-btn`, `.gp-button`, `.gp-grid__cell`, `.gp-about__hero`, switch track, `.gp-viewer__bar`, `.gp-viewer__stage`, `.gp-viewer__thumbs`, `.gp-viewer__help-keys kbd` |
| Surface, tinted | `var(--gp-accent-soft)` | `.gp-page__icon`, `.gp-about__logo`, checked `.gp-grid__cell`, search `<mark>` |
| Border, surface/control | `1px solid var(--gp-border)` | `.gp-panel`, `.gp-card`, `.gp-searchbar`, `.gp-search__group`, `.gp-header-btn`, `.gp-button`, `.gp-select`, `.gp-input`, `.gp-textarea`, `.gp-switch__track`, `.gp-toast`, `.gp-confirm`, `.gp-viewer__bar`, `.gp-viewer__nav`, `.gp-viewer__thumbs`, `.gp-viewer__status`, `.gp-viewer__help`, `.gp-viewer__counter` |
| Border, divider | `1px solid var(--gp-line)` | `.gp-card__head`, `.gp-row`, `.gp-field`, chip/badge outline (`.gp-panel__version`, `.gp-badge`, search counts), `.gp-grid__cell`, `.gp-search__group-head`, `.gp-search__item`, `.gp-searchbar__kbd`, `.gp-about__row`, progress track, `.gp-viewer__sep`, `.gp-viewer__thumb`, `.gp-viewer__help-head`, `.gp-viewer__help-keys kbd` |
| Radius, default | `var(--gp-radius)` (6px) | Control boxes (button, select, input, search field, toast action), cards, sidebar items, search groups, toasts, grid cells, viewer tools, viewer zoom pill, viewer help, header button, panel close, viewer status, viewer thumb, user-menu row (`.gp-user-menu-item__btn`), context menu |
| Radius, large | `var(--gp-radius-lg)` (12px) | `.gp-panel`, `.gp-confirm` |
| Radius, pill | `999px` | `.gp-switch__track`, `.gp-panel__version`, `.gp-badge`, `.gp-nav-item__count`, `.gp-search__summary-count`, `.gp-search__group-count`, `.gp-viewer__counter` |
| Radius, circle | `50%` | `.gp-header-btn--custom::after` and `.gp-user-menu-item__dot` dots, `.gp-viewer__nav`, viewer spinner |
| Radius, inner | `4px` | `.gp-context-menu__item` — one step below its container so a hovered row never pokes out of the menu's `6px` corners |
| Shadow, elevation | `var(--gp-shadow)` | `.gp-confirm`, `.gp-toast`, `.gp-viewer__help`, `.gp-viewer__status` (the panel has none — its frosted scrim does the lifting) |
| Shadow, floating | `var(--gp-shadow-float)` | `.gp-context-menu` — Primer's floating-overlay shadow, whose 1px ring is the only edge the menu draws |
| Shadow, ring | `0 0 0 1px var(--gp-accent)` | `.gp-viewer__thumb.is-active` |

- Overlays set `box-sizing: border-box` (`.gp-panel-overlay`,
  `.gp-confirm-overlay`, `.gp-textarea`); the stylesheet has no global
  `box-sizing` reset and must not add one — GitHub's own page is not ours.
- Overlay stacking order, highest last: `.gp-panel-overlay` `1000000`,
  `.gp-confirm-overlay` `1000001`, `.gp-viewer-overlay` / `.gp-preview-overlay`
  `1000002`, `.gp-context-menu--elevated` `1000003`, `.gp-toasts` `1000004`.
  Toasts are always on top, so feedback raised from a modal stays visible; a
  menu opened from the preview asks for the elevated variant because the plain
  context menu sits below all of them at `999998` (just under the page download
  button's `999999`) — it is an affordance over the page, not a modal. Keep new
  full-screen UI inside this band and document it here.
- Modal overlays pin the page with `lockPageScroll()`:
  `html.gp-modal-open, html.gp-modal-open body { overflow: hidden;
  overscroll-behavior: none }` plus `body { position: fixed }` and a
  scrollbar-width `padding-right` compensation. Locks are reference-counted,
  so the viewer and the panel can stack without fighting.

## 5. Typography

Family: `var(--gp-font)` everywhere; `var(--gp-mono)` only for machine-ish
text (version/badge chips, `.gp-input--wide`, `.gp-textarea`).

| Element | Size / weight / color |
|---|---|
| Panel base (`.gp-panel`, `.gp-confirm`) | `14px/1.5` / `var(--gp-text)` |
| Panel title `.gp-panel__title` | `16px` / `600` / `var(--gp-text)` |
| Version chip `.gp-panel__version`, `.gp-badge` | `500 11px/1.6` mono / `var(--gp-text-muted)` |
| Panel subtitle `.gp-panel__subtitle` | `12px` / `var(--gp-text-muted)` |
| Sidebar group label `.gp-nav-group__label` | `11px` / `600` / `var(--gp-text-muted)`, uppercase, `0.04em` tracking |
| Sidebar item `.gp-nav-item` | `14px/1.4` / `var(--gp-text)`; `600` while active |
| Sidebar count `.gp-nav-item__count` | `500 11px/16px` / `var(--gp-text-muted)`, tabular |
| Search field `.gp-searchbar__input` | `13px/1.4` / `var(--gp-text)`; placeholder muted |
| Search shortcut `.gp-searchbar__kbd` | `500 10px/16px` mono / `var(--gp-text-muted)` |
| Search summary `.gp-search__summary` | `12px` / `var(--gp-text-muted)` |
| Search group title `.gp-search__group-title` | `12px` / `600` / `var(--gp-text)` |
| Search result `.gp-search__item-title` | `13px` / `500` / `var(--gp-text)`; hint `12px` muted |
| Search count chips `.gp-search__summary-count`, `.gp-search__group-count` | `500 11px/16px` / `var(--gp-text-muted)`, tabular |
| Page title `.gp-page__title` | `20px/1.3` / `600` / `var(--gp-text)` |
| Page description `.gp-page__desc` | `13px` / `var(--gp-text-muted)` |
| Card title `.gp-card__title` | `13px` / `600` / `var(--gp-text)`; `14px` in a bare feature card |
| Card hint `.gp-card__hint`, `.gp-hint` | `12px` (`1.5` for `.gp-hint`) / `var(--gp-text-muted)` |
| Row label `.gp-row__label` | `14px` / `500` / `var(--gp-text)` |
| Row hint `.gp-row__hint` | `12px` / `var(--gp-text-muted)` |
| Field label `.gp-field__label` | `13px` / `600` / `var(--gp-text)` |
| Select/input `.gp-select`, `.gp-input` | `14px/1.4` / `var(--gp-text)` |
| Textarea `.gp-textarea` | `12px/1.5` mono |
| Wide input `.gp-input--wide` | `12px` mono (inherits the input's `1.4` line height) |
| Button `.gp-button` | `500 14px/1.4` / `var(--gp-text)` |
| Toast `.gp-toast` | `13px/1.45`; title `13px` / `600`; message `12px` muted |
| Toast action `.gp-toast__action` | `500 12px/24px` |
| Confirm title `.gp-confirm__title` | `15px` / `600` / `var(--gp-text)` |
| Confirm message `.gp-confirm__message` | `13px` / `var(--gp-text-muted)` |
| About name `.gp-about__name` | `16px` / `600`; tagline `12px` muted; row `13px` |
| Viewer title `.gp-viewer__title` | `13px` / `600` / `var(--gp-text)` |
| Viewer size `.gp-viewer__size` | `11px` / `var(--gp-text-muted)` / tabular |
| Viewer counter `.gp-viewer__counter` | `500 11px/16px` / `var(--gp-text-muted)` / tabular |
| Viewer tool and nav icons | `16px` glyph in a `30px` tool, `18px` glyph in the `44px` nav circle, `currentColor` |
| Viewer zoom pill `.gp-viewer__zoom` | `500 12px/1` / `var(--gp-text-muted)` / tabular |
| Viewer help title `.gp-viewer__help-title` | `12px` / `600` / `var(--gp-text)` |
| Viewer help row `.gp-viewer__help-row` | `12px`; label in `var(--gp-text)`, keys muted |
| Viewer keycap `.gp-viewer__help-keys kbd` | `500 11px/16px` mono / `var(--gp-text-muted)` |
| Viewer status text `.gp-viewer__status-text` | `13px` / `var(--gp-text)` |
| Viewer status link `.gp-viewer__status-link` | `12px` / `var(--gp-accent)` |
| Page download button `.gp-download-btn` | `16px` glyph in a `30px` button |
| File size `.gp-file-size` | `11px` / `var(--gp-text-muted)` / tabular |
| File size column header `.gp-file-meta-head` | `0` (visually collapsed, like GitHub's own header cells) |
| File download button `.gp-file-download` | `16px` glyph in a `28px` icon button |
| Context menu `.gp-context-menu` | `13px/1.4` / `var(--gp-text)` |
| Context menu row `.gp-context-menu__item` | `13px` / `var(--gp-text)`; a `16px` muted glyph, label ellipsized |
| Age legend label `.gp-age-legend__label` | `12px` / `var(--gp-text-muted)` |
| Menu row label `.gp-user-menu-item__label` | `14px/1.4` / `var(--gp-text)` (GitHub's `ActionList` size) |

- Weights are only `500` (controls, chrome) and `600` (labels, titles);
  nothing is `700` or heavier.
- Numeric columns use `font-variant-numeric: tabular-nums` (viewer counter is
  the shipped example).

## 6. Component rules

Class names below are the ones actually built by the components; a class that
exists in `app.css` without a rule is listed as "structural".

### Settings entry button

| Class | Purpose |
|---|---|
| `.gp-header-btn` | The button itself: `32×32`, inline-flex centered, `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-2)` |
| `.gp-settings-btn` | Second class on the same element (built by `src/features/settings/index.js`); the root scanned in `isOwnUi()` |
| `.gp-header-btn__icon` | Icon wrapper `<span>`; **structural** (the Octicons `gear` glyph, filled with `currentColor`, styled by `.gp-header-btn svg`, `16×16`) |
| `.gp-settings-item` | `<li>` host when the header target is a `<ul>`; structural, no rules |
| `.gp-header-btn--custom` | Modifier added while any setting differs from defaults; draws a `6×6` `var(--gp-accent)` dot at top-right 4px |

The button is mounted into `.AppHeader-globalBar-end`, then
`.AppHeader-globalBar`, then `#user-links`, and is re-mounted when GitHub
swaps the header. It carries `title` and `aria-label` from `settings.open`.

### Settings entry — user menu row

| Class | Rules |
|---|---|
| `.gp-user-menu-item` | The `<li>` injected into GitHub's user (avatar) menu; `display: block`, and the root scanned in `isOwnUi()` |
| `.gp-user-menu-item__btn` | The row itself: flex, centered, `gap: 8px`, full width, `min-height: 32px`, `padding: 6px 8px`, no border, no fill, `var(--gp-radius)` |
| `.gp-user-menu-item__icon` | `16×16` leading glyph in `var(--gp-text-muted)`; **structural** wrapper (the Octicons `gear` glyph, filled with `currentColor`, sized by `.gp-user-menu-item__icon svg`) |
| `.gp-user-menu-item__label` | Flexible label; `14px/1.4` in `var(--gp-text)` |
| `.gp-user-menu-item__dot` | Trailing `6×6` `var(--gp-accent)` dot, hidden until the modifier below is set |
| `.gp-user-menu-item--custom` | Modifier added while any setting differs from defaults (the user-menu twin of `.gp-header-btn--custom`) |

The row is built by `src/features/settings/userMenu.js` and inserted after
GitHub's own "Settings" row — before the last group divider when that row is
missing. It reproduces GitHub's `ActionList` metrics with our own classes
rather than copying GitHub's hashed ones, so a GitHub restyle leaves a
slightly different row instead of a broken menu. Clicking it closes the menu
with the `Escape` keydown GitHub's own overlay handles, then opens the panel.

### Panel shell

| Class | Rules |
|---|---|
| `.gp-panel-overlay` | `position: fixed; inset: 0; z-index: 1000000`; flex centering; `padding: 24px 16px`; `background: var(--gp-scrim)`; `backdrop-filter: blur(8px) saturate(120%)` (`-webkit-` prefixed too) so the page behind the scrim is frosted and the panel reads as a layer above it, while a manager without `backdrop-filter` support keeps the plain scrim; sets `var(--gp-font)`/`var(--gp-text)`; fades in with `gp-overlay-in`. `.is-closing` plays `gp-overlay-out` and ignores the pointer until the script removes the element; `.is-dirty` is set while the draft differs from the stored settings |
| `.gp-panel` | Vertical flex column; `width: min(900px, 100%)`; `height: min(86vh, 720px)` (fixed, so switching pages never resizes it); `overflow: hidden`; entrance `gp-panel-in`, exit `gp-panel-out`; `var(--gp-bg-1)`; `1px var(--gp-border)`; `var(--gp-radius-lg)`; no shadow (the panel reads as a layer through the frosted scrim alone); base `14px/1.5` |
| `.gp-panel__header` | Flex, `align-items: center`, `gap: 12px`, `padding: 14px 16px`, bottom `1px var(--gp-border)`, `var(--gp-bg-2)`. Wraps at the mobile breakpoint, where the search field takes a full row |
| `.gp-panel__brand` | Title + subtitle column, `flex: 1 1 auto`; **structural** |
| `.gp-panel__title-row` | Wrapping flex row holding title and version chip |
| `.gp-panel__title` | `16px/600`, `var(--gp-text)` |
| `.gp-panel__version`, `.gp-badge` | Pill chip: `1px var(--gp-line)`, `999px` radius, mono `500 11px` |
| `.gp-panel__subtitle` | `12px` muted, `margin: 4px 0 0` |
| `.gp-panel__close` | `32×32` ghost square (`border: 1px solid transparent`), `var(--gp-radius)`, Octicons `x` glyph `16×16` |
| `.gp-searchbar` | Header search: flex, `flex: 0 1 280px`, `height: 32px`, `padding: 0 7px 0 9px`, `gap: 6px`, `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-1)`; `:focus-within` moves the border to `var(--gp-accent)` and draws the `2px var(--gp-focus)` inset ring |
| `.gp-searchbar__input` | Borderless, transparent, fills the field; removes WebKit's native search decorations |
| `.gp-searchbar__kbd` | Decorative `/` chip, hidden once the input has a value (`:not(:placeholder-shown)`) |
| `.gp-searchbar__clear` | `20×20` ghost close button, hidden until the input has a value |
| `.gp-panel__main` | Row holding the sidebar and the body: `flex: 1 1 auto`, `min-height: 0` |
| `.gp-panel__body` | Scroll pane: `flex: 1 1 auto`, `min-width: 0`, `overflow-y: auto`, `overscroll-behavior: contain`, `scrollbar-gutter: stable` (pages of different heights never shift the content), `padding: 20px 24px 24px` |
| `.gp-panel__footer` | Sticky action bar: `12px 16px`, top `1px var(--gp-border)`, `var(--gp-bg-2)` |
| `.gp-panel__footer-note` | Flex, `margin: 0 auto 0 0` (pushes actions right), `12px` muted; turns `var(--gp-text)` while the draft is dirty and reads `panel.unsaved` instead of the save hint (`aria-live="polite"`) |
| `.gp-panel__dirty-dot` | `8×8` `var(--gp-accent)` dot before the note; zero width and scaled out until `.is-dirty` |

The two panel scroll panes (`.gp-panel__body`, `.gp-panel__nav`) carry a custom
thin scrollbar instead of the browser default: `scrollbar-width: thin` with
`scrollbar-color: var(--gp-line) transparent` for Firefox, and a `12px`
WebKit scrollbar whose transparent track and `3px` transparent border leave a
rounded `6px` `var(--gp-line)` thumb over the surface; hovering the thumb
darkens it to `var(--gp-border)`. The thumb therefore reads as part of the
panel rather than as a native control.

`.gp-panel [hidden] { display: none }` makes the `hidden` attribute usable on
any panel descendant (the overlay's own rule covers the root). The overlay is
built on every open (so labels follow the interface language) and removed
140ms after close, once its exit animation has played. The panel is
`role="dialog"`, `aria-modal="true"`, `aria-label` = script name, focused on
open, and closes on `Escape`, the close button, or an overlay click; focus
returns to the element that opened it when that element is still in the page. Footer order:
note, Reset (`.gp-button--ghost`), Cancel (default), Save
(`.gp-button--primary`).

### Panel sidebar and pages

| Class | Rules |
|---|---|
| `.gp-panel__nav` | Left sidebar, `<nav>`: `flex: 0 0 220px`, column, `gap: 14px`, `padding: 14px 10px 14px 14px`, right `1px var(--gp-border)`, `var(--gp-bg-2)`, the panel's thin custom scrollbar. Becomes a horizontal tab strip at the mobile breakpoint (§9) |
| `.gp-nav-group` | Column of items under one section label: `gap: 2px`. `display: contents` in the tab strip, so items flow into the strip |
| `.gp-nav-group__label` | Uppercase section caption (`Preferences`, `More`), `11px/600`, muted, `padding: 0 10px 5px`; hidden in the tab strip |
| `.gp-nav-item` | Sidebar button: flex, `gap: 8px`, `min-height: 34px`, `padding: 6px 10px`, no border, transparent, `var(--gp-radius)`, `14px/1.4`; hover takes `var(--gp-highlight)`. `data-page` carries the page id |
| `.gp-nav-item.is-active` | The open page (also `aria-current="page"`): `600` weight, accent glyph, `var(--gp-bg-1)` fill with an inset `1px var(--gp-line)` edge, and a `3px` `var(--gp-accent)` pill on the left edge (`::before`, `scaleY` 0 → 1) |
| `.gp-nav-item__icon` | `16×16` glyph, `var(--gp-text-muted)`, `var(--gp-accent)` while active; **structural** wrapper |
| `.gp-nav-item__title` | Ellipsized label |
| `.gp-nav-item__count` | Match-count pill shown in place of the active marker while a search is active (hidden when zero, hidden in the tab strip) |
| `.gp-panel__page` | Structural wrapper of the open page |
| `.gp-page__head` | Page header: flex, `gap: 12px`, icon well + heading column, `margin: 0 0 18px`, `padding: 0 0 16px`, bottom `1px var(--gp-line)` |
| `.gp-page__icon` | `38×38` tinted well (`var(--gp-accent-soft)` / `var(--gp-accent)`), `20×20` page glyph; `34×34` at the mobile breakpoint |
| `.gp-page__heading` | Min-width-0 column holding the title and description; **structural** |
| `.gp-page__title` / `.gp-page__desc` | `20px/600` strong h3 / `13px` muted line (from the page's `labelKey` / `descKey`) |
| `.gp-page` | Structural content column rendered by the page module |

Exactly one page is always open: the first registered page on a fresh session,
afterwards the last one used (kept until reload). Pages are filed under two
sidebar groups by their `group` in `registerPage`: `preferences` and `more`.
`ArrowUp`/`ArrowDown` (and `ArrowLeft`/`ArrowRight` in the tab strip) move
between pages with wrap-around.

### Cards, rows, hints, fields

| Class | Rules |
|---|---|
| `.gp-card` | `margin: 0 0 16px` (last child `0`), `overflow: hidden`, `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-1)` |
| `.gp-card__head` | Flex, `gap: 14px`, `padding: 12px 16px`, bottom `1px var(--gp-line)`, `var(--gp-bg-2)` |
| `.gp-card__head-text` | `flex: 1 1 auto`, `min-width: 0`; **structural** |
| `.gp-card__head--action` / `.gp-card__head-control` | Header with a control on the right (a master switch); the control holder is `flex: 0 0 auto` |
| `.gp-card--bare` | Header-only feature card: no body, head `padding: 14px 16px`, no bottom rule (keeps the card radius) |
| `.gp-card__title` / `.gp-card__hint` | `13px/600` strong (`14px` in a bare card) / `12px` muted (`margin: 3px 0 0`) |
| `.gp-card__body` | Vertical flex, no padding (rows/fields/grid bring their own) |
| `.gp-row` | Flex, `align-items: center`, `gap: 14px`, `padding: 12px 16px`, bottom `1px var(--gp-line)` (last child `0`) |
| `.gp-row__text` | `flex: 1 1 auto`, column, `gap: 2px`, `min-width: 0` |
| `.gp-row__label` / `.gp-row__hint` | `14px/500` strong / `12px` muted |
| `.gp-row__control` | `flex: 0 0 auto`, flex, `gap: 8px` |
| `.gp-hint` | Standalone `12px/1.5` muted paragraph |
| `.gp-field` | Stacked column, `gap: 6px`, `padding: 12px 16px`, bottom `1px var(--gp-line)` (last child `0`) |
| `.gp-field__label` | `13px/600` strong |

A row puts label + hint left and the control right; a field stacks label above
the control (selects, inputs, textareas) and puts an optional hint below. Use a
field for anything wide, a row for a switch or a short control.

### Switch (`.gp-switch`)

| Class | Rules |
|---|---|
| `.gp-switch` | `40×24` inline-flex, `position: relative`, `cursor: pointer` (a `<label>` in rows; a plain `<span>` inside grid cells, where the cell is the label) |
| `.gp-switch__input` | Real `<input type="checkbox">` stretched over the control, `opacity: 0`, still the keyboard/tab target |
| `.gp-switch__track` | `position: absolute; inset: 0`, `999px` radius, `var(--gp-bg-2)` fill, `1px var(--gp-border)`, animated `0.15s ease` on background/border |
| `.gp-switch__track::after` | Knob: `16×16`, `50%`, 3px inset, `var(--gp-text-muted)`; checked → `var(--gp-bg-1)` + `translateX(16px)` |

Checked state: track fill and border become `var(--gp-accent)`, knob becomes
`var(--gp-bg-1)`. Focus is drawn on the track via
`.gp-switch__input:focus-visible + .gp-switch__track`. When the visible text
is elsewhere (rows), the input carries `aria-label`; grid cells reuse
`.gp-row__label` / `.gp-row__hint` for their text.

### Select, input, textarea

| Class | Rules |
|---|---|
| `.gp-select` | Shared control box + custom chevron: two `5×5` `currentColor` gradients at `calc(100% - 15px)` / `-(10px)`, `padding-right: 28px`, `cursor: pointer` |
| `.gp-input` | Number input, fixed `width: 88px` |
| `.gp-input--wide` | `width: 100%`, mono `12px` (declared for reuse; not applied by a shipped control) |
| `.gp-textarea` | `width: 100%`, `min-height: 128px`, `padding: 8px 10px`, mono `12px/1.5`, `box-sizing: border-box`, `resize: vertical` |

`.gp-select` and `.gp-input` share: `appearance: none`,
`min-height: 32px`, `padding: 4px 10px`, `1px var(--gp-border)`,
`var(--gp-radius)`, `var(--gp-bg-1)`, `var(--gp-text)`, `14px/1.4`.
`:focus-visible` on all three is `outline: 2px solid var(--gp-focus)` with
`outline-offset: -1px` (inside the box, so the control's own border stays the
visual edge).

### Buttons (`.gp-button`)

| Class | Fill | Notes |
|---|---|---|
| `.gp-button` | `var(--gp-bg-2)`, `1px var(--gp-border)`, strong text | Neutral default/secondary |
| `.gp-button--primary` | `var(--gp-accent)` fill and border, white text | Confirm-style affirmative action (panel Save) |
| `.gp-button--danger` | `var(--gp-danger)` fill and border, white text | Destructive confirm |
| `.gp-button--ghost` | `transparent` | Cancel / low-emphasis |
| `.gp-button--block` | — | `width: 100%` (declared for reuse; not applied by a shipped control) |
| `.gp-button[disabled]` | — | `opacity: 0.55`, `cursor: default` |

Base: inline-flex, centered, `gap: 6px`, `min-height: 32px`,
`padding: 5px 14px`, `var(--gp-radius)`, `500 14px/1.4`. Hover lifts the
neutral button to `var(--gp-highlight)` + muted border; `--primary` uses
`filter: brightness(1.06)` instead of a color swap. Focus ring:
`2px solid var(--gp-focus)`, offset `1px`. `createButton(label, onClick,
className)` is the only builder — pass a tone class, never restyle ad hoc.

### Sources grid (`.gp-grid`)

| Class | Rules |
|---|---|
| `.gp-grid` | `display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; padding: 12px 14px` |
| `.gp-grid__cell` | The cell is a `<label>`: flex, `align-items: flex-start`, `gap: 10px`, `padding: 10px 12px`, `1px var(--gp-line)`, `var(--gp-radius)`, `var(--gp-bg-2)` |
| `.gp-grid__text` | Column, `gap: 2px`, `min-width: 0`, reusing `.gp-row__label` / `.gp-row__hint` for its two lines |

A cell whose switch is on (`:has(.gp-switch__input:checked)`) takes `var(--gp-accent)` as its border and `var(--gp-accent-soft)` as its fill; hover strengthens the border to `var(--gp-border)`.

Cells hold a `.gp-switch` built as markup (not a nested `<label>`, which would
be invalid HTML); the cell label makes the whole tile clickable. The grid is
rendered from the gallery source registry, so a new source appears here with
no CSS change.

### Settings search

The header field searches every registered page. The panel indexes the
rendered labels, hints and section headers (rows, fields, grid cells and card
heads) and matches every whitespace-separated term against them. While the
query is non-empty the body shows results grouped by page instead of the open
page; the sidebar drops its active fill and shows a per-page count.

| Class | Rules |
|---|---|
| `.gp-search` | Results column, `gap: 14px` |
| `.gp-search__summary` | Result line, flex, `gap: 8px`, `12px` muted; the count chip follows it |
| `.gp-search__group` | Card-like result group: `1px var(--gp-border)`, `var(--gp-radius)`, `overflow: hidden`, `var(--gp-bg-1)` |
| `.gp-search__group-head` | Tinted header: flex, `gap: 8px`, `9px 14px`, bottom `1px var(--gp-line)`, `var(--gp-bg-2)`, `12px/600`; page glyph `15×15` muted, count pill trailing |
| `.gp-search__item` | Full-width result button: column, `gap: 2px`, `10px 14px`, bottom divider, transparent fill, left-aligned text; hover `var(--gp-highlight)`, focus ring inset `-2px` |
| `.gp-search__mark` | Matched substring: `var(--gp-accent-soft)` background, `2px` radius, text color unchanged |
| `.gp-search__empty` | Centered empty state: `44px 20px`, muted search glyph `26×26`, `14px/600` title, `12px` muted hint |

Choosing a result clears the query, opens its page and scrolls the matching
row, field, cell or card head into view. That target receives `.is-spotlit`
for 1.6 s (`gp-spotlight` / `gp-spotlight-head`), which tints the row and
draws an accent inset ring. Under reduced motion the ring stays static for the
same interval.

### Confirm dialog

| Class | Rules |
|---|---|
| `.gp-confirm-overlay` | `fixed; inset: 0; z-index: 1000001`, flex centering, `padding: 24px 16px`, `var(--gp-scrim)` (no own blur — it opens above the already frosted panel overlay, and a second `backdrop-filter` would double the effect); `role="presentation"` |
| `.gp-confirm` | Column, `gap: 10px`, `width: min(400px, 100%)`, `padding: 18px`, `1px var(--gp-border)`, `var(--gp-radius-lg)`, `var(--gp-bg-1)`, `var(--gp-shadow)`, `14px/1.5`; `role="alertdialog"` |
| `.gp-confirm__title` | `15px/600` strong |
| `.gp-confirm__message` | `13px` muted |
| `.gp-confirm__actions` | Right-aligned flex, `gap: 8px`, `margin-top: 4px` |

Right-aligned actions, cancel as `.gp-button--ghost` then confirm as
`.gp-button--danger` (default tone) or `.gp-button--primary`
(`tone: 'primary'`). Focus is placed on the safe choice (cancel for danger
tone), focus is restored on close, `Escape` and an overlay click resolve
`false`, and a second call settles the first with `false`.

### Toasts

| Class | Rules |
|---|---|
| `.gp-toasts` | `fixed; right: 16px; bottom: 16px; z-index: 1000004` (above every overlay); column, `gap: 8px`, `width: min(340px, calc(100vw - 32px))`, `pointer-events: none`, `aria-live="polite"` |
| `.gp-toasts--top-right`, `--top-left` | `top: 16px; bottom: auto` (left variant also `left: 16px; right: auto`) |
| `.gp-toasts--bottom-left` | `left: 16px; right: auto` (keeps `bottom: 16px`) |
| `.gp-toast` | `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-1)`, `var(--gp-shadow)`, `13px/1.45`, `padding: 12px 12px 14px`, `pointer-events: auto`, entrance `gp-toast-in 0.2s ease-out` |
| `.gp-toast--info/--success/--warning/--error` | Type modifier composed as `gp-toast--${type}` by `showToast({ type })` (default `info`); recolors the icon and progress bar |
| `.gp-toast--clickable` | `cursor: pointer` when the toast carries `onClick` |
| `.gp-toast--leaving` | Fade + `translateX(24px)` (mirrored to `-24px` on left placements) over `0.18s` |
| `.gp-toast__icon`, `__icon--success/--warning/--error` | `18×18`, tinted `var(--gp-accent)` / `--gp-success` / `--gp-attention` / `--gp-danger`; `aria-hidden` |
| `.gp-toast__body`, `__title`, `__message` | Flexible column; `13px/600` strong title; `12px` muted message |
| `.gp-toast__actions`, `.gp-toast__action` (+`--ghost`, `--danger`) | Small buttons: `min-height: 26px`, `padding: 0 10px`, `1px var(--gp-border)`, `var(--gp-radius)`, `500 12px/24px` |
| `.gp-toast__close` | Flat `×` button, no border/background, `16px`, muted → strong on hover |
| `.gp-toast__progress` / `span` | 2px track on `var(--gp-line)` at the bottom; the `span` scales from `1` to `0` with `gp-toast-progress` (duration set inline from the toast's `duration`) |

Behavior that shapes the CSS: default corner is bottom-right (no modifier
class); at most three toasts are visible, older ones are dismissed; a toast
with a `key` refreshes instead of stacking; the progress animation pauses on
`.gp-toast:hover`; `duration: 0` renders no progress bar and pins the toast.
Errors get `role="alert"`, every other type `role="status"`.

### Page image download button

A single floating button of ours, never part of GitHub's markup: it is appended
to `<body>` and positioned over the hovered image's top-right corner. It exists
only while an eligible markdown image is hovered (see §11).

| Class | Rules |
|---|---|
| `.gp-download-btn` | `position: fixed`, `z-index: 999999` (above page chrome, below the panel's `1000000`), `30×30`, `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-1)`, `var(--gp-shadow)`, `var(--gp-text-muted)` glyph, `var(--gp-font)`, `cursor: pointer` |
| `.gp-download-btn svg` | `16×16` block glyph |
| `.gp-download-btn:hover` | `var(--gp-highlight)` fill and `var(--gp-text)` glyph |
| `.gp-download-btn[hidden]` | `display: none` |

### Context menu

One instance at a time, appended to `<body>` and positioned in viewport
coordinates (clamped 8px from every edge), so it never lands inside GitHub's
markup. It replaces the browser's menu only when the click resolves to a file;
everywhere else the native menu is left alone. Rows are
`button[role="menuitem"]`; a separator between action groups is a 1px
`var(--gp-line)` rule. It opens with focus on the first row and does not
animate — a menu that appears under the pointer should be there immediately,
and GitHub's own menus do not animate either.

| Class | Rules |
|---|---|
| `.gp-context-menu` | `position: fixed`, `z-index: 999998`, `min-width: min(208px, calc(100vw - 16px))`, `max-width: min(320px, calc(100vw - 16px))`, `padding: 4px`, `var(--gp-radius)`, `var(--gp-bg-1)`, `box-shadow: var(--gp-shadow-float)`, `var(--gp-font)`, `13px/1.4`, `var(--gp-text)`; **no border** — the shadow token's 1px ring is the edge, like GitHub's own overlays, so no second line appears in dark or high-contrast themes |
| `.gp-context-menu__item` | Full-width flex row, `gap: 8px`, `padding: 6px 8px`, `4px` radius, transparent fill, no border, inherited font, left-aligned; hover and keyboard focus share `var(--gp-highlight)` with no outline |
| `.gp-context-menu__item:disabled` | Transparent fill, `var(--gp-text-muted)` label, `cursor: default` |
| `.gp-context-menu__icon` | `flex: none`, `inline-flex`, `var(--gp-text-muted)`; its `svg` is a `16×16` block glyph from `ACTION_ICONS` |
| `.gp-context-menu__label` | `min-width: 0`, ellipsized in one line |
| `.gp-context-menu__sep` | `1px` rule in `var(--gp-line)` with `4px` vertical margins |
| `.gp-context-menu--elevated` | `z-index: 1000003` — the same menu opened from the quick preview, which must float above that overlay (`1000002`) |

The menu root is `role="menu"` and takes an `aria-label` naming the file; the
icon wrappers are `aria-hidden` (the label carries the meaning). A keyboard
open (the context-menu key or `Shift`+`F10`, reported as a click at `0,0`)
places the menu under the file's link or breadcrumb filename and returns focus
there on close; a pointer open returns nothing. Clicking a row closes the menu
before running its action. Rows that stay disabled are rendered muted rather
than hidden, so the action set keeps a stable shape.

### Image viewer

Full-viewport gallery, themed with the same tokens as the panel (see §3).

| Class | Rules |
|---|---|
| `.gp-viewer-overlay` | `fixed; inset: 0; z-index: 1000002`, `background: var(--gp-bg-1)`, `color: var(--gp-text)`, `var(--gp-font)`; fades in with `gp-overlay-in`; `[hidden]` hides it |
| `.gp-viewer` | Relative flex column, `min-width: 0`, `outline: none`, `tabindex="-1"` as the focus target; `role="dialog"`, `aria-modal="true"` |
| `.gp-viewer [hidden]` | `display: none` for every descendant, so `hidden` works on the tool bar, the counter, the pixel size, the status card, the help popover and a broken thumbnail |
| `.gp-viewer__bar` | `min-height: 48px`, `padding: 8px 12px`, `gap: 12px`, `var(--gp-bg-2)`, bottom hairline |
| `.gp-viewer__meta`, `__title`, `__size`, `__counter` | Flexible baseline row: ellipsized `13px/600` title, `11px` tabular muted pixel size, and an `11px` pill counter (`var(--gp-bg-1)` fill, `var(--gp-line)` edge) that announces changes (`aria-live="polite"`) |
| `.gp-viewer__tools`, `__tool`, `__zoom` | `flex: none`, `gap: 2px`; `30×30` ghost tools and a `52px`-wide zoom pill — transparent fill and border, `var(--gp-text-muted)` glyph, `var(--gp-radius)`; the pill shows the scale relative to the image's natural pixels |
| `.gp-viewer__tool svg` | `16×16` block glyph |
| Hover on `.gp-viewer__tool`, `.gp-viewer__zoom` | `var(--gp-highlight)` fill and `var(--gp-text)` glyph |
| `.gp-viewer__tool--close` | Hover: `var(--gp-danger)` fill and border, white glyph |
| `.gp-viewer__sep` | `1×18` divider in `var(--gp-line)` with a `4px` side margin |
| `.gp-viewer__stage` | `position: relative`, `flex: 1 1 auto`, centered on `var(--gp-bg-2)` (so a white image reads against it), `overflow: hidden`, `cursor: grab`, `touch-action: none` |
| `.gp-viewer__image` | `max-width/height: 100%`, `object-fit` fit, `transform-origin: center`, opacity `0.15s`, `user-select: none`, `-webkit-user-drag: none`; JS sets `translate(…) scale(…) rotate(…)` |
| `.gp-viewer__nav` (+`--prev`, `--next`) | `44×44` circular buttons over the stage with an `18px` chevron, `left/right: 16px`, `translateY(-50%)`; muted glyph that lifts to `var(--gp-text)` on hover; `[disabled]` at 0.5 opacity when loop is off and the end is reached; `hidden` for a single image |
| `.gp-viewer__spinner` | `32×32` ring: 3px `var(--gp-line)` with a `var(--gp-accent)` top, `gp-viewer-spin 0.8s linear infinite` |
| `.gp-viewer__status` | Error card centered over the stage: column, `gap: 8px`, `18px 20px`, `1px var(--gp-danger)`, `var(--gp-radius)`, `var(--gp-bg-1)`, `var(--gp-shadow)`, centered text with a `28px` danger glyph, the message and an accent link to the image; `role="alert"` |
| `.gp-viewer__help` | Shortcut popover floating at the stage's top-right: `min(300px, 100% - 24px)`, `12px 14px`, `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-1)`, `var(--gp-shadow)`; a head with the title and a ghost close button, then label/key rows. Hidden until the help tool or `?` opens it |
| `.gp-viewer__help-keys kbd` | Keycap: `11px` mono, `1px var(--gp-line)` with a `2px` bottom edge, `4px` radius, `var(--gp-bg-2)` fill |
| `.gp-viewer__thumbs`, `__thumb`, `__thumb-img` | Horizontal rail (`flex: none` so a tall image never squeezes it, `gap: 8px`, `padding: 10px 12px`, `overflow-x: auto`, `overflow-y: hidden`, `justify-content: safe center`, `align-items: center`) so thumbnails are centered while they fit and never raise a vertical scrollbar; `68×48` thumb buttons, `object-fit: cover` images; hidden with one image or when thumbnails are off |
| `.gp-viewer__thumb.is-active` | `var(--gp-accent)` border plus a `0 0 0 1px` accent ring; the active thumb is scrolled into view |
| `.gp-viewer__thumb-fallback` | Broken-thumbnail glyph: an absolutely centered `imageOff` icon shown only when the button has `.is-broken` (its image is hidden then) |

The toolbar is built from `VIEWER_ICONS` (`src/ui/icons.js`): 16×16
`currentColor` stroke glyphs with round caps, the same outline language the
settings pages use. Tools are ghost buttons — transparent until hovered — so
the bar stays quiet over the themed surface.

Zoom is expressed in real pixels: the pill shows the displayed scale relative
to the image's natural width, and clicking it jumps to actual size (or back to
fit-to-screen when already at 100%). The scale can go below the fit size — down
to a quarter of it — so an image can always be shown smaller than its own
pixels, and the percentage keeps falling below 100%. Wheel, double click and
pinch zoom stay anchored on the pointer, so the spot under the cursor does not
drift; the buttons and the keyboard walk the shared stops (`0.25, 0.5, 0.75, 1,
1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16`, limited by the `minZoom` option
and `maxZoom`).

Pointer and keyboard behavior is implemented in `src/ui/viewer.js`; the CSS
only has to express it: `is-dragging` → grabbing cursor, `is-loading` →
dimmed image, and the focus rings on `.gp-viewer__tool`, `.gp-viewer__zoom`,
`.gp-viewer__nav`, `.gp-viewer__thumb` and `.gp-viewer__help-close`.
The image is draggable at every zoom and the JS clamps the offset to the
stage, so panning needs no state class. While open the viewer keeps keyboard
focus inside itself (`Tab`/`Shift`+`Tab` wrap over the visible controls), the
help popover is a nested dialog that `Escape` closes first, and the overlay is
excluded from page scanning via `isOwnUi()`; opening it takes the shared scroll
lock.

### About page

| Class | Rules |
|---|---|
| `.gp-about` | Column, `gap: 14px` |
| `.gp-about__hero` | Card-ish row: `padding: 16px`, `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-2)` |
| `.gp-about__logo` | `44×44` tinted well (`var(--gp-accent-soft)` / `var(--gp-accent)`), `24×24` glyph |
| `.gp-about__name` | `16px/600` strong, alongside the `.gp-badge` version chip |
| `.gp-about__tagline` | `12px` muted |
| `.gp-about__row`, `__label`, `__value` | Two-column row: `13px`, bottom `1px var(--gp-line)` (last row none), fixed `120px` muted label, strong value, accent links underlined on hover |

### File icons (`.gp-fi`)

| Class | Rules |
|---|---|
| `.gp-fi` | The injected 16×16 SVG: `display: inline-block`, `width`/`height: 16px`, `flex: none`, `margin-right: 4px`, `vertical-align: text-bottom`, `pointer-events: none`, `user-select: none` |
| `.gp-fi-native` | Marker on the GitHub icon the feature hid. No rule in `app.css`: the hiding is an inline `display: none !important` written by `src/features/fileIcons/inject.js` |

The glyph itself comes from the embedded Material Icon Theme slice and keeps
its own colors (§3). Each icon is drawn in the `viewBox` its source was
authored in (16, 24, 32 or a larger grid), so it scales into the 16×16 box
instead of being cropped to the top-left corner. The feature inserts `.gp-fi` next to GitHub's own icon and
hides that icon with an inline style, so `app.css` never selects GitHub's
markup and the gallery affordance stays the only page-markup stylesheet.
Disabling the feature removes every `.gp-fi` and restores every native glyph,
so the page returns to stock GitHub. Both the small-screen and large-screen
name cells of a repository row are decorated, in that DOM order.

### File ages (`.gp-age-date`)

A blame-style tint applied to the last-commit date GitHub already renders. The
newest dates carry the warm accent and older ones fade to the theme's muted
grey, so a stale row steps back and a fresh one stands out. The feature inserts
nothing: it adds its own classes to the `<relative-time>` element, so the text,
its layout and its accessibility are untouched.

| Class | Rules |
|---|---|
| `.gp-age-date`, `.gp-age-date *` | `color: var(--gp-age-current, inherit) !important`, so the color also wins over a nested span or link; the font and its weight stay GitHub's own |
| `.gp-age--1` … `.gp-age--10` | Set `--gp-age-current` to the matching `--gp-age-N` token; `1` is the oldest band, `10` the newest |
| `.gp-age-legend` | Settings preview: flex row, `gap: 8px`, `padding: 12px 16px` |
| `.gp-age-legend__label` | End labels (`Older` / `Newer`), `12px` muted |
| `.gp-age-legend__scale` | Inline-flex, `gap: 6px`; `aria-hidden` |
| `.gp-age-legend__sample` | Colored `Aa` sample, `13px/1`, same `gp-age--N` classes so it previews the real ramp |

The colored text is redundant with the relative wording GitHub already shows
(“last month”, “2 days ago”), so age remains understandable without color and
no `aria-*` attribute is added. Turning **File ages** off removes both classes
from every timestamp, restoring GitHub's own color, and `app.css` never selects
a GitHub-owned class: the two exception classes are ours and exist only while
the feature is on.

### File sizes and downloads (`.gp-file-meta`)

A column of our own: a `th` naming it in the listing's header row and a `td`
appended to every listing row. File rows fill the cell with the size and the
button; folder rows keep it empty so every row has the same column count. The
size starts at the column's left edge and the button is pushed to the right
edge, so it sits on the table's border. GitHub's
own cells are never restyled, reordered or nested into, and the column is not
added to the blob header, where GitHub already shows the size and its own
download button.

GitHub collapses the listing's header row by setting its cells to
`font-size: 0`: the labels stay in the DOM for assistive tech but paint
nothing. Our `th` follows that convention rather than adding a header band of
its own.

| Class | Rules |
|---|---|
| `.gp-file-meta-cell`, `.gp-file-meta-head` | `104px` wide, `0 8px` padding, middle-aligned, nowrap |
| `.gp-file-meta-head` | `font-size: 0` — the column name is exposed to assistive tech, not painted |
| `.gp-file-meta` | Full-width flex, `gap: 6px`, `11px/1` tabular `var(--gp-text-muted)`, no fill or border |
| `.gp-file-size` | The size text, left edge of the column; `[hidden]` while the probe has not answered, so an unknown size leaves no gap |
| `.gp-file-download` | GitHub's icon-button shape: `28×28`, `var(--gp-radius)`, no border, transparent fill, `var(--gp-text-muted)` glyph; `margin-left: auto` keeps it on the right edge even when the size is absent |
| `.gp-file-download svg` | `16×16` block glyph (`VIEWER_ICONS.download`) |
| `.gp-file-download:hover` | `var(--gp-highlight)` fill, `var(--gp-text)` glyph |

The column follows GitHub's own breakpoints. From `1012px` it keeps its full
width with the size and the button; between `768px` and `1012px` the listing
shares its width with the repository sidebar, so the column narrows to `40px`
and keeps only the button; below `768px` GitHub's compact listing has no room
and the column is hidden.

Turning the feature off removes the cells and the header label, leaving the
table exactly as GitHub rendered it.

### Quick file preview (`.gp-preview`)

A centered modal above the page with the same anatomy as the panel: a header
bar (`--gp-bg-2`) with a border-bottom, a scrolling body on `--gp-bg-1`, and a
footer bar. It shares the highest overlay band (`z-index: 1000002`) with the
viewer and the confirm dialog, above the settings panel; the context menu it
opens uses the elevated variant and toasts sit above everything.
Width is `min(1080px, 100%)` and height `min(88vh, 820px)`, so a wide file has
room while the modal never touches the viewport edges; the backdrop is the
shared `--gp-scrim` with the same blur as the viewer.

| Class | Rules |
|---|---|
| `.gp-preview-overlay` | Fixed inset, centered flex, `16px` padding, `var(--gp-scrim)`, `blur(8px) saturate(120%)`, `gp-overlay-in` |
| `.gp-preview` | Column flex, `var(--gp-bg-1)`, 1px `var(--gp-border)`, `var(--gp-radius-lg)`, `gp-panel-in`; `[hidden]` is declared explicitly |
| `.gp-preview__header` | Header bar: `10px 12px 10px 16px`, `gap: 12px`, `var(--gp-bg-2)`, bottom border |
| `.gp-preview__name` | The file name, `h2`-like, truncating with an ellipsis; the meta line beside it is `11px` mono `var(--gp-text-muted)` |
| `.gp-preview__seg`, `.gp-preview__seg-btn` | Segmented Preview/Source control: 28px pill row on `var(--gp-bg-2)`; the pressed segment takes `var(--gp-bg-1)` with a `var(--gp-border)` ring and `var(--gp-text)` |
| `.gp-preview__tools`, `.gp-preview__tool` | GitHub icon-button row: `28×28`, `var(--gp-radius)`, transparent fill, `var(--gp-text-muted)` 16px glyphs, `var(--gp-highlight)` + `var(--gp-text)` on hover; close is the same shape with the danger tone on hover |
| `.gp-preview__content` | The scrolling body, `overflow: auto`, focusable so a long file can be scrolled by keyboard |
| `.gp-preview__spinner`, `.gp-preview__spinner-ring` | The shared accent spinner while a file loads |
| `.gp-preview__footer` | Footer bar: `var(--gp-bg-2)`, top border, prev/next at the ends and the position centered |
| `.gp-preview__nav`, `.gp-preview__counter` | Prev/next are icon buttons with the counter in `11px` tabular `var(--gp-text-muted)`; a `[disabled]` arrow drops to `opacity: 0.5` |
| `.gp-preview__code`, `.gp-preview__gutter`, `.gp-preview__line-no`, `.gp-preview__pre` | Code view: a gutter of right-aligned `11px` mono line numbers on `var(--gp-bg-2)` beside the highlighted `<pre>` |
| `.gp-preview__md` | Rendered markdown: the same vertical rhythm and heading scale as GitHub's `.markdown-body`, links in `var(--gp-accent)`, inline code and tables on `var(--gp-bg-2)`, blockquotes with a `var(--gp-border)` rule |
| `.gp-preview__image`, `.gp-preview__media-wrap`, `.gp-preview__media`, `.gp-preview__pdf-wrap`, `.gp-preview__pdf` | Image/video/audio are centered and capped to the body (the media sits in an unstyled wrapper so it can be replaced by a card); the PDF iframe fills the body with a `var(--gp-bg-2)` fill, and its wrapper takes the same box so a fallback card replaces the frame in place |
| `.gp-preview__card`, `.gp-preview__card-icon`, `.gp-preview__card-title/-desc/-meta/-actions/-action` | Honest card for binary, empty, too-large and failed files: a 44px circular icon well, a 16px title, a 13px muted description, a mono meta line and outline actions (28px) |

Highlighting colors come from the `--gp-code-*` tokens and are selected only by
`.hljs-*` classes inside the preview, so no page markup is ever styled. The eye
button column (`.gp-file-preview-cell`, `.gp-file-preview-head`,
`.gp-file-preview-btn`) repeats the file-meta column's rules — a 44px column, a
28×28 icon button, `font-size: 0` on the header cell — with a `10px` right
padding so the button keeps a gap from the table's edge, and is hidden below
`768px`. Folder rows carry the same empty cell, so every row has the same
column count. Below `720px` the header wraps its heading onto its own row.

The copy menu in the header is the shared context menu opened with
`elevated: true`, because the preview overlay (`1000002`) would otherwise paint
over it; it takes `.gp-context-menu--elevated` (`1000003`).

## 7. States

| State | Selector / form | Effect |
|---|---|---|
| Hover | `:hover` on `.gp-header-btn`, `.gp-user-menu-item__btn`, `.gp-button`, `.gp-toast__action`, `.gp-toast__close`, `.gp-viewer__tool`, `.gp-viewer__zoom`, `.gp-viewer__nav:not([disabled])`, `.gp-viewer__thumb`, `.gp-viewer__help-close`, `.gp-viewer__status-link`, `.gp-about__value a` | Fill moves to `var(--gp-highlight)` or the border/text moves to the accent; viewer tools, the zoom pill and help close take the highlight fill with a strong glyph, the thumbnail border moves to the muted text color, and the status link underlines |
| Focus | `:focus-visible` | `outline: 2px solid var(--gp-focus)` on controls, buttons, nav items, the header button, the user-menu row, viewer tools and viewer nav |
| Focus offset | `outline-offset` | `1px` on buttons/nav/header/entry/viewer controls, `2px` on the switch track, `-1px` on select/input/textarea (inside the box), `-2px` on `.gp-user-menu-item__btn` (inside the row, so it stays inside GitHub's menu) |
| Disabled | `.gp-button[disabled]` | `opacity: 0.55`, `cursor: default` |
| Disabled | `.gp-viewer__nav[disabled]` | `opacity: 0.5`, `cursor: default`, hover suppressed |
| Active page | `.gp-nav-item.is-active` | Bold label, accent glyph, raised fill and left pill (bottom underline in the tab strip) |
| Searching | `.gp-panel-overlay.is-searching` | Sidebar drops its active fill, page items show match counts, and the body shows the grouped result list |
| Search result target | `.is-spotlit` on a row, field, grid cell or card head | Tinted highlight and accent inset ring for 1.6 s after a result is chosen |
| Dirty draft | `.gp-panel-overlay.is-dirty` | Footer note switches to "Unsaved changes" with an accent dot |
| Closing | `.gp-panel-overlay.is-closing` | Exit animation plays, pointer ignored, element removed after 140ms |
| Active thumb | `.gp-viewer__thumb.is-active` | `var(--gp-accent)` border + 1px accent ring |
| Help open | `.gp-viewer__help:not([hidden])` | The shortcut popover is visible and the help tool reports `aria-expanded="true"`; `Escape` closes it before the viewer |
| Broken thumb | `.gp-viewer__thumb.is-broken` | The thumbnail image is hidden and the muted `imageOff` fallback is shown |
| Download hover | `.gp-download-btn:not([hidden])` | The floating button is shown over the hovered markdown image's top-right corner; hidden on pointer-out, scroll, resize and navigation |
| File download hover | `.gp-file-download:hover` | The icon button takes the `var(--gp-highlight)` fill and a `var(--gp-text)` glyph, like GitHub's own icon buttons |
| Context menu row hover | `.gp-context-menu__item:hover`, `.gp-context-menu__item:focus-visible` | `var(--gp-highlight)` fill, no outline (the row fill is the focus indicator inside the menu) |
| Context menu row disabled | `.gp-context-menu__item:disabled` | `var(--gp-text-muted)` label, transparent fill, default cursor |
| Rotated | `.gp-viewer.is-rotated` | Toggled by `paint()`; the stage keeps its `grab` cursor because the image is draggable at every zoom |
| Loading image | `.gp-viewer__image.is-loading` | `opacity: 0.25` while the source loads (also during an in-place full-size upgrade) |
| Dragging | `.gp-viewer.is-dragging` | Stage cursor becomes `grabbing` for the duration of a pan |
| Custom settings | `.gp-header-btn--custom`, `.gp-user-menu-item--custom` | Dot in `var(--gp-accent)` (corner of the header button, trailing in the menu row) while settings differ from defaults; the menu dot is `display: none` until the modifier is set |
| Hidden | `[hidden]` on `.gp-panel-overlay`, `.gp-viewer-overlay`, `.gp-viewer__nav`, `.gp-viewer__thumbs`, `.gp-viewer__spinner`, `.gp-viewer__status`, `.gp-viewer__help`, `.gp-viewer__counter`, `.gp-viewer__size`, or on any descendant of `.gp-panel` / `.gp-viewer` | `display: none`, declared explicitly so GitHub's own resets cannot re-show our chrome. Elements outside those scopes (e.g. `.gp-toast__message`) rely on the user-agent `[hidden]` rule |

State classes are the only state mechanism: never add inline styles for state
in JS (the viewer's `transform` and the toast progress duration are the two
shipped exceptions, because both are per-frame values).

## 8. Motion

| Motion | Spec |
|---|---|
| Switch track and knob | `0.15s ease` on background/border and on transform/background |
| Viewer overlay | `gp-overlay-in` fade over `0.16s ease-out` when it opens |
| Viewer image | `opacity 0.15s ease` (load/upgrade dimming) |
| Toast entrance | `gp-toast-in` — fade + `translateX(±24px)` over `0.2s ease-out`; left placements mirror the offset |
| Toast exit | `0.18s ease` on opacity and transform, then removal after 180ms |
| Toast progress | `gp-toast-progress` — `scaleX(1 → 0)`, `linear`, duration set inline from the toast's own `duration`; paused on hover |
| Panel/confirm overlay | `gp-overlay-in` fade `0.16s` (`0.14s` confirm) ease-out; panel exit `gp-overlay-out` + `gp-panel-out` `0.14s` ease-in |
| Panel/confirm dialog | `gp-panel-in` — fade + `translateY(10px) scale(0.98)` → rest over `0.2s` (`0.18s` confirm), `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Page content | `gp-rise` — the page head and each direct child of the page (cards, hero) fade in with `translateY(6px)` over `0.24s`, staggered `0 / 40 / 80 / 120ms` |
| Sidebar | Active pill `scaleY` `0.18s`; glyph color `0.12s`; item background and edge `0.12s` |
| Search | Field border `0.12s`; result and clear-button hover use the same short ease |
| Spotlight | `gp-spotlight` (row/field/cell tint) or `gp-spotlight-head` (card-head ring) over `1.6s ease-out`; no motion under reduced motion |
| Footer dirty dot | width, margin and scale `0.18s` |
| Switch knob | `0.2s` spring (`cubic-bezier(0.2, 0.8, 0.2, 1)`); stretches to `20px` while pressed |
| Controls | Border/fill changes on select, input, textarea, button, panel close, source tiles and the page download button take `0.12s` |
| Viewer spinner | `gp-viewer-spin` — one rotation per `0.8s`, linear, infinite |

- Hover on elements placed into GitHub's own chrome (the header button and the
  avatar-menu row) has no transition on purpose: they must feel native, and
  animated hover on a page we do not own reads as foreign. Surfaces we draw
  ourselves (panel, dialogs, toasts, viewer) use the short transitions above.
  The context menu is the second native-feel exception: it appears instantly
  and its row highlight has no transition, like GitHub's own menus.
- Only one coordinated entrance per surface; no loops except the spinner; no
  bounce, no decorative animation.
- `@media (prefers-reduced-motion: reduce)` disables animation and transition
  for the panel and confirm overlays and dialogs, the page head and page
  children, sidebar items and their pill, the dirty dot, `.gp-toast`,
  `.gp-toast--leaving`, `.gp-switch__track`, `.gp-switch__track::after`,
  `.gp-file-download`, `.gp-viewer-overlay`, `.gp-viewer__image` and the search
  result spotlight (which keeps a static accent ring instead). The viewer spinner and
  the toast progress bar are outside that list (a spinner and a countdown are
  information, not decoration), so do not "fix" them by adding them to the
  media block without deciding what replaces the information they carry.

## 9. Responsive behaviour

The stylesheet has one breakpoint, `@media (max-width: 640px)`:

| Selector | Change |
|---|---|
| `.gp-panel-overlay` | `padding: 0; align-items: stretch` — the panel fills the viewport |
| `.gp-panel` | `width: 100%; height: 100%; border-radius: 0; border-left: 0; border-right: 0` — edge-to-edge sheet |
| `.gp-panel__header` | `flex-wrap: wrap` — brand and close share the first row |
| `.gp-searchbar` | `order: 3; flex: 1 0 100%` — the search field takes its own full-width row |
| `.gp-panel__main` | `flex-direction: column` — the sidebar sits above the body |
| `.gp-panel__nav` | Horizontal, scrollable tab strip: `flex-direction: row`, `padding: 8px 12px`, bottom border instead of right, no scrollbar (`scrollbar-width: none`, WebKit `display: none`) so the strip stays clean while wheel/touch still scrolls it; items shrink to content and the active marker becomes a `2px` underline (`scaleX`) |
| `.gp-nav-group` | `display: contents`, so group items flow into the strip |
| `.gp-nav-group__label`, `.gp-nav-item__count` | Hidden |
| `.gp-nav-item.is-active` | Drops the raised fill and inset edge; the strip keeps only the underline marker |
| `.gp-page__icon` / `svg` | `34×34` well, `18×18` glyph |
| `.gp-panel__body` | `padding: 16px 14px 20px` |
| `.gp-panel__subtitle` | Hidden |
| `.gp-panel__footer` / `-note` | Wraps; the note takes its own full-width line |
| `.gp-viewer__bar` | `gap: 6px`, `padding: 6px 8px` |
| `.gp-viewer__title`, `.gp-viewer__size` | Hidden — the counter and the tools keep the bar compact |
| `.gp-viewer__tool`, `.gp-viewer__zoom` | `32px` tools and a `46px` pill with `17px` glyphs |
| `.gp-viewer__tool--help` | Hidden (no hardware keyboard on touch) |
| `.gp-viewer__sep` | `2px` side margin |
| `.gp-viewer__nav` | `38px` circles, offset `8px` from the stage edge |
| `.gp-viewer__thumbs` / `.gp-viewer__thumb` | `8px` rail padding and gap `6px`; `56×40` thumbs |
| `.gp-viewer__help` | Spans the stage: `left: 10px; right: 10px; width: auto` |

Everything else is fluid by construction and must stay that way:

- The panel is `min(900px, 100%)` wide and `min(86vh, 720px)` tall, so it
  shrinks before the breakpoint and only changes shape at it.
- The sources grid reflows on its own (`repeat(auto-fit, minmax(180px, 1fr))`);
  no media query is needed for new tiles.
- Toasts are `min(340px, calc(100vw - 32px))` wide and pinned 16px from the
  corner.
- The context menu sizes between `min(208px, calc(100vw - 16px))` and
  `min(320px, calc(100vw - 16px))`, and its position is clamped 8px from every
  viewport edge, so it never needs a media query of its own.
- Rows put text in a `min-width: 0` flex column and the control at
  `flex: 0 0 auto`, so long labels ellipsize/shrink instead of pushing the
  control out.
- Do not add fixed pixel widths to user-visible text containers; the only
  fixed widths are control-sized (`.gp-input` 88px, `.gp-about__label` 120px,
  grid `minmax(180px, 1fr)`).

## 10. Accessibility

- **Visible focus everywhere.** Every keyboard-reachable control defines
  `:focus-visible` with the `2px solid var(--gp-focus)` ring. Never remove an
  outline without replacing it.
- **Roles.** The panel is `role="dialog"` + `aria-modal="true"`; the search
  field wrapper is `role="search"`; the viewer is `role="dialog"` +
  `aria-modal="true"` and the element focused on open (`tabindex="-1"`); its
  shortcut popover is a nested `role="dialog"`, and the image counter is
  `aria-live="polite"`; the confirm dialog is `role="alertdialog"` +
  `aria-modal="true"` over a `role="presentation"` overlay; the context menu is
  `role="menu"` with `button[role="menuitem"]` rows and an `aria-label` naming
  the file; the viewer's failure card and error toasts are `role="alert"`, all
  other toasts `role="status"`, and the toast container is `aria-live="polite"`.
- **Names.** Icon-only controls carry both `title` and `aria-label`
  (`.gp-panel__close` = `common.close`, viewer tools/nav/open/download, the
  entry button = `settings.open`, the page download button = `viewer.download`,
  the file download button = `files.downloadFile` with the filename
  interpolated, the toast close = `×`). The zoom pill is named by
  `viewer.actualSize` / `viewer.fit` depending on what a click will do, and the
  help tool reports `aria-expanded` for the panel it controls. Labels come from
  the locale files, never from hardcoded English in CSS. The user-menu row is
  named by its own visible text, also `settings.open`.
- **File-age date color.** The tint is applied to GitHub's own relative date,
  so its text and accessible name are unchanged and the color is redundant with
  the words. The settings-page samples are decorative (`aria-hidden`) and carry
  text end labels; the per-theme ramps in §3 keep the date at a readable
  contrast in either theme.
- **Switch labelling.** `.gp-switch__input` is opacity-hidden, not
  `display: none`, so it stays focusable and its `aria-label` (or the wrapping
  row's text) names it; rows that already show the text pass it as the
  `aria-label`.
- **Keyboard.** Panel: `Escape` closes it (`Escape` in a non-empty search
  field clears the query first); `/` or `Ctrl`/`Cmd`+`K` focuses the search
  field; `ArrowUp`/`ArrowDown` (`ArrowLeft`/`ArrowRight` in the tab strip)
  switch pages from the sidebar; in search, `ArrowDown` from the field or
  `ArrowUp`/`ArrowDown` inside the results moves through matches and `Enter`
  opens the first one. The viewer owns `Escape` while open. Viewer: `←`/`→`
  navigate, `Home`/`End` jump, `+`/`=`/`-` zoom, `0` resets, `r` rotates,
  `?` or `h` opens the shortcut popover (`Escape` closes it first), `Tab` and
  `Shift`+`Tab` cycle through the visible controls without leaving the viewer,
  wheel zooms around the pointer, drag pans at any zoom, double click toggles
  between fit and actual size, pinch zooms.
  Confirm: `Escape` cancels and focus goes to the safe choice, then returns to
  the element that opened it.
  Context menu: `ArrowUp`/`ArrowDown` move with wrap-around, `Home`/`End` jump,
  `Enter`/`Space` run the row, `Escape` and `Tab` close it, and focus returns
  to the file link or breadcrumb after a keyboard open.
- **Scroll lock.** While a modal is open the page behind is pinned
  (`html.gp-modal-open`), so pointer and keyboard focus cannot drift under the
  overlay; the lock is counted and released on close.
- **Contrast.** Body text uses `var(--gp-text)` on `var(--gp-bg-1)` surfaces
  and `var(--gp-text)` for labels; reserve `var(--gp-text-muted)` for
  hints, descriptions and counters, never for the only copy of essential
  information.

## 11. The gallery's page-level affordances

The gallery lets you click an image inside GitHub's rendered markdown and hover
it for a download button. The cursor needs a rule on **GitHub's own** `<img>`
elements — markup no selector in `app.css` may target (§1). That exception is
therefore generated at runtime by `src/gallery/index.js` into a
`<style id="gp-gallery-style">` in `<head>`, one block per enabled source:

```css
<selector> { cursor: zoom-in; }
```

- `<selector>` comes from the source registry (`cursorSelector` in
  `src/gallery/sources.js`); the markdown source uses
  `.markdown-body img:not(.emoji), .markdown-body a:has(> img:not(.emoji))`.
- **The image itself is never restyled.** No border, outline or overlay: a
  markdown image keeps exactly the look GitHub gives it, and the cursor is the
  only hint on the image that it opens in the gallery.
- The one other page-level element is the floating download button (§6). It is
  our own `.gp-download-btn` appended to `<body>` and positioned over the
  hovered image, never inserted into GitHub's markup, so the page DOM and
  GitHub's styles are untouched. It appears only while the gallery and its
  `gallery.download` setting are on.
- The stylesheet is rewritten whenever gallery settings change and **removed
  entirely** when no source is enabled, so a disabled gallery leaves the page
  byte-identical to stock GitHub. There is no global page scan and no
  per-element class injection.
- Consequence for anyone editing `app.css`: add a new gallery location by
  registering a source with its own `cursorSelector`, never by writing a
  page-markup rule into `app.css`.
- The file-icons, file-ages and file-meta features are the other kind of
  exception. File icons insert their own `.gp-fi` elements and hide GitHub's
  glyph with an inline style; file ages add only their own `.gp-age-date` /
  `.gp-age--N` classes to GitHub's timestamp; file meta appends its own cell
  and header cell. All three keep
  “no rule targets a GitHub-owned class” true, and all three remove every trace
  when disabled.
- Our own UI is excluded from this behavior: the click and pointer handlers
  ignore any target inside `isOwnUi()` and any image wrapped by GitHub's
  `a.anchor`, so the affordances never fight with heading anchors or our
  overlays.

## 12. Keeping this file in sync

Any visual change must land as one change across `tokens.css`, `app.css` and
this document: update the token table (§2), the component table (§6) and the
state/motion rows you touched. Then rebuild (`npm run build`) and eyeball the
result on a real GitHub page in both themes (light and dark), in the panel, the
confirm dialog, a toast and the viewer — including the `<= 640px` layout and an
`Escape`-only keyboard pass.
