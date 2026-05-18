// /api/search execution. Parses boolean query (quoted phrases, -exclude,
// bare terms), expands aliases for Stem/Meaning modes, builds a Postgres
// tsquery, runs hybrid scoring (FTS + vector RRF for Meaning).
//
// Modes:
//   exact   — FTS only, raw query, no alias expansion.
//   stem    — FTS only, alias-expanded query.
//   meaning — FTS (alias-expanded) + vector ANN, reciprocal-rank-fused.

import { sql } from './db.js';
import { aliasesFor } from './aliases.js';
import { embedQuery } from './embed.js';

const RRF_K = 60;
const FUSION_POOL = 200;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;
const SNIPPET_LEN = 200;

const MODES = new Set(['exact', 'stem', 'meaning']);
const FIELDS = new Set(['all', 'original', 'translation', 'citation']);

export function parseQuery(q) {
  const include = [];
  const phrases = [];
  const exclude = [];
  if (!q) return { include, phrases, exclude };

  const phraseRe = /"([^"]+)"/g;
  let m;
  while ((m = phraseRe.exec(q)) !== null) phrases.push(m[1].trim());
  const stripped = q.replace(phraseRe, ' ');

  for (const tok of stripped.split(/\s+/)) {
    if (!tok) continue;
    if (tok.startsWith('-') && tok.length > 1) exclude.push(tok.slice(1));
    else include.push(tok);
  }
  return { include, phrases, exclude };
}

function sanitizeTerm(term) {
  return String(term).replace(/['"\\&|!()<>:*]/g, ' ').trim();
}

function termToTsquery(term) {
  const cleaned = sanitizeTerm(term);
  if (!cleaned) return null;
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  if (tokens.length === 1) return tokens[0];
  return tokens.join(' <-> ');
}

export function buildTsquery(parsed, { expandAliases = false } = {}) {
  const parts = [];
  const expanded = [];

  for (const term of parsed.include) {
    const base = termToTsquery(term);
    if (!base) continue;
    const variants = [base];
    if (expandAliases) {
      const aliases = aliasesFor(term);
      for (const a of aliases) {
        const v = termToTsquery(a);
        if (v) variants.push(v);
      }
      if (aliases.length > 0) expanded.push({ term, aliases });
    }
    parts.push(variants.length > 1 ? `(${variants.join(' | ')})` : variants[0]);
  }
  for (const ph of parsed.phrases) {
    const tsq = termToTsquery(ph);
    if (tsq) parts.push(`(${tsq})`);
  }
  for (const ex of parsed.exclude) {
    const tsq = termToTsquery(ex);
    if (tsq) parts.push(`!(${tsq})`);
  }
  return { tsquery: parts.join(' & '), expanded };
}

function ftsFragment(field) {
  switch (field) {
    case 'citation':    return sql`to_tsvector('simple', coalesce(citation, ''))`;
    case 'original':    return sql`to_tsvector('simple', coalesce(original, ''))`;
    case 'translation': return sql`to_tsvector('simple', coalesce(translation, ''))`;
    default:            return sql`fts_doc`;
  }
}

function makeSnippet(p) {
  const text = p.translation || p.original || '';
  if (text.length <= SNIPPET_LEN) return text;
  return text.slice(0, SNIPPET_LEN).trimEnd() + '…';
}

function shapeResult(p) {
  return {
    id: p.id,
    citation: p.citation,
    title: p.title,
    canon: p.canon,
    work_slug: p.work_slug,
    snippet: makeSnippet(p),
    score: Number(p.score) || 0,
  };
}

function normalizeParams({ q, mode, field, limit }) {
  return {
    q: typeof q === 'string' ? q : '',
    mode: MODES.has(mode) ? mode : 'exact',
    field: FIELDS.has(field) ? field : 'all',
    limit: Math.max(1, Math.min(MAX_LIMIT, Number(limit) || DEFAULT_LIMIT)),
  };
}

export async function runSearch(rawParams) {
  const t0 = Date.now();
  const { q, mode, field, limit } = normalizeParams(rawParams);

  if (!q.trim()) {
    return { query: q, mode, field, limit, took_ms: 0, results: [], expanded: [] };
  }

  const parsed = parseQuery(q);
  const expandAliases = mode !== 'exact';
  const { tsquery, expanded } = buildTsquery(parsed, { expandAliases });

  if (!tsquery && mode !== 'meaning') {
    return { query: q, mode, field, limit, took_ms: Date.now() - t0, results: [], expanded };
  }

  const fts = ftsFragment(field);
  let rows;
  let warning;

  if (mode === 'exact' || mode === 'stem') {
    rows = await sql`
      SELECT id, citation, title, canon, work_slug, original, translation,
             ts_rank(${fts}, q) AS score
      FROM passages, to_tsquery('simple', ${tsquery}) q
      WHERE ${fts} @@ q
      ORDER BY score DESC
      LIMIT ${limit}
    `;
  } else {
    // Meaning mode: FTS (if any) + vector ANN, RRF-fused. If embedding fails,
    // fall back to FTS-only with a warning. If tsquery is empty (e.g. all
    // user terms were operator-only), do vector-only.
    let qVec;
    try {
      qVec = await embedQuery(q);
    } catch (err) {
      warning = `embed_failed:${err.message}`;
      if (!tsquery) {
        return { query: q, mode, field, limit, took_ms: Date.now() - t0, results: [], expanded, warning };
      }
      rows = await sql`
        SELECT id, citation, title, canon, original, translation,
               ts_rank(${fts}, q) AS score
        FROM passages, to_tsquery('simple', ${tsquery}) q
        WHERE ${fts} @@ q
        ORDER BY score DESC
        LIMIT ${limit}
      `;
      return {
        query: q, mode, field, limit, took_ms: Date.now() - t0,
        results: rows.map(shapeResult), expanded, warning,
      };
    }
    const qVecLit = `[${qVec.join(',')}]`;

    if (!tsquery) {
      // Vector-only: no parseable FTS terms.
      rows = await sql`
        SELECT id, citation, title, canon, work_slug, original, translation,
               1.0 / (${RRF_K} + ROW_NUMBER() OVER (ORDER BY embedding <=> ${qVecLit}::vector)) AS score
        FROM passages
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${qVecLit}::vector
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        WITH
        fts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(${fts}, q) DESC) AS rnk
          FROM passages, to_tsquery('simple', ${tsquery}) q
          WHERE ${fts} @@ q
          LIMIT ${FUSION_POOL}
        ),
        vec AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${qVecLit}::vector) AS rnk
          FROM passages
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> ${qVecLit}::vector
          LIMIT ${FUSION_POOL}
        )
        SELECT p.id, p.citation, p.title, p.canon, p.work_slug, p.original, p.translation,
               COALESCE(1.0 / (${RRF_K} + fts.rnk), 0)
             + COALESCE(1.0 / (${RRF_K} + vec.rnk), 0) AS score
        FROM passages p
        LEFT JOIN fts ON fts.id = p.id
        LEFT JOIN vec ON vec.id = p.id
        WHERE (fts.id IS NOT NULL OR vec.id IS NOT NULL)
        ORDER BY score DESC
        LIMIT ${limit}
      `;
    }
  }

  return {
    query: q, mode, field, limit,
    took_ms: Date.now() - t0,
    results: rows.map(shapeResult),
    expanded,
    ...(warning ? { warning } : {}),
  };
}
