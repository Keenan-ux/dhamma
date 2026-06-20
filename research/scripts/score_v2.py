#!/usr/bin/env python3
"""Phase-2 scoring against NON-CIRCULAR (no-DPD) gold.

Measures, per genre and per choice-point type:
  - recall: lexical lane, commentary lane, COMBINED (fuzzy + strict matching)
  - precision per lane
  - MARGINAL RECOVERY: of gold the lexical lane missed, how much the
    commentary lane recovers (the real test of the complementary-detector
    architecture)
  - blind-spot recall (register/domestication/doctrinal) per lane
  - circularity coefficient on the new gold (should drop vs phase-1's 0.97)
  - IAA, vote-split, Wilson 95% CIs
Inputs: research/out/detector_p2.json, research/out/annotations_p2.json
"""
import json, re, unicodedata, collections, math

PALI = re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI.findall(s or "")]
def fuzzy(a,b):
    if a==b: return True
    if len(a)>=4 and len(b)>=4 and (a in b or b in a): return True
    if len(a)>=5 and len(b)>=5 and a[:5]==b[:5]: return True
    return False
def wilson(k,n,z=1.96):
    if not n: return (None,None)
    p=k/n; d=1+z*z/n
    c=(p+z*z/(2*n))/d; h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return (round(c-h,3),round(c+h,3))

det={r["id"]:r for r in json.load(open("research/out/detector_p2.json",encoding="utf-8"))["results"]}
ann=json.load(open("research/out/annotations_p2.json",encoding="utf-8"))

NONLEX={"register","domestication","doctrinal"}
G=collections.defaultdict(lambda: collections.Counter())
iaa=collections.defaultdict(list)
# global tallies
tot=collections.Counter()
circ_cite=0; circ_n=0
split=collections.Counter()

for a in ann["results"]:
    pid=a["id"]; genre=a.get("genre","?")
    if pid not in det or det[pid].get("error"): continue
    lex=[norm(f["token"]) for f in det[pid].get("fires",[])]
    com=[norm(f["token"]) for f in det[pid].get("comm_fires",[])]
    # reviewer marks -> clusters
    rev=[]; marks=[]
    for ri,rv in enumerate(a.get("annotators") or []):
        if not rv: continue
        ts=set()
        for cp in rv.get("choice_points",[]):
            t=set(toks(cp.get("pali","")))
            if t: marks.append((ri,t,cp.get("type","?"),cp.get("rationale",""))); ts|=t
        rev.append(ts)
    # IAA
    if len(rev)>=2:
        f1=[]
        for i in range(len(rev)):
            for j in range(i+1,len(rev)):
                A,B=rev[i],rev[j]
                if not A and not B: f1.append(1.0); continue
                inter=len(A&B); p=inter/len(A) if A else 0; r=inter/len(B) if B else 0
                f1.append(2*p*r/(p+r) if (p+r) else 0.0)
        if f1: iaa[genre].append(sum(f1)/len(f1))
    cl=[]
    for ri,t,ty,why in marks:
        for c in cl:
            if c["tok"]&t: c["rev"].add(ri); c["tok"]|=t; c["ty"][ty]+=1; c["why"].append(why); break
        else: cl.append({"rev":{ri},"tok":set(t),"ty":collections.Counter({ty:1}),"why":[why]})
    gold=[c for c in cl if len(c["rev"])>=2]
    goldtok=set().union(*[c["tok"] for c in gold]) if gold else set()
    for c in gold:
        ty=c["ty"].most_common(1)[0][0]
        split["3-0" if len(c["rev"])>=3 else "2-1"]+=1
        circ_n+=1
        if any(k in " ".join(c["why"]).lower() for k in ("dpd","dictionary"," sense","ped","cped")): circ_cite+=1
        cl_hit=any(fuzzy(ft,gt) for ft in lex for gt in c["tok"])
        co_hit=any(fuzzy(ft,gt) for ft in com for gt in c["tok"])
        cl_s=any(ft==gt for ft in lex for gt in c["tok"])
        comb=cl_hit or co_hit; comb_s=cl_s or any(ft==gt for ft in com for gt in c["tok"])
        g=G[genre]
        g["gold"]+=1
        g["lex"]+=cl_hit; g["com"]+=co_hit; g["comb"]+=comb
        g["lex_strict"]+=cl_s; g["comb_strict"]+=comb_s
        if ty in NONLEX:
            g["bs_gold"]+=1; g["bs_lex"]+=cl_hit; g["bs_comb"]+=comb
        if not cl_hit:               # marginal recovery
            g["lex_missed"]+=1; g["recovered"]+=co_hit
        tot["gold"]+=1; tot["lex"]+=cl_hit; tot["com"]+=co_hit; tot["comb"]+=comb
        tot["lex_strict"]+=cl_s; tot["comb_strict"]+=comb_s
        if ty in NONLEX: tot["bs_gold"]+=1; tot["bs_lex"]+=cl_hit; tot["bs_comb"]+=comb
        if not cl_hit: tot["lex_missed"]+=1; tot["recovered"]+=co_hit
    # precision tally (fires matching any gold)
    for ft in lex: tot["lex_fires"]+=1; tot["lex_fire_hit"]+= any(fuzzy(ft,gt) for gt in goldtok)
    for ft in com: tot["com_fires"]+=1; tot["com_fire_hit"]+= any(fuzzy(ft,gt) for gt in goldtok)

