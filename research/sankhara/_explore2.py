#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Exploration pass 2: dump the full maxim cell texts (for hand word-alignment) +
the Sujato/Thanissaro renderings on canonical DO / aggregate / triad exemplars,
so the maxim-switch finding is confirmed per-row before the prereg freeze.
Single serial conn, read-only. PYTHONIOENCODING=utf-8."""
import os, sys, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'naga'))
from sql import _get_dsn
import psycopg2

MAXIM = r'sabbe +saṅkhārā +(anicc|dukkh)'

def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")

    print("=" * 80)
    print("A. EVERY maxim translation row (own-text), full snippet for hand word-alignment")
    print("=" * 80)
    cur.execute(f"""SELECT p.id, p.citation, p.is_primary, t.translator, t.source, t.text
                    FROM passages p JOIN translations t ON t.passage_id=p.id
                    WHERE p.work_role='mula' AND p.original ~* %s
                      AND COALESCE(t.visibility,'public')='public'
                    ORDER BY t.translator, p.id""", (MAXIM,))
    for pid, cit, prim, tr, src, text in cur.fetchall():
        # show the line(s) mentioning the impermanence/suffering of conditions
        t = (text or '').replace('\n', ' ')
        m = re.search(r'.{0,10}\ball[^.]{0,60}\b(?:impermanent|inconstant|unstable|stress|suffering|dukkha|unsatisfact)[^.]{0,15}', t, re.I)
        seg = m.group(0).strip() if m else t[:120]
        print(f"  [{tr}/{src}] {cit} (prim={prim}) {pid}")
        print(f"       ...{seg}...")

    print("\n" + "=" * 80)
    print("B. Sujato vs Thanissaro on canonical exemplars (DO / aggregate / triad)")
    print("=" * 80)
    exemplars = {
        'DO link (SN 12.2 paṭicca-samuppāda)': ['sn12.2'],
        'DO link (SN 12.1)': ['sn12.1'],
        'aggregate (SN 22.48 Khandha)': ['sn22.48'],
        'aggregate cha cetanākāyā (SN 22.56)': ['sn22.56'],
        'aggregate (SN 22.79 being-eaten)': ['sn22.79'],
        'triad (MN 44 Cūḷavedalla)': ['mn44'],
        'triad (MN 118 ānāpānasati)': ['mn118'],
        'maxim (Dhp 277-ish / dhp273-289)': ['dhp273-289'],
        'maxim (SN 22.90)': ['sn22.90'],
    }
    for label, ids in exemplars.items():
        print(f"\n  --- {label} ---")
        for pid in ids:
            cur.execute("""SELECT t.translator, t.source, t.text FROM translations t
                           WHERE t.passage_id=%s AND t.translator IN ('sujato','thanissaro')
                             AND COALESCE(t.visibility,'public')='public'
                           ORDER BY t.translator""", (pid,))
            got = cur.fetchall()
            if not got:
                print(f"    {pid}: (no sujato/thanissaro rows)"); continue
            for tr, src, text in got:
                t = (text or '').replace('\n', ' ')
                # find a saṅkhāra-rendering hint near choices/fabrications/conditions/formations
                words = ['choice','fabrication','condition','formation','determination','activity','construction','process','force','volition']
                hits = []
                for w in words:
                    for mm in re.finditer(r'\b'+w+r'[a-z]*\b', t, re.I):
                        hits.append(mm.group(0).lower())
                from collections import Counter
                print(f"    [{tr}] words={dict(Counter(hits))}")
                # print first 200 chars for context
                print(f"        {t[:200]}")

    cur.close(); conn.close()

if __name__ == '__main__':
    main()
