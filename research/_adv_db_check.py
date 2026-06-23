#!/usr/bin/env python
"""Serial DB spot-checks for the 2026-06-23 adversarial review.
One connection, queries run one-at-a-time (dhamma-pg is serial-only).
DSN via naga/sql.py self-extract (proxy must be up: flyctl proxy 15432:5432 --app dhamma-pg).
Usage: PYTHONIOENCODING=utf-8 python research/_adv_db_check.py <stage>
"""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'naga'))
from sql import _get_dsn
import psycopg2

stage = sys.argv[1] if len(sys.argv) > 1 else 'schema'

# ---- query batches ----
SCHEMA = {
 'work_role counts': "SELECT work_role, count(*) FROM passages GROUP BY work_role ORDER BY 2 DESC",
 'sample slugs by role': "SELECT work_role, (array_agg(DISTINCT work_slug))[1:6] FROM passages GROUP BY work_role ORDER BY 1",
 'per-layer rows+chars': """
   SELECT CASE
     WHEN work_role='mula' THEN '1_mula'
     WHEN work_slug LIKE '%-tika' OR work_slug LIKE '%tika%' THEN '3_tika'
     WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' OR work_slug LIKE '%attha%' THEN '2_attha'
     ELSE '4_other' END AS layer,
     count(*) AS rows, sum(char_length(original)) AS chars,
     round(avg(char_length(original))) AS avg_chars
   FROM passages GROUP BY 1 ORDER BY 1""",
}

