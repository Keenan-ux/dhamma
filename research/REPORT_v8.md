# Cross-Family Controls — Two Regimes, Not One Verdict

*Auditable Translation project. REPORT_v8 reports the five-cell cross-family
control run (2026-06-12): Fable 5 — the first independent model family — run
through the with-content validation and location-only probe on both arms, plus
the clean (tools-forbidden) Opus low-fame location cell that p7 scripted but
never persisted. Supersedes the single-verdict reading of REPORT_v7.
Artifacts: `out/validation_fable_{famous,lowfame}.json`,
`out/locprobe_fable_{famous,lowfame}.json`,
`out/locprobe_opus_cleanrun_lowfame.json`,
`out/difficulty_null_fable_{famous,lowfame}.json`, `out/vinaya_slice.json`.
All runs tools-forbidden; prereg rule unchanged (PREREG_controls.md §2:
"needs content" iff with-content ≥ location-only + 0.15).*

Date: 2026-06-12. Prod-free. **Verdict (as revised by the cross-family viva,
§6): two robust endpoints, not a gradient. On famous texts the signal is a
location prior (contaminated) — in both families, and conservatively so. On
truly obscure Vinaya the signal is content-driven — now established CLEAN in
both families (tools-forbidden reruns): content advantage +0.558 Opus /
+0.585 Fable on the Vinaya cells, against location-only at/near chance.**

---

## 1. The five cells

| arm | with-content | location-only | chance | advantage | prereg verdict |
|---|---:|---:|---:|---:|---|
| Opus famous (06-09 clean) | 0.634 | 0.627 | 0.348 | **+0.007** | location prior |
| Fable famous | 0.545 | 0.514 | 0.348 | **+0.031** | location prior |
| Opus low-fame **clean** | 0.645 | 0.378 | 0.265 | **+0.267** | CONTENT NEEDED |
| Fable low-fame | 0.558 | 0.391 | 0.265 | **+0.167** | CONTENT NEEDED |

Fable's with-content arms beat all three nulls on both arms (salience lift
+43.0 famous / +45.6 low-fame; difficulty lift +53.2 / +55.2; all p<0.0001)
— the co-location result replicates in an independent family.

## 2. The p6 exact-set anomaly is resolved: tool-leakage, not weight memory

REPORT_v7's most alarming datum — low-fame location-only 0.764 with 23
exact-set reproductions — came from the p6 run, whose template did not forbid
tools, with bilara comment files sitting on local disk. The clean rerun
(no-tools, same suttas, same scorer): location-only **0.378**, exact sets
**0**. The agents had been reading the answer key off disk. Two lessons:
(a) the anomaly was an artifact, and the artifact was caught by exactly the
discipline the study prescribes — re-run the control with the hole closed;
(b) "prompt-blind" is not "environment-blind": every future probe must forbid
tools *and* verify the transcript. `locprobe_clean_lowfame.json` is
superseded by `locprobe_opus_cleanrun_lowfame.json`.

## 3. The Vinaya slice — the decisive cut

