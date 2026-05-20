# Dhamma Data — handoff to next session

This document captures the state at the end of the previous chat so
the next chat can pick up without re-reading the full conversation.
Read **this**, then **CLAUDE.md** for the project's standing context.

Live at **https://dhamma.fly.dev/** · GitHub: `Keenan-ux/dhamma`
Last verified: `dbcheck → passages: 25,986, tables: 10, pgvector: true`

---

## What this session shipped

Working tree is clean. Ten commits on top of `92d3e86`, all pushed
and deployed:

- `01f2d3d` — Stream 2 BHS dictionary commit (17,839 entries; already
  in prod, code now in repo).
- `020ec76` — Stream 3 search refinements: `?pitaka=` filter +
  sentence-aware snippets via `refineSnippet`.
- `bf11c84` — Stream 5: hide CST mūla volume-header uddāna rows from
  `/api/corpus`; `index-title.html` parser + named-entity decoder
  for ATI tag ingest; short-passage audit report.
- `5daf102` — Stream 4 outreach drafts (revised ATI letter + new
  SuttaCentral draft).
- `e07dde6` — CLAUDE.md state-of-handoff updates (BHS + CST uddāna).
- `8facb6c` — Removed dead `src/TabBar.jsx`; gitignored four debug
  dump artifacts + `.claude/`.
- `33c0c2a` — `backfill-display-order.mjs` one-shot script (DN MN
  SN AN KN canonical order is now explicit in prod; turned out the
  nikāyas were already correct but three top-level rows had drifted).
- `760e4a1` — Reader-header icons collapse into a "…" dropdown on
  narrow viewports.
- `b562183` — `/api/random-passage` endpoint + "Random sutta" entry
  in Sidebar + mobile menu.
- `cc5606a` — Scholarly-register `README.md` rewrite +
  new `CONTRIBUTING.md`. **Awaiting user review before
  `gh repo edit --visibility public`.**

### Notable additions to the runtime

- **`/api/random-passage?scope=sutta|all`** picks a passage with an
  English translation that isn't a CST uddāna. Backs the new
  Random-sutta affordance.
- **`/api/search?pitaka=sutta|vinaya|abhidhamma`** scopes Pali
  results to descendants of `pli-sutta`/`pli-vinaya`/`pli-abhidhamma`
  via a recursive CTE on `works.parent_slug`. Silently ignored when
  `field=library`. Pitaka-descendants cache is process-lifetime.
- **Sentence-aware snippets** — `ts_headline` uses ASCII SOH/STX
  delimiters and the server expands each fragment to its surrounding
  sentence(s) before stripping markers. Falls back to first ~200
  chars when there's no FTS overlap.

---

## To-do — work through top to bottom

Linear list. None of these requires a fresh chat — keep going until
you hit context limit, then write a new HANDOFF.md.

1. **User review of `README.md` + `CONTRIBUTING.md`.** They're
   committed but the user hasn't read them yet. Get sign-off on the
   tone before any public-flip.
2. **Make GitHub repo public**: `gh repo edit Keenan-ux/dhamma --visibility public`. Requires explicit user authorisation.
3. **Send the ATI email** (`ATI_EMAIL_DRAFT.md`) — drafted in
   scholarly register per the no-marketing memory note. User
   sends; we don't.
4. **Send the SuttaCentral email** (`SUTTACENTRAL_EMAIL_DRAFT.md`).
5. **Announce on Reddit / DhammaWheel / Buddhist-Studies lists** —
   user posts; we draft if asked.
6. **Split-pane parallel reader.** True side-by-side compare of two
   passages (DN 22 ↔ MN 10). Today's pin-based workaround is
   acceptable but cramped. Substantial UI rebuild — BrowseView's
   ReadingPanel becomes two-up with synchronised scrolling.
7. **Critical Pali Dictionary (CPD)** — next dictionary in
   `DICTIONARIES.md` after BHS. The CPD is scholarly gold but
   incomplete (alphabetical, never finished past T) and harder to
   extract than the Cologne lexica. Source-acquisition step first.
8. **Bhikkhu Bodhi commentary translations** — would lift the 2.3%
   CST translation coverage substantially. Source is mostly
   Wisdom Publications (BPS, *In the Buddha's Words*, *Numerical
   Discourses* etc.) — **not open-licensed**, so this is blocked
   on either a licensing arrangement or finding a CC-licensed
   subset. Audit licensing situation first; don't ingest blind.
