# Auditable Translation — Coordinator Handoff

**This is the coordinator's living state doc.** A successor reads this in full,
then the files in §2, then runs §4's commands to confirm live state, then
resumes from §5. Update IN PLACE as work lands — this is a snapshot, not a log.

Last updated: 2026-06-13 (P1: granularity-threshold tuning + obscure 2nd passage +
viva; verdict fix-then-build, landed on the pre-committed null branch — REPORT_v11).

---

## 1. Mission

De-risk the **Auditable Translation** product (design in
[`../TRANSLATIONS-AI.md`](../TRANSLATIONS-AI.md)): a self-standing,
primary-evidence-grounded Pāli→English translation whose every interpretive
decision is **exposed at the token, armed with checkable evidence, and committed
by a human** — not silently resolved. Research is sandbox-only: **NO prod, NO
deploy** (the live tool at dhamma.fly.dev is untouched). The bar is a
human-in-the-loop workbench, not an autonomous translator.

**Pivot as of 2026-06-12 (decided, see §6):** detection research is FROZEN at
triage grade. The program's risk inverted: the untested, product-killing
assumptions are all DOWNSTREAM of detection.

**P0 DONE 2026-06-13 (the DN2 slice + hallucinated-warrant audit; REPORT_v10).**
The headline number the whole program was pointed at:
- **Grounded (verified-extraction) staging: hallucinated-warrant rate 0% (0/95),
  fabricated-sense ≤8.4% (spot-reviewed true ≈0).** Same model, free-recall mode:
  **69% fabrication.** Verified-extraction (link-every-warrant-to-a-real-row) is
  the de-risking mechanism — the architecture, not the model, is what's safe.
  **Verdict: BUILD the staging layer, grounded mode ONLY.**
- Detection on the slice: the validated **lexical backbone recovers only 1/5** on
  running text (compounds/sandhi/register/doctrinal defeat it); **commentary-
  presence floods** (10/10 segments); the **divergence lane is the readable-
  granularity detector** (7/10 segments, all 3 gold-bearing at 2/2). Herd-
  consensus blind spot confirmed live (vedehiputta→paṇḍitā only the commentary
  lane catches). The granularity tuning problem is now the live detection issue.

**P1 DONE 2026-06-13 (granularity tuning + obscure 2nd passage + viva; REPORT_v11).
Verdict: fix-then-build — the headline collapsed to the prereg's pre-committed NULL
branch.** Built the span-level detector on DN2 (famous) + SN36.21 Sīvakasutta
(obscure, 3 translators) with a translation-blind graded commitment/style gold and
leave-one-passage-out. The confident "a fixed fusion (div≥2 ∨ critic≥2) tames the
flood, clears all targets on both" did NOT survive the viva (2 fatal, 3 serious):
the gold is **detector-seeded** (all recall/precision is within-pool; absolute
recall unmeasured), and the only held-out test (LOO) **fails the prereg's named
permutation null in both folds (p=0.445, 0.092)** — so by the study's own rules the
result is rank-not-gate / triage-grade. **What survives:** (C1 narrowed) the
divergence signal is SELECTIVE — silent on every style/spurious item while the
lexical lane floods on 20/24 function words (a property of the signal, gold-
independent); (C3 intact, load-bearing) no rep-count threshold transfers →
**rank-don't-gate by divergence strength + human cutoff**; (C5 directional) the
grounded-staging fidelity replicates off famous text — fabricated-sense 5.1% vs
55.6%, unverifiable 4 vs 88 (but "0% hallucinated warrants" is non-discriminating,
0% in BOTH arms — dropped). C4 (critic herd-recovery) **re-adjudicated
on primary sources, not the same-family argument** (the truth is fact-checkable):
`komārabhacca` is a VALID source-documented recovery (DPD lists 2 headwords +
commentary glosses it), `upāsaka`/`semha` are critic false-positives (DPD
single-sense → the panel over-called commitment) → mechanism validated on the one
source-checkable case, FP rate 2/3. 12th meta-pattern instance (+ a 3-part
11th inside the analysis tool). The buildable thing now is the C1/C3 triage core.

