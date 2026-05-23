// Align Bhikkhu Ñāṇamoli's translation of the Visuddhimagga (BP207h)
// to the CST Vism Pāli rows after the per-<p> subdivision (task #14).
//
// Vism alignment is structurally simpler than the Bodhi-4 commentary
// books:
//
//   1) Ñāṇamoli's translation is paragraph-numbered within each chapter
//      ("1. [N]", "2. [N]", … where the [N] is a PTS edition page
//      anchor). The numbering RESETS at each chapter.
//
//   2) Buddhaghosa's Vism Pāli is similarly paragraph-numbered within
//      each chapter — Ñāṇamoli's §K maps to Buddhaghosa's §K in the
//      same chapter, canonical paragraph numbering shared across
//      editions. So aligning is sequential 1:1 within each chapter,
//      not the looser proportional pairing the Bodhi-4 alignment uses.
//
//   3) Vism has 23 chapters across Parts I-III (sīla / samādhi /
//      paññā) per Buddhaghosa's tripartite structure. The bps-bp207h
//      parser already maps the chapter page ranges; this helper just
//      consumes its output.
//
// Output shape mirrors bps-align-cst.mjs's alignment.json — one
// pairing per Ñāṇamoli paragraph with its proposed cst-e010Xn.mul-…_p
// passage_id.

import postgres from 'postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBp207h } from './bps-bp207h.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────── Chapter boundary detection (CST) ───────────────────
//
// Vism's Pāli text in CST has chapter-end markers like
// "Sīlaniddeso paṭhamo" (first description ended) followed by the
// next chapter's title. We use the Pāli chapter title (from
// bps-bp207h.mjs CHAPTER_STARTS) as the boundary anchor — find the
// row whose title (or original) contains the chapter's Pāli niddesa
// suffix, and treat that row as the start of the next chapter.
//
// After per-<p> subdivision (task #14) each subhead row has its
// heading text as both `title` and `original` (short, identical
// strings). The chapter-opener subhead is the first row to mention
// the chapter's distinctive Pāli phrase.

export async function fetchAllVismRows(sql) {
  // Both volumes — e0101n covers chapters I-XI, e0102n covers
  // chapters XII-XXIII. Fetch unsorted, then sort in JS by
  // (file, section_num, paragraph_num) — Postgres regexp_match
  // ordering on the dotted basename + double-numeric suffix has
  // proved unreliable, so we just pull the rows and sort here.
  const rows = await sql`
    SELECT id, citation, title, length(original) AS len, original
    FROM passages
    WHERE work_slug = 'pli-vism'
      AND id LIKE '%_p%'
  `;
  function sortKey(id) {
    // cst-e0101n.mul-{section}_p{para} → [file, sectionInt, paraInt]
    const m = id.match(/^cst-(e\d+n\.\w+)-(\d+)_p(\d+)$/);
    if (!m) return ['z', 9999, 9999];
    return [m[1], parseInt(m[2], 10), parseInt(m[3], 10)];
  }
  return rows.slice().sort((a, b) => {
    const ka = sortKey(a.id), kb = sortKey(b.id);
    if (ka[0] !== kb[0]) return ka[0] < kb[0] ? -1 : 1;
    if (ka[1] !== kb[1]) return ka[1] - kb[1];
    return ka[2] - kb[2];
  });
}

// Detect chapter boundaries. Vism's CST subhead rows for chapter
// openers follow a fixed pattern: "<digit>. <PāliName>niddeso"
// (e.g. "1. Sīlaniddeso" for Chapter I, "2. Dhutaṅganiddeso" for
// Chapter II, ..., "23. Paññābhāvanānisaṁsaniddeso" for Chapter
// XXIII). The leading integer IS the chapter number, so we don't
// have to match the per-chapter Pāli root against the
// chapterHints — we read the chapter directly from the marker.
//
// Returns an array of { chapterNum, rowIdx, rowId, matchedTitle }
// ordered by rowIdx (which is the source-order position in CST).

const CHAPTER_OPENER_RE = /^(\d{1,2})\.\s+\S+niddeso\b/;

