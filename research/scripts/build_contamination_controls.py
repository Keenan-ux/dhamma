#!/usr/bin/env python3
"""Build two contamination-control bundles from local bilara-data:
(1) low-fame validation arm (Brahmali Vinaya + obscure suttas) — for a
    fame-contrast on the co-location lift;
(2) memorization-probe set — commented segments (with the ACTUAL comment text)
    from the famous phase-5 suttas, to test reproduce-vs-predict."""
import json, glob, os, re

B="scripts/ingest/.cache/bilara-data"
def norm(p): return p.replace(chr(92),'/')
def sid_of(p): return re.sub(r'_(comment|translation|root)-.*$','',os.path.basename(p))
def find1(pat):
    r=[norm(x) for x in glob.glob(pat,recursive=True)]; return r[0] if r else None

# Famous suttas (high memorization risk) to EXCLUDE from the obscure arm
FAMOUS={"dn22","dn16","dn2","dn1","mn10","mn118","mn1","mn2","mn26","mn62","mn63",
 "mn72","mn140","sn56.11","sn22.59","sn12.2","sn12.1","sn12.15","sn12.23","sn45.8",
 "sn54.1","sn35.28","sn22.95","snp1.8","sn6.1","sn6.2","sn1.1","sn47.9","sn35.238",
 "mn118","an3.65","sn22.86","mn22","mn38","iti27","snp2.4"}

cand=json.load(open("research/data/bilara_candidates.json",encoding="utf-8"))

def build_bundle(ids, label):
    bundle={}
    for sid in ids:
        rootf=find1(f"{B}/root/pli/ms/**/{sid}_root-pli-ms.json")
        if not rootf: continue
        segs={k:v for k,v in json.load(open(rootf,encoding="utf-8")).items() if v and v.strip()}
        comm=set()
        for author in ("sujato","brahmali"):
            cf=find1(f"{B}/comment/en/{author}/**/{sid}_comment-en-{author}.json")
            if cf:
                for k,v in json.load(open(cf,encoding="utf-8")).items():
                    if v and v.strip(): comm.add(k)
        comm&=set(segs)
        if segs and comm:
            bundle[sid]={"segments":segs,"comment_segs":sorted(comm),
                         "n_seg":len(segs),"n_comment":len(comm)}
    return bundle

# --- (1) low-fame arm: Vinaya (brahmali) + obscure suttas ---
vinaya=["pli-tv-pvr14","pli-tv-bi-vb-np6","pli-tv-bi-vb-np8","pli-tv-bi-vb-pc54",
        "pli-tv-bu-vb-pc15","pli-tv-bu-vb-pc59","pli-tv-bu-vb-sk45"]
obscure=[c["id"] for c in cand if c["id"] not in FAMOUS and c["segments"]<=55
         and c["comments"]>=6 and not c["id"].startswith(("dn","mn1","snp"))][:16]
lowfame=build_bundle(vinaya+obscure,"lowfame")
json.dump(lowfame,open("research/data/lowfame_bundle.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
ts=sum(b["n_seg"] for b in lowfame.values()); tc=sum(b["n_comment"] for b in lowfame.values())
print(f"(1) LOW-FAME arm: {len(lowfame)} units, {ts} segs, {tc} comment segs ({tc/ts:.0%} base)")
print("    ids:", list(lowfame.keys()))

# --- (2) memorization probe: commented segs from famous phase-5 suttas + actual text ---
fam=json.load(open("research/data/validation_bundle.json",encoding="utf-8"))
probe=[]
for sid,b in fam.items():
    # load actual comment text
    ctext={}
    for author in ("sujato","brahmali"):
        cf=find1(f"{B}/comment/en/{author}/**/{sid}_comment-en-{author}.json")
        if cf:
            for k,v in json.load(open(cf,encoding="utf-8")).items():
                if v and v.strip(): ctext[k]=v.strip()
    for seg in b["comment_segs"][:2]:   # up to 2 per sutta -> spread
        if seg in ctext and seg in b["segments"]:
            probe.append({"sutta":sid,"seg":seg,"pali":b["segments"][seg],
                          "comment":ctext[seg]})
probe=probe[:30]
json.dump(probe,open("research/data/memprobe_set.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print(f"\n(2) MEMORIZATION PROBE: {len(probe)} commented segments (famous suttas) with actual comment text")
