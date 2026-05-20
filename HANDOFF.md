# Dhamma Data — handoff to next session

This document captures the state at the end of a long multi-chat session
so the next chat can pick up without re-reading the full conversation.
Read **this**, then **CLAUDE.md** for the project's standing context.

Live at **https://dhamma.fly.dev/** · GitHub: `Keenan-ux/dhamma`
Last verified: `dbcheck → passages: 25,986, tables: 10, pgvector: true`

---

## What this session shipped

Five parallel work streams ran in tandem near the end. Streams 1, 2, 3, 4,
and 5 each owned a disjoint file set so chats couldn't collide.
**Three streams are committed; two have uncommitted work in the local
working tree that hasn't been pushed yet** (see "Pending in working tree"
below).

### Committed and deployed

- **Tipiṭaka / Commentaries / Extra-canonical / Library** — four corpus
  views as typeset frontmatters in the sidebar.
- **Library tab** — 386 ATI articles (study guides, author essays, Thai
  forest, PTF, non-canon, glossary, curated indexes) browseable + readable
  at `/library/<slug>`. BGE-M3 embeddings populated; Meaning-mode search
  works against `articles.embedding`.
- **Concordance tab** (was "Compare") — KWIC + companion words +
  per-piṭaka frequency bars.
- **Search** — Exact / Stem / Meaning modes; scopes All / Title /
  Original / Translation / Citation / Library. Title hidden under
  Meaning (doesn't compose). Diacritics row only when search input
  focused. Click results to open in reader. "Also matched via" filtered
  to aliases that actually contributed.
- **In-passage find** — bar in the reader with live match-count + inline
  highlight. Stem toggle (sati → satiyā / satimā via paliStem). Pali
  diacritics row appears when find input focused.
- **Mobile** — slide-in panel from MENU button (was SETTINGS) replaces
  TabBar. Per-corpus single-column layouts with chip selectors
  (Vinaya/Sutta/Abhidhamma). Pali/English column selector in reader.
- **Reader features** — bookmarks (localStorage), citation copy,
  pin-to-top, reading mode, interlinear DPD gloss tooltips on hover.
- **SuttaCentral parallels** — 30,741 rows from sc-data/parallels.json.
  In-corpus targets clickable; external Sanskrit/Chinese/Gāndhārī
  rendered as plain text. "Pin" affordance on each parallel for
  side-by-side comparison via the existing pinned-passage UI.
- **CST mūla banner** — accurate now: detects volume-header uddāna
  passages (cst-…m.mul-{nikaya}N, no underscore, short body) and
  explains "this is the closing uddāna, not the suttas themselves"
  with a working "browse the nikāya →" link.
- **Tags tab** (`/tags`) — three-tier drill from type → value → passages.
  Sourced from ATI's curated indexes (3,547 tags across 4 types: name,
  subject, simile, number). Each value lists passages with click-through
  to reader. Hash deep-links: `/tags/simile/Elephant`.
- **Multi-translator coverage** — 1,139 ATI translations alongside
  5,113 Sujato; chip switcher in reader with CC BY-NC 4.0 attribution.
- **Monier-Williams Sanskrit-English dictionary** — 193,890 entries.
  Surfaces via `?language=san`. SOURCE_LABEL added to dictHtml.
- **CLAUDE.md** updated to reflect the full deployed state.

### Pending in working tree (NOT YET COMMITTED)

These are the uncommitted modifications from the parallel streams.
**Either commit them or hand off to whoever owns each.**

| File | Owner | Purpose |
|---|---|---|
| `ATI_EMAIL_DRAFT.md` | Stream 4 (outreach) | Refined letter to BCBS |
| `SUTTACENTRAL_EMAIL_DRAFT.md` (new) | Stream 4 | Email to SuttaCentral about parallels mirror |
| `CLAUDE.md` | various | More state-of-handoff edits |
| `DICTIONARIES.md` | Stream 2 (BHS) | Updated dictionary roadmap |
| `server/src/dictionary.js` | Stream 2 | Added `'bhs'` to default sources |
| `src/dictHtml.js` | Stream 2 | Added BHS to `SOURCE_LABEL` |
| `scripts/ingest/ingest-bhs.mjs` (new) | Stream 2 | BHS ingest script |
| `server/src/corpus.js` | Stream 5 (data integrity) | Hides uddāna passages from `/api/corpus` |
| `scripts/ingest/ingest-ati-indexes.mjs` | Stream 5 | Extended parser for `index-title.html` |
| `scripts/ingest/audit-short-passages.mjs` (new) | Stream 5 | Audits zero-content passages |
| `scripts/ingest/short-passages-audit.md` (new) | Stream 5 | Audit report |
| `server/src/index.js` | Stream 3 (search refinements) | Probably new endpoint or filter |
| `server/src/search.js` | Stream 3 | Sentence snippets / piṭaka filter / pagination |

