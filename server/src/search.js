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
// FUSION_POOL is the per-side candidate ceiling that RRF fuses. 200 was
// the original conservative default; broad queries ("dhamma", "sati") have
// long-tail relevance that benefits from a wider pool before fusion.
// 500 is still well within HNSW + GIN budget — adds maybe 10-30 ms per
// query for the wider scan, materially better Meaning recall.
const FUSION_POOL = 500;
// MAX_LIMIT used to be 100 — a soft cap defending mostly against the per-row
// `ts_headline` cost (~3-8 ms/row on Pali-length passages). The new contract
// is: callers asking for big result sets opt into `nosnippet=true`, which
// drops ts_headline entirely and lets the query stay sub-second well above
// a thousand rows. 5000 is a sanity ceiling; pagination is the expected
// path for browsing the long tail.
const MAX_LIMIT = 5000;
const DEFAULT_LIMIT = 50;
const SNIPPET_LEN = 200;
const SNIPPET_MAX = 320;

// Highlight markers — ts_headline wraps each matched term in StartSel/StopSel.
// Picking ASCII C0 control chars ( SOH,  STX) so the post-process
// pass can locate matches without colliding with anything that legitimately
// appears in canonical text.
const HL_START = '';
const HL_END   = '';
// Multi-fragment snippets — up to three windows around distinct matches in
// the same passage. FragmentDelimiter is `⌇` (U+2307 wavy line) — picked
// for being recognisable post-split and effectively absent from canonical
// Pali / English text. refineSnippet splits on this delimiter, sentence-
// trims each fragment individually, then rejoins with a visual separator.
const HL_FRAG_DELIM = '⌇';
const HL_OPTS  = 'MaxFragments=3,MinWords=12,MaxWords=30,StartSel=,StopSel=,FragmentDelimiter=⌇';
// Library bodies are longer prose; widen each window for readability.
const HL_OPTS_LIB = 'MaxFragments=3,MinWords=18,MaxWords=40,StartSel=,StopSel=,FragmentDelimiter=⌇';

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

// Tokenizer for the boolean query language. Produces a stream of tokens:
//   { kind: 'lparen' | 'rparen' | 'or' }
//   { kind: 'term'   | 'phrase', value: string, negated: boolean }
// Whitespace separates tokens. `OR` (case-insensitive, as a standalone word)
// is the OR operator. `(` `)` group. A leading `-` on a term or phrase makes
// it negated (NOT). Bare adjacent atoms are implicit AND (`sati dhamma` =
// sati AND dhamma).
function tokenize(q) {
  const tokens = [];
  let i = 0;
  while (i < q.length) {
    const c = q[i];
    if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
    if (c === '(') { tokens.push({ kind: 'lparen' }); i++; continue; }
    if (c === ')') { tokens.push({ kind: 'rparen' }); i++; continue; }
    let negated = false;
    if (c === '-' && i + 1 < q.length && q[i + 1] !== ' ' && q[i + 1] !== ')') {
      negated = true;
      i++;
    }
    if (q[i] === '"') {
      // Quoted phrase. Read until next " or EOF (permissive: unterminated
      // phrase consumes to end-of-input).
      const end = q.indexOf('"', i + 1);
      if (end === -1) {
        const value = q.slice(i + 1).trim();
        if (value) tokens.push({ kind: 'phrase', value, negated });
        i = q.length;
      } else {
        const value = q.slice(i + 1, end).trim();
        if (value) tokens.push({ kind: 'phrase', value, negated });
        i = end + 1;
      }
      continue;
    }
    // Bare word: read until whitespace or paren.
    let j = i;
    while (j < q.length && q[j] !== ' ' && q[j] !== '\t' && q[j] !== '\n'
           && q[j] !== '(' && q[j] !== ')') j++;
    const word = q.slice(i, j);
    i = j;
    if (!word) continue;
    if (!negated && word.toUpperCase() === 'OR') {
      tokens.push({ kind: 'or' });
      continue;
    }
    // NEAR/N proximity operator. Maps to Postgres tsquery's `<N>` operator
    // (within N positions). Case-insensitive; N must be a positive integer.
    // Bare `NEAR` (no /N) is not treated as an operator — too ambiguous
    // with terms; users must specify a distance.
    if (!negated) {
      const nearMatch = word.match(/^NEAR\/(\d+)$/i);
      if (nearMatch) {
        const distance = Math.max(1, Math.min(100, parseInt(nearMatch[1], 10)));
        tokens.push({ kind: 'near', distance });
        continue;
      }
    }
    tokens.push({ kind: 'term', value: word, negated });
  }
  return tokens;
}

