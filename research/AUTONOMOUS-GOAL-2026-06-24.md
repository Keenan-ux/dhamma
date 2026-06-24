# Autonomous goal ledger — all tiers, run until met (2026-06-24)

*Operator authorized all tiers as one goal, zero check-ins, "not stopping until met." Coordinator-direct
+ Workflows. Ship policy: project pattern = commit + push + deploy + smoke per phase. Loop discipline:
no ScheduleWakeup polling, phase order, this ledger is the survive-context-loss state (update IN PLACE).
"Met" = everything autonomously-completable is done + shipped; every hard-gated item has a ready-to-fire
artifact + a one-line decision request. Do NOT fire irreversible outward actions (external email, public
flip, AI-synthesis go-live) autonomously.*

## Status key: [ ] todo · [~] in progress · [x] done+shipped · [!] blocked (artifact ready, needs operator)

## PHASE 1 — Tier A (safe, high-value) — DONE
- [x] 1a. Regression re-review (workflow wp69nqx6m, 6 agents): awakening/uttarakuru/naga/IG CLEAN,
      heart-base minor-issues. Coherence found 2 major gaps + minors; ALL FIXED coordinator-direct:
      heart-base banned word "load-bearing" cleared from the rendered method_note (+ regenerated);
      heart-base + IG stratigraphy "disagree" captions added (the by-construction caveat the method
      docs now require); IG per-million-character density figure added to G1 (sabhava climb holds
      per-char: canon~0 / attha~65 / tika~155). Build green, em-dash held at 7.
- [x] 1b. Auditability backfill (S4): research/CORPUS-SNAPSHOT-2026-06-24.json — 13 committed
      query→result records (carita 0/0/0, sabhava climb, divine-eye 176/5, marker confound, per-layer
      totals) so the corpus facts re-derive from the repo. Heart-base keeps its own counts-snapshot.json.
- [x] 1c. QA: build compiles; re-review confirmed page↔dataset reconciliation; my edits prose-only.
      Full auth'd browser QA needs admin secrets (out of autonomous reach) → post-deploy smoke instead.
- [x] 1-SHIP: committed 323fb31, PUSHED (b8a9ca6..323fb31, all session commits synced), deployed +
      smoked green (dbcheck 194710, ready 200, live hash CvJDqobh == build). PENDING-PUSH item resolved.

## PHASE 1.5 — note: ship policy decided = full-ship (commit+push+deploy+smoke per project pattern).

## PHASE 2 — Tier B (writing-quality rollout, the original campaign)
- [x] 2a. DONE: WRITING-STANDARD §3.5 (precision) / §3.6 (register) / §3.7 (timeline) / §3.8
      (question-sharpening, author-time) + EDITOR "Precision & register gates" encoded; adversarially
      verified (workflow w444ol0fk, 3 lenses, ship-with-edits) and ALL fixes applied (need-gated pinning,
      §3.2 carve-out, distribution-test PASS/FAIL on the exemplar, measured-not-toothless, §3.7 single-
      source, §3.8 forking-paths firewall, threshold reconciled, banned word removed). Memory
      writing-rules-from-ig-notes updated. Skill-docs only (not bundled) -> no deploy.
- [x] 2b. DONE: heart-base method_note "load-bearing" cleared in Phase 1 (323fb31); naga.json 37 rendered
      data-field em-dashes regraded + 5 meta "load-bearing" swapped (in 2c). Rendered residuals clear.
      Non-rendered residuals LEFT by design: 8 naga evidence_pali em-dashes are verbatim Pāli QUOTES (never
      edit the evidence); meta.title "— census v1.0" + IG/naga FINDINGS banned words are non-rendered /
      secondary-internal (allowed). NOTE: naga claim regrades live in the SERVED json; a full naga regen
      (DB-dependent, not routine) would need them re-applied at the build source.
- [x] 2c. DONE: scan workflow w0s4i2285 (5 read-only scanners, propose-then-coordinator-applies, to protect
      operator-reviewed prose). Applied: IG 6 register regrades (freezes/freezing -> fixes/fixing/recasting,
      keeping the function-into-type force; methodological "frozen"=pre-registered correctly LEFT); heart-base
      +1 gloss (akusala-mūla); uttarakuru +1 gloss (pakati-sīla, the soteriological hinge); naga 42 data edits.
      Awakening 0 (already clean from prior campaigns). Conservative: 0 over-edits, every <Cite> preserved
      (138), em-dash held at 7 (all comments). Applied via research/_apply_2c.py.
- [x] 2-SHIP: committed 965ed49, pushed, deployed + smoked green (dbcheck 194710, live hash Crk_P0rU == build). PHASE 2 DONE.

## PHASE 3 — Tier C (decisions/outward — autonomous to the gate)
- [x] 3a. Counter-thesis study "COME AND SEE" — DONE (corrected after review; building to ship). Topic found empirically via a 23-term
      per-char density sweep (_discovery_counter.py): the Dhamma's invitational qualities (ehipassika
      4.6x / opaneyyika 3.7x / paccattaṃ-veditabbo 3.7x canon-denser) vs akālika "timeless" (5x
      COMMENTARY-denser) — a NON-HOUSE verdict that refines the house thesis (systematization is
      SELECTIVE). Done: PREREGISTRATION.md (frozen H0 pre-committed), _enumerate.py (71 canon formula rows
      across all 4 Nikāyas + 18 commentary rows), come-and-see.json dataset (treatment-coded: amplify=0,
      CONSISTENCY PASS), FINDINGS.md paper. RUNNING: adversarial review (wzyfg58hs, 3 lenses) + page
      component builder (ComeAndSeeStudy, editing ResearchView). NEXT: address review findings, integrate
      page, build+commit+push+deploy. Discovery ALSO confirmed the harness finds the house direction too
      (saṃvega 0.10x, anupubbikathā 0.07x = strongly commentary-dense) — not rigged.
