# Dhamma Data

Standalone scholarly tool for querying Buddhist canonical texts across traditions. Deployed at **https://dhamma.fly.dev/**. Open-source intent. Audience is comparative-Buddhist-studies researchers and serious old students.

Match an academic tone: quiet, typeset, no marketing copy, no AI summary unless the scholar opts in.

---

## ⚡ In flight as of last session — READ THIS FIRST

A full Pali Tipiṭaka ingest is running on the user's local machine. **Do not assume it's still alive — verify first.**

### What's running

Two long-lived OS processes were started in the previous Claude session via `run_in_background`:

1. **`flyctl proxy 15432 → dhamma-pg.internal:5432`** — local TCP proxy to the Postgres app. Required for the ingest to reach the DB.
2. **`node ingest.mjs`** in `scripts/ingest/` — embeds suttas with BGE-M3 (Xenova/bge-m3 ONNX) and UPSERTs into `passages`. Idempotent via `ON CONFLICT (id) DO UPDATE`.

Task IDs from the previous session (`b8lg0yqoe`, `b0j5qmq8e`) are **dead to your TaskOutput** — they only existed in that session's registry. Use the alternatives below.

### How to check progress

```bash
# 1. How many passages are in the DB right now (live)
curl -s https://dhamma.fly.dev/api/dbcheck
# expect: {"connected":true, ..., "passages": N}    where N is climbing toward 5764

# 2. Latest log lines from the ingest worker
tail -n 5 scripts/ingest/ingest-full.log
# expect lines like "  1240/5764  (0.33/s, ETA 13700s)"

# 3. Is the node ingest process still alive (Windows)
powershell -c "Get-Process node -ErrorAction SilentlyContinue | Select-Object Id,StartTime"

# 4. Is the fly proxy still alive (Windows)
powershell -c "Get-NetTCPConnection -LocalPort 15432 -ErrorAction SilentlyContinue"
```

### State at session handoff

- Total target: **5,764 suttas** from `bilara-data/root/pli/ms/sutta/` (Pali Tipiṭaka)
- Rate observed: **~0.33 suttas/sec** on user's CPU
- ETA from start: **~4.5 hours**
- DATABASE_URL password (lives only in Fly secrets — pull fresh if needed):
  ```
  flyctl ssh console --app dhamma -C "printenv DATABASE_URL"
  ```
  Then swap `dhamma-pg.internal` → `localhost:15432` for the local proxy.

### What to do depending on what you find

| Situation | Action |
|---|---|
| `passages` == 5764 (or very close), node process gone | Ingest done. Kill the proxy, move to step 4 below. |
| `passages` climbing, node process alive | Wait. Move on to step 4 design / code while it runs. |
| `passages` stuck for >5 min, node process gone | Crashed. Restart the ingest — idempotent: `node ingest.mjs` resumes safely. |
| Proxy dead but node still trying | Restart the proxy: `flyctl proxy 15432 --app dhamma-pg` |

### Immediate next action

**Phase 2, step 4: server-side query embeddings.** When a user searches in *Meaning* mode the server needs to embed their query and run a pgvector ANN search. Two viable paths — pick after asking the user:

- **(A) BGE-M3 in-process via `@xenova/transformers`** — bump dhamma machine to 1.5–2GB memory (~$5–8/mo extra). No external dependency, same model as ingest so vectors are comparable. Slight risk: ONNX in Node could be slow on shared CPU.
- **(B) Voyage AI free tier** for query embeddings only (`voyage-multilingual-2` or `voyage-3`). External service, but free tier covers low-traffic research-tool volume forever. **Vector dimensions will differ from BGE-M3 (1024 vs 1024 — check exact match for the model)** — if dims don't match exactly the schema needs adjustment, OR we re-embed the corpus with the API model.

User has previously stated preference for "no extra services to log into" → favors (A). But (B) avoids the memory bump on Fly.

After step 4 ships:
- **Step 5:** Add `/api/search`, `/api/passage/:id`, `/api/corpus`, `/api/compare` endpoints. Hybrid scoring: FTS + vector via reciprocal rank fusion.
- **Step 6:** Frontend swap — four data-access points in `src/` move from `data/*.js` imports to `fetch('/api/...')`.
- **Step 7:** Delete `C:\Dev\Cabinet\apps\dhamma\` + remove from Cabinet's `vite.config.js` and `src/registry.js`.

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
