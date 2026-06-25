# Come and See: a canonical register the commentary preserves but does not systematize

*A canon-versus-commentary study. dhamma-research method; pre-registered (`PREREGISTRATION.md`, frozen
before coding) as a deliberate counter-thesis test. Corpus snapshot 194,710 passages. v1.1, corrected
after adversarial review (the akālika "selectivity" over-read was dropped; see §IV).*

## Abstract

**Background.** Five earlier studies in this program found one recurring shape: the early discourses
read as supple and functional, and the later literature systematizes, names, and hardens what they
left open. A standing worry about that result is that the framing manufactures it, that any topic run
through the harness will return "the commentary systematizes." This study was chosen to test that
worry, on a topic where the prior points the other way.

**The formula.** The canon describes the Dhamma with a fixed six-quality phrase, recited as a
recollection (the *dhammānussati*): well-proclaimed (*svākkhāta*), directly visible (*sandiṭṭhika*),
timeless (*akālika*), come-and-see (*ehipassika*), onward-leading (*opaneyyika*), and to be known by
the wise each for themselves (*paccattaṃ veditabbo viññūhi*). Four of the six are invitational: they
present the Dhamma as something to be verified here and now, by anyone, for oneself.

**Finding (H0, the pre-committed counter).** The invitational register is canon-dense, and the
commentary does not systematize the formula. Per million characters, the invitational terms run several
times denser in the canon than in the commentary: *ehipassika* 4.4 times, *opaneyyika* 3.5, *paccattaṃ
veditabbo* 3.4, *sandiṭṭhika* 1.1. The signature pair *ehipassika* with *opaneyyika* occurs in 71
canonical rows, 63 of them in the four Nikāyas and spread across all four. And across all 18
commentarial rows that carry *ehipassika*, the treatment is a brief word-gloss (6), a structural
correlate (6), a grammatical note (1), a bare quotation (2), or the Visuddhimagga's recollection-gloss
(3); not one builds a standing scheme, tier, or doctrine on any quality of the formula. Within the
formula the commentary glosses all six qualities at the same low level, *akālika* included: its
in-formula gloss, "not bearing fruit at a later time" (*na kālantare phaladāyako*), is as short as the
*ehipassika* gloss. The harness, run honestly on this topic, returns a non-house verdict: a canonical
register the later literature preserves by brief gloss rather than systematizing.

## I. The question and why it is a fair test

The program's house finding is that the commentary systematizes the canon. The fair test of whether
that finding is real or manufactured is to pick a topic where the discovery signal points the other
way, pre-commit to reporting the counter-result, and then read the instances. The discovery sweep
(`_discovery_counter.py`, the only data seen before the pre-registration freeze) ranked twenty-three
candidate canonical-formulaic terms by per-character canon-versus-commentary density. Most ran the
house direction, several of them strongly: the discovery-phase figures (not part of the enumeration
below, recorded only in the sweep script) put *saṃvega* "urgency" at roughly a tenth of the canonical
density in the commentary, and *anupubbikathā* "the graduated talk" and the provisional-abandonment
pair *tadaṅga* / *vikkhambhana* lower still. The commentary dwells on these far more densely than the
canon, exactly as the house thesis expects. That the same instrument finds both directions is itself
the answer to the manufactured-result worry. The topic taken up here is the one cluster that ran
hardest the other way: the invitational qualities of the Dhamma.

## II. The formula in the canon

The signature pair *ehipassika* with *opaneyyika* occurs in 71 canonical rows. Those rows are two
overlapping editions of the same texts: 39 fine-grained SuttaCentral sutta-rows and 32 coarse
Chaṭṭha-Saṅgāyana vagga-rows that re-cover the same suttas, so the raw count of 71 overstates the
number of distinct discourses. What the rows establish is distribution, not abundance: the formula sits
across the four Nikāyas (Aṅguttara, Saṃyutta, Dīgha, Majjhima), the Khuddaka, and the para-canonical
Niddesa and Nettippakaraṇa, with 63 of the 71 in the four Nikāyas. (The 2 Visuddhimagga rows that also
carry the pair are commentary shelved as mūla and are counted with the commentary, not here.) The four
Nikāyas are the early-canonical stratum, placed by the frozen work-to-stratum reference table, a
bucketing aid rather than an independent per-row chronology. So the formula is an early and broadly
distributed canonical fixture. The breadth argument rests on this distribution and on the per-character
density of §IV, not on the raw row count.

A type-versus-token caveat the pre-registration named: *ehipassika* occurs in 76 mūla rows and the
formula in 73 of them, so almost all canonical *ehipassika* is inside this one recitation formula. The
canon-density is therefore recitation-driven, a high token-count of one broadly recited formula, not
many independent canonical formulations. That is a real limit on the generality of the headline, and it
is stated rather than hidden.

## III. What the commentary does with it (the falsifiable core)

