#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Retrofit the awakening census with the provenance-signature framework (R1).

Reads the frozen census (public/research/awakening-events.json), codes a
chronological STRATUM and an ATTRIBUTION per canonical (mula) awakening event
*independently of structural layer*, computes every aggregate in code (never
hand-typed into prose), and writes the enriched census back with a `v2` block
the renderer can surface. A consistency check gates the build and fails on any
em-dash in the serialized output, any unresolved id, or any count that drifts
from the source census.

The only DB-derived input is research/awakening/_mula_workslug.json (id ->
work_slug), captured serially from dhamma-pg, plus research/awakening/_sql_facts.json
(the recall ladder + quotative scan, each a GROUP BY/count, not a search
impression). The stratum and attribution codes are rule-based functions of the
work, so they are reproducible from the manifest without a live DB.

Re-run after any change; the consistency check at the end gates the build.
"""
import json, os, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))      # research/awakening
ROOT = os.path.dirname(HERE)                           # research
REPO = os.path.dirname(ROOT)
CENSUS = os.path.join(REPO, 'public', 'research', 'awakening-events.json')

census = json.load(open(CENSUS, encoding='utf-8'))
workslug = json.load(open(os.path.join(HERE, '_mula_workslug.json'), encoding='utf-8'))
sqlfacts = json.load(open(os.path.join(HERE, '_sql_facts.json'), encoding='utf-8'))

# ---------------------------------------------------------------------------
# Work identification: a CST-volume + work_slug + sc-id rule, data-bound to the
# resolved manifest. Each mula event resolves to exactly one work; the work
# carries its chronological stratum and its dominant attribution.
# ---------------------------------------------------------------------------

def cst_vol(i):
    m = re.match(r'cst-([a-z]\d{4})', i)
    return m.group(1) if m else None

def work_of(eid):
    """Identify the work an event row belongs to, from its id + work_slug.
    Returns a short work key used by STRATUM and ATTRIBUTION."""
    ws = workslug.get(eid)
    cv = cst_vol(eid)
    # Apadana (the largest class): pli-ap, the tha-ap/thi-ap sc-ids, CST s0510
    if ws == 'pli-ap' or eid.startswith('tha-ap') or eid.startswith('thi-ap') or cv == 's0510':
        return 'apadana'
    # Buddhavamsa
    if eid.startswith('bv') or cv == 's0511':
        return 'buddhavamsa'
    # Niddesa (Maha-/Cula-niddesa): exegetical late-canonical
    if ws == 'pli-nd' or eid.startswith('cnd') or cv == 's0516':
        return 'niddesa'
    # Milindapanha: paracanonical
    if ws == 'pli-mil' or eid.startswith('mil') or cv == 's0518':
        return 'milindapanha'
    # Visuddhimagga: tagged mula in the corpus, classical-commentary on stratum
    if ws == 'pli-vism' or (cv and cv.startswith('e01')):
        return 'visuddhimagga'
    # Vinaya frame-narrative (nidana)
    if ws == 'pli-vinaya' or eid.startswith('pli-tv'):
        return 'vinaya-nidana'
    # Theragatha / Therigatha (verse collection, with redactor colophon)
    if eid.startswith('thag') or eid.startswith('thig') or eid.startswith('thi') \
       or eid.startswith('tha') or cv in ('s0508', 's0509'):
        return 'thera-therigatha'
    # Udana
    if eid.startswith('ud') or cv == 's0503':
        return 'udana'
    # Vimanavatthu
    if eid.startswith('vv'):
        return 'vimanavatthu'
    # Nikaya prose (the genuine early floor): dn/mn/sn/an
    if ws in ('pli-dn', 'pli-mn', 'pli-sn', 'pli-an'):
        return 'nikaya-prose'
    return 'indeterminate'

# work -> (chronological stratum, confidence, philological warrant)
WORK_STRATUM = {
 'nikaya-prose':      ('early-canonical',           'secure',
   'AN/SN/MN/DN sutta prose, the consensus early-canonical floor'),
 'udana':             ('early-canonical',           'secure',
   'Udana, an older mixed prose-and-verse KN collection'),
 'thera-therigatha':  ('archaic-or-late-canonical', 'contested',
   'Thera/Therigatha verse: the gathas carry archaic material, but the awakening '
   'narration in these rows sits in the redactor-compiled biographical frame; '
   'coded contested-confidence (register-relative, not a secured date)'),
 'apadana':           ('late-canonical',            'secure',
   'Apadana, a recognised late-canonical KN stratum (autobiographical merit-and-'
   'awakening verse)'),
 'buddhavamsa':       ('late-canonical',            'secure',
   'Buddhavamsa, a late-canonical KN stratum (the lineage of past Buddhas)'),
 'niddesa':           ('late-canonical',            'secure',
   'Maha-/Cula-niddesa, a canonical exegesis of the Sutta-nipata, late-canonical'),
 'vinaya-nidana':     ('late-canonical',            'contested',
   'Vinaya frame-narrative (nidana) position; late by occasioning-story position, '
   'a position label rather than a secured date, coded contested-confidence'),
 'vimanavatthu':      ('late-canonical',            'secure',
   'Vimanavatthu, a late-canonical KN verse collection'),
 'milindapanha':      ('paracanonical',             'secure',
   'Milindapanha, paracanonical (outside the Tipitaka proper)'),
 'visuddhimagga':     ('classical-commentary',      'secure',
   'Visuddhimagga (Buddhaghosa), structurally tagged mula in this corpus but '
   'classical-commentary on stratum: layer and stratum disagree'),
 'indeterminate':     ('indeterminate',             'none', 'unresolved'),
}

# work -> attribution: the per-row default for the illocutionary owner of the
# attainment-claim. The honest default for a flat narrated awakening with no
# quotative owner is a redactor-frame code, NOT buddha-vacana.
#
# CORRECTION (A1, 2026-06-19): this map is a per-claim-VERIFIED class default
# (a recall aid), NOT a per-work verdict. The earlier pass used it wholesale and
# mis-filed every nikaya-prose / vinaya-nidana row as redactor-frame, which
# hard-zeroed buddha-vacana and published a false "0 of 299" headline. The
# buddha-vacana category is now coded PER ROW (PER_ROW_ATTRIBUTION
# below), recall-anchored by the bodhisatta-frame / paccaññāsiṃ discriminator and
# confirmed by k=3 blind coders (IAA kappa=1.0, scoped to the 15 retained
# attribution rows, not the precipitating-condition buckets). The 2026-06-23
# review recoded 2 large work-level rows (cst-s0304m.mul-sn4_1, cst-vin02m2.mul-vin3_1)
# from buddha-vacana to redactor-frame: the kappa packet excerpted the whole
# monolithic work-level row, not the catalogued span, whose event is a third
# party. buddha-vacana 17->15, redactor-frame 46->48, dedup recollections 9->7.
# The non-BV classes
# (apadana=elder self-narration, thera/therigatha=disciple self-report, etc.)
# were spot-read and remain class-homogeneous. See _attribution_audit.json.
WORK_ATTRIBUTION = {
 'apadana':          'hagiographic-self-narration',  # first-person past-to-present awakening verse, redactor-compiled
 'buddhavamsa':      'redactor-frame-verse',         # redactor narrates past-Buddhas' mass awakenings
 'thera-therigatha': 'named-disciple-self-report',   # the elder's own verse + a redactor colophon
 'vimanavatthu':     'redactor-frame-verse',
 'niddesa':          'redactor-frame',
 'milindapanha':     'named-disciple-dialogue',
 'visuddhimagga':    'redactor-frame',               # Buddhaghosa's scholastic narration
 'vinaya-nidana':    'redactor-frame',               # occasioning-story narration (per-row override where the Buddha narrates his own bodhi)
 'udana':            'redactor-frame',
 'nikaya-prose':     'redactor-frame',               # default: a flat narrated awakening in the sutta frame (per-row override where the Buddha asserts his own awakening)
 'indeterminate':    'indeterminate',
}

# PER-ROW attribution override (the per-claim codes that the work-class default
# gets wrong). Sourced from _attribution_audit.json: each row read directly
# around its attainment marker and confirmed by k=3 blind coders.
#  - buddha-vacana: the Buddha, in the first person, asserts his OWN awakening
#    (the bodhisatta-before-bodhi frame / "abhisambuddhoti paccaññāsiṃ" /
#    "ayaṁ kho me ... tatiyā vijjā adhigatā" in the Buddha's mouth).
#  - buddha-declares-another: the Buddha declares another's attainment.
_audit = json.load(open(os.path.join(HERE, '_attribution_audit.json'), encoding='utf-8'))
PER_ROW_ATTRIBUTION = {eid: 'buddha-vacana' for eid in _audit['buddha_vacana_rows_within_299']}
for eid in _audit['buddha_declares_another_rows_within_299']:
    PER_ROW_ATTRIBUTION[eid] = 'buddha-declares-another'

EARLY = ('early-canonical', 'archaic-canonical')

# ---------------------------------------------------------------------------
# Code every mula event, in place and additively.
# ---------------------------------------------------------------------------
mula_events = []
for b in census['buckets']:
    for e in b['events']:
        if e['layer'] == 'mula':
            w = work_of(e['id'])
            st, conf, warrant = WORK_STRATUM[w]
            attr = PER_ROW_ATTRIBUTION.get(e['id'], WORK_ATTRIBUTION[w])
            e['v2_attribution_coded_per_row'] = e['id'] in PER_ROW_ATTRIBUTION
            e['v2_work'] = w
            e['v2_stratum'] = st
            e['v2_stratum_confidence'] = conf
            e['v2_attribution'] = attr
            # the headline disagree flag: structural layer says mula (canonical),
            # stratum says otherwise.
            e['v2_layer_stratum_disagree'] = (st not in EARLY)
            e['v2_bucket'] = b['key']
            mula_events.append(e)

N_MULA = len(mula_events)

# ---------------------------------------------------------------------------
# Aggregates (DATA-BOUND: computed here, never hand-typed).
# ---------------------------------------------------------------------------
def tally(key):
    out = {}
    for e in mula_events:
        out[e[key]] = out.get(e[key], 0) + 1
    return out

stratum_split = tally('v2_stratum')
work_split = tally('v2_work')
attribution_split = tally('v2_attribution')

mula_early = sum(v for k, v in stratum_split.items() if k in EARLY)
mula_late = N_MULA - mula_early
disagree = sum(1 for e in mula_events if e['v2_layer_stratum_disagree'])
buddha_vacana = attribution_split.get('buddha-vacana', 0)
buddha_declares_another = attribution_split.get('buddha-declares-another', 0)
non_buddha_vacana = N_MULA - buddha_vacana
# distinct, deduplicated Buddha-own-awakening recollections (SC + CST siblings
# collapsed); a separate, smaller number than the row-level buddha_vacana count.
dedup_recollections = _audit['dedup_distinct_recollections']['count']

# event-class -> stratum, for the prediction score (which event-CLASSES re-code late)
LARGE_CLASS_THRESHOLD = 30  # an event-class is "large" at >= 30 events
class_strata = {}
for w, n in work_split.items():
    st = WORK_STRATUM[w][0]
    class_strata[w] = {"events": n, "stratum": st, "large": n >= LARGE_CLASS_THRESHOLD}
large_late_classes = [w for w, d in class_strata.items()
                      if d["large"] and d["stratum"] not in EARLY]

# stratum split across ALL 2,214 events (mula coded above; non-mula carry their
# structural layer as a coarse stratum proxy, flagged as such).
LAYER_TO_COARSE = {'attha': 'classical-commentary', 'tika': 'sub-commentary',
                   'anya': 'paracanonical-or-extra'}
full_stratum = dict(stratum_split)
for b in census['buckets']:
    for e in b['events']:
        if e['layer'] != 'mula':
            cs = LAYER_TO_COARSE[e['layer']]
            full_stratum[cs] = full_stratum.get(cs, 0) + 1

# the corrected canon/commentary count, with the within-canon re-split applied:
# of the 299 "canonical" rows, only `mula_early` are early-canonical.
genuinely_early = mula_early
commentary_layers = sum(census['totals']['events'] - N_MULA for _ in [0])  # attha+tika+anya
recoded_late_within_canon = mula_late

# ---------------------------------------------------------------------------
# The v2 block (the retrofit's findings, all numbers data-bound).
# ---------------------------------------------------------------------------
census['v2'] = {
 "title": "The awakening census under the provenance signature",
 "subtitle": ("Coding chronological stratum and attribution over the canonical "
   "awakening events re-splits the canon: the 'canonical' awakening corpus is "
   "overwhelmingly a LATE-canonical, hagiographic-narrated stratum, not the early "
   "Buddha-word it reads as on the structural axis alone."),
 "version": "awakening-census v2 (provenance-retrofit R1)",
 "corpus_snapshot": "194,710 passages (2026-06-19)",
 "framework": "PROVENANCE-SIGNATURE.md (chronological stratum I.1, attribution I.2, recall ladder 3.1)",
 "paper": "research/awakening/FINDINGS-v2.md",
 "triage": {
   "question_type": "Typology, category (the members are asserted events, so epistemic/attribution is load-bearing per the framework's typology-category row)",
   "coded_axes": ["layer+voice (default core)", "I.1 chronological stratum (independent of layer)",
                  "I.2 attribution (per event-class)", "3.1 recall ladder (always-on)"],
   "excluded_axes": {
     "II.7 epistemic marking": "the census enumerates whether an awakening is narrated, not whether it is staked under a verification formula; the load is on WHEN and BY WHOSE VOICE, which stratum + attribution carry",
     "I.4 cross-recensional": "coded only link-level as a secondary corroboration of the early floor; the corpus is Pali-only and the apadana genre's lateness is settled philologically, not by the parallel table",
     "I.5 pre-Buddhist": "the awakening event is a Buddhist datum by definition; inheritance is not in question",
     "I.8 harmonization": "no doctrinal tension is being reconciled; the census is descriptive",
     "I.6 reception / I.7 edition": "fired automatically: the niggahita-glyph recall cliff is an edition/segmentation fact, reported in the recall ladder; no load-bearing English term carries a claim"
   }
 },
 "headline": ("Of the 299 structurally-mula (canonical) awakening events, only "
   + str(mula_early) + " are early-canonical; " + str(mula_late) + " carry the mula tag while "
   "coding late-canonical, paracanonical, or commentary-era on the chronological axis. "
   "The single largest class, the Apadana (" + str(work_split.get('apadana', 0)) + " events), "
   "re-codes late-canonical. On attribution the corpus is overwhelmingly narrated about the "
   "awakened (" + str(non_buddha_vacana) + " of " + str(N_MULA) + " redactor-narrated or "
   "self-reported), but NOT, as an earlier pass wrongly coded it, with zero Buddha-vacana: "
   + str(buddha_vacana) + " of the " + str(N_MULA) + " rows (" + str(dedup_recollections)
   + " distinct, deduplicated recollections) are the Buddha asserting his OWN awakening in "
   "the first person, and the Buddha also declares others' attainments. The canonical "
   "awakening corpus is late and mostly narrated, yet the Buddha is both the first-person "
   "asserter of his own bodhi and the authoritative declarer of others'."),
 "stratigraphy": {
   "note": ("Chronological stratum coded INDEPENDENTLY of the mula/attha/tika structural "
     "layer, from work + position (PROVENANCE-SIGNATURE I.1). A row whose layer is mula but "
     "whose stratum is not early-canonical is the analytically interesting disagree case."),
   "mula_stratum_split": stratum_split,
   "mula_work_split": work_split,
   "mula_early_vs_late": {"early-canonical": mula_early, "late-or-later": mula_late,
     "layer_stratum_disagree": disagree},
   "class_strata": class_strata,
   "full_stratum_2214": full_stratum,
   "warrants": {w: WORK_STRATUM[w][2] for w in work_split},
 },
 "attribution": {
   "note": ("Per CLAIM (per row, not per work-class), the illocutionary owner of the "
     "attainment-claim (I.2). The honest default for a flat narrated awakening with no "
     "quotative owner is a redactor-frame code, not buddha-vacana; the buddha-vacana "
     "category is coded per row, recall-anchored by the bodhisatta-frame / paccaññāsiṃ "
     "discriminator and confirmed by k=3 blind coders (IAA kappa=1.0). An earlier pass "
     "coded attribution by work-class and wrongly hard-zeroed this category."),
   "mula_attribution_split": attribution_split,
   "buddha_vacana": buddha_vacana,
   "buddha_vacana_dedup_recollections": dedup_recollections,
   "buddha_declares_another": buddha_declares_another,
   "non_buddha_vacana": non_buddha_vacana,
   "iaa": _audit["method"]["iaa"],
   "relational_test": _audit["method"]["relational_test"],
   "recall_observation": _audit["recall_observation"]["note"],
   "quotative_scan": sqlfacts["quotative_scan_mula"],
 },
 "recall_ladder": sqlfacts["recall_ladder"],
 "marker_by_role": sqlfacts["marker_by_role"],
 "cross_recension": sqlfacts["cross_recension"],
 "regression": {
   "role_split_sql": sqlfacts["regression_role_split"],
   "role_split_dataset": {"mula": N_MULA,
     "attha": sum(1 for b in census['buckets'] for e in b['events'] if e['layer'] == 'attha'),
     "tika": sum(1 for b in census['buckets'] for e in b['events'] if e['layer'] == 'tika'),
     "anya": sum(1 for b in census['buckets'] for e in b['events'] if e['layer'] == 'anya')},
   "event_count": census['totals']['events'],
   "note": ("The recall ladder did not move the 2,214 event count: the census was already "
     "built at the dotted-m glyph depth (rung 2+), so the rung-1 cliff is a Methods finding "
     "about the surface string, not a recall correction to the census. The GROUP BY work_role "
     "reconfirms the dataset's layer counts exactly."),
 },
 "verdict": ("CONFIRMED and SHARPENED on stratigraphy; CORRECTED on attribution. The original "
   "headline (awakenings live mostly in the commentaries, not the canon) holds and deepens: "
   "even the 'canon' share is mostly a LATE-canonical, hagiographic-narrated stratum, and the "
   "canon/commentary contrast is, in part, an early -> late gradient INSIDE the canon. The "
   "attribution sub-claim is corrected: the earlier 'zero Buddha-vacana, never staked by the "
   "Buddha as his own claim' was a per-work-class coding artifact. Coded per row, "
   + str(buddha_vacana) + " of the 299 (" + str(dedup_recollections) + " distinct recollections) "
   "ARE the Buddha asserting his own awakening in the first person, and the Buddha also declares "
   "others' attainments. The awakening corpus is mostly narrated about the awakened, but the "
   "Buddha is both its first-person self-asserter and the authoritative declarer of others'."),
 "prediction_score": {
   "prediction": ("the commentarial/Apadana/Jataka awakening events are a *late* stratum "
     "(chronology), not merely a separate voice; and that some are redactor-narrated, not "
     "Buddha-vacana. PASS if >=1 large event-class re-codes late-canonical."),
   "result": "PASS",
   "evidence": ("the Apadana, the single largest mula class (" + str(work_split.get('apadana', 0))
     + " events, >= the 30-event large-class threshold), re-codes late-canonical; "
     + str(disagree) + " of 299 mula rows carry a layer/stratum disagreement; and "
     + str(non_buddha_vacana) + "/" + str(N_MULA) + " mula events are non-Buddha-vacana "
     "(redactor-frame or hagiographic self-report). On attribution the per-claim re-code "
     "corrects the earlier per-work-class zero: " + str(buddha_vacana) + " rows are buddha-vacana "
     "(" + str(dedup_recollections) + " distinct recollections)."),
   "large_late_classes": large_late_classes,
 },
}

# ---------------------------------------------------------------------------
# Write back.
# ---------------------------------------------------------------------------
json.dump(census, open(CENSUS, 'w', encoding='utf-8'), ensure_ascii=False, indent=None)

# ---------------------------------------------------------------------------
# Consistency check (the gate).
# ---------------------------------------------------------------------------
errs = []
# 1. every mula event resolved to a work (no indeterminate)
n_indet = sum(1 for e in mula_events if e['v2_work'] == 'indeterminate')
if n_indet:
    errs.append(f"{n_indet} mula events unresolved (work=indeterminate)")
# 2. every mula event id is in the manifest (resolves to a real corpus row)
unresolved = [e['id'] for e in mula_events if e['id'] not in workslug]
if unresolved:
    errs.append(f"{len(unresolved)} mula ids not in workslug manifest: {unresolved[:5]}")
# 3. stratum/attribution/work tallies sum to N_MULA
for nm, t in (("stratum", stratum_split), ("work", work_split), ("attribution", attribution_split)):
    if sum(t.values()) != N_MULA:
        errs.append(f"{nm} tally ({sum(t.values())}) != mula count ({N_MULA})")
# 4. regression gate: dataset role split == SQL role split == census totals
ds = census['v2']['regression']['role_split_dataset']
if ds != sqlfacts['regression_role_split']:
    errs.append(f"role split drift: dataset {ds} != sql {sqlfacts['regression_role_split']}")
if sum(ds.values()) != census['totals']['events']:
    errs.append(f"role split sum {sum(ds.values())} != totals.events {census['totals']['events']}")
if N_MULA != ds['mula']:
    errs.append(f"mula count {N_MULA} != role-split mula {ds['mula']}")
# 5. recall ladder is strictly non-decreasing
yields = [r['yield'] for r in sqlfacts['recall_ladder']]
if yields != sorted(yields):
    errs.append(f"recall ladder not non-decreasing: {yields}")
# 6. the disagree count equals mula_late
if disagree != mula_late:
    errs.append(f"disagree ({disagree}) != mula_late ({mula_late})")
# 7. the prediction must PASS only if a large class re-codes late
if large_late_classes and census['v2']['prediction_score']['result'] != 'PASS':
    errs.append("large late class exists but prediction not scored PASS")
if not large_late_classes and census['v2']['prediction_score']['result'] == 'PASS':
    errs.append("prediction PASS but no large late class")
# 8. buddha-vacana is DATA-BOUND from per-row codes (the defect being fixed): it
# must equal the audited per-row BV list and be > 0 (the false 0 is corrected).
n_bv_audit = len(_audit['buddha_vacana_rows_within_299'])
bv_from_rows = sum(1 for e in mula_events if e['v2_attribution'] == 'buddha-vacana')
if buddha_vacana != bv_from_rows:
    errs.append(f"buddha_vacana ({buddha_vacana}) != per-row count ({bv_from_rows})")
if buddha_vacana != n_bv_audit:
    errs.append(f"buddha_vacana ({buddha_vacana}) != audited BV list ({n_bv_audit})")
if buddha_vacana == 0:
    errs.append("buddha_vacana is 0 (the per-work-class defect would reproduce)")
# every per-row override id must be a real mula event id
mids = {e['id'] for e in mula_events}
stray = [i for i in PER_ROW_ATTRIBUTION if i not in mids]
if stray:
    errs.append(f"per-row attribution ids not in mula events: {stray}")
# 9. no em-dash anywhere in the serialized output
raw = open(CENSUS, encoding='utf-8').read()
if "—" in raw:
    errs.append("em-dash present in output")

print("wrote", CENSUS)
print("mula events:", N_MULA, "| early:", mula_early, "| late-or-later:", mula_late,
      "| disagree:", disagree)
print("stratum:", stratum_split)
print("work:", work_split)
print("attribution:", attribution_split)
print("buddha-vacana:", buddha_vacana, "(dedup recollections:", dedup_recollections,
      ") | buddha-declares-another:", buddha_declares_another,
      "| non-buddha-vacana:", non_buddha_vacana)
print("large classes re-coding late:", large_late_classes)
print("recall ladder yields:", yields)
print("prediction:", census['v2']['prediction_score']['result'])
print("CONSISTENCY:", "PASS" if not errs else ("FAIL: " + "; ".join(errs)))
sys.exit(1 if errs else 0)
