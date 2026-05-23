# Dhamma Data

Standalone scholarly tool for querying Buddhist canonical texts across traditions. Deployed at **https://dhamma.fly.dev/**. Audience is comparative-Buddhist-studies researchers and serious old students.

Match an academic tone: quiet, typeset, no marketing copy, no AI summary unless the scholar opts in.

---

## ⚡ State as of last handoff — READ THIS FIRST

**Live at https://dhamma.fly.dev/** with the full canonical + commentary
corpus, three Pali dictionaries plus Monier-Williams Sanskrit-English
and Edgerton Buddhist Hybrid Sanskrit, multi-translator English
coverage, SuttaCentral parallels, and an ATI Library tab. Most
"core scope" work is now landed — see the backlog further down for
what's open.

**What's live as of this handoff:**
- **Pali corpus: ~191,000 passages** across the live Theravāda canon
  - **Major shift this session**: CST Aṭṭhakathā + Ṭīkā subdivided from
    sutta-level rows to paragraph-level rows (per-`<p>` granularity).
    The 8,579 monolithic commentary rows became 173,684 paragraph-row
    siblings — same content, 20x more retrievable units. Each fine row
    is now ~300-500 chars (vs 100-200 KB monoliths before), with its
    own focused BGE-M3 vector and FTS index entry.
  - Tipiṭaka (mula passages, unchanged): 14,377 / ~5,000 translated.
    Sutta 6,367, Vinaya 480, Abhidhamma 7,530.
  - Commentary (Aṭṭhakathā fine): ~93,000 paragraph rows across
    Visuddhimagga (subdivided this session), Samantapāsādikā,
    Sumaṅgalavilāsinī, Papañcasūdanī, Sāratthappakāsinī,
    Manorathapūraṇī, Atthasālinī, Pañcappakaraṇa-aṭṭhakathā,
    Khuddaka commentaries.
  - Sub-commentary (Ṭīkā fine): ~78,000 paragraph rows — DN/MN/SN/AN/Vism/
    Abh/Vinaya ṭīkā.
  - Extra-canonical (Anya): 3,030 passages across 64 CST works (unchanged).
- Hybrid FTS+vector search with HNSW, alias-OR expansion, prefix-stem
  matching, ts_headline snippets, stem-aware highlighting
- Five dictionaries, plus selection-popover wired into every reader:
  - **DPD** — 88,933 headwords + 727,678 inflections (`sampajāno` → `sampajāna`)
  - **DPPN** — 13,603 proper-name entries (Malalasekera 1937 rev. 2025)
  - **PED** — 15,702 entries (Rhys Davids & Stede 1921-25, CC BY-NC 3.0)
  - **MW** — 193,890 Sanskrit-English entries (Monier-Williams 1899,
    Cologne digitization; `language='san'`, source='mw'). First
    non-Pali source — surfaces only when `?language=san` is passed.
  - **BHS** — 17,839 Buddhist Hybrid Sanskrit entries (Edgerton 1953,
    Cologne digitization; `language='san'`, source='bhs'). Companion
    to MW for transitional Mahāyāna-sūtra Skt; same `?language=san`
    gating.
- **Multi-translator English coverage**:
  - 5,113 Sujato translations (SuttaCentral)
  - 1,139 ATI translations across ~15 translators (Thanissaro, Walshe,
    Nyanaponika, Bodhi extracts, Ireland, Olendzki, Piyadassi, Ñāṇamoli,
    Soma, Buddharakkhita, …); translator chip switcher + CC BY-NC 4.0
    attribution in the reader
- **SuttaCentral parallels** (30,741 rows from sc-data/parallels.json):
  in-corpus targets render as clickable links in the reader; external
  Sanskrit / Chinese / Gāndhārī parallels render as plain text
- **ATI Library** — 386 articles ingested across study guides, author
  essays, Thai forest tradition, Path to Freedom, non-canon, glossary;
  Library sidebar tab with category nav + article reader at /library/:slug
- **Frontmatter UI**: Tipiṭaka / Commentaries / Extra-canonical / Library
  each get their own typeset frontmatter page. Browse-tab leaf-drill
  still works as the click-through target.
- **Concordance** (was Compare): frequency-by-piṭaka bars + KWIC + companion
  words. /concordance/<term>.
- **Search** modes Exact / Stem / Meaning. Scopes All / Title / Original
  / Translation / Citation / Library. Title-aware search finds suttas
  by name (e.g. "Satipaṭṭhāna" → DN 22, MN 10).
- **In-passage find** bar with live match-count + inline highlight.

### Verify current state

```bash
curl -s https://dhamma.fly.dev/api/dbcheck
# expect: passages: ~191000, tables: 12, pgvector: true
```

Dictionaries — try
`curl -s "https://dhamma.fly.dev/api/lookup?term=dhamma"`;
expect entries from `dpd` + `dppn` + `ped` with `matched_via: 'headword'`.
For the Sanskrit (MW) side: `curl -s "https://dhamma.fly.dev/api/lookup?term=dharma&language=san"`
should return MW entries (`source: 'mw'`).

