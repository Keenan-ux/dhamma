#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Auditability backfill (adversarial-review finding S4): capture the corpus-level
query->result facts the five studies cite but do NOT store in their served datasets,
so every published count re-derives from the repo. One serial connection (dhamma-pg
is serial-only). Writes research/CORPUS-SNAPSHOT-2026-06-24.json.
Usage: PYTHONIOENCODING=utf-8 python research/_make_corpus_snapshot.py
"""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'naga'))
from sql import _get_dsn
import psycopg2

AS_OF = "2026-06-24"
CORPUS = "194,710 passages (postgres 16.14, pgvector)"

# (study, claim, sql) — each returns rows; stored verbatim as the audit record.
QUERIES = [
 ("shared", "Per-layer row + character totals (the base rate behind every per-character density claim).",
  """SELECT CASE WHEN work_role='mula' THEN '1_mula(canon)' WHEN work_slug LIKE '%-tika' THEN '3_tika'
       WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN '2_attha' ELSE '4_anya' END layer,
     count(*) rows, sum(char_length(original)) chars, round(avg(char_length(original))) avg_chars
   FROM passages GROUP BY 1 ORDER BY 1"""),

 ("individual-guidance", "carita (temperament) = 0 in the four Nikayas (mula) — the load-bearing negative, diacritic-correct.",
  """SELECT count(*) FROM passages WHERE work_role='mula' AND work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an')
     AND original ~* 'rāgacarit|dosacarit|mohacarit|vitakkacarit|saddhācarit|buddhicarit|ñāṇacarit|samacarit'"""),
 ("individual-guidance", "carita = 0 in the canonical Abhidhamma (mula).",
  """SELECT count(*) FROM passages WHERE work_role='mula' AND (work_slug LIKE 'pli-abh%' OR work_slug LIKE '%abhidhamma%')
     AND original ~* 'rāgacarit|dosacarit|mohacarit|vitakkacarit|saddhācarit|buddhicarit|ñāṇacarit'"""),
 ("individual-guidance", "carita = 0 in the Patisambhidamagga (the para-canonical work sometimes taken as its home).",
  """SELECT count(*) FROM passages WHERE id LIKE 'cst-s0517m%'
     AND original ~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit'"""),
 ("individual-guidance", "sabhava (own-nature) by layer bucket, excluding purisabhava/ekamsabhavita (the G1 climb: canon~0 / attha / vism / tika).",
  """SELECT CASE WHEN work_slug='pli-vism' THEN 'vism' WHEN work_slug LIKE '%-tika' THEN 'tika'
       WHEN work_slug LIKE '%-attha' THEN 'attha' WHEN work_role='mula' THEN 'mula(raw-stem)' ELSE 'other' END b, count(*)
   FROM passages WHERE original ~* 'sabhāv' AND original !~* 'purisabhāv|ekaṃsabhāvit' GROUP BY 1 ORDER BY 2 DESC"""),
 ("individual-guidance", "kammatthana raw stem-hits in the four Nikayas (mula): 11 raw, all ordinary sense (technical=0 by per-row audit).",
  """SELECT work_slug, count(*) FROM passages WHERE work_role='mula' AND work_slug IN ('pli-an','pli-mn','pli-dn')
     AND original ~* 'kammaṭṭhān' GROUP BY 1 ORDER BY 2 DESC"""),
 ("individual-guidance", "kammatthana in the Visuddhimagga (the 134-of-148 confinement numerator).",
  "SELECT count(*) FROM passages WHERE work_slug='pli-vism' AND original ~* 'kammaṭṭhān'"),

 ("uttarakuru", "Divine-eye pericope attestations (the 'never under the verification formula' backbone): 176x.",
  "SELECT count(*) FROM passages WHERE original ILIKE '%dibbena cakkhunā visuddhena atikkantamānusakena%'"),
 ("uttarakuru", "Mula rows carrying BOTH the divine-eye formula and the name Uttarakuru: exactly 5.",
  """SELECT count(*) FROM passages WHERE work_role='mula' AND original ILIKE '%dibbena cakkhu%' AND original ~* 'uttarakur'"""),
 ("uttarakuru", "Mula rows naming Uttarakuru at all (context for the canon-vs-commentary split).",
  "SELECT count(*) FROM passages WHERE work_role='mula' AND original ~* 'uttarakur'"),

 ("awakening", "Marker availability by layer (the cross-layer confound): desanapariyosane (mass 'at the close of the talk') 0 mula / many attha.",
  """SELECT CASE WHEN work_role='mula' THEN 'mula' WHEN work_slug LIKE '%-tika' THEN 'tika'
       WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'attha' ELSE 'anya' END layer, count(*)
   FROM passages WHERE original ~* 'desanāpariyosāne' GROUP BY 1 ORDER BY 2 DESC"""),
 ("awakening", "Marker availability: arahatta(ṃ) papuni ('attained arahatship') by layer.",
  """SELECT CASE WHEN work_role='mula' THEN 'mula' WHEN work_slug LIKE '%-tika' THEN 'tika'
       WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'attha' ELSE 'anya' END layer, count(*)
   FROM passages WHERE original ~* 'arahatta.{0,3}pāpuṇi|arahatta.{0,3}patt' GROUP BY 1 ORDER BY 2 DESC"""),

 ("naga", "Snake-synonym recall floor: mula rows whose nāga-being material might hide under ahi/sappa/āsīvisa/uraga (the disclosed <=6 floor).",
  """SELECT count(*) FROM passages WHERE work_role='mula' AND original ~* '\\mahi|\\msapp|āsīvis|uraga'"""),
]


def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SET statement_timeout='115s';")
    out = {"meta": {"as_of": AS_OF, "corpus": CORPUS,
                    "note": "Auditability backfill for the 2026-06-23 adversarial review (finding S4). "
                            "Each entry is a corpus-level fact a study's published claim rests on but does not store "
                            "in its served dataset; the SQL + result is the committed audit record so the count re-derives "
                            "from the repo without a fresh DB run. Heart-base has its own research/heart-base/counts-snapshot.json.",
                    "snapshots": []}}
    for study, claim, sql in QUERIES:
        try:
            cur.execute(sql)
            cols = [d[0] for d in cur.description]
            rows = cur.fetchall()
            result = [dict(zip(cols, r)) for r in rows]
        except Exception as e:
            result = {"ERROR": str(e)[:200]}
        out["meta"]["snapshots"].append({
            "study": study, "claim": claim,
            "sql": " ".join(sql.split()),
            "result": result,
        })
        print(f"[{study}] {claim[:60]}... -> {result if isinstance(result, list) and len(result) <= 6 else (str(result)[:80])}")
    cur.close(); conn.close()
    path = os.path.join(os.path.dirname(__file__), "CORPUS-SNAPSHOT-2026-06-24.json")
    json.dump(out, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=str)
    print("\nwrote", path, len(out["meta"]["snapshots"]), "snapshots")


if __name__ == "__main__":
    main()
