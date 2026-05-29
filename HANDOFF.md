# Dhamma data — handoff to next session

Live at **https://dhamma.fly.dev/** · GitHub: `Keenan-ux/dhamma` (private)
Last verified: `dbcheck → passages: 194,710, tables: 12, pgvector: true`

Three sessions have happened. The CURRENT one (May 2026, day 3)
shipped BPS Tier 3 (BP304s Bodhi Abhidhamma — complete PDF sourced
mid-session), Tier 4 (BP502s + BP214s), Tier 5 (BP509s + BP501s),
Reader UX Step 2 (paragraph-group merged rendering), Step 2's
group-aware multi-translator dropdown, a primary-text anchor boost
for famous canonical suttas, a corpus tree-ordering fix that was
sending prev/next to cross-volume passages, the "Buddhist" framing
review (conservative pass), refreshed BPS/SC/CPD emails, and a
~3,500-row translation embedding backfill. Started the corpus-wide
CST DPD-glossed re-embed in background (~3 hour job, resume-friendly).
The prior session (day 2) shipped CST per-`<p>` subdivision + BPS
Tier 1 + Tier 2. The earliest (day 1) shipped the Meaning search
overhaul, Notes feature, and SC parallels. Read newest first.

---

## What landed this session (BPS Tier 4 + email + embedding backfill)

This session moved BPS coverage from "Tier 1+2 live, Tier 3 next" to
"Tier 1+2+4 live, Tier 3 blocked, BPS notification email drafted."

### BPS Tier 4 — Ñāṇamoli BP502s + Ireland BP214s

Tier 4 brings in two short BPS books that don't fit the Tier 2
sutta-and-commentary template:

- **BP502S** *Mindfulness of Breathing* (Ñāṇamoli, 1964). Part I
  is the Ānāpānasati Sutta MN 118 translation; Parts II/III/IV are
  Visuddhimagga commentary extracts, the Paṭisambhidāmagga
  Ānāpānakathā, and related sutta passages. **1 sutta translation
  row** (mn118, joins Sujato + Thanissaro as a third translator)
  + **4 Library articles**.
- **BP214S** *The Udāna and the Itivuttaka* (Ireland, 1997). Each
  sutta aligned to its canonical passage_id. **80 ud + 112 iti =
  192 sutta translation rows** + **1 introduction article**.

Files:
- `scripts/ingest/bps-bp502s.mjs` and `bps-bp214s.mjs` — per-book
  PDF parsers. Same Latin-1 substitute family as the Tier 2 books
  (á→ā, þ→ṭ, ó→ṇ, í→ṃ, ò→ṅ, ì→ī, ú→ū, ð→ḍ), plus BP214S adds
  ÿ→ḷ and Ó→Ṇ (a per-PDF font quirk).
- `scripts/ingest/ingest-bps-tier4.mjs` — orchestrator. Handles
  both single-sutta (BP502s) and multi-sutta (BP214s) books via
  a unified `built.suttaRows[]` shape. Drop-cap fix re-joins
  typeset openers like "I NTRODUCTION" that pdf-parse splits.

Itivuttaka splitting handles intra-section numbering — BPS prints
1-27 in the Ones, then resets to 1-22 in the Twos, 1-50 in the
Threes, 1-13 in the Fours. The parser tracks chapter offsets and
maps to absolute iti1-iti112 IDs. Also handles Ireland's "9˜13
Understanding Greed, etc." range form where one translation
covers 5 near-identical suttas — replicated across all five
passage_ids with a shared-note flag.

### BPS Tier 3 — BLOCKED on truncated PDF

The cached `scripts/ingest/.cache/bps/bp304s.pdf` (Bodhi's *A
Comprehensive Manual of Abhidhamma*) is missing roughly 35% of
its body content. The PDF physically jumps from printed p55 to
p76 mid-chapter 1, dropping §§21-32 of chapter 1, §§10-22 of
chapter 3, §§7-30 of chapter 4, §§3-42 of chapter 5 — about 89
of 256 § sections total. Both pdf-parse and pdftotext extract
the same gap, so the source PDF itself is partial, not the
extractor. Parser scaffolded at `scripts/ingest/bps-bp304s.mjs`
for the day a complete PDF is acquired.

