// Ingest DPD's full precomputed inflection lookup table from the released
// SQLite. The TSV backup only includes inflections with enclitic particles
// (sampajānoti, sampajānova); the bare canonical inflections
// (sampajāno, sampajānaṃ, sampajānassa, sampajānakārī) live in the SQLite's
// `lookup` table built by DPD's Python pipeline at release time.
//
// Source: dpd-db release v0.4.20260501, `dpd.db.tar.bz2` → dpd.db (SQLite).
// Tables of interest:
//   - dpd_headwords: id → lemma_1 (our source_id), 88,864 rows
//   - lookup:        lookup_key (surface form) → headwords (JSON array of
//                    dpd_headwords.id values), 1.28M rows, 452k with
//                    non-empty headwords
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-dpd-inflections.mjs

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE = path.join(__dirname, '.cache', 'dpd-released', 'dpd.db');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const t0 = Date.now();
const sqlite = new DatabaseSync(SQLITE, { readOnly: true });
const sql    = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });

console.log('[infl] reading dpd_headwords → id-to-lemma_1 map…');
const hwRows = sqlite.prepare(`SELECT id, lemma_1 FROM dpd_headwords`).all();
const idToSourceId = new Map();
for (const r of hwRows) idToSourceId.set(r.id, r.lemma_1);
console.log(`  ${idToSourceId.size} headwords mapped`);

console.log('\n[infl] streaming lookup table (non-empty headwords only)…');
const stmt = sqlite.prepare(
  `SELECT lookup_key, headwords FROM lookup WHERE headwords != '' AND headwords != '[]'`
);

const BATCH = 3000;
let batch = [];
let totalPairs = 0;
let processedLookups = 0;
let unresolved = 0;

async function flush() {
  if (batch.length === 0) return;
  const surfaces  = batch.map((b) => b.surface);
  const sourceIds = batch.map((b) => b.source_id);
  await sql`
    INSERT INTO dictionary_inflections (surface_lower, entry_id)
    SELECT b.surface_lower, de.id
    FROM unnest(${surfaces}::text[], ${sourceIds}::text[]) AS b(surface_lower, source_id)
    JOIN dictionary_entries de ON de.source = 'dpd' AND de.source_id = b.source_id
    ON CONFLICT DO NOTHING
  `;
  totalPairs += batch.length;
  batch = [];
}

for (const row of stmt.iterate()) {
  processedLookups++;
  let ids;
  try {
    ids = JSON.parse(row.headwords);
  } catch {
    continue;
  }
  if (!Array.isArray(ids) || ids.length === 0) continue;
  const surface = String(row.lookup_key || '').toLowerCase().trim();
  if (!surface) continue;

  for (const id of ids) {
    const sourceId = idToSourceId.get(id);
    if (!sourceId) { unresolved++; continue; }
    batch.push({ surface, source_id: sourceId });
    if (batch.length >= BATCH) {
      await flush();
      if (processedLookups % 30000 === 0) {
        process.stdout.write(`  ${processedLookups} lookups → ${totalPairs} pairs\r`);
      }
    }
  }
}
await flush();

console.log(`\n[infl] done: ${processedLookups} lookup rows scanned, ${totalPairs} (surface, headword) pairs queued for insert, ${unresolved} unresolved headword ids`);

const [{ inflCount }] = await sql`SELECT COUNT(*)::int AS "inflCount" FROM dictionary_inflections`;
console.log(`[infl] dictionary_inflections total rows now: ${inflCount}`);

console.log(`[infl] wall: ${Math.round((Date.now() - t0)/1000)}s`);

await sql.end();
sqlite.close();
