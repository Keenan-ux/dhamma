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

### 2026-06-05 (sentence embed complete + scholar stress-test, deployed)
- **Sentence-snippet upgrade live** (see the detailed entry under the former
  "Not started" list). 507,777 mula sentences embedded; vector-only Meaning
  hits now show a sentence-precise snippet.
- **Scholar stress-test audit fixes** (branch `audit-fixes-2026-06-05`,
  merged to master, deployed + smoke-tested):
  - LIKE-metacharacter escaping in `/api/compare-stats` + `/api/lookup`. A
    bare `%` had matched all 194,710 passages (a ~15s scan); `s%t` returned
    spurious dictionary hits. Verified live: `compare-stats?q=%` now returns
    0, `lookup?term=s%t` returns a clean no-match, normal queries unchanged.
  - Theme-adaptive `--bc-border-rgb` / `--bc-loss-text-rgb` tokens replacing
    ~20 `rgba(255,255,255,a)` borders that were invisible on the light
    parchment, plus two literal error colors. Dark mode byte-identical.
  - `useCorpus` resilience: a single `/api/corpus` timeout no longer caches
    the rejection forever and bricks the SPA on "Loading the canon…"; adds a
    retry() + an honest error state in CanonMapView.
  - Search-input aria-labels, Concordance title h2 to h1, PassageCard
    aria-label fallback, CompareView null guard.
- **Gloss `(gram)` down-rank live** (commit bf0472a): `apaccaya` to
  "causeless", `manti` to "minister". The `sato` homograph is the known
  residual (no field-only fix; see the gloss-disambiguation note below).

- **Blurb retrieval lane** (Chat 1). `blurbs` table = 4,173 rows, all embedded,
  0 orphans; `vec_blurb` added as the 4th RRF lane in `search.js`. Functional
  prod smoke pending deploy.
- **ATI index → `passage_tags`** (Chat 2). Populated: audience 3,815 · name
  1,780 · title 905 · subject 878 · simile 546 · number 343.
- **Audience facet + Browse chip filter** (Chat 2). `audience` tag_type derived
  for 3,567 passages; facet counts from `/api/corpus`; chip row in BrowseView.
- **Docs section** (Chat 3). `DocsView` renders `articles WHERE category='docs'`
  + Sidebar entry. 4 docs authored and ingested 2026-06-04 (see "Docs content").
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
- **Interlinear gloss (reader)** — 2026-06-04. Toggle in the reader (⋯ menu)
  renders each Pāli word over its DPD gloss; `/api/gloss` + `glossWords`
  resolve surface to inflection to entry. Lemma disambiguation tuned to
  primary-sense-first. The residual homograph case is tracked under "Gloss
  morphological disambiguation" below.
- **Docs content** — 2026-06-04. Four docs authored + ingested
  (`category='docs'`): How search works, About the corpus, Dictionary
  coverage, Sources and licenses. The `/api/library` list handler was also
  fixed to serve non-ATI categories so the Docs tab populates.

---

## ⬜ Deferred from the 2026-06-05 audit (found + scoped, not yet applied)

The 2026-06-05 read-only audit (a11y / perf / ingest fan-out + scholar
stress-test) produced more than was applied this session. The HIGH-severity
a11y (contrast, focus-visible, reduced-motion, skip link, settings-menu
Escape/dialog), both ingest bugs, the LIKE-injection fixes, theme-adaptive
borders, the corpus-resilience fix, the `layer` echo, the hashchange
listener, and the Buddhist framing pass all LANDED (commits this session).
These remain:

- **Perf: `/api/compare-stats` full-corpus scan (~10-16s).** HIGH. It scans
  all 194,710 rows (REPLACE/LENGTH occurrence math + un-indexed LIKE) and
  runs the scan 3x per request (freq, passages, count). Two fixes, both
  deferred because they need testing/DB-ops not safe to rush mid-embed:
  (a) fold the 3 queries into one CTE that scans once into a `matched` set,
  then derives freq + top-N + count from it (code-only, ~3x win, but an
  untested SQL rewrite, so verify with a local server against prod DB AFTER
  the translation embed finishes, before deploying); (b) a `pg_trgm` GIN
  index on `lower(original)`/`lower(translation)` to prefilter the LIKE, as a
  deliberate maintenance-window `CREATE INDEX CONCURRENTLY` (RAM-bumped, NOT
  schema.sql, same caution as the HNSW). Do (a) first; (b) only if still slow.
- **Perf: reader request fan-out.** MED. `usePassage` fetches
  `/api/passage/:id` while `ReadingPanel` also fetches `/group` (which already
  includes the anchor row), and `/group` + `/group-translations` re-run the
  sibling query. Drop the redundant `/passage` call (use the `/group` anchor;
  skip `/group` for singletons), and fetch only ids in
  `getPassageGroupTranslations`. Frontend-only; verify on the dev server.
- **a11y MED/LOW remaining** (HIGH items already landed): `aria-pressed` on
  the single-select toggle groups (DictionaryView Match, SearchView filter +
  translator chips); `role=group`/`toolbar` on the aria-labelled diacritic
  rows / Match row / translator-chip rows; full ARIA tab semantics
  (tabpanel + aria-controls + roving tabindex/arrow keys) on the two
  tablists (CanonMapView piṭaka selector, ReadingPanel mobile column toggle)
  OR convert them to an aria-pressed button group; `role=dialog` + Escape +
  focus management on NoteEditor + LookupPanel; Escape + arrow-nav on the
  ReadingPanel overflow menu; `role=toolbar` + Escape on the selection
  popover; `role=tree`/`treeitem` + aria-expanded on TreeLevel;
  `aria-hidden` on decorative icon SVGs. All low-risk, none blocking.
