# Choice-Point Detection — Phase 4 Report

*Auditable Translation project. Phase 4: (A) the leave-in-Pāli vocabulary
carve-out, and (B) the per-passage alignment layer phase 3 identified as the
missing prerequisite. Builds on [`REPORT_v3.md`](REPORT_v3.md). Prod-free.
Artifacts: `out/metrics_p4a.json`, `out/commentary_align.json`,
`data/leave_in_pali.json`.*

Date: 2026-06-07.

---

## 1. Verdict

**`fix-then-build`.** Two honest results and a validated diagnosis:

- **4A (leave-in-Pāli):** sound as an *editorial* policy, but it does **not**
  shrink the detection problem the way I first claimed. At the gold's actual
  granularity it removes only **1.9%** of choice-points and leaves IAA flat.
- **4B (per-passage alignment):** built locally and null-tested. The
  commentary lane **improves monotonically as targeting improves** (lift
  −0.38 → +0.01 → +0.05) — **validating phase 3's diagnosis that targeting is
  the lever** — but even the best-targeted, sparsest variant **still does not
  clear the permutation null's 95% band.** Commentary-gloss is, at best, a
  marginal choice-point signal. **Divergence remains the untested,
  most-principled candidate** (blocked on prod).

## 2. 4A — leave-in-Pāli carve-out (claim corrected)

Policy (`data/leave_in_pali.json`): 70 terms (62 core + 8 debatable), encoding
the user's boundary — `saṅgha` IN; `gaṇa`/`pāsāda`/`vedehiputta` OUT.

| | gold points | lexical recall | IAA |
|---|---:|---:|---:|
| full | 320 | 0.647 | 0.709 |
| residual (leave-in removed) | 314 | 0.618 | 0.699 |

- **Only 6 choice-points (1.9%) are *purely* a leave-in term** and fully
  dissolve. The earlier "31%" was *choice-points that **touch** a leave-in
  term* — but technical terms mostly appear **embedded** in larger
  choice-spans ("sukhasahagataṃ dhammaṃ paṭicca"), so leaving `dhamma`
  untranslated handles the *component*, not the *decision*. **I over-stated the
  impact last round; corrected here.**
- IAA does **not** rise (0.709 → 0.699). The carve-out doesn't make the
  residual easier to agree on.
- **Still worth doing** — for the *translation* goal, not the detection
  metric: every left-in term is one fewer English commitment to defend, applied
  consistently, and it's the correct treatment for genuinely-polyvalent terms.
  Just not a problem-size lever.

## 3. 4B — per-passage commentary alignment (the missing layer, built locally)

Phase 3 showed corpus-frequency gloss signals can't target a passage. Phase 4
built the layer locally from `bold_definitions`' **(book, subhead) sections**
(11,909 sections, ~14 glossed terms each — near-passage granularity), aligning
each passage to its commentary section by content overlap, then firing on the
terms that section glosses. Null-tested (200 shuffles):

| variant | fires/passage | recovery | null mean | null 95% | lift | beats null? |
|---|---:|---:|---:|---|---:|:--:|
| corpus-freq (phase 3) | ~70 | 0.336 | 0.715 | — | −0.38 | no |
| per-passage, dense | 39 | 0.681 | 0.673 | [.60,.74] | +0.01 | no |
| **per-passage, sparse/rare** | **3.6** | **0.212** | 0.165 | [.12,.22] | **+0.05** | no (at edge) |

- **The lift improves monotonically with targeting** (−0.38 → +0.01 → +0.05).
  Phase 3's diagnosis is correct: targeting is the lever.
- **But even the best variant doesn't clear the null's 95% band** (observed
  0.212 vs upper 0.221). Commentary-gloss is at best marginal.
- **Why it caps out:** commentaries gloss terms for *many* reasons (pedagogy,
  grammar, cross-reference), only some of which are translation choice-points.
  "Glossed in commentary" and "is a translation crux" are correlated but not
  the same construct. No slicing of a gloss-presence signal fixes that.

**Self-flagged threat:** the content-overlap alignment is partly circular
(the section is chosen by token overlap, then fires are those overlapping
tokens). The null controls fire-rate but not this selection; a real
passage→section bridge would be cleaner. Even so, the signal barely moves —
so the circularity is not hiding a strong effect.

## 4. Where the architecture stands after 4 phases

- **Lexical lane:** real backbone, ~0.65 recall (bounded, tuning-robust).
- **Commentary lane:** falsified in 4 configurations; per-passage targeting
  helps but the gloss-presence construct caps below significance.
- **Divergence lane:** **never tested** — blocked on prod translations. It is
  the *most principled* signal (where human translators actually disagreed =
  a real choice, by definition) and the cleanest non-circular source. It is
  now the single highest-value unrun experiment.
- **Compositional claim:** still no validated complementary lane → still
  unproven. But the search space is much narrower: commentary-gloss is
  (near-)exhausted; divergence is the live hypothesis.

## 5. Next steps

1. **Mirror the translation data locally** (as DPD was mirrored) — Sujato +
   ATI per-passage, segment-aligned — so the **divergence lane** can be built
   and null-tested without prod. This is now the top priority.
2. A real passage→commentary-section bridge (vs content overlap) to give the
   commentary lane its fairest test — though expectations should be low.
3. Better gloss-pattern extraction (actual "Xti / X vuccati" definitional
   forms) rather than mere bold-presence — the one commentary refinement that
   might change the construct.
4. Keep the leave-in-Pāli policy as an editorial layer (not a detection lever).

## 6. The meta-result, fourth time

The null tests overturned, in order: a 77% "composition" headline (phase 2), a
redesigned commentary lane in every frequency form (phase 3), my own
over-claim that leave-in-Pāli dissolves a third of the problem (4A), and the
per-passage commentary lane even with the missing-layer built (4B). Each time
the check fired before a claim shipped. After four phases the project has
**one validated component (the lexical backbone), a precisely-bounded negative
(commentary-gloss is not a choice-point detector), and one clean live
hypothesis (divergence).** That is what honest, cumulative progress looks
like — narrowing, not inflating.
