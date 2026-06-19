# REPORT_v12 internal handoff -- R4 provenance-retrofit of the translation/divergence study

Internal log (orchestration, query log, coding). NOT the paper. The paper is research/REPORT_v12.md.
Keep this separate; never let it bleed into the prose.

## Mission (queue item R4, 6.R4 of PROVENANCE-RETROFIT-COORDINATOR.md)

Retrofit the auditable-translation / divergence study (PREREGISTRATION.md, REPORT_v11.md, verdict
"validated-with-caveats / triage-grade") under the provenance-signature framework. Code the
reception/translation-overlay (I.6) + manuscript & edition provenance (I.7) with variant readings as
load-bearing (3.4 text-critical) + attribution (I.2). Reception is the subject; chronology expected
low-yield. Research-only: no public dataset, no renderer.

PRE-REGISTERED PREDICTION (5 R4, scored verbatim in the paper): "the reception/edition axes dominate;
low chronology yield. PASS if variant-reading + translation-overlay sections are the substantive additions."

## The study's load-bearing finding (the recall target)

Settled finding (REPORT_v9, the only null-beating detection number the program owns at scale): a
commitment-classified translator-divergence lane beats its permutation null (overlap 36, recall 0.409,
positional p=0.001 / salience p=0.015) over 8 suttas in the intersection of the Sujato+ATI mirror and the
SC comment ground truth: sn6.1, sn6.15, sn12.15, sn36.21, sn41.5, sn41.6, sn42.11, sn45.8 (88 comment
segments). REPORT_v11 (granularity) refined the verdict to rank-don't-gate / triage-grade and confirmed the
divergence signal is SELECTIVE. The divergence loci are the strong-commitment segments in those 8 suttas;
their kinds are mostly lexical-sense and doctrinal. So the load-bearing claims are reception facts: at locus
X, defensible translations diverge in commitment. The triage routes this to the reception/edition cluster.

## DB lane (serial; proxy 15432:5432 --app dhamma-pg; password live, never committed)

Serial via research/naga/sql.py. Password cached locally to git-bash tmp, not in repo. Snapshot: 194,710.

### Query log (load-bearing)

1. Schema + the 8 suttas: all 8 are source_edition=sc (SuttaCentral Mahasangiti), work_role=mula,
   canon=Pali. Root I.7 finding: the divergence study's base Pali edition is the Mahasangiti reading text,
   which carries NO inline variant sigla (original ~ siglum-regex = False on sn45.8/sn6.1/sn41.6/sn42.11).
   The si./sya./pi./ka. apparatus lives in the CST Burmese siblings, which the study does not read. So the
   text-critical axis is sourced by bridging each sc locus to its CST monolith sibling.
2. CST siblings (content match): SN6 cst-s0301m.mul-sn1_6; SN45 magga cst-s0305m.mul-sn5_1; SN41/42
   cst-s0304m.mul-sn4_7; SN36 cst-s0304m.mul-sn4_2; SN12 cst-s0302m.mul-sn2_1. Coarse vagga monoliths.
