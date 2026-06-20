#!/usr/bin/env python3
"""Phase-4B: PER-PASSAGE commentary alignment (the layer phase-3 said was
missing) — built locally from bold_definitions' (book, subhead) sections
(11,911 sections, ~10 glossed terms each). For each passage, find its
commentary section by content overlap, then fire on the passage tokens that
section actually glosses. Null-test whether this per-passage-aligned signal
beats chance — unlike the corpus-frequency lane (phase 3), which did not.
"""
import sqlite3, json, re, unicodedata, collections, random
random.seed(20260607)

PALI=re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI.findall(s or "")]
def fuzzy(a,b):
    if a==b: return True
    if len(a)>=4 and len(b)>=4 and (a in b or b in a): return True
    if len(a)>=5 and len(b)>=5 and a[:5]==b[:5]: return True
    return False

# --- build section -> set(bold tokens) ---
db=sqlite3.connect("scripts/ingest/.cache/dpd-released/dpd.db")
sec=collections.defaultdict(set)
for book,sub,bold in db.execute("SELECT book,subhead,bold FROM bold_definitions WHERE bold IS NOT NULL"):
    key=(book,sub)
    for t in toks(bold):
        if len(t)>=3: sec[key].add(t)
sections=[(k,v) for k,v in sec.items() if v]
print(f"sections: {len(sections)} (median size ~{sorted(len(v) for _,v in sections)[len(sections)//2]})")

bundle=json.load(open("research/data/passage_text.json",encoding="utf-8"))
det={r["id"]:r for r in json.load(open("research/out/detector_p3.json",encoding="utf-8"))["results"]}
ann=json.load(open("research/out/annotations_p2.json",encoding="utf-8"))

def best_section(ptoks):
    pt=set(ptoks)
    best=None; bestov=0
    for k,v in sections:
        ov=len(pt & v)
        if ov>bestov: bestov=ov; best=v
    return best or set(), bestov

# per-passage commentary fires (tokens glossed in the passage's matched section)
comm_fires={}
align_quality={}
for pid,b in bundle.items():
    pt=toks(b.get("original",""))[:600]
    bset,ov=best_section(pt)
    comm_fires[pid]=[t for t in set(pt) if any(fuzzy(t,bt) for bt in bset)]
    align_quality[pid]=ov

# --- gold + null test (recovery of lexical-missed gold) ---
def goldclusters(a):
    marks=[]
    for ri,rv in enumerate(a.get("annotators") or []):
        if not rv: continue
        for cp in rv.get("choice_points",[]):
            t=set(toks(cp.get("pali","")))
            if t: marks.append((ri,t,cp.get("type","?")))
    cl=[]
    for ri,t,ty in marks:
        for c in cl:
            if c["tok"]&t: c["rev"].add(ri); c["tok"]|=t; c["ty"][ty]+=1; break
        else: cl.append({"rev":{ri},"tok":set(t),"ty":collections.Counter({ty:1})})
    return [{"tok":c["tok"],"ty":c["ty"].most_common(1)[0][0]} for c in cl if len(c["rev"])>=2]

P={}
for a in ann["results"]:
    pid=a["id"]
    if pid not in det or det[pid].get("error"): continue
    lex=[norm(f["token"]) for f in det[pid].get("fires",[])]
    gold=goldclusters(a)
    lex_missed=[g for g in gold if not any(fuzzy(x,gt) for x in lex for gt in g["tok"])]
    P[pid]={"pool":toks(bundle.get(pid,{}).get("original",""))[:600],
            "cf":comm_fires.get(pid,[]),"lex_missed":lex_missed,"gold":gold}

NONLEX={"register","domestication","doctrinal"}
tot_missed=rec=fire_total=0
bs_missed=bs_rec=0
for pid,d in P.items():
    fire_total+=len(d["cf"])
    for g in d["lex_missed"]:
        tot_missed+=1; hit=any(fuzzy(x,gt) for x in d["cf"] for gt in g["tok"])
        if hit: rec+=1
        if g["ty"] in NONLEX:
            bs_missed+=1; bs_rec+=hit
