// Embed ATI Library articles (articles.body) with BGE-M3 → fills the
// articles.embedding vector(1024) column. Unblocks Library Meaning-mode
// search, which currently falls back to FTS because the column is empty.
//
// Same model + pooling/normalize as embed-dict.mjs and server/src/embed.js,
// so article vectors live in the same space as passages/dictionary vectors.
// CPU path (q8 ONNX via @huggingface/transformers) — does NOT touch the
// GPU, so it runs fine alongside other GPU work.
//
// ~386 articles. Resume-friendly: only embeds rows where embedding IS NULL.
// No HNSW index is built here on purpose: 386 rows seq-scan instantly, and
// building one would add memory pressure during the passages reindex.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node embed-articles.mjs

import postgres from 'postgres';
import { pipeline, env } from '@huggingface/transformers';
import path from 'node:path';

const MODEL = 'Xenova/bge-m3';
const BATCH_FETCH = 64;
const EMBED_BATCH = 8;       // articles are long; keep the inference batch small
const MAX_TEXT_CHARS = 4000; // title + summary + body head; model truncates anyway

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
  // Lead with title + curated summary (dense, thematic) then body head, so a
  // Meaning query about a topic boosts the article that is ABOUT that topic.
  const head = stripHtml([row.title, row.summary, row.body].filter(Boolean).join('. '));
  return head.slice(0, MAX_TEXT_CHARS);
}

console.log(`[embed-articles] loading ${MODEL}…`);
const t0 = Date.now();
const embedder = await pipeline('feature-extraction', MODEL, { dtype: 'q8' });
console.log(`[embed-articles] model ready in ${Date.now() - t0}ms`);

const [{ total }]   = await sql`SELECT COUNT(*)::int AS total FROM articles`;
const [{ pending }] = await sql`SELECT COUNT(*)::int AS pending FROM articles WHERE embedding IS NULL`;
console.log(`[embed-articles] total: ${total}, pending: ${pending}, done: ${total - pending}`);

if (pending === 0) {
  console.log('[embed-articles] nothing to do');
  await sql.end();
  process.exit(0);
}

const tStart = Date.now();
let done = 0;

while (true) {
  const rows = await sql`
    SELECT id, title, summary, body
    FROM articles
    WHERE embedding IS NULL
    ORDER BY id
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
      ids.push(slice[j].id);
      vecs.push(pgVectorLiteral(vec));
    }
  }

  await sql`
    UPDATE articles a
    SET embedding = src.embedding::vector
    FROM unnest(${ids}::bigint[], ${vecs}::text[]) AS src(id, embedding)
    WHERE a.id = src.id
  `;

  done += rows.length;
  const elapsed = (Date.now() - tStart) / 1000;
  const rate = done / elapsed;
  const eta = Math.round((pending - done) / Math.max(rate, 0.01));
  console.log(`  ${done.toString().padStart(5)} / ${pending}  ·  ${rate.toFixed(1)} rows/s  ·  ETA ${Math.floor(eta/60)}m${(eta%60).toString().padStart(2,'0')}s`);
}

const [{ filled }] = await sql`SELECT COUNT(*)::int AS filled FROM articles WHERE embedding IS NOT NULL`;
console.log(`\n[embed-articles] done. ${filled} / ${total} articles embedded.`);

await sql.end();
