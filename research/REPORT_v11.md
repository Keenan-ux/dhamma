# Granularity-Threshold Tuning — The Result Lands on the Pre-Committed Null Branch

*Auditable Translation project. REPORT_v11 records the P1 granularity experiment
(PREREGISTRATION_granularity.md): the "live-or-die" question of TRANSLATIONS-AI.md
— can a detector fire on commitment choice-points without flooding on style? —
at the SPAN level on a famous (DN2) and an obscure (SN36.21) passage with
leave-one-passage-out, plus an adversarial viva. Companion result: the P0
grounded-staging audit re-run on the obscure passage. Artifacts:
`out/granularity_result.json`, `out/granularity_metrics.json`,
`out/granularity_viva.json`, `out/sn36_slice.json`, `out/sn36_audit.json`;
scripts `scripts/{sn36_slice,gen_granularity,granularity_analysis,
gen_sn36_staging,gen_granularity_viva}.py`.*

Date: 2026-06-13 (P1, after P0/REPORT_v10). Prod-free. **Verdict: fix-then-build
(viva: 2 fatal, 3 serious). The confident headline — "a fixed fusion tames the
flood and clears all targets" — collapses, under the study's own pre-committed
rules, to the NULL branch: the only held-out test (leave-one-passage-out) fails
the prereg's named permutation null in both folds (p=0.445, 0.092), and one fold
fails the 0.70 recall floor. A genuine, independently-observable core survives:
the divergence signal is SELECTIVE at readable granularity, no rep-count threshold
transfers, so the workbench must rank-don't-gate (rank by divergence strength,
human cutoff) at triage grade. The grounded-staging fidelity (the safety
mechanism) replicates off famous text. Build the triage core; ship the rest as
labeled, unvalidated hypotheses.** This is the 12th instance of the program's
meta-pattern — a confident model-positive pulled back to its defensible core.

---

## 1. What was built (two passages, four blind roles, a graded gold)

Per PREREGISTRATION_granularity.md, on **DN2 opening** (famous, 2 translators, 10
segments) and **SN 36.21 Sīvakasutta** (obscure, 3 translators, 27 content
segments — the eight causes of feeling + the `pubbekatahetu` determinism
wrong-view, wrapped in stylistic framing):

- **Annotators** (k=4, translation-blind) — commitment choice-point candidates.
- **Source-critic** (k=3, translation-blind) — a detector lane for the
  herd-consensus blind spot (decisions the sources reveal where translators agree).
- **Divergence-span** (k=6 reps, **English-only**) — the human-translation
  detector, upgraded to whole-passage span extraction (the identical instrument on
  both passages). Reads the renderings, names the Pāli term, never a warrant.
- **Grading panel** (k=5, translation-blind, source-blind) — labelled each pooled
  candidate `commitment | weak | style | spurious` from primary evidence only.

Gold = the 5-grader majority over the pool (annotation ∪ divergence-fired ∪
critic-fired), after a coordinator concept-merge of surface variants (DN2 31→20,
sn36 29→17 concepts). Final: **DN2 7 commitment / 20** (IAA exact 0.819,
commitment-binary 0.981); **sn36 12 / 17** (IAA 0.634 / 0.731).

> **The central limitation (conceded up front, hammered by the viva):** the gold
> is **detector-seeded** — the pool is the union of the three detectors' own
> proposals. So every recall/precision figure below is **within-pool**: the
> denominator is "choice-points at least one detector proposed," not "choice-points
> that exist." Absolute recall is unmeasured. Two of the three pooling lanes
> (annotators, critic) share the grading panel's reasoner family; only the
> divergence lane (English-only) is independent of it.

## 2. The numbers — within-pool, and what the held-out test actually showed

Span-level recall / precision / flood (fires ÷ commitment-gold), **within-pool**:

| lane | DN2 | SN36.21 |
|---|---|---|
| lexical (deterministic backbone) | 0.57 / 0.57 / 1.0 | 0.33 / 0.80 / 0.42 |
| divergence ≥1 rep | 0.86 / 0.50 / 1.71 | 0.83 / 0.83 / 1.0 |
| source-critic ≥2 | 1.00 / 0.78 / 1.29 | 0.75 / 0.69 / 1.08 |
| div≥2 ∨ critic≥2 (fusion, in-sample) | 1.00 / 0.64 / 1.57 | 0.83 / 0.67 / 1.25 |

