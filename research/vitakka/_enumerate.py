#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Vitakka apparatus-provenance — full serial enumeration (single conn).
Per chronological stratum, per-character (deduped). Tightened patterns + a full dump of
every early-canonical apparatus hit for sense-audit. Writes research/vitakka/_raw.json.
Read-only on the DB. PYTHONIOENCODING=utf-8."""
import os, sys, re, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'naga'))
from sql import _get_dsn
import psycopg2

ORDER = ['1early', '2late', '3abh', '4para', '5comm', '6tika', '7other']
# tightened patterns: appanā excludes saṅk-appanā / vik-appanā (preceded by 'k')
TERMS = {
    'vitakka':      r'vitakk',
    'upacara':      r'upacār',
    'appana':       r'(^|[^k])appanā|(^|[^k])appaṇā',
    'abhiniropana': r'abhiniropan',
    'parikamma':    r'parikamm',
    'khanika':      r'khaṇik',
}
PHENOM = {
    'vinivarana':    r'vinīvaraṇ',
    'kallacitta':    r'kallacitt|kalla-citt|kallacit',
    'mudu_kammanna': r'mudu.{0,3}kamm|kammañña|kammaniya',
}
APPARATUS = ['upacara', 'appana', 'abhiniropana', 'parikamma', 'khanika']

def clean(t): return re.sub(r'\s+', ' ', (t or '').replace('\n', ' ')).strip()
def snip(o, pat, b=55, a=95):
    m = re.search(pat.replace(r'(^|[^k])', ''), o, re.I)
    return o[max(0, m.start()-b):m.start()+a] if m else o[:a]

# heuristic sense pre-code (the blind IAA re-codes independently)
def heuristic_sense(term, snippet):
    s = snippet.lower()
    if term == 'upacara':
        if re.search(r'atikkām|okkam|gām|ārām|āvasath|sīm|pādaṁ|nikkham', s): return 'vicinity-boundary'
        if re.search(r'samādh|jhān|kammaṭṭhān|nimitt', s): return 'access-concentration'
        return 'other'
    if term == 'appana':
        if re.search(r'byappanā|abhiniropan|vitakk', s): return 'gloss-string'
        if re.search(r'samādh|jhān|ekagg', s): return 'absorption'
        if re.search(r'saṅkappan|vikappan|appanigghos', s): return 'false-positive'
        return 'other'
    if term == 'abhiniropana':
        if re.search(r'vitakk|saṅkapp|byappanā', s): return 'vitakka-gloss'
        return 'other'
    return 'other'

def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")
    out = {'meta': {'as_of': '2026-06-25', 'corpus': '194710 passages', 'strata': ORDER,
                    'patterns': TERMS, 'phenom_patterns': PHENOM}}

    # 0. deduped char-mass per stratum
    cur.execute("""SELECT stratum(work_slug), sum(char_length(original)) FILTER (WHERE is_primary)
                   FROM passages GROUP BY 1""")
    MC = {st: (c or 0)/1e6 for st, c in cur.fetchall()}
    out['meta']['char_mass_Mc'] = {k: round(MC.get(k, 0), 4) for k in ORDER}

    # 1. density table (counts + per-Mc) for apparatus + baseline + phenomenon
    def density(pat):
        d = {}
        for st in ORDER:
            cur.execute("SELECT count(*) FROM passages WHERE is_primary AND stratum(work_slug)=%s AND original ~* %s", (st, pat))
            d[st] = cur.fetchone()[0]
        d_mc = {st: round(d[st]/MC[st], 2) if MC.get(st) else 0 for st in ORDER}
        comm = MC.get('5comm', 0) + MC.get('6tika', 0)
        commden = round((d['5comm']+d['6tika'])/comm, 2) if comm else 0
        early = d_mc['1early']
        return {'counts': d, 'per_Mc': d_mc, 'comm_per_Mc': commden,
                'early_comm_ratio': round(early/commden, 3) if commden else None}
    out['density'] = {name: density(pat) for name, pat in TERMS.items()}
    out['phenomenon'] = {name: density(pat) for name, pat in PHENOM.items()}

    # 2. full dump of EVERY early-canonical apparatus hit for sense-audit
    early = []
    for term in APPARATUS:
        pat = TERMS[term]
        cur.execute("""SELECT id, citation, work_slug, original FROM passages
                       WHERE is_primary AND stratum(work_slug)='1early' AND original ~* %s
                       ORDER BY work_slug, id""", (pat,))
        for id_, cit, slug, orig in cur.fetchall():
            sn = clean(snip(orig, pat))
            early.append({'term': term, 'id': id_, 'citation': cit, 'work_slug': slug,
                          'snippet': sn, 'heuristic_sense': heuristic_sense(term, sn)})
    out['early_audit'] = early

    # 3. MN 117 anchor record (the gloss string)
    cur.execute("SELECT original FROM passages WHERE id='mn117'")
    o = clean(cur.fetchone()[0])
    m = re.search(r'takko vitakko', o)
    out['mn117_anchor'] = {'id': 'mn117', 'citation': 'MN 117',
                           'gloss': o[m.start():m.start()+150] if m else None}

    # 4. where appanā / abhiniropana FIRST appear (stratum order), confirming the gloss provenance
    firsts = {}
    for term in ('appana', 'abhiniropana'):
        pat = TERMS[term]; firsts[term] = {}
        for st in ('1early', '2late', '3abh', '4para'):
            cur.execute("SELECT citation FROM passages WHERE is_primary AND stratum(work_slug)=%s AND original ~* %s ORDER BY id LIMIT 8", (st, pat))
            firsts[term][st] = [r[0] for r in cur.fetchall()]
    out['stratum_firsts'] = firsts

    cur.close(); conn.close()
    path = os.path.join(os.path.dirname(__file__), '_raw.json')
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
    print('wrote', path)
    print('char_mass_Mc:', out['meta']['char_mass_Mc'])
    print('\nterm           1early  5comm  6tika |  1e/Mc  comm/Mc  early:comm')
    for name in ['vitakka'] + APPARATUS:
        v = out['density'][name]; c = v['counts']
        print(f"  {name:13} {c['1early']:>6} {c['5comm']:>6} {c['6tika']:>6} | {v['per_Mc']['1early']:>6} {v['comm_per_Mc']:>7} {v['early_comm_ratio']}")
    print('\nphenomenon (canon-denser expected):')
    for name in PHENOM:
        v = out['phenomenon'][name]
        print(f"  {name:13} early/Mc={v['per_Mc']['1early']:>5} comm/Mc={v['comm_per_Mc']:>5} ratio={v['early_comm_ratio']}")
    print('\nearly-canonical apparatus hits (sense-audit), by heuristic sense:')
    from collections import Counter
    for term in APPARATUS:
        hits = [e for e in early if e['term'] == term]
        sc = Counter(e['heuristic_sense'] for e in hits)
        print(f"  {term:13} n={len(hits):>3}  {dict(sc)}")
    print('\nMN 117 anchor:', out['mn117_anchor']['gloss'])

if __name__ == '__main__':
    main()
