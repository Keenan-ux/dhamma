# Coordinator handoff — Dhamma research program (2026-06-26)

*Fresh handoff for a successor chat. Read this in full, run §4 verification, then pick up §2 (the active
thread) and §5 (the rest of the queue). Supersedes `COORDINATOR-HANDOFF-2026-06-25.md` for the queue; that
doc + its §9 and the per-study FINDINGS files remain the detail record. Internal doc; em-dashes allowed here,
NOT in deliverable prose. Update IN PLACE (snapshot, not append-log).*

## 1. Mission
Run the Dhamma corpus-research program to a publishable bar (the dhamma-research skill): each study is a
frozen pre-registration + an auditable full-enumeration dataset (every citation resolves to a real corpus
row) + a de-AI'd, peer-reviewed write-up. Most studies render as admin-gated pages in the Research tab at
**https://dhamma.fly.dev/**. The deliverable is the LIVE page; `FINDINGS*.md` are secondary.

## 1b. Where things stand (one screen)
HEAD == `origin/master` (run `git log --oneline -15`; this session added the commits in §8). Working tree
clean EXCEPT `sn2259.json` (another chat's empty DR-3 anattā placeholder; **leave it, do NOT `git clean`**).
**Nine deployed Research studies** + two public Explorations, corpus 194,710 passages. This session
(2026-06-25/26) cleared the entire correction/hardening backlog (items 3, 5, 6 + a pipeline-hardening pass)
and both item-4 empirical cores, then opened a NEW major thread — the **intoxicants/psychedelics study** —
which is now the active build and the successor's main job (§2).

## 2. THE ACTIVE THREAD — the intoxicants/psychedelics study (successor's main job)
**What it is.** `research/intoxicants/` holds a finished-but-undeployed study in two versions: `FINDINGS.md`
(v1, "The Buddha on Drugs and Alcohol" — broad: moral register, medicine, **psychedelics, soma, ego-death vs
anattā**) and `FINDINGS-v2.md` (v2, "The Intoxicant Cluster Under the Provenance Signature" — the rigorous
retrofit proving *majja* is an EFFECT-BASED category, not a substance list; recall ladder, chronology,
seven-recension check). Memory `intoxicants-study`.

**OPERATOR DECISIONS (2026-06-26, binding):**
1. **It becomes a GATED admin-only Research study.** The earlier worry ("interpretive/normative content
   breaks the descriptive-only rule, so it can't be a Research study") was WRONG: the admin-gate IS the
   safeguard. The "descriptive only, never doctrinal verdicts" rule is a PUBLIC-facing rule; a gated,
   private study can be as interpretive/interdisciplinary as the evidence demands. **Not public-facing for a
   long time, if ever.** So build it as a gated ResearchView page like the others, but explicitly interpretive
   and deeper.
2. **Combine v1 + v2 into ONE study, depth UNLIMITED — go deeper than any study thus far.**

**The intellectual spine (the original contribution).** The study's own rigorous v2 finding (*majja* is
effect-based, keyed to *pamāda*/heedlessness, not substance-based) is the weapon: you cannot classify a
substance as *majja* by naming it, only by what it DOES. Applied honestly with the actual evidence, the
effect-test yields a **dose- and context-sensitive answer that the substance-lumping hides**, and the
alcohol-style heedlessness-cascade that grounds the precept does NOT transfer to classic psychedelics. Plus
the operator's **circularity point** (load-bearing, corpus-confirmable): the fifth precept is INSTRUMENTAL
(it guards the other four by guarding against the heedlessness that breaks them; the canon grounds it
consequentially — the six drawbacks of `dn31`, *paññāya dubbalikaraṇī*, *pamāda*). An instrumental precept
is contingent on the effect obtaining; condemning a substance "as an intoxicant" when the consequential
harms do not obtain IS circular.

**What is DONE for the study:**
- **§6 path-distinction REBUILT, corpus-grounded** (replaces v1's flawed "transient state vs trait" argument,
  which fails because the magga is itself a single momentary *magga-citta*). The right axis is the MODE of
  abandonment: *vikkhambhana* (suppression, reversible) vs *samuccheda* (cutting-off, irreversible). Per-stratum
  deduped census (serial DB, this session): *vikkhambhana* **0 early** / 250 5comm / 363 6tika; *samuccheda* 4
  early / 280 / 283; *tadaṅga* 5 early / 181 / 187 — the three-fold *pahāna* taxonomy is COMMENTARIAL on
  canonical seeds (a clean instance of the study's through-line). Canonical irreversibility anchors (the
  assertion IS correct): *avinipāta* (sotāpanna "cannot fall") **70 early**; *niyata*+*sambodhiparāyana* 29
  early; *anusaya*+*samugghāta* ("extirpate the latent tendency") 11 early. Magga's object: *nibbānārammaṇa*
  0 early / 90 / 116 (commentarial). NET corrected argument: a drug-state at best SUPPRESSES (*vikkhambhana*,
  returns); magga, though momentary, CUTS (*samuccheda*, irreversible) — the difference is not duration but
  whether anything is cut; and even a genuine drug-insight is a glimpse, not the path.
- **SCIENCE deep-research DONE + persisted** at `research/intoxicants/_psychedelics_evidence.json` (176K; 6
  gather angles + 4 adversarial verdicts, all **mixed-contested** = balanced, not advocacy). Load-bearing
  findings: (1) ego-dissolution is a constructed/reversible self-model alteration (acute reverses in hours),
  and **Letheby (Philosophy of Psychedelics, 2021) argues it is GENUINE *anattā*-congruent insight, not
  delusion** — so v1's "merely resembles" must be dropped; the *samuccheda* point survives (seeing is not
  cutting). (2) Faculty: NO global clouding at low dose (the alcohol/*majja* analogy fails there) BUT acute
  high dose impairs (processing speed g=1.13 — the effect-test DOES bite full-dose recreational use); the
  "sharpens acuity" claims are mostly placebo (Pinhas et al. 2026 meta, N=1614, d=-0.06 — do NOT lean on the
  U-Maryland acuity result). (3) Durability contested: acute reverses, neuroplasticity persists ~1 month
  (Siegel/Dosenbach Nature 2024), the openness-trait claim weakly supported; even durable effects are
  trait-shift/neuroplasticity, NOT *samuccheda* fetter-cutting. (4) Psychedelics vs alcohol: radically
  different on dependence + disinhibition-violence (robust; Nutt 2010) so the cascade does not transfer, BUT
  own risks (suicidality SAEs in COMPASS, HPPD) so "less harmful" not "harmless." Anthropology: ritual
  entheogen use is antithetical to *pamāda*. Stoned-ape: scientifically unfounded — cite as the fringe line.

**What is NEXT for the study (the build):**
- (a) **CORPUS — instrumental-precept analysis. DONE 2026-06-26 (commit `7b8a6c0`, pushed).** Pre-registered
  P1-P5 (`research/intoxicants/PREREG-instrumental.md`, frozen+scored), enumeration-design fleet (no DB) +
  critic, serial count-lock-gated run (`_run_instrumental{,2}.py` -> `_instrumental_evidence.json`; ledger +
  sense-reads in `INSTRUMENTAL.md`). **All five PASS.** Sharp finding: the canon's OWN taxonomy puts the
  fifth precept in a different register from the other four — the others are *kammakilesā/dasakammapatha/
  soceyya* (intrinsic defiled action / the purity scheme), drink is *pamādaṭṭhāna/apāyamukha* (an occasion of
  heedlessness / a drain on wealth). It is structurally instrumental in the canon itself. The explicit
  "intoxication therefore breaks the other four -> all akusala" is the COMMENTARY (cst-s0505a.att-31) drawing
  the architecture out of a canonical verse-seed (*madā hi pāpāni karonti*, snp2.14). P5: 0 canon rows
  predicate impurity OF the drink; contrast classes present (Āmagandhasutta taint=conduct; soceyya scheme
  excludes drink; telapāka + *majje* effect-gating). This is the textual anchor for the circularity argument.
  NEW homograph trap logged (surā->asura mid-word). Diacritic/niggahita conventions locked (see INSTRUMENTAL.md).
- (b) **COMBINE v1 + v2** into one document: the rigorous *majja* effect-category core (v2) + the
  applications re-grounded (the *pamāda* register, the three *madā*, the *telapāka* medicine effect-test) +
  the rebuilt §6.
- (c) **Rebuild §4 (psychedelics) and §5 (soma) to the evidence bar** (depth unlimited). Integrate the
  science honestly (both sides; revise v1's two over-assertions: faculty-degradation, "merely resembles").
- (d) **The synthesis**: the dose/context-sensitive verdict; the effect-test applied; the instrumental
  analysis; the path-distinction; everything labeled descriptive / scientific / interpretive.
- (e) **Build the gated Research page** (a ResearchView component + JSON + RESEARCH_ENTRIES registration)
  when content is ready. Deeper/longer than the descriptive 9; explicitly interpretive.

**Standing discipline for THIS study (it is interpretive, gated, not public — so the descriptive-only rule
relaxes, but rigor does not):** corpus claims stay rigorous (count-lock gate, deduped per-character density
per `DEDUPED-DENOMINATORS.json`, every citation resolves, homograph masks per `HOMOGRAPHS.json` — *majja*,
*surā*, *sato* etc. are all traps); the science stays BALANCED (let the evidence correct our claims, do not
become psychedelic-advocacy — the deep-research came back mixed-contested for a reason); flag descriptive vs
scientific vs interpretive throughout; the four editorial passes still apply to the prose.

## 3. File / artifact map
- **The active study:** `research/intoxicants/` — `FINDINGS.md` (v1), `FINDINGS-v2.md` (v2), `build_dataset.py`
  (data-bound, consistency+em-dash gated), `_census_v2.json`, `_psychedelics_evidence.json` (the science base).
- **Live pages:** `src/ResearchView.jsx` — all nine study components in ONE file (serial or git-worktree per
  study); `RESEARCH_ENTRIES[]` + the slug->component dispatch near the top (~line 306).
- **Served datasets:** `public/research/*.json` (admin-gated). Each study's `research/<study>/build_dataset.py`
  regenerates from committed census.
- **Pipeline hardening (this session, commit `4e3adcf`):** `research/DEDUPED-DENOMINATORS.json` (single source
  of truth for density), `research/HOMOGRAPHS.json` (false-friend registry), `research/fetch_evidence.py`
  (count + live density + full-text sample in one serial pass), the COUNT-LOCK GATE in
  `.claude/skills/dhamma-research/SKILL.md`.
- **Item-4 empirical cores (this session):** `research/abhinna-six/` (4a, chaḷabhiññā), `research/khandha-crossclass/`
  (4b, Bodhi cross-classification). Write-ups pending.
- **Deep-research archive:** `research/deep-research/` (sankhara, abhidhamma, README, ronkin-sabhava-localization,
  item6-source-verifications).
- **Method:** `.claude/skills/dhamma-research/` (SKILL.md, PROVENANCE-SIGNATURE.md, WRITING-STANDARD-READABILITY.md,
  EDITOR-CHECKLIST.md, COHERENCE-CHECKLIST.md).
- **Commands.** Build: `npm run build` (note dist asset hash). Deploy: `flyctl deploy --app dhamma`. DB (SERIAL
  ONLY): `flyctl proxy 15432:5432 --app dhamma-pg`, then `research/naga/sql.py` (self-extracts DATABASE_URL) or
  `research/fetch_evidence.py`. ALWAYS set `PYTHONIOENCODING=utf-8` for any script that prints Pāli.

## 4. Verification commands + EXPECTED outputs
- `curl -s https://dhamma.fly.dev/api/dbcheck` -> `passages: 194710, pgvector: true, postgres 16.14`.
- `…/api/ready` -> `200` (first hit after deploy may 503 on cold-start; re-hit); `…/api/research` -> `401`;
  served `…/research/<slug>.json` -> `401`; `…/explorations/<slug>.json` -> `200`.
- Nine study components: `grep -nE "^function (Awakening|IndividualGuidance|HeartBase|Uttarakuru|Naga|ComeAndSee|CommentarialRegister|Sankhara|Vitakka)Study" src/ResearchView.jsx` (line anchors shift).
- Deduped denominators (re-confirm if the corpus changes): canon 25.738, aṭṭhakathā 30.691, ṭīkā 28.358,
  commentary 59.049 Mchar; per-stratum 1early 13.096 / 2late 3.852 / 3abh 7.577 / 4para 1.213.

## 5. Open queue (besides §2)
- **Item 4 write-ups.** Both empirical cores done + sense-audited (`research/abhinna-six/`,
  `research/khandha-crossclass/`). Turn into public Explorations or sections. 4a: chaḷabhiññā is
  late-canonical (Apadāna-formulaic), not a commentarial narrowing. 4b: khandha×āyatana×dhātu peaks in the
  Abhidhamma (Bodhi, not Hamilton — see item-6 archive), with mn115 Bahudhātuka the canonical seed.
- **Item 8 (standing).** DR-2 sati / DR-3 anattā deep-research have NOT landed (`sn2259.json` 0 bytes). When
  they do, pull into `research/deep-research/` as `sati.md`/`anatta.md`, fold follow-ups here. Relaunchable.
- **DEFERRED — operator-gated, do NOT fire autonomously / touch live infra without operator eyes:** (B) wire
  the already-ingested DPD inflections into Stem-mode `/api/search` (biggest recall win; touches live search);
  (C) serial-DB connection-queue fix (touches live server); Bodhi/Horner + cross-tradition ingests (heavy
  live-DB writes); outreach emails; AI-synthesis go-live; public-repo flip. The 35-item hindrance register is
  in the §8 commit `wtbao5wkm` transcript / summarized in the 2026-06-25 handoff's pipeline section.

## 6. Standing principles (non-negotiable)
- **The LIVE page is the canonical deliverable** (memory `research-pages-are-canonical`); counts data-bound,
  never hardcode a number the data could drift from.
- **Serial DB only.** dhamma-pg wedges under fan-out (memory `dhamma-concurrency-wedge`). One connection;
  workflow/IAA/review agents NEVER touch the DB (use the Explore agent type / pass rows inline).
- **Density = per-character, deduped** (`DEDUPED-DENOMINATORS.json`; is_primary on BOTH numerator and
  denominator). The house studies' pre-2026-06-26 numerators were NOT deduped — recompute both sides with the
  study's OWN pattern (item 5 lesson).
- **COUNT-LOCK GATE:** read a sample of matched rows + apply the homograph mask + sense-code with κ BEFORE a
  count enters a paper (`fetch_evidence.py` makes the sense-read a re-read from file). This caught the Apadāna
  formula (4a) and the mn115 seed (4b) this session.
- **Stratum is the chronological axis; `work_role` is NOT** (T1 circularity; use `stratum(work_slug)`).
- **Pre-register before the full enumeration; score every prediction; a falsified leg is a logged deliverable.**
- **All four editorial passes before shipping OR re-shipping** (de-AI / adversarial review / process-leak /
  coherence). No em-dashes, no first person, no `load-bearing`/`cross-cutting` in deliverable prose.
- Commit per item; push to master; deploy + smoke after any render change. Do NOT fire irreversible outward
  actions autonomously.

## 7. Coordination / ownership
Single working tree on master. All study components share `src/ResearchView.jsx` -> per-study work is SERIAL
(or git-worktree-per-study). Method docs are a disjoint second territory. Parallel deep-research/other chats
share the tree -> never `git clean`. The serial DB is the coordinator's alone; agents never touch it.

## 8. This session's landed work (2026-06-25/26)
All committed + pushed; items 3 and 5 also deployed + smoked. Commits (newest first): the §2 §6-rebuild +
science deep-research (in-progress, not yet a commit — content lives in `research/intoxicants/`); `1a53f5e`
+ `52be0f8` item-4 empirical cores (abhiññā, khandha); `4271406` item-5 deduped recompute (3 house studies,
deployed); `4e3adcf` pipeline hardening; `3a5e239` item-6 verifications archived; `c1093f6` + `2900899` item-3
Ronkin correction (deployed). Plus handoff/doc commits. Two deploys this session, both smoked green (assets
`index-Q4jWWwZD.js` then `index-DHMKrI-e.js`).
