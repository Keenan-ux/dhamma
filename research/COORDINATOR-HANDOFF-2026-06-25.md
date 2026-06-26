# Coordinator handoff — Dhamma research program (2026-06-25)

*Fresh handoff for a successor chat. Read this in full, run §4 verification, then pick up §5. Supersedes
`COORDINATOR-HANDOFF-2026-06-24.md` (kept for the deep-research context in its §9; this doc carries the
current queue). Internal doc; em-dashes allowed here, NOT in deliverable prose. Update IN PLACE (snapshot,
not append-log).*

## 1. Mission
Run the Dhamma corpus-research program to a publishable bar (the dhamma-research skill): each study is a
frozen pre-registration + an auditable full-enumeration dataset (every citation resolves to a real corpus
row) + a process-free, de-AI'd, peer-reviewed write-up rendered as an admin-gated page in the Research tab
at **https://dhamma.fly.dev/**. The deliverable is the LIVE page; `FINDINGS*.md` are secondary.

## 1b. Where things stand (one screen)
HEAD = `2900899` == `origin/master` (run `git log --oneline -12`). Working tree clean EXCEPT `sn2259.json`
(another live chat's empty placeholder for DR-3 anattā = SN 22.59; **leave it, do NOT `git clean`** — a
clean already deleted one chat's probe scripts). **There are NINE Research studies** (awakening,
individual-guidance, heart-base-and-insight, uttarakuru, naga, come-and-see, the-commentarial-register,
**sankhara**, **vitakka**) plus two public Explorations (wheel-turning-monarch, vegetarianism). Corpus =
194,710 passages.

**This session (2026-06-25) shipped the deep-research queue's first two BUILD items**, both live + pushed:
- **8th study — "Saṅkhāra and the Translator"** (`sankhara`, `SankharaStudy`, `a7911ee`). Translator-behaviour
  study: on identical text Sujato lexicalises *saṅkhāra* by collocation field (*choices*/*processes*/
  *conditions*), Thanissaro collapses to one word (*fabrications*). Blind k=5 sense IAA κ=0.69; P1-P3 PASS,
  P4 REPORTED (Horner 0/Bodhi 2). Deduped counts reproduce DR-4 exactly. Memory `sankhara-study`.
