// Maintenance-window one-off: build pg_trgm GIN indexes that accelerate the
// substring LIKE in /api/compare-stats (the Concordance view).
//
// WHY this is NOT in schema.sql: schema.sql is re-applied on every app boot
// before listen(). A CREATE INDEX (even IF NOT EXISTS) takes a SHARE lock on
// `passages`; a CREATE INDEX CONCURRENTLY here holds SHARE UPDATE EXCLUSIVE.
// Those conflict, so if the schema-apply path ever overlapped a concurrent
// build the app cold-start would hang (this is exactly the 2026-05-29 outage
// mechanism, with REINDEX). Keep trigram-index creation a deliberate,
// out-of-band op and run NO `flyctl deploy` while it builds.
//
// The Concordance WHERE clause (server/src/compareStats.js) is:
//   lower(coalesce(original,''))    LIKE '%'||probe||'%'
//   OR lower(coalesce(translation,'')) LIKE '%'||probe||'%'
// For Postgres to BitmapOr-accelerate that OR, BOTH branches need a trigram
// index, and each index expression must match the predicate expression
// exactly — hence `lower(coalesce(<col>,''))`, not bare `lower(<col>)`.
//
// Run from C:\Dev\Dhamma\server, with the 15432 proxy to dhamma-pg up:
//   $env:DATABASE_URL = "postgres://dhamma:PASSWORD@localhost:15432/dhamma"
//   node scripts/build-concordance-trgm.mjs
//
// Safe to re-run: each index is CREATE INDEX CONCURRENTLY IF NOT EXISTS, and
// the script drops any INVALID leftover from a previously-interrupted build
// before retrying.

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// max:1 so the session GUCs below and the CONCURRENTLY builds all run on the
// one physical connection. idle_timeout long enough not to drop mid-build.
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 0 });

const INDEXES = [
  {
    name: 'idx_passages_original_trgm',
    expr: "lower(coalesce(original,'')) gin_trgm_ops",
  },
  {
    name: 'idx_passages_translation_trgm',
    expr: "lower(coalesce(translation,'')) gin_trgm_ops",
  },
];

// Give the build room to stay in memory (the machine is at 1024MB; shared
// buffers ~128MB, so 384MB maintenance_work_mem leaves comfortable headroom).
// Disable parallel maintenance workers so peak memory is a single
// maintenance_work_mem, not one per worker. No statement timeout for the long
// CONCURRENTLY scans.
console.log('Session tuning…');
await sql.unsafe(`SET maintenance_work_mem = '384MB'`);
await sql.unsafe(`SET max_parallel_maintenance_workers = 0`);
await sql.unsafe(`SET statement_timeout = 0`);

for (const { name, expr } of INDEXES) {
  // Clear any INVALID artifact from an interrupted prior run.
  const [bad] = await sql`
    SELECT c.relname FROM pg_class c
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE c.relname = ${name} AND NOT i.indisvalid
  `;
  if (bad) {
    console.log(`Dropping INVALID leftover ${name}…`);
    await sql.unsafe(`DROP INDEX IF EXISTS ${name}`);
  }

  console.log(`Building ${name} (CONCURRENTLY) …`);
  const t0 = Date.now();
  await sql.unsafe(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${name} ON passages USING gin (${expr})`
  );
  console.log(`  built in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const [{ valid }] = await sql`
    SELECT i.indisvalid AS valid FROM pg_class c
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE c.relname = ${name}
  `;
  console.log(`  ${name} valid=${valid}`);
  if (!valid) {
    console.error(`  ${name} is INVALID — leaving it for inspection; aborting.`);
    await sql.end();
    process.exit(1);
  }
}

// Expression-index stats: the planner needs ANALYZE to estimate selectivity
// on the new lower(coalesce(...)) expressions, or it may ignore the index.
console.log('ANALYZE passages…');
await sql.unsafe(`ANALYZE passages`);

console.log('Final index sizes:');
const sizes = await sql`
  SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) AS sz
  FROM pg_indexes
  WHERE tablename = 'passages' AND indexname LIKE '%trgm%'
  ORDER BY indexname
`;
for (const r of sizes) console.log(`  ${r.indexname}: ${r.sz}`);

await sql.end();
console.log('done.');
