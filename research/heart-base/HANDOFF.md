# R3 heart-base retrofit -- internal log (HANDOFF)

Internal working record, kept OUT of the paper. Orchestration notes, the SQL queries, the dead ends.

## What landed
- Dataset: public/research/heart-base-and-insight.json bumped to v2.0 (three-tier matrix carried
  verbatim from v1.1 as the regression baseline + a new v2 block).
- Builder: research/heart-base/build_dataset.py (data-bound; consistency gate; em-dash gate). Prints
  CONSISTENCY: PASS, recall ladder [240, 272, 283, 283], named-heart canon 0, posit canon 7.
- Paper: research/heart-base/FINDINGS-v2.md (process-free, em-dash 0).
- Renderer: HeartBaseStudy in src/ResearchView.jsx -- additive v2 section (self-hides if data.v2
  absent). No other component touched. npx vite build green.

## The serial SQL trail (one query at a time; the box wedges under fan-out)
Heart-base recall:
- hadayavatthu surface = 240; by work_role tika 158 / attha 50 / mula 17 / anya 15.
- The 17 mula hits drilled by work_slug = ALL pli-vism (Visuddhimagga, mula role yet commentary
  stratum), one pli-kn (Niddesa), one pli-mil (Milinda). ZERO in pli-abhidhamma (the seven books).
- Stem '%hadayavatth%' OR '%hadayarup%' = 272; same mula picture (18 with hadayarupa).
- Concept '%yam rupam nissaya%' in pli-abhidhamma = 7 (the Patthana posit). Full clause
  'yam rupam nissaya manodhatu...' in canonical Abhidhamma = cst-abh03m7.mul-002.

Insight ladder by stratum (named stations):
- udayabbaya: 25 sutta-Nikaya hits, ALL 'udayabbayanupassi viharati' (the lived practice, a verb),
  NOT a named station. RUNG-4 read confirmed (SN 22.89, DN 22 family, AN 4.41 etc.).
- udayabbayanana / udayabbaye nana: 0 in four Nikayas, 0 in canonical Abhidhamma, first in Patis.
- bhanganana / bhange nana sutta hits = 2, BOTH false positives (Mahakammavibhanga-sutta;
  uddesanca vibhanganca -- the substring 'bhangan' inside 'vibhangan'). Purged.
- sankharupekkha / muncitukamyata / nibbidanana: 1 'sutta-vinaya' hit each, ALL the same row
  cst-s0517m.mul-kn17_1 = the Patisambhidamagga (Mahavaggo/Yuganaddhavaggo/Pannavaggo), filed under
  pli-kn. So the single hit is Patis, not a Nikaya. Named ladder = Patis-first, confirmed.
- bhavanga: 0 four Nikayas, 38 canonical Abhidhamma, 48 Vism, 235 attha, 569 tika. Khuddaka/para
  hits (pli-kn 5, pli-ne 4, pli-mil 1, pli-pe 1) are the analytical works, not the verse Nikayas.

Epistemic (II.7) -- co-occurrence + char-gap (the proximity guard):
- hadayavatth x sacchikatva: 1 row, gap 87,102 (cst-e0301n.nrf-010). Separate pericope.
- hadayavatth x dibbena cakkhuna: 1 row, gap 120 (cst-abh08t.nrf-96_p019). Read: the divine eye is
  the abhinna being glossed (dibbacakkhuvasen'eva), NOT predicated of the heart-base. Proximity
  illusion.
- hadayavatth x abhinna: 10 rows, min gap 70 (cst-abh09t.nrf-237_p002). Read: 'abhinnavasena
  pavattam pancamajjhanam ... hadayavatthunneva nissaya' = the fifth jhana running DEPENDENT ON the
  heart-base. The heart-base is the support, not the verified object. Decisive for 'posited'.
- Expected-presence frame: sacchikatva 654, sayam abhinna sacchikatva 190, yathabhutam pajanati 264.
  Large, so the silence is structured, not thin.

Harmonization (I.8):
- hadayavatth x agamato: 3 rows; min gap 15 = cst-abh08t.nrf-84_p074:
  'Paliyam anagatassapi hadayavatthuno agamato, yuttito ca atthibhavo vinnatabbo. Tattha agamo tava'
  -- the silence FLAGGED (Paliyam anagata) and reconciled (agamato yuttito ca). The adduced scripture
  is in the sibling row cst-abh08t.nrf-84_p075 = the Patthana yam-rupam-nissaya clause cited as
  (pattha. 1.1.8).
- Second witness cst-e0104n.att-16_p024 (Vism-mht 16.24, already in the v1 dataset): same question,
  same 'Agamato, yuttito ca' answer, same clause.

Cross-recension (I.4):
- passage_parallels schema: passage_id, parallel_id, relation_type, parallel_lang, parallel_have.
- patthana1.1 / patthana2.1: ZERO parallel rows of any kind -> Abhidhamma under-covered -> untested,
  not pali-unique (genre blind-spot, same as Uttarakuru v2).
- Patis (ps2.x) has lzh (Chinese SA) parallels at the SUTTA-CONTENT level only; container not
  feature -> the numbered ladder is pali-local-unconfirmed.
- Scholarship-attributed: heart-base = Theravada differentia (northern Abhidharma does not seat mind
  in the heart). Flagged as attributed, not corpus-derived.

## Regression gate
All 26 v1 cited ids resolve (verified by SELECT ... WHERE id IN (...)). The 5 new v2 ids resolve too
(cst-abh08t.nrf-84_p074/_p075, cst-abh03m7.mul-002, cst-abh09t.nrf-237_p002, cst-s0517m.mul-kn17_1).
The seven-row three-tier matrix is carried verbatim; no cell recoded. Builder asserts row count 7 and
the four tier keys per row.

## Prediction
R3 PREDICT: heart-base never verified (only posited) + insight-nana ladder Theravada-systematic (no
clean Agama parallel). SCORED PASS. Epistemic 'posited, never verified' (0 in-window; abundant
register); cross-recension null/under-covered + Theravada-local.

## Gates
- python research/heart-base/build_dataset.py -> CONSISTENCY: PASS
- em-dash count, dataset + paper = 0
- npx vite build -> green
- recall ladder non-decreasing [240, 272, 283, 283]
- three-tier matrix intact (7 rows, 4 tiers each)

## Anti-patterns avoided
- Did NOT read structural layer as the timeline: the Vism-mula hits are coded classical-commentary.
- Did NOT assert 'no canonical warrant' from a name-substring: ran RUNG 3, recovered the canonical
  posit (7 Patthana rows), and read the sutta 'udayabbaya' to confirm it is the practice not a station.
- Did NOT code 'verified' from a same-row formula: required the same window, reported char-gaps,
  read the closest one and found the heart-base is the SUPPORT of the knowing, not its object.
- Established expected-presence (654/190/264) BEFORE the absence claim.
- No orchestration leaks in the paper; zero em-dashes.

## NOT committed by this study
research/PROVENANCE-RETROFIT-COORDINATOR.md (the coordinator owns it; leave its ledger edits in the
working tree, untouched).
