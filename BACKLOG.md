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

## ✅ Landed 2026-06-05 (Bodhi stress-test session — deployed + pushed)

Window executed: translation-sentence embed completed (221,073 rows), all
session work deployed to prod and pushed to origin/master (2e51d98). Verified
live by smoke test.

- **English-side Meaning snippets.** The translation half of the
  sentence-chunking work shipped: 221,073 mula `translation` sentences
  embedded, and `attachSentenceSnippets` prefers the closest English sentence
  (`field='translation'` DESC), so English Meaning queries now show an English
  snippet (MN 38 for "dependent origination" went from an off-topic Pali
  sentence to "…consciousness is dependently originated…"). Untranslated
  commentary falls back to the closest Pali original.
- **Sutta → commentary jump.** The reader's "Commentary" section links a mula
  sutta to its CST Aṭṭhakathā + Ṭīkā (`/api/passage/:id/commentary`). DN +
  CST-id via a shared structural locator key; MN/SN/AN SuttaCentral ids via a
  title-bridge to the `…vaṇṇanā` section. Verified live: dn1, mn10
  (Satipaṭṭhāna → Ps-a §958), sn12.1, an3.61. (SN name reuse returns multiple
  candidates; a few suttas resolve ṭīkā only.)
- **Pāli → Sanskrit cognate cross-link.** A Pāli lookup surfaces cross-canon
  cognates (dhamma → dharma · 法); clicking the Sanskrit chip runs a
  language=san lookup into Monier-Williams + Edgerton BHS. Closes the
  "Sanskrit is siloed" gap.
- **Commentary "Pāli only" note** on the Commentaries frontmatter.
- Earlier-window fixes (also deployed): mula sentence-snippet upgrade,
  LIKE-injection fixes, theme-adaptive borders, a11y (contrast, focus-visible,
  reduced-motion, skip link, settings-menu Escape/dialog), corpus resilience,
  `layer` echo, hashchange listener, Buddhist framing, ingest reconnect +
  segmenter fixes.

Still open: the Bodhi stress-test deferrals + audit deferrals below.

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

- **Perf: `/api/compare-stats` full-corpus scan. ✅ LANDED + DEPLOYED
  2026-06-05 (72f2239 + f3a4bd4).** Both fixes shipped, verified live:
  (a) the 3 queries (freq / passages / count) folded into one
  `MATERIALIZED matched` CTE that scans once — byte-identical results vs
  prod across sati / anattā / dhamma / nibbāna / viññāṇa + the q=% /
  no-match / empty edge cases, ~2-2.7x faster on broad terms; (b) two
  `pg_trgm` GIN indexes built `CONCURRENTLY` matching the exact
  `lower(coalesce(original,''))` / `lower(coalesce(translation,''))`
  predicates (both branches needed for a BitmapOr) — `idx_passages_original_trgm`
  (84 MB) + `idx_passages_translation_trgm` (7.6 MB), NOT in schema.sql,
  built via `server/scripts/build-concordance-trgm.mjs` (session
  maintenance_work_mem=384MB, parallelism off, ANALYZE after; no deploy
  during the build). Planner confirmed using BitmapOr over both. Net live:
  selective terms ~10x faster (diṭṭhivisuddhi 673ms, paṭiccasamuppāda 694ms
  vs ~10-12s); broad terms ~2.5x (sati 4.4s) — the broad-term floor is the
  occurrence math (REPLACE/LENGTH) reading ~25k matched rows' text, not the
  filter, so further wins there would need precomputed counts (not pursued;
  diminishing return). Also folded the query input to NFC in `normalize()`:
  a scholar pasting a decomposed (NFD) Pāli term matched nothing
  (NFD "viññāṇa" → 0 vs 5,505 NFC rows); now equal. Verified live.
- **Perf: reader request fan-out.** MED, 🟡 PARTIAL. The server half landed
  with the pagination work (01849d8): `getPassageGroupTranslations` now
  resolves the group through an ids-only `getGroupMeta` helper instead of
  re-pulling full row text, so `/group-translations` no longer re-reads the
  whole division's body. Still open (frontend-only): `usePassage` fetches
  `/api/passage/:id` while `ReadingPanel` also fetches `/group` (which
  already includes the anchor row) — drop the redundant `/passage` call (use
  the `/group` anchor; skip `/group` for singletons). Verify on the dev
  server.
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