## 2. File / artifact map (READ FIRST order)

Everything lives under `C:\Dev\Dhamma\research\` (untracked) unless noted.

**Orientation (read in this order):**
1. This doc.
2. Memory note: `C:\Users\isaac\.claude\projects\C--Dev-Dhamma\memory\choice-point-detection-study.md`
3. [`../TRANSLATIONS-AI.md`](../TRANSLATIONS-AI.md) — the product design (the thing being de-risked).
4. [`PREREGISTRATION.md`](PREREGISTRATION.md) + [`PREREG_controls.md`](PREREG_controls.md) — frozen rules.
5. [`REPORT_v6.md`](REPORT_v6.md) → [`REPORT_v11.md`](REPORT_v11.md) — the arc; **v11 is newest** (granularity tuning + obscure 2nd passage + viva). (v1–v5 superseded; in [`BUILDLOG.md`](BUILDLOG.md).) Prereg for v11: [`PREREGISTRATION_granularity.md`](PREREGISTRATION_granularity.md).
6. [`BUILDLOG.md`](BUILDLOG.md) — append-only event record, all 6 phases + the 06-09 controls + the 06-12 session + the 06-13 P0 session.

**The report arc in one line each:**
- v6: P5/P6 model-as-finder; "it reasons" retracted at viva.
- v7: the undocumented 06-09 controls; location-recall probe FAILS its prereg rule on famous text → finder demoted to "location prior."
- v8: Fable 5 cross-family five-cell run → TWO ENDPOINTS: famous = location prior (both families); obscure Vinaya = content-driven (both families, clean). Cross-family viva forced the Opus clean rerun (0.771→0.629).
- v9: divergence lane built. Rung 1 (lexical) falsified; rung 2 (LLM commitment-classification of human Sujato/ATI divergence) = first complementary lane to beat its nulls (PoC, n=8).
- v10: **P0 DN2 vertical slice.** Detection granularity cliff quantified (lexical 1/5 on running text, commentary floods, divergence 7/10 carries it). **Headline: grounded staging hallucinated-warrant 0% / fabricated ≤8%; ungrounded 69% fabrication → BUILD grounded-only.** Schema holds all 5 cases. 10th meta-pattern instance (inside the audit tool itself).
- v11: **P1 granularity tuning + obscure 2nd passage (SN36.21) + viva.** The confident "fixed fusion tames the flood / clears all targets" did NOT survive: gold is detector-seeded (within-pool recall only), held-out LOO fails the named permutation null in both folds (p=0.445, 0.092) → **fix-then-build, the pre-committed NULL branch (rank-not-gate, triage)**. Survives: divergence SELECTIVITY (C1, gold-independent), rank-don't-gate (C3), grounded-staging fidelity replicates off famous text (C5 directional: fab 5.1% vs 55.6%). 12th meta-pattern + a 3-part 11th inside the analysis tool.

**Data (big JSONs are gitignored — see `.gitignore`):**
- `data/divergence_mirror.json` — 945 passages w/ Sujato + ≥1 ATI, 2,115 translations, +sentence substrate. THE divergence-lane asset.
- `data/validation_bundle.json` (famous, 18 suttas) + `data/lowfame_bundle.json` (23 suttas, =7 Vinaya + 16 SN/MN) — comment ground truth.
- `data/corpus.json`, `data/passage_index.json`, `data/slug_map.json`, `data/lemma_cache.json` — Phase 1–4 detector inputs.
- DN2 hand-gold (the eval target): `pāsāda, uposatha, payirupāsati, gaṇa, vedehiputta` — in TRANSLATIONS-AI.md §"Worked examples".
- **P0 / DN2 slice (2026-06-13):** `out/dn2_slice.json` (segments + detector fires + evidence packets + ground-truth registry), `out/dn2_workflow_args.json`, `out/dn2_workflow_result.json` (53-agent staging output), `out/dn2_audit.json` (per-ref verdicts — THE headline), `out/dn2_choicepoints.json` (schema instance), `out/dn2_reader.html` (throwaway surface). Source: local `scripts/ingest/.cache/bilara-data/...dn2...` + `dpd.db`.
- **P1 / granularity (2026-06-13):** `out/sn36_slice.json` (the obscure 2nd passage — 27 segs, 3 translations, comment-gold, loaded-term packets), `out/granularity_result.json` (36-agent detect+grade output), `out/granularity_metrics.json` (within-pool lane metrics + LOO — the honest numbers), `out/granularity_viva.json` (the fix-then-build verdict), `out/sn36_staging_result.json` + `out/sn36_audit.json` (the off-famous staging replication). Prereg: `PREREGISTRATION_granularity.md`.

**Scripts (key ones):**
- `scripts/detector.py` — the validated deterministic lexical detector (DPD, `--local --textfile`). Model-free.
- `scripts/dpd_local.py` — offline DPD resolver (`scripts/ingest/.cache/dpd-released/dpd.db`).
- `scripts/ingest/scope-divergence.mjs` + `mirror-divergence.mjs` — pull the mirror (read-only via proxy).
- `scripts/divergence_poc.py` (rung 1), `scripts/gen_divergence_judge.py` + `scripts/score_divergence_judge.py` (rung 2).
- `scripts/vinaya_slice.py`, `scripts/score_locprobe_arm.py`, `scripts/validate_arm.py`, `scripts/difficulty_null.py` — scorers.
- Workflow runners (in `out/`): `fable_cells_run.js`, `crossfamily_viva_run.js`, `opus_content_clean_run.js`, `divergence_judge_run.js`.
- **P0 scripts (2026-06-13):** `scripts/dn2_slice.py` (deterministic detection + packets + registry), `scripts/prep_workflow_args.py`, `out/dn2_slice_run.js` (staging workflow: divergence rung-2 + briefs A/B + critics), `scripts/audit_warrants.py` (the warrant audit — run it yourself; now takes argv[2]=out-path), `scripts/build_schema.py` (schema + reader). NOTE the auditor's commentary corpus = `bold_definitions` (bolded glosses only) → grounded fabrication is an UPPER bound; widening to full aṭṭhakathā is queued.
- **P1 scripts (2026-06-13):** `scripts/sn36_slice.py` (obscure 2nd-passage slice; reuses dn2_slice's DPD + divergence_poc's DP align), `scripts/gen_granularity.py` → `out/granularity_run.js` (the 4-role detect+grade workflow), `scripts/granularity_analysis.py` (within-pool metrics + LOO + null + concept-merge — coordinator-run; ALWAYS dump the per-span table to catch verifier-artifacts), `scripts/gen_sn36_staging.py` → `out/sn36_staging_run.js` (off-famous staging), `scripts/gen_granularity_viva.py` → `out/granularity_viva_run.js` (the 5-examiner viva).

**Out (metrics — the receipts):**
- `out/metrics_p2.json` — lexical backbone (recall 0.647 CI[0.59,0.70]).
- `out/vinaya_slice.json` — the two-endpoint table (clean).
- `out/divergence_judge_metrics.json` + `out/divergence_poc.json` — divergence rungs.
- `out/crossfamily_viva.json` — the 5-examiner cross-family viva verdict + forensics.

## 3. Sub-chat ledger

None as standalone chats. P0 (2026-06-13) ran ONE staging workflow in-coordinator
(`wf_6d8dfa71-180`, 53 agents) for the brief-drafting/divergence/critic fan-out;
all detection + the audit were done deterministically by the coordinator. The
slice was small + interdependent enough to keep in one chat, as §7 predicted.

## 4. Verification commands + EXPECTED outputs

Run from `C:\Dev\Dhamma` (repo root). All offline except the mirror pull.

```
# Lexical backbone — recall 0.647, 7 genres
python -c "import json;d=json.load(open('research/out/metrics_p2.json'));print(d['overall']['recall_lexical'])"
# EXPECT: 0.647

