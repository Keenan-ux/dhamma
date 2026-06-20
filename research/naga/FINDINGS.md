# The Nāga as a Class of Being in the Pāli Canon

*What the canon holds a nāga to be, ontologically and soteriologically, and how the Aṭṭhakathā and Ṭīkā
systematize that picture.*

## Abstract

The nāga is the Pāli canon's exemplary liminal being: a serpent that keeps the sabbath, hears the Dhamma,
and can take human shape, yet cannot win the path while it remains a nāga. This study asks what the canon
holds a nāga to be and how its commentaries develop that account, with canon versus commentary as the
cross-cutting axis. A first result is lexical and load-bearing. *Nāga* is a heteronym, and a bare search is
a trap: of 3,910 corpus rows that carry a genuine *nāga*-token, only 1,267 (32 percent) use the word of the
serpent-being, and in the canon proper the serpent sense is just 159 of 935 such rows (17 percent), or
7 percent of the 2,282 rows that merely contain the string. The rival senses are the bull-elephant, the
monk Nāgasena and his namesakes, the honorific of a sinless sage, the citizen (*nāgara*), and the ironwood
tree, over a base of morphological accidents (*samannāgata*, *anāgāmī*) that swamp the raw string.

On the 1,267 serpent rows, 666 of which assert an ontological or soteriological claim, the picture is best
put as *faithful on the bare facts, innovative in the apparatus*. Two kinds of evidence carry that claim.
The first is distributional and census-wide: across the claim-bearing serpent passages the commentary holds
the great bulk of every facet, and most heavily the facets of furnishing (realm and habitat, power). The
second is a close reading of the load-bearing canon-to-commentary cells. The canon fixes, in the Buddha's
own voice, the four modes of nāga-birth (SN 29), the animal (*tiracchāna*) destination, and the
soteriological ceiling, which it even names (*nāgā aviruḷhidhammā*, "of non-growth-nature") and enacts in
the Vinaya's bar on ordaining animals. The commentary supplies the machinery: an Abhidhamma rebirth-linking
rooted in bad kamma, a water-dwelling frog-eating habitat, the expansion of the disguise-failure occasions
from two to five, the broadening of "animal" to any non-human down to Sakka, and the doctrinal reason for
the ceiling, namely that the nāga is *abhabba*, incapable of jhāna, insight, and path-and-fruit. Of the
eleven load-bearing cells examined, six are faithful and five are located innovations.

## 1. Question and hypotheses

The master question is what the Pāli canon holds a nāga to be, as a class of being (its mode of birth, its
place in the cosmos, its lifespan and powers, the karma that makes one) and as a soteriological subject
(it keeps the uposatha, hears the Dhamma, can take human shape, yet cannot win the path), and how the
Aṭṭhakathā and Ṭīkā systematize, harden, or soften that picture. A prior question must be answered first,
because the word itself is a trap: what counts as a nāga at all.

The pre-registered hypotheses were:

- **H_lex.** The raw lexical footprint of *nāga* is dominated by non-serpent referents; a naive search is
  unfit for the enumeration.
- **H_A.** The canon fixes the load-bearing ontological facts (the four births; the animal destination)
  but supplies little of the fine apparatus (numbered lifespans, realm geography, a powers taxonomy).
- **H_B.** The canon establishes the soteriological ceiling narratively and legally rather than by stated
  doctrine; the rationale is a commentarial supply.
- **H_main (H0 vs H1, per cell).** For each ontological or soteriological claim the commentary makes, does
  a canonical passage warrant it (H0, faithful systematization) or not (H1, innovation)? The reported
  result is the quantified split, not a single winner.

The hypotheses were frozen, with the codebook and stopping rule, before the full census (corpus snapshot:
194,710 passages). H_B was deliberately stated so it could be corrected by the evidence, and it was: the
canon turns out to *name* the ceiling, not merely enact it (§6).

## 2. Literature

