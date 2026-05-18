// Fill the gap between our 62k dictionary_entries and DPD's 88,864
// dpd_headwords. The 27k missing entries are DPD headwords with empty
// meaning_1 — typically inflected forms or compounds that DPD lists as
// distinct headwords but defines via grammar/derived_from cross-refs
// (e.g. id=21 'akaḍḍhi' meaning '' but grammar='aor of akaḍḍhati').
//
// For these, derive a useful 'definition' field from grammar + derived_from
// so the user lookup-popover still shows something actionable.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-dpd-missing.mjs

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE = path.join(__dirname, '.cache', 'dpd-released', 'dpd.db');

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const sqlite = new DatabaseSync(SQLITE, { readOnly: true });
const sql    = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 20 });

function bareHeadword(sourceId) {
  return String(sourceId || '').replace(/\s+[\d.]+$/, '').trim();
}

function clean(s) {
  if (s == null) return null;
  const t = String(s).trim();
  return t.length > 0 ? t : null;
}

function deriveDefinition(grammar, derivedFrom, lemma) {
  // Build a fallback definition from the grammar tag. DPD's grammar field
  // for inflected-headword entries reads like 'aor of akaḍḍhati' or
  // 'pp of na karoti' — useful as a cross-reference.
  const g = clean(grammar);
  if (g) return g;
  const d = clean(derivedFrom);
  if (d) return `derived from ${d}`;
  return `(grammatical form of ${lemma})`;
}

const ENTRY_COLS = [
  'source', 'source_id', 'headword_lower', 'lemma', 'lemma_lower', 'language',
  'pos', 'grammar', 'definition', 'definition_lit', 'definition_alt',
  'sanskrit', 'construction', 'root', 'example', 'notes',
];

console.log('[missing] scanning dpd_headwords for entries with empty meaning_1…');
const rows = sqlite.prepare(`
  SELECT id, lemma_1, lemma_2, pos, grammar, derived_from, construction,
         family_root, root_key, sanskrit
  FROM dpd_headwords
  WHERE meaning_1 IS NULL OR meaning_1 = ''
`).all();
console.log(`  ${rows.length} candidates`);

const BATCH = 500;
let inserted = 0;
let batch = [];

async function flush() {
  if (batch.length === 0) return;
  await sql`
    INSERT INTO dictionary_entries ${sql(batch, ...ENTRY_COLS)}
    ON CONFLICT (source, source_id) DO NOTHING
  `;
  inserted += batch.length;
  batch = [];
}

for (const r of rows) {
  const sourceId = clean(r.lemma_1);
  const lemma    = clean(r.lemma_2) || sourceId;
  if (!sourceId || !lemma) continue;

  const entry = {
    source:         'dpd',
    source_id:      sourceId,
    headword_lower: bareHeadword(sourceId).toLowerCase(),
    lemma,
    lemma_lower:    lemma.toLowerCase(),
    language:       'pli',
    pos:            clean(r.pos),
    grammar:        clean(r.grammar),
    definition:     deriveDefinition(r.grammar, r.derived_from, lemma),
    definition_lit: null,
    definition_alt: null,
    sanskrit:       clean(r.sanskrit),
    construction:   clean(r.construction),
    root:           clean(r.family_root) || clean(r.root_key),
    example:        null,
    notes:          null,
  };
  batch.push(entry);
  if (batch.length >= BATCH) {
    await flush();
    if (inserted % 5000 === 0) process.stdout.write(`  ${inserted}\r`);
  }
}
await flush();

const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM dictionary_entries WHERE source = 'dpd'`;
console.log(`\n[missing] queued ${inserted}, dictionary_entries total now: ${total}`);

sqlite.close();
await sql.end();
