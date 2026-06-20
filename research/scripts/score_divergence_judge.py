#!/usr/bin/env python3
"""Score divergence rung 2 (commitment-divergence judge) against SC comment
ground truth, count-matched, with positional + salience nulls over the judged
pool. Usage: score_divergence_judge.py <judge_ann.json>"""
import json, re, random, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
random.seed(20260612)

PALI = re.compile(r"[A-Za-zĀāĪīŪūṚṛṜṝḶḷḸḹṄṅÑñṬṭḌḍṆṇṂṃṀṁŚśṢṣḤḥĒēŌō]+")
ann = {a["id"]: a for a in json.load(open(sys.argv[1], encoding="utf-8"))["results"]}
bundles = {}
for p in ("research/data/validation_bundle.json", "research/data/lowfame_bundle.json"):
    bundles.update(json.load(open(p, encoding="utf-8")))

arms, per = [], []
obs = tot = 0
for sid, a in ann.items():
    b = bundles[sid]; C = set(b["comment_segs"]); K = len(C)
    wlen = {k: max(1, len(PALI.findall(v))) for k, v in b["segments"].items()}
    score = collections.defaultdict(list)
    for rep in a.get("reps") or []:
        if not rep: continue
        for j in rep.get("judgments", []):
            k = j.get("segment_id")
            if k in wlen:
                score[k].append(j.get("strength", 0) if j.get("commitment_divergent") else 0)
    pool = {k: sum(v) / len(v) for k, v in score.items()}
    if not pool or K == 0: continue
    flags = set(sorted(pool, key=lambda k: (-pool[k], k))[:K])
    strict = {k for k, v in pool.items() if v >= 1.0}  # both reps called it divergent
    ov = len(flags & C)
    obs += ov; tot += K
    arms.append((list(pool), C, K, wlen))
    per.append({"id": sid, "K": K, "judged": len(pool), "overlap": ov,
                "strict_divergent": len(strict), "strict_overlap": len(strict & C)})
    print(f"  {sid}: K={K} judged={len(pool)} overlap={ov} "
          f"strict={len(strict)} strict_ov={len(strict & C)}")

def null_once(salience=False):
    h = 0
    for pool, C, K, wlen in arms:
        kk = min(K, len(pool))
        if salience:
            p, w, chosen = pool[:], [wlen[s] for s in pool], set()
            for _ in range(kk):
                i = random.choices(range(len(p)), weights=w, k=1)[0]
                chosen.add(p[i]); p.pop(i); w.pop(i)
        else:
            chosen = set(random.sample(pool, kk))
        h += len(chosen & C)
    return h

pn = sorted(null_once() for _ in range(1000))
sn = sorted(null_once(True) for _ in range(1000))
res = {
    "design": "rung-2: LLM classifies human Sujato/ATI divergence as commitment vs style; count-matched top-K by mean strength; null pool = judged segments",
    "n_suttas": len(arms), "gold": tot, "observed": obs,
    "recall": round(obs / tot, 3) if tot else None,
    "pos_null": {"mean": round(sum(pn) / len(pn), 1), "ci95": [pn[24], pn[974]],
                 "p": sum(1 for x in pn if x >= obs) / len(pn)},
    "sal_null": {"mean": round(sum(sn) / len(sn), 1), "ci95": [sn[24], sn[974]],
                 "p": sum(1 for x in sn if x >= obs) / len(sn)},
    "per_sutta": per,
}
json.dump(res, open("research/out/divergence_judge_metrics.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in res.items() if k != "per_sutta"}, indent=1))
print("wrote research/out/divergence_judge_metrics.json")
