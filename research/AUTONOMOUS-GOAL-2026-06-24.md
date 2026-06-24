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
- [~] 1-SHIP: commit + push + deploy + smoke (decision: full-ship per project pattern; pushes the
      session's local commits too, resolving the flagged pending item).

## PHASE 2 — Tier B (writing-quality rollout, the original campaign)
- [ ] 2a. Encode rules 2 (first-contact precision) + 3 (measured register) + riders A/B into
      WRITING-STANDARD §3.5/§3.6 + EDITOR-CHECKLIST tells/gates; adversarial-verify; update memory
      `writing-rules-from-ig-notes`. (Doc-only.)
- [ ] 2b. Clean pre-existing rendered residuals: heart-base `v2.method_note` "load-bearing"
      (ResearchView ~3245); naga.json ~37 data-field em-dashes (records[].claim ×34 + spine ×3);
      IG/naga FINDINGS banned words (secondary).
- [ ] 2c. Roll the three rules + riders through the IG body + the other four studies' prose (precision:
      gloss every load-bearing term, present-before-refer; register: de-indict; rhythm: no chop/pile-up).
      Serial per study on the shared file.
- [ ] 2-SHIP: build + deploy + smoke per study.

## PHASE 3 — Tier C (decisions/outward — autonomous to the gate)
- [ ] 3a. New counter-thesis study: pick a topic where the prior runs AGAINST the house thesis (a
      doctrine the suttas enumerate exhaustively and the commentary simplifies/drops). Run the
      dhamma-research method (prereg → enumerated dataset → paper → de-AI → adversarial review), build
      the live study page + dataset, deploy. (The referee's strongest recommendation for external validity.)
- [!] 3b. Dictionary expansion — BLOCKED (assessed 2026-06-24): CPD blocked on LICENSING, not just an
      email (Cologne has no bulk download; only DPD's scraped 29,734-entry SQLite with no licence claim;
      PTS still sells volumes). Buddhadatta low-priority/redundant with DPD. Cone is PTS-copyright. No
      clean autonomous source. Artifact = this assessment; needs operator licensing decision.
- [!] 3c. Access-to-Insight outreach: drafts ALREADY EXIST (ATI_EMAIL_DRAFT.md, OUTREACH-EMAIL-DRAFT.md).
      Review/polish at Phase 3; DO NOT send (outward, needs operator).
- [!] 3d. AI-draft translations: blocked on operator decisions (model/UX/storage + the no-LLM-default
      rule). TRANSLATIONS-AI.md is the design. Document decisions needed; do not ship synthesis.
- NOTE: Tier C's only substantial AUTONOMOUS item is 3a (the counter-thesis study). 3b/3c/3d are at-gate.

## PENDING OPERATOR ITEMS (logged, not blocking the rest)
- Push the session's local commits (73a77e0 fixes + ae12762/df2d54a/32429fd review/PDF) — will push at 1-SHIP.

## Run log (newest first)
- 2026-06-24: ledger created; starting Phase 1a.