obs=rec/tot_missed if tot_missed else 0
def null():
    r=0
    for pid,d in P.items():
        k=len(d["cf"]); pool=d["pool"]
        if not pool or k<=0: continue
        f=set(random.sample(pool,min(k,len(pool))))
        for g in d["lex_missed"]:
            if any(fuzzy(x,gt) for x in f for gt in g["tok"]): r+=1
    return r/tot_missed if tot_missed else 0
nulls=sorted(null() for _ in range(200)); nm=sum(nulls)/len(nulls); lo,hi=nulls[5],nulls[194]
print("\n=== PER-PASSAGE COMMENTARY ALIGNMENT (content-matched section) ===")
print(f"  total commentary fires across 57 passages: {fire_total} (avg {fire_total/len(P):.1f}/passage)")
print(f"  marginal recovery of lexical-missed gold: {rec}/{tot_missed} = {obs:.3f}")
print(f"  permutation null: mean {nm:.3f}  95% [{lo:.3f},{hi:.3f}]")
print(f"  LIFT over null: {obs-nm:+.3f}  -> {'BEATS NULL' if obs>hi else 'within/below null'}")
print(f"  blind-spot recovery: {bs_rec}/{bs_missed} = {bs_rec/bs_missed:.3f}" if bs_missed else "")
# --- STEELMAN: sparse, rarity-targeted variant ---
# term spread = #sections it is glossed in; rare = glossed in few sections.
spread=collections.Counter()
for _,v in sections:
    for t in v: spread[t]+=1
def sparse_fires(pid, cap=6, maxspread=4):
    pt=set(P[pid]["pool"])
    cand=[t for t in P[pid]["cf"] if spread.get(t,99)<=maxspread]
    cand.sort(key=lambda t: spread.get(t,99))
    return cand[:cap]
sp_missed=tot_missed; sp_rec=0; sp_fire=0
spf={}
for pid,d in P.items():
    f=sparse_fires(pid); spf[pid]=f; sp_fire+=len(f)
    for g in d["lex_missed"]:
        if any(fuzzy(x,gt) for x in f for gt in g["tok"]): sp_rec+=1
sp_obs=sp_rec/sp_missed if sp_missed else 0
def null_sparse():
    r=0
    for pid,d in P.items():
        k=len(spf[pid]); pool=d["pool"]
        if not pool or k<=0: continue
        f=set(random.sample(pool,min(k,len(pool))))
        for g in d["lex_missed"]:
            if any(fuzzy(x,gt) for x in f for gt in g["tok"]): r+=1
    return r/sp_missed if sp_missed else 0
sn=sorted(null_sparse() for _ in range(200)); snm=sum(sn)/len(sn); slo,shi=sn[5],sn[194]
print("\n=== STEELMAN: sparse rarity-targeted commentary (<=6 rare glosses/passage) ===")
print(f"  fires: {sp_fire} (avg {sp_fire/len(P):.1f}/passage)")
print(f"  recovery: {sp_rec}/{sp_missed} = {sp_obs:.3f}  null mean {snm:.3f} 95% [{slo:.3f},{shi:.3f}]")
print(f"  LIFT: {sp_obs-snm:+.3f} -> {'BEATS NULL' if sp_obs>shi else 'within/below null'}")
json.dump({"dense":{"fires":fire_total,"recovery":round(obs,3),"null_mean":round(nm,3),
           "null_ci":[round(lo,3),round(hi,3)],"lift":round(obs-nm,3),"beats_null":obs>hi,
           "blindspot_recovery":[bs_rec,bs_missed]},
           "sparse":{"fires":sp_fire,"recovery":round(sp_obs,3),"null_mean":round(snm,3),
           "null_ci":[round(slo,3),round(shi,3)],"lift":round(sp_obs-snm,3),"beats_null":sp_obs>shi}},
          open("research/out/commentary_align.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("\nwrote research/out/commentary_align.json")
