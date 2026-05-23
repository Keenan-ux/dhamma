// BPS BP304s parser — Bhikkhu Bodhi, A Comprehensive Manual of
// Abhidhamma (Abhidhammattha Saṅgaha of Ācariya Anuruddha),
// BPS 1993/1999/2007.
//
// Structural shape:
//   - 9 chapters (CHAPTER I..IX), each "COMPENDIUM OF X" in caps
//   - Each chapter has §1..§N numbered subsections (Bodhi's notation)
//   - Each § section contains:
//       §N Title
//       (paliTitleInBrackets)
//       <Anuruddha's Pāli verse, typically 2-6 lines>
//       <Bodhi's English translation, 1-3 paragraphs>
//       Guide to §N
//       <Bodhi's prose explanation, multi-paragraph>
//
//   - Two layers per § section: the verse half is a translation of
//     Anuruddha; the Guide half is Bodhi's own commentary. We emit
//     ONE translations row per § with text=verse-block and
//     notes=guide-block, so the existing translations schema covers
//     both layers without a new commentary_layer table.
//
// Front matter: title, copyright, About Contributors, General/Detailed
// Contents, Preface, Introduction. Preface + Introduction → Library
// article (same pattern as the other Bodhi-4 books).
//
// Diacritic encoding: same Latin-1 substitute family as BP210S/211S/
// 212S — á→ā, þ→ṭ, ó→ṇ, í→ṃ (anusvāra), ò→ṅ, ì→ī, ú→ū, ð→ḍ.
// Verified by probe-bp304s-deep.mjs output.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp304s.pdf');

// ─────────────────── Diacritic normalisation ───────────────────

const BP304S_DIACRITICS = {
  'á': 'ā', 'Á': 'Ā',
  'í': 'ṃ',          // anusvāra (BPS Latin-1 family: Saíyutta → Saṃyutta)
  'ì': 'ī', 'Ì': 'Ī',
  'ó': 'ṇ',          // retroflex n
  'ò': 'ṅ',          // velar n
  'ú': 'ū', 'Ú': 'Ū',
  'þ': 'ṭ', 'Þ': 'Ṭ',
  'ð': 'ḍ', 'Ð': 'Ḍ',
  // ñ stays canonical
};

export function normalizeBp304sDiacritics(text) {
  let out = '';
  for (const ch of text) out += BP304S_DIACRITICS[ch] ?? ch;
  return out;
}

// ─────────────────── PDF read + page split ───────────────────

export async function loadBp304sPages() {
  const buf = await fs.readFile(PDF_PATH);
  const { text, total } = await new PDFParse({ data: buf }).getText();
  const parts = text.split(/-- (\d+) of \d+ --/);
  const pages = new Map();
  for (let i = 1; i < parts.length; i += 2) {
    pages.set(parseInt(parts[i], 10), (parts[i + 1] || '').trim());
  }
  return { pages, total, rawText: text };
}

// ─────────────────── Page-content cleaning ───────────────────
//
// Running headers in BP304s look like:
//   "2 0 A COMPREHENSIVE MANUAL OF ABHIDHAMMA"  (left-page header)
//   "2 5	I. COMPENDIUM OF CONSCIOUSNESS"       (right-page header)
//   "I. CITTASAÒGAHA	2 4"                       (chapter short-title header)
//
// Spaces inside page numbers ("2 0" = "20") come from BPS's typeset
// page-number style. The page number prefix or suffix on a header
// line is followed by tab+chapter-name or chapter-name+tab+number.
// Drop these so the parsed body doesn't carry running-header noise
// into the § splits.

const RUNNING_HEADER_RE = new RegExp([
  '^\\d[\\d\\s]{0,3}\\s*A COMPREHENSIVE MANUAL OF ABHIDHAMMA\\s*$',
  '^A COMPREHENSIVE MANUAL OF ABHIDHAMMA\\s+\\d[\\d\\s]{0,3}\\s*$',
  '^\\d[\\d\\s]{0,3}\\t?\\s*[IVX]+\\.\\s+(COMPENDIUM OF|CITTASAÒGAHA|CETASIKASAÒGAHA|PAKIÓÓAKASAÒGAHA|VÌTHISAÒGAHA|VÌTHIMUTTASAÒGAHA|RÚPASAÒGAHA|SAMUCCAYASAÒGAHA|PACCAYASAÒGAHA|KAMMAÞÞHÁNASAÒGAHA)[A-Z\\s,]*$',
  '^[IVX]+\\.\\s+(CITTASAÒGAHA|CETASIKASAÒGAHA|PAKIÓÓAKASAÒGAHA|VÌTHISAÒGAHA|VÌTHIMUTTASAÒGAHA|RÚPASAÒGAHA|SAMUCCAYASAÒGAHA|PACCAYASAÒGAHA|KAMMAÞÞHÁNASAÒGAHA)[A-Z\\s,]*\\t?\\s*\\d[\\d\\s]{0,3}\\s*$',
].join('|'), 'i');

