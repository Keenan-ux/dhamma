-- Migration: add a `stratum(work_slug)` function + an `is_primary` de-dup flag.
-- 2026-06-22. Non-destructive (no rows deleted/hidden; both ingest editions stay
-- queryable). Run once via the dhamma-pg proxy:
--   python research/naga/sql.py -f scripts/ingest/migrate-stratum-flags.sql
--
-- Design note: passages is multi-GB once the embedding vectors (TOAST) are counted,
-- so a GENERATED STORED column would force a full table rewrite that times out and
-- holds ACCESS EXCLUSIVE for minutes (the cold-start hazard schema.sql warns about).
-- So `stratum` is an IMMUTABLE FUNCTION (zero rewrite; the CASE lives in ONE place),
-- and `is_primary` is a plain column whose DEFAULT TRUE is metadata-only (instant in
-- PG11+) plus a TARGETED UPDATE of only the ~1.8k duplicate rows. Both definitions
-- also live in server/sql/schema.sql (idempotent); the is_primary POPULATION (the
-- UPDATE) stays here, outside the boot path.

-- 1) stratum(): the fine 6-stratum coding, computed once from work_slug. Replaces
--    the per-study hand-typed CASE and the work_slug-vs-work_role reconciliation
--    overhead (research RECONCILIATION.md). Use `GROUP BY stratum(work_slug)`.
--    7other holds the extra-canonical (anya) works.
CREATE OR REPLACE FUNCTION stratum(ws TEXT) RETURNS TEXT
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $func$
  SELECT CASE
    WHEN ws IN ('pli-an','pli-sn','pli-mn','pli-dn','pli-vinaya','pli-dhp','pli-ud','pli-iti','pli-snp','pli-thag','pli-thig','pli-kp') THEN '1early'
    WHEN ws IN ('pli-ap','pli-bv','pli-cp','pli-pv','pli-vv','pli-nd','pli-ps','pli-ja','pli-kn') THEN '2late'
    WHEN ws = 'pli-abhidhamma' THEN '3abh'
    WHEN ws IN ('pli-ne','pli-pe','pli-mil') THEN '4para'
    WHEN ws LIKE '%-attha' OR ws = 'pli-vism' THEN '5comm'
    WHEN ws LIKE '%-tika' THEN '6tika'
    ELSE '7other'
  END
$func$;

-- 2) is_primary: de-dup flag for the double-ingest. The canon is ingested under TWO
--    editions (source_edition 'sc' = SuttaCentral, 'cst' = Chaṭṭha Saṅgāyana). To
--    count each canonical text ONCE, filter `WHERE is_primary`. Non-primary = the
--    redundant edition, chosen per work as the SMALLER (less complete):
--      - four Nikāyas + Vinaya: SC is the fuller per-sutta primary; the sparse CST
--        mula (an 220, sn 61, dn 37, mn 18, vinaya 60) is the duplicate;
--      - Abhidhamma: CST is the fuller primary (6428); the partial SC (1102) is the dup;
--      - pli-kn: a coarse CST re-ingest of the whole Khuddaka, duplicating the
--        dedicated SC slugs (see KN-REBUCKET.md).
--    All other rows (SC canon, CST commentary/sub-commentary/anya, the Visuddhimagga,
--    single-edition works) are primary. NOTHING is deleted; both editions stay
--    queryable — a counting aid only. (Re-running re-flags the same rows; the rule is
--    deterministic on the row's columns.)
ALTER TABLE passages ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE passages SET is_primary = FALSE
WHERE work_slug = 'pli-kn'
   OR (work_role = 'mula' AND source_edition = 'cst' AND work_slug IN ('pli-an','pli-sn','pli-mn','pli-dn','pli-vinaya'))
   OR (work_role = 'mula' AND source_edition = 'sc'  AND work_slug = 'pli-abhidhamma');
CREATE INDEX IF NOT EXISTS idx_passages_is_primary ON passages(is_primary) WHERE is_primary = FALSE;
