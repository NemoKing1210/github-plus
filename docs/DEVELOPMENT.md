# Development

Build, test and release workflow for GitHub Plus. Architecture lives in
[ARCHITECTURE.md](ARCHITECTURE.md), visual rules in [`../DESIGN.md`](../DESIGN.md);
contributor rules and the pull-request process live in
[../CONTRIBUTING.md](../CONTRIBUTING.md).

GitHub Plus is a userscript built with Vite and `vite-plugin-monkey`. The
source is vanilla-JS ESM under `src/`; the two `github-plus.user.js` /
`github-plus.meta.js` files at the repository root are generated build output.

## Requirements

- Node.js 22 (see `.nvmrc`). `package.json` declares `"engines": { "node": ">=22" }`.
- npm (bundled with Node).
- A userscript manager for manual testing: Violentmonkey (recommended, it can
  track a local file) or Tampermonkey.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Installs the dev dependencies (`vite`, `vite-plugin-monkey`, `terser`, `material-icon-theme`, `jsdom`) and the bundled runtime dependencies (`marked`, `dompurify`, `highlight.js`). |
| `npm run dev` | Starts the Vite dev server. `vite-plugin-monkey` serves a live copy of the script (its URLs carry the `dev:` prefix) that a manager can install and keep updated while you edit `src/`. |
| `npm run build` | Runs `vite build` into `dist/`, then `node scripts/copy-dist.mjs` copies `dist/github-plus.user.js` and `dist/github-plus.meta.js` to the repository root. |
| `npm run verify:artifacts` | Hashes both root artifacts and the matching files in `dist/` (sha256) and fails when a pair differs — a byte-for-byte comparison. |
| `npm run ci` | `npm run build && npm run verify:artifacts` — the exact gate GitHub Actions runs on every push and pull request to `main`. |
| `npm run icons:build` | Regenerates `src/features/fileIcons/iconSet.generated.js` from the `material-icon-theme` dev dependency. Commit the result. |
| `npm test` | Node test runner: `test/match.test.js` (icon matching), `test/age.test.js` (commit-age buckets), `test/fileMeta.test.js` (size formatting), `test/fileTarget.test.js` (raw-address rewrite, file-target parsing), `test/fileMenu.test.js` (copyable-content check), `test/filePreview.test.js` (preview kinds, relative-link rewriting), `test/filePreviewMarkdown.test.js` (markdown sanitizing), `test/filePreviewShell.test.js` (preview modal layering and keys) and `test/download.test.js` (download filenames); the similar-repositories feature adds `test/similarRepos.test.js` (scoring and normalization), `test/similarReposProviders.test.js` (provider response mapping), `test/similarReposSurfaces.test.js` (sidebar resolution and panel states) and `test/similarReposLifecycle.test.js` (observer, cache and navigation). |
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
viewer, the settings panel, the file features, commit badges, translation, the
command palette, the backup page or toasts. All checks are on `github.com`
(the script also matches `gist.github.com`).

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
- [ ] Hovering a markdown image shows the floating download button at its
      top-right corner; leaving the image hides it, and clicking the button
      saves the file under its own name (a camo address is unwrapped) without
      opening the viewer.
- [ ] The viewer toolbar's download tool saves the image currently shown; with
      **Download images** off neither the tool nor the hover button appears.
      When the host blocks the fetch, the image opens in a new tab instead.
- [ ] With **Image gallery** off, clicking a markdown image behaves like stock
      GitHub and no stylesheet is injected.

### Settings panel

- [ ] The panel opens on the General page with the sidebar listing all its
      pages under **Preferences** (General, Gallery, Files, Issues, Commits,
      Translation, Command palette, Discovery) and **More** (Backup, About); switching
      pages (click and arrow keys) animates the content; the language select
      relabels the panel after Save.
- [ ] The Files page holds the six file enhancements as separate cards —
      icons, ages, expandable folders, sizes and downloads, the context menu,
      and the quick preview — each with its own master switch in the card
      header, and the age-scale preview inside the ages card.
