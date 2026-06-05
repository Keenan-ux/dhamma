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
import { stemForPrefix } from './paliStem.js';

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
      matchingPassageCount: 0,
      frequencyByPitaka: [],
      passages: [],
    };
  }

  // Stem the query for substring matching so Compare counts also catch
  // Pali inflections. Without this, "sampajāna" misses every "sampajāno"
  // in the corpus (final 'a' vs 'o' breaks the literal substring match)
  // and the aggregate is dramatically undercounted vs what Search returns.
  // Mirrors the prefix-stem logic in search.js / termToTsquery.
  const probe = stemForPrefix(q.toLowerCase());
  // Escape LIKE metacharacters so a user '%' or '_' matches literally rather
  // than acting as a wildcard (a bare '%' otherwise makes whereExpr match
  // every passage and forces a multi-second full-table scan). The REPLACE /
  // LENGTH occurrence math uses the raw probe (literal substring); only the
  // LIKE needs the escaped form. Mirrors getPassageGroup in corpus.js.
  const probeLike = probe.replace(/([\\%_])/g, '\\$1');

  // Length-diff trick: count substring occurrences case-insensitively.
  // Works on any text including CJK. GREATEST guards against zero-length.
  const occurrenceExpr = sql`
    (
      (LENGTH(LOWER(COALESCE(p.original,'')))
       - LENGTH(REPLACE(LOWER(COALESCE(p.original,'')), ${probe}, '')))
      / GREATEST(LENGTH(${probe}), 1)
    +
      (LENGTH(LOWER(COALESCE(p.translation,'')))
       - LENGTH(REPLACE(LOWER(COALESCE(p.translation,'')), ${probe}, '')))
      / GREATEST(LENGTH(${probe}), 1)
    )::int
  `;

  const whereExpr = sql`
    (LOWER(COALESCE(p.original,''))    LIKE '%' || ${probeLike} || '%' ESCAPE '\\'
     OR LOWER(COALESCE(p.translation,'')) LIKE '%' || ${probeLike} || '%' ESCAPE '\\')
  `;

  // Frequency by piṭaka: a recursive CTE walks each passage's work up to
  // its child-of-pli-tipitaka ancestor (Vinaya / Sutta / Abhidhamma).
  // Passages whose work has no Tipiṭaka ancestor (commentaries, extra-
  // canonical) bucket under work_root for clarity rather than being
  // dropped.
  const [freqRows, passageRows, countRows] = await Promise.all([
    sql`
      WITH RECURSIVE pitaka_map AS (
        SELECT slug, name, slug AS root_slug, name AS root_name
        FROM works
        WHERE parent_slug = 'pli-tipitaka'
        UNION ALL
        SELECT w.slug, w.name, pm.root_slug, pm.root_name
        FROM works w
        JOIN pitaka_map pm ON w.parent_slug = pm.slug
      ),
      other_roots AS (
        SELECT slug, name, slug AS root_slug, name AS root_name
        FROM works
        WHERE parent_slug IS NULL
          AND tradition_slug = 'theravada'
          AND slug != 'pli-tipitaka'
        UNION ALL
        SELECT w.slug, w.name, ot.root_slug, ot.root_name
        FROM works w
        JOIN other_roots ot ON w.parent_slug = ot.slug
      ),
      all_roots AS (
        SELECT * FROM pitaka_map
        UNION ALL
        SELECT * FROM other_roots
      )
      SELECT
        ar.root_slug AS root_slug,
        ar.root_name AS root_name,
        SUM(${occurrenceExpr})::int AS count
      FROM passages p
      LEFT JOIN all_roots ar ON ar.slug = p.work_slug
      WHERE ${whereExpr}
      GROUP BY ar.root_slug, ar.root_name
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
    frequencyByPitaka: freqRows.map((r) => ({
      slug: r.root_slug || 'other',
      name: r.root_name || 'Other',
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