// Recursive-descent parser. Precedence (highest → lowest):
//   NOT (via token.negated flag) > implicit-AND > OR
// Grammar:
//   expr   := orExpr
//   orExpr := andExpr ( 'OR' andExpr )*
//   andExpr := atom atom*           — adjacent atoms = AND
//   atom   := term | phrase | '(' expr ')'
// Permissive: missing right paren = implicit close at end of input.
function parseTokens(tokens) {
  let pos = 0;
  function peek() { return tokens[pos]; }
  function eat() { return tokens[pos++]; }

  function parseExpr() {
    return parseOr();
  }
  function parseOr() {
    let left = parseAnd();
    while (peek() && peek().kind === 'or') {
      eat();
      const right = parseAnd();
      if (!right) break;
      if (left && left.kind === 'or') left.children.push(right);
      else                            left = { kind: 'or', children: [left, right] };
    }
    return left;
  }
  function parseAnd() {
    const items = [];
    while (peek() && peek().kind !== 'or' && peek().kind !== 'rparen') {
      const a = parseNear();
      if (a) items.push(a);
      else   break;
    }
    if (items.length === 0) return null;
    if (items.length === 1) return items[0];
    return { kind: 'and', children: items };
  }
  // NEAR binds tighter than implicit AND but looser than NOT. Left-associative:
  // `a NEAR/3 b NEAR/5 c` parses as `((a NEAR/3 b) NEAR/5 c)`.
  function parseNear() {
    let left = parseAtom();
    while (peek() && peek().kind === 'near') {
      const tok = eat();
      const right = parseAtom();
      if (!right) break;
      left = { kind: 'near', distance: tok.distance, left, right };
    }
    return left;
  }
  function parseAtom() {
    const t = peek();
    if (!t) return null;
    if (t.kind === 'lparen') {
      eat();
      const inner = parseExpr();
      if (peek() && peek().kind === 'rparen') eat();
      return inner;
    }
    if (t.kind === 'term' || t.kind === 'phrase') {
      eat();
      const node = { kind: t.kind, value: t.value };
      return t.negated ? { kind: 'not', child: node } : node;
    }
    return null;
  }
  const tree = parseExpr();
  return tree;
}

// Walk the AST and collect (a) positive leaf terms, (b) phrases, (c) negated
// leaf terms — the legacy flat shape that frontend display code consumes.
// Stopword + 1-char filtering applies to bare terms only (phrases pass
// through untouched, matching previous behavior).
function flattenAst(node, out, negated = false) {
  if (!node) return;
  if (node.kind === 'term') {
    if (negated) out.exclude.push(node.value);
    else if (!isStopword(node.value)) out.include.push(node.value);
    return;
  }
  if (node.kind === 'phrase') {
    if (negated) out.exclude.push(node.value);
    else         out.phrases.push(node.value);
    return;
  }
  if (node.kind === 'not') {
    flattenAst(node.child, out, !negated);
    return;
  }
  if (node.kind === 'near') {
    flattenAst(node.left, out, negated);
    flattenAst(node.right, out, negated);
    return;
  }
  if (node.kind === 'and' || node.kind === 'or') {
    for (const c of node.children) flattenAst(c, out, negated);
  }
}

