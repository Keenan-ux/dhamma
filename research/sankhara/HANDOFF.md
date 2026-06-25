# Saṅkhāra translator-divergence — internal methods / handoff log

*The "how the sausage was made" record. Orchestration, tool friction, query log, IAA tables. NOT the paper
(the paper is the `SankharaStudy` live page + `FINDINGS.md`, both process-free). Internal doc; em-dashes ok.*

## Provenance / disclosed seed
- Built 2026-06-25 as queue item 1 of `COORDINATOR-HANDOFF-2026-06-24.md` §9 (the deep-research follow-up
  queue). Disclosed seed: DR-4 `research/deep-research/sankhara.md` + the local `_explore.py`/`_explore2.py`
  exploration (the only data seen before the prereg freeze). The prereg froze the decision rule, not
  data-blindness (Hard rule 1).
- This study FLIPS the 2026-06-25 expansion campaign's "saṅkhāra NOT ESTABLISHED" verdict: the campaign's
  one-shot SQL never computed the translator×field matrix; the careful per-row probe shows a sharp,
  enumerable finding.

## Pipeline (all serial on the DB; agents never touched the DB)
1. `_explore.py` / `_explore2.py` — structural confirmation (footprint by role, coverage, maxim renderings,
   exemplar head-to-head). Reproduced DR-4's shape. Single serial conn via `naga/sql.py` `_get_dsn()`.
2. `RESEARCH-DESIGN.md` — frozen prereg (committed `558a07d` before the full enumeration).
3. `_enumerate.py` — full serial enumeration -> `_raw.json`. Targeted per-field rendering extractors
   (maxim line; DO "ignorance -> X"; 4th-aggregate slot; bodily/verbal/mental triad). Read-only.
4. `sankhara-sense-iaa` workflow (k=5 blind coders, agentType Explore, NO DB) -> `_iaa_sense.json`.
   Fleiss κ = 0.6873 on 14 distinct renderings.
5. `build_dataset.py` — coding layer (Vism excluded from canon cell; SN 22.43 non-extractable; IAA
   sense-map; P1-P4 scored; consistency gate) -> `public/research/sankhara.json`.
6. `SankharaStudy` component + registry + dispatch in `src/ResearchView.jsx` (8th study).
7. `sankhara-editorial` workflow (de-AI + 3 adversarial reviewers + process-leak + coherence, parallel,
   Explore agents, NO DB).

## Cross-validation against DR-4 (the deleted probe.py regenerated)
My deduped own-text counts reproduce DR-4 exactly: Sujato 513 / choices 317; Thanissaro 155 / fabrications
142; Walshe 18 / formations 14; Ñāṇamoli ~240 / formations 93. Hard rule 4 (reconfirm load-bearing numbers
by SQL) satisfied.

## Key coding decisions (per RESEARCH-DESIGN, applied in build_dataset.py)
- Maxim cell is CANON-only: `pli-vism` (Visuddhimagga, shelved as `mula`) excluded as commentary.
- SN 22.43: maxim verse present in Pāli, but Sujato + Walshe render the surrounding per-aggregate prose
  ("all form"/"all bodies"); no isolable single-word maxim rendering -> status `non-extractable`, excluded
  from the clean count (affects both translators equally; a property of the sutta, not a translator choice).
- `is_primary` dedup throughout (SC + CST double-ingest).
- Primary measure (objective): lexeme-by-field variation. Secondary (interpretive, IAA-gated): does the
  switch track active/passive. Headline rests only on the objective measure.

## Predictions (verbatim, all PASS)
P1 Sujato disambiguates (maxim "conditions" ≠ default "choices"; 0 "choices"-at-maxim, threshold 2).
P2 Thanissaro collapses ("fabrications" everywhere; 0 distinct-passive maxim rows, threshold 1).
P3 opposite poles (Sujato 3 distinct field words, Thanissaro 1).
P4 coverage limit (Horner 0 own-text rows, Bodhi 2) — reported as measured, not as a hypothesis.

## Tool friction / notes
- `naga/sql.py` `_get_dsn()` self-extract works; ~5s flyctl ssh per fresh process. Proxy must be
  `flyctl proxy 15432:5432` (the :5432 is required).
- Env vars don't persist across the harness's Bash calls, so each script self-extracts the DSN (the
  one-connection-script pattern, as the skill prescribes).
- API `/api/passage/:id` UTF-8: a naive shell pipe surrogate-escapes the Pāli diacritics; read via a file
  + `open(..., encoding='utf-8')` to check the stem. All maxim/exemplar ids resolve HTTP 200 and carry the
  saṅkhāra stem.

## Open follow-ons (folded into the coordinator queue)
- [DATA] ingest Bodhi's + Horner's full SN/MN to add the documented context-splitter (Horner) + fixed-word
  advocate (Bodhi) to the panel. Coverage is the binding limit; the Sujato/Thanissaro headline does not
  need it.
- [REGEN] `research/sankhara/probe.py`/`probe2.py` were the DR-4 scripts (deleted by a git clean);
  `_enumerate.py` here supersedes them (method preserved in `sankhara.md`).
