# DESIGN.md — GitHub Plus visual rules

This file is the single source of truth for how GitHub Plus looks and behaves.
Follow it for every change that adds, moves or restyles an injected element:
the settings entry button, the settings panel and its controls, the confirm
dialog, toasts, and the image viewer. Every rule below is derived from the
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
list host, the panel (overlay, shell, home list, pages, cards, rows, controls),
the confirm dialog, toasts, the image viewer, and the gallery's page-level
cursor/hover affordance (§11). Anything GitHub already renders is out of scope
except through that one affordance: no other rule may target page markup.

Two invariants hold for every selector:

- Every class we put on our own elements starts with `gp-`. Never add an
  unprefixed class to our own element, and never write a rule for an
  unprefixed selector.
- Every UI-root class that must be excluded from page scanning is listed in
  `isOwnUi()` in `src/utils/dom.js`
  (`.gp-panel-overlay, .gp-confirm-overlay, .gp-toasts, .gp-settings-btn,
  .gp-viewer-overlay`). Rename a root class and that list must change with it.

## 2. Token layer (`src/styles/tokens.css`)

All `--gp-*` tokens, in declaration order.

| Token | Mirrors (Primer) | Literal fallback | Role |
|---|---|---|---|
| `--gp-font` | — | system UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif` + emoji fonts) | Family for every injected element |
| `--gp-mono` | — | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Version/badge chips, wide input, textarea |
| `--gp-radius` | — | `6px` | Default corner radius (controls, cards, rows, toasts, viewer tools) |
| `--gp-radius-lg` | — | `12px` | Large surfaces: panel, confirm dialog |
| `--gp-accent` | `--fgColor-accent` | `#0969da` | Links, primary button fill, checked switch, active/dot accents, icon tints |
| `--gp-accent-soft` | `--bgColor-accent-muted` | `#ddf4ff` | Tinted icon wells (nav item icon, about logo) |
| `--gp-bg-1` | `--bgColor-default` | `#ffffff` | Default surface: panel, cards, inputs, toasts |
| `--gp-bg-2` | `--bgColor-muted` | `#f6f8fa` | Subtle surface: header/footer bars, entry button, secondary button, grid cell, about hero |
| `--gp-text` | `--fgColor-default` | `#1f2328` | Body text, labels and titles (Primer exposes one emphasis level) |
| `--gp-text-muted` | `--fgColor-muted` | `#59636e` | Hints, descriptions, counters, secondary icons |
| `--gp-success` | `--fgColor-success` | `#1a7f37` | Success icon/progress tones |
| `--gp-danger` | `--fgColor-danger` | `#d1242f` | Danger button fills, error tones, viewer status border |
| `--gp-attention` | `--fgColor-attention` | `#9a6700` | Warning icon/progress tones |
| `--gp-border` | `--borderColor-default` | `#d1d9e0` | Control and surface outlines |
| `--gp-line` | `--borderColor-muted` | `#d1d9e0b3` | Internal dividers (card head, rows, fields, pills, progress track) |
| `--gp-highlight` | `--bgColor-neutral-muted` | `rgba(129, 139, 152, 0.12)` | Hover/selected wash on neutral surfaces (entry button, nav item, buttons, toast actions, panel close). Translucent, so it reads as a change over both surfaces |
| `--gp-shadow` | `--shadow-large` | `0 8px 24px rgba(140, 149, 159, 0.2)` | Elevation: panel, confirm dialog, toast |
| `--gp-scrim` | `--overlay-backdrop-bgColor` | `rgba(31, 35, 40, 0.5)` | Overlay backdrop behind panel and confirm dialog |
| `--gp-focus` | `--focus-outlineColor` | `#0969da` | Focus ring color |

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
- The image viewer is themed like everything else: images sit on
  `var(--gp-bg-1)` with the bars, hint and thumbnail rail on `var(--gp-bg-2)`,
  so the gallery reads as part of GitHub in every theme.
- Nothing else in the script may key off `prefers-color-scheme`; theme
  handling is entirely delegated to GitHub's own variables.

## 4. Surfaces, rounding, borders, shadows