These point-estimates clear the prereg's recall/precision/flood thresholds
**in-sample**. But the prereg's "tames the flood" criterion was a **conjunction**
that included *beating the permutation null under leave-one-passage-out* — and that
is where it fails:

| held-out fold | recall | precision | flood | perm-null p |
|---|---|---|---|---|
| fit DN2 → test SN36 | **0.583** (fails 0.70) | 0.778 | 0.75 | **0.445** |
| fit SN36 → test DN2 | 0.857 | 0.500 | 1.71 | **0.092** |

Neither held-out fold beats the named null; one also fails the recall floor. The
fusion rule itself was **never held out** — it was chosen from a ~7-rule menu with
both passages in view and scored in-sample, with no p-value (the only available
p-values are these two failures). Per the study's **own pre-committed null
outcome**, the honest result is **rank-not-gate / triage-grade**. The within-pool
permutation null is weak by construction (the pool is commitment-enriched), which
is precisely why it cannot license a "tames the flood" claim.

**Independent check (the one non-circular number).** SN36.21's Sujato *comment-gold*
(8 footnote segments) is NOT detector-seeded. Divergence's top-8 segments overlap
it 3/8 (recall 0.38) — but count-matched, **p=0.424, not significant**: at n=1
passage the test is underpowered. The divergence lane's real independent warrant
remains the **pooled** REPORT_v9 result (8 suttas, recall 0.409, p=0.001); this
experiment adds no new significant detection number.

## 3. What survives the viva (the defensible core)

- **C1 (narrowed) — the divergence signal is SELECTIVE, a property of the signal
  itself, observable independent of the contaminated gold.** Divergence stays
  silent (div=0) on **every** style/spurious-graded item (`ambavana`, `pāsādika`,
  `māgadha`, `deva`, `vedayita`), while the deterministic lexical lane floods on
  **20 (DN2) / 24 (sn36) pure function-word tokens** (`viharati`, `atha`, `yena`,
  `santi`, `gotama`) that no one marks. The strength gradient is real (div≥5/6 →
  precision 1.00 on sn36). This selectivity is the usable signal. It does **not**
  survive as "span granularity is what *fixed* the flood": the matched within-study
  segment baseline matches or beats the span lane on held-out precision/flood
  (seg 0.875/0.73 vs span 0.778/0.75) — the "segments flooded 7/10" figure was a
  stale REPORT_v10 operating point, not the contemporaneous baseline.
- **C3 (intact — the load-bearing finding) — rank-don't-gate.** No single
  divergence rep-count threshold transfers (F1-optimal T=3 on DN2, T=1 on sn36);
  the only held-out tests fail the null in both directions. Rank by divergence
  strength with a human cutoff; do not ship a fixed gate. (Narrowing: at n=2,
  "NO threshold transfers" is unproven — it is "these two texts disagree.")
- **C4 (re-adjudicated against primary sources, NOT against model agreement) — the
  herd-consensus mechanism is validated on the one case the sources can check, with
  a measured false-positive rate.** The critic recovered 3 spans the divergence
  lane structurally missed (translators herd → div=0). The viva demoted the whole
  lane on a same-family argument; that argument is valid only for "model agreement
  can't be the validation *metric*", and is the wrong tool here because the truth of
  each recovery is checkable against DPD + commentary, not against another model.
  Checked:
  - **`komārabhacca` — a genuine, source-documented choice-point (VALID recovery).**
    DPD carries two headwords — `komārabhacca 1` "paediatrician; *(comm)* raised by
    a prince" and `komārabhacca 2` "paediatrics" — and the commentary glosses it
    (NIDD1a `komārabhacca = komārakavejjakammaṃ`). Both DN2 translators transliterate
    "Jīvaka Komārabhacca" → divergence is structurally silent → the critic caught a
    real, primary-source-attested blind spot, verifiable independent of any model.
    Same class as `vedehiputta`. The gold label here (commitment, conf 1.0) is
    source-confirmed.
  - **`upāsaka`, `semha` — critic FALSE-POSITIVES on the facts.** DPD gives
    `upāsaka` a single sense-cluster ("lay disciple; lay devotee; who sits near") and
    `semha` a single sense ("phlegm; mucous"); neither is a commitment split. The
    grading panel's commitment labels there (`upāsaka` conf **0.5**, `semha` 0.8)
    were a gold **over-call** — a fact-checkable instance of the panel over-marking
    commitment on the obscure passage (consistent with its lower IAA 0.731).

  So C4 stands as: **the mechanism is real and primary-source-validated on
  komārabhacca**, with a real false-positive rate (2/3 here) — adjudicated on
  evidence, not dismissed on shared model family. This also yields a stronger,
  FACT-based critique of the detector-seeded gold than the abstract circularity
  worry: a deterministic check (does each commitment-labelled span actually carry
  >1 DPD sense or a divergent commentary gloss?) is a partial, non-model gold
  validation, and it already shows the panel over-called `upāsaka`/`semha`.

