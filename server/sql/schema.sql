-- Dhamma corpus schema. Idempotent — re-runs on every server boot are safe.
-- BGE-M3 produces 1024-dim dense vectors; if you switch embedding models,
-- the embedding column dimension MUST change and existing vectors become
-- invalid (different vector spaces aren't comparable).

CREATE TABLE IF NOT EXISTS traditions (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  subtitle      TEXT,
  display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS works (
  slug           TEXT PRIMARY KEY,
  tradition_slug TEXT REFERENCES traditions(slug) ON DELETE CASCADE,
  parent_slug    TEXT REFERENCES works(slug)      ON DELETE CASCADE,
  name           TEXT NOT NULL,
  subtitle       TEXT,
  display_order  INT NOT NULL DEFAULT 0,
  is_stub        BOOLEAN NOT NULL DEFAULT FALSE,   -- pending ingest, shown but inert
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_works_parent    ON works(parent_slug);
CREATE INDEX IF NOT EXISTS idx_works_tradition ON works(tradition_slug);

CREATE TABLE IF NOT EXISTS passages (
  id            TEXT PRIMARY KEY,
  work_slug     TEXT NOT NULL REFERENCES works(slug) ON DELETE CASCADE,
  position      INT,
  citation      TEXT NOT NULL,
  title         TEXT,
  canon         TEXT,           -- 'Pali' | 'Sanskrit' | 'Chinese' | 'Japanese'
  original_lang TEXT,
  original      TEXT,
  translation   TEXT,
  notes         TEXT,
  embedding     vector(1024),
  fts_doc       tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(citation, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(title, '')),    'B') ||
    setweight(to_tsvector('simple', coalesce(original, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(translation, '')), 'D')
  ) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passages_work       ON passages(work_slug);
CREATE INDEX IF NOT EXISTS idx_passages_fts        ON passages USING GIN(fts_doc);
-- Vector index uses ivfflat; built lazily after first ingest pass.
-- ivfflat requires data to build a good index, so we don't create it here.

-- Tier C (CST/VRI commentary ingest) support. SuttaCentral mūla and CST
-- mūla coexist as parallel editions; passages on the same canonical text
-- can come from either source. work_role distinguishes canonical text
-- (mula) from commentary (attha), sub-commentary (tika), or supplementary
-- (anya) within a single work hierarchy. xml_div_id preserves the CST
-- TEI <div id="..."> for round-trip reference.
ALTER TABLE passages ADD COLUMN IF NOT EXISTS source_edition TEXT;  -- 'sc' | 'cst'
ALTER TABLE passages ADD COLUMN IF NOT EXISTS xml_div_id    TEXT;
ALTER TABLE passages ADD COLUMN IF NOT EXISTS work_role     TEXT;   -- 'mula' | 'attha' | 'tika' | 'anya'
UPDATE passages SET source_edition = 'sc' WHERE source_edition IS NULL;
CREATE INDEX IF NOT EXISTS idx_passages_edition ON passages(source_edition);
CREATE INDEX IF NOT EXISTS idx_passages_role    ON passages(work_role);

CREATE TABLE IF NOT EXISTS aliases (
  id          SERIAL PRIMARY KEY,
  term        TEXT NOT NULL UNIQUE,
  equivalents TEXT[] NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aliases_term ON aliases(term);

-- Dictionary headword entries. One row per dictionary sense.
-- Source identifies the dictionary (currently only 'dpd', later 'ped', 'bhs', 'ddb').
-- Lemma is the canonical lookup key; source_id preserves the dictionary's own
-- entry id (e.g. DPD's "sampajāna 1" vs "sampajāna 2" for distinct senses).
CREATE TABLE IF NOT EXISTS dictionary_entries (
  id             BIGSERIAL PRIMARY KEY,
  source         TEXT NOT NULL,
  source_id      TEXT,
  -- The canonical bare headword (DPD's lemma_1 minus the trailing version
  -- suffix). For neuter nouns DPD's lemma_2 is the inflected citation
  -- form (nibbānaṃ); headword_lower preserves the bare form (nibbāna).
  headword_lower TEXT,
  lemma          TEXT NOT NULL,
  lemma_lower    TEXT NOT NULL,
  language       TEXT NOT NULL DEFAULT 'pli',
  pos            TEXT,
  grammar        TEXT,
  definition     TEXT NOT NULL,
  definition_lit TEXT,
  definition_alt TEXT,
  sanskrit       TEXT,
  construction   TEXT,
  root           TEXT,
  example        TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, source_id)
);

-- ALTER for existing installs that pre-date the headword_lower column
-- (the CREATE TABLE IF NOT EXISTS above is a no-op when the table is
-- already present; the migration of bare-headword data needs ADD COLUMN
-- IF NOT EXISTS, available in Postgres 9.6+).
ALTER TABLE dictionary_entries ADD COLUMN IF NOT EXISTS headword_lower TEXT;

CREATE INDEX IF NOT EXISTS idx_dict_lemma_lower    ON dictionary_entries(lemma_lower);
CREATE INDEX IF NOT EXISTS idx_dict_headword_lower ON dictionary_entries(headword_lower);
CREATE INDEX IF NOT EXISTS idx_dict_source         ON dictionary_entries(source);

-- Inflected surface forms → headword. Built from DPD's per-headword
-- inflection data so "sampajāno", "sampajānakārī", "sampajānassa" all
-- resolve to the "sampajāna" entry. The lookup happens on surface_lower.
CREATE TABLE IF NOT EXISTS dictionary_inflections (
  surface_lower TEXT NOT NULL,
  entry_id      BIGINT NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
  PRIMARY KEY (surface_lower, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_dict_infl_surface ON dictionary_inflections(surface_lower);
