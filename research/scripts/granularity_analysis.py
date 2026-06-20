#!/usr/bin/env python3
"""Granularity analysis — threshold/fusion search + leave-one-passage-out + null.

Reads the workflow output (research/out/granularity_result.json) + the two
deterministic slices, then computes (deterministically, by the coordinator — not
trusting any sub-chat) per PREREGISTRATION_granularity.md:

  - GOLD per passage: the 5-grader majority label {commitment|weak|style|spurious}
    over the pooled candidate spans + grader IAA.
  - DETECTOR lane fires per span: lexical (slice), divergence (6-rep prob+strength),
    source-critic (3-agent count). Matched to pool items by normalized lemma.
  - Per-unit metrics (segment vs span): commitment-recall, precision, flood ratio.
  - Threshold sweep on the divergence lane + fusion rules.
  - LEAVE-ONE-PASSAGE-OUT (the headline): fit rule params on one passage, score
    held-out on the other; both directions.
  - Permutation null (1000x, count-matched random spans).
  - Herd-blind-spot recovery: commitment-gold divergence missed, that critic caught.

Run from repo root:  python research/scripts/granularity_analysis.py
"""
import json, io, sys, re, random, unicodedata, collections, itertools

sys.stdout.reconfigure(encoding="utf-8")
random.seed(20260613)

RESULT = "research/out/granularity_result.json"
DN2 = "research/out/dn2_slice.json"
SN36 = "research/out/sn36_slice.json"
OUT = "research/out/granularity_metrics.json"
PASSAGES = ["dn2", "sn36.21"]

def norm(s):
    s = unicodedata.normalize("NFC", (s or "")).lower()
    return re.sub(r"[^a-zāīūṛṝḷḹṅñṭḍṇṁṃśṣḥ]", "", s)

def matchkey(a, b):
    """fuzzy span/lemma identity: equal or one contains the other (>=4 chars)."""
    a, b = norm(a), norm(b)
    if not a or not b: return False
    return a == b or (len(a) >= 4 and len(b) >= 4 and (a in b or b in a))

# ---------------- load ----------------
res = json.load(io.open(RESULT, encoding="utf-8"))
slices = {"dn2": json.load(io.open(DN2, encoding="utf-8")),
          "sn36.21": json.load(io.open(SN36, encoding="utf-8"))}
detect = res["detect"]
pools = res["pools"]
grades = res["grades"]

def seg_pli_map(pid):
    return {s["id"]: s["pli"] for s in slices[pid]["segments"]}

# ---------------- GOLD: 5-grader majority over the pool ----------------
def build_gold(pid):
    pool = pools[pid]
    by_idx = {p["idx"]: p for p in pool}
    votes = collections.defaultdict(list)
    for g in grades:
        if g["pid"] != pid: continue
        for gr in g.get("grades", []):
            if gr.get("idx") in by_idx and gr.get("label"):
                votes[gr["idx"]].append(gr["label"])
    gold = {}
    for idx, p in by_idx.items():
        vs = votes.get(idx, [])
        if not vs:
            label, conf = "ungraded", 0.0
        else:
            cnt = collections.Counter(vs)
            label, n = cnt.most_common(1)[0]
            conf = n / len(vs)
        gold[idx] = {**p, "label": label, "votes": vs, "conf": round(conf, 2)}
    return gold, by_idx

def grader_iaa(pid):
    """mean pairwise agreement: (a) exact 4-label, (b) commitment-vs-not binary."""
    per = {}
    for g in grades:
        if g["pid"] != pid: continue
        per[g["k"]] = {gr["idx"]: gr["label"] for gr in g.get("grades", []) if gr.get("label")}
    ks = list(per)
    ex, bi = [], []
    for a, b in itertools.combinations(ks, 2):
        shared = set(per[a]) & set(per[b])
        if not shared: continue
        ex.append(sum(per[a][i] == per[b][i] for i in shared) / len(shared))
        bi.append(sum((per[a][i] == "commitment") == (per[b][i] == "commitment") for i in shared) / len(shared))
    return {"exact_label": round(sum(ex) / len(ex), 3) if ex else None,
            "commitment_binary": round(sum(bi) / len(bi), 3) if bi else None,
            "n_graders": len(ks)}