export function detectChapterBoundaries(rows /* , chapterHints (unused — kept for API stability) */) {
  const boundaries = [];
  for (let r = 0; r < rows.length; r++) {
    const title = rows[r].title || '';
    const m = title.match(CHAPTER_OPENER_RE);
    if (!m) continue;
    const chapterNum = parseInt(m[1], 10);
    if (chapterNum < 1 || chapterNum > 23) continue;   // sanity guard
    boundaries.push({
      chapterNum,
      rowIdx: r,
      rowId: rows[r].id,
      matchedTitle: title,
      confidence: 'opener-pattern',
    });
  }
  // Dedupe by chapterNum (keep first occurrence — should already be
  // unique in source order, but defensive).
  const seen = new Set();
  return boundaries.filter((b) => {
    if (seen.has(b.chapterNum)) return false;
    seen.add(b.chapterNum);
    return true;
  });
}

// ─────────────────── Ñāṇamoli paragraph parsing ───────────────────
//
// Each Ñāṇamoli chapter opens with section title in brackets ([I.
// Introductory]) then numbered paragraphs starting "N. [M] body…"
// where N is the chapter-local paragraph number and M is the PTS
// edition page. Some paragraphs continue across page breaks and
// don't reopen with the marker.

export function parseNyanamoliParagraphs(chapterText) {
  const lines = chapterText.split('\n');
  const paragraphs = [];
  let current = null;
  for (const l of lines) {
    const m = l.match(/^(\d{1,4})\.\s+(?:\[(\d+)\]\s*)?(.*)$/);
    if (m) {
      if (current) paragraphs.push(current);
      current = {
        n: parseInt(m[1], 10),
        pts_page: m[2] ? parseInt(m[2], 10) : null,
        text: m[3].trim(),
      };
    } else if (current) {
      // Continuation line. Append (collapse whitespace).
      const trimmed = l.trim();
      if (trimmed) current.text += ' ' + trimmed;
    }
  }
  if (current) paragraphs.push(current);
  // Filter to monotonically-increasing-by-1 numbers (drops false matches
  // like "1. " in a quoted phrase).
  const out = [];
  let expectedNext = 1;
  for (const p of paragraphs) {
    if (p.n === expectedNext || (out.length === 0 && p.n > 0)) {
      out.push(p);
      expectedNext = p.n + 1;
    } else if (p.n === expectedNext - 1 || p.n === expectedNext + 1) {
      // off-by-one drift, accept
      out.push(p);
      expectedNext = p.n + 1;
    }
  }
  return out;
}

// ─────────────────── Sequential alignment ───────────────────
//
// Pair Ñāṇamoli's chapter K paragraph N to CST's chapter K paragraph
// N — strict 1:1 sequential. If CST has more paragraphs (Buddhaghosa
// subdivides further than Ñāṇamoli numbered), the extra CST rows get
// attached to the nearest preceding Ñāṇamoli paragraph. If CST has
// fewer (rare), trailing Ñāṇamoli paragraphs are marked unaligned.

export function pairChapter(nyanamoliPars, cstRows) {
  const pairings = [];
  if (nyanamoliPars.length === 0 || cstRows.length === 0) return pairings;
  const ratio = cstRows.length / nyanamoliPars.length;
  let cstIdx = 0;
  for (let i = 0; i < nyanamoliPars.length; i++) {
    const isLast = i === nyanamoliPars.length - 1;
    const targetEnd = isLast ? cstRows.length : Math.round((i + 1) * ratio);
    const slice = cstRows.slice(cstIdx, targetEnd);
    pairings.push({
      nyanamoli_n: nyanamoliPars[i].n,
      nyanamoli_pts_page: nyanamoliPars[i].pts_page,
      nyanamoli_excerpt: nyanamoliPars[i].text.slice(0, 80),
      cst_passage_ids: slice.map((r) => r.id),
      cst_anchor_title: slice[0]?.title || null,
      cst_paragraph_count: slice.length,
    });
    cstIdx = targetEnd;
  }
  return pairings;
}

// ─────────────────── Public entry ───────────────────

