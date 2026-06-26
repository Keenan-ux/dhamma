# Vitakka apparatus-provenance — internal methods / handoff log

*The "how the sausage was made" record. NOT the paper (the paper is the `VitakkaStudy` live page +
`FINDINGS.md`, both process-free). Internal doc; em-dashes ok.*

## Provenance / disclosed seed
Built 2026-06-25 as queue item 2 of `COORDINATOR-HANDOFF-2026-06-24.md` §9. Disclosed seed: DR-1 (project
memory `jhana-vitakka-deep-research.md`) + local `_explore.py`/`_explore2.py`. The 9th Research study.

## The key scoping catch (do NOT regress)
`work_role='mula'` is NOT "early canon". It lumps the Visuddhimagga (pli-vism, commentary shelved as mula),
the Vinaya, the late Khuddaka (Apadāna/Jātaka), the para-canon (Milinda/Niddesa/Nettippakaraṇa), AND the
Abhidhamma into "mula". The whole study runs on the chronological `stratum(work_slug)` axis
(1early/2late/3abh/4para/5comm/6tika), not work_role. The first exploration (`_explore.py`) used work_role and
got a misleadingly inflated "mula" count; `_explore2.py` corrected to stratum.

## The sense-audit catch (the count that collapsed)
A naive `appanā` substring count over-counts via `saṅk-appanā`, `vik-appanā` (Vinaya robe-assignment),
`appa-nigghosa`, `appaṇāmento` ("not dismissing"). The early-canonical appanā count was 9 raw -> 1 real
(MN 117 gloss) on audit. The enumeration uses a tightened pattern `(^|[^k])appanā` and EVERY early hit is
blind-coded. `upacāra` early = 14 raw, all the Vinaya spatial "vicinity/boundary/attendant" sense, 0
access-concentration on audit.

## Pipeline (serial DB; agents never touched the DB)
1. `_explore.py` (work_role, superseded) + `_explore2.py` (stratum, correct) -> shape confirmation.
2. `RESEARCH-DESIGN.md` frozen (committed 1d4c03f).
3. `_enumerate.py` -> `_raw.json`: per-stratum counts + per-Mchar density (deduped denominators), tightened
   patterns, full early-canonical apparatus-hit dump, MN 117 anchor, phenomenon terms, stratum_firsts.
4. `vitakka-sense-iaa` workflow (k=3 blind coders, Explore agents, NO DB) -> `_iaa_sense.json`. Fleiss κ=1.0
   on 17 rows (15 non-technical, 2 technical = the MN 117 gloss). [NB: first run failed because workflow
   `args` did not arrive as an array; re-ran with rows embedded in the script.]
5. `build_dataset.py` (consistency gate; P1-P5 scored) -> `public/research/vitakka.json`.
6. `VitakkaStudy` component + registry/dispatch in `src/ResearchView.jsx` (9th study).
7. `vitakka-editorial` workflow (de-AI + 3 adversarial + process-leak + coherence).

## Deduped char-mass denominators (per stratum, Mchar)
1early 13.096, 2late 3.852, 3abh 7.577, 4para 1.213, 5comm 30.691, 6tika 28.358, 7other 9.881.

## Predictions (all PASS)
P1 upacāra access-sense early = 0 (blind κ=1.0). P2 appanā absorption early = 1 (MN 117; ≤2). P3 abhiniropana
early = 1 (MN 117). P4 vinīvaraṇa/kallacitta canon-denser (2.14 / 1.91). P5 apparatus markedly commentarial
(all early:comm < 0.16 per char).

## Scope limit (DR-1 e; do NOT overclaim)
Settles apparatus PROVENANCE + collocation-shift, NOT what vitakka MEANS in the suttas (the
discursive-vs-non-discursive debate; genre confound: Abhidhamma enumerative matrix inflates vitakka-as-factor;
FTS does not stem Pāli -> measured floors). The finding is "labels + tiered scheme are late", not "the canon
lacks the pre-absorption state" (the phenomenon control is what keeps it narrow).

## Open follow-ons
- A future collocation study could pin the upacāra/appanā SAMĀDHI sense by co-occurrence with samādhi/jhāna
  per stratum (here the early access-sense is 0 so it was unnecessary).
- The vitakka MEANING question (Sujato/Thanissaro/Bucknell) remains explicitly out of scope (density cannot
  settle it); pairs naturally with the sankhara translator-divergence study as a translation-behaviour study
  if Bodhi/Horner/etc. coverage is ingested.
