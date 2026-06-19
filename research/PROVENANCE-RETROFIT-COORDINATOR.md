# Provenance-Retrofit Coordinator — living handoff

> Coordinator state for the campaign that retrofits the completed dhamma-research studies with the
> **provenance-signature framework**. Update this doc IN PLACE as each study lands (it is a snapshot, not an
> append log). A successor reads this in full, then the files in §2, then runs §4's verification commands,
> then resumes from §5. The worker seed in §9 runs the whole queue unattended.

## 1. Mission

Re-examine each completed dhamma-research study under the provenance-signature framework (canon-vs-commentary
is one axis of a richer signature) and report, per study, whether the missing axes **confirm, refine, or
change** the finding. The Uttarakuru v2 study (`research/uttarakuru/FINDINGS-v2.md`, committed 600ce65) is the
worked precedent: coding chronological stratum independently of structural layer re-split its "canon," and the
epistemic axis showed the geography is never verified. Find the equivalent for each past study.

## 2. File / artifact map (+ commands)

**The method (read first, both):**
- `.claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md` — the 11 axes, the triage (§4), the recall ladder, the paper segmentation (§6), the worked example (§7).
- `research/RETROFIT-BRIEF.md` — the procedure + the per-study axis triage (the starting hypothesis to test).
- `.claude/skills/dhamma-research/SKILL.md` — the skill now imports the framework; follow it.
- `research/uttarakuru/FINDINGS-v2.md` + `research/uttarakuru/build_dataset.py` — the worked retrofit (paper + a reproducible, consistency-gated builder to copy the pattern).

**The studies (each = one disjoint dataset/paper territory; ResearchView.jsx is SHARED, see §7):**
| Study | Dataset | Renderer (in `src/ResearchView.jsx`) | Paper / record |
|---|---|---|---|
| Awakening census | `public/research/awakening-events.json` (+ `awakening-beings.json`) | `AwakeningStudy` | inline in component |
| Individual-guidance | `public/research/individual-guidance.json` | `IndividualGuidanceStudy` | `research/individual-guidance/` |
| Heart-base / bhavaṅga / insight | `public/research/heart-base-and-insight.json` | `HeartBaseStudy` | inline + `research/individual-guidance/HADAYA-INSIGHT-STAGES.md` |
| Translation / divergence | (none — research-only) | (none) | `research/PREREGISTRATION.md`, `research/REPORT_v11.md` |
| Intoxicants | (none — research-only) | (none) | `research/intoxicants/FINDINGS.md`, `HANDOFF.md` |

**DB lane (serial only):** `flyctl proxy 15432:5432 --app dhamma-pg`, then
`PYTHONIOENCODING=utf-8 DATABASE_URL="postgres://dhamma:<PW>@localhost:15432/dhamma" python research/naga/sql.py "<SQL>"`.
The `<PW>` is the dhamma-pg `dhamma` role password, retrieved live (`flyctl ssh console -a dhamma-pg -C "printenv POSTGRES_PASSWORD"`), never committed. `research/uttarakuru/runq.py` is a serial multi-query runner to copy.

**Rebuild + verify a dataset:** `python research/<study>/build_dataset.py` (must print `CONSISTENCY: PASS`, zero em-dashes, every id resolving). For the renderer, `npx vite build` must succeed.

## 3. Sub-chat ledger

| # | Study | Brief | Status | Verdict |
|---|---|---|---|---|
| R1 | Awakening census | §6.R1 | NOT STARTED | — |
| R2 | Individual-guidance | §6.R2 | NOT STARTED | — |
| R3 | Heart-base / insight | §6.R3 | NOT STARTED | — |
| R4 | Translation / divergence | §6.R4 | NOT STARTED | — |
| R5 | Intoxicants | §6.R5 | NOT STARTED | — |

## 4. Verification commands (+ expected)

