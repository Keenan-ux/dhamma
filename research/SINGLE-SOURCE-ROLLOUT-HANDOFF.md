# Coordinator handoff — Dhamma research follow-on campaign (single-source rollout + cleanup)

*Living doc. The coordinator's state. A successor reads this in full, then the files in §2, runs the §4
verification, then executes the §5 queue. Update IN PLACE as items land (snapshot, not append log).
Created 2026-06-22. NOT to be confused with `research/COORDINATOR-HANDOFF.md` (a different program, the
Auditable Translation study) or `research/individual-guidance/COORDINATOR-HANDOFF.md` (the COMPLETED "From
Function to Essence" campaign, whose §3 ledger records everything that already shipped).*

## 1. Mission
The IG study cleanup (ITEMs 1-3) and a 10-item skill/tool/DB improvement pass are DONE, deployed, and live at
https://dhamma.fly.dev. This campaign is the OPEN follow-ons: chiefly **roll the new MD→JSX single-source
generator over the other narrative studies** so each paper is edited once (in its readable MD) and the
deployed reader is regenerated; plus a few smaller logged follow-ons (§5 ITEM B). All work on `master`,
single working tree, deploy + smoke per change.

## 2. File / artifact map (READ FIRST, in this order)
- **This doc.**
- `research/individual-guidance/COORDINATOR-HANDOFF.md` — the completed campaign's §3 ledger (what shipped:
  the gated cosmology census, the pli-kn de-bucket, the reconciliations/G2/G3/de-comma, then the 10 tool/DB/
  skill improvements). Background only.
- `research/PAPER-SOURCE.md` — **the rollover playbook.** How the IG narrative is single-sourced and exactly
  how to convert the next study. Read this BEFORE touching any reader.
- `research/individual-guidance/gen-narrative.mjs` — the working generator (currently IG-specific: the MD path
  and `IndividualGuidanceStudy` markers are hard-coded). The rollover either parameterizes this (MD-path +
  component + region boundaries as args) or clones it per study.
- `research/paper-sync-check.mjs` — the MD↔JSX drift checker (`node … <md> <Component>`); an eyeball aid for
  the not-yet-converted studies and for catching drift in any study's out-of-scope (hand-JSX) regions.
- The rollover targets (each = a readable MD + a JSX narrative component in `src/ResearchView.jsx`):
  - `research/awakening/FINDINGS-readable.md` → `AwakeningStudy`
  - `research/heart-base/FINDINGS-readable.md` → `HeartBaseStudy`
  - `research/uttarakuru/FINDINGS-readable.md` → `UttarakuruStudy`
  - `research/naga/` → `NagaStudy` — **WRINKLE:** naga's readable is `FINDINGS.md` / `SPINE-FINDINGS.md`, not
    `FINDINGS-readable.md`; confirm which is canonical before converting.
  - DONE: `IndividualGuidanceStudy` ← `research/individual-guidance/FINDINGS-readable.md`. NOT candidates:
    `research/intoxicants/FINDINGS-readable.md` has NO JSX study component; `ArticleStudy`/`ExplorationStudy`
    are generic renderers, not single-study narratives.
