#!/usr/bin/env python3
"""Granularity P1 — SN 36.21 Sīvakasutta slice (the OBSCURE 2nd passage).

The obscure analog of dn2_slice.py: a doctrinally-rich, 3-translator passage to
break the famous-text caveat on detection and give leave-one-passage-out a 2nd
point. Builds:
  - 27 content segments (drops headers/colophon + the verbatim-repeat block
    3.8-3.15 which restates 2.1-2.7 — deduped, logged).
  - the 3 human translations segment-aligned (Sujato from bilara; Thanissaro +
    Nyanaponika monotonic-DP-aligned from the mirror full texts).
  - the deterministic lexical + commentary-presence lanes (reused DPD resolver).
  - comment-gold (Sujato's bilara comment segments — the independent ~36% proxy).
  - evidence packets (REAL DPD + commentary rows) for the curated loaded terms,
    for an optional staging/audit step.

FIREWALL: the deterministic lanes read Pāli only. The 3 translations are stored
for the LLM divergence lane (the human-translation detector) + audit — never a
warrant. Offline; local DPD SQLite + local bilara-data + the mirror. No prod.

Run from repo root:  python research/scripts/sn36_slice.py
"""
import json, io, os, re, sys, math, collections

sys.path.insert(0, "research/scripts")
from dn2_slice import DPD, detect_segment, cluster_senses, pick_lemma, norm  # reuse

sys.stdout.reconfigure(encoding="utf-8")

BILARA = "scripts/ingest/.cache/bilara-data"
ROOT = f"{BILARA}/root/pli/ms/sutta/sn/sn36/sn36.21_root-pli-ms.json"
SUJATO = f"{BILARA}/translation/en/sujato/sutta/sn/sn36/sn36.21_translation-en-sujato.json"
COMMENT = f"{BILARA}/comment/en/sujato/sutta/sn/sn36/sn36.21_comment-en-sujato.json"
MIRROR = "research/data/divergence_mirror.json"
OUT = "research/out/sn36_slice.json"

# 27 content segments: intro 1.x, first-cause+reasoning 2.x, other-causes 3.1-3.7,
# refuge 4.x, verse 5.1-5.4. Headers 0.x, colophon 5.5, and the verbatim-repeat
# block 3.8-3.15 (= 2.1-2.7 restated, empty-Sujato 3.9/3.11) are excluded.
SEG_IDS = ["sn36.21:1.1", "sn36.21:1.2", "sn36.21:1.3", "sn36.21:1.4", "sn36.21:1.5", "sn36.21:1.6",
           "sn36.21:2.1", "sn36.21:2.2", "sn36.21:2.3", "sn36.21:2.4", "sn36.21:2.5", "sn36.21:2.6", "sn36.21:2.7",
           "sn36.21:3.1", "sn36.21:3.2", "sn36.21:3.3", "sn36.21:3.4", "sn36.21:3.5", "sn36.21:3.6", "sn36.21:3.7",
           "sn36.21:4.1", "sn36.21:4.2", "sn36.21:4.3",
           "sn36.21:5.1", "sn36.21:5.2", "sn36.21:5.3", "sn36.21:5.4"]

# Curated loaded terms (candidate choice-points; lemma = the DPD headword to cite).
# These are CANDIDATES for the staging/audit layer — NOT the gold (gold comes from
# the translation-blind annotation + grading panel, per PREREGISTRATION_granularity).
LOADED = [
    ("pubbekatahetu", ["pubbekata", "hetu"], "doctrinal", "sn36.21:1.5"),
    ("pitta", ["pitta"], "lexical-sense/medical", "sn36.21:2.1"),
    ("semha", ["semha"], "lexical-sense/medical", "sn36.21:3.1"),
    ("vāta", ["vāta"], "lexical-sense/medical", "sn36.21:3.2"),
    ("sannipātika", ["sannipāta", "sannipātika"], "lexical-sense/medical", "sn36.21:3.3"),
    ("utupariṇāmaja", ["utupariṇāma", "utu"], "lexical-sense", "sn36.21:3.4"),
    ("visamaparihāraja", ["visamaparihāra", "parihāra"], "lexical-sense", "sn36.21:3.5"),
    ("opakkamika", ["opakkamika", "upakkama"], "lexical-sense/doctrinal", "sn36.21:3.6"),
    ("kammavipāka", ["kammavipāka", "vipāka"], "doctrinal", "sn36.21:3.7"),
    ("saccasammata", ["saccasammata", "sammata"], "lexical-sense", "sn36.21:2.3"),
    ("samaṇabrāhmaṇa", ["samaṇabrāhmaṇa", "samaṇa"], "register/lexical-sense", "sn36.21:1.4"),
    ("paṭisaṁvedeti", ["paṭisaṁvedeti"], "lexical-sense", "sn36.21:1.5"),
    ("atidhāvati", ["atidhāvati"], "lexical-sense", "sn36.21:2.6"),
]