The coordinator re-runs these for each landed retrofit; do not trust the sub-chat's self-report.
- `python research/<study>/build_dataset.py` → `CONSISTENCY: PASS`; if no builder existed, one was authored and is data-bound.
- `grep -c "—" <paper-or-dataset>` → `0` (em-dash gate).
- `grep -niE "\b(agent|workflow|pipeline|box|prompt|LLM)\b" <paper>` → no leaks.
- Recall-ladder delta: re-run the study's key-term stem search vs the original substring; the delta (rows added) must match the sub-chat's claim.
- Chronology spot-check: pick 3 "canonical" rows the retrofit calls late-canonical; confirm the work→stratum warrant by direct read.
- `npx vite build` → succeeds (if the renderer was touched).

## 5. Open queue + predictions

All 5 studies open. **Pre-registered predictions** (score verbatim after each lands; a wrong prediction is a finding, not a failure):
- **R1 Awakening:** PREDICT the commentarial/Apadāna/Jātaka awakening events are a *late* stratum (chronology), not merely a separate voice; and that some are redactor-narrated, not Buddha-vacana. PASS if ≥1 large event-class re-codes late-canonical.
- **R2 Individual-guidance:** PREDICT the carita/kammaṭṭhāna/40-object apparatus codes late (Vism-era), confirming the prior "commentarial systematization" finding *as a chronology fact*; the carita semantic-drift is real. PASS if the drift strip is buildable and the apparatus codes commentary-era.
- **R3 Heart-base:** PREDICT the heart-base is never epistemically verified (only posited), and the insight-ñāṇa ladder is Theravāda-systematic (no clean Āgama parallel). PASS if the epistemic column shows "posited, never verified" and the cross-recension link is absent/under-covered.
- **R4 Translation:** PREDICT the reception/edition axes dominate; low chronology yield. PASS if variant-reading + translation-overlay sections are the substantive additions.
- **R5 Intoxicants:** PREDICT the recall re-check on the `majja`/`meraya`/`surā` homograph cluster changes a count (the known homograph trap); chronology secondary. PASS if the recall-ladder delta is non-zero or the homograph precision is re-confirmed.

## 6. Delegation briefs (the QUEUE; ten-field shape)