| Property | Value | Applied to |
|---|---|---|
| Surface, default | `var(--gp-bg-1)` | `.gp-panel`, `.gp-card`, `.gp-nav-item`, `.gp-confirm`, `.gp-toast`, `.gp-select`, `.gp-input`, `.gp-textarea`, version/badge chip, `.gp-viewer-overlay`, `.gp-viewer__stage`, `.gp-viewer__tool`, `.gp-viewer__nav`, `.gp-viewer__status`, `.gp-viewer__thumb` |
| Surface, subtle | `var(--gp-bg-2)` | `.gp-panel__header`, `.gp-panel__footer`, `.gp-header-btn`, `.gp-button`, `.gp-grid__cell`, `.gp-about__hero`, switch track, `.gp-viewer__bar`, `.gp-viewer__hint`, `.gp-viewer__thumbs` |
| Surface, tinted | `var(--gp-accent-soft)` | `.gp-nav-item__icon`, `.gp-about__logo` |
| Border, surface/control | `1px solid var(--gp-border)` | `.gp-panel`, `.gp-card`, `.gp-nav-item`, `.gp-header-btn`, `.gp-button`, `.gp-select`, `.gp-input`, `.gp-textarea`, `.gp-switch__track`, `.gp-toast`, `.gp-confirm`, `.gp-viewer__bar`, `.gp-viewer__tool`, `.gp-viewer__nav`, `.gp-viewer__hint`, `.gp-viewer__thumbs`, `.gp-viewer__status` |
| Border, divider | `1px solid var(--gp-line)` | `.gp-card__head`, `.gp-row`, `.gp-field`, chip/badge outline (`.gp-panel__version`, `.gp-badge`), `.gp-grid__cell`, `.gp-about__row`, progress track, `.gp-viewer__sep`, `.gp-viewer__thumb` |
| Radius, default | `var(--gp-radius)` (6px) | Control boxes (button, select, input, toast action), cards, nav items, toasts, grid cells, viewer tools, header button, panel close, viewer status, viewer thumb |
| Radius, large | `var(--gp-radius-lg)` (12px) | `.gp-panel`, `.gp-confirm` |
| Radius, pill | `999px` | `.gp-switch__track`, `.gp-panel__version`, `.gp-badge` |
| Radius, circle | `50%` | `.gp-header-btn--custom::after` dot, `.gp-viewer__nav`, viewer spinner |
| Shadow, elevation | `var(--gp-shadow)` | `.gp-panel`, `.gp-confirm`, `.gp-toast`, `.gp-viewer__status` |
| Shadow, ring | `0 0 0 1px var(--gp-accent)` | `.gp-viewer__thumb.is-active` |

- Overlays set `box-sizing: border-box` (`.gp-panel-overlay`,
  `.gp-confirm-overlay`, `.gp-textarea`); the stylesheet has no global
  `box-sizing` reset and must not add one — GitHub's own page is not ours.
- Overlay stacking order, highest last: `.gp-panel-overlay` `1000000`,
  `.gp-confirm-overlay` `1000001`, `.gp-toasts` `1000002`,
  `.gp-viewer-overlay` `1000002`. Keep new full-screen UI inside this band and
  document it here.
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
| Nav item title `.gp-nav-item__title` | `14px` / `600` / `var(--gp-text)` |
| Nav item description `.gp-nav-item__desc` | `12px` / `var(--gp-text-muted)` |
| Back link `.gp-page__back` | `500 12px/1.4` / `var(--gp-text-muted)` |
| Card title `.gp-card__title` | `13px` / `600` / `var(--gp-text)` |
| Card hint `.gp-card__hint`, `.gp-hint` | `12px` (`1.5` for `.gp-hint`) / `var(--gp-text-muted)` |
| Row label `.gp-row__label` | `13px` / `var(--gp-text)` |
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
| Viewer counter `.gp-viewer__counter` | `12px` / `var(--gp-text-muted)` / `tabular-nums` |
| Viewer tool glyph | `600 14px/1` |
| Viewer hint `.gp-viewer__hint`, status `.gp-viewer__status` | `12px` muted / `13px` |
| Viewer nav glyph | `22px` |

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
| `.gp-header-btn__icon` | Icon wrapper `<span>`; **structural** (the glyph is styled by `.gp-header-btn svg`, `16×16`) |
| `.gp-settings-item` | `<li>` host when the header target is a `<ul>`; structural, no rules |
| `.gp-header-btn--custom` | Modifier added while any setting differs from defaults; draws a `6×6` `var(--gp-accent)` dot at top-right 4px |

The button is mounted into `.AppHeader-globalBar-end`, then
`.AppHeader-globalBar`, then `#user-links`, and is re-mounted when GitHub
swaps the header. It carries `title` and `aria-label` from `settings.open`.

### Panel shell

