#!/usr/bin/env python3
"""Control 3 scorer. Re-run co-location against the CRUX-ONLY comment target
(comments classified 'crux'), with the combined structure-matched null.
Compare to all-comments. Stronger/equal lift on cruxes-only supports
'tracks genuine cruxes' over 'generic salience'."""
import json, re, math, collections, random
random.seed(20260607)
PALI=re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
tdf=json.load(open("research/data/token_df.json",encoding="utf-8")); N=tdf["ndoc"]; df=tdf["df"]
def rar(t):
    d=df.get(t.lower(),0.5); return math.log(N/(d if d>0 else 0.5))
def load(p): return json.load(open(p,encoding="utf-8"))

clf=load("research/out/cruxclass_ann.json")
crux_by=collections.defaultdict(set); label_dist=collections.Counter()
for r in clf["results"]:
    for lab in r.get("labels") or []:
        label_dist[lab.get("label")]+=1
        if lab.get("label")=="crux": crux_by[r["id"]].add(lab.get("segment_id"))

def score(bundle_p, ann_p, target):  # target: 'all' or 'crux'
    bundle=load(bundle_p); ann={a["id"]:a for a in load(ann_p)["results"]}
    suttas=[]; obs=0; tc=0
    for sid,b in bundle.items():
        if sid not in ann: continue
        S=list(b["segments"].keys())
        C=set(b["comment_segs"]) if target=="all" else (crux_by.get(sid,set()) & set(b["comment_segs"]))
        tc+=len(C)
        w={k:max(0.01, len(PALI.findall(b["segments"][k]))*(sum(rar(t) for t in PALI.findall(b["segments"][k]))/max(1,len(PALI.findall(b["segments"][k]))))) for k in S}
        cnt=collections.Counter()
        for rv in ann[sid].get("annotators") or []:
            if not rv: continue
            for cs in rv.get("choice_segments",[]):
                if cs.get("segment_id") in w: cnt[cs["segment_id"]]+=1
        M={s for s,c in cnt.items() if c>=2}
        obs+=len(M&C); suttas.append((S,C,w,len(M)))
    def null():
        h=0
        for S,C,w,k in suttas:
            if k<=0 or not C: continue
            pool=S[:]; ww=[w[s] for s in pool]; ch=set()
            for _ in range(min(k,len(pool))):
                i=random.choices(range(len(pool)),weights=ww,k=1)[0]; ch.add(pool[i]); pool.pop(i); ww.pop(i)
            h+=len(ch&C)
        return h
    ns=sorted(null() for _ in range(1000)); nm=sum(ns)/len(ns); hi=ns[975]
    p=sum(1 for x in ns if x>=obs)/len(ns)
    return {"target":target,"comment_segs":tc,"overlap":obs,"recall":round(obs/tc,3) if tc else None,
            "null":round(nm,1),"lift":round(obs-nm,1),"p":p,"beats":obs>hi}

print("=== Control 3: CRUX-ONLY TARGET ===")
print("  comment-type distribution:", dict(label_dist))
crux_frac=label_dist["crux"]/sum(label_dist.values()) if label_dist else 0
print(f"  fraction classified 'crux': {crux_frac:.1%}")
out={"label_dist":dict(label_dist),"arms":{}}
for arm,(bp,ap) in {"famous":("research/data/validation_bundle.json","research/out/validation_ann.json"),
                    "lowfame":("research/data/lowfame_bundle.json","research/out/lowfame_ann.json")}.items():
    a=score(bp,ap,"all"); c=score(bp,ap,"crux")
    out["arms"][arm]={"all":a,"crux":c}
    print(f"\n  {arm}:")
    print(f"    all-comments : overlap {a['overlap']}/{a['comment_segs']} recall {a['recall']} lift {a['lift']:+} p={a['p']:.4f} {'PASS' if a['beats'] else 'fail'}")
    print(f"    crux-only    : overlap {c['overlap']}/{c['comment_segs']} recall {c['recall']} lift {c['lift']:+} p={c['p']:.4f} {'PASS' if c['beats'] else 'fail'}")
json.dump(out,open("research/out/cruxonly_metrics.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("\nwrote research/out/cruxonly_metrics.json")
