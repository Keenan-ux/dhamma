# Coordinator handoff — Dhamma research program (2026-06-24)

*Fresh handoff for a successor chat. Read this in full, run §4 verification, then pick up §5. This
supersedes the campaign-specific docs it points to. Internal doc; em-dashes allowed here, NOT in the
deliverable prose. Update IN PLACE (snapshot, not append-log).*

## 1. Where things stand (one screen)
Live at **https://dhamma.fly.dev/** (admin-gated Research tab). HEAD = `36d1477`, working tree clean,
origin in sync. The 2026-06-23 adversarial review of the whole research program, its full correction
queue, a writing-standard hardening pass, and a brand-new 6th study all landed this session and are
deployed. **There are now six Research studies** (awakening, individual-guidance, heart-base-and-insight,
uttarakuru, naga, **come-and-see**) plus two public Explorations (wheel-turning-monarch, vegetarianism).
All theses survive; the quantitative apparatus was corrected program-wide. Nothing is mid-flight.

## 2. What landed this session (newest first; all deployed + pushed)
- `a0f7c37` mark the all-tiers autonomous goal MET (the ledger).
- `29ce7c2` **NEW study "Come and See"** — the counter-thesis the review asked for: the Dhamma's
  invitational register (*ehipassika* 4.4x / *opaneyyika* 3.5x CANON-denser, amplify=0) is a non-house
  verdict; topic found by a 23-term density sweep that ALSO finds the house direction (so not rigged);
  pre-registered, enumerated, adversarially reviewed + CORRECTED (dropped an over-read akalika
  "selectivity" claim). Memory `come-and-see-study`.
- `965ed49` Phase 2c writing rollout — precision/register rules rolled through all five old studies
  (conservative propose-then-apply): IG freezes->fixes, two Pali glosses, 37 naga data-field em-dashes
  regraded.
- `c713ec7` consolidated ATI/BCBS outreach to one ready draft (`OUTREACH-EMAIL-DRAFT.md`).
- `c1b8298` encoded writing rules **WRITING-STANDARD §3.5-§3.8** (first-contact precision / measured
  register / timeline / question-sharpening) + EDITOR-CHECKLIST gates; 3-lens verified.
- `323fb31` Phase 1 — regression re-review fixes + auditability backfill (`CORPUS-SNAPSHOT-2026-06-24.json`).
- `73a77e0` applied the full P0/P1/P2 correction queue across all five studies + method docs.
- `32429fd` / `df2d54a` the adversarial review report + its 35pp PDF.
Method docs hardened: `PROVENANCE-SIGNATURE.md` I.1 (stratum axis relabelled a frozen reference table +
added to the per-claim gate), `SKILL.md` rules 7-11 (forking-paths, per-character-density mandate,
IAA-scope, negative-control, span-aware coding), `COHERENCE-CHECKLIST.md` two gates.

## 3. The two systemic corrections that shaped everything (do NOT regress)
- **T1 — stratum is a `work_slug` lookup, not an independent coding.** "Layer/stratum disagreement" ==
  "not early-canonical" by construction. Every study now labels its stratigraphy disagree column with the
  by-construction caveat; PROVENANCE-SIGNATURE I.1 was rewritten. Never present a disagree count as
  independent convergent evidence again.
- **T2 — canon-vs-commentary MAGNITUDE must be per-CHARACTER, never raw rows.** Commentary was subdivided
  to ~330-char paragraph rows while canon is ~2,975-char whole-sutta rows, so canon is 9% of rows but 44%
  by character. Per-character the commentary is genuinely 3.5-5.5x denser on the old studies' topics
  (direction holds, raw "85% commentarial" magnitude was the artifact). SKILL rule 8 mandates per-Mc.
  Per-layer char totals: mula 53.5M, attha 29.5M, tika 28.4M.

## 4. Verification commands + EXPECTED outputs
- `curl -s https://dhamma.fly.dev/api/dbcheck` -> `passages: 194710, pgvector: true`.
- root / `…/api/ready` -> `200`; `…/api/research` -> `401` (admin-gated); a served `…/research/*.json` ->
  `401` (gate, expected). `…/explorations/*.json` -> `200` (ungated).
- live frontend asset hash == local `npm run build` hash (currently `index-BGQEl_SR.js`) confirms the
  deploy shipped the working tree.
- `git status` clean, HEAD `a0f7c37` == `origin/master`.
- Six study components: `grep -nE "^function (Awakening|IndividualGuidance|HeartBase|Uttarakuru|Naga|ComeAndSee)Study" src/ResearchView.jsx` (line anchors SHIFT, re-grep).
- DB work is SERIAL ONLY (dhamma-pg wedges under concurrent load): proxy `flyctl proxy 15432:5432 --app
  dhamma-pg`, then `research/naga/sql.py` or a one-connection script. NEVER fan agents at the DB.

## 5. Open queue (in order)
**Operator-gated (the only things blocking "fully done"; do NOT fire autonomously):**
1. **Outreach.** Three live unsent drafts remain: `OUTREACH-EMAIL-DRAFT.md` (consolidated BCBS/ATI, ready),
   `BPS_EMAIL_DRAFT.md`, `SUTTACENTRAL_EMAIL_DRAFT.md`. Operator adds name + confirms the address, then
   SENDS (outward action). (2026-06-24: `ATI_EMAIL_DRAFT.md` removed as superseded; `CPD_EMAIL_DRAFT.md`
   removed as moot, see item 2.)
