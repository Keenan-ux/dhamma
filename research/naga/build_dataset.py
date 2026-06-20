#!/usr/bin/env python
"""Assemble public/research/naga.json from the coded census.

Merges referent codings (serpents_all) + facet codings (coded_facet_*) + windows
(prepass) into one record per serpent-being instance, computes the cross-tab
aggregates, and embeds the curated H0/H1 divergence cells + the disambiguation
ledger. Every `id` came from a live DB row, so every citation resolves.
"""
import json, glob, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from collections import Counter, defaultdict

base = "research/naga/data"
serps = json.load(open(f"{base}/serpents_all.json", encoding="utf-8"))
prepass = {r["id"]: r for r in json.load(open(f"{base}/prepass.json", encoding="utf-8"))}

# spine = the hand-verified load-bearing rows (verbatim-read; see SPINE-FINDINGS.md)
SPINE = {"sn29.1","sn29.2","sn29.3","sn29.7","sn29.11-20","sn29.21-50","pli-tv-kd1","ud2.1",
         "cst-vin02a2.att-36_p002","cst-vin02a2.att-36_p003","cst-vin02a2.att-36_p004",
         "cst-s0303a.att-sn3_8_p002","cst-s0303a.att-sn3_8_p004","cst-s0201a.att-mn1_2_p136"}

# merge facet codings (the 892 strong-serpent) onto the serpent rows
facet = {}
for f in glob.glob(f"{base}/coded_facet_*.json"):
    for o in json.load(open(f, encoding="utf-8")):
        facet[o["id"]] = o
for s in serps:
    if s["facet"] is None and not s["claim_bearing"] and s["id"] in facet:
        a = facet[s["id"]]
        s["claim_bearing"] = bool(a.get("claim_bearing"))
        s["facet"] = a.get("facet"); s["claim"] = a.get("claim")

A_FACETS = {"birth_mode","classification","realm_habitat","lifespan","power","karma_cause","diet_predation"}
B_FACETS = {"uposatha","hears_dhamma","takes_human_form","magga_phala_ceiling","ordination_bar","bodhisatta_as_naga"}
NARR = re.compile(r"^(ja|ap|cp|bv|thag|thig|vv|pv|tha-ap|thi-ap)\d|^cst-s05(1[0-9]|2[0-9])")  # verse/story mula

def seg(fc): return "A_ontology" if fc in A_FACETS else ("B_soteriology" if fc in B_FACETS else None)
def voice(layer, rid, cit):
    if layer != "mula": return "commentary"
    return "narrator" if NARR.search(rid or "") or NARR.search((cit or "").lower().replace(" ","")) else "buddha"
def sc_id(rid): return None if rid.startswith("cst-") else rid

# ---------------------------------------------------------------------------
# Provenance-signature: chronological STRATUM, coded from each row's work +
# within-work position, INDEPENDENTLY of the mula/attha/tika structural layer
# (PROVENANCE-SIGNATURE.md I.1), exactly as research/awakening/build_dataset.py
# and research/uttarakuru/build_dataset.py do. A mula row whose stratum is not
# early-canonical is the analytically interesting layer/stratum disagree case
# (the Visuddhimagga rows shelved as mula, the late-canonical KN/Jataka/Apadana/
# Vinaya rows, the Abhidhamma rows). Commentary rows take the layer as a coarse
# stratum proxy, flagged as such; the independence is load-bearing within mula.
# ---------------------------------------------------------------------------
EARLY = ("early-canonical", "archaic-canonical")

# DN suttas that are recognised late-canonical compositions (protective chant,
# assembly text, marks-text), refined OUT of the early-canonical Digha floor by
# position/title; this is the within-work refinement the framework asks for.
LATE_DN_SC = {"dn20", "dn30", "dn32"}
LATE_DN_TITLE = ("mahāsamaya", "lakkhaṇa", "āṭānāṭiya")

# CST Khuddaka-Nikaya volume code (first five chars, e.g. s0510) -> work
KN_VOL = {
 "s0501": "khuddakapatha", "s0502": "dhammapada", "s0503": "udana",
 "s0504": "itivuttaka", "s0505": "suttanipata", "s0506": "vimanavatthu",
 "s0507": "petavatthu", "s0508": "thera-therigatha", "s0509": "thera-therigatha",
 "s0510": "apadana", "s0511": "buddhavamsa", "s0512": "cariyapitaka",
 "s0513": "jataka", "s0514": "jataka", "s0515": "niddesa", "s0516": "niddesa",
 "s0517": "patisambhidamagga", "s0518": "milindapanha", "s0519": "nettippakarana",
 "s0520": "petakopadesa",
}