- DB research primitives (added this pass — USE them, don't re-derive): `server/sql/schema.sql` defines
  `stratum(work_slug)` (the fine 6-stratum code) + the `is_primary` de-dup flag;
  `scripts/ingest/migrate-stratum-flags.sql` populates them; `research/individual-guidance/{KN-STRATUM-MAP.json,
  KN-REBUCKET.md}` + `RECONCILIATION.md` carry the reasoning.
- Skill (method + writing gates): `.claude/skills/dhamma-research/{SKILL.md, PROVENANCE-SIGNATURE.md (RUNG 5 =
  the SC+CST double-ingest counting hazard), WRITING-STANDARD-READABILITY.md, EDITOR-CHECKLIST.md}`.
- Serial-DB runner: `research/naga/sql.py` — self-extracts the DSN now, so `python research/naga/sql.py "SQL"`
  works with `DATABASE_URL` unset (or export it once for many queries). Proxy must be up:
  `flyctl proxy 15432:5432 --app dhamma-pg` (note the explicit `:5432`).
- Relevant memory notes: `dhamma-concurrency-wedge` (the serial-DB rule + the no-agent-DB-access lesson + F6),
  `writing-rules-from-ig-notes` (the editorial rules; the other 4 studies carry residual load-bearing/
  first-person), `readable-paper-standard`, `dhamma-research-standard`.

## 3. Sub-chat ledger
(none yet — populate as you delegate. NOTE §7: the 4 conversions all edit the SHARED `src/ResearchView.jsx`,
so they are SERIAL, not parallel — last-write-wins would clobber. Prefer ONE long-queue worker doing all four
in order.)

## 4. Verification commands + EXPECTED outputs
- `curl -s https://dhamma.fly.dev/api/dbcheck` → `passages: 194710, pgvector: true`.
- `curl -s -o /dev/null -w '%{http_code}' https://dhamma.fly.dev/api/research` → `401` (admin-gated, expected).
- `curl -s -o /dev/null -w '%{http_code}' https://dhamma.fly.dev/` → `200`; `…/api/ready` → `200`.
- `npm run build` → `✓ built` (must be green before any deploy).
- DB primitives live:
  `python research/naga/sql.py "SELECT stratum('pli-an') AS s, (SELECT count(*) FILTER (WHERE is_primary) FROM passages) AS prim;"`
  → `1early`, `192945`.
- Per converted study: `npm run build`; `node research/paper-sync-check.mjs research/<x>/FINDINGS-readable.md <Component>`
  (drift should fall to the out-of-scope parts only — method-in-brief / footer / repro-details / data tables);
  curl every `<Cite>` id in the regenerated narrative for `200`.

## 5. Open queue
**ITEM A — roll single-source over AwakeningStudy / HeartBaseStudy / UttarakuruStudy / NagaStudy.**
GOAL: each narrative edited once in its MD; reader regenerated from it; deployed. METHOD (per `PAPER-SOURCE.md`,
following the IG worked example exactly): (1) generalize `gen-narrative.mjs` to take (MD-path, component,
marker boundaries) as args; (2) per study, wire the `GEN:NARRATIVE-A/B` markers around the narrative regions,
leaving data-bound tables / `<details>` OUTSIDE; (3) regenerate; (4) build; (5) `paper-sync-check` → drift =
out-of-scope-only; (6) curl every citation; (7) commit the MD + ResearchView.jsx together; (8) deploy + smoke.
EXPECT: the first regen of each study FIXES its accumulated MD↔JSX drift (as IG's did) — review that diff so
the changes are MD-canonical, not generator bugs. STOP WHEN: all four converted, each verified + deployed.
(Do NagaStudy last, after resolving its readable-file wrinkle, §2.)

**ITEM B — smaller logged follow-ons** (lower priority; each short, self-contained):
- Residual **load-bearing / first-person** prose in the other four studies (the IG study is clean; the others
  carry it per `writing-rules-from-ig-notes`). A de-AI editor pass per study against EDITOR-CHECKLIST.
- The **within-stratum SC+CST double-encoding** caveat: early-stratum row counts run ~2x (recorded in
  `research/individual-guidance/COSMOLOGY-CENSUS.md` + skill RUNG 5). A worked datum, not a defect — surface it
  where any study cites raw early magnitudes, or filter those counts with `WHERE is_primary`.
- **F6 residual:** only the Meaning path is concurrency-capped (`server/src/concurrency.js`,
  `SEARCH_HEAVY_CONCURRENCY=2`); an Exact/Stem burst is theoretically ungated (untested). Extend only if it
  ever proves a real concern.

## 6. Standing principles / decisions (non-negotiable)
- **Serial DB only.** dhamma-pg crashes under concurrent load (the wedge) and cannot self-recover well. NEVER
  fan agents at the DB — they WILL extract the DSN and fire concurrent queries and wedge it (observed this
  campaign; recovery = `pg_terminate_backend` on stale `pg_stat_activity` rows). Agents REASON over inlined
  data; the coordinator runs queries serially via the proxy + `sql.py`, never the live `/api`. See the
  `dhamma-concurrency-wedge` memory.
- **MD is the canonical single-source for a converted study.** Edit the MD, run the generator, build, commit
  the MD + ResearchView.jsx together. NEVER hand-edit a generated `GEN:NARRATIVE` region (it gets overwritten).
- **Writing gates** (EDITOR-CHECKLIST + WRITING-STANDARD): no em-dashes, no first person, no "load-bearing"/
  "cross-cutting", no setup-and-payoff cadence, tendency-not-law, every citation resolves.
- **Commit per item; push to master (project pattern); deploy + smoke after any prose/render change.** Gitignore
  scratch (`research/individual-guidance/_*`, `server/_*`, `*.jsonl`).
- The operator reads the deployed reader; a render change must build green + verify (citations 200, paper-sync)
  before deploy.

## 7. Coordination / ownership
Single working tree on master. The four ITEM-A conversions ALL edit `src/ResearchView.jsx` (shared file) →
**not parallelizable** (last-write-wins clobber, and they race on the shared file + this doc). Run SERIALLY:
one long-queue chat through all four, or strictly one study at a time. The studies' MDs are disjoint but the
reader file is the bottleneck; git-worktree+merge overhead isn't worth it for a shared component. ITEM B's
writing passes touch the same files, so sequence them after each study's ITEM-A conversion (or after all of A).

## 8. Per-pending-item: what to check when it lands
- ITEM A (per study): `GEN:NARRATIVE-A/B` markers bound exactly the narrative (data-bound tables/`<details>`
  OUTSIDE); `npm run build` green; `paper-sync-check` drift = out-of-scope-only; every `<Cite>` id curls 200;
  the regenerated narrative matches the canonical MD (review the diff — it should fix prior drift, not garble);
  deployed + smoke green; the commit is MD + ResearchView.jsx together.
- ITEM B: a grep of the converted paper shows no first-person / "load-bearing" / "cross-cutting"; raw early
  magnitudes carry the double-encoding caveat or are `is_primary`-filtered; build + smoke green.
