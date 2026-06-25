#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Materialize a dhamma-study-analysis workflow result: per study, compute inter-annotator kappa
(Fleiss over the 3 blind coders + mean pairwise Cohen), write FINDINGS.md (writer prose) and
_analysis.json (analyst + skeptics + page_spec + iaa). Usage:
  PYTHONIOENCODING=utf-8 python research/materialize_analysis.py <workflow_output_file>"""
import os, sys, json
from collections import Counter
from itertools import combinations

HERE = os.path.dirname(__file__)

def fleiss(coder_maps, refs):
    cats = sorted({c for m in coder_maps for c in m.values()})
    if not cats or not refs: return None
    N = 0; cat_tot = Counter(); Psum = 0.0
    for r in refs:
        labs = [m[r] for m in coder_maps if r in m]
        n = len(labs)
        if n < 2: continue
        N += 1
        row = Counter(labs)
        for c in cats: cat_tot[c] += row.get(c, 0)
        Pi = (sum(v*v for v in row.values()) - n) / (n*(n-1))
        Psum += Pi
    if N == 0: return None
    total_assign = sum(cat_tot.values())
    pj = {c: cat_tot[c]/total_assign for c in cats}
    Pe = sum(p*p for p in pj.values())
    Pbar = Psum / N
    k = (Pbar - Pe)/(1 - Pe) if (1-Pe) else 1.0
    return {'fleiss_kappa': round(k, 4), 'n_items': N, 'Pbar': round(Pbar,4), 'Pe': round(Pe,4),
            'class_distribution': dict(cat_tot)}

def cohen(a, b):
    refs = [r for r in a if r in b]
    if not refs: return None
    n = len(refs); po = sum(1 for r in refs if a[r]==b[r])/n
    cats = set(a[r] for r in refs) | set(b[r] for r in refs)
    ca = Counter(a[r] for r in refs); cb = Counter(b[r] for r in refs)
    pe = sum((ca.get(c,0)/n)*(cb.get(c,0)/n) for c in cats)
    return (po-pe)/(1-pe) if (1-pe) else 1.0

def main():
    f = sys.argv[1]
    d = json.load(open(f, encoding='utf-8'))
    studies = d.get('result', d).get('studies', d.get('studies', []))
    print(f"materializing {len(studies)} studies from {os.path.basename(f)}\n")
    for s in studies:
        slug = s.get('slug')
        if not slug: continue
        a = s.get('analyst') or {}
        skeptics = s.get('skeptics') or []
        w = s.get('writeup') or {}
        # --- kappa from the 3 coder maps ---
        coder_maps = []
        for c in (s.get('codings') or []):
            m = {}
            for row in (c.get('codings') or []):
                if 'ref' in row and 'code' in row: m[str(row['ref'])] = row['code']
            if m: coder_maps.append(m)
        iaa = None
        if coder_maps:
            all_refs = sorted({r for m in coder_maps for r in m})
            fl = fleiss(coder_maps, all_refs)
            cohens = [cohen(x, y) for x, y in combinations(coder_maps, 2)]
            cohens = [round(c,4) for c in cohens if c is not None]
            iaa = {'n_coders': len(coder_maps), 'pairwise_cohen': cohens,
                   'mean_pairwise_cohen': round(sum(cohens)/len(cohens),4) if cohens else None, **(fl or {})}
        # --- write FINDINGS.md ---
        d_ = os.path.join(HERE, slug); os.makedirs(d_, exist_ok=True)
        fm = w.get('findings_md') or '(no findings prose produced)'
        open(os.path.join(d_, 'FINDINGS.md'), 'w', encoding='utf-8').write(fm)
        # --- write _analysis.json ---
        analysis = {'slug': slug, 'title': w.get('title') or a.get('slug'),
                    'verdict': w.get('final_verdict') or a.get('verdict'),
                    'analyst': a, 'skeptics': skeptics, 'page_spec': w.get('page_spec'), 'iaa': iaa}
        json.dump(analysis, open(os.path.join(d_, '_analysis.json'), 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1, default=str)
        sk = '; '.join(f"{x.get('lens','?')}={x.get('verdict','?')}" for x in skeptics)
        kp = f"Fleiss={iaa['fleiss_kappa']} (n={iaa['n_items']}, {iaa['n_coders']} coders)" if iaa else "no coding"
        print(f"[{slug}]")
        print(f"   verdict: {analysis['verdict']}")
        print(f"   IAA: {kp}")
        print(f"   skeptics: {sk}")
        print(f"   findings_md: {len(fm)} chars -> FINDINGS.md\n")

if __name__ == '__main__':
    main()
