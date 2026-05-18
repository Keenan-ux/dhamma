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

CREATE TABLE IF NOT EXISTS aliases (
  id          SERIAL PRIMARY KEY,
  term        TEXT NOT NULL UNIQUE,
  equivalents TEXT[] NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aliases_term ON aliases(term);
