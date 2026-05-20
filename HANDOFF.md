# Dhamma Data — handoff to next session

This document captures the state at the end of the previous chat so
the next chat can pick up without re-reading the full conversation.
Read **this**, then **CLAUDE.md** for the project's standing context.

Live at **https://dhamma.fly.dev/** · GitHub: `Keenan-ux/dhamma`
Last verified: `dbcheck → passages: 25,986, tables: 10, pgvector: true`

---

## What this session shipped

Working tree is clean. Sixteen commits on top of `92d3e86`, all
pushed and deployed:

### Code

- `01f2d3d` — Stream 2 BHS dictionary commit (17,839 entries).
- `020ec76` — Stream 3 search refinements: `?pitaka=` filter +
  sentence-aware snippets via `refineSnippet`.
- `bf11c84` — Stream 5: hide CST mūla volume-header uddāna rows from
  `/api/corpus`; `index-title.html` parser + named-entity decoder
  for ATI tag ingest; short-passage audit report.
- `8facb6c` — Removed dead `src/TabBar.jsx`; gitignored four debug
  dump artifacts + `.claude/`.
- `33c0c2a` — `backfill-display-order.mjs` one-shot script
  (canonical Theravāda ordering normalised in prod).
- `760e4a1` — Reader-header icons collapse into a "…" dropdown on
  narrow viewports.
- `b562183` — `/api/random-passage` endpoint + "Random sutta" entry
  in Sidebar + mobile menu.
- `177c7f5` — **CPED ingest** — Buddhadatta 1949 / ed. Ānandajoti,
  20,959 entries live under `source='cped'`, `language='pli'`.
  Sixth dictionary; third independent Pali reading on every term.
- `2712c69` — **Split-pane parallel reader.** When a passage is
  pinned + a leaf is open + viewport ≥ 880 px, BrowseView renders
  two passages as independent-scroll columns at full reading chrome,
  with a toolbar (Back / Side-by-side / Swap / Unpin). Narrow
  viewports keep the stacked compact fallback.

### Docs + outreach

- `5daf102` — Stream 4 outreach drafts (revised ATI letter +
  SuttaCentral letter).
- `e07dde6` — CLAUDE.md state-of-handoff updates (BHS + CST uddāna).
- `cc5606a` — Scholarly-register `README.md` rewrite + new
  `CONTRIBUTING.md`. **Awaiting user review.**
- `da2b6bd` — CPD + Bhikkhu Bodhi licensing audits documented;
  Xenova v3 migration plan in the `xenova-v2-pinned` memory note.
- `889ac44` — Permission-request letter drafts to **BPS** (Bodhi
  commentary books) and **Cologne + PTS** (CPD mirror).
- `aa22344` — Gitignored CPED source archives + ingest `.cache/`.

### Notable additions to the runtime

- **`/api/random-passage?scope=sutta|all`** — picks a passage with
  an English translation that isn't a CST uddāna.
- **`/api/search?pitaka=sutta|vinaya|abhidhamma`** — recursive CTE
  on `works.parent_slug`, process-lifetime cached.
- **Sentence-aware snippets** in `/api/search` for FTS hits.
- **Six dictionaries cascading on every `/api/lookup`**: DPD, DPPN,
  PED, CPED (Pali); MW, BHS (Sanskrit, under `?language=san`).
- **Split-pane reader** in `BrowseView` for true side-by-side
  passage compare; pin a passage, open another, and at ≥ 880 px
  you get two full-chrome columns.

---

## To-do — work through top to bottom

Linear list. Items 1–6 need user sign-off or are user actions;
surface them and wait for direction before proceeding. Items 7–9 are
dev work — start whichever the user picks.

1. **User review of `README.md` + `CONTRIBUTING.md`.** Committed but
   not yet read. Get sign-off on the tone before any public-flip.
2. **Make GitHub repo public**: `gh repo edit Keenan-ux/dhamma --visibility public`. Requires explicit user authorisation.
3. **Send the ATI email** (`ATI_EMAIL_DRAFT.md`).
4. **Send the SuttaCentral email** (`SUTTACENTRAL_EMAIL_DRAFT.md`).
5. **Send the BPS email** (`BPS_EMAIL_DRAFT.md`) — asks for
   CC BY-NC 4.0 on Bhikkhu Bodhi's commentary translation books
   (BP209S, BP210S, BP211S, BP212S).
6. **Send the Cologne+PTS email** (`CPD_EMAIL_DRAFT.md`) — asks
   for permission to mirror the Critical Pali Dictionary.
7. **`@xenova/transformers` v2 → v3 migration.** See updated
   `xenova-v2-pinned` memory note for the full playbook:
   smoke-test vector equivalence first; if cosine v2-vs-v3 holds
   > 0.9999, pure code swap (drop the protobufjs override too);
   otherwise full corpus re-embed (~30 min local CPU, no schema
   change). Best bundled with the next re-ingest moment
   (Chinese/Sanskrit corpus, or a model swap).
