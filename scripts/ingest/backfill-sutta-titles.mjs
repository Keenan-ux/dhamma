// Backfill Pali + English sutta names into passages.title / title_en.
//
// Each SC bilara file has a few "preamble" segments (:0.x) before the
// body (:1.1+). The convention SC uses for canonical sutta files is:
//   :0.1  Collection name ("Saṁyutta Nikāya 36.2", "Linked Discourses 36.2")
//   :0.2  Vagga / chapter ("1. Sagāthāvagga", "1. With Verses")
//   :0.3  Sutta name        ("Sukhasutta",        "Pleasure")
//
// Vagga isn't present on every passage (Khuddaka has different
// structure, KN single-text works skip vagga). To stay generic we
// pull the LAST :0.x segment, which is reliably the sutta name even
// when the preamble has fewer or more entries than expected.
//
// CST commentary / ṭīkā / extra-canonical passages don't share this
// segmentation convention, so this script only touches passages where
// source_edition='sc'.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '.cache', 'bilara-data', 'root', 'pli', 'ms');
const TR = path.join(__dirname, '.cache', 'bilara-data', 'translation', 'en', 'sujato');

const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

// One-shot schema migration: add the new column if it doesn't exist.
await sql`ALTER TABLE passages ADD COLUMN IF NOT EXISTS title_en TEXT`;

// Walk a directory tree recursively and yield every *_root-pli-ms.json.
function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && e.name.endsWith('_root-pli-ms.json')) yield full;
  }
}

function lastPreambleSegment(obj) {
  // Returns the value of the highest-numbered :0.N key, trimmed.
  let bestKey = null;
  let bestN = -1;
  for (const key of Object.keys(obj)) {
    const m = key.match(/:0\.(\d+)$/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (n > bestN) { bestN = n; bestKey = key; }
  }
  if (!bestKey) return null;
  const v = obj[bestKey];
  return typeof v === 'string' ? v.trim() : null;
}

function parseId(filename) {
  const m = filename.match(/^([a-z][a-z-]*\d[\w\d.-]*)_root-pli-ms\.json$/);
  return m ? m[1] : null;
}

let updated = 0;
let skipped = 0;
let noMatch = 0;
const batch = [];
const BATCH_SIZE = 200;

async function flush() {
  if (batch.length === 0) return;
  // Use unnest for a single round-trip per batch.
  const ids = batch.map((r) => r.id);
  const titles = batch.map((r) => r.title);
  const titles_en = batch.map((r) => r.title_en);
  await sql`
    UPDATE passages AS p
       SET title    = COALESCE(NULLIF(u.title, ''),    p.title),
           title_en = COALESCE(NULLIF(u.title_en, ''), p.title_en)
      FROM (
        SELECT * FROM unnest(${ids}::text[], ${titles}::text[], ${titles_en}::text[]) AS t(id, title, title_en)
      ) AS u
     WHERE p.id = u.id AND p.source_edition = 'sc'
  `;
  batch.length = 0;
}

console.log(`[scan] walking ${ROOT}…`);
for (const paliPath of walk(ROOT)) {
  const base = path.basename(paliPath);
  const id = parseId(base);
  if (!id) { skipped++; continue; }

  let paliObj;
  try { paliObj = JSON.parse(fs.readFileSync(paliPath, 'utf8')); }
  catch { skipped++; continue; }

  const titlePali = lastPreambleSegment(paliObj);

  // English title lives in the sibling translation file with a parallel
  // path: root/pli/ms/... → translation/en/sujato/...
  const rel = path.relative(ROOT, paliPath);
  const enPath = path.join(TR, rel
    .replace(/_root-pli-ms\.json$/, '_translation-en-sujato.json'));
  let titleEn = null;
  if (fs.existsSync(enPath)) {
    try {
      const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
      titleEn = lastPreambleSegment(enObj);
    } catch { /* skip */ }
  }

  if (!titlePali && !titleEn) { noMatch++; continue; }

  batch.push({ id, title: titlePali || '', title_en: titleEn || '' });
  if (batch.length >= BATCH_SIZE) {
    await flush();
    updated += BATCH_SIZE;
    if (updated % 1000 === 0) console.log(`  ${updated} updated`);
  }
}
await flush();
updated += batch.length;
console.log(`\n[done] updated=${updated}  skipped=${skipped}  no_preamble=${noMatch}`);

const sample = await sql`
  SELECT id, citation, title, title_en
    FROM passages
   WHERE id IN ('sn36.2', 'mn10', 'dn22', 'snp1.8', 'an1.1')
   ORDER BY id`;
console.log('\nSpot check:');
for (const r of sample) console.log(`  ${r.id.padEnd(10)}  ${r.citation.padEnd(10)}  ${(r.title || '').padEnd(28)}  ${r.title_en || ''}`);

await sql.end();
