# Nāga Study — Internal Methods / Handoff Log

**Study:** What the Pāli canon holds a *nāga* to **be** (ontology + soteriology), canon vs commentary.
Frozen design: [RESEARCH-DESIGN.md](RESEARCH-DESIGN.md). Operator seed: `../PREREG_naga_seed.md`.
This log carries orchestration, tool friction, the raw query log, and IAA tables. **It never bleeds into
the paper** (the paper is the separate, process-free `FINDINGS.md`).

## Status / phase tracker

- [x] **Phase 0 — infra + design-time recon.** SQL proxy verified; `sql.py` runner; disambiguation gate
      measured (H_lex supported); spine anchors resolve.
- [x] **Phase 1 — freeze pre-registration** (`RESEARCH-DESIGN.md`, 2026-06-19, snapshot 194,710).
- [x] **Phase 2 — structural enumeration + candidate frame.** Windows + prepass built; **spine
      close-read + verified** → `SPINE-FINDINGS.md` (the §A/§B claim taxonomy + the H0/H1 cells).
- [x] **Phase 3 — coding + IAA.** Canon ambiguous (619) coded; **Fleiss κ = 0.853** on a 124-row
      triple-coded subsample (8-way), 0.874 serpent-vs-not, 84% unanimous. Commentary residual (1,923)
      single-coded against the validated codebook. Strong-serpent rows facet-coded. Saturation sweep run.
- [x] **Phase 4 — dataset (`public/research/naga.json`, 1,267 serpent rows) + `NagaStudy` renderer**
      (compiles; rendered + verified in preview: 8 sections, 3 tables, clickable cites, evidence toggles).
- [x] **Phase 5 — paper (`FINDINGS.md`) + editorial passes** (de-AI: 0 em-dashes; process-leak scrub: clean).
- [x] **Phase 6 — adversarial peer review (3 personas) + coherence pass.** All must-fix issues addressed
      (see PEER REVIEW LOG below). Numbers reconcile across dataset/paper/renderer; production build clean.
- [ ] **Commit + deploy** — held for explicit operator go-ahead (outward-facing; admin-gated Research tab).

## SATURATION (Phase 3, run 2026-06-19)
- Snake-synonym lane (mula): āsīvisa 75, ahi 47, sappa 1003, uraga 52, bhujaga 5 — overwhelmingly literal.
  **Measured recall floor: ≤6 canon rows** carry nāga-being markers (phaṇa/bhavana/nāgarāja) under a
  snake-synonym with no nāga-token.
- DPPN named-king reconciliation PASSED: Mucalinda 84, Bhūridatta 81, Erakapatta 68, Saṅkhapāla 44,
  Nandopananda 42, Apalāla 33, Campeyya 18 — all resolve in the census.

## PEER REVIEW LOG (3 personas, 2026-06-19) + responses
- **Pāli philologist** (minor rev): live-checked spine Pāli — holds. Fixes applied: (1) flagged *na+āgu* as
  the traditional/folk etymology; (2) corrected sigla in the paper (Spk/Ps = aṭṭhakathā, not the `-a`=ṭīkā
  form); (3) stated the actual frame op (broad `nāg` − NOISE); (4) noted *samann(u)-āgata* seam; (5) fixed
  the attha off-by-one.
- **Buddhist-studies scholar** (minor rev): fixes applied: (1) added DN 32 (nāga as one of the four guardian
  armies) + DN 20 (great assembly) and corrected the garuḷa-predation attribution to canonical (SN 31/DN 20);
  (2) 70%→59% noise reconciled (design-gate vs census frame both stated); (3) aggregates recomputed from
  final records; (4) added the canonical reversion clause to the pli-tv-kd1 evidence; (5) disclosed
  spine-only quote-verification; (6) distinguished Bloss/DeCaroli's cultic axis from this study's
  classificatory axis (contribution = a second axis, not a relocation).
- **Methodological skeptic** (major rev): fixes applied: (MF-1) IAA reworded — 124-row subsample triple-
  coded, rest single-coded; (MF-2) off-by-one fixed, aggregates data-bound; (MF-3) H0/H1 reframed as a
  close-reading of 11 load-bearing spine cells (not a census-wide tally), the distributional facet×layer
  result carries the quantitative weight; (MF-4) saturation actually run + measured (above), language
  downgraded to "high-recall census with a measured floor"; (MF-5) verification disclosure added. Per-cell
  "no warrant **located**" hedge applied.