# Stage 2: number-changing spot checks
AWAKE = {
 'awk_sn4_1 len+markers': """
   SELECT id, char_length(original) len,
     (original ~* 'rāhul') has_rahula,
     (original ~* 'pubbeva.{0,3}sambodh|paccaññāsiṃ') has_buddha_selfclaim,
     (original ~* 'rāhulassa.{0,40}vimucc|rāhulassa.{0,40}āsavehi') rahula_freed
   FROM passages WHERE id='cst-s0304m.mul-sn4_1'""",
 'awk_vin3_1 len+markers': """
   SELECT id, char_length(original) len,
     (original ~* 'yasa') has_yasa,
     (original ~* 'paṭhamābhisambuddh|bodhikath') has_buddha_bodhi,
     (original ~* 'pitar?[ou].{0,60}vimucc|pituno.{0,60}vimucc') father_scene
   FROM passages WHERE id='cst-vin02m2.mul-vin3_1'""",
}
IG = {
 'ig_sabhava_by_bucket': """
   SELECT CASE WHEN work_slug='pli-vism' THEN 'vism'
               WHEN work_slug LIKE '%-tika' THEN 'tika'
               WHEN work_slug LIKE '%-attha' THEN 'attha'
               WHEN work_role='mula' THEN 'mula'
               ELSE 'other' END b,
          count(*)
   FROM passages
   WHERE original ~* 'sabhāv' AND original !~* 'purisabhāv|ekaṃsabhāvit'
   GROUP BY 1 ORDER BY 2 DESC""",
 'ig_carita_zero_canon': """
   SELECT work_slug, count(*) FROM passages
   WHERE work_role='mula' AND work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an')
     AND original ~* 'rāgacarit|dosacarit|mohacarit|vitakkacarit|saddhācarit|buddhicarit|ñāṇacarit|samacarit'
   GROUP BY 1""",
 'ig_carita_abhidhamma': """
   SELECT count(*) FROM passages
   WHERE work_role='mula' AND (work_slug LIKE 'pli-abh%' OR work_slug LIKE '%abhidhamma%')
     AND original ~* 'rāgacarit|dosacarit|mohacarit|vitakkacarit|saddhācarit|buddhicarit|ñāṇacarit'""",
 'ig_carita_patisambhida': """
   SELECT count(*) FROM passages WHERE id LIKE 'cst-s0517m%'
     AND original ~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit'""",
}
HB = {
 'hb_hadaya_total': "SELECT count(*) FROM passages WHERE original ILIKE '%hadayavatth%' OR original ILIKE '%hadayarūp%'",
 'hb_hadaya_canon': """SELECT count(*) FROM passages
   WHERE work_role='mula' AND work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an')
     AND (original ILIKE '%hadayavatth%' OR original ILIKE '%hadayarūp%')""",
 'hb_hadaya_abhidhamma': """SELECT count(*) FROM passages
   WHERE work_role='mula' AND (work_slug LIKE 'pli-abh%' OR work_slug LIKE '%abhidhamma%')
     AND (original ILIKE '%hadayavatth%' OR original ILIKE '%hadayarūp%')""",
 'hb_patthana_posit': """SELECT count(*) FROM passages
   WHERE work_role='mula' AND (work_slug LIKE 'pli-abh%' OR work_slug LIKE '%abhidhamma%')
     AND original ILIKE '%yaṃ rūpaṃ nissāya%'""",
 # NEGATIVE CONTROL: does the verification register ever take a material support as object?
 'hb_negctrl_cakkhuvatthu_verif': """SELECT count(*) FROM passages
   WHERE original ILIKE '%cakkhuvatth%' AND (original ILIKE '%sacchikatvā%' OR original ILIKE '%yathābhūtaṃ pajānāti%' OR original ILIKE '%sayaṃ abhiññā%')""",
 'hb_negctrl_bhavanga_verif': """SELECT count(*) FROM passages
   WHERE original ILIKE '%bhavaṅg%' AND (original ILIKE '%sacchikatvā%' OR original ILIKE '%yathābhūtaṃ pajānāti%' OR original ILIKE '%sayaṃ abhiññā%')""",
 'hb_hadaya_abhinna': """SELECT count(*) FROM passages
   WHERE (original ILIKE '%hadayavatth%') AND original ILIKE '%abhiññā%'""",
}
UTT = {
 'utt_divineeye_count': "SELECT count(*) FROM passages WHERE original ILIKE '%dibbena cakkhunā visuddhena atikkantamānusakena%'",
 'utt_divineeye_loose': "SELECT count(*) FROM passages WHERE original ILIKE '%dibbena cakkhu%'",
 'utt_cooccur_mula': """SELECT count(*) FROM passages
   WHERE work_role='mula' AND original ILIKE '%dibbena cakkhu%' AND original ~* 'uttarakur'""",
 'utt_creeper': """SELECT id, citation, (original ~* 'vassasahass') yrs, (original ~* 'uttarakur') uttk,
     (original ~* 'latā|valli|rukkh|kapparukkh|pāricchattak') plant
   FROM passages WHERE original ~* 'uttarakur' AND original ~* 'vassasahass' LIMIT 20""",
}
NAGA = {
 'naga_nagadipa_sample': """SELECT id, substring(original from 1 for 160)
   FROM passages WHERE id IN ('cst-e0703n.nrf-002','cst-e1001n.nrf-014') """,
}

BATCHES = {'schema': SCHEMA, 'awake': AWAKE, 'ig': IG, 'hb': HB, 'utt': UTT, 'naga': NAGA}

def run(batch):
    conn = psycopg2.connect(_get_dsn(), connect_timeout=25)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SET statement_timeout='115s';")
    for name, sql in batch.items():
        print(f"\n### {name}")
        try:
            cur.execute(sql)
            if cur.description:
                cols = [d[0] for d in cur.description]
                rows = cur.fetchall()
                print("  ", " | ".join(cols))
                for r in rows[:40]:
                    print("  ", " | ".join('' if v is None else str(v) for v in r))
                if len(rows) > 40: print(f"   ... {len(rows)} rows")
            else:
                print("   (no rows)")
        except Exception as e:
            print("   ERROR:", str(e)[:300])
            conn.rollback() if not conn.autocommit else None
    cur.close(); conn.close()

if stage in ('all','checks'):
    os.environ['DATABASE_URL'] = _get_dsn()  # extract once, reuse across batches
    todo = ['schema','awake','ig','hb','utt','naga'] if stage=='all' else ['awake','ig','hb','utt','naga']
    for b in todo:
        print("\n========================", b, "========================")
        run(BATCHES[b])
else:
    run(BATCHES[stage])
