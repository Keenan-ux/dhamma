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
  // chapters XII-XXIII. ORDER BY ensures proper sequential reading
  // order across both files.
  const rows = await sql`
    SELECT id, citation, title, length(original) AS len, original
    FROM passages
    WHERE work_slug = 'pli-vism'
      AND id LIKE '%_p%'
    ORDER BY
      split_part(id, '-', 2),
      (regexp_match(id, '-(\d+)_'))[1]::int,
      (regexp_match(id, '_p(\d+)$'))[1]::int
  `;
  return rows;
}

// Detect chapter boundaries in the ordered row list. A row is a
// chapter-opener if its title matches one of the niddesa hints from
// CHAPTER_STARTS, OR if it contains a Pāli chapter-numbering marker
// like "dutiyo paricchedo" / "tatiyo paricchedo".
export function detectChapterBoundaries(rows, chapterHints) {
  const boundaries = [];   // [{ chapterIdx, rowIdx, rowId, matchedTitle }]
  // Build a hint→chapterIdx map from the chapterHints array
  const hintMap = new Map();
  for (let i = 0; i < chapterHints.length; i++) {
    const pali = (chapterHints[i].pali || '').toLowerCase();
    if (pali) hintMap.set(pali, i);
  }
  // Walk rows looking for opener matches. Score by exact-title match,
  // then partial-title match, then niddesa keyword match.
  for (let r = 0; r < rows.length; r++) {
    const title = (rows[r].title || '').toLowerCase();
    if (!title || title.length > 120) continue;
    // Try exact
    if (hintMap.has(title)) {
      boundaries.push({
        chapterIdx: hintMap.get(title),
        rowIdx: r,
        rowId: rows[r].id,
        matchedTitle: rows[r].title,
        confidence: 'exact',
      });
      continue;
    }
    // Try partial — the row title contains the niddesa hint as a substring
    for (const [pali, idx] of hintMap) {
      if (title.includes(pali) || pali.includes(title)) {
        boundaries.push({
          chapterIdx: idx,
          rowIdx: r,
          rowId: rows[r].id,
          matchedTitle: rows[r].title,
          confidence: 'partial',
        });
        break;
      }
    }
  }
  // Dedupe by chapterIdx (keep first occurrence)
  const seen = new Set();
  return boundaries.filter((b) => {
    if (seen.has(b.chapterIdx)) return false;
    seen.add(b.chapterIdx);
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

  // Note: chapter boundaries detected from row titles. For a true
  // per-chapter alignment we'd partition allRows by detected
  // chapter-opener rows. As a first pass — without the subdivision
  // landed yet — return the structural counts and let the caller
  // verify.
  const chapterHints = parsed.chapters.map((c) => ({
    n: c.n,
    title: c.title,
    pali: c.pali,
  }));
  const boundaries = detectChapterBoundaries(allRows, chapterHints);

  // Build per-chapter slices: each chapter's CST rows are between
  // its detected boundary and the next chapter's boundary.
  const chapterSlices = [];
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].rowIdx;
    const end = (i + 1 < boundaries.length) ? boundaries[i + 1].rowIdx : allRows.length;
    chapterSlices.push({
      chapterIdx: boundaries[i].chapterIdx,
      n: chapterHints[boundaries[i].chapterIdx].n,
      title: chapterHints[boundaries[i].chapterIdx].title,
      pali: chapterHints[boundaries[i].chapterIdx].pali,
      cst_rows: allRows.slice(start, end),
      cst_row_count: end - start,
    });
  }

  // For each detected chapter, pair Ñāṇamoli's paragraphs sequentially.
  const chapterPairings = chapterSlices.map((slice) => {
    const nyanamoliChapter = parsed.chapters.find((c) => c.n === slice.n);
    const nyanamoliPars = nyanamoliChapter ? parseNyanamoliParagraphs(nyanamoliChapter.text) : [];
    return {
      n: slice.n,
      title: slice.title,
      pali: slice.pali,
      cst_row_count: slice.cst_row_count,
      nyanamoli_paragraph_count: nyanamoliPars.length,
      pairings: pairChapter(nyanamoliPars, slice.cst_rows),
    };
  });

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
    unmatched_chapters: chapterHints
      .filter((c, i) => !boundaries.some((b) => b.chapterIdx === i))
      .map((c) => ({ n: c.n, title: c.title, pali: c.pali })),
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
