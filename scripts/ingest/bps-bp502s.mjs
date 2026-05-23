// BPS BP502s parser — Bhikkhu Ñāṇamoli, Mindfulness of Breathing
// (Ānāpānasati), BPS 1964 (1st ed.) / 1998 (6th) / 2010 (7th).
//
// Structural shape:
//   Front matter: title, copyright, contents, principal abbreviations,
//                 Translator's Foreword to the First Edition,
//                 Preface to the Second Edition (Nyanaponika)
//   Part I  (pp 1-9):   The Ānāpānasati Sutta (MN 118), translation
//   Part II (pp 11-43): The Commentary — extracts from Visuddhimagga
//                       (ch VIII §3) on the Four Tetrads, with Method of
//                       Practice extracts
//   Part III (pp 45-81): The Paṭisambhidāmagga — Section on Mindfulness
//                       of Breathing (Ānāpānakathā) translation
//   Part IV (pp 82-94): Additional commentary extracts (sub-commentary
//                       fragments, Vimuttimagga comparison etc.)
//   Notes (pp 95-128):  Endnotes referenced by superscripts in body
//   About the Author (pp 129-end): Biographical note on Ñāṇamoli
//
// Ingest strategy:
//   - Part I → translations row aligned to passage_id='mn118'
//             (Ñāṇamoli joins Sujato + Thanissaro as a third translator)
//   - Part II + III + IV → Library articles (commentary extracts not
//             aligned to specific commentary passage_ids in this first
//             pass; Vism content separately covered by BP207h ingest)
//   - Front matter Forewords → one combined Library article
//
// Diacritic encoding: same Latin-1 substitute family as BP210S/211S/
// 212S/304S — á→ā, þ→ṭ, ó→ṇ, í→ṃ, ò→ṅ, ì→ī, ú→ū, ð→ḍ. Verified by
// probe-tier3-tier4.mjs.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp502s.pdf');

// ─────────────────── Diacritic normalisation ───────────────────

const BP502S_DIACRITICS = {
  'á': 'ā', 'Á': 'Ā',
  'í': 'ṃ',
  'ì': 'ī', 'Ì': 'Ī',
  'ó': 'ṇ',
  'ò': 'ṅ',
  'ú': 'ū', 'Ú': 'Ū',
  'þ': 'ṭ', 'Þ': 'Ṭ',
  'ð': 'ḍ', 'Ð': 'Ḍ',
};

export function normalizeBp502sDiacritics(text) {
  let out = '';
  for (const ch of text) out += BP502S_DIACRITICS[ch] ?? ch;
  return out;
}

// ─────────────────── PDF read + page split ───────────────────

export async function loadBp502sPages() {
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
// Running headers in BP502s are short and book-specific:
//   "Mindfulness of Breathing"            (verso)
//   "The Discourse on Mindfulness of Breathing"  (recto, Part I)
//   "The Commentary"                       (Part II)
//   "The Paṭisambhidāmagga"                (Part III)
// Most are stripped at the start of the page body. We use a simple
// allowlist of known running-header strings, plus a pure-pagenumber
// filter for bare page numbers on their own line.

const KNOWN_HEADERS = new Set([
  'Mindfulness of Breathing',
  'The Discourse on Mindfulness of Breathing',
  'The Commentary',
  'The Commentary on the Sutta',
  'The Paṭisambhidāmagga',
  'The Paþisambhidámagga',
  'Passages from Other Suttas',
  'Notes',
  'End Notes',
  'About the Author',
]);

function cleanPageBody(body) {
  const lines = body.split('\n').map((l) => l.trim());
  const kept = [];
  for (const l of lines) {
    if (!l) { kept.push(''); continue; }
    if (KNOWN_HEADERS.has(l)) continue;
    if (/^\s*[ivxlcdm]{1,5}\s*$/i.test(l)) continue;   // roman page no.
    if (/^\s*\d{1,4}\s*$/.test(l) && l.length <= 4) continue;  // arabic page no.
    kept.push(l);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─────────────────── Section ranges ───────────────────
//
// PDF page → logical section:
//
//   PDF p1-9    front matter (title, copyright, contents, abbreviations,
//               foreword to 1st ed., preface to 2nd ed.)
//   PDF p10-18  Part I — Ānāpānasati Sutta (MN 118)
//                   Note: the sutta spans PDF p10-18, beginning at
//                   "Namo tassa Bhagavato..." through the conclusion.
//   PDF p19-52  Part II — Visuddhimagga commentary extracts
//   PDF p54-89  Part III — Paṭisambhidāmagga Ānāpānakathā
//   PDF p90-102 Part IV — additional extracts
//   PDF p103-136 Notes (endnotes)
//   PDF p137-end About the Author + back matter
//
// Boundaries verified by probe-bp502s.mjs and inspection.

// Empirically verified by inspecting page-start text:
//   PDF p10 = "Namo tassa... Part I" (Part I opening)
//   PDF p20 = "Part II / The Commentary on the Sutta" (Part II opening)
//   PDF p54 = "Part III / The Paṭisambhidāmagga" (Part III opening)
//   PDF p91 = "Part IV / Passages from Other Suttas" (Part IV opening)
//   PDF p104 = "NOTES" (endnotes start; p103 is blank)
//   PDF p138 = "About the Author"
const SECTION_RANGES = {
  front:     { start: 1,   end: 9   },
  partOne:   { start: 10,  end: 19  },
  partTwo:   { start: 20,  end: 53  },
  partThree: { start: 54,  end: 90  },
  partFour:  { start: 91,  end: 103 },
  notes:     { start: 104, end: 137 },
  back:      { start: 138, end: 999 },
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

export async function parseBp502s() {
  const { pages, total } = await loadBp502sPages();
  const out = {
    code: 'BP502S',
    title: 'Mindfulness of Breathing',
    subtitle: 'Ānāpānasati: Buddhist Texts from the Pāli Canon and Extracts from the Pāli Commentaries',
    translator: 'nanamoli',
    translatorDisplay: 'Bhikkhu Ñāṇamoli',
    source: 'bps-direct',
    sourceBook: 'Mindfulness of Breathing (BP502S, 1964)',
    sourceUrl: 'https://www.bps.lk/olib/bp/bp502s_Nanamoli_Mindfulness-of-Breathing.pdf',
    license: 'bps-fair-use',
    copyright: '© 1964, by Buddhist Publication Society',
    pdfPages: total,
  };
  for (const [name, { start, end }] of Object.entries(SECTION_RANGES)) {
    const raw = joinPages(pages, start, end);
    out[name] = normalizeBp502sDiacritics(raw);
  }
  return out;
}

// ─────────────────── CLI dry-run dump ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  const parsed = await parseBp502s();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp502s-extracted');
  await fs.mkdir(outDir, { recursive: true });
  for (const section of ['front', 'partOne', 'partTwo', 'partThree', 'partFour', 'notes', 'back']) {
    const file = path.join(outDir, `${section}.txt`);
    await fs.writeFile(file, parsed[section], 'utf8');
    console.log(`  ${section.padEnd(10)} → ${file}  (${parsed[section].length} chars)`);
  }
  // Smoke test: first 400 chars of Part I (should start with "Namo tassa...")
  console.log(`\nPart I opening (first 400 chars):`);
  console.log('  ' + parsed.partOne.slice(0, 400).replace(/\n/g, '\n  '));
  console.log(`\nPart II opening:`);
  console.log('  ' + parsed.partTwo.slice(0, 300).replace(/\n/g, '\n  '));
  console.log(`\nPart III opening:`);
  console.log('  ' + parsed.partThree.slice(0, 300).replace(/\n/g, '\n  '));
}