# Two-endpoint table (regenerates from existing ann files)
python research/scripts/vinaya_slice.py
# EXPECT: opus_clean vinaya advantage ~0.558, fable vinaya ~0.585; sn_mn ~0.142/0.077 (below 0.15 gate)

# Divergence rung 2 — first null-beating lane
python research/scripts/score_divergence_judge.py research/out/divergence_judge_ann.json
# EXPECT: recall 0.409, pos_null p=0.001, sal_null p=0.015, n_suttas 8

# Divergence rung 1 — falsified (sanity: it should FAIL)
python research/scripts/divergence_poc.py
# EXPECT: observed 26, pos p=0.92, sal p=0.987 (worse than chance)

# Mirror integrity  (NB: explicit utf-8 — Win11 default cp1252 chokes on Pāli;
#                    the mirror is a DICT keyed by passage id, so len() = passages)
python -X utf8 -c "import json,io;m=json.load(io.open('research/data/divergence_mirror.json',encoding='utf-8'));print(len(m),'passages')"
# EXPECT: 945 passages

# P0 / DN2 slice — detection granularity (deterministic, fast)
python research/scripts/dn2_slice.py
# EXPECT: lexical 1/5, commentary 5/5 (flood), 10/10 segments flagged ~8 fires/seg

# P0 / DN2 slice — THE headline audit (slow ~3 min: loads 103MB commentary corpus)
python research/scripts/audit_warrants.py research/out/dn2_workflow_result.json
# EXPECT: A_grounded HALL_RATE=0.0 FAB_RATE~0.084 ; B_ungrounded FAB_RATE~0.69

