#!/usr/bin/env python
"""§7 fold-in: count-lock read the object-asymmetry terms + persist the census to
_object_evidence.json (data-bound source for the page). Serial, one connection.
Thesis: the technical difference between insight-seeing and the path-moment is the OBJECT
(conditioned saṅkhārā vs unconditioned nibbāna); the apparatus is post-sutta; gotrabhū is the hinge."""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "naga"))
from sql import _get_dsn
import psycopg2
conn = psycopg2.connect(_get_dsn(), connect_timeout=25); conn.autocommit = True
cur = conn.cursor(); cur.execute("SET statement_timeout='150s';")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_object_evidence.json")

def census(pattern, exclude=None):
    exc = "AND original !~* %(e)s" if exclude else ""
    cur.execute(f"SELECT stratum(work_slug) s, count(*) FROM passages WHERE is_primary AND original ~* %(p)s {exc} GROUP BY s;",
                {"p": pattern, "e": exclude})
    r = dict(cur.fetchall())
    return {"early": r.get('1early',0), "late": r.get('2late',0), "abh": r.get('3abh',0),
            "para": r.get('4para',0), "comm": r.get('5comm',0)+r.get('6tika',0),
            "atthakatha": r.get('5comm',0), "tika": r.get('6tika',0),
            "all": sum(r.values())}

def sample(label, pattern, strata, n=5, w=320):
    print(f"\n-- {label} --")
    cur.execute(f"""WITH b AS (SELECT id, work_role, stratum(work_slug) s, original, translation,
                   row_number() OVER (PARTITION BY stratum(work_slug) ORDER BY md5(id::text)) rn
                   FROM passages WHERE is_primary AND original ~* %(p)s)
                   SELECT id, s, original, translation FROM b WHERE rn<=%(n)s AND s = ANY(%(st)s) ORDER BY s, rn;""",
                {"p": pattern, "n": n, "st": list(strata)})
    rows = []
    for pid, s, o, t in cur.fetchall():
        txt = (t or o or '')[:w]
        print(f"  [{s}] {pid}: {txt}")
        rows.append({"id": pid, "stratum": s})
    return rows

terms = {
    "sankharupekkha": census(r"saṅkhārupekkh"),
    "anuloma_nana": census(r"anulomañāṇ|anulomaṃ ñāṇ"),
    "gotrabhu": census(r"gotrabhū|gotrabhu"),
    "nibbanarammana": census(r"nibbānāramman|nibbānārammaṇ"),
    "sabbe_dhamma_anatta": census(r"sabbe dhammā anattā"),
}
print("=== CENSUS (deduped is_primary) ===")
for k, v in terms.items():
    print(f"  {k:22s} early={v['early']:3d} abh={v['abh']:3d} comm={v['comm']:3d} all={v['all']}")

print("\n=== COUNT-LOCK SAMPLES ===")
sample("gotrabhū EARLY (confirm: person-type, not the citta?)", r"gotrabhū|gotrabhu", ['1early'], n=3)
sample("gotrabhū ABHIDHAMMA (the citta sense?)", r"gotrabhū|gotrabhu", ['3abh'], n=3)
sample("saṅkhārupekkhā COMM (insight-knowledge, object=sankhara?)", r"saṅkhārupekkh", ['5comm','6tika'], n=3)
sample("nibbānārammaṇa COMM (magga's object=nibbana?)", r"nibbānāramman|nibbānārammaṇ", ['5comm','6tika'], n=3)

# the hinge locus, full
cur.execute("SELECT id, work_role, stratum(work_slug), citation, original FROM passages WHERE id='cst-s0303t.tik-sn3_1_p145';")
row = cur.fetchone()
hinge = None
if row:
    pid, wr, st, cit, orig = row
    import re
    m = re.search(r"Gotrabhū pana", orig)
    win = orig[max(0,m.start()-40):m.start()+360] if m else orig[:360]
    hinge = {"id": pid, "work_role": wr, "stratum": st, "citation": cit, "quote": win}
    print(f"\n=== HINGE LOCUS {pid} ({st}) ===\n  {win}")

json.dump({"census": terms, "hinge": hinge,
           "_doc": "object-asymmetry apparatus per stratum (deduped is_primary). The difference between "
                   "insight-seeing (object=saṅkhārā) and the path-moment (object=nibbāna) is the object; the "
                   "apparatus is post-sutta; gotrabhū is the hinge. gotrabhū early rows are a person-type "
                   "(an9.10/an10.16), NOT the citta-pivot (sense-read)."},
          open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\n[saved] {OUT}")
