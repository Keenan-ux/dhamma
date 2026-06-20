#!/usr/bin/env python
"""Full cross-layer aggregation: resolve every candidate row to a final referent
(deterministic auto OR agent coding OR refined-commentary auto), build the
referent x layer ledger, and collect all serpent + serpent-claim-bearing
instances into the census candidate set.
"""
import json, glob, re
from collections import Counter, defaultdict

base = "research/naga/data"
prepass = json.load(open(f"{base}/prepass.json", encoding="utf-8"))

# Verified spine rows (hand-read; SPINE-FINDINGS.md). Force these to serpent so a
# coder mis-call cannot drop a load-bearing row, and so the ledger reconciles
# with the census exactly (no append/double-count downstream).
SPINE_FORCE = {"sn29.1","sn29.2","sn29.3","sn29.7","sn29.11-20","sn29.21-50","pli-tv-kd1","ud2.1","dn20","dn32",
               "cst-vin02a2.att-36_p002","cst-vin02a2.att-36_p003","cst-vin02a2.att-36_p004",
               "cst-s0303a.att-sn3_8_p002","cst-s0303a.att-sn3_8_p004","cst-s0201a.att-mn1_2_p136"}

# merge all agent codings (canon chunks + commentary chunks)
agent = {}
for f in glob.glob(f"{base}/coded_chunk_*.json") + glob.glob(f"{base}/coded_commchunk_*.json"):
    for o in json.load(open(f, encoding="utf-8")):
        agent[o["id"]] = o

# refined commentary auto-rule (same as the residual-emit step) for rows not sent to agents
def refined(tokens):
    kinds = set()
    for t in tokens:
        if re.search(r"nāgasen|nāgit|nāgasamāl|nāgadatt|nāgamitt|nāgamundi", t): kinds.add("person")
        elif re.search(r"nāgarāj|nāgind|nāgayoni|nāgakaññ|nāgakumār|nāgamāṇav|nāgabhavan|nāgalok|nāgapotak|nāgapotik|nāgāvās|campeyyanāg|nāgarukkhamūl|nāgasupaṇṇ", t): kinds.add("serpent")
        elif re.search(r"nāgar", t): kinds.add("citizen")
        elif re.search(r"punnāg|nāgalat|nāgarukkh|nāgapupph|nāgavall|nāgakesar|nāgamāl", t): kinds.add("tree")
        elif re.search(r"hatthināg|nāgavanik|nāganās|gajanāg", t): kinds.add("elephant")
        elif re.search(r"venāg|nāghāt|nāgant", t): kinds.add("nonlexical")
        else: kinds.add("amb")
    nonamb = kinds - {"amb"}
    if kinds == {"amb"}: return None
    if len(nonamb) == 1 and "amb" not in kinds: return list(nonamb)[0]
    return None

ledger = defaultdict(Counter)            # layer -> referent -> n
serpents = []                            # all serpent rows
unresolved = 0
for r in prepass:
    rid, layer = r["id"], r["layer"]
    ref = None; cb = False; facet = None; claim = None
    if not r["needs_agent"]:
        ref = r["prov_referent"]
    elif rid in agent:
        a = agent[rid]; ref = a["referent"]; cb = bool(a.get("claim_bearing"))
        facet = a.get("facet"); claim = a.get("claim")
    else:
        ref = refined(r["tokens"]) or "ambiguous"
        if ref == "serpent":
            cb = False  # auto-serpent, facet TBD
    if ref is None:
        unresolved += 1; ref = "ambiguous"
    if rid in SPINE_FORCE:
        ref = "serpent"  # verified; override any coder mis-call
    ledger[layer][ref] += 1
    if ref == "serpent":
        serpents.append({"id": rid, "citation": r["citation"], "title": r["title"],
                         "layer": layer, "claim_bearing": cb, "facet": facet, "claim": claim,
                         "tokens": r["tokens"]})

# --- ledger table ---
cats = ["serpent","elephant","epithet","tree","person","citizen","nonlexical","ambiguous"]
print("referent\t" + "\t".join(["mula","attha","tika","anya","TOTAL"]))
tot = Counter()
for c in cats:
    row = [ledger[L].get(c,0) for L in ("mula","attha","tika","anya")]
    print(f"{c}\t" + "\t".join(map(str,row)) + f"\t{sum(row)}")
    tot[c] = sum(row)
gt = sum(sum(ledger[L].values()) for L in ledger)
print(f"TOTAL rows\t" + "\t".join(str(sum(ledger[L].values())) for L in ('mula','attha','tika','anya')) + f"\t{gt}")

serp_total = tot["serpent"]
claim = [s for s in serpents if s["claim_bearing"]]
auto_serp = [s for s in serpents if s["claim_bearing"] is False and s["facet"] is None]
print(f"\nSERPENT rows total: {serp_total}  (mula {ledger['mula']['serpent']} · attha {ledger['attha']['serpent']} · tika {ledger['tika']['serpent']} · anya {ledger['anya']['serpent']})")
print(f"serpent claim_bearing (agent-coded): {len(claim)}")
print(f"serpent auto/strong (facet TBD): {len(auto_serp)}")

# facet distribution among claim-bearing
fc = Counter(s["facet"] for s in claim)
print("\nfacet distribution (claim-bearing serpents):")
for f,n in fc.most_common(): print(f"  {f}\t{n}")

json.dump(serpents, open(f"{base}/serpents_all.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(claim, open(f"{base}/serpent_claims.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\nwrote serpents_all.json ({len(serpents)}), serpent_claims.json ({len(claim)})")
print(f"unresolved (defaulted ambiguous): {unresolved}")
