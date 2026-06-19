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
| R1 | Awakening census | §6.R1 | LANDED (ece3e63, 2026-06-19) | CONFIRMED + sharpened |
| R2 | Individual-guidance | §6.R2 | LANDED (724fb4f, 2026-06-19) | CONFIRMED + sharpened |
| R3 | Heart-base / insight | §6.R3 | LANDED (0b2a0d5, 2026-06-19) | CONFIRMED + sharpened |
| R4 | Translation / divergence | §6.R4 | LANDED (6fe3214, 2026-06-19) | CONFIRMED + sharpened |
| R5 | Intoxicants | §6.R5 | LANDED (fbad500, 2026-06-19) | CONFIRMED + refined |

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
- **R1 Awakening:** PREDICT the commentarial/Apadāna/Jātaka awakening events are a *late* stratum (chronology), not merely a separate voice; and that some are redactor-narrated, not Buddha-vacana. PASS if ≥1 large event-class re-codes late-canonical. — **SCORED: PASS** (ece3e63). Apadāna (162, the largest mūla class) and Theragāthā/Therīgāthā (59) both re-code late-canonical; 261/299 mūla rows carry a layer/stratum disagreement; **0/299** canonical awakenings are Buddha-vacana (206 first-person self-narration, the rest redactor-frame / named-disciple report). Verdict **CONFIRMED + sharpened**: even the canon's awakening share is a late, hagiographic-narrated stratum, so the canon-vs-commentary contrast is partly an early→late gradient *inside* the canon. Coordinator-verified: builder CONSISTENCY PASS, em-dash 0 (paper+dataset), no process leaks, recall ladder [2→914→1488→2214] delta 0 (regression gate held), 3-row chronology spot-check confirmed by direct DB read (Vism/Buddhavaṃsa/Apadāna under mūla tag), vite build green.
- **R2 Individual-guidance:** PREDICT the carita/kammaṭṭhāna/40-object apparatus codes late (Vism-era), confirming the prior "commentarial systematization" finding *as a chronology fact*; the carita semantic-drift is real. PASS if the drift strip is buildable and the apparatus codes commentary-era. — **SCORED: PASS** (724fb4f). Drift strip built: 5 strata (early-canon-prose → late-canon → attha → ṭīkā → modern-translation), 4 classified drift points (CND 19 mints the temperament sense = DRIFT-reframing; attha fixes the typology = narrowing-specification; ṭīkā adds the heart-blood somatic diagnostic = enrichment; modern "personality type" = reframing). Apparatus codes para-canonical/Vism: temperament-compound mūla = 53 (30 Vism + 23 para-canonical Khuddaka, **0** in each of AN/SN/MN/DN/Abhidhamma); closed-forty = Vism §37. Epistemic: the matching is **systematized, never asserted-verified** — Vism §36.30 itself disclaims it (*na sārato paccetabbaṃ*). Cross-recension split: pre-sectarian seed (antidote formula, samatha-vipassanā yoke) vs Pāli-local typology. Verdict **CONFIRMED + sharpened** (commentarial systematization → a chronology fact on a pre-sectarian seed). Coordinator-verified: builder CONSISTENCY PASS, em-dash 0 (incl. a mechanical de-AI strip of 176 pre-existing v1.2 em-dashes), no leaks, regression gate held (sutta 46/comm 212, H0/H1 8/7, samatha-vipassanā yoke intact), 3-row chronology spot-check confirmed by direct read (Niddesa + Vism under mūla tag), vite build green.
- **R3 Heart-base:** PREDICT the heart-base is never epistemically verified (only posited), and the insight-ñāṇa ladder is Theravāda-systematic (no clean Āgama parallel). PASS if the epistemic column shows "posited, never verified" and the cross-recension link is absent/under-covered. — **SCORED: PASS** (0b2a0d5). Epistemic column = **posited, never verified**: the named heart-base co-occurs 0× in-window with the (abundant) verification register (sacchikatvā 654, sayaṃ-abhiññā 190, yathābhūtaṃ-pajānāti 264); nearest gap 70 chars and that row makes the heart-base the *support a knowing-citta runs on*, the opposite of verifying it. Harmonization is the new edge: two ṭīkā witnesses admit the canonical silence (*Pāḷiyaṃ anāgataṃ*) and reconcile it *āgamato yuttito ca* by adducing the Paṭṭhāna posit (Abh-pṭ §84.74–75, Vism-mhṭ §16.24). Cross-recension null/under-covered + Theravāda-local. Verdict **CONFIRMED + sharpened**. Coordinator-verified: builder CONSISTENCY PASS, recall ladder [240→272→283→283], em-dash 0, no leaks, three-tier matrix intact, vite build green; 3-row chronology spot-check by direct read (SN 22.89 early / Paṭis Mahāvagga para-canon mūla-tagged / Abh-commentary), and the keystone negative confirmed live: **`hadayavatthu` = 0 in all four Nikāyas and all seven Abhidhamma books, only Visuddhimagga**.
- **R4 Translation:** PREDICT the reception/edition axes dominate; low chronology yield. PASS if variant-reading + translation-overlay sections are the substantive additions. — **SCORED: PASS** (6fe3214). Reception/translation-overlay section (6 load-bearing English terms, all `translator-divergent` over a settled Pāli: nibbāna, sabbūpadhipaṭinissagga, savitakka-savicāra, sammāsamādhi/jhāna, vacīsaṅkhāra, upādāna) + variant-reading section (1 substantive + 2 trivial, the strongest loci apparatus-free, **0 variants drive a divergence**) are the substantive additions; chronology uniform early-canonical SN prose (the predicted low yield). Root finding sharpened by I.7: all 8 divergence loci are `source_edition='sc'` reading-text rows carrying no inline sigla — the study never read the CST apparatus where variants live; the divergence is reception (translator philosophy), not text. Verdict **CONFIRMED + sharpened**; validated-with-caveats verdict + IAA held (no re-code, no re-run). Coordinator-verified: builder CONSISTENCY PASS, em-dash 0, no leaks, forbidden files (prereg/REPORT_v11/renderer/public) untouched, TC-1 apparatus confirmed by direct read (`cst-s0302m.mul-sn2_1`: `upāyupādāna…(sī.)`), vite build green.
- **R5 Intoxicants:** PREDICT the recall re-check on the `majja`/`meraya`/`surā` homograph cluster changes a count (the known homograph trap); chronology secondary. PASS if the recall-ladder delta is non-zero or the homograph precision is re-confirmed. — **SCORED: PASS** (fbad500, both legs fire). Homograph purge: `majja` 1,455 substring → **227** intoxicant (1,228 purged: `majjha` middle / `majjati` polish / `miñja` marrow / elder Majjaka); `surā` 926 → 648 (278 deva/`bhāsura` purged); `meraya` 279 clean. Net cluster N = **840** (mūla 273 / attha 294 / tika 206 / anya 67). The majja RUNG1→RUNG4 delta is **−1,228** (order of magnitude). Chronology, predicted "secondary," produced the substantive refinement: the named prohibition is **canonical** (Vinaya Pc 51 operates the general term `majje`), the explicit **effect-definition is commentarial** (`madanīyaṭṭhena` = 0 four-Nikāya mūla rows; the open-list `yaṃ vā panaññampi…madanīyaṃ` is commentarial-only). Cross-recension: the prohibition is pre-sectarian (Pc 51 across seven Vinaya lines); the open effect-definition is Pāli-local-drawn-out, not invented. Verdict **CONFIRMED + refined** (majja=effect-based held; the canon *operates* the principle, the commentary *states* it as a definition). Coordinator-verified: builder CONSISTENCY PASS, em-dash 0, no leaks, regression gate HELD, 3-row chronology spot-check by direct read (Vinaya Pc 51 mūla / KN-a attha / Sv-pṭ tika), raw recall counts reconfirmed live (majja 1455, meraya 279, effect-def 15), vite build green.

