# Choice-Point Detection — Phase 1 Validation Report

*Auditable Translation project. Phase 1: does the lexical within-lemma sense
detector work as an audit-safe backbone across Pāli genres? Pre-registered in
[`PREREGISTRATION.md`](PREREGISTRATION.md); steps in [`BUILDLOG.md`](BUILDLOG.md);
adversarial review in [`out/committee_result.json`](out/committee_result.json).*

Date: 2026-06-07. Status: **batch 1 — not decision-stable; verdict
`fix-then-build`.**

---

## 1. Verdict

**`fix-then-build`** (concurred by a 5-examiner adversarial committee:
0 fatal, 5 serious attacks; the claim survives only in *qualified* form).

What **survives**: the *existence* claim — the lexical within-lemma sense
detector is a real but **partial** backbone, with an **architecturally-grounded
blind spot** on register/domestication/doctrinal/grammatical-metalanguage
choice-points (e.g. *pāsāda* palace/longhouse, *paccaya* as a relation-name,
*pāra* as a Nibbāna-epithet). That blind spot holds on any sample and
genuinely motivates the complementary divergence + commentary detectors.

What does **not** survive: every recall figure as a *genre-* or *corpus-level*
estimate. They are demoted to **bounded phase-1 observations** (reasons in §5–7).

## 2. Question & scope

Per pre-registration: *across every Pāli genre, is there a single detector
setting that surfaces most genuine choice-points without burying them in false
alarms, using only primary evidence?* This phase builds + measures the
**lexical within-lemma sense detector** and quantifies its blind spot.

## 3. Method (as run)

- **Corpus** 194,432 passages → 7 strata (`slug_map.json`).
- **Sample** seeded (`dhamma-cpd-2026-06-07`), stratified, reproducible.
- **Gold** 88-agent workflow: 3 independent **translation-blind** annotators
  + completeness critic per passage; consensus = ≥2/3 (token-cluster).
- **Detector** deterministic; Pāli `original` only (firewall); diacritic-aware
  lemma selection + within-lemma synonym collapse.

## 4. Results (as observed — NOT estimates)

**Scored: 12 passages, 4 genres.** sutta/tika/vinaya/dn2 **deferred** (prod-DB
outage, §8). Treat all numbers as a **feasibility signal on a non-random
12-passage convenience sample**, not recall estimates.

| genre | passages | gold | recall (fuzzy) | precision | IAA |
|---|---:|---:|---:|---:|---:|
| abhidhamma | 3 | 11 | 0.46 | 0.29 | 0.54 |
| anya | 3 | 8 | 0.75 | 0.39 | 0.73 |
| atthakatha | 3 | 8 | 0.88 | 0.37 | 0.49 |
| khuddaka | 3 | 11 | 0.73 | 0.22 | 0.62 |
| **overall** | **12** | **38** | **0.68** | **0.30** | — |

Overall recall **0.684, 95% CI (0.53, 0.81)** — interval spans from "poor" to
"good"; not decision-grade.

## 5. Diagnostics (committee-response, `diagnostics.json`)

Three checks demanded by the viva, all confirming its attacks:

1. **Selection bias — severe.** The 12 scored passages average **59 Pāli
   tokens (median 42)** vs the 10 deferred at **892 (median 132)** — ~15×
   shorter. The scored set is whichever passages *finished before the DB
   crash*, i.e. the short, lexically simple ones — exactly where a within-lemma
   detector fires cleanest. **The 0.68 is optimistically biased.**
2. **Headline is fragile.** Under **strict** (exact-token) matching recall is
   **0.658 — below the 2/3 bar**; the fuzzy margin is **+0.017 (< one match)**.
   The "two-thirds" framing does not survive a stricter matcher.
3. **Construct circularity — extreme.** **97% (37/38)** of gold points have a
   rationale that cites a dictionary feature (DPD/PED/"sense"). The gold is
   largely "places DPD shows polysemy" — the *same* signal the detector
   consumes. The lexical recall is substantially **self-referential**.

Vote-split: 27 unanimous (3-0) / 11 majority (2-1); recall on unanimous gold
0.74 (the detector does better on clearer choice-points).

## 6. Key findings

1. **A real but partial backbone**, not sufficient alone; weakest in
   abhidhamma (doctrinal/technical density).
2. **The blind-spot number is deceptive — and that's the finding.** Token-level
   blind-spot recall is **0.654 (NOT the 0.34 the draft central-claim wrongly
   carried — that figure was a stale artifact, retracted)**. But 0.654
   *overstates* true capability: the detector "catches" a doctrinal/register
   token only when it *also* happens to be dictionary-polysemous, firing for
   the wrong reason. Genuinely non-polysemous register choices (*pāsāda*) are
   missed — confirmed by DN2, where independent translation-blind annotators
   *also* failed to flag *pāsāda* and *vedehiputta*. Only the
   divergence/commentary detectors perceive *why*.
3. **Over-flagging confirmed.** Precision 0.22–0.39 (deliberate over-flag
   bias; the UI hide/view-all toggle is the mitigation, not detector tuning).
4. **Gold is only moderately stable** (IAA ≈ 0.49–0.73). The choice-point
   *concept* needs a sharper operational definition — the granularity problem
   is not only a detector-tuning problem.

## 7. Adversarial committee (viva)

Five independent hostile examiners (sampling, gold-stability, measurement,
confound, circularity). **0 fatal, 5 serious; claim survives qualified.**
Chair verdict **`fix-then-build`**. Headline must-fixes (all now actioned in
§4–6 or scheduled in §9):

- Retract the non-reproducible 0.34 (done — §6).
- Demote every recall number to a bounded observation with CIs (done — §4).
- Report the selection mechanism (done — §5.1; bias confirmed).
- Strict-matcher + stability checks (done — §5.2; fails the bar).
- Break gold circularity with a non-DPD annotation channel (scheduled — §9).
- Pre-register phase 2 as a stratified **random** draw incl. sutta/tika
  (scheduled — §9).

## 8. Infrastructure event (and the prerequisite)

The 88-agent fan-out + per-token detector lookups overwhelmed the **256 MB**
`dhamma-pg`: `/api/lookup` latency spiked to **87–122 s**, degrading the
**live production site**, and re-melted on retry. The run was stopped to
avoid further harm. **Prerequisite for completion:** a **one-time bulk DPD
dump → local mirror** (one gentle read, then all lookups offline) — not more
per-token HTTP. The detector already supports offline text (`--textfile`); it
needs the same for the dictionary.

## 9. Next steps (phase 2, pre-register before running)

1. **Local DPD mirror** → re-run detector on the full sample offline (zero
   prod load), completing sutta/tika/vinaya/dn2.
2. **Length-stratified random** draw across all 7 genres, sized to the
   wobble-rule decision-stability criterion. (Address selection bias.)
3. **Break circularity**: a second gold channel annotated *without* DPD —
   from translation-divergence and commentary glosses — and type labels
   assigned blind to whether a clean DPD two-sense split exists.
4. **Add the divergence + commentary detectors**; measure their *marginal*
   recovery of the non-lexical blind spot — the real test of the architecture.
5. **Sharpen the choice-point definition** to lift IAA before chasing higher
   detection accuracy.
6. Add ≥1 human annotator on ≥2 passages/genre to break the LLM-on-LLM
   agreement artifact.
