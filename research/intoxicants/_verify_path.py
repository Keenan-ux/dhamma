#!/usr/bin/env python
"""Re-verify the §6 path-distinction census (vikkhambhana/samuccheda/tadanga + the
canonical irreversibility anchors) before building §7 on them. Deduped is_primary,
per-stratum. Serial, one connection."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "naga"))
from sql import _get_dsn
import psycopg2
conn = psycopg2.connect(_get_dsn(), connect_timeout=25); conn.autocommit = True
cur = conn.cursor(); cur.execute("SET statement_timeout='150s';")

def strat(label, where, params=None):
    cur.execute(f"""SELECT stratum(work_slug) s, count(*) FROM passages
                    WHERE is_primary AND {where} GROUP BY s ORDER BY s;""", params or {})
    rows = dict(cur.fetchall())
    early = rows.get('1early',0); comm = rows.get('5comm',0)+rows.get('6tika',0)
    print(f"  {label:32s} early={early:4d}  5comm={rows.get('5comm',0):4d}  6tika={rows.get('6tika',0):4d}  all={sum(rows.values())}")

# MEASURED 2026-06-26 (this script, deduped is_primary, the exact patterns below):
#   vikkhambhana 0/250/363 ; samuccheda 4/280/283 ; tadanga 3/163/157
#   avinipata 70 early ; sambodhiparayana 36 early ; anusaya+samugghata 11 early ; nibbanarammana 0/90/116
# (The handoff quoted tadanga 5/181/187 and 'niyata+sambodhiparayana' 29: looser/co-occurrence patterns.
#  The combined study + intoxicants.json cite the MEASURED values from THIS script's exact patterns.)
print("=== mode-of-abandonment taxonomy ===")
strat("vikkhambhana (suppression)", "original ~* 'vikkhambhan'")
strat("samuccheda (cutting-off)", "original ~* 'samuccheda'")
strat("tadanga (substitution)", "original ~* 'tadaṅga'")
print("\n=== canonical irreversibility anchors ===")
strat("avinipata (cannot fall)", "original ~* 'avinipāt'")
strat("sambodhiparayana", "original ~* 'sambodhiparāyan'")
strat("anusaya + samugghata", "original ~* 'anusay' AND original ~* 'samugghāt'")
print("\n=== magga's object (handoff: nibbanarammana 0/90/116 commentarial) ===")
strat("nibbanarammana", "original ~* 'nibbānāramman|nibbānārammaṇ'")
print("\n[done]")
