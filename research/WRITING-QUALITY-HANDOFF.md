# Coordinator handoff — Dhamma research-writing-quality standardization + rollout

*Living doc = the coordinator's state. A successor reads this in full, then the §2 file-map, runs the §4
verification, reports current state + any drift, then resumes the §5 queue. Update IN PLACE (snapshot, not
append log). Created 2026-06-23. Internal doc; em-dashes allowed here, NOT in the deliverable prose.*

## 1. Mission
Standardize the WRITING of the five dhamma-research study pages so a comparative-Buddhist-studies reader (or a
serious newcomer) can read straight through, and roll the standard across every page. Three calibrated rules
plus two riders, derived this session from the operator's inline research-notes on individual-guidance (IG).
The IG **abstract** is the deployed worked exemplar (commit `8b67ac9`); it awaits operator sign-off, after
which the rules get encoded in the skill docs and rolled through the IG body and the other four studies.

## 0. THE THREE RULES + TWO RIDERS (the heart of the campaign — read before anything)
Calibrated live with the operator against the IG abstract. The deployed IG abstract
(`src/ResearchView.jsx`, the four `abstractLead` paragraphs after the `{/* ABSTRACT */}` marker; commit
`8b67ac9`) is the GOLD-STANDARD TEXTURE — read it first to feel what "right" looks like.

1. **RHYTHM — ENCODED** (WRITING-STANDARD-READABILITY.md §3.4 + EDITOR-CHECKLIST.md; commit `026eeef`).
   Removing a connector (em-dash/semicolon/colon) without regrading it by FUNCTION dumps its load onto a comma
   (pile-up) or a full stop (staccato chop). Regrade by function: colon for a delivered payoff/list; semicolon
   for two related full clauses; paired commas/parentheses for a true aside; period only for a hard pivot;
   comma is the LAST resort. De-densify by re-basing into a cumulative (right-branching) sentence, not by
   fragmenting (Gibson dependency-locality: parse cost is center-embedding, not length). The super-comma. A
   run of 3+ short near-equal sentences is a staccato defect (not concision); the single short landing stays
   legal. Read-aloud is the two-way gate. Academic prose is NOT short copy.

2. **FIRST-CONTACT PRECISION — AGREED + EXEMPLIFIED, *NOT YET ENCODED* (TODO §5 item 2).**
   Rationale the operator anchored it on: AUDITABILITY. A named concept must be confirmable to its source,
   exactly like a citation; a vague English label ("the root", "the mind") cannot be audited. On first contact
   with a concept:
   (a) **Present before you refer.** Define a thing the first time; never lean on it as already shared.
       (The old "The move is real" failed this; the abstract now defines "the recurring move" first.)
   (b) **Name it to the Pāli** where the Pāli is the real referent. Catch VIRTUALLY EVERY Pāli word, including
       cover-words that hide a specific term: mind = *citta* (not *mano*/*viññāṇa*/*ceto* here), world =
       *loka*, feeling = *vedanā*, element = *dhātu*. The exemption is NARROW and context-judged (only the
       genuinely generic word, e.g. "a person" when it is not *puggala*-as-technical-type) — NOT a fixed
       stoplist. The dangerous word is the one that looks ordinary while covering a precise (often multi-) Pāli
       referent; pin it.
   (c) **Hand over the precise referent, not a synonym** — enumerate or give the function. root → *akusala-mūla*
       (greed, hate, delusion); faculties → *indriya* (faith, energy, mindfulness, concentration, wisdom);
       seven noble persons → *satta ariyapuggalā* (graded by leading faculty + depth of attainment).
   (d) **Plain concrete diction for the rest** — kill oblique/precious words ("register", "ripened").
   FORM (so precision does not re-chop the rhythm): the Pāli rides a SKIMMABLE parenthetical the fluent reader
   glides past; the conceptual handhold is WOVEN as a clause; carry multiple glosses on a colon/semicolon
   PARALLEL-CLAUSE SERIES, never as stacked parentheticals (4 parens in a row rebuilds the §3.4 pile-up).

