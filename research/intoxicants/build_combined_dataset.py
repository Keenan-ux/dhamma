#!/usr/bin/env python
"""Assemble public/research/intoxicants.json (the served, admin-gated data document for the
combined intoxicants study page). Data-bound: pulls counts from the committed evidence files
(_instrumental_evidence.json = §2a; _census_v2.json = the majja-cluster recall ladder) and
embeds the verified path-distinction census (_verify_path.py output) and the science verdicts
(_psychedelics_evidence.json). No DB. Reproducible from committed artifacts.

Run: python research/intoxicants/build_combined_dataset.py
"""
import os, json

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "public", "research", "intoxicants.json")

ev = json.load(open(os.path.join(HERE, "_instrumental_evidence.json"), encoding="utf-8"))
cen = json.load(open(os.path.join(HERE, "_census_v2.json"), encoding="utf-8"))
Q = {q["label"]: q for q in ev["queries"]}
LOC = {l["id"]: l for l in ev["loci"] if l.get("found")}


def tot(label):
    q = Q.get(label, {})
    return q.get("totals", {})


# ── census rows for the reader (principal warrant loci) ──────────────────────
LOCUS_ROLES = {
    "kp2": "the undertaking-formula (5th item)",
    "sn14.25": "the five-precept list",
    "an5.179": "cittamohanī (confuses the mind)",
    "an8.39": "abstaining as a great gift (mahādāna)",
    "dn31": "the six ādīnava + drink first among the apāyamukha",
    "snp2.14": "ummādana; apuññāyatana; the seed 'madā hi pāpāni karonti'",
    "an3.39": "the three madā (existential intoxication)",
    "an5.81": "madanīye majjati, object = the five kāma",
    "pli-tv-bu-vb-pc51": "the rule: Sāgata nidāna; the majje permutations",
    "cst-vin02m2.mul-vin3_6": "the telapāka medicine ruling (undetectability)",
    "cst-abh03m2.mul-014": "the asappurisa five-vice list",
    "cst-s0305a.att-sn5_12_p079": "the open-list definition (source aṭṭhakathā)",
    "cst-s0105t.nrf-60_p030": "the open-list definition (sub-commentary)",
    "cst-s0105t.nrf-75_p005": "the effect-mark line; loṇasovīraka permitted",
    "cst-s0505a.att-31_p031": "the commentarial architecture: intoxication breaks the other precepts",
    "cst-vin02a1.att-56_p002": "Sp on Pc 51: unsuitable for one of the five higher knowledges",
    "snp2.2": "Āmagandhasutta: taint is conduct, not substance",
    "an10.176": "the soceyya purity scheme (drink absent; the other four present)",
}
loci_rows = []
for pid, role in LOCUS_ROLES.items():
    l = LOC.get(pid)
    if not l:
        continue
    loci_rows.append({
        "id": pid, "citation": l.get("citation"), "title": l.get("title"),
        "work_role": l.get("work_role"), "stratum": l.get("stratum"), "role": role,
    })

