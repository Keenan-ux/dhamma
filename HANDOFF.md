# Dhamma data — handoff to next session

Picks up after a long session (May 2026) that materially improved
search quality, search UX, library navigation, and tradition-UI
cleanup. Read **this** first, then **CLAUDE.md** for project context.

Live at **https://dhamma.fly.dev/** · GitHub: `Keenan-ux/dhamma` (private)
Last verified: `dbcheck → passages: 25,986, tables: 11, pgvector: true`

---

## What landed this session

The bulk of the work was on **Meaning search quality**, which went
from "returns random Pāli grammar passages for English queries" to
"surfaces canonical sutta corpora for any reasonable Buddhist query
in any reasonable typing convention." Plus a long tail of UX +
ingest + structural fixes.

### Search engine (server/src/search.js + schema)

- **`MAX_LIMIT` 100 → 5000**. Added `offset` + `nosnippet` params, plus
  `hasMore` in the response shape, plus a `total` count via parallel
  COUNT against the same FTS predicate.
- **`FUSION_POOL` 200 → 500** for wider RRF recall on broad terms.
- **MaxFragments 1 → 3** with `FragmentDelimiter=⌇`; `refineSnippet`
  refines each fragment independently.
- **`OR`, `NEAR/N`, parens** added to the query grammar via a full
  tokenizer + recursive-descent AST. Legacy `must`/`phrases`/`exclude`
  flat shape preserved.
- **Field-weighted `ts_rank`** with explicit weights `{0.05, 0.15, 0.6, 1.0}`
  on `fts_doc` (citation/title/original/translation) — Postgres caps
  weights at 1.0 so we suppress D + C instead of bumping A.
- **3-way RRF in default Meaning scope**: fuses FTS + passages.embedding
  ANN + translations.embedding ANN with best-translation-per-passage.
  This was the single biggest quality jump for English queries against
  the CST commentary (which is embedded as pure Pāli).
- **0.7 cosine-distance threshold** on all vector lookups — clips
  long-tail noise so no-good-match queries return fewer relevant
  results instead of irrelevant ones.
- **Length-aware re-rank** in passages Meaning RRF: scores multiplied
  by `1 - exp(-len/800)` so single-line verse passages stop dominating
  thematic queries over substantial suttas (~0.22 at 200 chars, ~0.92
  at 2000).
- **`Postgres unaccent` extension + custom `simple_unaccent` config**
  applied corpus-wide: every fts_doc tsvector and every to_tsquery /
  ts_headline call uses the new config. **Diacritic-blind matching
  across the entire 26K-passage corpus, automatic, no per-term seeding.**
  `anapana ↔ ānāpāna`, `metta ↔ mettā ↔ Mettasutta`, every Pāli word.
- **Reader-side highlight of every match** when arriving from a search
  hit (not just the snippet window). Find bar placeholder advertises
  the active highlight; typing in find overrides.

### Aliases table (server/src/aliases.js + seed-aliases.sql)

- **Bidirectional lookup**: `aliasesFor("loving-kindness")` now hits the
  mettā row via `_byEquiv` reverse index. Direct + reverse hit logic
  with the canonical term prepended to the returned siblings.
- **Hyphen / underscore / case normalisation** in lookup keys, so
  "loving kindness", "loving-kindness", "Loving Kindness" all match the
  same entry. Stored alias strings keep their original form.
- **English equivalents** added to every existing Pāli↔Sanskrit↔Chinese
  row (sati ↔ mindfulness, sampajāna ↔ clear comprehension/alertness,
  dukkha ↔ suffering/stress, etc.).
- **15 new rows** for the Brahmavihāras (mettā, karuṇā, muditā, upekkhā),
  five aggregates (rūpa, vedanā, saññā, saṅkhāra, viññāṇa), path
  elements (bodhi, magga, citta, jhāna, samādhi, viriya), plus
  multi-word topics (mindfulness of breathing → ānāpānasati, four
  noble truths → cattāri ariyasaccāni, noble eightfold path,
  paṭiccasamuppāda, khandha, tilakkhaṇa, virāga, nirodha).
- **Diacritic-stripped variants** on every Pāli term equivalent
  (`metta` alongside `mettā`, `karuna` alongside `karuṇā`, …). Mostly
  redundant now that unaccent is live, but harmless and a good fallback
  if someone disables the extension.
- **Multi-word phrase detection** at AND nodes in nodeToTsquery +
  expandEmbeddingQuery — when the user types "clear comprehension",
  the engine tries the joined phrase as an alias key before falling
  through to per-term expansion.

### Search UX (src/SearchView.jsx)

- **Filter rows collapse behind a "Filters" disclosure** on narrow
  viewports with a compact summary line of non-default active values.
