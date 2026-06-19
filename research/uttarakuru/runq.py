#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Run selected v2 plan queries SERIALLY (one connection, sequential). Usage: python runq.py 6 28 19 ..."""
import json, os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import psycopg2

HERE = os.path.dirname(os.path.abspath(__file__))
inv = json.load(open(os.path.join(HERE, '_v2_queries.json'), encoding='utf-8'))

def clean(sql):
    # the extracted sql carries literal backslash-n (two chars) instead of newlines
    return sql.replace('\\n', '\n').replace('\\t', '\t')

idxs = [int(x) for x in sys.argv[1:]] or list(range(len(inv)))
conn = psycopg2.connect(os.environ['DATABASE_URL']); conn.autocommit = True
cur = conn.cursor(); cur.execute("SET statement_timeout='90s'")
for i in idxs:
    sql = clean(inv[i]['sql'])
    print('=' * 72)
    print('#%d' % i, '|', ' '.join(sql.split())[:90])
    try:
        cur.execute(sql)
        if cur.description:
            cols = [d[0] for d in cur.description]
            rows = cur.fetchall()
            print(' | '.join(cols))
            for r in rows[:16]:
                print(' | '.join('' if v is None else str(v)[:46] for v in r))
            print('-- %d row(s)' % len(rows))
        else:
            print('(no result set)')
    except Exception as e:
        print('ERR:', str(e).splitlines()[0][:200])
