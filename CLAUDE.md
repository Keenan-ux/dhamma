# Dhamma Data

Standalone scholarly tool for querying Buddhist canonical texts across traditions. Deployed at **https://dhamma.fly.dev/**. Open-source intent. Audience is comparative-Buddhist-studies researchers and serious old students.

Match an academic tone: quiet, typeset, no marketing copy, no AI summary unless the scholar opts in.

---

## ⚡ State as of last handoff — READ THIS FIRST

### Pali Tipiṭaka ingest: ✅ DONE

```
ingested 5161, skipped 603, 15847s wall (4h 24m)
db: passages: 5161, postgres 16.14, pgvector loaded
```

- Source: `scripts/ingest/.cache/bilara-data/root/pli/ms/sutta/`
- Embeddings: BGE-M3 dense (1024-dim) via `@xenova/transformers` (quantized ONNX, runs on CPU)
- 603 skipped suttas are bilara files whose IDs the `parseId` regex in `scripts/ingest/ingest.mjs` didn't match — likely Khuddaka edge-case names (`iti1`, `ud1.1`, composite identifiers). Patching that regex and re-running is idempotent — `ON CONFLICT (id) DO UPDATE` handles re-runs without dupes.
- Background `flyctl proxy 15432 --app dhamma-pg` from prior session may still be alive on the user's machine. Kill it if not needed:
  - Windows: `powershell -c "Get-NetTCPConnection -LocalPort 15432 -ErrorAction SilentlyContinue"`

### How to verify current state

```bash
curl -s https://dhamma.fly.dev/api/dbcheck
# expect: passages: 5161 (or higher if more ingest happened)
```

### Phase 2 progress

| # | Step | Status |
|---|---|---|
| 1 | dhamma-pg Fly app with pgvector | ✅ live |
| 2 | Ingest pipeline scaffolded (SuttaCentral + BGE-M3) | ✅ shipped |
| 3 | Full Pali Tipiṭaka ingest | ✅ 5161/5764 done |
| 4 | BGE-M3 query-time embeddings in server | 🟡 **partly landed** — `@xenova/transformers` in `server/package.json`; verify model loads on boot and produces 1024-dim vectors comparable to ingested ones |
| 5 | Server endpoints (`/api/search`, `/api/passage/:id`, `/api/corpus`, `/api/compare`) | 🟡 **partly landed** — `BrowseView.jsx` is fetching `useCorpus()` and `usePassage(id)`, implying `/api/corpus` and `/api/passage/:id` exist; verify all four are present and inspect what's still TODO |
| 6 | Frontend swap from `data/*.js` to `fetch('/api/...')` | 🟡 **partly landed** — `BrowseView` swapped; SearchView and CompareView still need swapping |
| 7 | Delete `C:\Dev\Cabinet\apps\dhamma\` | ⛔ blocked until step 6 finishes |

### Choices already made

- Step 4 went with **option A** (BGE-M3 in-process via `@xenova/transformers`), per user preference for "no extra services to log into." This means the dhamma Fly machine will need memory bumped if it hasn't been — check `fly status --app dhamma` and `fly scale memory 2048 --app dhamma` if currently below 2GB.
- `PassageCard` now supports a `snippet` field for search results — search backend returns short excerpts, not full text, on result hits.

### First moves for the next session

1. **Verify state honestly.** Run `curl https://dhamma.fly.dev/api/dbcheck` and check `git log --oneline -10` in `C:\Dev\Dhamma`. The state above reflects a snapshot; the user has been working in parallel sessions.
2. **Inventory step 4–6 progress** — read `server/src/`, `src/useCorpus.js`, `src/usePassage.js`, and `SearchView`/`CompareView` to see exactly what's wired vs what still needs work.
3. **Find the gaps** between current code and what these four endpoints need to support:
   - `/api/search?q=...&mode=exact|stem|meaning&scope=all|original|translation|citation&traditions=...` — boolean ops parsed server-side
   - `/api/passage/:id` — full passage with neighbors
   - `/api/corpus` — tree shape for Browse columns
   - `/api/compare?term=...` — frequency by tradition + KWIC + companion words
4. **Then deliver step 7** — delete the Cabinet copy and remove from `vite.config.js` + `src/registry.js`.

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
  analyze.js · paliStem.js · useIsNarrow.js · theme.css
  data/corpus.js · data/samplePassages.js

public/               manifest, sw, icon — root-scoped
server/               Hono. Phase 1: static + healthz; Phase 2: search + corpus endpoints
Dockerfile · fly.toml
```

## Phase 1 (today) vs Phase 2 (next)

**Phase 1 is live with mock data.** The UI works end-to-end against six passages featuring *sampajāna* hardcoded in `data/samplePassages.js`. Three traditions (Theravāda Pali, Sarvāstivāda parallel Chinese, Sōtō Zen Japanese). The corpus tree in `data/corpus.js` shows the full canon *shape* with stub nodes for un-ingested sections.

**Phase 2 ingests real corpora into Postgres + pgvector.** The frontend's data-access points (a handful of imports from `data/`) become `fetch('/api/...')` calls. Everything else stays.

## Search modes

| Mode | Today | Phase 2 |
|---|---|---|
| **Exact** | `String.includes` | Postgres FTS |
| **Stem** | Pali suffix stripper + ALIASES map (`paliStem.js`) | + Digital Pali Dictionary lemmas |
| **Meaning** | Falls back to Stem with banner | Real pgvector ANN + BGE-M3 local embeddings |

The ALIASES table in `paliStem.js` (sati ↔ smṛti ↔ 念, dhamma ↔ dharma ↔ 法, etc.) **stays even after vectors land** — it's the scholar-asserted authority overlay that vector distance approximates.

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

- Cabinet (`C:\Dev\Cabinet`) still has `apps/dhamma/` — kept as fallback until Phase 2 deploys cleanly. Delete then.
- GitHub: `Keenan-ux/dhamma` (private). Will flip public after Phase 2 ships.
- Sibling project: `C:\Dev\DhammaWorld` — different app (Vipassana group sittings map), unrelated codebase.
- A second collaborator joins eventually — HACKING.md is the briefing doc for them.
