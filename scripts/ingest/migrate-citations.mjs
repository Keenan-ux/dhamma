// One-shot migration: rewrite existing passages.citation values using the
// improved formatCitation() from ingest.mjs. Necessary because INSERT ...
// ON CONFLICT DO UPDATE excluded citation until this commit, so the Vinaya
// passages already on disk (or partially ingested) have ugly raw-id
// citations like "PLI-TV-BI-VB-PJ1-4" instead of "Bi Pj 1-4".
//
// Idempotent. Safe to re-run.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node migrate-citations.mjs

import postgres from 'postgres';
import { formatCitation } from './format-citation.mjs';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

console.log('[migrate-citations] reading all passage ids…');
const rows = await sql`SELECT id, citation FROM passages`;
console.log(`  ${rows.length} rows`);

let changed = 0;
const samples = [];
for (const r of rows) {
  const newCitation = formatCitation(r.id);
  if (newCitation !== r.citation) {
    await sql`UPDATE passages SET citation = ${newCitation} WHERE id = ${r.id}`;
    changed++;
    if (samples.length < 12) samples.push({ id: r.id, before: r.citation, after: newCitation });
  }
}

console.log(`\n[migrate-citations] updated ${changed} of ${rows.length} citations`);
if (samples.length > 0) {
  console.log('\nsample changes:');
  for (const s of samples) {
    console.log(`  ${s.id.padEnd(28)} ${s.before.padEnd(28)} → ${s.after}`);
  }
}

await sql.end();
