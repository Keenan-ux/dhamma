// One-shot fix for CST "anya" works whose work_name in the works table
// is the filename basename (e0105n.nrf, etc.) rather than the actual
// title of the text. Re-parses each unmapped file just enough to read
// its <p rend="book"> heading, then UPDATEs works.name.
//
// Safe to re-run — it only touches works whose current name still looks
// like a filename basename. Existing scholarly names are left alone.
//
// Use:
//   $env:DATABASE_URL = "postgres://dhamma:PASS@localhost:15432/dhamma"
//   node fix-cst-work-names.mjs           # dry run, prints diffs
//   node fix-cst-work-names.mjs --apply   # actually update rows

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { parseCstFile } from './cst-parse.mjs';
import { workForFile } from './cst-works.mjs';

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CST_DIR = path.join(__dirname, '.cache', 'cst-test', 'romn');
const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 10 });

const files = fs.readdirSync(CST_DIR).filter((n) => n.endsWith('.xml')).sort();

const updates = new Map();  // work_slug → newName
const skipped = [];

for (const fname of files) {
  const work = workForFile(fname);
  if (!work) continue;
  const baseNoExt = fname.replace(/\.xml$/i, '');
  // workForFile returns work_name === filename only for the fallback
  // path — i.e., works we never explicitly named in cst-works.mjs.
  if (work.work_name !== baseNoExt) continue;

  let parsed;
  try {
    parsed = await parseCstFile(path.join(CST_DIR, fname));
  } catch (err) {
    skipped.push(`${fname}: ${err.message}`);
    continue;
  }
  if (!parsed.work_name || parsed.work_name === baseNoExt) {
    skipped.push(`${fname}: no <p rend="book"> title`);
    continue;
  }
  // First file processed for a slug wins (multi-volume works share a slug
  // but typically only one falls through to the auto-slug path).
  if (!updates.has(work.work_slug)) {
    updates.set(work.work_slug, parsed.work_name);
  }
}

console.log(`[fix-cst-names] candidates: ${updates.size}`);
let changed = 0;
const sample = [];
for (const [slug, newName] of updates) {
  const [{ name: oldName }] = await sql`SELECT name FROM works WHERE slug = ${slug}`;
  if (oldName === newName) continue;
  if (sample.length < 20) sample.push({ slug, oldName, newName });
  if (args.apply) {
    await sql`UPDATE works SET name = ${newName} WHERE slug = ${slug}`;
  }
  changed++;
}

console.log(`[fix-cst-names] ${args.apply ? 'updated' : 'would update'} ${changed} work(s); skipped ${skipped.length}`);
if (sample.length > 0) {
  console.log('sample diffs (first 20):');
  for (const s of sample) console.log(`  ${s.slug}\n    ${s.oldName}  →  ${s.newName}`);
}
if (skipped.length > 0 && skipped.length <= 10) {
  console.log('skipped:');
  for (const s of skipped) console.log(`  ${s}`);
}
if (!args.apply && changed > 0) {
  console.log('\n[dry-run] re-run with --apply to commit');
}

await sql.end();
