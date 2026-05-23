// Rebuild the HNSW index on passages.embedding after the gloss-injection
// re-embed pass overwrote every vector. Pgvector updates the graph
// incrementally on UPDATE, so the live index works, but the graph
// quality is suboptimal after wholesale vector churn. CONCURRENTLY
// avoids blocking reads on the live site.
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

const before = await sql`SELECT pg_size_pretty(pg_relation_size('idx_passages_embedding'::regclass)) sz`;
console.log('before reindex:', before[0]);

const t0 = Date.now();
console.log('REINDEX INDEX CONCURRENTLY idx_passages_embedding…');
await sql.unsafe('REINDEX INDEX CONCURRENTLY idx_passages_embedding');
const wall = Math.round((Date.now() - t0) / 1000);
console.log(`done in ${wall}s`);

const after = await sql`SELECT pg_size_pretty(pg_relation_size('idx_passages_embedding'::regclass)) sz`;
console.log('after reindex:', after[0]);

await sql.end();
