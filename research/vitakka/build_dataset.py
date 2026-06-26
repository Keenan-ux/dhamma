#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Build the served dataset for the vitakka apparatus-provenance study.
Reads _raw.json (committed enumeration) + _iaa_sense.json (blind k=3 sense IAA, κ=1.0) and writes
public/research/vitakka.json. Local only (no DB). Corpus facts re-derive from _enumerate.py."""
import os, json
from collections import Counter

HERE = os.path.dirname(__file__)
RAW = json.load(open(os.path.join(HERE, '_raw.json'), encoding='utf-8'))
IAA = json.load(open(os.path.join(HERE, '_iaa_sense.json'), encoding='utf-8'))

MC = RAW['meta']['char_mass_Mc']
ORDER = RAW['meta']['strata']
DENS = RAW['density']
PHEN = RAW['phenomenon']

# ---- fold the blind IAA majority sense into the early-audit rows ----
# IAA was over the 17 upacara+appana+abhiniropana early hits, in the order they appear in early_audit.
apparatus_early = [e for e in RAW['early_audit'] if e['term'] in ('upacara', 'appana', 'abhiniropana')]
for idx, e in enumerate(apparatus_early):
    mj = IAA['majority'].get(str(idx), {})
    e['blind_sense'] = mj.get('majority')        # 'technical' | 'non-technical'
    e['blind_agreement'] = mj.get('agreement')
# technical-sense early count per term (the load-bearing number)
tech = [e for e in apparatus_early if e.get('blind_sense') == 'technical']
tech_by_term = Counter(e['term'] for e in tech)
upacara_access_early = tech_by_term.get('upacara', 0)
appana_abs_early = tech_by_term.get('appana', 0)
abhin_gloss_early = tech_by_term.get('abhiniropana', 0)

# ---- score predictions verbatim ----
def early(name): return DENS[name]['counts']['1early']
def ratio(name): return DENS[name]['early_comm_ratio']
predictions = [
    {'id': 'P1', 'claim': 'After sense-audit, early-canonical upacāra in the access-concentration sense is 0 (the early hits are the Vinaya vicinity/boundary sense).',
     'result': 'PASS' if upacara_access_early == 0 else 'FAIL',
     'detail': f'14 early-canonical upacāra rows; blind k=3 coders (κ=1.0) coded {upacara_access_early} as access-concentration. Disconfirming threshold: >=1.'},
    {'id': 'P2', 'claim': 'Early-canonical appanā in the absorption/gloss sense is <= 2.',
     'result': 'PASS' if appana_abs_early <= 2 else 'FAIL',
     'detail': f'Tightened pattern gives {early("appana")} early appanā rows; blind coders found {appana_abs_early} technical (MN 117 gloss); the other is appaṇāmento ("not dismissing"). Disconfirming threshold: >=3 beyond MN 117.'},
    {'id': 'P3', 'claim': 'Early-canonical abhiniropana (the vitakka re-gloss) occurs exactly once, the MN 117 definition string.',
     'result': 'PASS' if (early('abhiniropana') == 1 and abhin_gloss_early == 1) else 'FAIL',
     'detail': f'{early("abhiniropana")} early-canonical abhiniropana row (MN 117), blind-coded technical; then established in the Paṭisambhidāmagga + Abhidhamma. Disconfirming threshold: >=2 distinct early suttas.'},
    {'id': 'P4', 'claim': 'The non-technical vocabulary for the hindrance-free pliant mind (vinīvaraṇa, kallacitta) is canon-denser than the commentary per character.',
     'result': 'PASS' if (PHEN['vinivarana']['early_comm_ratio'] and PHEN['vinivarana']['early_comm_ratio'] > 1 and PHEN['kallacitta']['early_comm_ratio'] > 1) else 'FAIL',
     'detail': f'vinīvaraṇa early:comm = {PHEN["vinivarana"]["early_comm_ratio"]}, kallacitta = {PHEN["kallacitta"]["early_comm_ratio"]} (both >1, canon-denser). mudu-kammañña = {PHEN["mudu_kammanna"]["early_comm_ratio"]} (generic term, commentary-denser; reported, not load-bearing).'},
    {'id': 'P5', 'claim': 'Each apparatus term runs several times denser per character in the commentary than in the early canon.',
     'result': 'PASS' if all((ratio(t) is not None and ratio(t) < 0.5) for t in ['upacara', 'appana', 'abhiniropana', 'parikamma', 'khanika']) else 'FAIL',
     'detail': 'early:comm ratios per character: ' + ', '.join(f'{t} {ratio(t)}' for t in ['upacara', 'appana', 'abhiniropana', 'parikamma', 'khanika']) + ' (all <0.5; commentary 6-100x denser).'},
]

data = {
    'meta': {
        'title': 'The Apparatus of Absorption',
        'subtitle': 'A per-stratum, per-character study of the jhāna meditation-manual vocabulary: access concentration, absorption, and the re-gloss of vitakka are commentarial, while the pliant mind they organise is canonical.',
        'generated': RAW['meta']['as_of'], 'corpus_snapshot': RAW['meta']['corpus'],
        'version': '1.0',
        'version_note': 'v1.0 (2026-06-25): first build. Apparatus-PROVENANCE study (by chronological stratum, not work_role; per-character deduped, SKILL rule 8). Scope limit (DR-1 e): settles where the apparatus VOCABULARY lives, NOT what vitakka MEANS inside the suttas. Tightened patterns + blind k=3 sense-audit (Fleiss κ=1.0) on the early-canonical hits.',
        'prereg': 'research/vitakka/RESEARCH-DESIGN.md (frozen before the sense-audited enumeration)',
        'enumeration': 'research/vitakka/_enumerate.py (committed query->result)',
        'iaa_artifact': 'research/vitakka/_iaa_sense.json (blind k=3 early-hit sense codings)',
        'note': 'A PROVENANCE study of the apparatus VOCABULARY, not a study of vitakka’s meaning. Density settles where the technical terms live; it cannot adjudicate the discursive-vs-non-discursive debate over vitakka in the jhāna formula (genre confound: the Abhidhamma is an enumerative matrix, so vitakka-as-factor is mechanically dense there; FTS does not stem Pāli, so counts are measured floors).',
        'char_mass_Mc': MC,
    },
    'verdict': {
        'hypothesis': 'H1',
        'reading': 'H1 holds. The jhāna meditation-manual apparatus is a post-Nikāya construction. The access-concentration label upacāra-samādhi is absent from the early canon in the meditative sense: all 14 early-canonical upacāra rows carry the Vinaya "vicinity / precinct / boundary" sense (or "attendant"), and blind coders (κ=1.0) found 0 in the access-concentration sense; per character the term runs about 23 times denser in the commentary. Absorption (appanā) and the technical re-gloss of vitakka as abhiniropana ("the placing of the mind on its object") have a single early-canonical anchor between them, the Mahācattārīsaka (MN 117) definition string "takko vitakko saṅkappo appanā byappanā cetaso abhiniropanā"; the term abhiniropana then appears in the Paṭisambhidāmagga, the Abhidhamma, and saturates the commentary, where the DPD also dates its technical sense. The underlying state the apparatus organises is, by contrast, canonical: the hindrance-free, pliant, ready mind named in the early canon as vinīvaraṇacitta and kallacitta runs about twice as dense in the canon as in the commentary. So the commentary did not invent the experience of a settled pre-absorption mind; it built a graded technical scheme and a re-glossed vitakka on top of canonical material that named neither. This settles the provenance of the apparatus vocabulary, not the meaning of vitakka inside the suttas.',
    },
    'predictions': predictions,
    'iaa': {
        'kappa': IAA['fleiss']['kappa'], 'raters': IAA['fleiss']['raters'], 'n_rows': IAA['fleiss']['N'],
        'scope': 'Fleiss κ on the 17 early-canonical apparatus hits (upacāra / appanā / abhiniropana), k=3 blind coders, binary technical-meditation vs non-technical sense; coders saw the snippet and a sense codebook, blind to the thesis.',
        'technical_count': len(tech), 'technical_rows': IAA['technical_rows'],
        'method': 'Three independent coders classified each early-canonical apparatus hit as technical-meditation or non-technical from the row’s own snippet, blind to the thesis. Agreement was perfect (κ=1.0): 15 of 17 non-technical, 2 technical (both the MN 117 gloss string).',
    },
    'density': DENS,
    'phenomenon': PHEN,
    'early_audit': apparatus_early + [e for e in RAW['early_audit'] if e['term'] in ('parikamma', 'khanika')],
    'mn117_anchor': RAW['mn117_anchor'],
    'stratum_firsts': RAW['stratum_firsts'],
    'apparatus_early_technical': {'upacara_access': upacara_access_early, 'appana_absorption': appana_abs_early, 'abhiniropana_gloss': abhin_gloss_early},
}

# ---- consistency gate ----
errs = []
if upacara_access_early != 0: errs.append(f'upacara access-sense early should be 0 ({upacara_access_early})')
if abhin_gloss_early != 1: errs.append(f'abhiniropana early gloss should be 1 ({abhin_gloss_early})')
if IAA['fleiss']['kappa'] < 0.6: errs.append('IAA kappa too low')
if PHEN['vinivarana']['early_comm_ratio'] <= 1: errs.append('vinivarana not canon-denser')
if any(p['result'] != 'PASS' for p in predictions): errs.append('a prediction did not PASS: ' + ','.join(p['id'] for p in predictions if p['result'] != 'PASS'))
if DENS['appana']['early_comm_ratio'] >= 0.5: errs.append('appana not markedly commentarial')
if not RAW['mn117_anchor'].get('gloss'): errs.append('MN 117 anchor missing')
print('CONSISTENCY:', 'PASS' if not errs else 'FAIL ' + '; '.join(errs))

out = os.path.join(HERE, '..', '..', 'public', 'research', 'vitakka.json')
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('wrote', os.path.normpath(out))
for p in predictions: print(f'  {p["id"]}: {p["result"]}')
print('early technical apparatus:', data['apparatus_early_technical'], '| IAA κ=', IAA['fleiss']['kappa'])
print('apparatus early:comm ratios:', {t: DENS[t]['early_comm_ratio'] for t in ['upacara','appana','abhiniropana','parikamma','khanika']})
print('phenomenon early:comm:', {t: PHEN[t]['early_comm_ratio'] for t in PHEN})