The nāga has a long scholarly record as an ambiguous figure. Vogel's survey of Indian serpent-lore (1926)
established the nāga as a pre-Buddhist cult-object absorbed into Buddhist and Hindu narrative; Bloss (1973)
read the Buddhist nāga specifically as a being poised between worship and subordination, honoured yet
fixed beneath the human. DeCaroli (2004) set that subordination at the centre of early Buddhist religion,
the spirit-deities given a place and denied the path. Appleton (2010) read the nāga-king Jātakas as
narratives of the bodhisatta's virtue oriented toward a future human awakening. Collins (1998) and Gethin
(1997) read the Pāli cosmos as a soteriological map rather than a gazetteer. This study confirms the
ambiguity these scholars describe and locates it: it quantifies where in the tradition the subordinating
work is done, and finds that the canon, not only later devotion, already classes the nāga as an animal and
names its incapacity, while the commentary supplies the system and the reason.

## 3. Methodology

**Corpus and edition.** The Chaṭṭha Saṅgāyana (CST/VRI) recension as ingested into a Postgres corpus of
194,710 passages, with SuttaCentral identifiers as the cross-walk and the preferred citation for Nikāya
suttas. CST is used because it is the only layer carrying the full Aṭṭhakathā and Ṭīkā that the
canon-versus-commentary axis requires. The layer axis is exact, taken from each row's structural role:
*mula* (canon, 17,996 rows), *attha* (Aṭṭhakathā, 91,843), *tika* (Ṭīkā, 81,841), *anya* (extra-canonical,
3,030).

**The lexical frame and the disambiguation.** The candidate frame was built by case-insensitive regular
expression over the Pāli text directly in the database, not through the search service, so that a count is
a count and not a ranked search impression. The serpent word cannot be isolated by a single pattern: a
naive substring catches the morphological families *āgata* ("come"), *āgāmin* ("returner"), *āgacchati*,
*agghati*, and *āghāta*, in which the letters *n-ā-g-a* are a seam between morphemes. The frame is therefore
the broad substring *nāg* minus those families (NOISE = `nāg(at|ām|acch|aman|ant|āra|h)|nāggh`), which
yields 3,909 candidate rows carrying a genuine *nāga*-token; one further commentary row, recovered when the
load-bearing spine was read by hand, brings the genuine-token total to 3,910, an illustration in miniature
of the recall floor discussed in §9. These rows were windowed (a context window around each occurrence) and
then classified by sense.

**Codebook.** Each candidate row was assigned a `referent`: `serpent` (the serpent-being, the study
target), `elephant` (the bull-tusker and its similes), `epithet` (the honorific of a sage, by the
traditional edifying etymology *na + āgu*, "one who does no wrong"; the same lexeme as the serpent word),
`tree` (ironwood or betel), `person` (a human name such as Nāgasena, Nāgita, Nāgasamāla), `citizen`
(*nāgara*, urban), `nonlexical` (a morphological false friend that slipped the filter), or `ambiguous`.
Only `serpent` rows enter the census; the others are logged with counts. For each serpent row a
`claim_bearing` flag records whether it asserts a proposition about what a nāga is or its religious status,
and if so a `facet` (one of thirteen: mode of birth, classification, realm and habitat, lifespan, power,
karma-cause, diet and predation, uposatha, hearing the Dhamma, taking human form, the path-ceiling, the
ordination bar, the bodhisatta as nāga). For each commentarial claim a `warrant` records the canonical
passage that licenses it, or its absence.

**Reliability.** The ambiguous canonical rows (the load-bearing layer) were classified blind from the Pāli
windows. To measure reliability a random 124-row subsample was coded independently by three coders;
agreement was almost perfect, Fleiss *κ* = 0.853 on the eight-way sense classification and 0.874 on the
serpent-versus-not binary, with the three coders unanimous on 83.9 percent of rows. The remaining canonical
ambiguous rows and the whole commentary were single-coded against that validated codebook; the deterministic
strong-serpent rows, where a name such as *nāgarāja* or *nāgayoni* fixes the sense, were auto-classified and
not human-coded for sense. The fourteen load-bearing spine passages were additionally read in full and
quote-verified against the source; the remaining serpent rows are confirmed to exist as live corpus rows but
their quoted evidence was not individually re-confirmed (see §9).

