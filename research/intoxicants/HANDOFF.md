# Intoxicants Study — Coordinator Handoff

**Study:** "Every instance the Buddha referred to drugs and alcohol" — a dual-track
campaign. Track A answers the scholarly question; Track B uses that real research
workload to stress-test dhamma.fly.dev and bank concrete tool improvements.

**Operator question (verbatim intent):**
1. Every instance the Buddha referred to drugs/alcohol; which he deemed immoral.
2. Not just the big ones — smaller things too (e.g. tea).
3. Was alcohol *ever* appropriate as medicine, in any quantity (tinctures)?
4. How did he deal with psychedelics? Was psilocybin around (cow-patty mushrooms)?
5. His take on Soma — and what *is* soma, best current scholarship?
6. Psychedelic "ego-death" vs anattā: if intoxicants are immoral, why can they
   trigger an experience of the characteristics of existence? Could that aid the path?

**Status:** ACTIVE. Recon done; multi-agent corpus+web pass running. This doc is the
living record — pain points and feature ideas accumulate here, verified findings land
in [FINDINGS.md](FINDINGS.md).

---

## How to drive the tool (verified API contract, 2026-06-13)

Base: `https://dhamma.fly.dev`. All GET unless noted.

| Endpoint | Notes |
|---|---|
| `/api/search?q=&mode=&scope=&pitaka=&layer=&limit=&translator=&tag=` | `mode` = `exact`\|`stem`\|`meaning`. `scope` (alias of `field`) = `all`\|`original`\|`translation`\|`title`\|`citation`\|`library`. `pitaka` = `sutta`\|`vinaya`\|`abhidhamma`. `layer` = `mula`\|`attha`\|`tika`\|`anya`\|`library`. `tag` = `type:value`. |
| `/api/passage/:id` | Full passage (original + translation + metadata). |
| `/api/passage/:id/commentary` | `{attha, tika}` — jump mūla → Aṭṭhakathā/Ṭīkā. |
| `/api/passage/:id/parallels` | SuttaCentral parallels. |
| `/api/passage/:id/group` | Sibling paragraph window (for fine CST rows). |
| `/api/lookup?term=&language=&source=` | Dictionaries. `language=san` → MW + BHS. |
| `/api/gloss` (POST `{words:[]}`) | Interlinear DPD glosses. |

**Mode/scope heuristics learned in recon:**
- **Concept queries** (English idea, no Pāli term in hand): `mode=meaning&scope=translation`.
  Best precision observed. e.g. `intoxicants drinking alcohol` → SN 56.64 at #1.
- **Known Pāli term / rule lookup**: `mode=exact&scope=original` (optionally `pitaka=vinaya`).
- **Stem mode on a Pāli term**: risky — see homograph collision below.

---

## PAIN POINTS (accumulating)

### P1 — `surā` (liquor) is swamped by `sura`/`asura` (deva / anti-god) homographs. **HIGH**
`mode=stem&scope=all` for `surā` returns late poetic NRF works about gods (Jinavaṃsadīpaṃ,
Samantakūṭavaṇṇanā…), zero about alcohol in the top hits. Diacritic-folding (`surā`→`sura`)
plus prefix-stem (`sur:*`) make this worse: `surā` (liquor), `sura` (deva), `asura`
(titan), `surabhi` (fragrant) all collapse together. A scholar typing the obvious Pāli
word for "liquor" gets a wall of false friends.
→ See feature F1 (intoxicant alias cluster), F2 (homograph/sense disambiguation).

### P2 — No intoxicant vocabulary in the alias table at all. **HIGH**
`server/sql/seed-aliases.sql` has 40+ doctrinal clusters (sati, mettā, anattā…) but
nothing for `surā`/`meraya`/`majja`/`pamāda` or English `alcohol`/`intoxicant`/`drunk`.
So Stem/Meaning expansion does nothing for this entire semantic field; the precept's
own vocabulary isn't cross-linked. The Meaning lane still finds SN 56.64 by raw vector
similarity, but Stem mode and the embedding-query expansion get no help.
→ F1.