STOP = set("ca va vā ti hi nu kho pana iti me te so naṃ taṁ na no e bho".split())

# ---------- monotonic-DP alignment (copied from divergence_poc.py to avoid its
#            unguarded module-level main()) ----------
STOP_EN = set("""a an the and or but of to in on at for with by from as is are was were be been being
this that these those it its he she his her they them their i you we us our your not no nor so
then than too very just there here when where what who whom which while shall should would could
may might must can will do does did done have has had having if because about into over under
again further once only own same such both each few more most other some any all this""".split())

def cwords(t):
    return [w for w in re.findall(r"[a-zA-ZÀ-ɏḀ-ỿ']+", (t or "").lower()) if w not in STOP_EN and len(w) > 1]

def tf(words):
    c = collections.Counter(words); n = math.sqrt(sum(v * v for v in c.values())) or 1.0
    return c, n

def cos(a, b):
    ca, na = a; cb, nb = b
    if not ca or not cb: return 0.0
    return sum(v * cb.get(k, 0) for k, v in ca.items()) / (na * nb)

def split_sents(t):
    t = re.sub(r"\s+", " ", t or "").strip()
    parts = re.split(r"(?<=[.!?…])\s+", t)
    return [p.strip() for p in parts if len(cwords(p)) >= 1]

def align(src_sents, seg_ids, seg_tf):
    """Assign each source sentence to one Sujato segment (or drop). Returns {seg_id:[idx]}."""
    S, T = len(src_sents), len(seg_ids)
    st = [tf(cwords(s)) for s in src_sents]
    sim = [[cos(st[i], seg_tf[seg_ids[j]]) for j in range(T)] for i in range(S)]
    dp = [[0.0] * (T + 1) for _ in range(S + 1)]
    bk = [[None] * (T + 1) for _ in range(S + 1)]
    for i in range(1, S + 1):
        dp[i][0], bk[i][0] = dp[i - 1][0] - 0.05, ("dropsent",)
        for j in range(1, T + 1):
            best, arg = dp[i][j - 1], ("skipseg",)
            v = dp[i - 1][j] - 0.05
            if v > best: best, arg = v, ("dropsent",)
            v = dp[i - 1][j] + sim[i - 1][j - 1]
            if v > best: best, arg = v, ("assign",)
            dp[i][j], bk[i][j] = best, arg
    out = collections.defaultdict(list)
    i, j = S, T
    while i > 0 or j > 0:
        if j > 0 and (i == 0 or bk[i][j] == ("skipseg",)):
            j -= 1
        elif bk[i][j] == ("dropsent",):
            i -= 1
        else:
            out[seg_ids[j - 1]].append(i - 1); i -= 1
    return {k: " ".join(src_sents[x] for x in sorted(v)) for k, v in out.items()}

