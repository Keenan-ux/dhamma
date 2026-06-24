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
- [~] 2-SHIP: build green; committing + push + deploy + smoke now.

## PHASE 3 — Tier C (decisions/outward — autonomous to the gate)
- [ ] 3a. New counter-thesis study: pick a topic where the prior runs AGAINST the house thesis (a
      doctrine the suttas enumerate exhaustively and the commentary simplifies/drops). Run the
      dhamma-research method (prereg → enumerated dataset → paper → de-AI → adversarial review), build
      the live study page + dataset, deploy. (The referee's strongest recommendation for external validity.)
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
