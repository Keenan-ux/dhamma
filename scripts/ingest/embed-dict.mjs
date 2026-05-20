// Embed dictionary_entries.definition with BGE-M3 → fills the
// embedding vector(1024) column added in schema.sql. Same model and
// pooling/normalize options as scripts/ingest/ingest.mjs and
// server/src/embed.js so dictionary vectors live in the same space as
// the corpus vectors — a Meaning-mode lookup query embedded once can
// hit both tables.
//
// ~118K rows total. Resume-friendly: only embeds rows where
// `embedding IS NULL`, so re-runs after a kill pick up where they
// left off. Build HNSW index only after the column is fully
// populated (Postgres lazy-builds it anyway, but creating it on
// empty data is wasted work).
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node embed-dict.mjs
//
// Tunables: BATCH_FETCH = how many rows to pull from DB at a time;
// EMBED_BATCH = how many strings to feed BGE-M3 in one inference call.

import postgres from 'postgres';
import { pipeline, env } from '@xenova/transformers';
import path from 'node:path';

const MODEL = 'Xenova/bge-m3';
const BATCH_FETCH = 256;
const EMBED_BATCH = 32;
const MAX_TEXT_CHARS = 1200;

env.cacheDir = process.env.MODEL_CACHE_DIR || path.resolve('.model-cache');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 60 });

// Plain-text reduction of dictionary HTML. Definitions from DPPN and
// PED are HTML paragraphs; DPD definitions are plain text. Stripping
// is safe to apply uniformly. Doesn't have to be perfect — we just
// want the inner text content for the embedder.
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
  // Prepend the lemma so a meaning-mode query like "the chief disciple"
  // gets boosted on the entry whose lemma is `sāriputta` over a random
  // body mention of "chief disciple". Truncate the body so a 70 KB
  // DPPN biography doesn't blow the model's context window.
  const stripped = stripHtml(row.definition).slice(0, MAX_TEXT_CHARS);
  return `${row.lemma}: ${stripped}`;
}

console.log(`[embed-dict] loading ${MODEL}…`);
const t0 = Date.now();
const embedder = await pipeline('feature-extraction', MODEL, { quantized: true });
console.log(`[embed-dict] model ready in ${Date.now() - t0}ms`);

const [{ total }]   = await sql`SELECT COUNT(*)::int AS total FROM dictionary_entries`;
const [{ pending }] = await sql`SELECT COUNT(*)::int AS pending FROM dictionary_entries WHERE embedding IS NULL`;
console.log(`[embed-dict] total rows: ${total}, pending: ${pending}, already done: ${total - pending}`);

if (pending === 0) {
  console.log('[embed-dict] nothing to do');
  await sql.end();
  process.exit(0);
}

const tStart = Date.now();
let done = 0;
let lastReportAt = tStart;

while (true) {
  const rows = await sql`
    SELECT id, source, lemma, definition
    FROM dictionary_entries
    WHERE embedding IS NULL
    ORDER BY id
    LIMIT ${BATCH_FETCH}
  `;
  if (rows.length === 0) break;

  // Embed in mini-batches for throughput; BGE-M3 quantized ONNX handles
  // ~16 strings per call comfortably on shared CPU.
  const ids = [];
  const vecs = [];
  for (let i = 0; i < rows.length; i += EMBED_BATCH) {
    const slice = rows.slice(i, i + EMBED_BATCH);
    const inputs = slice.map(buildEmbeddingInput);
    const out = await embedder(inputs, { pooling: 'mean', normalize: true });
    // out.data is a flat Float32Array of length (rows × 1024). out.dims = [rows, 1024].
    const dim = out.dims[out.dims.length - 1];
    for (let j = 0; j < slice.length; j++) {
      const start = j * dim;
      const end = start + dim;
      const vec = Array.from(out.data.slice(start, end));
      ids.push(slice[j].id);
      vecs.push(pgVectorLiteral(vec));
    }
  }

  // One UPDATE per fetch-batch via unnest() — round-trip is cheap, no
  // per-row CALL overhead.
  await sql`
    UPDATE dictionary_entries d
    SET embedding = src.embedding::vector
    FROM unnest(${ids}::bigint[], ${vecs}::text[]) AS src(id, embedding)
    WHERE d.id = src.id
  `;

  done += rows.length;
  const now = Date.now();
  if (now - lastReportAt > 5000 || done === pending) {
    const elapsed = (now - tStart) / 1000;
    const rate = done / elapsed;
    const remaining = pending - done;
    const eta = remaining > 0 ? Math.round(remaining / rate) : 0;
    console.log(`  ${done.toString().padStart(7)} / ${pending}  ·  ${rate.toFixed(1)} rows/s  ·  ETA ${Math.floor(eta/60)}m${(eta%60).toString().padStart(2,'0')}s`);
    lastReportAt = now;
  }
}

console.log('\n[embed-dict] embeddings populated. Building HNSW index…');
const tIdx = Date.now();
await sql.unsafe('CREATE INDEX IF NOT EXISTS idx_dict_embedding ON dictionary_entries USING hnsw (embedding vector_cosine_ops)');
console.log(`[embed-dict] HNSW index built in ${Math.round((Date.now() - tIdx)/1000)}s`);

const [{ filled }] = await sql`SELECT COUNT(*)::int AS filled FROM dictionary_entries WHERE embedding IS NOT NULL`;
console.log(`[embed-dict] done. ${filled} / ${total} rows have embeddings.`);

await sql.end();
