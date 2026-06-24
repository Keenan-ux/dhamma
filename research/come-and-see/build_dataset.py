#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Build the served dataset for the Come-and-See study from _raw.json + the frozen
treatment coding. Writes public/research/come-and-see.json. Local only (no DB).
The corpus facts re-derive from research/come-and-see/_enumerate.py (committed query->result)."""
import os, json
from collections import Counter

HERE = os.path.dirname(__file__)
RAW = json.load(open(os.path.join(HERE, '_raw.json'), encoding='utf-8'))
MC = RAW['meta']['char_totals_Mc']

# ---- frozen stratum reference (work_slug -> stratum); a bucketing aid, NOT independent per-row chronology ----
WORK_STRATUM = {
 'pli-dn': 'early-canonical', 'pli-mn': 'early-canonical', 'pli-sn': 'early-canonical', 'pli-an': 'early-canonical',
 'pli-kn': 'late-or-mixed-canonical', 'pli-nd': 'para-canonical', 'pli-ne': 'para-canonical', 'pli-ps': 'para-canonical',
 'pli-vism': 'classical-commentary',
}

# ---- frozen commentarial-treatment coding (read per-row from the snippets; codebook in PREREGISTRATION §3) ----
# codes: word-gloss (pada-by-pada etymological definition) | correlate (ṭīkā mapping the 6 qualities onto a phrase's parts)
#        | grammatical (a taddhita / derivation note) | quotation (the formula quoted, not glossed)
#        | recollection-gloss (the Visuddhimagga dhammānussati chapter's gloss) | amplify (builds a standing scheme/tier/doctrine)
TREATMENT = {
 'cst-s0402a.att-an3_2_1_p007': 'word-gloss',
 'cst-s0402a.att-an3_2_3_p010': 'word-gloss',
 'cst-s0401t.tik-an1_p062': 'correlate',
 'cst-s0101t.tik-dn1_0_p035': 'correlate',
 'cst-s0104t.nrf-2_p050': 'correlate',
 'cst-s0105t.nrf-75_p003': 'grammatical',
 'cst-s0511a.att-30_p078': 'quotation',
 'cst-s0516a.att-19_p026': 'word-gloss',
 'cst-s0519t.tik-1_p033': 'correlate',
 'cst-s0201t.tik-mn1_0_p036': 'correlate',
 'cst-s0301a.att-sn1_1_p163': 'word-gloss',
 'cst-s0301t.tik-sn1_0_p032': 'correlate',
 'cst-vin01a.att-31_p026': 'quotation',
 'cst-vin01t2.tik-10_p041': 'word-gloss',
 'cst-e0101n.mul-74_p002': 'recollection-gloss',
 'cst-e0101n.mul-74_p013': 'recollection-gloss',
 'cst-e0101n.mul-74_p017': 'recollection-gloss',
 'cst-e0103n.att-76_p003': 'word-gloss',
}

def stratum(slug): return WORK_STRATUM.get(slug, 'unknown')

# ---- canonical formula instances: the 73 minus the 2 pli-vism (commentary-shelved-as-mula) = 71 ----
canon = [dict(r, stratum=stratum(r['work_slug'])) for r in RAW['canon_formula'] if r['work_slug'] != 'pli-vism']
for r in canon:
    r['layer'] = 'mula'
canon_by_stratum = Counter(r['stratum'] for r in canon)
canon_by_work = Counter(r['work_slug'] for r in canon)

# ---- commentarial ehipassika rows, coded by treatment (the 18; pli-vism counts as commentary here) ----
comm = []
for r in RAW['commentary_ehipassika']:
    layer = 'attha' if (r['work_slug'].endswith('-attha') or r['work_slug'] == 'pli-vism') else ('tika' if r['work_slug'].endswith('-tika') else r.get('layer', 'attha'))
    comm.append(dict(r, layer=layer, treatment=TREATMENT.get(r['id'], 'uncoded')))
treat = Counter(r['treatment'] for r in comm)

data = {
 'meta': {
  'title': 'Come and See',
  'subtitle': 'A canon-versus-commentary study of the Dhamma’s invitational register: a formula the canon recites often and the commentary only briefly glosses.',
  'generated': RAW['meta']['as_of'],
  'corpus_snapshot': RAW['meta']['corpus'],
  'version': '1.1',
  'version_note': 'v1.1 (2026-06-24): corrected after adversarial review. Dropped the over-read akālika "selective systematization" claim (the 5x akālika density is corpus-wide, ~782 of 800 rows are outside the formula; in-formula akālika gets the same brief gloss as ehipassika). Excluded pli-vism from the canon density numerator. Added the SC/CST edition split (the 71 rows are 39 SuttaCentral sutta-rows + 32 overlapping CST vagga-rows, so the breadth claim leans on per-character density + four-Nikāya distribution, not raw rows). Longer commentary snippets so amplify=0 is auditable from the row text.',
  'prereg': 'research/come-and-see/PREREGISTRATION.md (frozen before coding)',
  'enumeration': 'research/come-and-see/_enumerate.py (committed query->result)',
  'char_totals_Mc': MC,
  'note': 'Counter-thesis study (chosen so the harness can return a NON-house verdict, per the 2026-06-23 adversarial review). The 2 pli-vism rows that carry the formula are commentary-shelved-as-mula and are counted as commentary, not canon. Stratum is a frozen work->stratum reference value, not an independent per-row chronology.',
 },
 'quality_density': RAW['quality_density'],
 'verdict': {
  'hypothesis': 'H0',
  'reading': 'H0 (the pre-committed counter): the Dhamma\'s invitational qualities are canon-dense and the commentary does not amplify the formula. The invitational terms run denser per character in the canon (ehipassika 4.4x, opaneyyika 3.5x, paccattaṃ veditabbo 3.4x, sandiṭṭhika 1.1x). Across all ' + str(len(comm)) + ' commentary rows the treatment is word-gloss (' + str(treat.get('word-gloss', 0)) + '), correlate (' + str(treat.get('correlate', 0)) + '), grammatical note (' + str(treat.get('grammatical', 0)) + '), quotation (' + str(treat.get('quotation', 0)) + '), or recollection-gloss (' + str(treat.get('recollection-gloss', 0)) + '); it never builds a standing scheme on any quality (amplify = 0). Within the formula the commentary glosses all six qualities briefly and at the same low elaboration, akalika included: its in-formula gloss "na kalantare phaladayako" is as short as the ehipassika gloss. akalika does run about 5x denser in the commentary corpus-wide, but that apparatus lives OUTSIDE this formula (the timelessness of nibbana, the no-interval fruit); it is not built on or triggered by the come-and-see formula. The canon-density is recitation-driven: one formula recited often and spread across all four Nikayas, counted here as 39 fine-grained SuttaCentral sutta-rows plus 32 coarse CST vagga-rows of the same texts. A non-house verdict: a canonical register the commentary preserves by brief gloss rather than systematizing.',
 },
 'aggregates': {
  'canon_formula_rows': len(canon),
  'canon_edition_split': RAW.get('canon_edition_split', {}),
  'canon_edition_note': 'The 71 rows are two overlapping editions of the same texts: 39 fine-grained SuttaCentral sutta-rows and 32 coarse CST vagga/volume rows. The breadth claim rests on per-character density and the four-Nikāya distribution, not on the raw row count.',
  'canon_by_stratum': dict(canon_by_stratum),
  'canon_by_work': dict(canon_by_work),
  'canon_distinct_works': sorted(canon_by_work),
  'commentary_ehipassika_rows': len(comm),
  'treatment_split': dict(treat),
  'amplify_count': treat.get('amplify', 0),
  'iaa_note': 'The treatment codebook (PREREGISTRATION §3) turns on one mechanical question: does the row build an enumerated scheme, tier, or doctrine on the quality (amplify), or only define/correlate/quote it. A formal second-coder κ was descoped; instead the full row text window is stored for all 18 rows so the amplify=0 call is independently checkable from the dataset.',
 },
 'canon_formula': canon,
 'commentary_ehipassika': comm,
}

# ---- consistency gate ----
errs = []
if len(canon) != 71: errs.append(f'canon != 71 ({len(canon)})')
if treat.get('amplify', 0) != 0: errs.append('amplify should be 0 for the H0 finding to hold as stated')
if any(r['treatment'] == 'uncoded' for r in comm): errs.append('uncoded commentary rows remain')
if RAW['quality_density']['ehipassika']['canon_comm_ratio'] < 1: errs.append('ehipassika not canon-denser')
if RAW['quality_density']['akalika']['canon_comm_ratio'] >= 1: errs.append('akalika not commentary-denser')
print('CONSISTENCY:', 'PASS' if not errs else 'FAIL ' + '; '.join(errs))

out = os.path.join(HERE, '..', '..', 'public', 'research', 'come-and-see.json')
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('wrote', os.path.normpath(out))
print(f'canon {len(canon)} (by stratum {dict(canon_by_stratum)}) | commentary {len(comm)} | treatment {dict(treat)}')
