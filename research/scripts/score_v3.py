#!/usr/bin/env python3
"""Phase-3: sweep redesigned commentary-lane rules and NULL-TEST each.
Phase-2's lane fired on common glossed words (bold-count>=2) and lost to a
permutation null. Here we test 'specificity' rules (fire on RARELY-glossed
terms the lexical lane misses) and report which, if any, beats its null.
Inputs: research/out/detector_p3.json (all_tokens), annotations_p2.json."""
import json, re, unicodedata, collections, random
random.seed(20260607)

PALI=re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI.findall(s or "")]
def fuzzy(a,b):
    if a==b: return True
    if len(a)>=4 and len(b)>=4 and (a in b or b in a): return True
    if len(a)>=5 and len(b)>=5 and a[:5]==b[:5]: return True
    return False

det={r["id"]:r for r in json.load(open("research/out/detector_p3.json",encoding="utf-8"))["results"]}
ann=json.load(open("research/out/annotations_p2.json",encoding="utf-8"))

# per passage: all_tokens, gold clusters, lexical-missed gold
P={}
for a in ann["results"]:
    pid=a["id"]
    if pid not in det or det[pid].get("error"): continue
    at=det[pid].get("all_tokens",[])
    lex=[norm(t["token"]) for t in at if t["n_senses"]>=2]
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
    gold=[{"tok":c["tok"],"ty":c["ty"].most_common(1)[0][0]} for c in cl if len(c["rev"])>=2]
    lex_missed=[g for g in gold if not any(fuzzy(x,gt) for x in lex for gt in g["tok"])]
    P[pid]={"at":at,"pool":[norm(t["token"]) for t in at],"lex":lex,
            "gold":gold,"lex_missed":lex_missed}

def comm_fire_tokens(at, rule):
    out=[]
    for t in at:
        c=t["comm"]; ns=t["n_senses"]
        if rule(c,ns): out.append(norm(t["token"]))
    return out

def evaluate(rule, name):
    total_missed=fire_total=rec=0
    per_pass_k={}
    for pid,d in P.items():
        cf=comm_fire_tokens(d["at"], rule)
        per_pass_k[pid]=len(cf)
        fire_total+=len(cf)
        for g in d["lex_missed"]:
            total_missed+=1
            if any(fuzzy(x,gt) for x in cf for gt in g["tok"]): rec+=1
    obs=rec/total_missed if total_missed else 0
    # null: fire k random tokens per passage, recovery of lex_missed
    def null():
        r=0
        for pid,d in P.items():
            k=per_pass_k[pid]; pool=d["pool"]
            if not pool or k<=0: continue
            fset=set(random.sample(pool,min(k,len(pool))))
            for g in d["lex_missed"]:
                if any(fuzzy(x,gt) for x in fset for gt in g["tok"]): r+=1
        return r/total_missed if total_missed else 0
    nulls=sorted(null() for _ in range(200))
    nm=sum(nulls)/len(nulls); lo,hi=nulls[5],nulls[194]
    return {"name":name,"fires":fire_total,"recovery":round(obs,3),
            "null_mean":round(nm,3),"null_ci":[round(lo,3),round(hi,3)],
            "lift":round(obs-nm,3),"beats_null":obs>hi}

RULES=[
    ("phase2 (comm>=2)",            lambda c,ns: c>=2),
    ("specific 1<=c<=3, ns<2",      lambda c,ns: 1<=c<=3 and ns<2),
    ("specific 1<=c<=5, ns<2",      lambda c,ns: 1<=c<=5 and ns<2),
    ("specific 1<=c<=8, ns<2",      lambda c,ns: 1<=c<=8 and ns<2),
    ("rare c==1, ns<2",            lambda c,ns: c==1 and ns<2),
    ("rare c==1 (any ns)",         lambda c,ns: c==1),
    ("mid 2<=c<=8, ns<2",          lambda c,ns: 2<=c<=8 and ns<2),
]
print(f"{'rule':24s} {'fires':>6s} {'recov':>6s} {'null':>6s} {'null95':>14s} {'lift':>6s} beats")
res=[]
for name,rule in RULES:
    r=evaluate(rule,name); res.append(r)
    print(f"{name:24s} {r['fires']:>6d} {r['recovery']:>6.3f} {r['null_mean']:>6.3f} "
          f"{str(r['null_ci']):>14s} {r['lift']:>+6.3f} {'YES' if r['beats_null'] else 'no'}")
json.dump(res,open("research/out/commentary_sweep.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
winners=[r for r in res if r["beats_null"]]
print(f"\nrules beating null: {len(winners)}")
for w in winners: print("  WINNER:",w["name"],"lift",w["lift"])
print("wrote research/out/commentary_sweep.json")
