// Smoke test for cst-parse.mjs. Parses 5 representative CST files and
// reports passage counts, lengths, and sample titles. Run from
// scripts/ingest:  node cst-parse-smoke.mjs

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCstFile } from './cst-parse.mjs';
import { workForFile, passageId, formatCstCitation } from './cst-works.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROMN = path.join(__dirname, '.cache', 'cst-test', 'romn');

const SAMPLES = [
  's0101m.mul.xml',  // DN mūla (div-nested)
  's0101a.att.xml',  // Sumaṅgalavilāsinī (div-nested)
  'abh01a.att.xml',  // Atthasālinī (flat)
  'vin01a.att.xml',  // Samantapāsādikā (flat)
  'e0101n.mul.xml',  // Visuddhimagga (flat)
];

for (const fname of SAMPLES) {
  const work = workForFile(fname);
  console.log(`\n━━━ ${fname} ━━━`);
  console.log(`  work_slug=${work?.work_slug} citation=${work?.citation_prefix} role=${work?.role}`);
  const t0 = Date.now();
  const { work_name, passages } = await parseCstFile(path.join(ROMN, fname));
  const ms = Date.now() - t0;
  console.log(`  parsed in ${ms}ms · work_name="${work_name}" · ${passages.length} passages`);
  if (passages.length === 0) continue;

  const lengths = passages.map((p) => p.original.length);
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  console.log(`  passage lengths: min=${min} avg=${avg} max=${max}`);

  // Show first 3 passage titles + first 200 chars of each body
  for (const p of passages.slice(0, 3)) {
    const id = passageId(fname.replace(/\.xml$/, ''), p.xml_div_id || Number(p.section_id));
    const cit = formatCstCitation(work.citation_prefix, p.xml_div_id || Number(p.section_id));
    console.log(`  ─ id=${id}`);
    console.log(`    citation: ${cit}`);
    console.log(`    title: ${p.title || '(none)'}`);
    console.log(`    breadcrumb: ${p.breadcrumb.join(' › ')}`);
    console.log(`    body[0..200]: ${p.original.slice(0, 200)}…`);
  }
}