- [ ] The search field (`/` or `Ctrl`/`Cmd`+`K`) finds settings across pages:
      results are grouped by page, matched text is highlighted, sidebar counts
      match, and choosing a result opens the page and spotlights the row.
      `Esc` clears a non-empty query, then closes the panel.
- [ ] Changing any control turns the footer note into "Unsaved changes" with
      an accent dot; undoing the change restores the save hint.
- [ ] **Save** persists the draft, shows the "Settings saved" toast, closes the
      panel and survives a reload.
- [ ] **Reset** asks for confirmation, refills the draft with defaults and
      still requires Save; `Esc` closes the confirmation without closing the
      panel.
- [ ] **Cancel** and an overlay click discard the draft; `Esc` closes
      the panel (exit animation, then the overlay is removed). While the viewer
      is open it keeps `Esc` for itself. At <= 640px the sidebar becomes a
      horizontal tab strip and the search field takes its own header row.

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

### File icons

- [ ] A repository page shows colored icons for the files and folders in the
      tree, on both the small-screen and large-screen name cells.
- [ ] `.ts` / `.tsx` / `.d.ts`, `Dockerfile`, `package.json`, `README.md`,
      `src/`, `node_modules/` and `.github/` each show the expected icon.
- [ ] Open a subfolder, go back, and open a file: icons survive client-side
      navigation and GitHub's re-renders (a row may briefly flash the native
      glyph, but it must settle on ours).
- [ ] Pull requests **Files changed** and a commit page show icons in the file
      list; gists and code search are best effort (see § Surfaces).
- [ ] In **Files**, **Folder icons** off gives every folder the generic folder
      glyph; **Well-known filenames** off makes `package.json` fall back to the
      JSON icon.
- [ ] Turning the **File icons** card off removes every colored glyph,
      restores GitHub's own icons and leaves no `.gp-fi` nodes or hidden icons
      behind.

### File ages

- [ ] A repository page tints the last-commit date of every file and folder;
      the text keeps GitHub's own wording and tooltip.
- [ ] Recent commits are warm (`#ffd78d` in the dark theme, attention gold in
      the light one) and older commits fade to GitHub's muted grey, matching
      the age-scale preview at the bottom of the **File ages** card; a
      four-month-old row is already visibly desaturated and a file older than a
      year is plain grey.
- [ ] **Folder rows** off restores GitHub's date color on folders while files
      keep theirs; turning the **File ages** card off removes every
      `.gp-age-date` class and leaves no observers behind.
- [ ] The tints survive client-side navigation and GitHub's re-renders, and a
      row whose date is missing simply stays unmarked.

### File sizes and downloads

- [ ] A repository listing gets a last column; every file row shows its size
      at the column's left edge once the row scrolls near the viewport, folder
      rows keep the cell empty, and the column lines up with its header cell.
      The header row stays collapsed (no band, no stray label) but exposes
      "Size" to a screen reader.
- [ ] Each file row ends with a download button in GitHub's icon-button style,
      pushed to the column's right edge (also when the size is off or still
      unknown); hovering it gives the neutral fill and focusing it shows the
      outline. Clicking it saves the file under its own name and never
      navigates.
- [ ] The column adapts: full width with size and button from 1012px, a
      button-only column between 768px and 1012px, and no column below 768px,
      with no horizontal scrolling and GitHub's own columns intact at 390px.
- [ ] Switching the interface language relabels the column header and the
      buttons' titles without a reload.
- [ ] A blob page keeps GitHub's own size and download chrome and gains no
      `.gp-file-meta` cell — the feature deliberately leaves that page alone.
- [ ] **File size** off leaves only the download buttons; **Download button**
      off leaves only the size labels; the **File sizes and downloads** card
      switch removes every `.gp-file-meta-cell` and header cell.
- [ ] Sizes survive client-side navigation between folders; a probe that comes
      back without `Content-Length` (or is blocked) leaves the size out without
      breaking the cell.
