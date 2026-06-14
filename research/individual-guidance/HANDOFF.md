# Individual-Guidance Study — Internal Methods & Handoff Log

This is the *internal* companion to the published paper (which lives, process-free, in the
`IndividualGuidanceStudy` component in `src/ResearchView.jsx`). Per the `/dhamma-research`
standard, orchestration and tool-friction live here and never bleed into the paper. The paper
keeps a real Methods section (the reproducible *what*); this file keeps the *how*.

Two public artifacts:
- **Dataset** — `public/research/individual-guidance.json` (v1.1).
- **Paper + renderer** — `IndividualGuidanceStudy` in `src/ResearchView.jsx`, admin-gated via the
  existing Research tab (`Dhamma.jsx` gates `tab==='research'` on `isAdmin`).

---

## State

- **Phases 1–3** (frozen pre-registration; `kammaṭṭhāna` SQL reconfirm; the 55-instance audited
  census) were complete before this phase (commits `6a6d0f7`, `d22f9e0`).
- **Phase 4b–4d** (this session): the renderer, the paper, the editorial passes, deploy.
  - Commit `3db9b1f` — renderer + paper + dataset v1.1.
  - Live at https://dhamma.fly.dev (admin-gated Research tab → "How an Individual Is Guided Toward Awakening").

## What was built (4b–4c)

- `ENTRIES` gained `{ slug:'individual-guidance', … }`; `ResearchView` branches the open entry to
  `IndividualGuidanceStudy` vs `AwakeningStudy` on slug. The new component mirrors `AwakeningStudy`:
  same scroll/back/escape handling, same academic styles (`--bc-*`, serif, gold rules), the data
  fetched once from the static JSON.
- Tables, all hyperlinked (`#/read/<id>`): guidance-group × layer; mode × layer; criterion × layer
  (the headline canon-vs-commentary contrast — defilement/situation are canonical keys, temperament
  is the commentarial key); the 15-cell **H0/H1 warrant ledger** with a per-cell warrant-tier badge;
  the expandable appendix (every instance, per group, with verbatim Pāli + gloss + warrant +
  verification).
- The reader's **decision-aid**: a `[canon]` self-applicable defilement→antidote table (Meghiya
  logic, AN 9.3, extended by AN 6.107 for delusion→wisdom), and a `[comm]` descriptive carita
  matrix with the teacher-assigned + heart-blood-colour caveat. No single "your object is X" verdict.
- The paper prose is authored inline in the component (as `AwakeningStudy` carries its prose).

## Dataset v1.1 normalization (rationale)

The audited v1.0 left two H0 commentarial cells with `warrant: null` (the delusion- and
intelligence-temperament cells), which the census synthesis itself flagged as "owed before freeze"
(`census-digest.txt`, NEXT QUERIES OWED → "NORMALIZE the warrant column"). The synthesis records the
Cūḷaniddesa (`cnd19`) as the live-verified para-canonical warrant for the moha/vitakka/ñāṇa
carita-keyed cells. This session re-confirmed `cnd19` live (`/api/passage/cnd19` carries
`mohacaritassa`, `vitakkacaritassa`, `ñāṇacaritassa`, `uddese`, `vipassanānimittaṁ`), then set those
two warrants to `cnd19`. **No `h_class` changed**, so the 8 H0 / 7 H1 split over the 15 decidable
cells is untouched; the change only fills the warrant ids so the ledger renders clean clickable
warrants and the para-canonical tier is visible. Version bumped 1.0 → 1.1 with a `version_note`.

### Warrant-tier assignment (the ledger's Tier column)

Tier is carried as a presentation map in the renderer (`CELL`), one entry per decidable cell, and
sums to the headline "4 of 8 H0 rest on para-canonical, 4 on the four Nikāyas":
- **mūla (4):** carita-origin survey (Sv-a 1 §218, warranted by the DN Brahmāyācana survey narrative),
  greed→foulness, hate→love, discursive-thought→breath (all on the Meghiya/AN 6.107 antidote formula).