- **"Show all without snippets"** moved inline directly under the
  result-count line (was at the bottom, scrolling out of reach as
  infinite-scroll loaded more).
- **Piṭaka chips** (Sutta / Vinaya / Abhidhamma) — server already
  supported `?pitaka=`, this is the UI.
- **Layer filter** (Tipiṭaka / Aṭṭhakathā / Ṭīkā / Extra-canonical /
  Library) — pulls Library out of "Search in" so the two axes
  compose. Server adds `?layer=` mapped to `work_role`.
- **Translator chip indicator** when arriving from the Translator
  coverage view, with a clear button.
- **Result-count true-total** via parallel COUNT against the FTS
  predicate; `≥` prefix for Meaning mode to flag the FTS count as a
  lower bound on what semantic search adds; loaded-count fallback
  when FTS=0 but vector returns results.
- **Comma-separated must-term display** instead of " + " (the new
  boolean grammar lets must contain OR-joined terms, where " + " was
  misleading).

### Library tab (src/LibraryView.jsx + ReadingPanel + Dhamma.jsx)

- **Translator coverage index** — new "Translators" chip lists all 27
  distinct translators across SC + ATI with passage counts. Click
  opens Search with the translator filter pre-applied. `/api/translators`
  endpoint powers it.
- **Page layout unified at 980 maxWidth** so title + chips + grid sit
  in one centered column; gold rule spans the full column.
- **Article cards center-aligned content** so middle-column text
  visually aligns with the centered title.
- **`/library/<slug>` URL form noted broken**; works as `/#/library/<slug>`
  via the hash router. Task #21 tracks a server-side redirect.

### BrowseView refactor

`src/BrowseView.jsx` went from a 2,433-line monolith to a 594-line
orchestrator plus:
- `src/browse/ReadingPanel.jsx` — the passage reader (1,616 lines)
- `src/browse/SideBySideReader.jsx` — the dual-pane Pāli/English reader
- `src/browse/TreeLevel.jsx` — the recursive tree-drill column
- `src/browse/highlight.jsx` — escapeRegExp / highlightFind / withGlosses
  utilities

Pure refactor, no behaviour change. Delegated to a background agent
and reviewed before commit.

### Ingest

- **552 new translation rows** via `scripts/ingest/ingest-sc-translators.mjs`
  — Brahmali (420 Vinaya passages), Kelly (100 Khuddaka), Suddhaso (30),
  Kovilo (2). `soma` excluded to avoid the Ayya-Soma / Soma-Thera
  attribution collision with ATI.
- **420 mis-attributed `sujato/sc` Vinaya rows deleted**
  (`scripts/ingest/fix-vinaya-sujato-misattrib.mjs`) — they contained
  Brahmali's text labelled as Sujato due to an earlier backfill chain.
  The Bhu. Pc. 22 reader now correctly shows only Brahmali's chip.
- **7,286 SC bilara passages backfilled to `work_role='mula'`** so the
  Layer filter sees the canonical corpus (14,564 mula passages now).
- **`idx_articles_embedding` HNSW index built** (3,104 kB). 387 article
  embeddings were already there; the index was the missing piece for
  Library Meaning search. Library Meaning now returns 100s of hits for
  "mindfulness of breathing"-style queries.

### Tradition UI retired

Only Theravāda is live; the Mahāyāna/Zen schema rows have zero
passages. Removed the Traditions chip row from SearchView, the
"THERAVĀDA" sticker from PassageCard headers, the compact-pane
tradition kicker from ReadingPanel, and the related state +
props in Dhamma.jsx. `/api/corpus` filters out traditions with zero
passages in their subtree so the front-end doesn't have to.

Meta descriptions (`index.html`, `manifest.webmanifest`, `package.json`)
no longer claim "Chinese, and Zen sources" — replaced with what the
corpus actually contains.

### Layout pass

Every non-search page (Tipiṭaka, Commentaries, Extra-canonical, Tags,
Bookmarks, About, Browse, Library) was using `margin: '0 auto'` which
centered each page in the full main viewport. Now `margin: 0` so
content hugs the sidebar like Search/Concordance/Dictionary. 24 wraps
updated across 8 files via one-shot `trim-left-margins.mjs` (deleted
after running).

### Docs + cleanup

- **README + CONTRIBUTING fixes**: `@xenova/transformers` →
  `@huggingface/transformers`, "five dictionaries" → six (CPED added),
  dev-proxy claim corrected, first-person voice in CONTRIBUTING.
- **`useHeaderProgress.js` + `ScrollPage.jsx` deleted** — orphan dead
  code from the earlier sticky-chrome rework.

---

## ATI email — drafted, ready to send