- [ ] Private-repository downloads work while signed in (the same-origin raw
      route carries the session); a blocked fetch opens the raw file in a new
      tab instead.

### File and folder context menu

- [ ] Right-clicking a file in a repository listing opens the GitHub Plus menu
      with **Open**, **Open in new tab**, **Download**, **Copy contents**,
      **Copy link**, **Copy path** and **Copy name**.
- [ ] Right-clicking a folder row in the listing or the sidebar tree, or a
      folder link in rendered markdown, opens the folder menu with **Open**,
      **Open in new tab**, **Copy link**, **Copy path** and **Copy name**.
      A submodule row, a tree link into another repository and anywhere outside
      a file or folder row keeps the browser's native menu.
- [ ] A folder row of the listing offers **Expand** (or **Collapse** while it is
      open) between the navigation entries and the clipboard ones, and choosing
      it inserts or removes the folder's nested rows exactly like its chevron;
      a sidebar or markdown folder keeps the plain menu, and so does every
      folder while **Expandable folders** is off.
- [ ] On a blob page, right-clicking the file content (code or rendered
      markdown) opens the same file menu without **Open**; right-clicking an
      image, a foreign link or the page chrome keeps the native menu.
- [ ] **Download** saves the file under its own name; **Copy link** copies the
      blob address and **Copy path** the repository-relative path (no branch
      prefix), each with its own success toast.
- [ ] **Copy name** copies the entry's own name (`src`, `README.md`) for a file
      and a folder alike, with its own success toast.
- [ ] **Copy contents** copies a text file's contents; a binary file, a file
      over 1 MiB and a blocked fetch each show their warning/error toast and
      leave the clipboard untouched.
- [ ] Keyboard: the context-menu key (`Shift`+`F10`) opens the menu under the
      file link, arrows/`Home`/`End` move, `Enter` runs a row, `Esc` closes and
      returns focus; a click outside or any scroll closes it.
- [ ] The menu is localized with the current interface language and disappears
      on client-side navigation; turning the **File and folder context menu**
      card off restores the native menu everywhere.

### Quick file preview

- [ ] Every repository listing row gains an eye button in its own narrow
      column; clicking it opens the preview without following the file link,
      and the header shows the file name with the position in the footer.
- [ ] **Preview** in the file context menu opens the same modal on a listing
      row and on a blob or blame page (where the set is the one file).
- [ ] Holding the left button on a listing file name for about half a second
      opens the preview without navigating; releasing sooner clicks the link as
      usual, dragging or selecting text cancels, and the toggle in the preview
      card turns the gesture off.
- [ ] The files of the current directory form one set: prev/next and the
      `←`/`→` keys move through them, the counter follows, and the ends are
      disabled (there is no wrap-around).
- [ ] Kinds render correctly: Markdown is rendered and sanitized, source files
      get highlighting and line numbers, images/video/audio play in place, a
      PDF opens in the browser viewer, and a binary gets the card with **Open
      on GitHub** and **Download**.
- [ ] A Markdown file offers Preview/Source; Source shows the original text
      highlighted as Markdown and the control stays visible in both modes.
- [ ] Header actions work: open on GitHub, the copy menu (contents, link,
      path) floats **above** the modal and its arrow keys do not switch files,
      and download saves under the file's own name.
- [ ] A file over 2 MiB (text) or 25 MiB (PDF) shows the too-large card with
      links to GitHub and the raw file; a failed fetch shows the failure card
      and logs `GP-1501`.
- [ ] `Esc` closes the preview (but the copy menu first), `Tab` stays inside
      it, links inside rendered Markdown are clickable, and the page behind it
      does not scroll.
- [ ] Relative images in a README of a private repository still load, external
      images are requested without a referrer, and a soft navigation closes an
      open preview.
- [ ] **Row button** off removes the eye column while the context menu and the
      long press still work; the **Quick file preview** card off removes every
      entry point (including the hold gesture) and closes an open preview.

### Folder tree

- [ ] A repository listing shows a chevron before every folder name, on both
      the small- and large-screen name cells; a file row has none, and a
      submodule row is left plain.
