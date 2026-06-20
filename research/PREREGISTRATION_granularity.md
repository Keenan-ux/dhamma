# Pre-registration — Granularity-Threshold Tuning (the "live-or-die" problem)

**Frozen before results are seen.** Extends the program to the question
[`../TRANSLATIONS-AI.md`](TRANSLATIONS-AI.md) calls the one the design "lives or
dies on": *can a detector fire on commitment-type choice-points without flooding
on stylistic micro-variation?* Targets here are fixed in advance; any deviation
is logged in [`BUILDLOG.md`](BUILDLOG.md) as a documented amendment.

- Date locked: 2026-06-13 (P1 session, after P0 / REPORT_v10).
- Builds on: REPORT_v9 (divergence rung-2, the first null-beating lane) and
  REPORT_v10 (the DN2 slice — divergence floods 7/10 segments; the apparent
  flood is partly an artifact of a 5-token gold; the real unit is the span).
- Prod-free, sandbox-only. Local DPD SQLite + local bilara-data + the divergence
  mirror. NO prod, NO deploy.

---

## 0. The motivating finding (from P0 / REPORT_v10, not assumed — observed)

On DN2 the segment-level divergence lane flagged **7/10 segments**, scored 3/7
against the 5-token hand-gold → looks like flooding. But the completeness critics
surfaced ~30 further genuine choice-points (`komārabhacca`, `aḍḍhateḷasa`,
`cittaṁ pasīdeyya`, `samaṇa-brāhmaṇa`, `udāna`, `titthakara`, …), and **every one
of the 7 flagged segments contains a real choice-point**; the 3 *un-flagged*
segments are 1.2 (a herd-consensus miss — both translators transliterate), 2.1
(genuinely empty), 2.5 (weak). So the segment-level binary cannot be the unit:
a segment bundles commitment choice-points *with* stylistic variation, and a
segment-level scalar (strength 0/1/2, near-binary; 2 reps) cannot separate them.
**Hypothesis under test: the granularity problem is a wrong-unit problem; moving
to the span and/or fusing lanes resolves it.**

## 1. The research question (falsifiable)

> Is there a **span-level** detector setting — a commitment-strength threshold,
> a rep-agreement cut, and/or a multi-lane intersection — that surfaces the large
> majority of genuine **commitment** choice-points while NOT firing on
> stylistic-only variation, and that **generalizes** from a famous passage to an
> obscure one under leave-one-passage-out?

A negative answer is a real result (see §7).

## 2. The two passages (frozen)

| | passage | genre | segs | translators | gold source |
|---|---|---|---:|---|---|
| **A (famous)** | DN 2 opening (1.2–2.5) | sutta prose | 10 | Sujato, Thanissaro (2) | 5 hand-gold + critics + fresh annotation |
| **B (obscure)** | SN 36.21 Sīvakasutta | sutta prose | 19 | Sujato, Nyanaponika, Thanissaro (3) | comment-gold + critics + fresh annotation |

B is doctrinally rich (the `pubbekatahetu` determinism wrong-view; the eight
causes of feeling — `pittasamuṭṭhāna`…`opakkamika`…`kammavipākaja`; `saccasammata`)
wrapped in standard narrative framing (stylistic-only variation). The mix is the
point. B is genuinely obscure → it breaks the famous-text caveat REPORT_v8/v10
put on LLM detection (the audit headline was already contamination-independent;
detection was not).

## 3. The granularity criterion (the crux definition — frozen)

A span is a **COMMITMENT choice-point** iff defensible renderings differ in what a
reader would **conclude** — about reference, doctrine, material fact, scope, or
cultural frame — not merely in connotation or word-flow.

- Operational test for a grader: *"Would choosing rendering A over B change what
  the reader believes the text asserts?"* Yes → **commitment**. Only feel/register
  of an otherwise-identical claim differs → **style**.
- Anchors (frozen, from the worked examples): `pāsāda` palace/longhouse =
  commitment (material + rank claim); `uposatha` sabbath/observance = commitment
  (cultural frame / domestication); `vedehiputta` Videha-lady / wise-woman =
  commitment (doctrinal, commentary-only); `ramaṇīya` delightful/lovely = **style**
  (same claim). Borderline → labelled **weak** and reported separately, never
  silently folded into either bin.

## 4. Roles (mutually blind)

1. **Annotators** — k≥3 per passage, **translation-blind** (Pāli + DPD +
   commentary only). Mark commitment choice-point spans per §3. Consensus = ≥2/3.
2. **Grading panel** — k≥3 per passage, **translation-blind**. Over the UNION
   candidate pool {annotation ∪ critic ∪ divergence-fired spans}, grade each span
   `{commitment | weak | style | spurious}` **from primary evidence only** —
   explicitly NOT from whether translators happened to differ. This firewall is
   what keeps the gold independent of the divergence detector being measured
   (otherwise recall is circular). Majority label = gold; ties → weak.