# P1 / granularity — within-pool lane metrics + LOO (deterministic, fast; reads the
# workflow result + the two slices). The honest numbers, NOT the success branch.
python research/scripts/granularity_analysis.py
# EXPECT: DN2 7 commitment/20 (IAA 0.819/0.981), sn36 12/17 (0.634/0.731);
#   div>=2 OR critic>=2 in-sample DN2 1.00/0.64/1.57, sn36 0.83/0.67/1.25;
#   LOO held-out FAILS (fit-dn2->sn36 rec 0.583; null p in viva = 0.445/0.092)

# P1 / sn36 staging audit — grounded-fidelity replication off famous text (slow ~3 min)
python research/scripts/audit_warrants.py research/out/sn36_staging_result.json research/out/sn36_audit.json
# EXPECT: A_grounded FAB_RATE~0.051 (≈0 true) ; B_ungrounded FAB_RATE~0.556 (both HALL_RATE 0.0)
```

Mirror re-pull (only if regenerating; needs the proxy):
```
flyctl agent start; flyctl proxy 15432:5432 --app dhamma-pg   # background
$env:DATABASE_URL="postgres://dhamma:<POSTGRES_PASSWORD>@localhost:15432/dhamma"
# password: flyctl ssh console --app dhamma-pg -C "printenv POSTGRES_PASSWORD"
cd scripts/ingest; node mirror-divergence.mjs
```

## 5. Open queue + recommended next move

**P0 — DN2 vertical slice + hallucination audit — DONE 2026-06-13 (REPORT_v10).**
Verdict: BUILD the staging layer, grounded mode only. Grounded hallucinated-
warrant 0%, fabricated ≤8% (≈0 spot-reviewed); ungrounded 69% fabrication.
Detection: divergence carries readable-granularity recall (7/10, all gold-bearing
segments); lexical 1/5 on running text; commentary floods. Schema holds 5/5.

**P1 — granularity tuning + obscure 2nd passage + viva — DONE 2026-06-13
(REPORT_v11). Verdict: fix-then-build, landed on the pre-committed NULL branch.**
Items 1+2 of the old next-move list are now done (granularity tuning on DN2 + the
obscure 2nd passage SN36.21). What it established: the divergence signal is
selective (gold-independent) and no rep-count threshold transfers → rank-don't-gate
at triage grade (C1/C3, buildable); the grounded-staging fidelity replicates off
famous text (C5 directional). What it did NOT establish: any held-out, null-beating
detection number — the gold is detector-seeded (within-pool only) and the LOO fails
the prereg null in both folds. Build the C1/C3 triage core; the rest is hypothesis.

**Next move — recommended order (post-viva; the must-fixes ARE the agenda):**
1. **An independent, NOT-detector-seeded gold is the prerequisite** for any
   non-circular detection number. The only one we own at scale is the SC
   comment-gold. So the next detection step is **comment-gold-anchored**, not
   pool-anchored: score the divergence + critic lanes vs comment-gold across the
   8-sutta set (REPORT_v9's set) at the new SPAN granularity, with the count-matched
   null. (Single-passage was underpowered: p=0.42; pooled v9 was p=0.001 — so pool
   across the 8 to get power.) This is the honest path to a detection claim that
   isn't circular.
2. **Cross-family (Fable 5) replication** of (a) the divergence SELECTIVITY (silent
   on style, fires on commitment) and (b) the grounded-staging audit — the latter
   breaks the same-family-auditor circularity the viva flagged on C5. Cheap.
3. **Widen the audit corpus** to the full aṭṭhakathā (currently bolded glosses
   only) — tightens grounded fabrication from "≤5%, ≈0" to a hard figure; needed
   for both the DN2 (P0) and sn36 (P1) audits.
4. **A 3rd+ passage** to move past effective clean n=1 (DN2 is within-canonical-
   consensus; only sn36 was clean). Pairs with item 1.
5. **Build the C1/C3 triage core** (ranked divergence-strength affordances + human
   cutoff) — this is the one thing the viva says is buildable now; everything else
   ships as a labeled, unvalidated hypothesis.

**Closeout hygiene (do alongside) — STILL OPEN, P1 did not touch:**
- Cluster-bootstrap CIs on divergence rung-2 (resample the 8 suttas) so v9 can't over-claim. Cheap, local.
- Update `../CLAUDE.md` + `../BACKLOG.md` (still the old "Synthesize button" framing). The program's documented failure mode is stale docs misleading a future session (the 06-09 lapse).
- **Audit the concept-merge** (matchkey collision / inter-merger agreement) before any precision figure within 0.15 of the 0.50 floor is trusted (viva must-fix #6).
- **Deterministic fact-based gold-audit (the better lever vs the detector-seeded-gold fatal — operator's insight, P1).** For each commitment-labelled span, check the PRIMARY SOURCES directly, not model agreement: ≥2 within-lemma DPD senses (lexical), OR a divergent/overriding commentary gloss (doctrinal, e.g. `komārabhacca`=2 DPD headwords+NIDD1a; `vedehī`=paṇḍitā), OR a documented depart-from-dictionary rendering (register/domestication, e.g. `pāsāda`→longhouse — NOT a sense-count, these are monosemous). This already flagged `upāsaka`/`semha` as panel over-calls (single DPD sense). A non-model, fact-grounded gold validation is stronger than the same-family circularity worry and doesn't need human annotation — generalize it across both passages' gold. NB a plain DPD-sense-count is NOT a complete validator (it rejects the monosemous register/doctrinal choices the whole program is about).

**DEFERRED (backlog, pending product signal — do NOT re-open as research):**
- Scale divergence rung-2 across 945 passages (KILLED: validation set is still only the ~8-sutta comment intersection; scaling buys no validation power).
- Second obscure-genre cell to break the Vinaya/Brahmali confound (deferred: serves a generalization claim no build decision depends on).
- Cross-family divergence judge / more vivas (deferred: only matters if publishing).
- Disagreement atlas from the 177 multi-ATI passages (deferred: a free byproduct; build it through the choice-point schema AFTER the slice exists, as a schema stress test).

## 6. Standing principles / decisions (non-negotiables)

- **Warrant, not trust.** The model generates plausible claims and self-validates poorly (proven 9× on this program). Every positive gets an adversarial + permutation-null check before it's believed. The product must be expose-don't-resolve for the same reason.
- **Human translations are a DETECTOR, never a WARRANT.** Divergence flags where a decision exists; it never licenses a rendering. Warrants bottom out in primary data (DPD, commentary, parallels, grammar). Logged as `flagged_by`, never `warranted_by`.
- **NO prod, NO deploy. Sandbox only.** `server/src/access.js` is fail-closed admin-gate groundwork, wired nowhere — keep it that way.
- **The yardstick honesty constraint:** no claim is "validated"/"human-level" because NO human ground truth exists anywhere in the program (gold = model consensus; reviewers = models; the one human signal is translator footnote placement, a ~36%-crux proxy, and translator divergence). Use "internally consistent, pending human-grounded datum." Human annotation (BCBS etc.) is OFF THE TABLE — we are alone. The two yardsticks we OWN: (a) human translator divergence in the mirror; (b) the operator grading the DN2 slice + the machine-checkable hallucination audit.
- **Detection is frozen at triage grade.** Pushing recall 0.65→0.75 is invisible to a human-in-the-loop user. Only precision/flooding (the granularity problem TRANSLATIONS-AI.md calls live-or-die) and the downstream layers matter now.
- **Document as you go.** The 06-09 controls ran and sat unrecorded for 3 days — the program's one real process failure. Commit per unit; update this doc every landing.

## 7. Coordination / ownership rules

- One working tree, branch `master`. Nothing pushed without explicit ask.
- `research/` is the campaign's territory; the live app code (`server/`, `src/`) is OUT of scope for this program except read-only reference.
- If parallelizing the DN2 slice: detector-ensemble run, brief-drafting, and schema-persistence touch disjoint files and can split; the hallucination audit depends on the brief output (sequential gate). Likely better as ONE long-queue chat — it's small and interdependent.
- This doc + BUILDLOG.md are append/update points — reconcile by reading before writing.

## 8. Per-pending-item: what to check when it lands

- **DN2 slice — LANDED 2026-06-13.** Re-verify with the §4 P0 commands. Key
  honesty checks already done: (a) the audit headline was re-run by the
  coordinator, not trusted from the workflow; (b) spot-review found the FIRST-pass
  grounded-hallucination number (35.6%) was an AUDITOR artifact → fixed → true 0%
  (the 10th meta-pattern, this time inside the verification tool — watch for this:
  when an audit number looks alarming, suspect the auditor first). The 8 residual
  grounded "fabrications" are mostly auditor under-credits (real commentary not in
  the bolded-gloss corpus). If you widen the audit corpus, expect grounded
  fabrication to drop further, not rise.
- **Granularity (P1) — LANDED 2026-06-13, fix-then-build.** Re-verify with the §4
  P1 commands. THE lesson, carried forward: any detection "recall"/"precision" off a
  **detector-seeded gold** (pool = the detectors' own proposals) is WITHIN-POOL and
  cannot license a generalization claim — the viva killed exactly that over-claim
  (LOO null p=0.445/0.092). A real detection number needs an INDEPENDENT gold; the
  only one we own is the comment-gold (pool across suttas for power; single-passage
  is p=0.42). Honesty checks already done: the analysis tool produced THREE
  verifier-artifacts (all-zeros aliasing; a false threshold cliff from surface-form
  rep-fragmentation; inflated gold from un-merged duplicates) — all caught by
  eyeballing the per-span table; ALWAYS dump and eyeball the rows. The sn36 staging
  audit was coordinator-run vs the DB (not trusted from the sub-chat); the 10
  grounded "fabs" spot-reviewed as ≥3 auditor under-credits.
- **Next detection cell (comment-gold-anchored / cross-family / 3rd passage):**
  re-confirm the firewall (detectors read Pāli only; divergence reads English only,
  never a warrant). Do NOT report a within-pool number as a detection result — only
  comment-gold-anchored (or other independent-gold) numbers count. For any staging
  cell, the audit runs AGAINST the DB by the coordinator; cross-family auditor
  breaks the same-family circularity. Audit the concept-merge before trusting any
  precision near the 0.50 floor.
- **Bootstrap CIs:** confirm the resample is over SUTTAS (8 clusters), not segments; the salience-null margin is one segment, so expect a wide CI — that's the honest result, not a failure.
- **CLAUDE.md/BACKLOG update:** verify no "Synthesize button" / "AI-draft translation" language survives; the framing must match v9 + this doc.
