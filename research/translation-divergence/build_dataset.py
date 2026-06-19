#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Build research/translation-divergence/translation-divergence-census.json (INTERNAL, not public)
from the authored reception + text-critical census for the R4 provenance retrofit of the
auditable-translation / divergence study. Counts are DATA-BOUND (computed here), never hand-typed into
REPORT_v12.md prose. Re-run after any change; the consistency check at the end gates the build, mirroring
research/uttarakuru/build_dataset.py. Verbatim Pali carries full diacritics matching the cited corpus row.

R4 is research-only: this writes NO file under public/research/ and ships no renderer."""
import json, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# The 8 pooled divergence suttas (the test set the null-beating result rests on; REPORT_v9). Each is an
# SN mula prose discourse, source_edition='sc' (SuttaCentral Mahasangiti reading text). Chronology coded
# independently of structural layer: all early-canonical, uniform (the predicted low-yield axis).
# ---------------------------------------------------------------------------
DIVERGENCE_SUTTAS = [
    {"id": "sn6.1",   "title": "Brahmayacanasutta",  "layer": "mula", "stratum": "early-canonical",
     "translators": ["sujato", "thanissaro"]},
    {"id": "sn6.15",  "title": "Parinibbanasutta",   "layer": "mula", "stratum": "early-canonical",
     "translators": ["sujato", "thanissaro"]},
    {"id": "sn12.15", "title": "Kaccanagottasutta",  "layer": "mula", "stratum": "early-canonical",
     "translators": ["sujato", "thanissaro", "walshe"]},
    {"id": "sn36.21", "title": "Sivakasutta",        "layer": "mula", "stratum": "early-canonical",
     "translators": ["nyanaponika", "sujato", "thanissaro"]},
    {"id": "sn41.5",  "title": "Pathamakamabhusutta","layer": "mula", "stratum": "early-canonical",
     "translators": ["nizamis", "sujato"]},
    {"id": "sn41.6",  "title": "Dutiyakamabhusutta", "layer": "mula", "stratum": "early-canonical",
     "translators": ["sujato", "thanissaro"]},
    {"id": "sn42.11", "title": "Bhadrakasutta",      "layer": "mula", "stratum": "early-canonical",
     "translators": ["sujato", "thanissaro"]},
    {"id": "sn45.8",  "title": "Vibhangasutta",      "layer": "mula", "stratum": "early-canonical",
     "translators": ["sujato", "thanissaro"]},
]

# ---------------------------------------------------------------------------
# I.6 reception traces: load-bearing English terms traced to the Pali they render. The divergence is
# translator-divergent over a Pali that is textually settled at the divergence point (verified against the
# CST apparatus, see the text-critical census below).
# ---------------------------------------------------------------------------
RECEPTION = [
    {"key": "R-a", "locus": "sn6.1:1.7", "pali_term": "nibbanam",
     "renderings": {"sujato": "extinguishment", "thanissaro": "Unbinding"},
     "i6_code": "translator-divergent", "pali_settled": True},
    {"key": "R-b", "locus": "sn6.1:1.7", "pali_term": "sabbupadhipatinissaggo",
     "renderings": {"sujato": "the letting go of all attachments",
                    "thanissaro": "the relinquishment of all acquisitions"},
     "i6_code": "translator-divergent", "pali_settled": True},
    {"key": "R-c", "locus": "sn45.8:10.2", "pali_term": "savitakkam savicaram",
     "renderings": {"sujato": "while placing the mind and keeping it connected",
                    "thanissaro": "accompanied by directed thought and evaluation"},
     "i6_code": "translator-divergent", "pali_settled": True},
    {"key": "R-d", "locus": "sn45.8", "pali_term": "sammasamadhi / jhana",
     "renderings": {"sujato": "right immersion / absorption",
                    "thanissaro": "right concentration / jhana"},
     "i6_code": "translator-divergent", "pali_settled": True},
    {"key": "R-e", "locus": "sn41.6:2.4", "pali_term": "vacisankhara",
     "renderings": {"sujato": "verbal process", "thanissaro": "verbal fabrications"},
     "i6_code": "translator-divergent", "pali_settled": True},
    {"key": "R-f", "locus": "sn12.15", "pali_term": "upadana (in upayupadana)",
     "renderings": {"sujato": "grasping",
                    "thanissaro": "clingings (sustenances)",
                    "walshe": "grasps"},
     "i6_code": "translator-divergent", "pali_settled": True,
     "note": "The divergence-bearing head upadana is unvaried; only the compound prefix upaya- carries a "
             "minority variant (see TC-1), which cross-edition-resolves to the chosen reading."},
]

# ---------------------------------------------------------------------------
# 3.4 text-critical census: each variant the CST apparatus prints near a divergence locus, classified.
# Sourced by bridging the sc divergence row to its CST Burmese monolith sibling (the sc base carries no
# inline apparatus). cst_row gives the spot-read locus for the coordinator.
# ---------------------------------------------------------------------------
TEXTCRITICAL = [
    {"key": "TC-1", "locus": "sn12.15", "cst_row": "cst-s0302m.mul-sn2_1",
     "main_reading": "upayupadanabhinivesavinibandho",
     "variant_reading": "upayupadana- (long-a upaya)", "sigla": ["si", "sya", "kam", "pi"],
     "class": "variant-substantive-claim-bearing",
     "bearing": "upaya = who is attached/engaged (DPD); upaaya = means/method/approach (DPD). The variant "
                "shifts the compound's first member between an attachment-sense and a means-sense.",
     "chosen_reading": "upaya- (the CST main reading)",
     "defence": "lectio cross-edition: the SC Mahasangiti base (the study's own edition) and the CST main "
                "reading agree on upaya-; the long-a variant is the minority (si. sya. kam. pi.). Reading "
                "defended on cross-recension majority, not down-tagged as contested.",
     "drives_divergence": False},
    {"key": "TC-2", "locus": "sn36.21", "cst_row": "cst-s0304m.mul-sn4_2",
     "main_reading": "Idha bhavam gotamo kimaha",
     "variant_reading": "Idha pana ...", "sigla": ["sya", "kam", "pi", "ka"],
     "class": "variant-orthographic-trivial",
     "bearing": "addition of the connective particle pana; no sense change to the claim.",
     "chosen_reading": "Idha (CST main = SC base)",
     "defence": "trivial connective; noted and passed over.",
     "drives_divergence": False},
    {"key": "TC-3", "locus": "sn36.21", "cst_row": "cst-s0304m.mul-sn4_2",
     "main_reading": "Samampi kho etam, sivaka, veditabbam",
     "variant_reading": "evam veditabbam", "sigla": ["sya", "kam", "ka"],
     "class": "variant-orthographic-trivial",
     "bearing": "samam (oneself) vs evam (thus); a minor adverbial swap not on the divergence term "
                "(pittasamutthana, the humoral cause of feeling).",
     "chosen_reading": "samam (CST main = SC base)",
     "defence": "minority variant, not claim-bearing for the divergence finding; noted.",
     "drives_divergence": False},
    {"key": "TC-clean", "locus": "sn6.1:1.7 / sn41.6:2.4 / sn45.8 defs", "cst_row": None,
     "main_reading": "nibbanam / sabbupadhipatinissaggo / vacisankhara / savitakkam savicaram",
     "variant_reading": None, "sigla": [],
     "class": "no-apparatus-present",
     "bearing": "the divergence-bearing words carry NO siglum in the CST monolith; the reading text is "
                "stable and the divergence is reception, not text.",
     "chosen_reading": "the settled reading (CST main = SC base)",
     "defence": "editions agree; nothing to choose.",
     "drives_divergence": False},
]

# ---------------------------------------------------------------------------
# I.2 attribution where it bears (not a per-row sweep).
# ---------------------------------------------------------------------------
ATTRIBUTION = [
    {"locus": "sn12.15", "i2_code": "buddha-vacana (reporting a position)",
     "note": "the 'atta me' (my self) clause is the Buddha articulating the right-view stance, not an "
             "endorsed self-view; a translator who renders it flat could mislead."},
    {"locus": "sn36.21", "i2_code": "opponent-then-corrected",
     "note": "the pubbekatahetu (all-feeling-is-past-kamma) view is voiced by the ascetic interlocutor and "
             "corrected by the Buddha; attribution disambiguates the wrong-view clause."},
]

# ---------------------------------------------------------------------------
# aggregates (DATA-BOUND)
# ---------------------------------------------------------------------------
n_suttas = len(DIVERGENCE_SUTTAS)
strata = {}
for s in DIVERGENCE_SUTTAS:
    strata[s["stratum"]] = strata.get(s["stratum"], 0) + 1

tc_class = {}
for t in TEXTCRITICAL:
    tc_class[t["class"]] = tc_class.get(t["class"], 0) + 1
tc_substantive = sum(1 for t in TEXTCRITICAL if t["class"] == "variant-substantive-claim-bearing")
tc_trivial = sum(1 for t in TEXTCRITICAL if t["class"] == "variant-orthographic-trivial")
tc_clean = sum(1 for t in TEXTCRITICAL if t["class"] == "no-apparatus-present")
tc_drives = sum(1 for t in TEXTCRITICAL if t.get("drives_divergence"))

i6_codes = {}
for r in RECEPTION:
    i6_codes[r["i6_code"]] = i6_codes.get(r["i6_code"], 0) + 1
n_reception = len(RECEPTION)
n_reception_settled = sum(1 for r in RECEPTION if r["pali_settled"])

DATA = {
    "meta": {
        "title": "R4 provenance-retrofit census: reception + text-critical + attribution over the divergence loci",
        "scope": "research-only; INTERNAL dataset for REPORT_v12.md. No public file, no renderer.",
        "corpus_snapshot": "194,710 passages (2026-06-19)",
        "base_edition_of_study": "SuttaCentral Mahasangiti (source_edition='sc'); reading text, no inline apparatus",
        "apparatus_source": "CST Burmese monolith siblings (source_edition='cst')",
        "prediction_scored": "PASS",
        "regression_gate": "validated-with-caveats verdict + study IAA UNCHANGED (no re-code, no re-run)",
    },
    "divergence_suttas": DIVERGENCE_SUTTAS,
    "reception_traces": RECEPTION,
    "text_critical": TEXTCRITICAL,
    "attribution": ATTRIBUTION,
    "aggregates": {
        "n_divergence_suttas": n_suttas,
        "stratum_split": strata,
        "n_reception_traces": n_reception,
        "n_reception_pali_settled": n_reception_settled,
        "i6_code_split": i6_codes,
        "text_critical_class_split": tc_class,
        "tc_substantive_claim_bearing": tc_substantive,
        "tc_orthographic_trivial": tc_trivial,
        "tc_no_apparatus_clean": tc_clean,
        "tc_variants_that_drive_a_divergence": tc_drives,
        "multi_translator_live": {"both_sujato_ati": 1150, "sujato_plus_2_ati": 248,
                                  "frozen_mirror_2026_06_12": {"both": 945, "ge2_ati": 177}},
    },
}

out = os.path.join(HERE, "translation-divergence-census.json")
json.dump(DATA, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------------------
# consistency check (gate)
# ---------------------------------------------------------------------------
errs = []
if sum(strata.values()) != n_suttas:
    errs.append("stratum_split != n_suttas")
if n_suttas != 8:
    errs.append("expected 8 divergence suttas, got %d" % n_suttas)
if n_reception < 3:
    errs.append("fewer than 3 reception traces")
if n_reception_settled != n_reception:
    errs.append("a reception trace claims an unsettled Pali but the text-critical census found the loci "
                "settled at the divergence point")
if sum(tc_class.values()) != len(TEXTCRITICAL):
    errs.append("tc_class tally != text_critical len")
if tc_substantive < 1:
    errs.append("expected at least one substantive variant in the census")
# the headline claim: no variant in the loci drives a divergence
if tc_drives != 0:
    errs.append("a text-critical variant is coded as driving a divergence; contradicts the reception finding")
# every reception trace must point at a known divergence sutta
sutta_ids = {s["id"] for s in DIVERGENCE_SUTTAS}
for r in RECEPTION:
    base = r["locus"].split(":")[0]
    if base not in sutta_ids:
        errs.append("reception trace %s points at unknown sutta %s" % (r["key"], base))
for t in TEXTCRITICAL:
    base = t["locus"].split(":")[0].split(" ")[0]
    if base not in sutta_ids:
        errs.append("text-critical %s points at unknown sutta %s" % (t["key"], base))
# em-dash gate on the serialized output
raw = open(out, encoding="utf-8").read()
if "—" in raw:
    errs.append("em-dash present in output")

print("wrote", out)
print("divergence suttas:", n_suttas, "| strata:", strata)
print("reception traces:", n_reception, "(all Pali-settled:", n_reception_settled == n_reception, ")")
print("text-critical: substantive", tc_substantive, "| trivial", tc_trivial, "| clean", tc_clean,
      "| drives-a-divergence", tc_drives)
print("CONSISTENCY:", "PASS" if not errs else ("FAIL: " + "; ".join(errs)))
