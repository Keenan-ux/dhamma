# Build Log — Auditable Translation research prototype

Running, append-only record of every step (per the user's standing
requirement: "document your steps along the way, this is imperative").
Newest entries at the bottom of each dated section.

## 2026-06-07 — Phase 1: detector build + multi-genre validation study

### Setup / reconnaissance
- Confirmed live API healthy: 194,710 passages, pgvector, pg 16.14.
- Found Postgres proxy alive on :15432, but **chose the public API path**
  for sampling + detection: no prod credentials needed, and the whole
  study becomes reproducible by anyone. No secrets touched or written.
- Pulled `/api/corpus` (19.3 MB) → flattened to 194,432 passages with a
  work_slug→genre classifier (`research/scripts/analyze_corpus.py`).
- Genre distribution (7 strata): atthakatha 91,843 · tika 81,841 ·
  abhidhamma 7,530 · anya 6,943 · sutta 3,811 · khuddaka 1,984 ·
  vinaya 480. All slugs classified (0 unknown). Map in
  `research/data/slug_map.json`; flat index in `passage_index.json`.

### Step 0 — Pre-registration
- Wrote `research/PREREGISTRATION.md`, criteria frozen, seed recorded.
- Honest scoping decision: this phase builds + measures the **lexical
  within-lemma sense detector** (the audit-safe backbone from the
  2026-06-06 probe) across all genres, and quantifies its register/
  doctrinal blind spot. Commentary/parallel/divergence detectors are
  passage-level flags only this phase (documented threat to validity).

### Admin-gate groundwork
- Added `server/src/access.js`: admin allowlist (keenan@boothcheck.com,
  isaac11cyr@gmail.com), `isAdmin()`, feature-flag map with
  `auditableTranslation` marked admin-only + experimental, and a
  `requireAdmin` middleware stub. NOT wired to auth yet — ready to
  connect to the future Resend/accounts session in one line.

### Sampler
- `research/scripts/sample.py`: seeded (`dhamma-cpd-2026-06-07`), stratified,
  reproducible via md5(seed+id) ordering — no RNG. Drew 8/stratum + DN2
  calibration = 57 passages → `research/data/sample.json`.

### Detector (phase 1: lexical within-lemma sense)
- `research/scripts/detector.py`. FIREWALL: reads only Pāli `original`, never
  `translation` (asserted in code + comment). Diacritic-aware edit-distance
  lemma selection + within-lemma synonym-collapse (Jaccard≥0.5). Persistent
  lemma cache.
- **Sanity check** (`test_detector.py`) vs the 2026-06-06 hand analysis:
  6/7 exact. The clean win `payirupāsati` FIRES (2 senses); homonymy
  (`rājā`) and synonymy (`nisinna`) correctly collapse to no-fire;
  register/domestication choices (`pāsāda`) correctly invisible to lexical
  (confirms finding #2 — the blind spot is real and the divergence detector
  must recover it).
- **Finding (logged, not a bug):** `uposatha` fired on 4 genuine within-lemma
  senses (observance-day · ceremony · *a royal elephant* · *a paccekabuddha*).
  Context resolves it to "observance-day" here, so this is a **context-
  insensitivity false alarm** — the precision cost the study is designed to
  quantify. The lexical detector fires on dictionary-polysemy regardless of
  whether context disambiguates; the gold annotation adjudicates.
- Full batch over the 57-passage sample launched (cold cache) →
  `research/out/detector_results.json`.

### Validation study — gold annotation (workflow)
- Translation-blind passage bundle (`prepare_bundle.py`): Pāli `original`
  only for all 57 (302K Pāli chars). `passage_text.json`.
- Annotation subset for batch 1: 3/stratum + DN2 = 22 passages
  (`annot_subset.json`).
- **Workflow** `cpd-annotation-batch1`: per passage, 3 independent
  translation-blind annotators (in parallel) → completeness critic
  (pipeline, no barrier). 22 × 4 = 88 agents. Schema-forced structured
  output. Firewall enforced by a fetch command that extracts only the
  `original` field; agents instructed never to read English.
  - First launch failed instantly: `args` arrived non-array
    (`pipeline() expects an array`). Fix: embedded the 22-passage list
    directly in the script (no args dependency). Relaunched: run
    wf_2ade1011-635.
- **Scorer** (`score.py`, ready): deterministic. consensus gold = ≥2/3
  annotators (token-cluster); catch rate + false-alarm per genre + per
  type; IAA = mean pairwise token-F1; blind-spot recall on
  register/domestication/doctrinal gold. → `metrics.json`.

### Next (pending background completion)
- Committee workflow (adversarial viva) on computed metrics.
- REPORT.md with per-genre verdict + wobble-rule status.

### Crash + recovery (2026-06-07)
- Claude session crashed mid-run. Casualties: detector batch died at 30/57
  (writes only at end → no `detector_results.json`); annotation workflow
  parent died before its final return persisted (task output empty).
- Survivors: `lemma_cache.json` (284 KB, saved every 5 passages) → detector
  re-run is fast; ~88 annotation agent transcripts (177 files) → workflow
  is resumable.
- Recovery: re-launched detector batch (warm cache); **resumed** annotation
  workflow via `resumeFromRunId=wf_2ade1011-635` (completed agents replay
  from cache, only stragglers re-run).

### Annotation results + detector hardening (post-recovery)
- Annotation workflow completed on resume: 88 agents, 22 passages, 3.14M
  subagent tokens, 691 tool uses, ~31 min. Saved → `annotations.json`.
- **DN2 calibration check** (3 translation-blind annotators, independent):
  rediscovered `payirupāsati`, `komārabhacca`, `lakkhaññā`, `cittaṁ
  pasīdeyya`; added legitimate ones we'd missed (`deva` register,
  `samaṇa/brāhmaṇa`). Did NOT flag `pāsāda` (palace/longhouse) — confirming
  a register choice is invisible even to translation-blind human annotators
  reading the dictionary; only divergence surfaces it. Did NOT flag
  `vedehiputta` — needs commentary. Both confirm the complementary
  detectors are load-bearing.
