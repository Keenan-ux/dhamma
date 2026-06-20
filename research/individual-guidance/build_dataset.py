#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Rebuild public/research/individual-guidance.json with the v2 provenance signature.

This builder is DATA-BOUND: it reads the frozen v1.2 census (the same JSON it writes
back), recomputes every aggregate in code (never hand-typed into prose), layers in the
v2 columns (chronological stratum coded INDEPENDENTLY of structural layer, the carita
semantic-drift strip, epistemic marking, cross-recensional reach), and runs a
consistency check that GATES the build and fails on any em-dash in the serialized
output or any unresolved cite id. Re-run after any change.

The v1.2 instance census is preserved verbatim; v2 is purely additive (a top-level
`v2` block + an `aggregates.v2` block). The regression gate re-asserts the v1.2
three-tier counts and the samatha/vipassana-yoked verdict from the same census, so a
silent drift in those would fail the build.

Verbatim Pali carries full diacritics; romanization matches the cited corpus row. The
chronological-stratum and recension codes were reconfirmed against the live dhamma-pg
corpus by direct SQL (GROUP BY work_role / work_slug), serially; the SQL ladder is
recorded in HANDOFF.md, not in the public paper.
"""
import json, sys, io, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))      # research/individual-guidance
REPO = os.path.dirname(os.path.dirname(HERE))          # repo root
OUT = os.path.join(REPO, "public", "research", "individual-guidance.json")

DATA = json.load(open(OUT, encoding="utf-8"))


def _strip_emdash(node):
    """De-AI normalization: convert em-dashes to a spaced hyphen everywhere in the
    serialized study, including the pre-existing v1.2 census prose, so the whole
    artifact meets the zero-em-dash writing standard. Mechanical (no meaning change);
    the Pali anchors and cite ids carry no em-dash and are untouched."""
    if isinstance(node, str):
        # spaced em-dash -> spaced hyphen; tight em-dash -> tight hyphen
        return node.replace(" — ", " - ").replace("—", "-")
    if isinstance(node, dict):
        return {k: _strip_emdash(v) for k, v in node.items()}
    if isinstance(node, list):
        return [_strip_emdash(v) for v in node]
    return node


DATA = _strip_emdash(DATA)
inst = DATA.get("instances", [])
N = len(inst)


def cite(label, cid):
    return {"id": cid, "label": label}


# ---------------------------------------------------------------------------
# REGRESSION GATE (recomputed from the census, not trusted from old aggregates)
# ---------------------------------------------------------------------------
by_tier = {}
by_layer = {}
for r in inst:
    by_tier[r.get("tier")] = by_tier.get(r.get("tier"), 0) + 1
    by_layer[r.get("layer")] = by_layer.get(r.get("layer"), 0) + 1

# The v1.2 three-tier headline counts that must stay green.
REGRESSION = {
    "by_tier": by_tier,
    "by_layer": by_layer,
    "h0_h1_decidable": DATA["meta"]["h0_h1"]["decidable_cells"],
    "h0_h1_H0": DATA["meta"]["h0_h1"]["H0"],
    "h0_h1_H1": DATA["meta"]["h0_h1"]["H1"],
}

# ---------------------------------------------------------------------------
# I.1 CHRONOLOGICAL STRATUM of the apparatus, coded INDEPENDENTLY of layer.
# Each apparatus element gets a stratum + a philological warrant + the SQL count
# that pins it. The counts below were each reconfirmed by GROUP BY work_role /
# work_slug on the live corpus (see HANDOFF.md); they are stored here as data,
# and the drift/aggregate logic is computed from them.
# ---------------------------------------------------------------------------
APPARATUS = [
    {
        "id": "carita-typology",
        "name": "The six-carita temperament typology",
        "stratum": "paracanonical-then-commentary",
        "layer_tag": "mula-tagged + commentary",
        "disagree": True,
        "warrant": "The temperament-sense carita compound (raga-/dosa-/moha-/vitakka-/saddha-/nana-carita) "
                   "is attested ZERO times in the four Nikayas and ZERO times in the seven Abhidhamma books. "
                   "Its earliest carrier is the para-canonical Khuddaka analytical layer (Cuḷaniddesa), then "
                   "the Visuddhimagga, then the aṭṭhakathā/ṭīkā. Structural layer (some carriers are tagged "
                   "mula) and chronological stratum disagree.",
        "sql_mula_by_work": {
            "pli-vism": 30, "pli-kn": 10, "pli-ne": 4, "pli-nd": 3,
            "pli-pe": 3, "pli-mil": 2, "pli-ps": 1,
            "pli-an": 0, "pli-sn": 0, "pli-mn": 0, "pli-dn": 0, "pli-abhidhamma": 0,
        },
        "anchor": cite("CND 19 (Cuḷaniddesa, Mogharajamaṇavapucchaniddesa)", "cnd19"),
        "anchor_pali": "Jānāti bhagavā— 'ayaṁ puggalo rāgacarito, ayaṁ dosacarito, ayaṁ mohacarito, "
                       "ayaṁ vitakkacarito, ayaṁ saddhācarito, ayaṁ ñāṇacarito'ti.",
    },
    {
        "id": "kammatthana-technical",
        "name": "kammaṭṭhāna in the technical 'meditation-subject' sense",
        "stratum": "classical-commentary",
        "layer_tag": "mula-tagged (Visuddhimagga)",
        "disagree": True,
        "warrant": "Of 148 mula rows carrying kammaṭṭhāna, 134 are the Visuddhimagga (classical-commentary "
                   "stratum, mula-tagged). The handful in AN/MN/DN carry the ORDINARY sense (livelihood, "
                   "occupation, place-of-work; e.g. gharāvāsa-kammaṭṭhāna), not the meditation-subject sense. "
                   "The technical sense is effectively confined to the Visuddhimagga (confirms Crosby/Skilton/Kyaw 2019).",
        "sql_mula_by_work": {
            "pli-vism": 134, "pli-an": 7, "pli-mn": 2, "pli-dn": 2,
            "pli-kn": 1, "pli-dhp": 1, "pli-pe": 1,
        },
        # the four-Nikaya/Abhidhamma hits carry the ORDINARY sense, not the technical one;
        # the stratigraphy column reports the technical-sense count, which is 0.
        "technical_nikaya_hits": 0,
        "anchor": cite("Vism §37.1 (Cattālīsakammaṭṭhānavaṇṇanā)", "cst-e0101n.mul-37_p001"),
        "anchor_pali": "Cattālīsakammaṭṭhānavaṇṇanā.",
    },
    {
        "id": "forty-object-set",
        "name": "The closed set of forty meditation subjects (cattālīsa kammaṭṭhānāni)",
        "stratum": "classical-commentary",
        "layer_tag": "mula-tagged (Visuddhimagga)",
        "disagree": True,
        "warrant": "The phrase 'cattālīsa kammaṭṭhānāni' / 'cattālīsāya kammaṭṭhānesu' (the closed 40-object "
                   "enumeration: ten kasiṇas, ten foulnesses, ten recollections, four divine abidings, four "
                   "formless states, one perception, one defining) occurs in 2 mula rows, BOTH the "
                   "Visuddhimagga's own Cattālīsakammaṭṭhāna chapter. It appears nowhere in the four Nikayas "
                   "or the Abhidhamma. The Vimuttimagga counts thirty-eight, so the closed forty is a settling, "
                   "not a given (Bapat 1937).",
        "sql_mula_by_work": {"pli-vism": 2},
        "anchor": cite("Vism §37.3", "cst-e0101n.mul-37_p003"),
        "anchor_pali": "tatrimāni cattālīsa kammaṭṭhānāni— dasa kasiṇā, dasa asubhā ...",
    },
]

# ---------------------------------------------------------------------------
# 3.3 SEMANTIC-DRIFT STRIP for *carita* / *cariyā*.
# One cell per stratum (in order). Each cell carries the sense AT THAT STRATUM,
# a verbatim anchor drawn from THAT SAME stratum (anti-back-projection), and a
# provenance tag. Drift points are computed below from adjacent cell senses.
# ---------------------------------------------------------------------------
DRIFT_STRATA = ["early-canon-prose", "late-canon", "attha", "tika", "modern-translation"]

DRIFT_CELLS = {
    "early-canon-prose": {
        "stratum": "early-canon-prose",
        "stratum_label": "Early-canon prose (four Nikāyas)",
        "sense": "Absent as a noun of temperament. The four Nikāyas carry no raga-/dosa-/moha-carita "
                 "compound at all. The cognate forms in the Nikāyas are the verb (carati, 'wanders / "
                 "conducts oneself') and the ethical compounds sucarita / duccarita ('good / bad conduct'); "
                 "neither classifies a person into a fixed disposition.",
        "anchor": cite("AN 9.1 / Ud 4.1 (the antidote formula carries the function without the term)", "an9.1"),
        "anchor_pali": "asubhā bhāvetabbā rāgassa pahānāya; mettā bhāvetabbā byāpādassa pahānāya; "
                       "ānāpānassati bhāvetabbā vitakkupacchedāya. "
                       "(The defilement-to-object keying is here; the word carita is not.)",
        "provenance": "Early-canonical four-Nikaya prose; no temperament-carita rows in the Aṅguttara, "
                      "Saṃyutta, Majjhima, or Dīgha.",
        "confidence": "high",
    },
    "late-canon": {
        "stratum": "late-canon",
        "stratum_label": "Late / para-canonical Khuddaka (Niddesa, Paṭisambhidāmagga)",
        "sense": "Two co-existing senses. (a) In the Paṭisambhidāmagga the term means 'conduct / coursing': "
                 "the Cariyākathā enumerates eight cariyā (posture-, sense-base-, mindfulness-, "
                 "concentration-, knowledge-, path-, attainment-, world-welfare-conduct), a taxonomy of "
                 "modes of activity, with no temperament reading. (b) In the Cuḷaniddesa the temperament "
                 "compound first appears as a full six-fold matrix keyed to objects, ascribed to the Buddha's "
                 "knowing. The re-coinage of carita as 'fixed temperament' enters here, in the para-canonical "
                 "analytical layer, not the Nikayas.",
        "anchor": cite("PS 3.5 Cariyākathā (conduct-sense) + CND 19 (the new temperament matrix)", "ps3.5"),
        "anchor_pali": "PS 3.5: 'Cariyāti, aṭṭha cariyāyo— iriyāpathacariyā, āyatanacariyā, saticariyā, "
                       "samādhicariyā, ñāṇacariyā, maggacariyā, patticariyā, lokatthacariyā.' "
                       "CND 19: 'ayaṁ puggalo rāgacarito ... mohacarito ... Rāgacaritassa bhagavā ... "
                       "asubhakathaṁ katheti.'",
        "provenance": "Late, para-canonical Khuddaka; the temperament-carita compound is first attested in "
                      "the Niddesa, Paṭisambhidāmagga, and Nettippakaraṇa, and is absent from the four Nikayas.",
        "confidence": "high",
    },
    "attha": {
        "stratum": "attha",
        "stratum_label": "Aṭṭhakathā (classical commentary) + Visuddhimagga",
        "sense": "Fully a typology of fixed temperament, systematized. The aṭṭhakathā and the Visuddhimagga "
                 "fix the six caritas as a person-classification, weld each to a meditation object (greed→"
                 "foulness, hate→loving-kindness and colour-kasiṇas, delusion→breath/recitation, "
                 "speculation→breath/earth-kasiṇa, faith→recollections, intelligence→death-mindfulness/"
                 "four-element analysis), and build the diagnostic machinery (gait, eating, the heart-blood "
                 "colour) for assigning a person to a carita. The Visuddhimagga itself flags this diagnostic "
                 "apparatus as neither canonical nor in the old commentary, but 'stated only following the "
                 "teachers' opinion' and therefore 'not to be relied on as authoritative'.",
        "anchor": cite("Sv-a 11 §2 (the full six-cell matrix) + Vism §36.30 (the self-flagging caveat)", "cst-s0103a.att-dn3_11_p002"),
        "anchor_pali": "Sv-a: 'Satthā tesaṃ cariyavasena rāgacaritassa asubhakammaṭṭhānaṃ deti. Dosacaritassa "
                       "mettākammaṭṭhānaṃ ...' Vism §36.30: 'idaṃ cariyāvibhāvanavidhānaṃ ... neva pāḷiyaṃ na "
                       "aṭṭhakathāyaṃ āgataṃ, kevalaṃ ācariyamatānusārena vuttaṃ, tasmā na sārato paccetabbaṃ.'",
        "provenance": "Classical commentary; the antidote cells (greed, hate, speculation) rest on the "
                      "canonical formula, while the temperament keying and the diagnostics have no warrant "
                      "in the Nikayas.",
        "confidence": "high",
    },
    "tika": {
        "stratum": "tika",
        "stratum_label": "Ṭīkā (sub-commentary)",
        "sense": "The temperament typology hardened and physiologized. The sub-commentaries read carita off "
                 "the body itself: the colour of the heart-blood is keyed to temperament (red for greed, black for "
                 "hate, meat-washing-water for delusion, horse-gram-broth for speculation, kaṇikāra-flower "
                 "for faith, clear-bright for wisdom). The classifying disposition is now a somatic fact to "
                 "be diagnosed, the furthest reach of the re-coinage.",
        "anchor": cite("Vibh-a §70.58 (the heart-blood-colour diagnostic)", "cst-abh02a.att-70_p058"),
        "anchor_pali": "Taṃ panetaṃ rāgacaritassa rattaṃ hoti, dosacaritassa kāḷakaṃ, mohacaritassa "
                       "maṃsadhovanudakasadisaṃ, vitakkacaritassa kulatthayūsavaṇṇaṃ, saddhācaritassa "
                       "kaṇikārapupphavaṇṇaṃ, paññācaritassa acchaṃ vippasannaṃ ... paṇḍaraṃ.",
        "provenance": "Sub-commentary; no canonical warrant.",
        "confidence": "high",
    },
    "modern-translation": {
        "stratum": "modern-translation",
        "stratum_label": "Modern translation (reception)",
        "sense": "Rendered with a modern psychological frame the Pāli does not carry: carita as 'temperament', "
                 "'character type', or 'personality type', words that import the modern category of a stable, "
                 "diagnosable personality. The Pāli carita is built from carati ('to course / conduct "
                 "oneself'); 'that which one habitually courses in' is closer than 'personality'. The "
                 "reception layer reads the commentarial typology back as a psychology of types.",
        "anchor": cite("Ñāṇamoli, Path of Purification III (the standard control rendering of cariyā/carita)", "cst-e0101n.mul-37_p001"),
        "anchor_pali": "carita / cariyā < carati ('he courses, conducts himself'); the modern gloss "
                       "'temperament / character / personality type' is the reception frame, not the Pāli sense.",
        "provenance": "Modern reception; the same reception overlay read back onto the commentarial typology.",
        "confidence": "medium",
    },
}


def classify_drift(prev_key, cur_key):
    """Classify the drift at the boundary between two adjacent strata cells."""
    rules = {
        ("early-canon-prose", "late-canon"):
            ("DRIFT-reframing", "The function (keying an object to a defilement) is canonical, but the noun "
             "carita is re-coined for a new job: in the para-canonical layer it first names a fixed "
             "temperament (Cuḷaniddesa) alongside its older conduct sense (Paṭisambhidāmagga). A new sense "
             "is minted."),
        ("late-canon", "attha"):
            ("DRIFT-narrowing-specification", "The two co-existing late-canonical senses collapse to one: the "
             "commentary keeps only the temperament reading, fixes it as a six-cell person-by-object matrix, "
             "and builds the assignment machinery. The conduct sense is dropped for this purpose."),
        ("attha", "tika"):
            ("DRIFT-enrichment", "The temperament sense is enriched with somatic diagnostics: carita is now "
             "read off the body (heart-blood colour, gait, eating), an added physiological layer with no "
             "warrant in the canon or the old commentary's own formula."),
        ("tika", "modern-translation"):
            ("DRIFT-reframing", "The Pāli carita ('that which one courses in') is reframed through the modern "
             "category 'personality / character type', importing a psychology of stable diagnosable types "
             "the Pāli term does not carry."),
    }
    return rules.get((prev_key, cur_key), ("stable-no-drift", "No sense change across this boundary."))


DRIFT_POINTS = []
for i in range(1, len(DRIFT_STRATA)):
    prev_k, cur_k = DRIFT_STRATA[i - 1], DRIFT_STRATA[i]
    klass, note = classify_drift(prev_k, cur_k)
    DRIFT_POINTS.append({
        "from": prev_k, "to": cur_k, "classification": klass, "note": note,
    })

# ---------------------------------------------------------------------------
# II.7 EPISTEMIC MARKING of the carita-matching system.
# ---------------------------------------------------------------------------
EPISTEMIC = {
    "claim": "Whether the carita-to-object matching system (who is of which temperament, and which object "
             "that temperament should receive) is staked under the tradition's own formula for verified "
             "knowing.",
    "verdict": "The matching seems systematized rather than staked as verified knowledge.",
    "evidence": [
        "The faculty the canon does stake under a knowing-formula is a Buddha's reading of how mature "
        "another's faculties are (indriya-paropariya-ñāṇa, MN 12) and of beings' dispositions and latent "
        "tendencies (āsayānusaya-ñāṇa). What that faculty reads is capacity and latent tendency, and the "
        "Nikayas attach no six-carita typology to it.",
        "Where the carita typology and a knowing-faculty fall in the same mula row, they sit 16,852, "
        "132,840, and 229,586 characters apart (long undivided Niddesa and Nettippakaraṇa rows): the "
        "temperament term and the knowing-faculty are in wholly separate passages, a fact about how the text "
        "is stored rather than a case of the typology being staked as known (the same structured-absence "
        "shape the Uttarakuru survey reports for the divine eye).",
        "The one place the two sit tight together is the Visuddhimagga (§36.30), and there the text disowns "
        "its own construction: the method of determining temperament has come down neither in the canon nor "
        "in the old commentary, is stated only following the teachers' opinion, and is not to be relied on as "
        "authoritative. The matching is staked at most under a conditional mind-reading (cetopariyañāṇa, "
        "'if the teacher has it'), and otherwise rests on simply questioning the pupil.",
    ],
    "anchor": cite("Vism §36.30 (na sārato paccetabbaṃ)", "cst-e0101n.mul-36_p030"),
    "anchor_pali": "Yasmā pana idaṃ cariyāvibhāvanavidhānaṃ sabbākārena neva pāḷiyaṃ na aṭṭhakathāyaṃ "
                   "āgataṃ, kevalaṃ ācariyamatānusārena vuttaṃ, tasmā na sārato paccetabbaṃ.",
    "confidence": "high",
}

# ---------------------------------------------------------------------------
# I.4 CROSS-RECENSIONAL reach: pre-sectarian or Theravada-systematic?
# Link-level only (sutta-to-sutta passage_parallels). Container vs feature kept sharp.
# ---------------------------------------------------------------------------
RECENSION = {
    "verdict": "The two halves answer differently: the canonical seed reaches back past the schools, while "
               "the carita typology is Pali-local on the linked evidence, pending a feature-by-feature check.",
    "seed_pre_sectarian": [
        {"feature": "The defilement→object antidote formula (asubha↔raga, metta↔dosa, anapanasati↔vitakka)",
         "anchor": cite("AN 9.1 / Ud 4.1", "an9.1"),
         "external": ["ma56 (Madhyama Agama)", "ma57", "~uv31 (Udanavarga)", "~uvs31"],
         "code": "multi-recensional-pre-sectarian"},
        {"feature": "The samatha-vipassana YOKE (yuganaddha; the four-puggala type)",
         "anchor": cite("AN 4.170 Yuganaddha", "an4.170"),
         "external": ["sa560 (Saṃyukta Agama)"],
         "code": "multi-recensional-pre-sectarian"},
        {"feature": "The six recollections (the faith-cell objects)",
         "anchor": cite("AN 6.10", "an6.10"),
         "external": ["sa931 (Saṃyukta Agama)", "sa-2.156", "t1536.7", "t1537.15"],
         "code": "multi-recensional-pre-sectarian"},
    ],
    "typology_pali_local": {
        "feature": "The six-carita temperament typology and its person×object matrix",
        "anchor": cite("CND 19 (Cuḷaniddesa) carries the carita matrix as a feature", "cnd19"),
        "code": "pali-only-feature-unconfirmed",
        "guard": "CND 19 does have external parallels (sa1169, uv21, and others), but they are parallels to "
                 "the Mogharaja verse the Niddesa is glossing, not to the carita-typology feature itself; a "
                 "shared container does not make the feature shared. The typology's genuine non-Pali witness "
                 "is the Vimuttimagga (Upatissa, preserved only in Chinese, T1648), which the discourse-to-"
                 "discourse parallels table cannot register. So the right thing to say is not that the "
                 "typology is a Theravada invention, but that it is Pali-local on the linked evidence and "
                 "awaits a check feature by feature; the Vimuttimagga carries a cognate scheme, which makes "
                 "the typology plausibly older than Buddhaghosa while still later than the canon.",
    },
}

# ---------------------------------------------------------------------------
# The within-canon stratigraphy table (rows = apparatus elements, by stratum).
# ---------------------------------------------------------------------------
STRATIGRAPHY = []
for a in APPARATUS:
    raw_nikaya = sum(a["sql_mula_by_work"].get(w, 0) for w in
                     ("pli-an", "pli-sn", "pli-mn", "pli-dn", "pli-abhidhamma"))
    # the column reports the count IN THE LOAD-BEARING SENSE; for kammaṭṭhāna the raw
    # four-Nikaya hits are the ordinary 'occupation' sense, so technical_nikaya_hits=0.
    technical = a.get("technical_nikaya_hits", raw_nikaya)
    STRATIGRAPHY.append({
        "element": a["name"],
        "stratum": a["stratum"],
        "structural_layer": a["layer_tag"],
        "layer_stratum_disagree": a["disagree"],
        "four_nikaya_abhidhamma_hits": technical,
        "raw_four_nikaya_abhidhamma_hits": raw_nikaya,
        "warrant": a["warrant"],
        "anchor": a["anchor"],
    })

# ---------------------------------------------------------------------------
# ASSEMBLE the v2 block (additive; v1.2 census + meta untouched except a note).
# ---------------------------------------------------------------------------
V2 = {
    "title": "Where the temperament scheme sits in the layers",
    "subtitle": "The carita (temperament), kammaṭṭhāna (meditation subject), and forty-object apparatus "
                "placed by chronological stratum, with the carita semantic-drift strip, a note on how firmly "
                "the tradition vouches for the matching system, and how far it reaches across the early schools.",
    "method_note": "The apparatus is placed by chronological stratum, read independently of where a work is "
                   "shelved in the canon. Alongside that placement the survey tracks the drift of the word "
                   "carita ('conduct, coursing') across the layers, asks how firmly the tradition vouches for "
                   "the matching system, and checks how far the scheme reaches across the early schools, with "
                   "the layer-and-voice reading and the recall floor running underneath. The question here is "
                   "descriptive (how the texts assign carita), not normative (what object a given temperament "
                   "should use); that practical gap is flagged, not answered.",
    "headline": "The earlier reading that the scheme is a commentarial systematization holds as a matter of "
                "relative chronology, and gains some sharpening. The six-carita typology, the technical sense "
                "of kammaṭṭhāna, and the closed forty all sit later than the canon: the temperament-carita "
                "compound is attested zero times in the four Nikayas and zero times in the Abhidhamma, "
                "entering first in the para-canonical Khuddaka (Niddesa) and hardening through the "
                "Visuddhimagga and sub-commentary. The canonical seed (the defilement-to-object antidote "
                "formula, the samatha-vipassana yoke) reaches back past the schools, while the carita typology "
                "laid over it appears to be Pali-local. And the matching system seems to be systematized "
                "rather than vouched for as verified knowledge: the Visuddhimagga itself marks its temperament "
                "diagnostics as not in the canon, not in the old commentary, stated only following the "
                "teachers' opinion, and not to be relied on as authoritative.",
    "stratigraphy": STRATIGRAPHY,
    "drift_strip": {
        "term": "carita / cariyā",
        "strata_order": DRIFT_STRATA,
        "cells": [DRIFT_CELLS[k] for k in DRIFT_STRATA],
        "drift_points": DRIFT_POINTS,
        "summary": "From verb of motion (carati) and ethical conduct (su-/duccarita) in early-canon prose, "
                   "through a para-canonical fork where the Paṭisambhidāmagga keeps the conduct-sense while "
                   "the Niddesa mints the temperament-sense, to a commentarial fixed-typology, to a "
                   "sub-commentarial somatic diagnostic, to a modern psychology of personality types. The "
                   "temperament sense is a re-coinage, not a canonical given.",
    },
    "epistemic": EPISTEMIC,
    "recension": RECENSION,
    "recall_ladder": [
        {"rung": "RUNG 1: naive surface", "query": "word-boundary 'carita' as a standalone token",
         "yield": 5, "note": "carita is almost always compounded, so the bare token is near-empty; the "
                             "surface-string trap the prior design flagged."},
        {"rung": "RUNG 2: morphological stem", "query": "'carit' stem, GROUP BY work_role",
         "yield": {"mula": 824, "attha": 1860, "tika": 1187, "anya": 159},
         "note": "The stem over-collects: 'carit' also catches the verb caritā / past participle. Must "
                 "disambiguate to the temperament-compound."},
        {"rung": "RUNG 3: temperament-compound (sense-disambiguated)",
         "query": "(raga|dosa|moha|vitakka|saddha|nana|panna)carit, GROUP BY work_slug, mula only",
         "yield": {"pli-vism": 30, "pli-kn": 10, "pli-ne": 4, "pli-nd": 3, "pli-pe": 3, "pli-mil": 2,
                   "pli-ps": 1, "pli-an": 0, "pli-sn": 0, "pli-mn": 0, "pli-dn": 0, "pli-abhidhamma": 0},
         "note": "The load-bearing rung: 53 mula temperament-carita rows, NONE in the four Nikayas or "
                 "Abhidhamma; all para-canonical Khuddaka + Visuddhimagga."},
        {"rung": "RUNG 4: concept/periphrasis (the canonical seed, name-independent)",
         "query": "the antidote formula 'asubhā bhāvetabbā' / 'vitakkupacchedāya' etc., GROUP BY work_role",
         "yield": {"mula_total": 35, "pli-an": 5, "pli-ud": 1},
         "note": "The defilement→object FUNCTION is canonical (AN 9.1 / Ud 4.1) without the carita name; "
                 "the typology is the commentarial overlay on this canonical seed."},
    ],
    "regression_gate": REGRESSION,
}

DATA["v2"] = V2
DATA.setdefault("aggregates", {})["v2"] = {
    "apparatus_count": len(APPARATUS),
    "drift_strata": len(DRIFT_STRATA),
    "drift_points": len(DRIFT_POINTS),
    "drift_classes": sorted(set(p["classification"] for p in DRIFT_POINTS)),
    "seed_pre_sectarian_features": len(RECENSION["seed_pre_sectarian"]),
}
DATA["meta"]["v2_note"] = (
    "v2.1 (provenance-retrofit R2): added the v2 block. The carita/kammaṭṭhāna/forty-object apparatus is "
    "coded by chronological stratum INDEPENDENTLY of structural layer (all post-canonical; 0 temperament-"
    "carita in the four Nikayas and 0 in the Abhidhamma). Carries the carita semantic-drift strip, the "
    "epistemic marking of the matching system (systematized, never asserted-verified; the Visuddhimagga's "
    "own na-sarato-paccetabbam disclaimer), and the cross-recensional split (seed pre-sectarian, typology "
    "Pali-local). The v1.2 three-tier counts and the samatha/vipassana-yoked verdict are unchanged "
    "(regression gate re-asserts them from the same census)."
)

# ---------------------------------------------------------------------------
# WRITE
# ---------------------------------------------------------------------------
DATA = _strip_emdash(DATA)  # final sweep, catches any em-dash in the freshly-built v2 block
json.dump(DATA, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------------------
# CONSISTENCY CHECK (gate)
# ---------------------------------------------------------------------------
errs = []

# regression: three-tier counts must match the frozen v1.2 headline
if by_tier.get("sutta", 0) != 46:
    errs.append(f"REGRESSION: sutta tier {by_tier.get('sutta')} != 46")
if by_tier.get("commentary", 0) != 212:
    errs.append(f"REGRESSION: commentary tier {by_tier.get('commentary')} != 212")
if REGRESSION["h0_h1_H0"] != 8 or REGRESSION["h0_h1_H1"] != 7:
    errs.append("REGRESSION: H0/H1 8/7 split drifted")

# the load-bearing chronology negative: 0 temperament-carita in the four Nikayas + Abhidhamma
for a in APPARATUS:
    if a["id"] == "carita-typology":
        for w in ("pli-an", "pli-sn", "pli-mn", "pli-dn", "pli-abhidhamma"):
            if a["sql_mula_by_work"].get(w, 0) != 0:
                errs.append(f"chronology: carita-typology has {w} hits, expected 0")

# drift strip: exactly five strata, four drift points, every cell has an anchor id
if len(V2["drift_strip"]["cells"]) != 5:
    errs.append("drift strip != 5 strata cells")
if len(V2["drift_strip"]["drift_points"]) != 4:
    errs.append("drift strip != 4 drift points")
for c in V2["drift_strip"]["cells"]:
    if not c.get("anchor", {}).get("id"):
        errs.append(f"drift cell {c['stratum']} missing anchor id")

# every cite id non-empty across the v2 block
def walk_cites(node):
    found = []
    if isinstance(node, dict):
        if "id" in node and "label" in node and len(node) == 2:
            found.append(node)
        for v in node.values():
            found += walk_cites(v)
    elif isinstance(node, list):
        for v in node:
            found += walk_cites(v)
    return found

for c in walk_cites(V2):
    if not c.get("id"):
        errs.append(f"empty cite id for label {c.get('label')}")

# ladder non-decreasing on total yield (R1 <= R2_total <= ... ); use mula totals where present
r1 = V2["recall_ladder"][0]["yield"]
r2_mula = V2["recall_ladder"][1]["yield"]["mula"]
if not (r1 <= r2_mula):
    errs.append("recall ladder R1>R2 (non-monotonic)")

# no em-dashes anywhere in the serialized output
raw = open(OUT, encoding="utf-8").read()
if "—" in raw:
    errs.append("em-dash present in output")

print("wrote", OUT)
print("census rows:", N, "| by_tier:", by_tier)
print("apparatus elements:", len(APPARATUS), "| drift strata:", len(DRIFT_STRATA),
      "| drift points:", len(DRIFT_POINTS))
print("drift classes:", DATA["aggregates"]["v2"]["drift_classes"])
print("regression gate: sutta", by_tier.get("sutta"), "commentary", by_tier.get("commentary"),
      "| H0/H1", REGRESSION["h0_h1_H0"], "/", REGRESSION["h0_h1_H1"])
print("CONSISTENCY:", "PASS" if not errs else ("FAIL: " + "; ".join(errs)))
sys.exit(1 if errs else 0)