| Class | Rules |
|---|---|
| `.gp-panel-overlay` | `position: fixed; inset: 0; z-index: 1000000`; flex centering; `padding: 24px 16px`; `background: var(--gp-scrim)`; sets `var(--gp-font)`/`var(--gp-text)`. `[hidden]` forces `display: none` |
| `.gp-panel` | Vertical flex column; `width: min(620px, 100%)`; `max-height: min(88vh, 780px)`; `overflow: hidden`; `var(--gp-bg-1)`; `1px var(--gp-border)`; `var(--gp-radius-lg)`; `var(--gp-shadow)`; base `14px/1.5` |
| `.gp-panel__header` | Space-between flex, `gap: 12px`, `padding: 16px 18px 14px`, bottom `1px var(--gp-border)`, `var(--gp-bg-2)` |
| `.gp-panel__brand` | Title + subtitle column; **structural** |
| `.gp-panel__title-row` | Wrapping flex row holding title and version chip |
| `.gp-panel__title` | `16px/600`, `var(--gp-text)` |
| `.gp-panel__version`, `.gp-badge` | Pill chip: `1px var(--gp-line)`, `999px` radius, mono `500 11px` |
| `.gp-panel__subtitle` | `12px` muted, `margin: 4px 0 0` |
| `.gp-panel__close` | `28×28` ghost square (`border: 1px solid transparent`), `var(--gp-radius)`, `18px` `×` |
| `.gp-panel__body` | Scroll pane: `flex: 1 1 auto`, `min-height: 0`, `overflow-y: auto`, `overscroll-behavior: contain`, `padding: 16px 18px 20px` |
| `.gp-panel__footer` | Sticky action bar: `12px 18px`, top `1px var(--gp-border)`, `var(--gp-bg-2)` |
| `.gp-panel__footer-note` | `margin: 0 auto 0 0` (pushes actions right), `12px` muted |

