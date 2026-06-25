# Expansion build status — 2026-06-24

*Live state of the 10-study expansion build (slate: `EXPANSION-SLATE-2026-06-24.md`). Update IN PLACE.
Internal doc; em-dashes allowed.*

## Architecture (the pipeline each study runs)
1. **Protocol** (workflow `dhamma-study-protocols`) -> `research/<slug>/_protocol.json` (frozen hypotheses, lexica with diacritic-correct regex, exact enumeration SQL, controls, falsifiers).
2. **Discovery** -> `research/EXPANSION-DISCOVERY-2026-06-24.json` (headline-stem density across layers; grounds the preregs).
3. **Enumeration** (`research/generic_enumerate.py <slug>`, serial DB) -> `research/<slug>/_raw.json` (each query's label/sql/rows or ERROR).
4. **Analysis** (workflow `dhamma-study-analysis`): per study = analyst (reads protocol+raw vs H1/H0) + 3 blind coders + 2 adversarial skeptics (artifact-lens, over-read/prior-work-lens) + writer (FINDINGS prose + structured page_spec). DB-free (reads committed files).
5. **Materialize** (post-analysis): compute Cohen/Fleiss κ from the 3 coders; write `research/<slug>/FINDINGS.md` + `_analysis.json`.
6. **Page** (TBD): render to the live admin Research tab. Decision pending: a generic spec-driven `<StudyRenderer>` (page_spec is structured) vs bespoke components like the existing six. Deferred behind research-complete.

## Per-study status
| # | slug | protocol | raw (ok/err) | analysis | findings | page |
|---|---|---|---|---|---|---|
| 1 | vitakka-abhiniropana-gloss-shift | done | 9/1 | wave-2 | - | - |
| 2 | sati-translator-drift | done | 10/1 | wave-1 | - | - |
| 3 | sankhara-translator-sense-import | done | 8/1 | wave-1 | - | - |
| 4 | anatta-predicative-vs-existential-census | done | 11/0 | wave-1 | - | - |
| 5 | matika-readback | done | 15/1 | wave-1 | - | - |
| 6 | sabhava-realist-drift-seam | done | 12/1 | wave-1 | - | - |
| 7 | supernatural-density-abhinna-list-dating | done | 12/2 | wave-2 | - | - |
| 9 | parallels-graph-trio | done | 12/0 | wave-2 | - | - |
| 10 | theravada-self-label-vada-frame | done | 7/3 | wave-2 | - | - |
| 8 | formulaic-budget-pericope-reuse-map | done | 1/10 PARKED | - | - | - |

## Deferred / parked
- **#8 formulaic-budget** — all-pairs embedding clustering SQL wedged dhamma-pg (server-closed-connection). Needs an offline chunked pgvector clustering pipeline (build a temp table, batch ANN), not one-shot SQL. Compute-heavy; parked per the defer-compute directive.
- **Foreign-text ingest** (capability that lifts the parallels lane to "high") — parked on priority list; GPU/embedding work.
- **Live-page rendering** — deferred behind research-complete; generic renderer candidate.

## Discovery highlights (pre-validating theses)
- sabhāva 98x commentary-denser, tīkā 4018 >> aṭṭha 1660 (Ronkin realist drift, intensifies into sub-commentary).
- anattā: maxim canon-denser (1.31), existential-denial rare (0.10, 6 mūla) — Wynne's predicative-dominant leg.
- mātikā/paramattha ~8-12x commentary-denser.
- theravāda-stem canon-denser (2.75) — vāda-frame question has material.

## Wave-1 results (verdicts, 2026-06-24)
The adversarial pipeline (analyst + 3 blind coders + 2 skeptics + writer, control-must-not-move rule) returned mostly nulls/partials, empirically confirming the medium ceiling.
- **sati**: NULL. κ Fleiss 0.90. The bhikkhu negative control moves the same old/new direction as the supposed sati drift -> the variation is translator idiolect, not sati-specific. Clean methodological null.
- **anattā**: NULL (H0) on the gradient (both controls moved), but the CANON PREMISE survives and is a real first measurement: predicative not-self outweighs existential denial ~47-60x in the early canon (Collins's asserted "high proportion", now counted). κ 0.38 (coding hard).
- **sabhāva**: MIXED, leaning null. The packaged definitional tetrad (lakkhana-rasa-paccupatthana) is structurally commentarial (absent in canon) survives; the per-char realist crystallization H1 fails its control; sense audit κ = -0.08 (blind coding cannot split sabhāva senses from snippets -> the polysemy defeats it, %carita% lesson).
- **mātikā**: MIXED (null-leaning). Read-back control moved more than the signal; Prong B (matched-pair) untested / halved denominator.
- **saṅkhāra**: NOT ESTABLISHED. Skeptic KILL: the translator x field confusion-matrix endpoint was never computed by the one-shot SQL; only descriptive density + a clean leak audit stand. Needs a corrected enumeration.

Causes of the nulls: (a) genuine (sati, anattā-gradient: controls move); (b) under-powered from incomplete one-shot agent SQL (saṅkhāra endpoint, sabhāva sense-audit, mātikā Prong B). The (b) set is rescuable with corrected enumeration + careful execution to the come-and-see standard.

## Wave-2 results (verdicts, 2026-06-25)
- **vitakka**: NULL (confirmed artifact). Within-vitakka app/disc ratio non-monotonic (mula 0.213, attha 0.510, tika 0.441); pīti control moves harder (mula→attha jump 0.509 vs vitakka 0.297). κ 0.85. SURVIVOR: the defining-frame coding (κ 0.85) shows abhiniropana-as-definitional-head is commentarial, not canonical.
- **abhiñña (supernatural)**: NULL. Sense-coding κ = -0.14 (blind narrow/wide abhiñña split unreliable from snippets).
- **parallels-graph-trio**: H0 (null). Structural; no coding. Skeptics caveat.
- **theravāda**: INCOMPLETE (session-limit hit: coder3 + both skeptics + writer failed; resets 12:50am NY). 2-coder κ 0.86. Re-run when cap resets.

## The meta-finding (the campaign's real result)
Nearly every gradient/co-occurrence-ratio hypothesis dies on the control-must-not-move rule, because the negative controls (pīti, bhikkhu, anicca, ...) move the SAME way. Interpretation: the commentarial DEFINITIONAL REGISTER lifts every term's gloss/definitional co-occurrence density at once, so term-SPECIFIC reinterpretation cannot be isolated by co-occurrence ratios. The robust method is the simple per-character TERM density (canon vs commentary), exactly what come-and-see and the original five studies used. The discovery sweep already has those, and they are clean and strong (sabhāva 98x comm-denser, mātikā/paramattha ~8-12x comm-denser, abhiñña/iddhi comm-denser = house; anattā-maxim + theravāda canon-denser = counter).

## SALVAGE PLAN (when the session cap resets ~12:50am NY)
Reframe each surviving topic as its SIMPLE per-character density finding (proven method), NOT the failed gradient. Robust survivors to write up: sabhāva realist register (98x, strongest divergence in the program); the scholastic register (mātikā/paramattha) commentarial; the supernatural-display register commentarial; anattā predicative-dominance + maxim counter; theravāda self-label canon-present (counter). Plus the meta-finding itself (a methodological contribution: gloss-shift is undetectable by co-occurrence ratio because the definitional register is pervasive). Do these to the come-and-see careful standard (hand-verified), few and solid, not nine thin nulls. Heavy workflows paused until the cap resets.

## TWO methodological findings (the campaign's durable value, 2026-06-25)
1. **Gradient method unsound.** The co-occurrence-ratio gradient cannot isolate term-specific gloss-hardening: the commentarial definitional register lifts every term at once, so every negative control moves with the signal. Use the simple per-character term density, not the gradient.
2. **Canon denominator double-counts (PROGRAM-WIDE).** The canon is double-ingested (SuttaCentral + Chaṭṭha-Saṅgāyana): un-deduped mūla = 52.3 Mchar, deduped (is_primary) = 25.74 Mchar; commentary is single-edition (30.69 Mchar either way). The program's `mūla 53.5M` denominator is the UN-deduped total. Numerators double-count NON-uniformly (sabhāva 72 un-dedup -> 48 dedup), so canon density is understated and **house ratios are inflated ~1.3-2x** (sabhāva 98x un-dedup -> ~55x deduped). FIX: use is_primary on the canon side (numerator AND denominator). The come-and-see COUNTER result is strengthened by this (dedup raises canon density), so the fix improves defensibility; the five house studies' magnitudes are overstated and should be recomputed deduped (a follow-on pass). Corrected table: `EXPANSION-CORRECTED-DENSITY-2026-06-25.json`; script `_corrected_density.py`.

## Corrected deduped survivors (apples-to-apples)
HOUSE (comm-denser): sabhāva ~55x (flagship; ṭīkā 3981 > aṭṭha 1632, intensifies); paramattha ~9.3x; mātikā ~7.6x; pāṭihāriya ~5x; iddhi ~3.2x; cetasika ~2x. WEAK/near-even: abhiññā ~1.15x (downgrade). COUNTER (canon-denser): maxim sabbe dhammā anattā 1.57x (strengthened by dedup) + predicative-dominance raw ~60:1 in early canon. ARTIFACT (dropped): theravāda canon-tilt = "Theravāda Vinaya" section-title homograph. NULL: sati (idiolect), the gradient hypotheses.
Deliverable: ONE consolidated study "The Commentarial Register" (re-finalize wf wgxtx95u4) + live page via the new spec-driven CommentarialRegisterStudy component.

## Method invariants (do not regress)
Per-character magnitude (not rows); stratum() is a lookup not independent evidence; every finding needs a negative control that did NOT move; no em-dashes / no first person / no "load-bearing"/"cross-cutting" in deliverable prose; report nulls; κ on polysemous sense-coding.