- Annotation quality: 2-9 choice-points/reviewer/passage; critic found
  shared blind spots (mn147 +4, snp3.5 +3, dn2 +3); spurious flags low.
- Detector: serial per-token API lookups stalled repeatedly on cold
  vocabulary (Niddesa/long suttas). Hardened: per-passage MAX_TOKENS=600
  cap (logged), fail-fast retries, per-passage cache save, and **concurrent
  prefetch (8 threads)** of uncached tokens. Re-run scoped to the 22
  annotated passages → `detector_results.json`.
- Scoring chained to detector completion (`score.py`) → `metrics.json`.

### Infrastructure event: prod DB overload (ironic, instructive)
- The 88-agent annotation workflow + per-token detector lookups overwhelmed
  `dhamma-pg` (shared-cpu-1x, **256 MB**) hitting the 727K-row DPD inflection
  table. Single `/api/lookup` latency spiked to **87–122 s** (then 67 s,
  recovering). The app machine stayed "started" — it's the small DB
  thrashing, not the app. A real cost-of-orchestration datum: the
  multi-agent fan-out melted the very service it queried.
- **Offline pivot:** detector gained `--textfile` (reads Pāli `original`
  from the local `passage_text.json` bundle, avoiding `/api/passage`) and
  stopped caching error results. The 12 already-cached passages → full
  detector results computed **fully offline**, instantly.

### Partial metrics — 12 passages, 4 genres (offline)
| genre | gold | recall | precision | IAA |
|---|---|---|---|---|
| abhidhamma | 11 | 0.46 | 0.29 | 0.54 |
| anya | 8 | 0.75 | 0.39 | 0.73 |
| atthakatha | 8 | 0.88 | 0.37 | 0.49 |
| khuddaka | 11 | 0.73 | 0.22 | 0.62 |

- Recall ~0.68 on covered genres (below the 0.85 target → complementary
  detectors are necessary, not optional).