**Translation provenance.** Where the corpus carries English, the SuttaCentral mula rows, the rendering is
Sujato's, who translates *nāga* as "dragon." The Vinaya Mahākhandhaka and all commentary carry no English
in the corpus, so those renderings are the present author's own gloss, marked as such and checked against
Horner's *Book of the Discipline* (Vol. IV).

**Query log and data availability.** The frame query, the noise rule, the codebook, the per-coder outputs,
and the inter-annotator computation are published with the dataset (`public/research/naga.json`); every
record identifier resolves to a live passage in the reader.

## 4. One word, many beings

The size of the disambiguation problem is itself a result. In the canon alone the bare substring *nāga*
occurs in 2,282 rows, but only 935 of those carry a genuine *nāga*-token; the other 1,347, 59 percent, are
morphological accidents on *āgata* and its kin. (A stricter word-initial gate left 851 genuine canon rows,
a 70-percent noise figure; the looser frame used here is the conservative one.) Past that filter the genuine
*nāga*-word is still a heteronym with at least five living senses. The full count, by the four textual
layers:

| Sense | Canon | Comm. | Sub-comm. | Extra-can. | Total |
|---|---:|---:|---:|---:|---:|
| **serpent-being** | **159** | **819** | **203** | **86** | **1,267** |
| elephant | 214 | 422 | 87 | 42 | 765 |
| personal name | 311 | 96 | 57 | 28 | 492 |
| morphological false friend | 92 | 264 | 225 | 59 | 640 |
| citizen / urban | 17 | 222 | 38 | 25 | 302 |
| epithet of a sage | 91 | 120 | 38 | 15 | 264 |
| tree (ironwood / betel) | 40 | 79 | 18 | 11 | 148 |
| undecidable | 11 | 6 | 6 | 9 | 32 |
| **All genuine *nāga* rows** | **935** | **2,028** | **672** | **275** | **3,910** |

The serpent-being is 1,267 of 3,910 genuine rows, and 159 of the canon's 935. The two largest rivals are
instructive: *person* is dominated by the monk Nāgasena of the Milindapañha, and *elephant* is the noble
tusker of simile, "the king's nāga." Both are why a bare count of "nāga in the canon" overstates the
serpent by an order of magnitude. That the same word names the serpent, the elephant, and the sinless one
is not noise to be discarded but a fact about the language, recorded here as the study's first finding, and
the methodological reason a name-based enumeration of any Pāli term must disambiguate before it counts.

## 5. What a nāga is

The canon's ontology of the nāga is compact and given in the Buddha's voice. The Nāgasaṃyutta (SN 29) fixes
the four *nāgayoni*, the modes by which nāgas are born: from an egg, from a womb, from moisture, and
spontaneously; and it ranks them, the spontaneous highest ([SN 29.1](sn29.1), [SN 29.2](sn29.2)). The same
collection states their nature in three words that recur as the object of longing, *dīghāyukā vaṇṇavanto
sukhabahulā*, long-lived, beautiful, abounding in happiness ([SN 29.7](sn29.7)). One is reborn among them
by a precise recipe: mixed conduct of body, speech, and mind, plus having heard of the nāgas' glory, plus
the aspiration to it, plus an act of giving, a list of ten gifts ([SN 29.11–20](sn29.11-20),
[SN 29.21–50](sn29.21-50)). The decisive ontological fact is supplied in the Vinaya: the nāga is
*tiracchānagata*, gone among the animals, a destination below the human and the divine. Its powers, the
coils and the hood, the dwelling (*bhavana*) it emerges from, and above all the shape-shift into human
form, are shown rather than catalogued, most fully in the nāga-king Mucalinda, who sheltered the newly
awakened Buddha through seven days of storm with his coils and hood and then took the form of a brahmin
youth to worship him ([Ud 2.1](ud2.1)). The canon also gives the nāga a fixed cosmological place: the
Āṭānāṭiya-sutta sets the nāga-host as one of the four guardian armies of the quarters, beside the yakkhas,
gandhabbas, and kumbhaṇḍas ([DN 32](dn32)), and the Mahāsamaya lists the nāgas among the orders of beings
gathered before the Buddha ([DN 20](dn20)). The nāga's standing enemy, the garuḷa (supaṇṇa) that preys on
it, is likewise canonical: the Saṃyutta gives the supaṇṇas their own collection of four births mirroring
SN 29 (SN 31), and DN 20 has the Buddha make peace between the two. The food-chain is not a commentarial
invention.