## 4. Companion — the grounded-staging safety mechanism replicates off famous text (C5, directional)

Re-running the P0 grounded-vs-ungrounded staging + warrant audit on the obscure
sn36.21 (48 briefs, 432 evidence_refs, coordinator-run vs `dpd.db`):

| mode | fabricated-sense | unverifiable | hallucinated-warrant |
|---|---|---|---|
| **A · grounded** | **5.1%** (10/196) | 4 | 0% |
| **B · ungrounded** | **55.6%** (80/144) | 88 | 0% |

The discriminating effect is the **fabricated-sense gap (5.1% vs 55.6%, ~10×)** and
the **unverifiable gap (4 vs 88)** — far too large for the bolded-gloss-only audit
corpus or same-family-auditor noise to explain. Grounding the model in real rows
is what cuts fabrication. **Correction forced by the viva: "0% hallucinated
warrants" is NOT the headline — it is 0% in *both* arms, so it carries no signal
about grounding.** The grounded 5.1% is an **upper bound**: ≥3 of the 10 are
auditor under-credits (DPD content present), the rest commentary glosses outside
the bolded index → true grounded fabrication ≈0–1.5%. The mechanism replicates
(n=1→2, famous→obscure); the auditor is the same model family as the generator
(a standing caveat).

## 5. The meta-pattern — 12th instance (and a 3-part 11th inside the analysis tool)

- **Inside the analysis tool (11th, three-part):** the scorer first returned
  all-zeros (gold/lane object aliasing), then a false threshold cliff (per-rep
  aggregation fragmented `opakkamika`/`opakkamikāni`), then inflated gold
  (surface-variant duplicates) — each caught by eyeballing the rows, none changing
  the verdict but all corrupting the numbers. Suspect the verifier first.
- **The headline itself (12th):** "the fixed fusion tames the flood and clears all
  three targets on both passages" was a confident model-positive. The adversarial
  viva + the study's own permutation null pulled it back to its defensible core —
  the pre-committed rank-not-gate null branch. The checks are load-bearing; the
  workbench must be warrant-not-trust for the same reason.

## 6. Verdict + must-fixes (from the viva chair, adopted)

**Fix-then-build.** Build the workbench on the **C1/C3 core only** — ranked
divergence-strength affordances + a human cutoff, explicitly **triage-grade**. Do
NOT ship a fixed gate. The critic lane (C4) and the grounded-staging lane (C5)
ship as **labeled, unvalidated hypotheses** pending independent adjudication and
more passages.

Adopted must-fixes (carried to the handoff): (1) report on the null branch, not
the success branch — done here; (2) any future fusion/threshold rule must be held
out, not menu-selected in-sample; (3) every recall/precision figure is within-pool
until an independent gold exists; (4) treat DN2 as within-canonical-consensus →
effective clean n=1 (the 0.98 vs 0.73 IAA gap is the memorized-scholarship
signature); (5) the grounded staging rate is an upper bound (bolded-gloss-only
corpus, same-family auditor); (6) audit the concept-merge (matchkey collision /
inter-merger agreement) before trusting any precision within 0.15 of the 0.50
floor.

## 7. Honest bounds + next

- **n = 2 passages, effective clean n = 1** (sn36.21). A demonstration, not a
  distribution.
- **Detector-seeded gold** → absolute recall unmeasured; the one independent check
  (comment-gold) is underpowered at n=1 (p=0.42). The divergence lane's
  independent warrant is the prior pooled REPORT_v9 (p=0.001).
- **Single model family** (Opus 4.8) throughout; auditor = generator family.

Next (HANDOFF §5): an **independent, NOT-detector-seeded gold** is the
prerequisite for any non-circular detection number — the only one we own at scale
is the comment-gold, so the next detection step is comment-gold-anchored, not
pool-anchored; cross-family (Fable 5) replication of the *selectivity* + the
grounded-staging audit (breaks the same-family-auditor circularity); widen the
audit corpus to the full aṭṭhakathā; a third+ passage to move past effective n=1.
The C1/C3 triage core is buildable now.
