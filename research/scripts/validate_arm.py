#!/usr/bin/env python3
"""Generalized validation scorer with positional AND salience (length-weighted)
nulls. Usage: validate_arm.py <bundle.json> <ann.json> <label>"""
import json, re, collections, random, sys
random.seed(20260607)
PALI=re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")

bundle=json.load(open(sys.argv[1],encoding="utf-8"))
ann={a["id"]:a for a in json.load(open(sys.argv[2],encoding="utf-8"))["results"]}
label=sys.argv[3] if len(sys.argv)>3 else "arm"

suttas=[]; obs=0; obs_M=obs_C=0
for sid,b in bundle.items():
    if sid not in ann: continue
    S=list(b["segments"].keys()); C=set(b["comment_segs"])
    wlen={k:max(1,len(PALI.findall(b["segments"][k]))) for k in S}
    cnt=collections.Counter()
    for rv in ann[sid].get("annotators") or []:
        if not rv: continue
        for cs in rv.get("choice_segments",[]):
            if cs.get("segment_id") in wlen: cnt[cs["segment_id"]]+=1
    M={s for s,c in cnt.items() if c>=2}
    obs+=len(M&C); obs_M+=len(M); obs_C+=len(C)
    suttas.append((S,C,wlen,len(M)))

def pos_null():
    h=0
    for S,C,wlen,k in suttas:
        if k<=0: continue
        h+=len(set(random.sample(S,min(k,len(S)))) & C)
    return h
def sal_null():
    h=0
    for S,C,wlen,k in suttas:
        if k<=0: continue
        pool=S[:]; w=[wlen[s] for s in pool]; chosen=set()
        for _ in range(min(k,len(pool))):
            i=random.choices(range(len(pool)),weights=w,k=1)[0]; chosen.add(pool[i]); pool.pop(i); w.pop(i)
        h+=len(chosen&C)
    return h
pn=sorted(pos_null() for _ in range(500)); sn=sorted(sal_null() for _ in range(500))
def stat(d): return sum(d)/len(d), d[12], d[487]
pm,plo,phi=stat(pn); sm,slo,shi=stat(sn)
recall=obs/obs_C if obs_C else 0; prec=obs/obs_M if obs_M else 0
pp=sum(1 for x in pn if x>=obs)/len(pn); ps=sum(1 for x in sn if x>=obs)/len(sn)
print(f"=== VALIDATION ARM: {label} ===")
print(f"  units {len(suttas)}  comment segs {obs_C}  model-flagged {obs_M}  overlap {obs}")
print(f"  recall {recall:.3f}  precision {prec:.3f}")
print(f"  positional null {pm:.1f} [{plo},{phi}]  p={pp:.4f}  lift {obs-pm:+.1f}")
print(f"  salience  null {sm:.1f} [{slo},{shi}]  p={ps:.4f}  lift {obs-sm:+.1f}")
print(f"  -> {'BEATS salience null' if obs>shi else 'within salience null'}")
json.dump({"label":label,"overlap":obs,"comment_segs":obs_C,"model_segs":obs_M,
           "recall":round(recall,3),"precision":round(prec,3),
           "pos_null":round(pm,1),"pos_p":pp,"sal_null":round(sm,1),"sal_p":ps,
           "sal_lift":round(obs-sm,1),"beats_salience":obs>shi},
          open(f"research/out/validation_{label}.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print(f"\nwrote research/out/validation_{label}.json")
