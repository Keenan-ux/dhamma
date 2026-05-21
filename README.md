# Dhamma Data

A search and reading tool for Buddhist canonical texts.

Live at **[dhamma.fly.dev](https://dhamma.fly.dev/)**.

## What it does

You can browse the Pali Tipiṭaka, the major Aṭṭhakathā commentaries,
the Ṭīkā sub-commentaries, and a long tail of extra-canonical CST
works in their original Pali and — where translations exist — in
English. Searches run in three modes: exact word, stem (so
`sampajāna` finds `sampajāno`, `sampajānakārī`, and so on), and
meaning (a BGE-M3 vector index, so a description of an idea returns
passages that express it even when the literal words are different).

Selecting a word in any reader opens a side panel with entries from
six dictionaries — DPD, DPPN, PED, and Buddhadatta's CPED for Pali;
Monier-Williams and Edgerton's BHS for Sanskrit. Each passage's
reader view shows SuttaCentral's parallels, including Sanskrit,
Chinese, and Gāndhārī links where they exist.

A separate Library tab carries the 386 secondary articles from Access
to Insight: the study guides, the author essays, the Thai forest
collection, the Path to Freedom programme, the glossary. The
curated indexes from ATI (similes, names, subjects, titles) have
been parsed into a tag layer that lets you ask, e.g., "which suttas
use the elephant simile?"

There is no AI summary by default, no analytics, no telemetry, no
account, no paywall.

## Stack

The frontend is Vite + React 18 with inline styles using `--bc-*`
theme tokens. The server is Hono on Node, serving the SPA and the
`/api/*` routes from a single Fly container. Behind it, a sibling
Fly app runs Postgres 16 + pgvector with the corpus, dictionaries,
articles, parallels, and tags. Embeddings are 1024-dim BGE-M3,
produced via `@huggingface/transformers` (ONNX Runtime) and indexed
with HNSW.

`CLAUDE.md` carries the standing project context — corpus counts,
schema notes, decisions worth remembering. `HACKING.md` walks
through the directory layout and the endpoint surface for anyone
who wants to read the code.

## Run it locally

```
npm install
cd server && npm install
```

The frontend dev server (`npm run dev` from the repo root) proxies
`/api/*` to **`https://dhamma.fly.dev`** by default, so you can run
the UI against the live corpus without setting up a database. Point
the proxy at a local server in `vite.config.js` if you want to work
on the API too.

The full Postgres corpus is not in the repo — it lives in the
`dhamma-pg` Fly app and the ingest scripts under `scripts/ingest/`
populate it. Running locally against your own Postgres requires
walking through `server/sql/schema.sql` and the ingest scripts in
order; see `HACKING.md`.

## Sources and licence

The corpus is assembled from:

- **SuttaCentral** (`bilara-data`) — Pali Tipiṭaka + Bhante Sujato's
  English translations, CC0.
- **VRI / Vipassana Research Institute** (CST) — Aṭṭhakathā, Ṭīkā,
  and extra-canonical works, in the public domain per their
  publication policy.
- **Access to Insight** — translations by Ṭhānissaro, Walshe,
  Nyanaponika, Olendzki, Bhikkhu Bodhi (extracts), Piyadassi,
  Ñāṇamoli, Soma, Buddharakkhita, Ireland, and others, alongside
  ATI's secondary articles and curated indexes. **CC BY-NC 4.0** —
  each ATI-sourced rendering carries the original translator's
  copyright, the licence, and a link back to the source page on
  `accesstoinsight.org`.
- **DPD** — *Digital Pāli Dictionary* by Bodhirasa, CC BY-NC-SA 4.0.
- **DPPN** — *Dictionary of Pali Proper Names* (Malalasekera, 1937,
  rev. Ānandajoti 2025).
- **PED** — Pali Text Society *Pali-English Dictionary* (Rhys Davids
  & Stede, 1921–25), CC BY-NC 3.0.
- **CPED** — A.P. Buddhadatta's *Concise Pali-English Dictionary*
  (1957), digitised via DPD's `other-dictionaries` archive.
- **Monier-Williams** + **BHS (Edgerton)** — Cologne Digital Sanskrit
  Lexicon digitisation.

Code in this repository is MIT-licensed. The corpus data carries the
licences listed above, which the tool honours in display and
attribution; redistributing the data carries the same conditions.

The non-commercial constraint of CC BY-NC 4.0 is the binding
limit — Dhamma Data will not carry advertising, paywalls, or
commercial features.

## Why this exists

The idea came up on a Satipaṭṭhāna retreat. The Pali canon is
already free and online — at SuttaCentral, at ATI, in the VRI's
CST — but moving across those sources, looking up a word, checking
a parallel, and reading a commentary on the same passage takes more
clicking than it should. A scholar who has internalised the canon
doesn't need that friction. A new student certainly doesn't.

The tool is built for people who treat the texts as primary sources,
not as something to be summarised on their behalf. Suggestions,
corrections, and ingest contributions are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md).