export function parseQuery(q) {
  const flat = { include: [], phrases: [], exclude: [], tree: null };
  if (!q) return flat;
  const tokens = tokenize(q);
  const tree = parseTokens(tokens);
  flat.tree = tree;
  flattenAst(tree, flat);
  return flat;
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

// Walk the parsed AST and emit a Postgres tsquery string. Leaf terms are
// alias-expanded in Stem/Meaning modes and become OR-groups of
// (term | alias | alias). The structure of AND / OR / NOT / parens is
// preserved verbatim.
function nodeToTsquery(node, ctx) {
  if (!node) return null;
  if (node.kind === 'term') {
    const base = termToTsquery(node.value, { prefix: ctx.prefix });
    if (!base) return null;
    if (!ctx.expandAliases) return base;
    const aliases = aliasesFor(node.value);
    if (aliases.length === 0) return base;
    const variants = [base];
    for (const a of aliases) {
      const v = termToTsquery(a, { prefix: ctx.prefix });
      if (v) variants.push(v);
    }
    // Surface alias-expansion to the response so the UI can display "also
    // matched via smṛti / 念". Same data shape as the previous buildTsquery.
    ctx.expanded.push({ term: node.value, aliases });
    return variants.length > 1 ? `(${variants.join(' | ')})` : base;
  }
  if (node.kind === 'phrase') {
    // Phrases stay literal — prefix-matching on the last token would break
    // the "exact phrase" contract scholars expect from quoted input.
    const tsq = termToTsquery(node.value);
    return tsq ? `(${tsq})` : null;
  }
  if (node.kind === 'not') {
    const child = nodeToTsquery(node.child, ctx);
    return child ? `!(${child})` : null;
  }
  if (node.kind === 'near') {
    // Map to Postgres tsquery's `<N>` distance operator. Surrounding parens
    // on each side let the children themselves be groups (e.g. an OR list)
    // without ambiguity — modern Postgres accepts complex expressions
    // on both sides of `<N>`.
    const left  = nodeToTsquery(node.left, ctx);
    const right = nodeToTsquery(node.right, ctx);
    if (!left || !right) return left || right;
    return `(${left}) <${node.distance}> (${right})`;
  }
  if (node.kind === 'and') {
    const parts = node.children.map((c) => nodeToTsquery(c, ctx)).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];
    return parts.join(' & ');
  }
  if (node.kind === 'or') {
    const parts = node.children.map((c) => nodeToTsquery(c, ctx)).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];
    return `(${parts.join(' | ')})`;
  }
  return null;
}

