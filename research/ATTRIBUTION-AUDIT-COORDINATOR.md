# Attribution Re-Code + Per-Claim Audit — living handoff

> Coordinator state for the follow-on campaign that corrects a per-claim coding defect found in the completed
> provenance-retrofit campaign (`research/PROVENANCE-RETROFIT-COORDINATOR.md`). Update this doc IN PLACE as each
> item lands (snapshot, not an append log). A successor reads this in full, then the files in §2, runs §4's
> verification commands to confirm live state, reports the §5 key metric + any drift, then resumes from §5.

## 1. Mission

The retrofit campaign coded parts of the per-claim provenance signature **by work-class** rather than **per
claim**, violating the framework's binding rule ("the signature is coded *per claim*, not per row" —
PROVENANCE-SIGNATURE §2). In **R1 (awakening census)** this produced a published, now-live false headline:
**"0 of 299 canonical awakening events is buddha-vacana."** The `WORK_ATTRIBUTION` map in
`research/awakening/build_dataset.py` assigns `nikāya-prose → redactor-frame` wholesale, which mis-files
**MN 4 / MN 19 / MN 36 / MN 85 / MN 100** — the suttas where the **Buddha narrates his own awakening in the
first person** (`…me … cittaṁ vimuccittha`, confirmed live 2026-06-19) — as redactor-frame. By the framework's
own I.2 rule (code the illocutionary owner of the *claim*, embedded direct speech included), those are
**buddha-vacana (the Buddha asserting his own awakening)**, so the true count is **not 0**.

