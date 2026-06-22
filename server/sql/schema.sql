-- Dhamma corpus schema. Idempotent — re-runs on every server boot are safe.
-- BGE-M3 produces 1024-dim dense vectors; if you switch embedding models,
-- the embedding column dimension MUST change and existing vectors become
-- invalid (different vector spaces aren't comparable).

-- Postgres extensions used by the schema. unaccent + a custom 'simple_unaccent'
-- text-search configuration fold diacritics at index AND query time, so a
-- query for 'anapana' matches indexed 'ānāpāna' (and Mettasutta, etc.) across
-- the whole corpus without per-term seeding. Every fts_doc tsvector below
-- uses this config; search.js uses it in every to_tsquery() and ts_headline().
CREATE EXTENSION IF NOT EXISTS unaccent;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'simple_unaccent') THEN
    CREATE TEXT SEARCH CONFIGURATION simple_unaccent (COPY = simple);
    ALTER TEXT SEARCH CONFIGURATION simple_unaccent
      ALTER MAPPING FOR hword, hword_part, word
      WITH unaccent, simple;
  END IF;
END
$$;

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
    setweight(to_tsvector('simple_unaccent', coalesce(citation, '')), 'A') ||
    setweight(to_tsvector('simple_unaccent', coalesce(title, '')),    'B') ||
    setweight(to_tsvector('simple_unaccent', coalesce(original, '')), 'C') ||
    setweight(to_tsvector('simple_unaccent', coalesce(translation, '')), 'D')
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

-- Research-support: a single, declared-once stratum coding + a de-dup flag.
-- (Added 2026-06-22; see scripts/ingest/migrate-stratum-flags.sql and the
-- research RECONCILIATION.md / KN-REBUCKET.md design notes.)
--
-- `stratum(work_slug)` is the fine 6-stratum chronological coding used by every
-- corpus study (1early / 2late / 3abh / 4para / 5comm / 6tika / 7other=anya).
-- It is a FUNCTION, not a stored/generated column, on purpose: passages is
-- multi-GB once the embedding vectors (TOAST) are counted, so a GENERATED STORED
-- column forces a full table rewrite that holds ACCESS EXCLUSIVE for minutes (the
-- same cold-start hazard the HNSW comments below warn about). The function is
-- instant, immutable, and keeps the CASE in ONE place. Use `GROUP BY stratum(work_slug)`.
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

-- `is_primary` de-duplicates the corpus's double-ingest of the canon (the canon is
-- ingested under BOTH source_edition='sc' = SuttaCentral and 'cst' = Chaṭṭha
-- Saṅgāyana). To count each canonical text ONCE, filter `WHERE is_primary`. The
-- non-primary rows are the redundant (smaller/less-complete) edition + the pli-kn
-- Khuddaka catch-all. NOTHING is deleted; both editions stay queryable. The column
-- (DEFAULT TRUE) is metadata-only here; the POPULATION (flipping the ~1.8k duplicate
-- rows to FALSE) lives in scripts/ingest/migrate-stratum-flags.sql, run once outside
-- the boot path so it never re-runs a full-table UPDATE on every server start.
ALTER TABLE passages ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_passages_is_primary ON passages(is_primary) WHERE is_primary = FALSE;

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
  fts_doc     tsvector GENERATED ALWAYS AS (to_tsvector('simple_unaccent', text)) STORED,
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

-- BPS ingest support (Tier 2+ per BPS_INGEST_HANDOFF.md). source_book
-- carries the publication title + catalogue number for per-card
-- attribution, e.g. "The All-Embracing Net of Views (BP209S, 1978)".
-- Distinct from `source` (which keys the ingest origin: 'sc' | 'ati'
-- | 'bps-direct') so a single source can carry many books.
ALTER TABLE translations ADD COLUMN IF NOT EXISTS source_book TEXT;

