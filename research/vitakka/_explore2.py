#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Vitakka apparatus-provenance exploration, BY CHRONOLOGICAL STRATUM (not work_role).
stratum(): 1early / 2late / 3abh / 4para / 5comm / 6tika / 7other. The apparatus question is a
provenance question, so stratum is the load-bearing axis. Read-only. PYTHONIOENCODING=utf-8."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'naga'))
from sql import _get_dsn
import psycopg2

def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")

    print("=== 0. deduped char-mass per STRATUM (density denominators) ===")
    cur.execute("""SELECT stratum(work_slug), sum(char_length(original)) FILTER (WHERE is_primary)
                   FROM passages GROUP BY 1 ORDER BY 1""")
    MC = {}
    for st, chars in cur.fetchall():
        MC[st] = (chars or 0)/1e6
        print(f"  {st:8} {(chars or 0)/1e6:8.3f} Mchar")

    terms = {
        'vitakka(base)': r'vitakk',
        'upacara':       r'upacār',
        'appana':        r'appanā|appaṇā',
        'abhiniropana':  r'abhiniropan',
        'parikamma':     r'parikamm',
        'khanika':       r'khaṇik',
        'vinivarana':    r'vinīvaraṇa',
        'kalla-citta':   r'kallacitt|kalla-citt|kallacit',
        'mudu-kammanna': r'mudu.{0,3}kamm|kammaniya|kammañña',
    }
    order = ['1early','2late','3abh','4para','5comm','6tika']
    print("\n=== 1. per-STRATUM row counts + per-Mchar density (deduped) ===")
    hdr = '  ' + f"{'term':14}" + ''.join(f"{s:>7}" for s in order) + '  |  ' + ''.join(f"{s+'/Mc':>9}" for s in order)
    print(hdr)
    data = {}
    for name, pat in terms.items():
        d = {}
        for st in order:
            cur.execute(f"SELECT count(*) FROM passages WHERE is_primary AND stratum(work_slug)=%s AND original ~* %s", (st, pat))
            d[st] = cur.fetchone()[0]
        data[name] = d
        cnt = ''.join(f"{d[s]:>7}" for s in order)
        den = ''.join(f"{(d[s]/MC[s] if MC.get(s) else 0):>9.2f}" for s in order)
        print(f"  {name:14}{cnt}  |  {den}")

    print("\n=== 2. EARLY-CANONICAL (1early) upacāra rows — sense-audit (vicinity vs access-concentration) ===")
    cur.execute("""SELECT id, citation, work_slug FROM passages
                   WHERE is_primary AND stratum(work_slug)='1early' AND original ~* 'upacār'
                   ORDER BY work_slug, id""")
    early_up = cur.fetchall()
    print(f"  {len(early_up)} early-canonical upacāra rows:")
    for id_, cit, slug in early_up: print(f"    {id_:30} {cit:16} {slug}")

    print("\n=== 3. appanā / abhiniropana by stratum (where do they FIRST appear?) ===")
    for label, pat in (('appanā', r'appanā|appaṇā'), ('abhiniropana', r'abhiniropan')):
        for st in ('1early','2late','3abh','4para'):
            cur.execute("SELECT id,citation,work_slug FROM passages WHERE is_primary AND stratum(work_slug)=%s AND original ~* %s ORDER BY id LIMIT 6", (st, pat))
            got = cur.fetchall()
            if got: print(f"  {label} [{st}]: {len(got)}+ -> {[(r[1]) for r in got]}")

    print("\n=== 4. abhiniropana early-canon hit (MN 117?) — sense check ===")
    cur.execute("SELECT id,citation FROM passages WHERE is_primary AND stratum(work_slug) IN ('1early') AND original ~* 'abhiniropan'")
    for id_, cit in cur.fetchall(): print(f"    early abhiniropana: {id_} {cit}")

    cur.close(); conn.close()

if __name__ == '__main__':
    main()