Each brief shares this preamble: **READ FIRST** (in order) = this doc (§1–§5), `research/RETROFIT-BRIEF.md`,
`.claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md`, `research/uttarakuru/FINDINGS-v2.md` (the worked
precedent), then the study's own files in §2. **METHOD** = the 5-step procedure in RETROFIT-BRIEF.md
(re-triage → recall re-check → chronology pass → epistemic pass → add signature + re-segment + four editorial
passes + coherence check). **ANTI-PATTERNS** (with reasons): (a) reading the structural layer as the timeline
— the whole point is that mūla ≠ early; (b) asserting a "no canonical warrant" negative from a name-substring
without the stem + concept pass — the Uttarakuru `uttarakuru`/`uttarakurū` and `amama`/`amamā` misses
under-counted the canon; (c) treating a genre/register label (paritta, nidāna) as a date — circularity, flag
it; (d) re-opening a settled finding to defend it rather than to test it — this is a test, not a
re-confirmation; (e) letting orchestration leak into the paper. **DRIFT LOG** = `research/uttarakuru/HANDOFF.md`
(the diacritic-recall miss; the rate-limit recovery) + the framing-hypothesis memory. **COMMIT CADENCE** = one
commit per study (dataset + paper + renderer + this doc's ledger row), commit-don't-push, never deploy.
**REFERENCE STANDARD** = `research/uttarakuru/FINDINGS-v2.md` + `uttarakuru.json` v1.3 (the signature columns,
the stratigraphy table, the epistemic-status column, the absence table).

- **§6.R1 Awakening census.** GOAL: code the triaged axes (chronological stratum, attribution, recall) over the awakening events; produce the stratigraphy split + an attribution column. STOPPING CRITERION: every event-class carries a stratum + attribution code, the recall ladder is reported, the dataset rebuilds CONSISTENCY: PASS, the paper carries a within-canon chronology section, coherence green. REGRESSION GATE: the 2,214 event count and the existing canon/commentary columns stay green unless the recall ladder justifies a change (logged).
- **§6.R2 Individual-guidance.** GOAL: code chronological stratum (the carita/kammaṭṭhāna apparatus), the carita semantic-drift strip, epistemic marking, cross-recension. STOPPING CRITERION: the apparatus's stratum is coded, the drift strip is built, the dataset rebuilds PASS, coherence green. REGRESSION GATE: the v1.2 three-tier counts + the samatha/vipassanā verdict stay green unless re-coded with a logged warrant.
- **§6.R3 Heart-base / insight.** GOAL: add epistemic marking (is the heart-base ever verified?), cross-recension (the insight-ñāṇa ladder), harmonization. STOPPING CRITERION: the epistemic-status column built, the cross-recension link checked, the dataset rebuilds PASS, coherence green. REGRESSION GATE: the existing three-tier matrix stays green.
- **§6.R4 Translation / divergence.** GOAL: code reception/translation-overlay + manuscript-edition (variant readings) + attribution over the divergence findings. STOPPING CRITERION: the variant-reading + reception sections added, the report's coherence green. REGRESSION GATE: the validated-with-caveats verdict + the IAA stay green. (No public dataset/renderer; research-only.)
- **§6.R5 Intoxicants.** GOAL: re-run the recall ladder on the `majja`/`meraya`/`surā` homograph cluster (stem + concept), code chronology + cross-recension. STOPPING CRITERION: the recall-ladder delta reported, the homograph precision re-confirmed, chronology coded, the FINDINGS coherence green. REGRESSION GATE: the majja=effect-based-category finding stays green.

## 7. Coordination / ownership rules

- **The corpus is the binding serializer.** All studies query `dhamma-pg`, which wedges under concurrent load (see the concurrency-wedge note). Therefore run the retrofits **SERIALLY** — one study fully landed before the next starts. Do NOT launch parallel chats that hit the DB simultaneously.
- **`src/ResearchView.jsx` is shared** by R1/R2/R3 (their renderers live in it). With serial execution this is a non-issue (each edits its own component function). If the operator insists on parallel, use **git worktrees** (branch-per-study, merge after) and stagger DB access; otherwise keep edits additive and reconcile at the serial merge.
- The research-only studies (R4, R5) touch no shared file.
- Update this doc's §3 ledger and §5 prediction score the moment a study lands.

## 8. Per-pending-item check (what to verify when each lands)

For every R#: (1) re-run §4's commands; (2) score the §5 prediction verbatim; (3) confirm the verdict
(confirmed/refined/changed) is supported by the chronology + epistemic findings, not asserted; (4) confirm the
recall-ladder delta is real (re-run the stem search); (5) confirm zero em-dashes + zero process leaks in the
paper; (6) confirm the dataset rebuild prints CONSISTENCY: PASS; (7) record it in §3 + §5.

## 9. Fire-and-forget worker seed (paste into a fresh chat; operator absent)

> Work autonomously to completion — the operator is not present and will not respond. You are retrofitting the
> past dhamma-research studies with the provenance-signature framework. Read, in order:
> `research/PROVENANCE-RETROFIT-COORDINATOR.md` (this whole doc), `research/RETROFIT-BRIEF.md`,
> `.claude/skills/dhamma-research/PROVENANCE-SIGNATURE.md`, and `research/uttarakuru/FINDINGS-v2.md` (the worked
> precedent). Then bring up the DB proxy (`flyctl proxy 15432:5432 --app dhamma-pg`; password per §2) and begin
> immediately at queue item **R1** (§6.R1). Work each study to its STOPPING CRITERION, then move to the next,
> in order R1 → R5. Drive the corpus SERIALLY (one query at a time; the box wedges under fan-out). For each
> study: re-triage, run the recall ladder (stem + concept, not name-substring), code chronological stratum
> independently of layer, code epistemic marking, add the signature columns to the dataset and the segmented
> sections to the paper, run the four editorial passes + the deterministic coherence check, score the §5
> prediction verbatim, update §3 + §5 of this doc, and commit (one commit per study, commit-don't-push, never
> deploy). On a single item's failure, log it in §3 and continue to the next; do not halt the run. Do not wait
> for input; do not stop to ask. The end condition is the measurable stopping criterion of R5, not a check-in.
