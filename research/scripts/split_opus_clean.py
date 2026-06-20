#!/usr/bin/env python3
import json, sys
src = json.load(open(sys.argv[1], encoding="utf-8"))
res = src.get("result") or src
if isinstance(res, str):
    res = json.loads(res)
cell = res["opus_content_lowfame_clean"]
json.dump(cell, open("research/out/opus_val_lowfame_clean_ann.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"n={cell['n']} -> research/out/opus_val_lowfame_clean_ann.json")
