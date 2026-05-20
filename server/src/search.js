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
import { stemForPrefix } from './paliStem.js';

const RRF_K = 60;
const FUSION_POOL = 200;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;
const SNIPPET_LEN = 200;
const SNIPPET_MAX = 320;

// Highlight markers — ts_headline wraps each matched term in StartSel/StopSel.
// Picking ASCII C0 control chars ( SOH,  STX) so the post-process
// pass can locate matches without colliding with anything that legitimately
// appears in canonical text.
const HL_START = '';
const HL_END   = '';
const HL_OPTS  = 'MaxFragments=1,MinWords=20,MaxWords=60,StartSel=,StopSel=';
// Library bodies are longer prose; one slightly wider fragment reads better.
const HL_OPTS_LIB = 'MaxFragments=1,MinWords=30,MaxWords=80,StartSel=,StopSel=';

const MODES = new Set(['exact', 'stem', 'meaning']);
const FIELDS = new Set(['all', 'original', 'translation', 'citation', 'title', 'library']);
const PITAKAS = new Set(['sutta', 'vinaya', 'abhidhamma']);
const PITAKA_ROOTS = {
  sutta:      'pli-sutta',
  vinaya:     'pli-vinaya',
  abhidhamma: 'pli-abhidhamma',
};

// Cached descendant-slug list per pitaka. Resolved lazily on first /api/search
// that filters by pitaka. The works tree is static at runtime (changes only
// during ingest, and a deploy follows), so caching for the process lifetime is
// safe — saves one recursive CTE per request.
let pitakaSlugsCache = null;
async function pitakaWorkSlugs(pitaka) {
  if (!pitaka) return null;
  if (!PITAKAS.has(pitaka)) return null;
  if (!pitakaSlugsCache) {
    const rows = await sql`
      WITH RECURSIVE descendants(root, slug) AS (
        SELECT slug AS root, slug FROM works
        WHERE slug = ANY(${Object.values(PITAKA_ROOTS)})
        UNION ALL
        SELECT d.root, w.slug
        FROM works w
        JOIN descendants d ON w.parent_slug = d.slug
      )
      SELECT root, slug FROM descendants
    `;
    const cache = { sutta: [], vinaya: [], abhidhamma: [] };
    const rootToKey = Object.fromEntries(
      Object.entries(PITAKA_ROOTS).map(([k, v]) => [v, k])
    );
    for (const r of rows) {
      const key = rootToKey[r.root];
      if (key) cache[key].push(r.slug);
    }
    pitakaSlugsCache = cache;
  }
  const slugs = pitakaSlugsCache[pitaka];
  return slugs && slugs.length > 0 ? slugs : null;
}

// English stopwords + single chars are dropped from positive bare terms.
// Quoted phrases pass through untouched so users can still search literal
// stopword-bearing phrases. Matches the client-side parseQuery filter.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'as', 'that', 'this',
  'these', 'those', 'it', 'its', 'the', 'i', 's',
]);

function isStopword(t) {
  if (!t) return true;
  if (t.length < 2) return true;
  return STOPWORDS.has(t.toLowerCase());
}

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
    if (tok.startsWith('-') && tok.length > 1) {
      exclude.push(tok.slice(1));
    } else if (!isStopword(tok)) {
      include.push(tok);
    }
  }
  return { include, phrases, exclude };
}

