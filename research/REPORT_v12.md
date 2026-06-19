# The Divergence Is Reception, Not Text: A Provenance-Signature Retrofit of the Auditable-Translation Study

*Auditable Translation project, REPORT_v12. This report retrofits the settled divergence finding
(REPORT_v9 through REPORT_v11, verdict "validated-with-caveats / triage-grade") under the
provenance-signature framework, coding the three axes the framework makes load-bearing for a
translation-divergence question: reception / translation-overlay (I.6), manuscript and edition provenance
with variant readings (I.7 and the text-critical apparatus discipline), and attribution (I.2). It adds a
variant-reading section and a reception / translation-overlay section to the study's record. It does not
re-run the divergence experiment, re-code the gold, or touch the renderer; PREREGISTRATION.md and
REPORT_v11.md are left intact as the frozen pre-registration and the prior report. The data-bound census is
research/translation-divergence/translation-divergence-census.json; the internal log is
research/REPORT_v12_HANDOFF.md.*

Date: 2026-06-19. Research-only (no public dataset, no renderer). Corpus snapshot: 194,710 passages.
**Verdict: confirmed and sharpened.** The divergence signal stands exactly where REPORT_v11 left it
(rank-don't-gate, triage-grade). What the retrofit adds is the provenance of the divergence: the
translators diverge over a Pali that is textually settled at the divergence point, so the divergence is a
reception fact, a property of translator philosophy, not a text-critical one. Of the variant readings the
CST apparatus prints anywhere near the load-bearing divergence loci, one is substantive and the rest are
trivial, and not one of them drives any divergence the study rests on.

---

## 1. The question, re-triaged on its actual shape

The earlier reports answered "is there a complementary detector lane whose signal beats a permutation
null?" and found one: a commitment-classified translator-divergence lane (REPORT_v9, overlap 36, recall
0.409, positional p=0.001, salience p=0.015, on 8 suttas, 88 comment segments), narrowed by the
granularity experiment (REPORT_v11) to a triage-grade rank-don't-gate instrument whose divergence signal is
selective rather than flooding. That is a methods result about a detector. Under the provenance signature it
is also a substantive corpus result, and the substantive result is what this retrofit codes.

