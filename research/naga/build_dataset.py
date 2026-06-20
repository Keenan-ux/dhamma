#!/usr/bin/env python
"""Assemble public/research/naga.json from the coded census.

Merges referent codings (serpents_all) + facet codings (coded_facet_*) + windows
(prepass) into one record per serpent-being instance, computes the cross-tab
aggregates, and embeds the curated H0/H1 divergence cells + the disambiguation
ledger. Every `id` came from a live DB row, so every citation resolves.
"""
import json, glob, re
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

# --- build records ---
records = []
for s in serps:
    rid = s["id"]; layer = s["layer"]
    w = prepass[rid]
    ev = max(w["windows"], key=len) if w["windows"] else ""
    records.append({
        "id": rid, "citation": s["citation"], "sc_id": sc_id(rid), "title": s["title"],
        "layer": layer, "voice": voice(layer, rid, s["citation"]),
        "referent": "serpent", "claim_bearing": s["claim_bearing"],
        "segment": seg(s["facet"]), "facet": s["facet"], "claim": s.get("claim"),
        "tokens": s["tokens"], "evidence_pali": ev[:500],
        "has_translation": bool(w.get("has_translation")),
        "verification": "verified" if rid in SPINE else "exists",
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

out = {"facet_x_layer": facet_x_layer, "segment_x_layer": seg_x_layer,
       "serpent_by_layer": dict(serp_by_layer), "claim_by_layer": dict(claim_by_layer),
       "n_serpent": len(records), "n_claim": sum(1 for r in records if r["claim_bearing"]),
       "records": records}
json.dump(out, open(f"{base}/_census_assembled.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"serpent records: {len(records)}; claim-bearing: {out['n_claim']}")
print("serpent by layer:", dict(serp_by_layer))
print("claim by layer:", dict(claim_by_layer))
print("\nfacet x layer (claim-bearing):")
for f in sorted(facet_x_layer, key=lambda k: -sum(facet_x_layer[k].values())):
    c = facet_x_layer[f]; print(f"  {f}\tmula {c.get('mula',0)}\tattha {c.get('attha',0)}\ttika {c.get('tika',0)}\tanya {c.get('anya',0)}")
