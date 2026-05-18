# Hacking on Dhamma Data

## Layout

```
src/                     frontend (React 18, Vite)
  main.jsx               entry; registers /sw.js
  Dhamma.jsx             root: top nav + tab bar + sidebar + view
  TopNav.jsx             logo + theme toggle + settings slide-in panel (mobile) / dropdown (desktop)
  ThemeToggle.jsx        sun/moon button; dark ↔ light
  TabBar.jsx             Browse / Search / Compare
  Sidebar.jsx            desktop-only left rail: Corpus list + Dictionaries placeholder + About
  BrowseView.jsx         Miller-columns navigation of CORPUS tree, reading panel with adjacent ◀ ▶
  SearchView.jsx         lex/stem/meaning modes, tradition filter, term highlight
  CompareView.jsx        frequency-by-tradition, side-by-side, KWIC, companion words
  PassageCard.jsx        academic-typeset entry (no card chrome, thin gold rule between)
  Sidebar.jsx            corpus tree on the left rail
  Leaf.jsx               Bodhi-leaf glyph (PWA icon + topnav mark)
  analyze.js             pure-function corpus analysis (no ML): countOccurrences, kwic, frequencyByTradition, neighborsByTradition
  paliStem.js            heuristic Pali stem stripper + curated cross-canon alias table
  useIsNarrow.js         media-query hook for sidebar hide / mobile filter row
  theme.css              --bc-* vars (dark + light)
  data/
    corpus.js            hierarchical canon tree (Theravāda → Tipiṭaka → Sutta → Nikāya → Sutta)
    samplePassages.js    six demo passages featuring sampajāna across three traditions

public/                  served at root
  index.html · manifest.webmanifest · sw.js · icon.svg

server/                  Hono on Fly. Phase 1 = static + healthz only.
  src/index.js           healthz + static SPA serving
  package.json
  data/                  Phase 2: SQLite tail-cache or similar (gitignored)

Dockerfile               multi-stage: build SPA → copy dist into server image
fly.toml                 dhamma.fly.dev, region iad, shared-cpu-1x / 256MB
```

## Two distinct concerns

1. **The canon viewer** (`src/`) — static frontend that works against bundled mock data today. Phase 2 swaps `data/samplePassages.js` lookups for `/api/passage/:id` fetches and the corpus tree comes from `/api/corpus`.
2. **The corpus engine** (`server/`) — Phase 2 hosts the real corpus in Postgres + pgvector and does the heavy lifting: FTS, lemmatized search, vector similarity. Pure-function `analyze.js` logic moves server-side.

## Search modes — what they do today vs. v2

| Mode | Phase 1 (today) | Phase 2 (with pgvector + BGE-M3) |
|---|---|---|
| **Exact** | `String.includes` over mock passages | Postgres `ILIKE` / FTS5 over real corpus |
| **Stem** | Heuristic Pali suffix stripper + ~15-entry hand-curated cross-canon alias table | Same alias table + proper Pali morphological lemmatizer (Digital Pali Dictionary) |
| **Meaning** | Falls back to Stem with a banner explaining v2 | Vector ANN search via pgvector — embeddings produced by BGE-M3 running locally on the Fly machine |

## Conventions

- **No Tailwind.** Inline styles with `var(--bc-*)`. Per SPLIT.md, this was the lever that made the Cabinet → standalone split mechanical.
- **No analytics, no telemetry.** The tool helps the user *find*; the scholar *interprets*. We track nothing.
- **No LLM summary by default.** A future opt-in "✨ Synthesize" button could call an external LLM on a curated set of passages, labeled clearly as AI-generated. Off until earned.
- **Curated aliases beat embeddings for technical terms.** `paliStem.js` ALIASES (sati ↔ smṛti ↔ 念, dhamma ↔ dharma ↔ 法) stays even after pgvector ships — it's the scholar-asserted authority overlay that vectors approximate.

## Deploy

```
fly auth login                                    # one-time
fly launch --name dhamma --region iad --copy-config --yes --no-deploy
fly deploy
```

## Ingest

One-time corpus load runs on your local machine — your CPU embeds ~50× faster than a shared Fly VM. Lives in `scripts/ingest/`.

```
# Terminal 1: open the Postgres proxy
flyctl proxy 5432 --app dhamma-pg

# Terminal 2: pull DATABASE_URL value out of the live app, replace host
flyctl ssh console --app dhamma -C "printenv DATABASE_URL"
# Copy the password (between "dhamma:" and "@") and set DATABASE_URL locally:
export DATABASE_URL="postgres://dhamma:PASSWORD@localhost:5432/dhamma"

# Terminal 2: smoke test on a single sutta first
cd scripts/ingest
npm install              # first time only
node ingest.mjs --only=mn10

# If that worked, ingest a single canon
node ingest.mjs --canon=mn

# Finally, the whole Pali Tipiṭaka — 17.5k suttas, ~1-2 hours
node ingest.mjs
```

Model files (~1GB for BGE-M3) and bilara-data clone (~300MB) cache to `scripts/ingest/.cache/` — gitignored. Re-running the ingest is idempotent (UPSERT on passage id).

## Endpoints

Phase 1 (live now):
```
GET  /api/healthz                liveness
GET  /                           SPA
```

Phase 2 (coming):
```
GET  /api/corpus                 canon tree (replaces in-memory CORPUS)
GET  /api/passage/:id            single passage by id
GET  /api/search?q&mode&traditions   exact|stem|meaning search
GET  /api/compare?term&traditions    frequency, KWIC, neighbors
GET  /api/dictionary/:term       PED / BHS / DDB lookup (post-ingest)
```
