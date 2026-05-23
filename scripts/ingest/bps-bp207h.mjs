// BPS BP207h parser — Bhikkhu Ñāṇamoli, The Path of Purification
// (Visuddhimagga by Bhadantācariya Buddhaghosa), BPS 4th edition 2010,
// BPS Online Edition 2014.
//
// Substantially different from the Bodhi-4 books:
//
//   1) Massive: 2,029 PDF pages, 2.48M chars, 23 chapters across 3
//      Parts (Buddhaghosa's sīla / samādhi / paññā).
//
//   2) Canonical Unicode IAST throughout (ā U+0101, ṭ U+1E6D, ñ ḍ ṅ
//      ṃ ḷ all proper). Empty diacritic map.
//
//   3) **More permissive license** than the Bodhi-4 books. From the
//      copyright page (PDF p3):
//
//      "BPS Online Edition © (2014). For free distribution. This
//      work may be republished, reformatted, reprinted and
//      redistributed in any medium. However, any such republication
//      and redistribution is to be made available to the public on a
//      free and unrestricted basis, and translations and other
//      derivative works are to be clearly marked as such."
//
//      That's effectively free-redistribution-with-share-alike — a
//      different license string than `bps-fair-use`. Using
//      `bps-online-free` to mark Vism rows (and any future BPS
//      Online Edition material) as governed by these terms.
//
//   4) 23 chapters not 2 Parts. Each chapter is a self-contained
//      block of Ñāṇamoli's translation aligned (post-subdivision) to
//      the corresponding Vism Pāli passages in cst-e0101n/e0102n.
//
//   5) Front matter is HUGE (pp 1-111): title + copyright + ~14-page
//      detailed ToC + 4-page Bibliography of Texts Used + ~12-page
//      Abbreviations table + ~77-page Translator's Introduction.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp207h.pdf');

// Empty diacritic map — BP207h already uses canonical Unicode IAST.
// Function kept for shape-consistency with the other per-book modules.
export function normalizeBp207hDiacritics(text) {
  return text;
}

