#!/usr/bin/env python3
"""External validation: does the model's translation-blind, comment-blind
segment choice surface predict where SC translators (sujato/brahmali) placed
comments? Per-sutta permutation null controls for the model's flag-rate and the
~30% comment base rate.
Inputs: research/data/validation_bundle.json, research/out/validation_ann.json"""
import json, collections, random
random.seed(20260607)

bundle=json.load(open("research/data/validation_bundle.json",encoding="utf-8"))
ann=json.load(open("research/out/validation_ann.json",encoding="utf-8"))
annby={a["id"]:a for a in ann["results"]}

per=[]; obs_hit=obs_M=obs_C=0
bytype=collections.Counter(); bytype_hit=collections.Counter()
suttas=[]
for sid,b in bundle.items():
    if sid not in annby: continue
    S=set(b["segments"].keys()); C=set(b["comment_segs"])
    # consensus model-flagged = >=2 of 3 annotators
    cnt=collections.Counter(); typ={}
    for rv in annby[sid].get("annotators") or []:
        if not rv: continue
        for cs in rv.get("choice_segments",[]):
            sg=cs.get("segment_id")
            if sg in S:
                cnt[sg]+=1; typ.setdefault(sg,cs.get("type","?"))
    M={sg for sg,c in cnt.items() if c>=2}
    hit=len(M & C)
    obs_hit+=hit; obs_M+=len(M); obs_C+=len(C)
    for sg in M:
        bytype[typ.get(sg,"?")]+=1
        if sg in C: bytype_hit[typ.get(sg,"?")]+=1
    suttas.append({"sid":sid,"S":list(S),"C":C,"M":M})
    per.append({"id":sid,"segs":len(S),"comments":len(C),"model":len(M),"hit":hit})

recall=obs_hit/obs_C if obs_C else 0      # of expert comments, fraction model flagged
precision=obs_hit/obs_M if obs_M else 0   # of model flags, fraction experts commented

def null_trial():
    h=0
    for s in suttas:
        k=len(s["M"]); S=s["S"]
        if k<=0: continue
        pick=set(random.sample(S,min(k,len(S))))
        h+=len(pick & s["C"])
    return h
nulls=sorted(null_trial() for _ in range(500))
nm=sum(nulls)/len(nulls); lo,hi=nulls[12],nulls[487]  # ~97.5%
# empirical p: fraction of null >= observed
p=sum(1 for x in nulls if x>=obs_hit)/len(nulls)

print("=== EXTERNAL VALIDATION: model choice surface vs expert-comment placement ===")
print(f"  suttas: {len(suttas)}   segments: {sum(len(s['S']) for s in suttas)}")
print(f"  expert-comment segments (C): {obs_C}   model-flagged (M, consensus>=2/3): {obs_M}")
print(f"  overlap (model flagged an expert-comment segment): {obs_hit}")
print(f"  RECALL of expert comments: {recall:.3f}   precision vs comments: {precision:.3f}")
print(f"  permutation null overlap: mean {nm:.1f}  95% [{lo},{hi}]   observed {obs_hit}")
print(f"  LIFT over null: {obs_hit-nm:+.1f}   empirical p(null>=obs) = {p:.4f}")
print(f"  -> model {'PREDICTS expert-comment placement ABOVE chance' if obs_hit>hi else 'within null (no signal)'}")
print("\n  by model choice-type: overlap-with-comments / total-flagged")
for t,n in bytype.most_common():
    print(f"    {t:14s} {bytype_hit[t]}/{n} = {bytype_hit[t]/n:.2f}" if n else f"    {t}: -")
print("\n  per-sutta:")
for p_ in per:
    print(f"    {p_['id']:10s} segs={p_['segs']:2d} comments={p_['comments']:2d} model={p_['model']:2d} hit={p_['hit']:2d}")
out={"recall":round(recall,3),"precision":round(precision,3),"overlap":obs_hit,
     "comment_segs":obs_C,"model_segs":obs_M,"null_mean":round(nm,1),"null_ci":[lo,hi],
     "p_value":p,"beats_null":obs_hit>hi,"per_sutta":per}
json.dump(out,open("research/out/validation_metrics.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("\nwrote research/out/validation_metrics.json")