def _cst_vol(i):
    m = re.match(r"cst-([a-z]+\d{2,4}[a-z]?\d?)", i)
    return m.group(1) if m else None

def work_of(rid, sc, title):
    """Identify the work a MULA row belongs to, from its sc-id (or, for the
    CST-id rows that carry no sc cross-walk, its CST volume code + title).
    Returns a short work key that WORK_STRATUM maps to a chronological stratum."""
    t = (title or "").lower()
    if sc:
        if re.match(r"^an\d", sc): return "nikaya-an"
        if re.match(r"^mn\d", sc): return "nikaya-mn"
        if re.match(r"^sn\d", sc): return "nikaya-sn"
        if re.match(r"^dn\d", sc): return "dn-late" if sc in LATE_DN_SC else "nikaya-dn"
        if sc.startswith("ud"): return "udana"
        if sc.startswith("iti"): return "itivuttaka"
        if sc.startswith("snp"): return "suttanipata"
        if sc.startswith("dhp"): return "dhammapada"
        if sc.startswith("kp"): return "khuddakapatha"
        if sc.startswith("ja"): return "jataka"
        if sc.startswith("bv"): return "buddhavamsa"
        if sc.startswith("cp"): return "cariyapitaka"
        if sc.startswith("mnd") or sc.startswith("cnd"): return "niddesa"
        if sc.startswith("ps"): return "patisambhidamagga"
        if sc.startswith("tha-ap") or sc.startswith("thi-ap"): return "apadana"
        if sc.startswith("thig") or sc.startswith("thag") or sc.startswith("thi") or sc.startswith("tha"): return "thera-therigatha"
        if sc.startswith("kv"): return "kathavatthu"
        if sc.startswith("pe"): return "petakopadesa"
        if sc.startswith("netti"): return "nettippakarana"
        if sc.startswith("mil"): return "milindapanha"
        if sc.startswith("pli-tv"): return "vinaya"
        return "indeterminate"
    vol = _cst_vol(rid)
    if not vol: return "indeterminate"
    if vol.startswith("abh"): return "abhidhamma"
    if vol.startswith("e01"): return "visuddhimagga"   # Vism volumes, tagged mula in this corpus
    if vol.startswith("e"): return "paracanonical-e"   # other extra-canonical e-series
    if vol.startswith("vin"): return "vinaya"
    if vol.startswith("s01"): return "dn-late" if any(x in t for x in LATE_DN_TITLE) else "nikaya-dn"
    if vol.startswith("s02"): return "nikaya-mn"
    if vol.startswith("s03"): return "nikaya-sn"
    if vol.startswith("s04"): return "nikaya-an"
    if vol.startswith("s05"): return KN_VOL.get(vol[:5], "kn-late")
    return "indeterminate"

