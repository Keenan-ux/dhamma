// Embed queries with @xenova/transformers v2. Reads NDJSON queries
// from argv[2] (a file), writes NDJSON {query, vec} to stdout.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline, env } from '@xenova/transformers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
env.cacheDir = path.join(__dirname, '.cache');
env.allowRemoteModels = true;

const queriesFile = process.argv[2];
const queries = fs.readFileSync(queriesFile, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));

console.error(`[v2] loading BGE-M3 (quantized=true)...`);
const t0 = Date.now();
const pipe = await pipeline('feature-extraction', 'Xenova/bge-m3', { quantized: true });
console.error(`[v2] loaded in ${Date.now() - t0} ms`);

for (const q of queries) {
  const out = await pipe(q.query, { pooling: 'mean', normalize: true });
  process.stdout.write(JSON.stringify({ query: q.query, vec: Array.from(out.data) }) + '\n');
}
console.error(`[v2] done`);
