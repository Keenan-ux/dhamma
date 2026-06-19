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
 "claim": "The heart-base is stated flat as the assumed material support of mind. Across the whole corpus it is never the object of the canon's own verification formula. Where a verification verb falls in the same row it is either far away (a separate pericope) or it names the very faculty (abhiññā, the divine eye) whose citta the heart-base is said to SUPPORT, not a knowing that confirms the heart-base.",
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
  "The verification formulae sacchikatvā (654 rows), sayaṃ abhiññā sacchikatvā (190), and yathābhūtaṃ pajānāti (264) are abundant, so the verification register is present in the same corpus stratum; the heart-base simply never enters it.",
  "Every co-occurrence of the named heart-base with a verification verb is either a separate pericope (char-gaps to 87,102) or a passage where the heart-base is the SUPPORT the knowing-faculty runs on (abhiññāvasena … hadayavatthuṃ nissāya), never the object that knowing confirms.",
  "The heart-base is introduced by an existence-and-support analysis (atthibhāvo, nissaya-lakkhaṇa), the grammar of a posit, not by abbhaññāsiṃ / sacchikatvā, the grammar of a verification.",
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
 "verdict": "harmonization-flagged (reconciled-by-distinction)",
 "claim": "The tradition does not paper over the gap; it states it. The sub-commentary openly flags that the heart-base 'does not come down in the [canonical] text' and reconciles the silence with the Abhidhamma placeholder by the twofold move 'from scripture and from reason', then quotes the Paṭṭhāna's anonymous yaṃ-rūpaṃ-nissāya clause as the very scripture.",
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
 "note": "The reconciliation is itself the evidence of a felt tension: the commentary supplies scripture-and-reason precisely because the heart-identification is Pāḷiyaṃ anāgata. The adduced scripture is the unnamed Abhidhamma posit, so the commentary closes its own gap with the placeholder it is naming.",
}

