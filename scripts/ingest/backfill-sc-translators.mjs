// Backfill missing SC translations from translators the original ingest
// didn't check. The first ingest only loaded translation/en/sujato/…
// but bilara-data also ships:
//   brahmali     — Vinaya (~420 passages, currently 0 translated in DB)
//   anandajoti   — verses
//   kelly,kovilo,patton,soma,suddhaso — scattered
//
// For each SC passage in our DB that's missing a translation, try each
// translator's file path and fill in the first hit.
//
// Use:
//   node backfill-sc-translators.mjs           # dry-run
//   node backfill-sc-translators.mjs --apply

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BILARA = path.join(__dirname, '.cache', 'bilara-data');
const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 10 });

// Translators to try, in fallback order. Sujato isn't included because
// the original ingest already tried him and stored the result if found.
const TRANSLATORS = ['brahmali', 'anandajoti', 'kelly', 'kovilo', 'patton', 'soma', 'suddhaso'];

// Walk a translator's directory to build id → filepath index.
function buildIndex(translator) {
  const root = path.join(BILARA, 'translation', 'en', translator);
  if (!fs.existsSync(root)) return new Map();
  const idx = new Map();
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (name.endsWith(`_translation-en-${translator}.json`)) {
        const id = name.replace(`_translation-en-${translator}.json`, '');
        idx.set(id, full);
      }
    }
  }
  walk(root);
  return idx;
}

const translatorIndex = new Map();
for (const t of TRANSLATORS) {
  const idx = buildIndex(t);
  translatorIndex.set(t, idx);
  console.log(`[index] ${t}: ${idx.size} files`);
}

// Pull SC passages still without a translation.
const missing = await sql`
  SELECT id FROM passages
  WHERE source_edition='sc'
    AND (translation IS NULL OR length(trim(translation)) = 0)
  ORDER BY id
`;
console.log(`[backfill] ${missing.length} SC passages missing translation`);

function loadJoined(filePath) {
  try {
    const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Object.values(obj).join(' ').replace(/\s+/g, ' ').trim();
  } catch (err) { return null; }
}

let filled = 0, stillMissing = 0;
const perTranslator = new Map();
const sample = [];

for (const row of missing) {
  let chosen = null;
  for (const t of TRANSLATORS) {
    const fp = translatorIndex.get(t).get(row.id);
    if (!fp) continue;
    const text = loadJoined(fp);
    if (!text) continue;
    chosen = { translator: t, text };
    break;
  }
  if (!chosen) { stillMissing++; continue; }
  perTranslator.set(chosen.translator, (perTranslator.get(chosen.translator) || 0) + 1);
  if (sample.length < 5) sample.push({ id: row.id, t: chosen.translator, len: chosen.text.length });
  if (args.apply) {
    await sql`UPDATE passages SET translation = ${chosen.text},
                                 notes = ${`translation backfilled from bilara ${chosen.translator}`}
              WHERE id = ${row.id}`;
  }
  filled++;
}

console.log(`\n[backfill] ${args.apply ? 'filled' : 'would fill'}: ${filled}, still-missing: ${stillMissing}`);
for (const [t, n] of perTranslator) console.log(`  ${t}: ${n}`);
if (sample.length > 0) {
  console.log('\nsample:');
  for (const s of sample) console.log(`  ${s.id.padEnd(24)} ${s.t}  (${s.len} chars)`);
}
if (!args.apply && filled > 0) console.log('\n[dry-run] re-run with --apply');
await sql.end();