### P3 — Cold-start latency on first Meaning query (~101 s). **MEDIUM (known)**
First `mode=meaning` after a wake loads BGE-M3 ONNX (~101 s); later queries 0.5–2 s.
Documented behavior, but for a researcher doing a Meaning-first workflow it reads as a
hang. Worth a visible "warming model…" affordance. (Tracked in CLAUDE.md already.)

### P4 — Name-collision for proper nouns (anticipated: "Soma"). **MEDIUM**
`soma` is the moon, a nun (Somā Therī), a king, and a class of deva, before it is ever
the Vedic drink. Like P1 but for entities, not common nouns. Will confirm in C5.
Note: a Pāli `/api/lookup?term=soma` returns **no entry** — soma-as-substance is not even
a Pāli headword (it is Vedic/Sanskrit; MW has it under `?language=san`). Useful negative.

### P5 — `/api/compare-stats` (Concordance) latency on common terms. **HIGH**
Measured 2026-06-13: `surā` = **74.7 s**, `majja` = **82.4 s** (`meraya` = 3.3 s). The
Concordance tab is effectively unusable for any common/ambiguous term — a 75 s wait reads
as a crash. Likely a full prefix-stem scan with no early bound.

### P7 — Concurrent load crashes the single instance, and it CANNOT self-recover. **CRITICAL**
The 16-agent pass drove the shared-cpu-2x/4GB box into 500–1500 s Meaning queries, then
HTTP 502/503/000 for ~25 min. It did **not** recover on its own; it was still hard-down ~2 h
later (`dbcheck` HTTP 000 at 200 s while the static SPA served in 0.3 s). Root-caused this
session against the code + Fly logs + machine events:
- The crash leaves a **stale Postgres lock / idle-in-transaction** in `dhamma-pg`.
- App boot does `await applySchema()` **and** `await aliasesReady()` *before* `serve()` binds
  the port ([index.js:577-591](server/src/index.js:577)). So schema-apply blocks **indefinitely**
  on the stale lock (Postgres lock waits never time out) → the port never binds → Fly logs
  `instance refused connection … 0.0.0.0:8080` for 10+ min → the proxy **cordons** the machine.
- Machine event log confirms it was **not** an OOM (`oom_killed=false`); it is a startup-hang.
- **Manual fix that worked:** restart `dhamma-pg` (clears the lock) → the app's hung
  `applySchema()` errors out, boot proceeds, port binds. Restarting only the app does NOT fix it
  (the lock is in pg). Recovery confirmed: `dbcheck` → `passages:194710` after the pg restart.
→ F5 (bind-port-first + lock_timeout), F6 (concurrency guard / readiness probe). Highest priority.

### P6 — Concordance counts are contaminated by prefix-fold over-matching. **HIGH**
The same query battery quantifies P1: `surā` reports 2,195 occurrences / 926 passages but the
#1 passage is an Abhidhamma *vīthicitta* commentary (about consciousness, not liquor); `majja`
reports **18,796 occurrences / 9,344 passages** with the #1 hit about *loko* (the world) —
because the stem `majj:*` folds into `majjhima`/`majjhe` ("middle"). So the "every instance"
count a scholar would trust is off by more than an order of magnitude for these terms. By
contrast `meraya` (no homograph, rare) returns 675 occ / 283 passages and surfaces **VB 14
Sikkhāpadavibhaṅga** (the precept, verbatim) at #1. **Operational lesson: `meraya` is the
reliable search anchor for the precept; `surā`/`majja` are traps.**

*(more land below as agents report)*

---

## FEATURE BACKLOG (accumulating, prioritized at finalize)

- **F1 — Intoxicant alias cluster.** Add rows to `seed-aliases.sql`:
  `surā` ↔ `meraya` ↔ `majja` ↔ `pamāda` ↔ {alcohol, liquor, beer, wine, intoxicant,
  drunk, drink}. Lets Stem/Meaning expand the whole field. (Addresses P2.)
- **F2 — Sense-disambiguation / homograph guard.** A curated "false-friend" demotion
  (like the existing `DIACRITIC_BOOST` for `anattā` vs `āṇatti`) for `surā`-liquor vs
  `sura`-deva, or a per-sense tag. (Addresses P1, P4, P6.)
