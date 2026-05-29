// Ingest curated SuttaCentral blurbs → the blurbs table (Meaning-mode lane #4).
//
// A blurb is one short, densely thematic paragraph summarising what a sutta is
// *about* (SC's bilara root/en/blurb/ data). Embedded into the same BGE-M3
// 1024-d space as passages/translations, it becomes the `vec_blurb` retrieval
// lane in server/src/search.js: because the blurb is short and on-topic, its
// vector isn't diluted by thousands of chars of surrounding narrative, so a
// thematic query ("how to behave around families") surfaces the ABOUT-this
// sutta (SN 16.3) even when the body-text lanes drown it.
//
// This script only fills the blurb TEXT. Embeddings are filled separately by
// embed-blurbs.mjs (so the slow model load isn't on the ingest path).
//
// Mapping: each blurb JSON key is "<file>-blurbs:<uid>" where <uid> is the SC
// sutta uid, which equals passages.id for our SC-edition rows ("sn16.3",
// "dn1", "mn10"). We UPSERT one row per passage_id, keeping only uids that
// resolve to an existing passage (collection/vagga-level "super" blurbs and
// any uid we don't have a passage for are skipped — this is also what the FK
// in schema.sql enforces on a fresh DB; the live table currently lacks the FK
// while a passages REINDEX is mid-flight, so we filter here too).
//
// Idempotent + resume-friendly: re-running re-UPSERTs the blurb text and only
// nulls the embedding for rows whose blurb text actually changed.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-blurbs.mjs

import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLURB_DIR = path.resolve(__dirname, '.cache', 'bilara-data', 'root', 'en', 'blurb');
const UPSERT_BATCH = 500;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set. See the comment block at the top of ingest-blurbs.mjs.');
  process.exit(1);
}
if (!fs.existsSync(BLURB_DIR)) {
  console.error(`blurb dir not found: ${BLURB_DIR}\nClone bilara-data first (see ingest.mjs).`);
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 20 });

// Extract the SC uid from a blurb key like "sn-blurbs:sn16.3" → "sn16.3".
// The prefix is always "<x>-blurbs"; the uid is everything after the first
// colon (SC uids never contain a colon).
function uidFromKey(key) {
  const i = key.indexOf(':');
  return i === -1 ? key : key.slice(i + 1);
}

function loadAllBlurbs() {
  const files = fs.readdirSync(BLURB_DIR).filter((f) => f.endsWith('.json'));
  const byUid = new Map(); // uid -> blurb text (raw, light HTML preserved)
  for (const f of files) {
    const obj = JSON.parse(fs.readFileSync(path.join(BLURB_DIR, f), 'utf8'));
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val !== 'string') continue;
      const blurb = val.trim();
      if (!blurb) continue;
      byUid.set(uidFromKey(key), blurb);
    }
  }
  return byUid;
}

console.log(`[blurbs] reading ${BLURB_DIR}`);
const byUid = loadAllBlurbs();
console.log(`[blurbs] ${byUid.size} unique blurb entries on disk`);

// Keep only uids that resolve to a passage we actually have.
const allUids = [...byUid.keys()];
const existing = await sql`SELECT id FROM passages WHERE id = ANY(${allUids}::text[])`;
const haveIds = new Set(existing.map((r) => r.id));
const rows = allUids
  .filter((u) => haveIds.has(u))
  .map((u) => ({ passage_id: u, blurb: byUid.get(u) }));
console.log(`[blurbs] ${rows.length} map to existing passages (${allUids.length - rows.length} skipped: no matching passage)`);

if (rows.length === 0) {
  console.error('[blurbs] nothing to ingest — check the SC uid → passages.id mapping');
  await sql.end();
  process.exit(1);
}

let upserted = 0;
for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
  const chunk = rows.slice(i, i + UPSERT_BATCH);
  await sql`
    INSERT INTO blurbs ${sql(chunk, 'passage_id', 'blurb')}
    ON CONFLICT (passage_id) DO UPDATE SET
      blurb = EXCLUDED.blurb,
      -- Only invalidate the embedding when the source text actually changed,
      -- so an idempotent re-run doesn't wipe a populated vector.
      embedding = CASE WHEN blurbs.blurb IS DISTINCT FROM EXCLUDED.blurb
                       THEN NULL ELSE blurbs.embedding END
  `;
  upserted += chunk.length;
  console.log(`  upserted ${upserted} / ${rows.length}`);
}

const [{ total }]   = await sql`SELECT COUNT(*)::int AS total   FROM blurbs`;
const [{ pending }] = await sql`SELECT COUNT(*)::int AS pending FROM blurbs WHERE embedding IS NULL`;
console.log(`\n[blurbs] done. ${total} rows in blurbs (${pending} awaiting embedding).`);

await sql.end();
