// Corpus-wide diacritic folding via Postgres unaccent extension.
//
// Before this migration: passages.fts_doc, translations.fts_doc, and
// articles.fts_doc were tsvectors built with the 'simple' config, which
// compares lexemes byte-for-byte. So a user query of "anapana" missed
// every passage containing 'ānāpāna' because the diacritic differs.
// Hand-seeded diacritic-stripped aliases (in seed-aliases.sql) plugged
// the gap for a few dozen canonical Buddhist terms, but the same
// failure mode applied to thousands of other Pāli words and personal
// names across the corpus.
//
// This migration creates a 'simple_unaccent' text-search configuration
// that runs the unaccent dictionary before 'simple', then regenerates
// every fts_doc column to use it. Result: a Pāli word and its
// diacritic-stripped form produce the same lexeme at both index time
// and query time. Queries match uniformly regardless of how the user
// types diacritics, across the whole corpus, no per-term seeding.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node migrate-unaccent.mjs              # dry-run / status
//   node migrate-unaccent.mjs --apply      # do it
//
// The dhamma server's FTS queries return zero matches during the
// regeneration window (~1-3 minutes on current table sizes). Deploy
// the search.js change that uses simple_unaccent BEFORE running this,
// so the new queries match the new index immediately after migration.

import postgres from 'postgres';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 10 });

// ─────────────────────── status / dry-run ─────────────────────────

async function status() {
  const ext = await sql`SELECT 1 FROM pg_extension WHERE extname = 'unaccent'`;
  console.log(`unaccent extension installed: ${ext.length > 0}`);
  const cfg = await sql`SELECT 1 FROM pg_ts_config WHERE cfgname = 'simple_unaccent'`;
  console.log(`simple_unaccent text-search config installed: ${cfg.length > 0}`);
  // Sample fts_doc lexemes for ānāpāna so we can see if it's folded
  const sample = await sql`
    SELECT id, fts_doc::text AS lexemes
    FROM passages
    WHERE id = 'sn54.13' OR id = 'snp1.8'
    LIMIT 2
  `;
  for (const r of sample) {
    const folded = r.lexemes.includes("'mettasutta'") || r.lexemes.includes("'anapana'");
    const unfolded = r.lexemes.includes("'mettā'") || r.lexemes.includes("'ānāpāna'");
    console.log(`  ${r.id}: folded=${folded} unfolded=${unfolded}`);
    console.log(`    sample lexemes: ${r.lexemes.slice(0, 300)}...`);
  }
}

await status();

if (!args.apply) {
  console.log('\n[dry-run] re-run with --apply to perform the migration');
  await sql.end();
  process.exit(0);
}

// ─────────────────────── apply ────────────────────────────────────

console.log('\n[apply] creating unaccent extension if needed...');
await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS unaccent`);

console.log('[apply] creating simple_unaccent text-search config if needed...');
await sql.unsafe(`
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
`);

// Drop + recreate fts_doc on passages
console.log('[apply] passages.fts_doc: dropping GIN index + column...');
const t0 = Date.now();
await sql.unsafe(`DROP INDEX IF EXISTS idx_passages_fts`);
await sql.unsafe(`ALTER TABLE passages DROP COLUMN IF EXISTS fts_doc`);
console.log('  re-adding fts_doc with simple_unaccent (regenerates ~26k rows)...');
await sql.unsafe(`
  ALTER TABLE passages ADD COLUMN fts_doc tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple_unaccent', coalesce(citation, '')), 'A') ||
    setweight(to_tsvector('simple_unaccent', coalesce(title, '')),    'B') ||
    setweight(to_tsvector('simple_unaccent', coalesce(original, '')), 'C') ||
    setweight(to_tsvector('simple_unaccent', coalesce(translation, '')), 'D')
  ) STORED
`);
console.log('  rebuilding GIN index...');
await sql.unsafe(`CREATE INDEX idx_passages_fts ON passages USING GIN(fts_doc)`);
console.log(`  passages done in ${Math.round((Date.now() - t0) / 1000)}s`);

// translations
console.log('[apply] translations.fts_doc: dropping GIN index + column...');
const t1 = Date.now();
await sql.unsafe(`DROP INDEX IF EXISTS idx_translations_fts`);
await sql.unsafe(`ALTER TABLE translations DROP COLUMN IF EXISTS fts_doc`);
console.log('  re-adding fts_doc with simple_unaccent (regenerates ~6k rows)...');
await sql.unsafe(`
  ALTER TABLE translations ADD COLUMN fts_doc tsvector GENERATED ALWAYS AS (
    to_tsvector('simple_unaccent', text)
  ) STORED
`);
console.log('  rebuilding GIN index...');
await sql.unsafe(`CREATE INDEX idx_translations_fts ON translations USING GIN(fts_doc)`);
console.log(`  translations done in ${Math.round((Date.now() - t1) / 1000)}s`);

// articles
console.log('[apply] articles.fts_doc: dropping GIN index + column...');
const t2 = Date.now();
await sql.unsafe(`DROP INDEX IF EXISTS idx_articles_fts`);
await sql.unsafe(`ALTER TABLE articles DROP COLUMN IF EXISTS fts_doc`);
console.log('  re-adding fts_doc with simple_unaccent (regenerates ~400 rows)...');
await sql.unsafe(`
  ALTER TABLE articles ADD COLUMN fts_doc tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple_unaccent', coalesce(title, '')),  'A') ||
    setweight(to_tsvector('simple_unaccent', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('simple_unaccent', coalesce(body, '')),   'C')
  ) STORED
`);
console.log('  rebuilding GIN index...');
await sql.unsafe(`CREATE INDEX idx_articles_fts ON articles USING GIN(fts_doc)`);
console.log(`  articles done in ${Math.round((Date.now() - t2) / 1000)}s`);

// Verify
console.log('\n[verify] post-migration sample:');
await status();

await sql.end();
console.log('\n[done] migration complete. dhamma server FTS queries should now match diacritic-blind across the entire corpus.');
