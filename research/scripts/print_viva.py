#!/usr/bin/env python3
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
res = json.load(open("research/out/crossfamily_viva.json", encoding="utf-8"))
for i, m in enumerate(res["synthesis"]["must_fix"]):
    print(f"[{i}] {m}\n")
