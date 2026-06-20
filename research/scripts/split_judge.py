#!/usr/bin/env python3
import json, sys
src = json.load(open(sys.argv[1], encoding="utf-8"))
res = src.get("result") or src
if isinstance(res, str):
    res = json.loads(res)
json.dump(res, open("research/out/divergence_judge_ann.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"n={res['n']} -> research/out/divergence_judge_ann.json")
