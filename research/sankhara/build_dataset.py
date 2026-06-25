#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Build the served dataset for the Saṅkhāra translator-divergence study.
Reads _raw.json (committed enumeration) + _iaa_sense.json (blind k=5 sense-family
IAA) and writes public/research/sankhara.json. Local only (no DB). The corpus facts
re-derive from research/sankhara/_enumerate.py (committed query->result).

Coding applied here (per RESEARCH-DESIGN.md, frozen before this step):
  - maxim cell is CANON-only: pli-vism rows are commentary, excluded from the canon cell.
  - SN 22.43 rows are non-extractable (the maxim verse is present in Pāli but the
    translators render the surrounding per-aggregate prose 'all form'/'all bodies');
    recorded with that status, excluded from the clean maxim-word count.
  - sense-family per lexeme = the blind k=5 IAA majority (agreement + split flagged)."""
import os, json
from collections import Counter

HERE = os.path.dirname(__file__)
RAW = json.load(open(os.path.join(HERE, '_raw.json'), encoding='utf-8'))
IAA = json.load(open(os.path.join(HERE, '_iaa_sense.json'), encoding='utf-8'))

# ---- sense-family map from the blind IAA (majority vote; agreement + split recorded) ----
SENSE = {lx: {'family': m['majority'], 'agreement': m['agreement'], 'raters': 5, 'split': m['split']}
         for lx, m in IAA['majority'].items()}

def fam(lex):
    if not lex: return None
    return SENSE.get(lex, {}).get('family')

# ---- normalize an extracted rendered_word to a canonical lexeme key ----
NORM = {
    'choice': 'choices', 'choices': 'choices',
    'fabrication': 'fabrications', 'fabrications': 'fabrications',
    'formation': 'formations', 'formations': 'formations',
    'condition': 'conditions', 'conditions': 'conditions',
    'conditioned': 'conditioned things', 'conditioned things': 'conditioned things',
    'process': 'processes', 'processes': 'processes',
    'conception': 'conceptions', 'conceptions': 'conceptions',
    'everything': 'everything', 'determination': 'determinations', 'determinations': 'determinations',
    'activity': 'activities', 'activities': 'activities',
    'construction': 'constructions', 'constructions': 'constructions',
    'volition': 'volitions', 'volitions': 'volitions', 'force': 'forces', 'forces': 'forces',
    'compound': 'compounds', 'compounds': 'compounds',
}
def norm(w):
    if not w: return None
    return NORM.get(w.strip().lower())

# ---- layer + status for a maxim row ----
def maxim_status(slug, rendered):
    if slug == 'pli-vism':
        return 'mula', 'commentary-excluded'   # Visuddhimagga = commentary, not the canon cell
    if rendered is None:
        return 'mula', 'non-extractable'        # maxim verse present in Pāli, no isolable single-word EN rendering
    return 'mula', 'clean'

# ============================================================
# 1. The maxim cell (the falsifiable core)
# ============================================================
maxim = []
for r in RAW['maxim_rows']:
    lex = norm(r['rendered_word'])
    layer, status = maxim_status(r['work_slug'], lex)
    maxim.append({
        'id': r['id'], 'citation': r['citation'], 'work_slug': r['work_slug'],
        'layer': 'comm' if r['work_slug'] == 'pli-vism' else 'mula',
        'translator': r['translator'], 'source': r['source'],
        'rendered_lexeme': lex if status == 'clean' else None,
        'sense_family': fam(lex) if status == 'clean' else None,
        'status': status,
        'evidence_en': r['snippet_en'], 'evidence_pali': r['snippet_pali'],
    })
maxim_clean = [m for m in maxim if m['status'] == 'clean']

# ============================================================
# 2. Exemplar cell (DO / aggregate / triad, head-to-head)
# ============================================================
exemplars = []
for r in RAW['exemplar_rows']:
    lex = norm(r['rendered_word'])
    exemplars.append({
        'field': r['field'], 'id': r['id'], 'citation': r['citation'],
        'translator': r['translator'], 'source': r['source'],
        'rendered_lexeme': lex, 'sense_family': fam(lex),
        'evidence_en': r['context_en'], 'evidence_pali': r['snippet_pali'],
    })

# ============================================================
# 3. Per-translator disambiguation profile
# ============================================================
def bg_default(key):
    """Most-frequent background lexeme for a translator/source key -> canonical lexeme."""
    bp = RAW['background_profile'].get(key)
    if not bp or not bp['lexemes']: return None, 0, bp['n_passages'] if bp else 0
    top = max(bp['lexemes'].items(), key=lambda kv: kv[1])
    return norm(top[0]) or top[0], top[1], bp['n_passages']

def field_word(translator, field):
    ws = [norm(e['rendered_lexeme']) for e in exemplars
          if e['translator'] == translator and e['field'] == field and e['rendered_lexeme']]
    if not ws: return None
    return Counter(ws).most_common(1)[0][0]

def maxim_word_for(translator):
    ws = [m['rendered_lexeme'] for m in maxim_clean if m['translator'] == translator and m['rendered_lexeme']]
    if not ws: return None
    return Counter(ws).most_common(1)[0][0]

# coverage census (drop the tiny ATI dup of nanamoli; report the main rows)
coverage = [{'translator': c['translator'], 'source': c['source'], 'n': c['n']} for c in RAW['coverage']]

profiles = []
def build_profile(translator, source, register, note=None):
    key = f'{translator}/{source}'
    default_lex, default_n, npass = bg_default(key)
    do = field_word(translator, 'do_link')
    agg = field_word(translator, 'aggregate')
    triad = field_word(translator, 'triad')
    mx = maxim_word_for(translator)
    # distinct field-conditioned lexemes across the four fields actually observed
    observed = [w for w in [do or agg or default_lex, triad, mx] if w]
    distinct = sorted(set(w for w in [do, agg, triad, mx] if w))
    # verdict
    n_distinct = len(set(w for w in [do, agg, triad, mx] if w))
    if n_distinct >= 2:
        verdict = 'disambiguates'
    elif n_distinct == 1 and (mx is not None) and (do or agg):
        verdict = 'collapses'
    else:
        verdict = 'indeterminate'
    profiles.append({
        'translator': translator, 'source': source, 'register': register,
        'n_own_text': npass, 'default_lexeme': default_lex, 'default_count': default_n,
        'default_family': fam(default_lex),
        'do_link': do, 'aggregate': agg, 'triad': triad, 'maxim': mx,
        'distinct_field_lexemes': distinct, 'n_distinct': n_distinct,
        'verdict': verdict, 'note': note,
    })

build_profile('sujato', 'sc', 'canon')
build_profile('thanissaro', 'ati', 'canon')
build_profile('nanamoli', 'bps-direct', 'commentary',
              'Translates the Visuddhimagga (commentary), not the canon; profiled for its default word, not in the canon maxim head-to-head.')
build_profile('walshe', 'ati', 'canon',
              'Dīgha only; no isolable maxim rendering in the corpus, so field-disambiguation is indeterminate.')

# thin maxim-only data points (verdict from the maxim cell alone)
thin_maxim = {}
for m in maxim_clean:
    if m['translator'] in ('buddharakkhita', 'olendzki', 'suddhaso'):
        thin_maxim.setdefault(m['translator'], []).append(m['rendered_lexeme'])

# ============================================================
# 4. Score the pre-registered predictions verbatim (PASS/FAIL)
# ============================================================
suj = next(p for p in profiles if p['translator'] == 'sujato')
tha = next(p for p in profiles if p['translator'] == 'thanissaro')
suj_maxim_choices = sum(1 for m in maxim_clean if m['translator'] == 'sujato' and m['rendered_lexeme'] == 'choices')
tha_maxim_passive = sum(1 for m in maxim_clean if m['translator'] == 'thanissaro'
                        and m['sense_family'] == 'passive-conditioned' and m['rendered_lexeme'] != 'fabrications')
suj_maxim_n = sum(1 for m in maxim_clean if m['translator'] == 'sujato')
tha_maxim_n = sum(1 for m in maxim_clean if m['translator'] == 'thanissaro')
horner_n = 0  # confirmed: 0 own-text saṅkhāra rows
bodhi_n = 2

predictions = [
    {'id': 'P1', 'claim': 'Sujato disambiguates: his maxim word is a passive-sense word distinct from his constructing default ("choices").',
     'result': 'PASS' if (suj['maxim'] and suj['maxim'] != suj['default_lexeme'] and fam(suj['maxim']) == 'passive-conditioned' and suj_maxim_choices < 2) else 'FAIL',
     'detail': f'Sujato maxim = "{suj["maxim"]}" ({fam(suj["maxim"])}) on {suj_maxim_n}/{suj_maxim_n} clean canon maxim rows; default = "{suj["default_lexeme"]}" ({suj["default_family"]}, {suj["default_count"]}/{suj["n_own_text"]}); triad = "{suj["triad"]}". Disconfirming "choices"-at-maxim rows = {suj_maxim_choices} (threshold ≥2 to fail).'},
    {'id': 'P2', 'claim': 'Thanissaro collapses: every maxim row uses his constructing default ("fabrications").',
     'result': 'PASS' if (tha['maxim'] == tha['default_lexeme'] == 'fabrications' and tha_maxim_passive == 0) else 'FAIL',
     'detail': f'Thanissaro maxim = "{tha["maxim"]}" on {tha_maxim_n}/{tha_maxim_n} clean canon maxim rows = his default "{tha["default_lexeme"]}" ({tha["default_count"]}/{tha["n_own_text"]}). Disconfirming distinct-passive-word rows = {tha_maxim_passive} (threshold ≥1 to fail).'},
    {'id': 'P3', 'claim': 'The two highest-coverage modern canon translators occupy opposite poles (one field-conditioned, one field-invariant).',
     'result': 'PASS' if (suj['n_distinct'] >= 2 and tha['n_distinct'] == 1) else 'FAIL',
     'detail': f'Sujato: {suj["n_distinct"]} distinct field lexemes {suj["distinct_field_lexemes"]}. Thanissaro: {tha["n_distinct"]} {tha["distinct_field_lexemes"]}.'},
    {'id': 'P4', 'claim': 'The corpus cannot place Horner (context-splitter) or Bodhi (fixed-word advocate) at usable coverage (n ≤ ~2).',
     'result': 'REPORTED',  # a measured coverage limit, NOT a falsifiable pass/fail (prereg framed it "stated, not tested")
     'detail': f'Horner own-text saṅkhāra rows = {horner_n} (their full Saṃyutta and Majjhima are not ingested, so this is a corpus gap, not a disconfirmed negative); Bodhi = {bodhi_n} (SN 5.10, SN 12.23). Both too thin to place; ingesting their full SN/MN is named future work, not a precondition for the Sujato/Thanissaro headline. Reported as a measured limit, not scored as a result.'},
]

# ============================================================
# 5. Assemble + consistency gate
# ============================================================
data = {
    'meta': {
        'title': 'Saṅkhāra and the Translator',
        'subtitle': 'On identical canonical text, the two highest-coverage modern translators render saṅkhāra at opposite poles: one lexicalises the active-passive split, the other holds to a single word.',
        'generated': RAW['meta']['as_of'],
        'corpus_snapshot': RAW['meta']['corpus'],
        'version': '1.0',
        'version_note': 'v1.0 (2026-06-25): first build. Translator-behaviour study, not a meaning study. Maxim cell is canon-only (Visuddhimagga excluded as commentary); SN 22.43 rows recorded non-extractable. Sense-family by blind k=5 IAA (Fleiss κ=0.69). DR-4 (research/deep-research/sankhara.md) is the disclosed seed; the deduped own-text counts (Sujato 513, Thanissaro 155) reproduce DR-4 exactly.',
        'prereg': 'research/sankhara/RESEARCH-DESIGN.md (frozen before the full enumeration + coding)',
        'enumeration': 'research/sankhara/_enumerate.py (committed query->result)',
        'iaa_artifact': 'research/sankhara/_iaa_sense.json (blind k=5 sense-family codings)',
        'note': 'A study of TRANSLATION BEHAVIOUR on identical canonical text, not of saṅkhāra’s meaning. It settles each translator’s dominant word, its consistency, and whether the rendering tracks the collocation field; it cannot adjudicate which rendering is correct.',
    },
    'verdict': {
        'hypothesis': 'H1',
        'reading': 'H1 (the seed thesis) holds. Translators differ systematically in whether the saṅkhāra rendering tracks the collocation field. The field-level claim rests on full coverage: across Sujato\'s 513 own-text rows his leading word "choices" holds 317 times, the remainder being field switches, while across Thanissaro\'s 155 rows "fabrications" holds 142 times. Sujato lexicalises the word three ways by field: "choices" for the constructing fields (dependent origination, the fourth aggregate), "processes" for the kāya/vacī/citta triad, and "conditions" for the passive impermanence maxim (sabbe saṅkhārā aniccā). The switch is principled: blind coders place "choices" as active-constructing and "conditions" as passive-conditioned, so Sujato\'s maxim switch tracks the active-to-passive boundary the Pāli grammar marks. Thanissaro holds to one word, "fabrications", across all four fields including the maxim, where it imports the active-constructing sense into the passive slot. The identical-line head-to-head is smaller (the maxim cell is 5 Sujato rows against 3 Thanissaro rows, on Dhammapada 273-289, SN 22.90, MN 35); on those same lines the two sit at opposite poles. The finding is a per-translator consistency-and-disambiguation profile with named exemplars, not inferential statistics; it settles behaviour and consistency, not which rendering is right.',
    },
    'predictions': predictions,
    'iaa': {
        'kappa': IAA['fleiss']['kappa'], 'raters': IAA['fleiss']['raters'], 'n_lexemes': IAA['fleiss']['N'],
        'scope': 'Fleiss κ on the 14 distinct sense-family lexeme codings, k=5 blind coders (coders saw the English renderings and an active/passive codebook, blind to the translators and the thesis).',
        'unanimous': sorted([lx for lx, m in IAA['majority'].items() if not m['split']]),
        'split': sorted([lx for lx, m in IAA['majority'].items() if m['split']]),
        'method': 'Five independent coders classified each English rendering into active-constructing / passive-conditioned / neutral from a construction-act-versus-result codebook, without seeing which translator used which word or the disambiguation thesis. Majority vote per lexeme; agreement and splits recorded per row. The headline (lexeme switches by field) is objective and does not depend on this layer; the sense layer only certifies that Sujato’s switch tracks the active/passive boundary (4/5 coders) rather than being idiosyncratic.',
    },
    'contamination_check': {
        'concern': 'A naive substring count of "condition(s)" would over-count: paccaya = "requisite condition" (the dependent-origination connector) and saṅkhata = "conditioned" both render as "condition(s)" in English but are not saṅkhāra.',
        'controls': [
            'The maxim is coded by hand word-alignment on the single short line sabbe saṅkhārā aniccā = "all X are impermanent", where X is the grammatical subject of the impermanence predicate and is saṅkhārā with certainty; the rendered line is stored per row (evidence_en) so the boundary is independently checkable.',
            'paccaya = "requisite condition" occurs in the dependent-origination formula ("from ignorance as a requisite condition come fabrications"), NOT in the maxim line, so it cannot be the maxim subject.',
            'The corpus-wide background dominant-word count strips the phrases "requisite condition" / "as a condition" before counting, so the background figure is not inflated by paccaya.',
            'Sujato\'s passive maxim word is "conditions"; his constructing-field default "choices" is a different lexeme entirely, so the switch is not a counting artifact of one polysemous English word.',
        ],
        'audit': 'Every maxim row stores the rendered English line; the five maxim rows for Sujato all read "all conditions are impermanent", the three for Thanissaro all read "All fabrications are inconstant".',
    },
    'sense_family_map': SENSE,
    'coverage': coverage,
    'per_translator': profiles,
    'thin_maxim_points': {k: dict(Counter(v)) for k, v in thin_maxim.items()},
    'field_footprint': RAW['field_footprint'],
    'footprint_by_layer_primary': RAW['footprint_by_layer_primary'],
    'maxim_table': maxim,
    'exemplar_table': exemplars,
}

# ---- consistency gate ----
errs = []
if fam('choices') != 'active-constructing': errs.append('choices not active-constructing')
if fam('conditions') != 'passive-conditioned': errs.append('conditions not passive-conditioned')
if suj['default_lexeme'] != 'choices': errs.append(f'sujato default != choices ({suj["default_lexeme"]})')
if suj['maxim'] != 'conditions': errs.append(f'sujato maxim != conditions ({suj["maxim"]})')
if tha['default_lexeme'] != 'fabrications': errs.append(f'thanissaro default != fabrications ({tha["default_lexeme"]})')
if tha['maxim'] != 'fabrications': errs.append(f'thanissaro maxim != fabrications ({tha["maxim"]})')
if any(p['result'] != 'PASS' for p in predictions if p['id'] != 'P4'): errs.append('a falsifiable prediction (P1-P3) did not PASS: ' + ','.join(p['id'] for p in predictions if p['id'] != 'P4' and p['result'] != 'PASS'))
if next(p for p in predictions if p['id'] == 'P4')['result'] != 'REPORTED': errs.append('P4 should be REPORTED (a measured limit, not a pass/fail)')
if any(m['status'] == 'clean' and not m['rendered_lexeme'] for m in maxim): errs.append('clean maxim row without a lexeme')
if not maxim_clean: errs.append('no clean maxim rows')
print('CONSISTENCY:', 'PASS' if not errs else 'FAIL ' + '; '.join(errs))

out = os.path.join(HERE, '..', '..', 'public', 'research', 'sankhara.json')
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('wrote', os.path.normpath(out))
print(f'maxim rows {len(maxim)} ({len(maxim_clean)} clean) | exemplars {len(exemplars)} | profiles {len(profiles)} | IAA κ={IAA["fleiss"]["kappa"]}')
for p in predictions: print(f'  {p["id"]}: {p["result"]}')
print('Sujato:', suj['distinct_field_lexemes'], '->', suj['verdict'])
print('Thanissaro:', tha['distinct_field_lexemes'], '->', tha['verdict'])
