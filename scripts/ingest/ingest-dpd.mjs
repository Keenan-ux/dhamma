// Ingest Digital Pali Dictionary (DPD) headwords + inflections into our
// dictionary_entries and dictionary_inflections tables.
//
// Source: github.com/digitalpalidictionary/dpd-db — shallow-clone into
// scripts/ingest/.cache/dpd/. The Python TSV backups in
// db/backup_tsv/dpd_headwords_part_NNN.tsv are the input (3 files, ~119 MB
// total, ~80k entries). No embeddings — definitions don't need vector
// search, just exact / prefix lookup by lemma.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-dpd.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TSV_DIR = path.join(__dirname, '.cache', 'dpd', 'db', 'backup_tsv');
const TSV_FILES = [
  'dpd_headwords_part_001.tsv',
  'dpd_headwords_part_002.tsv',
  'dpd_headwords_part_003.tsv',
];

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });

// Streaming-friendly TSV parser. Pandas writes TSVs with quoted fields
// that may contain embedded tabs, newlines, and doubled quotes. We need a
// state machine, not a naive split.
function* parseTSV(text) {
  let i = 0;
  let row = [];
  let field = '';
  let inQuote = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; }
        else { inQuote = false; i++; }
      } else {
        field += c;
        i++;
      }
    } else {
      if (c === '"') { inQuote = true; i++; }
      else if (c === '\t') { row.push(field); field = ''; i++; }
      else if (c === '\n' || c === '\r') {
        row.push(field);
        yield row;
        row = [];
        field = '';
        while (i < text.length && (text[i] === '\n' || text[i] === '\r')) i++;
      } else { field += c; i++; }
    }
  }
  if (field || row.length) {
    row.push(field);
    yield row;
  }
}

// Map TSV column header → index. Columns we care about — everything else
// in the row stays unused (DPD has 49 columns; we lift the dozen useful ones).
const FIELDS = {
  id:                  null,
  lemma_1:             null,
  lemma_2:             null,
  pos:                 null,
  grammar:             null,
  meaning_1:           null,
  meaning_lit:         null,
  meaning_2:           null,
  sanskrit:            null,
  construction:        null,
  family_root:         null,
  root_key:            null,
  example_1:           null,
  notes:               null,
  inflections_api_ca_eva_iti: null,
};

function clean(s) {
  if (s == null) return null;
  const t = String(s).trim();
  return t.length > 0 ? t : null;
}

const ENTRY_COLS = [
  'source', 'source_id', 'headword_lower', 'lemma', 'lemma_lower', 'language',
  'pos', 'grammar', 'definition', 'definition_lit', 'definition_alt',
  'sanskrit', 'construction', 'root', 'example', 'notes',
];

// Strip the trailing version disambiguator DPD appends to source_ids
// (lemma_1) when multiple senses share the same bare headword. DPD uses
// both integer (sampajāna 1, sampajāna 2) and decimal sub-version
// (dhamma 1.01, sati 1.1) suffixes.
function bareHeadword(sourceId) {
  return String(sourceId || '').replace(/\s+[\d.]+$/, '').trim();
}

const BATCH = 500;

