#!/usr/bin/env python3
"""Control 1: difficulty-matched null. Re-test the co-location lift against a
null that samples segments weighted by LEXICAL DIFFICULTY (mean token rarity),
so the null concentrates on hard segments as the model appears to. If the model
still beats this, the signal is not merely 'tracks lexical difficulty'.
Usage: difficulty_null.py <bundle.json> <ann.json> <label>"""
import json, re, math, collections, random, sys
random.seed(20260607)
PALI=re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")

tdf=json.load(open("research/data/token_df.json",encoding="utf-8"))
N=tdf["ndoc"]; df=tdf["df"]
def rarity(tok):
    d=df.get(tok.lower(),0.5)
    return math.log(N/(d if d>0 else 0.5))
def seg_difficulty(text):
    toks=PALI.findall(text or "")
    if not toks: return 0.1
    return sum(rarity(t) for t in toks)/len(toks)

bundle=json.load(open(sys.argv[1],encoding="utf-8"))
ann={a["id"]:a for a in json.load(open(sys.argv[2],encoding="utf-8"))["results"]}
label=sys.argv[3] if len(sys.argv)>3 else "arm"

suttas=[]; obs=0
for sid,b in bundle.items():
    if sid not in ann: continue
    S=list(b["segments"].keys()); C=set(b["comment_segs"])
    diff={k:seg_difficulty(b["segments"][k]) for k in S}
    cnt=collections.Counter()
    for rv in ann[sid].get("annotators") or []:
        if not rv: continue
        for cs in rv.get("choice_segments",[]):
            if cs.get("segment_id") in diff: cnt[cs["segment_id"]]+=1
    M={s for s,c in cnt.items() if c>=2}
    obs+=len(M&C); suttas.append((S,C,diff,len(M)))

def dnull():
    h=0
    for S,C,diff,k in suttas:
        if k<=0: continue
        pool=S[:]; w=[max(0.01,diff[s]) for s in pool]; chosen=set()
        for _ in range(min(k,len(pool))):
            i=random.choices(range(len(pool)),weights=w,k=1)[0]; chosen.add(pool[i]); pool.pop(i); w.pop(i)
        h+=len(chosen&C)
    return h
nulls=sorted(dnull() for _ in range(1000)); nm=sum(nulls)/len(nulls); lo,hi=nulls[24],nulls[975]
p=sum(1 for x in nulls if x>=obs)/len(nulls)
print(f"=== Control 1: DIFFICULTY-MATCHED NULL — {label} ===")
print(f"  observed overlap: {obs}")
print(f"  difficulty null: mean {nm:.1f}  95% [{lo},{hi}]")
print(f"  lift over difficulty null: {obs-nm:+.1f}  p(null>=obs)={p:.4f}")
print(f"  -> {'PASS: beats difficulty null' if obs>hi else 'FAIL: within difficulty null (explained by lexical difficulty)'}")
json.dump({"label":label,"observed":obs,"diff_null_mean":round(nm,1),"diff_null_ci":[lo,hi],
           "lift":round(obs-nm,1),"p":p,"beats_difficulty_null":obs>hi},
          open(f"research/out/difficulty_null_{label}.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
