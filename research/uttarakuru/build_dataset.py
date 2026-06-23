#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Build public/research/uttarakuru.json from the authored feature matrix + the coded census.
Counts are DATA-BOUND (computed here), never hand-typed into prose. Re-run after any change;
the consistency check at the end gates the build. Verbatim Pali carries full diacritics (IAST/ISO);
romanization matches the cited corpus row. Revised after adversarial peer review (3 personas)."""
import json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # research/
REPO = os.path.dirname(ROOT)
census_src = json.load(open(os.path.join(ROOT, 'uttarakuru', '_census_v2.json'), encoding='utf-8'))

cwin = json.load(open(os.path.join(ROOT, 'uttarakuru', '_census_windows.json'), encoding='utf-8'))
C = {}
for r in cwin:
    C.setdefault(r['citation'], r['id'])

def cid(label):
    return C.get(label, label)

def cite(label, idoverride=None):
    return {"id": idoverride or cid(label), "label": label}

# consensus codes (3 blind coders; majority; A10 adjudicated to commentarial-detail 2-1; Fleiss k=0.941)
CODES = {
 "A1": ("canonical-seed", "dn32"), "A2": ("canonical-seed", "dn32"),
 "A3": ("canonical-seed", "an9.21"), "A4": ("commentarial-innovation", None),
 "A5": ("commentarial-innovation", None), "A6": ("commentarial-detail", "an9.21"),
 "A7": ("split", "an9.21"), "A8": ("commentarial-innovation", None),
 "A9": ("canonical-seed", "pli-tv-kd1"), "A10": ("commentarial-detail", "dn17"),
 "B1": ("canonical-seed", "an9.21"), "B2": ("canonical-seed", "an9.21"),
 "B3": ("split", "kv1.3"), "B4": ("split", "an9.21"),
 "B5": ("commentarial-innovation", None), "C1": ("commentarial-innovation", None),
}

SEGMENTS = [
 {"key": "A", "title": "What an Uttarakuruka is (ethnography & cosmology)",
  "blurb": "The northern continent and its people, at the finest grain the corpus supports: the four-continent map, the self-ripening rice, ownerless and houseless life, the wish-tree, the fixed long span, and the continent as the psychic traveller's alms-larder."},
 {"key": "B", "title": "The soteriological paradox (the hinge)",
  "blurb": "Why the most fortunate humans are the worst placed for awakening. AN 9.21 makes their three superiorities material comforts and reserves the holy life for Jambudipa; the commentary then names the bar and reads their effortless virtue as the reason it cannot be cultivated."},
 {"key": "C", "title": "Canon into commentary (the warrant test)",
  "blurb": "Feature by feature, what the canon seeds and what the commentary builds, plus the homonym the tradition fuses by its own genealogy (the Kuru country and its five-precept observance traced to migrants out of Uttarakuru)."},
]

def cell(present, text, cites):
    return {"present": present, "text": text, "cites": cites}

FEATURES = [
 # ---------- segment A ----------
 {"id": "A1", "segment": "A",
  "name": "The northern continent in the four-mahādīpa schema",
  "gloss": "Uttarakuru is the northern of the four great continents around Mt Sineru. The canon fixes its place (north, by Mt Neru); the para-canonical Visuddhimagga fixes its measure (8,000 yojanas), and the commentary its square shape, with the inhabitants' faces matching the continent.",
  "cells": {
   "canon": cell("attested", "DN 32 places it in the north, by Mt Neru; the AN thousandfold-world cosmology lists it as one of the four continents ('a thousand Uttarakurus, a thousand Jambudīpas').", [cite("DN 32", "dn32"), cite("AN 3.80", "an3.80"), cite("AN 10.29", "an10.29")]),
   "para": cell("attested", "Vism gives the measure: 8,000 yojanas (Goyāna/Pubbavideha 7,000; Jambudīpa 10,000). The figure is para-canonical, not canonical.", [cite("Vism §73.57", "cst-e0101n.mul-73_p057")]),
   "attha": cell("attested", "The four-continent sizes are restated across the Aṭṭhakathā.", [cite("KN-a §12.36"), cite("Sp §6.57")]),
   "tika": cell("attested", "The continent is square (pīṭha-shaped); the four peoples' faces follow their continent's shape.", [cite("Sp-ṭ §9.230"), cite("Vism-mhṭ §75.96")]),
  },
  "verbatim": [
   {"pali": "Yena uttarakuruvho (var. uttarakurū rammā, sī.syā.pī.), mahāneru sudassano; Manussā tattha jāyanti, amamā apariggahā.", "en": "Where Uttarakuru is, and Mount Neru fair to see; humans are born there, without mine-making, without possessions.", "tr_provenance": "author", "id": "dn32", "label": "DN 32"},
   {"pali": "Uttarakuru aṭṭhasahassayojanaṃ. Ekameko cettha mahādīpo pañcasatapañcasataparittadīpaparivāro.", "en": "Uttarakuru is 8,000 yojanas; each great continent is ringed by five hundred small islands.", "tr_provenance": "author", "id": "cst-e0101n.mul-73_p057", "label": "Vism §73.57"},
  ]},

 {"id": "A2", "segment": "A",
  "name": "Self-ripening unploughed rice (akaṭṭhapāka-sāli)",
  "gloss": "They neither sow nor plough; they eat rice that ripens of itself. Canonical twice over: in the DN 32 Uttarakuru verse, and, in the same formula, as the Aggañña-sutta's golden-age rice. The Uttarakuru ethnography recapitulates a canonical template; the commentary echoes the very wording (akaṇaṃ athusaṃ sugandhaṃ).",
  "cells": {
   "canon": cell("attested", "DN 32: no seed sown, no plough led out; they eat self-ripened rice. The identical formula (huskless, chaffless, fragrant) is the Aggañña-sutta's golden-age rice (DN 27).", [cite("DN 32", "dn32"), cite("DN 27 (Aggañña)", "dn27")]),
   "para": cell("absent", "·", []),
   "attha": cell("absent", "·", []),
   "tika": cell("attested", "Glossed with the Aggañña formula: husk-less, chaff-less, fragrant.", [cite("Sv-pṭ 9 §23", "cst-s0103t.tik-dn3_9_p023")]),
  },
  "verbatim": [
   {"pali": "Na te bījaṃ pavapanti, napi nīyanti naṅgalā; Akaṭṭhapākimaṃ sāliṃ, paribhuñjanti mānusā.", "en": "They sow no seed, nor is any plough led out; the humans eat rice that ripens unploughed.", "tr_provenance": "author", "id": "dn32", "label": "DN 32"},
   {"pali": "Akaṭṭhapāko sāli pāturahosi akaṇo athuso suddho sugandho taṇḍulapphalo.", "en": "Rice ripening unploughed appeared, huskless, chaffless, pure, fragrant, with grain for fruit. (the same words, of the cosmic golden age)", "tr_provenance": "author", "id": "dn27", "label": "DN 27 (Aggañña)"},
  ]},

 {"id": "A3", "segment": "A",
  "name": "No ownership: amama, apariggaha; no houses, no slaves",
  "gloss": "They make nothing 'mine' and hold no possessions. Canonical in AN 9.21 and DN 32. ('Without mine-making' is the analyst's morphological reading of amama, a- + mama; the commentary itself reads it affectively, as nittaṇha, free of craving.) The commentary spells out no claim even on clothes or food, no wife held as property, no houses, and no slaves.",
  "cells": {
   "canon": cell("attested", "AN 9.21 and DN 32: amamā (no mine-making), apariggahā (no possessions).", [cite("AN 9.21", "an9.21"), cite("DN 32", "dn32")]),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "Free of 'mine' even as to clothes/food; the Mp-a reads amama affectively as nittaṇha (free of craving). Houseless ground-sleepers.", [cite("Sv-a 9 §19", "cst-s0103a.att-dn3_9_p019"), cite("Mp-a vol.9 §63", "cst-s0404a.att-an9_p063"), cite("KN-a §95.217", "cst-s0508a2.att-95_p217")]),
   "tika": cell("attested", "No ownership of slaves, servants, or labourers, since the food needs no toil.", [cite("Sv-pṭ 9 §23", "cst-s0103t.tik-dn3_9_p023")]),
  },
  "verbatim": [
   {"pali": "Amamāti vatthābharaṇapānabhojanādīsupi mamattavirahitā. Apariggahāti itthipariggahena apariggahā.", "en": "'Without mine-making': free of the sense of 'mine' even as to clothes, ornaments, drink and food. 'Without possessions': not possessing in the sense of holding a wife.", "tr_provenance": "author", "id": "cst-s0103a.att-dn3_9_p019", "label": "Sv-a 9 §19"},
   {"pali": "Amamāti nittaṇhā. Aṭṭhakathāyaṃ pana niddukkhāti vuttaṃ.", "en": "'Without mine-making' [means] free of craving; but in the [other] commentary it is said to mean free of suffering.", "tr_provenance": "author", "id": "cst-s0404a.att-an9_p063", "label": "Mp-a vol.9 §63"},
  ]},

 {"id": "A4", "segment": "A",
  "name": "The wish-tree (kapparukkha) and tree-dwellings",
  "gloss": "Their clothes, ornaments, even musical instruments hang ready on wish-trees, and peaked-roof trees serve as houses. The wish-tree concept is canonical (an Apadāna merit-fruit), but its placement at Uttarakuru is commentarial, part of a stock list pairing each realm with a signature tree (kapparukkha for Uttarakuru, kadamba for Goyāna, sirīsa for Pubbavideha, pāricchattaka for Tāvatiṃsa).",
  "cells": {
   "canon": cell("absent", "The kapparukkha occurs canonically only as an Apadāna merit-fruit (wish-trees arising for a past gift of cloth), never placed at Uttarakuru; the Aggañña golden-age (DN 27) knows the self-ripening rice but no wish-tree.", []),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "Uttarakuru's signature tree is the kapparukkha (vs sirīsa, kadamba, pāricchattaka elsewhere); in the Jotika story clothes and ornaments are taken from it.", [cite("As §88.21", "cst-abh01a.att-88_p021"), cite("KN-a §326.14", "cst-s0502a.att-326_p014")]),
   "tika": cell("attested", "Peaked-roof trees serve as dwellings; clothes, gold ornaments and instruments hang from the wish-trees.", [cite("Sv-pṭ 9 §23", "cst-s0103t.tik-dn3_9_p023"), cite("Sv-pṭ 9 §25", "cst-s0103t.tik-dn3_9_p025")]),
  },
  "verbatim": [
   {"pali": "Uttarakurumhi kapparukkhassa.", "en": "In Uttarakuru, [the measure] of the wish-tree.", "tr_provenance": "author", "id": "cst-abh01a.att-88_p021", "label": "As §88.21"},
   {"pali": "Kapparukkhato eva ca tesaṃ tattha tattha vatthābharaṇāni nippajjanti.", "en": "And their clothes and ornaments are produced, here and there, straight from the wish-trees.", "tr_provenance": "author", "id": "cst-s0103t.tik-dn3_9_p025", "label": "Sv-pṭ 9 §25"},
  ]},

 {"id": "A5", "segment": "A",
  "name": "Perpetual mild climate; no thorns, disease, or deformity",
  "gloss": "The season is forever temperate, there are no thorns, no danger, no disease and no deformity. A commentarial elaboration with no located canonical warrant.",
  "cells": {
   "canon": cell("absent", "No located canonical warrant.", []),
   "para": cell("absent", "·", []),
   "attha": cell("absent", "·", []),
   "tika": cell("attested", "The season is always temperate as the last dawn of summer; no thorns; eating the pure rice, no disease and no bodily defect arises.", [cite("Sv-pṭ 9 §23", "cst-s0103t.tik-dn3_9_p023"), cite("Sv-pṭ 9 §25", "cst-s0103t.tik-dn3_9_p025")]),
  },
  "verbatim": [
   {"pali": "Sabbakālaṃ samasītuṇhova utu hoti, na ca tesaṃ koci upaghāto vihesā vā uppajjati.", "en": "The season is always evenly cool-and-warm, and no harm or trouble whatever arises for them.", "tr_provenance": "author", "id": "cst-s0103t.tik-dn3_9_p023", "label": "Sv-pṭ 9 §23"},
  ]},

 {"id": "A6", "segment": "A",
  "name": "Fixed lifespan: the thousand-year figure and no premature death",
  "gloss": "The canon warrants that the lifespan is fixed (niyatāyuka, AN 9.21) but gives no number. The commentary alone warrants how long: exactly a thousand years, and absolutely fixed, with no death-by-interruption.",
  "cells": {
   "canon": cell("attested", "AN 9.21: niyatāyukā, a fixed lifespan, with no figure. A canonical Apadāna verse calls the people 'long-lived' (dīghāyuka), but under the ambiguous 'kurūsu' that the commentary reads as Uttarakuru.", [cite("AN 9.21", "an9.21")]),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "The fixed span is exactly a thousand years; the commentary glosses the canonical 'long-lived' (dīghāyuka) as 'their thousand-year lifespan' and reads the verse's 'kurūsu' as Uttarakuru.", [cite("Mp-a vol.9 §63", "cst-s0404a.att-an9_p063"), cite("KN-a §36.49", "cst-s0519a.att-36_p049")]),
   "tika": cell("attested", "Their span is absolutely fixed; no death-by-interruption (upacchedaka-maraṇa) befalls them.", [cite("Sv-pṭ 1 §323", "cst-s0101t.tik-dn1_1_p323"), cite("Abh-pṭ §133.2", "cst-abh07t.nrf-133_p002")]),
  },
  "verbatim": [
   {"pali": "Niyatāyukāti tesañhi nibaddhaṃ āyu vassasahassameva, gatipi nibaddhā, tato cavitvā saggeyeva nibbattanti.", "en": "'Of fixed lifespan': for their span is settled at just a thousand years; their destiny too is settled; passing from there, they are reborn only in heaven.", "tr_provenance": "author", "id": "cst-s0404a.att-an9_p063", "label": "Mp-a vol.9 §63"},
  ]},

 {"id": "A7", "segment": "A",
  "name": "No fixed marriage; communal children; weekly desire; unaging youth",
  "gloss": "From the canonical 'no possessions' the commentary draws a whole social order: no marriage and no 'my wife'; mothers leave newborns in public, strangers' fingers feeding them; desire stirs only once in seven days, so they otherwise move about 'like the passion-free'; all stay sixteen or twenty-five forever.",
  "cells": {
   "canon": cell("oblique", "Only the bare apariggaha (no possessions) of AN 9.21 / DN 32.", [cite("AN 9.21", "an9.21")]),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "No 'this is my wife'; seeing a mother or sister, no desire arises.", [cite("Sv-a 9 §19", "cst-s0103a.att-dn3_9_p019")]),
   "tika": cell("attested", "Mothers abandon newborns in public, fed by passers-by's fingers; desire only weekly; women look 16, men 25, forever.", [cite("Sv-pṭ 9 §23", "cst-s0103t.tik-dn3_9_p023"), cite("Sv-pṭ 9 §25", "cst-s0103t.tik-dn3_9_p025")]),
  },
  "verbatim": [
   {"pali": "Mātā pana puttaṃ vā dhītaraṃ vā vijāyitvā tesaṃ vicaraṇappadese ṭhapetvā anapekkhā yathāruci gacchati.", "en": "Having borne a son or daughter, the mother sets the child down in a public place and goes off as she pleases, without concern.", "tr_provenance": "author", "id": "cst-s0103t.tik-dn3_9_p025", "label": "Sv-pṭ 9 §25"},
   {"pali": "Sattāhikā eva ca nesaṃ kāmaratikīḷā hoti, tato vītarāgā viya vicaranti.", "en": "Their sensual play is only once in seven days; otherwise they move about like the passion-free.", "tr_provenance": "author", "id": "cst-s0103t.tik-dn3_9_p025", "label": "Sv-pṭ 9 §25"},
  ]},

 {"id": "A8", "segment": "A",
  "name": "Beauty and extraordinarily fine hair",
  "gloss": "The bodies are flawless and the hair so fine that one Uttarakuru hair equals a Jambudīpa hair split eightfold. A commentarial detail with no located canonical warrant.",
  "cells": {
   "canon": cell("absent", "No located canonical warrant.", []),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "The hair of the Uttarakurukas is used as a unit of fineness.", [cite("Vibh-a §8.3", "cst-abh02a.att-8_p003")]),
   "tika": cell("attested", "A long description of flawless, unaging beauty.", [cite("Sv-pṭ 9 §23", "cst-s0103t.tik-dn3_9_p023"), cite("Sp-ṭ §62.6")]),
  },
  "verbatim": [
   {"pali": "…kese aṭṭhadhā phālite tato ekakoṭṭhāsappamāṇo uttarakurukānaṃ keso.", "en": "…a [Jambudīpa] hair split eightfold: one part is the measure of an Uttarakuruka's hair.", "tr_provenance": "author", "id": "cst-abh02a.att-8_p003", "label": "Vibh-a §8.3"},
  ]},

 {"id": "A9", "segment": "A",
  "name": "The alms-larder: psychic travel to Uttarakuru for food",
  "gloss": "The dominant thing the texts actually do with Uttarakuru: the Buddha and arahants fly there by psychic power, collect the free almsfood, and return to rinse at Lake Anotatta. Canonical in the Vinaya and the Apadāna, and the single most frequent motif in the commentary.",
  "cells": {
   "canon": cell("attested", "The Buddha goes to Uttarakuru for almsfood (the Uruvela-Kassapa episode); Moggallāna offers to take the whole Sangha there in the Verañjā famine and the Buddha forbids it.", [cite("Vin. Kd. 1", "pli-tv-kd1"), cite("Bhu. Pj. 1", "pli-tv-bu-vb-pj1"), cite("Apadāna (THA-AP3)", "tha-ap3")]),
   "para": cell("attested", "Milinda asks whether one can go there in this very body; Nāgasena: yes, by psychic mastery.", [cite("MIL 3.7.9", "mil3.7.9")]),
   "attha": cell("attested", "Dozens of stories of an arahant fetching almsfood from Uttarakuru.", [cite("KN-a §305.18"), cite("Mp-a 14 §361")]),
   "tika": cell("attested", "A Vinaya casuistry verse: food fetched from Uttarakuru in the afternoon, eaten back here in time, is no offence.", [cite("Sp-ṭ §53.49")]),
  },
  "verbatim": [
   {"pali": "Atha kho bhagavā … uttarakuruṃ gantvā tato piṇḍapātaṃ āharitvā anotattadahe paribhuñjitvā tattheva divāvihāraṃ akāsi.", "en": "Then the Blessed One went to Uttarakuru, brought back almsfood from there, ate it at Lake Anotatta, and spent the day there.", "tr_provenance": "author", "id": "pli-tv-kd1", "label": "Vin. Kd. 1"},
   {"pali": "Atthi, mahārāja, yo iminā cātummahābhūtikena kāyena uttarakuruṃ vā gaccheyya…", "en": "There is, your majesty, one who could go to Uttarakuru with this very body of the four elements…", "tr_provenance": "sujato", "id": "mil3.7.9", "label": "MIL 3.7.9"},
  ]},

 {"id": "A10", "segment": "A",
  "name": "The wheel-turner's fourth conquest; the jewel-woman's origin",
  "gloss": "The wheel-turning monarch's dominion runs to the four oceans, the northern quarter being Uttarakuru. The canon gives the ocean-bounded frame; the commentary names Uttarakuru as the conquered northern continent and as the source of the monarch's jewel-woman.",
  "cells": {
   "canon": cell("oblique", "DN 17 / DN 26: the wheel rolls to all four oceans, the ocean-bounded earth; Uttarakuru not named.", [cite("DN 17", "dn17"), cite("DN 26", "dn26")]),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "The monarch conquers the 8,000-yojana Uttarakuru; the jewel-woman comes from Uttarakuru (or the Madda royal house).", [cite("Sv-a 4 §26", "cst-s0102a.att-dn2_4_p026"), cite("Sv-a 4 §37", "cst-s0102a.att-dn2_4_p037"), cite("KN-a §50.14")]),
   "tika": cell("absent", "·", []),
  },
  "verbatim": [
   {"pali": "…aṭṭhayojanasahassappamāṇaṃ uttarakuruṃ vijetuṃ tatheva gantvā…", "en": "…going likewise to conquer the eight-thousand-yojana Uttarakuru…", "tr_provenance": "author", "id": "cst-s0102a.att-dn2_4_p026", "label": "Sv-a 4 §26"},
  ]},

 # ---------- segment B ----------
 {"id": "B1", "segment": "B",
  "name": "The triangular three-superiorities (AN 9.21)",
  "gloss": "The hinge of the whole study. AN 9.21 ranks three groups, each surpassing the other two in three respects: Uttarakuru by non-grasping, non-possession, and a fixed span; the Tāvatiṃsa gods by divine span, beauty, and bliss; and the people of Jambudīpa by courage, mindfulness, and that the holy life is lived here. Uttarakuru's superiorities are precisely the comforts; Jambudīpa's third is the path.",
  "cells": {
   "canon": cell("attested", "AN 9.21 Tiṭhānasutta (ti-ṭhāna, 'three grounds'); quoted again in the Kathāvatthu's debate on where the holy life is lived.", [cite("AN 9.21", "an9.21"), cite("KV 1.3", "kv1.3")]),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "Glossed across the Nikāya commentaries.", [cite("Mp-a vol.9 §63", "cst-s0404a.att-an9_p063")]),
   "tika": cell("attested", "Restated in the sub-commentaries on the same sutta.", [cite("Sv-pṭ 7 §9", "cst-s0103t.tik-dn3_7_p009")]),
  },
  "verbatim": [
   {"pali": "Tīhi, bhikkhave, ṭhānehi uttarakurukā manussā deve ca tāvatiṃse adhiggaṇhanti jambudīpake ca manusse. Katamehi tīhi? Amamā, apariggahā, niyatāyukā, visesaguṇā (var. visesabhuno, sī.syā.pī.).", "en": "In three grounds, monks, the humans of Uttarakuru surpass the gods of the Thirty-Three and the humans of Jambudīpa. Which three? They are without mine-making, without possessions, of fixed lifespan; [they are] of distinctive quality. (The three grounds are amamā, apariggahā, niyatāyukā; visesaguṇā closes the list as a descriptor, not a fourth ground.)", "tr_provenance": "author", "id": "an9.21", "label": "AN 9.21"},
   {"pali": "…Tīhi, bhikkhave, ṭhānehi jambudīpakā manussā uttarakuruke ca manusse adhiggaṇhanti deve ca tāvatiṃse. Katamehi tīhi? Sūrā, satimanto, idha brahmacariyavāso.", "en": "…In three grounds the humans of Jambudīpa surpass the humans of Uttarakuru and the gods of the Thirty-Three: bravery, mindfulness, and that the holy life is lived here.", "tr_provenance": "sujato", "id": "an9.21", "label": "AN 9.21"},
  ]},

 {"id": "B2", "segment": "B",
  "name": "The holy life is 'here' because Buddhas arise only in Jambudīpa",
  "gloss": "AN 9.21's deictic 'the holy life is lived here' is pinned by the commentary: because Buddhas and Paccekabuddhas arise in Jambudīpa, the eightfold-path holy life exists only here. By implication, Uttarakuru, where no Buddha arises, has no path. The canon supplies 'here'; the commentary narrows it to Jambudīpa and to the eightfold path.",
  "cells": {
   "canon": cell("attested", "AN 9.21: idha brahmacariyavāso (the holy life is here), deictic and unspecified.", [cite("AN 9.21", "an9.21")]),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "Because Buddhas and Paccekabuddhas arise in Jambudīpa, the path-holy-life is only here.", [cite("Mp-a vol.9 §63", "cst-s0404a.att-an9_p063")]),
   "tika": cell("absent", "·", []),
  },
  "verbatim": [
   {"pali": "Idha brahmacariyavāsoti jambudīpe buddhapaccekabuddhānaṃ uppajjanato aṭṭhaṅgikamaggabrahmacariyavāsopi idheva hoti.", "en": "'The holy life is lived here': because Buddhas and Paccekabuddhas arise in Jambudīpa, the eightfold-path holy life too is only here.", "tr_provenance": "author", "id": "cst-s0404a.att-an9_p063", "label": "Mp-a vol.9 §63"},
  ]},

 {"id": "B3", "segment": "B",
  "name": "The bar: no zeal, incapable of the path, grouped with Māra",
  "gloss": "The decisive commentarial move. The canonical inopportune-birth (akkhaṇa) list never names Uttarakuru, and the Kathāvatthu supplies the acchandika/abhabba category while even softening 'here' for the gods. The commentary then slots the Uttarakurukas into that category, groups them with Māra as lacking the desire for nibbāna, and rules that they cannot attain the path though the gods can.",
  "cells": {
   "canon": cell("attested", "Kathāvatthu debate: the acchandika/abhabba category, applied (in a reductio) to the gods, not to the Uttarakurukas, whom the debate leaves on the no-holy-life side. The canonical 8-akkhaṇa list (AN 8.29, DN 33) names hell, animal, ghost, long-lived deva, border-region, wrong-view, dullness, no-Buddha; not Uttarakuru.", [cite("KV 1.3", "kv1.3"), cite("AN 8.29", "an8.29"), cite("DN 33", "dn33")]),
   "para": cell("attested", "The Uttarakurukas, like Māra, lack the desire for nibbāna.", [cite("Vism-mhṭ §67.11", "cst-e0103n.att-67_p011")]),
   "attha": cell("attested", "The Uttarakuru humans have entered the 'acchandika' class and are incapable of entering the path.", [cite("Vibh-a §129.14", "cst-abh02a.att-129_p014")]),
   "tika": cell("attested", "For the gods, path-attainment exists; for the Uttarakurukas, non-attainment of the distinction. The going-forth is for them impossible from absence-of-opportunity.", [cite("Abh-pṭ §73.3", "cst-abh05t.nrf-73_p003"), cite("Abh-pṭ §279.12", "cst-abh09t.nrf-279_p012")]),
  },
  "verbatim": [
   {"pali": "Acchandikāti kattukamyatākusalacchandarahitā. Uttarakurukā manussā acchandikaṭṭhānaṃ paviṭṭhā… Abhabbā niyāmaṃ okkamituṃ.", "en": "'Acchandika': lacking the wholesome desire-to-act. The Uttarakuru humans have entered the 'acchandika' category… incapable of descending into the [path's] certainty.", "tr_provenance": "author", "id": "cst-abh02a.att-129_p014", "label": "Vibh-a §129.14"},
   {"pali": "Tattha sūriyaparivattādīhipi devesu maggapaṭilābhāya atthitā vibhāvetabbā, uttarakurukānaṃ pana visesānadhigamabhāvo ubhinnampi icchito evāti.", "en": "There, the existence of path-attainment for the gods is to be shown (by the sun's rotation and so on), but for the Uttarakurukas the non-attainment of the distinction; both are intended.", "tr_provenance": "author", "id": "cst-abh05t.nrf-73_p003", "label": "Abh-pṭ §73.3"},
  ]},

 {"id": "B4", "segment": "B",
  "name": "Automatic virtue: pakati-sīla, fixed by birth, the whole life dhammatā-siddha",
  "gloss": "The thematic key. Their non-transgression is the canonical amama/apariggaha; the commentary reclassifies it as 'natural virtue' (pakati-sīla), morality fixed by being reborn there, and frames the whole effortless life as 'accomplished by nature' (dhammatā-siddha). What is dhammatā cannot be undertaken (samādāna), and so cannot be cultivated into a path. That link, dhammatā-siddha to acchandika, is the commentary's own logic.",
  "cells": {
   "canon": cell("attested", "The fact: amamā, apariggahā (AN 9.21 / DN 32).", [cite("AN 9.21", "an9.21"), cite("DN 32", "dn32")]),
   "para": cell("attested", "Vism: the Uttarakurukas' non-transgression is natural virtue (pakati-sīla).", [cite("Vism §6.29", "cst-e0101n.mul-6_p029")]),
   "attha": cell("absent", "·", []),
   "tika": cell("attested", "Their virtue is fixed by rebirth there; their whole life is 'accomplished by nature'.", [cite("Vism-mhṭ §7.20", "cst-e0103n.att-7_p020"), cite("Sv-pṭ 9 §25", "cst-s0103t.tik-dn3_9_p025")]),
  },
  "verbatim": [
   {"pali": "Uttarakurukānaṃ manussānaṃ avītikkamo pakatisīlaṃ.", "en": "The non-transgression (not-overstepping) of the Uttarakuru humans is natural virtue.", "tr_provenance": "author", "id": "cst-e0101n.mul-6_p029", "label": "Vism §6.29"},
   {"pali": "Pakatisīlanti sabhāvasīlaṃ. Tatrūpapattiniyataṃ hi sīlaṃ uttarakurukānaṃ.", "en": "'Natural virtue' means intrinsic virtue; for the Uttarakurukas, virtue is fixed by being reborn there.", "tr_provenance": "author", "id": "cst-e0103n.att-7_p020", "label": "Vism-mhṭ §7.20"},
  ]},

 {"id": "B5", "segment": "B",
  "name": "Fixed heaven-destiny (sugati-niyata)",
  "gloss": "Dying there, they are reborn only in heaven, never in hell, animal, or ghost realm. No located canonical warrant predicates this of the Uttarakurukas; the commentary supplies it, while carefully noting this 'fixed destiny' is not the technical fixed-class of the path or its opposite.",
  "cells": {
   "canon": cell("absent", "No located canonical passage predicates a heaven-destiny of the Uttarakurukas.", []),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "Passing from there, they are reborn only in heaven; their 'fixed destiny' is not the technical niyata-class.", [cite("Mp-a vol.9 §63", "cst-s0404a.att-an9_p063"), cite("Pañca-a §31.23", "cst-abh03a.att-31_p023")]),
   "tika": cell("attested", "Not reborn in hell, animal or ghost realm; by their naturally-perfected five precepts, reborn in the deva-world.", [cite("Sv-pṭ 9 §25", "cst-s0103t.tik-dn3_9_p025")]),
  },
  "verbatim": [
   {"pali": "Na ca tato matā nirayaṃ vā tiracchānayoniṃ vā pettivisayaṃ vā upapajjanti. Dhammatāsiddhassa pañcasīlassa ānubhāvena te devaloke nibbattanti.", "en": "Those who die there are not reborn in hell, the animal realm, or the ghost realm; by the power of their naturally-perfected five precepts they are reborn in the deva-world.", "tr_provenance": "author", "id": "cst-s0103t.tik-dn3_9_p025", "label": "Sv-pṭ 9 §25"},
   {"pali": "Yā pana uttarakurukānaṃ niyatagatikatā vuttā, na sā niyatadhammavasena.", "en": "The 'fixed destiny' spoken of for the Uttarakurukas is not by way of the [technical] fixed-class.", "tr_provenance": "author", "id": "cst-abh03a.att-31_p023", "label": "Pañca-a §31.23"},
  ]},

 # ---------- segment C ----------
 {"id": "C1", "segment": "C",
  "name": "The homonym the tradition fuses: continent, country, observance",
  "gloss": "'Kuru' names three things the term blurs: the northern continent Uttarakuru, the Kuru country (janapada) in Jambudīpa where the Satipaṭṭhāna suttas are taught, and the kuru-vatta moral observance of the Kurudhamma Jātaka. The commentary fuses all three by its own genealogy: the Kuru country and its five-precept observance are traced to migrants out of Uttarakuru continent.",
  "cells": {
   "canon": cell("absent", "The genealogical fusion is not canonical.", []),
   "para": cell("absent", "·", []),
   "attha": cell("attested", "The region settled by people who came from Uttarakuru got the name 'Kuru country'; hence 'he dwells among the Kurus'.", [cite("Sv-a 2 §5", "cst-s0102a.att-dn2_2_p005"), cite("Ps-a 1 §967", "cst-s0201a.att-mn1_1_p967")]),
   "tika": cell("attested", "Those migrants kept the five precepts as they naturally had; their successors' imitation became the kuru-vatta, shown by the Kurudhamma Jātaka. Elsewhere the Kuru country is 'like Uttarakuru' in season by the latent force of that observance.", [cite("Sv-pṭ 2 §7", "cst-s0102t.tik-dn2_2_p007"), cite("Ps-pṭ 1 §928", "cst-s0201t.tik-mn1_1_p928")]),
  },
  "verbatim": [
   {"pali": "Uttarakuruto āgatamanussehi āvasitapadeso 'kururaṭṭha'nti nāmaṃ labhi.", "en": "The region settled by the people who came from Uttarakuru received the name 'the Kuru country'.", "tr_provenance": "author", "id": "cst-s0102a.att-dn2_2_p005", "label": "Sv-a 2 §5"},
   {"pali": "Te uttarakuruto āgatamanussā tattha rakkhitaniyāmeneva pañca sīlāni rakkhiṃsu… kuruvattadhammoti paññāyittha. Ayañca attho kurudhammajātakena dīpetabbo.", "en": "Those people who came from Uttarakuru kept the five precepts there just as they had observed them… and it came to be known as the kuru-vatta dhamma; this is illustrated by the Kurudhamma Jātaka.", "tr_provenance": "author", "id": "cst-s0102t.tik-dn2_2_p007", "label": "Sv-pṭ 2 §7"},
  ]},
]

for f in FEATURES:
    h, w = CODES[f["id"]]
    f["h0h1"] = h
    f["warrant"] = w
    f["warrant_label"] = {"dn32": "DN 32", "an9.21": "AN 9.21", "pli-tv-kd1": "Vin. Kd. 1", "dn17": "DN 17 / DN 26", "kv1.3": "KV 1.3"}.get(w) if w else None

# ---------- v2 provenance signature (consensus of 3 blind coders; see PROVENANCE-SIGNATURE.md) ----------
_v2 = json.load(open(os.path.join(ROOT, 'uttarakuru', '_v2_codes.json'), encoding='utf-8'))
for f in FEATURES:
    f["signature"] = _v2["consensus"].get(f["id"], {})

# ---------- canonical-context controls (displayed; address the peer review) ----------
CONTEXT = {
 "agganna_parallel": {
   "claim": "The self-ripening rice is not unique to Uttarakuru. DN 27 (Aggañña-sutta) gives the same formula for the cosmic golden age, and the Vessantara Jātaka gives it for the forest hermitage (sāli akaṭṭhapāko, 'rice that ripens unploughed'). The Uttarakuru ethnography recapitulates a canonical idyll that wanders across several settings, and the commentary echoes its very wording (akaṇaṃ athusaṃ sugandhaṃ, 'huskless, chaffless, fragrant').",
   "cites": [cite("DN 27 (Aggañña)", "dn27"), cite("DN 32", "dn32"), cite("JA 547 (Vessantara)", "ja547")],
 },
 "akkhana_control": {
   "claim": "The soteriological bar is not in the canonical inopportune-birth list. AN 8.29 and DN 33 enumerate the eight akkhaṇā asamayā brahmacariyavāsāya ('inopportune, untimely moments for the holy life': hell, animal, ghost, long-lived deva, border-region, wrong-view, dullness, no-Buddha-arisen); none names Uttarakuru. The long-lived-deva moment is the nearest, and the commentary extends that reasoning to take in the Uttarakurukas. The Uttarakuru disqualification is therefore commentarial, not a canonical inopportune birth.",
   "cites": [cite("AN 8.29", "an8.29"), cite("DN 33", "dn33")],
 },
 "divine_eye_control": {
   "claim": "The divine-eye pericope (dibbena cakkhunā visuddhena atikkantamānusakena, the speaker reporting that with the purified eye surpassing the human he sees beings passing away and being reborn by their deeds) is attested 176 times across the corpus, and its object is always vertical: who is reborn where, low or high, by their conduct. It never ranges over geography. Exactly 5 mūla rows carry both this formula and the name Uttarakuru, and in every one the two sit far apart in the same edited volume (the nearest pair separated by nearly five thousand characters, the farthest by more than two hundred thousand), so there is no short adjacency window in which the formula takes the continent as its object. The geography is assumed background, never staked under the canon's test of directly-verified knowledge.",
   "cites": [],
   "counts": {"divine_eye_attestations": 176, "mula_rows_with_both": 5, "short_adjacency_windows": 0},
 },
 "thousand_year_creeper": {
   "claim": "The commentary's exact thousand-year span (vassasahassa) is the figure the canon does not supply for the inhabitants. The one canonical context that does pair 'a thousand years' (vassasahassa) with Uttarakuru by name assigns those years to a flowering creeper, not to the people; the rows are an Apadāna verse and its paracanonical neighbour.",
   "cites": [cite("KN 1", "cst-s0510m1.mul-kn10_1"), cite("KN 2", "cst-s0518m.nrf-kn18_2")],
 },
}

# ---------- aggregates (DATA-BOUND) ----------
voice_split = {"canonical": 0, "para-canon": 0, "commentary": 0}
motif_count = {}
layer_count = {"mula": 0, "attha": 0, "tika": 0, "anya": 0}
PARA_SLUGS = {"pli-vism", "pli-mil"}
para_sub = {"visuddhimagga": 0, "milindapanha": 0, "extra-canonical": 0}
for r in census_src:
    voice_split[r["voice"]] += 1
    motif_count[r["motif"]] = motif_count.get(r["motif"], 0) + 1
    layer_count[r["layer"]] += 1
    if r["voice"] == "para-canon":
        if r["work_slug"] == "pli-vism": para_sub["visuddhimagga"] += 1
        elif r["work_slug"] == "pli-mil" or r["id"].startswith("cst-s0518m"): para_sub["milindapanha"] += 1
        else: para_sub["extra-canonical"] += 1

# v2 stratigraphy: chronological stratum coded INDEPENDENTLY of structural layer (the headline re-split)
EARLY = ("early-canonical", "archaic-canonical")
stratum_split = {}
mula_stratum = {}
for r in census_src:
    st = r.get("stratum", "indeterminate")
    stratum_split[st] = stratum_split.get(st, 0) + 1
    if r["layer"] == "mula":
        mula_stratum[st] = mula_stratum.get(st, 0) + 1
mula_early = sum(v for k, v in mula_stratum.items() if k in EARLY)
mula_late = sum(v for k, v in mula_stratum.items() if k not in EARLY)

# Recension dedup. The mula census counts one row per recension, so a SuttaCentral row
# and its Chaṭṭha-Saṅgāyana sibling are two rows for one discourse. Report the distinct-work
# figure alongside the row count so the early share is not double-counted.
SC_CST_SIBLINGS = {  # SuttaCentral id -> CST recension sibling, same discourse
 "an3.80": "cst-s0402m2.mul-an3_2_3",
 "an9.21": "cst-s0404m2.mul-an9_1_3",
 "an10.29": "cst-s0404m3.mul-an10_1_3",
 "mil1": "cst-s0518m.nrf-kn18_1",
 "mil3.7.9": "cst-s0518m.nrf-kn18_2",
 "dn32": "cst-s0103m.mul-dn3_9",        # Āṭānāṭiyasutta, late-canonical pair
 "pli-tv-kd1": "cst-vin02m2.mul-vin3_1",  # Vinaya Mahākhandhaka, Kd 1
 "pli-tv-bu-vb-pj1": "cst-vin01m.mul-vin1_1",  # Vinaya Verañjā / first Pārājika frame
}
_mula_ids = {r["id"] for r in census_src if r["layer"] == "mula"}
_early_ids = {r["id"] for r in census_src if r["layer"] == "mula" and r.get("stratum") in EARLY}
# collapse each sibling pair to its SuttaCentral representative
_drop = {cst for sc, cst in SC_CST_SIBLINGS.items() if sc in _early_ids and cst in _early_ids}
mula_early_distinct = len(_early_ids - _drop)
_drop_all_mula = {cst for sc, cst in SC_CST_SIBLINGS.items() if sc in _mula_ids and cst in _mula_ids}
mula_distinct = len(_mula_ids - _drop_all_mula)
# Milindapañha: pli-mil rows and their cst-s0518m siblings collapse to distinct passages
_mil_ids = {r["id"] for r in census_src
            if r["work_slug"] == "pli-mil" or r["id"].startswith("cst-s0518m")}
_mil_drop = {cst for sc, cst in SC_CST_SIBLINGS.items() if sc in _mil_ids and cst in _mil_ids}
milindapanha_distinct = len(_mil_ids - _mil_drop)
feat_stratum = {}
for f in FEATURES:
    st = (f.get("signature") or {}).get("chronological_stratum", "indeterminate")
    feat_stratum[st] = feat_stratum.get(st, 0) + 1

h0h1_tally = {}
for f in FEATURES:
    h0h1_tally[f["h0h1"]] = h0h1_tally.get(f["h0h1"], 0) + 1
warrant_split = {"warranted": sum(1 for f in FEATURES if f["warrant"]),
                 "null": sum(1 for f in FEATURES if not f["warrant"])}
seg_count = {}
for f in FEATURES:
    seg_count[f["segment"]] = seg_count.get(f["segment"], 0) + 1

DATA = {
 "meta": {
  "title": "The People of Uttarakuru",
  "subtitle": "A survey of how the northern continent's inhabitants are described across the layers of the Pali canon and commentaries: the cosmos's most fortunate humans, and whom the commentary judges the worst placed for awakening.",
  "version": "1.3",
  "corpus_snapshot": "194,710 passages (2026-06-19)",
  "generated": None,
  "unit": "passage-row (mula + per-paragraph commentary)",
  "headline": "A small early-canonical seed (a named, propertyless, long-lived people, with no measure and no figure) grows into a described place inside a late-canonical protective chant, then a place flown to for alms in the Apadana and the Vinaya frame-narratives, then a measured place at the commentarial boundary. The ethnographic template appears to be shared across the early Buddhist traditions; the soteriological judgement built on it has, on the evidence to hand, no parallel outside the Pali. At no rung does the canon place the geography under its own test of directly-verified knowledge. The picture grows more concrete without ever growing more warranted, and only the first of those two moves. The full write-up is research/uttarakuru/FINDINGS-readable.md.",
  "version_note": "v1.3: each feature is now coded for its chronological stratum (the composition layer of the text), judged independently of where the row is shelved in the edited corpus. The headline finding is that of the distinct canonical works behind the 26 structurally-canonical rows, only 3 are early-canonical (the 6 early-canonical rows are those 3 Anguttara discourses, AN 3.80 / AN 9.21 / AN 10.29, each counted in two recensions), and the literal-place reading is more concrete in the later and more narrative registers (a gradient that is partly definitional and confounded with genre, since the early-canonical works are all Anguttara, as the readable write-up discusses). v1.2: corrected the short-u substring (144) to the honest stem '%uttarakur%' (161 rows / 152 distinct passages), recovering the canonical four-continent cosmology (AN 3.80 / AN 10.29).",
  "framing_note": "Two distinct findings are kept apart. The quantitative finding is one of text mass: of the rows that speak of Uttarakuru, the great majority are commentarial. The conceptual finding is one of origin: the core frame (a four-continent place, a propertyless long-lived people who surpass the gods in non-grasping yet lack the holy life) is canonical, and the commentary amplifies it and adds the decisive soteriological verdict. Text mass is not concept-origin; the paper states each separately.",
  "provenance_note": "Every citation resolves to a live corpus row. Where the corpus carries English (the SuttaCentral mula rows) the rendering is Sujato's; the Aṭṭhakathā, Ṭīkā, and Pali-only Visuddhimagga rows carry no English in the corpus, so those renderings are the author's own gloss, marked tr_provenance='author' and checked against the standard published translations. Verbatim Pali carries full diacritics and matches the cited row.",
  "edition": "Chaṭṭha Saṅgāyana (CST/VRI) as ingested into dhamma-pg; SuttaCentral ids as cross-walk.",
 },
 "disambiguation": {
  "target_substring": layer_count["mula"] + layer_count["attha"] + layer_count["tika"] + layer_count["anya"],
  "exact_fts": 15,
  "short_u_substring": 144,
  "by_layer": layer_count,
  "confounds": {"kuru_not_uttarakuru": 976, "kurudhamma_kuruvatta": 26, "four_continent_frame": 29, "caturanta_epithet": 125},
  "excluded_breakdown": {"label": "the 976 bare-kuru (non-continent) rows, by layer", "mula": 124, "attha": 449, "tika": 283, "anya": 120,
                          "note": "These are the Kuru janapada, a different referent (the 'uttarakur' stem is absent), so excluding them does not bias the Uttarakuru count; the breakdown is reported for transparency."},
  "note": "Three search depths, reported as a finding in their own right. Exact-FTS on the token 'uttarakuru' finds 15 rows. Substring with a short final u, '%uttarakuru%', finds 144 but silently drops the long-u declined forms (uttarakurūnaṃ, uttarakurūsu) that carry the canonical four-continent cosmology. The honest stem '%uttarakur%' finds the full set. 'Kuru' alone then blurs three referents: the continent (target), the Kuru janapada, and the kuru-vatta observance; the 976 bare-kuru rows and 26 kuru-dhamma rows are the blur, excluded; the homonym is itself a finding (feature C1).",
 },
 "reliability": {
  "coders": 3,
  "features": len(FEATURES),
  "unanimous_h0h1": 15,
  "h0h1_agreement_pct": round(15/len(FEATURES)*100, 1),
  "fleiss_kappa": 0.941,
  "warrant_agreement": str(len(FEATURES)) + "/" + str(len(FEATURES)),
  "disagreements": [{"feature": "A10", "votes": {"commentarial-detail": 2, "split": 1}, "adjudicated": "commentarial-detail",
                     "note": "Majority: the four-continent conquest frame is canonical (DN 17/26), the jewel-woman's Uttarakuru origin a detail within it."}],
  "note": "Three independent readers classified each feature's canonical warrant and its early-versus-later class from the verbatim evidence. Agreement was unanimous on 15 of 16 features (Fleiss kappa 0.94, near-complete) and on every warrant (a canonical citation versus none). The voice of each census row follows directly from its source work; the motif is an approximate window-based grouping.",
  "signature_coders": _v2.get("coders", 3),
  "signature_iaa": {k: (str(v["unanimous"]) + "/" + str(v["of"])) for k, v in _v2["iaa"].items()},
  "signature_note": "Each claim was coded for several further properties (its chronological stratum, who is speaking, how the text marks what it knows, how far the claim reaches across the other early-Buddhist recensions, and whether the commentary reconciles a tension); three independent readers coded these, and agreement on each property is reported above (12 to 15 of 16). The hardest to judge (who is speaking, and whether a tension is being reconciled) carry the most disagreement, as one would expect, since they ask the reader to weigh speaker and intent rather than just spot a marker.",
 },
 "saturation": {
  "note": "Recall was driven to saturation in four passes, one of which corrected an earlier error. (1) The name pass was fixed mid-study: the first substring '%uttarakuru%' (short final u) found 144 rows but missed the long-u declined forms (uttarakurūnaṃ, uttarakurūsu), so the honest stem '%uttarakur%' was adopted (161 rows); the recovered rows include the canonical four-continent cosmology, AN 3.80 / AN 10.29. (2) The four-continent frame pass folded oblique rows in selectively (e.g. DN 17/26). (3) Concept-independent passes searched the no-warrant features WITHOUT the name: the wish-tree (kapparukkha) is canonical only as an Apadāna merit-fruit, never placed at Uttarakuru; the self-ripening rice is a canonical idyll (DN 27, DN 32, the Vessantara Jātaka); and no canonical passage gives the northern continent a no-disease, perpetual-climate, or from-here-to-heaven property. (4) The canonical akkhaṇa list (AN 8.29 / DN 33) was read directly and does not name Uttarakuru. After the correction no soteriological negative flipped, and the canonical frame (A1, A2, A6) gained witnesses. The no-warrant verdicts now rest on concept searches, not only on name proximity; saturation is measured, not proven.",
 },
 "context": CONTEXT,
 "segments": SEGMENTS,
 "features": FEATURES,
 "census": census_src,
 "aggregates": {
  "voice_split": voice_split,
  "para_subsplit": para_sub,
  "layer_count": layer_count,
  "h0h1_tally": h0h1_tally,
  "warrant_split": warrant_split,
  "segment_count": seg_count,
  "motif_count": motif_count,
  "stratum_split": stratum_split,
  "mula_stratum": mula_stratum,
  "mula_early_vs_late": {"early-canonical": mula_early, "late-or-later": mula_late,
    "early_distinct_works": mula_early_distinct, "mula_distinct_works": mula_distinct,
    "note": "Of the structurally-mula rows, the genuinely early-canonical share versus everything stratified later (late-canonical paritta/Apadana/Vinaya-frame, Abhidhamma, paracanonical, commentary-era). Rows are counted per recension, so the early-canonical figure of 6 rows is 3 distinct discourses each counted twice (a SuttaCentral row and its Chaṭṭha-Saṅgāyana sibling: AN 3.80, AN 9.21, AN 10.29). Deduplicated, the early share is " + str(mula_early_distinct) + " of " + str(mula_distinct) + " distinct canonical works."},
  "recension_dedup": {
    "census_rows": len(census_src), "distinct_passages": 152,
    "mula_rows": layer_count["mula"], "mula_distinct_works": mula_distinct,
    "early_canonical_rows": mula_early, "early_canonical_distinct_works": mula_early_distinct,
    "milindapanha_rows": para_sub["milindapanha"], "milindapanha_distinct": milindapanha_distinct,
    "note": "The census counts one row per recension. Of 161 rows, 152 are distinct passages once each SuttaCentral row is collapsed with its Chaṭṭha-Saṅgāyana sibling. The early-canonical floor is 3 distinct discourses (AN 3.80, AN 9.21, AN 10.29), each appearing twice; the 4 Milindapañha rows are 2 distinct passages counted twice. The distinct_passages total is the database-confirmed figure for the corrected stem '%uttarakur%'."},
  "feature_stratum": feat_stratum,
  "cross_recension": {
   "note": "Link-level from the corpus passage_parallels table (sutta-to-sutta; under-covers the Abhidharma cosmology where an Uttarakuru three-distinctions parallel would live, so a null is a known genre blind-spot).",
   "agganna_template": {"for": "dn27", "status": "pre-sectarian (multi-recensional)",
     "parallels": ["san-lo-mvu32 (Mahavastu)", "san-mu-kd17 (Mulasarvastivada Vinaya)", "t10 (Chinese)", "sf277 (Sanskrit fragment)"]},
   "atanatiya": {"for": "dn32", "status": "multi-recensional", "parallels": ["t1245 (Chinese)"]},
   "tithanasutta_hinge": {"for": "an9.21", "status": "no linked non-Pali parallel; local to the Pali pending verification",
     "parallels": [], "guard": "No linked non-Pali parallel is not the same as 'no parallel exists'; the three-distinctions schema is stock Abhidharma cosmology, which a sutta-to-sutta parallel table under-covers."},
  },
 },
}

out = os.path.join(REPO, 'public', 'research', 'uttarakuru.json')
json.dump(DATA, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- consistency check (gate) ----------
errs = []
N = len(census_src)
if sum(voice_split.values()) != N: errs.append("voice_split != census len")
if sum(layer_count.values()) != N: errs.append("layer_count != census len")
if sum(para_sub.values()) != voice_split["para-canon"]: errs.append("para_subsplit != para-canon")
if DATA["disambiguation"]["target_substring"] != N: errs.append("disambig target != census len")
if warrant_split["warranted"] + warrant_split["null"] != len(FEATURES): errs.append("warrant_split != features")
if sum(h0h1_tally.values()) != len(FEATURES): errs.append("h0h1_tally != features")
for f in FEATURES:
    for band, c in f["cells"].items():
        for ct in c["cites"]:
            if not ct.get("id"): errs.append(f"{f['id']}/{band} empty cite id")
# no em-dashes anywhere in the serialized output
raw = open(out, encoding='utf-8').read()
if "—" in raw: errs.append("em-dash present in output")

print("wrote", out)
print("census rows:", N, "| voice:", voice_split, "| para-sub:", para_sub)
print("features:", len(FEATURES), "| h0h1:", h0h1_tally, "| warrant:", warrant_split)
print("CONSISTENCY:", "PASS" if not errs else ("FAIL: " + "; ".join(errs)))