# work -> (chronological stratum, confidence, philological warrant)
WORK_STRATUM = {
 "nikaya-sn":         ("early-canonical", "secure", "Saṃyutta Nikāya sutta prose, the early-canonical floor"),
 "nikaya-mn":         ("early-canonical", "secure", "Majjhima Nikāya sutta prose, the early-canonical floor"),
 "nikaya-an":         ("early-canonical", "secure", "Aṅguttara Nikāya sutta prose, the early-canonical floor"),
 "nikaya-dn":         ("early-canonical", "secure", "Dīgha Nikāya sutta prose, the early-canonical floor"),
 "dn-late":           ("late-canonical", "contested", "A recognised late composition shelved in the Dīgha (the Āṭānāṭiya protective chant, the Mahāsamaya assembly, the Lakkhaṇa marks-text); a register/position label, not a secured date"),
 "udana":             ("early-canonical", "secure", "Udāna, an older mixed prose-and-verse KN collection"),
 "itivuttaka":        ("early-canonical", "secure", "Itivuttaka, an older mixed KN collection"),
 "suttanipata":       ("archaic-canonical", "contested", "Suttanipāta verse, among the most archaic canonical strata; coded register-relative"),
 "dhammapada":        ("archaic-canonical", "contested", "Dhammapada, an early anthology of archaic gāthā; coded register-relative"),
 "thera-therigatha":  ("archaic-canonical", "contested", "Thera-/Therīgāthā gāthā: the verses carry archaic material but sit in a redactor-compiled collection; coded register-relative, not a secured date"),
 "khuddakapatha":     ("late-canonical", "secure", "Khuddakapāṭha, a late-canonical KN compilation"),
 "jataka":            ("late-canonical", "secure", "Jātaka canonical gāthā, shelved in a late-canonical KN collection (the prose stories themselves are commentarial)"),
 "buddhavamsa":       ("late-canonical", "secure", "Buddhavaṃsa, a late-canonical KN stratum (the lineage of past Buddhas)"),
 "cariyapitaka":      ("late-canonical", "secure", "Cariyāpiṭaka, a late-canonical KN stratum"),
 "niddesa":           ("late-canonical", "secure", "Mahā-/Cūḷa-niddesa, a canonical exegesis of the Suttanipāta, late-canonical"),
 "apadana":           ("late-canonical", "secure", "Apadāna, a recognised late-canonical KN stratum (autobiographical merit-and-rebirth verse)"),
 "patisambhidamagga": ("late-canonical", "secure", "Paṭisambhidāmagga, a late-canonical analytical KN treatise"),
 "kn-late":           ("late-canonical", "secure", "Khuddaka Nikāya, late-canonical by default"),
 "kathavatthu":       ("abhidhamma-canonical", "secure", "Kathāvatthu, a book of the Abhidhamma Piṭaka, the latest canonical stratum"),
 "abhidhamma":        ("abhidhamma-canonical", "secure", "Abhidhamma Piṭaka mula, the latest canonical stratum"),
 "petakopadesa":      ("paracanonical", "secure", "Peṭakopadesa, paracanonical (outside the Tipiṭaka proper)"),
 "nettippakarana":    ("paracanonical", "secure", "Nettippakaraṇa, paracanonical"),
 "milindapanha":      ("paracanonical", "secure", "Milindapañha, paracanonical"),
 "paracanonical-e":   ("paracanonical", "secure", "Extra-canonical CST work outside the Tipiṭaka and the classical aṭṭhakathā"),
 "vinaya":            ("late-canonical", "contested", "Vinaya frame-narrative / Khandhaka / Suttavibhaṅga origin-story position; late by occasioning-story position, a genre label rather than a secured date"),
 "visuddhimagga":     ("classical-commentary", "secure", "Visuddhimagga (Buddhaghosa), structurally tagged mula in this corpus but classical-commentary on stratum: layer and stratum disagree"),
 "indeterminate":     ("indeterminate", "none", "unresolved"),
}

# commentary layers take the structural layer as a coarse stratum proxy
LAYER_COARSE = {
 "attha": ("classical-commentary", "secure", "Aṭṭhakathā (classical commentary); stratum follows layer"),
 "tika":  ("sub-commentary", "secure", "Ṭīkā (sub-commentary); stratum follows layer"),
 "anya":  ("paracanonical", "secure", "Extra-canonical CST work outside the Tipiṭaka and the classical aṭṭhakathā"),
}

def code_stratum(rid, sc, title, layer):
    """Return (work, stratum, confidence, warrant, layer_stratum_disagree)."""
    if layer == "mula":
        w = work_of(rid, sc, title)
        st, conf, warr = WORK_STRATUM[w]
        return w, st, conf, warr, (st not in EARLY)
    st, conf, warr = LAYER_COARSE.get(layer, ("indeterminate", "none", "unresolved"))
    return ("commentary-" + layer), st, conf, warr, False

# --- build records ---
records = []
for s in serps:
    rid = s["id"]; layer = s["layer"]
    w = prepass[rid]
    ev = max(w["windows"], key=len) if w["windows"] else ""
    work, stratum, st_conf, st_warr, st_disagree = code_stratum(rid, sc_id(rid), s["title"], layer)
    records.append({
        "id": rid, "citation": s["citation"], "sc_id": sc_id(rid), "title": s["title"],
        "layer": layer, "voice": voice(layer, rid, s["citation"]),
        "referent": "serpent", "claim_bearing": s["claim_bearing"],
        "segment": seg(s["facet"]), "facet": s["facet"], "claim": s.get("claim"),
        "tokens": s["tokens"], "evidence_pali": ev[:500],
        "has_translation": bool(w.get("has_translation")),
        "verification": "verified" if rid in SPINE else "exists",
        "work": work, "stratum": stratum, "stratum_confidence": st_conf,
        "stratum_warrant": st_warr, "layer_stratum_disagree": st_disagree,
    })

