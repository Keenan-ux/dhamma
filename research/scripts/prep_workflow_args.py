#!/usr/bin/env python3
"""Assemble the compact args object the dn2-slice workflow consumes.
Pulls from dn2_slice.json (segments + real evidence packets) + the Thanissaro
opening block (divergence lane). Emits research/out/dn2_workflow_args.json."""
import json, io, re, sys
sys.stdout.reconfigure(encoding="utf-8")

slice_ = json.load(io.open("research/out/dn2_slice.json", encoding="utf-8"))
mirror = json.load(io.open("research/data/divergence_mirror.json", encoding="utf-8"))

# Thanissaro opening block (strip html, take the narrative through the ministers)
th = next(t["text"] for t in mirror["dn2"]["translations"] if t["translator"] == "thanissaro")
th = re.sub(r"<[^>]+>", " ", th)
i = th.find("I have heard")
if i < 0: i = th.lower().find("on that occasion")
th_open = re.sub(r"\s+", " ", th[i:i + 1600]).strip() if i >= 0 else th[:1600]

# adversarial rendering-pairs (the poles each brief argues FOR)
CANDIDATES = {
    "pasada": ["palace / mansion", "longhouse"],
    "uposatha": ["sabbath", "observance day / uposatha day"],
    "payirupasati": ["wait upon / attend closely", "pay homage"],
    "gana": ["company / following", "community"],
    "vedehiputta": ["son of the Videhan lady (Queen Videha)", "son of the wise woman (vedehī = paṇḍitā)"],
}

gold = []
for g in slice_["gold"]:
    seg = next(s for s in slice_["segments"] if s["id"] == g["segment"])
    gold.append({
        "id": g["id"], "lemma": g["lemma"], "surface": g["surface"],
        "type": g["type"], "segment_id": g["segment"], "segment_pli": seg["pli"],
        "candidates": CANDIDATES[g["id"]],
    })

# trim packets to what a brief needs
packets = {}
for gid, p in slice_["evidence_packets"].items():
    packets[gid] = {
        "lemma": p["lemma"], "surface": p["surface"],
        "dpd_headwords": [{"lemma": h["lemma"], "pos": h["pos"], "grammar": h["grammar"],
                           "meaning_1": h["meaning_1"], "meaning_2": h["meaning_2"],
                           "meaning_lit": h["meaning_lit"], "construction": h["construction"],
                           "sanskrit": h["sanskrit"]} for h in p["dpd_headwords"]],
        "commentary_bold": [{"ref_code": r["ref_code"], "book": r["book"],
                             "commentary": (r["commentary"] or "")[:400]} for r in p["commentary_bold"]],
    }

segments = [{"id": s["id"], "pli": s["pli"], "sujato": s["sujato"]} for s in slice_["segments"]]

args = {"segments": segments, "thanissaro_opening": th_open, "gold": gold, "packets": packets}
json.dump(args, io.open("research/out/dn2_workflow_args.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print("segments:", len(segments), "| gold:", len(gold), "| packets:", len(packets))
print("thanissaro_opening chars:", len(th_open))
print("args bytes:", len(json.dumps(args, ensure_ascii=False)))
print("wrote research/out/dn2_workflow_args.json")