export function buildTsquery(parsed, { expandAliases = false } = {}) {
  // In stem/meaning modes (expandAliases=true), use tsquery prefix matching
  // on each token so 'sampajāna' also catches 'sampajāno', 'sampajānaṃ',
  // 'sampajānakārī', etc. Exact mode preserves literal-token semantics.
  const prefix = expandAliases;
  const ctx = { prefix, expandAliases, expanded: [] };
  const tsquery = nodeToTsquery(parsed.tree, ctx) || '';
  return { tsquery, expanded: ctx.expanded };
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

// Field-weighting for ts_rank when matching against the multi-field
// fts_doc (default scope). Schema applies setweight A=citation, B=title,
// C=original, D=translation. ts_rank's defaults {D:0.1, C:0.2, B:0.4, A:1}
// already favour A and B, but citation/title matches are *so* much more
// load-bearing (exact ID, sutta name) that we bump them harder. The
// weights array is {D, C, B, A}.
const FTS_WEIGHTS = sql`'{0.1, 0.3, 0.7, 3.0}'::float4[]`;


// Sentence boundaries: ASCII terminators plus CJK full stop. ts_headline gives
// us a word-boundary-aligned window around the match; this trims that window
// to the surrounding sentence(s) so the snippet reads as a complete thought.
const SENT_END_RE = /[.!?。！？]/;

// Per-fragment refiner: takes one window from ts_headline (highlight markers
// still present) and expands it to the surrounding sentence(s) for readability.
function refineFragment(rawFragment) {
  const text = rawFragment.trim();
  if (!text) return null;
  const startIdx = text.indexOf(HL_START);
  const endIdx   = text.lastIndexOf(HL_END);
  // No highlight marker — this is an unhighlighted window. Strip orphans
  // and return as-is; the caller decides whether to include it.
  if (startIdx === -1 || endIdx === -1) {
    const clean = text.replace(/[]/g, '').trim();
    return clean || null;
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
  // Hard-cap each fragment so a long-sentence expansion can't blow up a
  // multi-fragment snippet. The total SNIPPET_MAX cap is enforced after join.
  if (out.length > SNIPPET_MAX) out = out.slice(0, SNIPPET_MAX).trimEnd() + '…';
  if (left > 0)            out = '… ' + out;
  if (right < text.length) out = out + ' …';
  return out;
}

// Refine a (possibly multi-fragment) ts_headline result. With MaxFragments>1
// ts_headline joins fragments with HL_FRAG_DELIM; we split, refine each
// fragment independently, and rejoin with a visible separator. Total length
// is capped so cards stay predictable.
function refineSnippet(rawHeadline) {
  if (!rawHeadline) return null;
  const fragments = String(rawHeadline).split(HL_FRAG_DELIM);
  const refined = fragments.map(refineFragment).filter(Boolean);
  if (refined.length === 0) return null;
  let out = refined.join(' ⋯ ');
  if (out.length > SNIPPET_MAX) out = out.slice(0, SNIPPET_MAX).trimEnd() + '…';
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

function normalizeParams({ q, mode, field, limit, offset, pitaka, nosnippet }) {
  const pit = typeof pitaka === 'string' ? pitaka.toLowerCase() : '';
  const lim = Math.max(1, Math.min(MAX_LIMIT, Number(limit) || DEFAULT_LIMIT));
  const off = Math.max(0, Number(offset) || 0);
  // Coerce nosnippet from URL string ('true'/'1') or boolean. Frontends should
  // send 'true' as a string; defensively accept the bool form for callers like
  // the smoke-test scripts.
  const noSnip = nosnippet === true || nosnippet === 'true' || nosnippet === '1';
  return {
    q: typeof q === 'string' ? q : '',
    mode: MODES.has(mode) ? mode : 'exact',
    field: FIELDS.has(field) ? field : 'all',
    limit: lim,
    offset: off,
    pitaka: PITAKAS.has(pit) ? pit : null,
    nosnippet: noSnip,
  };
}

export async function runSearch(rawParams) {
  const t0 = Date.now();
  const { q, mode, field, limit, offset, pitaka, nosnippet } = normalizeParams(rawParams);

  if (!q.trim()) {
    return { query: q, mode, field, limit, offset, pitaka, took_ms: 0, results: [], expanded: [], hasMore: false };
  }

  const parsed = parseQuery(q);
  const expandAliases = mode !== 'exact';
  const { tsquery, expanded } = buildTsquery(parsed, { expandAliases });

  if (!tsquery && mode !== 'meaning') {
    return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0, results: [], expanded, hasMore: false };
  }

  const fts = ftsFragment(field);
  // Field-weighted ts_rank for the default scope (fts_doc carries
  // setweight from the schema: A=citation, B=title, C=original,
  // D=translation). Per-field scopes use the default rank weights since
  // their tsvector is single-field — setweight doesn't apply there.
  const ftsRank = field === 'all'
    ? sql`ts_rank(${FTS_WEIGHTS}, ${fts}, q)`
    : sql`ts_rank(${fts}, q)`;
  // Pitaka filter is a passage-level concept (work_slug ∈ descendants of a
  // pitaka root). Library mode hits the articles table — no pitaka there —
  // so we silently ignore the param in that branch.
  const pSlugs = field === 'library' ? null : await pitakaWorkSlugs(pitaka);
  // Two flavors of the same predicate: one for queries with no alias on
  // passages, one for queries where passages is aliased "p". Empty fragments
  // when pitaka is null so the SQL parses without an unused AND clause.
  const pitakaBare = pSlugs ? sql`AND work_slug   = ANY(${pSlugs})` : sql``;
  const pitakaP    = pSlugs ? sql`AND p.work_slug = ANY(${pSlugs})` : sql``;
  // Pagination fragment — zero offset stays as an empty fragment so the
  // generated SQL is identical to the pre-pagination form for the default
  // first-page case.
  const offsetFrag = offset > 0 ? sql`OFFSET ${offset}` : sql``;

  // Headline expressions per row-shape. When nosnippet=true we substitute
  // NULL and skip ts_headline entirely — that's the per-row cost (~3-8 ms
  // on Pali-length passages) that made the old MAX_LIMIT=100 a real
  // ceiling. Flat-list workflows (export, KWIC overview, "show all of X")
  // opt in to nosnippet and get sub-second queries above a thousand rows.
  const hlPassage = nosnippet
    ? sql`NULL`
    : sql`ts_headline('simple', COALESCE(original, '') || ' || ' || COALESCE(translation, ''), q, ${HL_OPTS})`;
  const hlPassageRRF = nosnippet
    ? sql`NULL`
    : sql`CASE WHEN fts.id IS NOT NULL
             THEN ts_headline('simple',
                    COALESCE(p.original, '') || ' || ' || COALESCE(p.translation, ''),
                    to_tsquery('simple', ${tsquery}), ${HL_OPTS})
             ELSE NULL
           END`;
  const hlTranslation = nosnippet
    ? sql`NULL`
    : sql`ts_headline('simple', t.text, q, ${HL_OPTS})`;
  const hlTranslationRRF = nosnippet
    ? sql`NULL`
    : sql`CASE WHEN fts.id IS NOT NULL
             THEN ts_headline('simple', t.text,
                    to_tsquery('simple', ${tsquery}), ${HL_OPTS})
             ELSE NULL
           END`;
  const hlLibrary = nosnippet
    ? sql`NULL`
    : sql`ts_headline('simple', body, q, ${HL_OPTS_LIB})`;
  const hlLibraryRRF = nosnippet
    ? sql`NULL`
    : sql`CASE WHEN fts.id IS NOT NULL
             THEN ts_headline('simple', a.body,
                    to_tsquery('simple', ${tsquery}), ${HL_OPTS_LIB})
             ELSE NULL
           END`;
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
        return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0, results: [], expanded, hasMore: false };
      }
      rows = await sql`
        SELECT slug AS id, title, author, category, year, source_url,
               'Library' AS canon, slug AS work_slug,
               ts_rank(${FTS_WEIGHTS}, fts_doc, q) AS score,
               ${hlLibrary} AS headline
        FROM articles, to_tsquery('simple', ${tsquery}) q
        WHERE source = 'ati' AND fts_doc @@ q
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
      return {
        query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
        results: rows.map(shapeLibrary),
        expanded,
        hasMore: rows.length === limit,
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
        return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0, results: [], expanded, warning, hasMore: false };
      }
      rows = await sql`
        SELECT slug AS id, title, author, category, year, source_url,
               'Library' AS canon, slug AS work_slug,
               ts_rank(${FTS_WEIGHTS}, fts_doc, q) AS score,
               ${hlLibrary} AS headline
        FROM articles, to_tsquery('simple', ${tsquery}) q
        WHERE source = 'ati' AND fts_doc @@ q
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
      return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
               results: rows.map(shapeLibrary), expanded, warning, hasMore: rows.length === limit };
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
        LIMIT ${limit} ${offsetFrag}
      `;
    } else {
      rows = await sql`
        WITH
        fts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(${FTS_WEIGHTS}, fts_doc, q) DESC) AS rnk
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
               ${hlLibraryRRF} AS headline
        FROM articles a
        LEFT JOIN fts ON fts.id = a.id
        LEFT JOIN vec ON vec.id = a.id
        WHERE (fts.id IS NOT NULL OR vec.id IS NOT NULL)
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
    }
    return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
             results: rows.map(shapeLibrary), expanded, hasMore: rows.length === limit };
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
             ${hlTranslation} AS headline
      FROM translations t
      JOIN passages p ON p.id = t.passage_id,
           to_tsquery('simple', ${tsquery}) q
      WHERE t.fts_doc @@ q ${pitakaP}
      ORDER BY score DESC
      LIMIT ${limit} ${offsetFrag}
    `;
  } else if (mode === 'exact' || mode === 'stem') {
    rows = await sql`
      SELECT id, citation, title, canon, work_slug, original, translation,
             ${ftsRank} AS score,
             ${hlPassage} AS headline
      FROM passages, to_tsquery('simple', ${tsquery}) q
      WHERE ${fts} @@ q ${pitakaBare}
      ORDER BY score DESC
      LIMIT ${limit} ${offsetFrag}
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
        return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0, results: [], expanded, warning, hasMore: false };
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
        LIMIT ${limit} ${offsetFrag}
      `;
      return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
               results: rows.map(shapeResult), expanded, warning, hasMore: rows.length === limit };
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
        LIMIT ${limit} ${offsetFrag}
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
               ${hlTranslationRRF} AS headline
        FROM translations t
        JOIN passages p ON p.id = t.passage_id
        LEFT JOIN fts ON fts.id = t.id
        LEFT JOIN vec ON vec.id = t.id
        WHERE fts.id IS NOT NULL OR vec.id IS NOT NULL
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
    }
    return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
             results: rows.map(shapeResult), expanded, hasMore: rows.length === limit };
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
        return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0, results: [], expanded, warning, hasMore: false };
      }
      rows = await sql`
        SELECT id, citation, title, canon, original, translation,
               ${ftsRank} AS score
        FROM passages, to_tsquery('simple', ${tsquery}) q
        WHERE ${fts} @@ q ${pitakaBare}
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
      return {
        query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
        results: rows.map(shapeResult), expanded, warning,
        hasMore: rows.length === limit,
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
        LIMIT ${limit} ${offsetFrag}
      `;
    } else {
      rows = await sql`
        WITH
        fts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ${ftsRank} DESC) AS rnk
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
               ${hlPassageRRF} AS headline
        FROM passages p
        LEFT JOIN fts ON fts.id = p.id
        LEFT JOIN vec ON vec.id = p.id
        WHERE (fts.id IS NOT NULL OR vec.id IS NOT NULL)
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
    }
  }

  return {
    query: q, mode, field, limit, offset, pitaka,
    took_ms: Date.now() - t0,
    results: rows.map(shapeResult),
    expanded,
    hasMore: rows.length === limit,
    ...(warning ? { warning } : {}),
  };
}
