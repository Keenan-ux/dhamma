# The six higher knowledges (chaḷabhiññā): was abhiññā narrowed to the fixed six in the commentary?

*Queue item 4a. Empirical core, fully sense-audited per the COUNT-LOCK GATE. The write-up (a public
Exploration or a section) is the next step; this file is the auditable dataset. Internal.*

## The claim under test
PED (per the deep-research DR-5 follow-up) reports that abhiññā "narrowed to the fixed six (chaḷabhiññā)
nine-times-in-ten in the commentary." The Encyclopedia of Indian Religions treats abhiññā as the closed
six-fold list, narrowed from a looser canonical (three-fold) sense. The register study found abhiññā
near-even canon vs commentary (ratio 0.867) and its wide-vs-narrow blind sense-coding FAILED (κ=-0.14), so
the narrowing was left untested. This tests it with the discrete, unambiguous compound chaḷabhiññā.

## Method
Per-stratum deduped (is_primary) count of the six-fold compound `cha[ḷl]abhiññ`, vs the bare `abhiññ` stem,
via `research/fetch_evidence.py` (count + live density + full-text sample in one pass). Denominators from
`research/DEDUPED-DENOMINATORS.json`. The matched sample was READ before the count was locked (the gate).

## Result: the fixed-six framing is CANONICAL (late-canonical), NOT a commentarial coinage
chaḷabhiññā per stratum (deduped count / density per Mchar):

| stratum | count | per Mc | note |
|---|---|---|---|
| 1early | 6 | 0.46 | present but rare (Vinaya, Therīgāthā) |
| 2late | 104 | 27.0 | **densest** — but 96 of 104 are the Apadāna (pli-ap), 6 Buddhavaṃsa |
| 3abh | 2 | 0.26 | nearly absent in the Abhidhamma Piṭaka |
| 4para | 9 | 7.42 | para-canonical |
| 5comm | 233 | 7.59 | aṭṭhakathā |
| 6tika | 74 | 2.61 | ṭīkā |
| 7other | 32 | 3.24 | extra-canonical |

canon total 121, commentary total 307.

Three things follow.
1. **The six-fold compound is densest in the LATE CANON (27/Mc), not the commentary (7.6/Mc aṭṭhakathā).**
   It is present already in the early canon (6 rows). The commentary did not coin or narrow it; it inherited
   a six-fold enumeration that was already a late-canonical fixture.
2. **The late-canon density is a genre artifact (sense-audited).** 96 of the 104 late-canon hits (92%) are
   the Apadāna, whose every thera/therī apadāna closes with the same formulaic declaration ("the six higher
   knowledges realized, the Buddha's teaching done"). So 27/Mc overstates the six-fold as a live analytic
   category; it is mostly one stock verse repeated across the hagiographic collection. (The same Apadāna
   genre confound the awakening study found.)
3. **Setting the Apadāna formula aside, the six-fold runs at a steady low level (~7/Mc) from para-canon
   through aṭṭhakathā**, dropping into the ṭīkā (2.6). There is no commentarial narrowing step.

## Verdict on the PED claim
NOT supported as stated. The "fixed six" framing is canonical, not commentarial; the commentary is not where
chaḷabhiññā is densest. The "nine-times-in-ten in commentary" is a PROPORTION claim (of all abhiññā uses in
commentary, what fraction are the six-fold), which a naive count does not bear out either: chaḷabhiññā is
~17% of the bare `abhiññ` stem in commentary (307 of 1799). But the bare stem is contaminated by verb forms
(abhiññāya "having directly known", abhiññāsi), so a clean proportion needs a noun-vs-verb sense split — the
same hard split that failed in the register study (κ=-0.14). That proportion remains the open hard part; the
distribution result (six-fold is late-canonical, not commentarial) is clean and is the contribution.

## Scope limits
- Distribution claim only. Whether the commentary CONCEPTUALLY fixed abhiññā to exactly six as a closed
  doctrinal category (vs the suttas' open use) is a close-reading question this count cannot settle.
- 2late density is Apadāna-formulaic; report it with that caveat, never as a live-category density.
- The bare-stem proportion is verb-contaminated; the "9-in-10" proportion is not tested here.
- stratum() is a register/textual-role lookup, not dated chronology.

## Files
`_chalabhinna_evidence.json` (count + density + read sample per stratum), `_abhinna_broad_evidence.json`
(the bare-stem denominator). Both regenerate via `research/fetch_evidence.py`.
