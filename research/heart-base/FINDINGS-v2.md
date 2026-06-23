# The heart-base, posited and never verified: a provenance-signature reading (v2)

A retrofit of the three-tier heart-base / bhavanga / insight study under the provenance-signature
framework. The v1 study (HADAYA-INSIGHT-STAGES.md) established a clean three-tier reading: the suttas
are silent on a material seat of mind, the Abhidhamma posits a base but leaves it unnamed, and the
commentary names it the heart and seats the life-continuum on it. This v2 tests that finding on the
axes v1 never coded: the epistemic force of the heart-base claim (II.7), the tradition's own
reconciliation of the canonical silence (I.8), the heart-base under the canon's verification formula
as a structured absence (III.10), and the cross-recensional reach of both the heart-base and the
named insight-nana ladder (I.4). The corpus snapshot is 194,710 passages (2026-06-19); every
citation resolves to a live row. Renderings of Abhidhamma and commentary that the corpus carries
only in Pali are the author's own gloss, checked against Nanamoli. Diacritics in this prose copy are
simplified for the working record; the dataset and the corpus rows carry full diacritics.

The base edition is the Chattha Sangayana (CST/VRI) as ingested into dhamma-pg. Counts are
edition-relative in the sense that the per-paragraph subdivision defines what a row is; the
load-bearing negatives below are reconfirmed by GROUP BY work_role and work_slug, not by row totals
alone. The study's analytic vocabulary (posited versus verified, placeholder, route-map) is a modern
frame named as such, not smuggled in as neutral.

## Triage

The question is an authority-and-literalness question about a posited entity: is the heart, the seat
of mind, the Buddha's, and with what force is it claimed. That routes through the framework's
category-typology and authenticity-textual shapes, which make II.7 epistemic marking and I.8
harmonization load-bearing, with III.10 structured-absence as II.7's natural partner and I.4
cross-recension for the originality arm. The always-on core (layer plus voice, the recall ladder,
chronological stratum) is already half-built by the three-tier matrix. Excluded with warrant: I.5
pre-Buddhist provenance, because the heart-base is a Buddhist scholastic posit rather than inherited
pan-Indian furniture, so inheritance is not load-bearing; I.6 reception, because no modern English
word carries the finding (the claim is about Pali formulae); and the text-critical apparatus beyond
noting the Patthana's sya. siglum, because no single variant reading flips the verdict.

## Recall: the named heart-base versus the unnamed posit

The recall ladder separates two questions the name-substring conflates. The named heart-base
(hadaya-vatthu) runs from 240 rows at the naive surface search, to 272 once the inflected and
compound-medial forms and the hadaya-rupa compound are folded in, to 283 once the concept search is
added. The concept search is the decisive rung. The named term is zero in the four Nikayas and zero
in the seven canonical Abhidhamma books, reconfirmed by GROUP BY: the twenty structurally-root-text
hits are eighteen Visuddhimagga, one Niddesa, and one Milindapanha, none of them early-canonical or
canonical-Abhidhamma. But the unnamed posit, the Patthana's matter dependent on which the
mind-element and mind-consciousness-element occur (yam rupam nissaya manodhatu ca manovinnanadhatu
ca), is canonical-Abhidhamma in seven rows. So the concept is canonical even though the name is not.
This sharpens v1 rather than moving it: v1 already cited the Patthana posit, and the concept search
confirms it is the canon's whole contribution, an unnamed base.

The other two arms behave the same way under the ladder. Bhavanga is zero in the four Nikayas and
present as a bare relatum thirty-eight times in canonical Abhidhamma; the cognitive-process model is
the commentary's surplus, not the term's existence. One caveat on the rising bhavanga ramp across
the layers (38 canonical-Abhidhamma, 48 Visuddhimagga, 235 atthakatha, 569 tika): the raw counts
partly track text bulk, since the commentary was ingested at paragraph granularity (about 58 million
characters across atthakatha + tika) against the canon's whole-sutta rows (53.5 million characters).
Normalized per million characters the ramp keeps its direction but loses much of its magnitude:
roughly 0.7 in the canon, 8.0 in the atthakatha, 20.0 in the tika. The signal is genuine and not a
pure artifact, since the atthakatha holds more rows than the tika (about 92,000 against 82,000) yet
fewer raw hits (235 against 569), so density climbs independently of row count; only the missing
normalization was the defect, and the zero-based claims do not ride the confound at all. The named insight-nana ladder is zero across the
four Nikayas and zero across the seven Abhidhamma books; the lived practice it maps, contemplating
the rise-and-fall of the aggregates (udayabbayanupassi viharati), is early-canonical in twenty-five
Nikaya rows, but as a present-participle practice, never as a numbered station. The early canon has
the walking; the route-map is drawn later.

