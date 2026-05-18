// One-shot diagnostic: replicate the ingest script's skip logic and list
// the actual filenames that fail, grouped by reason. Lets us know whether
// the 603 skipped files are:
//   - regex misses (parseId returns null), or
//   - empty content after JSON.parse + Object.values().join() + trim().
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   node diagnose-skipped.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '.cache', 'bilara-data', 'root', 'pli', 'ms', 'sutta');

// Mirror of ingest.mjs parseId (patched: allow hyphens in prefix for tha-ap etc.)
function parseId(filename) {
  const m = filename.match(/^([a-z][a-z-]*\d[\w\d.-]*)_root-pli-ms\.json$/);
  return m ? m[1] : null;
}

function loadSegments(p) {
  if (!fs.existsSync(p)) return null;
  let obj;
  try { obj = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return `__JSON_PARSE_ERROR__:${e.message}`; }
  return Object.values(obj).join(' ').replace(/\s+/g, ' ').trim();
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('_root-pli-ms.json')) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
console.log(`scanning ${files.length} pali source files\n`);

const regexFail = [];
const jsonError = [];
const emptyContent = [];
const ingestable = [];

for (const p of files) {
  const base = path.basename(p);
  const id = parseId(base);
  if (!id) { regexFail.push(base); continue; }
  const text = loadSegments(p);
  if (typeof text === 'string' && text.startsWith('__JSON_PARSE_ERROR__')) {
    jsonError.push({ base, err: text });
    continue;
  }
  if (!text) { emptyContent.push(base); continue; }
  ingestable.push(base);
}

console.log(`regex fail:    ${regexFail.length}`);
console.log(`json error:    ${jsonError.length}`);
console.log(`empty content: ${emptyContent.length}`);
console.log(`ingestable:    ${ingestable.length}`);
console.log(`total:         ${files.length}\n`);

if (regexFail.length > 0) {
  console.log('--- regex fail samples (first 15) ---');
  for (const b of regexFail.slice(0, 15)) console.log('  ' + b);
}

if (jsonError.length > 0) {
  console.log('\n--- json error samples ---');
  for (const e of jsonError.slice(0, 5)) console.log(`  ${e.base}: ${e.err}`);
}

if (emptyContent.length > 0) {
  console.log('\n--- empty content samples (first 20) ---');
  for (const b of emptyContent.slice(0, 20)) console.log('  ' + b);

  // Group by canon prefix
  const byCanon = new Map();
  for (const b of emptyContent) {
    const m = b.match(/^([a-z]+)/);
    const canon = m ? m[1] : 'unknown';
    byCanon.set(canon, (byCanon.get(canon) || 0) + 1);
  }
  console.log('\n--- empty content by canon prefix ---');
  for (const [c, n] of Array.from(byCanon.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}: ${n}`);
  }

  // Pick one to inspect raw
  console.log('\n--- raw content of first 3 empty files ---');
  for (const b of emptyContent.slice(0, 3)) {
    const fullPath = files.find((f) => f.endsWith(b));
    const raw = fs.readFileSync(fullPath, 'utf8');
    console.log(`\n  ${b}:`);
    console.log('  ' + raw.slice(0, 300).replace(/\n/g, '\\n'));
  }
}