- **para-canonical (4):** the full six-cell matrix (rests on the Niddesa for the cells the antidote
  formula does not cover), delusion (cnd19), intelligence (cnd19), cariyā-definition (Paṭisambhidāmagga).
- **none / innovation (7 H1):** the 5 F1 carita-misassignment narratives + faith→six-recollections
  keying + the heart-blood-colour diagnostic.

The full-matrix cell is tiered para-canonical (not mūla) because its non-rāga/dosa/vitakka cells have
no four-Nikāya antidote; this is the defensible split and matches the synthesis caveat that 4 of 8 H0
cells rest outside the four primary Nikāyas.

## Editorial passes (4c)

1. **De-AI copy-edit** — a separate editor persona against `EDITOR-CHECKLIST.md`. Result: zero
   em-dashes in the paper from the first draft (gate met); a handful of AI-tell rewrites applied
   ("Three results stand out" → "follow"; "the sharpest statement for our purposes" → "the statement
   closest to this study"; "durable contribution" → "lasting contribution"; trimmed the thrice-repeated
   "faithful in principle, innovative in apparatus" slogan to one full statement; varied "residual";
   split over-long sentences).
2. **Adversarial peer review** — three personas (Pāli philologist, meditation-studies scholar,
   methodological skeptic), run as a parallel review pass. All three returned *accept-with-revisions*.
   Every must_fix and should_fix was applied; the substantive ones:
   - **Skeptic (must_fix):** do not dress tool-degraded negatives as proven. The §D "no Buddha-spoken
     passage assigns insight alone to a named person / positive result" was rewritten to "across the
     discourses the census reached … and that pattern is consistent with the integrated reading," with
     the named-person test now *motivated* (the four-puggala restore-the-missing-member logic). The
     saturation language was scoped to *structural* saturation (closed lists), with an explicit note
     that the search service was intermittently unavailable and that several commentary/calm-insight
     cells were grounded by direct fetch + structural inference (marked quote-unconfirmed/unresolved in
     the dataset). The "load-bearing negatives confirmed by SQL" claim was scoped to the one negative
     that actually has a grouped count (`kammaṭṭhāna`).
   - **Philologist (should_fix):** restricted H_B to the *four Nikāyas* (the Niddesa does use
     `rāgacarita` of a person, which is exactly why those H0 cells are tiered para-canonical); fixed the
     decision-aid note that had attributed the whole hindrance→antidote table to AN 9.3 (delusion→wisdom
     is AN 6.107); footnoted the greed-row "eleven foulnesses" as the Mettasutta-vaṇṇanā count vs Vism's
     ten; downgraded the "verified" carita lexical negative (the carita-vs-`caritā` sense-split was never
     run) to a "strong reading, not a closed negative."
   - **Med-studies (should_fix):** dropped "canonical" from "the canonical forty"; credited
     Gethin/Anālayo alongside Cousins in the Contribution; generalized the Gethin 1992 attribution.
   - **Skeptic/philologist (should_fix):** §F now states that two of the four mūla-tier H0 cells (greed,
     hate) are warranted only in their core pairing (the kāyagatāsati addition to greed and the three
     further brahmavihāra + four colour kasiṇas added to hate are unwarranted); names the Cūḷaniddesa
     explicitly and adds it to References.
3. **Process-leak scrub** — `grep -niE 'agent|workflow|pipeline|the box|prompt|LLM|N-agent'` over the
   paper prose: clean. The two em-dashes remaining in the file are in pre-existing non-user-facing code
   comments, not the paper.

The full review memos (4 structured outputs) are in the run transcript for this session; the
substance is summarized above.

## Tool friction (this session)

- **`/api/passage/:id` is reliable; `/api/search` was effectively down** for the original census
  (502 / timeout / SIGTERM under load) — the reason several F1/F4 cells are quote-unconfirmed or
  unresolved in the dataset and grounded by direct paragraph fetch. Disclosed in the paper's
  Limitations (without naming the mechanism).
- **Transient empty-body responses.** A serial sweep of 38 citation ids returned blank bodies for ~9
  ids in interspersed clusters; every one resolved on a calm retry (e.g. `ud4.1` → HTTP 200, 30 KB;
  `cst-abh03m2.mul-014` → HTTP 200, 59 KB). Drive the box serially and gently; do not fan out
  (no F6 concurrency guard deployed). See `[[dhamma-concurrency-wedge]]`.