export async function loadBp207hPages() {
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
// Vism running headers are mostly chapter titles + page numbers.
// Bare page numbers and section-name + page combinations get
// stripped; standalone section openers ("INTRODUCTION", chapter
// headings) survive cleaning so chapter detection can find them.

const HEADER_RE = new RegExp(
  '^(?:' +
    // form A: leading page number + section name
    '(?:[ivxlcdm]+|\\d{1,4})\\s+(?:Introduction|Bibliography|Index|Glossary|Appendix|Visuddhimagga|The Path of Purification|Chapter\\s+[IVX]+)' +
    '|' +
    // form B: section name + trailing page number
    '(?:Introduction|Bibliography|Index|Glossary|Appendix|Visuddhimagga|The Path of Purification|Chapter\\s+[IVX]+)\\s+(?:[ivxlcdm]+|\\d{1,4})' +
  ')\\s*$',
  'i'
);
const BARE_PAGE_RE = /^\d{1,4}\s*$/;
const ROMAN_PAGE_RE = /^[ivxlcdm]{1,5}\s*$/i;

function cleanPageBody(body) {
  const lines = body.split('\n').map((l) => l.trim());
  const kept = [];
  for (const l of lines) {
    if (!l) { kept.push(''); continue; }
    if (HEADER_RE.test(l) || BARE_PAGE_RE.test(l) || ROMAN_PAGE_RE.test(l)) continue;
    kept.push(l);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─────────────────── Section ranges ───────────────────
//
// Verified by probing chapter-name occurrences. The boundary BEFORE
// each chapter is the last page of the previous chapter; the
// boundary AT each chapter is its first page.

const CHAPTER_STARTS = [
  { n: 'I',     page: 112,  title: 'Description of Virtue',                     pali: 'Sīla-niddesa' },
  { n: 'II',    page: 232,  title: 'The Ascetic Practices',                     pali: 'Dhutaṅga-niddesa' },
  { n: 'III',   page: 286,  title: 'Taking a Meditation Subject',               pali: 'Kammaṭṭhāna-gahaṇa-niddesa' },
  { n: 'IV',    page: 368,  title: 'The Earth Kasiṇa',                          pali: 'Pathavī-kasiṇa-niddesa' },
  { n: 'V',     page: 489,  title: 'The Remaining Kasiṇas',                     pali: 'Sesa-kasiṇa-niddesa' },
  { n: 'VI',    page: 506,  title: 'Foulness as a Meditation Subject',          pali: 'Asubha-kammaṭṭhāna-niddesa' },
  { n: 'VII',   page: 546,  title: 'Six Recollections',                         pali: 'Cha-anussati-niddesa' },
  { n: 'VIII',  page: 647,  title: 'Other Recollections as Meditation Subjects',pali: 'Anussati-kammaṭṭhāna-niddesa' },
  { n: 'IX',    page: 810,  title: 'The Divine Abidings',                       pali: 'Brahmavihāra-niddesa' },
  { n: 'X',     page: 881,  title: 'The Immaterial States',                     pali: 'Āruppa-niddesa' },
  { n: 'XI',    page: 920,  title: 'Concentration—Conclusion: Nutriment and the Elements', pali: 'Samādhi-niddesa' },
  { n: 'XII',   page: 1002, title: 'The Supernormal Powers',                    pali: 'Iddhividha-niddesa' },
  { n: 'XIII',  page: 1078, title: 'Other Direct-knowledges',                   pali: 'Abhiññā-niddesa' },
  { n: 'XIV',   page: 1149, title: 'The Aggregates',                            pali: 'Khandha-niddesa' },
  { n: 'XV',    page: 1308, title: 'The Bases and Elements',                    pali: 'Āyatana-dhātu-niddesa' },
  { n: 'XVI',   page: 1336, title: 'The Faculties and Truths',                  pali: 'Indriya-sacca-niddesa' },
  { n: 'XVII',  page: 1410, title: 'The Soil of Understanding—Conclusion',      pali: 'Paññā-bhūmi-niddesa' },
  { n: 'XVIII', page: 1595, title: 'Purification of View',                      pali: 'Diṭṭhi-visuddhi-niddesa' },
  { n: 'XIX',   page: 1626, title: 'Purification by Overcoming Doubt',          pali: 'Kaṅkhāvitaraṇa-visuddhi-niddesa' },
  { n: 'XX',    page: 1651, title: 'Purification by Knowledge and Vision of What is the Path and What is Not the Path', pali: 'Maggāmagga-ñāṇadassana-visuddhi-niddesa' },
  { n: 'XXI',   page: 1741, title: 'Purification by Knowledge and Vision of the Way',                       pali: 'Paṭipadā-ñāṇadassana-visuddhi-niddesa' },
  { n: 'XXII',  page: 1830, title: 'Purification by Knowledge and Vision',      pali: 'Ñāṇadassana-visuddhi-niddesa' },
  { n: 'XXIII', page: 1903, title: 'The Benefits in Developing Understanding',  pali: 'Paññā-bhāvanānisaṃsa-niddesa' },
];

const FRONT_END = CHAPTER_STARTS[0].page - 1;   // 111
const END_MATTER_START = 2000;                  // tables + appendices + index
const TOTAL_PAGES = 2029;

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

export async function parseBp207h() {
  const { pages, total } = await loadBp207hPages();
  const out = {
    code: 'BP207h',
    title: 'The Path of Purification',
    subtitle: 'Visuddhimagga by Bhadantācariya Buddhaghosa',
    translator: 'nanamoli',
    translatorDisplay: 'Bhikkhu Ñāṇamoli',
    source: 'bps-direct',
    sourceBook: 'The Path of Purification (BP207, 4th edition 2010 / BPS Online 2014)',
    sourceUrl: 'https://bps.lk/olib/bp/bp207h_The-Path-of-Purification-(Visuddhimagga).pdf',
    license: 'bps-online-free',
    copyright: '© 1975, 1991, 2010 Buddhist Publication Society',
    pdfPages: total,
  };
  out.front = normalizeBp207hDiacritics(joinPages(pages, 1, FRONT_END));
  out.chapters = [];
  for (let i = 0; i < CHAPTER_STARTS.length; i++) {
    const start = CHAPTER_STARTS[i].page;
    const end = (i + 1 < CHAPTER_STARTS.length)
      ? CHAPTER_STARTS[i + 1].page - 1
      : END_MATTER_START - 1;
    out.chapters.push({
      n: CHAPTER_STARTS[i].n,
      title: CHAPTER_STARTS[i].title,
      pali: CHAPTER_STARTS[i].pali,
      pageStart: start,
      pageEnd: end,
      text: normalizeBp207hDiacritics(joinPages(pages, start, end)),
    });
  }
  out.endmatter = normalizeBp207hDiacritics(joinPages(pages, END_MATTER_START, TOTAL_PAGES));
  return out;
}

// ─────────────────── CLI ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  const parsed = await parseBp207h();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp207h-extracted');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'front.txt'), parsed.front, 'utf8');
  await fs.writeFile(path.join(outDir, 'endmatter.txt'), parsed.endmatter, 'utf8');
  console.log(`  front       → front.txt (${parsed.front.length} chars)`);
  for (const ch of parsed.chapters) {
    const file = path.join(outDir, `chapter-${ch.n.padStart(5, '0')}.txt`);
    await fs.writeFile(file, ch.text, 'utf8');
    console.log(`  Ch ${ch.n.padEnd(6)} → ${path.basename(file)}  pp${ch.pageStart}-${ch.pageEnd}  (${ch.text.length} chars)  ${ch.title.slice(0, 50)}`);
  }
  console.log(`  endmatter   → endmatter.txt (${parsed.endmatter.length} chars)`);
  const totalBody = parsed.chapters.reduce((s, c) => s + c.text.length, 0);
  console.log(`\nTotals: front=${parsed.front.length}, 23 chapters=${totalBody}, endmatter=${parsed.endmatter.length}, all=${parsed.front.length + totalBody + parsed.endmatter.length}`);
  await fs.writeFile(path.join(outDir, 'meta.json'), JSON.stringify({
    code: parsed.code, title: parsed.title, subtitle: parsed.subtitle,
    translator: parsed.translator, translatorDisplay: parsed.translatorDisplay,
    source: parsed.source, sourceBook: parsed.sourceBook,
    sourceUrl: parsed.sourceUrl, license: parsed.license,
    copyright: parsed.copyright, pdfPages: parsed.pdfPages,
    sectionLengths: {
      front: parsed.front.length,
      chapters: parsed.chapters.map((c) => ({ n: c.n, title: c.title, pali: c.pali, chars: c.text.length, pages: [c.pageStart, c.pageEnd] })),
      endmatter: parsed.endmatter.length,
    },
  }, null, 2));
}
