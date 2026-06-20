#!/usr/bin/env python3
"""Build the external-validation bundle from local bilara-data: for a chosen set
of comment-dense suttas, the segment-keyed Pāli (root) + the set of segments
where SC translators (sujato/brahmali) placed a comment (= expert crux-flags)."""
import json, glob, os, re

B="scripts/ingest/.cache/bilara-data"
def g(p): return [x.replace(chr(92),'/') for x in glob.glob(p, recursive=True)]
def find_one(pat):
    r=g(pat); return r[0] if r else None

cand=json.load(open("research/data/bilara_candidates.json",encoding="utf-8"))
# pick: <=55 segments, most comments, 18 suttas
chosen=[c for c in cand if c["segments"]<=55]
chosen.sort(key=lambda c:-c["comments"])
chosen=chosen[:18]

bundle={}
for c in chosen:
    sid=c["id"]
    rootf=find_one(f"{B}/root/pli/ms/**/{sid}_root-pli-ms.json")
    if not rootf: continue
    segs=json.load(open(rootf,encoding="utf-8"))
    comm=set()
    for author in ("sujato","brahmali"):
        cf=find_one(f"{B}/comment/en/{author}/**/{sid}_comment-en-{author}.json")
        if cf:
            for k,v in json.load(open(cf,encoding="utf-8")).items():
                if v and v.strip(): comm.add(k)
    # keep only content segments (drop pure headings/refs with no Pāli words)
    segs={k:v for k,v in segs.items() if v and v.strip()}
    bundle[sid]={"segments":segs,"comment_segs":sorted(comm & set(segs)),
                 "n_seg":len(segs),"n_comment":len(comm & set(segs))}

json.dump(bundle,open("research/data/validation_bundle.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
tot_seg=sum(b["n_seg"] for b in bundle.values()); tot_c=sum(b["n_comment"] for b in bundle.values())
print(f"validation set: {len(bundle)} suttas, {tot_seg} segments, {tot_c} expert-comment segments "
      f"({tot_c/tot_seg:.1%} base rate)")
for sid,b in bundle.items():
    print(f"  {sid:12s} segs={b['n_seg']:3d} comment_segs={b['n_comment']:2d}")
print("wrote research/data/validation_bundle.json")