The low-fame bundle mixes 7 truly-obscure Vinaya texts (Brahmali's comments)
with 16 moderately-known SN/MN suttas. Split (`out/vinaya_slice.json`):

| subset | family | with-content | location-only | advantage |
|---|---|---:|---:|---:|
| Vinaya (truly obscure) | Opus | 0.771 | 0.071 | **+0.700** |
| Vinaya (truly obscure) | Fable | 0.771 | 0.186 | **+0.585** |
| SN/MN (moderately known) | Opus | 0.617 | 0.444 | +0.173 |
| SN/MN (moderately known) | Fable | 0.512 | 0.435 | +0.077 |
| Famous suttas | Opus | 0.634 | 0.627 | +0.007 |
| Famous suttas | Fable | 0.545 | 0.514 | +0.031 |

The original draft of this report read the table as a monotonic **content
gradient**. The cross-family viva (§6) corrected that framing: only the two
**endpoints** are robust. The famous-arm advantages (~0) are conservative
(the with-content condition enjoys an uncapped flag budget and still shows no
advantage); the Vinaya cells are decisive (the prior collapses to near-chance
while with-content recall is 0.771); the intermediate values (+0.031, +0.077,
+0.167/+0.173) sit within the range of a known design asymmetry — the
location-only condition is given the true comment count K while the
with-content condition is not, a bias worth ~0.05–0.10 recall at the observed
flag volumes — and are **not independently interpretable** as a graded signal.

Chair-verified forensics on the decisive cells (`out/crossfamily_viva.json`):

- **Flag volumes and precision (Vinaya slice):** Opus 92 flags, precision
  0.293; Fable 68 flags, precision 0.397. A count-matched *content-blind*
  flagger at those volumes expects recall 0.257 / 0.190 — observed is 0.771.
  The design asymmetry cannot manufacture the Vinaya result.
- **Cluster-bootstrap CIs** (resampling the 7 texts): Fable Vinaya advantage
  +0.586, 95% CI (0.446, 0.765), P(≥0.15 gate) = 1.0 — decisive. Fable
  bundle-level advantage +0.168, CI (0.057, 0.292), P(≥gate) = 0.64 — the
  bundle-level prereg pass is a coin flip and should not be claimed; the
  SN/MN subset fails outright (+0.077).
- **The 0.771 = 0.771 tie, examined:** both families hit 27/35, sharing
  26/27 hits and 7/8 misses, at very different precisions (0.293 vs 0.397).
  That signature — same recoveries, different over-flagging — is what
  convergent content reading looks like, and is inconsistent with either
  family reproducing Brahmali's comment file. It rehabilitates the Opus cell
  directionally; it does not substitute for the clean rerun (in flight).

## 4. What is now established (and how the v6/v7 claims revise)

1. **Famous-text co-location is contaminated** (v7's verdict, now
   cross-family): both families predict comment locations on famous suttas
   nearly as well without the text. Any evaluation of a finder on famous,
   publicly-annotated material is measuring the training set.
2. **Obscure-Vinaya co-location is content-driven** (v7's "demotion" was too
   broad, and the first draft of this section was too broad in the other
   direction): on the 7 truly-obscure Vinaya texts, where the location prior
   demonstrably fails, the model reads the Pāli and lands on expert-flagged
   segments far above chance, salience, difficulty, and count-matched
   content-blind nulls. Scope honestly: this validates a **flag-for-review
   triage finder for Brahmali-annotated obscure Vinaya** (recall 0.77,
   precision 0.29–0.40, n=7 texts / 35 segments) — not "under-annotated
   material" broadly. Obscurity is currently confounded with genre
   (procedural Vinaya) and commentator (Brahmali); a second obscure cell in
   a different genre/annotator is required before the broader claim.
3. **The behavior is family-general, judge-independent.** Fable 5 annotators
   reproduce the Opus pattern without Opus gold, Opus prompts-history, or
   Opus judging. The earlier circularity (Opus validating Opus) no longer
   carries the result.
4. **Reasoning-vs-convention, again bounded honestly:** the Vinaya cells are
   the strongest evidence yet for genuine text-conditioned detection, but
   they still don't adjudicate *mechanism* — a learned "what kinds of Pāli
   segments get footnoted" prior applied to read text is consistent with the
   data. What is now excluded: verbatim location memory (clean probes, 0
   exact sets) and pure structural convention (location-only ≈ chance on
   Vinaya). The remaining question is scientific, not practical.

**Caveats, logged:** (a) the Opus low-fame with-content number (0.645) is
from the 2026-06-07 run, whose agents were prompt-blinded but whose tool
regime was not explicitly forbidden — the Fable pair is fully clean and shows
the same pattern, so the conclusion does not rest on it; (b) Fable's absolute
recall runs ~0.08 below Opus's on every with-content arm (0.545/0.558 vs
0.634/0.645) with higher precision on famous (0.598 vs 0.513) — a stricter
flagging threshold, not a capability gap, but unverified; (c) n=7 Vinaya
texts, 35 comment segments — the decisive cell is small and should be widened
before any strong-version claim ships.

## 5. Standing after the cross-family run

- **Lexical backbone:** validated, ~0.65, deterministic, model-free
  (unchanged).
- **Commentary lane:** falsified (unchanged).
- **Model-as-finder:** two regimes — contaminated on famous text,
  **content-driven and cross-family-replicated on obscure text** (recall
  0.771 on the Vinaya cells where the location prior is near-chance).
- **Divergence lane:** still the principled next experiment, now also the
  natural source of evaluation data that is *structurally* immune to the
  famous-text contamination (human disagreement is not a published
  annotation layer the models could have absorbed as a location prior).
- **Meta-finding:** an eighth instance, this time in the *favorable*
  direction — the adversarial discipline (clean rerun of a suspect arm)
  *rescued* a result v7 had over-demoted. The checks cut both ways, which is
  exactly what makes them worth running.

## 6. The cross-family viva (2026-06-12, same day)

Five hostile examiners plus a chair from the independent family
(`out/crossfamily_viva_run.js` → `out/crossfamily_viva.json`) attacked this
report's first draft. All five attacks rated **serious**; all five concluded
the claim **survives in narrowed form**; chair verdict
**validated-with-caveats**. The chair independently recomputed the decisive
cells from the bundles and annotation files (the forensics quoted in §3).
The must-fixes, all applied above or in flight:

1. Rerun the Opus lowfame with-content arm tools-forbidden — **done**
   (wf_c15bc887-47c, scored same day:
   `out/validation_opus_lowfame_clean.json`, `out/vinaya_slice.json`).
   The rerun vindicates the demand: clean Opus Vinaya with-content is
   **0.629**, not 0.771 — the suspect lineage was inflated (tool-leakage or
   run variance; one rerun cannot distinguish, the conservative number
   stands). The endpoint claim survives fully clean in BOTH families:
   Vinaya content advantage **+0.558 Opus / +0.585 Fable**, with the clean
   Opus arm still beating positional (+54.9), salience (+41.4), and
   difficulty (+52.5) nulls at p<0.0001 (bundle recall 0.594, precision
   0.421). The "0.771 in both families" formulation is permanently
   withdrawn; the SN/MN subset remains below gate in both families
   (+0.142 / +0.077).
2. The bundle-level prereg gate pass is **not claimed**; the gate is reported
   per-subset (Vinaya passes decisively, SN/MN fails).
3. Flag counts, precision, and the count-matched content-blind null are
   reported for the decisive cells (§3).
4. Two-endpoints framing replaces the gradient; intermediate advantages are
   marked artifact-range.
5. The practical conclusion is narrowed to triage-grade flag-for-review on
   Brahmali-annotated obscure Vinaya; a second obscure cell (different
   genre/annotator — obscure KN/AN, Aṭṭhakathā prose, or the reverse cell:
   famous-Vinaya pātimokkha) is preregistration-worthy future work.
