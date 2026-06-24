# Pre-registration — "Come and See": the invitational register and the selectivity of commentarial systematization

*Frozen 2026-06-24, BEFORE the full enumeration and coding. dhamma-research method. This study was
chosen deliberately as a COUNTER-THESIS test (the adversarial review of 2026-06-23, cross-study finding:
"run one study where the prior points AGAINST the house thesis, to show the harness can produce a
non-house verdict"). The discovery sweep (`research/_discovery_counter.py`) is the only data seen before
this freeze; the per-instance enumeration and coding happen AFTER it.*

## The question
The canon describes the Dhamma with a fixed six-quality formula (the *dhammānussati*): *svākkhāta*
(well-proclaimed), *sandiṭṭhika* (directly visible), *akālika* (timeless), *ehipassika* (come-and-see),
*opaneyyika* (onward-leading), *paccattaṃ veditabbo viññūhi* (to be known by the wise each for
themselves). Four of these qualities are invitational and experiential: they characterise the Dhamma as
something to be verified here and now, by anyone, for oneself. Does the commentary systematize and
amplify this formula the way the program's other five studies found the commentary systematizing their
subjects (the "house thesis": canon supple, commentary hardens)? Or does the invitational register
behave differently?

## Hypotheses (the null is pre-committed and will be reported if it wins)
- **H1 (house thesis):** the commentary amplifies the formula uniformly. Per character, the six
  qualities are at least as dense in the commentary as in the canon, and the commentary adds standing
  apparatus (definitions, tiers, classifications) across the qualities.
- **H0 (the counter, pre-committed):** the commentary does NOT amplify the invitational qualities. Per
  character, the invitational terms (*sandiṭṭhika*, *ehipassika*, *opaneyyika*, *paccattaṃ veditabbo*)
  are DENSER in the canon than in the commentary, and where the commentary does treat them it only
  briefly word-glosses them rather than building apparatus. Any commentarial amplification is SELECTIVE,
  concentrated on the abstract/temporal quality (*akālika*, "timeless"), the one that invites doctrinal
  analysis.

**Prediction from the discovery sweep (stated, so it is auditable): H0, with the selectivity refinement.**
The discovery densities (per million characters, canon vs commentary): *ehipassika* 1.42 vs 0.31
(4.56x canon-denser); *opaneyyika* 1.42 vs 0.38 (3.73x); *paccattaṃ veditabbo* 0.62 vs 0.17 (3.57x);
*sandiṭṭhika* 2.24 vs 1.94 (1.16x); but *akālika* 2.97 vs 13.83 (0.21x, 5x COMMENTARY-denser). The
formula as a co-occurring unit (*ehipassika* + *opaneyyika* in one row): 73 canonical rows vs 14
commentarial. I pre-commit: if the enumeration confirms the invitational terms are canon-dense and the
commentary only word-glosses them while amplifying *akālika*, that is H0, and it is reported as the
finding even though it runs against the program's other five studies.

## What would falsify the prediction (force H1)
- If a per-instance reading shows the commentary builds standing apparatus on *ehipassika* / *opaneyyika*
  (a tiered scheme, a classification, a doctrine) comparable to what it builds on *kammaṭṭhāna* or
  *carita* in the other studies, not just a one-line pada-gloss.
- If the canon-density is an artifact: e.g. the canonical hits are a single repeated stock passage
  (low type-count), or the commentary hits are undercounted by a stemming miss.
- If *akālika* turns out NOT to be the commentary-dense outlier (i.e. the amplification is uniform, not
  selective).

## Method (frozen)
1. **Enumeration.** Full census of the formula in the canon (mūla rows carrying the co-occurring
   *ehipassika* + *opaneyyika*, the formula's signature pair) and of every commentarial row carrying
   *ehipassika*. Each row resolves to a real corpus id (verifiable in the live reader).
2. **Stratum coding.** Each canonical row placed by the frozen work→stratum reference table (NOT an
   independent per-row chronology; per the corrected PROVENANCE-SIGNATURE I.1, the disagreement axis is
   a bucketing aid, and any "early vs late" claim inside the canon is hedged accordingly).
3. **Commentarial-treatment coding (the load of the study).** Each commentarial *ehipassika* row coded
   for what the commentary DOES: `word-gloss` (a pada-by-pada one-line definition, e.g. "ehipassikāti
   'ehi passā'ti yuttā"), `amplify` (builds a standing scheme/classification/doctrine), or `other`
   (quotation, cross-reference). Codebook fixed here; a second coder re-codes a sample for κ.
4. **The selectivity contrast.** *akālika* density by stratum reported alongside, as the within-formula
   control: the prediction is that the commentary's amplification energy goes to *akālika*, not to the
   invitational terms.
5. **Density on the granularity-robust unit.** Per-million-character density (per the corrected SKILL
   rule 8), never raw row counts, for every canon-vs-commentary magnitude claim. Per-layer char totals:
   mūla 53.5M, aṭṭhakathā 29.5M, ṭīkā 28.4M.

## Scope limits (stated up front)
- This is one formula, not the whole "empirical character of early Buddhism" question; the finding is
  about THIS register, not a global claim that the canon is everywhere denser.
- "Invitational" is the author's gloss for the experiential-here-and-now sense; the coding is on the
  Pāli terms, not on that English label.
- The canon-density is necessary but not sufficient for the thesis; the commentarial-treatment coding
  (word-gloss vs amplify) is what distinguishes "the commentary ignores it" from "the commentary
  systematizes it", and that coding is the falsifiable core.
