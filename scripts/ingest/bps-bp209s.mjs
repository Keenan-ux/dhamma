// BPS BP209S parser — Bhikkhu Bodhi, The Discourse on the All-Embracing
// Net of Views (Brahmajāla Sutta and its Commentaries), BPS 1978 / 2nd
// edition 2007.
//
// Different from the other three Bodhi BPS books in two ways:
//
//   1) Diacritic encoding is canonical Unicode IAST throughout (ā, ī,
//      ū, ṭ, ḍ, ṇ, ṅ, ñ, ṃ all as their proper Unicode codepoints,
//      not Latin-1 substitutes). The 2007 typesetting was done with
//      a Unicode-aware font, unlike the 1980s-era BP210S/211S/212S.
//      The diacritic map is effectively empty — almost everything
//      passes through unchanged.
//
//   2) Five Parts plus appendices, not the usual two-Part layout:
//        Part One   — Brahmajāla Sutta translation       (→ translations)
//        Part Two   — Commentarial Exegesis              (→ translations)
//        Part Three — The Method of the Exegetical Treatises  (→ article)
//        Part Four  — A Treatise on the Pāramīs          (→ article)
//        Part Five  — The Meaning of the Word "Tathāgata" (→ article)
//        Appendix 1 — A Summary of the Net of Views       (→ article)
//        Appendix 2 — Pāli passages
//      The orchestrator decides which sections become translations
//      vs Library articles; this module just emits the chunks.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp209s.pdf');

// ─────────────────── Diacritic normalisation (BP209S) ───────────────────
//
// Empty map — BP209S already uses canonical IAST. Kept as a function
// for shape-consistency with bps-bp210s/211s/212s.

const BP209S_DIACRITICS = {
  // BP209S typesets 'ḷ' (retroflex l, U+1E37) as '¿' due to a font-
  // substitution glitch — appears 37 times across the book ("Pā¿i"
  // for Pāḷi, "Pā¿i Canon", etc.). Verified by context: every ¿ in
  // the PDF is between two recognised Pāli letters where ḷ would be
  // the expected character.
  '¿': 'ḷ',
};

export function normalizeBp209sDiacritics(text) {
  let out = '';
  for (const ch of text) out += BP209S_DIACRITICS[ch] ?? ch;
  return out;
}

// ─────────────────── PDF read + page split ───────────────────

export async function loadBp209sPages() {
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
// BP209S running headers:
//   "TRANSLATOR'S PREFACE" / "v Translator's Preface" — front matter
//   "Introduction N" — introduction body
//   "The All-Embracing Net of Views N" or "N The All-Embracing Net of Views"
//   "INDEX" / "Index N"

const HEADER_RE = /^(?:[ivxlcdm]+|\d{1,4})?\s*(?:The All[\s-]?Embracing Net of Views|Translator['’]s Preface|Introduction|Texts Used|List of Abbreviations|Part [A-Za-z]+|Notes?|Index|Contents|Appendix \d+|Glossary|Bibliography)\s*(?:[ivxlcdm]+|\d{1,4})?\s*$/i;
const BARE_PAGE_RE = /^\d{1,4}\s*$/;
const ROMAN_PAGE_RE = /^[ivxlcdm]{1,5}\s*$/i;

function isDecorativeReverseTextPage(body) {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const singleCharLines = lines.filter((l) => l.length === 1).length;
  const tokens = body.split(/[\s\t]+/).filter(Boolean);
  if (tokens.length < 30) return false;
  const singleCharTokens = tokens.filter((t) => t.length === 1).length;
  return (lines.length >= 8 && singleCharLines / lines.length > 0.5) ||
         (singleCharTokens / tokens.length > 0.5);
}

function cleanPageBody(body) {
  if (isDecorativeReverseTextPage(body)) return '';
  const lines = body.split('\n').map((l) => l.trim());
  const kept = [];
  for (const l of lines) {
    if (!l) { kept.push(''); continue; }
    if (HEADER_RE.test(l) || BARE_PAGE_RE.test(l) || ROMAN_PAGE_RE.test(l)) continue;
    kept.push(l);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─────────────────── Section split ───────────────────
//
// PDF-page-numbered ranges. Printed page numbers in the GENERAL
// CONTENTS table are offset by ~17 from PDF page numbers (front
// matter pages are roman-numbered i-xv before printed page 1).
//
// GENERAL CONTENTS entries vs PDF mapping:
//   Part One   printed p51  → PDF p68
//   Part Two   printed p89  → PDF p106
//   Part Three printed p215 → PDF p232
//   Part Four  printed p243 → PDF p260
//   Part Five  printed p317 → PDF p334
//   Appendix 1 printed p331 → PDF p348
//   INDEX at PDF p356

const SECTION_RANGES = {
  front:     { start: 1,   end: 67  },
  partOne:   { start: 68,  end: 105 },   // Brahmajāla Sutta
  partTwo:   { start: 106, end: 231 },   // Commentarial Exegesis
  partThree: { start: 232, end: 259 },   // The Method of the Exegetical Treatises
  partFour:  { start: 260, end: 333 },   // A Treatise on the Pāramīs
  partFive:  { start: 334, end: 347 },   // The Meaning of "Tathāgata"
  appendices:{ start: 348, end: 355 },   // Appendices 1+2
  notes:     { start: 356, end: 999 },   // INDEX
};

export function joinPages(pages, start, end) {
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

export async function parseBp209s() {
  const { pages, total } = await loadBp209sPages();
  const out = {
    code: 'BP209S',
    title: 'The Discourse on the All-Embracing Net of Views',
    subtitle: 'The Brahmajāla Sutta and its Commentaries',
    translator: 'bodhi',
    translatorDisplay: 'Bhikkhu Bodhi',
    source: 'bps-direct',
    sourceBook: 'The Discourse on the All-Embracing Net of Views (BP209S, 1978)',
    sourceUrl: 'https://www.bps.lk/olib/bp/bp209s-Bodhi_All-Embracing-Net-Of-Views.pdf',
    license: 'bps-fair-use',
    copyright: '© 1978, 2007 by Bhikkhu Bodhi',
    pdfPages: total,
  };
  for (const [name, { start, end }] of Object.entries(SECTION_RANGES)) {
    const raw = joinPages(pages, start, end);
    out[name] = normalizeBp209sDiacritics(raw);
  }
  return out;
}

// ─────────────────── CLI ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  const parsed = await parseBp209s();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp209s-extracted');
  await fs.mkdir(outDir, { recursive: true });
  const sections = ['front', 'partOne', 'partTwo', 'partThree', 'partFour', 'partFive', 'appendices', 'notes'];
  const lens = {};
  for (const section of sections) {
    const file = path.join(outDir, `${section}.txt`);
    await fs.writeFile(file, parsed[section], 'utf8');
    console.log(`  ${section.padEnd(11)} → ${file}  (${parsed[section].length} chars)`);
    lens[section] = parsed[section].length;
  }
  await fs.writeFile(path.join(outDir, 'meta.json'), JSON.stringify({
    code: parsed.code, title: parsed.title, subtitle: parsed.subtitle,
    translator: parsed.translator, translatorDisplay: parsed.translatorDisplay,
    source: parsed.source, sourceBook: parsed.sourceBook,
    sourceUrl: parsed.sourceUrl, license: parsed.license,
    copyright: parsed.copyright, pdfPages: parsed.pdfPages,
    sectionLengths: lens,
  }, null, 2));
  console.log(`\nSection length summary:`);
  console.table(lens);
}