`.gp-panel [hidden] { display: none }` makes the `hidden` attribute usable on
any panel descendant (the overlay's own rule covers the root). The panel is
`role="dialog"`, `aria-modal="true"`, `aria-label` = script name, focused on
open, and closes on `Escape`, the `×`, or an overlay click. Footer order:
note, Reset (`.gp-button--ghost`), Cancel (default), Save
(`.gp-button--primary`).

### Panel home and pages

| Class | Rules |
|---|---|
| `.gp-panel__home` | Structural wrapper of the home list |
| `.gp-panel__nav` | Vertical flex, `gap: 8px` |
| `.gp-nav-item` | Full-width card-like button: `gap: 12px`, `padding: 12px 14px`, `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-1)` |
| `.gp-nav-item__icon` | `32×32` tinted well: `var(--gp-accent-soft)` fill, `var(--gp-accent)` glyph, `16×16` svg |
| `.gp-nav-item__text` | Column, `gap: 2px`, `min-width: 0` |
| `.gp-nav-item__title` | `14px/600` strong |
| `.gp-nav-item__desc` | `12px` muted |
| `.gp-panel__page` | Structural wrapper of a settings page |
| `.gp-page` | Structural content column rendered by the page module |
| `.gp-page__back` | Text button `‹ Back`: no border/background, `500 12px/1.4`, muted, `margin: 0 0 12px` |

Hover on a nav item swaps the border to `var(--gp-accent)` and the fill to
`var(--gp-bg-2)`; hovering the back link turns it `var(--gp-accent)`. Neither
has a transition — see §8.

### Cards, rows, hints, fields

| Class | Rules |
|---|---|
| `.gp-card` | `margin: 0 0 14px` (last child `0`), `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-1)` |
| `.gp-card__head` | `padding: 12px 14px`, bottom `1px var(--gp-line)` |
| `.gp-card__title` / `.gp-card__hint` | `13px/600` strong / `12px` muted (`margin: 3px 0 0`) |
| `.gp-card__body` | Vertical flex, no padding (rows/fields/grid bring their own) |
| `.gp-row` | Flex, `align-items: center`, `gap: 14px`, `padding: 12px 14px`, bottom `1px var(--gp-line)` (last child `0`) |
| `.gp-row__text` | `flex: 1 1 auto`, column, `gap: 2px`, `min-width: 0` |
| `.gp-row__label` / `.gp-row__hint` | `13px` strong / `12px` muted |
| `.gp-row__control` | `flex: 0 0 auto`, flex, `gap: 8px` |
| `.gp-hint` | Standalone `12px/1.5` muted paragraph |
| `.gp-field` | Stacked column, `gap: 6px`, `padding: 12px 14px`, bottom `1px var(--gp-line)` (last child `0`) |
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

Cells hold a `.gp-switch` built as markup (not a nested `<label>`, which would
be invalid HTML); the cell label makes the whole tile clickable. The grid is
rendered from the gallery source registry, so a new source appears here with
no CSS change.

### Confirm dialog

| Class | Rules |
|---|---|
| `.gp-confirm-overlay` | `fixed; inset: 0; z-index: 1000001`, flex centering, `padding: 24px 16px`, `var(--gp-scrim)`; `role="presentation"` |
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
| `.gp-toasts` | `fixed; right: 16px; bottom: 16px; z-index: 1000002`; column, `gap: 8px`, `width: min(340px, calc(100vw - 32px))`, `pointer-events: none`, `aria-live="polite"` |
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

### Image viewer

Full-viewport gallery, themed with the same tokens as the panel (see §3).

| Class | Rules |
|---|---|
| `.gp-viewer-overlay` | `fixed; inset: 0; z-index: 1000002`, `background: var(--gp-bg-1)`, `color: var(--gp-text)`, `var(--gp-font)`; `[hidden]` hides it |
| `.gp-viewer` | Vertical flex, `min-width: 0`, `outline: none`; `role="dialog"`, `aria-modal="true"` |
| `.gp-viewer__bar` | `padding: 10px 14px`, `gap: 12px`, `var(--gp-bg-2)`, bottom hairline |
| `.gp-viewer__meta`, `__title`, `__counter` | Baseline row; ellipsized `13px/600` title; `12px` tabular muted counter |
| `.gp-viewer__tools`, `__tool` | `margin-left: auto`; `30×30` tools, `var(--gp-bg-1)` fill, `var(--gp-border)` outline, `var(--gp-radius)`, `600 14px/1` |
| `.gp-viewer__tool--close` | Hover: `var(--gp-danger)` fill and border, white glyph |
| `.gp-viewer__sep` | `1×18` divider in `var(--gp-line)` |
| `.gp-viewer__stage` | `position: relative`, `flex: 1 1 auto`, centered on `var(--gp-bg-1)`, `overflow: hidden`, `cursor: grab`, `touch-action: none` |
| `.gp-viewer__image` | `max-width/height: 100%`, `object-fit` fit, `transform-origin: center`, opacity `0.15s`, `user-select: none`, `-webkit-user-drag: none`; JS sets `translate(…) scale(…) rotate(…)` |
| `.gp-viewer__nav` (+`--prev`, `--next`) | `44×44` circular buttons over the stage, `22px` glyphs, `left/right: 16px`, `translateY(-50%)`; `[disabled]` at 0.5 opacity when loop is off and the end is reached; `hidden` for a single image |
| `.gp-viewer__spinner` | `32×32` ring: 3px `var(--gp-line)` with a `var(--gp-accent)` top, `gp-viewer-spin 0.8s linear infinite` |
| `.gp-viewer__status` | Error card: `1px var(--gp-danger)`, `var(--gp-radius)`, `var(--gp-bg-1)`, `var(--gp-shadow)`, `13px`; `role="alert"` |
| `.gp-viewer__hint` | Centered `12px` muted keyboard hint, top hairline on `var(--gp-bg-2)` |
| `.gp-viewer__thumbs`, `__thumb`, `__thumb-img` | Horizontal rail (`gap: 6px`, `padding: 10px 14px`, `overflow-x: auto`, `overflow-y: hidden`, `justify-content: safe center`, `align-items: center`) so thumbnails are centered while they fit and never raise a vertical scrollbar; `68×48` thumb buttons, `object-fit: cover` images; hidden with one image or when thumbnails are off |
| `.gp-viewer__thumb.is-active` | `var(--gp-accent)` border plus a `0 0 0 1px` accent ring; the active thumb is scrolled into view |

Pointer and keyboard behavior is implemented in `src/ui/viewer.js`; the CSS
only has to express it: `is-dragging` → grabbing cursor, `is-loading` →
dimmed image, and the focus rings on `.gp-viewer__tool` / `.gp-viewer__nav`.
The image is draggable at every zoom and the JS clamps the offset to the
stage, so panning needs no state class. The overlay is excluded from page
scanning via `isOwnUi()`, and opening it takes the shared scroll lock.

### About page

| Class | Rules |
|---|---|
| `.gp-about` | Column, `gap: 14px` |
| `.gp-about__hero` | Card-ish row: `padding: 16px`, `1px var(--gp-border)`, `var(--gp-radius)`, `var(--gp-bg-2)` |
| `.gp-about__logo` | `44×44` tinted well (`var(--gp-accent-soft)` / `var(--gp-accent)`), `24×24` glyph |
| `.gp-about__name` | `16px/600` strong, alongside the `.gp-badge` version chip |
| `.gp-about__tagline` | `12px` muted |
| `.gp-about__row`, `__label`, `__value` | Two-column row: `13px`, bottom `1px var(--gp-line)` (last row none), fixed `120px` muted label, strong value, accent links underlined on hover |

## 7. States

| State | Selector / form | Effect |
|---|---|---|
| Hover | `:hover` on `.gp-header-btn`, `.gp-nav-item`, `.gp-page__back`, `.gp-button`, `.gp-toast__action`, `.gp-toast__close`, `.gp-viewer__tool`, `.gp-viewer__nav:not([disabled])`, `.gp-viewer__thumb`, `.gp-about__value a` | Fill moves to `var(--gp-highlight)` or the border/text moves to the accent; viewer tools and nav take the highlight fill with a muted border, the thumbnail border moves to the muted text color |
| Focus | `:focus-visible` | `outline: 2px solid var(--gp-focus)` on controls, buttons, nav items, the header button, viewer tools and viewer nav |
| Focus offset | `outline-offset` | `1px` on buttons/nav/header/entry/viewer controls, `2px` on the switch track, `-1px` on select/input/textarea (inside the box) |
| Disabled | `.gp-button[disabled]` | `opacity: 0.55`, `cursor: default` |
| Disabled | `.gp-viewer__nav[disabled]` | `opacity: 0.5`, `cursor: default`, hover suppressed |
| Active thumb | `.gp-viewer__thumb.is-active` | `var(--gp-accent)` border + 1px accent ring |
| Rotated | `.gp-viewer.is-rotated` | Toggled by `paint()`; the stage keeps its `grab` cursor because the image is draggable at every zoom |
| Loading image | `.gp-viewer__image.is-loading` | `opacity: 0.25` while the source loads (also during an in-place full-size upgrade) |
| Dragging | `.gp-viewer.is-dragging` | Stage cursor becomes `grabbing` for the duration of a pan |
| Custom settings | `.gp-header-btn--custom` | Corner dot in `var(--gp-accent)` while settings differ from defaults |
| Hidden | `[hidden]` on `.gp-panel-overlay`, `.gp-viewer-overlay`, `.gp-viewer__nav`, `.gp-viewer__thumbs`, `.gp-viewer__spinner`, `.gp-viewer__status`, or on any descendant of `.gp-panel` | `display: none`, declared explicitly so GitHub's own resets cannot re-show our chrome. Elements outside those scopes (e.g. `.gp-toast__message`) rely on the user-agent `[hidden]` rule |

State classes are the only state mechanism: never add inline styles for state
in JS (the viewer's `transform` and the toast progress duration are the two
shipped exceptions, because both are per-frame values).

## 8. Motion

| Motion | Spec |
|---|---|
| Switch track and knob | `0.15s ease` on background/border and on transform/background |
| Viewer image | `opacity 0.15s ease` (load/upgrade dimming) |
| Toast entrance | `gp-toast-in` — fade + `translateX(±24px)` over `0.2s ease-out`; left placements mirror the offset |
| Toast exit | `0.18s ease` on opacity and transform, then removal after 180ms |
| Toast progress | `gp-toast-progress` — `scaleX(1 → 0)`, `linear`, duration set inline from the toast's own `duration`; paused on hover |
| Viewer spinner | `gp-viewer-spin` — one rotation per `0.8s`, linear, infinite |

- Hover color changes on nav items, buttons and header chrome have no
  transition on purpose: they must feel native, and animated hover on a page
  we do not own reads as foreign.
- Only one coordinated entrance per surface; no loops except the spinner; no
  bounce, no decorative animation.
- `@media (prefers-reduced-motion: reduce)` disables animation and transition
  for `.gp-toast`, `.gp-toast--leaving`, `.gp-switch__track`,
  `.gp-switch__track::after` and `.gp-viewer__image`. The viewer spinner and
  the toast progress bar are outside that list (a spinner and a countdown are
  information, not decoration), so do not "fix" them by adding them to the
  media block without deciding what replaces the information they carry.

## 9. Responsive behaviour

The stylesheet has one breakpoint, `@media (max-width: 640px)`:

| Selector | Change |
|---|---|
| `.gp-panel-overlay` | `padding: 0; align-items: stretch` — the panel fills the viewport |
| `.gp-panel` | `width: 100%; max-height: 100%; border-radius: 0; border-left: 0; border-right: 0` — edge-to-edge sheet |

Everything else is fluid by construction and must stay that way:

- The panel is `min(620px, 100%)` wide and `min(88vh, 780px)` tall, so it
  shrinks before the breakpoint and only changes shape at it.
- The sources grid reflows on its own (`repeat(auto-fit, minmax(180px, 1fr))`);
  no media query is needed for new tiles.
- Toasts are `min(340px, calc(100vw - 32px))` wide and pinned 16px from the
  corner.
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
- **Roles.** The panel is `role="dialog"` + `aria-modal="true"`; the viewer is
  `role="dialog"` + `aria-modal="true"`; the confirm dialog is
  `role="alertdialog"` + `aria-modal="true"` over a `role="presentation"`
  overlay; the viewer's failure card and error toasts are `role="alert"`, all
  other toasts `role="status"`, and the toast container is
  `aria-live="polite"`.
- **Names.** Icon-only controls carry both `title` and `aria-label`
  (`.gp-panel__close` = `common.close`, viewer tools/nav/open, the entry
  button = `settings.open`, the toast close = `×`). Labels come from the
  locale files, never from hardcoded English in CSS.
- **Switch labelling.** `.gp-switch__input` is opacity-hidden, not
  `display: none`, so it stays focusable and its `aria-label` (or the wrapping
  row's text) names it; rows that already show the text pass it as the
  `aria-label`.
- **Keyboard.** Panel: `Escape` returns home from a page and closes from home;
  the viewer owns `Escape` while open. Viewer: `←`/`→` navigate,
  `Home`/`End` jump, `+`/`=`/`-` zoom, `0` resets, `r` rotates, wheel zooms,
  drag pans at any zoom, double click toggles 2×, pinch zooms.
  Confirm: `Escape` cancels and focus goes to the safe choice, then returns to
  the element that opened it.
- **Scroll lock.** While a modal is open the page behind is pinned
  (`html.gp-modal-open`), so pointer and keyboard focus cannot drift under the
  overlay; the lock is counted and released on close.
- **Contrast.** Body text uses `var(--gp-text)` on `var(--gp-bg-1)` surfaces
  and `var(--gp-text)` for labels; reserve `var(--gp-text-muted)` for
  hints, descriptions and counters, never for the only copy of essential
  information.

## 11. The gallery's page-level affordance

The gallery lets you click an image inside GitHub's rendered markdown, which
needs a cursor on **GitHub's own** `<img>` elements — markup no selector in
`app.css` may target (§1). The exception is therefore generated at runtime by
`src/gallery/index.js` into a `<style id="gp-gallery-style">` in `<head>`, one
block per enabled source:

```css
<selector> { cursor: zoom-in; }
```

- `<selector>` comes from the source registry (`cursorSelector` in
  `src/gallery/sources.js`); the markdown source uses
  `.markdown-body img:not(.emoji), .markdown-body a:has(> img:not(.emoji))`.
- **Nothing else is added to page images.** No border, outline, overlay or
  badge: a markdown image keeps exactly the look GitHub gives it, and the only
  hint that it opens in the gallery is the cursor.
- The stylesheet is rewritten whenever gallery settings change and **removed
  entirely** when no source is enabled, so a disabled gallery leaves the page
  byte-identical to stock GitHub. There is no global page scan and no
  per-element class injection.
- Consequence for anyone editing `app.css`: add a new gallery location by
  registering a source with its own `cursorSelector`, never by writing a
  page-markup rule into `app.css`.
- Our own UI is excluded from this behavior: the click handler ignores any
  target inside `isOwnUi()` and any image wrapped by GitHub's `a.anchor`, so
  the affordance never fights with heading anchors or our overlays.

## 12. Keeping this file in sync

Any visual change must land as one change across `tokens.css`, `app.css` and
this document: update the token table (§2), the component table (§6) and the
state/motion rows you touched. Then rebuild (`npm run build`) and eyeball the
result on a real GitHub page in both themes (light and dark), in the panel, the
confirm dialog, a toast and the viewer — including the `<= 640px` layout and an
`Escape`-only keyboard pass.
