# Pre-registration — final-viva controls (frozen before results)

Date locked: 2026-06-07. Run on the existing validation set (famous n=18,
low-fame n=23) unless noted. Criteria fixed BEFORE running.

## Control 1 — Difficulty-matched null (replaces length-only)
- Per-segment difficulty = mean token rarity = mean(−log(doc_freq/N)) over the
  segment's Pāli tokens (doc_freq from 7,289 bilara root texts), + a verse flag.
- Null: sample the same number of segments the model flagged, weighted by
  difficulty (so the null concentrates on hard segments exactly as the model
  appears to).
- **PASS** (signal beyond difficulty): observed overlap > difficulty-null 97.5th
  percentile (one-sided p<0.025) on BOTH arms.
- **FAIL** (explained by difficulty): observed within the difficulty-null band.

## Control 2 — Location-recall probe (positional memory, not text)
- Give the model ONLY: sutta id + the ordered list of its segment ids + the
  count K of commented segments. NO Pāli text. Ask it to predict which K
  segments the translator commented on.
- Compare its overlap-with-actual (NO content) to phase-5's overlap (WITH
  Pāli content).
- **Interpretation:** if WITH-content overlap >> WITHOUT-content, the signal
  needs the Pāli (content-based, not a pure positional/memory prior). If they
  are equal, content adds nothing → positional prior/memory explains phase-5.
- Pre-set threshold: "needs content" if with-content recall exceeds
  without-content recall by ≥ 0.15 absolute.

## Control 3 — Cruxes-only target (de-noise the proxy)
- An LLM classifier labels each SC comment: {crux, crossref, textual_variant,
  parallel, pedagogical_other} from the comment text alone.
- Re-run the co-location lift (with the difficulty null) against the
  **crux-only** comment subset.
- **Report:** lift on crux-only vs all-comments. Stronger/equal lift on
  crux-only supports "the model tracks genuine cruxes" over "generic salience";
  weaker lift weakens it. (Descriptive — no hard pass/fail.)

## Control 4 — Human inter-annotator ceiling — NOT COMPUTABLE
- Sujato (suttas) and Brahmali (Vinaya) comment on ZERO shared texts; no
  validation sutta has ≥2 English translators. There is no data where two
  humans annotated the same passage. **This control cannot be run without new
  human annotation and is reported as an open gap, not estimated.**

## Standing caveat
All "review" remains LLM same-model-family; none of this is human peer review.
These controls tighten the internal analysis; they do not substitute for a
human Pāli scholar + statistician examining the design.