Library — try
`curl -s "https://dhamma.fly.dev/api/library"`;
expect `byCategory` with `author-essay: 277, thai: 73, ptf: 17,
study-guide: 16, noncanon: 2, glossary: 1`.

### Fly infrastructure

- `dhamma` app: **shared-cpu-2x, 4 GB RAM**, auto-stop. DO NOT lower
  memory_mb under 4096 — see [fly-memory-requirement memory note](../../Users/isaac/.claude/projects/C--Dev-Dhamma/memory/fly-memory-requirement.md).
- `dhamma-pg` app: shared-cpu-1x, 256 MB, always-on, **15 GB volume**
  (extended from 5 GB → 15 GB during the per-`<p>` subdivision ingest
  when disk hit 100% on the original 5 GB at ~150K fine rows).
- HNSW index on `passages.embedding`. Grows incrementally.
- Cold-start: ~**101 s** for the first `/api/search?mode=meaning` per
  wake (BGE-M3 ONNX load). Subsequent queries 500–2000 ms.

### Useful background processes still potentially alive

- `flyctl proxy 15432 --app dhamma-pg` (local Postgres proxy) — needed for
  any further local-to-prod-DB work.
  - Check: `Get-NetTCPConnection -LocalPort 15432 -ErrorAction SilentlyContinue`

### CST mūla volume-header passages (uddāna mnemonics)

25 CST rows match `^cst-[a-z0-9]+m\.mul-(dn|mn|sn|an|kn)\d+$` (no
underscore suffix) — one per nikāya volume, `position=1`, titled with
the volume name (e.g. "Sīlakkhandhavaggapāḷi", citation "DN vol.1").
Their `original` text is the closing colophon + uddāna mnemonic verse
that ends the volume in the printed CST. The actual canonical material
lives in the underscore-suffix sibling rows (`…-dn1_1`, `…-dn1_2`, …).

**Decision: hide from `/api/corpus`, keep the rows.** `runCorpus` in
[server/src/corpus.js](server/src/corpus.js) excludes IDs matching that
regex from both the per-work passage list and the passage_count
subquery, so they no longer clutter the browse tree. They remain
reachable via `/api/passage/:id` and via search (the uddāna verses are
real Pali content). The frontend's `collectLeaves` filter in
[src/BrowseView.jsx](src/BrowseView.jsx) already skipped them for
prev/next nav, so the user-visible result is consistent.

We did not delete the rows — re-running `ingest-cst.mjs` would just
re-insert them, and the content is genuine canonical paratext. If a
future side-by-side viewer wants to surface them, just remove the
filter clauses.

### Open backlog

Most of the previously-listed open items shipped. What remains:

- **ATI Library curated indexes** — the 7 `index-*.html` files (similes,
  names, subjects, titles, number, author, sutta) are tagging metadata,
  not standalone articles. TIER_ATI §7 calls for `passage_tags(passage_id,
  tag_type, tag_value)` keyed off these indexes + a tag-filter UI in
  Browse. Designed, not built.
- **Library Meaning-mode search** — `articles.embedding` column exists
  but isn't populated; library search falls back to FTS until embed pass
  runs. Same BGE-M3 pipeline as passages.
- **Side-by-side parallel passage viewer** — open two passages in
  adjacent panes for textual comparison (DN 22 ↔ MN 10). High-value for
  scholarly comparative work, designed but not built.
- **Per-passage bookmarks** — localStorage-only "mark this passage" with
  a Bookmarks tab.
- **Interlinear gloss** — render each Pali word with a small English
  gloss above/below using DPD inflections. Possible without AI.
- **Citation export** — one-click "copy PTS-format citation" on each
  passage card. `citationFormat.js` exists; needs UI hook.
- **Dictionary expansion** — DPPN + PED + MW + BHS done (MW + BHS are
  the Sanskrit pair: 193,890 classical + 17,839 Buddhist Hybrid
  entries from the Cologne digitization, queryable via `?language=san`).
  Next per the roadmap in [DICTIONARIES.md](DICTIONARIES.md): CPD,
  then Buddhadatta.
- **Sentence-level snippet upgrade** ([snippet-sentence-upgrade memory note](C:/Users/isaac/.claude/projects/C--Dev-Dhamma/memory/snippet-sentence-upgrade.md))
- **v3 migration from `@xenova/transformers` v2** ([xenova-v2-pinned memory note](C:/Users/isaac/.claude/projects/C--Dev-Dhamma/memory/xenova-v2-pinned.md))
  — best done with a corpus re-embed
- **Citation formatting for Vinaya IDs** — current display is
  `PLI-TV-BI-VB-PJ1-4`. Cleaner would be `Bhi. Pj. 1-4`; needs a
  per-source mapping table
