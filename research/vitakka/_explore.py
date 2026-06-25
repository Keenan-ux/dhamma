#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Structural exploration for the vitakka apparatus-provenance study.
Single serial conn, read-only. Confirms DR-1's seed (upacāra/appanā/abhiniropana
densities) deduped + per-character BEFORE the prereg freeze. PYTHONIOENCODING=utf-8."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'naga'))
from sql import _get_dsn
import psycopg2

# deduped per-layer char totals (Mchar) — SKILL rule 8 (is_primary on both sides)
def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")

    print("=== 0. deduped char-mass per stratum (the density denominators) ===")
    cur.execute("""SELECT CASE WHEN work_role='mula' THEN 'mula'
                                WHEN work_slug LIKE '%%-attha' OR work_slug='pli-vism' THEN 'attha'
                                WHEN work_slug LIKE '%%-tika' THEN 'tika' ELSE 'other' END AS layer,
                          sum(char_length(original)) FILTER (WHERE is_primary) AS chars
                   FROM passages GROUP BY 1 ORDER BY 1""")
    MC = {}
    for layer, chars in cur.fetchall():
        MC[layer] = (chars or 0) / 1e6
        print(f"  {layer:6} {(chars or 0)/1e6:8.3f} Mchar (deduped)")

    terms = {
        'vitakka (baseline)': r'vitakk',
        'upacara':            r'upacār',
        'appana':             r'appanā|appaṇā',
        'abhiniropana':       r'abhiniropan',
        'parikamma':          r'parikamm',
        'khanika':            r'khaṇik',
        # phenomenon-vs-term: the canon's unlabelled pre-jhana pliant mind
        'vinivarana-citta':   r'vinīvaraṇa',
        'kalla-citta':        r'kallacitt|kallacit|kalla-citt',
        'mudu-kammanna':      r'mudu.{0,3}kammañ|kammaniya|kammañña',
    }
    print("\n=== 1. row counts + per-Mchar density by layer (deduped) ===")
    print(f"  {'term':22} {'mula':>6} {'attha':>6} {'tika':>6} | {'c/Mc':>7} {'a/Mc':>7} {'t/Mc':>7} {'comm/Mc':>8} {'ratio c:comm':>12}")
    rows = {}
    for name, pat in terms.items():
        d = {}
        for L, cond in (('mula', "work_role='mula' AND is_primary"),
                        ('attha', "(work_slug LIKE '%%-attha' OR work_slug='pli-vism') AND is_primary"),
                        ('tika', "work_slug LIKE '%%-tika' AND is_primary")):
            cur.execute(f"SELECT count(*) FROM passages WHERE {cond} AND original ~* %s", (pat,))
            d[L] = cur.fetchone()[0]
        cmc = d['mula']/MC['mula'] if MC.get('mula') else 0
        amc = d['attha']/MC['attha'] if MC.get('attha') else 0
        tmc = d['tika']/MC['tika'] if MC.get('tika') else 0
        commden = (d['attha']+d['tika'])/(MC['attha']+MC['tika']) if MC.get('attha') else 0
        ratio = (cmc/commden) if commden else None
        rows[name] = dict(d, cmc=cmc, commden=commden, ratio=ratio)
        rstr = f"{ratio:.3f}" if ratio is not None else "inf"
        print(f"  {name:22} {d['mula']:>6} {d['attha']:>6} {d['tika']:>6} | {cmc:7.2f} {amc:7.2f} {tmc:7.2f} {commden:8.2f} {rstr:>12}")

    print("\n=== 2. upacāra in mula: sample rows for sense-audit (vicinity vs access-concentration) ===")
    cur.execute("""SELECT id, citation, work_slug FROM passages
                   WHERE work_role='mula' AND is_primary AND original ~* 'upacār'
                   ORDER BY work_slug, id LIMIT 30""")
    for id_, cit, slug in cur.fetchall():
        print(f"   {id_:34} {cit:16} {slug}")

    print("\n=== 3. appanā / abhiniropana in mula (are there ANY canon hits?) ===")
    for label, pat in (('appanā', r'appanā|appaṇā'), ('abhiniropana', r'abhiniropan')):
        cur.execute("SELECT id, citation, work_slug FROM passages WHERE work_role='mula' AND is_primary AND original ~* %s ORDER BY work_slug LIMIT 12", (pat,))
        got = cur.fetchall()
        print(f"  {label}: {len(got)} mula rows -> {[(r[1],r[2]) for r in got]}")

    cur.close(); conn.close()

if __name__ == '__main__':
    main()
