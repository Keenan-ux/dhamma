// Parse all 217 CST romn/ files (no embedding, no DB) and report
// total passage counts by role + per-file stats. Estimates ingest size.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCstFile } from './cst-parse.mjs';
import { workForFile } from './cst-works.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CST_DIR = path.join(__dirname, '.cache', 'cst-test', 'romn');

const files = fs.readdirSync(CST_DIR).filter((n) => n.endsWith('.xml')).sort();
const byRole = { mula: 0, attha: 0, tika: 0, anya: 0 };
let total = 0, parseErrors = 0;
const perFile = [];

const t0 = Date.now();
for (const fname of files) {
  const work = workForFile(fname);
  if (!work) { parseErrors++; continue; }
  try {
    const { passages } = await parseCstFile(path.join(CST_DIR, fname));
    byRole[work.role] = (byRole[work.role] || 0) + passages.length;
    total += passages.length;
    perFile.push({ file: fname, role: work.role, n: passages.length });
  } catch (err) {
    console.error(`[err:${fname}] ${err.message}`);
    parseErrors++;
  }
}
const wall = Math.round((Date.now() - t0) / 1000);

console.log(`\n=== CST parse summary (${wall}s wall) ===`);
console.log(`Files: ${files.length} total, ${parseErrors} parse errors`);
console.log(`Passages by role:`);
for (const [role, n] of Object.entries(byRole)) console.log(`  ${role.padEnd(8)} ${n}`);
console.log(`Total passages: ${total}`);

console.log(`\nTop 10 files by passage count:`);
perFile.sort((a, b) => b.n - a.n);
for (const r of perFile.slice(0, 10)) {
  console.log(`  ${r.file.padEnd(28)} ${r.role.padEnd(6)} ${r.n}`);
}
console.log(`\nBottom 5 files:`);
for (const r of perFile.slice(-5)) {
  console.log(`  ${r.file.padEnd(28)} ${r.role.padEnd(6)} ${r.n}`);
}

// Estimate at 7 sec/passage (CST commentary average is large)
const estSec = total * 7;
const estHours = (estSec / 3600).toFixed(1);
console.log(`\nIngest time estimate @ 7s/passage: ${estHours} hours`);