export async function alignVism({ sql }) {
  const parsed = await parseBp207h();
  const allRows = await fetchAllVismRows(sql);

  const boundaries = detectChapterBoundaries(allRows);
  // Map chapterNum (1-23) → Ñāṇamoli chapter info from bps-bp207h.
  // The parser uses Roman numerals for chapter `n` ("I", "II", …),
  // so we convert chapterNum → "I"/.../"XXIII" for lookup.
  const toRoman = (n) => ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII'][n - 1];

  // Build per-chapter slices: each chapter's CST rows are between
  // its detected boundary and the next chapter's boundary (or EOF).
  const chapterSlices = [];
  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i];
    const start = b.rowIdx;
    const end = (i + 1 < boundaries.length) ? boundaries[i + 1].rowIdx : allRows.length;
    const roman = toRoman(b.chapterNum);
    const chapterInfo = parsed.chapters.find((c) => c.n === roman);
    chapterSlices.push({
      chapterNum: b.chapterNum,
      n: roman,
      title: chapterInfo?.title || '(unknown)',
      pali: chapterInfo?.pali || '',
      cst_opener_id: b.rowId,
      cst_opener_title: b.matchedTitle,
      cst_rows: allRows.slice(start, end),
      cst_row_count: end - start,
    });
  }

  // For each detected chapter, pair Ñāṇamoli's paragraphs sequentially
  // against the slice of CST rows for that chapter.
  const chapterPairings = chapterSlices.map((slice) => {
    const nyanamoliChapter = parsed.chapters.find((c) => c.n === slice.n);
    const nyanamoliPars = nyanamoliChapter ? parseNyanamoliParagraphs(nyanamoliChapter.text) : [];
    return {
      n: slice.n,
      chapter_num: slice.chapterNum,
      title: slice.title,
      pali: slice.pali,
      cst_opener_id: slice.cst_opener_id,
      cst_opener_title: slice.cst_opener_title,
      cst_row_count: slice.cst_row_count,
      nyanamoli_paragraph_count: nyanamoliPars.length,
      pairings: pairChapter(nyanamoliPars, slice.cst_rows),
    };
  });

  const detectedNums = new Set(boundaries.map((b) => b.chapterNum));
  const unmatched = [];
  for (let cn = 1; cn <= 23; cn++) {
    if (detectedNums.has(cn)) continue;
    const roman = toRoman(cn);
    const ci = parsed.chapters.find((c) => c.n === roman);
    unmatched.push({ chapter_num: cn, n: roman, title: ci?.title || '?', pali: ci?.pali || '' });
  }

  return {
    book: 'BP207h',
    target_work_slug: 'pli-vism',
    translator: 'nanamoli',
    license: 'bps-online-free',
    source_book: parsed.sourceBook,
    chapters_detected: boundaries.length,
    chapters_expected: 23,
    total_cst_rows: allRows.length,
    chapter_pairings: chapterPairings,
    unmatched_chapters: unmatched,
  };
}

// ─────────────────── CLI ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith(path.basename(entry))) {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const result = await alignVism({ sql });
  console.log(`book: ${result.book}  translator: ${result.translator}`);
  console.log(`total CST Vism rows: ${result.total_cst_rows}`);
  console.log(`chapters detected: ${result.chapters_detected} / ${result.chapters_expected}`);
  console.log();
  for (const ch of result.chapter_pairings) {
    console.log(`Ch ${ch.n.padEnd(6)} ${ch.title.padEnd(50)}  CST=${String(ch.cst_row_count).padStart(5)}  Ñāṇamoli=${String(ch.nyanamoli_paragraph_count).padStart(4)}`);
  }
  if (result.unmatched_chapters.length > 0) {
    console.log(`\nunmatched chapters (no CST boundary found):`);
    for (const c of result.unmatched_chapters) console.log(`  Ch ${c.n} (${c.pali})`);
  }
  // Write full alignment JSON
  const fs = await import('node:fs/promises');
  const outFile = path.join(__dirname, '.cache', 'bps', 'bp207h-alignment.json');
  await fs.writeFile(outFile, JSON.stringify(result, null, 2));
  console.log(`\n→ ${outFile}`);
  await sql.end();
}
