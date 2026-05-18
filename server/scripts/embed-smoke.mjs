// Smoke test for server/src/embed.js. Loads the BGE-M3 pipeline, embeds a
// short Pali query, prints dim + first few values + timings.
//
// Run from C:\Dev\Dhamma\server:
//   node scripts/embed-smoke.mjs
// To reuse the ingest's existing model cache (avoid re-downloading 570 MB):
//   $env:MODEL_CACHE_DIR="C:\Dev\Dhamma\scripts\ingest\.cache\models"
//   node scripts/embed-smoke.mjs

import { embedReady, embedQuery } from '../src/embed.js';

const t0 = Date.now();
await embedReady();
const tReady = Date.now() - t0;

const queries = ['sampajāna sati', 'mindfulness and clear comprehension', '正念'];
for (const q of queries) {
  const t = Date.now();
  const vec = await embedQuery(q);
  console.log(JSON.stringify({ q, dim: vec.length, ms: Date.now() - t, sample: vec.slice(0, 5) }));
}
console.log(`ready-in: ${tReady}ms`);