- All 38 prose/ledger citation ids confirmed reachable on prod.

## Verification

- **Build:** `npm run build` clean; `esbuild` parse clean.
- **Data-logic replay** (node, against the JSON): 55 instances; facet×layer totals match `by_layer`;
  ledger = 15 (8 H0 / 7 H1); 4 mūla / 4 para tiers; criterion/mode totals = 55; one null id (the
  composite delusion cell) handled by the `Cite` null guard.
- **Local render** (vite dev, via a temporary `import.meta.env.DEV` gate-bypass in `Dhamma.jsx`, since
  the Research tab is admin-gated; **bypass reverted**, `git diff src/Dhamma.jsx` empty): no console
  errors; title, abstract, all 15 sections, 6 tables, 15-row ledger with 8 H0 / 7 H1 badges and
  4 mūla + 4 para tier badges, both decision-aid panels, all four appendix groups, 69 clickable
  `#/read/` citation links. The null-id ledger cell renders as plain italic text, not a broken link.
- **Prod:** deploy via `flyctl deploy -a dhamma`. The admin-gated *visual* render on prod is identical
  by construction (same component, same static JSON verified locally, same prod gate); the static JSON
  is served at `/research/individual-guidance.json` and every cited id resolves on prod. The
  signed-in-admin spot-check (magic link to isaac11cyr@gmail.com / keenan@boothcheck.com) is the
  operator's to run; the render it will show is the one verified locally against the deployed JSON.

## Residual gaps (carried, not blockers)

Tool-load, not absence: verbatim Vism III 40-object rows not pulled at the leaf level; a standalone
`maraṇassati`→named-person assignment; MN 119 `kāyagatāsati` framed as a directed assignment; the
Mettasutta tree-deva nidāna as a directed-mettā narrative. Adding any requires ground+verify and a
bump to v1.2.

## Parallel activity noted

- Commit `646679f` (added `research/individual-guidance/HADAYA-INSIGHT-STAGES.md`) landed on master
  from a parallel line; it touches no code and does not affect this study or the deploy.
- A spawned background task scrubbed the sibling `AwakeningStudy` methodNote leak
  ("a 114-agent pass" → "an automated pass over the corpus"); that one-line change was already in the
  working tree and is included in commit `3db9b1f`.

---

## Phase 5 (2026-06-14): three-tier axis + heart-base study

The follow-up addendum (`HADAYA-INSIGHT-STAGES.md` + `abhidhamma-digest.txt`) flagged that the
canon-vs-commentary split was two-tier where it should be three: the **Abhidhamma is the third basket,
canonical**, and most "commentary" structures are the commentary systematizing the Abhidhamma. Phase 5
applied that, live, and rendered the heart-base addendum as its own study. Commit `f7d2ec8` (code+data);
deployed `flyctl deploy -a dhamma`.

### 5a — dataset v1.2
A serial patch (no fan-out) added a per-instance `tier` and a per-cell `warrant_tier`, derived by
id/layer rule: `commentary` = layer attha/tika or a Vism `cst-e0…` id; `para-canon` = ne/pe/ps/cnd/nd
ids; `abhidhamma` = `cst-abh…mul…`; else `sutta`. Recomputed `by_tier`, `criterion_x_tier`,
`mode_x_tier`. Result: sutta 27, abhidhamma 1 (the Puggalapaññatti four-types, reclassified out of
"mula"), para-canon 4, commentary 23. The headline contrast sharpened: defilement 9 + situation 3 all
sutta, temperament 15 all commentary, capacity spread across all four tiers. **H0/H1 unchanged at 8/7**;
the four former "mūla" warrant cells re-split to **sutta 4 / abhidhamma 0** (their warrants are the
Meghiya antidote formula and the DN survey, all sutta), the four para-canon cells unchanged. The
warrant-tier story is: the carita *roots* are Abhidhamma (akusalamūla), but the antidote-*pairing*
warrants are sutta, so no ledger cell rests on the Abhidhamma directly. `meta.version` → 1.2.

