// Re-format citation column for all source_edition='cst' passages using
// the current cst-works.mjs formatCstCitation logic. Run this after the
// formatter changes, or once after the bulk ingest finishes.
//
// Use:
//   $env:DATABASE_URL = "postgres://dhamma:PASS@localhost:15432/dhamma"
//   node cst-fix-citations.mjs            # dry run, prints summary
//   node cst-fix-citations.mjs --apply    # actually update rows
//
// Idempotent: only UPDATEs rows whose computed citation differs from
// what's in the DB.

import postgres from 'postgres';
import { workForFile, formatCstCitation } from './cst-works.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 10 });

const rows = await sql`
  SELECT id, citation, xml_div_id, position
    FROM passages
   WHERE source_edition = 'cst'
   ORDER BY id
`;
console.log(`[cst-fix] inspecting ${rows.length} CST passages`);

let updated = 0;
let unchanged = 0;
let unmatched = 0;
const samples = [];

for (const r of rows) {
  // Passage id shape: cst-<basename>-<locator>, where basename is e.g.
  // "s0101a.att" and locator is either an xml_div_id ("dn1_5") or a
  // zero-padded counter ("042"). Recover basename to look up work info.
  const m = r.id.match(/^cst-(.+?\.[a-z]+)-(.+)$/);
  if (!m) { unmatched++; continue; }
  const basename = m[1];
  const work = workForFile(`${basename}.xml`);
  if (!work) { unmatched++; continue; }

  const sectionLocator = r.xml_div_id || r.position;
  if (sectionLocator == null) { unmatched++; continue; }

  const newCitation = formatCstCitation(work.citation_prefix, sectionLocator);
  if (newCitation === r.citation) {
    unchanged++;
    continue;
  }

  if (samples.length < 20) {
    samples.push({ id: r.id, old: r.citation, new: newCitation });
  }
  if (args.apply) {
    await sql`UPDATE passages SET citation = ${newCitation} WHERE id = ${r.id}`;
  }
  updated++;
}

console.log(`[cst-fix] would update: ${updated}; unchanged: ${unchanged}; unmatched: ${unmatched}`);
if (samples.length > 0) {
  console.log(`[cst-fix] sample diffs (first 20):`);
  for (const s of samples) console.log(`  ${s.id}\n    ${s.old}  →  ${s.new}`);
}
if (!args.apply && updated > 0) {
  console.log(`\n[dry-run] re-run with --apply to commit the changes`);
}
await sql.end();
