#!/usr/bin/env python3
"""Committee-response diagnostics (all DB-free, from existing artifacts).
Addresses the viva's must-fixes: selection bias, strict-vs-fuzzy matching,
gold vote-split + strict-gold recall, Wilson CIs, circularity estimate."""
import json, re, unicodedata, collections, math

PALI_RE = re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI_RE.findall(s or "")]
def fuzzy(a,b):
    if a==b: return True
    if len(a)>=4 and len(b)>=4 and (a in b or b in a): return True
    if len(a)>=5 and len(b)>=5 and a[:5]==b[:5]: return True
    return False
def strict(a,b): return a==b

def wilson(k,n,z=1.96):
    if n==0: return (None,None)
    p=k/n; d=1+z*z/n
    c=(p+z*z/(2*n))/d
    h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return (round(c-h,3), round(c+h,3))

ann=json.load(open("research/out/annotations.json",encoding="utf-8"))
det={r["id"]:r for r in json.load(open("research/out/detector_results.json",encoding="utf-8"))["results"]}
bundle=json.load(open("research/data/passage_text.json",encoding="utf-8"))

scored=[a for a in ann["results"] if a["id"] in det and not det[a["id"]].get("error")]
deferred=[a for a in ann["results"] if a["id"] not in det]

# --- A. selection bias: token-length scored vs deferred ---
def tl(pid): return bundle.get(pid,{}).get("n_pali_tokens",0)
sl=[tl(a["id"]) for a in scored]; dl=[tl(a["id"]) for a in deferred]
def med(x): x=sorted(x); n=len(x); return None if not n else (x[n//2] if n%2 else (x[n//2-1]+x[n//2])/2)
trunc=sum(1 for a in scored if det[a["id"]].get("truncated"))
print("=== A. SELECTION BIAS (token length) ===")
print(f"  scored   (n={len(sl)}): mean={sum(sl)/len(sl):.0f} median={med(sl)} range={min(sl)}-{max(sl)}")
print(f"  deferred (n={len(dl)}): mean={sum(dl)/len(dl):.0f} median={med(dl)} range={min(dl)}-{max(dl)}")
print(f"  truncated(>600 tok) among scored: {trunc}/{len(sl)}")

# --- build gold clusters with vote split ---
def gold_for(a):
    marks=[]
    for ri,rv in enumerate(a.get("annotators") or []):
        if not rv: continue
        for cp in rv.get("choice_points",[]):
            t=set(toks(cp.get("pali","")))
            if t: marks.append((ri,t,cp.get("type","?"),cp.get("rationale",""),cp.get("evidence","")))
    cl=[]
    for ri,t,ty,why,ev in marks:
        for c in cl:
            if c["tok"]&t: c["rev"].add(ri); c["tok"]|=t; c["ty"][ty]+=1; c["why"].append(why); c["ev"].append(ev); break
        else: cl.append({"rev":{ri},"tok":set(t),"ty":collections.Counter({ty:1}),"why":[why],"ev":[ev]})
    return [c for c in cl if len(c["rev"])>=2]

# --- B/C/D/E over scored passages ---
gold_total=caught_fuzzy=caught_strict=0
gold_unanimous=caught_unanimous=0
split=collections.Counter()
circ_cites=0
for a in scored:
    pid=a["id"]; fires=[norm(f["token"]) for f in det[pid].get("fires",[])]
    for g in gold_for(a):
        gold_total+=1
        nrev=len(g["rev"]); split["3-0" if nrev>=3 else "2-1"]+=1
        cf=any(fuzzy(ft,gt) for ft in fires for gt in g["tok"])
        cs=any(strict(ft,gt) for ft in fires for gt in g["tok"])
        caught_fuzzy+=cf; caught_strict+=cs
        if nrev>=3:
            gold_unanimous+=1; caught_unanimous+=cf
        # circularity: does any rationale/evidence cite dictionary/sense?
        blob=" ".join(g["why"]+g["ev"]).lower()
        if any(k in blob for k in ("dpd","dictionary","sense","ped","cped")): circ_cites+=1

print("\n=== B. STRICT vs FUZZY matching (overall recall) ===")
print(f"  fuzzy : {caught_fuzzy}/{gold_total} = {caught_fuzzy/gold_total:.3f}  CI95={wilson(caught_fuzzy,gold_total)}")
print(f"  strict: {caught_strict}/{gold_total} = {caught_strict/gold_total:.3f}  CI95={wilson(caught_strict,gold_total)}")
print(f"  (2/3 bar = 0.667; headline margin = {caught_fuzzy/gold_total-0.667:+.3f})")

print("\n=== C. GOLD VOTE-SPLIT + strict-gold recall ===")
print(f"  consensus gold: {dict(split)} (3-0 unanimous vs 2-1 majority)")
print(f"  recall on UNANIMOUS (3-0) gold only: {caught_unanimous}/{gold_unanimous} = "
      f"{caught_unanimous/gold_unanimous:.3f}" if gold_unanimous else "  n/a")

print("\n=== E. CIRCULARITY estimate ===")
print(f"  gold whose rationale/evidence cites a dictionary feature: {circ_cites}/{gold_total} = {circ_cites/gold_total:.3f}")
print("  (high = gold built on the same DPD polysemy the detector consumes)")

out={"selection_bias":{"scored_mean":sum(sl)/len(sl),"scored_median":med(sl),
      "deferred_mean":sum(dl)/len(dl),"deferred_median":med(dl),"truncated":trunc},
     "matching":{"fuzzy":[caught_fuzzy,gold_total,wilson(caught_fuzzy,gold_total)],
                 "strict":[caught_strict,gold_total,wilson(caught_strict,gold_total)]},
     "vote_split":dict(split),
     "unanimous_recall":[caught_unanimous,gold_unanimous],
     "circularity":[circ_cites,gold_total]}
json.dump(out,open("research/out/diagnostics.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("\nwrote research/out/diagnostics.json")
