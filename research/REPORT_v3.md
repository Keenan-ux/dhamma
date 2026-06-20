# Choice-Point Detection — Phase 3 Report

*Auditable Translation project. Phase 3 acted on the phase-2 viva's must-fixes:
redesign the complementary (commentary) lane and re-test it against a null,
bound the true lexical recall, and tune the lexical lane. Builds on
[`REPORT_v2.md`](REPORT_v2.md). Entirely prod-free. Artifacts:
`out/commentary_sweep.json`, `out/probe_analysis.json`.*

Date: 2026-06-07.

---

## 1. Verdict

**`fix-then-build`, unchanged — now with the complementary architecture
sharply diagnosed.** Three results:

1. **The commentary lane is falsified in *every* frequency form.** No rule
   (common, specific, rare) beats its permutation null. Corpus-frequency gloss
   signals cannot work — there is no per-passage targeting in the data.
2. **The lexical lane's ~0.65 recall is real and tightly bounded.** The
   feared no-DPD "reverse bias" is small (net +3.5%); and recall is robust to
   the synonym-clustering threshold (0.62–0.65 across JACCARD 0.3–0.7) — a true
   ceiling, not a tuning artifact.
3. **The unifying diagnosis:** both complementary lanes (commentary, and the
   still-untested divergence lane) require a **per-passage alignment layer**
   the project does not yet have. That layer — not another corpus-frequency
   heuristic — is the real phase-4 prerequisite.

## 2. Commentary lane redesign — falsified (the headline)

Phase 2's lane fired on `bold_definitions` count ≥ 2 and lost to a null. Phase
3 swept seven rules (including the corrected "fire on *rarely*-glossed,
lexically-simple terms") and ran a 200-shuffle permutation null per rule:

| rule | fires | recovery | null mean | null 95% | beats null? |
|---|---:|---:|---:|---|:--:|
| phase-2 (count≥2) | 3996 | 0.336 | 0.715 | [.66,.77] | no |
| specific 1≤c≤5, 1 sense | 1378 | 0.407 | 0.385 | [.31,.44] | no |
| rare c==1, 1 sense | 545 | 0.248 | 0.241 | [.18,.30] | no |
| mid 2≤c≤8, 1 sense | 1130 | 0.274 | 0.304 | [.25,.37] | no |

**Zero rules beat the null.** Root cause: `bold_definitions` carries only 56
(book-level) location codes, so no rule can target *this passage's* glosses;
every rule fires with no better-than-random alignment to the actual
choice-points. The commentary signal needs **true per-passage gloss
alignment** (does *this* commentary gloss *this* token), which corpus counts
structurally cannot provide.

## 3. Lexical recall — bounded and robust

**Dictionary-permitted probe** (28 agents, 14 passages, 2/genre): annotators
free to use the lexicon marked 86 pure-lexical splits.

- **Only 14% were absent from the no-DPD gold** — the dictionary-blind gold
  captured most lexical choices anyway (most "lexical" splits are also
  contextually visible). The reverse-bias ceiling the viva feared is *modest*.
- **Net uncredited true positives: 3.5%.** So 0.647 is a *tight* lower bound;
  true lexical recall ≈ **0.65–0.70**, not dramatically higher.
- **JACCARD sweep:** lexical recall 0.616 / 0.647 / 0.650 at threshold
  0.3 / 0.5 / 0.7 — essentially flat. The ~0.65 ceiling is **not** a
  clustering artifact.

**New limit:** the detector catches only **~49% of the probe's subtle
pure-lexical splits** — but tuning doesn't fix it (above), so the misses are
fundamental: DPD often packs the two senses into one definition string, or
doesn't separate the nuance the probe annotator inferred. The lexical lane has
a real, tooling-independent ceiling around two-thirds.

## 4. What this means for the architecture

The phase-1/2 thesis — *no single lane suffices, but lanes compose* — still has
**no empirically working second lane.** Phase 3 explains why: corpus-level
signals (bold-frequency) cannot compose because they cannot target a passage.
The architecture is not refuted, but its missing piece is now precise:

> **A per-passage alignment layer is the prerequisite.** For commentary: fetch
> *this* passage's aṭṭhakathā/ṭīkā and detect which of its tokens are glossed.
> For divergence: align ≥2 translations to *this* passage's segments and detect
> where they differ. Both are per-passage, not corpus-statistical.

## 5. Phase 4 (the now-clear path)

1. **Build the per-passage alignment layer** (the gating prerequisite):
   - commentary: per-passage gloss extraction from `/api/passage/:id/commentary`
     (prod is recovering; gentle single-passage fetches);
   - divergence: segment-aligned multi-translation diff.
2. **Re-test both lanes against the null** with per-passage targeting — the
   real test of "lanes compose."
3. Tune the lexical lane's *fundamental* misses (sub-sense splits) — likely
   needs DPD `meaning_2` / sub-sense parsing, not clustering.
4. Cross-model / human gold control (still outstanding from phase 2).

## 6. Honest status

Phase 3 produced two bounded negative results (commentary lane dead in all
frequency forms; lexical ceiling ~0.65 and tuning-robust) and one positive
(the reverse-bias deflation is small). The compositional architecture is now
**precisely diagnosed, not vindicated**: it awaits a per-passage alignment
layer before "compose" can even be tested honestly. That is real progress —
the project now knows exactly what to build next and why the shortcut
(corpus-frequency) cannot work.
