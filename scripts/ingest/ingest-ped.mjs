// Ingest the PTS Pali-English Dictionary (Rhys Davids & Stede, 1921-25;
// corrected reprint 2015; digitized by Buddhadust, proofread 2021) into
// dictionary_entries with source='ped'.
//
// Source: github.com/vpnry/ptsped — Tabfile_PTSPED-2021.zip (Romanized
// variant) extracted to scripts/ingest/.cache/ped/PTSPED-2021. Format
// is `headword\thtml-definition`, one entry per line. ~15,702 entries.
//
// License: CC BY-NC 3.0 — non-commercial use with attribution to PTS
// and Buddhadust. Dhamma is a non-commercial scholarly tool, so this
// is compatible. Attribution lives in src/dictHtml.js SOURCE_LABEL.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-ped.mjs
//
// Notes
// - First 3 lines are metadata (000License, 001info, 002info). Skip.
// - Headwords are lowercase Pali with diacritics (`dhamma`, `nibbāna`).
// - One row per headword — no duplicates. PED merges multiple senses
//   inline via <sup>1</sup>, <sup>2</sup> in the bold lemma at the
//   start of the body (e.g. <b>Dhamma<sup>1</sup></b>...
//   <b>Dhamma<sup>2</sup></b>...).
// - definition stays HTML; sanitized at render time in the frontend.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TSV_FILE = path.join(__dirname, '.cache', 'ped', 'PTSPED-2021');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
if (!fs.existsSync(TSV_FILE)) {
  console.error(`missing ${TSV_FILE} — unzip Tabfile_PTSPED-2021.zip from vpnry/ptsped`);
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });

const ENTRY_COLS = [
  'source', 'source_id', 'headword_lower', 'lemma', 'lemma_lower', 'language',
  'pos', 'grammar', 'definition', 'definition_lit', 'definition_alt',
  'sanskrit', 'construction', 'root', 'example', 'notes',
];

const BATCH = 500;

async function flushEntries(batch) {
  await sql`
    INSERT INTO dictionary_entries ${sql(batch, ...ENTRY_COLS)}
    ON CONFLICT (source, source_id) DO UPDATE SET
      headword_lower = EXCLUDED.headword_lower,
      lemma          = EXCLUDED.lemma,
      lemma_lower    = EXCLUDED.lemma_lower,
      pos            = EXCLUDED.pos,
      grammar        = EXCLUDED.grammar,
      definition     = EXCLUDED.definition,
      definition_lit = EXCLUDED.definition_lit,
      definition_alt = EXCLUDED.definition_alt,
      sanskrit       = EXCLUDED.sanskrit,
      construction   = EXCLUDED.construction,
      root           = EXCLUDED.root,
      example        = EXCLUDED.example,
      notes          = EXCLUDED.notes
  `;
}

const t0 = Date.now();

console.log('[ped] verifying schema…');
const [{ exists }] = await sql`
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dictionary_entries') AS exists
`;
if (!exists) {
  console.error('dictionary_entries table not present — apply server/sql/schema.sql first');
  process.exit(1);
}

console.log(`[ped] reading ${path.basename(TSV_FILE)}…`);
const text = fs.readFileSync(TSV_FILE, 'utf8');
const lines = text.split('\n');
console.log(`[ped] ${lines.length} lines in source (first 3 are metadata, skipped)`);

let batch = [];
let inserted = 0;
let skippedMeta = 0;
let skippedMalformed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.length) continue;

  const tab = line.indexOf('\t');
  if (tab < 0) { skippedMalformed++; continue; }

  const headword = line.slice(0, tab).trim();
  const definition = line.slice(tab + 1);

  // PED tab file leads with three metadata rows whose "headwords" are
  // "000License", "001info", "002info" — drop them along with anything
  // else matching that prefix shape, just in case.
  if (/^00\d/.test(headword)) { skippedMeta++; continue; }
  if (!headword || !definition) { skippedMalformed++; continue; }

  const lower = headword.toLowerCase();
  batch.push({
    source:         'ped',
    source_id:      headword,
    headword_lower: lower,
    lemma:          headword,
    lemma_lower:    lower,
    language:       'pli',
    pos:            null,
    grammar:        null,
    definition,
    definition_lit: null,
    definition_alt: null,
    sanskrit:       null,
    construction:   null,
    root:           null,
    example:        null,
    notes:          null,
  });

  if (batch.length >= BATCH) {
    await flushEntries(batch);
    inserted += batch.length;
    batch = [];
    process.stdout.write(`  entries ${inserted}\r`);
  }
}

if (batch.length) {
  await flushEntries(batch);
  inserted += batch.length;
}

const [{ count }] = await sql`
  SELECT COUNT(*)::int AS count FROM dictionary_entries WHERE source = 'ped'
`;

console.log(`\n[ped] done in ${Math.round((Date.now() - t0)/1000)}s`);
console.log(`  source lines:        ${lines.length}`);
console.log(`  skipped (metadata):  ${skippedMeta}`);
console.log(`  skipped (malformed): ${skippedMalformed}`);
console.log(`  inserted/updated:    ${inserted}`);
console.log(`  total source=ped in DB: ${count}`);

await sql.end();
