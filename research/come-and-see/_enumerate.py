#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Come-and-See enumeration: pull the canonical formula instances + every commentarial
ehipassika row (for treatment coding) + the per-quality/akalika density. Serial single conn.
Writes research/come-and-see/_raw.json. PYTHONIOENCODING=utf-8."""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'naga'))
from sql import _get_dsn
import psycopg2

MC = {'mula': 53.543921, 'attha': 29.488533, 'tika': 28.357746}

def snip(orig, needle, before=70, after=160):
    low = orig.lower()
    i = low.find(needle)
    if i < 0: return orig[:after].replace('\n', ' ')
    return orig[max(0, i-before):i+after].replace('\n', ' ')

def edition(id_):
    return 'cst' if id_.startswith('cst-') else 'sc'

def layer_of(slug, role):
    if role == 'mula': return 'mula'
    if slug and slug.endswith('-tika'): return 'tika'
    if slug and (slug.endswith('-attha') or slug == 'pli-vism'): return 'attha'
    return 'anya'

def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")

    out = {'meta': {'as_of': '2026-06-24', 'corpus': '194710 passages', 'char_totals_Mc': MC}}

    # 1. canonical formula instances: mula rows with ehipassik AND opaneyyik (the formula's signature pair)
    cur.execute("""SELECT id, citation, work_slug, char_length(original), original
                   FROM passages WHERE work_role='mula' AND original ~* 'ehipassik' AND original ~* 'opaneyyik|opanayik'
                   ORDER BY work_slug, id""")
    canon = []
    for id_, cit, slug, clen, orig in cur.fetchall():
        canon.append({'id': id_, 'citation': cit, 'work_slug': slug, 'chars': clen,
                      'edition': edition(id_), 'snippet': snip(orig, 'ehipassik')})
    out['canon_formula'] = canon
    # edition split (SC = fine-grained per-sutta bilara rows; CST = coarse vagga/volume rows; they overlap)
    from collections import Counter as _C
    ed = _C(r['edition'] for r in canon if r['work_slug'] != 'pli-vism')
    out['canon_edition_split'] = dict(ed)
    print(f"canonical formula rows (ehipassik+opaneyyik, mula): {len(canon)}; edition (ex-vism) {dict(ed)}")

    # 2. EVERY commentarial ehipassika row (attha+tika), for treatment coding
    cur.execute("""SELECT id, citation, work_slug, work_role, char_length(original), original
                   FROM passages WHERE (work_slug LIKE '%%-attha' OR work_slug='pli-vism' OR work_slug LIKE '%%-tika')
                   AND original ~* 'ehipassik' ORDER BY work_slug, id""")
    comm = []
    for id_, cit, slug, role, clen, orig in cur.fetchall():
        comm.append({'id': id_, 'citation': cit, 'work_slug': slug, 'layer': layer_of(slug, role),
                     'chars': clen, 'snippet': snip(orig, 'ehipassik', before=210, after=430),
                     'akalika_gloss': snip(orig, 'akālik', before=8, after=70) if 'akālik' in orig.lower() else None})
    out['commentary_ehipassika'] = comm
    print(f"commentary ehipassika rows (attha+tika): {len(comm)}")

    # 3. per-quality per-layer counts (the density table)
    quals = {'svakkhata': 'svākkhāt', 'sanditthika': 'sandiṭṭhik', 'akalika': 'akālik',
             'ehipassika': 'ehipassik', 'opaneyyika': 'opaneyyik|opanayik', 'paccattam_veditabbo': 'paccattaṃ veditabbo'}
    qtab = {}
    for q, stem in quals.items():
        d = {}
        # canon numerator EXCLUDES pli-vism (commentary shelved as mula); vism stems count on the commentary side only
        for L, cond in (('mula', "work_role='mula' AND work_slug <> 'pli-vism'"), ('attha', "(work_slug LIKE '%%-attha' OR work_slug='pli-vism')"), ('tika', "work_slug LIKE '%%-tika'")):
            cur.execute(f"SELECT count(*) FROM passages WHERE {cond} AND original ~* %s", (stem,))
            d[L] = cur.fetchone()[0]
        d['canon_per_Mc'] = round(d['mula']/MC['mula'], 2)
        d['comm_per_Mc'] = round((d['attha']+d['tika'])/(MC['attha']+MC['tika']), 2)
        d['canon_comm_ratio'] = round(d['canon_per_Mc']/d['comm_per_Mc'], 2) if d['comm_per_Mc'] else None
        qtab[q] = d
    out['quality_density'] = qtab

    # 4. distinct canonical works carrying the formula (type-count, against the "single stock passage" falsifier)
    works = sorted(set(r['work_slug'] for r in canon))
    out['canon_distinct_works'] = works
    print(f"canon distinct works carrying the formula: {len(works)} -> {works}")

    cur.close(); conn.close()
    path = os.path.join(os.path.dirname(__file__), '_raw.json')
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
    print('wrote', path)
    # quick echo of the density table
    print("\nquality            mula attha tika  canon/Mc comm/Mc ratio")
    for q, d in qtab.items():
        print(f"  {q:20} {d['mula']:>4} {d['attha']:>4} {d['tika']:>4}   {d['canon_per_Mc']:6.2f} {d['comm_per_Mc']:6.2f} {d['canon_comm_ratio']}")

if __name__ == '__main__':
    main()