- [ ] Clicking a folder name still navigates to the folder; clicking only the
      chevron expands it in place, and the chevron flips to an open state with
      `aria-expanded="true"`.
- [ ] Expanded rows appear directly under their folder, indented one step per
      level, and carry the same hooks the page uses: file icons, last-commit
      age, the size column, the eye button and the context menu all decorate
      them with no rerun.
- [ ] Nested folders expand to a second level and deeper, each level indented
      another step; expanding a parent keeps its already-open children open, and
      collapsing a parent removes every descendant row.
- [ ] A folder's children keep the current branch or tag; opening a child
      navigates within that ref.
- [ ] While a folder loads its chevron carries `aria-busy` and a loading
      state; an empty folder shows an empty note, and a folder over 1 000
      entries shows the truncation note instead of the rest.
- [ ] A failed listing request leaves the folder collapsed with a toast and
      logs `GP-1901`; a folder that expands with names but no dates means only
      the `tree-commit-info` request failed, which is not an error.
- [ ] The preview's prev/next stay inside the folder that owns the row: moving
      across a nested boundary never jumps into the parent's files.
- [ ] Expanding folders survive a GitHub re-render (the rows are restored from
      the session cache without a refetch) and a hash-only change; a real
      navigation to another page starts collapsed.
- [ ] Turning **Expandable folders** off removes every chevron, slot and
      nested row and leaves GitHub's listing byte-identical.

### Issue and pull-request list avatars

- [ ] Every row of `/owner/repo/issues` and `/owner/repo/pulls` shows the
      author's round 16 px avatar immediately before the login; clicking the
      login still filters the list by that author.
- [ ] The same avatar appears on the global Issues and Pull requests
      dashboards, which share GitHub's list view.
- [ ] React re-renders and recycled rows keep exactly one avatar per row; a row
      whose author changes swaps the image instead of keeping the old one.
- [ ] A GitHub App row (`github-actions[bot]`) with no avatar route shows its
      plain login and no broken image.
- [ ] **Issues → Author avatars** off removes every injected image and leaves
      GitHub's markup without trace; Save applies it without a reload, and the
      switch survives a reload.
- [ ] The avatars are correct in the light and the dark theme, and after a soft
      navigation between two lists.

### Commit badges

- [ ] A Conventional Commit subject of the form `type(scope)!: description`
      renders the type and scope as one colored two-tone token at the start of
      the title, on the commit history list, the PR **Commits** tab, the
      single-commit page, the repository home's latest-commit block and the
      classic commit views.
- [ ] Copying the subject selects the plain text, the text search still matches
      the original string, and turning **Commit badges** off restores the
      subject byte for byte.
- [ ] An unknown but entirely lowercase type (`wip: …`) gets the unknown style
      while **Unknown types** is on and stays plain when it is off; a
      capitalized prose prefix such as `Note: …` is never treated as a type.
- [ ] With **Breaking-change marker** on, a trailing `!` shows a red marker;
      turning it off leaves the colon-only form.
- [ ] A subject GitHub split across elements (a type in one node and the rest
      in another) is intentionally left plain instead of being corrupted.
- [ ] The badges follow client-side navigation and GitHub's recycled commit
      rows: a row that changes commit swaps to the new type or scope instead of
      keeping a stale one.

### Translation

- [ ] With the default **On click** trigger, a **Translate** button appears in
      the page's own action row (comment header, file or release header, issue
      or PR title row, description card) or, when no row is found, in a bar
      above the container; the container is one of the enabled **Places**
      (markdown, plain-text files, commit messages, titles, quick preview).
- [ ] Clicking **Translate** translates block by block: inline links,
      images, inline code and task-list checkboxes survive, the button shows a
      filling progress ring while it works, and no count or status text is
      printed.
- [ ] **Show original** restores the exact source markup (or, with **On
      hover**, pointing at the container peeks at the source while the pointer
      or focus stays inside).
