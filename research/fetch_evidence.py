#!/usr/bin/env python
"""fetch_evidence.py - pull a count AND its readable evidence together, in one
serial pass against dhamma-pg, so the COUNT-LOCK GATE (SKILL.md) is satisfiable
by a re-read from file instead of a re-query.

For a Pali pattern it returns, per stratum (deduped via is_primary): the count,
the per-Mchar density (denominator from DEDUPED-DENOMINATORS.json, recomputed
live), and a deterministic sample of matched rows with their FULL original +
translation text -- the rows you actually read before locking the count.

Usage:
  python fetch_evidence.py --pattern 'bhavaṅg' --label bhavanga --out research/heart-base/_bhavanga_evidence.json
  python fetch_evidence.py --pattern 'sabh[aā]v' --exclude 'purisabh[aā]v|ekaṃsabh[aā]vit' --label sabhava --n 30
  python fetch_evidence.py --pattern 'cha[ḷl]abhi[nñ][nñ]' --label chalabhinna --n 40

Patterns are PostgreSQL ~* (POSIX, case-insensitive). Check HOMOGRAPHS.json for
the right --exclude mask before counting a known trap term. One connection only
(serial); never fan this at dhamma-pg concurrently.
"""
import os, sys, json, argparse

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "naga"))
from sql import _get_dsn  # reuse the proxy/DSN self-extract


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pattern", required=True, help="PostgreSQL ~* regex over original")
    ap.add_argument("--exclude", default=None, help="exclusion mask (!~*); see HOMOGRAPHS.json")
    ap.add_argument("--label", default="term")
    ap.add_argument("--n", type=int, default=20, help="sample rows per stratum to fetch full text for")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()

    import psycopg2
    conn = psycopg2.connect(_get_dsn(), connect_timeout=20)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SET statement_timeout = '180s';")

    exc_clause = "AND original !~* %(exc)s" if a.exclude else ""
    params = {"pat": a.pattern, "exc": a.exclude, "n": a.n}

    # 1) per-stratum deduped count + denominator + density
    cur.execute(f"""
        WITH d AS (SELECT stratum(work_slug) AS strat,
                          SUM(char_length(original))/1000000.0 AS mchar
                   FROM passages WHERE is_primary GROUP BY strat),
             c AS (SELECT stratum(work_slug) AS strat, COUNT(*) AS cnt
                   FROM passages
                   WHERE is_primary AND original ~* %(pat)s {exc_clause}
                   GROUP BY strat)
        SELECT d.strat, COALESCE(c.cnt,0) AS cnt, round(d.mchar::numeric,3) AS mchar,
               round((COALESCE(c.cnt,0)/d.mchar)::numeric,3) AS per_mchar
        FROM d LEFT JOIN c USING (strat) ORDER BY d.strat;
    """, params)
    per_stratum = {}
    for strat, cnt, mchar, per_mchar in cur.fetchall():
        per_stratum[strat] = {"count": int(cnt), "mchar": float(mchar),
                              "density_per_mchar": float(per_mchar), "sample": []}

    # 2) deterministic sample of matched rows per stratum, with FULL text
    cur.execute(f"""
        WITH base AS (
          SELECT id, work_slug, stratum(work_slug) AS strat, original, translation,
                 row_number() OVER (PARTITION BY stratum(work_slug) ORDER BY md5(id::text)) AS rn
          FROM passages
          WHERE is_primary AND original ~* %(pat)s {exc_clause})
        SELECT id, work_slug, strat, original, translation
        FROM base WHERE rn <= %(n)s ORDER BY strat, rn;
    """, params)
    for pid, work_slug, strat, original, translation in cur.fetchall():
        per_stratum.setdefault(strat, {"count": 0, "mchar": None, "density_per_mchar": None, "sample": []})
        per_stratum[strat]["sample"].append({
            "id": pid, "work_slug": work_slug,
            "original": original, "translation": translation,
        })

    total = sum(v["count"] for v in per_stratum.values())
    canon = sum(per_stratum.get(s, {}).get("count", 0) for s in ("1early", "2late", "3abh", "4para"))
    comm = sum(per_stratum.get(s, {}).get("count", 0) for s in ("5comm", "6tika"))
    out = {
        "label": a.label, "pattern": a.pattern, "exclude": a.exclude,
        "snapshot_note": "deduped is_primary; denominators recomputed live; see DEDUPED-DENOMINATORS.json",
        "totals": {"all": total, "canon": canon, "commentary": comm},
        "per_stratum": per_stratum,
        "GATE_REMINDER": "Read the sample text before locking this count. For a homograph term, confirm the "
                         "exclude mask and blind sense-code the sample (report kappa). A count whose sense "
                         "you have not read is not yet a count.",
    }
    js = json.dumps(out, ensure_ascii=False, indent=1)
    if a.out:
        open(a.out, "w", encoding="utf-8").write(js)
        # stderr summary so stdout stays clean if piped
        sys.stderr.write(f"[fetch_evidence] {a.label}: total={total} canon={canon} comm={comm} -> {a.out}\n")
        for s in ("1early", "2late", "3abh", "4para", "5comm", "6tika", "7other"):
            if s in per_stratum:
                v = per_stratum[s]
                sys.stderr.write(f"   {s}: n={v['count']} density={v['density_per_mchar']}/Mc "
                                 f"(sample {len(v['sample'])})\n")
    else:
        sys.stdout.write(js + "\n")


if __name__ == "__main__":
    main()
