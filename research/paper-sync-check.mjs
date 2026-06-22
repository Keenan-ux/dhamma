#!/usr/bin/env node
// Paper sync checker: catch MD <-> JSX drift for a study whose prose is
// maintained in BOTH a readable .md (the PDF source) AND a hand-written JSX
// study component in src/ResearchView.jsx (the deployed reader). Editing one
// and forgetting the other is the standing dual-maintenance hazard; run this in
// the editorial coherence pass before any deploy.
//
//   node research/paper-sync-check.mjs <readable.md> <StudyComponentName>
//   node research/paper-sync-check.mjs research/individual-guidance/FINDINGS-readable.md IndividualGuidanceStudy
//
// It bounds the JSX to the study's PROSE region (the {/* ABSTRACT */} marker
// down to the data-rendered APPENDIX), strips JSX/markdown markup to comparable
// sentences, then FUZZY-matches each sentence to its nearest counterpart by
// token-overlap (Jaccard). A sentence whose best match is below MIN_SIM is
// reported as drift. Fuzzy (not exact-substring) so legitimate equivalences pass:
// *carita* == <em>carita</em>, "(AN 7.66)" == <Cite>…</Cite>, a {fmt(n)}
// data-bound count vs a literal number, line-break {' '} spacing. NOT a renderer
// and NOT a hard gate — an eyeball aid that flags where the two copies diverge so
// the human keeps them in step (the real single-source fix is to render the paper
// FROM the MD; that is a larger refactor of the live multi-study component).
import fs from 'node:fs';

const MIN_SIM = 0.55;     // below this, a sentence has no close counterpart -> drift
const MIN_TOKENS = 7;     // skip short fragments / headings / list stubs

const [, , mdPath, comp = 'IndividualGuidanceStudy'] = process.argv;
if (!mdPath) { console.error('usage: paper-sync-check.mjs <readable.md> [StudyComponent]'); process.exit(2); }
const JSX_PATH = 'src/ResearchView.jsx';

let jsx = fs.readFileSync(JSX_PATH, 'utf8');
const cstart = jsx.indexOf(`function ${comp}`);
if (cstart < 0) { console.error(`component ${comp} not found in ${JSX_PATH}`); process.exit(2); }
// Bound to the prose region: the ABSTRACT marker (skips the component's JS logic)
// down to the data-rendered appendix.
let pstart = jsx.indexOf('ABSTRACT', cstart);
pstart = pstart < 0 ? cstart : jsx.lastIndexOf('{', pstart);
let pend = jsx.indexOf('APPENDIX', pstart);
if (pend < 0) { const n = jsx.indexOf('\nfunction ', cstart + 10); pend = n < 0 ? jsx.length : n; }
jsx = jsx.slice(pstart, pend);

const toks = (s) => s.normalize('NFC').toLowerCase().replace(/[^\p{L}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
const jaccard = (a, b) => {
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter || 1);
};

function mdText(s) {
  return s
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_#>|]/g, ' ');
}
function jsxText(s) {
  return s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<Cite[^>]*>/g, ' ').replace(/<\/Cite>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{'\s*'\}/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ');
}
const sentences = (text) => text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/)
  .map((x) => x.trim()).filter((x) => toks(x).length >= MIN_TOKENS);

const mdSents = sentences(mdText(fs.readFileSync(mdPath, 'utf8')));
const jsxSents = sentences(jsxText(jsx));
const mdTok = mdSents.map(toks), jsxTok = jsxSents.map(toks);

function drift(srcSents, srcTok, dstTok) {
  const out = [];
  for (let i = 0; i < srcSents.length; i++) {
    let best = 0;
    for (const dt of dstTok) { const s = jaccard(srcTok[i], dt); if (s > best) best = s; if (best >= MIN_SIM) break; }
    if (best < MIN_SIM) out.push({ s: srcSents[i], best });
  }
  return out;
}

const mdOnly = drift(mdSents, mdTok, jsxTok);
const jsxOnly = drift(jsxSents, jsxTok, mdTok);

const show = (arr, label) => {
  if (!arr.length) { console.log(`  none — ${label} in sync`); return; }
  console.log(`  ${arr.length} ${label}:`);
  for (const { s, best } of arr.slice(0, 40)) console.log(`   · [${best.toFixed(2)}] ${s.replace(/\s+/g, ' ').slice(0, 140)}`);
  if (arr.length > 40) console.log(`   … and ${arr.length - 40} more`);
};

console.log(`\nPaper sync: ${mdPath}  <->  ${comp} in ${JSX_PATH}`);
console.log(`MD sentences: ${mdSents.length} · JSX prose sentences: ${jsxSents.length} · sim threshold ${MIN_SIM}\n`);
console.log('MD prose with no close match in the deployed JSX:');
show(mdOnly, 'MD-only');
console.log('\nJSX prose with no close match in the readable MD:');
show(jsxOnly, 'JSX-only');

const total = mdOnly.length + jsxOnly.length;
console.log(`\n${total === 0 ? 'IN SYNC ✓' : `${total} sentence(s) to reconcile (eyeball: some may be legit rewordings)`}`);
process.exit(total === 0 ? 0 : 1);