// Pure page number ("23", or "2 3")
const PURE_PAGENUM_RE = /^\s*\d[\d\s]{0,3}\s*$/;

function cleanPageBody(body) {
  const lines = body.split('\n').map((l) => l.trim());
  const kept = [];
  for (const l of lines) {
    if (!l) { kept.push(''); continue; }
    if (RUNNING_HEADER_RE.test(l)) continue;
    if (PURE_PAGENUM_RE.test(l) && l.length <= 5) continue;
    kept.push(l);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─────────────────── Section ranges ───────────────────
//
// PDF page numbers vs printed page numbers:
//
//   PDF p1-7    front matter (title + about contributors + General Contents)
//   PDF p8-15   Detailed Contents (skipped — ToC noise)
//   PDF p16-21  Abbreviations + Preface (Preface starts ~p18)
//   PDF p22-46  Introduction (printed p 1-23 → Introduction)
//   PDF p47-274 Body (CHAPTERS I-IX) (printed p23-365)
//   PDF p275-281 Notes (endnotes)
//   PDF p282-286 Appendices I-II (textual sources for cittas + cetasikas)
//   PDF p287-297 Bibliography (skipped)
//   PDF p298-307 Index (skipped)
//
// Boundaries verified by probe-bp304s-deep.mjs and -body.mjs.

const SECTION_RANGES = {
  front:      { start: 1,   end: 21  },   // through Preface
  intro:      { start: 22,  end: 46  },   // Introduction
  body:       { start: 47,  end: 274 },   // 9 chapters
  notes:      { start: 275, end: 281 },
  appendices: { start: 282, end: 286 },
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

// ─────────────────── Body parser: chapters + § sections ───────────────────
//
// The body contains 9 chapters, each starting with:
//
//   CHAPTER <Roman>
//   COMPENDIUM OF <Topic>
//   (<paliChapterTitle>)
//
// followed by N §-sections of the form:
//
//   §<N> <Title>
//   (<paliSectionTitle>)
//   <Anuruddha Pāli verse>
//   <English translation>
//   Guide to §<N>
//   <Bodhi commentary prose>
//
// We split the body first by CHAPTER boundary, then by § within each
// chapter. The verse block (between §-header and "Guide to §N") goes
// into translation.text; the guide block (after "Guide to §N") goes
// into translation.notes.

const ROMAN_TO_INT = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9 };

export function splitChapters(bodyText) {
  // Match "CHAPTER I" through "CHAPTER IX" anchored to line start.
  // Capture the roman numeral and the position so we can slice the body.
  const re = /(?:^|\n)CHAPTER\s+(I{1,3}|IV|VI{0,3}|IX)\b/g;
  const hits = [];
  for (const m of bodyText.matchAll(re)) {
    hits.push({ roman: m[1], index: m.index + (m[0].startsWith('\n') ? 1 : 0) });
  }
  const chapters = [];
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index;
    const end = i + 1 < hits.length ? hits[i + 1].index : bodyText.length;
    const slice = bodyText.slice(start, end);
    chapters.push({
      roman: hits[i].roman,
      n: ROMAN_TO_INT[hits[i].roman] || 0,
      raw: slice,
    });
  }
  return chapters;
}

// Pull the chapter title + Pāli title from the first 400 chars of the
// chapter slice. Layout:
//   CHAPTER I
//   COMPENDIUM OF CONSCIOUSNESS
//   (
//   Cittasaògahavibhága)
//   §1 Words of Praise
//   ...
// PDF parsing puts the parenthetical Pāli title on its own line with
// the opening "(" trailing and "<text>)" on the next line.
function extractChapterMeta(chapterRaw) {
  const head = chapterRaw.slice(0, 400);
  const titleMatch = head.match(/CHAPTER\s+(?:I{1,3}|IV|VI{0,3}|IX)\s*\n\s*(COMPENDIUM OF [A-Z\- ]+)/);
  const englishTitle = titleMatch ? toTitleCase(titleMatch[1].trim()) : '';
  const paliMatch = head.match(/COMPENDIUM OF [A-Z\- ]+\s*\n\s*\(\s*\n?\s*([^\n)]+)\s*\)/);
  const paliTitle = paliMatch ? paliMatch[1].trim() : '';
  return { englishTitle, paliTitle };
}