## Chronology: the misleading-mula tier

The decisive layer-and-stratum disagreement is the Visuddhimagga. It is filed under work_role
mula, yet chronologically it is classical-commentary. Every named heart-base hit at the mula layer
sits in that tier or later. So a flat canon-versus-commentary split that read structural layer as
time would credit the heart-base to the canon through the Visuddhimagga's mula role; the
stratigraphy shows it is a commentary-era development standing on a canonical-Abhidhamma placeholder.
The named insight ladder shows the same shape one tier up: it is first enumerated by name in the
Patisambhidamagga Nanakatha, a para-canonical Khuddaka analytical work that is structurally mula yet
not early. The contrast pair is exact. SN 22.89 has the practice, he dwells contemplating
rise-and-fall: such is form, such its arising, such its passing; the Nanakatha has the named
knowledges, the knowledge of contemplating rise-and-fall; the seventh, the wisdom of contemplating
dissolution, insight-knowledge (udayabbayanupassane nanam; bhanganupassane panna vipassane nanam).
Same subject matter, two strata.

## Epistemic marking: posited, never verified

This is the keystone of the retrofit and the cleaner half of its result. The canon stakes some of
its claims under a verification formula (sacchikatva, having directly realized; the divine eye;
yathabhutam pajanati, knows as it really is) and states others flat as background. The heart-base
is always the second. Across the whole corpus the named heart-base never falls in-window under any
verification formula, and the silence is patterned rather than thin: those formulae are abundant in
the same corpus, with sacchikatva in 654 rows, the full having directly realized by his own direct
knowledge formula in 190, and knows as it really is in 264.

The proximity guard is what makes this admissible. A single row carries both the heart-base and
sacchikatva, but the gap between them is 87,102 characters: the verification verb is in a wholly
separate pericope. One tika row carries the heart-base and the divine eye 120 characters apart, but
reading the window shows the divine eye is the faculty being glossed, not a knowing predicated of the
heart-base. The closest co-occurrence of all, seventy characters, is the sharpest evidence for the
opposite of verification: it reads the fifth jhana, operating by way of direct knowledge, runs
dependent on the heart-base alone (abhinnavasena pavattam pancamajjhanam ... hadayavatthunneva
nissaya). There the heart-base is the posited support that a knowing-citta runs on, not the object a
knowing confirms. The heart-base is introduced everywhere by the grammar of a posit, an
existence-and-support analysis (atthibhavo, the support-characteristic), never by the first-person
aorist of realization.

A negative control sets the bound on what the zero shows. A matched material support, the eye-base
(cakkhuvatthu), also never co-occurs in-window with a verification formula (0), exactly like the
heart-base, while bhavanga, which names an experienced state rather than a posited seat, does
co-occur 8 times. So "posited, never verified" partly reflects the non-verified grammar of material
supports as a class, a reading consistent with a doctrine-specific epistemic downgrade but not by
itself a proof of one. The stronger, independent in-corpus support for "posited" is the
harmonization witness below: the sub-commentary itself records the heart-base as Paliyam anagata,
not handed down in the text. (Both control counts are recorded in research/heart-base/counts-snapshot.json
and asserted on every build.)

## The structured absence

The absence is therefore admissible as evidence, not merely a gap. The expected-presence frame is
large and SQL-counted: the verification register is attested 654, 190, and 264 times. The
co-occurrence of the named heart-base with that register, in-window, is zero. The trivial
explanations are ruled out: not a recall miss, since the ladder was climbed; not corpus size, since
the frame is large; not a synonym hiding the hit, since the concept search was run and found only the
unnamed posit, which is itself never verified. What the silence licenses is bounded: the heart-base
is assumed-as-given, a posited material support, not asserted-as-verified. What it does not license
is the claim that the tradition doubted the heart-base; it is stated flat and built upon, simply
never staked under the test of direct knowledge. The contrast class is the four truths, rebirth by
kamma, and the destruction of the taints, which are repeatedly staked under exactly these formulae.
The heart-base never is.