- **Email Access to Insight** announcing the mirror once everything's
  ingested and displaying nicely. Send to BCBS; ATI is winding down due
  to maintainer attrition and they may want to know we're preserving
  their corpus per CC BY-NC 4.0.

---

## Stack

- **Frontend** — Vite + React 18, inline styles with `--bc-*` theme tokens (light + dark only)
- **Server** — Hono on Node, single container on Fly serves SPA + `/api/*` same-origin
- **Phase 2** — Postgres + pgvector as sibling Fly app at `dhamma-pg.flycast`, BGE-M3 embeddings running locally for multilingual semantic search

## Layout

```
src/                  frontend
  main.jsx · Dhamma.jsx · TopNav.jsx · ThemeToggle.jsx · TabBar.jsx · Sidebar.jsx
  BrowseView.jsx · SearchView.jsx · CompareView.jsx · PassageCard.jsx · Leaf.jsx
  analyze.js · paliStem.js · parseQuery.js · searchHistory.js · useIsNarrow.js · theme.css
  api.js · useCorpus.js · usePassage.js · useSearch.js · useCompareStats.js
  data/corpus.js                     (helpers only; tree fetched from /api/corpus)

public/               manifest, sw, icon — root-scoped
server/
  src/                index.js · db.js · embed.js · aliases.js · search.js · corpus.js · compareStats.js · dictionary.js · paliStem.js
  sql/                schema.sql · seed-aliases.sql · seed-stubs.sql
  scripts/            cache-model.mjs · embed-smoke.mjs · api-smoke.mjs · create-hnsw-index.mjs

scripts/ingest/       ingest pipelines (run locally, write to dhamma-pg via proxy)
  ingest.mjs          Pali Tipiṭaka (SuttaCentral bilara-data)
  ingest-dpd.mjs      DPD dictionary headwords (TSV backups)
  ingest-dpd-inflections.mjs  DPD inflection lookup table (from released SQLite)
  ingest-dpd-missing.mjs      DPD headwords w/o meaning_1 (cross-refs)
  format-citation.mjs · diagnose-skipped.mjs · migrate-citations.mjs · etc.

TIER_C.md             plan for the next major build (CST commentary ingest)
Dockerfile · fly.toml
```

## Search modes (production)

| Mode | Backend |
|---|---|
| **Exact** | `to_tsquery` + FTS on `fts_doc` (or per-field tsvector when scope ≠ All). No alias expansion. |
| **Stem** | FTS with OR-expanded aliases (`sati \| smṛti \| 念`). Aliases live in the `aliases` table, seeded from `seed-aliases.sql`. |
| **Meaning** | FTS (alias-expanded) + vector ANN over `embedding vector(1024)` via HNSW index, reciprocal-rank-fused at k=60. Vector embeddings produced server-side by `server/src/embed.js` using the same BGE-M3 model/params as ingest. |

The `aliases` table (sati ↔ smṛti ↔ 念, dhamma ↔ dharma ↔ 法, etc.) is the scholar-asserted authority overlay that vector distance approximates — **it stays even though vectors work**, because cross-canon term equivalence is a curated fact, not an inferred similarity.

## Hard rules

- **No Tailwind.** Inline styles with `var(--bc-*)` only. Never hardcode hex.
- **No analytics / telemetry / geolocation.** The tool finds; the scholar interprets.
- **No LLM synthesis by default.** A future opt-in `✨ Synthesize` button can call an external LLM over curated passages with the result labeled AI-generated. Off until earned.
- **Academic typesetting.** Serif body (Noto Serif), small-caps section labels, thin gold rules — no card chrome.
- **Pin model & DB versions.** Embeddings produced by BGE-M3 only work against vectors produced by BGE-M3. Don't switch models mid-corpus without a re-embed pass.

## Phase 2 deploy plan

1. Build a second Fly app `dhamma-pg` running `pgvector/pgvector:pg16` with a mounted volume
2. Create `pgvector` extension on first connect
3. Set `DATABASE_URL=postgres://...@dhamma-pg.flycast:5432/dhamma` as a Fly secret on the main `dhamma` app
4. Ingest pipeline: SuttaCentral JSON → chunk → embed (BGE-M3 local) → INSERT into Postgres
5. Server endpoints: `/api/corpus`, `/api/passage/:id`, `/api/search`, `/api/compare`
6. Frontend swaps `data/` imports for fetches

See HACKING.md for the full endpoint list and conventions.

## Notes for the next session

- Cabinet (`C:\Dev\Cabinet`) — `apps/dhamma/` and `public/apps/dhamma/` deleted at Cabinet@d7ae5c9. The launcher no longer ships this app.
- GitHub: `Keenan-ux/dhamma` (private; staying private — do not propose a public flip).
- Sibling project: `C:\Dev\DhammaWorld` — different app (Vipassana group sittings map), unrelated codebase.
- A second collaborator joins eventually — HACKING.md is the briefing doc for them.
