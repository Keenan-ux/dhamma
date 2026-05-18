// /api/compare-stats execution.
//
// Hybrid stats endpoint for the Compare view. Returns full-corpus
// aggregates (total occurrences, frequency by tradition) plus a top-N
// passage list. Client runs KWIC + companion-word analysis on those
// passages using src/analyze.js.
//
// Substring matching (ILIKE) — consistent with the original analyze.js
// client analyzer, and what scholars typically want when comparing a
// term across traditions (catches "samatha-sati" when searching "sati").

import { sql } from './db.js';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

function normalize({ q, limit }) {
  return {
    q: typeof q === 'string' ? q.trim() : '',
    limit: Math.max(1, Math.min(MAX_LIMIT, Number(limit) || DEFAULT_LIMIT)),
  };
}

export async function runCompareStats(rawParams) {
  const t0 = Date.now();
  const { q, limit } = normalize(rawParams);

  if (!q) {
    return {
      query: q, limit, took_ms: 0,
      totalOccurrences: 0,
      frequencyByTradition: [],
      passages: [],
    };
  }

  // Length-diff trick: count substring occurrences case-insensitively.
  // Works on any text including CJK. GREATEST guards against zero-length q.
  const occurrenceExpr = sql`
    (
      (LENGTH(LOWER(COALESCE(p.original,'')))
       - LENGTH(REPLACE(LOWER(COALESCE(p.original,'')), LOWER(${q}), '')))
      / GREATEST(LENGTH(${q}), 1)
    +
      (LENGTH(LOWER(COALESCE(p.translation,'')))
       - LENGTH(REPLACE(LOWER(COALESCE(p.translation,'')), LOWER(${q}), '')))
      / GREATEST(LENGTH(${q}), 1)
    )::int
  `;

  const whereExpr = sql`
    (LOWER(COALESCE(p.original,''))    LIKE '%' || LOWER(${q}) || '%'
     OR LOWER(COALESCE(p.translation,'')) LIKE '%' || LOWER(${q}) || '%')
  `;

  const [freqRows, passageRows, countRows] = await Promise.all([
    sql`
      SELECT
        t.slug AS tradition_slug,
        t.name AS tradition,
        SUM(${occurrenceExpr})::int AS count
      FROM passages p
      JOIN works w ON w.slug = p.work_slug
      JOIN traditions t ON t.slug = w.tradition_slug
      WHERE ${whereExpr}
      GROUP BY t.slug, t.name
      ORDER BY count DESC
    `,
    sql`
      SELECT
        p.id, p.citation, p.title, p.canon, p.work_slug,
        p.original, p.translation,
        t.name AS tradition,
        ${occurrenceExpr} AS occurrence_count
      FROM passages p
      JOIN works w ON w.slug = p.work_slug
      JOIN traditions t ON t.slug = w.tradition_slug
      WHERE ${whereExpr}
      ORDER BY occurrence_count DESC, p.id
      LIMIT ${limit}
    `,
    sql`SELECT COUNT(*)::int AS n FROM passages p WHERE ${whereExpr}`,
  ]);

  const totalOccurrences = freqRows.reduce((s, r) => s + Number(r.count), 0);
  const matchingPassageCount = Number(countRows[0]?.n) || 0;

  return {
    query: q,
    limit,
    took_ms: Date.now() - t0,
    totalOccurrences,
    matchingPassageCount,
    frequencyByTradition: freqRows.map((r) => ({
      tradition_slug: r.tradition_slug,
      tradition: r.tradition,
      count: Number(r.count),
    })),
    passages: passageRows.map((r) => ({
      id: r.id,
      citation: r.citation,
      title: r.title,
      canon: r.canon,
      work_slug: r.work_slug,
      tradition: r.tradition,
      original: r.original,
      translation: r.translation,
      occurrence_count: Number(r.occurrence_count),
    })),
  };
}
