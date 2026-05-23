// BPS BP501S parser — Soma Thera, The Way of Mindfulness, BPS.
// Translation of the Satipaṭṭhāna-Sutta (MN 10) with extensive
// commentary and sub-commentary excerpts interleaved with the
// canonical text.
//
// Structure (PDF):
//   p1-8     Title + copyright + Contents
//   p9-14    Foreword
//   p15-30   Introduction
//   p31-215  Body — Soma's translation of the sutta with the
//            commentary and sub-commentary excerpts woven in
//   p216-217 Back matter
//
// Because the discourse text and commentary are not cleanly
// separable (Soma's typesetting interleaves them by section), the
// ingest emits the body as one Library article rather than trying
// to split out a canonical mn10 / dn22 translation row. Scholars
// can still find the material via Library + search.
//
// Diacritics: Latin-1 BPS family — á→ā, þ→ṭ, ó→ṇ, í→ṃ, ò→ṅ, ì→ī,
// ú→ū, ð→ḍ.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp501s.pdf');

const BP501S_DIACRITICS = {
  'á': 'ā', 'Á': 'Ā',
  'í': 'ṃ',
  'ì': 'ī', 'Ì': 'Ī',
  'ó': 'ṇ', 'Ó': 'Ṇ',
  'ò': 'ṅ', 'Ò': 'Ṅ',
  'ú': 'ū', 'Ú': 'Ū',
  'þ': 'ṭ', 'Þ': 'Ṭ',
  'ð': 'ḍ', 'Ð': 'Ḍ',
};

export function normalizeBp501sDiacritics(text) {
  let out = '';
  for (const ch of text) out += BP501S_DIACRITICS[ch] ?? ch;
  return out;
}

export async function loadBp501sPages() {
  const buf = await fs.readFile(PDF_PATH);
  const { text, total } = await new PDFParse({ data: buf }).getText();
  const parts = text.split(/-- (\d+) of \d+ --/);
  const pages = new Map();
  for (let i = 1; i < parts.length; i += 2) {
    pages.set(parseInt(parts[i], 10), (parts[i + 1] || '').trim());
  }
  return { pages, total };
}

const KNOWN_HEADERS = new Set([
  'THE WAY OF MINDFULNESS',
  'The Way of Mindfulness',
  'Foreword',
  'FOREWORD',
  'Introduction',
  'INTRODUCTION',
  'The Discourse',
  'Notes',
]);

function cleanPageBody(body) {
  const lines = body.split('\n').map((l) => l.trim());
  const kept = [];
  for (const l of lines) {
    if (!l) { kept.push(''); continue; }
    if (KNOWN_HEADERS.has(l)) continue;
    if (/^\d{1,4}$/.test(l) && l.length <= 4) continue;
    if (/^[ivxlcdm]{1,5}$/i.test(l)) continue;
    kept.push(l);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const SECTION_RANGES = {
  front:        { start: 1,   end: 14  },
  foreword:     { start: 9,   end: 14  },
  introduction: { start: 15,  end: 30  },
  body:         { start: 31,  end: 215 },
  back:         { start: 216, end: 999 },
};

function joinPages(pages, start, end) {
  const buf = [];
  for (let p = start; p <= end; p++) {
    const body = pages.get(p);
    if (!body) continue;
    const cleaned = cleanPageBody(body);
    if (cleaned) buf.push(cleaned);
  }
  return buf.join('\n\n');
}

export async function parseBp501s() {
  const { pages, total } = await loadBp501sPages();
  const out = {
    code: 'BP501S',
    title: 'The Way of Mindfulness',
    subtitle: 'The Satipaṭṭhāna Sutta and its Commentary',
    translator: 'soma',
    translatorDisplay: 'Soma Thera',
    source: 'bps-direct',
    sourceBook: 'The Way of Mindfulness (BP501S)',
    sourceUrl: 'https://www.bps.lk/olib/bp/bp501s_Soma_Way-of-Mindfulness.pdf',
    license: 'bps-fair-use',
    copyright: '© Buddhist Publication Society',
    pdfPages: total,
  };
  for (const [name, { start, end }] of Object.entries(SECTION_RANGES)) {
    const raw = joinPages(pages, start, end);
    out[name] = normalizeBp501sDiacritics(raw);
  }
  return out;
}

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  const parsed = await parseBp501s();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp501s-extracted');
  await fs.mkdir(outDir, { recursive: true });
  for (const section of ['front', 'foreword', 'introduction', 'body', 'back']) {
    const file = path.join(outDir, `${section}.txt`);
    await fs.writeFile(file, parsed[section], 'utf8');
    console.log(`  ${section.padEnd(14)} → ${file}  (${parsed[section].length} chars)`);
  }
  console.log(`\nBody opening (first 400):`);
  console.log('  ' + parsed.body.slice(0, 400).replace(/\n/g, '\n  '));
}