function toTitleCase(s) {
  return s.toLowerCase().replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/\bOf\b/g, 'of').replace(/\bThe\b/g, 'the').replace(/\bAnd\b/g, 'and');
}

// Split a chapter slice by § markers. The marker pattern is
// "§<N>" (no space) or "§ <N>" followed by the section title on the
// same line. We capture the section number, take everything up to
// (but not including) the next "§<N+1>" or end-of-chapter.
export function splitSections(chapterRaw) {
  // Strip the chapter header so the first § hit doesn't trip on
  // "(Cittasaògahavibhága)" parens
  const headerEnd = chapterRaw.search(/\n§\s*1\b/);
  const body = headerEnd >= 0 ? chapterRaw.slice(headerEnd) : chapterRaw;

  // Section header: § + N + title until newline. The title may run to
  // ~60 chars and end before either "(<paliTitle>)" or before the
  // next content paragraph. We match the §<N> + space + first-line
  // title text up to the newline.
  const re = /(?:^|\n)§\s*(\d{1,3})\s+([^\n]{2,90})/g;
  const hits = [];
  for (const m of body.matchAll(re)) {
    const n = parseInt(m[1], 10);
    hits.push({
      n,
      title: m[2].trim(),
      index: m.index + (m[0].startsWith('\n') ? 1 : 0),
    });
  }
  // Filter for monotonically increasing N — drop spurious mid-paragraph
  // §-references like "see §3 above" that aren't section headers.
  const monotone = [];
  let lastN = 0;
  for (const h of hits) {
    if (h.n === lastN + 1 || (lastN === 0 && h.n === 1)) {
      monotone.push(h);
      lastN = h.n;
    }
  }
  // Build sections
  const sections = [];
  for (let i = 0; i < monotone.length; i++) {
    const start = monotone[i].index;
    const end = i + 1 < monotone.length ? monotone[i + 1].index : body.length;
    const slice = body.slice(start, end);
    sections.push({
      n: monotone[i].n,
      title: monotone[i].title,
      raw: slice,
    });
  }
  return sections;
}

// Split one section into {paliTitle, verseBlock, guideBlock}.
// The split point between verseBlock and guideBlock is the
// "Guide to §<N>" marker. Anything BEFORE that is the verse + English
// translation; anything AFTER is Bodhi's commentary.
//
// Within the verseBlock we leave Pāli verse + English translation
// concatenated — the original Pāli also lives in passages.original
// for the aligned CST row, so duplication doesn't hurt and the
// reader sees Bodhi's exact verse rendering alongside.
export function splitSection(section) {
  const { n, title, raw } = section;
  // Strip the "§N Title\n" header line
  const headerRe = new RegExp(`^§\\s*${n}\\s+[^\\n]+\\n`, '');
  const noHeader = raw.replace(headerRe, '');

  // Extract optional "(paliTitle)" parenthetical right after header.
  // PDF parsing may split as "(\n<text>)" or "(<text>)".
  let paliTitle = '';
  let afterPaliTitle = noHeader;
  const paliMatch = noHeader.match(/^\s*\(\s*\n?\s*([^\n)]+)\s*\)\s*\n/);
  if (paliMatch) {
    paliTitle = paliMatch[1].trim();
    afterPaliTitle = noHeader.slice(paliMatch[0].length);
  }

  // Split on "Guide to §N" marker
  const guideRe = new RegExp(`\\n\\s*Guide to §\\s*${n}\\b\\s*\\n`);
  const guideMatch = afterPaliTitle.match(guideRe);
  let verseBlock = afterPaliTitle;
  let guideBlock = '';
  if (guideMatch) {
    const i = guideMatch.index;
    verseBlock = afterPaliTitle.slice(0, i);
    guideBlock = afterPaliTitle.slice(i + guideMatch[0].length);
  }
  return {
    n,
    title,
    paliTitle,
    verse: verseBlock.trim(),
    guide: guideBlock.trim(),
  };
}

