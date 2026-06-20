# The Divergence Lane — First Complementary Signal to Beat a Null

*Auditable Translation project. REPORT_v9 records the first build and
null-test of the divergence lane — the experiment REPORT_v4 named the
"single highest-value unrun experiment" — unblocked today by the local
Sujato+ATI mirror. Artifacts: `data/divergence_mirror.json`,
`out/divergence_poc.json` (rung 1), `out/divergence_judge_ann.json` +
`out/divergence_judge_metrics.json` (rung 2),
`scripts/{divergence_poc,gen_divergence_judge,score_divergence_judge}.py`,
`scripts/ingest/{scope-divergence,mirror-divergence}.mjs`.*

Date: 2026-06-12. Read-only against prod (mirror pull via proxy); all
analysis local. **Verdict: lexical divergence is falsified; commitment-
classified divergence is the project's first complementary lane to beat
its permutation nulls (p=0.001 positional / p=0.015 salience, n=8 suttas).
PoC-grade positive — promising, not yet validated.**

## 1. The mirror (the unblocking)

`mirror-divergence.mjs` pulled every passage carrying BOTH a Sujato and an
ATI translation into `data/divergence_mirror.json`: **945 passages, 2,115
translations** (22 ATI translators; 177 passages with ≥2 ATI translators for
three-way divergence), with Pāli originals and `passage_sentences` rows.
Distribution: SN 326, AN 281, MN 87, Ud 80, Snp 58, Thag 41, Dhp 26,
Thig 25, DN 13, Iti 8. All 945 have sentence-substrate coverage. The
multi-agent fan-out never touches the 256 MB prod database again — the same
architectural fix as the DPD mirror.

**Test set:** 8 suttas sit in the intersection of the mirror and the SC
comment ground truth (validation/lowfame bundles): sn6.1, sn6.15, sn12.15,
sn36.21, sn41.5, sn41.6, sn42.11, sn45.8 — 88 comment segments.

## 2. Rung 1 — lexical divergence: FALSIFIED

Deterministic pipeline (no LLM): strip/sentence-split the ATI text,
monotonic DP alignment to Sujato's segment-keyed English (content-word TF
cosine), divergence = 1 − similarity per covered segment, flag top-K per
sutta with **K = that sutta's comment count** (count-matched by design,
removing the volume asymmetry the cross-family viva flagged), null pool =
covered segments only.

Result: overlap 26 vs positional null 28.8 (p=0.92), salience null 30.2
(p=0.987). **Worse than chance.** Lexical dissimilarity measures translator
style and alignment noise, not commitment — precisely the granularity
failure TRANSLATIONS-AI.md predicted ("fires on stylistic micro-variation").
Same discipline, same outcome class as the commentary lane: a construct
honestly killed at first contact with its null.

## 3. Rung 2 — commitment-classified divergence: FIRST NULL-BEATING LANE

Same alignment, same human signal source — but each aligned rendering pair
is classified (LLM, 2 reps, tools forbidden, **English-only**: no Pāli in
the prompt, so the model's own choice-point prior over the source text
cannot substitute for the human-divergence signal) as *commitment-divergent*
(reader takes away a different meaning/reference/scope) vs *stylistic-only*,
with strength 0–2. Flags = top-K by mean strength, count-matched; nulls
drawn from the judged pool.

| | overlap | recall | positional null | salience null |
|---|---:|---:|---|---|
| rung 1 (lexical) | 26 | 0.295 | 28.8, p=0.92 | 30.2, p=0.99 |
| **rung 2 (commitment)** | **36** | **0.409** | 28.9, **p=0.001** | 30.8, **p=0.015** |

After four falsified configurations of the commentary lane and rung 1's
failure, **this is the first complementary signal in the project to clear a
permutation null.** Strict consensus (both reps divergent) yields 40 flags /
18 comment hits (precision 0.45 against a ~0.30 base) with most flagged
kinds lexical-sense and doctrinal — the right construct profile.

## 4. Honest bounds

- **PoC scale:** n=8 suttas, 88 gold segments, lift +7.1 over positional and
  +5.2 over salience — real but modest, and the salience p (0.015) would not
  survive a much richer null unexamined. No cluster-bootstrap yet.
- **Residual contamination route, logged:** the judge sees Sujato's famous
  English; in principle a model could recognize the sutta and carry comment
  locations through. The route is indirect (the task is A-vs-B comparison,
  not flag-the-crux) but not excluded — the cross-family pattern (run the
  judge in the other family) and an obscure-text divergence cell are the
  controls when this scales.
- **Coverage:** ATI abridgement + crude alignment leave 24–70% of segments
  judged. Omissions are currently excluded rather than treated as signal.
- **Ground-truth proxy:** "SC commented here" remains noisy gold; the
  cruxes-only subset is the sharper target at scale.

## 5. Where this leaves the architecture

The Auditable Translation detector stack now has, by the study's own
standards: a validated deterministic backbone (lexical within-lemma, ~0.65),
a falsified lane (commentary-gloss), a cross-family-validated content-driven
finder on obscure text (REPORT_v8), and **a live, first-positive divergence
lane whose signal source — human disagreement — is constitutively immune to
the location-prior contamination that took down the famous-text finder.**
The 945-passage mirror is in place to scale it. Next steps, in order: (1)
scale rung 2 across the mirror's comment-annotated intersection with a
preregistered protocol and cluster-bootstrap CIs; (2) run the judge
cross-family; (3) the disagreement atlas (the mirror's 177 multi-ATI
passages) as a free byproduct; (4) treat omission as a signal class.
