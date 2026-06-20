# Choice-Point Detection — Phase 2 Validation Report

*Auditable Translation project. Phase 2 re-ran the study to fix the three
flaws the phase-1 viva rejected (survivorship sampling, gold circularity,
fragile headline) and to test the architectural claim that complementary
detectors compose. Pre-reg: [`PREREGISTRATION.md`](PREREGISTRATION.md);
steps: [`BUILDLOG.md`](BUILDLOG.md); phase-1: [`REPORT.md`](REPORT.md);
viva: [`out/committee_result_v2.json`](out/committee_result_v2.json);
diagnostics: [`out/diagnostics_v2.json`](out/diagnostics_v2.json).*

Date: 2026-06-07. Run: entirely **prod-free** (local DPD mirror).

---

## 1. Verdict

**`fix-then-build`.** Two honest results, one positive, one negative:

- **Positive:** on the full 57-passage random sample with **non-circular**
  gold, the **lexical lane holds at ~0.65 recall** — barely below phase-1's
  *circular* 0.68, so circularity was **not** inflating it. The backbone is
  real.
- **Negative (and the headline):** the complementary **commentary lane fails
  a permutation null** — its "recovery" (0.336) is *below* chance (null mean
  0.447). As implemented (raw `bold_definitions` counts) it blanket-fires
  (22.5 false fires per recovery). **"The lanes compose" is NOT empirically
  supported by this lane.** The combined 0.77 recall is inflated by a
  no-better-than-random signal.

So: the audit-safe backbone survives; the *first attempt at a complementary
detector is falsified*; the compositional architecture remains a hypothesis
pending a better signal. The committee concurs: **fix-then-build, survives in
weakened/directional form** (4/5 attacks survive; the one non-survival is
scoped to the composition *magnitude*).

## 2. What changed from phase 1 (the fixes)

| flaw (phase-1 viva) | phase-2 fix | outcome |
|---|---|---|
| Survivorship sample (12 short passages) | all **57** random passages scored offline | bias removed |
| Gold 97% circular with DPD | gold re-annotated **without dictionary or English** | dictionary-circularity removed |
| Fragile single-lane headline | per-lane recall, CIs, strict-match, **permutation null** | numbers now stress-tested |
| Per-token HTTP melted prod | **local DPD mirror** | zero prod load |

## 3. Method

Offline detector (local DPD SQLite), two lanes: **lexical** (within-lemma
polysemy) + **commentary** (term bolded in `bold_definitions`,
DPD-independent). Gold: 228-agent workflow, 3 annotators + critic per passage,
**barred from any dictionary and any English**. Scoring: per lane, fuzzy +
strict, Wilson CIs, **permutation null** (200 shuffles), by-type recovery.

## 4. Results (57 passages, 7 genres, 320 gold points)

**Lexical lane (the backbone):**
- recall **0.647**, 95% CI (0.59, 0.70); strict 0.584.
- This is an **honest lower bound**: the dictionary-blind gold structurally
  cannot contain pure dictionary-only splits (the lexical lane's home turf),
  so its true recall is *higher* than 0.647 by an unmeasured amount.

**Commentary lane (complementary detector — FALSIFIED as implemented):**
- marginal recovery of lexical-missed gold: 0.336 fuzzy / 0.257 strict.
- **permutation null: mean 0.447, 95% (0.38, 0.52). Observed 0.336 is BELOW
  the null band — lift −0.111.** Random firing at the same rate recovers
  *more*. The lane does not beat chance.
- 854 false fires vs 38 recoveries = **22.5 false fires per recovery**.
- By-type recovery (doctrinal 0.42, register 0.50 [n=6], lexical 0.21) is
  not interpretable above the 0.447 null.

**Other:**
- Combined recall 0.766 — *discount this*: it is lexical (real) plus a
  chance-level lane.
- Gold stability IAA **0.64–0.83** (up from phase-1's 0.49–0.73 — no-dictionary
  annotators agree more). Vote split 209 unanimous / 111 majority.
- "Circularity 0.67" is keyword-counting in rationale prose, NOT a calibrated
  measure; report it only as "dictionary-circularity removed by construction;
  model-family circularity unmeasured."

## 5. Key findings

1. **The lexical backbone is real and not a circularity artifact.** Non-circular
   recall (0.65) ≈ circular recall (0.68). The phase-1 fear that the number was
   mostly circular is *disconfirmed*.
2. **The commentary-via-bold-counts lane does not work.** A permutation null —
   the exact test the committee demanded — shows it recovers *below* chance. Raw
   corpus-wide gloss frequency is too blunt: common doctrinal words are bolded
   everywhere, so the lane blankets rather than targets. **This is the central
   phase-2 result, and it is negative.**
3. **"Lanes compose" is unproven, not disproven.** The *idea* may still hold —
   but it needs a complementary signal that beats the null. Candidates: a
   **rarity-weighted** commentary signal, true **per-passage** gloss alignment
   (does *this* commentary gloss *this* token), and the **divergence lane**
   (translator disagreement), each tested against the same null.
4. **Removing the dictionary raised annotator agreement** — a hint the
   choice-point concept is sounder than phase-1's IAA implied.

## 6. Adversarial committee (viva v2)

5 hostile examiners (reverse-bias, commentary-precision, residual-circularity,
sampling-power, measurement). **0 fatal; 5 serious; 4 survive, 1 (composition
*magnitude*) does not.** Verdict **`fix-then-build`**. The committee verified
claims against the source code (e.g. confirmed the 113-vs-170 denominators are
structural, not a bug) and demanded the strict/null/paired checks — which were
then run (§4) and **falsified the commentary lane**, exactly as a good viva
should force. Must-fixes now actioned: strict recovery ✓, permutation null ✓,
by-type cross-tab ✓, precision cost ✓, "circularity" narrowed ✓, lexical recall
restated as lower bound ✓. Outstanding: dictionary-permitted re-annotation
probe (bound the lexical deflation) and a cross-model / human gold control.

## 7. Honest residual limitations

- **Lexical recall is a lower bound** (no-DPD gold can't hold dictionary-only
  splits). Needs a dictionary-permitted probe to bound the gap.
- **Model-family circularity** (annotators + detector same model family)
  remains unmeasured; needs a cross-model or human control subset.
- **Only DN2** has external hand-labels, and it isn't even in the scored 57.
- The commentary lane needs redesign before it can be called a detector.

## 8. Next steps

1. **Redesign the complementary signal** and re-test against the null:
   rarity-weighted commentary, per-passage gloss alignment, and the
   **divergence lane** (the cleanest non-circular signal; needs prod
   translations once prod is healthy).
2. **Dictionary-permitted re-annotation probe** on ~15 passages → bound the
   lexical lower bound.
3. **Cross-model / human gold control** on ≥1 passage per genre → bound
   model-family circularity.
4. Only after a complementary lane *passes the null* does "lanes compose"
   become a claim, and only then the build.

## 9. The meta-result

Twice now, the adversarial + statistical checks have overturned a tidy
positive story from the same model that produced it — first circularity and
selection bias (phase 1), now a chance-level lane masquerading as recovery
(phase 2). That is the entire thesis of this project working on itself:
**verification, not trust.** The negative result is the trustworthy part.
