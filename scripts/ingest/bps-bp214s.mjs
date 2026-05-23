// BPS BP214s parser — John D. Ireland, The Udāna: Inspired Utterances of
// the Buddha and The Itivuttaka: The Buddha's Sayings, BPS 1997.
//
// Two short Khuddaka books in one volume. Each book has its own
// Introduction + chapter-divided sutta text. We emit one translation
// row per sutta:
//
//   Udāna 80 suttas:  ud1.1 … ud8.10 (eight chapters of varying length)
//   Itivuttaka 112 suttas: iti1 … iti112 (four sections, by sutta-count)
//
// Front matter: title page, copyright, contents, abbreviations,
//   List of Sutta Titles, Introduction (1 Udāna intro + 1 Iti intro
//   inline at each Part opener).
//
// Diacritic encoding: same Latin-1 substitute family as the other
// BPS Tier 2/4 books — á→ā, þ→ṭ, ó→ṇ, í→ṃ, ò→ṅ, ì→ī, ú→ū, ð→ḍ.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp214s.pdf');

// ─────────────────── Diacritic normalisation ───────────────────

const BP214S_DIACRITICS = {
  'á': 'ā', 'Á': 'Ā',
  'í': 'ṃ',
  'ì': 'ī', 'Ì': 'Ī',
  'ó': 'ṇ', 'Ó': 'Ṇ',  // BP214S uses capital Ó for Ṇ (SOÓA → SOṆA)
  'ò': 'ṅ', 'Ò': 'Ṅ',
  'ú': 'ū', 'Ú': 'Ū',
  'þ': 'ṭ', 'Þ': 'Ṭ',
  'ð': 'ḍ', 'Ð': 'Ḍ',
  'ÿ': 'ḷ', 'Ÿ': 'Ḷ',  // BP214S uses ÿ for ḷ (Cūÿa → Cūḷa)
};

export function normalizeBp214sDiacritics(text) {
  let out = '';
  for (const ch of text) out += BP214S_DIACRITICS[ch] ?? ch;
  return out;
}

// ─────────────────── PDF read + page split ───────────────────

