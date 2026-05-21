// Ingest non-Sujato SuttaCentral English translators into the translations
// multi-translator table. The original ingest.mjs pass only loaded
// translation/en/sujato/… and stored it in passages.translation; SC has
// substantial coverage from other CC0 contributors that the reader's
// translator-chip switcher should expose alongside Sujato + the ATI
// translators.
//
// Pattern mirrors ingest-ati.mjs — one row per (passage, translator)
// with full attribution (translator full name, source='sc', license='cc0',
// source_url pointing back to suttacentral.net). The reader uses these
// rows to populate the translator chip row above each passage.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-sc-translators.mjs            # dry-run (counts only)
//   node ingest-sc-translators.mjs --apply    # write rows

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
const AUTHOR_JSON = path.join(BILARA, '_author.json');
const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 10 });

// Sujato is excluded — already covered by ingest.mjs into passages.translation
// (and a separate flow into translations). The rest are CC0 community
// translators with meaningful coverage on SC.
//
// `soma` is also excluded: bilara's `soma` slug refers to Ayya Soma (a
// contemporary nun), but the ATI corpus already populates `translator='soma'`
// with the late Soma Thera (canonical attribution for the slug in
// scholarly literature). Ingesting bilara's Ayya Soma under the same slug
// would render her work under "Soma Thera" in PassageCard's chip label
// without a way to disambiguate at display time. Skip until the chip
// labelling carries source-awareness.
const TRANSLATORS = ['brahmali', 'anandajoti', 'kelly', 'kovilo', 'patton', 'suddhaso'];

const authors = JSON.parse(fs.readFileSync(AUTHOR_JSON, 'utf8'));
function translatorFullName(slug) {
  const a = authors[slug];
  return a?.name || slug;
}

// Walk a translator's directory and yield { id, filepath } for each file.
function* walkTranslator(translator) {
  const root = path.join(BILARA, 'translation', 'en', translator);
  if (!fs.existsSync(root)) return;
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) { stack.push(full); continue; }
      const m = name.match(new RegExp(`^(.+)_translation-en-${translator}\\.json$`));
      if (m) yield { id: m[1], filepath: full };
    }
  }
}

// Join all segment values into one normalised text blob. bilara files
// are { "<segment-id>": "text", … } in insertion order; Object.values
// preserves that, so the joined text reflects the segment order.
function loadJoined(filePath) {
  try {
    const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Object.values(obj).join(' ').replace(/\s+/g, ' ').trim();
  } catch {
    return null;
  }
}

// SC source-url for a translation. Pattern matches the SuttaCentral live
// URL — /<id>/en/<translator> renders that translator's English. Built
// here rather than relying on bilara metadata since the source_url field
// is what the reader links the attribution chip to.
function sourceUrlFor(passageId, translator) {
  return `https://suttacentral.net/${passageId}/en/${translator}`;
}

// Build the set of valid passage IDs so we can skip translation files for
// which we don't have a passage row — translations.passage_id is a FK.
const passageRows = await sql`SELECT id FROM passages`;
const validPassages = new Set(passageRows.map((r) => r.id));
console.log(`[passages] ${validPassages.size} rows in passages table`);

let totalPlanned = 0;
let totalSkipped = 0;
const perTranslator = new Map();
const batch = [];
const BATCH = 200;

async function flush() {
  if (batch.length === 0) return;
  if (args.apply) {
    await sql`
      INSERT INTO translations
        (passage_id, language, translator, source, text, copyright, license, source_url, notes, position)
      VALUES ${sql(batch.map((r) => [
        r.passage_id, 'en', r.translator, 'sc', r.text,
        r.copyright, 'cc0', r.source_url, r.notes, null,
      ]))}
      ON CONFLICT (passage_id, translator, source) DO UPDATE SET
        text       = EXCLUDED.text,
        copyright  = EXCLUDED.copyright,
        license    = EXCLUDED.license,
        source_url = EXCLUDED.source_url,
        notes      = EXCLUDED.notes
    `;
  }
  batch.length = 0;
}

for (const slug of TRANSLATORS) {
  const fullName = translatorFullName(slug);
  let count = 0;
  let skip  = 0;
  for (const { id, filepath } of walkTranslator(slug)) {
    if (!validPassages.has(id)) { skip++; continue; }
    const text = loadJoined(filepath);
    if (!text) { skip++; continue; }
    batch.push({
      passage_id: id,
      translator: slug,
      text,
      copyright: fullName,
      source_url: sourceUrlFor(id, slug),
      notes: `bilara-data translation/en/${slug}`,
    });
    count++;
    if (batch.length >= BATCH) await flush();
  }
  perTranslator.set(slug, { count, skip, fullName });
  totalPlanned += count;
  totalSkipped += skip;
}
await flush();

console.log(`\n[summary] ${args.apply ? 'inserted' : 'would insert'}: ${totalPlanned} rows  ·  skipped: ${totalSkipped}`);
for (const [slug, info] of perTranslator) {
  console.log(`  ${slug.padEnd(12)} ${info.count.toString().padStart(5)} rows  (${info.fullName}; ${info.skip} skipped)`);
}

if (!args.apply && totalPlanned > 0) {
  console.log('\n[dry-run] re-run with --apply to write rows');
}

await sql.end();
