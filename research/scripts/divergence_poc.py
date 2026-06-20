#!/usr/bin/env python3
"""Divergence-lane PoC (preregistered discipline, 2026-06-12).

Signal: where two human translators (Sujato vs ATI) diverge most after
monotonic sentence-segment alignment, that segment is a candidate
choice-point. Deterministic — no LLM anywhere in the pipeline.

Test: on the suttas that have BOTH an ATI translation (divergence_mirror)
and SC expert-comment ground truth (validation/lowfame bundles), flag the
K most divergent segments per sutta (K = that sutta's comment count —
count-matched by design, avoiding the volume asymmetry the cross-family
viva flagged) and test overlap against positional + length-salience
permutation nulls. Same discipline that killed the commentary lane.

Writes research/out/divergence_poc.json
"""
import json, re, math, html, collections, random, glob, os, sys
sys.stdout.reconfigure(encoding="utf-8")
random.seed(20260612)

BILARA = "scripts/ingest/.cache/bilara-data/translation/en/sujato/sutta"
STOP = set("""a an the and or but of to in on at for with by from as is are was were be been being
this that these those it its he she his her they them their i you we us our your not no nor so
then than too very just there here when where what who whom which while shall should would could
may might must can will do does did done have has had having if because about into over under
again further once only own same such both each few more most other some any all""".split())

def content_words(text):
    toks = re.findall(r"[a-zA-ZÀ-ɏḀ-ỿ']+", text.lower())
    return [t for t in toks if t not in STOP and len(t) > 1]

def tf(words):
    c = collections.Counter(words)
    n = math.sqrt(sum(v * v for v in c.values())) or 1.0
    return c, n

def cos(a, b):
    ca, na = a; cb, nb = b
    if not ca or not cb: return 0.0
    dot = sum(v * cb.get(k, 0) for k, v in ca.items())
    return dot / (na * nb)

def strip_html(t):
    t = html.unescape(t)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def split_sentences(t):
    # crude but deterministic; quotes kept attached
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z“\"'])", t)
    return [p.strip() for p in parts if len(content_words(p)) >= 2]

def sujato_segments(sid):
    hits = glob.glob(f"{BILARA}/**/{sid}_translation-en-sujato.json", recursive=True)
    if not hits: return None
    segs = json.load(open(hits[0], encoding="utf-8"))
    return {k: v.strip() for k, v in segs.items() if v.strip()}

def align(ati_sents, seg_ids, seg_tf):
    """Monotonic DP: assign each ATI sentence to one segment (or skip),
    maximizing total similarity. Returns {seg_id: [sent indices]}."""
    S, T = len(ati_sents), len(seg_ids)
    sent_tf = [tf(content_words(s)) for s in ati_sents]
    sim = [[cos(sent_tf[i], seg_tf[seg_ids[j]]) for j in range(T)] for i in range(S)]
    # dp[i][j]: best score using sentences[..i) and allowing segments[..j)
    NEG = -1e9
    dp = [[0.0] * (T + 1) for _ in range(S + 1)]
    bk = [[None] * (T + 1) for _ in range(S + 1)]
    for i in range(1, S + 1):
        for j in range(1, T + 1):
            best, arg = dp[i][j - 1], ("skipseg",)          # advance segment
            v = dp[i - 1][j] - 0.05                          # drop sentence (small penalty)
            if v > best: best, arg = v, ("dropsent",)
            v = dp[i - 1][j] + sim[i - 1][j - 1]             # assign sent i-1 to seg j-1
            if v > best: best, arg = v, ("assign",)
            dp[i][j], bk[i][j] = best, arg
        dp[i][0], bk[i][0] = dp[i - 1][0] - 0.05, ("dropsent",)
    out = collections.defaultdict(list)
    i, j = S, T
    while i > 0 or j > 0:
        a = bk[i][j] if j > 0 or i > 0 else None
        if j > 0 and (i == 0 or bk[i][j] == ("skipseg",)):
            j -= 1
        elif bk[i][j] == ("dropsent",):
            i -= 1
        else:
            out[seg_ids[j - 1]].append(i - 1); i -= 1
    return out, sim

def main():
    mirror = json.load(open("research/data/divergence_mirror.json", encoding="utf-8"))
    bundles = {}
    for p in ("research/data/validation_bundle.json", "research/data/lowfame_bundle.json"):
        bundles.update(json.load(open(p, encoding="utf-8")))
    test_ids = sorted(set(mirror) & set(bundles))
    print(f"test suttas (ATI ∩ comment-ground-truth): {test_ids}")

    per, obs, tot = [], 0.0, 0
    arms = []
    for sid in test_ids:
        segs_en = sujato_segments(sid)
        if not segs_en: print(f"  {sid}: no sujato bilara file, skipped"); continue
        b = bundles[sid]
        seg_ids = [k for k in b["segments"] if k in segs_en]
        if not seg_ids: continue
        seg_tf = {k: tf(content_words(segs_en[k])) for k in seg_ids}
        C = set(b["comment_segs"]); K = len(C)
        if K == 0: continue
        atis = [t for t in mirror[sid]["translations"] if t["source"] == "ati"]
        # divergence per segment, averaged over ATI translators that cover it
        div = {}
        for t in atis:
            sents = split_sentences(strip_html(t["text"]))
            if not sents: continue
            assign, sim = align(sents, seg_ids, seg_tf)
            for j, k in enumerate(seg_ids):
                idxs = assign.get(k, [])
                if idxs:
                    merged = tf(content_words(" ".join(sents[i] for i in idxs)))
                    d = 1.0 - cos(merged, seg_tf[k])
                else:
                    continue  # uncovered: no divergence evidence (omission excluded)
                div.setdefault(k, []).append(d)
        scored = {k: sum(v) / len(v) for k, v in div.items()}
        coverage = len(scored) / len(seg_ids)
        flags = set(sorted(scored, key=lambda k: -scored[k])[:K])
        ov = len(flags & C)
        obs += ov; tot += K
        arms.append((seg_ids, C, K, {k: len(content_words(segs_en[k])) for k in seg_ids}, scored))
        per.append({"id": sid, "K": K, "overlap": ov, "coverage": round(coverage, 2),
                    "flagged": sorted(flags)[:50]})
        print(f"  {sid}: K={K} overlap={ov} coverage={coverage:.2f}")

    # positional null: K random segments per sutta (from scored pool, to be fair:
    # divergence can only flag covered segments — null draws from the same pool)
    def null_once(salience=False):
        h = 0
        for seg_ids, C, K, wlen, scored in arms:
            pool = list(scored) if scored else seg_ids
            kk = min(K, len(pool))
            if salience:
                p, w, chosen = pool[:], [max(1, wlen[s]) for s in pool], set()
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
        "design": "count-matched (K = comment count); null pool = covered segments only",
        "n_suttas": len(arms), "gold_comment_segs": tot, "observed_overlap": obs,
        "recall": round(obs / tot, 3) if tot else None,
        "pos_null": {"mean": round(sum(pn) / len(pn), 1), "ci95": [pn[24], pn[974]],
                     "p": sum(1 for x in pn if x >= obs) / len(pn)},
        "sal_null": {"mean": round(sum(sn) / len(sn), 1), "ci95": [sn[24], sn[974]],
                     "p": sum(1 for x in sn if x >= obs) / len(sn)},
        "per_sutta": per,
    }
    json.dump(res, open("research/out/divergence_poc.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in res.items() if k != "per_sutta"}, indent=1))
    print("wrote research/out/divergence_poc.json")

main()