export async function loadBp214sPages() {
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
//
// Running headers in BP214s use full-caps book names (verso pages):
//   "THE UDÁNA"
//   "THE ITIVUTTAKA"
//   "INTRODUCTION"
//   "CHAPTER N" — but these mark new chapters; treat as keep, not strip

const KNOWN_HEADERS = new Set([
  'THE UDÁNA',
  'THE UDĀNA',
  'THE ITIVUTTAKA',
  'INTRODUCTION',
]);

function cleanPageBody(body) {
  const lines = body.split('\n').map((l) => l.trim());
  const kept = [];
  for (const l of lines) {
    if (!l) { kept.push(''); continue; }
    if (KNOWN_HEADERS.has(l)) continue;
    // Bare arabic page number on own line
    if (/^\d{1,4}$/.test(l) && l.length <= 4) continue;
    // Bare roman number (front matter)
    if (/^[ivxlcdm]{1,5}$/i.test(l)) continue;
    kept.push(l);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─────────────────── Section ranges ───────────────────
//
// PDF page boundaries verified by inspecting page-start text:
//   p1-13 front (title, copyright, contents, abbreviations)
//   p14 Part I opener
//   p16-25 Udāna Introduction
//   p26-123 Udāna body (chapters 1-8)
//   p124 Part II opener
//   p126-129 Itivuttaka Introduction (approximate)
//   p130-? Itivuttaka body
//   Later: Notes + back matter

const SECTION_RANGES = {
  front:        { start: 1,   end: 13  },
  udPartI:      { start: 14,  end: 123 },
  itiPartII:    { start: 124, end: 207 },
  back:         { start: 208, end: 999 },
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

// ─────────────────── Sutta extraction ───────────────────
//
// Udāna sutta header pattern (after Latin-1 → IAST normalization):
//   "1.1 The First Bodhi (Paṭhamabodhi Sutta)"
//   "1.2 The Bodhi Tree (2) (Dutiyabodhi Sutta)"
//   "5.6 Soṇa (Soṇa Sutta)"
//
// Itivuttaka sutta header pattern:
//   "1 Greed (Lobha Sutta)"
//   "17 The Good Friend (Dutiya-sekha Sutta)"
//
// Both end with a parenthetical Pāli sutta name. Detection is anchored
// to that trailing pattern, so we don't mistakenly grab cross-reference
// lines like "as taught in 4.3 above".

export function splitUdanaSuttas(udBodyText) {
  // Header: "<chap>.<sutta> <EnglishTitle...> (<PāliName> Sutta)"
  // Anchored to line start (after \n) so cross-refs mid-paragraph
  // don't match. Optional "(N)" disambiguator like "(2)" allowed.
  const re = /(?:^|\n)(\d{1,2})\.(\d{1,3})\s+([^\n]{3,90}?)\s*\(([A-Za-zāīūṅñṭḍṇḷṃĀ\- ]+\s+Sutta)\)/g;
  const hits = [];
  for (const m of udBodyText.matchAll(re)) {
    hits.push({
      chap: parseInt(m[1], 10),
      sutta: parseInt(m[2], 10),
      title: m[3].trim(),
      paliName: m[4].trim(),
      index: m.index + (m[0].startsWith('\n') ? 1 : 0),
    });
  }
  // Filter: only accept the first sutta header per (chap, sutta) tuple
  // (parenthetical Pāli refs to earlier suttas later in the text are
  // common; the first occurrence at line start is the section header).
  const seen = new Set();
  const headers = [];
  for (const h of hits) {
    const k = `${h.chap}.${h.sutta}`;
    if (seen.has(k)) continue;
    seen.add(k);
    headers.push(h);
  }
  // Sort by index and slice body
  headers.sort((a, b) => a.index - b.index);
  const suttas = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const start = h.index;
    const end = i + 1 < headers.length ? headers[i + 1].index : udBodyText.length;
    suttas.push({
      passage_id: `ud${h.chap}.${h.sutta}`,
      title: h.title,
      paliName: h.paliName,
      text: udBodyText.slice(start, end).trim(),
    });
  }
  return suttas;
}

// Iti uses intra-section sutta numbering ("1", "2", …) that resets at
// each chapter. We track chapter boundaries via the "THE SECTION OF
// THE <ONES/TWOS/THREES/FOURS>" subhead and apply the absolute-offset
// table:
//   Section 1 (Ones):   iti1-iti27,   offset 0
//   Section 2 (Twos):   iti28-iti49,  offset 27
//   Section 3 (Threes): iti50-iti99,  offset 49
//   Section 4 (Fours):  iti100-iti112, offset 99
//
// These offsets come from the standard Itivuttaka section sizes — 27
// suttas in the Ones, 22 in the Twos, 50 in the Threes, 13 in the
// Fours = 112 total.
const ITI_SECTION_OFFSETS = {
  ONES:   0,
  TWOS:   27,
  THREES: 49,
  FOURS:  99,
};

export function splitItivuttakaSuttas(itiBodyText) {
  // Find chapter boundaries via "THE SECTION OF THE X" subhead lines.
  // These appear as running headers throughout each section's pages
  // (verified by inspecting the body) but the FIRST occurrence marks
  // the section start. We use the first-occurrence position of each.
  const sectionMatches = {
    ONES: itiBodyText.search(/THE SECTION OF THE ONES/),
    TWOS: itiBodyText.search(/THE SECTION OF THE TWOS/),
    THREES: itiBodyText.search(/THE SECTION OF THE THREES/),
    FOURS: itiBodyText.search(/THE SECTION OF THE FOURS/),
  };
  // Section ranges: [start, end). Default to body length when section
  // marker missing (e.g. Fours section absent in some prints).
  const len = itiBodyText.length;
  const ranges = {
    ONES: [sectionMatches.ONES, sectionMatches.TWOS > 0 ? sectionMatches.TWOS : len],
    TWOS: [sectionMatches.TWOS, sectionMatches.THREES > 0 ? sectionMatches.THREES : len],
    THREES: [sectionMatches.THREES, sectionMatches.FOURS > 0 ? sectionMatches.FOURS : len],
    FOURS: [sectionMatches.FOURS, len],
  };

  // Header: "<sutta> <EnglishTitle> (<PāliName> Sutta)" — intra-section N
  // Also supports range form "<N>˜<M> <EnglishTitle>" where Ireland
  // groups suttas N..M under one shared translation (the BPS edition
  // collapses near-identical sutta series into a single block). The
  // tilde-like ˜ (U+02DC) or em/en dash variants all signal the range.
  const headerRe = /(?:^|\n)(\d{1,3})(?:[˜~–-](\d{1,3}))?\s+([A-Z][^\n]{2,90}?)\s*\(([A-Za-zāīūṅñṭḍṇḷṃĀ,\- ]+\s+Sutta)\)/g;

  function suttasInSection(sectionName) {
    const [start, end] = ranges[sectionName];
    if (start < 0 || end <= start) return [];
    const slice = itiBodyText.slice(start, end);
    const offset = ITI_SECTION_OFFSETS[sectionName];
    const hits = [];
    for (const m of slice.matchAll(headerRe)) {
      hits.push({
        intraN: parseInt(m[1], 10),
        intraEnd: m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10),
        title: m[3].trim(),
        paliName: m[4].trim(),
        sliceIdx: m.index + (m[0].startsWith('\n') ? 1 : 0),
      });
    }
    // First-occurrence-wins per intraN
    const seen = new Set();
    const headers = [];
    for (const h of hits) {
      if (seen.has(h.intraN)) continue;
      seen.add(h.intraN);
      headers.push(h);
    }
    headers.sort((a, b) => a.sliceIdx - b.sliceIdx);
    const out = [];
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      const s = h.sliceIdx;
      const e = i + 1 < headers.length ? headers[i + 1].sliceIdx : slice.length;
      const text = slice.slice(s, e).trim();
      // Range form: replicate the same translation across every covered
      // sutta number, with a note flagging the shared-block source.
      const sharedNote = h.intraN !== h.intraEnd
        ? `(Ireland groups Itivuttaka ${h.intraN + offset}–${h.intraEnd + offset} under one shared treatment.)`
        : null;
      for (let n = h.intraN; n <= h.intraEnd; n++) {
        out.push({
          passage_id: `iti${n + offset}`,
          title: h.title,
          paliName: h.paliName,
          text,
          sharedNote,
        });
      }
    }
    return out;
  }

  return [
    ...suttasInSection('ONES'),
    ...suttasInSection('TWOS'),
    ...suttasInSection('THREES'),
    ...suttasInSection('FOURS'),
  ];
}

// ─────────────────── Public entry ───────────────────

export async function parseBp214s() {
  const { pages, total } = await loadBp214sPages();
  const front = joinPages(pages, SECTION_RANGES.front.start, SECTION_RANGES.front.end);
  const udPartI = joinPages(pages, SECTION_RANGES.udPartI.start, SECTION_RANGES.udPartI.end);
  const itiPartII = joinPages(pages, SECTION_RANGES.itiPartII.start, SECTION_RANGES.itiPartII.end);
  const back = joinPages(pages, SECTION_RANGES.back.start, SECTION_RANGES.back.end);

  const normFront = normalizeBp214sDiacritics(front);
  const normUdPartI = normalizeBp214sDiacritics(udPartI);
  const normItiPartII = normalizeBp214sDiacritics(itiPartII);
  const normBack = normalizeBp214sDiacritics(back);

  const udanaSuttas = splitUdanaSuttas(normUdPartI);
  const itivuttakaSuttas = splitItivuttakaSuttas(normItiPartII);

  return {
    code: 'BP214S',
    title: 'The Udāna and the Itivuttaka',
    subtitle: 'Inspired Utterances of the Buddha & The Buddha\'s Sayings',
    translator: 'ireland',
    translatorDisplay: 'John D. Ireland',
    source: 'bps-direct',
    sourceBook: 'The Udāna and the Itivuttaka (BP214S, 1997)',
    sourceUrl: 'https://www.bps.lk/olib/bp/bp214s_Ireland_The-Udana-The-Itivuttaka.pdf',
    license: 'bps-fair-use',
    copyright: '© 1997 by John D. Ireland',
    pdfPages: total,
    front: normFront,
    udPartI: normUdPartI,
    itiPartII: normItiPartII,
    back: normBack,
    udanaSuttas,
    itivuttakaSuttas,
  };
}

// ─────────────────── CLI dry-run dump ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  const parsed = await parseBp214s();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp214s-extracted');
  await fs.mkdir(outDir, { recursive: true });
  for (const section of ['front', 'udPartI', 'itiPartII', 'back']) {
    const file = path.join(outDir, `${section}.txt`);
    await fs.writeFile(file, parsed[section], 'utf8');
    console.log(`  ${section.padEnd(10)} → ${file}  (${parsed[section].length} chars)`);
  }
  console.log(`\nUdāna suttas parsed: ${parsed.udanaSuttas.length} (expect 80)`);
  console.log(`Itivuttaka suttas parsed: ${parsed.itivuttakaSuttas.length} (expect 112)`);

  // Print first 3 of each for spot-check
  console.log(`\n──── Sample Udāna (first 3) ────`);
  for (const s of parsed.udanaSuttas.slice(0, 3)) {
    console.log(`\n${s.passage_id}: ${s.title} (${s.paliName})`);
    console.log('  ' + s.text.slice(0, 350).replace(/\n/g, '\n  '));
  }
  console.log(`\n──── Sample Itivuttaka (first 3) ────`);
  for (const s of parsed.itivuttakaSuttas.slice(0, 3)) {
    console.log(`\n${s.passage_id}: ${s.title} (${s.paliName})`);
    console.log('  ' + s.text.slice(0, 350).replace(/\n/g, '\n  '));
  }

  // Missing / duplicate report
  const udMap = new Map(parsed.udanaSuttas.map(s => [s.passage_id, true]));
  const itiMap = new Map(parsed.itivuttakaSuttas.map(s => [s.passage_id, true]));
  const missingUd = [];
  for (let ch = 1; ch <= 8; ch++) {
    for (let n = 1; n <= 10; n++) if (!udMap.has(`ud${ch}.${n}`)) missingUd.push(`ud${ch}.${n}`);
  }
  const missingIti = [];
  for (let n = 1; n <= 112; n++) if (!itiMap.has(`iti${n}`)) missingIti.push(`iti${n}`);
  console.log(`\nmissing Udāna suttas: ${missingUd.length} ${missingUd.slice(0, 10).join(', ')}${missingUd.length > 10 ? '…' : ''}`);
  console.log(`missing Itivuttaka suttas: ${missingIti.length} ${missingIti.slice(0, 10).join(', ')}${missingIti.length > 10 ? '…' : ''}`);
}