## ⬜ Bodhi stress-test deferrals (2026-06-05)

From the read-only Bodhi-persona stress test. The high-value features it
drove (sutta→commentary jump incl. MN/SN/AN, Pāli→Sanskrit cognate
cross-link, commentary Pāli-only note) were built this session; these
remain:

- **Stem-mode diacritic conflation. ✅ LANDED + DEPLOYED 2026-06-06
  (4ba3ce7).** `anattā` in Stem (layer=tika) ranked `Āṇattikathāvaṇṇanā`
  (āṇatti, a different word) #1, because simple_unaccent folds ā/ṇ and
  prefix-stems `anatt:*`. Fixed with a diacritic-exact ranking BOOST (no
  schema/reindex): the Exact/Stem passages branch multiplies the FTS score
  (×DIACRITIC_BOOST=1.6, env-tunable) of rows whose RAW diacritic-preserving
  text contains the exact-grapheme stem at a WORD BOUNDARY (`~ '\m<stem>'`).
  Word-boundary, not substring — `anatt` is a substring of unrelated
  compounds like `dassanatthaṃ` (dassana+atthaṃ), and a substring boost
  re-promoted the āṇatti passage via that coincidence; `\m` only matches a
  token that starts with the stem. Gated to diacritic-bearing query terms,
  so ASCII queries (`sati`, `dhamma`) keep byte-identical ranking (verified
  local==prod). Soft/multiplicative so alias-only matches (anātman/無我/
  not-self) are demoted, not buried. Live: `anattā` stem/tika moved
  Āṇattikathāvaṇṇanā #1→#4, genuine anattā passages now lead; recall
  unchanged (1,301 hits). Residual (accepted): `\m anatt` still matches the
  morphologically-adjacent `anatthaṃ` (harm), which shares the literal
  prefix — separating those would need 6-char stem precision that breaks
  the anatto/anattā inflection recall, so deferred.
- **Long commentary reading. ✅ LANDED 2026-06-06 (01849d8; committed, NOT
  yet deployed).** `/api/passage/:id/group` was merging an ENTIRE division
  into one render. Worst real cases measured against prod: Ps-a mn1_1 =
  1,278 rows / 528 KB, its ṭīkā = 1,148 / 673 KB, and a single-title
  Khuddaka giant `cst-s0514a3.att-8` = 2,799 rows (bigger than the 636 KB
  first estimated; 27 groups exceed 500 rows, 321 exceed 100). Now the
  endpoint returns one windowed page (default 100) plus
  `{ total, offset, window, anchorIndex, sections }`, and `ReadingPanel`
  renders only that window with a navigator above the body: a **Section
  dropdown** (a real table of contents from the subhead titles + citations —
  73 sections for mn1_1, 98 for the ṭīkā) or **synthetic paragraph-range
  buckets** for single-title giants (28 for the 2,799-row one); a
  "Paragraphs a–b of N" status with **Prev/Next paging**; and **Show all**
  (`window=all`) to restore the whole-group render + whole-group find (the
  find count gains an "on this page" qualifier while paged). The window
  starts at the anchor row, so a sutta→commentary jump or deep link lands
  where the reader expects, not at paragraph 1. Singletons and groups that
  fit a single page return whole and the navigator self-hides (the common
  case is byte-unchanged). Verified on a local server vs the prod DB and in
  the browser: windowing, section jump, paging, show-all, and the negative
  cases (90-row group + mn118 singleton hide the navigator).
