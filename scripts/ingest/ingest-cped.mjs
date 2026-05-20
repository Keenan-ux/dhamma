// Ingest the Concise Pali-English Dictionary (Buddhadatta 1949,
// edited by Ven. Ānandajoti) into dictionary_entries with
// source='cped', language='pli'. A compact Pali-English dictionary,
// roughly 21k entries, complementing DPD's 88k headwords + 727k
// inflections with Buddhadatta's terse, classroom-friendly glosses.
//
// Source: github.com/digitalpalidictionary/other-dictionaries —
//   dictionaries/abt/abt.tar.zst (Ven. Ānandajoti's edition of
//   Buddhadatta's CPED, from ancient-buddhist-texts.net). The
//   archive contains a single CPED.csv with pipe-delimited rows:
//     headword | definition\n
//   The first byte is a UTF-8 BOM; skip it.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   curl -sL -o abt.tar.zst \
//     https://raw.githubusercontent.com/digitalpalidictionary/other-dictionaries/main/dictionaries/abt/abt.tar.zst
//   node -e "import('node:fs').then(({default:fs})=>{const z=require('node:zlib');fs.writeFileSync('abt.tar',z.zstdDecompressSync(fs.readFileSync('abt.tar.zst')))})"
//   tar -xf abt.tar
//   DATABASE_URL=... node ingest-cped.mjs
//
// Notes
// - language='pli' — surfaces under default Pali lookups alongside
//   DPD, DPPN, PED.
// - Headwords are already IAST. Buddhadatta uses ṁ (anusvāra) where
//   modern editions use ṃ; we keep ṁ as-is — the lemma_lower index
//   captures both via search if needed.
// - Buddhadatta died 1962; original CPED published 1949 by PTS.
//   Ānandajoti's edition publishes freely via ancient-buddhist-texts
//   (he releases everything for free online; PTS materials carry
//   CC BY-NC 4.0). We attribute "Buddhadatta 1949, ed. Ānandajoti,
//   via Ancient Buddhist Texts" in the source label.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CPED_FILE = path.join(__dirname, 'CPED.csv');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
if (!fs.existsSync(CPED_FILE)) {
  console.error(`missing ${CPED_FILE} — download abt.tar.zst from`);
  console.error('  https://github.com/digitalpalidictionary/other-dictionaries/raw/main/dictionaries/abt/abt.tar.zst');
  console.error('then decompress with `node -e "..."` and `tar -xf abt.tar` (see header comment)');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: false });

// CPED rows are "headword | definition". The pipe is the literal
// separator; definitions can contain commas, semicolons, parens,
// etc., so we split on the FIRST " | " only.
function parseRow(line) {
  const idx = line.indexOf(' | ');
  if (idx === -1) return null;
  const headword = line.slice(0, idx).trim();
  const definition = line.slice(idx + 3).trim();
  if (!headword || !definition) return null;
  return { headword, definition };
}

async function main() {
  console.log('Reading CPED.csv...');
  let raw = fs.readFileSync(CPED_FILE, 'utf8');
  // Strip UTF-8 BOM if present.
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());

  const entries = [];
  const skipped = [];
  for (const line of lines) {
    const r = parseRow(line);
    if (!r) { skipped.push(line.slice(0, 80)); continue; }
    entries.push({
      source: 'cped',
      source_id: r.headword,                // headword is unique enough
      headword_lower: r.headword.toLowerCase(),
      lemma: r.headword,
      lemma_lower: r.headword.toLowerCase(),
      language: 'pli',
      pos: null,
      grammar: null,
      definition: r.definition,
    });
  }
  console.log(`Parsed ${entries.length} entries (${skipped.length} skipped).`);
  if (skipped.length > 0 && skipped.length < 10) {
    console.log('Skipped lines:', skipped);
  }

  // Dedup on source_id (headword) — a handful of duplicate spellings
  // exist; first-wins keeps the alphabetically earliest definition.
  const seen = new Set();
  const unique = entries.filter((e) => {
    if (seen.has(e.source_id)) return false;
    seen.add(e.source_id);
    return true;
  });
  console.log(`After dedup: ${unique.length} entries (${entries.length - unique.length} duplicates dropped).`);

  console.log('Clearing existing cped rows...');
  const del = await sql`DELETE FROM dictionary_entries WHERE source = 'cped'`;
  console.log(`Deleted ${del.count} existing cped rows.`);

  // Batch insert. unnest is fastest for pure-SQL bulk loads via
  // postgres-js. Same pattern as ingest-bhs.mjs.
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < unique.length; i += BATCH) {
    const slice = unique.slice(i, i + BATCH);
    await sql`
      INSERT INTO dictionary_entries
        (source, source_id, headword_lower, lemma, lemma_lower, language, pos, grammar, definition)
      VALUES ${sql(slice.map((e) => [
        e.source, e.source_id, e.headword_lower, e.lemma, e.lemma_lower,
        e.language, e.pos, e.grammar, e.definition,
      ]))}
      ON CONFLICT (source, source_id) DO UPDATE SET
        headword_lower = EXCLUDED.headword_lower,
        lemma = EXCLUDED.lemma,
        lemma_lower = EXCLUDED.lemma_lower,
        definition = EXCLUDED.definition
    `;
    inserted += slice.length;
    if (inserted % 2000 < BATCH) process.stdout.write(`  ${inserted}/${unique.length}\r`);
  }
  console.log(`\nInserted ${inserted} CPED entries.`);

  await sql.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