# --- aggregates ---
# facet x layer (claim-bearing only)
fxl = defaultdict(lambda: Counter())
for r in records:
    if r["claim_bearing"] and r["facet"]:
        fxl[r["facet"]][r["layer"]] += 1
facet_x_layer = {f: dict(c) for f, c in fxl.items()}
# segment x layer
sxl = defaultdict(Counter)
for r in records:
    if r["claim_bearing"] and r["segment"]:
        sxl[r["segment"]][r["layer"]] += 1
seg_x_layer = {s: dict(c) for s, c in sxl.items()}
serp_by_layer = Counter(r["layer"] for r in records)
claim_by_layer = Counter(r["layer"] for r in records if r["claim_bearing"])

# stratum aggregates (coded INDEPENDENTLY of layer) — parity copies; the
# published values are recomputed from the FINAL records in build_final.py.
stratum_split = Counter(r["stratum"] for r in records)
mula_stratum = Counter(r["stratum"] for r in records if r["layer"] == "mula")
work_split = Counter(r["work"] for r in records if r["layer"] == "mula")
n_mula = sum(1 for r in records if r["layer"] == "mula")
mula_early = sum(v for k, v in mula_stratum.items() if k in EARLY)
mula_late = n_mula - mula_early
disagree = sum(1 for r in records if r["layer"] == "mula" and r["layer_stratum_disagree"])

out = {"facet_x_layer": facet_x_layer, "segment_x_layer": seg_x_layer,
       "serpent_by_layer": dict(serp_by_layer), "claim_by_layer": dict(claim_by_layer),
       "stratum_split": dict(stratum_split), "mula_stratum": dict(mula_stratum),
       "mula_work_split": dict(work_split),
       "mula_early_vs_late": {"early-canonical": mula_early, "late-or-later": mula_late,
                              "layer_stratum_disagree": disagree},
       "n_serpent": len(records), "n_claim": sum(1 for r in records if r["claim_bearing"]),
       "records": records}
json.dump(out, open(f"{base}/_census_assembled.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"serpent records: {len(records)}; claim-bearing: {out['n_claim']}")
print("serpent by layer:", dict(serp_by_layer))
print("claim by layer:", dict(claim_by_layer))
print("stratum split:", dict(stratum_split))
print("mula stratum:", dict(mula_stratum), "| early:", mula_early, "| late-or-later:", mula_late, "| disagree:", disagree)
print("mula work split:", dict(work_split))
print("\nfacet x layer (claim-bearing):")
for f in sorted(facet_x_layer, key=lambda k: -sum(facet_x_layer[k].values())):
    c = facet_x_layer[f]; print(f"  {f}\tmula {c.get('mula',0)}\tattha {c.get('attha',0)}\ttika {c.get('tika',0)}\tanya {c.get('anya',0)}")

# ---------------------------------------------------------------------------
# Consistency gate.
# ---------------------------------------------------------------------------
errs = []
# 1. every record carries a coded stratum (no indeterminate, no blank)
n_indet = sum(1 for r in records if r.get("stratum") in (None, "", "indeterminate"))
if n_indet: errs.append(f"{n_indet} records with indeterminate/blank stratum")
# 2. every mula row resolved to a real work (no indeterminate)
bad_work = [r["id"] for r in records if r["layer"] == "mula" and r.get("work") == "indeterminate"]
if bad_work: errs.append(f"{len(bad_work)} mula rows with work=indeterminate: {bad_work[:5]}")
# 3. stratum tally sums to the record count; mula split reconciles
if sum(stratum_split.values()) != len(records): errs.append("stratum tally != record count")
if mula_early + mula_late != n_mula: errs.append("mula early+late != mula count")
if disagree != mula_late: errs.append(f"disagree ({disagree}) != mula_late ({mula_late})")
# 4. every stratum is one of the seven named strata (or the commentary proxies)
NAMED = {"archaic-canonical","early-canonical","late-canonical","abhidhamma-canonical",
         "paracanonical","classical-commentary","sub-commentary"}
stray = sorted(set(stratum_split) - NAMED)
if stray: errs.append(f"stratum not in the seven named strata: {stray}")
# 5. no em-dash in the stratum warrants we author
if any("—" in (r.get("stratum_warrant") or "") for r in records): errs.append("em-dash in a stratum warrant")
print("CONSISTENCY:", "PASS" if not errs else ("FAIL: " + "; ".join(errs)))
sys.exit(1 if errs else 0)
