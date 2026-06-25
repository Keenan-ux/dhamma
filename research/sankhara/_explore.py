#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Structural exploration for the saṅkhāra translator-divergence study.
Single serial connection. Confirms the corpus shape (field counts, translator
coverage, the maxim renderings) BEFORE the prereg freeze. Read-only; writes nothing.
Re-derives DR-4's numbers (probe.py/probe2.py were deleted). PYTHONIOENCODING=utf-8."""
import os, sys, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'naga'))
from sql import _get_dsn
import psycopg2
from collections import Counter, defaultdict

# Pāli collocation-field patterns (regex on `original`, case-insensitive).
STEM = r'saṅkhār|saṃkhār'
FIELDS = {
    'do_link':       r'avijjāpaccayā saṅkhārā|saṅkhārapaccayā|saṅkhāra-paccayā|saṅkhārā;? *viññāṇ',
    'aggregate':     r'saṅkhārakkhandh',
    'aggregate_enum':r'saññā +saṅkhārā +viññāṇ|saññā,? +saṅkhārā|vedanā +saññā +saṅkhārā',
    'maxim':         r'sabbe +saṅkhārā +(anicc|dukkh)',
    'triad':         r'(kāya|vacī|vací|citta|mano)-?saṅkhār',
}

def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")

    def q(sql, args=None):
        cur.execute(sql, args); return cur.fetchall()

    print("=" * 70)
    print("1. saṅkhāra footprint by work_role (primary only)")
    print("=" * 70)
    rows = q(f"""SELECT work_role, is_primary, count(*) FROM passages
                 WHERE original ~* %s GROUP BY work_role, is_primary ORDER BY work_role, is_primary""", (STEM,))
    for r in rows: print(f"  role={r[0]!s:8} primary={r[1]!s:5} n={r[2]}")

    print("\n" + "=" * 70)
    print("2. own-text (work_role='mula', primary, ex-vism) by collocation field")
    print("=" * 70)
    base = "work_role='mula' AND is_primary AND work_slug <> 'pli-vism'"
    tot = q(f"SELECT count(*) FROM passages WHERE {base} AND original ~* %s", (STEM,))[0][0]
    print(f"  TOTAL own-text primary saṅkhāra rows: {tot}")
    for fname, pat in FIELDS.items():
        n = q(f"SELECT count(*) FROM passages WHERE {base} AND original ~* %s", (pat,))[0][0]
        print(f"    {fname:16} {n}")

    print("\n" + "=" * 70)
    print("3. translator coverage on own-text saṅkhāra passages (public rows)")
    print("=" * 70)
    rows = q(f"""SELECT t.translator, t.source, count(DISTINCT t.passage_id)
                 FROM translations t JOIN passages p ON p.id = t.passage_id
                 WHERE p.original ~* %s AND p.work_role='mula' AND COALESCE(t.visibility,'public')='public'
                 GROUP BY t.translator, t.source ORDER BY 3 DESC""", (STEM,))
    for r in rows: print(f"  {r[0]!s:24} ({r[1]}) {r[2]}")

    print("\n" + "=" * 70)
    print("4. the MAXIM cell: sabbe saṅkhārā anicc/dukkh own-text rows + translators")
    print("=" * 70)
    rows = q(f"""SELECT p.id, p.citation, p.work_slug,
                        count(t.id) FILTER (WHERE COALESCE(t.visibility,'public')='public')
                 FROM passages p LEFT JOIN translations t ON t.passage_id = p.id
                 WHERE p.work_role='mula' AND p.is_primary AND p.original ~* %s
                 GROUP BY p.id, p.citation, p.work_slug ORDER BY 4 DESC, p.id""",
             (FIELDS['maxim'],))
    print(f"  maxim own-text primary rows: {len(rows)}; with >=1 translator: {sum(1 for r in rows if r[3]>0)}")
    for r in rows[:25]: print(f"    {r[0]!s:34} {r[1]!s:16} tr={r[3]}")

    print("\n" + "=" * 70)
    print("5. maxim renderings per translator (extract the word: 'all X are ...')")
    print("=" * 70)
    rows = q(f"""SELECT t.translator, p.id, p.citation, t.text
                 FROM passages p JOIN translations t ON t.passage_id = p.id
                 WHERE p.work_role='mula' AND p.original ~* %s
                   AND COALESCE(t.visibility,'public')='public'
                 ORDER BY t.translator, p.id""", (FIELDS['maxim'],))
    pat = re.compile(r'\ball[\s,]+([a-z\-]+)\s+(?:are|is)\s+(?:impermanent|inconstant|unstable|stressful|suffering|dukkha|unsatisfactory)', re.I)
    by_tr = defaultdict(list)
    for tr, pid, cit, text in rows:
        m = pat.search(text or '')
        word = m.group(1).lower() if m else '(unmatched)'
        by_tr[tr].append((cit, word, pid))
    for tr, items in sorted(by_tr.items(), key=lambda kv: -len(kv[1])):
        wc = Counter(w for _, w, _ in items)
        print(f"  {tr:22} n={len(items):3}  {dict(wc)}")

    print("\n" + "=" * 70)
    print("6. per-translator dominant LEXEME over own-text saṅkhāra passages")
    print("=" * 70)
    LEX = ['choice','fabrication','formation','condition','determination','activity',
           'construction','process','force','volition','compound','confection','synerg']
    rows = q(f"""SELECT t.translator, t.text FROM translations t JOIN passages p ON p.id=t.passage_id
                 WHERE p.original ~* %s AND p.work_role='mula'
                   AND COALESCE(t.visibility,'public')='public'""", (STEM,))
    prof = defaultdict(Counter); n_tr = Counter()
    for tr, text in rows:
        n_tr[tr] += 1
        tl = (text or '').lower()
        for lx in LEX:
            if lx in tl: prof[tr][lx] += 1
    for tr, _ in n_tr.most_common(12):
        top = prof[tr].most_common(4)
        print(f"  {tr:22} n_passages={n_tr[tr]:4}  {top}")

    cur.close(); conn.close()

if __name__ == '__main__':
    main()
