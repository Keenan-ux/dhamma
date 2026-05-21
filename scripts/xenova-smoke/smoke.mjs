// Smoke-test: do @xenova/transformers v2 and @huggingface/transformers v3
// produce equivalent BGE-M3 vectors? If min cosine similarity across our
// sample queries stays above 0.9999, the v2→v3 swap is pure code (no
// corpus re-embed). Below that, we'd need to re-embed.
//
// Same model id and same effective options on both sides:
//   v2: pipeline('feature-extraction', 'Xenova/bge-m3', { quantized: true })
//   v3: pipeline('feature-extraction', 'Xenova/bge-m3', { dtype: 'q8' })
// Both calls use { pooling: 'mean', normalize: true } so vectors are
// L2-normalised — cosine similarity is just a dot product.
//
// Outputs per-query cosine + distribution (min, max, mean) so we can
// see whether the failures (if any) cluster on certain query shapes.

import { pipeline as pipeV2, env as envV2 } from 'xv2';
import { pipeline as pipeV3, env as envV3 } from 'xv3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Each version gets its own model cache so they can't share a
// half-loaded blob and confuse the test. Same model id, separate dirs.
envV2.cacheDir = path.join(__dirname, '.cache-v2');
envV3.cacheDir = path.join(__dirname, '.cache-v3');
envV2.allowRemoteModels = true;
envV3.allowRemoteModels = true;

// 50 queries spanning realistic Dhamma Data search shapes:
//   - Pali terms (with and without diacritics)
//   - English sutta references
//   - Multi-word phrases scholars actually search
//   - Cross-lingual edge cases (Sanskrit cognates)
//   - Some pathological inputs (very short, very long)
const QUERIES = [
  // Pali single terms — IAST + plain
  'sati', 'satipaṭṭhāna', 'dhamma', 'kamma', 'nibbāna',
  'paṭiccasamuppāda', 'anatta', 'dukkha', 'samādhi', 'paññā',
  'sampajāna', 'sampajāno', 'sampajānakārī',
  'bodhipakkhiyā dhammā', 'cattāri ariyasaccāni',
  // Plain-ASCII fallbacks (no diacritics)
  'satipatthana', 'paticcasamuppada', 'nibbana', 'paramitas',

  // English Buddhist concepts
  'mindfulness', 'liberation', 'right view', 'noble eightfold path',
  'four foundations of mindfulness', 'dependent origination',
  'cessation of suffering', 'the middle way',

  // Sutta references / common queries
  'Satipatthana Sutta', 'DN 22', 'MN 10', 'Mahāparinibbāna',
  'Bahudhātuka Sutta', 'Anāthapiṇḍika',

  // Multi-sentence / longer scholarly phrasings
  'the chief disciple known for wisdom',
  'how does the Buddha describe the impermanence of feelings',
  'commentary on the practice of mindfulness of breathing',
  'what does the Visuddhimagga say about jhāna factors',
  'a passage about the relationship between dependent arising and emptiness',

  // Sanskrit cognates that the alias table bridges
  'smṛti', 'dharma', 'śūnyatā', 'tathāgata', 'bodhisattva',

  // CJK (BGE-M3 is multilingual; verify the same behaviour both sides)
  '念', '法', '空', '佛',

  // Edge cases
  'a', 'X', '...',
];

function cosine(a, b) {
  // Both pooled+normalised, so just dot product. Sanity-check length.
  if (a.length !== b.length) throw new Error(`len mismatch ${a.length} vs ${b.length}`);
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

async function main() {
  console.log('Loading v2 pipeline (BGE-M3, quantized=true)...');
  const t0 = Date.now();
  const v2 = await pipeV2('feature-extraction', 'Xenova/bge-m3', { quantized: true });
  console.log(`  v2 loaded in ${Date.now() - t0} ms`);

  console.log('Loading v3 pipeline (BGE-M3, dtype=q8)...');
  const t1 = Date.now();
  const v3 = await pipeV3('feature-extraction', 'Xenova/bge-m3', { dtype: 'q8' });
  console.log(`  v3 loaded in ${Date.now() - t1} ms`);

  console.log(`\nEmbedding ${QUERIES.length} queries on both sides...\n`);
  const rows = [];
  const sims = [];
  let minSim = 1.0;
  let minQuery = '';
  let dim = null;

  for (const q of QUERIES) {
    const out2 = await v2(q, { pooling: 'mean', normalize: true });
    const out3 = await v3(q, { pooling: 'mean', normalize: true });
    const vec2 = Array.from(out2.data);
    const vec3 = Array.from(out3.data);
    if (dim === null) dim = vec2.length;
    const sim = cosine(vec2, vec3);
    sims.push(sim);
    rows.push({ q: q.slice(0, 40), sim: sim.toFixed(6) });
    if (sim < minSim) { minSim = sim; minQuery = q; }
  }

  // Print per-query table
  console.table(rows);

  const sum = sims.reduce((a, b) => a + b, 0);
  const mean = sum / sims.length;
  const sorted = [...sims].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const max = sorted[sorted.length - 1];

  console.log('\n=== Distribution ===');
  console.log(`dim:    ${dim}`);
  console.log(`n:      ${sims.length}`);
  console.log(`min:    ${minSim.toFixed(6)}  (query: "${minQuery}")`);
  console.log(`max:    ${max.toFixed(6)}`);
  console.log(`mean:   ${mean.toFixed(6)}`);
  console.log(`median: ${median.toFixed(6)}`);
  console.log(`below 0.9999: ${sims.filter((s) => s < 0.9999).length} / ${sims.length}`);
  console.log(`below 0.999:  ${sims.filter((s) => s < 0.999).length} / ${sims.length}`);
  console.log(`below 0.99:   ${sims.filter((s) => s < 0.99).length} / ${sims.length}`);

  console.log('\n=== Verdict ===');
  if (minSim > 0.9999) {
    console.log('EQUIVALENT — pure code swap, no re-embed needed.');
  } else if (minSim > 0.999) {
    console.log('CLOSE BUT NOT BIT-IDENTICAL — judgment call.');
    console.log('Borderline ranking shifts possible on edge cases.');
  } else {
    console.log('NOT EQUIVALENT — re-embed the corpus when swapping.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
