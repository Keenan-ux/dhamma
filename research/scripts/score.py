#!/usr/bin/env python3
"""Deterministic scoring: detector fires vs annotator consensus gold.

Inputs:
  research/out/detector_results.json   (from detector.py --batch)
  research/out/annotations.json        (saved workflow result, {results:[...]})
Outputs:
  research/out/metrics.json + console summary

Metrics per PREREGISTRATION.md §5:
  - consensus gold = choice-point marked by >=2 of 3 annotators (token-cluster)
  - catch rate (recall), false-alarm rate (1-precision), per genre + per type
  - IAA = mean pairwise token-F1 among reviewers, per genre
  - blind-spot = recall on register/domestication/doctrinal gold (lexical-only
    detector expected to miss these)
"""
import json, re, unicodedata, collections, os

PALI_RE = re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")

def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI_RE.findall(s or "")]

def fuzzy_eq(a, b):
    if a == b: return True
    if len(a) >= 4 and len(b) >= 4 and (a in b or b in a): return True
    if len(a) >= 5 and len(b) >= 5 and a[:5] == b[:5]: return True
    return False

def load(p):
    with open(p, encoding="utf-8") as f: return json.load(f)

def main():
    det = load("research/out/detector_results.json")
    ann = load("research/out/annotations.json")
    det_by = {r["id"]: r for r in det["results"]}
    ann_results = ann.get("results", ann if isinstance(ann, list) else [])

    per_genre = collections.defaultdict(lambda: {
        "passages":0, "gold":0, "caught":0, "fires":0, "fires_matched":0,
        "iaa_vals":[], "gold_by_type":collections.Counter(), "caught_by_type":collections.Counter()})
    detail = []

    for a in ann_results:
        pid = a["id"]; genre = a.get("genre","?")
        # Only score passages that actually have detector output, so genres
        # still pending (API outage) are NOT reported as false zeros.
        if pid not in det_by or det_by[pid].get("error"):
            continue
        annots = a.get("annotators") or []
        # reviewer token-sets (skip null/failed reviewers)
        rev_tokens = []
        rev_marks = []  # list of (tokenset, type) per reviewer
        for rv in annots:
            if not rv or "choice_points" not in rv: continue
            marks=[]
            tset=set()
            for cp in rv["choice_points"]:
                t=set(toks(cp.get("pali","")))
                if not t: continue
                marks.append((t, cp.get("type","?")))
                tset|=t
            rev_tokens.append(tset); rev_marks.append(marks)
        nrev=len(rev_tokens)
        # IAA: mean pairwise token F1
        if nrev>=2:
            f1s=[]
            for i in range(nrev):
                for j in range(i+1,nrev):
                    A,B=rev_tokens[i],rev_tokens[j]
                    if not A and not B: f1s.append(1.0); continue
                    inter=len(A&B)
                    p=inter/len(A) if A else 0; r=inter/len(B) if B else 0
                    f1s.append(2*p*r/(p+r) if (p+r) else 0.0)
            if f1s: per_genre[genre]["iaa_vals"].append(sum(f1s)/len(f1s))
        # consensus gold: cluster marks across reviewers by token overlap;
        # a cluster with marks from >=2 distinct reviewers is gold.
        allmarks=[]  # (reviewer_idx, tokenset, type)
        for ri,marks in enumerate(rev_marks):
            for (t,ty) in marks: allmarks.append([ri,t,ty])
        clusters=[]  # {revs:set, tokens:set, types:Counter}
        for ri,t,ty in allmarks:
            placed=False
            for c in clusters:
                if c["tokens"] & t:
                    c["revs"].add(ri); c["tokens"]|=t; c["types"][ty]+=1; placed=True; break
            if not placed:
                clusters.append({"revs":{ri},"tokens":set(t),"types":collections.Counter({ty:1})})
        gold=[c for c in clusters if len(c["revs"])>=2]
        # detector fires for this passage
        dres=det_by.get(pid,{})
        fires=dres.get("fires",[]) if not dres.get("error") else []
        fire_toks=[norm(f["token"]) for f in fires]
        # recall: gold caught by a detector fire
        caught=0
        for g in gold:
            gtype=g["types"].most_common(1)[0][0]
            per_genre[genre]["gold_by_type"][gtype]+=1
            hit=any(fuzzy_eq(ft,gt) for ft in fire_toks for gt in g["tokens"])
            if hit:
                caught+=1; per_genre[genre]["caught_by_type"][gtype]+=1
        # precision: fires that match a gold cluster
        fmatched=0
        gold_tok_union=set().union(*[g["tokens"] for g in gold]) if gold else set()
        for ft in fire_toks:
            if any(fuzzy_eq(ft,gt) for gt in gold_tok_union): fmatched+=1
        pg=per_genre[genre]
        pg["passages"]+=1; pg["gold"]+=len(gold); pg["caught"]+=caught
        pg["fires"]+=len(fire_toks); pg["fires_matched"]+=fmatched
        detail.append({"id":pid,"genre":genre,"nrev":nrev,"gold":len(gold),
                       "caught":caught,"fires":len(fire_toks),"fires_matched":fmatched})

    # aggregate
    summary={}
    tot=collections.Counter()
    bs_gold=bs_caught=0
    for genre,pg in sorted(per_genre.items()):
        recall=pg["caught"]/pg["gold"] if pg["gold"] else None
        precision=pg["fires_matched"]/pg["fires"] if pg["fires"] else None
        iaa=sum(pg["iaa_vals"])/len(pg["iaa_vals"]) if pg["iaa_vals"] else None
        bs_g=sum(pg["gold_by_type"][t] for t in ("register","domestication","doctrinal"))
        bs_c=sum(pg["caught_by_type"][t] for t in ("register","domestication","doctrinal"))
        bs_gold+=bs_g; bs_caught+=bs_c
        summary[genre]={"passages":pg["passages"],"gold":pg["gold"],"caught":pg["caught"],
            "recall":round(recall,3) if recall is not None else None,
            "fires":pg["fires"],"precision":round(precision,3) if precision is not None else None,
            "false_alarm":round(1-precision,3) if precision is not None else None,
            "iaa":round(iaa,3) if iaa is not None else None,
            "gold_by_type":dict(pg["gold_by_type"]),"caught_by_type":dict(pg["caught_by_type"])}
        for k in ("gold","caught","fires","fires_matched"): tot[k]+=pg[k]
    overall={"gold":tot["gold"],"caught":tot["caught"],
        "recall":round(tot["caught"]/tot["gold"],3) if tot["gold"] else None,
        "fires":tot["fires"],
        "precision":round(tot["fires_matched"]/tot["fires"],3) if tot["fires"] else None,
        "blind_spot_gold":bs_gold,"blind_spot_caught":bs_caught,
        "blind_spot_recall":round(bs_caught/bs_gold,3) if bs_gold else None}

    out={"overall":overall,"by_genre":summary,"detail":detail}
    os.makedirs("research/out",exist_ok=True)
    with open("research/out/metrics.json","w",encoding="utf-8") as f:
        json.dump(out,f,ensure_ascii=False,indent=1)

    print("=== OVERALL ===")
    for k,v in overall.items(): print(f"  {k}: {v}")
    print("\n=== BY GENRE ===")
    print(f"{'genre':12s} {'pass':>4s} {'gold':>4s} {'rec':>5s} {'fires':>5s} {'prec':>5s} {'IAA':>5s}")
    for g,s in summary.items():
        print(f"{g:12s} {s['passages']:>4d} {s['gold']:>4d} {str(s['recall']):>5s} {s['fires']:>5d} {str(s['precision']):>5s} {str(s['iaa']):>5s}")
    print("\nwrote research/out/metrics.json")

if __name__=="__main__":
    main()
