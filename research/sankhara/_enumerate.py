#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Saṅkhāra translator-divergence — full serial enumeration (single conn).
Writes research/sankhara/_raw.json. Re-derives every corpus count this study
publishes (DR-4's probe.py/probe2.py were deleted). Read-only on the DB.

Produces:
  - field_footprint: own-text-primary saṅkhāra rows per collocation field
  - coverage: distinct translators with own-text saṅkhāra rows + counts
  - maxim_rows: EVERY (maxim own-text primary passage x public translator) rendering,
    with the hand-alignable word extracted off the short maxim line + Pāli/English snippets
  - exemplar_rows: Sujato/Thanissaro (and any present translator) on the frozen
    DO / aggregate / triad exemplar loci, rendering read in context
  - background_profile: per-translator dominant-lexeme substring counts (directional, noisy)
PYTHONIOENCODING=utf-8."""
import os, sys, re, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'naga'))
from sql import _get_dsn
import psycopg2
from collections import Counter, defaultdict

STEM = r'saṅkhār|saṃkhār'
FIELDS = {
    'do_link':        r'avijjāpaccayā saṅkhārā|saṅkhārapaccayā|saṅkhāra-paccayā',
    'aggregate':      r'saṅkhārakkhandh',
    'aggregate_enum': r'saññā +saṅkhārā +viññāṇ|vedanā +saññā +saṅkhārā',
    'maxim':          r'sabbe +saṅkhārā +(anicc|dukkh)',
    'triad':          r'(kāya|vacī|vací|citta|mano)-?saṅkhār',
}
# frozen exemplar loci (RESEARCH-DESIGN §method.2)
EXEMPLARS = {
    'do_link':   ['sn12.1', 'sn12.2'],
    'aggregate': ['sn22.48', 'sn22.56', 'sn22.79'],
    'triad':     ['mn44', 'mn118'],
}
# candidate saṅkhāra-rendering lexemes (for context extraction; paccaya="condition" excluded by alignment)
LEX = ['choices','choice','fabrications','fabrication','formations','formation','conditions','conditioned',
       'determinations','determination','activities','activity','constructions','construction',
       'processes','process','forces','force','volitions','volition','conceptions','conception',
       'compounds','compound','confections','synergies']

def clean(t): return re.sub(r'\s+', ' ', (t or '').replace('\n', ' ')).strip()

def maxim_word(text):
    """Extract X in 'all X are impermanent/...'. Returns (word, snippet) or (None, snippet)."""
    t = clean(text)
    # strip simple HTML tags
    t2 = re.sub(r'<[^>]+>', '', t)
    m = re.search(r'\ball,?\s+([a-z][a-z\- ]{0,28}?)\s+(?:are|come|is)\s+'
                  r'(?:impermanent|inconstant|unstable|stressful|suffering|dukkha|unsatisfactory|'
                  r'to rest|perishable|not (?:lasting|stable))', t2, re.I)
    if m:
        w = re.sub(r'\b(the|all|of|these|those)\b', '', m.group(1), flags=re.I).strip()
        seg = t2[max(0, m.start()-15):m.end()+15]
        return w.lower(), seg.strip()
    # fallback: locate any candidate lexeme near impermanent/inconstant
    m2 = re.search(r'\b([a-z\-]+)\s+(?:are|is)\s+(?:impermanent|inconstant)', t2, re.I)
    seg = t2[:160]
    return (m2.group(1).lower() if m2 else None), seg

def find_lex_near(text, anchor_re, window=60):
    """Find a candidate LEX word within `window` chars after an anchor regex."""
    t = re.sub(r'<[^>]+>', ' ', clean(text))
    for am in re.finditer(anchor_re, t, re.I):
        seg = t[am.end():am.end()+window]
        for lx in LEX:
            mm = re.search(r'\b'+re.escape(lx)+r'\b', seg, re.I)
            if mm:
                ctx = t[max(0, am.start()-10):am.end()+window]
                return lx.lower(), ctx.strip()
    return None, None

def extract_do(text):
    # "ignorance ... come/for/conditions X"  (Sujato: 'a condition for choices'; Thanissaro: 'come fabrications')
    return find_lex_near(text, r'ignoranc\w*', window=70)

def extract_aggregate(text):
    # the 4th aggregate slot: perception, X, consciousness
    t = re.sub(r'<[^>]+>', ' ', clean(text))
    m = re.search(r'(?:perception|recognition)s?,?\s+([a-z\-]+)s?,?\s+(?:and\s+)?(?:consciousness|awareness)', t, re.I)
    if m:
        return m.group(1).lower().rstrip('s') if m.group(1).lower() not in ('choices','fabrications','formations','conditions','processes') else m.group(1).lower(), t[max(0,m.start()-30):m.end()+10]
    return find_lex_near(text, r'perception', window=40)

def extract_triad(text):
    # "bodily/physical/verbal/mental X" or "in-and-out breath ... X"
    return find_lex_near(text, r'\b(?:bodily|physical|verbal|mental|in-and-out)\b', window=22)

def snip_pali(orig, needle_re, before=40, after=90):
    t = clean(orig)
    m = re.search(needle_re, t, re.I)
    if not m: return t[:after]
    return t[max(0, m.start()-before):m.start()+after]

def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")
    out = {'meta': {'as_of': '2026-06-25', 'corpus': '194710 passages',
                    'stem': STEM, 'field_patterns': FIELDS, 'exemplar_loci': EXEMPLARS}}

    # 1. field footprint (own-text primary, ex-vism)
    base = "work_role='mula' AND is_primary AND work_slug <> 'pli-vism'"
    fp = {}
    cur.execute(f"SELECT count(*) FROM passages WHERE {base} AND original ~* %s", (STEM,))
    fp['_total_own_text'] = cur.fetchone()[0]
    for f, pat in FIELDS.items():
        cur.execute(f"SELECT count(*) FROM passages WHERE {base} AND original ~* %s", (pat,))
        fp[f] = cur.fetchone()[0]
    out['field_footprint'] = fp

    # footprint by layer (orientation row counts; NOT a density claim)
    cur.execute(f"""SELECT work_role, count(*) FILTER (WHERE is_primary) FROM passages
                    WHERE original ~* %s GROUP BY work_role ORDER BY work_role""", (STEM,))
    out['footprint_by_layer_primary'] = {r[0]: r[1] for r in cur.fetchall()}

    # 2. coverage census (own-text saṅkhāra rows, public translations, deduped by is_primary)
    cur.execute(f"""SELECT t.translator, t.source, count(DISTINCT t.passage_id)
                    FROM translations t JOIN passages p ON p.id=t.passage_id
                    WHERE p.original ~* %s AND p.work_role='mula' AND p.is_primary
                      AND COALESCE(t.visibility,'public')='public'
                    GROUP BY t.translator, t.source ORDER BY 3 DESC""", (STEM,))
    out['coverage'] = [{'translator': r[0], 'source': r[1], 'n': r[2]} for r in cur.fetchall()]

    # 3. maxim cell: EVERY (maxim own-text primary x public translator) rendering
    cur.execute(f"""SELECT p.id, p.citation, p.work_slug, p.is_primary, p.original,
                           t.translator, t.source, t.text
                    FROM passages p JOIN translations t ON t.passage_id=p.id
                    WHERE p.work_role='mula' AND p.is_primary AND p.original ~* %s
                      AND COALESCE(t.visibility,'public')='public'
                    ORDER BY t.translator, p.id""", (FIELDS['maxim'],))
    maxim = []
    for pid, cit, slug, prim, orig, tr, src, text in cur.fetchall():
        w, seg = maxim_word(text)
        maxim.append({'id': pid, 'citation': cit, 'work_slug': slug, 'is_primary': prim,
                      'translator': tr, 'source': src, 'rendered_word': w,
                      'snippet_en': clean(seg)[:200],
                      'snippet_pali': snip_pali(orig, r'sabbe +saṅkhārā')})
    out['maxim_rows'] = maxim

    # 4. exemplar rows (DO / aggregate / triad) for every translator present on the locus
    exr = []
    extractors = {'do_link': extract_do, 'aggregate': extract_aggregate, 'triad': extract_triad}
    for field, ids in EXEMPLARS.items():
        for pid in ids:
            cur.execute("""SELECT p.citation, p.original, t.translator, t.source, t.text
                           FROM passages p JOIN translations t ON t.passage_id=p.id
                           WHERE p.id=%s AND COALESCE(t.visibility,'public')='public'
                           ORDER BY t.translator""", (pid,))
            for cit, orig, tr, src, text in cur.fetchall():
                w, ctx = extractors[field](text)
                exr.append({'field': field, 'id': pid, 'citation': cit, 'translator': tr, 'source': src,
                            'rendered_word': w, 'context_en': clean(ctx)[:240] if ctx else None,
                            'snippet_pali': snip_pali(orig, FIELDS[field])})
    out['exemplar_rows'] = exr

    # 5. background dominant-lexeme profile (directional, noisy — paccaya/saṅkhata contaminate)
    cur.execute(f"""SELECT t.translator, t.source, t.text FROM translations t JOIN passages p ON p.id=t.passage_id
                    WHERE p.original ~* %s AND p.work_role='mula' AND p.is_primary
                      AND COALESCE(t.visibility,'public')='public'""", (STEM,))
    prof = defaultdict(Counter); npass = Counter()
    BG = ['choice','fabrication','formation','condition','determination','activity',
          'construction','process','force','volition','compound','confection','synerg','conception']
    for tr, src, text in cur.fetchall():
        key = f'{tr}/{src}'
        npass[key] += 1
        tl = re.sub(r'<[^>]+>', ' ', (text or '')).lower()
        # exclude the paccaya homograph: 'requisite condition' / 'as a condition'
        tl_noreq = re.sub(r'(?:requisite|as a|a requisite)\s+condition\w*', ' ', tl)
        for lx in BG:
            if lx in tl_noreq: prof[key][lx] += 1
    out['background_profile'] = {k: {'n_passages': npass[k], 'lexemes': dict(prof[k].most_common(6))}
                                 for k, _ in npass.most_common(14)}

    cur.close(); conn.close()
    path = os.path.join(os.path.dirname(__file__), '_raw.json')
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
    print('wrote', path)
    print('field_footprint:', fp)
    print('coverage top:', [(c['translator'], c['source'], c['n']) for c in out['coverage'][:6]])
    print('\nMAXIM CELL (translator -> rendered word):')
    for r in maxim:
        print(f"  [{r['translator']}/{r['source']}] {r['citation']:14} -> {r['rendered_word']!s:18} | {r['snippet_en'][:70]}")
    print('\nEXEMPLARS (field/locus -> sujato vs thanissaro):')
    for r in exr:
        if r['translator'] in ('sujato', 'thanissaro'):
            print(f"  {r['field']:14} {r['citation']:10} [{r['translator']:10}] -> {r['rendered_word']}")

if __name__ == '__main__':
    main()
