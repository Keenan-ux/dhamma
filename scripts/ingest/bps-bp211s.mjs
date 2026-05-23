// BPS BP211S parser — Bhikkhu Bodhi, The Great Discourse on
// Causation (Mahānidāna Sutta and its Commentaries), BPS 1984/1995.
//
// Same shape as bps-bp210s.mjs:
//   - PDF extraction via pdf-parse
//   - Diacritic normalization to canonical IAST
//   - Page-header / decorative-page cleanup
//   - Section split into {front, partOne, partTwo, notes}
//
// Diacritic encoding inherits BP210S's Latin-1 substitution family
// (á→ā, þ→ṭ, ó→ṇ, ò→ṅ, ì→ī, í→ṃ, ú→ū, ð→ḍ). BP211S occasionally
// uses the canonical macron form (ā U+0101) directly, mixed in with
// the substituted form — the map is a no-op on already-canonical
// chars so this works seamlessly. Arrows (↓↑) and § signs are
// content and pass through unchanged.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, '.cache', 'bps', 'bp211s.pdf');

// ─────────────────── Diacritic normalisation (BP211S) ───────────────────

const BP211S_DIACRITICS = {
  'á': 'ā', 'Á': 'Ā',
  'í': 'ṃ',           // anusvāra
  'ì': 'ī', 'Ì': 'Ī',
  'ó': 'ṇ',           // retroflex n
  'ò': 'ṅ',           // velar nasal
  'ú': 'ū', 'Ú': 'Ū',
  'þ': 'ṭ', 'Þ': 'Ṭ',
  'ð': 'ḍ', 'Ð': 'Ḍ',
  // 'ñ' / 'Ñ' / 'ā' already canonical IAST, pass through.
  // 'ā' (U+0101) appears mixed in — map is a no-op on it.
};

export function normalizeBp211sDiacritics(text) {
  let out = '';
  for (const ch of text) out += BP211S_DIACRITICS[ch] ?? ch;
  return out;
}

// ─────────────────── PDF read + page split ───────────────────

export async function loadBp211sPages() {
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
// BP211S running headers: "Introduction" or "The Great Discourse on
// Causation" or "The Mahānidāna Sutta", optionally with a page
// number. Bare page numbers are also dropped.

const HEADER_RE = /^(?:\d{1,4}\s+)?(?:Introduction|The Great Discourse on Causation|The Mahānidāna Sutta|Preface|List of Abbreviations|Notes|Index|Mahánidána)\s*\d{0,4}\s*$/;
const BARE_PAGE_RE = /^\d{1,4}\s*$/;

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
    if (HEADER_RE.test(l) || BARE_PAGE_RE.test(l)) continue;
    kept.push(l);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─────────────────── Section split ───────────────────
//
// BP211S layout (PDF-page-numbered):
//   front:    pp 1-65   (title, copyright, ToC, bibliography, Preface,
//                        Abbreviations, full Introduction with diagrams)
//   partOne:  pp 66-81  (the sutta translation, ~16 pp)
//   partTwo:  pp 82-161 (the commentarial exegesis, ~80 pp)
//   notes:    pp 162-end (INDEX — no separate endnotes section since
//                        footnotes are inline [N] callouts in the body)

const SECTION_RANGES = {
  front:   { start: 1,   end: 65  },
  partOne: { start: 66,  end: 81  },
  partTwo: { start: 82,  end: 161 },
  notes:   { start: 162, end: 999 },
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

export async function parseBp211s() {
  const { pages, total } = await loadBp211sPages();
  const out = {
    code: 'BP211S',
    title: 'The Great Discourse on Causation',
    subtitle: 'The Mahānidāna Sutta and its Commentaries',
    translator: 'bodhi',
    translatorDisplay: 'Bhikkhu Bodhi',
    source: 'bps-direct',
    sourceBook: 'The Great Discourse on Causation (BP211S, 1984)',
    sourceUrl: 'https://www.bps.lk/olib/bp/bp211s_Bodhi_Great-Discourse-n-Causation.pdf',
    license: 'bps-fair-use',
    copyright: '© 1984, 1995 by Bhikkhu Bodhi',
    pdfPages: total,
  };
  for (const [name, { start, end }] of Object.entries(SECTION_RANGES)) {
    const raw = joinPages(pages, start, end);
    out[name] = normalizeBp211sDiacritics(raw);
  }
  return out;
}

// ─────────────────── CLI: dry-run dump ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  const parsed = await parseBp211s();
  const outDir = path.join(__dirname, '.cache', 'bps', 'bp211s-extracted');
  await fs.mkdir(outDir, { recursive: true });
  for (const section of ['front', 'partOne', 'partTwo', 'notes']) {
    const file = path.join(outDir, `${section}.txt`);
    await fs.writeFile(file, parsed[section], 'utf8');
    console.log(`  ${section.padEnd(8)} → ${file}  (${parsed[section].length} chars)`);
  }
  const meta = {
    code: parsed.code, title: parsed.title, subtitle: parsed.subtitle,
    translator: parsed.translator, translatorDisplay: parsed.translatorDisplay,
    source: parsed.source, sourceBook: parsed.sourceBook,
    sourceUrl: parsed.sourceUrl, license: parsed.license,
    copyright: parsed.copyright, pdfPages: parsed.pdfPages,
    sectionLengths: {
      front: parsed.front.length, partOne: parsed.partOne.length,
      partTwo: parsed.partTwo.length, notes: parsed.notes.length,
    },
  };
  await fs.writeFile(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log(`\nSection length summary:`);
  console.table(meta.sectionLengths);
}