- **9th study — "The Apparatus of Absorption"** (`vitakka`, `VitakkaStudy`, `b99dc3d`). Apparatus-provenance
  study by chronological stratum, per-character (deduped): the jhāna manual apparatus (*upacāra*
  access-concentration, *appanā* absorption, the *abhiniropana* re-gloss of *vitakka*) is post-Nikāya with a
  single early anchor (the MN 117 definition string); the phenomenon it organises (*vinīvaraṇa*/*kallacitta*)
  is canon-denser (2.14×/1.91×). Blind k=3 sense IAA κ=1.0; P1-P5 PASS. Scope limit (DR-1 e): settles
  apparatus PROVENANCE, NOT what *vitakka* MEANS in the suttas. Memory `vitakka-study`.

## 2. File / artifact map + commands
- **Live pages (canonical deliverable):** `src/ResearchView.jsx` — ALL nine study components in ONE file
  (NOT parallelizable without git-worktrees; serial or coordinator-direct). `RESEARCH_ENTRIES[]` (registry)
  + the slug->component dispatch are near the top (~line 306).
- **Served datasets:** `public/research/*.json` (admin-gated). Each study's
  `research/<study>/build_dataset.py` regenerates its dataset from committed census JSON (local, no DB);
  naga's `build_windows.py` hits the DB.
- **Per-study artifacts** (the audit trail): `research/<study>/` holds `RESEARCH-DESIGN.md` (frozen prereg),
  `_enumerate.py` (committed query->result), `_raw.json`, `_iaa_sense.json` (blind IAA), `build_dataset.py`
  (consistency gate), `FINDINGS.md` (secondary readable), `HANDOFF.md` (internal log). New this session:
  `research/sankhara/`, `research/vitakka/`.
- **Method + writing standard:** `.claude/skills/dhamma-research/` — `SKILL.md`, `PROVENANCE-SIGNATURE.md`,
  `WRITING-STANDARD-READABILITY.md`, `EDITOR-CHECKLIST.md`, `COHERENCE-CHECKLIST.md`. (Disjoint second
  territory, safe to edit in parallel with a study.)
- **Deep-research:** `research/deep-research/` (sankhara.md, abhidhamma.md, README.md);
  `research/DEEP-RESEARCH-FOLLOWUPS-2026-06-25.md` (the actionable digest).
- **Memory:** `sankhara-study`, `vitakka-study`, `come-and-see-study`, `adversarial-review-2026-06-23`,
  `research-pages-are-canonical`, `dhamma-research-standard`, `jhana-vitakka-deep-research`,
  `dhamma-concurrency-wedge`, `writing-rules-from-ig-notes`.
- **Commands.** Build: `npm run build` (note the dist asset hash). Deploy: `flyctl deploy --app dhamma`
  (Docker runs the build). DB (SERIAL ONLY): `flyctl proxy 15432:5432 --app dhamma-pg` then a one-connection
  script importing `research/naga/sql.py` `_get_dsn()` (it self-extracts DATABASE_URL via flyctl ssh).
  Rebuild a dataset: `python research/<study>/build_dataset.py`.

## 3. Sub-chat ledger
This session was coordinator-direct + Workflows (no separate sub-chats spawned): per study, one blind-IAA
workflow (k=3-5 Explore agents, NO DB) + one editorial workflow (de-AI + 3 adversarial reviewers +
process-leak + coherence, parallel, NO DB). Parallel `/deep-research` chats from the prior session: DR-1
vitakka DONE (now built), DR-4 saṅkhāra DONE (now built), DR-5 Abhidhamma DONE; **DR-2 sati + DR-3 anattā
have NOT landed** (sn2259.json still 0 bytes; no `sati.md`/`anatta.md`). Standing duty: when they land, pull
their final reports into `research/deep-research/` as `sati.md`/`anatta.md` and fold follow-ups into §5.

## 4. Verification commands + EXPECTED outputs
- `curl -s https://dhamma.fly.dev/api/dbcheck` -> `passages: 194710, pgvector: true, postgres 16.14`.
- `…/api/ready` -> `200`; `…/api/research` -> `401` (admin-gated); served `…/research/<slug>.json` -> `401`
  (gate, expected); `…/explorations/<slug>.json` -> `200` (ungated).
- Live frontend asset hash == local `npm run build` hash confirms the deploy shipped the working tree
  (this session's last deploy = `index-Q4jWWwZD.js`; will change on the next build).
- `git status` clean except `sn2259.json`; HEAD `aaaf461` == `origin/master`.
- Nine study components: `grep -nE "^function (Awakening|IndividualGuidance|HeartBase|Uttarakuru|Naga|ComeAndSee|CommentarialRegister|Sankhara|Vitakka)Study" src/ResearchView.jsx` (line anchors SHIFT, re-grep).
- Spot-check a new study resolves: `curl -s -o /dev/null -w "%{http_code}" https://dhamma.fly.dev/api/passage/mn117` -> `200`.

## 5. Open queue (priority order) — from `DEEP-RESEARCH-FOLLOWUPS-2026-06-25.md` §"Open queue"
Items 1-3 DONE (sankhara, vitakka, Ronkin correction). Remaining:
3. ✅ **DONE 2026-06-25 (commit `2900899`, deployed).** sabhāva / Commentarial-Register Ronkin attribution
   corrected aṭṭhakathā -> ṭīkā. Verified against Ronkin's PRIMARY text by a 6-agent adversarial pass (EBM
   ch. 3 **p. 118**, not the p.112 the handoff guessed; thesis sentence p.111). Decisive line: Buddhaghosa's
   aṭṭhakathā has *sabhāva* as own-nature "which does not necessarily have an ontological significance",
   while "the Mahāṭīkā invests this equation with ontology" (staged gradient, not a binary; one incipient
   reading already in a 6th-c. aṭṭhakathā, Mahānāma). Landed in the live `commentarial-register.json` (v1.1,
   Ronkin paragraph in the sabhāva headline section) + the sabhāva prereg (`correction_2026-06-25`, frozen
   h1 left intact) + FINDINGS.md. The 6tīkā peak now reads as CONFIRMATION of Ronkin, not a null. Editorial
   gate (de-AI + coherence pass; scope-skeptic must-fixes applied). Full verification archived at
   `research/deep-research/ronkin-sabhava-localization.md`. **Next up: item 4.**
4. **[CORPUS-DOABLE NOW] ← NEXT.** PED "abhiññā narrowed to the fixed six nine-times-in-ten" per-stratum
   chaḷabhiññā/abhiññā census; Hamilton khandha×āyatana×dhātu cross-classification per-stratum census. Both
   directly testable on dhamma-pg (serial). Could each be a small dhamma-explore or a section.
5. **[FOLLOW-ON]** recompute the five HOUSE studies' per-character magnitudes DEDUPED (SKILL rule 8; the
   un-deduped 53.5M denominator inflated them ~1.3-2x; deduped denominators below). come-and-see's counter is
   only strengthened.
6. **[VERIFY]** Brahmāli on cetanā (his DO series / Authenticity of the EBT); Hamilton "most important/
   difficult khandha" superlative + loci; Bucknell (1993)/Shankman (2008) verbatim quotes (image-only scans).
7. ~~[REGEN] research/sankhara/probe.py~~ SUPERSEDED by `research/sankhara/_enumerate.py`.
8. **[STANDING]** When DR-2 sati / DR-3 anattā land: pull reports into `research/deep-research/`, fold
   follow-ups into this queue. (As of 2026-06-25: not landed; `sn2259.json` 0 bytes.)
**Operator-gated (do NOT fire autonomously):** outreach drafts (`OUTREACH-EMAIL-DRAFT.md`,
`BPS_EMAIL_DRAFT.md`, `SUTTACENTRAL_EMAIL_DRAFT.md` — operator sends); CPD dictionary ingest (unblocked,
an ingest task); AI-assisted translations (`TRANSLATIONS-AI.md`, go/no-go).

## 6. Standing principles (non-negotiable)
- **The LIVE page in `src/ResearchView.jsx` is the canonical deliverable** (memory
  `research-pages-are-canonical`); `FINDINGS*.md` secondary. Edit the page directly; counts are data-bound
  (render from the JSON, never hardcode a number the data could drift from).
- **Serial DB only.** dhamma-pg has no concurrency guard and wedges under fan-out (memory
  `dhamma-concurrency-wedge`). One connection; workflow/IAA/review agents NEVER touch the DB (pass rows
  inline; forbid Bash/flyctl/psycopg2 in agent prompts or use the Explore agent type).
- **Density = per-character, deduped** (SKILL rule 8). `is_primary` on BOTH numerator and denominator (the
  canon is double-ingested SC+CST). Deduped per-stratum char-mass (Mchar): 1early 13.10, 2late 3.85, 3abh
  7.58, 4para 1.21, 5comm 30.69, 6tika 28.36. NEVER a raw row-ratio headline. The un-deduped `mūla 53.5M`
  is retired.
- **Stratum is the chronological axis; `work_role` is NOT.** `work_role='mula'` lumps Vism + Vinaya + late
  Khuddaka + Abhidhamma; use `stratum(work_slug)` (1early/2late/3abh/4para/5comm/6tika/7other). Stratum is a
  frozen work->stratum lookup, a bucketing aid, never independent convergent evidence (T1, PROVENANCE-
  SIGNATURE I.1).
- **Sense-audit every count** ("a count whose sense you have not read is not yet a count"): tighten patterns
  for homographs (e.g. `appanā` excludes *saṅkappanā*/*vikappanā*; *upacāra* vicinity vs access-concentration),
  blind-code the load-bearing early cells for κ, scope every κ to its unit in the sentence that prints it.
