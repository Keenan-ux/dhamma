// Ingest SuttaCentral's parallels.json into the passage_parallels table.
//
// Source: https://github.com/suttacentral/sc-data/blob/main/relationship/parallels.json
// (~1.9 MB, ~8,000 relationship records). Each record is an array of
// passage IDs that are mutually parallel (or "mentions", "retells").
//
// We expand each record to a fully-symmetric set of (source, target,
// relation_type) rows. parallel_have is set TRUE when the target ID
// exists in our passages table — that's the cue the UI uses to make
// the link clickable.
//
// Range IDs like "an1.1-5" expand to (an1.1, an1.2, an1.3, an1.4, an1.5)
// since SuttaCentral often groups very short consecutive suttas. Each
// of those participates in the parallel set independently.
//
// Usage (from C:\Dev\Dhamma, with a flyctl proxy to dhamma-pg on 5432):
//   cd scripts/ingest
//   DATABASE_URL="postgres://dhamma:PASS@localhost:5432/dhamma" node ingest-parallels.mjs

import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '.cache');
const PARALLELS_URL = 'https://raw.githubusercontent.com/suttacentral/sc-data/main/relationship/parallels.json';
const LOCAL_FILE = path.join(CACHE_DIR, 'sc-parallels.json');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set.');
  process.exit(1);
}

async function fetchUrl(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
      out.on('error', reject);
    }).on('error', reject);
  });
}

// Range expansion: "an1.1-5" → ["an1.1", "an1.2", "an1.3", "an1.4", "an1.5"].
// Only expands when the range ends in a small integer that follows the
// trailing "." segment in the ID. Anything funkier is returned as-is.
function expandRange(id) {
  const m = id.match(/^(.+?\.)(\d+)-(\d+)$/);
  if (!m) return [id];
  const [, prefix, startStr, endStr] = m;
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 50) {
    return [id]; // outside sanity bound; keep as-is
  }
  const out = [];
  for (let i = start; i <= end; i++) out.push(`${prefix}${i}`);
  return out;
}

// Strip the segment portion ("#x.y") from a relationship token.
function workId(token) {
  if (!token) return null;
  return token.split('#')[0];
}

// Crude language heuristic on the work-id prefix. Used to label
// external (non-Pali) parallels so the UI can group / annotate them.
function langOf(id) {
  if (!id) return null;
  if (/^(dn|mn|sn|an|kn|dhp|snp|ja|iti|ud|khp|vv|pv|th|thi|thag|thig|ap|bv|cp|nd|ne|mil|pe|kv|mnd|cnd|patis|ps|pli-)/i.test(id)) return 'pli';
  if (/^(t|sa|sf|san)/.test(id)) return 'lzh';        // Chinese / Sanskrit blocks (rough)
  if (/^(uv|uv-)/.test(id)) return 'san';
  if (/^(gdhp|pdhp)/.test(id)) return 'pra';          // Prakrit / Gāndhārī Dhammapadas
  if (/^(sag|sag-)/.test(id)) return 'tib';           // sometimes Tibetan
  return null;
}

async function main() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  if (!fs.existsSync(LOCAL_FILE)) {
    console.log(`Fetching ${PARALLELS_URL} …`);
    await fetchUrl(PARALLELS_URL, LOCAL_FILE);
  } else {
    console.log(`Using cached ${LOCAL_FILE}`);
  }

  const records = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
  console.log(`Loaded ${records.length} relationship records`);

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'allow' });

  // Pre-load known passage IDs so we can flag parallel_have in bulk.
  const ourIds = new Set();
  const rows = await sql`SELECT id FROM passages`;
  for (const r of rows) ourIds.add(r.id);
  console.log(`Known passages: ${ourIds.size}`);

  // Build (passage_id, parallel_id, relation_type) rows from the
  // bidirectional expansion of each record.
  const pairs = [];
  let totalTokens = 0;
  let expandedTokens = 0;
  for (const record of records) {
    for (const [relType, arr] of Object.entries(record)) {
      // Expand every member to its actual IDs (range expansion etc).
      const expanded = [];
      for (const token of arr) {
        totalTokens++;
        const id = workId(token);
        if (!id) continue;
        for (const ex of expandRange(id)) {
          expandedTokens++;
          expanded.push(ex);
        }
      }
      // Emit symmetric pairs.
      for (let i = 0; i < expanded.length; i++) {
        for (let j = 0; j < expanded.length; j++) {
          if (i === j) continue;
          pairs.push({
            passage_id: expanded[i],
            parallel_id: expanded[j],
            relation_type: relType,
            parallel_lang: langOf(expanded[j]),
          });
        }
      }
    }
  }
  console.log(`Expanded ${totalTokens} tokens → ${expandedTokens} IDs → ${pairs.length} directed pairs`);

  // Filter to pairs where the source is in our passages table —
  // otherwise the INSERT would violate the foreign key. Keep
  // pairs where target isn't in our table; mark parallel_have FALSE.
  const inDbPairs = pairs.filter((p) => ourIds.has(p.passage_id));
  console.log(`Pairs with source in our passages: ${inDbPairs.length}`);

  // Dedupe — same (passage, parallel, relation) can appear multiple
  // times via different records.
  const deduped = new Map();
  for (const p of inDbPairs) {
    const key = `${p.passage_id}|${p.parallel_id}|${p.relation_type}`;
    if (!deduped.has(key)) {
      p.parallel_have = ourIds.has(p.parallel_id);
      deduped.set(key, p);
    }
  }
  const rowsToInsert = Array.from(deduped.values());
  console.log(`Deduped to ${rowsToInsert.length} unique rows`);

  // Wipe + bulk insert. Idempotent: deletes everything and re-builds
  // from the source file, so the table always mirrors upstream.
  await sql`DELETE FROM passage_parallels`;
  console.log('Cleared existing parallels');

  let inserted = 0;
  const BATCH = 1000;
  for (let i = 0; i < rowsToInsert.length; i += BATCH) {
    const batch = rowsToInsert.slice(i, i + BATCH);
    await sql`INSERT INTO passage_parallels ${sql(batch, 'passage_id', 'parallel_id', 'relation_type', 'parallel_lang', 'parallel_have')}`;
    inserted += batch.length;
    if (i % 10000 === 0) console.log(`  inserted ${inserted} / ${rowsToInsert.length}`);
  }
  console.log(`Inserted ${inserted} rows`);

  // Smoke check: report a handful of well-known sutta pairings.
  for (const probe of ['dn22', 'mn10', 'sn56.11', 'mn118']) {
    const sample = await sql`
      SELECT parallel_id, relation_type, parallel_lang, parallel_have
      FROM passage_parallels
      WHERE passage_id = ${probe}
      ORDER BY parallel_have DESC, parallel_id
      LIMIT 8
    `;
    console.log(`\n${probe}: ${sample.length} parallels (showing top 8)`);
    for (const r of sample) {
      console.log(`  ${r.parallel_have ? '●' : '○'} ${r.parallel_id} (${r.relation_type}${r.parallel_lang ? ', ' + r.parallel_lang : ''})`);
    }
  }

  await sql.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
