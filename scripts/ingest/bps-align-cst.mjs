// Align Bhikkhu Bodhi's numbered commentary subsections (as parsed by
// each per-book module) to the fine-grained CST aṭṭhakathā paragraph
// rows that live in the passages table. This is the function that
// turns the <TODO-align:...> placeholders in the dry-run JSONs into
// real passage_ids.
//
// Approach: SEQUENTIAL PAIRING by subhead order. CST subhead-rows
// (where the parser emitted rend='subhead'/'subsubhead' rows whose
// `original` text IS the heading) appear in the same order
// Buddhaghosa wrote them. Bodhi translates them in that same order.
// So the Nth Bodhi subsection corresponds to the Nth (or Nth-plus-a-
// few) CST subhead within the relevant sutta-commentary range.
//
// Each Bodhi subsection becomes ONE translations row aligned to the
// FIRST CST subhead of its group. The translation's `text` is the
// full subsection prose; the translation's `notes` field records the
// span of CST passage_ids the translation covers (so the reader can
// later show "this English block covers CST §§47-118").

import postgres from 'postgres';

// ─────────────────── Per-book CST range config ───────────────────
//
// Each Bodhi book targets a specific commentary div within a CST
// file. For BP210S that's the Mūlapariyāya commentary, which lives
// inside `cst-s0201a.att-mn1_1` BUT only the first ~262 paragraph
// rows — the rest of mn1_1 is MN 2-10's commentary (the Mūlapariyāya-
// vagga contains the first 10 suttas grouped together in CST's
// nesting). The `lastSubheadBefore` field marks the boundary row;
// rows after it are NOT part of BP210S's coverage.

const BOOK_RANGES = {
  BP210S: {
    target: 'mn1',
    cstIdPrefix: 'cst-s0201a.att-mn1_1',
    lastSubheadBefore: 'cst-s0201a.att-mn1_1_p263',  // "2. Sabbāsavasuttavaṇṇanā" = MN 2 cy starts
    cyTitleHint: 'Mūlapariyāyasuttavaṇṇanā',
  },
  BP209S: {
    target: 'dn1',
    cstIdPrefix: 'cst-s0101a.att-dn1_1',
    lastSubheadBefore: 'cst-s0101a.att-dn1_2_p001',  // "2. Sāmaññaphalasuttavaṇṇanā" = DN 2 cy
    cyTitleHint: 'Brahmajālasuttavaṇṇanā',
  },
  BP211S: {
    target: 'dn15',
    cstIdPrefix: 'cst-s0102a.att-dn15',  // need to verify the actual nesting; DN 15 lives in vol 2 (Mahāvagga)
    lastSubheadBefore: null,  // resolved at runtime by querying for the next sutta's cy opener
    cyTitleHint: 'Mahānidānasuttavaṇṇanā',
  },
  BP212S: {
    target: 'dn2',
    cstIdPrefix: 'cst-s0101a.att-dn1_2',  // Sāmaññaphala cy is the 2nd sutta-section of DN cy vol 1
    lastSubheadBefore: null,  // resolved at runtime
    cyTitleHint: 'Sāmaññaphalasuttavaṇṇanā',
  },
};

// ─────────────────── Subhead detection ───────────────────
//
// A CST "subhead" row in our fine schema is one where the parser
// emitted the row's body AS the heading text (since `<p rend="subhead">`
// elements are short headings). Heuristic: short `original` (< 100
// chars), matches `title`. Returns rows ordered by their natural CST
// position (encoded in the integer part of the _pNNN suffix).

export async function fetchCstSubheads(sql, prefix, opts = {}) {
  const lastBeforeId = opts.lastSubheadBefore || null;
  const all = await sql`
    SELECT id, citation, title, length(original) AS len, original
    FROM passages
    WHERE id LIKE ${prefix + '_p%'}
      AND length(original) < 120
      AND title = original
    ORDER BY (regexp_match(id, '_p([0-9]+)$'))[1]::int
  `;
  if (!lastBeforeId) return all;
  // Trim to entries that come BEFORE the boundary marker by
  // paragraph index (numerical compare, not lexicographic).
  const boundaryMatch = lastBeforeId.match(/_p(\d+)$/);
  if (!boundaryMatch) return all;
  const boundaryIdx = parseInt(boundaryMatch[1], 10);
  return all.filter((r) => {
    const m = r.id.match(/_p(\d+)$/);
    if (!m) return true;
    return parseInt(m[1], 10) < boundaryIdx;
  });
}

// ─────────────────── Sequential pairing ───────────────────
//
// Given an ordered list of Bodhi subsections and an ordered list of
// CST subheads, produce {bodhiIndex → [cstPassageIds]} mapping.
//
// If counts match, pair 1:1. If CST has more subheads than Bodhi
// (common: Buddhaghosa subdivides further than Bodhi's translation
// preserves), the "extra" CST subheads get assigned to the nearest
// preceding Bodhi subsection (i.e. the prior Bodhi block "covers"
// them). If CST has fewer, the trailing Bodhi subsections are flagged
// as <UNALIGNED>.