async function ingestFile(filePath) {
  console.log(`[dpd] reading ${path.basename(filePath)}…`);
  const text = fs.readFileSync(filePath, 'utf8');

  let headerSeen = false;
  let entryBatch = [];
  let inflBatch = [];
  let entryRows = 0;
  let inflRows = 0;

  for (const row of parseTSV(text)) {
    if (!headerSeen) {
      // Resolve column indices from header
      for (const key of Object.keys(FIELDS)) {
        const idx = row.indexOf(key);
        FIELDS[key] = idx === -1 ? null : idx;
      }
      if (FIELDS.id == null || FIELDS.lemma_1 == null) {
        throw new Error('TSV header missing expected columns');
      }
      headerSeen = true;
      continue;
    }
    if (row.length < 5) continue; // ragged

    const sourceId = clean(row[FIELDS.lemma_1]);
    const lemma    = clean(row[FIELDS.lemma_2]) || sourceId;
    const meaning  = clean(row[FIELDS.meaning_1]);
    if (!sourceId || !lemma || !meaning) continue;

    const entry = {
      source:         'dpd',
      source_id:      sourceId,
      headword_lower: bareHeadword(sourceId).toLowerCase(),
      lemma,
      lemma_lower:    lemma.toLowerCase(),
      language:       'pli',
      pos:            clean(row[FIELDS.pos]),
      grammar:        clean(row[FIELDS.grammar]),
      definition:     meaning,
      definition_lit: clean(row[FIELDS.meaning_lit]),
      definition_alt: clean(row[FIELDS.meaning_2]),
      sanskrit:       clean(row[FIELDS.sanskrit]),
      construction:   clean(row[FIELDS.construction]),
      root:           clean(row[FIELDS.family_root]) || clean(row[FIELDS.root_key]),
      example:        clean(row[FIELDS.example_1]),
      notes:          clean(row[FIELDS.notes]),
    };
    entryBatch.push(entry);

    // Inflections — the DPD field is a comma-separated list of surface
    // forms. May be quoted/empty; skip if absent. Stash with the source_id
    // so we can resolve to entry_id after insert.
    const inflRaw = clean(row[FIELDS.inflections_api_ca_eva_iti]);
    if (inflRaw) {
      const forms = inflRaw.split(',').map((s) => s.trim()).filter(Boolean);
      for (const f of forms) {
        inflBatch.push({ source_id: sourceId, surface_lower: f.toLowerCase() });
      }
    }

    if (entryBatch.length >= BATCH) {
      await flushEntries(entryBatch);
      entryRows += entryBatch.length;
      entryBatch = [];
      process.stdout.write(`  entries ${entryRows}\r`);
    }
    if (inflBatch.length >= 5000) {
      await flushInflections(inflBatch);
      inflRows += inflBatch.length;
      inflBatch = [];
    }
  }

  if (entryBatch.length) { await flushEntries(entryBatch); entryRows += entryBatch.length; }
  if (inflBatch.length)  { await flushInflections(inflBatch); inflRows += inflBatch.length; }

  console.log(`\n[dpd] ${path.basename(filePath)} → entries +${entryRows}, inflections +${inflRows}`);
}

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

async function flushInflections(batch) {
  // Need entry_id for FK — look up by (source, source_id).
  // Batch-resolve via a single CTE-style INSERT that joins through dictionary_entries.
  const sourceIds = batch.map((b) => b.source_id);
  const surfaces  = batch.map((b) => b.surface_lower);
  await sql`
    INSERT INTO dictionary_inflections (surface_lower, entry_id)
    SELECT b.surface_lower, de.id
    FROM unnest(${surfaces}::text[], ${sourceIds}::text[]) AS b(surface_lower, source_id)
    JOIN dictionary_entries de ON de.source = 'dpd' AND de.source_id = b.source_id
    ON CONFLICT DO NOTHING
  `;
}

const t0 = Date.now();
console.log('[dpd] ensuring schema…');
// schema.sql is applied by the server on boot; here we just verify the
// tables exist before we start writing.
const [{ exists }] = await sql`
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dictionary_entries') AS exists
`;
if (!exists) {
  console.error('dictionary_entries table not present — apply server/sql/schema.sql first');
  process.exit(1);
}

for (const f of TSV_FILES) {
  const full = path.join(TSV_DIR, f);
  if (!fs.existsSync(full)) {
    console.warn(`[dpd] missing ${full}, skipping`);
    continue;
  }
  await ingestFile(full);
}

const [{ entries }] = await sql`SELECT COUNT(*)::int AS entries FROM dictionary_entries WHERE source = 'dpd'`;
const [{ infls }]   = await sql`SELECT COUNT(*)::int AS infls   FROM dictionary_inflections`;
console.log(`\n[dpd] done in ${Math.round((Date.now() - t0)/1000)}s — entries: ${entries}, inflections: ${infls}`);

await sql.end();
