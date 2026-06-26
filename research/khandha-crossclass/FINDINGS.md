# The khandha × āyatana × dhātu cross-classification: an Abhidhamma feature?

*Queue item 4b. Empirical core, sense-audited per the COUNT-LOCK GATE. Write-up (Exploration or section)
pending. Internal.*

## The claim under test
Bhikkhu Bodhi (commenting on SN 35.1, The Connected Discourses of the Buddha) states that "the correlations
between the khandhas, āyatanas, and dhātus are not made explicit in the Nikāyas at all, but only in the
Abhidhamma Piṭaka, which classifies both the first five internal and external sense bases under rūpa." (This
claim was previously mis-attributed to Sue Hamilton; see `research/deep-research/item6-source-verifications.md`.
Hamilton's own move is the opposite — she challenges putting the sense faculties under rūpakkhandha.)

## Method
Per-stratum deduped (is_primary) count of passages co-occurring all three classificatory terms (`khandh` AND
`āyatan` AND `dhātu`), per million characters (denominators from `research/DEDUPED-DENOMINATORS.json`). The
early-canon cell was sense-read before the count was locked (the gate). Co-occurrence is a proximity proxy
for the cross-classification, not a parse of it.

## Result: the systematic matrix peaks in the Abhidhamma

| stratum | co-occur | per Mc |
|---|---|---|
| 1early | 26 | 1.99 |
| 2late | 36 | 9.35 |
| 3abh | 255 | **33.66** |
| 4para | 16 | 13.19 |
| 5comm | 269 | 8.76 |
| 6tika | 241 | 8.50 |

The three-fold co-occurrence is densest in the Abhidhamma Piṭaka (3abh, 33.66/Mc), about 17 times the early
canon (1.99/Mc), and it does NOT intensify into the commentary (5comm 8.76, 6tika 8.50 — it falls back).
That peak-at-the-Abhidhamma, no-commentarial-intensification shape is exactly Bodhi's "explicit only in the
Abhidhamma."

## The sense-read correction (the gate working)
The early-canon cell (26 rows) is mostly INCIDENTAL co-occurrence, not cross-classification: dn1
(Brahmajāla), dn2 (Sāmaññaphala), sn8.12 (Vaṅgīsa verses), thig3.2 are long discourses that mention all
three terms in different places, not a matrix. The genuine exception read in the sample is **mn115
Bahudhātukasutta** ("the Many Elements discourse"), which DOES enumerate elements, sense-bases, and
aggregates together — a real early-canonical cross-classification seed. So Bodhi's "not made explicit in the
Nikāyas AT ALL" is slightly too strong: there is a canonical seed (mn115). What is an Abhidhamma development
is the DENSE, SYSTEMATIC matrix; the raw early-canon co-occurrence count (26) overstates early
cross-classification because most of it is incidental co-mention in long suttas.

## Verdict
Bodhi's claim is SUPPORTED in its core (the systematic khandha×āyatana×dhātu cross-classification is an
Abhidhamma feature, ~17× denser there than in the early canon, peaking at the Abhidhamma and not the
commentary) and slightly TOO STRONG in its absolute form (the Bahudhātuka Sutta, mn115, is a genuine
canonical cross-classification seed). The pattern matches the program's recurring shape: a canonical seed,
an Abhidhamma systematization.

## Scope limits
- Co-occurrence is a proximity proxy, not a parse of the cross-classification syntax; a passage can carry
  all three terms without cross-classifying them (the sense-read shows most early hits do not).
- The rūpakkhandha-classification of the sense faculties specifically (Bodhi's second clause) is not isolated
  here; the `cakkh`-added cell (3abh 185, 5comm 84) is a coarse proxy and would need its own sense-audit.
- stratum() is a register/textual-role lookup, not dated chronology.
