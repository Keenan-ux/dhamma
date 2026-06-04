# Dhamma — open backlog

The open-queue register for the Dhamma Ingest Coordinator. `HANDOFF.md` is
the master state doc (what's live + how to verify); this file is the
forward queue (partial + not-started + new ideas). Keep it current as
items land. Tone: scholarly, plain. No marketing.

Status key: ✅ landed (verified) · 🟡 partial / in-flight · ⬜ not started · 💡 new idea

> **Doc-staleness warning (2026-05-29).** Independent verification during the
> 3-chat parallel round found that CLAUDE.md's "Open backlog" and the first
> draft of this file listed several items as not-started/partial that are in
> fact already built (bookmarks, side-by-side viewer, citation export, notes,
> populated `articles.embedding`). The repo is ahead of the prose docs. Trust
> the live DB + `src/` tree over the narrative. CLAUDE.md "Open backlog"
> deserves a refresh pass.

---

## ✅ Landed & verified (2026-05-29 parallel round + prior sessions)

Verified by build (green, 74 modules), live DB queries, and FK-integrity checks:

- **Blurb retrieval lane** (Chat 1). `blurbs` table = 4,173 rows, all embedded,
  0 orphans; `vec_blurb` added as the 4th RRF lane in `search.js`. Functional
  prod smoke pending deploy.
- **ATI index → `passage_tags`** (Chat 2). Populated: audience 3,815 · name
  1,780 · title 905 · subject 878 · simile 546 · number 343.
- **Audience facet + Browse chip filter** (Chat 2). `audience` tag_type derived
  for 3,567 passages; facet counts from `/api/corpus`; chip row in BrowseView.
- **Docs section** (Chat 3). `DocsView` renders `articles WHERE category='docs'`
  + Sidebar entry. *Built; 0 docs authored yet — content is a separate task.*
- **Vinaya citation formatting** (Chat 3). `PLI-TV-BI-VB-PJ1-4` → clean form.
- **Translator-attribution fix** (Chat 3, unbriefed). `formatCitation` no longer
  hardcodes "Trans. Bhikkhu Sujato" for every Theravāda translation.
- **Library article embedding** — `articles.embedding` is fully populated
  (407/407). Library Meaning search was already unblocked.
- **v3 transformers migration** — ALREADY DONE. Both package.json files are on
  `@huggingface/transformers ^3` (with the onnxruntime-node 1.17 override);
  embed.js / embed-articles.mjs / embed-blurbs.mjs use the v3 `dtype: 'q8'`
  API. The library flip is complete and did NOT require a re-embed (only a
  model swap would). Found during the 2026-05-29 agent run.
- **Per-passage bookmarks**, **side-by-side parallel reader**, **per-passage
  notes**, **citation export button** — all built in prior sessions
  (BookmarksView/useBookmarks, SideBySideReader, NotesView/useNotes,
  citationFormat wired into PassageCard + ReadingPanel).
- **Metta / primary-text recall gap — RESOLVED (verified 2026-06-04, live DB).**
  The earlier note (found during the BLURB_WEIGHT A/B at weight 2.5) said the
  query "loving-kindness meditation" never surfaced Snp 1.8 Karaṇīyamettā in
  the top 6. Re-verified against the live DB with the landed code: both root
  causes were already covered. `snp1.8` IS in `PRIMARY_TEXTS` (carries the 2.5×
  boost), and the mettā↔loving-kindness alias IS present in `seed-aliases.sql`
  and fires in Meaning mode (the embedding-query expansion adds the full mettā
  synonym set). The fix was the BLURB_WEIGHT 2.5→1.0 tune (commit 661eec9):
  the 2.5 weight was burying the primary text under blurb-only hits. Current
  top-6 for "loving-kindness meditation": kp9, **snp1.8 (#2)**, iti27, sn47.30,
  ud3.5, sn10.4. For plain "loving-kindness": iti27, kp9, **snp1.8 (#3)**,
  an4.32, iti22, sn20.4. No code change needed.

---

## 🟡 Partial / in-flight

- **HNSW reindex after the gloss re-embed — NOT done; do NOT casually re-run.**
  `REINDEX INDEX CONCURRENTLY idx_passages_embedding` on the 256 MB
  `dhamma-pg` instance ran for **4+ hours** on the disk-spill path (graph
  ~1.9 GB ≫ `maintenance_work_mem` 64 MB) and **caused a prod outage on
  2026-05-29**: it held a SHARE UPDATE EXCLUSIVE lock on `passages` that
  blocked the app's boot-time schema apply (`db.js` runs `CREATE INDEX IF
  NOT EXISTS` on passages before `listen()`), so every app cold-start hung.
  Resolution: `pg_terminate_backend` the 3 reindex backends → locks released
  → app booted; dropped the invalid `idx_passages_embedding_ccnew` artifact.
  The valid `idx_passages_embedding` is intact and serves search fine (the
  embed did in-place vector updates; recall is marginally degraded by graph
  churn but functional). **A reindex is genuinely optional and must be a
  deliberate maintenance-window op** — temporary `dhamma-pg` RAM bump +
  higher `maintenance_work_mem`, and NO concurrent `flyctl deploy` (the
  cold-start lock conflict). Lower priority than it looks.
- **Blurbs HNSW index — deferred.** `idx_blurbs_embedding` is intentionally
  NOT built (removed from schema.sql after it hung a boot — see incident
  above). The `vec_blurb` lane runs on a seq scan (<10 ms for ~4 k rows).
  Build it as a deliberate `CREATE INDEX CONCURRENTLY` one-off only when
  blurbs grow enough to need it. **Standing rule: never put an HNSW build
  in schema.sql** — it is applied on every boot before `listen()`.
- **Docs content.** The Docs *section* ships; the docs themselves
  ("How search works", "About the corpus", "Dictionary coverage") need
  authoring + an UPSERT with `category='docs'`.

## ⬜ Not started

- **Interlinear gloss.** Render each Pāli word with a small English gloss
  above/below using DPD inflections. No AI needed — the gloss data is the
  same DPD inflection table the embed pass uses.
- **Dictionary expansion.** Next per DICTIONARIES.md: CPD, then
  Buddhadatta. (DPD, DPPN, PED, MW, BHS are done.) CPD blocked on an email
  reply (`CPD_EMAIL_DRAFT.md`).
- **Sentence-level snippet upgrade.** `/api/search` currently returns the
  first ~200 chars. Sentence-level snippets need schema work. See the
  sentence-chunking idea below — they're the same project.
- **AI-assisted draft translations.** `TRANSLATIONS-AI.md` carries the
  design. Pilot: DN 1 Aṭṭhakathā vs BP209S gold standard. Needs user
  decisions on model / UX / storage. Gated by the "no LLM synthesis by
  default" rule — opt-in, clearly labeled AI-generated.
- **Email Access to Insight / BCBS** announcing the mirror once everything
  is ingested and displaying well (CC BY-NC 4.0 preservation).

---

## 💡 New ideas — from abuddhistview.com (ABV)

ABV does vector search of suttas with **three retrieval lanes** fused by
RRF. We have the equivalent of two of its lanes already (FTS over
`fts_doc`; vector over `passages.embedding`), plus a third they lack
(`vec_t` over `translations.embedding`). The ideas below are the lanes /
facets worth borrowing. A retrieval lane = (text chunks) → (embedding) →
(vector index) → (ANN query → ranked list); RRF merges the lanes.

> **Status:** Blurb lane, Audience facet, and Docs/posts **LANDED** in the
> 2026-05-29 parallel round (see ✅ section above). The detailed write-ups
> below are retained as the design/build record. **Sentence chunking remains
> the one unbuilt ABV idea** — it's the big, disk-heavy one.

### Blurb lane (Effort: M) — highest value, smallest surface

ABV's clever lane: vector search over ~1,600 curated one-paragraph
**blurbs** (SC bilara summaries of what each sutta is *about*). A blurb is
short and densely thematic, so its embedding isn't diluted by thousands of
chars of surrounding narrative. Query "Buddha waves his hand and teaches
monks how to behave around families" → the SN 16.3 blurb says roughly that
→ ranks high even when the body-text lanes drown it.

Model-agnostic: BGE-M3 (1024-d) substitutes cleanly for ABV's Voyage
`voyage-3-large` (also 1024-d) — no schema change to a `blurbs.embedding
vector(1024)` column, and if we later add SC Chinese parallel blurbs they
land in the same multilingual space.

Blurbs already on disk: `scripts/ingest/.cache/bilara-data/root/en/blurb/`
(~1,600 across 73 JSON files).

1. Add table `blurbs(passage_id, blurb, embedding vector(1024))` + HNSW
   index — `server/sql/schema.sql`.
2. New ingest script: walk the blurb JSONs, UPSERT keyed on passage_id.
3. Batch-embed via BGE-M3 (one-shot, ~1,600 items, seconds locally).
4. Add a fourth `vec_blurb` lane to the RRF fusion in `server/src/search.js`
   (already fuses FTS + passages.embedding + translations.embedding).

No changes to existing tables. Smallest-surface, highest-signal addition.

### Audience facet (Effort: M) — schema already exists

Filter suttas by intended audience (monks / nuns / laypeople / kings /
brahmins / devas). `passage_tags(passage_id, tag_type, tag_value, source)`
already exists, so schema work = zero.

1. Curate the audience mapping (the long pole). Mine: ATI `index-*.html`
   files (already on disk), sutta intros, DPPN. Insert as
   `tag_type='audience'`.
2. Extend `server/src/corpus.js` to return facet counts.
3. Add a chip-filter row above the tree in `src/BrowseView.jsx`; narrow
   `collectLeaves` against the tag set.

Unblocks the broader ATI tagging work — similes / names / subjects /
titles / number all share `passage_tags`.

### Docs / posts section (Effort: S) — pure content + UI

Author short site docs ("How search works", "About the corpus",
"Dictionary coverage"). The `articles` table already exists with a
free-form `category`; `/api/library` + `/api/library/:slug` already serve
it.

1. Author a few markdown docs.
2. New ingest script UPSERTing them with `category='docs'`.
3. Sidebar entry in `src/Sidebar.jsx`; render via a `DocsView` filtering
   `category='docs'`.

No backend or schema work.

### Sentence chunking (Effort: M, disk-heavy) — real cost

Sentence-level retrieval (and sentence-level snippets — same project).
~5.7M sentence rows × 1024-d ≈ 20 GB; current `dhamma-pg` volume is 15 GB,
so **volume extension is the prerequisite**.

1. Extend the Fly volume (we went 5→15 GB once; would need ~30 GB).
2. New table `passage_sentences(passage_id, position, text, embedding)` +
   HNSW.
3. Modify `scripts/ingest/embed_passages_glossed.py` to sentence-segment
   before embedding (regex on `.!?।`).
4. Full re-embed pass — ballpark a week of background runs at current
   throughput.
5. In `search.js`, replace the first-200-char snippet fallback with an ANN
   subquery into `passage_sentences` for the best-matching sentence.

Note: the CST per-`<p>` subdivision already partly solves this for
commentary (300–500 char paragraph rows). So the marginal win of
sentence-level is mostly on Tipiṭaka mūla + ATI Library, not
Aṭṭhakathā/Ṭīkā. Weigh against the disk + week-of-compute cost.

---

## Design notes / resolved decisions

### Cross-lingual search: we do NOT embed per language

Recurring question: for English (or other-language) queries against Pāli,
isn't embedding every language wasteful — why not translate the query to
Pāli, or search translations and map back?

Resolved. The architecture already has two complementary cross-lingual
mechanisms, and a third (query-translation) is correctly avoided:

1. **One multilingual vector space (BGE-M3).** `passages.embedding`
   (`vec_p` lane) puts ALL languages into one shared 1024-d space, so a
   query in any language matches Pāli directly with NO translation step.
   This is why BGE-M3 was chosen and why we never embed a separate index
   per query-language. A future Chinese/Sanskrit query needs zero new
   work on the query side; new-language *corpus* text (e.g. Chinese Āgama
   parallels) would embed into the same space, not a separate one.

2. **Translation lane already built (`vec_t`).** This IS the "search
   English, map back to Pāli" idea — already implemented. `translations`
   has a populated `embedding` column (9,652/9,652 embedded), and
   `search.js` runs a `vec_t` lane that ANN-searches translation vectors
   and maps to their passages. Its own comment: it "closes the
   cross-lingual gap on ~11,609 CST passages" that have translations,
   where English↔English matching beats bridging through BGE-M3's Pāli.

3. **Why the gloss-injection re-embed was still needed** (not redundant
   with the above): ~89% of the corpus — commentary + sub-commentary
   (~173,684 of 194,710 passages) — has NO English translation, so the
   `vec_t` lane is empty for them. Injecting DPD English glosses into
   their `passages.embedding` text sharpened `vec_p` specifically for that
   untranslated bulk. It complements the translation lane; it doesn't
   duplicate it.

4. **Query-translation (English query → MT to Pāli → search) is the weak
   option** and was correctly not pursued: Pāli is low-resource, general
   MT won't reliably produce e.g. "purification of view" → *diṭṭhivisuddhi*
   — that term mapping is exactly what the DPD + alias table encode, not
   what an MT generates on the fly.

Net: adding a new query language is free (BGE-M3 handles it); adding a new
language's *translations* becomes another `vec_t`-style lane; we never
maintain a per-language embedding of the whole corpus.