Density alone does not settle the thesis: a term could be canon-dense and still be systematized by the
commentary wherever it appears. So each of the 18 commentarial *ehipassika* rows was coded for what the
commentary actually does, against a codebook fixed in the pre-registration. The result:

- **word-gloss (6 rows).** The standard pada-by-pada definition. "Ehipassikāti 'ehi passā'ti evaṃ
  dassetuṃ yuttā" (Mp-a): "come-and-see means, fit to show 'come, see'." Or the etymological form, "fit
  for the procedure 'come, see this Dhamma', therefore come-and-see" (Spk-a, KN-a).
- **correlate (6 rows).** A sub-commentarial move that maps the six qualities onto the parts of another
  phrase ("by the former, timelessness; by the latter, the come-and-see quality"). It is a structural
  note about the formula's symmetry, not an apparatus built on the invitational quality. All six are the
  same ṭīkā passage recurring across the four Nikāya sub-commentaries.
- **grammatical (1), quotation (2), recollection-gloss (3).** One taddhita-derivation note; two bare
  quotations of the formula; and the three Visuddhimagga rows, which gloss the formula inside the
  recollection-of-the-Dhamma meditation, again by etymology and a short chain of reasons.
- **amplify (0 rows).** Nowhere does the commentary build a standing scheme on a quality of the formula:
  no enumerated types of *ehipassika*, no tiered classification, no doctrine of the come-and-see. This
  is the falsifier the pre-registration named, and it does not fire. The boundary is explicit:
  *correlate* maps the formula's members onto another phrase; *amplify* would be an enumerated typology,
  tier, or doctrine predicated on a quality itself. The full row text for all 18 rows is stored in the
  dataset so the call is independently checkable, and a blind second coder recoded all 18 rows from the
  same text against the pre-registered codebook: agreement was total (Cohen κ = 1.00 on the five-way
  descriptive code), and the second coder independently returned amplify = 0. Once amplify returns zero
  the amplify-vs-not call is a binary with no variance, so a κ on it is undefined; that verdict is
  therefore reported as an exact replication rather than a κ, and the κ figure is the descriptive code.

## IV. What about akālika

The one quality of the formula that the commentary treats heavily is *akālika*, "timeless", which runs
about five times denser in the commentary corpus than in the canon and peaks in the sub-commentary. An
earlier draft of this study read that as selective systematization, the commentary elaborating the part
of the formula that rewards it. The adversarial review showed that reading to be wrong, and it is
dropped. The *akālika* density is a corpus-wide count: of roughly 800 commentarial rows carrying the
stem, at most the 18 that also carry *ehipassika* can be inside the formula, so the overwhelming
majority are *akālika* used as a free-standing doctrinal adjective elsewhere, in the arguments about the
timelessness of *nibbāna* and the no-interval relation of path to fruit. Inside the formula, *akālika*
gets the same brief pada-gloss as the invitational terms, and in two of the Aṅguttara rows a shorter
one. So the honest reading is the simpler one: within the formula the commentary glosses all six
qualities briefly and builds apparatus on none of them; *akālika* earns its apparatus elsewhere, for
reasons that have nothing to do with the come-and-see formula. The commentary's selectivity is real
across the corpus at large, but it is not a fact about how this formula is treated, and the study no
longer claims it is.

## V. What this means, and what it does not

The result is a genuine non-house verdict: a canonical register the later literature does not
systematize, on the granularity-robust per-character measure the program adopted after the 2026-06-23
review, not a row-count artifact. The same instrument, on other terms, finds the house direction
plainly; that it returns the counter here, against its own prior, is the point of running it.

The claim is deliberately narrow. It does not show the canon is everywhere denser than the commentary;
the discovery sweep is full of terms that run the house direction. It does not rest on raw row counts,
which mix two editions and are recitation-driven; it rests on per-character density and on the
four-Nikāya distribution. It does not claim the commentary is hostile or indifferent to the invitation:
it word-glosses it faithfully and recites it in the recollection meditation. The narrow and defensible
finding is this: the Dhamma's come-and-see register is one place where the canon, not the commentary,
is the dense one, and the commentary, for all that it systematizes elsewhere, only briefly glosses it.

## Appendix — auditability

Every canonical and commentarial row resolves to a real corpus id, listed in the served dataset
(`public/research/come-and-see.json`) and opening in the live reader. The corpus-level counts re-derive
from `_enumerate.py` (committed query-to-result); the canon density numerator excludes *pli-vism*. The
treatment coding is per-row in the dataset, with the full row-text window stored so the amplify-zero
verdict is independently checkable; the codebook is in `PREREGISTRATION.md` §3. A blind second coder
recoded all 18 rows against that codebook (Cohen κ = 1.00 on the five-way code; amplify = 0 independently
replicated); both codings are committed in `build_dataset.py` and per-row in the served dataset. Per-layer
character totals (the density denominators): mūla 53.5M, aṭṭhakathā 29.5M, ṭīkā 28.4M.