---

## CAMPAIGN COMPLETE — 5/5 LANDED (2026-06-19)

All five studies retrofitted under the provenance-signature framework, each coordinator-verified independently (not on self-report), committed serially on master, commit-don't-push, none deployed:

| # | Study | Commit | Verdict | Prediction |
|---|---|---|---|---|
| R1 | Awakening census | `ece3e63` | CONFIRMED + sharpened | PASS |
| R2 | Individual-guidance | `724fb4f` | CONFIRMED + sharpened | PASS |
| R3 | Heart-base / insight | `0b2a0d5` | CONFIRMED + sharpened | PASS |
| R4 | Translation / divergence | `6fe3214` | CONFIRMED + sharpened | PASS |
| R5 | Intoxicants | `fbad500` | CONFIRMED + refined | PASS |

**All five §5 predictions scored PASS.** No settled finding was overturned; every retrofit *sharpened or refined* its study — the framework added depth (within-canon chronology, epistemic asymmetry, semantic drift, reception-vs-text, homograph precision) without changing a verdict. The recurring shape: the canon-vs-commentary contrast is repeatedly an early→late gradient *inside* the canon, and the load-bearing claims are stated flat (never under the verification formula). Verification battery run per study: builder `CONSISTENCY: PASS` + em-dash gate 0 + zero process leaks + recall-ladder/regression gate + a direct-read spot-check + `vite build`. The serial-DB invariant (§7) was held throughout (one study at a time; no parallel corpus access). Six commits sit on master ahead of origin (4d21791 → fbad500), unpushed. **Next action for the operator: review the six unpushed commits and decide on push; nothing is deployed.**

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
