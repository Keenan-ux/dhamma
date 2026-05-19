# Dhamma Data

Standalone scholarly tool for querying Buddhist canonical texts across traditions. Deployed at **https://dhamma.fly.dev/**. Open-source intent. Audience is comparative-Buddhist-studies researchers and serious old students.

Match an academic tone: quiet, typeset, no marketing copy, no AI summary unless the scholar opts in.

---

## ⚡ State as of last handoff — READ THIS FIRST

**Live at https://dhamma.fly.dev/ with corpus + search + dictionary.** Next
work is **Tier C — CST commentary ingest** with a full plan in
**[TIER_C.md](TIER_C.md)** at the repo root. Read that before anything else
if the user mentions commentaries, Aṭṭhakathā, Visuddhimagga, Ṭīkā, or
"adjacent Theravāda works". It has the implementation plan, open decisions,
and links to all relevant memory notes.

**What's live as of this handoff:**
- Pali corpus: 7,286 passages (Sutta 5,764 + Vinaya 420 + Abhidhamma 1,102)
- Hybrid FTS+vector search with HNSW, alias-OR expansion, prefix-stem
  matching, ts_headline snippets, stem-aware highlighting
- Three dictionaries integrated, wired to PassageCard's selection popover:
  - **DPD** (Digital Pali Dictionary) — 88,933 headwords + 727,678
    inflection mappings. Look up `sampajāno` → returns `sampajāna`.
  - **DPPN** (Dictionary of Pali Proper Names, Malalasekera 1937 rev.
    Ānandajoti 2025) — 13,603 entries. Look up `Sāriputta` → returns
    1 DPD lemma + 5 DPPN biographies (Sāriputta 01..05).
  - **PED** (PTS Pali-English Dictionary, Rhys Davids & Stede 1921-25,
    digitized by Buddhadust 2021, CC BY-NC 3.0) — 15,702 entries.
  - Lookup runs headword-exact across all sources first (so
    diacritic-free Pali like `sati`/`dhamma`/`buddha` finds its lemma
    instead of english-reverse). Per-source Pali cascade after that
    so `Vesāli` hits DPD via inflection AND DPPN via literal-prefix
    in the same response. UI groups results by source.
- Browse tree with full Khuddaka split (Milindapañha, Jātaka, Apadāna, etc.
  each addressable as separate sub-works)
- Vinaya citations formatted as scholarly abbreviations ("Bu Pj 1", "Vin Kd 2")
- Cabinet `apps/dhamma/` deleted (split-off complete)

### Verify current state

```bash
curl -s https://dhamma.fly.dev/api/dbcheck
# expect: passages: 7286 (full Pali Tipiṭaka — Sutta 5,764 + Vinaya 420 + Abhidhamma 1,102)
```

Dictionaries — try
`curl -s "https://dhamma.fly.dev/api/lookup?term=dhamma"`;
expect entries from all three sources (`dpd`, `dppn`, `ped`)
with `matched_via: 'headword'`.

### Fly infrastructure

- `dhamma` app: **shared-cpu-2x, 4 GB RAM**, auto-stop. DO NOT lower
  memory_mb under 4096 — see [fly-memory-requirement memory note](../../Users/isaac/.claude/projects/C--Dev-Dhamma/memory/fly-memory-requirement.md).
- `dhamma-pg` app: shared-cpu-1x, 256 MB, always-on, 1 GB volume.
- HNSW index on `passages.embedding`. Grows incrementally.
- Cold-start: ~**101 s** for the first `/api/search?mode=meaning` per
  wake (BGE-M3 ONNX load). Subsequent queries 500–2000 ms.

### Useful background processes still potentially alive

- `flyctl proxy 15432 --app dhamma-pg` (local Postgres proxy) — needed for
  any further local-to-prod-DB work.
  - Check: `Get-NetTCPConnection -LocalPort 15432 -ErrorAction SilentlyContinue`

### Next work: Tier C — see [TIER_C.md](TIER_C.md)

Full implementation plan for the Aṭṭhakathā / Ṭīkā / mūla CST corpus ingest
lives in [TIER_C.md](TIER_C.md) at the repo root. Read that before starting
any commentary work. CST data is already cloned at
`scripts/ingest/.cache/cst-test/` from the previous session.

Open decisions surfaced in TIER_C.md:
1. Mūla overlap — ingest CST mūla as a parallel edition or skip it?
2. Citation format for CST IDs — `Sv-a 1`, `Ps-a 1`, etc.?

### Other open backlog

- **Dictionary expansion** — DPPN + PED done. Monier-Williams Sanskrit-
  English is next (first non-Pali source), with full plan in
  [DICTIONARIES.md](DICTIONARIES.md). After MW: BHS, CPD, Buddhadatta.
- Sentence-level snippet upgrade ([snippet-sentence-upgrade memory note](C:/Users/isaac/.claude/projects/C--Dev-Dhamma/memory/snippet-sentence-upgrade.md))
- v3 migration from `@xenova/transformers` v2 ([xenova-v2-pinned memory note](C:/Users/isaac/.claude/projects/C--Dev-Dhamma/memory/xenova-v2-pinned.md)) — best done with a corpus re-embed
- Citation formatting for Vinaya IDs — current display is `PLI-TV-BI-VB-PJ1-4` (raw uppercased ID). Cleaner would be `Bhi. Pj. 1-4` but requires a per-source mapping table

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
- GitHub: `Keenan-ux/dhamma` (private). Phase 2 has shipped — flipping public is a one-line call (`gh repo edit ... --visibility public`).
- Sibling project: `C:\Dev\DhammaWorld` — different app (Vipassana group sittings map), unrelated codebase.
- A second collaborator joins eventually — HACKING.md is the briefing doc for them.
