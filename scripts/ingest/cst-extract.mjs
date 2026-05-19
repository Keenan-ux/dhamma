// Walks scripts/ingest/.cache/cst-test/romn/*.xml, parses each, and
// writes one JSONL line per passage. Bridges the Node-side parser to the
// Python-side GPU embedder. No DB connectivity needed here.
//
// Each line:
//   {id, work_slug, parent_slug, citation, title, work_role, xml_div_id,
//    original_chars: <int>, original: "<full text>"}
//
// Run:  node cst-extract.mjs           # writes cst-passages.jsonl
//       node cst-extract.mjs --only=s0101a.att.xml

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCstFile } from './cst-parse.mjs';
import { workForFile, passageId, formatCstCitation } from './cst-works.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CST_DIR = path.join(__dirname, '.cache', 'cst-test', 'romn');
const OUT_PATH = path.join(__dirname, 'cst-passages.jsonl');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const files = fs.readdirSync(CST_DIR)
  .filter((n) => n.endsWith('.xml'))
  .filter((n) => !args.only || n === args.only)
  .sort();

console.log(`[extract] ${files.length} files → ${OUT_PATH}`);
const out = fs.createWriteStream(OUT_PATH);
let total = 0;
let skippedFiles = 0;
const t0 = Date.now();

for (const filename of files) {
  const work = workForFile(filename);
  if (!work) { skippedFiles++; continue; }
  let parsed;
  try {
    parsed = await parseCstFile(path.join(CST_DIR, filename));
  } catch (err) {
    console.error(`[parse:${filename}] ${err.message}`);
    skippedFiles++;
    continue;
  }
  const baseName = filename.replace(/\.xml$/i, '');
  let counter = 0;
  for (const p of parsed.passages) {
    counter++;
    const locator = p.xml_div_id || counter;
    const record = {
      id:             passageId(baseName, locator),
      work_slug:      work.work_slug,
      parent_slug:    work.parent_slug,
      work_name:      work.work_name,
      citation:       formatCstCitation(work.citation_prefix, locator),
      title:          p.title || null,
      work_role:      work.role,
      xml_div_id:     p.xml_div_id || null,
      position:       counter,
      original_chars: p.original.length,
      original:       p.original,
    };
    out.write(JSON.stringify(record) + '\n');
    total++;
  }
}
out.end();
await new Promise((resolve) => out.on('finish', resolve));

const wall = Math.round((Date.now() - t0) / 1000);
const sz = fs.statSync(OUT_PATH).size;
console.log(`[done] ${total} passages from ${files.length - skippedFiles}/${files.length} files in ${wall}s`);
console.log(`[done] output ${OUT_PATH} (${(sz / 1024 / 1024).toFixed(1)} MB)`);
