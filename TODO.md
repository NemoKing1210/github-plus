# TODO

The GitHub Plus task backlog. [AGENTS.md](AGENTS.md#tasks-and-planning) defines
how an agent picks, plans and finishes a task; this file records the work
itself. Shipped behavior belongs in [CHANGELOG.md](CHANGELOG.md) — this is a
plan, not a second changelog.

## How to use this file

- **One task per checkbox.** A task is a unit of work that can be planned,
  tested and shipped as one focused branch or commit series.
- **A task has one home.** It sits in exactly one of **In progress**,
  **Next up** or **Backlog**. **Ideas** holds unvetted suggestions and **Done**
  keeps recently finished or dropped entries.
- **IDs are permanent.** `T-001`, `T-002`, … are assigned once and never
  reused, even after a task is finished or dropped, so a branch, commit or
  issue can name one unambiguously.
- **Priority is a promise.** `P0` and `P1` are commitments; `P2` is scheduled
  but movable; `P3` is a nice-to-have with no delivery promise.
- **Keep it current.** A stale backlog is worse than none: update the entry
  when work starts, blocks or finishes.
- **No private data.** A task names files and behavior, never a token, an email
  address or a private repository.

Status markers:

| Marker | Meaning |
|--------|---------|
| `- [ ]` | Open — not finished |
| `- [x]` | Done — shipped and verified |
| `- [ ] ~~text~~` | Dropped — the entry keeps the reason |

Priority:

| Priority | Meaning |
|----------|---------|
| `P0` | Broken release or data loss; stop everything |
| `P1` | Next release |
| `P2` | Should be scheduled after the current release |
| `P3` | Nice to have; no promise |

Area tags: `core`, `gallery`, `settings`, `files`, `discovery`, `palette`,
`translate`, `commits`, `ui`, `i18n`, `test`, `docs`, `build`.

## Task format

Write a task as a mini-plan, not a reminder. It must carry enough context that
someone who was not in the conversation can execute it later: what the code
does today, the intended approach, how to verify it, and the open questions.
The full block is the default; a one-line entry is acceptable only for a
trivial, self-contained chore.

```markdown
- [ ] **T-NNN · Short imperative title** — `area`, `P2`
  - **Context:** what the code does today, the symptom, and why now; link the
    issue, spec or commit that motivated it.
  - **Plan:** the numbered steps, naming the module and the change in each.
  - **Scope:** what is explicitly out of scope.
  - **Done when:** observable acceptance criteria per surface.
  - **Verify:** tests to add or update, manual checks on live `github.com`, and
    the localization, design and build follow-ups.
  - **Risks / open questions:** markup assumptions, compatibility, decisions
    still needed.
```

The title is imperative ("Add…", "Fix…", "Remove…"); **Context** states a
problem, not a solution; **Done when** is something a tester can observe. Link
code paths and docs instead of pasting them. Reference the task ID in the branch
name (`feat/t-042-palette-folder-enter`) and in the commit body. When an issue
or spec exists, link it — a chat message or an untracked local file is never
the only context.

## In progress

_No task is in progress._

## Next up

_Nothing is scheduled for the next release._

## Backlog

- [ ] **T-001 · Align the Node.js engine line in `docs/DEVELOPMENT.md`** —
  `docs`, `P3`
  - **Context:** the page says `package.json` requires Node `>=20`, while it
    requires `>=22` (and `.nvmrc`, `CONTRIBUTING.md` and this repository's
    build instructions all ask for 22). A contributor on Node 20 is told that
    version is supported when it is not.
  - **Plan:** 1. Change the Requirements line in `docs/DEVELOPMENT.md` to Node
    22; 2. re-read the page for any other engine or version claim that drifted
    from `package.json`.
  - **Scope:** documentation only. Do not lower `engines` to match the stale
    text, and do not touch `.nvmrc` or the build.
  - **Done when:** `docs/DEVELOPMENT.md` asks for Node 22 and matches
    `package.json` exactly.
  - **Verify:** compare the page against `package.json` and `.nvmrc`; run
    `npm run ci` as the repository gate.
  - **Risks / open questions:** none.

- [ ] **T-002 · Cover the newer features in the manual test checklist** —
  `docs`, `P2`
  - **Context:** the manual checklist in `docs/DEVELOPMENT.md` stops at the
    quick preview. The folder tree, commit badges, translation and the command
    palette have no manual checks, so their regressions depend on unit tests
    alone and on whoever remembers the feature.
  - **Plan:** 1. Add a section per feature to the checklist; 2. for each,
    cover its entry points, settings toggles, failure states, teardown and
    soft-navigation behavior; 3. keep the boxes observable and ordered like
    the existing sections.
  - **Scope:** `docs/DEVELOPMENT.md` only. Do not restructure the existing
    sections or add automated tests here.
  - **Done when:** each of the four features has its own checklist section
    with every box verifiable on live `github.com`.
  - **Verify:** walk one feature's checklist against the built script; compare
    the wording and structure with the existing sections and the debugging
    entries in `AGENTS.md`.
  - **Risks / open questions:** the checklist can drift from the code; prefer
    stable entry-point names and link `AGENTS.md` for the selectors.

- [ ] **T-003 · Add a similar-repositories panel to repository pages** —
  `discovery`, `P2`
  - **Context:** the SimRepo extension
    ([store](https://chromewebstore.google.com/detail/simrepo/jieoogmcigenidbkgnkaakagdnlnieap),
    [source](https://github.com/Mubelotix/SimRepo)) adds a **Similar
    repositories** section to the sidebar of a GitHub repository page. Each row
    shows owner/name, description, language with its color, stars, forks, an
    archived label and a similarity percentage; **View more** appends further
    pages. It is token-free, serves repository names from a prebuilt dataset,
    and requires starring the SimRepo repository for pagination and full
    batches. The store listing names public repositories with more than 100
    stars as the target. GitHub Plus has no discovery surface today, so this
    would be its first feature that recommends content instead of decorating
    GitHub's own.
  - **Plan:** 1. Add `features/similarRepos/` with `surfaces.js` (the sidebar
    container and its resolve function), `index.js` (surface observer, shell
    watchers, bounded settle wait, settings reaction, per-repository cache),
    `render.js` (panel, rows and states in the `gp-` style) and a provider
    module behind a small interface; 2. fetch only on a public repository page,
    for its `owner/repo`, and render loading, empty/not-in-dataset, private,
    rate-limited and network-failure states; 3. link each row to
    `/<owner>/<repo>`, its stargazers and its forks, and append further pages
    from **View more**; 4. add a settings card (master switch, result count,
    data source, cache lifetime) plus the ten locale key sets; 5. add a bus
    event and store the switches in `DEFAULT_SETTINGS` with normalizers.
  - **Scope:** repository pages only. No star-history charts, leaderboards,
    the SimRepo website, private or internal repositories, or other GitHub
    pages. Do not copy SimRepo code, CSS, assets or its dataset: its extension
    is GPL-3.0-only, while this project is MIT.
  - **Done when:** on a public repository with recommendations the sidebar
    shows the panel with the fields above and working pagination; a repository
    outside the dataset, a private repository, a rate limit and a network
    failure each show an honest localized state without breaking the sidebar;
    the panel follows soft navigation to another repository and disappears on
    pages without one; turning the feature off removes the panel and its
    observers and leaves GitHub's markup byte-identical; no request is made
    while the feature is off or on a private repository.
  - **Verify:** unit tests for response normalization (missing fields, archived
    rows, empty list), row and API URL building, cache keys and TTL, and the
    sidebar resolver; a DOM test for the panel states if the shell grows beyond
    markup; manual checks on a popular repository, a repository outside the
    dataset, a private repository, a soft navigation between repositories and
    the off switch; `npm test`, `npm run build` and `npm run ci`.
  - **Risks / open questions:** decide the data source before coding —
    (a) call SimRepo's public endpoint
    (`GET https://simrepo.dera.page/similar-repos?repo=…&page=…`, no token but
    undocumented, IP rate-limited, and it sends the repository name to a third
    party), (b) derive candidates from GitHub topics and primary language with
    the palette's token and API client, or (c) ship no remote dependency and
    leave the feature out for now. Confirm the endpoint's terms and add
    attribution if it is used. Treat GitHub's sidebar heading text
    (Releases/Contributors/Languages) as fragile and degrade to no-op if it
    changes. Add an `@connect` grant and a privacy note only for the chosen
    source, and cap results and cache lifetime through new constants.

## Ideas

_Unvetted suggestions only. Promote an idea to **Backlog** once it has a goal,
an agreed place in the architecture and a priority._

## Done

_No completed task is waiting to be archived._

Newest first. Record the shipped version and date, for example
`- [x] **T-003 · …** — shipped in 0.33.0 (2026-11-22)`. Remove entries older
than the last two releases; `CHANGELOG.md` is the authoritative history.

## Definition of done

A task is finished only when every condition below is true. `AGENTS.md`
repeats the agent-side workflow; this list is the bar itself.

- The behavior works on every surface the task names, checked on live
  `github.com`, including a soft navigation when the feature survives one.
- `npm test` passes, and pure logic added or changed by the task has a unit
  test in `test/`.
- New user-facing strings exist in all ten `src/i18n/locales/*.js` files with
  identical key order.
- Visual work follows [DESIGN.md](DESIGN.md) and updates `DESIGN.md`,
  `src/styles/tokens.css` and `src/styles/app.css` together.
- Documentation matches the change: the module reference, settings table and
  debugging notes in `AGENTS.md`, the relevant `docs/*.md` page, and
  `README.md` plus its nine translations when the feature set or version
  changed.
- The version is bumped in `package.json` and `package-lock.json` when the task
  changes user-visible behavior, `CHANGELOG.md` records it, and `npm run build`
  regenerated the root artifacts.
- `npm run ci` passes (build plus artifact verification).
- This file is updated in the same change: the entry is ticked, moved to
  **Done** with its version and date, or dropped with a reason.