**The correction is itself uncertain and needs a deeper dive** (operator's call): the "~5" is a guess from five
SuttaCentral ids, not a verified enumeration. Re-code attribution **per claim with proper enumeration + IAA**;
nail the true, deduplicated count of the Buddha's own-awakening recollections; **test (do not assume)** the
relational claim "the Buddha asserts only his *own* awakening, never another's"; then audit R2–R5 for the same
per-work shortcut; fix dataset + paper + renderer; redeploy **only on explicit operator authorization** (this is
a correction to a live published scholarly finding).

## 2. File / artifact map (+ commands)

**The defect + the R1 study (priority territory):**
- `research/awakening/build_dataset.py` — **the defect lives in the `WORK_ATTRIBUTION` dict (~lines 115–125)**: per-work, not per-claim. Also `tally('v2_attribution')` and the `buddha_vacana = …get('buddha-vacana', 0)` line that hard-zeros the headline.
- `research/awakening/_mula_workslug.json` — id→work_slug manifest for the **299 mūla events** (the audit universe). Work split: pli-ap 103, pli-kn 88, pli-thag 24, pli-vism 17, pli-mn 14, pli-thig 14, pli-sn 12, pli-vinaya 6, pli-an 5, pli-bv 5, pli-ud 3, pli-nd 2, pli-dn 2, pli-mil 2, pli-vv 2.
- The **33 nikāya-prose rows** are the audit core (the rest are Apadāna/Theragāthā self-report + late strata). Known Buddha-own-awakening rows: `mn4`, `mn19`, `mn36`, `mn85`, `mn100`. Audit the CST MN siblings too (`cst-s0201m.mul-mn1_1`, `-mn1_2`, `cst-s0202m.mul-mn2_3/4/5`, `cst-s0203m.mul-mn3_2/5`) and the SN/AN/DN prose rows (`an5.56`, `an8.11`, `an8.30`, `dn5`, `sn35.121`, `sn47.29/30`, `sn52.24`, `sn54.8`, `sn55.27/39/53`, `sn8.7/12`, …) for **(a)** the Buddha asserting his own awakening and **(b)** the Buddha declaring *another's* awakening.
- `research/awakening/FINDINGS-v2.md` — the paper. The defect surfaces in "**The attribution axis**" section + the table row `| buddha-vacana … | 0 | none |` and the keystone-signature block.
- `public/research/awakening-events.json` — the **live** dataset (v2 attribution block); served admin-gated.
- `src/ResearchView.jsx` — `AwakeningStudy`, **"Table 2c. Who narrates the awakening"** (the live render the operator was reading).

**The method standard:**
- `.claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md` — **§2 "coded per claim, not per row"** (the violated rule); **I.2 attribution** (the quotative marker inventory: `bhagavā etadavoca`, `ahaṁ/mayā` first-person, the `redactor-frame` default, and the opponent-then-corrected scan); the worked example §7 (embedded-speaker coding).
- `.claude/skills/dhamma-research/SKILL.md` — the k≥3 blind-coder + IAA discipline for the expensive per-claim axes.

**Upstream (the completed campaign that introduced the defect):**
- `research/PROVENANCE-RETROFIT-COORDINATOR.md` — the finished R1–R5 ledger. R1 = `ece3e63`. See its post-completion defect note.
- The other study builders to audit in A2: `research/individual-guidance/build_dataset.py`, `research/heart-base/build_dataset.py`, `research/translation-divergence/build_dataset.py`, `research/intoxicants/build_dataset.py`.

**DB lane (serial only):** proxy `flyctl proxy 15432:5432 --app dhamma-pg` (verify `Get-NetTCPConnection -LocalPort 15432`); password live `PW=$(flyctl ssh console -a dhamma-pg -C "printenv POSTGRES_PASSWORD" | tr -d '\r\n')`, never committed; runner `PYTHONIOENCODING=utf-8 DATABASE_URL="postgres://dhamma:$PW@localhost:15432/dhamma" python research/naga/sql.py "<SQL>"`.

**Rebuild + verify:** `python research/awakening/build_dataset.py` → `CONSISTENCY: PASS`; `grep -c "—" <paper-or-dataset>` → 0; leak scan `grep -niE "\b(agent|workflow|pipeline|box|prompt|LLM)\b" <paper>`; `npx vite build`.
**Deploy (operator-authorized only):** `git push origin master` then `flyctl deploy -a dhamma`; smoke `curl -s https://dhamma.fly.dev/api/dbcheck` (expect passages 194710); research data is admin-gated (a 401 on `/research/*.json` is the gate working).

## 3. Sub-chat ledger

| # | Item | Brief | Status | Verdict |
|---|---|---|---|---|
| A1 | Awakening attribution per-claim re-code (the priority) | §6.A1 | **LANDED** (committed, not deployed) | **PASS** — false 0 corrected to **17 buddha-vacana rows / 9 deduped recollections** (data-bound, IAA κ=1.0); "never another's" refuted |
| A2 | Cross-study per-work-shortcut audit (R2–R5) | §6.A2 | **LANDED** | **PASS (prediction half-refuted, good direction)** — the R1 defect was ISOLATED; no other retrofit used a per-work lookup on an expensive per-claim axis; no counts move, no verdicts flip |
| A3 | Method hardening (per-claim-granularity gate in framework/skill + coordinator verify step) | §6.A3 | **LANDED** (committed) | **PASS** — the gap was a missing *verification step*, not a missing rule |

**A1 landing note (2026-06-19).** The per-claim re-code is done and verified.
- **The corrected key metric: buddha-vacana = 17 of 299 rows (was a false 0), collapsing to 9 distinct deduplicated own-awakening recollections** (MN 4 / 19 / 36 / 85 / 100, AN 8.11 = Verañja = Vinaya Pārājika nidāna, SN 54.8, SN 35.13, Vinaya Mahāvagga bodhi). Data-bound from per-row codes in `build_dataset.py` (`PER_ROW_ATTRIBUTION`, sourced from `_attribution_audit.json`); the consistency gate now FAILS if the count is 0 or not equal to the audited per-row list.
- **IAA κ=1.0**: 3 independent blind coders unanimously coded all 17 BV rows buddha-vacana (packet `_iaa_packet.json`, windows `_attr_worksheet.json`).
- **Relational claim REFUTED (the A1 prediction's OR branch fired):** the Buddha does declare others' attainments (29 mūla rows carry the destiny/stream-entry formula, 10 carry `aññaṁ byākāsi`, the Nādika mirror-of-Dhamma spans DN/MN/SN/AN; within the 299, `sn55.39` coded `buddha-declares-another`). Published claim is the nuanced both-and ("the Buddha is both the first-person asserter of his own bodhi and the authoritative declarer of others'"), never "never another's."
- **DRIFT from this doc:** the defect was NOT confined to nikāya-prose. It also mis-filed **3 vinaya-nidāna rows** (`cst-vin01m.mul-vin1_1`, `cst-vin02m2.mul-vin3_1`, `pli-tv-bu-vb-pj1`) as redactor-frame; these carry the Buddha's first-person bodhi narrative and are now buddha-vacana. A2 should watch for the same per-work shortcut in any builder that codes a Vinaya/frame work wholesale.
- **Recall observation (not a re-census):** the census under-enumerated the Buddha's own-awakening corpus. The bodhisatta-frame appears in **48 mūla rows corpus-wide** (incl. MN 26 Ariyapariyesanā, MN 14, MN 128, many SN/AN), most outside the 299. The 17/9 figure is a floor bounded by the original census's recall; regression gate holds the 299 fixed so the attribution fix is not confounded with a re-census.
- **Regression GREEN:** 2,214 events, 299/1,915 canon/commentary, 38 early / 261 disagree, Apadāna 162 late — all unchanged. `CONSISTENCY: PASS`, em-dash 0 (paper + dataset), no process leaks, `vite build` green.
- **Files touched:** `research/awakening/build_dataset.py`, `public/research/awakening-events.json`, `research/awakening/FINDINGS-v2.md`, `src/ResearchView.jsx` (Table 2c), plus audit artifacts (`_attribution_audit.json`, `_attr_worksheet.json`, `_iaa_packet.json`, `_audit_capture.py`).
- **REDEPLOY: pending operator authorization** (this corrects a live published finding). Commit-don't-push done; the corrected number + diff are surfaced for the operator's `git push` + `flyctl deploy` decision.

## 4. Verification commands (+ expected) — the coordinator re-runs these, never trusts self-report

- **NEW — per-claim coding spot-audit (the check that would have caught this):** pick ≥8 coded rows at random across work-classes; **read each `original` directly** and confirm the attribution code matches *that row's* actual quotative owner, **not its work-class**. A row whose code is a function of its work, not its content, is a fail.
- `python research/awakening/build_dataset.py` → `CONSISTENCY: PASS`; the buddha-vacana count is now **data-bound from per-row codes**, not a hard `get(...,0)`.
- **Dedup check:** confirm SC-id and CST-sibling rows of the same sutta are not double-counted (e.g. `mn36` vs its `cst-…mul-mn…` sibling); report the deduped N.
- **"Never asserts another's" test:** confirm A1 ran a *named concept search* for the Buddha declaring others' attainments (`aññaṁ byākāsi`, arahant-declaration formulae, MN 118-style mass confirmations) before any "never" is published. A bare "never" with no search is a fail.
- `grep -c "—"` → 0 (paper + dataset); leak scan clean; `npx vite build` succeeds.
- Live smoke after any authorized redeploy.

## 5. Open queue + predictions

**All three items (A1, A2, A3) LANDED.** Campaign complete; only the operator-owned A1 redeploy remains pending. **Key metric (now corrected):** the deduped, per-claim-coded, IAA'd **buddha-vacana count** for the 299 = **17 rows / 9 distinct recollections** (was a false 0). **Pre-registered predictions** (score verbatim after each lands; a wrong prediction is a finding):
- **A1: SCORED — PASS.** Predicted small-but->0 and "order of a handful": confirmed (17 rows, 9 deduped recollections). The relational clause resolved via the **OR branch**: the named search FOUND the Buddha declaring others' attainments (29 mūla destiny/stream-entry rows; `sn55.39` within the 299), so the naive "never another's" is refuted and the published claim is the both-and. PASS conditions all met: every nikāya-prose row read individually (33), count deduped (9) + IAA'd (κ=1.0), "another's" answered by named search not assumption. One refinement beyond prediction: the defect also spanned **vinaya-nidāna** (3 rows), not just nikāya-prose.
- **A2: SCORED — PASS (prediction's first half REFUTED, in the good direction).** Predicted "≥1 other retrofit used a per-work code [on a per-claim axis], but no verdict flips." The "no verdict flips" half holds; the "≥1 other used a per-work code" half is **wrong, and that is the finding**: the R1 defect was ISOLATED. Every per-claim-axis coding site in R2–R5 was located and classified benign:
  - **R2 individual-guidance** — epistemic/recension are single adjudicated study-level verdicts (the carita-matching system), char-gap structured-absence evidence, specific anchors (Vism §36.30). No many-instance per-work code.
  - **R3 heart-base** — single concept (hadayavatthu); epistemic/harmonization/recension each one verdict with SQL char-gaps. `HB_BY_ROLE` etc. are recall counts (GROUP BY work_role), not per-claim codes.
  - **R4 translation-divergence** — attribution coded **per locus** with `i2_code` + warrant, explicitly "not a per-row sweep."
  - **R5 intoxicants** — epistemic/stratum/recension are **inline per-row literals with row-specific warrants**; the uniform `flat-background-assertion` is the genuine structured-absence finding (intoxicant-harm never under a verification formula), spot-audit-confirmed per row (5/6 sampled rows carry no verification formula anywhere; the 6th uses the abstract `mada` sense). Stratum-by-work is the framework's CHEAP work→stratum axis, legitimate, not the defect.
  - The R1-unique pattern: an EXPENSIVE per-claim axis (attribution) assigned by `WORK_ATTRIBUTION[work]` across 299 instances, producing a count artifact. No analog elsewhere. **No counts move; all four builders re-build `CONSISTENCY: PASS` byte-identical; R2–R5 verdicts + IAA stay green.** Why R1 alone: it was the only retrofit over a large many-instance event census where the expensive axis was filled by a class lookup instead of per-instance reading.
- **A3: SCORED — PASS.** The gap was a missing *verification step*, not a missing rule. The "coded per claim, not per row" rule already lived in PROVENANCE-SIGNATURE §2; what was absent was the spot-audit that enforces it. Added: (1) a per-claim-granularity spot-audit to the coordinator skill's standing rules (`.claude/skills/coordinator/SKILL.md`); (2) an enforce-don't-state guard in PROVENANCE-SIGNATURE §2 + the k≥3 coding step in `dhamma-research/SKILL.md`, both flagging a work→code lookup as a recall aid never the recorded code, with the false-0 case on record. Prediction confirmed.
- **A3:** PREDICT the gap was a missing *verification* step, not a missing rule (the rule existed in §2; the coordinator never spot-audited coding granularity). PASS if a per-claim-granularity spot-audit is added to the coordinator's standing verification battery and the framework/skill flags work→code lookups as recall aids, never verdicts.

## 6. Delegation briefs (the QUEUE; ten-field shape)

Shared preamble for every brief: **READ FIRST** = this doc (§1–§5), `.claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md` (§2 + I.2), the study's own files in §2, and `research/PROVENANCE-RETROFIT-COORDINATOR.md` for upstream context. **DB LANE** = serial only (§2). **DRIFT LOG** = this very defect (a work-class lookup masqueraded as a per-claim code and zeroed a real category) + the retrofit doc's per-study notes. **COMMIT CADENCE** = one commit per item, commit-don't-push, **never redeploy without explicit operator authorization** (live published finding).

- **§6.A1 — Awakening attribution per-claim re-code.** GOAL: replace the false `buddha-vacana=0` with a deduped, per-claim-coded, IAA'd count. METHOD: (1) pull every one of the 299 mūla rows' `original` window around its attainment marker (serial SQL); (2) code the illocutionary owner **per row** from the quotative evidence (Buddha first-person own-awakening `ahaṁ … abbhaññāsiṁ / me … vimuccittha`; Buddha declaring another's attainment; named-disciple self-report; redactor-frame; deva; opponent), expanding the codebook beyond the current work-class buckets; (3) **dedup** SC/CST siblings; (4) run the named "does the Buddha ever declare *another's* awakening" search; (5) k≥3 blind coders + IAA on the contested rows; (6) rebuild the dataset so the count is data-bound from per-row codes, rewrite the paper's attribution section + Table 2c to the precise relational claim, update the `AwakeningStudy` renderer; (7) report for verification, then hand the redeploy decision to the operator. ANTI-PATTERNS: coding by work-class (the defect); publishing "never" without the search; double-counting SC+CST siblings; quietly footnoting instead of correcting. STOPPING CRITERION: every nikāya-prose row read individually, the buddha-vacana count deduped + IAA'd + data-bound, the "another's" question answered by search, `CONSISTENCY: PASS`, em-dash 0, no leaks, `vite build` green; A1 prediction scored. REGRESSION GATE: the 2,214 event count, the 299/1,915 canon/commentary split, and the chronology stratigraphy (38 early / 261 disagree) stay green unless re-coded with a logged warrant — this is an *attribution* fix, not a re-census.
- **§6.A2 — Cross-study per-work-shortcut audit.** GOAL: find every place R2–R5 coded a per-claim axis by work-class (or over a monolithic row) and classify each artifact-risk vs benign. METHOD: read each study's `build_dataset.py` for `WORK_*`/lookup-driven code assignment on an expensive per-claim axis (attribution, epistemic, harmonization); for each, spot-read rows to see if the work-code matches the row-claim; re-code and rebuild only where a count moves. STOPPING CRITERION: every per-work coding site located + classified, any moved count logged, each touched builder `CONSISTENCY: PASS`. REGRESSION GATE: the R2–R5 verdicts + IAA stay green unless a re-code warrants a logged change.
- **§6.A3 — Method hardening.** GOAL: close the verification gap that let a work-class code publish as a per-claim verdict. METHOD: add a **per-claim coding-granularity spot-audit** to the coordinator's standing verification battery (read N coded rows, confirm code≠f(work)); add a one-line guard to PROVENANCE-SIGNATURE §2 / SKILL.md that a work→code lookup is a *recall aid*, never the recorded code. STOPPING CRITERION: the guard + the audit step are written into the method docs; A3 prediction scored. (Touches only method docs — disjoint from A1/A2.)

## 7. Coordination / ownership rules

- **Serial DB** (the corpus wedges under fan-out). Run A1 fully before A2 if both touch the DB. A3 is doc-only (no DB) and may run any time.
- **A1 owns** the awakening files (`research/awakening/*`, `public/research/awakening-events.json`, the `AwakeningStudy` function in the shared `src/ResearchView.jsx`). **A2 owns** the R2–R5 study files (disjoint from A1). **A3 owns** the method docs. The three are file-disjoint, but the serial-DB constraint means A1→A2 in sequence; A3 can interleave.
- **Redeploy is operator-owned.** Commit corrections (commit-don't-push); surface the diff + the corrected number to the operator and let them authorize `flyctl deploy`. Do not silently redeploy a changed published finding.
- A detected defect is a problem to **solve**, not a caveat to surface. Update this doc's §3 + §5 the moment an item lands.

## 8. Per-pending-item check (what to verify when each lands)

For A1: (1) re-run the per-claim coding spot-audit (§4) — codes must match rows, not works; (2) read the newly-coded buddha-vacana rows directly and confirm each is genuinely the Buddha asserting an awakening; (3) confirm the dedup; (4) confirm the "another's awakening" search was run and the published claim matches its result; (5) `CONSISTENCY: PASS` + em-dash 0 + no leaks + `vite build`; (6) score the A1 prediction; (7) record in §3 + §5; (8) present the corrected number + diff to the operator for the redeploy decision. For A2/A3: re-run their gates, score predictions, record.