// ─────────────────── Public entry ───────────────────

export async function parseBp304s() {
  const { pages, total, rawText } = await loadBp304sPages();
  const front = joinPages(pages, SECTION_RANGES.front.start, SECTION_RANGES.front.end);
  const intro = joinPages(pages, SECTION_RANGES.intro.start, SECTION_RANGES.intro.end);
  const body = joinPages(pages, SECTION_RANGES.body.start, SECTION_RANGES.body.end);
  const notes = joinPages(pages, SECTION_RANGES.notes.start, SECTION_RANGES.notes.end);
  const appendices = joinPages(pages, SECTION_RANGES.appendices.start, SECTION_RANGES.appendices.end);

  const normFront = normalizeBp304sDiacritics(front);
  const normIntro = normalizeBp304sDiacritics(intro);
  const normBody = normalizeBp304sDiacritics(body);
  const normNotes = normalizeBp304sDiacritics(notes);
  const normAppendices = normalizeBp304sDiacritics(appendices);

  // Parse the body into chapters and sections
  const chapterSlices = splitChapters(normBody);
  const chapters = chapterSlices.map((c) => {
    const { englishTitle, paliTitle } = extractChapterMeta(c.raw);
    const sectionSlices = splitSections(c.raw);
    const sections = sectionSlices.map(splitSection);
    return {
      roman: c.roman,
      n: c.n,
      title: englishTitle,
      paliTitle,
      sections,
    };
  });

  return {
    code: 'BP304S',
    title: 'A Comprehensive Manual of Abhidhamma',
    subtitle: 'The Abhidhammattha Saṅgaha of Ācariya Anuruddha',
    translator: 'bodhi',
    translatorDisplay: 'Bhikkhu Bodhi',
    source: 'bps-direct',
    sourceBook: 'A Comprehensive Manual of Abhidhamma (BP304S, 1993)',
    sourceUrl: 'https://www.bps.lk/olib/bp/bp304s_Bodhi_A-Comprehensive-Manual-of-Abhidhamma.pdf',
    license: 'bps-fair-use',
    copyright: '© 1993, 1997, 2006 by Buddhist Publication Society',
    pdfPages: total,
    front: normFront,
    intro: normIntro,
    body: normBody,
    notes: normNotes,
    appendices: normAppendices,
    chapters,
  };
}

// ─────────────────── CLI dry-run dump ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  const parsed = await parseBp304s();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp304s-extracted');
  await fs.mkdir(outDir, { recursive: true });

  // Section text files
  for (const section of ['front', 'intro', 'body', 'notes', 'appendices']) {
    const file = path.join(outDir, `${section}.txt`);
    await fs.writeFile(file, parsed[section], 'utf8');
    console.log(`  ${section.padEnd(12)} → ${file}  (${parsed[section].length} chars)`);
  }

  // Chapter breakdown
  console.log(`\nChapters parsed: ${parsed.chapters.length}`);
  for (const ch of parsed.chapters) {
    console.log(`  ch.${String(ch.n).padStart(2)} ${ch.roman.padEnd(4)} "${ch.title}" (${ch.paliTitle}) — ${ch.sections.length} §-sections`);
  }

  // Sample first 3 sections of chapter 1 to spot-check parse quality
  console.log(`\n──── Sample sections (chapter 1) ────`);
  const ch1 = parsed.chapters[0];
  if (ch1) {
    for (const s of ch1.sections.slice(0, 3)) {
      console.log(`\n§${s.n} ${s.title}`);
      console.log(`  paliTitle: ${s.paliTitle}`);
      console.log(`  verse (${s.verse.length} chars):`);
      console.log('    ' + s.verse.replace(/\n/g, '\n    ').slice(0, 350));
      console.log(`  guide (${s.guide.length} chars):`);
      console.log('    ' + s.guide.replace(/\n/g, '\n    ').slice(0, 350));
    }
  }

  // Write chapter JSON
  await fs.writeFile(
    path.join(outDir, 'chapters.json'),
    JSON.stringify(parsed.chapters, null, 2),
  );
  console.log(`\nchapters.json written.`);
}
