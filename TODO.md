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

_No open task._

## Ideas

_Unvetted suggestions only. Promote an idea to **Backlog** once it has a goal,
an agreed place in the architecture and a priority._

## Done

Newest first. Record the shipped version and date, for example
`- [x] **T-003 · …** — shipped in 0.33.0 (2026-11-22)`. Remove entries older
than the last two releases; `CHANGELOG.md` is the authoritative history.

- [x] **T-006 · Show author avatars in issue and pull request lists** —
  shipped in 0.34.0 (2026-11-24). Each row of the issue and pull-request lists
  carries the author's 16px round avatar before the login, in GitHub's own
  metadata line; the **Issues** settings page turns it off. Unit-covered by
  `listAvatars` (resolution, URL building, idempotent placement, teardown) and
  `listAvatarsLifecycle` (both lists, disable, re-render, recycled author);
  login resolution was also checked against saved copies of the live
  `/issues` and `/pulls` pages (25 of 25 rows each). The live theme and
  soft-navigation check stays on the manual checklist.
- [x] **T-005 · Host the release-page translate action in the release header** —
  shipped in 0.33.3 (2026-11-24). The action is a small labelled button in the
  release title's action group, in front of **Compare**, with the title row as
  the fallback when that group is absent. Unit-covered by `translateSurfaces`
  and `translateUi`; the live release-page check stays on the manual checklist.
- [x] **T-004 · Host the feed translate action in the card header** — shipped in
  0.33.2 (2026-11-23). A feed release card is one translation unit: the action
  sits in the card header before the kebab and translates every release body in
  it, grouped items included. Unit-covered by `translateSurfaces` and
  `translateState`; the live feed check stays on the manual checklist.
- [x] **T-003 · Add a similar-repositories panel to repository pages** — shipped
  in 0.33.0 (2026-11-23). Data source is a setting: `github` (default) or the
  opt-in `simrepo` third party; public repositories only.
- [x] **T-002 · Cover the newer features in the manual test checklist** —
  shipped in 0.33.0 (2026-11-23).
- [x] **T-001 · Align the Node.js engine line in `docs/DEVELOPMENT.md`** —
  shipped in 0.33.0 (2026-11-23).

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
