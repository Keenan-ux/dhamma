-- First-boot only: enables pgvector and pg_trgm in the freshly-created
-- database. Postgres' official image only runs init scripts when the data
-- directory is empty, so this is idempotent across restarts and re-deploys.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Real schema (traditions / works / passages / aliases / embeddings) lands
-- when the ingest pipeline starts in Phase 2 of v2. Kept out of init so we
-- can iterate the schema with migrations rather than a destroy-rebuild.