## RESULTS so far (load-bearing)

**Canon (mula) referent ledger** — 935 rows with a genuine nāga token, k=3 coded (κ=0.853):
person 311 · elephant 214 · **serpent 159** · nonlexical 92 · epithet 91 · tree 40 · citizen 17 · amb 11.
→ serpent = 17% of genuine-token rows, **7% of the 2,282 raw substring rows**. H_lex confirmed: the canon
nāga search is dominated by *persons* (Nāgasena) and *elephants*. (`canon_serpent_candidates.json`, 106.)

**Spine + H0/H1** — see `SPINE-FINDINGS.md`. Thesis: *"faithful on the bare facts (4 yoni, animal-status,
the named ceiling *aviruḷhidhamma*, the ordination bar), innovative in apparatus (Abhidhammic
akusala-vipāka paṭisandhi; realm/diet detail; 2→5 reversion occasions; tiracchāna→amanussa incl. Sakka;
the abhabba-for-jhāna/vipassanā/magga-phala rationale)."*

**Coding artifacts** (research/naga/data/): `code_chunk_{0..4}.json` (inputs), `coded_chunk_{0..4}.json`
(codings), `coded_iaa_{B,C}.json` (IAA), `canon_serpent_candidates.json`. Codebook: `CODEBOOK-referent.md`.
Aggregator + κ: `aggregate.py`.

## NEXT STEPS
Study is COMPLETE (see phase tracker + PEER REVIEW LOG above). Only remaining action, **held for operator
go-ahead**: `git` commit (branch first; on master) and `flyctl deploy` the app so the admin-gated Research
tab serves the new study. Rebuild pipeline if data changes: `aggregate_all.py → build_dataset.py →
build_final.py`; the renderer + paper are data-bound to `public/research/naga.json`.

## Infrastructure (how to drive the corpus)

- Proxy: `flyctl proxy 15432:5432 --app dhamma-pg` (was already up on 127.0.0.1:15432).
- DB password (POSTGRES_PASSWORD on always-on `dhamma-pg`): pulled via
  `flyctl ssh console --app dhamma-pg -C "printenv POSTGRES_PASSWORD"`.
- Connection: `DATABASE_URL="postgres://dhamma:<PASS>@localhost:15432/dhamma"`; psycopg2 in
  `scripts/ingest/.venv/Scripts/python.exe`; `PYTHONIOENCODING=utf-8`.
- Runner: `research/naga/sql.py "<SQL>"` (TSV) or `--json`. Direct pg, NOT the app search lane.
- **Schema fact:** `work_role` ∈ {mula 17,996 · attha 91,843 · tika 81,841 · anya 3,030} = the
  canon/commentary layer axis exactly. All rows `canon='Pali'`. Key cols: id, work_slug, citation,
  title, original, translation, work_role.

## Tooling (this study's scripts, research/naga/)

- `sql.py` — SQL runner through the proxy.
- `build_windows.py` — streams the broad `~* 'nāg'` frame, drops morphological false friends
  (NOISE = `nāg(at|ām|acch|aman|āra)|nāggh`), windows ±180 chars around each genuine token →
  `data/windows.json`.
- `referent_prepass.py` — deterministic token→referent triage → `data/prepass.json`.

## The disambiguation gate (H_lex — load-bearing first finding)

`nāga` is a heteronym; the bare substring is mostly NOT a serpent.
- Substring `nāga` rows: mula 2,282 · attha 4,655 · tika 2,828 · anya 409 (10,174).
- Canon noise: only 851/2,282 mula rows have a word-initial `\mnāg-`; **1,599 (70%) are pure
  morphology** (`samannāgata` "endowed-with" 5,114 token-hits; `anāgata` "future"; `anāgāmī`
  "non-returner"; all `*-āgata/āgāmin*`).
- The genuine `\mnāg-` set is itself ≥5 referents (persons Nāgasena/Nāgita dominate the canon).

## Candidate funnel (frozen data in research/naga/data/)

