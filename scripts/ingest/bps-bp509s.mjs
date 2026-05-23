// BPS BP509S parser — Nyanaponika Thera, The Heart of Buddhist
// Meditation, BPS 1962 (modern Buddhist classic; the foundational
// English exposition of satipaṭṭhāna).
//
// Structure:
//   Front (p1-15):       title, copyright, contents, introduction
//   Part One (p16-114):  Nyanaponika's extended essay
//   Part Two (p115-135): The Greater Discourse on the Foundations
//                        of Mindfulness (Mahā-Satipaṭṭhāna-Sutta,
//                        DN 22) — full translation
//   Part Three (p136-216): "Flowers of Deliverance" — anthology of
//                          related sutta passages from across the
//                          Pāli canon
//   Back (p217-228):     source references, glossary, index
//
// Diacritics: BP509S already uses canonical IAST (ā, ṭ, ñ, etc.).
// No Latin-1 substitution table needed — verified by inspecting the
// PDF text directly.
//
// Ingest:
//   Part Two → one translations row aligned to passage_id='dn22',
//             translator='nyanaponika'
//   Front Introduction + Part One + Part Three → three Library
//             articles (introduction, essay, anthology)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp509s.pdf');

// ─────────────────── PDF read + page split ───────────────────

export async function loadBp509sPages() {
  const buf = await fs.readFile(PDF_PATH);
  const { text, total } = await new PDFParse({ data: buf }).getText();
  const parts = text.split(/-- (\d+) of \d+ --/);
  const pages = new Map();
  for (let i = 1; i < parts.length; i += 2) {
    pages.set(parseInt(parts[i], 10), (parts[i + 1] || '').trim());
  }
  return { pages, total };
}

// ─────────────────── Page cleaning ───────────────────

const KNOWN_HEADERS = new Set([
  'The Heart of Buddhist Meditation',
  'The Foundations of Mindfulness',
  'The Basic Text',
  'Flowers of Deliverance',
  'From the Pāli Canon',
  'Notes',
  'Introduction',
  'Index',
]);

function cleanPageBody(body) {
  const lines = body.split('\n').map((l) => l.trim());
  const kept = [];
  for (const l of lines) {
    if (!l) { kept.push(''); continue; }
    if (KNOWN_HEADERS.has(l)) continue;
    // Bare page number on its own line (running header)
    if (/^\d{1,4}$/.test(l) && l.length <= 4) continue;
    if (/^[ivxlcdm]{1,5}$/i.test(l)) continue;
    // "127 | The Basic Text" style headers — running headers with
    // separator. Strip when the trailing portion is a known header.
    const m = l.match(/^\d{1,4}\s*\|\s*(.+)$/);
    if (m && KNOWN_HEADERS.has(m[1])) continue;
    const m2 = l.match(/^(.+)\s*\|\s*\d{1,4}$/);
    if (m2 && KNOWN_HEADERS.has(m2[1])) continue;
    kept.push(l);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─────────────────── Section ranges ───────────────────

const SECTION_RANGES = {
  front:     { start: 1,   end: 15  },
  partOne:   { start: 16,  end: 114 },
  partTwo:   { start: 115, end: 135 },
  partThree: { start: 136, end: 216 },
  back:      { start: 217, end: 999 },
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

// ─────────────────── Public entry ───────────────────

export async function parseBp509s() {
  const { pages, total } = await loadBp509sPages();
  const out = {
    code: 'BP509S',
    title: 'The Heart of Buddhist Meditation',
    subtitle: 'A Handbook of Mental Training Based on the Buddha\'s Way of Mindfulness',
    translator: 'nyanaponika',
    translatorDisplay: 'Nyanaponika Thera',
    source: 'bps-direct',
    sourceBook: 'The Heart of Buddhist Meditation (BP509S, 1962)',
    sourceUrl: 'https://www.bps.lk/olib/bp/bp509s_Nyanaponika_Heart-of-Buddhist-Meditation.pdf',
    license: 'bps-fair-use',
    copyright: '© 1962 by Nyanaponika Thera',
    pdfPages: total,
  };
  for (const [name, { start, end }] of Object.entries(SECTION_RANGES)) {
    out[name] = joinPages(pages, start, end);
  }
  return out;
}

// ─────────────────── CLI dry-run dump ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  const parsed = await parseBp509s();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp509s-extracted');
  await fs.mkdir(outDir, { recursive: true });
  for (const section of ['front', 'partOne', 'partTwo', 'partThree', 'back']) {
    const file = path.join(outDir, `${section}.txt`);
    await fs.writeFile(file, parsed[section], 'utf8');
    console.log(`  ${section.padEnd(10)} → ${file}  (${parsed[section].length} chars)`);
  }
  console.log(`\nPart Two opening (first 400):`);
  console.log('  ' + parsed.partTwo.slice(0, 400).replace(/\n/g, '\n  '));
}