The commentary lays detail over this canonical frame, and where it exceeds the frame it does so toward
system. The Samantapāsādikā gives the nāga an Abhidhamma classification the suttas never state, a
rebirth-linking consciousness rooted in the result of bad kamma, so that for all its deva-like lordship the
nāga is technically a woeful rebirth; and it furnishes the habitat the suttas leave blank, a creature that
moves in water and eats frogs. The four-births commentary (the Catuyonivaṇṇanā) sets the nāga's four
*yoni* into a full cosmological scheme of who is born how, and cross-refers the canonical four
supaṇṇa-births. By the full enumeration the imbalance is plain: across the claim-bearing serpent passages
the commentary carries the great bulk of every ontological facet, and most heavily those of furnishing.
Counting the canon (mula) against the principal commentary (aṭṭhakathā), realm and habitat runs 15 against
94 and power 31 against 105; the sub-commentary and extra-canonical layers add more commentarial weight
still. The canon states that the nāga is born four ways and is an animal; the commentary explains,
classifies, and furnishes.

## 6. The ceiling, and who explained it

The canon states the soteriological paradox more fully than expected. A nāga is a moral being: SN 29 shows
nāgas keeping the uposatha, reflecting on their past conduct and resolving to do better
([SN 29.3](sn29.3)), and the nāga-king of the Vinaya story is a devotee who wants the holy life. Yet the
highest a nāga aspires to in the suttas is a heavenly rebirth, never the path; and when an actual nāga,
weary of the nāga-birth and longing for human state, takes a young man's form and gets himself ordained,
the Buddha's ruling is explicit. He tells the nāga, in the canon, in his own voice, *tumhe khottha nāgā
aviruḷhidhammā imasmiṁ dhammavinaye*, "you nāgas are of non-growth-nature in this Dhamma-Vinaya," and lays
down that an animal may not be ordained, and if ordained must be expelled ([Vin. Mahāvagga](pli-tv-kd1)).
The ceiling is therefore not merely enacted by a rule; it is named. What the canon does not give is the
reason. This corrects the pre-registered H_B: the ceiling is canonical and explicit, not only legal.

The reason is the commentary's, and it is exact. The Samantapāsādikā glosses *aviruḷhidhamma* by supplying
its content: the nāgas are of non-growth-nature *because of their incapacity (abhabbattā) for jhāna,
insight, and path-and-fruit* ([Sp on the rule](cst-vin02a2.att-36_p003)). Here the canon names a ceiling
and the commentary builds the doctrine of it, the *abhabba* being who cannot develop the path in this life.
Two further commentarial moves harden the same wall. The canon gives two occasions on which a nāga's
disguise fails, mating with its own kind and falling asleep relaxed; the commentary makes them five, adding
rebirth-linking, the shedding of the skin, and death ([Sp](cst-vin02a2.att-36_p003)). And the canon's word
*tiracchānagata*, "animal," is read by the commentary as any non-human whatsoever, "down to Sakka the king
of the gods" ([Sp](cst-vin02a2.att-36_p004)), so that the bar that begins as a rule about animals becomes a
rule about the not-human. The bodhisatta himself, the Jātakas insist, was repeatedly a nāga-king and kept
the precepts there; the same texts are clear that he did so to perfect his virtue toward a future human
awakening, never to awaken as a nāga. The nāga is thus the canon's clearest single case of a principle it
holds quietly and the commentary states loudly: that a human birth is the needed basis for the path.

## 7. Canon and commentary, cell by cell

