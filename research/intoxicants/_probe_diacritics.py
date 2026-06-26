#!/usr/bin/env python
"""§2a groundwork: (1) resolve the diacritic convention of passages.original so all
instrumental-precept patterns are correct, and (2) reconcile the v2 reference counts
(regression gate) before building on them. One connection, serial."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "naga"))
from sql import _get_dsn
import psycopg2

conn = psycopg2.connect(_get_dsn(), connect_timeout=20)
conn.autocommit = True
cur = conn.cursor()
cur.execute("SET statement_timeout = '120s';")

def c(sql, params=None):
    if params:
        cur.execute(sql, params)
    else:
        cur.execute(sql)  # no params => psycopg2 does NOT treat % as a placeholder
    return cur.fetchone()[0]

print("=== DIACRITIC CONVENTION PROBE (original column) ===")
probes = [
    ("surA diacritic  ~* 'surā'",      "original ~* 'surā'"),
    ("surA ascii      ~* 'sura'",      "original ~* 'sura'"),
    ("meraya          ~* 'meraya'",    "original ~* 'meraya'"),
    ("pamadatthan ASCII ILIKE",        "original ILIKE '%pamadatthan%'"),
    ("pamadatthan ASCII ~*",           "original ~* 'pamadatthan'"),
    ("pamādaṭṭhān diacritic ~*",       "original ~* 'pamādaṭṭhān'"),
    ("pamādaṭṭhāna diacritic ~*",      "original ~* 'pamādaṭṭhāna'"),
    ("majja substring ~*",             "original ~* 'majja'"),
    ("majja ILIKE",                    "original ILIKE '%majja%'"),
]
for label, where in probes:
    try:
        n = c(f"SELECT count(*) FROM passages WHERE {where};")
        print(f"  {label:34s} -> {n}")
    except Exception as e:
        print(f"  {label:34s} -> ERROR {e}")

print("\n=== sample original text (is there diacritics at all?) ===")
cur.execute("SELECT id, left(original, 160) FROM passages WHERE original ~* 'pamādaṭṭhān' LIMIT 2;")
for pid, txt in cur.fetchall():
    print(f"  {pid}: {txt}")
cur.execute("SELECT id, left(original, 160) FROM passages WHERE original ~* 'meraya' AND work_role='mula' LIMIT 2;")
for pid, txt in cur.fetchall():
    print(f"  {pid}: {txt}")

print("\n=== REGRESSION: v2 substring reference counts (all layers, NOT is_primary) ===")
for term, expect in [("meraya", 279), ("majja", 1455), ("surā", 926)]:
    n = c(f"SELECT count(*) FROM passages WHERE original ILIKE %(p)s;", {"p": f"%{term}%"})
    flag = "OK" if n == expect else f"DRIFT (v2={expect})"
    print(f"  {term:8s} substring ILIKE -> {n}  [{flag}]")
nunion = c("SELECT count(*) FROM passages WHERE original ILIKE '%meraya%' OR original ILIKE '%majja%' OR original ILIKE '%surā%';")
print(f"  union -> {nunion}  [{'OK' if nunion==2115 else 'DRIFT (v2=2115)'}]")

print("\n=== KEY v2 counts to confirm ===")
n = c("SELECT count(*) FROM passages WHERE original ~* 'pamādaṭṭhān';")
print(f"  pamādaṭṭhān ~* -> {n}  (v2 rung3 reported 205 via ILIKE '%pamadatthan%')")
n = c("SELECT count(*) FROM passages WHERE original ~* 'madanīy';")
print(f"  madanīy ~* -> {n}  (v2 rung3 reported 64)")
# the open-list keystone generalisation: 'yaṃ vā panaññampi ... madanīyaṃ'
cur.execute("""SELECT id, work_role, stratum(work_slug) FROM passages
               WHERE original ~* 'yaṃ vā panaññampi.{0,40}madanīy' ORDER BY id;""")
rows = cur.fetchall()
print(f"  open-list generalisation 'yaṃ vā panaññampi ... madanīy' -> {len(rows)} rows (v2 reported 2, both commentarial):")
for pid, wr, st in rows:
    print(f"      {pid}  work_role={wr}  stratum={st}")

print("\n=== stratum distribution (is_primary) ===")
cur.execute("""SELECT stratum(work_slug) AS s, count(*),
               round((SUM(char_length(original))/1000000.0)::numeric,3) AS mchar
               FROM passages WHERE is_primary GROUP BY s ORDER BY s;""")
for s, n, mchar in cur.fetchall():
    print(f"  {s}: rows={n}  mchar={mchar}")