- **F3 — Concordance: word-boundary stems + an early bound.** Compare-stats should (a)
  match at a token boundary (`\msurā`) not a folded prefix, killing the `majja`→`majjhima`
  contamination, and (b) cap/stream the scan so a common term returns in <5 s. (Addresses
  P5, P6.) Cheapest correctness win after F1.
- **F4 — "Best anchor term" hint.** When a query term has a known high-frequency homograph,
  surface a one-line nudge ("`meraya` gives cleaner results than `surā` for the precept").
  Curated, low-effort, high-trust. (Addresses P1/P6 at the UX layer.)
- **F5 — Bind the port BEFORE the DB-dependent boot work; add `lock_timeout`/`statement_timeout`.
  CRITICAL. ✅ DONE + DEPLOYED (commit `7bc426a`).** Move `applySchema()`/`aliasesReady()` off the
  pre-`serve()` path (bind first, run them in the background; have `/api/search` await
  `aliasesReady()` lazily as `/api/lookup` already does at [index.js:536](server/src/index.js:536)).
  Set `lock_timeout`/`statement_timeout` on the boot connection so a stale lock fails fast instead
  of hanging forever. This single change turns the unrecoverable wedge (P7) into a self-healing
  boot. (Addresses P7.)
  - **Residual FIXED + DEPLOYED 2026-06-14 (commits `6bf9e60` + `92caa12`):** backgrounding these
    boot steps exposed that the **first** `dhamma-pg.internal:5432` connection at boot intermittently
    `write CONNECT_TIMEOUT`s (observed on *every* restart during verify, even pg-warm — the
    `.internal` 6PN first-connect is just flaky), so on those boots schema silently didn't apply
    (auth tables had to be created by hand) and the alias cache stayed empty (Stem/Meaning expansion
    silently no-op'd). Fixed with `withDbRetry()` (5×, 1s→2s→4s→8s backoff, transient-conn-errors
    only) around each schema/seed statement + the alias load, and aliases.js no longer memoizes a
    rejected ready-promise (so a later `/api/search` retries instead of inheriting a dead cache). A
    2nd commit quiets the ~300 benign `already exists, skipping` NOTICEs per boot that were bursting
    Fly's log shipper and dropping the `[db] schema applied` line. Verified clean on a forced boot.
- **F6 — Concurrency guard + true readiness probe.** A semaphore serializing embed/Meaning work
  (separate from FTS/passage routes) so a burst can't OOM the box; and a `/api/ready` that runs a
  trivial FTS + vector probe (distinct from the liveness `/api/dbcheck`, which returned 200 while
  every real route hung — a false-healthy signal). (Addresses P3, P7.)
- **F7 — Vinaya-rule commentary bridge + shared-rule (bhikkhu↔bhikkhunī) link.** Make
  `/api/passage/:id/commentary` resolve `pli-tv-bu-vb-pcNN` to its Samantapāsādikā
  `…sikkhāpadavaṇṇanā` rows (they exist; only title-search reaches them today). Surface the
  bhikkhunī parallel via the parallels map, NOT naive number reuse (`pli-tv-bi-vb-pc51` is the
  WRONG rule; the real bridge is parallels → Bhikkhunī Parivāra Pc 132). (Vinaya-core gap.)
- **F8 — Degemination in the fold contract + "did you mean Stem?" fallback.** `majjapamadatthana`
  (single-p) and `ahicchattaka` exact/original both return ZERO while the terms are well-attested
  (`majjappamādaṭṭhāna`; 30 stem hits) — a silent false "not in corpus." Collapse doubled
  consonants in the fold, and when exact=0 but stem>0, surface the stem count. (Correctness bug.)
- **F9 — Translator-gloss → Pāli-lemma in snippets + explicit negative-result banner.** Show
  "royal soma drinking [Pāli: vājapeyya]" so a scholar sees the gloss-vs-lemma fact; and when
  exact=0 AND meaning total=0, state "no corpus occurrence" (distinct from a timed-out blank) so
  absence is citable. The two headline findings here are a translator artifact and two negatives.
- **F10 — Prefer SuttaCentral mula ids over coarse CST volume rows for AN/SN.** `an3.39` resolves
  to a clean per-sutta row; the CST `cst-…mul-an3_1_4` volume row served a different sutta than the
  matched snippet (citation-precision break). Either dedupe to the SC row or subdivide AN/SN CST
  mula as the commentaries already were.

