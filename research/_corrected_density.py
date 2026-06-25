#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Corrected per-character density: canon side DEDUPED (is_primary) so the SC+CST double-ingest of the
canon does not understate canon density / overstate house ratios (the flagship review catch, confirmed:
mula un-dedup 52.3M vs dedup 25.7M, while commentary is single-edition). Apples-to-apples: every logical
text counted once. Writes research/EXPANSION-CORRECTED-DENSITY-2026-06-25.json. Serial single conn."""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'naga'))
from sql import _get_dsn
import psycopg2

TERMS = [
 ('sabhava (ex purisabhava/ekamsabhavita)', 'sabhāv', "AND original !~* 'purisabhāv|ekaṃsabhāvit'", 'house'),
 ('paramattha', 'paramatth', '', 'house'),
 ('matika', 'mātik', '', 'house'),
 ('cetasika', 'cetasik', '', 'house'),
 ('iddhi', 'iddh', '', 'house'),
 ('patihariya', 'pāṭihār', '', 'house'),
 ('abhinna', 'abhiññ', '', 'house'),
 ('maxim sabbe dhamma anatta', 'sabbe dhammā anattā', '', 'counter'),
 ('anatta (stem)', 'anatt', '', 'mixed'),
 ('natthi atta (existential denial)', 'natthi attā|natthattā', '', 'house?'),
]

def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")
    # deduped denominators (every logical text once)
    cur.execute("""SELECT
      sum(char_length(original)) FILTER (WHERE work_role='mula' AND work_slug<>'pli-vism' AND is_primary)/1e6,
      sum(char_length(original)) FILTER (WHERE (work_slug LIKE '%-attha' OR work_slug='pli-vism') AND is_primary)/1e6,
      sum(char_length(original)) FILTER (WHERE work_slug LIKE '%-tika' AND is_primary)/1e6
      FROM passages""")
    mula, attha, tika = [float(x) for x in cur.fetchone()]
    comm = attha + tika
    out = {'meta': {'as_of': '2026-06-25', 'method': 'canon DEDUPED (is_primary) apples-to-apples; corrects the SC+CST canon double-ingest',
                    'mchar_dedup': {'mula': round(mula,3), 'attha': round(attha,3), 'tika': round(tika,3), 'commentary': round(comm,3)}}, 'terms': []}
    print(f"deduped denominators Mchar: mula {mula:.2f}  attha {attha:.2f}  tika {tika:.2f}  comm {comm:.2f}\n")
    print(f"{'term':40} {'can#':>5} {'att#':>5} {'tik#':>5} | {'can/Mc':>7} {'com/Mc':>7} {'ratio':>6} dir")
    print('-'*96)
    for label, rx, extra, hint in TERMS:
        cur.execute(f"SELECT count(*) FROM passages WHERE work_role='mula' AND work_slug<>'pli-vism' AND is_primary AND original ~* %s{extra}", (rx,))
        can = cur.fetchone()[0]
        cur.execute(f"SELECT count(*) FROM passages WHERE (work_slug LIKE '%%-attha' OR work_slug='pli-vism') AND is_primary AND original ~* %s{extra}", (rx,))
        att = cur.fetchone()[0]
        cur.execute(f"SELECT count(*) FROM passages WHERE work_slug LIKE '%%-tika' AND is_primary AND original ~* %s{extra}", (rx,))
        tik = cur.fetchone()[0]
        cand = round(can/mula, 3); comd = round((att+tik)/comm, 3)
        ratio = round(cand/comd, 3) if comd else None
        direction = 'counter(canon-denser)' if (ratio and ratio > 1) else 'house(comm-denser)'
        out['terms'].append({'term': label, 'regex': rx, 'canon': can, 'attha': att, 'tika': tik,
                             'canon_per_Mc': cand, 'comm_per_Mc': comd, 'ratio': ratio, 'direction': direction})
        print(f"{label[:40]:40} {can:>5} {att:>5} {tik:>5} | {cand:>7} {comd:>7} {str(ratio):>6} {direction}")
    cur.close(); conn.close()
    path = os.path.join(os.path.dirname(__file__), 'EXPANSION-CORRECTED-DENSITY-2026-06-25.json')
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
    print('\nwrote', path)

if __name__ == '__main__':
    main()