User direction was to skip BP304s and move forward with Tier 4
plus comprehensive backlog. Parser kept in place against the day
a complete PDF surfaces.

### BPS notification email — drafted, NOT sent

`BPS_EMAIL_DRAFT.md` rewritten from a permission-request posture
to a disclosure-notification posture, matching the ATI email tone
that already shipped. Lists Tier 1 + Tier 2 + Tier 4 with passage
counts, four demonstration URLs, an explicit note on the per-card
attribution discipline, and a closing aside on BP304s being on
the list once a complete PDF is sourced. Awaits user review and
manual send.

### Translation embeddings backfill

After Tier 4 landed, the `translations.embedding` column had
~3,500 NULL rows across nanamoli/bps-direct (2,728), ireland/
bps-direct (192), bodhi/bps-direct (42), brahmali/sc (420),
kelly/sc (100), suddhaso/sc (30). These embeddings power the
3-way RRF Meaning search, so without them English Meaning queries
miss everything from the BPS commentary translations + a few
older SC translator ingests.

`scripts/ingest/embed_translations.py` (GPU BGE-M3 fp16, CUDA EP)
backfilled all 3,514 pending rows in 302 seconds (~11.6 rows/s on
the RTX 5050) and rebuilt the HNSW index on
`translations.embedding` (now 73 MB). After the pass all 9,346
translation rows are embedded. Meaning search smoke-tested on
both Vism content ("path of purification samadhi" → 22 hits) and
BP214s Ireland Udāna content.

### BPS Tier 3 — UNBLOCKED + shipped

The cached PDF that blocked Tier 3 in the previous session was an
abbreviated 307-page edition missing ~89 of 256 § sections. The
complete 448-page edition was sourced from the archive.org
"3 ABHIDHAMMA.rar" mirror. SECTION_RANGES updated; all 9 chapters
now parse with their expected § counts (32 / 30 / 22 / 30 / 42 /
32 / 40 / 32 / 45 = 305 total).