---

## VERIFICATION LEDGER
Independent re-fetch of every load-bearing citation (does the passage actually say what
the finder claims?). Populated by the verify stage. Doubles as a tool-precision metric:
how often does retrieval surface a false positive.

Note: the C3 all-`not_found` row was an ARTIFACT of the live-DB outage during the run, NOT bad
retrievals — re-verified by hand at the source after recovery (all confirmed verbatim).

| Facet | Claimed | Supported | Partial | NotFound (outage) |
|---|---|---|---|---|
| C1 precept | 8 | 7 | 0 | 0 |
| C2 vinaya | 6 | 6 | 0 | 0 |
| C3 medicine | 5 | 5 (hand-reverified) | 0 | (5 outage → now ✓) |
| C4 breadth | 3 | 3 | 0 | 0 |
| C5 soma | 7 | 5 | 2 | 0 |
| C6 psychedelics | 6 | 6 | 0 | 0 |
| C7 anattā | 5 | 3 | 2 (outage) | 0 |

**Hand re-verification after recovery (2026-06-14, all at the source, sub-second):**
- C3 `cst-vin02m2.mul-vin3_6` — ✓ `telapāke majjaṃ pakkhipitunti`; `majjassa na vaṇṇo na gandho
  na raso paññāyati`; `na … atipakkhittamajjaṃ telaṃ pātabbaṃ` → `abbhañjana`; `loṇasovīraka`;
  `yathāsukhaṃ guḷaṃ`; five medicines `sappi navanītaṃ telaṃ madhuṃ phāṇitaṃ`. **The medicinal-
  alcohol "tincture" ruling is in the ROOT TEXT, verbatim.**
- C3 `cst-s0105t.nrf-75_p005` — ✓ `Surāpānamevāti majjalakkhaṇappattāya surāya pānameva.
  Merayampettha saṅgahitaṃ` / `Sovīrakanti kañjikaṃ`.
- C4 `an3.39` — ✓ `Tayome … madā … Yobbanamado, ārogyamado, jīvitamado` (Sukhumālasutta).
- Q5 soma — MW `soma … juice of the śoma plant`; DPD `somo: soma plant; soma extract; soma
  sacrifice` AND `moon; moon deity`; two women Somā. Corrects the agent's "no Pāli headword."
- Q2 tea — `exact/translation "tea"` → **total=0** (clean negative).
- Bhikkhunī rule — `bu-vb-pc51/parallels` → **Bhikkhunī Parivāra Pc 132** (shared rule) + lzh-dg.
- DN 31 commentary jump — works (Sv-a §1, 20 s).
- betel `tambula` exact/original — TIMED OUT 150 s (exact-FTS-original latency); left unconfirmed.

---

## RESILIENCE INCIDENT LOG (2026-06-14)
- ~16 concurrent agents → instance wedged (502/503/000 ~25 min); did NOT self-recover (~2 h down).
- Diagnosed: stale pg lock → `applySchema()` hang → port never binds (see P7).
- Recovery: `flyctl machine restart dhamma-pg` (clear lock) → app bound; `passages:194710`.
- **Re-verification battery then ran SERIALLY with zero failures (sub-second).** The fault is
  concurrency/back-pressure (P7), not the data or the queries. Serial scholarly use is fine.

---

## OPEN QUEUE / NEXT STEPS
- [x] Multi-agent corpus+web pass (7 corpus facets find→verify, 2 web, 1 critic).
- [x] Recover the crashed instance; re-verify C3 + close cheap gaps at the source.
- [x] Reconcile findings into [FINDINGS.md](FINDINGS.md) with verified citations.
- [ ] **Land F5 (bind-port-first + lock_timeout) as the first follow-up PR** — converts the
      unrecoverable wedge into a self-healing boot; small, highest impact, no schema/data risk.
- [ ] Land F1 (intoxicant alias cluster) — cheapest scholarly-recall win. Then F6 (concurrency
      guard) so a normal query burst can't reproduce P7.
- [ ] Decide on F7 (Vinaya commentary bridge) — the Vinaya-core jump that silently fails today.
- [ ] (Optional) re-run betel/`tambula` once exact-FTS-original latency is addressed.
