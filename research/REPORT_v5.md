# External Validation — Does the Model Find Real Choice-Points?

*Auditable Translation project. The experiment that tests "is the model up to
par" against genuinely external human ground truth: do the model's
translation-blind, comment-blind choice-flags land where SuttaCentral's human
translators (sujato/brahmali) actually placed comments? Artifacts:
`out/validation_metrics.json`, `out/validation_viva.json`.*

Date: 2026-06-07. Prod-free (local bilara-data).

---

## 1. Verdict: **validated-with-caveats**

- **The descriptive finding is real and robust.** The model's choice surface
  co-locates with expert-comment placement **far above chance, and above a
  salience-matched null.** This survived a 4-skeptic viva.
- **The causal/cognitive claim is NOT established.** Whether that co-location
  reflects genuine *reasoning* or *memorized* comment locations cannot be
  determined from famous suttas — the model's *weights* aren't blind to these
  texts even though its *prompt* was. The "non-circular evidence of reasoning"
  framing is overclaimed and retracted.

## 2. The result

18 comment-dense suttas, 712 segments, 213 expert-comment segments (30% base).
Model (Opus 4.8, same as session) given **only segment-keyed Pāli**, barred
from English + comments, consensus ≥2/3 of 3 agents.

| metric | value |
|---|---|
| model-flagged segments | 263 |
| overlap with expert comments | **135** |
| recall of expert comments | **0.634** |
| precision vs comments | 0.513 |
| **positional null** (uniform) | mean 79.5, 95% [69,90] |
| **salience null** (length-weighted) | mean 94.0, 95% [83,105] |
| observed vs both | **135, p<0.0001 against both** |

So the overlap (135) exceeds both a positional null (79.5 — verified to equal
the hypergeometric expectation) **and** a segment-length-matched null (94.0).
Segment salience explains ~⅓ of the raw lift; a real residual co-location
remains beyond it.

## 3. The viva (4 hostile skeptics + chair)

All four returned `claim_survives=false` *for the strong causal claim*; the
chair synthesized **validated-with-caveats**. The two decisive attacks:

1. **Contamination (the fatal one for "reasoning").** These are the most
   famous suttas in the canon, and SuttaCentral publishes the sujato/brahmali
   comments openly, segment-aligned — prime training data. "Comment-blind"
   blinds the *prompt, not the weights.* Memorized recall and genuine
   reasoning produce **identical** overlap statistics; the null cannot
   distinguish them. So +55 (or +41 vs salience) is consistent with the model
   *recalling* where the comments are. **Verdict: the descriptive overlap
   stands; the "it reasons" interpretation does not.**
2. **Salience confound (partially right).** Both translators and the model
   gravitate to long, doctrinally-dense segments — a shared third cause. The
   viva predicted a length-matched null would absorb the effect. I ran it: the
   null rose from 79.5 → 94.0, so salience explains *part* — but the model
   **still beats the salience null (+41, p<0.0001)**, so it is not *only*
   salience.

The chair also verified the arithmetic against the source code (null mean 79.5
≈ hypergeometric 79.7) — the statistics are honestly computed; the issue is
*interpretation*, not arithmetic.

## 4. What this honestly establishes

- **For the practical goal (a workbench that highlights likely choice-points):
  the model's flags are genuinely useful** — they co-locate with where human
  experts flag, well beyond chance and beyond segment-length. For *surfacing*
  candidate choice-points to a scholar, mechanism (memory vs reasoning) may
  not even matter; the flags track expert judgment.
- **For the scientific claim ("the model *reasons* about choice-points"):
  unproven.** Contamination is unresolved on famous texts.
- The earlier internal evidence (DN2 calibration, IAA 0.64–0.83, the
  dictionary-permitted probe) plus this external co-location are *consistent*
  with the model being a strong choice-point finder — but none rules out
  trained-in familiarity with this exact corpus.

## 5. The controls that would settle it (next)

1. **Obscure / post-training-cutoff Pāli** with expert comments → kills the
   contamination confound (the definitive control; hard to source).
2. **Memorization probe:** can the blinded model *reproduce* the sujato comment
   text for flagged segments? High verbatim recall would implicate memory.
3. **Naive difficulty baseline** (rare-lemma/hapax density) beyond the
   length null already run — confirm the model beats trivial heuristics.
4. **Non-SC ground truth** (a different translator's notes / independent
   annotator) → show the signal isn't locked to one memorized comment set.

## 6. Where the whole project stands (5 phases)

- **Lexical detector:** real backbone, ~0.65, bounded, tuning-robust.
- **Commentary detector:** falsified in every form (corpus-freq + per-passage).
- **The model as choice-point finder:** **co-locates with external human
  expert judgment above chance and above salience** — the strongest positive
  yet — but the reasoning-vs-memory question is open pending contamination
  controls.
- **Net:** the proposition (a model-driven, evidence-grounded choice-surface
  workbench) is *more* alive than the detector negatives suggested — the model
  tracks expert judgment. What's unproven is *why*, and that's the next test.

## 7. The pattern, fifth time

The checks again refined an over-claim: I called this a "clean, non-circular
positive"; the viva correctly cut it to "real co-location, mechanism
unestablished," and the salience null I then ran trimmed the magnitude while
confirming a residual. The result is *stronger* for having been attacked —
it's the project's first **surviving** positive, properly bounded.