function sanitizeTerm(term) {
  return String(term).replace(/['"\\&|!()<>:*]/g, ' ').trim();
}

// Threshold for tsquery prefix matching (token:* operator). Tokens shorter
// than this stay as exact-match — e.g. 'ti' or 'ca' as prefix would match
// way too broadly. 4 chars covers all common Pali content words (sati,
// dhamma, kamma, sampajāna…) without runaway recall.
const PREFIX_MIN_LENGTH = 4;

function termToTsquery(term, { prefix = false } = {}) {
  const cleaned = sanitizeTerm(term);
  if (!cleaned) return null;
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  if (tokens.length === 1) {
    const t = tokens[0];
    if (prefix && t.length >= PREFIX_MIN_LENGTH) {
      // Heuristic-stem the token first (e.g. sampajāno → sampajān) so the
      // prefix match catches every Pali inflection (sampajāna, sampajāno,
      // sampajānaṃ, sampajānassa, sampajānakārī…) regardless of which
      // surface form the user typed.
      const stem = stemForPrefix(t);
      return `${stem}:*`;
    }
    return t;
  }
  // Multi-token = phrase — keep adjacent-token semantics (no prefix on
  // intermediate tokens; the whole phrase must appear in sequence).
  return tokens.join(' <-> ');
}

export function buildTsquery(parsed, { expandAliases = false } = {}) {
  // In stem/meaning modes (expandAliases=true), use tsquery prefix matching
  // on each token so 'sampajāna' also catches 'sampajāno', 'sampajānaṃ',
  // 'sampajānakārī', etc. Exact mode preserves literal-token semantics.
  const prefix = expandAliases;
  const parts = [];
  const expanded = [];

  for (const term of parsed.include) {
    const base = termToTsquery(term, { prefix });
    if (!base) continue;
    const variants = [base];
    if (expandAliases) {
      const aliases = aliasesFor(term);
      for (const a of aliases) {
        const v = termToTsquery(a, { prefix });
        if (v) variants.push(v);
      }
      if (aliases.length > 0) expanded.push({ term, aliases });
    }
    parts.push(variants.length > 1 ? `(${variants.join(' | ')})` : variants[0]);
  }
  for (const ph of parsed.phrases) {
    // Phrases stay as literal token sequences — prefix on the last token
    // would break the "exact phrase" contract scholars expect.
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
    case 'title':       return sql`to_tsvector('simple', coalesce(title, ''))`;
    case 'original':    return sql`to_tsvector('simple', coalesce(original, ''))`;
    case 'translation': return sql`to_tsvector('simple', coalesce(translation, ''))`;
    default:            return sql`fts_doc`;
  }
}

// Sentence boundaries: ASCII terminators plus CJK full stop. ts_headline gives
// us a word-boundary-aligned window around the match; this trims that window
// to the surrounding sentence(s) so the snippet reads as a complete thought.
const SENT_END_RE = /[.!?。！？]/;

function refineSnippet(rawHeadline) {
  if (!rawHeadline) return null;
  const text = rawHeadline.trim();
  if (!text) return null;
  const startIdx = text.indexOf(HL_START);
  const endIdx   = text.lastIndexOf(HL_END);
  // No highlight marker means ts_headline returned an unhighlighted window
  // (no match). Strip any orphan markers and return as-is.
  if (startIdx === -1 || endIdx === -1) {
    return text.replace(/[]/g, '').trim();
  }

  // Expand left to the character after the previous sentence terminator.
  let left = 0;
  for (let i = startIdx - 1; i >= 0; i--) {
    if (SENT_END_RE.test(text[i])) { left = i + 1; break; }
  }
  // Expand right to and including the next sentence terminator.
  let right = text.length;
  for (let i = endIdx + 1; i < text.length; i++) {
    if (SENT_END_RE.test(text[i])) { right = i + 1; break; }
  }

  let out = text.slice(left, right).replace(/[]/g, '').trim();
  // Hard-cap to keep card layout predictable when sentence expansion ran far.
  if (out.length > SNIPPET_MAX) out = out.slice(0, SNIPPET_MAX).trimEnd() + '…';
  // Mark trimmed edges so the reader sees this isn't the full paragraph.
  if (left > 0)            out = '… ' + out;
  if (right < text.length) out = out + ' …';
  return out;
}

function makeSnippet(p) {
  // Prefer the FTS-aware fragment when the SQL returned one — that's a
  // sentence-aware window around the matched token (see refineSnippet).
  // Fall back to first ~200 chars when there was no FTS match (vector-only
  // Meaning hits or empty queries).
  const refined = refineSnippet(p.headline);
  if (refined) return refined;
  const text = p.translation || p.original || '';
  if (text.length <= SNIPPET_LEN) return text;
  return text.slice(0, SNIPPET_LEN).trimEnd() + '…';
}

function shapeResult(p) {
  const out = {
    id: p.id,
    citation: p.citation,
    title: p.title,
    canon: p.canon,
    work_slug: p.work_slug,
    snippet: makeSnippet(p),
    score: Number(p.score) || 0,
  };
  // Translation-scope rows carry per-translator metadata. Surface it so
  // the UI can render the matched translator + attribution chip.
  if (p.translator) {
    out.translator = p.translator;
    out.translator_source = p.translator_source;
    out.translator_copyright = p.translator_copyright;
    out.translator_license = p.translator_license;
    out.translator_source_url = p.translator_source_url;
  }
  return out;
}

function normalizeParams({ q, mode, field, limit, pitaka }) {
  const pit = typeof pitaka === 'string' ? pitaka.toLowerCase() : '';
  return {
    q: typeof q === 'string' ? q : '',
    mode: MODES.has(mode) ? mode : 'exact',
    field: FIELDS.has(field) ? field : 'all',
    limit: Math.max(1, Math.min(MAX_LIMIT, Number(limit) || DEFAULT_LIMIT)),
    pitaka: PITAKAS.has(pit) ? pit : null,
  };
}

export async function runSearch(rawParams) {
  const t0 = Date.now();
  const { q, mode, field, limit, pitaka } = normalizeParams(rawParams);

  if (!q.trim()) {
    return { query: q, mode, field, limit, pitaka, took_ms: 0, results: [], expanded: [] };
  }

  const parsed = parseQuery(q);
  const expandAliases = mode !== 'exact';
  const { tsquery, expanded } = buildTsquery(parsed, { expandAliases });

  if (!tsquery && mode !== 'meaning') {
    return { query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0, results: [], expanded };
  }

  const fts = ftsFragment(field);
  // Pitaka filter is a passage-level concept (work_slug ∈ descendants of a
  // pitaka root). Library mode hits the articles table — no pitaka there —
  // so we silently ignore the param in that branch.
  const pSlugs = field === 'library' ? null : await pitakaWorkSlugs(pitaka);
  // Two flavors of the same predicate: one for queries with no alias on
  // passages, one for queries where passages is aliased "p". Empty fragments
  // when pitaka is null so the SQL parses without an unused AND clause.
  const pitakaBare = pSlugs ? sql`AND work_slug   = ANY(${pSlugs})` : sql``;
  const pitakaP    = pSlugs ? sql`AND p.work_slug = ANY(${pSlugs})` : sql``;
  let rows;
  let warning;

  // Library scope: search ATI articles instead of passages. Exact/Stem
  // use FTS only. Meaning runs vector ANN over articles.embedding and
  // RRF-fuses it with FTS (or vector-only when no parseable terms).
  if (field === 'library') {
    const shapeLibrary = (r) => ({
      id: r.id,
      citation: r.title,
      title: r.author || r.category,
      canon: 'Library',
      work_slug: r.work_slug,
      snippet: refineSnippet(r.headline) || '',
      score: Number(r.score) || 0,
      library: true,
      category: r.category,
      source_url: r.source_url,
    });

    if (mode !== 'meaning') {
      if (!tsquery) {
        return { query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0, results: [], expanded };
      }
      rows = await sql`
        SELECT slug AS id, title, author, category, year, source_url,
               'Library' AS canon, slug AS work_slug,
               ts_rank(fts_doc, q) AS score,
               ts_headline('simple', body, q, ${HL_OPTS_LIB}) AS headline
        FROM articles, to_tsquery('simple', ${tsquery}) q
        WHERE source = 'ati' AND fts_doc @@ q
        ORDER BY score DESC
        LIMIT ${limit}
      `;
      return {
        query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0,
        results: rows.map(shapeLibrary),
        expanded,
      };
    }

    // Meaning mode against articles.embedding (HNSW). Mirrors the
    // passages Meaning branch: embed query, RRF-fuse FTS + vector. If
    // embedding fails, fall back to FTS-only with a warning.
    let qVec;
    try { qVec = await embedQuery(q); }
    catch (err) {
      warning = `embed_failed:${err.message}`;
      if (!tsquery) {
        return { query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0, results: [], expanded, warning };
      }
      rows = await sql`
        SELECT slug AS id, title, author, category, year, source_url,
               'Library' AS canon, slug AS work_slug,
               ts_rank(fts_doc, q) AS score,
               ts_headline('simple', body, q, ${HL_OPTS_LIB}) AS headline
        FROM articles, to_tsquery('simple', ${tsquery}) q
        WHERE source = 'ati' AND fts_doc @@ q
        ORDER BY score DESC
        LIMIT ${limit}
      `;
      return { query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0,
               results: rows.map(shapeLibrary), expanded, warning };
    }
    const qVecLit = `[${qVec.join(',')}]`;

    if (!tsquery) {
      rows = await sql`
        SELECT slug AS id, title, author, category, year, source_url,
               'Library' AS canon, slug AS work_slug,
               1.0 / (${RRF_K} + ROW_NUMBER() OVER (ORDER BY embedding <=> ${qVecLit}::vector)) AS score,
               NULL AS headline
        FROM articles
        WHERE source = 'ati' AND embedding IS NOT NULL
        ORDER BY embedding <=> ${qVecLit}::vector
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        WITH
        fts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(fts_doc, q) DESC) AS rnk
          FROM articles, to_tsquery('simple', ${tsquery}) q
          WHERE source = 'ati' AND fts_doc @@ q
          LIMIT ${FUSION_POOL}
        ),
        vec AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${qVecLit}::vector) AS rnk
          FROM articles
          WHERE source = 'ati' AND embedding IS NOT NULL
          ORDER BY embedding <=> ${qVecLit}::vector
          LIMIT ${FUSION_POOL}
        )
        SELECT a.slug AS id, a.title, a.author, a.category, a.year, a.source_url,
               'Library' AS canon, a.slug AS work_slug,
               COALESCE(1.0 / (${RRF_K} + fts.rnk), 0)
             + COALESCE(1.0 / (${RRF_K} + vec.rnk), 0) AS score,
               CASE WHEN fts.id IS NOT NULL
                 THEN ts_headline('simple', a.body,
                        to_tsquery('simple', ${tsquery}), ${HL_OPTS_LIB})
                 ELSE NULL
               END AS headline
        FROM articles a
        LEFT JOIN fts ON fts.id = a.id
        LEFT JOIN vec ON vec.id = a.id
        WHERE (fts.id IS NOT NULL OR vec.id IS NOT NULL)
        ORDER BY score DESC
        LIMIT ${limit}
      `;
    }
    return { query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0,
             results: rows.map(shapeLibrary), expanded };
  }

  if ((mode === 'exact' || mode === 'stem') && field === 'translation') {
    // Translation-only search: hit the `translations` table directly,
    // joining each match back to its passage. One row per
    // (passage, translator) tuple — the UI groups them by passage and
    // shows a list of matched translators.
    rows = await sql`
      SELECT p.id, p.citation, p.title, p.canon, p.work_slug,
             p.original, t.text AS translation,
             t.translator, t.source AS translator_source, t.copyright AS translator_copyright,
             t.license AS translator_license, t.source_url AS translator_source_url,
             ts_rank(t.fts_doc, q) AS score,
             ts_headline('simple', t.text, q, ${HL_OPTS}) AS headline
      FROM translations t
      JOIN passages p ON p.id = t.passage_id,
           to_tsquery('simple', ${tsquery}) q
      WHERE t.fts_doc @@ q ${pitakaP}
      ORDER BY score DESC
      LIMIT ${limit}
    `;
  } else if (mode === 'exact' || mode === 'stem') {
    rows = await sql`
      SELECT id, citation, title, canon, work_slug, original, translation,
             ts_rank(${fts}, q) AS score,
             ts_headline('simple',
               COALESCE(original, '') || ' || ' || COALESCE(translation, ''),
               q, ${HL_OPTS}) AS headline
      FROM passages, to_tsquery('simple', ${tsquery}) q
      WHERE ${fts} @@ q ${pitakaBare}
      ORDER BY score DESC
      LIMIT ${limit}
    `;
  } else if (field === 'translation') {
    // Meaning mode against the multi-translator corpus. Vector ANN on
    // translations.embedding, RRF-fused with FTS on translations.fts_doc
    // when there's a tsquery. Results carry per-translator metadata so
    // the UI shows "tr. Thanissaro Bhikkhu" etc.
    let qVec;
    try { qVec = await embedQuery(q); }
    catch (err) {
      warning = `embed_failed:${err.message}`;
      if (!tsquery) {
        return { query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0, results: [], expanded, warning };
      }
      rows = await sql`
        SELECT p.id, p.citation, p.title, p.canon, p.work_slug,
               p.original, t.text AS translation,
               t.translator, t.source AS translator_source, t.copyright AS translator_copyright,
               t.license AS translator_license, t.source_url AS translator_source_url,
               ts_rank(t.fts_doc, q) AS score
        FROM translations t
        JOIN passages p ON p.id = t.passage_id,
             to_tsquery('simple', ${tsquery}) q
        WHERE t.fts_doc @@ q ${pitakaP}
        ORDER BY score DESC
        LIMIT ${limit}
      `;
      return { query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0,
               results: rows.map(shapeResult), expanded, warning };
    }
    const qVecLit = `[${qVec.join(',')}]`;
    if (!tsquery) {
      rows = await sql`
        SELECT p.id, p.citation, p.title, p.canon, p.work_slug,
               p.original, t.text AS translation,
               t.translator, t.source AS translator_source, t.copyright AS translator_copyright,
               t.license AS translator_license, t.source_url AS translator_source_url,
               1.0 / (${RRF_K} + ROW_NUMBER() OVER (ORDER BY t.embedding <=> ${qVecLit}::vector)) AS score
        FROM translations t
        JOIN passages p ON p.id = t.passage_id
        WHERE t.embedding IS NOT NULL ${pitakaP}
        ORDER BY t.embedding <=> ${qVecLit}::vector
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        WITH
        fts AS (
          SELECT t.id, ROW_NUMBER() OVER (ORDER BY ts_rank(t.fts_doc, q) DESC) AS rnk
          FROM translations t
          JOIN passages p ON p.id = t.passage_id,
               to_tsquery('simple', ${tsquery}) q
          WHERE t.fts_doc @@ q ${pitakaP}
          LIMIT ${FUSION_POOL}
        ),
        vec AS (
          SELECT t.id, ROW_NUMBER() OVER (ORDER BY t.embedding <=> ${qVecLit}::vector) AS rnk
          FROM translations t
          JOIN passages p ON p.id = t.passage_id
          WHERE t.embedding IS NOT NULL ${pitakaP}
          ORDER BY t.embedding <=> ${qVecLit}::vector
          LIMIT ${FUSION_POOL}
        )
        SELECT p.id, p.citation, p.title, p.canon, p.work_slug,
               p.original, t.text AS translation,
               t.translator, t.source AS translator_source, t.copyright AS translator_copyright,
               t.license AS translator_license, t.source_url AS translator_source_url,
               COALESCE(1.0 / (${RRF_K} + fts.rnk), 0)
             + COALESCE(1.0 / (${RRF_K} + vec.rnk), 0) AS score,
               CASE WHEN fts.id IS NOT NULL
                 THEN ts_headline('simple', t.text,
                        to_tsquery('simple', ${tsquery}), ${HL_OPTS})
                 ELSE NULL
               END AS headline
        FROM translations t
        JOIN passages p ON p.id = t.passage_id
        LEFT JOIN fts ON fts.id = t.id
        LEFT JOIN vec ON vec.id = t.id
        WHERE fts.id IS NOT NULL OR vec.id IS NOT NULL
        ORDER BY score DESC
        LIMIT ${limit}
      `;
    }
    return { query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0,
             results: rows.map(shapeResult), expanded };
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
        return { query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0, results: [], expanded, warning };
      }
      rows = await sql`
        SELECT id, citation, title, canon, original, translation,
               ts_rank(${fts}, q) AS score
        FROM passages, to_tsquery('simple', ${tsquery}) q
        WHERE ${fts} @@ q ${pitakaBare}
        ORDER BY score DESC
        LIMIT ${limit}
      `;
      return {
        query: q, mode, field, limit, pitaka, took_ms: Date.now() - t0,
        results: rows.map(shapeResult), expanded, warning,
      };
    }
    const qVecLit = `[${qVec.join(',')}]`;

    if (!tsquery) {
      // Vector-only: no parseable FTS terms.
      // Vector-only branch — no FTS match to headline against, so no
      // headline column. shapeResult falls back to first-N-chars snippet.
      rows = await sql`
        SELECT id, citation, title, canon, work_slug, original, translation,
               1.0 / (${RRF_K} + ROW_NUMBER() OVER (ORDER BY embedding <=> ${qVecLit}::vector)) AS score
        FROM passages
        WHERE embedding IS NOT NULL ${pitakaBare}
        ORDER BY embedding <=> ${qVecLit}::vector
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        WITH
        fts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(${fts}, q) DESC) AS rnk
          FROM passages, to_tsquery('simple', ${tsquery}) q
          WHERE ${fts} @@ q ${pitakaBare}
          LIMIT ${FUSION_POOL}
        ),
        vec AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${qVecLit}::vector) AS rnk
          FROM passages
          WHERE embedding IS NOT NULL ${pitakaBare}
          ORDER BY embedding <=> ${qVecLit}::vector
          LIMIT ${FUSION_POOL}
        )
        SELECT p.id, p.citation, p.title, p.canon, p.work_slug, p.original, p.translation,
               COALESCE(1.0 / (${RRF_K} + fts.rnk), 0)
             + COALESCE(1.0 / (${RRF_K} + vec.rnk), 0) AS score,
               CASE WHEN fts.id IS NOT NULL
                 THEN ts_headline('simple',
                        COALESCE(p.original, '') || ' || ' || COALESCE(p.translation, ''),
                        to_tsquery('simple', ${tsquery}), ${HL_OPTS})
                 ELSE NULL
               END AS headline
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
    query: q, mode, field, limit, pitaka,
    took_ms: Date.now() - t0,
    results: rows.map(shapeResult),
    expanded,
    ...(warning ? { warning } : {}),
  };
}