### 5b — IndividualGuidanceStudy renderer
Tables switched from `layer` (LAYER_KEYS) to `tier` (TIER_KEYS / TIER_COL); the ledger reads
`warrant_tier` via a `WTIER` map and `tierBadge` now styles sutta/abhidhamma/para-canon/none. Added the
three-tier methods note and the carita-sharpening paragraph; retuned the §C and table captions to the
three-tier framing.

### 5c — HeartBaseStudy
New sibling `ENTRIES` study + `HeartBaseStudy` component + `public/research/heart-base-and-insight.json`
(the §2 three-tier table data; the paper prose is inline, as in study 1). All 33 of its citation ids
were verified to resolve on prod before authoring. The component renders the table + the paper
(heart-base, bhavaṅga, insight-stages with the experiential-vs-map clarification, carita, modern
practice with the Goenka long-course correction flagged as attributed/unverifiable, the close, and a
limits-and-sources section).

### 5e — editorial passes
Separate de-AI copy-edit + 3-persona adversarial peer review on the Phase-5 deltas only (the two new
IndividualGuidanceStudy paragraphs + the whole heart-base study). All four returned accept (two
must-fixes, several should-fixes), all applied:
- **must-fix (editor):** the ānāpānasati fourth-tetrad verb "contemplates" → "watches" (the brief forbids
  calling canonical practice "contemplation").
- **must-fix (med-studies):** the heart-blood diagnostic was cited to Vism III §46, which carries the
  object-suitability matrix but no heart-blood vocabulary; re-cited to Vibh-a §70.58 (the row the main
  study already uses) in both the heart-base prose and the JSON.
- **should-fix:** scoped the abstract's "every structure" claim (two structures, the roots and the
  analytical categories, are already in the suttas); hedged the carita-as-kamma claim to the §817
  occurrence rather than an exhaustive Abhidhamma-wide sense survey; flagged the para-canonical bridge as
  the study's analytic grouping of Khuddaka works, not a native corpus tier; sourced the Pa-Auk practice
  claim (Knowing and Seeing) and made the long-course inference conditional ("if accurate"); narrowed the
  AN 1.49-52 label to AN 1.49-50 to match the linked row; added the half-handful-of-blood physicalization
  cite (Abh-pṭ §135); dropped "robust" (inflated diction) and "verbatim".

### Verification (Phase 5)
- `esbuild` parse clean; both JSONs valid; `npm run build` clean (474 KB).
- Hard gates: zero em-dash characters in the authored prose (the only `—` in `ResearchView.jsx` are two
  pre-existing code comments; the heart-base JSON has none; the `individual-guidance.json` em-dashes are
  all in verbatim evidence quotes and audited v1.0 coding fields rendered as the appendix data dump, the
  same arrangement Phase 4 shipped and the editor accepted; the two v1.1 cnd19 warrants I had authored
  were cleaned of em-dashes). No process leak.
- Local render (vite dev, temporary `import.meta.env.DEV` gate-bypass, **reverted**, `git diff
  src/Dhamma.jsx` empty): both studies render, no console errors. Individual-guidance shows
  Sutta/Abhi./Para-c./Comm. columns and the defilement row all-Sutta (9); heart-base shows all 9
  sections, the §2 table, 46 citations, the "watches" fix, the Vibh-a §70.58 heart-blood cite, the
  Pa-Auk source, the "if accurate" hedge.

### Residual (carried; would be v1.3)
Same tool-load gaps as before (verbatim Vism III object-rows; maraṇassati→named-person; MN 119
kāyagatāsati; Mettasutta tree-deva nidāna), plus the heart-base limits' three partial rows (manual-layer
citta-vīthi vocabulary; the dhātu/paṭiccasamuppāda half of the Vibhaṅga categories; the Paṭisambhidāmagga
classification), confirmed in direction with per-row verbatim pending.

See also: `[[dhamma-research-standard]]`, `[[dhamma-auth-research-tab]]`, `[[dhamma-concurrency-wedge]]`.