- **Exact + Title returns 0 for a bare sutta name. ✅ LANDED 2026-06-06
  (cd3ae22; committed, NOT yet deployed).** Pāli titles are compound tokens,
  so "Satipaṭṭhāna" in Exact+Title yielded 0 while "Satipaṭṭhānasutta" hit.
  Fix: `buildTsquery` now takes a per-scope `prefix` override, and the Title
  scope prefix-matches even in Exact mode (aliases stay off, so it is still
  "exact" — no smṛti/念 expansion). Prefix alone flooded the top with
  commentary `…vaṇṇanā` paragraph-rows (they prefix-match too) above the one
  mula sutta — a pre-existing Stem+Title problem, since Exact/Stem rank by
  raw `ts_rank` with no canonicality awareness — so the Title scope now also
  multiplies the score ×6 for mula rows (excluding Vism). Verified local vs
  prod: "Satipaṭṭhāna" 0→77 with mula on page 1 (an4.274, mn10, …);
  "Satipaṭṭhānasutta" leads with the three Satipaṭṭhāna suttas;
  "Mūlapariyāya"→mn1, "Ānāpānassati"→mn118 lead; Exact+All byte-unchanged.
  (DN 22 stays a Stem/All find: its title "Mahāsatipaṭṭhānasutta" starts
  with mahā-, which a start-of-token prefix can't reach.)
- **Cold-start UX. ✅ LANDED 2026-06-06 (afd6343; committed, NOT yet
  deployed).** First Meaning query after a wake waits on the BGE-M3 ONNX
  load (the model is fired at boot but not awaited before `listen`, so on
  prod's shared CPU it is ~tens of seconds to ~100s). New `GET /api/warm`
  kicks off `embedReady()` and returns `{ warm, warming }` immediately (and
  wakes an auto-stopped machine); `SearchView` pings it once on mount + polls
  until warm, so the load overlaps the user's typing; while a Meaning query
  loads on a still-cold model the status line reads "Warming the semantic
  index…" instead of "Searching…". One-shot ping (no steady interval) so it
  doesn't fight auto-stop. Verified the endpoint + the Search-mount ping
  locally (dev box loads the model in ~3.7s, so the warming note itself only
  shows on prod's slower CPU).
- **Commentary English entry points.** Commentary is ~3-4% translated.
  Prioritize the interlinear DPD gloss for the att/tik tier (the only
  reading aid for non-fluent readers there) and author a Docs page on the
  English→Pāli-commentary Meaning path (Docs currently unauthored). The
  concordance pg_trgm + single-CTE perf fix is already in the
  Next-maintenance-window checklist above.

---

## Scholar stress-test (2026-06-06 — Therīgāthā "trigger→insight" query)

From a read-only scholar query (Dhammā Therī Thīg 1.17: is "awakening on a
mundane trigger" a real Theravāda topos or a translation artifact? — answer:
canonical, recurrent, `atha cittaṁ vimucci me` cluster across Therī-/Thera-gāthā).
The dictionary + Pāli phrase search carried the inquiry. Three candidate gaps
were filed; deep verification (local server vs prod DB over the flyctl proxy)
**reduced three claims to one real bug + one real sub-bug + two retractions.**

> **Methodology caution that mattered here.** Two of the three originally-filed
> "bugs" were *test-harness artifacts*: the Windows Git-Bash shell silently
> strips Pāli diacritics from `printf`/`curl --data-urlencode` payloads, so
> `q=ādīnava` reached the API as ASCII `adinava` and legitimately matched
> nothing. **Verify Unicode-bearing API claims with a harness that can't mangle
> bytes** (Node `fetch` + `encodeURIComponent`, or hardcoded `%`-escapes) — not
> shell-built curl on Windows — before filing a "returns 0" bug.

### ✅ Landed 2026-06-06

- **Commentary jump now covers Therīgāthā / Theragāthā.** `/api/passage/
  thig1.17/commentary` was empty even though Thīg-a is in the corpus
  (`pli-kn-attha`). Two causes in [`getCommentaryFor`](server/src/corpus.js:305):
  the `SUTTA_NIKAYA_SLUGS` guard lacked `pli-thig`/`pli-thag`; and the
  title-bridge derived the commentary slug from the SC id's leading letters
  (`thig`→`pli-thig-attha`) but Thīg-a/Thag-a live under `pli-kn-attha`/`-tika`.
  Fix: added the two slugs to the guard + remap `nik` `thig`/`thag`→`kn`. The
  existing heading prefix-match then resolves per-verse. Verified: thig1.17 →
  "17. Dhammātherīgāthāvaṇṇanā", thig5.10 → Paṭācārā, thag1.1 → Subhūti; DN/MN
  unregressed; commentary rows still return empty. (Shared verse-names return
  multiple candidates, like the documented SN behaviour.)
- **Niggahīta fold in `/api/compare-stats`.** ṁ (U+1E41, SuttaCentral) and ṃ
  (U+1E43, CST) are the same grapheme, but the concordance gave different
  counts for the same word (`arahattaṁ` → 119 vs `arahattaṃ` → 7,454) — two
  layered causes: (1) the `paliStem` suffix table is dot-below only, so a
  dot-above query never strips its `…aṃ` ending → narrower probe; (2) literal
  substring matching never folded the two forms. Fix in
  [compareStats.js](server/src/compareStats.js): fold query niggahīta to
  dot-below *before* stemming, then OR both forms at match time (can't fold the
  indexed column without losing the pg_trgm GIN index). Verified: `arahattaṁ` ≡
  `arahattaṃ` → 7,454/4,502; non-niggahīta terms and phrase counts unchanged.
- **Diacritic-exact search boost retuned 1.6 → 4.0.** The prior-session
  `DIACRITIC_BOOST` default in [search.js](server/src/search.js) was too weak
  to reorder anything (Āṇattikathāvaṇṇanā still ranked #1 for `anattā` in
  layer=tika). Measured against prod: the exact/folded ordering flips just
  above 1.6 and is stable from ~2.5 through 8; 4.0 gives ~2× headroom without
  over-demoting alias-only matches. Verified live: genuine
  Anattalakkhaṇasuttavaṇṇanā now surfaces, Āṇatti drops out of the top.
- **Awakening census + Research tab (the `/#/research/awakening` study).** A
  114-agent classification pass (90% inter-rater agreement on a 520-passage
  re-check) over the 4,023 attainment-marker passages → 2,214 awakening events
  classified by precipitating circumstance and split canon vs commentary.
  Headline: hearing the Dhamma ≈ 61% of stated-occasion events, formal
  striving ≈ 28%, discrete external trigger ≈ 7%; ~80% of all narrated events
  are commentarial. New **Research** sidebar + mobile-menu tab
  ([ResearchView.jsx](src/ResearchView.jsx)) renders the full cited document
  (two tables, clickable circumstances → complete cited lists → passage
  reader). Dataset bundled at `public/research/awakening-events.json`,
  recovered from the workflow agents' journaled output.
- **Router deep-link fix (latent, found while wiring Research).** Dhamma's
  URL-writer stripped the hash to bare pathname when a self-managed view
  (library/docs/tags/research) left `hash=''` to mean "leave my deep link
  alone", breaking cold-load deep links + the back stack for those views. It
  now bails instead of stripping. Also restored the TopNav mobile-menu mirror
  (it had drifted, missing Docs + Research).

### Retracted (not bugs)

- ~~"compare-stats silently returns 0 for valid terms (`ādīnava`,
  `satipaṭṭhāna`, …)"~~ — **false alarm** (shell diacritic-stripping). Properly
  encoded, prod returns `ādīnava` 4,138/1,812, `satipaṭṭhāna` 3,077/1,333.
- ~~"no phrase-frequency primitive / multi-word → 0"~~ — **false.** compare-stats
  already counts contiguous phrases: `"atha cittaṁ vimucci me"` → 3,
  `"vimucci me"` → 50. The "39 vs 3" inconsistency was the same shell artifact.

### Still open (small)

- **Diacritic-free input returns 0 with no hint.** LOW. `adinava` /
  `satipatthana` (no diacritics — common, since typing ā/ṭ/ṇ is hard) match
  nothing in the concordance, because folding macrons/retroflexes would
  conflate distinct words (the known `anattā`/`āṇatti` precision tension), so
  the concordance correctly does *not* fold them. But a bare 0 reads as
  "absent." Right fix is a UI hint ("no matches — try with diacritics, e.g.
  ādīnava") or an opt-in folded retry, not silent folding. The dictionary
  lookup (recall-oriented) already folds via `foldDiacritics`; the concordance
  (precision-oriented) deliberately doesn't — document the asymmetry.

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