export function pairSubsections(bodhiSubsections, cstSubheads) {
  const out = [];
  const ratio = cstSubheads.length / Math.max(1, bodhiSubsections.length);

  // If CST count is less than Bodhi count, sequential 1:1 covers
  // what it can, then trailing Bodhi sections are unaligned.
  if (cstSubheads.length <= bodhiSubsections.length) {
    for (let i = 0; i < bodhiSubsections.length; i++) {
      const bodhi = bodhiSubsections[i];
      if (i < cstSubheads.length) {
        out.push({
          bodhi_n: bodhi.n,
          bodhi_title: bodhi.title,
          cst_passage_ids: [cstSubheads[i].id],
          cst_subhead_titles: [cstSubheads[i].title],
          alignment_confidence: 'sequential',
        });
      } else {
        out.push({
          bodhi_n: bodhi.n,
          bodhi_title: bodhi.title,
          cst_passage_ids: [],
          cst_subhead_titles: [],
          alignment_confidence: 'unaligned',
          alignment_note: 'no remaining CST subheads to pair against',
        });
      }
    }
    return out;
  }

  // CST has more subheads than Bodhi — distribute proportionally.
  // Each Bodhi subsection gets ceil(ratio) CST subheads.
  let cstIdx = 0;
  for (let i = 0; i < bodhiSubsections.length; i++) {
    const bodhi = bodhiSubsections[i];
    const isLast = i === bodhiSubsections.length - 1;
    const targetEnd = isLast
      ? cstSubheads.length
      : Math.min(cstSubheads.length, Math.round((i + 1) * ratio));
    const slice = cstSubheads.slice(cstIdx, targetEnd);
    out.push({
      bodhi_n: bodhi.n,
      bodhi_title: bodhi.title,
      cst_passage_ids: slice.map((s) => s.id),
      cst_subhead_titles: slice.map((s) => s.title),
      alignment_confidence: slice.length === 1 ? 'sequential' : 'sequential-multi',
    });
    cstIdx = targetEnd;
  }
  return out;
}

// ─────────────────── Public entry ───────────────────

export async function alignBook(book, parsedSubsections, { sql }) {
  const cfg = BOOK_RANGES[book];
  if (!cfg) throw new Error(`No alignment config for book ${book}`);
  const cstSubheads = await fetchCstSubheads(sql, cfg.cstIdPrefix, {
    lastSubheadBefore: cfg.lastSubheadBefore,
  });
  const pairings = pairSubsections(parsedSubsections, cstSubheads);
  return {
    book,
    target_passage_id: cfg.target,
    cst_id_prefix: cfg.cstIdPrefix,
    bodhi_subsection_count: parsedSubsections.length,
    cst_subhead_count: cstSubheads.length,
    pairings,
  };
}

// ─────────────────── CLI ───────────────────

const entry = process.argv[1];
if (entry && import.meta.url.endsWith('bps-align-cst.mjs')) {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
  const bookCode = (process.argv.slice(2).find((a) => /^--book=/.test(a)) || '').split('=')[1] || 'BP210S';

  const proposedFile = path.join(__dirname, '.cache', 'bps', `${bookCode.toLowerCase()}-proposed.json`);
  const proposed = JSON.parse(await fs.readFile(proposedFile, 'utf8'));
  const subsections = proposed.commentary_translations.map((r) => ({
    n: r._bodhi_subsection?.n || 0,
    title: r._bodhi_subsection?.title || '(untitled)',
  }));
  console.log(`aligning ${bookCode}: ${subsections.length} Bodhi subsections`);

  const alignment = await alignBook(bookCode, subsections, { sql });
  console.log(`CST subheads in scope: ${alignment.cst_subhead_count}`);
  console.log('\nPairing:');
  for (const p of alignment.pairings) {
    const cstSummary = p.cst_passage_ids.length > 0
      ? `${p.cst_passage_ids[0]}${p.cst_passage_ids.length > 1 ? ` (+${p.cst_passage_ids.length - 1} more)` : ''}`
      : '<UNALIGNED>';
    console.log(`  ${String(p.bodhi_n).padStart(2)}. ${p.bodhi_title.padEnd(55)} → ${cstSummary}`);
    if (p.cst_subhead_titles.length > 0) {
      for (const title of p.cst_subhead_titles) {
        console.log(`        CST subhead: ${title}`);
      }
    }
  }
  const outFile = path.join(__dirname, '.cache', 'bps', `${bookCode.toLowerCase()}-alignment.json`);
  await fs.writeFile(outFile, JSON.stringify(alignment, null, 2));
  console.log(`\n→ ${outFile}`);
  await sql.end();
}
