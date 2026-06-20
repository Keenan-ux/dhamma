#!/usr/bin/env python3
"""Phase-2 committee-response diagnostics (DB-free). Answers the viva:
  - marginal_recovery STRICT (vs fuzzy) — is recovery a matcher artifact?
  - PERMUTATION NULL — is recovery above chance (broad firing vs dense gold)?
  - by-TYPE recovery cross-tab — is recovery really on doctrinal/register?
  - precision cost — false fires added per true recovery
  - McNemar note on the lexical-vs-combined pairing
"""
import json, re, unicodedata, collections, random, math
random.seed(20260607)

PALI=re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI.findall(s or "")]
def fuzzy(a,b):
    if a==b: return True
    if len(a)>=4 and len(b)>=4 and (a in b or b in a): return True
    if len(a)>=5 and len(b)>=5 and a[:5]==b[:5]: return True
    return False

det={r["id"]:r for r in json.load(open("research/out/detector_p2.json",encoding="utf-8"))["results"]}
ann=json.load(open("research/out/annotations_p2.json",encoding="utf-8"))
bundle=json.load(open("research/data/passage_text.json",encoding="utf-8"))
NONLEX={"register","domestication","doctrinal"}

# per-gold record
records=[]   # {genre,type,lex_f,lex_s,com_f,com_s}
passage_pool={}  # pid -> list of resolved token norms (for permutation null)
com_fire_counts={}
for a in ann["results"]:
    pid=a["id"]
    if pid not in det or det[pid].get("error"): continue
    lex=[norm(f["token"]) for f in det[pid].get("fires",[])]
    com=[norm(f["token"]) for f in det[pid].get("comm_fires",[])]
    com_fire_counts[pid]=len(com)
    passage_pool[pid]=[t for t in toks(bundle.get(pid,{}).get("original","")) if len(t)>=3]
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
    for c in cl:
        if len(c["rev"])<2: continue
        ty=c["ty"].most_common(1)[0][0]
        records.append({"pid":pid,"genre":a.get("genre"),"type":ty,"tok":c["tok"],
            "lex_f":any(fuzzy(x,g) for x in lex for g in c["tok"]),
            "lex_s":any(x==g for x in lex for g in c["tok"]),
            "com_f":any(fuzzy(x,g) for x in com for g in c["tok"]),
            "com_s":any(x==g for x in com for g in c["tok"])})

# --- marginal recovery fuzzy vs strict ---
lex_miss=[r for r in records if not r["lex_f"]]
rec_f=sum(1 for r in lex_miss if r["com_f"])
rec_s=sum(1 for r in lex_miss if r["com_s"])
print("=== MARGINAL RECOVERY (of lexical-missed gold) ===")
print(f"  fuzzy : {rec_f}/{len(lex_miss)} = {rec_f/len(lex_miss):.3f}")
print(f"  strict: {rec_s}/{len(lex_miss)} = {rec_s/len(lex_miss):.3f}")

# --- permutation null: fire commentary at same per-passage rate on random tokens ---
def null_recovery():
    rec=0
    for r in lex_miss:
        pid=r["pid"]; pool=passage_pool.get(pid,[]); k=com_fire_counts.get(pid,0)
        if not pool or k<=0: continue
        fires=set(random.sample(pool, min(k,len(pool))))
        if any(fuzzy(x,g) for x in fires for g in r["tok"]): rec+=1
    return rec/len(lex_miss)
nulls=[null_recovery() for _ in range(200)]
nulls.sort()
mean_null=sum(nulls)/len(nulls)
ci=(round(nulls[5],3),round(nulls[194],3))  # ~95%
obs=rec_f/len(lex_miss)
print("\n=== PERMUTATION NULL (200 shuffles, same firing rate, random positions) ===")
print(f"  observed recovery (fuzzy): {obs:.3f}")
print(f"  null mean: {mean_null:.3f}  null 95%: {ci}")
print(f"  LIFT over null: {obs-mean_null:+.3f}  (observed {'ABOVE' if obs>ci[1] else 'WITHIN'} null band)")

# --- by-type recovery ---
print("\n=== BY-TYPE recovery (of lexical-missed gold, fuzzy) ===")
bytype=collections.defaultdict(lambda:[0,0])
for r in lex_miss:
    bytype[r["type"]][1]+=1
    if r["com_f"]: bytype[r["type"]][0]+=1
for ty,(rec,tot) in sorted(bytype.items(), key=lambda x:-x[1][1]):
    print(f"  {ty:14s} {rec}/{tot} = {rec/tot:.3f}" if tot else f"  {ty}: n/a")

# --- precision cost ---
goldtok_by={}
for r in records: goldtok_by.setdefault(r["pid"],set()).update(r["tok"])
com_tp=com_fp=0
for pid in det:
    if pid not in passage_pool: continue
    gt=goldtok_by.get(pid,set())
    for f in det[pid].get("comm_fires",[]):
        x=norm(f["token"])
        if any(fuzzy(x,g) for g in gt): com_tp+=1
        else: com_fp+=1
print("\n=== COMMENTARY LANE PRECISION COST ===")
print(f"  commentary fires: TP={com_tp} FP={com_fp}  precision={com_tp/(com_tp+com_fp):.3f}")
print(f"  false fires added per gold point recovered: {com_fp}/{rec_f} = {com_fp/rec_f:.1f}")

# --- McNemar note ---
b=rec_f; c=0  # combined is superset of lexical -> c (lex hit, comb miss) = 0
print("\n=== PAIRED (McNemar) lexical vs combined ===")
print(f"  discordant: combined-only={b}, lexical-only={c} (combined is a superset by construction)")
print(f"  -> combining strictly adds {b} recoveries, removes 0; the paired question is whether those {b} exceed null (above).")

out={"recovery_fuzzy":[rec_f,len(lex_miss)],"recovery_strict":[rec_s,len(lex_miss)],
     "null_mean":round(mean_null,3),"null_ci":ci,"observed":round(obs,3),"lift":round(obs-mean_null,3),
     "by_type":{k:v for k,v in bytype.items()},"commentary_precision":round(com_tp/(com_tp+com_fp),3),
     "fp_per_recovery":round(com_fp/rec_f,1)}
json.dump(out,open("research/out/diagnostics_v2.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("\nwrote research/out/diagnostics_v2.json")