The scope gate (the framework's Step 0.5) settles the question's shape first. A translation-validation
question is descriptive, not normative: it asks where defensible translations diverge from the Pali and from
each other, and what carries the divergence. It presupposes a contested category, "divergence in commitment
versus divergence in style," which is itself analyst metalanguage, so the reception axis is auto-required
before anything else. That is the same axis the framework's triage table assigns to a
canon-versus-commentary divergence question and, more sharply, to a literalness question: reception is the
subject.

The load-bearing claims are not assertions about the cosmos. They are claims of the form "at locus X,
translator A and translator B take away a different commitment from the same Pali." Each such claim has two
possible provenances, and the whole point of the retrofit is to separate them. Either the divergence is in
the Pali (the editions disagree, and the translators followed different readings, which would be a
text-critical fact, axis I.7 and the text-critical discipline), or the Pali is settled and the translators
diverge over how to render one agreed reading (a reception fact, axis I.6). The triage therefore makes three
axes load-bearing: I.6 reception, I.7 plus the text-critical apparatus, and I.2 attribution (because two of
the loci turn on who is speaking, and a translator can launder a reported wrong view into a flat assertion).

**Exclusions, justified in writing.** Chronological stratum (I.1) is coded but expected low-yield, and the
finding below confirms that: all 8 divergence suttas are SN Nikaya prose discourses on a single early
stratum, with no Apadana, Vinaya frame-narrative, Abhidhamma, or paritta among the loci, so there is no
within-canon gradient to read and none is invented. Cross-recensional attestation (I.4) and pre-Buddhist
provenance (I.5) are not load-bearing: the question is about modern English renderings of a fixed Pali base,
not about the antiquity or origin of a doctrine. Structured-absence (III.10) is not load-bearing here
because the finding is not a patterned silence. Harmonization (I.8) does not fire because no commentarial
reconciliation attaches to the loci. Genre and register (I.3) is coded coarsely (all loci are
doctrinal-analytical prose) and does not separate the loci. The expensive-axis budget is honoured: two
expensive axes fire (I.2 attribution, the text-critical apparatus), well under the cap.

## 2. The base edition is a reading text: the root edition finding (I.7)

The single most consequential edition fact sits under the whole study and was invisible to the earlier
reports. The divergence experiment runs over the SuttaCentral Mahasangiti Pali (every one of the 8 suttas is
source_edition='sc', work_role='mula', canon='Pali'), and the Mahasangiti is a **reading text**: it carries
no inline variant apparatus. A direct check confirms it: a regular-expression scan for the CST sigla
(si., sya., pi., ka.) over the original field of sn45.8, sn6.1, sn41.6, and sn42.11 returns nothing. The
si./sya./pi./ka. apparatus lives in the Chattha Sangayana (CST Burmese) edition, which the study does not
read at all.

This is why the divergence study could not, on its own materials, have told a text-critical story even if
one were there: its base text has the apparatus stripped out. To code the text-critical axis honestly the
retrofit bridges each divergence locus to its CST monolith sibling (the coarse vagga rows that do carry the
apparatus) and reads the sigla there. The edition declaration for this report is therefore double: the
reception arm reads the Mahasangiti base the study used; the text-critical arm reads the CST apparatus the
study did not.

> *Edition signature: [base of study: sujato-en over cst/sc Mahasangiti reading text |
> apparatus source: cst-burmese monolith siblings | claim status: edition-relative for any variant claim,
> edition-neutral for the reception finding]. Warrant: the 8 sc rows carry no inline sigla; the CST siblings
> do.*

## 3. The reception / translation-overlay section (I.6): the load-bearing additions

Here is where the substantive additions are. For each load-bearing English term the divergence finding
rests on, the retrofit retrieves the Pali it renders and codes the overlay. The discriminator is the one the
framework prescribes: where multiple translators exist, a feature present in one and absent in others is
reception, not text. Multi-translator coverage is live and confirmed for every locus (sn12.15 carries
Sujato, Thanissaro, and Walshe; sn36.21 carries Nyanaponika, Sujato, and Thanissaro; the other six carry
Sujato plus one ATI translator), so the discriminator is operable throughout.

Six traces carry the section. Each renders a Pali that the text-critical census (section 4) confirms is
settled at the divergence point, so each is coded `translator-divergent`.

**The extinguishment of craving (sn6.1).** At sn6.1:1.7 the Buddha reflects that the Dhamma he has realised
is hard to see, naming it `sabbasankharasamatho sabbupadhipatinissaggo tanhakkhayo virago nirodho nibbanam`.
The same Pali, word for word, is rendered by Sujato as "the stilling of all activities, the letting go of
all attachments, the ending of craving, fading away, cessation, extinguishment" and by Thanissaro as "the
resolution of all fabrications, the relinquishment of all acquisitions, the ending of craving; dispassion;
cessation; Unbinding." Two load-bearing terms diverge in commitment over one agreed reading: `nibbanam`
becomes "extinguishment" (Sujato's chosen English equivalent) or "Unbinding" (Thanissaro's etymologising
gloss, from the un-binding of the fire's fuel), and `sabbupadhipatinissaggo` becomes "letting go of all
attachments" or "relinquishment of all acquisitions," a real divergence over `upadhi` (the affective
attachment versus the acquired substrate). A reader of one translation takes away a different referent for
the goal than a reader of the other. Neither is wrong; the divergence is the reception layer, not the text.

> *[locus: sn6.1:1.7 | Pali: nibbanam, sabbupadhipatinissaggo, settled (no apparatus, CST main equals SC
> base) | I.6: translator-divergent | speaker: buddha-vacana, reflective interior monologue].*

**The first absorption (sn45.8).** The strongest single commitment locus in the pooled set, sn45.8:10.2,
defines right immersion: `Idha, bhikkhave, bhikkhu vivicceva kamehi vivicca akusalehi dhammehi savitakkam
savicaram vivekajam pitisukham pathamam jhanam upasampajja viharati`. Sujato renders the jhana factor
`savitakkam savicaram` as "while placing the mind and keeping it connected"; Thanissaro renders it
"accompanied by directed thought and evaluation." This is the textbook vitakka-vicara split, and it is a
genuine difference of commitment about what the first absorption contains. The same sutta carries two more
divergences of the same kind: `jhana` is "absorption" for Sujato and the transliterated "jhana" for
Thanissaro, and `sammasamadhi` is "right immersion" for Sujato and "right concentration" for Thanissaro. All
three sit on definitional Pali whose reading is settled across editions (confirmed in section 4). The
divergence is a difference of translation philosophy, naturalising English equivalents versus
transliterate-and-gloss, applied to one stable text.

> *[locus: sn45.8:10.2 and the eightfold-path definitions | Pali: savitakkam savicaram, jhana, sammasamadhi,
> settled (no siglum at the definition spans) | I.6: translator-divergent | speaker: buddha-vacana, the
> stock definition].*

**The verbal process (sn41.6).** At sn41.6:2.4 Citta explains why thought is a `vacisankhara`: `Pubbe kho,
gahapati, vitakketva vicaretva paccha vacam bhindati, tasma vitakkavicara vacisankharo`. Sujato renders
`vacisankhara` "verbal process"; Thanissaro renders it "verbal fabrications." The divergence is over
`sankhara`, the most contested single term in the canon's psychological vocabulary: a neutral "process" that
conditions speech, or a value-laden "fabrication" that constructs experience. The reading is settled (no
siglum on `vacisankharo` in the CST monolith); the divergence is the rendering of `sankhara`, which is
reception.

> *[locus: sn41.6:2.4 | Pali: vacisankhara, settled | I.6: translator-divergent (the sankhara crux) |
> speaker: named-disciple, Citta the householder, doctrinal].*

**Getting involved and grasping (sn12.15).** At the heart of the Kaccanagotta the Buddha describes one who
`upayupadanam cetaso adhitthanam abhinivesanusayam na upeti na upadiyati nadhitthati: 'atta me'ti`. Sujato
renders the cluster "getting involved, grasping, and insisting ... do not get attracted, grasp, and fixate
on the thought, 'my self'"; Thanissaro renders it "attachments, clingings (sustenances), and biases ... is
not resolved on 'my self'"; Walshe renders `upadana` "grasps." The divergence is over `upadana` and the
`upaya-` prefix, and it is the one locus where the reception divergence sits next to a real text-critical
variant. The next section shows that the variant does not drive the divergence.

> *[locus: sn12.15 | Pali: upadana (in upayupadana), head settled, prefix carries one minority variant |
> I.6: translator-divergent | speaker: buddha-vacana reporting the right-view position, see section 5].*

The reception count is six load-bearing traces, all `translator-divergent`, all over Pali that is settled at
the divergence point. This is the substantive addition the prediction asked for.

## 4. The variant-reading section (the text-critical apparatus, 3.4)

The text-critical discipline applies the edition's variant apparatus to every quoted reading a claim depends
on. Bridging each divergence locus to its CST monolith sibling and reading the sigla there yields a short,
clean census. Each variant is classified `orthographic-trivial`, `morphological`, or
`substantive-claim-bearing`; where a variant could change the claim, the chosen reading is defended.

**The settled loci (no apparatus at the divergence point).** At sn6.1:1.7 the CST monolith
(cst-s0301m.mul-sn1_6) prints `sabbasankharasamatho sabbupadhipatinissaggo tanhakkhayo virago nirodho
nibbanam` with no siglum: the reading is identical to the Mahasangiti base, and the nibbana and upadhi
divergences run over a cross-edition-agreed text. At sn45.8 the eightfold-path definitions in the SN
magga-vagga monolith (cst-s0305m.mul-sn5_1) carry no siglum at `savitakkam savicaram`, `sammavaca`, or
`sammasati`. At sn41.6 the SN Salayatana monolith (cst-s0304m.mul-sn4_7) carries no siglum at `vitakkavicara
vacisankharo`. The strongest reception divergences in the study therefore sit on textually stable Pali. They
are reception, full stop.

**The trivial variants (sn36.21).** The Sivaka monolith (cst-s0304m.mul-sn4_2) prints two variants near the
exchange: `Idha bhavam gotamo kimaha` with a `(Idha pana, sya. kam. pi. ka.)` for the connective, and
`Samampi kho etam, sivaka, veditabbam` with an `(evam veditabbam, sya. kam. ka.)`. Both are
orthographic-trivial: a connective particle and a minor adverbial swap, neither on the divergence-bearing
term, which is `pittasamutthana` (feelings "originating from bile," the humoral-medicine vocabulary the
translators actually diverge over). The Sivaka divergence is reception over a settled reading.

**The one substantive variant (sn12.15).** The Nidana-vagga monolith (cst-s0302m.mul-sn2_1) prints, at the
Kaccanagotta, `upayupadanabhinivesavinibandho` with `(upayupadanabhinivesavinibandho, si. sya. kam. pi.)`,
where the variant lengthens the first vowel of the compound's opening member: `upaya-` (short a) in the CST
main reading versus `upaya-` with a long a in the Sinhalese, Syamese, Cambodian, and PTS line. The
difference is real and claim-bearing. The Dictionary of Pali (DPD) gives short-a `upaya` as "who is attached
(to); who is engaged (with)" and long-a `upaya` as "means; method; approach," so the variant shifts the
compound between an attachment-sense and a means-sense of how the world is bound. This is classified
`variant-substantive-claim-bearing`, and the chosen reading is defended rather than silently taken: the
SuttaCentral Mahasangiti base (the study's own edition) and the CST main reading agree on short-a `upaya-`,
so the reading rests on cross-edition majority (two of the major print lines), and the long-a reading is the
recorded minority. The reading is defended on majority attestation, not down-tagged as contested.

The decisive observation is that this variant does **not** drive the divergence the study rests on. The
reception divergence at sn12.15 is over the head `upadana` ("grasping" versus "clinging" versus "grasps")
and over the cluster of `adhitthana` and `abhinivesa`, none of which carries a variant. The `upaya-`-prefix
variant is adjacent, not load-bearing, and even were the minority long-a reading adopted, all three
translators would still face the same rendering choice over `upadana`. So the census closes on the headline:
of the variants in the loci, one is substantive and two are trivial, the rest of the loci are apparatus-free
at the divergence point, and **zero** variants drive a divergence.

> *Per-claim text-critical signature (the one substantive variant): Claim "the Kaccanagotta describes one
> bound by approach-and-grasping." [reading: upaya- short-a | apparatus: si. sya. kam. pi. record long-a
> upaya- | class: variant-substantive-claim-bearing | chosen: short-a, cross-edition majority (SC base plus
> CST main) | bearing on the divergence: none, the divergence is over the unvaried head upadana].*

## 5. Attribution where it bears (I.2)

Most divergence loci are doctrinal-body Buddha-vacana (the stock definitions opened with `bhikkhave`), and
attribution is uninformative there. Two loci turn on who is speaking, and a careless rendering could mislead,
so attribution is coded for them.

At sn12.15 the load-bearing clause `'atta me'ti` ("'my self'") is not a self-view the Buddha endorses; it is
the content of the wrong-view stance the right-view holder does *not* fixate on. A translation that renders
the clause flat, severed from its negating frame `na upeti na upadiyati nadhitthati`, could read as if the
text asserted a self. The speaker is the Buddha, but the illocutionary owner of the "my self" thought is the
position being denied, and the divergence over `upadana` is precisely a divergence over how clearly the
negation lands.

At sn36.21 the `pubbekatahetu` view (that everything felt is caused by past action) is voiced by the ascetic
interlocutor and corrected by the Buddha. It is an `opponent-then-corrected` claim: a translator who renders
the wrong-view clause without marking that it is overturned would launder a rejected position into canonical
doctrine. Attribution here is the guard the framework requires before a divergence over the eight causes of
feeling can be read as a doctrinal divergence rather than a divergence over how to frame a refuted view.

## 6. Chronology (I.1): the predicted low yield, reported as such

All 8 divergence suttas are SN Nikaya mula prose discourses, coded early-canonical, uniform across the set.
There is no Apadana verse, no Vinaya frame-narrative, no Abhidhamma analysis, and no paritta among the loci,
so there is no stratigraphic gradient of the kind the Uttarakuru retrofit found and nothing to organise by
ascending stratum. The one nuance worth stating honestly: sn6.1 (the Brahmayacana) is a narrative-frame
sutta whose closing verses (`anacchariya gathayo`) are archaic, but the divergence locus sn6.1:1.7 sits in
the prose nibbana-formula, not in the verse, so even the one sutta with an archaic layer contributes its
divergence from the early-canonical prose. Chronology is not load-bearing here, and the retrofit reports the
low yield rather than manufacturing a diachrony the loci do not support. This confirms the predicted shape.

## 7. What did not change: the regression gate

The retrofit adds reception, edition, and attribution coding. It does not re-run the divergence experiment,
re-segment the gold, or re-compute any detection number. The study's inter-annotator agreement is therefore
unchanged (the granularity gold's exact-match IAA of 0.819 on DN2 and 0.634 on the obscure sn36.21, the
commitment-binary 0.981 and 0.731, and the REPORT_v9 strict-consensus precision of 0.45 all stand as
reported), and the verdict is unchanged: validated-with-caveats, rank-don't-gate, triage-grade. One context
number is worth recording without disturbing the result: the live corpus now holds 1,150 passages carrying
both a Sujato and an ATI translation (248 with two or more ATI translators), where the frozen mirror the
p=0.001 result rests on held 945 (177 with two or more). The corpus has grown since the mirror pull; the
detection result is not re-derived on the larger pool, because re-running it would re-open a settled verdict,
which this retrofit is forbidden to do. The growth is reported as recall-ladder context only.

## 8. Verdict and the scored prediction

**Confirmed and sharpened.** The divergence finding stands where REPORT_v11 left it. The retrofit sharpens
its provenance: the translators diverge over a Pali that is textually settled at the divergence point, so
the divergence the detector lane catches is a reception fact, a property of translator philosophy
(naturalising versus transliterating-and-glossing, process versus fabrication, attachment versus
acquisition, extinguishment versus unbinding), not a text-critical one. The single substantive variant in
the loci, the Kaccanagotta `upaya-` prefix, does not drive any divergence and resolves on cross-edition
majority to the reading the study used. This is a result the single canon-versus-commentary axis could not
have produced, because it required separating the modern reception layer from the text-critical layer and
showing that the divergence the study measures lives in the first and not the second.

> **Pre-registered prediction (PROVENANCE-RETROFIT-COORDINATOR.md, 5 R4), scored verbatim:** "the
> reception/edition axes dominate; low chronology yield. PASS if variant-reading + translation-overlay
> sections are the substantive additions."
>
> **Scored: PASS.** The reception / translation-overlay section (section 3, six load-bearing English terms
> traced to their Pali and coded translator-divergent) and the variant-reading section (section 4, one
> substantive plus two trivial variants classified, the rest of the loci apparatus-free, zero variants
> driving a divergence) are the substantive additions. Chronology (section 6) is uniform early-canonical
> across all 8 suttas, the predicted low yield, reported as such and not inflated into a gradient.

## 9. Limitations

The text-critical census reads the CST apparatus, which is itself one edition's record of variants; a
fuller apparatus (the PTS critical notes, the Nalanda Devanagari, manuscript collation) could surface a
variant the CST editors did not print, and the "settled at the divergence point" finding is relative to the
CST apparatus as ingested into the corpus. The reception traces are drawn from the translators the corpus
carries (Sujato plus the ATI set, principally Thanissaro, with Walshe and Nyanaponika at two loci); a wider
translator pool (Bodhi, Horner, the German and French lines) would add reception instances but would not
change the kind of the finding. The divergence detection numbers themselves are the frozen REPORT_v9 and
REPORT_v11 results, with their own stated bounds (within-pool recall, effective n=1 on the cleanest
held-out passage, single model family); this retrofit inherits those bounds and adds no new detection claim.
The chronological coding is coarse (work-level early-canonical) and would not catch a within-sutta
late-redactional seam if one existed at a divergence locus, though none of the loci sits in the
frame-narrative or verse strata where such seams cluster.

## 10. References

### Primary texts (the 8 divergence loci, warrant rows in the corpus)

- **SN 6.1** Brahmayacanasutta, sn6.1 (CST sibling cst-s0301m.mul-sn1_6). The nibbana / upadhi reception
  divergence; the prose formula at sn6.1:1.7.
- **SN 6.15** Parinibbanasutta, sn6.15.
- **SN 12.15** Kaccanagottasutta, sn12.15 (CST sibling cst-s0302m.mul-sn2_1). The upadana reception
  divergence; the one substantive variant (upaya- prefix, si. sya. kam. pi.).
- **SN 36.21** Sivakasutta, sn36.21 (CST sibling cst-s0304m.mul-sn4_2). The pittasamutthana reception
  divergence; two trivial variants; the opponent-then-corrected pubbekatahetu view.
- **SN 41.5** Pathamakamabhusutta, sn41.5.
- **SN 41.6** Dutiyakamabhusutta, sn41.6 (CST sibling cst-s0304m.mul-sn4_7). The vacisankhara reception
  divergence at sn41.6:2.4.
- **SN 42.11** Bhadrakasutta, sn42.11.
- **SN 45.8** Vibhangasutta, sn45.8 (CST sibling cst-s0305m.mul-sn5_1). The savitakka-savicara, jhana, and
  sammasamadhi reception divergences; the definition spans carry no apparatus.

### Editions and translators

- **SuttaCentral Mahasangiti** (the study's Pali base; reading text, no inline apparatus).
- **Chattha Sangayana (CST/VRI)** Burmese edition (the variant apparatus source; si./sya./pi./ka. sigla).
- **Bhikkhu Sujato** and the **Access to Insight** translators (principally **Thanissaro**, with **Walshe**
  at sn12.15 and **Nyanaponika** at sn36.21), the reception layer.
- **Dictionary of Pali (DPD)** for the upaya / upaaya sense distinction.

### Method

- PROVENANCE-SIGNATURE.md (the eleven-axis framework; the triage that selects reception, edition /
  text-critical, and attribution as the load-bearing axes for a translation-divergence question; the
  text-critical apparatus discipline; the reception word-check).
- PREREGISTRATION.md (frozen), REPORT_v9, REPORT_v11 (the divergence finding this retrofit codes).
- research/translation-divergence/translation-divergence-census.json (the data-bound reception +
  text-critical census; consistency-gated) and research/REPORT_v12_HANDOFF.md (the internal query log).
