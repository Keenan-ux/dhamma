#!/usr/bin/env python3
"""Merge the cached-12 detector results with the recovered remaining-10, then
re-run scoring on the full 22."""
import json, subprocess, sys, os

A = "research/out/detector_results.json"       # the 12
B = "research/out/detector_results_rest.json"  # the recovered rest

def main():
    a = json.load(open(A, encoding="utf-8"))
    if os.path.exists(B):
        b = json.load(open(B, encoding="utf-8"))
        ids = {r["id"] for r in a["results"]}
        for r in b["results"]:
            if r["id"] not in ids:
                a["results"].append(r)
        json.dump(a, open(A, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"merged: now {len(a['results'])} passages in {A}")
    else:
        print(f"no {B} yet; scoring {len(a['results'])} passages")
    subprocess.run([sys.executable, "research/scripts/score.py"], check=True,
                   env={**os.environ, "PYTHONIOENCODING": "utf-8"})

if __name__ == "__main__":
    main()
