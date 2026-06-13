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

**Latest (2026-06-05, deployed + pushed @ origin/master 36b23b8):** three
scholar features shipped on top of the above, plus a wave of audit / a11y /
LIKE-injection / corpus-resilience fixes —
1. **Sutta → commentary jump.** The reader links a mūla sutta to its CST
   Aṭṭhakathā + Ṭīkā (`/api/passage/:id/commentary`); DN + CST-ids by a
   shared locator key, MN/SN/AN SuttaCentral-ids by a title-bridge to the
   `…vaṇṇanā` section.
2. **Pāli → Sanskrit cognate cross-link.** A Pāli dictionary lookup surfaces
   cognates (dhamma → dharma · 法); the Skt chip jumps to Monier-Williams +
   Edgerton BHS via `?language=san`.
3. **English-side Meaning snippets.** The `field='translation'` sentence half
   is embedded (221,073 rows); vector-only Meaning hits now show the closest
   English sentence (Pāli for untranslated commentary).
**BACKLOG.md is the source of truth** for what landed and the open queue (the
open items are under "Bodhi stress-test deferrals" + the audit deferrals).

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
# expect: passages: 194710, tables: 14, pgvector: true, postgres 16.14
```

Dictionaries — try
`curl -s "https://dhamma.fly.dev/api/lookup?term=dhamma"`;
expect entries from `dpd` + `dppn` + `ped` with `matched_via: 'headword'`,
plus `cognates: [{dharma, latin}, {法, cjk}]` (the cross-canon cross-link).
For the Sanskrit (MW) side: `curl -s "https://dhamma.fly.dev/api/lookup?term=dharma&language=san"`
should return MW + BHS entries (`source: 'mw'`/`'bhs'`).

Sutta → commentary jump — try
`curl -s "https://dhamma.fly.dev/api/passage/mn10/commentary"`; expect
non-empty `attha` + `tika`, the attha entry titled
"10. Satipaṭṭhānasuttavaṇṇanā" (Ps-a 1 §958). `dn1` / `sn12.1` / `an3.61`
also resolve.

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

- `flyctl proxy 15432:5432 --app dhamma-pg` (local Postgres proxy) — needed
  for any further local-to-prod-DB work. NOTE the explicit `:5432` — Postgres
  on dhamma-pg listens on 5432, so the bare `flyctl proxy 15432` form (which
  maps local 15432 → remote **15432**) connects to nothing and the first query
  dies with ECONNRESET. Always use `15432:5432`.
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

[BACKLOG.md](BACKLOG.md) is the current source of truth for the open
queue. The summary below tracks it; if the two ever diverge, trust
BACKLOG.md and the live DB.

Most of the previously-listed open items shipped. **Landed since the
last CLAUDE.md refresh** (do NOT re-open these): ATI curated-index
tagging into `passage_tags` (audience, name, title, subject, simile,
number) + the Browse tag-filter chips; the audience facet; Library
Meaning-mode search (`articles.embedding` fully populated, 407/407);
the side-by-side parallel passage reader; per-passage bookmarks; the
citation-export button; per-passage notes; the blurb retrieval lane
(`vec_blurb`, the 4th RRF lane); the Docs section (the `DocsView` +
Sidebar entry ship, though no docs are authored yet); and Vinaya
citation formatting (`PLI-TV-BI-VB-PJ1-4` → clean form). The metta /
primary-text recall gap is also resolved (the mettā↔loving-kindness
alias fires and `snp1.8` carries the primary-text boost; the
BLURB_WEIGHT 2.5→1.0 tune surfaced it).

**Reconciled 2026-06-08 (do NOT re-open — verified against live code/DB):**
the three items this section used to list as open all landed.
- **Docs content — DONE.** Five docs authored + ingested (`category='docs'`):
  How search works, About the corpus, Dictionary coverage, Sources and
  licenses (2026-06-04), plus Reading the commentaries in English (the prior
  coordinator session). `scripts/ingest/ingest-docs.mjs` carries all five.
- **Interlinear gloss — DONE (2026-06-04).** Reader ⋯-menu toggle renders each
  Pāli word over its DPD gloss; `/api/gloss` + `glossWords` resolve surface →
  inflection → entry. Residual `sato`-style homograph disambiguation is the
  only open tail (needs sentence context; see BACKLOG.md "Gloss morphological
  disambiguation").
- **v3 transformers migration — DONE.** `server/package.json` is on
  `@huggingface/transformers ^3` (with the onnxruntime-node 1.17 override);
  embed.js uses the v3 `dtype` API. The library flip did NOT need a re-embed
  (only a model swap would). The `xenova-v2-pinned` memory note is superseded.

What remains genuinely open:

- **Dictionary expansion** — DPPN + PED + MW + BHS done (MW + BHS are
  the Sanskrit pair: 193,890 classical + 17,839 Buddhist Hybrid
  entries from the Cologne digitization, queryable via `?language=san`).
  Next per the roadmap in [DICTIONARIES.md](DICTIONARIES.md): CPD
  (blocked on an email reply, see `CPD_EMAIL_DRAFT.md`), then
  Buddhadatta.
- **Sentence-level snippet upgrade. LANDED + deployed 2026-06-05**
  ([snippet-sentence-upgrade memory note](C:/Users/isaac/.claude/projects/C--Dev-Dhamma/memory/snippet-sentence-upgrade.md)).
  507,777 mula sentences embedded in `passage_sentences`; vector-only
  Meaning hits now show the best-matching sentence. The `field='translation'`
  half also landed (221,073 English sentences embedded). Only the full-corpus
  scope decision remains a follow-on (see BACKLOG.md).
- **AI-assisted draft translations** — `TRANSLATIONS-AI.md` carries the
  design; gated by the "no LLM synthesis by default" rule (opt-in,
  clearly labeled AI-generated). Needs user decisions on model / UX /
  storage.
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

## Design standard

The shared, app-agnostic design cores — interaction-flow (how decisions are paced) and the measurable visual standard (type/space/color/contrast floors, tier-graded) — live in `~/.claude/standards/` and are imported here so they are always in context. They are the generalized half; Dhamma keeps its own house-style + application (the academic-typesetting hard rules below, the `--bc-*` tokens, the no-card reading aesthetic). Edit a core there and every project that imports it updates; never copy or fork a core.

@~/.claude/standards/FLOW-DESIGN.md
@~/.claude/standards/VISUAL-DESIGN.md

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