- **Blind-spot recall** — initially logged as 0.34 from the polluted
  all-22 scoring (uncovered genres' gold counted as missed). CORRECTED to
  **0.654** (17/26) once scoring was restricted to detector-covered
  passages. The committee flagged the stale 0.34; it is retracted. (And
  even 0.654 overstates true capability — see REPORT §6.)
- Precision 0.22–0.39 (the chosen over-flag bias; UI hide/view-all toggle
  is the answer, per user).
- IAA ~0.49–0.73 — gold only moderately stable in several genres; the
  "right granularity" is genuinely contested (itself a finding).
- NOTE: sutta/tika/vinaya rows show 0 only because detector data is pending
  (API outage) — NOT real zeros. Excluded from interpretation.

### Recovery in flight
- `finish_remaining.sh` (bg): polls DB latency, runs detector on the
  remaining 10 (sutta/tika/vinaya + dn2 calibration) via `--textfile` once
  `dhamma-pg` recovers, merges, re-scores the full 22.

### Adversarial committee (viva) + diagnostics + report
- Stopped prod hammering (was degrading the live site); re-scored
  covered-only (clean 4-genre metrics): recall 0.684, precision 0.295,
  blind-spot 0.654, IAA 0.49–0.73.
- **Committee viva** (`committee_workflow.js` → `out/committee_run.js`):
  5 independent hostile examiners (sampling, gold-stability, measurement,
  confound, circularity) + chair. No API calls. Verdict **fix-then-build**,
  0 fatal / 5 serious, claim survives qualified. Caught a real defect: the
  stale 0.34 in the claim text (retracted). → `out/committee_result.json`.
- **Committee-response diagnostics** (`diagnostics.py`, all DB-free) —
  confirmed the attacks empirically:
  - Selection bias SEVERE: scored passages mean 59 tokens vs deferred 892
    (~15× shorter) → 0.68 is optimistically biased.
  - Headline fragile: strict-match recall 0.658 < 0.667 bar; fuzzy margin
    +0.017 (<1 match); CI95 (0.53, 0.81).
  - Circularity EXTREME: 97% of gold rationales cite a dictionary feature
    → lexical recall is largely self-referential vs DPD.
- **REPORT.md** finalized: verdict, demoted numbers w/ CIs, diagnostics,
  committee integration, infra prerequisite, phase-2 plan.

### Batch 1 complete
Deliverables: PREREGISTRATION · BUILDLOG · detector + scorer + diagnostics
(scripts) · annotations (gold) · metrics · committee_result · REPORT.
Verdict: fix-then-build. Not decision-stable (4/7 genres, n=3, non-random).
Next: local DPD mirror → offline full-genre re-run → break circularity →
add divergence/commentary detectors. NO prod writes, NO deploy (sandbox).

## 2026-06-07 — Phase 2: offline mirror + full prod-free study

Goal: fix the three peer-review flaws (selection bias, circularity, fragility),
add complementary detectors, re-run — without harming prod again.

### Local DPD mirror (the architectural fix)
- DPD source found local: `scripts/ingest/.cache/dpd-released/dpd.db` (1.28M-row
  `lookup` resolver, 88,864 headwords, 369K `bold_definitions`).
- `dpd_local.py`: offline `lemma_lookup` (reproduces the HTTP shape; resolves
  inflected forms pāsādaṃ→pāsāda, nisinno→nisinna) + a DPD-INDEPENDENT
  `commentary_glossed` signal from `bold_definitions`.
- Detector gained `--local` → fully offline (with `--textfile`). Verified vs
  the HTTP run: same pattern, slightly MORE fires (the mirror is the complete
  DPD resolver; the HTTP endpoint returned a subset — a fidelity gain).
- Prod still degraded (`/api/lookup` AND `/api/passage` timing out at 30 s) →
  phase 2 is prod-free by necessity and design.

### Survivorship-bias fix
- The phase-1 57-passage sample was always a proper seeded random draw; the
  bias was only in *scoring* 12 (short ones that beat the crash). The offline
  detector scores **all 57** instantly — long passages included (pli-tv-kd12
  221 fires, dn2 163). Bias removed with no new data.

### Circularity fix — non-circular gold
- `detector.py` now emits two lanes: **lexical** (within-lemma polysemy) +
  **commentary** (DPD-independent, bold_definitions). `detector_p2.json`.
- **No-DPD annotation** (`p2_annotation_run.js`): 3 annotators + critic per
  passage, forbidden any dictionary AND any English; Pāli embedded. 57×4=228
  agents, zero prod load, perfect firewall. Run wf_d9b1ddc0-8cd.
- `score_v2.py` ready: per-lane recall (lexical/commentary/combined),
  strict+fuzzy, CIs, re-measured circularity, blind-spot per lane, and
  **marginal recovery** (lexical-missed gold recovered by commentary) — the
  real architecture test. Divergence lane deferred (needs prod translations).


### Phase-2 results + viva + the null that overturned it
- No-DPD gold: 57 passages, 228 agents, 6.7M tokens. One reviewer null on one
  passage (handled). Saved `annotations_p2.json`.
- `score_v2.py` → `metrics_p2.json`: lexical recall **0.647** CI(0.59,0.70)
  strict 0.584; IAA **0.64–0.83** (UP from phase-1); circularity proxy 0.97→
  0.67 (but the proxy is keyword-counting, not calibrated).
- **Lexical recall on non-circular gold ≈ circular phase-1 (0.65 vs 0.68)** →
  circularity was NOT inflating the backbone. Positive result.
- Phase-2 viva (`committee_v2_run.js`, 5 lenses + chair): **fix-then-build**,
  0 fatal, 4/5 survive; the one non-survival scoped to composition *magnitude*.
  Committee verified against source code; demanded strict/null/paired tests.
- `diagnostics_v2.py` ran them — and the **permutation null FALSIFIED the
  commentary lane**: observed recovery 0.336 < null mean 0.447 (95% .38–.52),
  lift −0.111. 22.5 false fires per recovery. The bold_definitions commentary
  lane blanket-fires; it does not beat chance. "Lanes compose" is UNPROVEN.
- `REPORT_v2.md` finalized: backbone validated (~0.65 lower bound); commentary
  lane falsified; compositional architecture remains a hypothesis pending a
  null-beating complementary signal (rarity-weighted / per-passage gloss /
  divergence lane).

### Phase 2 complete
Verdict: fix-then-build. The adversarial+statistical checks overturned a tidy
positive story for the SECOND time (phase-1 circularity/selection-bias, phase-2
chance-level lane) — verification-not-trust working on itself. NO prod writes,
NO deploy (sandbox). Next: redesign complementary signal + retest vs null;
dictionary-permitted probe; cross-model/human control.

## 2026-06-07 — Phase 3: redesign + bound (prod-free)

### Commentary lane redesign — FALSIFIED in all forms
- `bold_definitions`: 205K distinct terms, 155K bolded exactly once, but only
  **56 (book-level) ref_codes** → no per-passage targeting possible.
- Phase-2 used count≥2 (selected COMMON glossed words — the blanket-causers,
  backwards). Detector gained `--record` (per-token signals); `score_v3.py`
  swept 7 commentary rules (common/specific/rare) with a 200-shuffle
  permutation null each. **0 rules beat null** (`commentary_sweep.json`).
  Corpus-frequency gloss signals cannot work; need per-passage alignment.

### Lexical recall — bounded + tuning-robust
- Dictionary-PERMITTED probe (`p3_probe_run.js`, 28 agents, 14 passages):
  86 pure-lexical splits found. **Only 14% absent from no-DPD gold; net
  uncredited TPs 3.5%** → 0.647 is a TIGHT lower bound (true ≈ 0.65–0.70).
  (`probe_analysis.json`)
- JACCARD sweep (0.3/0.5/0.7): recall 0.616/0.647/0.650 — flat. The ~0.65
  ceiling is real, not a clustering artifact.
- New limit: detector catches only ~49% of subtle pure-lexical splits;
  tuning doesn't fix it → fundamental (DPD packs sub-senses in one string).

### Diagnosis
- Both complementary lanes (commentary + the untested divergence) need a
  **per-passage alignment layer** the project lacks. Corpus-statistical
  signals can't compose. That layer is the phase-4 prerequisite.
- `REPORT_v3.md` written. Verdict: fix-then-build; architecture precisely
  diagnosed, not vindicated. Divergence lane deferred to phase 4 (needs the
  alignment layer + prod translations). NO prod writes, NO deploy.

### Phase 3 complete
Net across 3 phases: lexical backbone real (~0.65, bounded, tuning-robust);
both attempts at a complementary lane either falsified (commentary) or blocked
on the missing per-passage alignment layer (divergence). The adversarial+null
checks overturned a positive story THREE times now. Verification, not trust.

## 2026-06-07 — Phase 4: carve-out + per-passage alignment (prod-free)

### 4A — leave-in-Pāli carve-out (claim corrected)
- Policy `data/leave_in_pali.json` (70 terms; saṅgha IN, gaṇa/pāsāda/
  vedehiputta OUT per user). `score_v4.py` re-scored the residual.
- **Only 6/320 (1.9%) choice-points are PURELY a leave-in term** and dissolve;
  IAA flat (0.709→0.699). The earlier "31%" counted choice-points that TOUCH
  a leave-in term — but technical terms sit embedded in larger choice-spans,
  so the policy handles the component, not the decision. Over-claim corrected.
- Still sound as an editorial policy (fewer English commitments to defend),
  just not a detection-problem lever.

### 4B — per-passage commentary alignment (the missing layer, built local)
- `bold_definitions` (book,subhead) = 11,909 sections (~14 glossed terms),
  near-passage granularity. `commentary_align.py`: align each passage to its
  section by content overlap → fire on glossed tokens → permutation null.
- Results (null-tested): corpus-freq lift −0.38 → per-passage dense +0.01 →
  per-passage sparse/rare +0.05. **Monotonic improvement with targeting
  (validates phase-3 diagnosis) but NONE clears the null's 95% band.**
  Best: sparse recovery 0.212 vs null 0.165 (hi 0.221) — at the edge, not over.
- Conclusion: commentary-gloss is at best a marginal choice-point signal —
  commentaries gloss for many reasons, only some are translation cruxes. The
  construct caps below significance regardless of slicing.
- Self-flagged: content-overlap alignment is mildly circular, but the effect is
  so small the circularity hides nothing.

### Divergence lane — the live hypothesis
- Never tested (prod translations unavailable; commentary endpoint timed out
  at 40s). Most principled signal (human disagreement = a real choice).
  Top phase-5 priority: mirror Sujato+ATI translations locally, segment-align,
  build + null-test the divergence lane.

### Phase 4 complete
`REPORT_v4.md` written. After 4 phases: 1 validated component (lexical backbone
~0.65), 1 precisely-bounded negative (commentary-gloss not a detector), 1 clean
live hypothesis (divergence). Null checks overturned a claim a 4th time (my own
leave-in over-claim). Verification, not trust. NO prod writes, NO deploy.

## 2026-06-07 — Phase 5: external validation (the model-as-finder test)

### Setup (local bilara-data)
- SC bilara-data is LOCAL: 8 en translators + sujato/brahmali COMMENTS, all
  segment-aligned. Divergence coverage tiny (1 sutta w/ 2+ translators) →
  pivoted to EXPERT-COMMENT placement as external ground truth.
- 18 comment-dense suttas, 712 segs, 213 comment segs (30% base).
  `validation_bundle.json`.
- Workflow `p4_validation_run.js` (54 agents): model given segment-keyed Pāli
  ONLY, barred from English+comments, flags choice-point segments (≥2/3).
  (Result didn't persist on first finish; resumed from cache → recovered.)

### Result + viva + salience null
- `validate.py`: overlap 135, recall 0.634, precision 0.513; positional null
  79.5 → p<0.0001, lift +55.
- Validation viva (`val_committee_run.js`, 4 skeptics+chair): all 4 say the
  CAUSAL claim doesn't survive; chair = **validated-with-caveats**. Two hits:
  (1) CONTAMINATION — prompt-blind ≠ weight-blind; model trained on these
  famous suttas' SC comments → memory vs reasoning indistinguishable by the
  null. (2) SALIENCE confound — both gravitate to long dense segments.
- Ran the viva-demanded **salience (length-matched) null**: rose to 94.0
  [83,105]; observed 135 STILL beats it (+41, p<0.0001). So salience explains
  ~⅓ of the lift; a real residual co-location remains.
- `REPORT_v5.md`: DESCRIPTIVE co-location validated (above chance + salience);
  CAUSAL "reasoning" claim retracted (contamination). For a workbench the flags
  are useful regardless of mechanism; the science needs obscure/post-cutoff
  controls.

### Phase 5 status
First SURVIVING positive (properly bounded): the model's choice surface tracks
external human-expert judgment above chance and salience. Mechanism (reason vs
memory) open. Checks refined an over-claim a 5th time. NO prod, NO deploy.

## 2026-06-07 — Phase 6: contamination controls + final viva

### Two controls (both prod-free)
- **Memorization probe** (`p5_memprobe_run.js`, 60 agents; `score_memprobe.py`):
  30 commented segments, recall-vs-predict. Result: **30/30 "CANNOT RECALL",
  0.000 verbatim 4-gram overlap** (both conditions) → no corpus-specific
  verbatim memory. The model can't reproduce the notes but reasons about the
  same cruxes.
- **Fame contrast** (`p5_lowfame_run.js`, 69 agents; `validate_arm.py` w/
  positional + salience nulls): low-fame (Vinaya+obscure) lift **+41.6** vs
  famous **+40.5**, both p<0.0001, both beat the length-salience null.
  Identical → not driven by familiarity.

### Final viva (`final_viva_run.js`)
- 4/4 examiners: claim-as-worded does NOT survive (cognitive half).
  Chair = **validated-with-caveats**. Caught two things I'd missed:
  (1) probe tests TEXT recall, not LOCATION; fame-invariance is NON-diagnostic
  (a learned annotation-convention prior predicts identical fame-invariant
  lift); (2) target is a selective proxy ("commented here" ≠ "choice-point")
  and the null matched LENGTH only (rare-vocab/structure uncontrolled).
- **ESTABLISHED:** co-location above chance + length-salience, fame-invariant,
  not verbatim-memorized. **RETRACTED:** "therefore it reasons."
- `REPORT_v6.md`: honest bounded verdict. For the WORKBENCH, co-location is
  what matters → validated finder. For the SCIENCE, reasoning-vs-learned-
  convention is unsettled (needs location-recall probe, structure-matched null,
  cruxes-only target, human inter-annotator ceiling).

### Meta-finding (the most robust result)
SIX times the checks pulled a confident model-positive back to its defensible
core. The pattern IS the result and proves the founding thesis on itself: the
model generates plausible claims well and self-validates poorly; adversarial
checking is load-bearing → the workbench must be warrant-not-trust. NO prod,
NO deploy (sandbox).

## 2026-06-09 — Post-viva controls session (RECONSTRUCTED 2026-06-12)

**Documentation lapse:** this session ran 21:00–21:40 on 2026-06-09 and wrote
nothing to BUILDLOG and no REPORT_v7. Reconstructed from file timestamps and
artifacts during the 2026-06-12 audit. The controls were preregistered in
`PREREG_controls.md` (frozen 2026-06-07, before any was run).

### Control 1 — difficulty-matched null: PASS (both arms)
- `difficulty_null.py` (token-rarity-weighted null, 1000 shuffles): famous
  observed 135 vs null 82.2 [71,93], lift +52.8, p≈0; lowfame observed 127 vs
  74.1 [63,85], lift +52.9, p≈0. The co-location is NOT mere lexical
  difficulty. → `difficulty_null_famous.json`, `difficulty_null_lowfame.json`.

### Control 3 — cruxes-only target: supportive
- `p6_cruxclass_run.js` classified all 410 SC comments: crux 146,
  pedagogical_other 184, crossref 61, textual_variant 14, parallel 5.
- Crux-only recall RISES: famous 0.778 (vs 0.634 all), lowfame 0.803 (vs
  0.645), both beat their nulls. The noisy-proxy objection weakens.
  → `cruxonly_metrics.json`.

### Control 2 — location-recall probe: FAILS the preregistered rule (decisive)
- Prereg rule: "needs content" iff with-content recall ≥ location-only + 0.15.
- p6 famous run (`p6_locprobe_run.js`, tools NOT forbidden): location-only
  0.683 vs with-content 0.634 → advantage −0.049. → `locprobe_metrics.json`.
- p7 CLEAN famous rerun (`p7_locprobe_famous_run.js`, ABSOLUTE no-tools
  constraint): location-only **0.627** vs chance 0.348, with-content 0.634,
  advantage **+0.007**, exact-set reproductions 0. Scorer's own verdict line:
  "location prior explains result (content adds <0.15) — CONTAMINATED."
  → `locprobe_clean_famous.json`.
- p6 lowfame run (`p6_locprobe_lowfame_run.js`, tools NOT forbidden) collected
  annotations (`locprobe_lowfame_ann.json`, 21:28) but was NEVER SCORED.
- p7 clean lowfame rerun was scripted (21:30) but its results never persisted.
- Session ended with the decisive control unscored and everything unwritten.

## 2026-06-12 — Audit + completion of the 06-09 controls (Fable 5 session)

- Full-record audit (memory note → PREREGISTRATION → BUILDLOG → REPORTs v1–v6
  → out/ metrics). Discovered the undocumented 06-09 session above.
- **Scored the orphaned lowfame locprobe** (`score_locprobe_arm.py`, existing
  deterministic scorer, no new data): location-only **0.764** vs chance 0.265,
  with-content 0.645, advantage **−0.119**, **23 exact-set reproductions**
  (incl. exact K-of-50+ segment sets on obscure Vinaya texts).
  → `locprobe_clean_lowfame.json` (label kept for scorer compat; see caveat).
- **CAVEAT (timestamp-verified):** `locprobe_lowfame_ann.json` (21:28)
  predates the p7 no-tools templates (21:30) → it is the **p6 run, tools not
  forbidden**, and bilara-data (incl. comment files) is LOCAL. The 23 exact
  sets are therefore plausibly agent file-reads, not weight memory. The clean
  famous arm (no tools, 0 exact sets) independently fails the content
  threshold, so the Control-2 verdict does not depend on the suspect arm.
  The clean lowfame cell remains the missing datum (re-run queued).
- Wrote this reconstruction + `REPORT_v7.md` (the integrated verdict).
- This is the SEVENTH instance of the meta-pattern — and the first where the
  demotion sat unrecorded for three days. Logged as a discipline failure.

### Cross-family five-cell run (same session, after Fable 5 became available)
- Session model switched to Fable 5 (`claude-fable-5`) — first independent
  model family; breaks judge circularity (all prior annotators/vivas = Opus).
- `gen_fable_cells.py` → `out/fable_cells_run.js` (wf_054b6064-c67): five
  cells, ALL tools-forbidden — Fable content famous/lowfame (3 annotators per
  sutta, p4 prompt + no-tools), Fable location-only famous/lowfame (p7 prompt),
  and the missing **Opus clean lowfame location-only** cell. 251 agents,
  8.6M tokens, ~16 min. Rationales stripped in-script (scorers use segment_id).
- Scored with the existing deterministic scorers (validate_arm / locprobe /
  difficulty_null). Results (prereg rule: "needs content" iff advantage ≥0.15):

| arm | with-content | location-only | advantage | verdict |
|---|---:|---:|---:|---|
| opus famous (06-09 clean) | 0.634 | 0.627 | +0.007 | location prior |
| fable famous | 0.545 | 0.514 | +0.031 | location prior |
| opus lowfame CLEAN | 0.645 | **0.378** | **+0.267** | CONTENT NEEDED |
| fable lowfame | 0.558 | 0.391 | +0.167 | CONTENT NEEDED |

- **The suspect p6 lowfame arm is OVERTURNED:** with tools forbidden, Opus
  location-only drops 0.764→0.378 and exact sets 23→0. The exact sets were
  tool-leakage (agents reading local bilara comment files), not weight memory.
  `locprobe_clean_lowfame.json` is superseded by
  `locprobe_opus_cleanrun_lowfame.json`.
- Fable content arms beat positional, salience, AND difficulty nulls
  (famous lift +43.0 salience / +53.2 difficulty; lowfame +45.6 / +55.2,
  all p<0.0001) — the co-location replicates across families.
- **Vinaya slice (`vinaya_slice.py` → `vinaya_slice.json`), the decisive
  cut:** on the 7 truly-obscure Vinaya texts the location prior collapses to
  near-chance (opus 0.071, fable 0.186) while with-content recall is **0.771
  in BOTH families** — content advantage **+0.700 / +0.585**. On the 16
  moderately-known SN/MN texts: +0.173 / +0.077. A clean monotonic content
  gradient: prior where the annotations are famous training data, genuine
  reading where they are not.
- `REPORT_v8.md` written: the refined two-regime claim, cross-family
  replicated. The v7 "demoted to location prior" verdict holds for FAMOUS
  text only; on obscure text the finder reads. Caveat logged: the Opus
  lowfame with-content number (0.645) is from the 06-07 run whose tool
  regime is unverified; the Fable pair is fully clean and shows the same
  pattern. NO prod writes, NO deploy (sandbox).

### Cross-family viva + must-fix rerun (same session)
- `crossfamily_viva_run.js` (wf_40bdd6ac-4ca): 5 hostile examiners + chair,
  independent family, attacking REPORT_v8's first draft. All 5 attacks
  "serious", all 5 survive-in-narrowed-form; chair **validated-with-caveats**.
  Chair ran its own forensics: cluster-bootstrap CIs (Fable vinaya advantage
  +0.586 CI(0.446,0.765) P(gate)=1.0; bundle +0.168 CI(0.057,0.292)
  P(gate)=0.64 — bundle-level gate pass NOT claimable), count-matched
  content-blind null (expected 0.190-0.257 vs observed 0.771), hit-set
  overlap (both families 27/35 with 26/27 shared hits — convergent reading
  signature). → `out/crossfamily_viva.json`. Must-fixes applied to v8:
  two-endpoints framing (gradient withdrawn), per-subset gate reporting,
  flag-counts/precision reported, practical claim narrowed to triage-grade
  flag-for-review on Brahmali-annotated obscure Vinaya.
- **Must-fix #1 executed:** Opus lowfame WITH-CONTENT rerun tools-forbidden
  (`gen_opus_content_clean.py` → wf_c15bc887-47c, 69 agents). Result:
  bundle recall 0.594 / precision 0.421, beats all three nulls (p<0.0001).
  **Vinaya slice: 0.629 with-content (was 0.771 suspect-lineage) vs 0.071
  location-only → advantage +0.558.** The suspect number WAS inflated; the
  clean endpoint claim survives in both families (+0.558 / +0.585). The
  ninth meta-pattern instance: the viva-demanded rerun trimmed a number
  again. → `out/validation_opus_lowfame_clean.json`,
  `out/difficulty_null_opus_lowfame_clean.json`, `out/vinaya_slice.json`
  (regenerated clean-only).

### Divergence lane: mirror built, rung 1 falsified, rung 2 first positive
- **Mirror (the REPORT_v4 prerequisite, built):** `scope-divergence.mjs` +
  `mirror-divergence.mjs` (read-only via proxy; agent restart + `flyctl proxy
  15432:5432` needed first). 945 passages carry BOTH Sujato + ≥1 ATI
  translation (1,200 pairs; 177 passages with ≥2 ATI translators; 22 ATI
  translators; SN 326 / AN 281 / MN 87 / Ud 80 / Snp 58 / …). All 945 have
  passage_sentences coverage. → `data/divergence_mirror.json` (945 passages,
  2,115 translations). Prod untouched thereafter.
- **Test set:** 8 suttas in (mirror ∩ SC-comment ground truth): sn6.1,
  sn6.15, sn12.15, sn36.21, sn41.5, sn41.6, sn42.11, sn45.8 (88 gold segs).
- **Rung 1 — lexical divergence (deterministic, `divergence_poc.py`):
  FALSIFIED.** Monotonic DP alignment of ATI sentences → Sujato segments;
  divergence = 1−TF-cosine; count-matched top-K (K=comment count); null pool
  = covered segments. Overlap 26 vs positional null 28.8 (p=0.92), salience
  30.2 (p=0.99). Style noise drowns commitment — as TRANSLATIONS-AI.md
  predicted. → `out/divergence_poc.json`.
- **Rung 2 — commitment-classified divergence (`gen_divergence_judge.py` →
  wf_5f05e4de-8d8, 16 agents; `score_divergence_judge.py`): FIRST
  COMPLEMENTARY LANE TO BEAT ITS NULLS.** Same human signal; LLM judges each
  aligned pair commitment-divergent vs stylistic (English-only, no Pāli,
  tools forbidden, 2 reps). Overlap 36/88 (recall 0.409) vs positional null
  28.9 (**p=0.001**) and salience null 30.8 (**p=0.015**). Strict-consensus
  precision 0.45 vs ~0.30 base. PoC-grade (n=8): needs scale-up,
  cluster-bootstrap, cross-family judge, obscure-text cell. →
  `out/divergence_judge_{ann,metrics}.json`, `REPORT_v9.md`.
- NO prod writes, NO deploy (sandbox). Session artifacts all under
  `research/` + the two read-only .mjs scoping/mirror scripts.

## 2026-06-13 — P0: the DN2 vertical slice + hallucinated-warrant audit

The 06-12 audit's P0: stop measuring the detector, build the slice, measure the
downstream layers never tested. TRANSLATIONS-AI.md proto steps 1–5 on DN2 opening
(10 segments, all 5 hand-gold choice-points). Prod-free (local DPD SQLite + local
bilara-data). REPORT_v10.md is the writeup.

### Reconnaissance (the slice is richer than expected)
- DN2 carries Sujato + **Thanissaro** in `divergence_mirror.json` → all four
  detector lanes live (most prior cells had Sujato only). bilara-data local:
  segment-aligned root Pāli + Sujato + Sujato comments + CST aṭṭhakathā + variants.
- Ground-truthed all 5 gold tokens vs `dpd.db`: `pāsāda` id45899 = "mansion;
  palace; building with pillars" (NO "longhouse" — register bet confirmed);
  `payirupāsati` two headwords (attends-closely / honours); `vedehiputta` =
  "family name of Ajātasattu" in DPD, but **`vedehī`→paṇḍitā IS a real commentary
  warrant** (`bold_definitions` ref DNa/SNa "vedehīti pana paṇḍitādhivacanametaṃ")
  — the graded audit probe (true to commentary, fabricated if cited to DPD).

### Detection (steps 1–2) — `dn2_slice.py` → `out/dn2_slice.json`
- Deterministic lanes faithful to the validated detector (one sense per headword
  id: `m1 or m2 or ml`; caught + fixed an early bug that split meaning_1/2 and
  inflated fires). Result: **lexical recovers 1/5 on running text** (only
  `payirupāseyyāma`→payirupāsati, 2 senses); the other 4 are monosemous
  (`pāsāda`,`vedehiputta`) or compound/sandhi (`tadahuposathe`,`gaṇī`).
  **Commentary-presence "recovers" 5/5 by flooding** (10/10 segments, 81 fires /
  8.1 per seg). The precision/recall cliff TRANSLATIONS-AI.md names, quantified.
- `prep_workflow_args.py` → `out/dn2_workflow_args.json`: 10 segments + Thanissaro
  opening + 5 real evidence packets + adversarial rendering-pairs.

### Staging workflow — `out/dn2_slice_run.js` (wf_6d8dfa71-180), 53 agents, ~5 min
- Phase 1 **divergence rung-2** (Sujato vs Thanissaro, English-only, tools-
  forbidden, 2 reps × 10 segs): flagged **7/10 segments**, all **3 gold-bearing
  segments at 2/2** (1.3, 1.6, 2.2). The validated lane cleanly recovers the
  register/lexical gold the lexical backbone misses — readable granularity.
  Herd-consensus blind spot live: `vedehiputta`→paṇḍitā NOT surfaced by divergence
  (both translators take Videha-lady), only by the commentary lane.
- Phase 2 **staging** (5 cp × 2 modes × 3 reps = 30 briefs): mode A grounded
  (real packet, cite-only) vs mode B ungrounded (free recall). 213 evidence_refs.
- Phase 3 **completeness critics** (3, translation-blind): 30 candidate
  choice-points beyond gold (komārabhacca/rattaññū/titthakara/… — overlaps the
  06-07 DN2 calibration). Gold-of-5 not exhaustive; flood re-exposed.
- Result extracted from the task-output file → `out/dn2_workflow_result.json`.

### THE HEADLINE — `audit_warrants.py` → `out/dn2_audit.json`
- Machine-checkable audit of every evidence_ref vs `dpd.db` (`dpd_headwords`
  senses+sanskrit, `bold_definitions`, the 103 MB commentary corpus). Coordinator
  ran it himself, not trusting the sub-chat (HANDOFF §8).
- **A_grounded: hallucinated-warrant 0/95 = 0.0%; fabricated-sense ≤8/95 ≤8.4%
  (spot-review: true ≈0, the 8 are mostly auditor under-credits). B_ungrounded:
  hallucinated 3.6%; fabricated 38/55 = 69.1%** — DPD embellishment (invented
  "multi-storeyed/long timber hall" senses attributed to DPD to prop up
  "longhouse"). Verified-extraction discipline = the de-risking mechanism.
- **Meta-pattern, 10th instance — inside the audit tool itself.** First-pass
  grounded hallucination read 35.6%; spot-review showed it was MY auditor's
  artifact (ref=ref_code vs claim=gloss; sanskrit field + 2-word/hyphenated
  glosses unhandled). Fixed (verify commentary claims vs corpus; check sanskrit;
  de-hyphenate; NFC-once for speed) → true 0%. The checks caught the verifier.

### Schema + reader (steps 4–5) — `build_schema.py`
- `out/dn2_choicepoints.json`: 5 choice_points / 10 options / 5 commitments. All
  5 cases (incl. doctrinal) representable; `flagged_by` (detector) cleanly split
  from audited primary warrants; commitments left uncommitted (expose-don't-
  resolve). `out/dn2_reader.html` = throwaway flood-eyeball surface.

### Status
P0 DONE. Verdict **BUILD the staging layer, grounded mode only** — the product's
load-bearing assumption (link-the-evidence ⇒ no hallucinated warrants) is
empirically supported. Bounds: n=1 passage, famous text (audit is contamination-
independent; detection is not), single family (Opus), audit corpus = bolded
glosses only (grounded fabrication is an upper bound). NO prod, NO deploy.
**A mid-session crash interrupted the writeup; reconstructed + committed here.**

## 2026-06-13 — P1: granularity-threshold tuning + 2nd (obscure) passage

The handoff §5 next move: the "live-or-die" granularity question — can a detector
fire on commitment choice-points without flooding on style? — taken from n=1 to
n=2 (famous DN2 + obscure SN36.21 Sīvakasutta), with a leave-one-passage-out
discipline. REPORT_v11.md is the writeup. Prod-free.

### Pre-registration (frozen first)
- `PREREGISTRATION_granularity.md`: the commitment-vs-style criterion ("would
  choosing A over B change what the reader CONCLUDES?"), four mutually-blind roles
  (annotators / source-critic / divergence-span / grading panel), metrics (per-unit
  recall/precision/flood, LOO held-out, permutation null, IAA), pre-set targets
  (rec≥0.70, prec≥0.50, flood<2.0 under LOO) AND a pre-committed NULL outcome
  (rank-not-gate). Two passages locked: DN2 famous, sn36.21 obscure.

### Scouting reframed the problem (deterministic, from the P0 artifacts)
- Mapping the 30 critics' candidates onto the DN2 segments showed **every one of
  the 7 divergence-flagged segments contains a real choice-point** — the apparent
  "7/10 flood" of REPORT_v10 was scoring against a 5-token gold. The real problem
  is at the SPAN level: a segment bundles commitment choice-points WITH style, so a
  segment-level binary can be neither thresholded nor read. Hypothesis: wrong-unit,
  not wrong-threshold.

### 2nd passage — SN 36.21 Sīvakasutta (`sn36_slice.py` → `out/sn36_slice.json`)
- Chosen for: genuinely obscure (breaks the famous-text caveat), 3 translators
  (Sujato/Nyanaponika/Thanissaro — richer divergence than DN2's 2), doctrinally
  dense (the `pubbekatahetu` determinism wrong-view + the 8 causes of feeling:
  `pittasamuṭṭhāna`…`opakkamika`…`kammavipāka`) wrapped in stylistic framing, AND
  carries independent comment-gold. 27 content segments (deduped the verbatim-repeat
  block 3.8-3.15). The deterministic lexical lane replicated the DN2 cliff:
  flooded on function words, missed every loaded term (seg 1.5 `pubbekatahetu`
  fired lex=0; the cause-terms fired only on the vocative `sīvaka`).

### Gold + span-detection workflow (`gen_granularity.py` → `out/granularity_run.js`, wf_a692549b-eb8, 36 agents)
- Whole-passage span extraction (robust to the abbreviated-list alignment problem;
  identical instrument both passages). Annotators 4/passage + source-critic 3 +
  divergence 6 reps + grading panel 5. Returned `detect` (26 lane outputs),
  `pools`, `grades` (10). → `out/granularity_result.json`.

### Analysis (`granularity_analysis.py` → `out/granularity_metrics.json`) — coordinator-run
- **The meta-pattern fired THREE times inside the analysis tool** (11th instance,
  a three-part compound, all caught by eyeballing): (1) all-zeros — `build_gold`
  returned gold as copies, `lane_fires` wrote signals to the originals; (2) the
  `div≥4`-craters artifact — per-rep aggregation keyed on exact surface form, so
  `opakkamika`/`opakkamikāni` fragmented one concept's 6 reps into two of 3;
  (3) inflated gold — surface-variant duplicates (`vedehiputto`/`vedehiputta`)
  double-counted, fixed by a shared-Pāli-token concept-merge (DN2 31→20, sn36
  29→17 concepts). None changed the verdict; all three would have corrupted the
  numbers. Suspect the verifier first.
- **Result (clean):** gold DN2 7 commitment/20 (IAA 0.819/0.981), sn36 12/17 (IAA
  0.634/0.731). Span-level: divergence≥1 rec 0.86/0.83 prec 0.50/0.83 flood
  1.71/1.0; the **fixed fusion div≥2 ∨ critic≥2** (a priori, no fitting) rec
  1.00/0.83 prec 0.64/0.67 flood 1.57/1.25 — **clears all three targets on BOTH
  passages.** The F1-fit LOO does NOT transfer (optimal T=3 on DN2, 1 on sn36) →
  don't tune a global cut; rank-don't-gate by strength (div≥5/6 → precision 1.0).
  The source-critic recovered the herd-blind-spot divergence missed on both
  (`komārabhacca`; `upāsaka`+`semha`). The lexical lane flooded on 20/24 function
  words none of the panel marks.

### Companion — P0 staging audit replicated on the obscure passage (`gen_sn36_staging.py` → wf_a13de998-b6f, 48 agents; `audit_warrants.py` → `out/sn36_audit.json`)
- Coordinator-run audit vs `dpd.db`: **A_grounded hallucinated 0% (0/196),
  fabricated 5.1% (10/196); B_ungrounded fabricated 55.6% (80/144).** Spot-review:
  ≥3 of the 10 grounded fabs are auditor under-credits (DPD content present), the
  rest commentary glosses outside the bolded-gloss index → true grounded fabrication
  ≈0-1.5%. The P0 grounded-fidelity headline holds at n=2, famous + obscure.

### Adversarial viva (`gen_granularity_viva.py` → `out/granularity_viva_run.js`, wf_f68aec8a-f61)
- 5 hostile examiners (gold-validity / circularity / contamination / threshold-
  shopping / merge-measurement) + chair, tools forbidden, attacking C1-C5.
- **VERDICT: fix-then-build (2 fatal, 3 serious).** The two fatals: (a) the gold is
  detector-seeded → all recall/precision is WITHIN-POOL, absolute recall unmeasured;
  (b) the only held-out test (leave-one-passage-out) FAILS the prereg's named
  permutation null in BOTH folds (p=0.445, 0.092) and one fold fails the 0.70 recall
  floor → by the study's own pre-commitment the result is the NULL branch
  (rank-not-gate, triage). The fusion `div≥2 ∨ critic≥2` was never held out
  (menu-selected in-sample). C5's "0% hallucinated warrants" is non-discriminating
  (0% both arms); the real effect is fabricated-sense 5.1% vs 55.6% + unverifiable
  4 vs 88. DN2 ≈ within-canonical-consensus (IAA 0.98 vs 0.73) → effective clean
  n=1. C4 re-adjudicated on PRIMARY SOURCES (not the viva's same-family argument —
  the truth is checkable): `komārabhacca` is a VALID recovery (DPD 2 headwords
  "paediatrician"/"(comm) raised by a prince" + commentary NIDD1a), `upāsaka`/`semha`
  are critic FALSE-POSITIVES (DPD single-sense; the panel over-called commitment,
  conf 0.5/0.8) → mechanism validated on the one source-checkable case, measured FP
  rate 2/3. **Survives:** C1 narrowed (the
  divergence signal is SELECTIVE — silent on every style/spurious item while
  lexical floods on 20/24 function words — observable independent of the gold);
  C3 intact (rank-don't-gate by strength); C5 directional (the ~10× fabrication gap
  is real). → `out/granularity_viva.json`.
- **Independent non-circular check** (post-viva must-fix, partial): divergence vs
  sn36's Sujato comment-gold (NOT detector-seeded), count-matched: recall 3/8=0.38,
  **p=0.424 — underpowered at n=1**. The divergence lane's independent warrant
  stays the POOLED REPORT_v9 (8 suttas, p=0.001); this experiment adds no new
  significant detection number, only the qualitative core + the staging replication.

### Status
P1 DONE — fix-then-build. The granularity headline collapsed to the prereg's
pre-committed NULL branch (rank-not-gate, triage-grade); a genuine core survives
(divergence selectivity C1, rank-don't-gate C3) plus the staging-fidelity
replication (C5 directional). 12th meta-pattern instance (the headline pulled to
its core by the viva + the study's own null), with a 3-part 11th inside the
analysis tool. REPORT_v11.md. NO prod, NO deploy (sandbox). Artifacts under
`research/`.