# ---------------- DETECTOR lane fires, matched to pool idx ----------------
def lane_fires(pid, gold, by_idx):
    pool = list(by_idx.values())
    # Collect each role's per-unit term sets. Aggregation is done by MATCHING a
    # rep/agent's terms to the pool item (fuzzy), NOT by exact normalized key —
    # so surface variants (opakkamika / opakkamikāni / "X (Y)") of one concept
    # merge instead of fragmenting the rep-count (the bug the dump exposed).
    div_reps_terms = collections.defaultdict(list)   # rep_k -> [(termkey, strength)]
    critic_terms = collections.defaultdict(set)      # agent_k -> {termkey}
    annot_terms = collections.defaultdict(set)        # agent_k -> {termkey}
    ndiv = ncrit = nann = 0
    for d in detect:
        if d["pid"] != pid: continue
        if d["role"] == "div":
            ndiv += 1
            for f in d.get("found", []):
                k = norm(f.get("pali_term") or f.get("span") or f.get("lemma"))
                if k: div_reps_terms[d["k"]].append((k, f.get("strength", 1)))
        elif d["role"] == "critic":
            ncrit += 1
            for f in d.get("found", []):
                k = norm(f.get("lemma") or f.get("span"))
                if k: critic_terms[d["k"]].add(k)
        elif d["role"] == "annot":
            nann += 1
            for f in d.get("found", []):
                k = norm(f.get("lemma") or f.get("span"))
                if k: annot_terms[d["k"]].add(k)
    # lexical lane from the slice (token fires) -> match to pool, else "unpooled"
    lex_tokens = []
    for s in slices[pid]["segments"]:
        for f in s["fires"]["lexical"]:
            lex_tokens.append((f.get("lemma") or f["token"], f["token"], s["id"]))

    # attach per-pool-item lane signals — write to the GOLD dict objects (the ones
    # scoring reads), NOT the by_idx copies (build_gold made gold a separate copy).
    for idx in by_idx:
        p = gold[idx]
        keys = [norm(p["lemma"]), norm(p["span"])]
        def hits(termset): return any(matchkey(t, k) for t in termset for k in keys)
        reps_hit, strengths = 0, []
        for repk, terms in div_reps_terms.items():
            matched = [s for (t, s) in terms if any(matchkey(t, k) for k in keys)]
            if matched: reps_hit += 1; strengths.append(max(matched))
        p["div_reps"] = reps_hit
        p["div_strength_max"] = max(strengths, default=0)
        p["div_strength_mean"] = round(sum(strengths) / len(strengths), 2) if strengths else 0
        p["critic_n"] = sum(1 for ts in critic_terms.values() if hits(ts))
        p["annot_n"] = sum(1 for ts in annot_terms.values() if hits(ts))
        p["lexical"] = any(matchkey(lt[0], k) or matchkey(lt[1], k) for lt in lex_tokens for k in keys)
    # lexical fires not in pool (function-word floods) -> phantom FPs
    pooled_lex = 0
    lex_unpooled = []
    for lem, tok, seg in lex_tokens:
        if any(matchkey(lem, norm(p["lemma"])) or matchkey(tok, norm(p["span"])) for p in pool):
            pooled_lex += 1
        else:
            lex_unpooled.append((tok, seg))
    return {"n_div_reps": ndiv, "n_critic": ncrit, "n_annot": nann,
            "lex_unpooled": lex_unpooled, "lex_total_tokens": len(lex_tokens)}