-- Private / admin-only translations. A row with visibility='private' is an
-- owned draft (owner_email = the admin who authored it): served ONLY to that
-- owner, and excluded from every public surface — the Canon-Map translated
-- count, the translator index, the translation search scope, and the reader's
-- translator dropdown for everyone else. Public rows (the default) carry
-- owner_email NULL. The gate itself lives in the read paths (db.js vtT/vtBare
-- splice the predicate into each translations query); these columns just back
-- it, defaulting every existing row to 'public' so the live corpus is
-- unchanged. See [admin-private-translation] design note.
ALTER TABLE translations ADD COLUMN IF NOT EXISTS visibility  TEXT NOT NULL DEFAULT 'public';
ALTER TABLE translations ADD COLUMN IF NOT EXISTS owner_email TEXT;
CREATE INDEX IF NOT EXISTS idx_translations_visibility ON translations(visibility) WHERE visibility <> 'public';

-- Recognised values for translations.license and articles.license:
--   'cc0'           — SuttaCentral Sujato rows
--   'cc-by-nc-4.0'  — ATI offline-edition rows (Thanissaro, Walshe,
--                     Bodhi extracts, Nyanaponika, Ireland, Olendzki,
--                     Piyadassi, Ñāṇamoli, Soma, Buddharakkhita, …)
--   'bps-fair-use'  — BPS-direct rows ingested under non-commercial
--                     fair-use posture per BPS_INGEST_HANDOFF.md.
--                     Display chrome must show: "Used under fair use
--                     for non-commercial scholarly indexing. Original
--                     © Buddhist Publication Society, Kandy." plus a
--                     link back to bps.lk for the source publication.
--                     Not a Creative Commons grant; reflects the
--                     project's own asserted use posture, which BPS
--                     can ask to be revisited.

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
    setweight(to_tsvector('simple_unaccent', coalesce(title, '')),  'A') ||
    setweight(to_tsvector('simple_unaccent', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('simple_unaccent', coalesce(body, '')),   'C')
  ) STORED,
  embedding   vector(1024),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug     ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_author   ON articles(author);
CREATE INDEX IF NOT EXISTS idx_articles_fts      ON articles USING GIN(fts_doc);

-- Curated tags assembled from ATI's index-*.html files. Each row says
-- "passage P is tagged with tag_value of tag_type from this source."
-- tag_type is one of: simile, name, subject, title, number — matching
-- the ATI index files. Lets a scholar filter Browse by simile, or see
-- all suttas mentioning Sāriputta, etc.
CREATE TABLE IF NOT EXISTS passage_tags (
  passage_id  TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  tag_type    TEXT NOT NULL,
  tag_value   TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'ati',
  PRIMARY KEY (passage_id, tag_type, tag_value, source)
);
CREATE INDEX IF NOT EXISTS idx_pt_passage    ON passage_tags(passage_id);
CREATE INDEX IF NOT EXISTS idx_pt_type_value ON passage_tags(tag_type, tag_value);