`build_windows.py`: scanned 12,283 substring rows. Initial frame → 4,149 rows; **after the NOISE rule was
tightened** (adding the `ant|āra|h` families: an-āghāta, an-āgantā, bandhanāgāra) the frame is **3,909
candidate rows** (mula 935 · attha 2,027 · tika 672 · anya 275), 5,836 windows. The triage table below is
the pre-tightening snapshot (strong-serpent / person / elephant counts are stable); the FINAL referent
ledger is the RESULTS block above (1,267 serpent, etc.). One spine row (`cst-s0303a.att-sn3_8_p004`) was
hand-recovered beyond the auto-frame → 1,267 serpent / 3,910 genuine-token rows.

`referent_prepass.py` triage (pre-tightening snapshot):

| prov_referent | mula | attha | tika | anya | total |
|---|---|---|---|---|---|
| serpent (strong) | 64 | 441 | 60 | 34 | 599 |
| person | 285 | 72 | 33 | 5 | 395 |
| citizen | 7 | 204 | 29 | 27 | 267 |
| elephant | 44 | 114 | 54 | 11 | 223 |
| tree | 16 | 40 | 8 | 7 | 71 |
| ambiguous (bare noun, mahānāga) | 511 | 1294 | 536 | 169 | 2510 |
| mixed | 31 | 21 | 4 | 28 | 84 |

## Spine loci (resolve to live rows; the structural enumeration core)

- SN 29 Nāgasaṃyutta — `sn29.1`…`sn29.50` (clean SC ids) + CST `cst-s0303m.mul-sn3_8`; comm
  `cst-s0303a.att-sn3_8_p002` (Spk-a); four-yoni comm `cst-s0201a.att-mn1_2_p136` (Catuyonivaṇṇanā).
- Vinaya ordination (tiracchāna / manussosi) — `pli-tv-kd1` / `cst-vin02m2.mul-vin3_1` (Mahākhandhaka);
  comm `cst-vin02a2.att-36_p002` (Tiracchānagatavatthukathā) + ṭīkā `cst-vin06t.nrf-335_p002`,
  `cst-vin12t.nrf-275_p002`.
- Mucalinda — `cst-s0503m.mul-kn3_2` (Udāna Mucalindavagga; SC `ud2.1`).
- Nāga-king Jātakas — Bhūridatta, Campeyya, Saṅkhapāla (comm `cst-s0512a.att-24_p002`
  Saṅkhapālacariyāvaṇṇanā); `campeyyanāg` 18 rows.

## Raw query log (Phase 0–2) — `term/pattern · endpoint · result`

1. `/api/dbcheck` → 194,710 passages, pg 16.14, pgvector true. (2026-06-19 freeze snapshot)
2. SQL `information_schema` → passages columns (18); `work_role` distribution (above).
3. SQL `original ~* 'nāga'` GROUP BY work_role → 2,282/4,655/2,828/409.
4. SQL word-initial `\mnāg` token freq, mula → `data/mula_naag_tokens.json` (323 forms; samannāgata
   5,114 etc.).
5. SQL mula substring vs word-initial vs noise → 2,282 / 851 / 1,599.
6. SQL `\mnāg` candidate rows by layer → 851/1,671/407/237.
7. SQL anchor resolution (nāgayoni loci, cst-s0303m.mul-sn3_8, Mucalinda) → all resolve (above).
8. SQL `mahānāg` not `\mnāg` → 33/74/26/10; compound-final audit → found `anāgāmī` (non-returner),
   `hatthināga`, `campeyyanāga` (missed by word-initial frame → switched to broad-frame extractor).
9. `build_windows.py` (broad `~* 'nāg'` − NOISE) → 4,149 rows / 6,120 windows.
10. `referent_prepass.py` → triage table above.

(Per-term exhaustive search log for §6 saturation accumulates below as Phase 2 continues.)

## Decisions / rationale

- **Coding off frozen local files, never the live API.** All candidate text is extracted once by SQL to
  `data/`; coders read those. Protects against the intoxicants-P7 concurrency wedge (fan-out crashes the
  4 GB box) and makes coding reproducible.
- **Recall-first frame + referent gate for precision.** SQL can't cleanly separate `nāga` from `āgata`
  inflections (lookahead defeated by `nāgatā` ≠ `nāgata`); so the frame is deliberately over-inclusive
  and the pre-registered referent gate (token rules + agent coding) does precision.
- **Prefer SC ids over coarse CST volume rows** (e.g. `sn29.1`, not `cst-s0303m.mul-sn3_8`) — citation
  precision (intoxicants B6/F10).