# ---------------- concept merge ----------------
# The workflow JS dedup left duplicate CONCEPTS (divergence names the surface form
# `vedehiputto`/`opakkamikāni`; annotators name the lemma `vedehiputta`/`opakkamika`
# — not substrings, so they survived as separate pool items). Merge them so the
# gold counts distinct CONCEPTS, not surface variants (else recall/precision skew).
def merge_concepts(gold):
    items = list(gold.values())
    parent = {p["idx"]: p["idx"] for p in items}
    def find(x):
        while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
        return x
    def union(a, b): parent[find(a)] = find(b)
    def keysof(p):  # the identity TOKENS (split compound/slash spans into words)
        toks = re.findall(r"[a-zāīūṛṝḷḹṅñṭḍṇṁṃśṣḥ]+",
                          unicodedata.normalize("NFC", f"{p['lemma']} {p['span']}").lower())
        return [t for t in toks if len(t) >= 4]
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            ki, kj = keysof(items[i]), keysof(items[j])
            if any(matchkey(a, b) for a in ki for b in kj):
                union(items[i]["idx"], items[j]["idx"])
    groups = collections.defaultdict(list)
    for p in items: groups[find(p["idx"])].append(p)
    merged = {}
    for gid, members in groups.items():
        allvotes = [v for m in members for v in m["votes"]]
        if allvotes:
            cnt = collections.Counter(allvotes); label, n = cnt.most_common(1)[0]; conf = round(n / len(allvotes), 2)
        else:
            label, conf = "ungraded", 0.0
        rep = min(members, key=lambda m: len(norm(m["lemma"]) or m["span"]))
        merged[gid] = {
            "idx": gid, "lemma": rep["lemma"], "span": rep["span"],
            "segment_id": next((m["segment_id"] for m in members if m["segment_id"]), ""),
            "label": label, "conf": conf, "votes": allvotes, "n_merged": len(members),
            "div_reps": max(m.get("div_reps", 0) for m in members),
            "div_strength_max": max(m.get("div_strength_max", 0) for m in members),
            "critic_n": max(m.get("critic_n", 0) for m in members),
            "annot_n": max(m.get("annot_n", 0) for m in members),
            "lexical": any(m.get("lexical") for m in members),
            "sources": sorted(set(s for m in members for s in m.get("sources", []))),
        }
    return merged

# ---------------- scoring ----------------
def commitment_set(gold, include_weak=False):
    s = set()
    for idx, g in gold.items():
        if g["label"] == "commitment" or (include_weak and g["label"] == "weak"):
            s.add(idx)
    return s

def fires_of(gold, rule):
    return set(idx for idx, g in gold.items() if rule(g))

def score(gold, fired, target):
    tp = len(fired & target)
    rec = tp / len(target) if target else 0.0
    prec = tp / len(fired) if fired else 0.0
    flood = round(len(fired) / len(target), 2) if target else None
    return {"recall": round(rec, 3), "precision": round(prec, 3),
            "flood_ratio": flood, "n_fired": len(fired),
            "n_gold": len(target), "tp": tp}

# rule families (parameterized for LOO)
def rule_div(T):       return lambda g: g.get("div_reps", 0) >= T
def rule_div_str(S):   return lambda g: g.get("div_strength_max", 0) >= S
def rule_lexical():    return lambda g: g.get("lexical", False)
def rule_critic(T):    return lambda g: g.get("critic_n", 0) >= T
def rule_fusion_or(Td, Tc):  return lambda g: g.get("div_reps", 0) >= Td or g.get("critic_n", 0) >= Tc
def rule_fusion_and(Td, Tc): return lambda g: g.get("div_reps", 0) >= Td and g.get("critic_n", 0) >= Tc

