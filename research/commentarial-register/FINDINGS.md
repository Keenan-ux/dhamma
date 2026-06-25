# The Commentarial Register

A corpus-linguistic study of where nine doctrinal and philological terms concentrate across the canon/commentary seam of the held Pāli corpus, measured on the deduped per-character density. Findings are about word distribution and register only. Nothing here is a doctrinal verdict.

## What was asked

Nine terms were probed for canon-versus-commentary divergence on the deduped per-character measure: the scholastic vocabulary (mātikā, paramattha, cetasika), the realist term sabhāva, the supernatural-display pair (iddhi, pāṭihāriya), the higher-knowledge term abhiññā, and the not-self cluster (the maxim sabbe dhammā anattā, the bare stem anattā, and the existential denial natthi attā). A second question asked whether the technical gloss hardens as a gradient across strata (mūla, aṭṭhakathā, ṭīkā).

The measure is gross deduped per-character density: occurrences per million characters (per Mc), with the canon side deduplicated via is_primary so the canon and commentary denominators are apples-to-apples. The ratio is canon-per-Mc divided by commentary-per-Mc. A ratio above 1 is canon-denser (a counter-result against the house hypothesis that technical vocabulary concentrates in commentary). A ratio below 1 is commentary-denser (a house result).

## Headline results

The scholastic, realist, and supernatural-display vocabularies concentrate in the commentary, in some cases by very large margins. sabhāva leads the entire program: 1.748 per Mc in the canon against 95.06 per Mc in the commentary, a ratio of 0.018, roughly 55 times denser in the commentary. It is the strongest divergence the program has measured. The raw deduped counts are mūla 45, aṭṭhakathā 1632, ṭīkā 3981. The ṭīkā count exceeds the aṭṭhakathā count, so the term intensifies further into the sub-commentary rather than plateauing at the first commentarial layer.

The rest of the house cluster: paramattha 2.331 vs 21.88 (ratio 0.107, about 9.3x commentary), mātikā 2.914 vs 22.29 (ratio 0.131, about 7.6x), cetasika 9.131 vs 18.02 (ratio 0.507, about 2x), iddhi 48.92 vs 155.79 (ratio 0.314, about 3.2x), pāṭihāriya 1.865 vs 9.314 (ratio 0.20, about 5x).

abhiññā is the near-even exception: 26.42 vs 30.47, ratio 0.867, roughly 1.15x commentary-denser. This is reported as weak and effectively no divergence, not as a house result.

## The counter-result: the maxim runs canon-denser

The maxim sabbe dhammā anattā runs canon-denser: 0.933 per Mc in the canon against 0.593 per Mc in the commentary, a ratio of 1.573. The raw deduped counts are mūla 24, aṭṭhakathā 21, ṭīkā 14. It is the only lexeme in the not-self cluster that runs canon-denser. The bare stem anattā is commentary-denser (21.60 vs 188.2, ratio 0.115), and existential denial natthi attā is commentary-denser and rare everywhere (0.117 vs 1.05, ratio 0.111, only 3 deduped mūla hits). So the commentary discusses anattā far more in aggregate, but the canon states the specific universal maxim at higher density.

This echoes the earlier come-and-see counter-result: a short canonical formula concentrates on the canon side while the surrounding technical apparatus concentrates on the commentary side. The dedup correction strengthens this finding rather than threatening it, because deduplication raises canon density.

The predicative not-self constructions dominate existential denial in the early canon. From the anattā-study census, the predicative forms (the n'etaṃ mama / n'eso'hamasmi / na me so attā triad, plus the khandha-applied "X anattā") outnumber existential denial by roughly 60-to-1 to 87-to-1. This is reported as raw counts (predicative roughly 60 to 87, existential roughly 1), not as a per-Mchar multiplier, because the existential denominator is n=1 and a ratio would overstate precision. This is the first counted measurement of the predicative dominance that Collins and Wynne asserted qualitatively. Existential attā in the canon is overwhelmingly eternalist debate and quotation register (the sassato attā ca loko ca formula, the MN2 and MN102 view-catalogues), not endorsed denial.

## The meta-finding: the gradient method is withdrawn

The gradient question (does the technical gloss harden term-by-term across strata) returns null almost everywhere. The reason is methodological, and it is the campaign's central method result. The co-occurrence-ratio instrument cannot isolate term-specific hardening. A verbosity and definitional-register confound lifts every term at once and moves every negative control in step with the signal. pīti moves like vitakka. bhikkhu moves like sati. When the controls track the targets, the instrument is measuring register density, not term-specific semantic hardening.

The gradient method is therefore withdrawn for this question. Only the gross deduped per-character density is reliable, and that is the measure used for every number above.

## The sati null

The proposed memory-to-mindfulness drift for sati is translator idiolect, not a sati-specific shift. The bhikkhu control moves the same old-edition / new-edition way as sati, so whatever is moving moves across unrelated vocabulary, which is the signature of translator idiolect rather than a term-specific change. Coder agreement on the relevant coding was κ 0.90. Reported as a null.

## Methods note: the dedup correction

The canon is double-ingested: the corpus holds both SuttaCentral and Chaṭṭha-Saṅgāyana editions of the canon. Un-deduped mūla is 52.3 Mchar; deduped (via is_primary) it is 25.74 Mchar. The commentary is single-edition at 30.69 Mchar either way. The deduped denominators used throughout are mūla 25.74, aṭṭhakathā 30.69, ṭīkā 28.36, commentary 59.05 Mchar.

The program's prior denominator (mūla roughly 53.5M) was the un-deduped total. It understated canon density and overstated house ratios. sabhāva read 98x un-deduped against 55x corrected. All numbers above are the corrected deduped apples-to-apples densities. This corrects a program-wide convention. Because deduplication raises canon density, the correction makes the come-and-see and maxim counter-results more conservative against the house direction, so it strengthens rather than threatens the prior counter-findings.

Every count re-derives from the committed pipeline (git bf3078e): research/EXPANSION-DISCOVERY-2026-06-24.json, research/EXPANSION-CORRECTED-DENSITY-2026-06-25.json, and each probe's research/<slug>/_raw.json and _protocol.json.

## theravāda is an edition artifact, not a result

theravāda is not reported as a counter-finding. Its apparent canon-tilt is an edition and homograph artifact. The 377 un-deduped "theravāda" mūla hits are dominated by the editorial section-title "Theravāda Vinaya" prepended to Vinaya passages (ids of the pli-tv-bi-vb-* form), not by in-text self-designation. The thera-alone elder-register control runs the opposite way, commentary-denser. theravāda appears here only as a worked example of an edition artifact the method must guard against.

## Sense caveats

Two blind sense-codings failed and are disclosed plainly. sabhāva density is stem density: the own-nature sense dominates, but the adverbial "naturally" sense is not separable (blind sense-coding κ = -0.08). The abhiññā wide-versus-narrow split also failed (κ = -0.14), and abhiññā is near-even regardless.

## Scope and limits

- Deduped per-character density only.
- Stem not sense-resolved where coding failed (sabhāva, abhiññā).
- Stratum is a work_slug lookup, a register seam in the held corpus, not dated semantic change.
- No foreign-language parallel text.
- Theravāda artifact: the held canon is a Theravāda corpus; findings describe this corpus, not Buddhism broadly.
- The gradient method is withdrawn for the hardening question; the co-occurrence-ratio instrument confounds term signal with definitional register.