-- Curated SuttaCentral blurbs — one short, densely thematic paragraph per
-- sutta describing what it is *about*. Sourced from bilara-data
-- root/en/blurb/. A blurb is a fourth Meaning-mode retrieval lane (vec_blurb
-- in search.js, RRF-fused alongside FTS + passages.embedding +
-- translations.embedding): because the blurb is short and on-topic, its
-- BGE-M3 vector isn't diluted by thousands of chars of surrounding
-- narrative, so a thematic query ("how to behave around families") surfaces
-- the ABOUT-this sutta (SN 16.3) even when the body-text lanes drown it.
-- One blurb per passage, so passage_id is the primary key and the ingest
-- UPSERTs on it. embedding is filled by scripts/ingest/embed-blurbs.mjs.
CREATE TABLE IF NOT EXISTS blurbs (
  passage_id  TEXT PRIMARY KEY REFERENCES passages(id) ON DELETE CASCADE,
  blurb       TEXT NOT NULL,
  embedding   vector(1024),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTE: the vec_blurb HNSW index is deliberately NOT created here. schema.sql
-- is applied on every production boot (server/src/db.js → applySchema), and a
-- CREATE INDEX ... hnsw over a POPULATED blurbs table blocks the boot before
-- the server can listen() — exactly the cold-start hazard the comment above
-- warns about for passages/translations/dict. (It bit prod once: v161 hung on
-- boot building this index while dhamma-pg was busy, until rolled back.) For
-- ~4,000 rows the vec_blurb ANN lane runs fine on a seq scan (<10 ms), so no
-- index is needed yet. When blurbs grow enough to want HNSW, build it as a
-- deliberate one-off against an idle instance:
--   CREATE INDEX CONCURRENTLY idx_blurbs_embedding
--     ON blurbs USING hnsw (embedding vector_cosine_ops);
-- Never put an HNSW build back into schema.sql.

-- Messages submitted via the About-page contact form. Plain inbox
-- table — the maintainer reads via the DB proxy (no email-service
-- wiring needed). from_email is optional (some users won't share
-- one and that's fine). ip_hash is SHA-256 of the client IP so we
-- can rate-limit without storing PII.
CREATE TABLE IF NOT EXISTS contact_messages (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  from_email   TEXT,
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  user_agent   TEXT,
  ip_hash      TEXT,
  status       TEXT NOT NULL DEFAULT 'new'
);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_status  ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_iphash  ON contact_messages(ip_hash, created_at);

-- Sentence-level chunks of passages, for sentence-precise Meaning snippets
-- (replacing the first-200-char fallback) and an optional future
-- vec_sentence retrieval lane. Populated additively by the segment pass
-- (scripts/ingest/segment_sentences.mjs) and embedded by
-- scripts/ingest/embed_sentences.py. `field` discriminates the Pāli
-- 'original' from an English 'translation' so snippets can surface the
-- matched sentence on either side (cross-language matching is the whole
-- game, per the gloss re-embed). Resume cursor is `embedding IS NULL`,
-- mirroring embed-articles.mjs / embed-blurbs.mjs.
CREATE TABLE IF NOT EXISTS passage_sentences (
  passage_id  TEXT NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  position    INT  NOT NULL,                       -- 0-based ordinal within (passage, field)
  field       TEXT NOT NULL DEFAULT 'original',    -- 'original' | 'translation'
  text        TEXT NOT NULL,
  embedding   vector(1024),
  PRIMARY KEY (passage_id, field, position)
);
CREATE INDEX IF NOT EXISTS idx_psent_passage ON passage_sentences(passage_id);

-- The vec_sentence HNSW index is deliberately NOT created here. schema.sql
-- is applied on every server boot (server/src/db.js -> applySchema) before
-- listen(); a CREATE INDEX ... hnsw over a multi-million-row table would
-- block every cold-start for minutes-to-hours. This is the same hazard,
-- at larger scale, that took prod down on 2026-05-29 (the blurbs HNSW build
-- on boot). Build it ONCE, by hand, in a maintenance window:
--   CREATE INDEX CONCURRENTLY idx_psent_embedding
--     ON passage_sentences USING hnsw (embedding vector_cosine_ops);
-- Never put an HNSW build in schema.sql.

-- ============================================================
-- Auth + per-user data (magic-link sign-in; see server/src/auth.js).
-- Additive and idempotent. Dhamma stays a PUBLIC tool: these tables power
-- OPTIONAL sign-in (persistent bookmarks/notes) and the admin-gated Research
-- tab. No existing public route requires auth. All metadata-only CREATEs, so
-- they're a cheap no-op on the already-provisioned production DB.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL   PRIMARY KEY,
  email         TEXT        UNIQUE NOT NULL,
  display_name  TEXT,
  is_admin      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- One-time magic-link tokens. Only the SHA-256 hash is stored; the raw token
-- lives only in the emailed link. Single-use (used_at) + TTL (expires_at).
CREATE TABLE IF NOT EXISTS magic_tokens (
  token_hash  TEXT        PRIMARY KEY,
  email       TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_email ON magic_tokens (email, created_at);

-- Per-user collections (bookmarks, notes) stored as JSONB documents. The
-- frontend hooks (useBookmarks/useNotes) already own the list shape, so the
-- server just persists the whole list per (user, kind) — a future server-backed
-- sync drops in without remodeling every field. One row per (user_id, kind).
CREATE TABLE IF NOT EXISTS user_collections (
  user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT        NOT NULL,           -- 'bookmarks' | 'notes'
  items      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kind)
);

-- Research articles reuse the existing `articles` table with
-- category = 'research' and source = 'research' (distinct from the public ATI
-- Library, which filters source = 'ati'), so they never leak into public
-- Library browse/search. They're served only by /api/research (requireAdmin).
