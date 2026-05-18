# Dhamma Data

Standalone scholarly tool for querying Buddhist canonical texts across traditions. Deployed at **https://dhamma.fly.dev/**. Open-source intent. Audience is comparative-Buddhist-studies researchers and serious old students.

Match an academic tone: quiet, typeset, no marketing copy, no AI summary unless the scholar opts in.

---

## ⚡ State as of last handoff — READ THIS FIRST

**Phase 2 deployed at https://dhamma.fly.dev/.** Full stack live: Pali corpus
ingested, server-side BGE-M3 embeddings, hybrid FTS+vector search, all four
React views fetching `/api/*` instead of mock data. Cabinet `apps/dhamma/`
deleted. The app is functional end-to-end.

### Verify current state

```bash
curl -s https://dhamma.fly.dev/api/dbcheck
# expect: passages: 5161 (will tick to 5764 once the in-flight tha-ap +
# thi-ap re-ingest completes — see "in flight" below)
```

### Phase 2 progress — all shipped

| # | Step | Commit |
|---|---|---|
| 1 | dhamma-pg Fly app with pgvector | b9a7120 |
| 2 | Ingest pipeline (SuttaCentral + BGE-M3) | 79ac976 |
| 3 | Full Pali Tipiṭaka ingest (5,161 / 5,764) | (data) |
| 4 | BGE-M3 server-side query embeddings + protobufjs CVE override | be3e89b |
| 5 | `/api/search` + `/api/corpus` + `/api/passage/:id` + `/api/compare` + `/api/compare-stats` | e5e419d, 0c3d01c |
| 6 | Frontend swap to `fetch('/api/...')` + hooks (useCorpus, usePassage, useSearch, useCompareStats) | 0c3d01c |
| 7 | Cabinet `apps/dhamma/` deleted (Cabinet@d7ae5c9) | (Cabinet repo) |

### Fly infrastructure

- `dhamma` app: **shared-cpu-2x, 4 GB RAM**, auto-stop. The 2 GB I initially
  picked was OOM-killed at 1.9 GB RSS on the first /api/search?mode=meaning —
  see [fly-memory-requirement memory note](../../Users/isaac/.claude/projects/C--Dev-Dhamma/memory/fly-memory-requirement.md). DO NOT lower memory_mb under 4096.
- `dhamma-pg` app: shared-cpu-1x, 256 MB, always-on, 1 GB volume.
- HNSW index built on `passages.embedding` (2.7s on 5,161 vectors).
- Cold-start cost: ~**101 s** for the first /api/search?mode=meaning per
  machine wake (BGE-M3 ONNX load on shared CPU). Subsequent meaning queries
  are 500–2000 ms. Set `min_machines_running=1` if cold-start annoys.

### In flight at handoff

