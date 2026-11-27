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

- [ ] **T-008 · Fix the similar-repositories panel never loading on boot** —
  `similarRepos`, `P1`
  - **Context:** on a fresh page load of a public repository the
    **Similar repositories** panel does not appear, although the sidebar
    resolves and the settings are on. `initSimilarReposFeature()` in
    `src/features/similarRepos/index.js` already calls
    `applySimilarReposSettings()`, and `src/main.js` calls it a second time
    right after. The second apply tears the panel down and bumps the
    generation counter while the first apply's `load()` request is still in
    flight; the in-flight fetch then fails its generation check and discards
    its result, and no later retry runs, because `ensure`/`load` returns early
    on `inflight.has(key)`. A manual `history.pushState` (which fires
    `watchNavigation`) re-applies cleanly and the panel renders, which is how
    this was confirmed while capturing screenshots.
  - **Plan:** 1) In `src/main.js`, drop the redundant
    `applySimilarReposSettings()` call and let `initSimilarReposFeature()`
    keep the single boot apply. 2) If a second apply can still arrive from the
    bootstrap path, make `applySimilarReposSettings()` idempotent for unchanged
    settings (compare against the previously applied section, as the provider
    or page-size change path already does) so it does not bump the generation.
    3) Add a regression test in `test/similarRepos*.test.js` that applies twice
    in a row and asserts one request and one rendered panel.
  - **Scope:** the similar-repos boot path only; other features' double-apply
    call sites are out of scope unless they show the same symptom.
  - **Done when:** on a cold load of a public repository with the feature on,
    the panel appears without a navigation; toggling the provider or results
    in settings still refetches; turning the feature off still leaves no
    panel and no request.
  - **Verify:** `npm test` with the new regression test; manual cold-load on a
    public repository, a private repository (no panel, no request) and after a
    soft navigation; `npm run build` and `npm run ci`.
  - **Risks / open questions:** whether to remove the `main.js` call or make
    the apply idempotent is a small design decision — prefer the idempotent
    apply if other boot paths can also double-apply, otherwise the simpler
    call-site removal. The double-apply pattern may exist for other features
    (file icons, translate); check them for the same race before closing.

## Ideas

_Unvetted suggestions only. Promote an idea to **Backlog** once it has a goal,
an agreed place in the architecture and a priority._

## Done

Newest first. Record the shipped version and date, for example
`- [x] **T-003 · …** — shipped in 0.33.0 (2026-11-22)`. Remove entries older
than the last two releases; `CHANGELOG.md` is the authoritative history.

- [x] **T-007 · Add a Screenshots section to the READMEs** — shipped in 0.34.1
  (2026-11-27). Ten captures of the userscript on live GitHub pages live under
  `docs/screenshots/` and are shown in `README.md` and its nine translations,
  in the layout used by the author's other project: one full-width image, then
  2×2 tables with a caption under each. Each README keeps the localized
  heading and captions and the same image order; the version badge and Status
  line were bumped in all ten.
- [x] **T-006 · Show author avatars in issue and pull request lists** —
  shipped in 0.34.0 (2026-11-24). Each row of the issue and pull-request lists
  carries the author's 16px round avatar before the login, in GitHub's own
  metadata line; the **Issues** settings page turns it off. Unit-covered by
  `listAvatars` (resolution, URL building, idempotent placement, teardown) and
  `listAvatarsLifecycle` (both lists, disable, re-render, recycled author);
  login resolution was also checked against saved copies of the live
  `/issues` and `/pulls` pages (25 of 25 rows each). The live theme and
  soft-navigation check stays on the manual checklist.

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
