#!/usr/bin/env python3
"""Location-recall probe scorer, parameterized by arm.
Usage: score_locprobe_arm.py <bundle.json> <locprobe_ann.json> <with_content_recall> <label>"""
import json, random, sys
random.seed(20260607)
bundle=json.load(open(sys.argv[1],encoding="utf-8"))
ann=json.load(open(sys.argv[2],encoding="utf-8"))
WITH=float(sys.argv[3]); label=sys.argv[4]
annby={a["id"]:a for a in ann["results"]}

tot=totk=0; ch=0; per=[]
exact=0
for sid,b in bundle.items():
    if sid not in annby: continue
    S=list(b["segments"].keys()); C=set(b["comment_segs"]); K=len(C)
    if K==0: continue
    ovs=[]
    for p in annby[sid].get("preds") or []:
        if not p: continue
        pred=set(x for x in (p.get("predicted_segments") or []) if x in S)
        ovs.append(len(pred & C))
        if pred==C: exact+=1
    ov=sum(ovs)/len(ovs) if ovs else 0
    tot+=ov; totk+=K
    cov=sum(len(set(random.sample(S,min(K,len(S))))&C) for _ in range(200))/200
    ch+=cov
    per.append({"id":sid,"K":K,"loc":round(ov,1),"chance":round(cov,1)})

lr=tot/totk; cr=ch/totk
print(f"=== LOCATION-RECALL PROBE — {label} ===")
print(f"  location-only recall: {lr:.3f}   chance: {cr:.3f}   with-content: {WITH:.3f}")
print(f"  content advantage: {WITH-lr:+.3f}   exact-set reproductions: {exact}")
print(f"  -> {'CONTENT NEEDED (location memory weak/absent)' if WITH-lr>=0.15 else 'location prior explains result (content adds <0.15) — CONTAMINATED'}")
for x in per: print(f"    {x['id']:24s} K={x['K']:2d} loc={x['loc']:5.1f} chance={x['chance']:4.1f}")
json.dump({"label":label,"location_only_recall":round(lr,3),"chance":round(cr,3),
           "with_content":WITH,"content_advantage":round(WITH-lr,3),"exact_sets":exact,"per":per},
          open(f"research/out/locprobe_{label}.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print(f"wrote research/out/locprobe_{label}.json")
