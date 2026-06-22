#!/usr/bin/env node
// Single-source generator (item #6): emit the IndividualGuidanceStudy NARRATIVE
// JSX FROM the readable MD, so prose is edited ONCE (FINDINGS-readable.md) and the
// deployed reader is regenerated. The narrative is split into TWO generated regions
// — §§II–IV and §§V + "Findings of general importance" — because the data-bound
// {ds.term} drift-strip table sits between them (and the abstract's reproducibility
// <details> and the appendix census tables are data-bound too). Those data regions
// stay hand-JSX, untouched, between the GEN markers in ResearchView.jsx.
//
//   node research/individual-guidance/gen-narrative.mjs --dry    # print, no write
//   node research/individual-guidance/gen-narrative.mjs --check  # report equivalence vs current, no write
//   node research/individual-guidance/gen-narrative.mjs          # inject between markers
//
// Citations: the display->id map comes from the CURRENT JSX (the id authority), so
// the generator wraps exactly the citations the reader already has, with their ids;
// any MD citation absent from the map is reported (add it to the reader once).
import fs from 'node:fs';

const MD = 'research/individual-guidance/FINDINGS-readable.md';
const JSX = 'src/ResearchView.jsx';
const MARK = {
  A: ['{/* GEN:NARRATIVE-A:START — §§II–IV, generated from FINDINGS-readable.md by gen-narrative.mjs; do not hand-edit */}',
      '{/* GEN:NARRATIVE-A:END */}'],
  B: ['{/* GEN:NARRATIVE-B:START — §§V–Findings, generated from FINDINGS-readable.md by gen-narrative.mjs; do not hand-edit */}',
      '{/* GEN:NARRATIVE-B:END */}'],
};
const mode = process.argv.includes('--dry') ? 'dry' : process.argv.includes('--check') ? 'check' : 'inject';

const jsxAll = fs.readFileSync(JSX, 'utf8');
const citeMap = new Map();
for (const m of jsxAll.matchAll(/<Cite id="([^"]+)">([^<]+)<\/Cite>/g)) citeMap.set(m[2].trim().replace(/\s+/g, ' '), m[1]);
const citeKeys = [...citeMap.keys()].sort((a, b) => b.length - a.length);

