# Dhamma Data

Query the Buddhist canon. Find a term in Pali, see its Chinese parallel, compare its Zen treatment — without leaving the page. Built for serious comparative-Buddhist-studies work, not for AI summary.

Currently a v1 scaffold deployed at [dhamma.fly.dev](https://dhamma.fly.dev/) with a six-passage demo corpus featuring *sampajāna*. v2 lands a real Postgres + pgvector backend with the Pali Tipiṭaka, Chinese Āgamas, Visuddhimagga, and Shōbōgenzō ingested.

## Stack

- **Frontend** — Vite + React 18, inline styles with `--bc-*` theme tokens (light + dark)
- **Server** — Hono on Node, serves the SPA and `/api/*` on the same origin
- **Phase 2** — Postgres + pgvector (sibling Fly app, internal-only), BGE-M3 embeddings for multilingual semantic search

## Quick start

```
npm install
cd server && npm install && cd ..
npm run dev      # http://localhost:5173, /api proxies to https://dhamma.fly.dev
```

To run the server locally (proxy target):
```
cd server && npm run dev   # :8080
```

## Deploy

```
fly deploy
```

See [HACKING.md](HACKING.md) for the lay of the land.
