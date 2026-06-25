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

# ---- blind second coder (the IAA the pre-registration §3 promised) ----
# An independent coder re-coded all 18 rows from the SAME _raw.json snippets against the
# PREREGISTRATION §3 codebook, WITHOUT seeing TREATMENT above. Committed here so Cohen's κ
# re-derives at build (2026-06-24 defensibility closeout). The load-bearing amplify call is a
# binary with no variance (both coders found amplify=0), so it is reported as exact replication,
# not a κ; the κ below is on the five-way descriptive code.
SECOND_CODER = {
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

def _cohen_kappa(a, b):
    """Unweighted Cohen's κ over two dicts keyed by the same row ids."""
    ids = list(a); n = len(ids)
    po = sum(1 for i in ids if a[i] == b[i]) / n
    cats = set(a.values()) | set(b.values())
    ca, cb = Counter(a.values()), Counter(b.values())
    pe = sum((ca.get(k, 0) / n) * (cb.get(k, 0) / n) for k in cats)
    kappa = (po - pe) / (1 - pe) if (1 - pe) else 1.0
    return n, round(po, 4), round(pe, 4), round(kappa, 4)

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
    comm.append(dict(r, layer=layer, treatment=TREATMENT.get(r['id'], 'uncoded'),
                     second_coder=SECOND_CODER.get(r['id'], 'uncoded')))
treat = Counter(r['treatment'] for r in comm)
iaa_n, iaa_po, iaa_pe, iaa_kappa = _cohen_kappa(TREATMENT, SECOND_CODER)
amplify_second = sum(1 for v in SECOND_CODER.values() if v == 'amplify')

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
  'iaa': {
   'kappa': iaa_kappa,
   'observed_agreement': iaa_po,
   'expected_agreement': iaa_pe,
   'n': iaa_n,
   'amplify_second_coder': amplify_second,
   'method': 'A blind second coder re-coded all ' + str(iaa_n) + ' commentarial rows from the same stored snippets against the PREREGISTRATION §3 codebook, without seeing the first coding. Cohen κ is on the five-way descriptive code (word-gloss / correlate / grammatical / quotation / recollection-gloss). The load-bearing amplify-vs-not call is reported as exact replication: both coders found amplify=0, so a κ on that binary is undefined for lack of variance. Full row text is stored for every row so the call is also checkable by hand.',
  },
 },
 'canon_formula': canon,
 'commentary_ehipassika': comm,
}

# ---- consistency gate ----
errs = []
if len(canon) != 71: errs.append(f'canon != 71 ({len(canon)})')
if treat.get('amplify', 0) != 0: errs.append('amplify should be 0 for the H0 finding to hold as stated')
if any(r['treatment'] == 'uncoded' for r in comm): errs.append('uncoded commentary rows remain')
if any(r['second_coder'] == 'uncoded' for r in comm): errs.append('uncoded second-coder rows remain')
if amplify_second != 0: errs.append('second coder found amplify>0 (would contradict the replicated amplify=0)')
if RAW['quality_density']['ehipassika']['canon_comm_ratio'] < 1: errs.append('ehipassika not canon-denser')
if RAW['quality_density']['akalika']['canon_comm_ratio'] >= 1: errs.append('akalika not commentary-denser')
print('CONSISTENCY:', 'PASS' if not errs else 'FAIL ' + '; '.join(errs))

out = os.path.join(HERE, '..', '..', 'public', 'research', 'come-and-see.json')
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('wrote', os.path.normpath(out))
print(f'canon {len(canon)} (by stratum {dict(canon_by_stratum)}) | commentary {len(comm)} | treatment {dict(treat)} | IAA κ={iaa_kappa} (Po={iaa_po}) amplify_2nd={amplify_second}')