const md = fs.readFileSync(MD, 'utf8').replace(/\r\n/g, '\n');
const mdLines = md.split('\n');
const i2 = mdLines.findIndex((l) => /^## II\./.test(l));
const i5 = mdLines.findIndex((l) => /^## V\./.test(l));
const iFooter = mdLines.findIndex((l, idx) => idx > i2 && /^\*The full machine-checkable/.test(l));
let iEnd = iFooter > 0 ? iFooter : mdLines.length;
while (iEnd > i2 && (mdLines[iEnd - 1].trim() === '' || mdLines[iEnd - 1].trim() === '---')) iEnd--;
const partAmd = mdLines.slice(i2, i5).join('\n');
const partBmd = mdLines.slice(i5, iEnd).join('\n');

const esc = (s) => s.replace(/([{}<>])/g, '{"$1"}'); // rare in prose
function inlineJsx(text) {
  let out = '';
  // split on *emphasis* and `code` spans; both are Pāli terms here -> <em>
  for (const p of text.split(/(\*[^*]+\*|`[^`]+`)/g)) {
    if (/^\*[^*]+\*$/.test(p) || /^`[^`]+`$/.test(p)) out += `<em>${esc(p.slice(1, -1))}</em>`;
    else out += wrapCites(esc(p));
  }
  return out;
}
function wrapCites(s) {
  const slots = [];
  for (const key of citeKeys) {
    const id = citeMap.get(key);
    const pat = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-–—]/g, '[-–—]'); // dash-insensitive
    const re = new RegExp('(?<![\\p{L}\\p{N}])' + pat + '(?![\\p{L}\\d.])', 'gu');
    s = s.replace(re, () => { slots.push(`<Cite id="${id}">${esc(key)}</Cite>`); return `\x00${slots.length - 1}\x00`; });
  }
  return s.replace(/\x00(\d+)\x00/g, (_, n) => slots[+n]);
}
const stripMd = (t) => t.replace(/`([^`]*)`/g, '$1');

function blocksToJsx(mdSlice) {
  const out = [];
  for (const b of mdSlice.split(/\n\n+/).map((x) => x.trim()).filter(Boolean)) {
    if (/^### /.test(b)) out.push(`<h3 style={h3}>${inlineJsx(stripMd(b.replace(/^###\s+/, '')))}</h3>`);
    else if (/^## /.test(b)) out.push(`<h2 style={h2}>${inlineJsx(stripMd(b.replace(/^##\s+(?:[IVX]+\.\s+)?/, '')))}</h2>`);
    else if (/^\*\*G\d+\./.test(b)) {
      const mm = b.match(/^\*\*(G\d+\.[^*]+?)\.\*\*\s*([\s\S]*)$/);
      out.push(`<h3 style={h3}>${inlineJsx(stripMd((mm ? mm[1] : b)))}</h3>`);
      if (mm && mm[2].trim()) out.push(`<p>${inlineJsx(mm[2].trim())}</p>`);
    } else out.push(`<p>${inlineJsx(b)}</p>`);
  }
  return out;
}

const partA = blocksToJsx(partAmd);
const partB = blocksToJsx(partBmd);

// citations in the MD not covered by the reader map
const missing = new Set();
for (const b of (partAmd + '\n' + partBmd).split('\n')) {
  for (const m of b.matchAll(/(?<![\p{L}\p{N}])((?:AN|MN|SN|DN|Ud|Iti|Snp|Dhp|Thag|Thig|Kp|Pp|PS|CND|Vism|Sv-a|Vibh-a|Dhp-a|Yamaka) ?[\d.§–\-]+)/gu)) {
    const tok = m[1].trim().replace(/\s+/g, ' ');
    if (!citeKeys.some((k) => tok === k)) missing.add(tok);
  }
}

if (mode === 'dry') {
  console.log(`partA (§§II–IV): ${partA.length} elements · partB (§§V–Findings): ${partB.length} elements`);
  console.log('\n--- partA[0..4] ---'); for (const p of partA.slice(0, 5)) console.log('\n' + p);
  console.log('\n--- partB[0..2] ---'); for (const p of partB.slice(0, 3)) console.log('\n' + p);
  if (missing.size) { console.log('\nMD citations NOT in reader map (verify):'); for (const x of missing) console.log('   · ' + x); }
  process.exit(0);
}

const indent = '\n              ';
const genA = indent + partA.join(indent) + indent;
const genB = indent + partB.join(indent) + indent;

for (const [k, [s, e]] of Object.entries(MARK)) {
  if (!jsxAll.includes(s) || !jsxAll.includes(e)) {
    console.error(`Markers for region ${k} not found in ${JSX}. One-time wiring needed (place ${k} START/END around the current ${k === 'A' ? '§§II–IV' : '§§V–Findings'} JSX).`);
    process.exit(2);
  }
}
const reA = new RegExp(escRe(MARK.A[0]) + '[\\s\\S]*?' + escRe(MARK.A[1]));
const reB = new RegExp(escRe(MARK.B[0]) + '[\\s\\S]*?' + escRe(MARK.B[1]));

if (mode === 'check') {
  const norm = (x) => (x || '').replace(/\{' '\}/g, ' ').replace(/\s+/g, ' ').trim();
  const ca = norm((jsxAll.match(reA) || [''])[0]), ga = norm(MARK.A[0] + genA + MARK.A[1]);
  const cb = norm((jsxAll.match(reB) || [''])[0]), gb = norm(MARK.B[0] + genB + MARK.B[1]);
  console.log(`region A: ${ca === ga ? 'EQUIVALENT ✓' : 'DIFFERS'} · region B: ${cb === gb ? 'EQUIVALENT ✓' : 'DIFFERS'}`);
  if (missing.size) { console.log('MD citations not in reader map:'); for (const x of missing) console.log('   · ' + x); }
  process.exit(0);
}

let next = jsxAll.replace(reA, MARK.A[0] + genA + MARK.A[1]).replace(reB, MARK.B[0] + genB + MARK.B[1]);
fs.writeFileSync(JSX, next);
console.log(`Injected: region A ${partA.length} elements, region B ${partB.length} elements.`);
if (missing.size) { console.log('MD citations not in reader map (add to reader once):'); for (const x of missing) console.log('   · ' + x); }

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
