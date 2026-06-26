# Coordinator handoff — Dhamma research program (2026-06-24)

> **SUPERSEDED 2026-06-25 by `COORDINATOR-HANDOFF-2026-06-25.md`** — read that for current state and the
> open queue (items 1-2 shipped: sankhara, vitakka). This doc is retained for its §9 deep-research chat
> ledger + the two recovery prompts, which the new doc references rather than duplicates.

*Fresh handoff for a successor chat. Read this in full, run §4 verification, then pick up §5. This
supersedes the campaign-specific docs it points to. Internal doc; em-dashes allowed here, NOT in the
deliverable prose. Update IN PLACE (snapshot, not append-log).*

## 1. Where things stand (one screen)
Live at **https://dhamma.fly.dev/** (admin-gated Research tab). HEAD = latest on `origin/master`
(run `git log --oneline -20`; this handoff is the newest commit). Working tree clean EXCEPT `sn2259.json`
(another live chat's empty placeholder — leave it, do NOT `git clean`). Origin in sync. **There are now NINE Research studies** (awakening, individual-guidance,
heart-base-and-insight, uttarakuru, naga, come-and-see, the-commentarial-register, **sankhara**, **vitakka**) plus two public
Explorations. The 2026-06-23 adversarial review + corrections shipped earlier; the 2026-06-25 EXPANSION
CAMPAIGN (below) added the 7th study + two program-wide method corrections.

**Latest (2026-06-25, successor coordinator):** the 8th study, **"Saṅkhāra and the Translator"**
(slug `sankhara`, `SankharaStudy`), shipped + deployed (`a7911ee`, live asset `index-Bqmyuy6O.js`). It is
§9 queue item 1 (the saṅkhāra translator-divergence study) built to the dhamma-research bar: prereg frozen
(`558a07d`), full serial enumeration, blind k=5 sense IAA (Fleiss κ=0.69), all four editorial passes, P1-P3
PASS / P4 REPORTED. Deduped counts reproduce DR-4 exactly (Sujato 513/choices 317; Thanissaro
155/fabrications 142). Memory `sankhara-study`. Queue item 1 is now DONE; its only open follow-on is the
[DATA] Bodhi+Horner full SN/MN ingest (Horner currently 0 own-text saṅkhāra rows).

Also shipped this session: the 9th study, **"The Apparatus of Absorption"** (slug `vitakka`,
`VitakkaStudy`, `b99dc3d`) = §9 queue **item 2**. By chronological stratum, per-character (deduped): the
jhāna meditation-manual apparatus (upacāra access-concentration, appanā absorption, the abhiniropana
re-gloss of vitakka) is post-Nikāya, with a single early anchor (the MN 117 definition string); the
phenomenon it organises (vinīvaraṇa/kallacitta) is canon-denser. Blind k=3 sense IAA κ=1.0; P1-P5 PASS.
Scope limit (DR-1 e): settles apparatus PROVENANCE, not what vitakka MEANS in the suttas. Memory
`vitakka-study`. Queue item 2 DONE.

## 1b. Expansion campaign (2026-06-25) — read `EXPANSION-SLATE-2026-06-24.md` + `EXPANSION-BUILD-STATUS.md`
A 72-agent sweep produced a ranked slate of corpus-tractable open problems; 9 were probed end-to-end
(protocols -> serial enumeration -> blind multi-coder + adversarial analysis). Honest outcome (medium
ceiling, as predicted): the elaborate GRADIENT hypotheses nulled, but the campaign yielded **one shipped
flagship study** and **two methodological corrections** that improve the whole program:
- **Shipped: "The Commentarial Register"** (slug `commentarial-register`, served json + new data-driven
  `CommentarialRegisterStudy`/`SpecTable` renderer in ResearchView.jsx). Deduped per-character density of
  nine doctrinal terms: HOUSE sabhāva ~55x (strongest in the program), paramattha/mātikā/iddhi/pāṭihāriya;
  COUNTER the sabbe-dhammā-anattā maxim (canon-denser) + predicative dominance ~60:1; abhiññā near-even;
  sati null; theravāda disclosed as an edition artifact.
- **Correction 1 (PROGRAM-WIDE):** the canon is double-ingested (SC+CST); the prior `mūla 53.5M`
  denominator is un-deduped and inflates HOUSE ratios ~1.3-2x (sabhāva 98x->55x). Fix = is_primary on the
  canon side. Strengthens come-and-see's counter (dedup raises canon density). **Follow-on: recompute the
  five house studies' magnitudes deduped.** Corrected table `EXPANSION-CORRECTED-DENSITY-2026-06-25.json`.
- **Correction 2:** the co-occurrence-ratio GRADIENT method is unsound (the definitional register lifts
  every term -> every negative control moves). Use gross per-character density, not gradients.
