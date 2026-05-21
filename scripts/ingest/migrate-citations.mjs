// One-shot migration: rewrite passages.citation for Theravāda Vinaya rows
// using the formatCitation() in ./format-citation.mjs. Originally written
// to fix raw "PLI-TV-BI-VB-PJ1-4" citations; rerun whenever the Vinaya
// formatter changes (e.g. when we moved to "Bhi. Pj. 1-4" style).
//
// SCOPE: only `pli-tv-%` ids. The CST commentary/extra-canonical rows
// were populated by separate formatters (in their respective ingest
// scripts) and `formatCitation` does NOT understand their id scheme —
// running it across them would clobber clean citations like "Sv-a 10",
// "Mp-a an8.1.5", "As §1" with raw uppercase ids.
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

console.log('[migrate-citations] reading Vinaya passage ids…');
const rows = await sql`SELECT id, citation FROM passages WHERE id LIKE 'pli-tv-%'`;
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
