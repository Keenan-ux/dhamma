#!/usr/bin/env python3
"""Control 2 scorer. Did the model predict comment LOCATIONS from segment
structure alone (no Pāli)? Compare location-only recall to phase-5's
with-content recall (0.634) and to a random K-of-N chance baseline."""
import json, random
random.seed(20260607)
bundle=json.load(open("research/data/validation_bundle.json",encoding="utf-8"))
ann=json.load(open("research/out/locprobe_ann.json",encoding="utf-8"))
annby={a["id"]:a for a in ann["results"]}

tot_overlap=tot_k=0; chance_overlap=0; per=[]
for sid,b in bundle.items():
    if sid not in annby: continue
    S=list(b["segments"].keys()); C=set(b["comment_segs"]); K=len(C)
    if K==0: continue
    # average the agents' overlaps
    ovs=[]
    for p in annby[sid].get("preds") or []:
        if not p: continue
        pred=set(x for x in (p.get("predicted_segments") or []) if x in S)
        ovs.append(len(pred & C))
    ov=sum(ovs)/len(ovs) if ovs else 0
    tot_overlap+=ov; tot_k+=K
    # chance: random K of N
    cov=sum(len(set(random.sample(S,min(K,len(S))))&C) for _ in range(200))/200
    chance_overlap+=cov
    per.append({"id":sid,"K":K,"loc_overlap":round(ov,1),"chance":round(cov,1)})

loc_recall=tot_overlap/tot_k
chance_recall=chance_overlap/tot_k
WITH_CONTENT=0.634  # phase-5
print("=== Control 2: LOCATION-RECALL PROBE (no Pāli) ===")
print(f"  location-only recall (predict positions w/o content): {loc_recall:.3f}")
print(f"  chance baseline (random K-of-N):                        {chance_recall:.3f}")
print(f"  WITH-content recall (phase 5):                          {WITH_CONTENT:.3f}")
print(f"  content advantage: {WITH_CONTENT-loc_recall:+.3f}")
print(f"  -> {'CONTENT NEEDED: with-content >> location-only (not a positional/memory prior)' if WITH_CONTENT-loc_recall>=0.15 else 'positional prior explains much of phase-5 (content adds <0.15)'}")
print(f"  (location-only above chance by {loc_recall-chance_recall:+.3f} — any positional structure the model does know)")
json.dump({"location_only_recall":round(loc_recall,3),"chance_recall":round(chance_recall,3),
           "with_content_recall":WITH_CONTENT,"content_advantage":round(WITH_CONTENT-loc_recall,3),
           "per":per},open("research/out/locprobe_metrics.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("wrote research/out/locprobe_metrics.json")
