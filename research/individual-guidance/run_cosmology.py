#!/usr/bin/env python
"""Serial 6-stratum cosmology-census executor (IG ITEM 1).

ONE psycopg2 connection (respects the dhamma-pg concurrency wedge). Materializes
a temp table once (fine 6-stratum CASE + 7other, plus lower(unaccent(original))),
trgm-indexes it, then:
  - counts every enumerated stem x 7 strata          -> COSMOLOGY-COUNTS.json
  - per-stem breakdown over the late/para work_slugs -> COSMOLOGY-COUNTS.json (for ITEM 2)
  - pulls normalized sample windows for the audit     -> _COSMOLOGY-SAMPLES.json (gitignored)

The fine 6-stratum CASE is the method of record (matches HARDENING-CENSUS / the
handoff). pli-kn sits in 2late here; ITEM 2 re-buckets it and re-runs.

Usage (DATABASE_URL must point at the proxy localhost:15432):
  python run_cosmology.py                # fine CASE of record
  python run_cosmology.py --case fixed   # ITEM 2: per-id-corrected CASE (override file)
"""
import os, sys, json, time
import psycopg2

HERE = os.path.dirname(os.path.abspath(__file__))
ENUM = os.path.join(HERE, "COSMOLOGY-ENUMERATION.json")
OUT  = os.path.join(HERE, "COSMOLOGY-COUNTS.json")
SAMP = os.path.join(HERE, "_COSMOLOGY-SAMPLES.json")
# ITEM 2 freezes an explicit id->stratum override here (gitignored if large; small enough to commit).
FIXMAP = os.path.join(HERE, "KN-STRATUM-MAP.json")

CASE_FINE = """
  CASE
    WHEN work_slug IN ('pli-an','pli-sn','pli-mn','pli-dn','pli-vinaya','pli-dhp','pli-ud','pli-iti','pli-snp','pli-thag','pli-thig','pli-kp') THEN '1early'
    WHEN work_slug IN ('pli-ap','pli-bv','pli-cp','pli-pv','pli-vv','pli-nd','pli-ps','pli-ja','pli-kn') THEN '2late'
    WHEN work_slug='pli-abhidhamma' THEN '3abh'
    WHEN work_slug IN ('pli-ne','pli-pe','pli-mil') THEN '4para'
    WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN '5comm'
    WHEN work_slug LIKE '%-tika' THEN '6tika'
    ELSE '7other' END
"""

STRATA = ["1early", "2late", "3abh", "4para", "5comm", "6tika", "7other"]
WATCH_SLUGS = ["pli-kn", "pli-nd", "pli-ps", "pli-ap", "pli-bv", "pli-cp",
               "pli-pv", "pli-vv", "pli-ja", "pli-ne", "pli-pe", "pli-mil"]
SAMPLE_STRATA = ["1early", "2late", "5comm", "7other"]
K_PER = 5


def collect_stems(enum):
    stems = []
    for grp in ("transitions", "counter"):
        for t in enum.get(grp, []):
            for s in t.get("stems", []) + t.get("context_stems", []):
                if s not in stems:
                    stems.append(s)
    return stems


