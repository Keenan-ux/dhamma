#!/usr/bin/env python
"""§2a supplement: lock the two sharp findings.
(a) the dasakammapatha STRUCTURAL split - drink absent from the kammapatha purity scheme
    while the other four precepts' content is present (the register-split for P5/P3/instrumentality).
(b) the provenance of the explicit 'drunk -> breaks the others' exemplum (Kumbha/Surapana Jataka,
    commentary) - is it canonical formula or a later narrative? (pamatto-does was 0 in-cluster).
One connection, serial."""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "naga"))
from sql import _get_dsn
import psycopg2

conn = psycopg2.connect(_get_dsn(), connect_timeout=25); conn.autocommit = True
cur = conn.cursor(); cur.execute("SET statement_timeout = '180s';")
DRINK = r"(meraya|surā|majja[ṃṁ]|majjap|majje[\s,.]|madirā|pānānuyog|surāpān|telapāk|madhupān|vāruṇī)"

def count(label, where, params=None):
    cur.execute(f"SELECT count(*) FILTER (WHERE is_primary) FROM passages WHERE {where};", params or {})
    n = cur.fetchone()[0]; print(f"  {label:46s} -> {n}"); return n

def sample(label, where, params=None, n=8, w=300):
    cur.execute(f"""WITH b AS (SELECT id, work_role, stratum(work_slug) s, original,
                   row_number() OVER (ORDER BY md5(id::text)) rn FROM passages
                   WHERE is_primary AND {where}) SELECT id,work_role,s,original FROM b WHERE rn<=%(n)s;""",
                {**(params or {}), "n": n})
    print(f"\n-- {label} --")
    for pid, wr, s, o in cur.fetchall():
        print(f"  [{s}/{wr}] {pid}: {(o or '')[:w]}")

print("=== (a) dasakammapatha: is drink IN the ten courses of action? ===")
count("kammapath* total", "original ~* 'kammapath'")
count("kammapath* AND drink-cluster", "original ~* 'kammapath' AND original ~* %(d)s", {"d": DRINK})
# read the few co-occurrence rows to confirm drink is NOT a member, just nearby
sample("kammapath x drink (read: is drink a member?)",
       "original ~* 'kammapath' AND original ~* %(d)s", {"d": DRINK}, n=6, w=420)
# the canonical 10-kammapatha enumerand head (3 kaya, 4 vaci, 3 mano): confirm surameraya absent from it
print("\n  -- the standard dasakammapatha never lists surameraya; confirm by reading a kammapatha enumeration --")
sample("a kammapatha enumeration (mula)",
       "original ~* 'dasa.{0,4}kammapath|akusalakammapath' AND work_role='mula'", n=3, w=500)

print("\n=== (b) the 'drink -> evils' exemplum: where does it live? ===")
# Kumbha Jataka (the origin-of-liquor story) and any Jataka surapana
count("Jataka rows w/ surapana", "work_role IN ('mula','anya') AND original ~* 'surāpān'")
cur.execute("""SELECT id, citation, left(original,160) FROM passages
               WHERE original ~* 'kumbhajātak|surāpānajātak|surādhutta|surāsoṇḍ' LIMIT 8;""")
print("\n-- liquor-vice narrative ids --")
for pid, cit, o in cur.fetchall():
    print(f"  {pid} ({cit}): {o}")
# the explicit cascade: drink named as leading to (the other precepts / all evil) anywhere
sample("drink -> 'does all evil / breaks sila' (any layer)",
       "original ~* %(d)s AND original ~* '(sabbapāp|sabbākusal|sīla[mṃ]?\\s*bhind|sīlavināsa|anekapāp)'",
       {"d": DRINK}, n=8, w=360)

print("\n=== (c) flesh-bar contrast: manussamamsa carve-out? (vs liquor undetectability) ===")
sample("manussamamsa ruling (canon)", "original ~* 'manussama[ṁṃ]s' AND work_role='mula'", n=3, w=400)
print("\n[done]")