`ingest-bps-tier4.mjs` gains `buildBp304sRows` + the alignment table
`BP304S_CHAPTER_NRF_RANGES`. For each chapter, the orchestrator
fetches the corresponding fine CST rows under `cst-abh07t.nrf-1..
nrf-85` (the Abhidhammattha-saṅgaha — nrf-86+ is the Vibhāvinī-ṭīkā
commentary on it, which we don't pair with), then proportionally
distributes Bodhi's §-sections across the chapter's `_p` rows.
Each emits one translations row with text = English verse and
notes = Bodhi's "Guide to §N" commentary. Books that need DB
access for alignment declare `needsSql:true` so the orchestrator
passes the connection.

Live: 305 BP304S translation rows + 1 article placed.

### Tier 5 — Soma + Nyanaponika satipaṭṭhāna texts

- BP509S Heart of Buddhist Meditation (Nyanaponika): Part Two
  is the DN 22 Mahāsatipaṭṭhāna translation aligned to `dn22`.
  Part One (Nyanaponika's essay) and Part Three ("Flowers of
  Deliverance" anthology) → Library articles. BP509S uses
  canonical IAST so no diacritic table needed.
- BP501S The Way of Mindfulness (Soma): the canonical sutta and
  the commentary excerpts are typeset together, so the body ships
  as one Library article ("Discourse on the Arousing of Mindfulness
  with Commentary") plus Foreword + Introduction articles. Latin-1
  BPS diacritic family.

### Reader UX Step 2 — LIVE

Both backend and frontend shipped + deployed via `flyctl deploy`.

Backend: `/api/passage/:id/group` in `server/src/corpus.js` +
`server/src/index.js`. For a fine CST row like
`cst-s0101a.att-dn1_1_p047`, the endpoint returns every `_p%`
sibling row under the same parent div (`cst-s0101a.att-dn1_1`)
ordered by paragraph-suffix integer. Singleton groups (mula,
anya, library, Vism mula coarse) return the anchor row only.

Frontend: `ReadingPanel.jsx` renames the incoming prop to
`anchorPassage`, fetches the group via `passageGroupApi`, merges
originals + translations into one display passage, and renders
each paragraph as its own `<p>` so the user sees visual breaks.
Verified on cst-s0101a.att-dn1_1_p047 (the full 394-paragraph
Brahmajāla commentary renders as one continuous reader page) and
on mn118 (singleton — unchanged behaviour, translator switcher
shows Sujato + Thanissaro + Ñāṇamoli).

Deploy note: the CI workflow `.github/workflows/fly-deploy.yml`
still triggers on push to `main`, not `master`. Manual
`flyctl deploy --remote-only --app dhamma` is used. Don't deploy
while the gloss embed job is running — they deadlock on the
passages table.

### Step 2 group-aware multi-translator dropdown — LIVE

The previous Step 2 frontend fetched translations only for the
anchor row. For Tier 2 Bodhi cy commentary anchored to specific
paragraphs scattered through the group, that meant Bodhi could be
entirely missing from the dropdown depending on which paragraph
the user landed on. New endpoint `/api/passage/:id/group-
translations` returns every translation across the group keyed by
passage_id; ReadingPanel groups by `(translator, source)` and joins
per-row text in group order so the merged view surfaces Bodhi as
one continuous translation across the whole group.

BPS-direct attribution also fixed in the same patch — the chip was
hard-coded to fall through to "SuttaCentral · CC0" for any non-ATI
source, so Bodhi's commentary translations were misattributed.
Added a third branch that shows the source book, distinguishes
bps-online-free from bps-fair-use, and back-links to bps.lk.

### Primary-text canonicality boost — LIVE

The existing canonicality multiplier (1.25× on mula except pli-vism)
lifted mula over commentary but couldn't single out the FAMOUS text
on a topic from long-tail mula mentions. Added a curated ~30-entry
`PRIMARY_TEXTS` set in `server/src/search.js` (Karaṇīyamettā,
Mahāsatipaṭṭhāna, Ānāpānasati, Dhammacakkappavattana, Mahāparinibbāna,
Mūlapariyāya, Paṭiccasamuppāda etc.) with a 2.5× multiplier composed
multiplicatively with the canonicality boost. Tested: "metta"
surfaces iti27 at #1 and snp1.8 at #5 (was #30); "mindfulness of
breathing" surfaces mn118 at #1.

### Corpus tree-ordering fix — LIVE

`ORDER BY work_slug, position NULLS LAST, id` was interleaving CST
sub-volumes within the same work_slug because `position` restarts
at 1 in every CST file. Within `pli-dn-attha` that meant the tree
showed dn1_p001 → dn2_p001 → dn3_p001 → dn1_p002 → … and the user-
visible effect was: prev/next from DN 1 Brahmajāla cy would jump
cross-volume to DN 3. Fixed by sorting first on the file_root
(id with `_pNNN` stripped) with natural-numeric ordering on the
sub-sutta number so dn1_2 sorts before dn1_10. Verified in browser:
prev from Brahmajāla cy = dn1_0 intro, next = dn1_2 Sāmaññaphala cy.

### "Buddhist" framing copy review — partial

Conservative pass. Replaced "Buddhist canonical texts" / "Pāli
Buddhist canon" in the About subtitle, index.html meta, and
manifest.webmanifest with "Pāli canon and its commentaries".
Em-dashes stripped from the meta descriptions while there. Proper
nouns kept ("Buddhist Hybrid Sanskrit" / "Ancient Buddhist Texts").

### Tag-filter from Tags tab into Search — LIVE (deploy pending)

ATI's `passage_tags` table (3,547 rows across name / subject /
simile / number) was browsable via the existing Tags tab but
couldn't compose with a text query. New flow:

  - TagsView's passage-list view gains a "↗ search within this tag"
    button that routes to /search with the tag pre-applied.
  - /api/search accepts a `tag=type:value` query param, applied
    via EXISTS predicate against passage_tags in every passage /
    translation branch (FTS, vector, RRF) plus the total-count
    query.
  - SearchView shows a clearable "Filter: type: value" chip
    mirroring the translator-chip pattern.
  - URL persists the tag as `?tag=type:value` so the deep link
    survives reload and right-click-new-tab.

Workflow: scholar opens Tags → drills to Similes → Lotus → clicks
"search within this tag" → Search opens with the tag chip set →
types "heart" → sees only passages tagged Lotus that match.

### Desktop column-mode toggle — LIVE

Reader header gains a single cycling icon: Both → Pāli only →
English only → Both. Persists in `localStorage` so the user's
preference sticks across sessions. Only shows when both columns
exist and the viewport is wide (narrow has its own tab toggle).
Icon adapts per state (two-rect / single-rect-P / single-rect-E).

### CST DPD-glossed re-embed — COMPLETE (2026-05-29)

`scripts/ingest/embed_passages_glossed.py --scope=cst` finished.
Every CST passage now carries a DPD English-gloss appendix in its
BGE-M3 vector, so English Meaning queries match commentary content
(the old embeddings were pure Pāli, so cross-language recall was
weak). Verified: `cst_pending=0`, and all 194,710 corpus passages
have a `gloss_version='glossed-v1'` meta row. Smoke test passed —
an English "purification of view" Meaning query returns MN 24
(Rathavinīta, the seven-purifications sutta), DN 2, DN 33.

Two pieces of durable infra came out of this and are committed
(a32635e, d0ee819):
  - **Pickle cache** for the DPD GlossIndex
    (`scripts/ingest/.cache/gloss_index.pkl`, built by
    `warm_gloss_cache.py`): cuts per-run startup from ~30 min of
    Postgres reads to ~0.5 s. Bump `PICKLE_VERSION` in
    `gloss_inject.py` if the DPD source schema changes.
  - **Memory-budgeted dynamic batching**: each GPU batch is sized so
    `rows × max_input_chars² ≤ --mem-budget` (default 85e6), capped
    at `--batch` (16). BGE-M3 attention is O(rows × seq²); the
    longest passages OOM'd a fixed batch on the 8 GB card. This made
    OOM structurally impossible and let the pass finish unattended.
    Lesson learned the hard way: bigger batches were both slower (the
    DPD gloss build is the bottleneck, not the GPU) and OOM-prone.

Proven launch config:
`--scope=cst --batch=16 --gloss-workers=8 --fetch=256`.

HNSW reindex: the post-pass `REINDEX INDEX CONCURRENTLY
idx_passages_embedding` runs slowly on the 256 MB dhamma-pg instance
(graph exceeds `maintenance_work_mem` at ~13k tuples → disk-spill
build path). It is online (CONCURRENTLY), so search stays up, and is
optional — the index was updated in place during the embed and
serves queries fine. Run it manually when convenient if not already
done; it is not a correctness blocker.

### Tier 5 — Soma + Nyanaponika satipaṭṭhāna texts

Two foundational satipaṭṭhāna works added on top of the Tier 4
ingest:

- **BP509S** *The Heart of Buddhist Meditation* (Nyanaponika,
  1962). Part Two is the Mahāsatipaṭṭhāna Sutta (DN 22)
  translation, ingested as a single `dn22` translation row (joins
  Sujato + Thanissaro). Part One (Nyanaponika's essay) and Part
  Three ("Flowers of Deliverance" anthology) become Library
  articles. BP509S uses canonical IAST already so no diacritic
  table needed.
- **BP501S** *The Way of Mindfulness* (Soma Thera). The canonical
  sutta and the commentary excerpts are typeset together
  throughout the body, so it ships as three Library articles
  (Foreword, Introduction, Discourse + Commentary) rather than as
  a per-sutta translation row. Uses the BPS Latin-1 diacritic
  family.

`scripts/ingest/bps-bp509s.mjs` and `bps-bp501s.mjs` registered
in the same `ingest-bps-tier4.mjs` orchestrator (which now
handles BP502S, BP214S, BP509S, BP501S — the not-Tier-2-Bodhi-4
books).

---

## What landed in the second-most-recent session (BPS Tier 1+2 + CST subdivision)

This session moved from "BPS material isn't ingestable because CST
commentary rows are monolithic" to "Tier 1 Vism + Tier 2 four Bodhi
commentary books live in production, with paragraph-precise alignment
to subdivided CST commentary rows."

### CST per-`<p>` subdivision (#9, #10, #13, #14)

Buddhaghosa's commentary on Brahmajāla was one row of 167 KB Pāli.
Now it's 394 paragraph rows of ~420 chars each. Same content, 20x
more retrievable units.

- `scripts/ingest/cst-parse.mjs` — div-nested AND flat-mode parsers
  both honour `mode: 'fine' | 'coarse'`. Fine emits one row per `<p>`,
  with consecutive gatha lines grouped into one verse-row and
  `<p rend="subhead">` propagating as title context for following
  body rows.
- `scripts/ingest/cst-works.mjs` — citation format for paragraph
  IDs ("Sv-a 1 §47" for div-nested, "As §23.5" for flat-mode).
- `scripts/ingest/ingest-cst.mjs` — `--fine` flag forces fine
  granularity (used for Vism Pāli, tagged `role='mula'` in CST but
  content-wise commentary).

Corpus shape after:
  - Aṭṭhakathā: 8,393 monolithic rows → ~91,800 paragraph rows
  - Ṭīkā: 5,109 monolithic rows → ~77,800 paragraph rows
  - Vism Pāli: 187 coarse rows → 3,619 paragraph rows
  - Total fine CST rows: ~173,000 + Vism's 3,619 = ~177,000

Embedding compute: ~9 hours of local BGE-M3 work across the night,
plus a disk-full crash at ~150K rows that triggered volume extension
from 5 GB → 15 GB. Snapshots existed; no data lost.

### BPS Tier 1 — Visuddhimagga (#15)

Ñāṇamoli's translation of the Visuddhimagga, 2,029 PDF pages →
2,727 translation rows + 1 Library article live in prod. License
`bps-online-free` (the BPS Online Edition uses share-alike free-
redistribution terms, distinct from the other Bodhi-4 books'
fair-use posture).

Files:
- `scripts/ingest/bps-bp207h.mjs` — PDF parser. 23 chapters across
  Buddhaghosa's sīla/samādhi/paññā tripartite structure, all
  paragraph-numbered with PTS edition page anchors ([N] markers).
- `scripts/ingest/bps-vism-align.mjs` — chapter-aware alignment.
  Detects chapter boundaries via the "N. <Pāli>niddeso" pattern in
  CST subhead titles, then pairs Ñāṇamoli paragraphs to CST rows
  sequentially within each chapter (proportional when counts drift).
- `scripts/ingest/ingest-bps-vism.mjs` — orchestrator. Emits one
  translations row per Ñāṇamoli paragraph + 1 article for the
  Translator's Introduction.

### BPS Tier 2 — Four Bodhi commentary books (#2)

Bodhi's *All-Embracing Net of Views* (BP209S), *Root of Existence*
(BP210S), *Great Discourse on Causation* (BP211S), *Fruits of
Recluseship* (BP212S). 42 translation rows + 8 Library articles.
License `bps-fair-use`.

Files:
- `scripts/ingest/bps-bp{209,210,211,212}s.mjs` — one per-book
  parser. Each has its own per-PDF diacritic table (BP209S uses
  canonical IAST already, BP210S/211S/212S use the BPS Latin-1
  substitution family).
- `scripts/ingest/bps-align-cst.mjs` — alignment helper with
  `mode: 'subhead' | 'paragraph'` per-book dispatch. BP210S/211S/212S
  use subhead-mode (Bodhi's named subsections → CST subhead-rows).
  BP209S uses paragraph-mode (Bodhi's 9 long paragraph blocks →
  proportional CST paragraph-row distribution; his BP209S has a
  different prose-structure than the other three).
- `scripts/ingest/ingest-bps-bodhi-cy.mjs` — orchestrator. Imports
  all 4 per-book parsers, wires alignment, handles BP209S's extra
  Library articles (Parts III-V are standalone essays not aligned
  commentary).

Alignment quality:
  BP210S: 11 Bodhi sections → 11 CST subheads, **clean 1:1**
  BP211S: 11 → 12, mostly clean with off-by-one near end
  BP212S: 7 → 27, proportional (Bodhi is coarser than Buddhaghosa)
  BP209S: 9 → 394 paragraph rows, proportional distribution

The off-by-one issue in BP210S/211S was traced to a sutta-title-
marker row ("1. Mūlapariyāyasuttavaṇṇanā") incorrectly counted as
a content subhead. `fetchCstSubheads` now filters those via regex
on the "<digit>. <PāliRoot>suttavaṇṇanā" pattern.

### Schema migration (#1)

- `translations.source_book` column added (TEXT, nullable).
- License-string enum documented in `schema.sql`: `cc0`,
  `cc-by-nc-4.0`, `bps-fair-use`, `bps-online-free`.

### Search quality

- Canonicality boost extended to discriminate `pli-vism` from the
  canonical Sutta-Piṭaka mula. The original `WHEN work_role='mula'
  THEN 1.25` lifted Vism alongside canonical suttas (Vism is also
  tagged 'mula' in CST). Now: `WHEN work_role='mula' AND work_slug
  <> 'pli-vism' THEN 1.25`. Verified — "metta" query moved Vism §80
  from #1 to #10; canonical suttas (KN, VB, ITI Mettābhāvanāsutta)
  now top results.

### Reader UX (#12, step 1)

`src/browse/paragraphGroup.js` — pure helper functions for
grouping consecutive paragraph rows by their parent xml_div_id.
`src/browse/ReadingPanel.jsx` — prev/next navigation now operates
on groups instead of individual paragraph rows. For canonical
mula passages (no `_p` suffix), each is its own singleton group;
behaviour unchanged. For fine paragraph rows, prev/next jumps to
the first leaf of the previous/next group instead of an adjacent
paragraph — solves the "click 400 times to cross one sutta-
commentary" problem.

Step 2 deferred: render all paragraphs of the current group
concatenated. Needs a server endpoint to fetch siblings. Without
step 2 the reader still shows ONE paragraph at a time but
prev/next is usable.

### Dual-highlight cleanup

`src/browse/SideBySideReader.jsx` refactored to build the Pāli and
English columns independently — Pāli always renders as
data-segment-marked spans when segment data is present, regardless
of whether English is segmented or an ATI HTML blob. `theme.css`
bumps `.dhamma-seg-hover` opacity from 0.10 to 0.22.
`HANDOFF-DUAL-HIGHLIGHT.md` captures the open question on
extending dual-highlight to non-bilara passages (4 design options
considered, user pick pending).

### Infrastructure

- `dhamma-pg` volume extended from 5 GB to 15 GB (manual `flyctl
  volumes extend` during the mid-ingest disk-full crash). CLAUDE.md
  updated to reflect.
- HNSW index now ~1.3 GB and growing. Task #11 (HNSW rebuild +
  search verify) pending — recommended once Tier 1+2+3 are stable.

---

## What landed in the prior session (search quality + Notes)

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
