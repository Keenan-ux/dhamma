// BPS BP212S parser — Bhikkhu Bodhi, The Discourse on the Fruits of
// Recluseship (Sāmaññaphala Sutta and its Commentaries), BPS 1989/2004.
//
// Same shape as bps-bp210s.mjs / bps-bp211s.mjs.
//
// Diacritic encoding is the BPS Latin-1 substitution family: 22
// distinct non-ASCII chars in this PDF, smaller alphabet than BP210S
// since BP212S uses fewer obscure substitutes. Running headers use
// em-dashes ("Part One—Text of the Samaññaphala Sutta NN") which the
// header regex below catches.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp212s.pdf');

// ─────────────────── Diacritic normalisation (BP212S) ───────────────────

const BP212S_DIACRITICS = {
  'á': 'ā', 'Á': 'Ā',
  'í': 'ṃ',
  'ì': 'ī', 'Ì': 'Ī',
  'ó': 'ṇ',
  'ò': 'ṅ',
  'ú': 'ū', 'Ú': 'Ū',
  'þ': 'ṭ', 'Þ': 'Ṭ',
  'ð': 'ḍ', 'Ð': 'Ḍ',
  // 'ñ' / 'Ñ' canonical, pass through
};

export function normalizeBp212sDiacritics(text) {
  let out = '';
  for (const ch of text) out += BP212S_DIACRITICS[ch] ?? ch;
  return out;
}

// ─────────────────── PDF read + page split ───────────────────

export async function loadBp212sPages() {
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
// BP212S running-header forms:
//   "Part One—Text of the Samaññaphala Sutta NN"   (em-dash, page no.)
//   "Part Two—Commentarial Exegesis NN"
//   "Introduction NN"
//   "Index NN"
//   "iv The Discourse on the Fruits of Recluseship"  (roman page + work title)

const HEADER_RE = /^(?:[ivxlcdm]+|\d{1,4})?\s*(?:The Discourse on the Fruits of Recluseship|Part One[\s—-]+Text of the S[aā]ma[ñn]{1,2}aphala Sutta|Part Two[\s—-]+Commentarial Exegesis|Introduction|Translator['’]s Preface|Preface|Notes?|Index|Contents|Texts Used|List of Abbreviations|S[aā]ma[ñn]{1,2}aphala Sutta)\s*\d{0,4}\s*$/i;
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
// BP212S layout (PDF-page-numbered, derived from running-header scan):
//   front:    pp 1-26    (title, copyright, ToC, Preface, Texts Used,
//                         Abbreviations, full Introduction)
//   partOne:  pp 27-62   (sutta translation, ~36 pp — includes a
//                         possible blank/separator at p62)
//   partTwo:  pp 63-188  (commentarial exegesis, ~125 pp — longest
//                         Part Two of the four books)
//   notes:    pp 189-end (INDEX; no separate endnotes section, footnote
//                         callouts are in-page or marginal)

const SECTION_RANGES = {
  front:   { start: 1,   end: 26  },
  partOne: { start: 27,  end: 62  },
  partTwo: { start: 63,  end: 188 },
  notes:   { start: 189, end: 999 },
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

export async function parseBp212s() {
  const { pages, total } = await loadBp212sPages();
  const out = {
    code: 'BP212S',
    title: 'The Discourse on the Fruits of Recluseship',
    subtitle: 'The Sāmaññaphala Sutta and its Commentaries',
    translator: 'bodhi',
    translatorDisplay: 'Bhikkhu Bodhi',
    source: 'bps-direct',
    sourceBook: 'The Discourse on the Fruits of Recluseship (BP212S, 1989)',
    sourceUrl: 'https://www.bps.lk/olib/bp/bp212s_Bodhi_Fruits-Of-Recluseship.pdf',
    license: 'bps-fair-use',
    copyright: '© 2004, 2008 by Bhikkhu Bodhi',
    pdfPages: total,
  };
  for (const [name, { start, end }] of Object.entries(SECTION_RANGES)) {
    const raw = joinPages(pages, start, end);
    out[name] = normalizeBp212sDiacritics(raw);
  }
  return out;
}

// ─────────────────── CLI ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  const parsed = await parseBp212s();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp212s-extracted');
  await fs.mkdir(outDir, { recursive: true });
  for (const section of ['front', 'partOne', 'partTwo', 'notes']) {
    const file = path.join(outDir, `${section}.txt`);
    await fs.writeFile(file, parsed[section], 'utf8');
    console.log(`  ${section.padEnd(8)} → ${file}  (${parsed[section].length} chars)`);
  }
  await fs.writeFile(path.join(outDir, 'meta.json'), JSON.stringify({
    code: parsed.code, title: parsed.title, subtitle: parsed.subtitle,
    translator: parsed.translator, translatorDisplay: parsed.translatorDisplay,
    source: parsed.source, sourceBook: parsed.sourceBook,
    sourceUrl: parsed.sourceUrl, license: parsed.license,
    copyright: parsed.copyright, pdfPages: parsed.pdfPages,
    sectionLengths: {
      front: parsed.front.length, partOne: parsed.partOne.length,
      partTwo: parsed.partTwo.length, notes: parsed.notes.length,
    },
  }, null, 2));
  console.log(`\nSection length summary:`);
  console.table({
    front: parsed.front.length, partOne: parsed.partOne.length,
    partTwo: parsed.partTwo.length, notes: parsed.notes.length,
  });
}
