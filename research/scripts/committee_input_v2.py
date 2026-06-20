#!/usr/bin/env python3
"""Phase-2 committee briefing: per-lane metrics + concrete examples
(lexical-caught, commentary-RECOVERED, still-missed, false-alarm) + the
phase-2 threats to validity. DB-free, from the phase-2 artifacts."""
import json, re, unicodedata, collections

PALI=re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI.findall(s or "")]
def fuzzy(a,b):
    if a==b: return True
    if len(a)>=4 and len(b)>=4 and (a in b or b in a): return True
    if len(a)>=5 and len(b)>=5 and a[:5]==b[:5]: return True
    return False

metrics=json.load(open("research/out/metrics_p2.json",encoding="utf-8"))
det={r["id"]:r for r in json.load(open("research/out/detector_p2.json",encoding="utf-8"))["results"]}
ann=json.load(open("research/out/annotations_p2.json",encoding="utf-8"))
NONLEX={"register","domestication","doctrinal"}

lex_caught,recovered,still_missed,false_alarm=[],[],[],[]
for a in ann["results"]:
    pid=a["id"]; genre=a.get("genre")
    if pid not in det or det[pid].get("error"): continue
    lex=[norm(f["token"]) for f in det[pid].get("fires",[])]
    com=[norm(f["token"]) for f in det[pid].get("comm_fires",[])]
    marks=[]
    for ri,rv in enumerate(a.get("annotators") or []):
        if not rv: continue
        for cp in rv.get("choice_points",[]):
            t=set(toks(cp.get("pali","")))
            if t: marks.append((ri,t,cp.get("type","?"),cp.get("pali",""),cp.get("rationale","")[:140]))
    cl=[]
    for ri,t,ty,pali,why in marks:
        for c in cl:
            if c["tok"]&t: c["rev"].add(ri); c["tok"]|=t; c["ty"][ty]+=1; break
        else: cl.append({"rev":{ri},"tok":set(t),"ty":collections.Counter({ty:1}),"pali":pali,"why":why})
    gold=[c for c in cl if len(c["rev"])>=2]
    goldtok=set().union(*[c["tok"] for c in gold]) if gold else set()
    for c in gold:
        ty=c["ty"].most_common(1)[0][0]
        lh=any(fuzzy(ft,gt) for ft in lex for gt in c["tok"])
        ch=any(fuzzy(ft,gt) for ft in com for gt in c["tok"])
        rec={"genre":genre,"id":pid,"pali":c["pali"],"type":ty,"why":c["why"]}
        if lh: lex_caught.append(rec)
        elif ch: recovered.append(rec)
        else: still_missed.append(rec)
    for f in det[pid].get("fires",[])+det[pid].get("comm_fires",[]):
        ft=norm(f["token"])
        if not any(fuzzy(ft,gt) for gt in goldtok):
            false_alarm.append({"genre":genre,"id":pid,"token":f["token"],"lane":f.get("lane")})

def spread(items,n=12):
    by=collections.defaultdict(list)
    for it in items: by[it["genre"]].append(it)
    out=[]
    for g in by: out+=by[g][:max(1,n//max(1,len(by)))]
    return out[:n]

brief={"overall":metrics["overall"],"by_genre":metrics["by_genre"],
  "examples":{"lexical_caught":spread(lex_caught,8),
              "commentary_recovered":spread(recovered,10),
              "still_missed":spread(still_missed,12),
              "false_alarm":spread(false_alarm,12)},
  "phase1_to_phase2":"Phase 1 was rejected for: survivorship sampling, 0.97 gold-circularity, fragile headline. Phase 2: all 57 random-sample passages scored offline (long ones included); gold re-annotated WITHOUT any dictionary or English; two detector lanes (lexical + commentary) with marginal-recovery measured.",
  "threats_to_validity":[
    "No-DPD gold swings the bias the other way: annotators without a dictionary may MISS choice-points only visible via a lexical split, deflating measured recall. Is the new gold now biased AGAINST the lexical detector?",
    "The commentary lane uses bold_definitions counts; common words are glossed often, so it may fire broadly (low precision). Is its 'recovery' real signal or coincidence?",
    "n is still modest per genre; report CIs and decision-stability, do not over-claim per-genre.",
    "Annotators remain LLM agents; no-DPD removes dictionary-circularity but not model-family circularity (detector + annotators share training). Quantify residual.",
    "Fuzzy token matching still in use; report strict-match spread.",
    "DN2 calibration is the only passage with external hand-labels; everything else is LLM-gold.",
  ]}
json.dump(brief,open("research/out/committee_brief_v2.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("wrote committee_brief_v2.json — lexical_caught",len(lex_caught),
      "recovered",len(recovered),"still_missed",len(still_missed),"false_alarm",len(false_alarm))