2. **Dictionary expansion — CPD now UNBLOCKED.** Operator ruled CPD free for non-commercial scholarly use
   (it appears discontinued), so no licensing inquiry is needed. This is now an INGEST task, not a gate:
   add CPD to `dictionary_entries` (source='cpd') + embed (per the existing dict ingest path); no clean
   bulk source means extraction may be the slow part. Cone remains PTS-copyright (out).
3. **AI-assisted translations.** Blocked on the no-LLM-synthesis-by-default rule + model/UX/storage
   decisions (`TRANSLATIONS-AI.md` is the design). Operator gives go/no-go.

**Optional hardening (autonomous-doable; lower value, do only if asked):**
4. Writing residuals deferred from the rollout: secondary `FINDINGS*.md` banned words (internal docs, the
   rule permits them); naga.json NON-rendered meta strings. The LIVE pages are clean.
5. Auditability (review finding S4): **verified complete 2026-06-24.** Every study's published counts
   re-derive from a committed artifact — awakening `_sql_facts.json`, IG census JSONs + shared
   `CORPUS-SNAPSHOT-2026-06-24.json`, heart-base `counts-snapshot.json`, uttarakuru `_census_*.json`,
   naga `sql.py` + the shared snapshot's recall-floor + served `naga.json`, come-and-see `_enumerate.py`
   + committed `_raw.json`. The two artifacts the review flagged (`fine_full.json`,
   `canon_serpent_candidates.json`) are absent/regenerable and superseded by the above. Only marginal
   nicety left: naga's headline soteriological-ceiling facts could be added to the frozen shared snapshot
   for parity (one serial DB run); naga is already auditable via its served dataset, so this is optional.
6. Naga claim em-dash regrades live in the SERVED `naga.json` only; a full naga pipeline regen
   (DB-dependent, not routine) would need them re-applied at the build source.
7. Come-and-see second-coder κ: **DONE 2026-06-24** (commit `36d1477`). A blind second coder re-coded all
   18 commentarial rows from the same snippets against the prereg codebook: Cohen κ = 1.00 on the five-way
   descriptive code, and amplify = 0 independently replicated (the falsifiable core; its binary has no
   variance so it is reported as exact replication, not a κ). `SECOND_CODER` lives in
   `come-and-see/build_dataset.py` (κ re-derives at build); served json + live page + FINDINGS report it.

## 6. File / artifact map
- **Live pages (canonical deliverable):** `src/ResearchView.jsx` — all six study components in ONE file
  (NOT parallelizable without git-worktrees; serial or coordinator-direct). Registry + slug->component
  dispatch near the top.
- **Served datasets:** `public/research/*.json` (admin-gated). Each study's `research/<study>/build_dataset.py`
  generates its dataset; most build from committed census JSON (local), naga's `build_windows.py` hits the DB.
- **The review:** `research/ADVERSARIAL-REVIEW-2026-06-23.md` (+ `.pdf`, `_render_review_pdf.py`); harness
  `research/_adv_db_check.py`; corpus snapshot `research/CORPUS-SNAPSHOT-2026-06-24.json`.
- **New study:** `research/come-and-see/` (PREREGISTRATION, _enumerate.py, _raw.json, build_dataset.py,
  FINDINGS.md) + `research/_discovery_counter.py` (the topic-finder sweep).
- **Method + writing standard:** `.claude/skills/dhamma-research/` (SKILL.md, PROVENANCE-SIGNATURE.md,
  WRITING-STANDARD-READABILITY.md §3.4-§3.8, EDITOR-CHECKLIST.md, COHERENCE-CHECKLIST.md).
- **This session's ledger:** `research/AUTONOMOUS-GOAL-2026-06-24.md`. The prior writing-campaign handoff
  `research/WRITING-QUALITY-HANDOFF.md` is now fully discharged (its queue shipped).
- **Memory:** `come-and-see-study`, `adversarial-review-2026-06-23`, `writing-rules-from-ig-notes`,
  `research-pages-are-canonical`, `dhamma-concurrency-wedge`, `dhamma-research-standard`.

## 7. Standing principles (non-negotiable)
- The LIVE page in `src/ResearchView.jsx` is the canonical deliverable; `FINDINGS*.md` are secondary.
  Edit the page directly; never look for the retired MD->JSX generator.
- No em-dashes in deliverable prose (regrade by function); no first person; banned crutch words
  `load-bearing` / `cross-cutting`. The standard now also enforces §3.5-§3.8 (precision/register/timeline).
- Serial DB only. Commit per item; push to master; deploy + smoke after any prose/render change. Confirm
  citations resolve + per-component `<Cite>` count preserved before deploy.
- Operator reads on the LIVE site and leaves inline research-notes; pull notes, do not ask them to paste
  (read path: memory `research-notes-feature`).
- Do NOT fire irreversible outward actions (send email, public-repo flip, AI-synthesis go-live)
  autonomously; prepare to the gate and surface a one-line decision request.

## 8. Coordination / ownership
Single working tree on master. All six study components share `src/ResearchView.jsx` -> per-study work is
serial (or git-worktree-per-study + merge). Method docs (`.claude/skills/dhamma-research/*`) are a
disjoint second territory, safe to edit in parallel. This session was coordinator-direct + Workflows
(adversarial review 22 agents; fix workflow 11; regression re-review 6; writing-rule verify 3; 2c scan 5;
come-and-see review 3 + a page-builder agent); no separate sub-chats outstanding.