`ATI_EMAIL_DRAFT.md` finalised:
- **To:** `contact@buddhistinquiry.org` (verified via ATI's own FAQ
  page; the HANDOFF's old `info@bcbs.org` was stale)
- **Tone:** scholarly, no em-dashes anywhere, no marketing register,
  first-person singular
- **Links:** `https://dhamma.fly.dev/#/read/snp1.8` (Karaṇīyamettā,
  five ATI translations side-by-side) + `https://dhamma.fly.dev/#/library`
  (article landing + new Translators index)
- **Demonstration query**: `"mindfulness of breathing"` → SN 54
  Ānāpāna-saṃyutta. Verified to work on prod.
- **Sign-off**: Isaac Keenan Cyr / keenan@boothcheck.com

Three other email drafts (`BPS_EMAIL_DRAFT.md`,
`SUTTACENTRAL_EMAIL_DRAFT.md`, `CPD_EMAIL_DRAFT.md`) **not yet
revised** — still in their original state from the prior session.

---

## Open backlog (priority order)

### Structural — pick up here

1. **CST passage re-embed for cross-language Meaning quality (#25)**.
   11,609 commentary passages embedded as pure Pāli — vector matches
   for English queries land them weakly. Two paths:
   - (a) Inject per-token DPD English glosses into the embedding text,
     re-embed. Existing DPD-inflections table has the gloss data;
     would need a small script to walk each passage's Pāli, look up
     each word's headword + first meaning_1, concatenate gloss text
     after the original, re-embed.
   - (b) Re-embed once AI translation drafts land (task #9 in the
     long-term backlog). Higher quality but blocks on the AI pilot.
   Path (a) is the deliverable for the next session.

2. **Canonicality / "primary text on X" boost.** Even with all
   today's tuning, the Visuddhimagga + its commentaries beat
   Karaṇīyamettā on "metta" because they're more term-dense. That's
   not wrong — Vism §80 IS the systematic treatment of mettā — but
   scholars looking for the canonical sutta want it surfaced too.
   Options:
   - A small handcrafted `passage_priority` table flagging the ~30
     "primary text on" suttas (Karaṇīyamettā, Dhammacakkappavattana,
     Mahāsatipaṭṭhāna, etc.) with a score boost in the RRF.
   - Surface a "primary canonical text" suggestion *above* the result
     list when the query matches a known concept (autocomplete-style).
   - A "Canon-first" toggle in the Filters disclosure that boosts
     mula passages over commentaries in scoring.
   First option is cheapest; third is most discoverable.

3. **Path-form deep-link redirect (#21).** SPA only consumes URL hash.
   Direct path links like `/library/<slug>` silently fall through to
   default tab. Add server-side redirect on the Hono routes for the
   well-known patterns (`/library/X`, `/read/X`, `/search/X`,
   `/dict/X`) so direct URLs from anywhere work without the `#/`.

### Outreach — ready when you are

4. **Send `ATI_EMAIL_DRAFT.md`** to `contact@buddhistinquiry.org`.
   Final version is in the repo, demonstration query verified on prod.
5. **Revise + send `SUTTACENTRAL_EMAIL_DRAFT.md`**. Section-by-section
   pass same as we did for ATI — strip em-dashes, tighten tone, swap
   any stale facts, drop the word "Buddhist" per the in-flight site-
   wide review of that term.
6. **Revise + send `BPS_EMAIL_DRAFT.md`** (info@bps.lk + cnt@bps.lk).
   Permission request for Bodhi's four commentary translation books.
7. **Revise + send `CPD_EMAIL_DRAFT.md`** (cpd-contact@uni-koeln.de,
   info@palitextsociety.org cc). Permission for Critical Pāli Dictionary.
### Conditional ingests (blocked on email replies)

8. **If BPS replies yes** → ingest Bodhi's four commentary translation
   books from bps.lk PDFs into `translations`. Same attribution
   pattern as ATI rows.
9. **If Cologne/PTS replies yes** → ingest CPD from DPD's
   `other-dictionaries` archive. Pattern identical to `ingest-cped.mjs`.

### Substantive next dev item

10. **AI-assisted draft translations** — see `TRANSLATIONS-AI.md` for
    the full process. The DN 1 Aṭṭhakathā pilot (Bhikkhu Bodhi's
    BP209S as gold standard) is the first concrete step.

### Smaller follow-ups

11. **Site-wide review of the word "Buddhist"**. The maintainer is
    rethinking that framing; touched only the README this session.
    A site-wide pass would update meta descriptions, About page, and
    UI prose. Doesn't need to be one big PR — can be iterative.

13. **Drop the `xenova-v2-pinned` memory note** — superseded by the
    v3 migration; was delegated this session.

---

## Architecture quick-reference

(see CLAUDE.md for full corpus + dictionary inventory)

### Frontend layout
```
src/
  Dhamma.jsx              — hash router; routes by tab + leafId
  TopNav.jsx              — fixed nav, scroll-hides on narrow
  Sidebar.jsx             — desktop nav (Corpus + Tools + About)
  CanonMapView.jsx        — Tipiṭaka frontmatter
  CommentaryView.jsx      — Aṭṭhakathā + Ṭīkā frontmatter
  ExtraCanonicalView.jsx  — Anya frontmatter
  LibraryView.jsx         — ATI library + Translators coverage index
  TagsView.jsx            — passage_tags drill-down
  BookmarksView.jsx       — localStorage bookmarks
  SearchView.jsx          — Exact / Stem / Meaning + filter disclosure
  CompareView.jsx         — Concordance (KWIC + companion words)
  DictionaryView.jsx      — six-source dictionary lookup
  AboutView.jsx           — About page + Contact form
  BrowseView.jsx          — orchestrator (594 lines after refactor)
  browse/
    ReadingPanel.jsx      — the passage reader
    SideBySideReader.jsx  — dual-pane reader
    TreeLevel.jsx         — recursive tree drill
    highlight.jsx         — find-in-passage helpers
  PassageCard.jsx         — search/concordance result tile
  api.js                  — fetch helpers incl. translatorsApi
  parseQuery.js           — boolean grammar (OR / NEAR / parens / NOT)
  useSearch.js            — debounced + paginated search hook
```

### Server
```
server/src/
  index.js     — Hono routes incl. /api/translators, /api/contact
  db.js        — postgres connection + applySchema on boot
  corpus.js    — /api/corpus (hides empty traditions + uddāna rows)
  search.js    — /api/search (3-way RRF + alias + unaccent + length-rerank)
  aliases.js   — bidirectional lookup, hyphen/case-normalised keys
  compareStats.js
  dictionary.js — six-source cascade
  embed.js     — BGE-M3 ONNX via @huggingface/transformers
  paliStem.js
server/sql/schema.sql   — applies unaccent + simple_unaccent on boot
server/sql/seed-aliases.sql — 44 rows, multi-language + multi-word
```

### DB
- **simple_unaccent** text-search config (Postgres unaccent + simple)
- `passages.fts_doc`, `translations.fts_doc`, `articles.fts_doc` all
  built with simple_unaccent
- HNSW indexes: `passages.embedding`, `articles.embedding`,
  `translations.embedding` (per-source partial indexes on
  `dictionary_entries.embedding`)
- Sanity check: 25,986 passages · 6,217 translations · 387 articles
  · 27 distinct translators · 44 alias rows

---

## How to start the next chat

Paste this into the new chat verbatim:

```
Read C:\Dev\Dhamma\HANDOFF.md, C:\Dev\Dhamma\CLAUDE.md, and
C:\Dev\Dhamma\TRANSLATIONS-AI.md. Previous chat is at context
limit. Deployed state is good — verify with
`curl -s https://dhamma.fly.dev/api/dbcheck`. Working tree clean.

We just shipped a major Meaning-search overhaul (3-way RRF +
unaccent + multi-word aliases + length-dampening). Quality is
materially better but two structural ceilings remain that need
focused work:

  1. CST commentary passages (11,609 of them) are still
     embedded as pure Pāli, so cross-language Meaning quality
     is weaker on them than on SC sutta passages. Re-embed with
     DPD-gloss-injected text — task #25 in HANDOFF, path (a).

  2. Canonical suttas get beaten by their own commentaries on
     thematic queries because Visuddhimagga etc. are more term-
     dense (Vism §80 beats Karaṇīyamettā on "metta"). Need a
     canonicality boost — task #2 in HANDOFF's open backlog.

Pick (1) first. It's a corpus-wide compute job: walk every CST
passage's Pāli, look up each word's DPD entry from the
dictionary_entries + dictionary_inflections tables, gather the
headword_lower + first sense from definition (or definition_lit),
concatenate as a synthetic English-gloss appendix to the original
Pāli text, re-embed with the existing BGE-M3 pipeline. Use the
existing embed scripts in scripts/ingest/ as the template.

Don't touch the email queue until I say so — ATI email is
finalised in the repo, others are still in their pre-session
state.

Notes for working with me:
- I have flat-rate Anthropic plans. Per-token cost is not a
  constraint. Don't penny-pinch model variant or context.
- Em-dashes are an AI tell. Use commas/periods instead.
- Don't use the word "Buddhist" in user-facing copy without
  asking — there's an in-flight site-wide review of that term.
- I'm one person (Isaac Keenan Cyr, but go by Keenan). Code
  comments and user-facing copy use first-person singular.

Wait for direction before starting anything substantive.
```