## Harmonization: the tradition flags its own gap

The tradition does not paper over the canonical silence; it states it and reconciles it, and the
reconciliation is itself the evidence of a felt tension. Two independent sub-commentary witnesses use
the same move. The Abhidhamma-tika says, although the heart-base does not come down in the
canonical text, its existence is to be known from scripture and from reason; as for the scripture
(Paliyam anagatassapi hadayavatthuno agamato, yuttito ca atthibhavo vinnatabbo; tattha agamo tava),
and then quotes as its scripture the Patthana's anonymous yam-rupam-nissaya clause, citing it as
pattha. 1.1.8. The Visuddhimagga-mahatika poses the same question and gives the same answer: how is
it to be known that the heart-base is the support-characteristic of the mind-element and the
mind-consciousness-element? From scripture and from reason (Agamato, yuttito ca), quoting the same
clause in line.

The shape of this is worth stating plainly. The commentary admits the heart-identification is not
handed down in the canon (Paliyam anagata), and it closes its own gap with the very placeholder it is
naming. The scripture it adduces to warrant the heart is the unnamed Abhidhamma base. The
harmonization is coded reconciled-by-distinction, and its locus is Abh-t 84.74 to 84.75 and
Vism-mht 16.24.

## Cross-recension: a Theravada differentia and a Pali-local ladder

The corpus link is null for the heart-base and weak for the ladder, and the framework's honesty
guard governs both. The Patthana, the posit locus, carries no parallel rows of any kind, because the
SuttaCentral parallels table is sutta-to-sutta and structurally under-covers the Abhidhamma; the null
is a genre blind-spot, coded untested rather than Pali-unique. The doctrinal fact, attributed to
comparative-Abhidharma scholarship and not derived from this corpus, is that seating mind in the
heart is a recognized Theravada differentia: the northern Abhidharma does not localize mind in the
heart-base. The named insight ladder has some Chinese parallels at the level of sutta content (the
Patisambhidamagga's Samyukta-Agama parallels), but a container parallel is not a feature parallel:
the numbered sixteen-nana sequence is a Patisambhidamagga and Theravada-Khuddaka systematization with
no clean Agama parallel as a graded ladder. The shared, plausibly pre-sectarian seed is not the
route-map but the territory it maps, the lived contemplation of rise-and-fall, which is in the four
Nikayas and recurs across recensions.

## Verdict and prediction

The pre-registered R3 prediction was that the heart-base is never epistemically verified, only
posited, and that the insight-nana ladder is Theravada-systematic with no clean Agama parallel, to
pass if the epistemic column shows posited, never verified and the cross-recension link is absent
or under-covered. The result is PASS. The epistemic column reads posited, never verified: zero
in-window co-occurrence with a verification register that is itself abundant, and the one close
co-occurrence has the heart-base as the support of a knowing-faculty rather than its object. The
cross-recension link is null for the heart-base and under-covered for the ladder, and both are
Theravada-local, the heart-base as a doctrinal differentia and the numbered ladder as a Khuddaka
systematization.

The verdict on the v1 finding is CONFIRMED and sharpened. The three-tier reading, sutta silence to
Abhidhamma placeholder to commentarial naming, holds in every cell and gains two edges. The
placeholder is never epistemically verified; it is posited and built upon. And the commentary
reconciles its own naming against an admitted canonical silence, from scripture and reason, adducing
the very placeholder as the scripture. The three-tier matrix is carried verbatim from v1.1 as the
regression baseline; no cell was recoded.

## Sources for the attributed claims

Frauwallner, Studies in Abhidharma Literature; Cousins, Abhidhamma Studies III; Gethin, The
Foundations of Buddhism; Ronkin, Early Buddhist Metaphysics (for the Theravada heart-base as a
school differentia and the late dating of the seven books); Braun, The Birth of Insight (for the
modern revival of the apparatus); Pa-Auk Sayadaw, Knowing and Seeing (for the heart-base in modern
practice).
