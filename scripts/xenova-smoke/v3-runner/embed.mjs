// Embed queries with @huggingface/transformers v3. Same protocol as v2.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline, env } from '@huggingface/transformers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
env.cacheDir = path.join(__dirname, '.cache');
env.allowRemoteModels = true;

const queriesFile = process.argv[2];
const queries = fs.readFileSync(queriesFile, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));

console.error(`[v3] loading BGE-M3 (dtype=q8)...`);
const t0 = Date.now();
const pipe = await pipeline('feature-extraction', 'Xenova/bge-m3', { dtype: 'q8' });
console.error(`[v3] loaded in ${Date.now() - t0} ms`);

for (const q of queries) {
  const out = await pipe(q.query, { pooling: 'mean', normalize: true });
  process.stdout.write(JSON.stringify({ query: q.query, vec: Array.from(out.data) }) + '\n');
}
console.error(`[v3] done`);
