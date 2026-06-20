#!/usr/bin/env python3
"""Split the lowfame arms into truly-obscure Vinaya vs SN/MN sub-strata.
Computes with-content recall (consensus >=2/3) and location-only recall
per subset, per family. Writes research/out/vinaya_slice.json"""
import json, collections

bundle = json.load(open("research/data/lowfame_bundle.json", encoding="utf-8"))
VIN = {sid for sid in bundle if sid.startswith("pli-tv")}

def content_recall(ann_path, subset):
    ann = {a["id"]: a for a in json.load(open(ann_path, encoding="utf-8"))["results"]}
    ov = tot = flagged = 0
    for sid in subset:
        if sid not in ann: continue
        b = bundle[sid]; S = set(b["segments"].keys()); C = set(b["comment_segs"])
        cnt = collections.Counter()
        for rv in ann[sid].get("annotators") or []:
            if not rv: continue
            for cs in rv.get("choice_segments", []):
                if cs.get("segment_id") in S: cnt[cs["segment_id"]] += 1
        M = {s for s, c in cnt.items() if c >= 2}
        ov += len(M & C); tot += len(C); flagged += len(M)
    return {"overlap": ov, "comment_segs": tot, "flagged": flagged,
            "recall": round(ov / tot, 3) if tot else None}

def loc_recall(ann_path, subset):
    ann = {a["id"]: a for a in json.load(open(ann_path, encoding="utf-8"))["results"]}
    ov = tot = 0.0
    for sid in subset:
        if sid not in ann: continue
        b = bundle[sid]; S = set(b["segments"].keys()); C = set(b["comment_segs"])
        ovs = []
        for p in ann[sid].get("preds") or []:
            if not p: continue
            pred = set(x for x in (p.get("predicted_segments") or []) if x in S)
            ovs.append(len(pred & C))
        if ovs: ov += sum(ovs) / len(ovs); tot += len(C)
    return {"recall": round(ov / tot, 3) if tot else None}

SN = set(bundle) - VIN
out = {}
for fam, cpath, lpath in [
    ("opus_clean", "research/out/opus_val_lowfame_clean_ann.json", "research/out/opus_locprobe_clean_lowfame_ann.json"),
    ("fable", "research/out/fable_val_lowfame_ann.json", "research/out/fable_locprobe_lowfame_ann.json"),
]:
    row = {}
    for name, subset in [("vinaya", VIN), ("sn_mn", SN)]:
        loc = loc_recall(lpath, subset)["recall"]
        wc = content_recall(cpath, subset)["recall"]
        row[name] = {"with_content": wc, "location_only": loc,
                     "content_advantage": round(wc - loc, 3) if wc is not None and loc is not None else None}
    out[fam] = row

json.dump(out, open("research/out/vinaya_slice.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps(out, indent=1))
