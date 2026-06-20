#!/usr/bin/env python3
"""Survey local SC bilara-data to pick the external-validation set: suttas with
(a) enough expert comments (sujato/brahmali = human crux-flags) and
(b) multiple English translations (for divergence), at tractable length."""
import json, glob, os, collections, re

B="scripts/ingest/.cache/bilara-data"

def sutta_id_from_path(p):
    m=re.search(r'/(?:sutta|vinaya|kn|sutta-..)/.*?([a-z0-9.\-]+)_(?:comment|translation|root)-', p)
    base=os.path.basename(p)
    return re.sub(r'_(comment|translation|root)-.*$','',base)

# comments per sutta (expert crux-flags)
comments=collections.Counter()
for author in ("sujato","brahmali"):
    for f in [x.replace(chr(92),'/') for x in glob.glob(f"{B}/comment/en/{author}/**/*.json", recursive=True)]:
        sid=sutta_id_from_path(f)
        try: d=json.load(open(f,encoding="utf-8"))
        except: continue
        comments[sid]+=len([k for k,v in d.items() if v and v.strip()])

# translators per sutta + root segment count
translators=collections.defaultdict(set)
for f in [x.replace(chr(92),'/') for x in glob.glob(f"{B}/translation/en/**/*.json", recursive=True)]:
    sid=sutta_id_from_path(f); auth=f.split("/translation/en/")[1].split("/")[0]
    translators[sid].add(auth)
rootsegs={}
for f in [x.replace(chr(92),'/') for x in glob.glob(f"{B}/root/pli/ms/**/*.json", recursive=True)]:
    sid=sutta_id_from_path(f)
    try: rootsegs[sid]=len(json.load(open(f,encoding="utf-8")))
    except: pass

# candidates: have comments, reasonable length
cand=[]
for sid,nc in comments.items():
    nt=len(translators.get(sid,set())); ns=rootsegs.get(sid,0)
    if nc>=4 and 0<ns<=80:
        cand.append((sid,nc,nt,ns))
cand.sort(key=lambda x:(-x[2],-x[1]))  # prefer multi-translator, then comment-dense
print(f"candidate suttas (comments>=4, <=80 segs): {len(cand)}")
print(f"{'sutta':12s} {'comments':>8s} {'translators':>11s} {'segments':>8s}")
for sid,nc,nt,ns in cand[:30]:
    print(f"{sid:12s} {nc:>8d} {nt:>11d} {ns:>8d}")
multi=[c for c in cand if c[2]>=2]
print(f"\nwith >=2 translators (divergence-capable): {len(multi)}")
json.dump([{"id":c[0],"comments":c[1],"translators":c[2],"segments":c[3]} for c in cand],
          open("research/data/bilara_candidates.json","w",encoding="utf-8"),indent=1)
print("wrote research/data/bilara_candidates.json")
