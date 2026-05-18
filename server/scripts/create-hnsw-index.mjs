// Post-ingest one-shot: build the HNSW index on passages.embedding so
// Meaning-mode searches use ANN instead of a sequential scan. Run once
// after the full corpus is ingested.
//
// Run from C:\Dev\Dhamma\server:
//   $env:DATABASE_URL = "postgres://dhamma:PASSWORD@localhost:15432/dhamma"
//   node scripts/create-hnsw-index.mjs

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

console.log('Counting embedded rows…');
const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM passages WHERE embedding IS NOT NULL`;
console.log(`  ${n} passages have embeddings`);

console.log('Creating HNSW index on passages.embedding (vector_cosine_ops)…');
const t0 = Date.now();
await sql.unsafe(`
  CREATE INDEX IF NOT EXISTS idx_passages_embedding
    ON passages USING hnsw (embedding vector_cosine_ops)
`);
console.log(`  built in ${Date.now() - t0}ms`);

console.log('Verifying index…');
const idxs = await sql`
  SELECT indexname, indexdef FROM pg_indexes
  WHERE tablename = 'passages' AND indexname LIKE '%embedding%'
`;
for (const i of idxs) console.log(`  ${i.indexname}: ${i.indexdef}`);

await sql.end();
console.log('done.');