doc = {
    "meta": {
        "title": "The Buddha on Intoxicants",
        "subtitle": "An effect-based category, an instrumental precept, and the question of psychedelics.",
        "study_type": "gated, interpretive (descriptive corpus + adversarially-verified science + flagged interpretation)",
        "corpus_passages": 194710,
        "snapshot": "2026-06",
        "prereg": "research/intoxicants/PREREG-instrumental.md (frozen before §2a enumeration; all five predictions PASS)",
        "denominators_Mc": {
            "canon_mula": 25.738, "atthakatha": 30.691, "tika": 28.358, "commentary": 59.049,
            "1early": 13.096, "2late": 3.852, "3abh": 7.577, "4para": 1.213,
        },
        "scope_note": "Descriptive corpus claims are verified verbatim; the application of the effect-test to specific substances is interpretive, weighed against the science, and is not a normative ruling.",
    },

    # §1 — the effect-based category (from the v2 recall ladder)
    "category": {
        "majja_substring": cen["recall_ladder"]["rung4_purge"]["majja"]["substring"],
        "majja_net": cen["recall_ladder"]["rung4_purge"]["majja"]["net"],
        "majja_purged": cen["recall_ladder"]["rung4_purge"]["majja"]["purged"],
        "sura_net": cen["recall_ladder"]["rung4_purge"]["sura"]["net"],
        "meraya_net": cen["recall_ladder"]["rung4_purge"]["meraya"]["net"],
        "cluster_net": cen["recall_ladder"]["cluster_net"]["total"],
        "open_list_rows": cen["recall_ladder"]["rung3"]["open_category_generalisation_rows"],
        "open_list_all_commentarial": True,
    },

    # §3 — the instrumental precept (the §2a core)
    "instrumental": {
        "register_split": {
            "kammapatha_total": 585, "kammapatha_with_drink": 25, "drink_a_member_of_kammapatha": 0,
            "note": "the other four precepts' content is in the dasakammapatha purity scheme; drink is not. drink = apāyamukha/pamādaṭṭhāna (dn31), the others = kammakilesā.",
        },
        "pamadatthana": {
            "total_is_primary": tot("pamadatthana").get("all"),  # filled below from split if present
            "without_drink": next((s for s in ev["splits"] if s["label"] == "pamadatthana-split"), {}).get("totals", {}).get("without_drink"),
            "with_drink": next((s for s in ev["splits"] if s["label"] == "pamadatthana-split"), {}).get("totals", {}).get("with_drink"),
            "note": "a productive idiom (gambling, lodging, kingship), not a drink-word; commentary: 'pamādo ettha tiṭṭhatīti pamādaṭṭhānaṃ'.",
        },
        "capstone": {
            "canonical_seed": "snp2.14", "verse": "madā hi pāpāni karonti",
            "commentary": "cst-s0505a.att-31_p031",
            "gloss": "majjapānameva saṃkilesakarañca bhedakarañca … pāṇātipātādīni sabbākusalāni karonti",
            "narrative_exemplum": "ja512 (Kumbha Jātaka)",
        },
        "gift": {"locus": "an8.39", "frame": "mahādāna: abhayaṁ deti, averaṁ deti, abyābajjhaṁ deti"},
        "self_purification": {"co_occurrence_rows": tot("self-purification-drink").get("all"), "frame_the_precept_as_self_purity": 0},
        "structured_absence": {
            "impurity_vocab_present_rows": tot("impurity-vocab-present").get("all"),
            "stain_vocab_present_rows": tot("stain-vocab-present").get("all"),
            "impurity_of_drink_cooccurrence": tot("impurity-of-drink").get("all"),
            "impurity_of_drink_canon": tot("impurity-of-drink").get("canon"),
            "stain_of_drink_cooccurrence": tot("stain-of-drink").get("all"),
            "predicate_impurity_of_the_drink": 0,
            "contrast_classes": ["snp2.2 Āmagandha (taint=conduct)", "an10.176 soceyya scheme (drink excluded)", "telapāka + majje effect-gating"],
        },
        "predictions": [
            {"id": "P1", "claim": "consequential/instrumental rationale dominant", "verdict": "PASS (strong)"},
            {"id": "P2", "claim": "faculty/wisdom-weakening the operative harm, canonical", "verdict": "PASS"},
            {"id": "P3", "claim": "instrumental mechanism exists; explicit 'guards the four' is commentarial", "verdict": "PASS (both legs)"},
            {"id": "P4", "claim": "other-protection/gift framing, early-canonical", "verdict": "PASS"},
            {"id": "P5", "claim": "no intrinsic impurity (structured absence)", "verdict": "PASS (strong)"},
        ],
    },

    # §4 — the effect-test
    "effect_test": {
        "undetectability_rows": tot("undetectability").get("all"),
        "lonasovira_rows": tot("lonasovira").get("all"),
        "majje_permutation": "offence on majje regardless of perception; no offence for amajja with majja-vaṇṇa/gandha/rasa",
    },

    # §7 — the path-distinction census (verified by _verify_path.py, deduped is_primary, per-stratum)
    "path_distinction": {
        "_source": "research/intoxicants/_verify_path.py (deduped is_primary, per stratum)",
        "vikkhambhana": {"early": 0, "atthakatha": 250, "tika": 363},
        "samuccheda": {"early": 4, "atthakatha": 280, "tika": 283},
        "tadanga": {"early": 3, "atthakatha": 163, "tika": 157},
        "avinipata_early": 70,
        "sambodhiparayana_early": 36,
        "anusaya_samugghata_early": 11,
        "nibbanarammana": {"early": 0, "atthakatha": 90, "tika": 116},
    },

    # §5/§7 — the science (adversarially verified; all four verdicts mixed-contested)
    "science": {
        "_source": "research/intoxicants/_psychedelics_evidence.json (6 gather angles + 4 adversarial verdicts)",
        "verdicts": [
            {"claim": "Ego-dissolution is a constructed/reversible self-model alteration that can yield genuine not-self-congruent insight (Letheby), not direct perception of a mind-independent truth.",
             "verdict": "mixed-contested",
             "note": "Conjuncts (a) reversible self-model alteration and (c) can-yield-insight hold; (b) 'not veridical' is a contested metaphysical thesis, not an empirical finding."},
            {"claim": "Psychedelics sharpen rather than cloud the faculty, so the alcohol/majja faculty-degradation analogy fails.",
             "verdict": "mixed-contested",
             "note": "No global clouding at low dose (alcohol analogy fails there); but the robust blinded effect is reduced cognitive control (Pinhas 2026, N=1614), and high dose impairs processing speed (g≈1.13). 'Sharpening' does not survive blinding."},
            {"claim": "Psychedelics produce durable trait-level change (raised openness), challenging the reversible-state model.",
             "verdict": "mixed-contested",
             "note": "The trait-openness claim fails controlled designs (escitalopram comparator). Neuroplastic (~weeks) and clinical (~months) durability survive, but neither is samuccheda fetter-cutting; the acute intoxication reverses within hours."},
            {"claim": "Classic psychedelics are radically less harmful than alcohol on dependence, violence, and the precept's consequential harms.",
             "verdict": "mixed-contested",
             "note": "ACCEPT for dependence + disinhibition-violence (no withdrawal, no compulsion, no causal aggression; Nutt 2010): the cascade behind 'breaks the other precepts' does not transfer. TRIM 'harmless': COMPASS suicidality SAEs (dose-graded), acute panic, HPPD. 'Less harmful', not 'safe'."},
        ],
        "anthropology": "Ritual entheogen use across five continents is structured against heedlessness, the opposite of pamāda.",
        "stoned_ape": "Unsupported; treated as pseudoscience. Included only as the fringe line.",
    },

    "loci": loci_rows,
}

# fill pamadatthana total (with+without)
pd = doc["instrumental"]["pamadatthana"]
if pd.get("with_drink") is not None and pd.get("without_drink") is not None:
    pd["total_is_primary"] = pd["with_drink"] + pd["without_drink"]

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(doc, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"[built] {OUT}")
print(f"  category.cluster_net={doc['category']['cluster_net']} majja_net={doc['category']['majja_net']}")
print(f"  instrumental.pamadatthana with={pd['with_drink']} without={pd['without_drink']}")
print(f"  structured_absence impurity_of_drink_canon={doc['instrumental']['structured_absence']['impurity_of_drink_canon']} predicate_of_drink=0")
print(f"  loci rows={len(loci_rows)}")
