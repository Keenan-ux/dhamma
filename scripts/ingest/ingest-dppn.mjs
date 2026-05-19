// Ingest the Dictionary of Pali Proper Names (Malalasekera 1937-38,
// revised by Ven. Ānandajoti 2025) into dictionary_entries with
// source='dppn'.
//
// Source: ancient-buddhist-texts.net/ts/DPPN/DPPN.json — fetched into
// scripts/ingest/.cache/dppn/DPPN.json. Shape: [{name, entry}, ...]
// where name and entry are two halves of an HTML <p> paragraph.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-dppn.mjs
//
// Notes
// - 13,641 input rows. 38 are alphabet-section <p class="Heading3">
//   dividers (skip). Net ~13,603 real entries.
// - lemma = bare content of first <b>...</b> in `name`. headword_lower
//   = lemma.toLowerCase(). All Sāriputta 01-05 share lemma="Sāriputta",
//   distinguished by source_id.
// - source_id = HTML-stripped content of <span class="Head">. Captures
//   the visible disambiguation ("Sāriputta 01", "Aravāḷa-daha"). 29
//   true duplicates (e.g. two distinct rivers both named "Aciravatī")
//   are auto-numbered " 2", " 3" matching the source's own scheme.
// - definition = name + entry concatenated (the full original HTML
//   paragraph). Keeps bold cross-refs, italic v.l., <abbr> tooltips on
//   sutta references intact for the UI to render.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_FILE = path.join(__dirname, '.cache', 'dppn', 'DPPN.json');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
if (!fs.existsSync(JSON_FILE)) {
  console.error(`missing ${JSON_FILE} — fetch with curl from ancient-buddhist-texts.net/ts/DPPN/DPPN.json`);
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });

const stripHtml = (s) =>
  String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const trimTrailingDot = (s) => s.replace(/\.+\s*$/, '').trim();

function extractEntry(row) {
  const name = String(row.name ?? '');
  // Section heading rows (alphabet dividers) — not real entries.
  if (/class="Heading[0-9]/.test(name)) return null;

  // Bare lemma: first <b>...</b> inside <span class="Head">.
  const bMatch = name.match(/<span class="Head">[\s\S]*?<b>([^<]+)<\/b>/);
  if (!bMatch) return null;
  const lemma = bMatch[1].trim();

  // Visible head text (lemma + any disambiguator/variant marker).
  // Falls back to bare lemma if the span shape ever changes.
  const headMatch = name.match(/<span class="Head">([\s\S]*?)<\/span>/);
  const fullHead = headMatch ? trimTrailingDot(stripHtml(headMatch[1])) : lemma;

  return {
    lemma,
    fullHead,
    definition: name + String(row.entry ?? ''),
  };
}

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

console.log('[dppn] verifying schema…');
const [{ exists }] = await sql`
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dictionary_entries') AS exists
`;
if (!exists) {
  console.error('dictionary_entries table not present — apply server/sql/schema.sql first');
  process.exit(1);
}

console.log(`[dppn] reading ${path.basename(JSON_FILE)}…`);
const rows = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
console.log(`[dppn] ${rows.length} rows in source`);

const occurrence = new Map();
let batch = [];
let inserted = 0;
let skippedHeading = 0;
let skippedNoLemma = 0;
let collisionResolved = 0;

for (const row of rows) {
  const ex = extractEntry(row);
  if (!ex) {
    if (/class="Heading[0-9]/.test(String(row.name ?? ''))) skippedHeading++;
    else skippedNoLemma++;
    continue;
  }

  // Auto-number unnumbered duplicates: "Aciravatī" → "Aciravatī", "Aciravatī 2", …
  const seen = (occurrence.get(ex.fullHead) ?? 0) + 1;
  occurrence.set(ex.fullHead, seen);
  const sourceId = seen === 1 ? ex.fullHead : `${ex.fullHead} ${seen}`;
  if (seen > 1) collisionResolved++;

  batch.push({
    source:         'dppn',
    source_id:      sourceId,
    headword_lower: ex.lemma.toLowerCase(),
    lemma:          ex.lemma,
    lemma_lower:    ex.lemma.toLowerCase(),
    language:       'pli',
    pos:            'name',
    grammar:        null,
    definition:     ex.definition,
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
  SELECT COUNT(*)::int AS count FROM dictionary_entries WHERE source = 'dppn'
`;

console.log(`\n[dppn] done in ${Math.round((Date.now() - t0)/1000)}s`);
console.log(`  source rows:        ${rows.length}`);
console.log(`  skipped (heading):  ${skippedHeading}`);
console.log(`  skipped (no lemma): ${skippedNoLemma}`);
console.log(`  inserted/updated:   ${inserted}`);
console.log(`  duplicate keys auto-numbered: ${collisionResolved}`);
console.log(`  total source=dppn in DB:      ${count}`);

await sql.end();
