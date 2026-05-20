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
  -- Diacritic-folded headword: `sampajāna` → `sampajana`, `anāthapiṇḍika`
  -- → `anathapindika`. Lets a user typing without diacritics match the
  -- canonical entry. Auto-computed; ingest scripts don't need to set it.
  headword_folded TEXT GENERATED ALWAYS AS (
    translate(headword_lower, 'āīūēōṃṁṅñṇṭḍḷḥṛśṣ', 'aiueommnnntdlhrss')
  ) STORED,
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
  -- Semantic-search embedding (BGE-M3 1024-dim, same vector space as
  -- passages.embedding). Filled by scripts/ingest/embed_dict.py. If
  -- BGE-M3 is ever swapped for a different model, every row must be
  -- re-embedded.
  embedding      vector(1024),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, source_id)
);

-- pg_trgm is loaded by the cluster so trigram GIN on definition can
-- accelerate the english-reverse regex lookups.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_dict_lemma_lower     ON dictionary_entries(lemma_lower);
CREATE INDEX IF NOT EXISTS idx_dict_headword_lower  ON dictionary_entries(headword_lower);
CREATE INDEX IF NOT EXISTS idx_dict_headword_folded ON dictionary_entries(headword_folded);
CREATE INDEX IF NOT EXISTS idx_dict_source          ON dictionary_entries(source);
CREATE INDEX IF NOT EXISTS idx_dict_def_trgm
  ON dictionary_entries USING GIN (definition gin_trgm_ops);
-- Per-source partial HNSW indexes for vector ANN — one per dictionary
-- source so a `WHERE source = X ORDER BY embedding <=> q LIMIT 10`
-- query uses that source's index directly. The monolithic HNSW we
-- tried first returned 0 results for less-populated sources because
-- pgvector applies WHERE *after* the index returns its top-N, and
-- DPD's 88K entries swamped the candidate set. With partials, default
-- ef_search=40 already returns enough rows after the per-source
-- filter. NOT in schema.sql because CREATE INDEX (non-CONCURRENTLY)
-- would take ACCESS EXCLUSIVE on every boot and block production
-- cold-starts; instead the indexes are built once via embed_dict.py
-- (or by hand when a new source is added) — when adding a new source
-- remember to:
--   CREATE INDEX idx_dict_embedding_<src> ON dictionary_entries
--     USING hnsw (embedding vector_cosine_ops) WHERE source = '<src>';

-- Historical migrations that have already been applied to prod
-- (2026-05). Re-running them would take ACCESS EXCLUSIVE on
-- dictionary_entries and can deadlock with concurrent ANALYZE / index
-- builds, so they live OUTSIDE schema.sql now. If a fresh DB is ever
-- spun up, the CREATE TABLE above already includes the post-migration
-- shape.
--   ALTER TABLE dictionary_entries ADD COLUMN headword_lower TEXT;
--   ALTER TABLE dictionary_entries ADD COLUMN headword_folded ...;
--   ALTER TABLE dictionary_entries ADD COLUMN embedding vector(1024);

