# Dhamma Data

Standalone scholarly tool for querying Buddhist canonical texts across traditions. Deployed at **https://dhamma.fly.dev/**. Open-source intent. Audience is comparative-Buddhist-studies researchers and serious old students.

Match an academic tone: quiet, typeset, no marketing copy, no AI summary unless the scholar opts in.

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