- **Gloss context-disambiguation (approach b) — DESIGN done, build deferred.**
  The audit confirmed the prior conclusion: a static field cannot fix the
  `sato` homograph; only sentence context can. Key finding:
  `dictionary_entries.embedding` is ALREADY populated, so the only new embed
  at request time is the surrounding sentence (passage_sentences already has
  it). Design: extend `glossWords(words, { sentences })`; with no context it
  is byte-identical to today (no regression). With context, pull top-K
  candidates per surface and pick argmax of cosine(sentence_vec,
  candidate.embedding), gated by a margin so confident base forms never flip.
  Recommendation: do NOT add request-time embedding to the interactive
  interlinear toggle (the ~101s cold-start would brick it). The correct, fast
  version is a PRECOMPUTE table `passage_gloss(passage_id, position, surface,
  entry_id)` filled by a batch GPU pass (modeled on embed_sentences.py),
  served with zero request-time embed. That is a later maintenance-window op
  (cannot run now: the GPU is busy) and is low-priority polish. A cheap
  heuristic-only opt-in tier (token overlap + grammar-field cues, gated) is
  the only piece shippable cheaply if wanted sooner.
- **QA the translation sentences after the embed.** The segmenter ASCII-
  ellipsis hardening landed AFTER the 221,073 translation sentences were
  segmented with the old splitter. English translations rarely contain the
  spaceless `...pe...` pattern, so impact is likely nil, but once the
  translation embed completes, spot-check `passage_sentences WHERE
  field='translation'` for letterless/garbage fragments; if any, delete +
  re-segment those passages with the fixed splitter (only after the embed,
  never while it writes).

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
## ⬜ Not started

- **Gloss morphological disambiguation (residual).** `glossWords` in
  `server/src/dictionary.js` ranks candidates by DPD source, lemma-form
  match, a down-rank of `(gram)`-prefixed senses (landed 2026-06-04: 461
  surfaces moved off a metalinguistic gloss, e.g. apaccaya to "causeless",
  manti to "minister"), then DPD primary sense. That
  nails base-form words (majjhima to "middle", maggo to "path", bhikkhave to
  "monks") but a surface that is a grammatical homograph with NO lemma-form
  match still gets the primary sense regardless of context, e.g. `sato`
  (genitive of sant "being" vs sati "mindfulness") glosses as "when being".
  Fixing this needs POS / morphology-aware or context-aware disambiguation
  (use DPD's grammar field, or score senses against the surrounding sentence).
  Affects both the interlinear gloss and the hover-tooltip gloss. Low priority,
  no AI required.
  - **Investigated 2026-06-04 (read-only): no safe field-only fix; defer to
    context-scoring on top of the sentence work.** Two corrections to the
    framing above: (1) `sato` is NOT a "no lemma-form match" case. DPD ships a
    declined-form stub `lemma='sato'` ("prp masc gen sg of santa, when being")
    that actively WINS tie-break (2); the bug is "a narrow oblique-participle
    stub wins as a lemma-form," not "no lemma exists." DPD has 1,763 such
    declined-form stubs; 2,337 surfaces are currently glossed by one, 1,586 of
    those with a non-stub alternative. (2) The obvious fix (demote stubs below
    non-stub candidates) REGRESSES: of the 1,586 flips, most are declensional
    pronouns/nouns where the stub was the correct precise gloss (`passato` →
    "side; rib", `tuyhaṃ` "for you" → "you", `mayi` "in me" → "I", `imasmā`
    "from this" → "this"). Only ~86 land on a participle. So a field-only
    tie-break cannot work; the discriminator is context, not a field. DPD's
    `pos` and `grammar` are 100% populated but at the entry/lemma grain, not
    the surface grain, so they cannot say which reading a given occurrence is.
    A curated override `Map` (e.g. `sato` → sati "mindful") is mechanically
    clean but each key is a scholar judgment with downside (a blanket `sato`
    override is wrong in genitive-absolute constructions). The real fix is
    sentence-context scoring, which wants the surrounding sentence already in
    hand: do it ON TOP OF the `passage_sentences` infrastructure now landing,
    not as a standalone change.
- **Dictionary expansion.** Next per DICTIONARIES.md: CPD, then
  Buddhadatta. (DPD, DPPN, PED, MW, BHS are done.) CPD blocked on an email
  reply (`CPD_EMAIL_DRAFT.md`).
- **Sentence-level snippet upgrade. ✅ LANDED + DEPLOYED 2026-06-05.**
  `passage_sentences` holds 507,777 mula `original` sentences, all embedded
  (BGE-M3 GPU pass, ~5.6h, 25 rows/s). `attachSentenceSnippets` in
  search.js replaces the first-200-char fallback for vector-only Meaning
  hits with the best-matching sentence per passage (per-passage ANN over
  `idx_psent_passage`; no global HNSW, deferred like the blurbs index since
  the snippet scan is per-passage). Verified live: MN 38 / SN 12.15 now
  show sentence-precise snippets instead of the generic opener. Follow-ons:
  the `field='translation'` half (English-side snippets), then the
  full-corpus scope decision. See RE-EMBED-PLAN.md.
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
> below are retained as the design/build record. **Sentence chunking LANDED
> 2026-06-05** for the mula `original` lane (507,777 sentences embedded,
> snippet upgrade deployed). The `field='translation'` half and full-corpus
> scope (A) remain as follow-ons.

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
