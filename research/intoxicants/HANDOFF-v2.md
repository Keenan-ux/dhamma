# Intoxicants Study v2 (provenance-signature retrofit) — internal log

This is the internal record for the R5 retrofit of the intoxicants study under the
provenance-signature framework (PROVENANCE-RETROFIT-COORDINATOR.md §6.R5). It is
unregulated internal prose (not the paper). The paper is `FINDINGS-v2.md`; the prior
version `FINDINGS.md` is kept intact. Counts are data-bound in `build_dataset.py`;
the census is `_census_v2.json`.

## Posture

R5 is a TEST of a settled finding (majja = an effect-based category) under a richer
framework, not a re-confirmation. The regression gate: the finding stays green unless
the recall ladder justifies a change. Outcome: CONFIRMED + refined; gate HELD.

## The five-step procedure, as run

1. Re-triage. Category-typology question -> recall ladder promoted to a chapter,
   chronological stratum (I.1), structured-absence (III.10), cross-recension (I.4)
   load-bearing; epistemic (II.7) coded but uniform (all flat-background) so reported
   as one fact not a chapter. Exclusions justified in the paper's Methodology
   (attribution, pre-Buddhist, harmonization). Scope gate: descriptive, not normative.
2. Recall re-check (THE chapter). Four-rung ladder on majja/meraya/surA; RUNG-4
   homograph purge counted separately; per-term nets reconfirmed by GROUP BY work_role.
3. Chronology. Stratum coded for the load-bearing loci independently of layer.
4. Cross-recension + structured-absence. The pre-sectarian-vs-Pali-local split; the
   open-definition canonical-zero.
5. Signature + segmentation: FINDINGS-v2.md, build_dataset.py (consistency-gated,
   em-dash-gated), this log.

## SQL LEDGER (every load-bearing count; serial, one query at a time through the proxy)

Connection: flyctl proxy 15432:5432 --app dhamma-pg; password live per-session.
Corpus: 194,710 passages (2026-06-19). work_role totals: attha 91843, tika 81841,
mula 17996, anya 3030. (work_role is the structural-layer column; there is no 'layer'
column.)

RUNG 1 (naive substring):
  meraya  ILIKE '%meraya%'  -> 279
  majja   ILIKE '%majja%'   -> 1455
  surA    ILIKE '%surA%'    -> 926
  union (any of three)      -> 2115

RUNG 2 (morphological): distinct surA-initial forms 404, distinct majja-non-majjh
  forms 395; all subsumed by the diacritic-complete substring -> union still 2115,
  delta over RUNG 1 = 0. (Unlike Uttarakuru, the substring did not drop long-vowel
  declined forms; the cluster has no short/long-final ambiguity.)

RUNG 3 (concept / periphrasis, name-independent):
  madanIy*           ILIKE '%madaniy%'                 -> 64
  pamAdaTThAna*      ILIKE '%pamadatthan%'             -> 205
  madanIyaTThena     ~* 'madaniyaTThena'               -> 15   (effect-definition phrase)
  open-list gen.     ~* 'yaM va panannampi.{0,30}madaniy' -> 2  (BOTH commentarial:
                       cst-s0305a.att-sn5_12_p079, cst-s0105t.nrf-60_p030)
  madanIyaTThena in 4-Nikaya mula                      -> 0
  three madA (vmad)  yobbana/arogya/jivita-mada        -> 53

RUNG 4 (homograph purge):
  majja: substring 1455 -> intoxicant-token net 227 (purged 1228).
    Intoxicant regex (word-initial majja not followed by h, + intoxicant compound
    joints): ~* '(^|[^a-z...])majja(M|m|n~|ss|sm|pamad|ppamad|pa|po|sann~|vaN|vik|vis|
    dan|day|pakkhitt|lakkh|gandh|ras|vaNN|saNkhat|ves|bha|sambhar|kumbh|aM|ad|ev|n~c|
    smi|maMs|ussav)'.
    Purged senses (confirmed by enumerating the 395 distinct majja-non-majjh forms):
    majjha (middle), majjana/majjati (polish/wipe, vmrij; the huge majjana- family =
    polishing teeth, brooms, cleaning), minja/majja (marrow), Majjaka-tthera (an
    Apadana elder, a proper name).
    By work_role: mula 76, attha 64, tika 58, anya 29 = 227 (GROUP BY reconfirmed).
  surA: macron substring 926 = 232 mid-word + 694 word-initial.
    Mid-word noise: bhAsurA (radiant), devAsura (gods-and-titans), accharA-adjacent.
    Word-initial deva/name compounds (46): surAdhipa (lord-of-gods), surAlaya
    (god-abode), surAsura, surAja (god-king), the elder SurAdha. Net liquor = 648.
    By work_role: attha 242, mula 200, tika 163, anya 43 = 648 (GROUP BY reconfirmed).
  meraya: 279 -> 279 (zero homograph; confirmed: 0 non-intoxicant meraya rows).
    By work_role: mula 172, attha 49, tika 49, anya 9 = 279.

CLUSTER NET (dedup union of the three purged senses): 840.
  By work_role: mula 273, attha 294, tika 206, anya 67 = 840 (GROUP BY reconfirmed).
  Per-term overlap into the union: meraya 279, surA 648, majja 227 (sum 1154; dedup 840).

## CHRONOLOGY LEDGER (stratum coded from work+position, independent of layer)

Precept formula surAmerayamajja-pamAdaTThAna (strict spelling) = 161 rows.
  mula by work: AN 63, SN 14, DN 12, MN 7, Abh 8, KN 5, KV 4, Vin 3+2, MND 2, VB 2,
  Bhi 1, PP 1, ITI 1, CND 1, KP 1. => robustly EARLY-CANONICAL + pan-Nikaya.