3. **MEASURED REGISTER — AGREED + EXEMPLIFIED, *NOT YET ENCODED* (TODO §5 item 2).**
   Describe the systematizing tendency; do NOT indict it. The finding is an observable trend of hardening, not
   a fall from grace (the operator: "not the move from Christ to the Mormon church, not THAT alienated at all";
   wants "warm but mainly academic"). Drop the early-pure/late-fallen binary ("supple teaching" vs "closed
   systems"). Neutral verbs (systematizes, organizes, names, becomes, is resolved into), not loaded ones
   (fixes-into, freezes, turns-into). Keep the hedges (tendency not law); name counter-currents; "noted without
   reproach". Systematizing is what a living scholastic tradition does; the Visuddhimagga is a masterwork, not
   a degradation. (Sharpens the standard's existing §3.1 de-assert / "no forced thesis" rules.)

RIDER A — **TIMELINE PRECISION.** Same auditability logic applied to TIME: a reader must be able to place each
stratum. Give concrete, hedged anchors. The agreed IG facts: the *suttas* ascribed to the Buddha (~5th c.
BCE); the First Council of ~500 arahants at the *parinibbāna*; ~four centuries oral; written down ~1st c. BCE
in Sri Lanka; commentaries ~5th c. CE (Buddhaghosa); so ~1,000 years between the oldest stratum and the
commentary. Hedge ("roughly", "are said to") — exact dates are contested; the findings rest on relative order.

RIDER B — **QUESTION-SHARPENING.** Back-solve each study's real spine from the research; do not leave a vague
question that "misses a lot while saying little." For IG the spine is **function → essence**: a teaching given
as a present function/relation (which root is active now, how ripe a person is, where the world stands in
present experience) is recast as a STANDING PROPERTY (a fixed type, a named tier, a measured quantity) — and
the question is how far that one move reaches (single late break vs graded recurrence across strata; persons
AND cosmos).

## 2. File / artifact map (READ FIRST, in this order)
- **This doc.**
- **The exemplar:** `src/ResearchView.jsx`, the four `abstractLead` paragraphs of `IndividualGuidanceStudy`
  (function starts ~L1236; abstract just below the `{/* ABSTRACT */}` comment; commit `8b67ac9`). The
  five study components and their current line anchors (THEY SHIFT — re-grep, do not trust the numbers):
  `AwakeningStudy` ~L443 · `IndividualGuidanceStudy` ~L1236 · `HeartBaseStudy` ~L2663 ·
  `UttarakuruStudy` ~L3220 · `NagaStudy` ~L3824. Re-find with
  `grep -nE "^function (Awakening|IndividualGuidance|HeartBase|Uttarakuru|Naga)Study" src/ResearchView.jsx`.
- **The standard (where rules live / go):**
  - `.claude/skills/dhamma-research/WRITING-STANDARD-READABILITY.md` — §3.4 = RHYTHM (encoded). Rules 2 (first-
    contact precision) + 3 (measured register) get NEW sibling subsections here (§3.5, §3.6), plus riders.
  - `.claude/skills/dhamma-research/EDITOR-CHECKLIST.md` — the de-AI copy pass; rhythm tells added; add the
    precision + register tells/gates here too.
- `HACKING.md` "## Conventions" — the standing "research study pages are hand-maintained; the live page in
  `src/ResearchView.jsx` is canonical; the `FINDINGS*.md` papers are secondary/stale" convention.
- **Operator research-notes (the requirement source).** The operator annotates the LIVE page and the notes
  drive the work. READ PATH (Postgres, not the repo): proxy `flyctl proxy 15432:5432 --app dhamma-pg` must be
  up, then (sql.py self-extracts the DSN; force UTF-8 or Windows cp1252 chokes on Pāli):
  `PYTHONIOENCODING=utf-8 python research/naga/sql.py --json "SELECT items FROM user_collections WHERE kind='research-notes' AND user_id=(SELECT id FROM users WHERE lower(email)='isaac11cyr@gmail.com')"`
  Each note: `{collection, slug, heading, excerpt, text, status, createdAt}`; order by `createdAt` = the
  operator's top-to-bottom reading order. The 8 IG notes that seeded this campaign are all on the abstract
  (status `open`). Full detail: memory `research-notes-feature`.
- **Memory notes (recall):** `writing-rules-from-ig-notes` (the rhythm rule + the no-first-person/banned-
  phrases editorial rules; UPDATE it with rules 2+3 when encoded), `research-pages-are-canonical` (page is the
  deliverable; generator retired), `dhamma-concurrency-wedge` (serial-DB rule), `research-notes-feature`.
- Deploy: `flyctl deploy --app dhamma` (a few min; run in background). Build: `npm run build`.

## 3. Sub-chat ledger
NONE delegated yet — the whole campaign has been coordinator-direct (careful per-paragraph prose work the
operator reviews live). NOTE §7: all five studies live in ONE file (`src/ResearchView.jsx`), so per-study
worker chats are NOT file-disjoint and CANNOT run in parallel on the shared tree (last-write clobber). Either
one long-queue worker through the studies serially, or git-worktree-per-study + merge. Most of this work is
judgment-heavy and operator-reviewed, so serial/coordinator-direct has been the right call.

## 4. Verification commands + EXPECTED outputs
- `curl -s https://dhamma.fly.dev/api/dbcheck` → `passages: 194710, pgvector: true`.
- `curl -s -o /dev/null -w '%{http_code}' https://dhamma.fly.dev/` → `200`; `…/api/ready` → `200`
  (a `503` for ~60s right after a deploy is the BGE-M3 warm-up, re-poll); `…/api/research` → `401` (admin-gated).
- `npm run build` → `✓ built` (must be green before any deploy).
- Per touched study/region: em-dash check
  `start=$(grep -n "^function <X>Study" src/ResearchView.jsx|cut -d: -f1); sed -n "${start},+700p" src/ResearchView.jsx | grep -n "—"` → CLEAN (the only legit `—` is the literal char NAMED inside the em-dash rule, n/a in prose).
- Content-preservation on a prose edit: `git diff --word-diff=porcelain src/ResearchView.jsx` — removed tokens
  should be ONLY connective/stub words, never a `<Cite>`/`<em>`/content word; and the per-component `<Cite>`
  count must be unchanged (`grep -oc "<Cite"`).
- HEAD at handoff: `8b67ac9`. Working tree clean.

## 4b. INTERLEAVED: adversarial content review (2026-06-23, operator-commissioned)
A no-holds-barred peer review of all five studies landed before the writing rollout resumes. 22
agents + a coordinator DB-verification layer. Full report: **`research/ADVERSARIAL-REVIEW-2026-06-23.md`**
(harness: `research/_adv_db_check.py`; workflow `wf_fd14f07b-e12`). Headline: every central thesis
SURVIVES (the present/absent 0-canon negatives hold, DB-re-confirmed), but the quantitative apparatus
has two systemic defects — (T1) the "chronological stratum" axis is a `work_slug→stratum` lookup so
every early-vs-late gradient and "N disagreements" count is circular (verified: 0/24 naga works
multi-valued, 299/299 awakening disagree==not-early); (T2) the "85% commentarial" magnitude is a
row-granularity artifact (canon is 9% of rows but 44% by character) — per-character the commentary is
3.5–5.5× denser (direction holds, magnitude wrong). Grades: Awakening B, IG B, Heart-base B, Naga B,
Uttarakuru C (one CRITICAL: "6 of 26 mula early" double-counts 3 suttas). A P0/P1/P2 correction queue
is in the report. These corrections are CONTENT fixes (different territory from the writing-quality
rules below) but several overlap the same prose, so reconcile before the rollout edits land.

**APPLIED + DEPLOYED 2026-06-23 (commit `73a77e0`, live, smoke green: dbcheck 194710, ready 200,
frontend asset hash matches build).** The full P0/P1/P2 queue was applied across all five studies
(live page + datasets + build scripts) + the method docs, by an 11-agent fix workflow + a coordinator
gate. Per-study: awakening BV 17/9→15/7 (dataset regenerated after a verifier reverted it); IG H0/H1
reframed + vism 553 removed; heart-base "never verified" softened with the eye-base negative control +
counts-snapshot committed; uttarakuru 6/26 double-count fixed + subtitle canon→commentary + divine-eye
surfaced; naga lopsidedness→per-row rates + 32→39% + disagree 103→23. Method docs: PROVENANCE-SIGNATURE
I.1 stratum axis relabelled + SKILL rules 7-11 (forking-paths, per-char density, IAA-scope,
negative-control, span-aware). No em-dash added (7 baseline held); every `<Cite>` preserved (137→138).

**RESIDUALS for the writing-quality rollout (pre-existing, NOT review findings, out of this pass's
scope):** the page still renders a few standing writing-rule violations — `src/ResearchView.jsx` ~3245
(heart-base `v2.method_note`) carries "load-bearing"; `public/research/naga.json` data fields
(records[].claim ×34, spine ×3) carry em-dashes that render; and `research/{individual-guidance,naga}/
FINDINGS*.md` (secondary docs) still carry "load-bearing"/"cross-cutting". Fold these into the rollout.

## 5. Open queue (in order)
1. **[BLOCKED on operator] Lock the IG abstract texture.** Operator is reviewing the live abstract (commit
   `8b67ac9`). Pull any new research-notes (§2 read path) and apply their fixes. When they sign off, the
   abstract is the locked template.
2. **Encode rules 2 (first-contact precision) + 3 (measured register) + the two riders into the standard.**
   New sibling subsections in WRITING-STANDARD §3.5/§3.6 (parallel to §3.4) + EDITOR-CHECKLIST tells/gates,
   using the locked IG abstract as the worked before/after. ADVERSARIALLY VERIFY before committing (as §3.4
   was: a 3-lens skeptic for self-compliance / overcorrection / practical application). Then update memory
   `writing-rules-from-ig-notes`.
3. **Roll all three rules + riders through the IG BODY** (`IndividualGuidanceStudy` §§II–VIII narrative + the
   "Findings of general importance"). The body §§ are already long, well-built cumulative prose (rhythm mostly
   fine); the precision pass (gloss every load-bearing term, present-before-refer) and the register pass
   (de-indict) are the real work. NB the IG body ALREADY glosses many terms well (e.g. it lists the seven noble
   persons with Pāli) — bring the rest up to that, do not regress it.
4. **Roll through the other four studies**, one at a time: Awakening, HeartBase, Uttarakuru, Naga. Each: pull
   the study's research-notes if any, apply the three rules + riders, verify, deploy, smoke. (Recall their
   chop/pile-up residuals from the rhythm pass: IG had the chop; Awakening has comma pile-ups; HeartBase/
   Uttarakuru/Naga lighter.)
No pre-registered predictions outstanding.

## 6. Standing principles / decisions (non-negotiable; took arguing to reach)
- **The live page is the canonical deliverable.** No PDF goal; `FINDINGS*.md` are secondary/stale; edit the
  page in `src/ResearchView.jsx` directly. The MD→JSX single-source generator + drift-checker were RETIRED
  (commit `3193975`) — they no longer exist; never look for `gen-narrative.mjs`/`paper-sync-check.mjs`. All
  five studies are plain hand-maintained pages. (memory `research-pages-are-canonical`.)
- **The three writing rules are the spine** (§0). Precision is justified by AUDITABILITY, not by catering to a
  newcomer; even a scholar wants the Pāli pinned so the claim is confirmable. Register is measured, never an
  indictment. Rhythm regrades by function, never by default-comma or over-chop.
- **No em-dashes in the deliverable prose** (regrade by function); no first person; banned crutch words
  `load-bearing`/`cross-cutting`. (memory `writing-rules-from-ig-notes`.)
- **Serial DB only.** dhamma-pg wedges under concurrent load. The coordinator runs DB queries serially via the
  proxy + `research/naga/sql.py`; NEVER fan agents at the DB; agents reason over INLINED data only. (memory
  `dhamma-concurrency-wedge`.)
- **Commit per item; push to master (project pattern); deploy + smoke after any prose/render change.** Prose
  edits to the live page DO need deploy (unlike comment-only changes). Confirm citations resolve + content
  preserved (§4) before deploy.
- The operator reads on the LIVE site and leaves inline research-notes; that is the feedback loop. Pull notes,
  do not ask the operator to copy-paste.

## 7. Coordination / ownership
Single working tree on master. All five study components share ONE file (`src/ResearchView.jsx`) → the per-
study rollout is NOT parallelizable without git-worktrees-per-study + merge; default to ONE serial worker (or
coordinator-direct), which also suits the operator-review cadence. The standard docs
(`.claude/skills/dhamma-research/*`) are a second territory, disjoint from the study file — safe to edit in
parallel with a study pass if ever needed. Keep prose edits ADDITIVE on the study file (regrade/gloss, never
drop content or citations).

## 8. Per-pending-item: what to check when it lands
- **Abstract sign-off (item 1):** operator's new notes (if any) addressed; build green; em-dash-free; every
  `<Cite>` still resolves (the abstract has none, but the body does); deploy smoke green.
- **Rules encoded (item 2):** §3.5/§3.6 contain no em-dash / no banned phrase in their OWN prose; do not
  contradict §3.4 or §3.2 (the density rule); DRY (one canonical home per threshold); a skeptic pass run; the
  IG abstract used as the before/after; memory updated.
- **Body / per-study rollout (items 3–4):** for each section — every load-bearing Pāli term pinned with a
  precise referent; no concept referred-to-as-given before it is presented; timeline/figures placeable;
  register measured (no early-pure/late-fallen, neutral verbs, hedges intact); rhythm varied (no chop, no
  pile-up); `npm run build` green; em-dash-free in the touched region; every `<Cite>` curls 200 and the
  `<Cite>`/`<em>` counts are preserved (no content dropped); deploy smoke green; the operator's notes for that
  section addressed.
