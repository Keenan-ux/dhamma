// Ingest CST/VRI Pali corpus (mūla + aṭṭhakathā + ṭīkā + anya) →
// BGE-M3 dense embeddings → Postgres, alongside the existing
// SuttaCentral corpus. Distinguished from SC rows by source_edition='cst'.
//
// Pipeline:
//   1. Walk scripts/ingest/.cache/cst-test/romn/*.xml
//   2. For each file: workForFile() → parseCstFile() → embed each passage
//   3. UPSERT into passages (id, work_slug, citation, original, embedding,
//      source_edition='cst', work_role, xml_div_id, …)
//   4. INSERT INTO works for any new per-work slug discovered (ON CONFLICT NO-OP)
//   5. Flip is_stub=false on any work_slug that now has at least one passage
//
// Usage (from C:\Dev\Dhamma\scripts\ingest):
//   1. Local proxy to dhamma-pg:    flyctl proxy 15432 --app dhamma-pg
//   2. Get password (one-time):     flyctl ssh console --app dhamma -C "printenv DATABASE_URL"
//   3. Run:
//        $env:DATABASE_URL = "postgres://dhamma:PASSWORD@localhost:15432/dhamma"
//        node ingest-cst.mjs --only=s0101a.att.xml       # one file, ~15 passages, smoke test
//        node ingest-cst.mjs --role=attha                # only commentaries
//        node ingest-cst.mjs                              # the full lot

import { pipeline, env } from '@huggingface/transformers';
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCstFile } from './cst-parse.mjs';
import { workForFile, passageId, formatCstCitation } from './cst-works.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '.cache');
const CST_DIR   = path.join(CACHE_DIR, 'cst-test', 'romn');
const MODEL     = 'Xenova/bge-m3';

env.cacheDir = path.join(CACHE_DIR, 'models');
env.allowRemoteModels = true;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set. See the comment block at the top of ingest-cst.mjs.');
  process.exit(1);
}

if (!fs.existsSync(CST_DIR)) {
  console.error(`CST data not found at ${CST_DIR}. Clone tipitaka-xml first; see TIER_C.md.`);
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });

function pgVectorLiteral(vec) {
  return `[${Array.from(vec).join(',')}]`;
}

// Walk romn/ and apply filters. Returns array of {filename, work} pairs,
// skipping files for which workForFile returns null.
function findCstFiles(filter) {
  const files = fs.readdirSync(CST_DIR)
    .filter((n) => n.endsWith('.xml'))
    .filter((n) => !filter.only || n === filter.only)
    .map((n) => ({ filename: n, work: workForFile(n) }))
    .filter((f) => f.work)
    .filter((f) => !filter.role || f.work.role === filter.role);
  return files;
}

// Ensure umbrella + per-work slugs exist before passages reference them.
async function ensureCstWorks(files) {
  // Top-level umbrellas. Idempotent — pre-existing rows from seed-stubs
  // are preserved by ON CONFLICT DO NOTHING.
  const umbrellas = [
    ['pli-commentary',    null, 'Commentaries',     'Aṭṭhakathā',                3],
    ['pli-subcommentary', null, 'Sub-commentaries', 'Ṭīkā',                      4],
    ['pli-anya',          null, 'Extra-canonical',  'Anya · Mahāvaṃsa, etc.',    5],
  ];
  for (const [slug, parent, name, subtitle, order] of umbrellas) {
    await sql`
      INSERT INTO works (slug, tradition_slug, parent_slug, name, subtitle, is_stub, display_order)
      VALUES (${slug}, 'theravada', ${parent}, ${name}, ${subtitle}, true, ${order})
      ON CONFLICT (slug) DO NOTHING
    `;
  }

  // Collect unique per-work entries from the files we're going to process.
  const seen = new Map();
  for (const { work } of files) {
    if (!seen.has(work.work_slug)) {
      seen.set(work.work_slug, {
        slug:        work.work_slug,
        parent_slug: work.parent_slug,
        name:        work.work_name,
      });
    }
  }
  for (const w of seen.values()) {
    await sql`
      INSERT INTO works (slug, tradition_slug, parent_slug, name, is_stub)
      VALUES (${w.slug}, 'theravada', ${w.parent_slug}, ${w.name}, true)
      ON CONFLICT (slug) DO NOTHING
    `;
  }
}

