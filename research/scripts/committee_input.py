#!/usr/bin/env python3
"""Build a compact briefing for the adversarial committee (the viva) from the
full results: per-genre metrics, concrete example cases (caught / missed /
false-alarm), and the known threats-to-validity it must scrutinize."""
import json, re, unicodedata, collections

PALI_RE = re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
def norm(s): return unicodedata.normalize("NFC", s or "").lower()
def toks(s): return [norm(t) for t in PALI_RE.findall(s or "")]
def fuzzy(a,b):
    if a==b: return True
    if len(a)>=4 and len(b)>=4 and (a in b or b in a): return True
    if len(a)>=5 and len(b)>=5 and a[:5]==b[:5]: return True
    return False

def main():
    metrics=json.load(open("research/out/metrics.json",encoding="utf-8"))
    ann=json.load(open("research/out/annotations.json",encoding="utf-8"))
    det={r["id"]:r for r in json.load(open("research/out/detector_results.json",encoding="utf-8"))["results"]}

    caught, missed, false_alarm = [], [], []
    for a in ann["results"]:
        pid=a["id"]; genre=a.get("genre")
        if pid not in det: continue
        fires=[norm(f["token"]) for f in det[pid].get("fires",[])]
        # consensus gold clusters
        marks=[]
        for ri,rv in enumerate(a.get("annotators") or []):
            if not rv: continue
            for cp in rv.get("choice_points",[]):
                t=set(toks(cp.get("pali","")))
                if t: marks.append((ri,t,cp.get("type","?"),cp.get("pali",""),cp.get("rationale","")[:160]))
        clusters=[]
        for ri,t,ty,pali,why in marks:
            for c in clusters:
                if c["tok"]&t: c["rev"].add(ri); c["tok"]|=t; c["ty"][ty]+=1; break
            else: clusters.append({"rev":{ri},"tok":set(t),"ty":collections.Counter({ty:1}),"pali":pali,"why":why})
        gold=[c for c in clusters if len(c["rev"])>=2]
        goldtok=set().union(*[c["tok"] for c in gold]) if gold else set()
        for c in gold:
            ty=c["ty"].most_common(1)[0][0]
            hit=any(fuzzy(ft,gt) for ft in fires for gt in c["tok"])
            rec={"genre":genre,"id":pid,"pali":c["pali"],"type":ty,"why":c["why"]}
            (caught if hit else missed).append(rec)
        for f in det[pid].get("fires",[]):
            ft=norm(f["token"])
            if not any(fuzzy(ft,gt) for gt in goldtok):
                false_alarm.append({"genre":genre,"id":pid,"token":f["token"],
                                    "lemma":f.get("lemma"),"senses":f.get("senses",[])[:2]})

    # keep a spread across genres
    def spread(items,n=12):
        by=collections.defaultdict(list)
        for it in items: by[it["genre"]].append(it)
        out=[];
        for g in by: out+=by[g][:max(1,n//max(1,len(by)))]
        return out[:n]

    brief={
        "overall":metrics["overall"],
        "by_genre":metrics["by_genre"],
        "examples":{
            "caught":spread(caught,10),
            "missed":spread(missed,12),
            "false_alarm":spread(false_alarm,12),
        },
        "threats_to_validity":[
            "The 4 offline-scored genres (abhidhamma/anya/atthakatha/khuddaka) are the passages that happened to finish before the DB outage — NOT a random draw; sutta/tika/vinaya were added only after recovery. Check for selection bias.",
            "n=3 passages per genre is tiny; per-genre recall has wide uncertainty. Is any per-genre claim decision-stable under the wobble rule, or premature?",
            "Gold = >=2/3 annotators. IAA is only ~0.5 in several genres. Does low inter-annotator agreement make 'recall against gold' ill-defined there?",
            "Detector/gold matching uses fuzzy token overlap (substring / 5-char prefix). Could this inflate recall (loose matches) or deflate it (lemma vs surface form)?",
            "Precision 0.22-0.39 reflects a deliberate over-flag bias. Is reporting it as 'false-alarm rate' misleading without the readability-toggle context?",
            "Annotators are LLM agents used as human proxies. Does that make the 'gold' circular w.r.t. an LLM detector? Is the blind-spot finding robust to this?",
        ],
    }
    json.dump(brief,open("research/out/committee_brief.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
    print("wrote research/out/committee_brief.json")
    print("caught:",len(caught)," missed:",len(missed)," false_alarm:",len(false_alarm))

if __name__=="__main__":
    main()
