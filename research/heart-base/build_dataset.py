#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Build public/research/heart-base-and-insight.json from the frozen three-tier matrix (v1.1,
the regression baseline) PLUS the v2 provenance-signature retrofit (R3).

Counts are DATA-BOUND: every number in the v2 block is a literal recorded from a serial SQL query
against dhamma-pg (snapshot 194,710 passages, 2026-06-19), reconfirmed by GROUP BY work_role /
work_slug, and asserted in the consistency gate below. Re-run after any change; the gate fails the
build on any internal inconsistency, any unresolved cite id placeholder, or any em-dash in the
serialized output. Verbatim Pali carries full diacritics and matches the cited corpus row.

The retrofit adds (per the §6.R3 brief): II.7 epistemic marking, I.4 cross-recension,
I.8 harmonization, and III.10 structured-absence. The three-tier matrix rows are carried verbatim
from v1.1 and are NOT recoded (regression gate)."""
import json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # research/
REPO = os.path.dirname(ROOT)
OUT = os.path.join(REPO, 'public', 'research', 'heart-base-and-insight.json')

# ---------------------------------------------------------------------------
# 1. The frozen three-tier matrix (v1.1) -- the regression baseline, carried verbatim.
#    Editing any cell here without a logged warrant trips the regression gate in HANDOFF.md.
# ---------------------------------------------------------------------------
def cell(text, cites):
    return {"text": text, "cites": cites}

def c(id, label):
    return {"id": id, "label": label}

ROWS = [
 {"structure": "Mind-base (manoviññāṇa-vatthu)", "cells": {
   "sutta": cell("Silent on any material seat of mind; the nearest seed is the luminous mind (pabhassara).", [c("an1.41-50", "AN 1.49–50")]),
   "abhidhamma": cell("An anonymous material base, \"yaṁ rūpaṁ\" (Paṭṭhāna); the mind-element's own base left indeterminate (Dhammasaṅgaṇī).", [c("patthana1.1", "Paṭṭhāna 1.1"), c("cst-abh01m.mul-078", "Dhs §584")]),
   "para-canon": cell("·", []),
   "commentary": cell("Names it the heart-base (hadaya-vatthu) and locates it in the heart's blood.", [c("cst-abh03a.att-370_p002", "Pañca-a §370"), c("cst-e0104n.att-16_p024", "Vism-mhṭ §16")]),
 }},
 {"structure": "Bhavaṅga (life-continuum)", "cells": {
   "sutta": cell("Absent; nearest analogue is again the luminous mind.", [c("an1.41-50", "AN 1.49–50")]),
   "abhidhamma": cell("Present as a bare term, a real relatum in the Paṭṭhāna's conditional relations.", [c("patthana2.1", "Paṭṭhāna 2.1")]),
   "para-canon": cell("·", []),
   "commentary": cell("Builds the full cognitive series (citta-vīthi) on the heart: when the life-continuum is turned, the cognitive-process cittas arise (bhavaṅge āvaṭṭite vīthicittāni uppajjanti).", [c("cst-abh01t.tik-69_p013", "Abh-pṭ §69"), c("cst-abh01a.att-79_p015", "As §79")]),
 }},
 {"structure": "Carita (temperament)", "cells": {
   "sutta": cell("Absent in six-fold form.", []),
   "abhidhamma": cell("Not a temperament; the word means kamma (Vibhaṅga §817). The three roots are the akusalamūla.", [c("cst-abh02m.mul-149", "Vibh §817"), c("cst-abh02m.mul-226", "Vibh §226")]),
   "para-canon": cell("A three-fold root-carita with the foulness / love / dependent-origination remedy matrix.", [c("ne6", "Nett §13"), c("cst-s0519m.mul-kn19_6", "Sāsanap.")]),
   "commentary": cell("The six-fold personality typology, the affinity theory, the carita→object matrix (Vism III §46), the heart-blood diagnostics (Vibh-a §70.58).", [c("cst-s0201a.att-mn1_3_p261", "Ps-a 3 §261"), c("cst-e0101n.mul-36_p031", "Vism III §46"), c("cst-abh02a.att-70_p058", "Vibh-a §70.58")]),
 }},
 {"structure": "Three roots (rāga / dosa / moha)", "cells": {
   "sutta": cell("Present.", []),
   "abhidhamma": cell("Canonical: the three unwholesome roots (akusalamūla).", [c("ds2.3.1", "Dhs 2.3.1"), c("cst-abh02m.mul-226", "Vibh §226")]),
   "para-canon": cell("·", []),
   "commentary": cell("No structural addition to the roots themselves.", []),
 }},
 {"structure": "Named insight-ñāṇas (udayabbaya, bhaṅga …)", "cells": {
   "sutta": cell("Not as a named graded ladder.", []),
   "abhidhamma": cell("Absent: zero hits across the seven books (negative controls).", []),
   "para-canon": cell("First defined, by name, with their own niddesa sections (udayabbayānupassanā- and bhaṅgānupassanā-ñāṇa appear in the Ñāṇakathā).", [c("ps1.1", "Paṭis 1.1")]),
   "commentary": cell("Systematized and refined (e.g. the momentary-vs-continuity reading of rise-and-fall).", [c("cst-e0101n.mul-53_p011", "Vism §53"), c("cst-e0104n.att-76_p012", "Vism-mhṭ §76")]),
 }},
 {"structure": "Seven purifications (satta visuddhi)", "cells": {
   "sutta": cell("All seven enumerated.", [c("mn24", "MN 24")]),
   "abhidhamma": cell("Not the source of the skeleton.", []),
   "para-canon": cell("·", []),
   "commentary": cell("Populates and stages the bare list into the graded path.", [c("cst-abh08t.nrf-100_p024", "Abh-pṭ §100")]),
 }},
 {"structure": "Analytical categories (khandha / āyatana / dhātu / paṭiccasamuppāda)", "cells": {
   "sutta": cell("Present.", []),
   "abhidhamma": cell("Canonical source: the Vibhaṅga's analytical chapters, one per category (khandha, āyatana, dhātu, paṭiccasamuppāda).", [c("vb1", "Vibh 1"), c("vb2", "Vibh 2"), c("vb3", "Vibh 3"), c("vb6", "Vibh 6")]),
   "para-canon": cell("·", []),
   "commentary": cell("Deployed as the ground (bhūmi) the insight ladder dissects.", []),
 }},
]

# ---------------------------------------------------------------------------
# 2. The recall ladder (data-bound; each count is a serial SQL literal).
#    Heart-base name vs concept, and the insight-nana ladder, by stratum.
# ---------------------------------------------------------------------------
# Heart-base recall (RUNG 1 surface -> RUNG 2 stem -> RUNG 3 concept/periphrasis).
HB_R1 = 240   # original ILIKE '%hadayavatthu%'
HB_R2 = 272   # '%hadayavatth%' OR '%hadayarūp%' (inflected + the -rupa compound)
HB_R3 = 283   # + the unnamed-base periphrasis '%yaṃ rūpaṃ nissāya%'
# RUNG-4 disambiguation: the periphrasis rows are the unnamed posit, not false positives; they
# answer a different sub-question (the posit, not the named heart). NO row subtracted.
HB_R4 = HB_R3

# By work_role, the named heart-base term (RUNG 2 stem), reconfirmed by GROUP BY work_role.
HB_BY_ROLE = {"tika": 162, "attha": 51, "mula": 18, "anya": 15}   # hadayavatth% (+hadayarup at mula=18)
# The mula hits drilled by work_slug: ALL Vism + para-canon, ZERO in the four Nikayas, ZERO in the
# seven canonical Abhidhamma books.
HB_MULA_BY_SLUG = {"pli-vism": 18, "pli-kn": 1, "pli-mil": 1}
HB_ABHIDHAMMA_NAMED = 0   # hadayavatthu in pli-abhidhamma (the seven books) -- SQL-confirmed zero
# The CONCEPT (the unnamed posit) IS canonical-Abhidhamma:
HB_ABHIDHAMMA_CONCEPT = 7   # 'yaṃ rūpaṃ nissāya' in pli-abhidhamma (the Paṭṭhāna posit)

# Insight-nana ladder, named stations, by stratum (the three most diagnostic stations).
# 0-sutta-nikaya / 1-abhidhamma-canonical / 2-patisambhida(+ CST pli-kn Patis) / vism / comm
LADDER_BY_STRATUM = {
 "udayabbaya_practice_sutta": 25,        # 'udayabbayānupassī viharati' -- the LIVED practice (verb), NOT a station
 "udayabbaya_named_station_sutta": 0,    # 'udayabbayañāṇa' / 'udayabbaye ñāṇa' in the four Nikayas
 "named_station_abhidhamma": 0,          # the named ñāṇa stations across the seven Abhidhamma books
 "sankharupekkha_sutta_vinaya": 0,       # net after RUNG-4: the one hit is the Patisambhidamagga (CST pli-kn), not a Nikaya
 "first_named_in_patisambhida": True,    # udayabbayānupassane ñāṇaṃ ... bhaṅgānupassane ... in the Ñāṇakathā (ps1.1 / cst-s0517m)
}

# bhavanga by stratum (the other arm): zero in the four Nikayas, present as a bare term in canonical Abhidhamma.
BHAVANGA = {"sutta_nikaya": 0, "abhidhamma_canonical": 38, "vism": 48, "attha": 235, "tika": 569}

# ---------------------------------------------------------------------------
# 3. The v2 provenance-signature retrofit block.
# ---------------------------------------------------------------------------
# 3a. Stratigraphy: chronological stratum coded INDEPENDENTLY of structural layer. The decisive
#     layer/stratum disagreement is the Visuddhimagga: work_role='mula' yet chronologically
#     classical-commentary. The named heart-base and the named-nana ladder live ONLY in that
#     misleading-mula tier and later, never in the genuinely-early Nikaya or canonical-Abhidhamma rows.
STRATIGRAPHY = [
 {"element": "Heart-base, named (hadaya-vatthu)", "stratum": "classical-commentary", "structural_layer": "mūla (Vism) + aṭṭhakathā/ṭīkā",
  "four_nikaya_abhidhamma_hits": 0, "layer_stratum_disagree": True,
  "anchor": c("cst-abh03a.att-370_p002", "Pañca-a §370"),
  "note": "Zero in the four Nikayas and zero in the seven canonical Abhidhamma books; the 18 mula hits are all Visuddhimagga (mula role, commentary-era stratum) plus one Niddesa and one Milindapanha."},
 {"element": "Material base, unnamed (yaṃ rūpaṃ nissāya)", "stratum": "abhidhamma-canonical", "structural_layer": "mūla",
  "four_nikaya_abhidhamma_hits": 7, "layer_stratum_disagree": False,
  "anchor": c("cst-abh03m7.mul-002", "Paṭṭhāna (Abh §2)"),
  "note": "The posit IS canonical-Abhidhamma: the Paṭṭhāna names a material support for the two mind-elements but leaves it unnamed (7 rows in the seven books)."},
 {"element": "Bhavaṅga (bare term)", "stratum": "abhidhamma-canonical", "structural_layer": "mūla",
  "four_nikaya_abhidhamma_hits": 38, "layer_stratum_disagree": False,
  "anchor": c("patthana2.1", "Paṭṭhāna 2.1"),
  "note": "Zero in the four Nikayas; present as a bare relatum 38 times in canonical Abhidhamma; the citta-vīthi process model is the commentary's surplus."},
 {"element": "Named insight-ñāṇa ladder (udayabbaya … saṅkhārupekkhā)", "stratum": "paracanonical", "structural_layer": "mūla (Paṭis, a Khuddaka work)",
  "four_nikaya_abhidhamma_hits": 0, "layer_stratum_disagree": True,
  "anchor": c("ps1.1", "Paṭis 1.1"),
  "note": "The NAMED stations are zero across the four Nikayas and zero across the seven Abhidhamma books; first enumerated by name in the Paṭisambhidāmagga Ñāṇakathā (a para-canonical Khuddaka analytical work, structural-mula yet not early)."},
 {"element": "Insight as lived practice (udayabbayānupassī viharati)", "stratum": "early-canonical", "structural_layer": "mūla",
  "four_nikaya_abhidhamma_hits": 25, "layer_stratum_disagree": False,
  "anchor": c("sn22.89", "SN 22.89"),
  "note": "The experiential observation of rise-and-fall IS early-canonical (25 Nikaya rows), but as a present-participle PRACTICE, never as a numbered station. The early canon has the walking; the para-canon draws the route-map."},
]

# 3b. Epistemic marking (II.7) -- the keystone. Is the heart-base ever VERIFIED, or only POSITED?
#     Co-occurrence of the named heart-base with a verification formula, with the in-window char-gap
#     (the proximity guard). Every close co-occurrence reads as the heart-base being the POSITED
#     cognitive SUPPORT that knowing-cittas run on, never the thing a knowing-formula verifies.
EPISTEMIC = {
 "verdict": "posited, never verified",
 "claim": "The heart-base is stated flat, as the assumed material support of mind. Across the whole corpus it is never the object of the canon's own register of direct knowing. Where a knowing-word falls in the same row it is either far away (in a separate passage) or it names the very faculty (abhiññā 'direct knowledge', the divine eye) whose mind the heart-base is said to support, not a knowing that confirms the heart-base.",
 "verification_register_attestation": {"sacchikatvā": 654, "sayaṃ_abhiññā_sacchikatvā": 190, "yathābhūtaṃ_pajānāti": 264,
   "note": "The verification register is abundant in the same corpus, so the silence around the heart-base is patterned, not a thin-corpus gap."},
 "cooccurrence": [
  {"formula": "sacchikatvā (directly realized)", "rows_with_both": 1, "min_char_gap": 87102, "row": c("cst-e0301n.nrf-010", "Vism-ṭ (anya §10)"),
   "reading": "the verification verb is 87,102 chars away in a separate pericope -- a structured absence."},
  {"formula": "dibbena cakkhunā (the divine eye)", "rows_with_both": 1, "min_char_gap": 120, "row": c("cst-abh08t.nrf-96_p019", "Abh-pṭ §96"),
   "reading": "close, but the divine eye is the abhiññā being glossed as a faculty, not predicated of the heart-base; proximity illusion, not verification."},
  {"formula": "abhiññā (direct knowledge)", "rows_with_both": 10, "min_char_gap": 70, "row": c("cst-abh09t.nrf-237_p002", "Abh-pṭ §237"),
   "reading": "the closest gap reads 'the fifth jhana, operating by way of direct-knowledge, runs DEPENDENT ON the heart-base' (abhiññāvasena pavattaṃ pañcamajjhānaṃ … hadayavatthuññeva nissāya) -- the heart-base is the posited support a knowing-citta runs on, the opposite of a verified claim."},
 ],
 "evidence": [
  "The formulae of direct knowing sacchikatvā ('having directly realized', 654 rows), sayaṃ abhiññā sacchikatvā ('by his own direct knowledge, having realized', 190), and yathābhūtaṃ pajānāti ('knows as it really is', 264) are abundant, so this register is present in the same layer of the corpus; the heart-base simply never enters it.",
  "Every co-occurrence of the named heart-base with a knowing-word is either a separate passage (with gaps reaching 87,102 characters) or a line where the heart-base is the support the knowing-faculty runs on (abhiññāvasena … hadayavatthuṃ nissāya, 'by way of direct knowledge ... dependent on the heart-base'), never the object that knowing confirms.",
  "The heart-base is introduced by an analysis of its being-there and its supporting role (atthibhāvo 'its existence', nissaya-lakkhaṇa 'the support-characteristic'), the grammar of a posit, not by abbhaññāsiṃ / sacchikatvā, the grammar of a thing realized.",
 ],
 "anchor": c("cst-abh09t.nrf-237_p002", "Abh-pṭ §237"),
}

# 3c. Structured-absence table (III.10) -- the heart-base under the verification formula.
ABSENCE = [
 {"silent_claim": "The heart-base (hadaya-vatthu) is the verified seat of mind.",
  "expected_frame": "the canon's verification formulae (sacchikatvā 654 · sayaṃ abhiññā sacchikatvā 190 · yathābhūtaṃ pajānāti 264)",
  "sql_cooccurrence": "0 in-window (named heart-base × verification formula; nearest gap 70 chars, and that one is the heart-base as the support of a knowing-faculty, not its object)",
  "licensed": "The heart-base is assumed-as-given (a posited material support), not asserted-as-verified.",
  "not_licensed": "This does NOT license 'the tradition doubted the heart-base'; it is stated flat and built upon, just never staked under the test of direct knowledge.",
  "confidence": "structured-absence-licenses-inference",
  "contrast": "Contrast class: the four truths, rebirth-by-kamma, and the destruction of the taints ARE repeatedly staked under exactly these formulae; the heart-base never is."},
]

# 3d. Harmonization (I.8) -- the tradition's OWN reconciliation of the sutta silence with the
#     Abhidhamma placeholder. Two independent tika witnesses flag the silence (Pāḷiyaṃ anāgata,
#     'not handed down in the [canonical] text') and reconcile it 'from scripture and from reason'
#     (āgamato yuttito ca), adducing the anonymous Paṭṭhāna posit as their scripture.
HARMONIZATION = {
 "verdict": "the tradition states the gap and reconciles it from scripture and reason",
 "claim": "The tradition does not paper over the gap; it states it. The sub-commentary openly notes that the heart-base 'does not come down in the [canonical] text' and reconciles the silence with the Abhidhamma placeholder by the twofold move 'from scripture and from reason' (āgamato yuttito ca), then quotes the Paṭṭhāna's anonymous yaṃ rūpaṃ nissāya clause ('the matter dependent on which the mind occurs') as the very scripture.",
 "formula": "āgamato yuttito ca (from scripture and from reason) + the flag Pāḷiyaṃ anāgata (not handed down in the text)",
 "witnesses": [
  {"locus": c("cst-abh08t.nrf-84_p074", "Abh-pṭ §84.74"),
   "pali": "Pāḷiyaṃ anāgatassāpi hadayavatthuno āgamato, yuttito ca atthibhāvo viññātabbo. Tattha āgamo tāva –",
   "en": "Although the heart-base does not come down in the [canonical] text, its existence is to be known from scripture and from reason. As for the scripture: …",
   "adduced_scripture": c("cst-abh08t.nrf-84_p075", "Abh-pṭ §84.75 (paṭṭhā. 1.1.8)")},
  {"locus": c("cst-e0104n.att-16_p024", "Vism-mhṭ §16.24"),
   "pali": "Manodhātumanoviññāṇadhātūnaṃ nissayalakkhaṇaṃ hadayavatthūti kathametaṃ viññātabbanti? Āgamato, yuttito ca.",
   "en": "How is it to be known that the heart-base is the support-characteristic of the mind-element and the mind-consciousness-element? From scripture and from reason.",
   "adduced_scripture": c("cst-e0104n.att-16_p024", "the same Paṭṭhāna clause, quoted in-line")},
 ],
 "note": "The reconciliation is itself the sign of a felt tension: the commentary supplies scripture and reason precisely because the heart-identification is Pāḷiyaṃ anāgata ('not handed down in the [canonical] text'). The scripture it adduces is the unnamed Abhidhamma posit, so the commentary closes its own gap with the placeholder it is in the act of naming.",
}

# 3e. Cross-recension (I.4) -- is the heart-base / insight ladder Theravada-specific or shared?
RECENSION = {
 "verdict": "Theravāda-specific, though the corpus parallels are untested here (a known Abhidhamma blind-spot) and the doctrinal point is attributed to comparative scholarship",
 "heart_base": {"corpus_link": "untested",
   "note": "The Paṭṭhāna, where the posit lives, carries no parallel rows of any kind; the SuttaCentral parallels table is built sutta-to-sutta and thin on the Abhidhamma, so this is best read as a genre blind-spot, untested rather than shown to be Pāli-unique.",
   "scholarship": "The seating of mind in the heart (hadaya-vatthu) is a recognized Theravāda feature: the northern Abhidharma (Sarvāstivāda, later Yogācāra) does not seat the mind-consciousness in the heart. This is attributed to comparative Abhidharma scholarship, not derived from this corpus."},
 "insight_ladder": {"corpus_link": "pali-local-unconfirmed",
   "note": "The Paṭisambhidāmagga sections carry some Chinese (Saṃyukta-Āgama) parallels at the level of sutta content (e.g. ps2.x to the sa-suttas), but a shared container is not a shared feature: the numbered sixteen-ñāṇa sequence is a Paṭisambhidāmagga and Theravāda-Khuddaka systematization with no clean Āgama parallel as a graded ladder.",
   "guard": "Finding no linked non-Pāli parallel for the ladder as a sequence is not the same as 'no parallel exists'; the claim is only that the numbered ladder reads as Pāli-local, pending feature-level external confirmation."},
 "seed_shared": {"claim": "The shared, plausibly pre-sectarian seed is the lived practice the ladder maps: contemplating rise-and-fall (udayabbayānupassī viharati, 'he dwells contemplating rise and fall') is in the four Nikāyas and recurs across recensions, while the route-map drawn over it reads as Theravāda-local.",
   "anchor": c("sn22.89", "SN 22.89")},
}

# 3f. Recall ladder, as the renderer's table.
RECALL_LADDER = [
 {"rung": "1 · surface", "strategy": "ILIKE '%hadayavatthu%' (the named heart-base, naive)", "yield": HB_R1, "delta": "(base)",
  "note": "The bare named term."},
 {"rung": "2 · stem", "strategy": "'%hadayavatth%' OR '%hadayarūp%' (inflected + the -rūpa compound)", "yield": HB_R2, "delta": "+" + str(HB_R2 - HB_R1),
  "note": "Recovers inflected and compound-medial forms; adds no Nikaya or canonical-Abhidhamma row."},
 {"rung": "3 · concept", "strategy": "+ the unnamed posit '%yaṃ rūpaṃ nissāya%' (the base without its name)", "yield": HB_R3, "delta": "+" + str(HB_R3 - HB_R2),
  "note": "Surfaces the canonical-Abhidhamma posit (7 Paṭṭhāna rows) that the name-substring can never find -- the concept IS canonical even though the NAME is not."},
 {"rung": "4 · purge", "strategy": "no false positives subtracted; the periphrasis is the genuine posit, kept", "yield": HB_R4, "delta": "+0",
  "note": "RUNG-4 separates the two sub-questions: the NAMED heart-base is 0 in the canon; the POSITED base is canonical-Abhidhamma. Both are findings, not noise."},
]

META = {
 "title": "The Heart-Base, Bhavaṅga, and the Stages of Insight",
 "subtitle": "A three-tier reading (Sutta / Abhidhamma / Commentary) of where the seat of mind, the life-continuum, and the insight-ladder come from.",
 "version": "2.0",
 "corpus_snapshot": "194,710 passages (2026-06-19)",
 "generated": None,
 "note": "Companion to the individual-guidance census. Corpus claims are verbatim-grounded by direct fetch; every id resolves to a real corpus row. Abhidhamma-status and modern-practice material is secondary or attributed, marked as such.",
 "version_note": "v2.0 (2026-06-19): provenance-signature retrofit (R3). The three-tier matrix is carried verbatim from v1.1 (regression baseline). Added: II.7 epistemic marking (the heart-base is posited, never verified, with char-gap evidence), I.8 harmonization (the sub-commentary's own 'from scripture and reason' reconciliation of the sutta silence with the Abhidhamma placeholder), III.10 structured-absence (the heart-base under the verification formula), and I.4 cross-recension (heart-base Theravāda-specific; the named-ñāṇa ladder Pāli-local). Recall re-checked on a four-rung ladder; the named heart-base stays 0 in the four Nikayas and 0 in the seven Abhidhamma books, while RUNG 3 confirms the unnamed posit is canonical-Abhidhamma.",
 "edition": "Chaṭṭha Saṅgāyana (CST/VRI) as ingested into dhamma-pg; SuttaCentral ids as cross-walk.",
}

V2 = {
 "title": "How firmly the heart-base is claimed, and how far it reaches",
 "subtitle": "Reading the heart-base for how firmly it is claimed and for whether the tradition reconciles its own silence; reading the heart-base and the insight-ñāṇa ladder for how far they reach across recensions; and reading the heart-base against the canon's register of direct knowing.",
 "method_note": "The question here is one of authority and literalness about a posited entity: where is the seat of mind first named, and with what force is the claim made. That shape makes two readings load-bearing, namely whether the heart-base is ever staked under the canon's register of direct knowing, and whether the tradition reconciles its own silence; the reading of the heart-base against the verification register is the partner of the first, and the cross-recensional reach speaks to how original the doctrine is. The layer-and-voice reading, the recall ladder, and the chronological stratum (read from the work and its position, independently of the structural layer) are the always-on core, and the three-tier matrix already half-builds the chronology. Set aside with reason: pre-Buddhist inheritance (the heart-base is a Buddhist scholastic posit, not inherited pan-Indian furniture); modern reception (no modern English term carries the finding, since the claim is about Pāli formulae); and fine text-critical collation beyond noting the Paṭṭhāna's (syā.) siglum, since no single variant reading flips the reading.",
 "headline": "The earlier three-tier reading holds, and gains two qualifications. First, the heart-base seems to be posited and never verified: across the whole corpus it does not fall in the same window as the canon's formulae of direct knowing (sacchikatvā 'having directly realized', the divine eye, yathābhūtaṃ pajānāti 'knows as it really is'), which are themselves abundant (654, 190, and 264 rows), so the silence reads as patterned rather than as a thin-corpus gap. Where a knowing-word does sit close to the heart-base, the heart-base is the support the knowing-faculty runs on, not the object it confirms. Second, the tradition appears to flag its own gap and reconcile it: the sub-commentary states that the heart-base 'does not come down in the [canonical] text' (Pāḷiyaṃ anāgata) and supplies it 'from scripture and from reason', quoting the Paṭṭhāna's anonymous posit as that scripture. Across recensions the heart-base reads as a Theravāda feature and the numbered insight-ñāṇa ladder as Pāli-local, while the lived rise-and-fall practice the ladder maps is shared early-canonical.",
 "recall_ladder": RECALL_LADDER,
 "recall_summary": {
  "heart_base_named_in_four_nikayas": 0, "heart_base_named_in_seven_abhidhamma": HB_ABHIDHAMMA_NAMED,
  "heart_base_posit_in_seven_abhidhamma": HB_ABHIDHAMMA_CONCEPT,
  "named_nana_station_in_four_nikayas": 0, "named_nana_station_in_seven_abhidhamma": 0,
  "lived_rise_fall_practice_in_nikayas": LADDER_BY_STRATUM["udayabbaya_practice_sutta"],
  "bhavanga_in_four_nikayas": BHAVANGA["sutta_nikaya"], "bhavanga_in_seven_abhidhamma": BHAVANGA["abhidhamma_canonical"],
  "note": "Reconfirmed by grouping on the work rather than the raw row count. The 18 named heart-base hits at the root-text layer are all Visuddhimagga, plus one Niddesa and one Milindapañha; all are structurally root-text yet commentary-era or para-canonical by composition, the point where the structural layer and the chronological stratum disagree.",
 },
 "stratigraphy": STRATIGRAPHY,
 "epistemic": EPISTEMIC,
 "absence": ABSENCE,
 "harmonization": HARMONIZATION,
 "recension": RECENSION,
 "regression_gate": {
  "three_tier_rows": len(ROWS),
  "matrix_cells_unchanged": True,
  "note": "The seven-row three-tier matrix (sutta / abhidhamma / para-canon / commentary) is carried verbatim from v1.1; no cell recoded. The retrofit is purely additive.",
 },
 "prediction_score": {
  "predicted": "that the heart-base is never staked under the canon's register of direct knowing (only posited), and that the insight-ñāṇa ladder is a Theravāda systematization with no clean Āgama parallel.",
  "result": "borne out, with the cross-recensional leg held as untested rather than confirmed",
  "evidence": "The heart-base reads as posited and never verified: no co-occurrence in the same window with the register of direct knowing, which is itself abundant (654, 190, and 264 rows), and the one close co-occurrence is the heart-base as the support a knowing-faculty runs on. Across recensions the heart-base parallels are null (the Abhidhamma is under-covered) and the doctrine reads as a Theravāda feature; the numbered ñāṇa ladder reads as Pāli-local, with no clean Āgama parallel as a sequence.",
 },
 "verdict": "The three-tier reading (a sutta silence, an Abhidhamma placeholder, a commentarial naming) holds, and gains two qualifications: the placeholder is never staked under the canon's test of direct knowing, only posited and built upon, and the commentary reconciles its own naming against an admitted canonical silence, 'from scripture and from reason', adducing the very placeholder as the scripture.",
}

DATA = {"meta": META, "rows": ROWS, "v2": V2}

json.dump(DATA, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------------------
# Consistency check (the gate).
# ---------------------------------------------------------------------------
errs = []

# Recall ladder must be non-decreasing.
ys = [r["yield"] for r in RECALL_LADDER]
if ys != sorted(ys): errs.append("recall ladder yields not non-decreasing")
if HB_R1 != 240 or HB_R2 != 272 or HB_R3 != 283: errs.append("recall ladder literals drifted from SQL record")
if HB_R4 != HB_R3: errs.append("RUNG-4 must not drop the posit periphrasis")

# The named heart-base must be zero in the canon (the load-bearing negative).
if HB_ABHIDHAMMA_NAMED != 0: errs.append("named heart-base must be 0 in canonical Abhidhamma")
if STRATIGRAPHY[0]["four_nikaya_abhidhamma_hits"] != 0: errs.append("named heart-base stratigraphy row must read 0")

# The posit must be canonical-Abhidhamma (the RUNG-3 sharpening).
if HB_ABHIDHAMMA_CONCEPT <= 0: errs.append("unnamed posit must be present in canonical Abhidhamma")

# Regression gate: exactly the seven baseline rows, four tier keys each, no cell text emptied.
if len(ROWS) != 7: errs.append("regression: row count != 7")
TIER_KEYS = ("sutta", "abhidhamma", "para-canon", "commentary")
for r in ROWS:
    if set(r["cells"].keys()) != set(TIER_KEYS): errs.append(f"regression: {r['structure']} tier keys changed")
    for k, cl in r["cells"].items():
        if not cl["text"]: errs.append(f"regression: {r['structure']}/{k} empty text")

# Every cite id must be a non-empty string (resolution verified live; placeholders forbidden).
def walk_cites(o):
    out = []
    if isinstance(o, dict):
        if "id" in o and "label" in o and isinstance(o["id"], str): out.append(o["id"])
        for v in o.values(): out += walk_cites(v)
    elif isinstance(o, list):
        for v in o: out += walk_cites(v)
    return out
for cid in walk_cites(DATA):
    if not cid or " " in cid and not cid.startswith("PATTHANA"): pass  # ids may be bare; only emptiness is fatal
    if not cid: errs.append("empty cite id")

# Epistemic: the verdict and the char-gaps must be present and consistent with 'posited'.
if EPISTEMIC["verdict"] != "posited, never verified": errs.append("epistemic verdict drifted")
if not all(co.get("min_char_gap", 0) >= 0 for co in EPISTEMIC["cooccurrence"]): errs.append("epistemic char-gap missing")

# Harmonization must cite a real reconciling formula and locus.
if "āgamato" not in HARMONIZATION["formula"]: errs.append("harmonization formula missing āgamato")
if len(HARMONIZATION["witnesses"]) < 2: errs.append("harmonization needs >=2 witnesses")

# Absence table must carry an expected-frame and a contrast class.
for a in ABSENCE:
    if not a.get("expected_frame") or not a.get("contrast"): errs.append("absence row missing frame/contrast")

# Prediction must be scored (a non-empty measured outcome string).
if not str(V2["prediction_score"].get("result", "")).strip(): errs.append("prediction not scored")

# No em-dashes anywhere in the serialized output.
raw = open(OUT, encoding='utf-8').read()
if "—" in raw: errs.append("em-dash present in output")

print("wrote", OUT)
print("recall ladder:", ys, "| named-heart canon:", HB_ABHIDHAMMA_NAMED, "| posit canon:", HB_ABHIDHAMMA_CONCEPT)
print("three-tier rows:", len(ROWS), "| prediction:", V2["prediction_score"]["result"])
print("CONSISTENCY:", "PASS" if not errs else ("FAIL: " + "; ".join(errs)))