Load-bearing loci, coded:
  EARLY-CANONICAL named-triad: dn31, sn14.25, an5.179, an8.39, snp2.14 (Snp 2 Culavagga,
    not archaic Atthaka), sn56.64 (peyyala). kp2 = LATE-CANONICAL (Khuddakapatha compilation).
  EARLY-CANONICAL effect-concept: an5.81 (madanIye majjati, object = the five kAma, NOT
    drink), an3.39 (three madA). ABHIDHAMMA-CANONICAL: cst-abh02m.mul-150 (madA taxonomy, VB).
  LATE-CANONICAL disciplinary: pli-tv-bu-vb-pc51 (Pc 51, the rule + Sagata nidana;
    closed-list word-analysis of surA/meraya, operative 'majje' permutations:
    'Majje majjasanni pivati ... Majje amajjasanni pivati' = pacittiya either way),
    cst-vin02m2.mul-vin3_6 (Bhesajjakkhandhaka medicine ruling, undetectability
    criterion 'na vanno na gandho na raso pannayati' IN THE ROOT TEXT),
    cst-e0905n.nrf-084 (Parivara catechism).
  CLASSICAL-COMMENTARY / SUB-COMMENTARY effect-DEFINITION: cst-s0506a.att-18_p049
    ('majjam vuccati madaniyaTThena sura ca merayanca'), cst-s0504a.att-83_p050
    ('tadubhayampi madaniyaTThena majjam'), cst-s0305a.att-sn5_12_p079 + cst-s0105t.nrf-60_p030
    (the OPEN-LIST 'yam va panannampi surasavavinimuttam madaniyam'), cst-s0105t.nrf-75_p005
    (effect-mark as the operative line).

The split (the chronology finding):
  - The named triad + precept formula + the operative category-term 'majje' = CANONICAL.
  - The explicit effect-DEFINITION of the category as an OPEN class = COMMENTARIAL
    (the open-list phrase: 2 rows, both commentarial; 0 canonical).
  - The effect-CONCEPT (madanIya/majjati, the three madA) = CANONICAL but in the early
    Nikayas its object is the sense-pleasures (kAma), not the drink-category. The
    commentary welds it onto the drink-category as the definition. = drift-by-specification.

## CROSS-RECENSION LEDGER (passage_parallels table; serial)

  pli-tv-bu-vb-pc51 -> Sarvastivada san-sarv-bu-pm-tf11-pc79, Mulasarvastivada
    san-mu-bu-pm-gbm3-pc79, Lokottaravada-Mahasanghika san-lo-bu-pm-pc76, Mahasanghika
    san-mg-bu-pm-pc76, Dharmaguptaka lzh-dg-bu-vb-pc51, Mahisasaka lzh-mi-bu-vb-pc57,
    Kasyapiya lzh-ka-bu-pm-pc79. => SEVEN independent Vinaya lines = pre-sectarian.
  dn31 -> da16, ma135, t16, t17 (lzh), sf100 (Skt fragment). = multi-recensional.
  an3.39 -> ma117, ea22.8. an5.179 -> ma128. = multi-recensional.
  effect-DEFINITION = commentarial layer, no Agama parallel by construction = Pali-local.

  SPLIT: named prohibition + lay register + existential mada = pre-sectarian;
  the explicit open effect-DEFINITION = Pali-local commentarial (drawn out of
  pre-sectarian operative material, NOT invented from nothing).

## VERDICT + PREDICTION

  Settled finding (majja = effect-based category): CONFIRMED + refined. Gate HELD.
  Refinement: canon supplies the operative category-term + the effect-rationale
  (the 'majje' permutations, the early madanIye-majjati vocabulary applied to kAma,
  the three madA, the telapAka undetectability criterion); the commentary states the
  OPEN effect-definition as a definition. The category is effect-based throughout.

  R5 prediction (verbatim): "the recall re-check on the majja/meraya/surA homograph
  cluster changes a count (the known homograph trap); chronology secondary. PASS if
  the recall-ladder delta is non-zero or the homograph precision is re-confirmed."
  SCORED PASS (both legs): (a) precision re-confirmed (majja 1455->227 purge 1228;
  surA 926->648 purge 278; meraya 279 clean; cluster net 840); (b) RUNG1->RUNG4 delta
  on majja = -1228 (order-of-magnitude). The prediction's one miss: it called chronology
  secondary, but chronology produced the substantive refinement (effect-definition
  commentarial). Recorded as a finding, not a failure.

## GATES (as run)

  - python research/intoxicants/build_dataset.py -> CONSISTENCY: PASS, em-dash 0.
  - grep -c em-dash FINDINGS-v2.md -> 0; build output -> 0.
  - grep process-leak (agent|workflow|pipeline|box|prompt|LLM) FINDINGS-v2.md -> none
    ('agent-noun' was reworded to 'agentive form' to avoid the grammatical-term collision).
  - ladder non-decreasing per term (net <= substring; purge = substring - net) checked
    in the builder consistency gate.
  - npx vite build (renderer untouched; sanity) -> see commit.

## DELIVERABLES

  research/intoxicants/FINDINGS-v2.md   (the paper)
  research/intoxicants/build_dataset.py (data-bound builder, consistency + em-dash gate)
  research/intoxicants/_census_v2.json  (emitted census: ladder, disambiguation, loci, cross-recension)
  research/intoxicants/HANDOFF-v2.md    (this log)
  research/intoxicants/_majja_forms.json, _sura_forms.json, _sura_forms2.json (form-enumeration scratch)
  FINDINGS.md kept intact as the v1 prior version. No public dataset, no renderer.
