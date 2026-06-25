#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Run a study protocol's frozen enumeration SQL serially and dump results to _raw.json.
Reads research/<slug>/_protocol.json (enumeration_sql = [{label, sql}, ...]), runs each query on ONE
connection (dhamma-pg is serial-only), captures rows or per-query error, writes research/<slug>/_raw.json.
Usage: PYTHONIOENCODING=utf-8 python research/generic_enumerate.py <slug>
(export DATABASE_URL first to skip the ~5s flyctl self-extract per run.)"""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'naga'))
from sql import _get_dsn
import psycopg2

MAXROWS = 3000

def main():
    slug = sys.argv[1]
    here = os.path.dirname(__file__)
    proto = json.load(open(os.path.join(here, slug, '_protocol.json'), encoding='utf-8'))
    queries = proto.get('enumeration_sql', [])
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25)
    conn.autocommit = True  # each statement is its own txn, so one failure does not poison the rest
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")
    out = {'meta': {'slug': slug, 'title': proto.get('title'), 'as_of': '2026-06-24',
                    'n_queries': len(queries)}, 'results': []}
    ok = err = 0
    for q in queries:
        label = q.get('label', '?'); sql = q.get('sql', '')
        rec = {'label': label, 'sql': ' '.join(sql.split())}
        try:
            cur.execute(sql)
            if cur.description:
                cols = [d[0] for d in cur.description]
                rows = cur.fetchall()
                rec['columns'] = cols
                rec['rowcount'] = len(rows)
                rec['rows'] = [list(r) for r in rows[:MAXROWS]]
                if len(rows) > MAXROWS:
                    rec['truncated_to'] = MAXROWS
            else:
                rec['note'] = 'no result set'
            ok += 1
            print(f"  [ok]  {label[:48]:48} -> {rec.get('rowcount','-')} rows")
        except Exception as e:
            rec['ERROR'] = str(e)[:300]
            err += 1
            print(f"  [ERR] {label[:48]:48} -> {str(e)[:90]}")
        out['results'].append(rec)
    cur.close(); conn.close()
    out['meta']['ok'] = ok; out['meta']['err'] = err
    path = os.path.join(here, slug, '_raw.json')
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
    print(f"wrote {path}  ({ok} ok / {err} err)")

if __name__ == '__main__':
    main()