8. **If BPS replies yes** to item 5 — ingest the four Bodhi
   commentary translation books from bps.lk PDFs into
   `translations` and `passages` tables. Same attribution
   pattern as ATI (translator + year + licence + source URL in
   each row's footer).
9. **If Cologne/PTS replies yes** to item 6 — ingest the CPD
   from DPD's scraped SQLite (`digitalpalidictionary/other-dictionaries`,
   `dictionaries/cpd/cpd.tar.zst`, 29,734 entries). Same ingest
   pattern as `ingest-cped.mjs` landed this session; new source
   value `'cpd'`. Also worth investigating in the same letter:
   Margaret Cone's *A Dictionary of Pāli* (PTS, 2001–).

### Smaller follow-ups (nice-to-have)

- Citation formatting for Vinaya IDs — current display is
  `PLI-TV-BI-VB-PJ1-4`. Cleaner: `Bhi. Pj. 1-4`. Needs a per-source
  mapping table; `citationFormat.js` exists.
- "Random sutta of the day" affordance on top of
  `/api/random-passage` if the user wants it.
- `simplify` review pass over `src/BrowseView.jsx` — that file
  has grown to ~1500 lines and the actions[] array refactor
  this session simplified the icon row but the rest of
  ReadingPanel is still dense.

---

## Architecture quick-reference

### Frontend
```
src/
  Dhamma.jsx              — top-level router (hash-based);
                            handleRandomSutta passed to Sidebar + TopNav
  TopNav.jsx              — header + MENU slide-in panel
  Sidebar.jsx             — desktop sidebar (Corpus + Tools + Random sutta)
  CanonMapView.jsx        — Tipiṭaka frontmatter
  CommentaryView.jsx      — Aṭṭhakathā + Ṭīkā frontmatter
  ExtraCanonicalView.jsx  — Anya frontmatter
  LibraryView.jsx         — ATI library browse + article reader
  TagsView.jsx            — curated tag drill-down
  BookmarksView.jsx       — local-only bookmark list
  SearchView.jsx          — Exact/Stem/Meaning + scopes
  CompareView.jsx         — Concordance (KWIC + companion words)
  DictionaryView.jsx      — selection-popover host + standalone lookup
  BrowseView.jsx          — column drill-down + ReadingPanel.
                            Split-pane viewer when pinned + leaf set
                            (≥ 880 px, !readingMode). Reader-header
                            icons collapse into a "…" dropdown on narrow.
  PassageCard.jsx         — search/concordance result tile
  SelectionActions.jsx    — selection popover (Search/Compare/Copy/Dict)
  api.js                  — fetch helpers incl. randomPassageApi
  useCorpus.js, usePassage.js, useSearch.js, useCompareStats.js
  useBookmarks.js         — localStorage hook
  useIsNarrow.js          — viewport-width hook (breakpoint 880)
  paliStem.js, parseQuery.js, searchHistory.js
  citationFormat.js       — PTS-ish citation builder
  dictHtml.js             — HTML preparers + SOURCE_LABEL
                            (six sources: dpd dppn ped cped mw bhs)
  theme.css               — only --bc-* tokens; light + dark
```

### Server
```
server/src/
  index.js     — Hono routes incl. /api/random-passage
  db.js        — postgres connection + applySchema on boot
  corpus.js    — /api/corpus tree + getPassage(s); hides uddāna rows
  search.js    — /api/search (FTS + vector + RRF; pitaka filter;
                 sentence-aware refineSnippet)
  compareStats.js — /api/compare-stats
  dictionary.js   — /api/lookup cascade across dpd/dppn/ped/cped/mw/bhs
  aliases.js   — alias table cache
  embed.js     — BGE-M3 ONNX local (@xenova/transformers v2, pinned)
  paliStem.js  — server copy of the heuristic
server/sql/
  schema.sql   — all CREATE TABLE IF NOT EXISTS (idempotent on boot)
  seed-aliases.sql, seed-stubs.sql
```

### Data tables
- `traditions`, `works` (display_order normalised), `passages`
- `dictionary_entries` + `dictionary_inflections` — **six sources**:
  DPD (88,933), DPPN (13,603), PED (15,702), CPED (20,959),
  MW (193,890), BHS (17,839)
- `translations` (Sujato + ATI multi-translator)
- `articles` (ATI Library, 386 rows, with embedding HNSW)
- `passage_parallels` (30,741 SC parallels)
- `passage_tags` (3,547 ATI-indexed tags)
- `aliases` (cross-canon term equivalents)

### Endpoints
- `/api/corpus`, `/api/passage/:id`, `/api/passages?ids=`
- `/api/random-passage?scope=sutta|all`
- `/api/search?q=&mode=&field=&limit=&pitaka=`
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
- **Ingest scripts run from**: `scripts/ingest/`, using `DATABASE_URL` env var pointing at the local proxy (`ssl: false` — flyctl loopback)

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
- `xenova-v2-pinned.md` — full v3 migration playbook
- `snippet-sentence-upgrade.md` — FTS-side shipped this session;
  vector-only sentence embeddings still deferred (notes updated)
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

Start at item 1 in HANDOFF.md's to-do list. Items 1-6 need user
sign-off or are user actions; surface them and wait for direction
before proceeding. Items 7-9 are dev work — start whichever the
user picks. Don't stop between items — keep going until you hit
context limit, then write a new HANDOFF.md.
```