def main():
    dpd = DPD()
    root = json.load(io.open(ROOT, encoding="utf-8"))
    suj = json.load(io.open(SUJATO, encoding="utf-8"))
    com = json.load(io.open(COMMENT, encoding="utf-8"))
    mirror = json.load(io.open(MIRROR, encoding="utf-8"))

    def mtext(who):
        return next((t["text"] for t in mirror["sn36.21"]["translations"] if t["translator"] == who), "")
    import html as _html
    def clean(t):
        return re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", " ", t or ""))).strip()
    than_full, nyana_full = clean(mtext("thanissaro")), clean(mtext("nyanaponika"))

    # anchor alignment on the Sujato English segments
    seg_en = {sid: suj.get(sid, "").strip() for sid in SEG_IDS}
    seg_tf = {sid: tf(cwords(seg_en[sid] or root.get(sid, ""))) for sid in SEG_IDS}
    than_al = align(split_sents(than_full), SEG_IDS, seg_tf)
    nyana_al = align(split_sents(nyana_full), SEG_IDS, seg_tf)

    segments = []
    for sid in SEG_IDS:
        pli = root.get(sid, "").strip()
        fires, resolved = detect_segment(pli, dpd)
        n_fires = len(fires["lexical"]) + len(fires["commentary"])
        segments.append({"id": sid, "pli": pli,
                         "sujato": seg_en[sid],
                         "thanissaro": than_al.get(sid, ""),
                         "nyanaponika": nyana_al.get(sid, ""),
                         "n_resolved": resolved, "fires": fires, "n_fires": n_fires})

    # comment-gold (Sujato bilara comments), restricted to our segment set
    comment_gold = {k: clean(v) for k, v in com.items() if k in set(SEG_IDS)}

    # evidence packets for the curated loaded terms (REAL rows)
    packets = {}
    for term, lemmas, typ, seg in LOADED:
        hws, comm = [], []
        seen = set()
        for lem in lemmas:
            for h in dpd.headwords(lem):
                if h["id"] not in seen:
                    seen.add(h["id"]); hws.append(h)
            comm += dpd.comm_rows(lem)
        packets[term] = {"lemma": lemmas[0], "lemmas": lemmas, "type": typ, "segment": seg,
                         "dpd_headwords": hws, "commentary_bold": comm,
                         "n_dpd": len(hws), "n_comm": len(comm)}

    # granularity stats
    flagged = [s for s in segments if s["n_fires"] > 0]
    stats = {
        "n_segments": len(segments),
        "n_flagged_segments": len(flagged),
        "flag_density_segments": round(len(flagged) / len(segments), 3),
        "total_fires": sum(s["n_fires"] for s in segments),
        "fires_per_segment_mean": round(sum(s["n_fires"] for s in segments) / len(segments), 2),
        "lexical_fires": sum(len(s["fires"]["lexical"]) for s in segments),
        "commentary_fires": sum(len(s["fires"]["commentary"]) for s in segments),
        "n_comment_gold_segs": len(comment_gold),
    }
    align_cov = {
        "thanissaro_segs_covered": sum(1 for s in segments if s["thanissaro"]),
        "nyanaponika_segs_covered": sum(1 for s in segments if s["nyanaponika"]),
    }

    out = {"passage": "sn36.21", "title": "Sīvakasutta", "work": "pli-sn",
           "slice": "27 content segments (1.1-5.4, deduped)",
           "famous": False, "n_translators": 3, "translators": ["sujato", "nyanaponika", "thanissaro"],
           "params": {"n_sense": 2, "jaccard": 0.5, "comm_min": 2},
           "firewall": "deterministic lanes read Pāli only; the 3 translations stored for the LLM divergence lane + audit, never a warrant",
           "dedup_note": "verbatim-repeat block sn36.21:3.8-3.15 (restates 2.1-2.7, empty-Sujato 3.9/3.11) excluded from the segment set",
           "segments": segments, "comment_gold": comment_gold,
           "loaded_terms": [{"term": t, "lemmas": l, "type": ty, "segment": s} for t, l, ty, s in LOADED],
           "evidence_packets": packets, "stats": stats, "alignment_coverage": align_cov}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, io.open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # console summary
    print(f"SN 36.21 Sīvakasutta — {len(segments)} content segments (obscure, 3 translators)\n")
    print(f"Alignment coverage: Thanissaro {align_cov['thanissaro_segs_covered']}/{len(segments)} segs, "
          f"Nyanaponika {align_cov['nyanaponika_segs_covered']}/{len(segments)} segs")
    print(f"Comment-gold segments (Sujato bilara): {sorted(comment_gold)}\n")
    print("Deterministic lanes per segment (lexical / commentary fires):")
    for s in segments:
        lx = ",".join(f["token"] for f in s["fires"]["lexical"]) or "-"
        print(f"  {s['id']:13s} lex={len(s['fires']['lexical'])} comm={len(s['fires']['commentary'])}  lexfires: {lx}")
    print(f"\nGranularity/flood: {stats['n_flagged_segments']}/{stats['n_segments']} segments flagged; "
          f"{stats['total_fires']} fires ({stats['fires_per_segment_mean']}/seg) "
          f"= lexical {stats['lexical_fires']} + commentary {stats['commentary_fires']}")
    print("\nLoaded-term DPD/commentary coverage (candidate choice-points, not gold):")
    for term, lemmas, typ, seg in LOADED:
        p = packets[term]
        print(f"  {term:18s} [{typ:22s}] seg {seg:13s}  dpd={p['n_dpd']} comm={p['n_comm']}")
    print(f"\nwrote {OUT}")

if __name__ == "__main__":
    main()