3. **Divergence-span detector** — the human-translation detector, **English-only**
   (reads the N renderings, never the Pāli, never a warrant). For each segment it
   **extracts the span(s)** where the renderings commit differently, classifies
   commitment-vs-style + type + strength (0–3), grounded only in the renderings.
   **≥4 independent reps** → a per-span commitment-divergence *probability*. This
   is the instrument under test; it never sets the gold.
4. **Lexical-span detector** — deterministic within-lemma polysemy per token (the
   validated backbone, `detector.py` lanes). Model-free.
5. **Herd-consensus critic** — k≥3 per passage, **translation-blind** (Pāli + DPD
   + commentary). Names spans where the *sources* indicate a real decision even if
   translators agree — the blind-spot catcher TRANSLATIONS-AI.md calls for
   (the `vedehiputta`→paṇḍitā case). Measured by how many divergence-missed gold
   points it recovers.
6. **Adversarial viva** — skeptics attacking gold stability, span-alignment,
   contamination (famous A), overfit / LOO leakage, threshold arbitrariness. A
   claim survives only if it survives them.

Commentary-presence (the falsified flood lane, BUILDLOG phases 2–4) is included as
a *feature* only, never a detector.

## 5. Metrics (graded; frozen)

Computed at BOTH units (segment and span) so the unit comparison is explicit.

- **Commitment-recall** — fraction of `commitment` gold a setting flags.
- **Precision** — fraction of fires that are `commitment` gold (weak counts as ½;
  reported both ways).
- **Flood ratio** — fires ÷ commitment-gold (the readability number; <1 means it
  fires less than once per real choice-point).
- **Per-lane marginal recall** + the fusion rule's recall/precision.
- **Leave-one-passage-out (LOO) — THE HEADLINE.** Fit the rule's free parameters
  on passage X, evaluate held-out on passage Y; report both directions. In-sample
  fit is reported but is NOT the verdict (n=2 passages can always be separated
  in-sample — the program's cardinal sin).
- **Permutation null** — the chosen rule vs a count-matched random span selection
  from the same candidate pool (≥1000 shuffles, one-sided p).
- **IAA** — token-level pairwise F1 on the gold grading, per passage. Where IAA
  < 0.6 the granularity for that passage is declared **contested** (a finding, not
  a pass) — consistent with the prior phases (IAA 0.49–0.83).
- **Herd-blind-spot recovery** — of the commitment-gold points the divergence lane
  MISSED (translators agree), how many the herd-critic catches.

## 6. Decision targets (operating thresholds — ratifiable; curve always reported)

The full precision/recall/flood **curve** vs the threshold is reported, so the
verdict never hinges on an exact cut. The pre-set operating bar, for a
human-in-the-loop affordance, is:

- **"Span-level + fusion tames the flood"** iff the best rule achieves, **under
  LOO (held-out)**: precision ≥ **0.50** (≥half of surfaced spans are real
  commitment decisions) AND commitment-recall ≥ **0.70** (keeps the over-flag
  bias) AND flood ratio < **2.0** — AND beats the permutation null (p < 0.05) AND
  beats the segment-level baseline on the same passages.
- Over-flag bias retained from the parent prereg: recall is prioritized over
  precision; precision is the readability lever, exposed as a curve + UI toggle.

## 7. Pre-committed outcomes (so neither result can be spun)

- **Positive:** a span/fusion rule clears §6 under LOO → *the unit was wrong; the
  detector can fire at readable granularity; build the staging layer's detector at
  span level with this rule, precision tunable.*
- **Null:** no rule clears §6 under LOO → *segment/span thresholding does NOT tame
  the flood; the workbench must **rank-not-gate** (surface a ranked list of
  affordances with a human-controlled cutoff, never a hard binary filter), and
  detection stays triage-grade.* This is a valid, design-consistent finding (the
  workbench is expose-don't-resolve), NOT a failure.
- **Contested-gold:** IAA < 0.6 on both passages → the granularity is intrinsically
  under-determined; report the disagreement atlas as the result and treat any
  recall/precision number as ill-defined for that passage.

## 8. Hard gates (= 0, inherited)

(a) No fabricated evidence — every cited row resolves (audited by the coordinator,
not trusted from a sub-chat). (b) No English translation used as a **warrant** —
divergence is `flagged_by`, never `warranted_by`. (c) Detectors that claim to be
translation-blind read Pāli only (asserted in code + prompt). (d) NO prod, NO
deploy.

## 9. Honesty constraints (inherited, non-negotiable)

No claim is "validated"/"human-level": gold = model consensus, reviewers = models,
the one human signal is translator footnote placement (the ~36% comment-gold proxy)
+ translator divergence. Use "internally consistent, pending human-grounded datum."
The yardsticks we OWN: human-translator divergence in the mirror, the operator's
read of the slice, and the machine-checkable audit. Suspect the verifier first when
a number looks alarming (the 10th meta-pattern was the auditor itself).