9. **`@xenova/transformers` v2 → v3 migration** — see
   `xenova-v2-pinned` memory note. Triggers a corpus re-embed
   (BGE-M3 vectors aren't portable across model versions), so save
   it for when everything else is settled.

### Smaller follow-ups (nice-to-have)

- Citation formatting for Vinaya IDs — current display is
  `PLI-TV-BI-VB-PJ1-4`. Cleaner: `Bhi. Pj. 1-4`. Needs a per-source
  mapping table; `citationFormat.js` exists.
- Per-passage bookmarks already exist (localStorage); a
  `/random-sutta-of-the-day` style daily affordance could be wired
  on top of the new `/api/random-passage` endpoint if the user wants
  one.

---

## Architecture quick-reference

### Frontend
```
src/
  Dhamma.jsx              — top-level router (hash-based); now holds
                            handleRandomSutta passed to Sidebar + TopNav
  TopNav.jsx              — header + MENU slide-in panel (Random sutta in mobile tools)
  Sidebar.jsx             — desktop sidebar (Corpus + Tools groups + Random sutta)
  CanonMapView.jsx        — Tipiṭaka frontmatter
  CommentaryView.jsx      — Aṭṭhakathā + Ṭīkā frontmatter
  ExtraCanonicalView.jsx  — Anya frontmatter
  LibraryView.jsx         — ATI library browse + article reader
  TagsView.jsx            — curated tag drill-down
  BookmarksView.jsx       — local-only bookmark list
  SearchView.jsx          — Exact/Stem/Meaning + scopes
  CompareView.jsx         — Concordance (KWIC + companion words)
  DictionaryView.jsx      — selection-popover host + standalone lookup
  BrowseView.jsx          — column drill-down + ReadingPanel (header
                            now uses an actions[] array; isNarrow
                            collapses to a "…" dropdown)
  PassageCard.jsx         — search/concordance result tile
  SelectionActions.jsx    — selection popover (Search/Compare/Copy/Dict)
  api.js                  — fetch helpers (passageX, libraryX, tagsX,
                            glossApi, randomPassageApi…)
  useCorpus.js, usePassage.js, useSearch.js, useCompareStats.js
  useBookmarks.js         — localStorage hook
  useIsNarrow.js          — viewport-width hook (breakpoint 880)
  paliStem.js             — heuristic stripper for stem matching
  parseQuery.js, searchHistory.js
  citationFormat.js       — PTS-ish citation builder
  dictHtml.js             — HTML preparers + SOURCE_LABEL (now incl. bhs)
  theme.css               — only --bc-* tokens; light + dark
```

### Server
```
server/src/
  index.js     — Hono routes (now incl. /api/random-passage)
  db.js        — postgres connection + applySchema on boot
  corpus.js    — /api/corpus tree + getPassage(s); hides uddāna rows
  search.js    — /api/search (FTS + vector + RRF; pitaka filter;
                 sentence-aware refineSnippet)
  compareStats.js — /api/compare-stats (per-piṭaka frequency + KWIC source)
  dictionary.js   — /api/lookup with cascade across dpd/dppn/ped/mw/bhs
  aliases.js   — alias table cache
  embed.js     — BGE-M3 ONNX local
  paliStem.js  — server copy of the heuristic
server/sql/
  schema.sql   — all CREATE TABLE IF NOT EXISTS (idempotent on boot)
  seed-aliases.sql, seed-stubs.sql
```

### Data tables
- `traditions`, `works` (display_order normalised), `passages`
- `dictionary_entries` + `dictionary_inflections` — five sources:
  DPD, DPPN, PED, MW, BHS
- `translations` (Sujato + ATI multi-translator)
- `articles` (ATI Library, 386 rows, with embedding HNSW)
- `passage_parallels` (30,741 SC parallels)
- `passage_tags` (3,547 ATI-indexed tags)
- `aliases` (cross-canon term equivalents)

### Endpoints
- `/api/corpus`, `/api/passage/:id`, `/api/passages?ids=`
- `/api/random-passage?scope=sutta|all` *(new)*
- `/api/search?q=&mode=&field=&limit=&pitaka=` *(pitaka new)*
- `/api/compare-stats?q=`
- `/api/lookup?term=&source=&language=&mode=`
- `/api/library`, `/api/library/:slug`
- `/api/passage/:id/translations`
- `/api/passage/:id/parallels`
- `/api/passage/:id/tags`, `/api/tags?type=&value=`
- `POST /api/gloss` `{ words: [...] }`
- `/api/healthz`, `/api/dbcheck`

### Deploy / data ops
- **Deploy**: `flyctl deploy --app dhamma` (5–8 min, schema auto-applies on boot)
- **Local DB access**: `flyctl proxy 15432 --app dhamma-pg` running in background
- **DB password fetch**: `flyctl ssh console --app dhamma -C "printenv DATABASE_URL"`
- **Ingest scripts run from**: `scripts/ingest/`, using `DATABASE_URL` env var pointing at the local proxy (`ssl: false` because traffic goes through flyctl's loopback)

---

## Project rules (don't violate)

- **No Tailwind.** Inline styles using `var(--bc-*)` tokens only.
- **No analytics, telemetry, geolocation.**
- **No LLM at runtime by default.** Future opt-in "Synthesize" button
  OK but explicitly labeled AI-generated, off until earned.
- **Academic typesetting** — Noto Serif body, small-caps section
  labels, thin gold rules, generous whitespace.
- **CC BY-NC 4.0 honoured** — every ATI-sourced rendering shows
  copyright + licence + source link in its footer.
- **Pin model & DB versions** — BGE-M3 only works against BGE-M3
  vectors. Don't switch models without a full re-embed.
- **Scholarly register in outreach + UI prose.** See
  `feedback-tone-no-marketing` memory note.

---

## Memory notes worth re-reading

Located at `~/.claude/projects/C--Dev-Dhamma/memory/`:
- `fly-memory-requirement.md` — 4 GB or BGE-M3 OOMs
- `xenova-v2-pinned.md` — v3 upgrade deferred until next re-embed
- `snippet-sentence-upgrade.md` — **superseded; shipped this session**.
  Update / remove next time you touch memory.
- `cst-tipitaka-source.md` — VRI CST XML peculiarities
- `never-suggest-stopping.md` — bias toward forward motion
- `feedback-tone-no-marketing.md` — scholarly voice in outreach + docs

---

## How to start the next chat

```
Read C:\Dev\Dhamma\HANDOFF.md and C:\Dev\Dhamma\CLAUDE.md. Previous
chat is at context limit. Deployed state is good — verify with
`curl -s https://dhamma.fly.dev/api/dbcheck`. Working tree should
be clean.

Start at item 1 in HANDOFF.md's to-do list. Items 1-5 need user
sign-off or are user actions; surface them and wait for direction
before proceeding. Items 6-9 are dev work — start whichever the
user picks. Don't stop between items — keep going until you hit
context limit, then write a new HANDOFF.md.
```