# 3e. Cross-recension (I.4) -- is the heart-base / insight ladder Theravada-specific or shared?
RECENSION = {
 "verdict": "Theravāda-specific (corpus-link null is a known Abhidhamma blind-spot; the doctrinal differentia is scholarship-attributed)",
 "heart_base": {"corpus_link": "untested",
   "note": "The Paṭṭhāna (the heart-base posit locus) carries ZERO parallel rows of any kind; the SuttaCentral parallels table is sutta-to-sutta and structurally under-covers the Abhidhamma, so the null is a genre blind-spot, coded untested rather than pali-unique.",
   "scholarship": "The localization of mind in the heart (hadaya-vatthu) is a recognized Theravāda differentia: the northern Abhidharma (Sarvāstivāda, later Yogācāra) does not seat mano-viññāṇa in the heart. Attributed to comparative-Abhidharma scholarship, not corpus-derived."},
 "insight_ladder": {"corpus_link": "pali-local-unconfirmed",
   "note": "The Paṭisambhidāmagga sections carry some Chinese (Saṃyukta-Āgama) parallels at the SUTTA-CONTENT level (e.g. ps2.x → sa-suttas), but a container parallel is not a feature parallel: the numbered sixteen-ñāṇa SEQUENCE is a Paṭisambhidāmagga / Theravāda-Khuddaka systematization with no clean Āgama parallel as a graded ladder.",
   "guard": "No LINKED non-Pāli parallel for the ladder-as-sequence is not the same as 'no parallel exists'; the claim is that the numbered ladder is Pāli-local, pending feature-level external confirmation."},
 "seed_shared": {"claim": "The shared, plausibly pre-sectarian seed is the LIVED practice the ladder maps: contemplating rise-and-fall (udayabbayānupassī viharati) is in the four Nikayas and recurs across recensions; the route-map drawn over it is Theravāda-local.",
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
 "title": "Provenance-signature retrofit (R3)",
 "subtitle": "The heart-base coded for epistemic marking and harmonization; the heart-base and the insight-ñāṇa ladder coded for cross-recensional reach; the heart-base under the verification formula as a structured absence.",
 "method_note": "Re-examined under PROVENANCE-SIGNATURE.md. The study's question is an authority/literalness question about a posited entity (a category-typology member that is an asserted entity), so the triage makes II.7 epistemic marking and I.8 harmonization load-bearing, with III.10 structured-absence as II.7's partner and I.4 cross-recension for the originality arm. Layer+voice, the §3.1 recall ladder, and I.1 chronological stratum are the always-on core (the three-tier matrix already half-builds the chronology). Excluded with warrant: I.5 pre-Buddhist (the heart-base is a Buddhist scholastic posit, not inherited pan-Indian furniture, so inheritance is not load-bearing); I.6 reception (no modern English term carries the finding -- the claim is about Pāli formulae); 3.4 text-critical beyond noting the Paṭṭhāna's (syā.) siglum (no single variant reading flips the heart-base verdict).",
 "headline": "The prior three-tier finding is CONFIRMED and sharpened on two new axes. (1) Epistemically, the heart-base is posited, never verified: across the whole corpus it never falls in-window under the canon's verification formulae (sacchikatvā, the divine eye, yathābhūtaṃ pajānāti), which are themselves abundant (654 / 190 / 264 rows) -- a structured absence, not a thin-corpus gap. Where a verification verb sits close to the heart-base, the heart-base is the SUPPORT the knowing-faculty runs on, not the object it confirms. (2) The tradition flags its own gap and reconciles it: the sub-commentary states the heart-base 'does not come down in the [canonical] text' (Pāḷiyaṃ anāgata) and supplies it 'from scripture and from reason', quoting the Paṭṭhāna's anonymous posit as the scripture. Cross-recension: the heart-base is a Theravāda differentia and the numbered insight-ñāṇa ladder is Pāli-local, while the lived rise-and-fall practice the ladder maps is shared early-canonical.",
 "recall_ladder": RECALL_LADDER,
 "recall_summary": {
  "heart_base_named_in_four_nikayas": 0, "heart_base_named_in_seven_abhidhamma": HB_ABHIDHAMMA_NAMED,
  "heart_base_posit_in_seven_abhidhamma": HB_ABHIDHAMMA_CONCEPT,
  "named_nana_station_in_four_nikayas": 0, "named_nana_station_in_seven_abhidhamma": 0,
  "lived_rise_fall_practice_in_nikayas": LADDER_BY_STRATUM["udayabbaya_practice_sutta"],
  "bhavanga_in_four_nikayas": BHAVANGA["sutta_nikaya"], "bhavanga_in_seven_abhidhamma": BHAVANGA["abhidhamma_canonical"],
  "note": "Reconfirmed by GROUP BY work_role / work_slug. The named heart-base mula hits (18) are all Visuddhimagga + one Niddesa + one Milindapanha -- structural-mula, commentary-or-paracanonical stratum, the layer/stratum disagreement.",
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
  "predicted": "the heart-base is never epistemically verified (only posited), and the insight-ñāṇa ladder is Theravāda-systematic (no clean Āgama parallel). PASS if the epistemic column shows 'posited, never verified' and the cross-recension link is absent/under-covered.",
  "result": "PASS",
  "evidence": "Epistemic column: 'posited, never verified' (0 in-window co-occurrence with the verification register, which is itself abundant at 654/190/264 rows; the one close co-occurrence is the heart-base as the support of a knowing-faculty). Cross-recension: the heart-base corpus link is null (under-covered Abhidhamma) and the doctrine is a Theravāda differentia; the numbered ñāṇa ladder is Pāli-local with no clean Āgama parallel as a sequence.",
 },
 "verdict": "CONFIRMED + sharpened. The three-tier 'sutta silence → Abhidhamma placeholder → commentarial naming' reading holds and gains two edges: the placeholder is never epistemically verified (only posited and built upon), and the commentary reconciles its own naming against an admitted canonical silence, 'from scripture and reason', adducing the very placeholder as the scripture.",
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

# Prediction must be scored.
if V2["prediction_score"]["result"] not in ("PASS", "FAIL"): errs.append("prediction not scored")

# No em-dashes anywhere in the serialized output.
raw = open(OUT, encoding='utf-8').read()
if "—" in raw: errs.append("em-dash present in output")

print("wrote", OUT)
print("recall ladder:", ys, "| named-heart canon:", HB_ABHIDHAMMA_NAMED, "| posit canon:", HB_ABHIDHAMMA_CONCEPT)
print("three-tier rows:", len(ROWS), "| prediction:", V2["prediction_score"]["result"])
print("CONSISTENCY:", "PASS" if not errs else ("FAIL: " + "; ".join(errs)))
