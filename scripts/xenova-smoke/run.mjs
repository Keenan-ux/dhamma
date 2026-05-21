// Driver: write queries.ndjson, spawn v2 + v3 embedders, diff cosines.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const QUERIES = [
  'sati', 'satipaṭṭhāna', 'dhamma', 'kamma', 'nibbāna',
  'paṭiccasamuppāda', 'anatta', 'dukkha', 'samādhi', 'paññā',
  'sampajāna', 'sampajāno', 'sampajānakārī',
  'bodhipakkhiyā dhammā', 'cattāri ariyasaccāni',
  'satipatthana', 'paticcasamuppada', 'nibbana', 'paramitas',
  'mindfulness', 'liberation', 'right view', 'noble eightfold path',
  'four foundations of mindfulness', 'dependent origination',
  'cessation of suffering', 'the middle way',
  'Satipatthana Sutta', 'DN 22', 'MN 10', 'Mahāparinibbāna',
  'Bahudhātuka Sutta', 'Anāthapiṇḍika',
  'the chief disciple known for wisdom',
  'how does the Buddha describe the impermanence of feelings',
  'commentary on the practice of mindfulness of breathing',
  'what does the Visuddhimagga say about jhāna factors',
  'a passage about the relationship between dependent arising and emptiness',
  'smṛti', 'dharma', 'śūnyatā', 'tathāgata', 'bodhisattva',
  '念', '法', '空', '佛',
  'a', 'X', '...',
];

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const queriesPath = path.join(here, 'queries.ndjson');
fs.writeFileSync(queriesPath, QUERIES.map((q) => JSON.stringify({ query: q })).join('\n'));

function runRunner(label, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, ['embed.mjs', queriesPath], {
      cwd, stdio: ['ignore', 'pipe', 'inherit'],
    });
    let buf = '';
    proc.stdout.on('data', (d) => { buf += d.toString(); });
    proc.on('exit', (code) => {
      if (code !== 0) return reject(new Error(`${label} exited ${code}`));
      const rows = buf.split('\n').filter(Boolean).map((l) => JSON.parse(l));
      resolve(rows);
    });
    proc.on('error', reject);
  });
}

function cosine(a, b) {
  if (a.length !== b.length) throw new Error(`len mismatch ${a.length} vs ${b.length}`);
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

console.log('Running v2 embedder...');
const v2 = await runRunner('v2', path.join(here, 'v2-runner'));
console.log(`  v2: ${v2.length} vectors, dim=${v2[0]?.vec.length}`);

console.log('Running v3 embedder...');
const v3 = await runRunner('v3', path.join(here, 'v3-runner'));
console.log(`  v3: ${v3.length} vectors, dim=${v3[0]?.vec.length}`);

const v3by = Object.fromEntries(v3.map((r) => [r.query, r.vec]));
const rows = [];
const sims = [];
let minSim = 1.0;
let minQuery = '';
for (const r of v2) {
  const vec3 = v3by[r.query];
  if (!vec3) continue;
  const sim = cosine(r.vec, vec3);
  sims.push(sim);
  rows.push({ q: r.query.slice(0, 40), sim: sim.toFixed(6) });
  if (sim < minSim) { minSim = sim; minQuery = r.query; }
}

console.table(rows);

const sum = sims.reduce((a, b) => a + b, 0);
const mean = sum / sims.length;
const sorted = [...sims].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
const max = sorted[sorted.length - 1];

console.log('\n=== Distribution ===');
console.log(`n:      ${sims.length}`);
console.log(`min:    ${minSim.toFixed(6)}  (query: "${minQuery}")`);
console.log(`max:    ${max.toFixed(6)}`);
console.log(`mean:   ${mean.toFixed(6)}`);
console.log(`median: ${median.toFixed(6)}`);
console.log(`below 0.9999: ${sims.filter((s) => s < 0.9999).length} / ${sims.length}`);
console.log(`below 0.999:  ${sims.filter((s) => s < 0.999).length} / ${sims.length}`);
console.log(`below 0.99:   ${sims.filter((s) => s < 0.99).length} / ${sims.length}`);

console.log('\n=== Verdict ===');
if (minSim > 0.9999) console.log('EQUIVALENT — pure code swap, no re-embed needed.');
else if (minSim > 0.999) console.log('CLOSE BUT NOT BIT-IDENTICAL — judgment call.');
else console.log('NOT EQUIVALENT — re-embed the corpus when swapping.');
