#!/usr/bin/env python
"""Follow-up probe: is the SEEING in vipassana the same cognitive act as the path-moment?
The Abhidhamma's lead is the OBJECT (arammana): insight takes the conditioned (sankhara) as
object; the magga takes the unconditioned (nibbana). The hinge is gotrabhu, where the object
switches. Measure where that apparatus lives (predict: post-sutta, Abhidhamma + commentary)."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "naga"))
from sql import _get_dsn
import psycopg2
conn = psycopg2.connect(_get_dsn(), connect_timeout=25); conn.autocommit = True
cur = conn.cursor(); cur.execute("SET statement_timeout='150s';")

def strat(label, where):
    cur.execute(f"SELECT stratum(work_slug) s, count(*) FROM passages WHERE is_primary AND {where} GROUP BY s ORDER BY s;")
    r = dict(cur.fetchall())
    e = r.get('1early',0); ab = r.get('3abh',0); c = r.get('5comm',0)+r.get('6tika',0)
    print(f"  {label:40s} early={e:4d} abh={ab:4d} comm={c:4d} all={sum(r.values())}")

print("=== the object-switch apparatus (saṅkhārupekkhā -> anuloma -> gotrabhū -> magga) ===")
strat("saṅkhārupekkhā (insight, object=sankhara)", "original ~* 'saṅkhārupekkh'")
strat("anuloma(ñāṇa) (conformity knowledge)", "original ~* 'anulomañāṇ|anulomaṃ ñāṇ'")
strat("gotrabhū (change-of-lineage, the pivot)", "original ~* 'gotrabhū|gotrabhu'")
strat("nibbānārammaṇa (magga's object = nibbana)", "original ~* 'nibbānāramman|nibbānārammaṇ'")
print("\n=== the two objects named directly ===")
strat("saṅkhārārammaṇa (object = the conditioned)", "original ~* 'saṅkhārāramman|saṅkhārārammaṇ'")
strat("asaṅkhata + ārammaṇa (unconditioned as object)", "original ~* 'asaṅkhat' AND original ~* 'āramman|ārammaṇ'")
print("\n=== the seeing-of-not-self vocabulary (does the sutta locate it on conditioned phenomena?) ===")
strat("anattānupassanā (contemplation of not-self)", "original ~* 'anattānupassan'")
strat("'sabbe dhammā anattā' (all dhammas not-self)", "original ~* 'sabbe dhammā anattā'")
print("\n=== sample: how gotrabhū is defined (the object-switch in its own words) ===")
cur.execute("""SELECT id, stratum(work_slug), left(translation, 240)
               FROM passages WHERE is_primary AND original ~* 'gotrabhū'
               AND translation IS NOT NULL AND length(translation)>40
               ORDER BY (stratum(work_slug)='1early') DESC, md5(id::text) LIMIT 3;""")
for pid, s, t in cur.fetchall():
    print(f"  [{s}] {pid}: {t}")
cur.execute("""SELECT id, stratum(work_slug), left(original, 300)
               FROM passages WHERE is_primary AND original ~* 'gotrabhū.{0,80}(nibbān|ārammaṇ)'
               ORDER BY md5(id::text) LIMIT 2;""")
print("  -- gotrabhū near nibbāna/object (Pali) --")
for pid, s, o in cur.fetchall():
    print(f"  [{s}] {pid}: {o}")
print("\n[done]")
