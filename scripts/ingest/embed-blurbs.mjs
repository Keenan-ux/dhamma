// Embed SuttaCentral blurbs (blurbs.blurb) with BGE-M3 → fills the
// blurbs.embedding vector(1024) column. Powers the `vec_blurb` Meaning-mode
// lane in server/src/search.js.
//
// Cloned from embed-articles.mjs — same model + pooling/normalize as
// server/src/embed.js, so blurb vectors live in the same space as
// passages/translations/dictionary vectors. CPU path (q8 ONNX via
// @huggingface/transformers) — does NOT touch the GPU, so it runs fine
// alongside other GPU work and the in-progress passages reindex.
//
// Blurbs are short (one paragraph, typically < 1.5 KB) so the inference batch
// can be larger than the articles one and the input is the whole blurb.
//
// ~4,000 blurbs. Resume-friendly: only embeds rows where embedding IS NULL.
// No HNSW index is built here on purpose: ~4k rows seq-scan instantly, and a
// blurb-HNSW build is deliberately deferred until the passages REINDEX is done
// (see schema.sql / BACKLOG). The vec_blurb lane works fine on a seq scan.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node embed-blurbs.mjs

import postgres from 'postgres';
import { pipeline, env } from '@huggingface/transformers';
import path from 'node:path';

const MODEL = 'Xenova/bge-m3';
const BATCH_FETCH = 256;
const EMBED_BATCH = 16;       // blurbs are short; a wider batch is fine
const MAX_TEXT_CHARS = 2000;  // a blurb is one paragraph; model truncates anyway

env.cacheDir = process.env.MODEL_CACHE_DIR || path.resolve('.model-cache');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 60 });

function stripHtml(s) {
  return String(s ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pgVectorLiteral(vec) {
  return `[${Array.from(vec).join(',')}]`;
}

function buildEmbeddingInput(row) {
  // The blurb is already short and densely on-topic; strip the light SC
  // markup (<i lang='pi'>…</i>) and embed the whole thing.
  return stripHtml(row.blurb).slice(0, MAX_TEXT_CHARS);
}

console.log(`[embed-blurbs] loading ${MODEL}…`);
const t0 = Date.now();
const embedder = await pipeline('feature-extraction', MODEL, { dtype: 'q8' });
console.log(`[embed-blurbs] model ready in ${Date.now() - t0}ms`);

const [{ total }]   = await sql`SELECT COUNT(*)::int AS total FROM blurbs`;
const [{ pending }] = await sql`SELECT COUNT(*)::int AS pending FROM blurbs WHERE embedding IS NULL`;
console.log(`[embed-blurbs] total: ${total}, pending: ${pending}, done: ${total - pending}`);

if (pending === 0) {
  console.log('[embed-blurbs] nothing to do');
  await sql.end();
  process.exit(0);
}

const tStart = Date.now();
let done = 0;

while (true) {
  const rows = await sql`
    SELECT passage_id, blurb
    FROM blurbs
    WHERE embedding IS NULL
    ORDER BY passage_id
    LIMIT ${BATCH_FETCH}
  `;
  if (rows.length === 0) break;

  const ids = [];
  const vecs = [];
  for (let i = 0; i < rows.length; i += EMBED_BATCH) {
    const slice = rows.slice(i, i + EMBED_BATCH);
    const inputs = slice.map(buildEmbeddingInput);
    const out = await embedder(inputs, { pooling: 'mean', normalize: true });
    const dim = out.dims[out.dims.length - 1];
    for (let j = 0; j < slice.length; j++) {
      const start = j * dim;
      const vec = Array.from(out.data.slice(start, start + dim));
      ids.push(slice[j].passage_id);
      vecs.push(pgVectorLiteral(vec));
    }
  }

  await sql`
    UPDATE blurbs b
    SET embedding = src.embedding::vector
    FROM unnest(${ids}::text[], ${vecs}::text[]) AS src(passage_id, embedding)
    WHERE b.passage_id = src.passage_id
  `;

  done += rows.length;
  const elapsed = (Date.now() - tStart) / 1000;
  const rate = done / elapsed;
  const eta = Math.round((pending - done) / Math.max(rate, 0.01));
  console.log(`  ${done.toString().padStart(5)} / ${pending}  ·  ${rate.toFixed(1)} rows/s  ·  ETA ${Math.floor(eta/60)}m${(eta%60).toString().padStart(2,'0')}s`);
}

const [{ filled }] = await sql`SELECT COUNT(*)::int AS filled FROM blurbs WHERE embedding IS NOT NULL`;
console.log(`\n[embed-blurbs] done. ${filled} / ${total} blurbs embedded.`);

await sql.end();
