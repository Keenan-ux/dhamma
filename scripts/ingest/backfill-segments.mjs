// Backfill passages.segments JSONB from bilara-data cache.
//
// Each SC bilara passage exists as two parallel JSON files:
//   root/pli/ms/.../<id>_root-pli-ms.json           — Pāli segments
//   translation/en/sujato/.../<id>_translation-en-sujato.json — English
//
// Both files are dictionaries keyed by segment id ("sn36.2:1.3"). We
// merge them into one map keyed by segment-key ("1.3") with
// { pali, english } values, and write the whole map to
// passages.segments as JSONB.
//
// Passages without bilara files (CST commentary, extra-canonical
// non-SC) stay segments=NULL. The reader falls back to the joined
// original/translation strings for those.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '.cache', 'bilara-data', 'root', 'pli', 'ms');
const TR = path.join(__dirname, '.cache', 'bilara-data', 'translation', 'en', 'sujato');

const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

// One-shot schema migration.
await sql`ALTER TABLE passages ADD COLUMN IF NOT EXISTS segments JSONB`;

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && e.name.endsWith('_root-pli-ms.json')) yield full;
  }
}

function parseId(filename) {
  const m = filename.match(/^([a-z][a-z-]*\d[\w\d.-]*)_root-pli-ms\.json$/);
  return m ? m[1] : null;
}

// Bilara segment keys look like "sn36.2:1.3". Strip the prefix to keep
// our segment map compact and joinable across the two files.
function shortKey(fullKey) {
  const i = fullKey.indexOf(':');
  return i === -1 ? fullKey : fullKey.slice(i + 1);
}

// Order segments naturally: numeric-aware sort on the dotted parts so
// "10.1" comes after "2.1", and within the same prefix "1.10" comes
// after "1.2". JSON object key order is preserved in Node 18+, so this
// gives the reader a stable iteration order.
function sortKeys(keys) {
  return [...keys].sort((a, b) => {
    const ap = a.split('.').map(Number);
    const bp = b.split('.').map(Number);
    const len = Math.max(ap.length, bp.length);
    for (let i = 0; i < len; i++) {
      const av = ap[i] ?? 0;
      const bv = bp[i] ?? 0;
      if (av !== bv) return av - bv;
    }
    return 0;
  });
}

let updated = 0;
let skipped = 0;
let nonePopulated = 0;
const batch = [];
const BATCH_SIZE = 100;

async function flush() {
  if (batch.length === 0) return;
  const ids = batch.map((r) => r.id);
  const segments = batch.map((r) => JSON.stringify(r.segments));
  await sql`
    UPDATE passages AS p
       SET segments = u.segments::jsonb
      FROM (
        SELECT * FROM unnest(${ids}::text[], ${segments}::text[]) AS t(id, segments)
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

  // English translation path mirrors the Pāli root path.
  const rel = path.relative(ROOT, paliPath);
  const enPath = path.join(TR, rel
    .replace(/_root-pli-ms\.json$/, '_translation-en-sujato.json'));
  let enObj = null;
  if (fs.existsSync(enPath)) {
    try { enObj = JSON.parse(fs.readFileSync(enPath, 'utf8')); }
    catch { /* ignore */ }
  }

  // Build segment map: every key that appears in either Pāli or
  // English file. Pali-only segments are legitimate (preamble, uddāna);
  // English-only are rare but possible (translator's note inserted).
  const allKeys = new Set();
  for (const k of Object.keys(paliObj || {})) allKeys.add(shortKey(k));
  if (enObj) for (const k of Object.keys(enObj)) allKeys.add(shortKey(k));

  if (allKeys.size === 0) { nonePopulated++; continue; }

  const segments = {};
  for (const key of sortKeys(allKeys)) {
    const fullKey = `${id}:${key}`;
    const pali = (paliObj?.[fullKey] || '').replace(/\s+$/u, '');
    const english = (enObj?.[fullKey] || '').replace(/\s+$/u, '');
    if (!pali && !english) continue;
    segments[key] = { pali, english };
  }

  if (Object.keys(segments).length === 0) { nonePopulated++; continue; }

  batch.push({ id, segments });
  if (batch.length >= BATCH_SIZE) {
    await flush();
    updated += BATCH_SIZE;
    if (updated % 500 === 0) console.log(`  ${updated} updated`);
  }
}
await flush();
updated += batch.length;
console.log(`\n[done] updated=${updated}  skipped=${skipped}  empty=${nonePopulated}`);

const sample = await sql`
  SELECT id, citation, jsonb_object_keys(segments) AS seg_keys
    FROM passages
   WHERE id = 'sn36.2'
   ORDER BY seg_keys
   LIMIT 5`;
console.log('\nsn36.2 first 5 segment keys:');
for (const r of sample) console.log(`  :${r.seg_keys}`);

const sampleSeg = await sql`
  SELECT segments->'1.3' AS seg FROM passages WHERE id='sn36.2'`;
console.log('\nsn36.2 :1.3:', sampleSeg[0]?.seg);

await sql.end();