- [ ] A second translation of the same text is instant while `cacheHours` has
      not expired; **Clear cache** empties it and `0` hours disables it.
- [ ] An unconfigured provider stops before any request with the localized
      setup message; a failing provider logs `GP-1601`, shows a toast and
      leaves the page untouched; a failed cache write logs `GP-1602` without
      breaking the page.
- [ ] Switching the provider, target language, mode or display in settings
      tears every translated container down and rescans, so no stale output
      survives a Save.
- [ ] A plain-text license gets the below-the-source box and keeps its line
      breaks; a syntax-highlighted file is left alone.
- [ ] The quick preview's translate action appears in its header only while
      the file resolves to rendered markdown, and the **Quick preview** place
      switch gates it.
- [ ] A release card on the feed shows one translate icon in its own header
      beside the kebab, and translating it translates every release body in the
      card — grouped release cards included — while the actor line, timestamp
      and reactions stay untouched.
- [ ] A release page (`/releases/tag/<tag>`) shows the **Translate** button in
      the title's action group in front of **Compare**, with no bar above the
      notes: the same small labelled button shape as Compare, with a visible gap
      between them. Translating still replaces and restores the notes in place.
- [ ] Turning **Translation** off restores every container and removes all
      chrome and observers; reused page headers carry no button onto the next
      page.

### Similar repositories

- [ ] On a public repository page the sidebar gains a **Similar repositories**
      section after GitHub's own sections, with a row per recommendation:
      owner/name, description, language with its color dot, stars, forks, an
      archived label when the project is archived, and a match percentage; the
      strongest row reads 100%.
- [ ] With **Data source: GitHub** a request goes to api.github.com only: the
      repository's metadata, then one search by its topics and primary
      language; the rows are ranked by shared topics, the same language and a
      comparable star count.
- [ ] With **Data source: SimRepo** the panel reads simrepo.dera.page and
      **View more** appends the next page; an anonymous visitor sees only the
      first page, and a further page shows the star-required state instead of
      failing silently.
- [ ] An archived recommendation wears its label; a row with no description,
      language or stars simply omits those parts without breaking the row.
- [ ] The states are honest and localized: loading, no results, not in the
      dataset (SimRepo), a rate limit with its reset time, and a failed request
      each render their own line rather than an empty box.
- [ ] A private or internal repository shows no panel at all and sends no
      request; the console Network tab stays quiet on its page.
- [ ] A soft navigation between two public repositories replaces the panel with
      the new repository's rows and never shows the previous repository's rows;
      a navigation to a page with no repository removes the panel.
- [ ] **Discovery → Similar repositories** off removes the panel and stops every
      request; changing the data source, the results count or the cache lifetime
      and pressing Save applies on the next panel load.
- [ ] Switching the interface language relabels the panel, its states and the
      settings card without a reload.

### Command palette
- [ ] `Ctrl`/`⌘`+`K` (or the configured shortcut) opens the palette; the header
      button and the manager's **Command palette** command open the same
      palette, and the focus is not taken when it sits in an input, textarea,
      select or `contenteditable`.
- [ ] On a repository page the palette opens already scoped to that
      repository: the field shows its path, the rows are its pages, and `Tab`
      on a repository row drills into it; `Backspace` leaves one level and
      `Ctrl`/`⌘`+`Backspace` clears the path to the root.
- [ ] `Tab` on a folder row narrows to that folder, `Tab` on the Issues or
      Pull requests page row opens that list as its own level, and `←` / `→`
      do the same while the field is empty.
- [ ] The `#` prefix lists open issues and pull requests (with their badges),
      the `/` prefix lists files in the scoped repository and the `@` prefix
      lists repositories; every typed query ends with the GitHub search
      handoff as its last group.
- [ ] The page ref is used for the page's own repository and `HEAD` for any
      other; a tree over 20 000 entries is truncated and the footer says so.
- [ ] Without a token the palette reads public data and commands still work; a
      verified token adds private repositories, and an unverified token yields
      no identity and no request is sent with it.