- [!] 3b. Dictionary expansion — BLOCKED (assessed 2026-06-24): CPD blocked on LICENSING, not just an
      email (Cologne has no bulk download; only DPD's scraped 29,734-entry SQLite with no licence claim;
      PTS still sells volumes). Buddhadatta low-priority/redundant with DPD. Cone is PTS-copyright. No
      clean autonomous source. Artifact = this assessment; needs operator licensing decision.
- [!] 3c. Access-to-Insight outreach: DONE TO THE GATE (2026-06-24). Consolidated the two drafts into one
      clean OUTREACH-EMAIL-DRAFT.md (scholarly register, no feature-dump, no em-dash), FIXED a factual
      error (old draft claimed 6 dictionaries incl 'CPED'; live set is 5), added an operator send-checklist.
      ATI_EMAIL_DRAFT.md banner-marked superseded. NOT sent (outward, needs operator name + send).
- [!] 3d. AI-draft translations: DOCUMENTED TO THE GATE (2026-06-24). The design is TRANSLATIONS-AI.md
      ("Auditable Translation" / choice-point detection; prior validated-with-caveats work per memory
      choice-point-detection-study). Exact operator decisions blocking a build: (1) GO/NO-GO on shipping
      ANY LLM synthesis (the standing no-LLM-by-default hard rule must be explicitly waived, opt-in +
      AI-labeled); (2) MODEL for the judgment-staging role; (3) UX of the decision-workbench / opt-in
      labeling; (4) STORAGE of committed lemma-level choices. No autonomous build (the hard rule forbids
      it). Artifact = TRANSLATIONS-AI.md.
- NOTE: Tier C's only substantial AUTONOMOUS item is 3a (the counter-thesis study). 3b/3c/3d are at-gate.

## PENDING OPERATOR ITEMS (logged, not blocking the rest)
- Push the session's local commits (73a77e0 fixes + ae12762/df2d54a/32429fd review/PDF) — will push at 1-SHIP.

## Phase 2 scoping (done 2026-06-24, before execution)
- 2a DRAFTED: WRITING-STANDARD §3.5 (first-contact precision), §3.6 (measured register), §3.7 (timeline
  precision), §3.8 (question-sharpening) + EDITOR-CHECKLIST "Precision & register gates". In adversarial
  verify (workflow w444ol0fk, 3 lenses) before commit. Then update memory writing-rules-from-ig-notes.
- 2b/2c residuals SCOPED: the 7 ResearchView em-dashes are ALL in code comments (rendered prose is
  em-dash-clean). The real rendered em-dashes live in naga.json DATA (34 records[].claim + 3 spine) +
  5 non-rendered meta "load-bearing" → fold into the 2c naga pass. Register-pass targets: ~5
  "freezes/frozen" instances (IG L1514/1580/1671, heart-base L2576/3301) to evaluate per §3.6. No
  early-pure/late-fallen binary phrasing found (already clean). IG/naga FINDINGS banned words stay
  (secondary/internal docs per the rule). So 2c = a targeted precision+register polish per study, not a
  rewrite (prior campaigns already de-chopped + glossed much).

## Run log (newest first)
- 2026-06-24: Phase 1 DONE+shipped (323fb31, deployed, smoke green). Phase 2a drafted + in verify.
- 2026-06-24: ledger created; Phase 1a.

## 3a REVIEW LANDED (wzyfg58hs) — rework queue before deploy
Verdict: core H0 SOUND (invitational canon-dense, amplify=0, not massaged), but §IV over-read.
- [DROP] §IV "selective systematization on akālika" — INVALID: the 5x akālika density is corpus-wide
  (~782/800 rows are akālika OUTSIDE the formula); IN-formula akālika gets the SAME brief gloss as
  ehipassika. Corrected thesis (cleaner): the commentary word-glosses ALL six qualities briefly and
  amplifies NONE; akālika earns apparatus ELSEWHERE for reasons independent of this formula.
- [FIX] "13 of 18" -> "12 of 18" (word-gloss 6 + correlate 6); "eight works" -> "seven".
- [FIX] 71 rows double-counts SC+CST editions of the same suttas (~42 distinct discourses) -> add the
  dedup/distinct-discourse count; lean breadth on per-char density + 4-Nikaya distribution, not raw rows.
- [FIX] exclude pli-vism from the canon density numerator (_enumerate.py step 3); re-derive (ratios
  barely move; ehipassika stays ~4.6x).
- [FIX] discovery figures (saṃvega etc.) -> label discovery-phase (not in served dataset).
- [FIX] foreground that ehipassika canon-density is recitation-driven (one formula, broadly distributed,
  ~96% of canonical ehipassika is in-formula) = high token-count, not many independent uses.
- [FIX] store fuller text (~400-600 chars) for the 18 commentary rows so amplify=0 is auditable; note
  the prereg κ descoped in favor of the full-text dump (the call is mechanical: presence of a scheme).
Then: rewrite FINDINGS, rebuild dataset, fix the page prose, build + commit + push + deploy.