The distributional result has a qualitative mechanism, which a close reading of the load-bearing cells makes
precise. These cells are the claims where both a canonical locus and a commentarial treatment sit on the
verified spine; they are an analyst-selected set, not an exhaustive warrant-tally over all the commentarial
claims, so the count characterizes the spine, not the whole census. For each cell the test is whether a
canonical passage warrants what the commentary says. The faithful cells (H0) are the bare facts, the four
births, the lifespan, the uposatha, the cause of rebirth, the shape-shift, all of which the commentary
glosses without exceeding. The located innovations (H1) cluster in the apparatus. (Sigla: Spk =
Sāratthappakāsinī, the Saṃyutta commentary; Sp = Samantapāsādikā, the Vinaya commentary.)

| Claim | Canon | Commentary | Verdict |
|---|---|---|---|
| Four nāgayoni glossed | SN 29.1 | Spk (Nāgasaṃyutta) | faithful (H0) |
| Four-yoni set in the cosmological scheme | SN 29.1 | Catuyonivaṇṇanā | faithful (H0) |
| Lifespan, beauty, happiness | SN 29.7 | Spk | faithful (H0) |
| Uposatha-keeping | SN 29.3 | Spk | faithful (H0) |
| Cause split: bad kamma to birth, good to prosperity | SN 29.3 | Spk | faithful (H0) |
| Shape-shift to human form | Ud 2.1 | (already canonical) | faithful (H0) |
| Rebirth-linking rooted in bad kamma | none located | Sp | innovation (H1) |
| Realm and diet (water-dwelling, frog-eating) | none located | Sp | innovation (H1) |
| Ceiling rationale: *abhabba* for jhāna/insight/path | Vin (names it) | Sp (explains it) | innovation (H1) |
| Reversion occasions, two to five | Vin (two) | Sp (five) | innovation (H1) |
| *tiracchāna* broadened to any non-human | Vin (animal) | Sp (incl. Sakka) | innovation (H1) |

Across the eleven load-bearing cells, six are faithful and five are located innovations; each "none located"
refutes a warrant search, not a doctrinal entailment (§9). The innovations are not random: they are the
Abhidhamma rebirth-linking, the physical habitat, the doctrinal ground of the ceiling, the expanded
reversion list, and the broadened category of the barred. The canon supplies the being and its ceiling; the
commentary supplies the system and the reason.

## 8. Discussion

The result places the nāga within a field that has long read it as ambiguous and gives that reading a
textual mechanism on an axis the field has not measured. Bloss and DeCaroli located the nāga's
subordination in the *cultic and narrative* register: the water-deity converted, tamed, made a protector
and donor, its worship redirected to the Buddha. That register is real and is not what this study counts.
This study measures a different axis, the *classificatory and soteriological* one, what the texts say a
nāga ontologically is and whether it can win the path; and on that axis the finding is that the ambiguity
is not evenly distributed across the tradition. The canon already does the decisive work, classing the nāga
as an animal and naming its incapacity; the figure is liminal in the suttas, not only in later devotion.
The commentary's contribution is not the subordination but its system: the doctrinal reason (*abhabba*),
the Abhidhamma rebirth-linking, and the generalization of the bar from animals to all non-humans. The
contribution is therefore an addition to Bloss and DeCaroli, a classificatory axis beside their cultic one,
not a relocation of their finding. Appleton's reading of the nāga-king Jātakas fits precisely: the
bodhisatta can be a virtuous nāga, but his virtue there is always oriented toward a future human birth,
which is the soteriology of the ceiling told as narrative. The nāga is the canon's sharpest image of a
being that has the fruits of merit, long life, beauty, and happiness, without the one opportunity that
matters.

## 9. Limitations