- **Pre-register before the full enumeration** (disclose the seed if discovery already ran); freeze the
  decision rule + falsifiable predictions with pre-committed disconfirming counts; score every prediction
  verbatim (PASS/FAIL/REPORTED); a falsified leg is a logged deliverable, not a silent fix.
- **All four editorial passes before shipping OR re-shipping** (de-AI / adversarial peer review / process-leak
  scrub / coherence). No em-dashes, no first person, no `load-bearing`/`cross-cutting` in deliverable prose.
- Commit per item; push to master; deploy + smoke after any prose/render change; confirm citations resolve +
  per-component `<Cite>` count preserved before deploy.
- Do NOT fire irreversible outward actions (send email, public-repo flip, AI-synthesis go-live) autonomously;
  prepare to the gate and surface a one-line decision request. Operator reads on the LIVE site + leaves inline
  research-notes (admin-only); pull notes, don't ask them to paste.

## 7. Coordination / ownership
Single working tree on master. All nine study components share `src/ResearchView.jsx` -> per-study work is
SERIAL (or git-worktree-per-study + merge). Method docs (`.claude/skills/dhamma-research/*`) are a disjoint
second territory, safe to edit in parallel. Parallel deep-research chats share the tree -> never `git clean`.
Max safe parallel = number of file-disjoint territories, not number of tasks.

## 8. Per-pending-item: what to check when it lands
- **Item 3 (sabhāva/Ronkin): ✅ SATISFIED 2026-06-25.** The `commentarial-register` study's Ronkin sentence
  says ṭīkā (not aṭṭhakathā); the sabhāva prereg `correction_2026-06-25` matches; the change cites Ronkin
  EBM ch. 3 **p. 118** verbatim (p.112 was a secondary-source error; thesis sentence p.111); corpus `<Cite>`
  count preserved (MN2, MN102); redeployed + smoked; de-AI + coherence passes re-run.
- **Item 4 (censuses):** each count is per-stratum, per-character deduped, sense-audited; every cited id
  resolves; consistency gate green.
- **Item 5 (dedup recompute):** the five house studies' magnitudes use the deduped denominators above;
  directions unchanged, magnitudes shrink (house) or grow (come-and-see counter); each study's coherence pass
  re-run before redeploy.
- **Item 8 (sati/anattā):** reports pulled to `research/deep-research/`; follow-ups folded into §5;
  `sn2259.json` only removed if its owning chat is confirmed done (else leave it).