# ---------------- segment-level projection ----------------
def segment_metrics(pid, gold, rule, target):
    seg_gold, seg_fire = set(), set()
    for idx, g in gold.items():
        seg = g.get("segment_id") or ""
        if idx in target: seg_gold.add(seg)
        if rule(g): seg_fire.add(seg)
    seg_gold.discard("");
    tp = len(seg_fire & seg_gold)
    return {"recall": round(tp / len(seg_gold), 3) if seg_gold else 0.0,
            "precision": round(tp / len(seg_fire), 3) if seg_fire else 0.0,
            "flood_ratio": round(len(seg_fire) / len(seg_gold), 2) if seg_gold else None,
            "n_seg_fired": len(seg_fire), "n_seg_gold": len(seg_gold)}

def perm_null(gold, n_fire, target, observed_tp, trials=1000):
    idxs = list(gold)
    if n_fire == 0 or not target: return {"mean": 0, "p": 1.0, "ci95": [0, 0]}
    hits = []
    for _ in range(trials):
        pick = set(random.sample(idxs, min(n_fire, len(idxs))))
        hits.append(len(pick & target))
    hits.sort()
    return {"mean": round(sum(hits) / len(hits), 2), "ci95": [hits[24], hits[974]],
            "p": round(sum(1 for h in hits if h >= observed_tp) / trials, 4)}

