# Pre-registration — Choice-Point Detection Validation Study

**Frozen before results are seen.** This document fixes the question, the
method, the thresholds, the sampling rule, and the failure conditions in
advance. Per the design in [`../TRANSLATIONS-AI.md`](../TRANSLATIONS-AI.md),
the goal is a PhD-defensible verdict on the riskiest assumption, not a
shipped product. Targets here are not to be moved after seeing data; any
deviation is logged in `BUILDLOG.md` as a documented protocol amendment.

- Date locked: 2026-06-07
- Sampling seed: `dhamma-cpd-2026-06-07` (recorded; sampling is deterministic)
- Corpus snapshot: `/api/corpus` @ dhamma.fly.dev, 194,432 passages

---

## 1. The research question (falsifiable)

> Across every genre of the Pāli corpus, is there a single detector setting
> that surfaces the large majority of genuine translation **choice-points**
> without burying them in false alarms — using **only primary evidence**,
> never reference to existing English translations?

A *choice-point* = a span where defensible renderings diverge in
**commitment** (meaning), not in style. Types: lexical-sense, register,
domestication, syntactic, text-critical, doctrinal.

## 2. Scope of THIS phase (honest)

The full instrument has four detectors (lexical within-lemma sense,
commentary-presence, parallel-variance, translator-divergence). This phase
builds and validates the **lexical within-lemma sense detector** — the
audit-safe backbone identified by the 2026-06-06 probe — across all genres,
and **quantifies its blind spot** (register/doctrinal choice-points the
dictionary cannot see), which motivates and sizes the complementary
detectors. Commentary/parallel/divergence are scaffolded as passage-level
flags only and are explicitly **out of measured scope** this phase (a
documented threat to validity, and the defined next phase).

## 3. Genres (strata) — "everything"

All seven, from the full corpus classification (`research/data/slug_map.json`):

| stratum | meaning | corpus size |
|---|---|---:|
| sutta | 4 nikāya prose discourses | 3,811 |
| khuddaka | verse + short Khuddaka (verse genre) | 1,984 |
| vinaya | monastic code | 480 |
| abhidhamma | analytical | 7,530 |
| atthakatha | commentary | 91,843 |
| tika | sub-commentary | 81,841 |
| anya | extra-canonical (Vism, Mil, …) | 6,943 |

## 4. Method — four blind roles

For each sampled passage, run **mutually blind**:

1. **Annotators** — k≥3 independent agents hand-analyze from **primary
   evidence only** (dictionary, grammar, commentary, underdetermination
   logic). Instructed to mark *any defensible interpretive alternative* —
   lexical, register, domestication, doctrinal — **not only**
   dictionary-ambiguous words (so register choices like *pāsāda*→palace/
   longhouse are captured and the detector's blind spot is measurable).
   Translation-blind: they may NOT consult any English translation.
2. **Completeness critic** — one agent hunting choice-points all annotators
   missed (guard against shared blind spots).
3. **Detector** — deterministic code (§6), run separately, never sees gold.
4. **Adversarial committee (viva)** — skeptic agents that try to *invalidate*
   the study (attack sampling, gold stability, apparent detector wins).
   A finding survives only if it survives them.

**Consensus gold** = choice-points marked by ≥2 of 3 annotators (critic
additions are flagged separately and reviewed by the committee).

## 5. Metrics (graded, per genre AND per type)

- **Catch rate (recall)** — fraction of consensus gold the detector flagged.
- **False-alarm rate** — fraction of detector fires that are not gold
  (reported and characterized, not minimized).
- **Per-detector marginal value** — recall attributable to each signal.
- **Gold stability (IAA)** — agreement among the 3 annotators on which
  tokens are choice-points (token-level F1, averaged pairwise).
- **Blind-spot quantification** — recall on register/doctrinal-type gold
  specifically (expected low for a lexical-only detector — finding #2).

## 6. The detector (this phase: lexical within-lemma sense)

Per the 2026-06-06 probe's corrected spec:

1. Tokenize the Pāli `original`; normalize (NFC, lowercase, strip
   punctuation/numerals/danda).
2. Resolve each token's lemma(s) via `/api/lookup` (DPD headwords +
   inflections). Pick the **contextual lemma** (exact headword/inflection
   match preferred).
3. Count **distinct senses WITHIN that lemma** — *not across* homonymous
   lemmas (kills the `rājā`→dusty/king/royal/daemon false positives).
4. **Collapse synonyms** (Jaccard overlap ≥ 0.5 of content words, or
   substring) so `nisinna` "seated"≈"sitting" does **not** fire.
5. Fire iff the contextual lemma has ≥ N_SENSE distinct sense-clusters.
   N_SENSE is the tunable operating threshold; the precision/recall
   tradeoff vs. N_SENSE is reported as a curve.

Homonymy (multiple plausible lemmas) is logged as a *separate* signal,
not counted as a lexical fire.

## 7. Targets to ratify → RATIFIED (user, 2026-06-07)

- **Bias: over-flag.** Catch rate prioritized over false-alarm rate.
- **Catch rate** ≥ 0.85 overall; **no genre < 0.65**.
- **False-alarm rate** tolerated; reported per genre, not gated hard.
- **Gold stability**: report IAA per genre; where pairwise token-F1 < 0.6,
  that genre's accuracy is declared *ill-defined* (a finding, not a pass).
- **Non-negotiable hard gates (= 0):** (a) no fabricated evidence — every
  citation resolves to a real row; (b) no English translation used as a
  warrant; (c) every gold choice-point representable in the data model.
- **Readability** is a UI concern (hide / view-all toggle), removed from
  detection criteria.

## 8. Stopping rule (the wobble rule)

Per genre, keep sampling until the catch-rate estimate **stops moving
enough to change the verdict** — i.e. the batch-to-batch estimate is stable
and clear of the gate — or a per-genre ceiling of 60 is reached. The study
is a continuing, batched protocol; a single batch that is **not yet
decision-stable** is an honest intermediate state, not a failure. The turn
ends when, per genre, the estimate is decision-stable OR the ceiling is
hit, AND the hard gates are audited, AND the failure-mode catalog and
report are written.

## 9. Verdict (what "done" produces)

Not a number — a defensible recommendation: **build / fix-then-build /
don't-build-because-X**, supported by per-genre + per-type metrics, IAA,
the blind-spot size, the hard-gate audit, and survival of the committee. A
clean, well-evidenced negative result is a *passing* outcome.

## 10. Out of scope (deployment gate)

No reader/workbench UI, no commitment/policy/fork layer, no corpus-wide
propagation, **no production, no deploy.** Sandbox only. Admin-gating
groundwork (`server/src/access.js`) is laid for the future feature but not
wired to auth.