This is a high-recall lexical census on the *nāga*-word with a measured recall floor, not a proof of
completeness. The frame is the broad *nāg*-string minus the morphological false friends, classified by
sense. Its recall floor lies in one specific place, the material that speaks of nāgas under the ordinary
snake words (*ahi*, *sappa*, *āsīvisa*, *uraga*, *bhujaga*) without the term *nāga*. That floor was
measured rather than only named: a sweep of those words (mula counts 47, 1,003, 75, 52, and 5, the great
majority literal snakes) found at most six canonical rows that carry nāga-being markers (a hood, a
*bhavana*, a *nāgarāja*) under a snake-synonym without a *nāga*-token. A reconciliation against the named
nāga-kings of the tradition passed: Mucalinda, Bhūridatta, Erakapatta, Saṅkhapāla, Nandopananda, Apalāla,
and Campeyya all resolve in the census. The residual is therefore small and bounded, but real, and every
"no canonical warrant" verdict refutes a located warrant, not a doctrinal entailment, and is stated that
way. On reliability: a 124-row subsample of the canonical ambiguous rows was triple-coded with
almost-perfect agreement (Fleiss *κ* = 0.853); the remaining ambiguous rows and the whole commentary were
single-coded against that validated codebook, so the commentary's sense-counts carry the codebook's
reliability but not a per-row second opinion. Quote-level verification was done for the fourteen
load-bearing spine passages; the other serpent rows are confirmed to exist as live corpus rows and were
sense-coded from their windows, but their quoted evidence was not individually re-confirmed. The
warrant-by-cell test (§7) is a close reading of the load-bearing spine, not a warrant tally over every
commentarial claim. The voice axis (the Buddha versus narrative versus commentary) is an approximate tag
from each row's source; the canon-versus-commentary layer axis, which carries the argument, is exact. The
cross-tradition nāga, the Mahāvastu and the Sanskrit Vinaya material on ordaining the non-human, and the
nāga of the relic cult (the protector and relic-guardian, the natural home of the cultic subordination
Bloss describes) are horizons named here, not witnesses used.

## 10. Contribution

The contribution is not the observation that the nāga is subordinate, which is old, but the located,
quantified demonstration of where the subordination is done. The canon supplies the felicity, the four
births, the long and beautiful life, the moral agency that keeps the sabbath, and it supplies the bar,
naming the nāga of non-growth-nature and excluding the animal from ordination. The commentary supplies the
disqualifying reason and the system around it. Method travels with the finding: *nāga* is shown to be a
canonical heteronym whose serpent sense is a 7-percent minority of the raw hits, a worked demonstration
that a name-based enumeration of any Pāli term must disambiguate sense before it counts anything.

## References

- Appleton, N. 2010. *Jātaka Stories in Theravāda Buddhism: Narrating the Bodhisatta Path*. Farnham: Ashgate.
- Bloss, L. W. 1973. "The Buddha and the Nāga: A Study in Buddhist Folk Religiosity." *History of Religions* 13.1: 36–53.
- Collins, S. 1998. *Nirvana and Other Buddhist Felicities: Utopias of the Pali Imaginaire*. Cambridge: Cambridge University Press.
- DeCaroli, R. 2004. *Haunting the Buddha: Indian Popular Religions and the Formation of Buddhism*. New York: Oxford University Press.
- Gethin, R. 1997. "Cosmology and meditation: from the Aggañña Sutta to the Mahāyāna." *History of Religions* 36.3.
- Horner, I. B. 1951. *The Book of the Discipline (Vinaya-Piṭaka), Vol. IV (Mahāvagga)*. London: Luzac.
- Malalasekera, G. P. 1937–38. *Dictionary of Pāli Proper Names*. London: John Murray.
- Vogel, J. P. 1926. *Indian Serpent-Lore, or the Nāgas in Hindu Legend and Art*. London: Arthur Probsthain.

## Appendix: data availability

The dataset (`public/research/naga.json`) carries one record per serpent-being instance with its
identifier, citation, layer, voice, referent, facet, claim, verbatim Pāli evidence, and, for commentarial
claims, the canonical warrant; plus the referent ledger, the H0/H1 cells, and the pre-computed aggregates.
The codebook, the query frame, the per-coder outputs, and the inter-annotator computation are in
`research/naga/`. Every record identifier resolves to a live passage in the reader. Census version 1.0;
corpus snapshot 194,710 passages.
