// BPS BP210S parser — Bhikkhu Bodhi, The Discourse on the Root of
// Existence (Mūlapariyāya Sutta and its Commentaries), BPS 1980.
//
// PDF extraction via pdf-parse (PDFParse class). Splits the book
// into front matter (preface + intro), Part One (sutta translation),
// Part Two (commentarial exegesis with numbered subsections), and
// Notes (endnotes), normalises BP210S's per-font diacritic encoding
// to canonical IAST, and emits a structured object the Tier 2 ingest
// can map into translations + articles rows.
//
// Diacritic encoding: BP210S uses Latin-1 substitute characters
// instead of canonical Unicode IAST. The map below was derived by
// inspecting the 26 distinct non-ASCII characters in the PDF text
// against known Pāli words (Múlapariyáya → Mūlapariyāya,
// aþþhakathá → aṭṭhakathā, Saíyutta → Saṃyutta, etc.). Each book
// in the BPS series uses a slightly different font, so this map
// is BP210S-specific.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp210s.pdf');

// ─────────────────── Diacritic normalisation (BP210S) ───────────────────
//
// Maps the PDF's font-substituted code points to canonical IAST. Derived
// from inspection; verified by reading sample words back against known
// Pāli spellings. Curly quotes + em/en dashes are kept (they're real
// typography, not Pāli diacritics).

const BP210S_DIACRITICS = {
  // long vowels
  'á': 'ā', 'Á': 'Ā',
  'í': 'ṃ',           // BP210S uses í for anusvāra (Saíyutta → Saṃyutta)
  'ì': 'ī', 'Ì': 'Ī', // BP210S uses ì for long i (Dìgha → Dīgha)
  'ó': 'ṇ',           // retroflex n (Dhammasaògaóì → Dhammasaṅgaṇī)
  'ò': 'ṅ',           // velar nasal (Aòguttara → Aṅguttara)
  'ú': 'ū', 'Ú': 'Ū',
  // retroflex stops
  'þ': 'ṭ', 'Þ': 'Ṭ',  // aþþhakathá → aṭṭhakathā
  'ð': 'ḍ', 'Ð': 'Ḍ',
  // ñ already canonical (palatal nasal); keep
  // ÿ + å + º are rare; leave for the unmapped pass to flag
};

export function normalizeBp210sDiacritics(text) {
  let out = '';
  for (const ch of text) {
    out += BP210S_DIACRITICS[ch] ?? ch;
  }
  return out;
}

// ─────────────────── PDF read + page split ───────────────────

export async function loadBp210sPages() {
  const buf = await fs.readFile(PDF_PATH);
  const { text, total } = await new PDFParse({ data: buf }).getText();
  const parts = text.split(/-- (\d+) of \d+ --/);
  const pages = new Map();
  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10);
    const body = (parts[i + 1] || '').trim();
    pages.set(num, body);
  }
  return { pages, total };
}

// ─────────────────── Page-content cleaning ───────────────────
//
// PDF pages have running headers like "27 / The Múlapariyáya Sutta" or
// "28 Discourse on the Root of Existence" plus the occasional decorative
// page with reverse-flowed text ("X I D N E P P A..."). Detect and
// strip these before joining page bodies into section text.

const HEADER_RE = /^(?:\d{1,4}\s+)?(?:Discourse on the Root of Existence|The Múlapariyáya Sutta|Introduction|Preface|List of Abbreviations|Texts Used|Notes|NOTES)\s*$/;
const HEADER_RE2 = /^\d{1,4}\s*$/;       // bare page number
const FOOTER_HEADER_RE = /^[a-zA-Z]+$/;  // very short single-word lines often page headers

// Detect decorative reverse-flowed text by ratio of single-letter "lines"
// (lots of single chars separated by tabs/newlines means the page was
// laid out vertically and the extractor walked the wrong direction).
function isDecorativeReverseTextPage(body) {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 8) return false;
  const singleCharCount = lines.filter((l) => l.length === 1).length;
  return singleCharCount / lines.length > 0.5;
}

function cleanPageBody(body) {
  if (isDecorativeReverseTextPage(body)) return '';
  const lines = body.split('\n').map((l) => l.trim());
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l) { kept.push(''); continue; }
    if (HEADER_RE.test(l) || HEADER_RE2.test(l)) continue;
    kept.push(l);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─────────────────── Section split ───────────────────
//
// Maps the BP210S PDF to logical sections:
//
//   front:    pp 1-37  (title, copyright, ToC, preface, intro, decorative)
//   partOne:  pp 38-44 (the sutta translation)
//   partTwo:  pp 45-97 (the commentarial exegesis)
//   notes:    pp 98-end (endnotes + index)
//
// Boundaries derived empirically from the PDF; verified by spot-checking
// each transition page's opening lines.

const SECTION_RANGES = {
  front:   { start: 1,  end: 37  },
  partOne: { start: 38, end: 44  },
  partTwo: { start: 45, end: 97  },
  notes:   { start: 98, end: 999 },
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

export async function parseBp210s() {
  const { pages, total } = await loadBp210sPages();
  const out = {
    code: 'BP210S',
    title: 'The Discourse on the Root of Existence',
    subtitle: 'The Mūlapariyāya Sutta and its Commentaries',
    translator: 'bodhi',
    translatorDisplay: 'Bhikkhu Bodhi',
    source: 'bps-direct',
    sourceBook: 'The Discourse on the Root of Existence (BP210S, 1980)',
    sourceUrl: 'https://www.bps.lk/olib/bp/bp210s_Bodhi_Root-Of-Existance.pdf',
    license: 'bps-fair-use',
    copyright: '© 1980 by Bhikkhu Bodhi',
    pdfPages: total,
  };
  for (const [name, { start, end }] of Object.entries(SECTION_RANGES)) {
    const raw = joinPages(pages, start, end);
    out[name] = normalizeBp210sDiacritics(raw);
  }
  return out;
}

// ─────────────────── CLI: dry-run dump ───────────────────
//
// Running this module directly writes the section texts to
// .cache/bps/bp210s-extracted/{section}.txt for inspection.
// Useful sanity check before any DB writes.

if (import.meta.url === new URL(`file://${process.argv[1]}`).href ||
    import.meta.url.endsWith(path.basename(process.argv[1] || ''))) {
  const parsed = await parseBp210s();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp210s-extracted');
  await fs.mkdir(outDir, { recursive: true });
  for (const section of ['front', 'partOne', 'partTwo', 'notes']) {
    const file = path.join(outDir, `${section}.txt`);
    await fs.writeFile(file, parsed[section], 'utf8');
    console.log(`  ${section.padEnd(8)} → ${file}  (${parsed[section].length} chars)`);
  }
  const meta = {
    code: parsed.code,
    title: parsed.title,
    subtitle: parsed.subtitle,
    translator: parsed.translator,
    translatorDisplay: parsed.translatorDisplay,
    source: parsed.source,
    sourceBook: parsed.sourceBook,
    sourceUrl: parsed.sourceUrl,
    license: parsed.license,
    copyright: parsed.copyright,
    pdfPages: parsed.pdfPages,
    sectionLengths: {
      front:   parsed.front.length,
      partOne: parsed.partOne.length,
      partTwo: parsed.partTwo.length,
      notes:   parsed.notes.length,
    },
  };
  await fs.writeFile(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log(`\nmeta.json written. Section length summary:`);
  console.table(meta.sectionLengths);
}