3. Apparatus at the divergence-bearing words:
   - sn6.1 nibbana window (sabbasankharasamatho sabbupadhipatinissaggo ... nibbanam): CST main = SC, no
     siglum. Clean.
   - sn45.8 jhana defs (savitakkam savicaram, sammavaca, sammasati): no siglum at the definition spans. Clean.
   - sn41.6 (vitakkavicara vacisankharo): no siglum. Clean.
   - sn36.21: two variants near the Sivaka exchange: Idha vs "Idha pana" (sya. kam. pi. ka.) and "Samampi
     ... veditabbam" vs "evam veditabbam" (sya. kam. ka.). Both connective/morphological-trivial; NEITHER on
     the divergence term (pittasamutthana, the humoral cause). Trivial.
   - sn12.15 (upayupadanam): ONE substantive claim-bearing variant: upayupadanabhinivesavinibandho
     (CST main = SC base) vs upayupadana- (si. sya. kam. pi.). DPD: upaya = "who is attached/engaged";
     upaaya (long a) = "means/method/approach". The variant shifts the compound's first member between an
     attachment-sense and a means/approach-sense. It is the one variant in the loci that is both substantive
     and adjacent to a divergence-bearing word. But the SC base (study's edition) and the CST main reading
     AGREE (upaya-), so the chosen reading is cross-edition supported (two major Pali print lines), the
     variant is the minority (si. sya. kam. pi.). Reading defended, not contested-downtagged.
4. Reception trace (I.6): pulled Pali + Sujato (corpus segments jsonb) + Thanissaro/Walshe/Nyanaponika
   (data/divergence_mirror.json) for the strongest commitment-divergent segments. Multi-translator
   availability reconfirmed live: sn12.15 = sujato/thanissaro/walshe; sn36.21 = nyanaponika/sujato/thanissaro;
   the other six = sujato + one ATI. The multi-translator discriminator (a feature in one translator not the
   others means reception, not text) is operable on every divergence locus.
5. Mirror reconfirm: passages with BOTH sujato AND >=1 ATI = 1,150 live (>=2 ATI = 248); the frozen mirror
   was 945 / 177 (2026-06-12). The corpus grew; the p=0.001 result rests on the frozen 945, not re-run here
   (re-running would re-open the verdict, forbidden by the regression gate). Reported as a recall-ladder
   context delta, not a re-derivation.

## The reception traces (6 load-bearing English terms to Pali, coded I.6)

  R-a  sn6.1:1.7   nibbanam               Sujato extinguishment                Thanissaro Unbinding                  translator-divergent
  R-b  sn6.1:1.7   sabbupadhipatinissaggo Sujato "letting go of all attachments"  Thanissaro "relinquishment of all acquisitions"  translator-divergent
  R-c  sn45.8:10.2 savitakkam savicaram   Sujato "placing the mind and keeping it connected"  Thanissaro "directed thought & evaluation"  translator-divergent
  R-d  sn45.8      sammasamadhi / jhana   Sujato "right immersion" / absorption  Thanissaro "right concentration" / jhana  translator-divergent
  R-e  sn41.6:2.4  vacisankhara           Sujato "verbal process"              Thanissaro "verbal fabrications"      translator-divergent
  R-f  sn12.15     upadana (in upayupadana) Sujato grasping                    Thanissaro "clingings (sustenances)" / Walshe grasps  translator-divergent (+ the one text-critical variant)

All six trace to a Pali settled at the divergence point (R-f's compound prefix carries a minority variant,
but the divergence-bearing head upadana is unvaried, and the prefix variant cross-edition-resolves to the
chosen reading). So the divergence is reception (translator philosophy), not text.

## Chronology pass (I.1) low-yield, confirmed

All 8 divergence suttas are SN Nikaya mula prose discourses = early-canonical, uniform. No
Apadana/Vinaya-frame/Abhidhamma/paritta among the loci, so no within-canon stratigraphic gradient. Nuance:
sn6.1 (Brahmayacana) is a narrative-frame sutta whose verses are archaic, but the divergence locus
(sn6.1:1.7) sits in the prose nibbana-formula, not the verse. Chronology is NOT load-bearing; reported as
low-yield, not invented into a gradient.

## Attribution pass (I.2) where it bears

Most loci are doctrinal-body buddha-vacana (bhikkhave, the definitions). Two turn on who speaks: sn12.15
(Kaccanagotta) the "atta me" clause is the Buddha reporting the right-view position, not an endorsed
self-view; sn36.21 (Sivaka) the pubbekatahetu view is voiced by the ascetic-interlocutor and CORRECTED by
the Buddha (opponent-then-corrected). Coded where it bears; not a per-row sweep.

## IAA / regression gate

Study IAA (REPORT_v11: DN2 exact 0.819 / commitment-binary 0.981; sn36.21 0.634 / 0.731; REPORT_v9
strict-consensus precision 0.45) UNCHANGED. R4 adds reception/edition coding; it does not re-code the gold
or re-run the experiment. The "validated-with-caveats / triage-grade" verdict UNCHANGED. No regression-gate
breach; no warrant logged because nothing was re-coded.

## Builder

research/translation-divergence/build_dataset.py emits the reception + text-critical census as JSON and
gates on a consistency check + zero em-dashes (uttarakuru pattern). Output internal, NOT public.

## Verdict

CONFIRMED + sharpened. The divergence finding stands; the retrofit sharpens it from "translators diverge"
to "translators diverge over a textually-settled Pali, so the divergence is a reception fact, not a
text-critical one, with exactly one substantive variant in the loci, which does not drive any divergence."
Prediction PASS.
