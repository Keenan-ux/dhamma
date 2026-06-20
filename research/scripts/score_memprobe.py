#!/usr/bin/env python3
"""Score the memorization probe. For each commented segment, compare how much
the model's RECALL attempt vs its PREDICT attempt overlaps the ACTUAL SC
comment, by verbatim word-4-gram overlap (verbatim overlap can't arise from
reasoning-convergence). recall >> predict => memorization; recall ~ predict =>
the model is NOT recalling, just reasoning."""
import json, re

def words(s): return re.findall(r"[a-z]+", (s or "").lower())
def grams(s,n=4):
    w=words(s); return set(tuple(w[i:i+n]) for i in range(len(w)-n+1)) if len(w)>=n else set()
def overlap(cand, ref):
    g=grams(ref)
    if not g: return 0.0
    c=grams(cand)
    return len(c & g)/len(g)   # fraction of the REAL comment's 4-grams reproduced

actual={(i["sutta"],i["seg"]):i["comment"] for i in json.load(open("research/data/memprobe_set.json",encoding="utf-8"))}
ann=json.load(open("research/out/memprobe_ann.json",encoding="utf-8"))

rec_ov=[]; pred_ov=[]; cannot=0; confident_recall=0; n=0
rows=[]
for r in ann["results"]:
    key=(r["sutta"],r["seg"]); ref=actual.get(key)
    if not ref: continue
    n+=1
    rec=(r.get("recall") or {}); pred=(r.get("predict") or {})
    rtext=rec.get("text",""); ptext=pred.get("text","")
    if "cannot recall" in rtext.lower(): cannot+=1
    if rec.get("confident"): confident_recall+=1
    ro=overlap(rtext,ref); po=overlap(ptext,ref)
    rec_ov.append(ro); pred_ov.append(po)
    rows.append({"seg":f"{r['sutta']}:{r['seg']}","recall_ov":round(ro,3),"predict_ov":round(po,3),
                 "confident":rec.get("confident",False)})

mr=sum(rec_ov)/len(rec_ov); mp=sum(pred_ov)/len(pred_ov)
print("=== MEMORIZATION PROBE ===")
print(f"  segments: {n}")
print(f"  'CANNOT RECALL': {cannot}/{n}   confident-recall claims: {confident_recall}/{n}")
print(f"  verbatim 4-gram overlap with ACTUAL comment:")
print(f"     RECALL condition : mean {mr:.3f}")
print(f"     PREDICT condition: mean {mp:.3f}")
print(f"     RECALL - PREDICT : {mr-mp:+.3f}")
print(f"  -> {'MEMORIZATION implicated (recall >> predict)' if mr>mp+0.05 else 'NO memorization signal (recall ~ predict): the model cannot reproduce the notes; co-location is not recall'}")
print("\n  per-segment (top verbatim overlaps):")
for x in sorted(rows,key=lambda r:-r['recall_ov'])[:10]:
    print(f"    {x['seg']:18s} recall={x['recall_ov']:.2f} predict={x['predict_ov']:.2f} confident={x['confident']}")
json.dump({"n":n,"cannot_recall":cannot,"confident_recall":confident_recall,
           "recall_overlap":round(mr,3),"predict_overlap":round(mp,3),"rows":rows},
          open("research/out/memprobe_metrics.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("\nwrote research/out/memprobe_metrics.json")