-- Inflected surface forms → headword. Built from DPD's per-headword
-- inflection data so "sampajāno", "sampajānakārī", "sampajānassa" all
-- resolve to the "sampajāna" entry. The lookup happens on surface_lower.
CREATE TABLE IF NOT EXISTS dictionary_inflections (
  surface_lower TEXT NOT NULL,
  -- Diacritic-folded surface form so the cascade's inflection step can
  -- match user input typed without diacritics ("sampajano" → finds
  -- DPD's "sampajāno" inflection of "sampajāna"). Same translate()
  -- map as dictionary_entries.headword_folded.
  surface_folded TEXT GENERATED ALWAYS AS (
    translate(surface_lower, 'āīūēōṃṁṅñṇṭḍḷḥṛśṣ', 'aiueommnnntdlhrss')
  ) STORED,
  entry_id      BIGINT NOT NULL REFERENCES dictionary_entries(id) ON DELETE CASCADE,
  PRIMARY KEY (surface_lower, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_dict_infl_surface        ON dictionary_inflections(surface_lower);
CREATE INDEX IF NOT EXISTS idx_dict_infl_surface_folded ON dictionary_inflections(surface_folded);

-- Multi-translator translations. One row per (passage, translator, source).
-- Sujato (SC) and ATI translators (Thanissaro, Walshe, Nyanaponika, ...)
-- coexist here, each carrying its own attribution and CC license text.
-- The fts_doc column indexes the translation text for the
-- field=translation search scope; embedding feeds the Meaning mode.
CREATE TABLE IF NOT EXISTS translations (
  id          BIGSERIAL PRIMARY KEY,
  passage_id  TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  language    TEXT NOT NULL DEFAULT 'en',
  translator  TEXT NOT NULL,
  source      TEXT NOT NULL,
  text        TEXT NOT NULL,
  notes       TEXT,
  copyright   TEXT,
  license     TEXT,
  source_url  TEXT,
  fts_doc     tsvector GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED,
  embedding   vector(1024),
  position    INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (passage_id, translator, source)
);

CREATE INDEX IF NOT EXISTS idx_translations_passage    ON translations(passage_id);
CREATE INDEX IF NOT EXISTS idx_translations_translator ON translations(translator);
CREATE INDEX IF NOT EXISTS idx_translations_source     ON translations(source);
CREATE INDEX IF NOT EXISTS idx_translations_fts        ON translations USING GIN(fts_doc);
-- HNSW index for vector ANN is built once embeddings are populated;
-- skipped here for the same reason as the dictionary HNSW (avoid
-- ACCESS EXCLUSIVE on every boot).

-- Passage parallels — cross-references between sutta passages, sourced
-- from SuttaCentral's sc-data/relationship/parallels.json. Each record
-- in that file is an array of passage IDs that are mutually related;
-- the ingest expands it to a row per (source, target, relation_type).
-- parallel_have flags whether the target is in our passages table
-- (i.e. clickable). Sanskrit / Chinese / Tibetan parallels land here
-- too — informational, not clickable, until those traditions ingest.
CREATE TABLE IF NOT EXISTS passage_parallels (
  passage_id     TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  parallel_id    TEXT NOT NULL,
  relation_type  TEXT NOT NULL,   -- 'parallels' | 'mentions' | 'retells'
  parallel_lang  TEXT,             -- 'pli' | 'lzh' | 'san' | 'pra' | 'gandhari' | …
  parallel_have  BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (passage_id, parallel_id, relation_type)
);
CREATE INDEX IF NOT EXISTS idx_pp_passage ON passage_parallels(passage_id);
CREATE INDEX IF NOT EXISTS idx_pp_have    ON passage_parallels(parallel_have) WHERE parallel_have = TRUE;

-- Library articles — non-sutta content from Access to Insight: study
-- guides, author essays, Thai forest tradition writings, Path to
-- Freedom, glossary, etc. These don't fit the (citation, original,
-- translation) shape of passages so they live in their own table.
-- category tags the source bucket (study-guide | author-essay |
-- thai | ptf | noncanon | glossary | index). body is sanitized HTML
-- preserving paragraph structure + inline emphasis from the source.
CREATE TABLE IF NOT EXISTS articles (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  author      TEXT,
  category    TEXT NOT NULL,
  source      TEXT NOT NULL,                  -- 'ati'
  source_url  TEXT,
  body        TEXT NOT NULL,
  summary     TEXT,
  tags        TEXT[],
  copyright   TEXT,
  license     TEXT,
  year        INT,
  fts_doc     tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')),  'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(body, '')),   'C')
  ) STORED,
  embedding   vector(1024),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug     ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_author   ON articles(author);
CREATE INDEX IF NOT EXISTS idx_articles_fts      ON articles USING GIN(fts_doc);