**Live verification I just did**:
- `/api/dbcheck` → 25,986 passages, 10 tables, pgvector true ✓
- `/api/lookup?term=bodhisattva&language=san` → 2 entries, sources `{mw, bhs}` — **BHS is already live in prod** (Stream 2 ingested + deployed even though their code isn't committed locally yet)

Most likely the streams ingested their data via the flyctl proxy
(touching prod DB directly) before committing the code that wires it up.
That's why the prod data shows BHS but the local repo doesn't yet have
the BHS code committed.

---

## Open backlog (priority order)

### Immediate (one-shot, low risk)

1. **Commit the pending work above.** Read each modified file, group by
   stream, commit with clear messages per stream, push, deploy. Check
   each diff is contained to one stream's intended scope.
2. **Delete `src/TabBar.jsx`** — no longer mounted anywhere, dead code.
3. **Move `corpus_dump.json`, `sc_parallels.json`, `DevDhamma.cache_corpus.json`, `sc_relationships.json` out of repo root** — they're debug artifacts that shouldn't be in `git status`. Add to `.gitignore`.

### Polish + cleanup (small, contained)

4. **Mobile reader icon overflow** — 7 icons (bookmark, cite, pin, eye,
   gloss, fullscreen, SC↗) wrap awkwardly on narrow viewports. Collapse
   into a "…" menu when isNarrow.
5. **Backfill `display_order`** in the `works` table — currently all 0,
   causes alphabetical fallback ordering (AN, DN, KN, MN, SN instead of
   canonical DN MN SN AN KN). One-shot SQL via flyctl proxy.
6. **Improve uddāna handling** — Stream 5 hid them from `/api/corpus`
   already. Audit whether they should also be deleted entirely or just
   hidden. Decision needed in CLAUDE.md.

### Bigger features (each is its own session)

7. **Bhikkhu Bodhi commentary translations** — if a translation source
   exists, ingest as additional translations under existing aṭṭhakathā
   passage IDs. Would dramatically lift the 2.3% CST translation
   coverage.
8. **Critical Pali Dictionary (CPD)** — next dictionary in
   DICTIONARIES.md roadmap after BHS.
9. **Split-pane parallel reader** — true side-by-side compare of two
   passages (DN 22 ↔ MN 10). Today's pin-based workaround is
   acceptable but cramped.
10. **Sentence-level snippet upgrade** — see `snippet-sentence-upgrade`
    memory note. Server-side. Stream 3 may have started this.
11. **Random sutta** — sidebar entry under Tools that picks a random
    passage and opens the reader.
12. **`@xenova/transformers` v2 → v3 migration** — see `xenova-v2-pinned`
    memory note. Needs corpus re-embed; do it as one big session.

### Outreach / launch

13. **Send the ATI email** (`ATI_EMAIL_DRAFT.md`) — content is good,
    just needs human-author sign-off.
14. **Send the SuttaCentral email** (`SUTTACENTRAL_EMAIL_DRAFT.md`).
15. **Make GitHub repo public** — one-line: `gh repo edit Keenan-ux/dhamma --visibility public`.
16. **Write public-facing README.md** before flipping to public — the
    existing CLAUDE.md is internal context, not a project pitch.
17. **Add `CONTRIBUTING.md`** — what kinds of PRs are welcome, dev
    setup, what to do/not do.
18. **Announce on Reddit/DhammaWheel/Buddhist-Studies mailing lists**
    after the above lands.

---

## Architecture quick-reference

### Frontend
```
src/
  Dhamma.jsx              — top-level router (hash-based)
  TopNav.jsx              — header + MENU slide-in panel
  Sidebar.jsx             — desktop sidebar (Corpus + Tools groups)
  CanonMapView.jsx        — Tipiṭaka frontmatter (three-column or chip-mobile)
  CommentaryView.jsx      — Aṭṭhakathā + Ṭīkā frontmatter
  ExtraCanonicalView.jsx  — Anya frontmatter
  LibraryView.jsx         — ATI library browse + article reader
  TagsView.jsx            — curated tag drill-down (NEW this session)
  BookmarksView.jsx       — local-only bookmark list
  SearchView.jsx          — Exact/Stem/Meaning + scopes
  CompareView.jsx         — Concordance (KWIC + companion words)
  DictionaryView.jsx      — selection-popover host + standalone lookup
  BrowseView.jsx          — column drill-down + ReadingPanel
  PassageCard.jsx         — search/concordance result tile
  SelectionActions.jsx    — selection popover (Search/Compare/Copy/Dict)
  api.js                  — fetch helpers (passageX, libraryX, tagsX, glossApi…)
  useCorpus.js, usePassage.js, useSearch.js, useCompareStats.js
  useBookmarks.js         — localStorage hook
  useIsNarrow.js          — viewport-width hook (breakpoint 880)
  paliStem.js             — heuristic stripper for stem matching
  parseQuery.js, searchHistory.js
  citationFormat.js       — PTS-ish citation builder
  dictHtml.js             — HTML preparers + SOURCE_LABEL
  theme.css               — only --bc-* tokens; light + dark
```

### Server
```
server/src/
  index.js     — Hono routes
  db.js        — postgres connection + applySchema on boot
  corpus.js    — /api/corpus tree + getPassage(s)
  search.js    — /api/search (FTS + vector + RRF)
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
- `traditions`, `works`, `passages` (the canon)
- `dictionary_entries` + `dictionary_inflections` (4 sources: DPD, DPPN, PED, MW; BHS landing)
- `translations` (Sujato + ATI multi-translator)
- `articles` (ATI Library, 386 rows, with embedding HNSW)
- `passage_parallels` (30,741 SC parallels)
- `passage_tags` (3,547 ATI-indexed tags)
- `aliases` (cross-canon term equivalents)

### Endpoints
- `/api/corpus`, `/api/passage/:id`, `/api/passages?ids=`
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
- **Ingest scripts run from**: `scripts/ingest/`, using `DATABASE_URL` env var pointing at the local proxy (`ssl: false` in postgres-js options because traffic goes through flyctl's loopback re-encrypt)

---

## Project rules (don't violate)

- **No Tailwind.** Inline styles using `var(--bc-*)` tokens only.
- **No analytics, telemetry, geolocation.**
- **No LLM at runtime by default.** Future opt-in "Synthesize" button OK
  but explicitly labeled AI-generated, off until earned.
- **Academic typesetting** — Noto Serif body, small-caps section labels,
  thin gold rules, generous whitespace. Pannyavaro/CST gravitas, not
  marketing.
- **CC BY-NC 4.0 honored** — every ATI-sourced rendering must show the
  copyright + license + source link in its footer. Non-commercial is
  the constraint; document it in any commercial pitch.
- **Pin model & DB versions** — BGE-M3 only works against BGE-M3
  vectors. Don't switch models without a full re-embed.

---

## Memory notes worth re-reading

Located at `~/.claude/projects/C--Dev-Dhamma/memory/`:
- `fly-memory-requirement.md` — 4 GB or BGE-M3 OOMs
- `xenova-v2-pinned.md` — v3 upgrade deferred until next re-embed
- `snippet-sentence-upgrade.md` — search-result snippet improvement deferred
- `cst-tipitaka-source.md` — VRI CST XML peculiarities
- `never-suggest-stopping.md` — bias toward forward motion

---

## How to start the next chat

```
Read C:\Dev\Dhamma\HANDOFF.md and C:\Dev\Dhamma\CLAUDE.md. The previous
session's chat is at context limit. The deployed state is good — verify
with `curl -s https://dhamma.fly.dev/api/dbcheck` and check the four
corpus views + Tags + Library + Concordance pages render.

There are uncommitted changes from parallel streams in the working tree;
audit `git status` and decide per-file whether to commit, revert, or
leave for the originating stream. After that, pick from HANDOFF.md's
backlog — items 1–3 are immediate one-shots, 4–6 are small polish, 7–12
are bigger features that each merit their own session.
```