- [ ] A row's context menu opens on right-click or `Shift`+`F10`, floats above
      the palette and runs select, pin and copy actions.
- [ ] Favorites star in their own first group, recents follow, and both are
      per identity; switching accounts hides the other identity's rows.
- [ ] Settings Save closes an open palette and reinstalls or removes the
      hotkey; turning **Command palette** off removes the header entry, the
      hotkey and the menu command; **Clear cache** refills the next open from
      GitHub.

## Debugging

Diagnostics are silent by default. Turn them on in **GitHub Plus settings →
General → Diagnostics → Console logging** and press **Save**. From then on every
failure and trace prints to the browser console with its `GP-####` code, the
module that raised it, sanitized details and the error stack. Save applies the
switch without a reload; turning it off stops all output immediately.

While logging is on, `window.__GP_LOG__` offers the session journal:
`__GP_LOG__.entries` (live array), `__GP_LOG__.dump()` (app metadata plus the
entries), `__GP_LOG__.copy()` (JSON to the clipboard, with a console fallback)
and `__GP_LOG__.clear()`. In a sandboxed manager the API lives in the script's
context — switch the devtools console context to the userscript. Only uncaught
errors and unhandled rejections attributable to this bundle are captured;
GitHub's own failures and resource-load errors are ignored.

The **Copy log** button on the same card copies the journal without opening the
console; when the clipboard is unavailable it prints the JSON to the console
instead and says so. The buffer keeps the last 300 entries; consecutive
identical entries collapse into one with a `repeats` count.

Every failure carries a stable `GP-####` code — grep the repository for the
code to jump to the throw site. The codes come from
`src/core/logger/index.js`:

| Code | Name | Meaning |
|---|---|---|
| `GP-1001` | `BUS_LISTENER` | A bus listener threw while handling an event. |
| `GP-1002` | `SETTINGS_PERSIST` | Persisting settings to GM storage failed. |
| `GP-1003` | `SETTINGS_LOAD` | Reading settings from GM storage failed. |
| `GP-1004` | `SETTINGS_IMPORT` | Importing a settings backup failed (invalid payload). |
| `GP-1101` | `GALLERY_FAILED` | Collecting or opening a gallery failed (logged once at the click). |
| `GP-1102` | `GALLERY_SOURCE` | A registered gallery source threw while collecting its images. |
| `GP-1103` | `GALLERY_IMAGE` | A gallery image failed to load in the viewer. |
| `GP-1104` | `GALLERY_DOWNLOAD` | The page-level download button could not be shown for an image. |
| `GP-1201` | `UI_MOUNT` | Mounting the settings entry or panel failed. |
| `GP-1301` | `FILE_ICONS` | A file-icons surface or its selectors failed. |
| `GP-1302` | `FILE_AGES` | A file-ages surface or its selectors failed. |
| `GP-1303` | `FILE_META` | A file-meta surface or its selectors failed. |
| `GP-1401` | `FILE_MENU` | A file-menu clipboard write or raw-content fetch failed. |
| `GP-1501` | `FILE_PREVIEW` | A preview could not fetch or render its file. |
| `GP-1601` | `TRANSLATE` | A container could not be translated at all. |
| `GP-1602` | `TRANSLATE_CACHE` | Reading or persisting the translation cache failed. |
| `GP-1701` | `PALETTE_LOAD` | A palette source (repositories, tree, issues) failed to load. |
| `GP-1702` | `PALETTE_CACHE` | Reading or persisting the palette cache, recents or pins failed. |
| `GP-1801` | `COMMIT_BADGES` | A commit-badges surface or its selectors failed. |
| `GP-1901` | `FOLDER_TREE` | A folder could not be expanded from a user click. |
| `GP-2001` | `SIMILAR_REPOS` | The similar-repositories panel could not load its recommendations. |
| `GP-9001` | `UNCAUGHT_ERROR` | An uncaught runtime error attributable to this script. |
| `GP-9002` | `UNHANDLED_REJECTION` | An unhandled promise rejection attributable to this script. |

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
  `TOAST_MAX_DURATION_MS`, `FILE_COPY_MAX_BYTES` (1 MiB),
  `PREVIEW_TEXT_MAX_BYTES` (2 MiB), `PREVIEW_PDF_MAX_BYTES` (25 MiB),
  `PREVIEW_HIGHLIGHT_MAX_CHARS`, `PREVIEW_MAX_SIBLINGS`,
  `PREVIEW_LONG_PRESS_MS`, the diagnostics limits `LOG_MAX_ENTRIES` (300),
  `LOG_STRING_MAX_CHARS` (2000), `LOG_DETAIL_DEPTH` (4), `LOG_MAX_ITEMS` (50),
  the similar-repositories limits `SIMILAR_REPOS_PROVIDERS`,
  `SIMILAR_REPOS_RESULTS_MIN` / `_MAX` (3…20),
  `SIMILAR_REPOS_CACHE_HOURS_MAX` (168), `SIMILAR_REPOS_SIMREPO_URL`,
  `GITHUB_API_URL`, `SIMILAR_REPOS_TIMEOUT_MS` and the surface timings, and
  `DEFAULT_SETTINGS` / `getDefaults()` (including `DEFAULT_LOGGING`,
  `DEFAULT_FILE_META`, `DEFAULT_FILE_ICONS`, `DEFAULT_FILE_AGES`,
  `DEFAULT_FILE_MENU`, `DEFAULT_FILE_PREVIEW` and `DEFAULT_SIMILAR_REPOS`).
