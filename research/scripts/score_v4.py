#!/usr/bin/env python3
"""Phase-4A: carve out the leave-in-Pāli vocabulary and re-score the RESIDUAL.
Tests the prediction: with technical-vocab choice-points handled by policy,
does annotator agreement (IAA) rise on the residual, and what is the detector's
recall on the genuinely-hard residual?
Inputs: annotations_p2.json, detector_p3.json, data/leave_in_pali.json"""
import json, re, unicodedata, collections, sys
sys.path.insert(0,"research/scripts"); import dpd_local as D; D.connect()

PALI=re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI.findall(s or "")]
def fuzzy(a,b):
    if a==b: return True
    if len(a)>=4 and len(b)>=4 and (a in b or b in a): return True
    if len(a)>=5 and len(b)>=5 and a[:5]==b[:5]: return True
    return False

pol=json.load(open("research/data/leave_in_pali.json",encoding="utf-8"))
LEAVE=set(pol["core"]) | set(pol["debatable"].keys())
_cache={}
def is_leave_in_token(t):
    if t in _cache: return _cache[t]
    r=False
    if t in LEAVE: r=True
    else:
        for e in D.lemma_lookup(t)["dpd"]:
            if norm(e["lemma"]) in LEAVE: r=True; break
        if not r:
            for w in LEAVE:
                if len(w)>=4 and t.startswith(w[:max(4,len(w)-1)]): r=True; break
    _cache[t]=r; return r

def tokset_residual(tset):  # drop tokens that are leave-in
    return {t for t in tset if not is_leave_in_token(t)}

det={r["id"]:r for r in json.load(open("research/out/detector_p3.json",encoding="utf-8"))["results"]}
ann=json.load(open("research/out/annotations_p2.json",encoding="utf-8"))

def run(residual):
    G=C=0; iaa=[]
    for a in ann["results"]:
        pid=a["id"]
        if pid not in det or det[pid].get("error"): continue
        lex=[norm(f["token"]) for f in det[pid].get("fires",[])]
        if residual: lex=[t for t in lex if not is_leave_in_token(t)]
        rev=[]; marks=[]
        for ri,rv in enumerate(a.get("annotators") or []):
            if not rv: continue
            ts=set()
            for cp in rv.get("choice_points",[]):
                t=set(toks(cp.get("pali","")))
                if residual: t=tokset_residual(t)
                if t: marks.append((ri,t)); ts|=t
            rev.append(ts)
        if len(rev)>=2:
            f1=[]
            for i in range(len(rev)):
                for j in range(i+1,len(rev)):
                    A,B=rev[i],rev[j]
                    if not A and not B: f1.append(1.0); continue
                    inter=len(A&B); p=inter/len(A) if A else 0; r=inter/len(B) if B else 0
                    f1.append(2*p*r/(p+r) if (p+r) else 0.0)
            if f1: iaa.append(sum(f1)/len(f1))
        cl=[]
        for ri,t in marks:
            for c in cl:
                if c["tok"]&t: c["rev"].add(ri); c["tok"]|=t; break
            else: cl.append({"rev":{ri},"tok":set(t)})
        for c in cl:
            if len(c["rev"])<2: continue
            G+=1
            if any(fuzzy(x,gt) for x in lex for gt in c["tok"]): C+=1
    return {"gold":G,"recall":round(C/G,3) if G else None,
            "iaa":round(sum(iaa)/len(iaa),3) if iaa else None}

full=run(False); res=run(True)
print("=== PHASE 4A: leave-in-Pāli carve-out ===")
print(f"  leave-in set: {len(LEAVE)} terms (core {len(pol['core'])} + debatable {len(pol['debatable'])})")
print(f"  FULL gold:     {full['gold']} points  lexical recall {full['recall']}  IAA {full['iaa']}")
print(f"  RESIDUAL gold: {res['gold']} points  lexical recall {res['recall']}  IAA {res['iaa']}")
print(f"  carved out:    {full['gold']-res['gold']} choice-points "
      f"({(full['gold']-res['gold'])/full['gold']:.1%}) become policy-handled")
print(f"  IAA change on residual: {full['iaa']} -> {res['iaa']} "
      f"({'+' if res['iaa']>=full['iaa'] else ''}{round(res['iaa']-full['iaa'],3)})")
json.dump({"full":full,"residual":res},open("research/out/metrics_p4a.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("wrote research/out/metrics_p4a.json")