def r(k,n): return round(k/n,3) if n else None
out={"overall":{
    "passages_scored":sum(1 for a in ann["results"] if a["id"] in det),
    "gold":tot["gold"],
    "recall_lexical":r(tot["lex"],tot["gold"]),"recall_lexical_CI":wilson(tot["lex"],tot["gold"]),
    "recall_lexical_strict":r(tot["lex_strict"],tot["gold"]),
    "recall_combined":r(tot["comb"],tot["gold"]),"recall_combined_CI":wilson(tot["comb"],tot["gold"]),
    "recall_combined_strict":r(tot["comb_strict"],tot["gold"]),
    "precision_lexical":r(tot["lex_fire_hit"],tot["lex_fires"]),
    "precision_commentary":r(tot["com_fire_hit"],tot["com_fires"]),
    "blindspot_gold":tot["bs_gold"],
    "blindspot_recall_lexical":r(tot["bs_lex"],tot["bs_gold"]),
    "blindspot_recall_combined":r(tot["bs_comb"],tot["bs_gold"]),
    "marginal_recovery":f"{tot['recovered']}/{tot['lex_missed']}="+str(r(tot['recovered'],tot['lex_missed'])),
    "circularity":r(circ_cite,circ_n),
    "vote_split":dict(split),
}}
out["by_genre"]={}
for genre,g in sorted(G.items()):
    out["by_genre"][genre]={
        "gold":g["gold"],
        "recall_lexical":r(g["lex"],g["gold"]),"recall_combined":r(g["comb"],g["gold"]),
        "blindspot_recall_lex":r(g["bs_lex"],g["bs_gold"]),"blindspot_recall_comb":r(g["bs_comb"],g["bs_gold"]),
        "marginal_recovery":r(g["recovered"],g["lex_missed"]),
        "iaa":round(sum(iaa[genre])/len(iaa[genre]),3) if iaa[genre] else None,
    }
json.dump(out,open("research/out/metrics_p2.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
o=out["overall"]
print("=== PHASE 2 OVERALL (non-circular gold) ===")
print(f"  passages={o['passages_scored']} gold={o['gold']}  circularity={o['circularity']} (was 0.97)")
print(f"  recall lexical  ={o['recall_lexical']} CI{o['recall_lexical_CI']} (strict {o['recall_lexical_strict']})")
print(f"  recall combined ={o['recall_combined']} CI{o['recall_combined_CI']} (strict {o['recall_combined_strict']})")
print(f"  precision lex={o['precision_lexical']} comm={o['precision_commentary']}")
print(f"  blind-spot: lexical {o['blindspot_recall_lexical']} -> combined {o['blindspot_recall_combined']} (gold {o['blindspot_gold']})")
print(f"  marginal recovery by commentary lane: {o['marginal_recovery']}")
print(f"  vote split: {o['vote_split']}")
print("\n=== BY GENRE ===")
print(f"{'genre':12s} {'gold':>4s} {'recLex':>6s} {'recCmb':>6s} {'bsLex':>5s} {'bsCmb':>5s} {'IAA':>5s}")
for gen,s in out["by_genre"].items():
    print(f"{gen:12s} {s['gold']:>4d} {str(s['recall_lexical']):>6s} {str(s['recall_combined']):>6s} {str(s['blindspot_recall_lex']):>5s} {str(s['blindspot_recall_comb']):>5s} {str(s['iaa']):>5s}")
print("\nwrote research/out/metrics_p2.json")
