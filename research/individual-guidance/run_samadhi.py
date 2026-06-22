#!/usr/bin/env python
"""Exhaustive serial executor for the limited-samadhi enumeration.

ONE psycopg2 connection (respects the dhamma-pg concurrency wedge: never
fan out concurrent queries against the proxy). Materializes a layered temp
table once (unaccent+lower of every passage), then counts every enumerated
stem x 4 layers in batched serial queries.

Layers:
  1canon = pli-an/sn/mn/dn/vinaya/abhidhamma (mula)
  2para  = everything else not commentary/tika (paracanonical / anya)
  3comm  = *-attha  OR pli-vism*           (atthakatha)
  4tika  = *-tika                          (tika)

Usage (DATABASE_URL must point at the proxy localhost:15432):
  python run_samadhi.py                 # full run -> SAMADHI-COUNTS.json
  python run_samadhi.py --limit 50      # smoke test on first 50 terms
  python run_samadhi.py --batch 80      # tune batch size
"""
import os, sys, json, time
import psycopg2
from psycopg2.extras import execute_values

HERE = os.path.dirname(os.path.abspath(__file__))
ENUM = os.path.join(HERE, "SAMADHI-ENUMERATION.json")
OUT  = os.path.join(HERE, "SAMADHI-COUNTS.json")

LAYER_CASE = """
  CASE
    WHEN work_slug IN ('pli-an','pli-sn','pli-mn','pli-dn','pli-vinaya','pli-abhidhamma') THEN '1canon'
    WHEN work_slug LIKE '%-attha' OR work_slug LIKE 'pli-vism%' THEN '3comm'
    WHEN work_slug LIKE '%-tika' THEN '4tika'
    ELSE '2para'
  END
"""

def main():
    args = sys.argv[1:]
    limit = None
    batch = 60
    if "--limit" in args:
        limit = int(args[args.index("--limit") + 1])
    if "--batch" in args:
        batch = int(args[args.index("--batch") + 1])

    terms = json.load(open(ENUM, encoding="utf-8"))["all_terms"]
    if limit:
        terms = terms[:limit]
    # dedup preserving order (all_terms is already unique, belt-and-braces)
    seen = set(); uterms = []
    for t in terms:
        if t not in seen:
            seen.add(t); uterms.append(t)
    terms = uterms

    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        sys.exit("DATABASE_URL not set")
    conn = psycopg2.connect(dsn, connect_timeout=20)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SET statement_timeout = '600s';")

    t0 = time.time()
    cur.execute(f"""
      CREATE TEMP TABLE lay AS
      SELECT {LAYER_CASE} AS layer, lower(unaccent(original)) AS o
      FROM passages;
    """)
    cur.execute("SELECT count(*), count(DISTINCT layer) FROM lay;")
    nrows, nlayers = cur.fetchone()
    cur.execute("SELECT layer, count(*) FROM lay GROUP BY 1 ORDER BY 1;")
    layer_sizes = dict(cur.fetchall())
    print(f"[temp lay] {nrows} rows, {nlayers} layers, {time.time()-t0:.1f}s")
    print(f"[layer sizes] {layer_sizes}", flush=True)

    # trigram GIN index turns the leading-wildcard LIKE from seq scan into an
    # index lookup (~2.5x). Stems <3 chars still fall back to seq scan.
    ti = time.time()
    cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    cur.execute("CREATE INDEX lay_trgm ON lay USING gin (o gin_trgm_ops);")
    print(f"[trgm index] {time.time()-ti:.1f}s", flush=True)

    # init all terms to zero across the four layers
    LAYERS = ["1canon", "2para", "3comm", "4tika"]
    counts = {t: {L: 0 for L in LAYERS} for t in terms}

    nbatch = (len(terms) + batch - 1) // batch
    for bi in range(nbatch):
        chunk = terms[bi * batch:(bi + 1) * batch]
        tb = time.time()
        # VALUES list of (stem); join on normalized substring match
        sql = """
          SELECT t.stem, l.layer, count(*) AS n
          FROM (VALUES %s) AS t(stem)
          JOIN lay l ON l.o LIKE '%%' || lower(unaccent(t.stem)) || '%%'
          GROUP BY t.stem, l.layer;
        """
        execute_values(cur, sql, [(s,) for s in chunk])
        for stem, layer, n in cur.fetchall():
            counts[stem][layer] = n
        print(f"[batch {bi+1}/{nbatch}] {len(chunk)} terms, {time.time()-tb:.1f}s", flush=True)
        # checkpoint after every batch so a crash leaves a usable partial file
        checkpoint(counts, terms, done=(bi + 1) * batch)

    checkpoint(counts, terms, done=len(terms), final=True)
    print(f"[done] {len(terms)} terms -> {OUT}, {time.time()-t0:.1f}s total")


def checkpoint(counts, terms, done, final=False):
    out = {"_meta": {"terms_done": min(done, len(terms)), "terms_total": len(terms),
                     "final": final}}
    for t in terms:
        c = counts[t]
        out[t] = {**c, "total": sum(c.values())}
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)

if __name__ == "__main__":
    main()