- Parked: formulaic-budget (all-pairs embedding wedges the DB; needs an offline chunked pipeline);
  foreign-text ingest (the high-tier unlock, GPU). New pipeline tooling: `generic_enumerate.py`,
  `materialize_analysis.py`, `_corrected_density.py`, per-study `_protocol.json`/`_raw.json`/`_analysis.json`.

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
- Nine study components: `grep -nE "^function (Awakening|IndividualGuidance|HeartBase|Uttarakuru|Naga|ComeAndSee|CommentarialRegister|Sankhara|Vitakka)Study" src/ResearchView.jsx` (line anchors SHIFT, re-grep).
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

## 9. Deep-research chats + the open follow-up queue (2026-06-25)
Five parallel `/deep-research` chats ran during the expansion campaign (separate sessions, SHARED working
tree — do NOT `git clean` the tree, it deleted one chat's probe scripts). Index + full reports:
`research/deep-research/README.md`. Synthesis + every follow-up: `research/DEEP-RESEARCH-FOLLOWUPS-2026-06-25.md`.

**Chat ledger:** DR-1 vitakka DONE (memory `jhana-vitakka-deep-research.md`); DR-4 saṅkhāra DONE
(`research/deep-research/sankhara.md`) and now BUILT into the `sankhara` study (item 1); DR-5 Abhidhamma DONE
(`research/deep-research/abhidhamma.md`); DR-3 anattā likely RUNNING (empty `sn2259.json` placeholder); DR-2
sati UNKNOWN (check that chat). **As of 2026-06-25 (successor coordinator):** `sn2259.json` is still 0 bytes
and no `sati.md` / `anatta.md` have landed in `research/deep-research/`; standing duty (item 8) is still a
no-op, the placeholder is left untouched.

**Open queue (priority order), all from the deep-research + expansion findings:**
1. ~~[BUILD] saṅkhāra translator-divergence study~~ **DONE 2026-06-25** (`a7911ee`, deployed, 8th study
   `sankhara`; memory `sankhara-study`). Built to bar: prereg frozen, serial enumeration, blind k=5 IAA
   κ=0.69, all 4 editorial passes, P1-P3 PASS / P4 REPORTED; deduped counts reproduce DR-4 exactly. **Open
   follow-on (now the next [DATA] item):** ingest Bodhi's + Horner's full SN/MN to add the documented
   context-splitter (Horner, currently 0 own-text saṅkhāra rows) + fixed-word advocate (Bodhi, 2) to the
   panel. The Sujato/Thanissaro headline does NOT need it (already saturated); it broadens the typology.
2. ~~[BUILD] vitakka apparatus-provenance study~~ **DONE 2026-06-25** (`b99dc3d`, deployed, 9th study
   `vitakka`; memory `vitakka-study`). By chronological stratum, per-character (deduped), sense-audited
   (blind k=3 κ=1.0): the apparatus (upacāra/appanā/abhiniropana) is post-Nikāya with a single MN 117
   anchor; phenomenon (vinīvaraṇa/kallacitta) canon-denser; P1-P5 PASS. Scope limit (DR-1 e) honoured:
   settles apparatus PROVENANCE, not vitakka's intra-sutta meaning. No open follow-on (a future
   collocation study could pin the samādhi-sense by co-occurrence, but the early access-sense is already 0).
3. [CORRECT] sabhāva prereg + the shipped "Commentarial Register" Ronkin attribution: aṭṭhakathā → ṭīkā
   (DR-5 + our own ṭīkā-peak data agree). Pull Ronkin *Early Buddhist Metaphysics* p.112 to confirm wording.
4. [CORPUS-DOABLE NOW] PED "abhiññā narrowed to the six nine-times-in-ten" per-stratum census; Hamilton
   khandha×āyatana×dhātu cross-classification per-stratum census (both directly testable on dhamma-pg).
5. [FOLLOW-ON] recompute the five HOUSE studies' per-character magnitudes deduped (SKILL rule 8 fix; the
   un-deduped 53.5M inflated them ~1.3-2x). come-and-see's counter is only strengthened.
6. [VERIFY] Brahmāli on cetanā; Hamilton superlative + loci; Bucknell/Shankman scan quotes.
7. ~~[REGEN] research/sankhara/probe.py + probe2.py~~ **SUPERSEDED 2026-06-25** by
   `research/sankhara/_enumerate.py` (committed query->result; the full enumeration the study is built on,
   reproducing DR-4's numbers exactly). No need to regenerate the old probe scripts.
8. When DR-2 (sati) / DR-3 (anattā) land: pull their final reports into `research/deep-research/` as
   `sati.md` / `anatta.md`; fold their follow-ups into the queue.

**Standing additions (do not regress):** is_primary canon dedup is MANDATORY for per-character density
(SKILL rule 8, retired the un-deduped 53.5M); the gradient/co-occurrence-ratio method is withdrawn (the
definitional register lifts every term -> controls move) — use gross per-character density only. Parked:
formulaic-budget (DB-wedging all-pairs embedding) + foreign-text ingest (the high-tier comparative unlock).