Two background ingest processes re-running for the 603 files originally
skipped by the parseId regex (all Apadāna texts with `tha-ap` / `thi-ap`
hyphenated canon prefixes that the regex didn't match):

```
# tha-ap (Therā-apadāna, 563 files) — should be done in ~5 min from start
# thi-ap (Therī-apadāna, 40 files)  — ~25 s after model loads
```

The fixed regex is committed as 11c9dd9; the targeted re-ingest commands
were `node ingest.mjs --canon=kn/tha-ap` and `--canon=kn/thi-ap`. After
both finish, `/api/dbcheck` should report `passages: 5764`. Log files:
`scripts/ingest/ingest-tha-ap.log` and `ingest-thi-ap.log`.

### Useful background processes still potentially alive

- `flyctl proxy 15432 --app dhamma-pg` (the local Postgres proxy) —
  needed for any further local-to-prod-DB work.
  - Check: `powershell -c "Get-NetTCPConnection -LocalPort 15432 -ErrorAction SilentlyContinue"`

### Corpus expansion landscape

Three tiers of source acquisition, ordered by friction:

**Tier A — already on disk, just enable** (in flight at last handoff):

bilara-data has the full Pali Tipiṭaka under `root/pli/ms/{sutta,vinaya,abhidhamma}/`. The original `findPaliSuttas` walked only `sutta/`. Patched in commit `1cb07f5` to walk all three. Running two background ingests now:
- `node ingest.mjs --basket=vinaya`     (422 files, ~1.4 hrs at observed rate)
- `node ingest.mjs --basket=abhidhamma` (1,102 files, ~3-4 hrs)
After both: DB lands at ~7,288 passages (5,764 + 1,524). Browse view's
`pli-vinaya` and `pli-abhidhamma` works flip from "no children rendered"
to "1,102 / 422 leaves below them."

**Tier B — bilara has non-Pali source samples, modest scope:**

| Lang | Files | Notes |
|---|---|---|
| `lzh` (Literary Chinese) | 133 | SuttaCentral's curated Āgama samples (ma=Madhyama, sa=Saṃyukta, ea=Ekottarika, sg). Sparse — not full Taishō. |
| `san` (Sanskrit) | 2 | Negligible. |
| `pra` (Prakrit) | 22 | Gandhāran fragments etc. |
| `en` (English originals) | 53 | Native English compositions, not translations. |
| `misc` | 158 | Catchall. |

Tier B would flip the Mahāyāna stub branch's `taisho-ma` and `taisho-sa` works to live with sample data. Useful proof-of-concept for cross-canon vector search; not a comprehensive Mahāyāna corpus.

**Surprise during the corpus inventory:** most "adjacent" Theravāda works are
already in the live DB under `pli-kn` because SuttaCentral classifies them
under Khuddaka Nikāya. From `scripts/ingest/survey-corpus.mjs`:

| Already in `pli-kn` | n |
|---|---|
| Jātaka (`ja`) | 547 |
| Theragāthā (`thag`) | 264 |
| **Milindapañha (`mil`)** | 248 |
| Itivuttaka (`iti`) | 112 |
| Vimānavatthu (`vv`) | 85 |
| Udāna (`ud`) | 80 |
| Therīgāthā (`thig`) | 73 |
| Sutta Nipāta (`snp`) | 73 |
| Petavatthu (`pv`) | 51 |
| **Nettippakaraṇa (`ne`)** | 37 |
| Cariyāpiṭaka (`cp`) | 35 |
| Paṭisambhidāmagga (`ps`) | 31 |
| Buddhavaṃsa (`bv`) | 29 |
| Dhammapada (`dhp`) | 26 |
| Cūḷaniddesa / Mahāniddesa (`cnd`/`mnd`) | 23 + 16 |
| Khuddakapātha (`kp`) | 9 |
| Apadāna (`tha-ap` + `thi-ap`) | 603 |
| **Peṭakopadesa (`pe`)** | 9 |

**Real Tier C — external sources still required:**

| Target | Best source | Format | Effort |
|---|---|---|---|
| **Aṭṭhakathā commentaries** | VRI/CST (tipitaka.org) | XML | adapter + parser. Largest scholarly value still missing. |
| **Visuddhimagga** | VRI/CST or Ñāṇamoli digital tx | varies | medium adapter |
| **Vimuttimagga** | scattered scholarly editions | varies | small adapter once a source is identified |
| **Sub-commentaries (Ṭīkā)** | VRI/CST | XML | parallel to commentary adapter |
| **Mahāvaṃsa, Dīpavaṃsa** (historical chronicles) | VRI/CST or PTS | varies | small adapter |
| Full Taishō (real Mahāyāna) | CBETA | TEI XML | substantial — large corpus, different schema |
| Tibetan canon (Kangyur/Tengyur) | 84000.co | TEI XML | future |
| Sanskrit Mahāyāna sūtras | GRETIL | varies | future |

Each tier-C source needs its own ingest adapter (parallel to `scripts/ingest/ingest.mjs`) plus an entry in `seed-stubs.sql` flipping the relevant stub work to live. **Cross-source vector comparability** holds as long as BGE-M3 stays pinned with the same params — see [xenova-v2-pinned memory](C:/Users/isaac/.claude/projects/C--Dev-Dhamma/memory/xenova-v2-pinned.md).

### Other open items

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
  src/                index.js · db.js · embed.js · aliases.js · search.js · corpus.js · compareStats.js
  sql/                schema.sql · seed-aliases.sql · seed-stubs.sql
  scripts/            cache-model.mjs · embed-smoke.mjs · api-smoke.mjs · create-hnsw-index.mjs
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
