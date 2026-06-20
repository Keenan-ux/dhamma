#!/usr/bin/env python3
"""Deterministic, seeded, stratified random sample of passage ids.

Reproducible without an RNG: order each stratum by md5(seed + id) and take
the first N. Same seed + same corpus snapshot => identical sample, so anyone
can re-draw it. Writes research/data/sample.json.

Usage:
  python research/scripts/sample.py [N_PER_STRATUM] [SEED]
"""
import json, sys, hashlib, collections

N = int(sys.argv[1]) if len(sys.argv) > 1 else 8
SEED = sys.argv[2] if len(sys.argv) > 2 else "dhamma-cpd-2026-06-07"

# Always-include calibration passages (the 2026-06-06 hand-labeled gold set
# lives in DN 2; include it so the detector is exercised on known answers).
CALIBRATION = ["dn2"]

def rank(seed, pid):
    return hashlib.md5((seed + "|" + pid).encode("utf-8")).hexdigest()

def main():
    with open("research/data/passage_index.json", encoding="utf-8") as f:
        idx = json.load(f)
    by_genre = collections.defaultdict(list)
    for p in idx:
        by_genre[p["genre"]].append(p["id"])

    sample = []
    seen = set()
    for genre in sorted(by_genre):
        ids = sorted(by_genre[genre], key=lambda pid: rank(SEED, pid))
        picked = ids[:N]
        for pid in picked:
            if pid not in seen:
                sample.append({"id": pid, "genre": genre})
                seen.add(pid)
    # calibration
    cal_index = {p["id"]: p["genre"] for p in idx}
    for pid in CALIBRATION:
        if pid not in seen:
            sample.append({"id": pid, "genre": cal_index.get(pid, "sutta"),
                           "calibration": True})
            seen.add(pid)

    out = {
        "seed": SEED,
        "n_per_stratum": N,
        "corpus_snapshot": "/api/corpus @ dhamma.fly.dev 2026-06-07",
        "strata": sorted(by_genre),
        "count": len(sample),
        "passages": sample,
    }
    with open("research/data/sample.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
    dist = collections.Counter(p["genre"] for p in sample)
    print(f"seed={SEED}  N={N}  total={len(sample)}")
    for g in sorted(dist):
        print(f"  {g:12s} {dist[g]}")
    print("wrote research/data/sample.json")

if __name__ == "__main__":
    main()