- `src/features/fileIcons/iconSet.generated.js` is generated data, not source:
  change the allowlist in `scripts/build-file-icons.mjs` and run
  `npm run icons:build`. The package is a dev dependency; the shipped bundle
  carries the icons inline.
- `src/features/fileAges/age.js` owns the commit-age bands and
  `AGE_BUCKET_COUNT` lives in `constants.js`; the ten shade values are in
  `src/styles/tokens.css` (`--gp-age-1` … `--gp-age-10`).
- `src/utils/size.js` owns size formatting (binary units, three significant
  digits) and `src/utils/fileTarget.js` owns the blob → raw address rewrite,
  file-target parsing (ref stripping, percent decoding) and the shared surface
  resolver; the pure parts are unit-tested, so keep DOM code out of the
  parsers. `DEFAULT_FILE_META` lives in `constants.js`.
- `src/features/fileMenu/copy.js` owns the text/binary decision; it is pure and
  unit-tested. `FILE_COPY_MAX_BYTES` and `DEFAULT_FILE_MENU` live in
  `constants.js`, and the menu component itself is `src/ui/contextMenu.js` —
  reusable, so keep file-specific rules out of it (pass `elevated: true` only
  when a menu must float above a modal).
- `src/features/filePreview/kind.js` owns the file-kind decision and language
  mapping, and `links.js` owns the relative-link rewrite; both are pure and
  unit-tested. `DEFAULT_FILE_PREVIEW` and the `PREVIEW_*` limits live in
  `constants.js`. The modal shell is `src/ui/filePreview.js` and takes a `load`
  callback, so rendering stays in the feature.
- `src/i18n/locales/*.js` holds the UI strings, one file per locale (ten in
  total). New strings go into all ten files — see the localization rule in
  [../CONTRIBUTING.md](../CONTRIBUTING.md). The localized `@name` /
  `@description` metadata lives in `vite.config.js`.

## Releasing

1. Bump `version` in `package.json`.
2. Run `npm install` to refresh `package-lock.json`.
3. Add the release entry to `CHANGELOG.md` (Keep a Changelog format).
4. If the icon set or its mapping changed, run `npm run icons:build` and commit
   `src/features/fileIcons/iconSet.generated.js`.
5. Run `npm run build` to regenerate the root `github-plus.user.js` and
   `github-plus.meta.js` with the new version.
6. Run `npm run ci` — build plus `verify:artifacts`; it must pass before the
   commit is pushed.
