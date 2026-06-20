#!/usr/bin/env python3
"""Split the cross-family-cells workflow result into per-cell ann files."""
import json, sys

src = json.load(open(sys.argv[1], encoding="utf-8"))
res = src.get("result") or src   # task wrapper or bare result
if isinstance(res, str):
    res = json.loads(res)

cells = {
    "fable_content_famous": "out/fable_val_famous_ann.json",
    "fable_content_lowfame": "out/fable_val_lowfame_ann.json",
    "fable_loc_famous": "out/fable_locprobe_famous_ann.json",
    "fable_loc_lowfame": "out/fable_locprobe_lowfame_ann.json",
    "opus_loc_lowfame": "out/opus_locprobe_clean_lowfame_ann.json",
}
for key, path in cells.items():
    cell = res[key]
    with open(f"research/{path}", "w", encoding="utf-8") as f:
        json.dump(cell, f, ensure_ascii=False, indent=1)
    print(f"{key}: n={cell['n']} -> research/{path}")
