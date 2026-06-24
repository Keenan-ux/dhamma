#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Phase 3a discovery: find a COUNTER-THESIS topic — a doctrine the CANON treats
more densely per character than the commentary (the inverse of the house pattern,
where commentary is 3.5-5.5x denser). Serial single-connection sweep over candidate
canonical-formulaic terms; rank by canon-density and canon/commentary ratio.
PYTHONIOENCODING=utf-8 python research/_discovery_counter.py"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'naga'))
from sql import _get_dsn
import psycopg2

# per-layer char totals (DB, 2026-06-23): mula 53.5M, attha 29.5M, tika 28.4M
MC = {'mula': 53.543921, 'attha': 29.488533, 'tika': 28.357746}

# candidate canonical-formulaic / experiential terms (stems, diacritic-correct)
TERMS = {
 'assāda (gratification)': 'assād',
 'ādīnava (danger)': 'ādīnav',
 'nissaraṇa (escape)': 'nissaraṇ',
 'nibbidā (disenchantment)': 'nibbid',
 'virāga (dispassion)': 'virāg',
 'yathābhūta (as it really is)': 'yathābhūt',
 'netaṃ mama (not mine formula)': 'netaṃ mama|n.etaṃ mama|neso hamasmi',
 'ehipassika (come-and-see)': 'ehipassik',
 'sandiṭṭhika (visible here-now)': 'sandiṭṭhik',
 'opaneyyika (onward-leading)': 'opaneyyik|opanayik',
 'kalyāṇamitta (good friend)': 'kalyāṇamitt',
 'appamāda (heedfulness)': 'appamād',
 'saṃvega (urgency)': 'saṃveg|saṃvejan',
 'ottappa (moral dread)': 'ottapp',
 'hiri (moral shame)': '\\mhiri|hirīy',
 'kullūpama (raft simile)': 'kullūpam|kulla.{0,4}upam',
 'pheṇapiṇḍūpama (foam simile)': 'pheṇ',
 'marīcika (mirage simile)': 'marīcik|marīci\\M',
 'anupubbikathā (graduated talk)': 'anupubbikath|ānupubbikath',
 'sabbe saṅkhārā aniccā': 'sabbe saṅkhārā anicc',
 'tadaṅga / vikkhambhana (provisional abandon)': 'tadaṅga|vikkhambhan',
 'paṭisallāna (seclusion)': 'paṭisallān',
 'oghatiṇṇa (crossed the flood)': 'oghatiṇṇ|ogha.{0,3}tiṇṇ',
}


def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SET statement_timeout='115s';")
    rows = []
    for name, stem in TERMS.items():
        d = {}
        for layer, slugcond in (('mula', "work_role='mula'"),
                                ('attha', "(work_slug LIKE '%%-attha' OR work_slug='pli-vism')"),
                                ('tika', "work_slug LIKE '%%-tika'")):
            cur.execute(f"SELECT count(*) FROM passages WHERE {slugcond} AND original ~* %s", (stem,))
            d[layer] = cur.fetchone()[0]
        canon = d['mula'] / MC['mula']
        comm_rows = d['attha'] + d['tika']
        comm = comm_rows / (MC['attha'] + MC['tika'])
        ratio = (canon / comm) if comm > 0 else float('inf')
        rows.append((name, d['mula'], d['attha'], d['tika'], round(canon, 2), round(comm, 2), round(ratio, 2)))
        print(f"{name[:34]:34} mula {d['mula']:>5} attha {d['attha']:>5} tika {d['tika']:>5} | /Mc canon {canon:6.2f} comm {comm:6.2f} | canon/comm {ratio:5.2f}")
    cur.close(); conn.close()
    print("\n=== RANKED by canon/commentary per-char ratio (>1 = COUNTER-THESIS candidate, canon denser) ===")
    for r in sorted(rows, key=lambda x: -x[6]):
        flag = '  <-- COUNTER' if r[6] > 1 else ''
        print(f"  {r[6]:5.2f}x  {r[0][:40]:40} (canon {r[4]}/Mc vs comm {r[5]}/Mc){flag}")


if __name__ == "__main__":
    main()