def main():
    report = {"passages": {}, "leave_one_out": {}, "params": {"div_reps": 6, "critic_k": 3, "annot_k": 4, "grade_k": 5}}
    G, GS = {}, {}
    for pid in PASSAGES:
        gold0, by_idx = build_gold(pid)
        meta = lane_fires(pid, gold0, by_idx)
        gold = merge_concepts(gold0)            # collapse surface-variant duplicates
        meta["n_pool_raw"] = len(gold0); meta["n_concepts"] = len(gold)
        G[pid] = gold; GS[pid] = meta
        tgt = commitment_set(gold)
        tgt_w = commitment_set(gold, include_weak=True)
        iaa = grader_iaa(pid)
        labeldist = collections.Counter(g["label"] for g in gold.values())

        # per-lane span-level scores
        lanes = {}
        for name, rule in [("lexical", rule_lexical()),
                           ("divergence>=1", rule_div(1)), ("divergence>=2", rule_div(2)),
                           ("divergence>=3", rule_div(3)), ("divergence>=4", rule_div(4)),
                           ("critic>=1", rule_critic(1)), ("critic>=2", rule_critic(2)),
                           ("div>=2 OR critic>=2", rule_fusion_or(2, 2)),
                           ("div>=3 AND critic>=1", rule_fusion_and(3, 1))]:
            fired = fires_of(gold, rule)
            lanes[name] = {"span": score(gold, fired, tgt),
                           "span_incl_weak": score(gold, fired, tgt_w)}

        # divergence threshold sweep (the curve)
        sweep = []
        for T in range(1, 7):
            fired = fires_of(gold, rule_div(T))
            sweep.append({"min_reps": T, **score(gold, fired, tgt),
                          "seg": segment_metrics(pid, gold, rule_div(T), tgt)})

        # herd-blind-spot: commitment-gold divergence missed (0 reps) that critic caught
        missed = [idx for idx in tgt if gold[idx].get("div_reps", 0) == 0]
        herd_recovered = [idx for idx in missed if gold[idx].get("critic_n", 0) >= 1]

        report["passages"][pid] = {
            "famous": (pid == "dn2"),
            "n_pool": len(gold), "label_distribution": dict(labeldist),
            "n_commitment_gold": len(tgt), "n_weak": labeldist.get("weak", 0),
            "grader_iaa": iaa,
            "lanes": lanes,
            "divergence_sweep": sweep,
            "herd_blind_spot": {"commitment_gold_missed_by_divergence": len(missed),
                                "of_which_recovered_by_critic": len(herd_recovered),
                                "missed_spans": [gold[i]["lemma"] for i in missed],
                                "recovered_spans": [gold[i]["lemma"] for i in herd_recovered]},
            "lexical_flood": {"total_lexical_tokens": meta["lex_total_tokens"],
                              "unpooled_function_word_fires": len(meta["lex_unpooled"]),
                              "examples": meta["lex_unpooled"][:12]},
        }

    # ---------------- LEAVE-ONE-PASSAGE-OUT ----------------
    # fit the divergence threshold T* on passage X (max F1 over commitment gold),
    # then score held-out on Y. Both directions. Also the best fusion rule.
    def best_T(pid):
        gold = G[pid]; tgt = commitment_set(gold)
        best, bestf1 = 1, -1
        for T in range(1, 7):
            sc = score(gold, fires_of(gold, rule_div(T)), tgt)
            f1 = 0 if (sc["recall"] + sc["precision"]) == 0 else 2 * sc["recall"] * sc["precision"] / (sc["recall"] + sc["precision"])
            if f1 > bestf1: bestf1, best = f1, T
        return best
    for train, test in [("dn2", "sn36.21"), ("sn36.21", "dn2")]:
        T = best_T(train)
        gold = G[test]; tgt = commitment_set(gold)
        fired = fires_of(gold, rule_div(T))
        sc = score(gold, fired, tgt)
        null = perm_null(gold, sc["n_fired"], tgt, sc["tp"])
        report["leave_one_out"][f"train={train}->test={test}"] = {
            "fitted_min_reps": T, "held_out": sc,
            "held_out_segment": segment_metrics(test, gold, rule_div(T), tgt),
            "perm_null": null,
        }
    json.dump(report, io.open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # ---------------- console ----------------
    for pid in PASSAGES:
        r = report["passages"][pid]
        print(f"\n===== {pid} ({'famous' if pid=='dn2' else 'obscure'}) =====")
        print(f"pool={r['n_pool']}  labels={r['label_distribution']}  commitment_gold={r['n_commitment_gold']}")
        print(f"grader IAA: exact={r['grader_iaa']['exact_label']} commitment-binary={r['grader_iaa']['commitment_binary']}")
        print("  lane                       span: rec / prec / flood")
        for name, v in r["lanes"].items():
            s = v["span"]
            print(f"    {name:24s}  {s['recall']:.2f} / {s['precision']:.2f} / {s['flood_ratio']}  (fired {s['n_fired']}/{s['n_gold']})")
        print("  divergence threshold sweep (span | segment):")
        for sw in r["divergence_sweep"]:
            sg = sw["seg"]
            print(f"    >= {sw['min_reps']} reps: span rec {sw['recall']:.2f} prec {sw['precision']:.2f} flood {sw['flood_ratio']}"
                  f"  | seg rec {sg['recall']:.2f} prec {sg['precision']:.2f} ({sg['n_seg_fired']} segs)")
        hb = r["herd_blind_spot"]
        print(f"  herd-blind-spot: divergence missed {hb['commitment_gold_missed_by_divergence']} commitment-gold "
              f"({hb['missed_spans']}); critic recovered {hb['of_which_recovered_by_critic']} ({hb['recovered_spans']})")
        print(f"  lexical flood: {r['lexical_flood']['unpooled_function_word_fires']} function-word fires not in any candidate pool "
              f"e.g. {r['lexical_flood']['examples'][:6]}")
    print("\n===== LEAVE-ONE-PASSAGE-OUT (held-out is the headline) =====")
    for k, v in report["leave_one_out"].items():
        h = v["held_out"]; sg = v["held_out_segment"]
        print(f"  {k}: fit min_reps={v['fitted_min_reps']} -> held-out span rec {h['recall']} prec {h['precision']} "
              f"flood {h['flood_ratio']} (fired {h['n_fired']}/{h['n_gold']}); seg rec {sg['recall']} prec {sg['precision']}; "
              f"null mean {v['perm_null']['mean']} vs tp {h['tp']}")
    print(f"\nwrote {OUT}")

if __name__ == "__main__":
    main()