// After ingest, flip is_stub=false on any work that has at least one
// passage OR has a descendant with passages. Walks up the parent chain
// so umbrella works (pli-commentary, pli-subcommentary, pli-anya) get
// promoted alongside their live children.
async function promoteStubsToLive() {
  const result = await sql`
    WITH RECURSIVE live_chain AS (
      SELECT slug FROM works
       WHERE slug IN (SELECT DISTINCT work_slug FROM passages)
      UNION
      SELECT w.parent_slug
        FROM works w
        JOIN live_chain lc ON w.slug = lc.slug
       WHERE w.parent_slug IS NOT NULL
    )
    UPDATE works
       SET is_stub = false
     WHERE is_stub = true
       AND slug IN (SELECT slug FROM live_chain)
  `;
  return result.count;
}

async function main() {
  const filter = {
    only: args.only,
    role: args.role,                     // 'mula' | 'attha' | 'tika' | 'anya'
  };
  const maxPerFile = args.max ? Number(args.max) : Infinity;

  const files = findCstFiles(filter);
  if (files.length === 0) {
    console.error('No CST files matched filter:', filter);
    process.exit(1);
  }
  console.log(`[ingest-cst] ${files.length} file(s) to process`);

  await ensureCstWorks(files);

  // Resume support: skip passages already embedded. The full corpus is
  // ~18.7K passages × ~5.5s each = ~28h, so a partial-crash restart needs
  // to skip the done work without re-embedding it. Load all done CST
  // ids into a Set; ingest loop checks before calling the embedder.
  const doneRows = await sql`SELECT id FROM passages WHERE source_edition='cst'`;
  const done = new Set(doneRows.map((r) => r.id));
  if (done.size > 0) {
    console.log(`[resume] ${done.size} CST passages already in DB — will skip`);
  }

  console.log(`[model] loading ${MODEL}…`);
  const embedder = await pipeline('feature-extraction', MODEL, { dtype: 'q8' });
  console.log('[model] ready.');

  let totalPassages = 0;
  let skippedFiles  = 0;
  const t0 = Date.now();

  for (const { filename, work } of files) {
    const filePath = path.join(CST_DIR, filename);
    let parsed;
    try {
      parsed = await parseCstFile(filePath);
    } catch (err) {
      console.error(`[parse:${filename}] ${err.message}`);
      skippedFiles++;
      continue;
    }
    const { passages } = parsed;
    if (passages.length === 0) {
      console.log(`[parse:${filename}] 0 passages — skipping`);
      skippedFiles++;
      continue;
    }

    const baseName = filename.replace(/\.xml$/i, '');
    let counter = 0;
    let fileSkipped = 0;
    for (const p of passages.slice(0, maxPerFile)) {
      counter++;
      const locator = p.xml_div_id || counter;
      const id       = passageId(baseName, locator);
      if (done.has(id)) { fileSkipped++; continue; }
      const citation = formatCstCitation(work.citation_prefix, locator);
      const title    = p.title || null;
      const original = p.original;

      // Embed first 8000 chars (matches the SC ingest convention; BGE-M3
      // truncates inputs anyway).
      const out = await embedder(original.slice(0, 8000), { pooling: 'mean', normalize: true });
      const vec = pgVectorLiteral(out.data);

      await sql`
        INSERT INTO passages
          (id, work_slug, position, citation, title, canon, original_lang,
           original, source_edition, xml_div_id, work_role, embedding)
        VALUES
          (${id}, ${work.work_slug}, ${counter}, ${citation}, ${title}, 'Pali', 'pli',
           ${original}, 'cst', ${p.xml_div_id}, ${work.role}, ${vec})
        ON CONFLICT (id) DO UPDATE SET
          work_slug       = EXCLUDED.work_slug,
          position        = EXCLUDED.position,
          citation        = EXCLUDED.citation,
          title           = EXCLUDED.title,
          original        = EXCLUDED.original,
          source_edition  = EXCLUDED.source_edition,
          xml_div_id      = EXCLUDED.xml_div_id,
          work_role       = EXCLUDED.work_role,
          embedding       = EXCLUDED.embedding
      `;
      totalPassages++;
      done.add(id);
    }

    const elapsed = (Date.now() - t0) / 1000;
    const rate = elapsed > 0 ? (totalPassages / elapsed).toFixed(2) : '0';
    const skipSuffix = fileSkipped ? ` skipped=${fileSkipped}` : '';
    console.log(`[${filename}] ${counter} passages${skipSuffix} cumulative=${totalPassages} (${rate}/s)`);
  }

  const promoted = await promoteStubsToLive();
  const wall = Math.round((Date.now() - t0) / 1000);
  console.log(`[done] ingested ${totalPassages} passages from ${files.length - skippedFiles}/${files.length} files; promoted ${promoted} stubs to live; ${wall}s wall`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
