#!/usr/bin/env python
"""Aggregate the canon referent gate: merge primary chunk codings, build the
mula referent ledger (auto + agent), extract canon serpent claim-bearing census
candidates, and compute Fleiss kappa on the IAA subsample (coders A/B/C).
"""
import json, glob
from collections import Counter, defaultdict

base = "research/naga/data"

# --- 1. merge primary chunk codings ---
primary = {}
for f in sorted(glob.glob(f"{base}/coded_chunk_*.json")):
    for o in json.load(open(f, encoding="utf-8")):
        primary[o["id"]] = o
print(f"primary canon-ambiguous codings merged: {len(primary)}")

# sanity: every slim id present
slim = json.load(open(f"{base}/code_mula_ambiguous.json", encoding="utf-8"))
missing = [s["id"] for s in slim if s["id"] not in primary]
if missing:
    print(f"!! MISSING codings for {len(missing)} ids: {missing[:8]}")

# --- 2. canon (mula) referent ledger: auto (deterministic) + agent ---
prepass = {r["id"]: r for r in json.load(open(f"{base}/prepass.json", encoding="utf-8"))
           if r["layer"] == "mula"}
ledger = Counter()
serpent_claim = []   # canon census candidates
for rid, r in prepass.items():
    if r["needs_agent"]:
        c = primary.get(rid)
        ref = c["referent"] if c else "UNCODED"
        if c and ref == "serpent" and c.get("claim_bearing"):
            serpent_claim.append({"id": rid, "citation": r["citation"], "title": r["title"],
                                  "facet": c.get("facet"), "claim": c.get("claim"),
                                  "tokens": r["tokens"]})
    else:
        # deterministic auto class; map epithet_or_amb (shouldn't occur in auto) defensively
        ref = r["prov_referent"]
        if ref == "serpent":
            serpent_claim.append({"id": rid, "citation": r["citation"], "title": r["title"],
                                  "facet": None, "claim": "[auto strong-serpent; facet TBD]",
                                  "tokens": r["tokens"], "auto": True})
    ledger[ref] += 1

print("\n=== CANON (mula) referent ledger ===")
for ref, n in ledger.most_common():
    print(f"{ref}\t{n}")
print(f"TOTAL mula rows\t{sum(ledger.values())}")
print(f"\ncanon serpent claim-bearing candidates: {len(serpent_claim)} "
      f"(auto strong-serpent {sum(1 for s in serpent_claim if s.get('auto'))} + "
      f"agent {sum(1 for s in serpent_claim if not s.get('auto'))})")
json.dump(serpent_claim, open(f"{base}/canon_serpent_candidates.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

# --- 3. Fleiss kappa on IAA subsample, referent field, coders A/B/C ---
iaa_ids = [s["id"] for s in json.load(open(f"{base}/code_iaa_sample.json", encoding="utf-8"))]
A = primary  # coder A = primary coding
B = {o["id"]: o for o in json.load(open(f"{base}/coded_iaa_B.json", encoding="utf-8"))}
C = {o["id"]: o for o in json.load(open(f"{base}/coded_iaa_C.json", encoding="utf-8"))}
cats = ["serpent","elephant","epithet","tree","person","citizen","nonlexical","ambiguous"]
n_raters = 3
rows = []
agree_pairs = 0; pair_tot = 0
exact3 = 0
for rid in iaa_ids:
    if rid in A and rid in B and rid in C:
        labels = [A[rid]["referent"], B[rid]["referent"], C[rid]["referent"]]
        rows.append(labels)
        if labels[0]==labels[1]==labels[2]: exact3 += 1
        for x in range(3):
            for y in range(x+1,3):
                pair_tot += 1
                if labels[x]==labels[y]: agree_pairs += 1
N = len(rows)
# Fleiss kappa
P_bar = 0.0
cat_tot = Counter()
for labels in rows:
    cnt = Counter(labels)
    cat_tot.update(cnt)
    Pi = (sum(v*v for v in cnt.values()) - n_raters) / (n_raters*(n_raters-1))
    P_bar += Pi
P_bar /= N
pj = {c: cat_tot[c]/(N*n_raters) for c in cats}
Pe = sum(v*v for v in pj.values())
kappa = (P_bar - Pe)/(1 - Pe) if (1-Pe) else 1.0
print(f"\n=== IAA (referent), coders A/B/C, n={N} ===")
print(f"all-3-agree: {exact3}/{N} = {exact3/N:.1%}")
print(f"pairwise agreement: {agree_pairs}/{pair_tot} = {agree_pairs/pair_tot:.1%}")
print(f"Fleiss kappa = {kappa:.3f}")

# collapse to serpent-vs-not (the load-bearing binary for the census)
def bink(rows):
    P_bar=0.0; ct=Counter()
    for labels in rows:
        b=[("serpent" if l=="serpent" else "other") for l in labels]
        cnt=Counter(b); ct.update(cnt)
        P_bar += (sum(v*v for v in cnt.values())-3)/(3*2)
    P_bar/=len(rows)
    pj={k:ct[k]/(len(rows)*3) for k in ("serpent","other")}
    Pe=sum(v*v for v in pj.values())
    return (P_bar-Pe)/(1-Pe) if (1-Pe) else 1.0
print(f"Fleiss kappa (serpent vs not) = {bink(rows):.3f}")