def main():
    args = sys.argv[1:]
    use_fixed = "--case" in args and args[args.index("--case") + 1] == "fixed"

    enum = json.load(open(ENUM, encoding="utf-8"))
    stems = collect_stems(enum)

    out_path = OUT.replace(".json", "-FIXED.json") if use_fixed else OUT
    samp_path = SAMP

    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        sys.exit("DATABASE_URL not set")
    conn = psycopg2.connect(dsn, connect_timeout=20)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SET statement_timeout = '600s';")

    t0 = time.time()
    cur.execute(f"""
      CREATE TEMP TABLE cos AS
      SELECT id, work_slug, {CASE_FINE} AS stratum, lower(unaccent(original)) AS o
      FROM passages;
    """)
    cur.execute("SELECT count(*) FROM cos;")
    nrows = cur.fetchone()[0]

    case_label = "fine"
    if use_fixed and os.path.exists(FIXMAP):
        fixmap = json.load(open(FIXMAP, encoding="utf-8"))  # {id: stratum}
        cur.execute("CREATE TEMP TABLE fixm (id text PRIMARY KEY, stratum text);")
        from psycopg2.extras import execute_values
        execute_values(cur, "INSERT INTO fixm (id, stratum) VALUES %s",
                       [(k, v) for k, v in fixmap.items() if not k.startswith("_")])
        cur.execute("UPDATE cos c SET stratum = f.stratum FROM fixm f WHERE c.id = f.id;")
        cur.execute("SELECT count(*) FROM fixm;")
        print(f"[fix] re-bucketed {cur.fetchone()[0]} ids via KN-STRATUM-MAP.json", flush=True)
        case_label = "fixed"

    cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    cur.execute("CREATE INDEX cos_trgm ON cos USING gin (o gin_trgm_ops);")

    cur.execute("CREATE TEMP TABLE stems (stem text);")
    cur.executemany("INSERT INTO stems (stem) VALUES (%s);", [(s.lower(),) for s in stems])
    print(f"[temp cos] {nrows} rows, {len(stems)} stems, {time.time()-t0:.1f}s (case={case_label})", flush=True)

    counts = {s: {L: 0 for L in STRATA} for s in stems}
    byslug = {s: {} for s in stems}

    ta = time.time()
    cur.execute("""
      SELECT s.stem, c.stratum, count(*) AS n
      FROM stems s JOIN cos c ON c.o LIKE '%' || s.stem || '%'
      GROUP BY s.stem, c.stratum;
    """)
    lc = {s.lower(): s for s in stems}
    for stem_n, stratum, n in cur.fetchall():
        counts[lc[stem_n]][stratum] = n
    print(f"[pass A stem x stratum] {time.time()-ta:.1f}s", flush=True)

    tb = time.time()
    cur.execute("""
      SELECT s.stem, c.work_slug, count(*) AS n
      FROM stems s JOIN cos c ON c.work_slug = ANY(%s) AND c.o LIKE '%%' || s.stem || '%%'
      GROUP BY s.stem, c.work_slug;
    """, (WATCH_SLUGS,))
    for stem_n, slug, n in cur.fetchall():
        byslug[lc[stem_n]][slug] = n
    print(f"[pass B stem x slug] {time.time()-tb:.1f}s", flush=True)

    out = {"_meta": {"nrows": nrows, "case": case_label, "strata": STRATA, "watch_slugs": WATCH_SLUGS},
           "stems": {}}
    for s in stems:
        out["stems"][s] = {"strata": counts[s], "total": sum(counts[s].values()), "byslug": byslug[s]}
    json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"[counts] -> {out_path}", flush=True)

    if use_fixed:
        print("[samples] skipped for --case fixed", flush=True)
        print(f"[done] {time.time()-t0:.1f}s total", flush=True)
        return

    samples = {}
    ts = time.time()
    for s in stems:
        sn = s.lower()
        samples[s] = {}
        for L in SAMPLE_STRATA:
            cur.execute("""
              SELECT work_slug, id, substr(o, greatest(1, position(%s in o) - 140), 360) AS win
              FROM cos
              WHERE stratum = %s AND o LIKE '%%' || %s || '%%'
              ORDER BY length(o) ASC
              LIMIT %s;
            """, (sn, L, sn, K_PER))
            rows = [{"slug": r[0], "id": r[1], "win": r[2]} for r in cur.fetchall()]
            if rows:
                samples[s][L] = rows
    json.dump(samples, open(SAMP, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"[samples] {time.time()-ts:.1f}s -> {SAMP}", flush=True)
    print(f"[done] {time.time()-t0:.1f}s total", flush=True)


if __name__ == "__main__":
    main()
