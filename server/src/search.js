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

// Weight on the blurb lane's RRF contribution (the fourth Meaning-mode lane,
// vec_blurb). A blurb is a short, human-curated "aboutness" summary, so a
// strong blurb match (rank 1-3) is a higher-precision topical signal than an
// incidental body-text fragment. With four lanes plus length-dampening and the
// canonicality / primary-text boosts, an unweighted blurb hit (~1/61) is too
// weak to lift a body-sparse sutta into the top results — which defeats the
// lane's whole purpose (surface the ABOUT-this sutta even when the body-text
// lanes drown it). 2.5× lands a blurb-#1 sutta in the top 5 while still letting
// suttas that match on body AND blurb rank above it — e.g. the query "approach
// families like the moon" surfaces SN 16.3 (Candūpama) at ~#3, behind genuine
// peers like AN 5.111 (Kulūpaka, "On Visiting Families"). Values >=3 start to
// let blurb-only hits dominate suttas with broader relevance.
// Weight of the vec_blurb RRF lane relative to the body lanes. A/B tested
// (2026-05-29) at 0.0/1.0/1.5/2.5 over a 6-query precision-vs-aboutness set:
// 1.0 is the highest weight that keeps the precise canonical text in the
// top-3 (e.g. MN 24 for "purification of view") while still gaining the
// blurb lane's thematic recall (family-conduct suttas, DN 15 for dependent
// origination) and cluster-tightening. 2.5 buried precise matches; 0.0 lost
// the recall. Overridable via env for future re-tuning without a redeploy.
const BLURB_WEIGHT = process.env.BLURB_WEIGHT ? Number(process.env.BLURB_WEIGHT) : 1.0;

// Primary-text anchor list — well-known canonical suttas that
// scholars expect to surface near the top for thematic queries.
// Without this, the canonicality boost (1.25× on mula) lifts mula
// over commentary but doesn't single out the FAMOUS text on a topic
// from the long tail of mula passages mentioning it. With the
// stronger 1.5× multiplier here, snp1.8 (Karaṇīyamettā Sutta) rises
// above the AN/Iti/Abhidhamma mettā mentions for the query "metta".
// Kept short and curated rather than auto-derived — additions should
// be scholar-validated. Compose multiplicatively with the canonicality
// 1.25× boost (so a primary-text mula passage gets ~1.875× total).
const PRIMARY_TEXTS = new Set([
  // Mettā / Brahmavihāras
  'snp1.8',          // Karaṇīyamettā / Metta Sutta
  // Satipaṭṭhāna / Ānāpānasati
  'dn22',            // Mahāsatipaṭṭhāna
  'mn10',            // Satipaṭṭhāna
  'mn118',           // Ānāpānasati
  // First and second discourses; pivotal early teachings
  'sn56.11',         // Dhammacakkappavattana — First Discourse
  'sn22.59',         // Anattalakkhaṇa — Second Discourse
  'mn26',            // Ariyapariyesanā — The Noble Search
  // Parinibbāna + late discourses
  'dn16',            // Mahāparinibbāna
  // Foundational doctrinal suttas
  'mn1',             // Mūlapariyāya
  'mn2',             // Sabbāsava
  'dn15',            // Mahānidāna — paṭiccasamuppāda
  'dn2',             // Sāmaññaphala
  'dn1',             // Brahmajāla
  'mn22',            // Alagaddūpama
  'mn38',            // Mahātaṇhāsaṅkhaya
  'mn44',            // Cūḷavedalla
  'mn140',           // Dhātuvibhaṅga
  'sn12.2',          // Paṭiccasamuppāda — analysed
  'sn22.86',         // Anurādha
  // Mettā / brahmavihāras supplements
  'an11.16',         // Mettā 11 benefits
  'iti27',           // Mettābhāvanā
  // Refuges and ethics
  'kp1',             // Saraṇattaya — Going for Refuge
  'kp2',             // Sikkhāpada — 10 precepts
  'kp9',             // Karaṇīyamettā (Khp version)
  // Dependent origination + emptiness
  'sn12.15',         // Kaccānagotta — middle way
  'sn22.95',         // Pheṇapiṇḍūpama — foam-lump
  // Verses
  'dhp1',            // Dhammapada chapter 1
]);
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
// Corpus layer — orthogonal to field/scope. 'library' routes to the
// articles table (replaces field=library). The other four map to
// passages.work_role values populated by the CST ingest + the SC mula
// backfill. `null` = no constraint (everything except Library).
const LAYERS = new Set(['mula', 'attha', 'tika', 'anya', 'library']);
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
    // Drop bare stopwords + 1-char tokens — matches flattenAst's filter so
    // the tsquery and the user-facing "must terms" list agree on what's
    // load-bearing. Without this, typing `the` would generate a tsquery
    // that matches every English passage and report a misleading total.
    if (isStopword(node.value)) return null;
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
    // Multi-word alias lookup: an AND of plain terms might collectively
    // form a known alias key (e.g. "clear comprehension" → sampajāna;
    // "mindfulness of breathing" → ānāpānasati). Try the joined phrase
    // before falling through to per-term expansion. If found, return
    // a single OR-group covering the phrase + its canonical + siblings
    // instead of an AND-of-terms-individually-AND-aliased.
    if (ctx.expandAliases && node.children.every((c) => c.kind === 'term')) {
      const phrase = node.children.map((c) => c.value).join(' ');
      const phraseAliases = aliasesFor(phrase);
      if (phraseAliases.length > 0) {
        const variants = [];
        const phraseTsq = termToTsquery(phrase, { prefix: ctx.prefix });
        if (phraseTsq) variants.push(`(${phraseTsq})`);
        for (const a of phraseAliases) {
          const v = termToTsquery(a, { prefix: ctx.prefix });
          if (v) variants.push(v);
        }
        ctx.expanded.push({ term: phrase, aliases: phraseAliases });
        if (variants.length > 1) return `(${variants.join(' | ')})`;
        if (variants.length === 1) return variants[0];
      }
    }
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
    case 'citation':    return sql`to_tsvector('simple_unaccent', coalesce(citation, ''))`;
    case 'title':       return sql`to_tsvector('simple_unaccent', coalesce(title, ''))`;
    case 'original':    return sql`to_tsvector('simple_unaccent', coalesce(original, ''))`;
    case 'translation': return sql`to_tsvector('simple_unaccent', coalesce(translation, ''))`;
    default:            return sql`fts_doc`;
  }
}

// Field-weighting for ts_rank when matching against the multi-field
// fts_doc (default scope). Schema applies setweight A=citation, B=title,
// C=original, D=translation. ts_rank's defaults {D:0.1, C:0.2, B:0.4, A:1};
// Postgres constrains every weight ∈ [0, 1] so we can't push A above
// 1.0. Instead we suppress D + C to widen the gap so citation/title
// hits clearly outrank body-only matches. The weights array is {D, C, B, A}.
const FTS_WEIGHTS = sql`'{0.05, 0.15, 0.6, 1.0}'::float4[]`;

// True total of FTS-matching rows for the active query, so the result-
// count line can say "4,237 passages matching sati" instead of the
// loaded-so-far count. Cheap on the GIN index even for broad terms.
// Returns null when there's no FTS predicate (vector-only Meaning queries)
// — there's no meaningful "total" for a pure ANN search, the answer is
// the entire embedded corpus sorted by similarity.
async function countFtsMatches({ field, tsquery, pSlugs, layer, translator, tagType, tagValue }) {
  if (!tsquery) return null;
  if (field === 'library') {
    const [{ n }] = await sql`
      SELECT COUNT(*)::int AS n
      FROM articles, to_tsquery('simple_unaccent', ${tsquery}) q
      WHERE source = 'ati' AND fts_doc @@ q
    `;
    return n;
  }
  // Mirror the runSearch predicates for accurate counts under both
  // pitaka and layer constraints. Empty fragments when not set so the
  // generated SQL collapses to the simplest possible form.
  const layerP = (layer && layer !== 'library') ? sql`AND p.work_role = ${layer}` : sql``;
  const layerBare = (layer && layer !== 'library') ? sql`AND work_role = ${layer}` : sql``;
  const translatorT = (translator && field === 'translation')
    ? sql`AND t.translator = ${translator}` : sql``;
  // Tag filter — only apply when both type and value are present.
  // EXISTS subquery against passage_tags so the JOIN graph isn't
  // disturbed in either the translation or passage branch.
  const tagP = (tagType && tagValue)
    ? sql`AND EXISTS (SELECT 1 FROM passage_tags pt WHERE pt.passage_id = p.id AND pt.tag_type = ${tagType} AND pt.tag_value = ${tagValue})`
    : sql``;
  const tagBare = (tagType && tagValue)
    ? sql`AND EXISTS (SELECT 1 FROM passage_tags pt WHERE pt.passage_id = id AND pt.tag_type = ${tagType} AND pt.tag_value = ${tagValue})`
    : sql``;
  if (field === 'translation') {
    const pitakaP = pSlugs ? sql`AND p.work_slug = ANY(${pSlugs})` : sql``;
    const [{ n }] = await sql`
      SELECT COUNT(*)::int AS n
      FROM translations t
      JOIN passages p ON p.id = t.passage_id,
           to_tsquery('simple_unaccent', ${tsquery}) q
      WHERE t.fts_doc @@ q ${pitakaP} ${layerP} ${translatorT} ${tagP} ${tagP}
    `;
    return n;
  }
  const fts = ftsFragment(field);
  const pitakaBare = pSlugs ? sql`AND work_slug = ANY(${pSlugs})` : sql``;
  const [{ n }] = await sql`
    SELECT COUNT(*)::int AS n
    FROM passages, to_tsquery('simple_unaccent', ${tsquery}) q
    WHERE ${fts} @@ q ${pitakaBare} ${layerBare} ${tagBare} ${tagBare}
  `;
  return n;
}


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
    title_en: p.title_en,
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

function normalizeParams({ q, mode, field, limit, offset, pitaka, nosnippet, layer, translator, tag }) {
  const pit = typeof pitaka === 'string' ? pitaka.toLowerCase() : '';
  const lay = typeof layer === 'string' ? layer.toLowerCase() : '';
  const lim = Math.max(1, Math.min(MAX_LIMIT, Number(limit) || DEFAULT_LIMIT));
  const off = Math.max(0, Number(offset) || 0);
  // Coerce nosnippet from URL string ('true'/'1') or boolean. Frontends should
  // send 'true' as a string; defensively accept the bool form for callers like
  // the smoke-test scripts.
  const noSnip = nosnippet === true || nosnippet === 'true' || nosnippet === '1';
  // Layer 'library' is the modern path that replaces field='library' (the
  // old way still works for backward-compat). Normalise to a single
  // routing decision: effectively-library iff either signal says so.
  const normalizedLayer = LAYERS.has(lay) ? lay : null;
  const effectiveField = (field === 'library' || normalizedLayer === 'library')
    ? 'library'
    : (FIELDS.has(field) ? field : 'all');
  // Translator filter — only takes effect on translation-scope queries
  // (the only path that touches the translations table directly). Defensive
  // length cap so a malformed slug can't blow up the parameter binding.
  const tr = typeof translator === 'string' ? translator.trim().slice(0, 64) : '';
  // Tag filter — format is `type:value` from the URL. Both halves are
  // capped at 96 chars defensively; the value is the user-facing tag
  // string (e.g. "Burning house") so we don't lowercase it.
  let tagType = null, tagValue = null;
  if (typeof tag === 'string' && tag.includes(':')) {
    const idx = tag.indexOf(':');
    const t = tag.slice(0, idx).trim().toLowerCase().slice(0, 32);
    const v = tag.slice(idx + 1).trim().slice(0, 200);
    if (t && v && /^[a-z_]+$/.test(t)) {
      tagType = t;
      tagValue = v;
    }
  }
  return {
    q: typeof q === 'string' ? q : '',
    mode: MODES.has(mode) ? mode : 'exact',
    field: effectiveField,
    limit: lim,
    offset: off,
    pitaka: PITAKAS.has(pit) ? pit : null,
    layer: normalizedLayer,
    translator: tr || null,
    tagType,
    tagValue,
    nosnippet: noSnip,
  };
}

// Expand the embedding query text with alias equivalents (sati ↔ smṛti ↔ 念,
// mettā ↔ loving-kindness ↔ friendliness, etc.) so the vector picks up
// semantic neighbors that use different vocabulary. Stem mode already
// expands the tsquery via aliases; this does the equivalent for the
// vector side. Without it, a query like "loving-kindness" embeds purely
// against passages that use that exact English phrase and misses
// Karaṇīyamettā (which Sujato translates as "good-will") plus the rest
// of the mettā corpus that uses different English vocabulary.
function expandEmbeddingQuery(rawQuery, parsed) {
  const aliasSet = new Set();
  const walk = (node) => {
    if (!node) return;
    if (node.kind === 'term') {
      const aList = aliasesFor(node.value);
      for (const a of aList) aliasSet.add(a);
    } else if (node.kind === 'and' || node.kind === 'or') {
      // Multi-word lookup: try the joined phrase as a potential alias
      // key BEFORE walking individual children. Catches phrases like
      // "clear comprehension" → sampajāna and "mindfulness of breathing"
      // → ānāpānasati that wouldn't surface from per-term lookup.
      if (node.children.every((c) => c.kind === 'term')) {
        const phrase = node.children.map((c) => c.value).join(' ');
        for (const a of aliasesFor(phrase)) aliasSet.add(a);
      }
      for (const c of node.children) walk(c);
    } else if (node.kind === 'not') {
      walk(node.child);
    } else if (node.kind === 'near') {
      walk(node.left); walk(node.right);
    }
  };
  walk(parsed.tree);
  if (aliasSet.size === 0) return rawQuery;
  return `${rawQuery} ${Array.from(aliasSet).join(' ')}`;
}

export async function runSearch(rawParams) {
  const t0 = Date.now();
  const { q, mode, field, limit, offset, pitaka, layer, translator, tagType, tagValue, nosnippet } = normalizeParams(rawParams);

  if (!q.trim()) {
    return { query: q, mode, field, limit, offset, pitaka, layer, took_ms: 0, results: [], expanded: [], hasMore: false, total: 0 };
  }

  const parsed = parseQuery(q);
  const expandAliases = mode !== 'exact';
  const { tsquery, expanded } = buildTsquery(parsed, { expandAliases });

  if (!tsquery && mode !== 'meaning') {
    return { query: q, mode, field, limit, offset, pitaka, layer, took_ms: Date.now() - t0, results: [], expanded, hasMore: false, total: 0 };
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
  // Kick off the true-total count in parallel with the main row query.
  // The COUNT runs against the same FTS predicate (no LIMIT) and lets
  // the UI say "4,237 passages matching sati" upfront, instead of just
  // the loaded-so-far count growing as the user scrolls. Resolves to
  // null when there's no FTS predicate (vector-only Meaning).
  const totalPromise = countFtsMatches({ field, tsquery, pSlugs, layer, translator, tagType, tagValue });
  // Two flavors of the same predicate: one for queries with no alias on
  // passages, one for queries where passages is aliased "p". Empty fragments
  // when pitaka is null so the SQL parses without an unused AND clause.
  const pitakaBare = pSlugs ? sql`AND work_slug   = ANY(${pSlugs})` : sql``;
  const pitakaP    = pSlugs ? sql`AND p.work_slug = ANY(${pSlugs})` : sql``;
  // Layer filter — passages.work_role ∈ {mula, attha, tika, anya}. 'library'
  // is handled by routing into the articles branch (above), not via this
  // predicate. Empty fragments when no layer is set so the SQL is identical
  // to the pre-layer form for unfiltered queries.
  const layerWhere = (layer && layer !== 'library')
    ? { bare: sql`AND work_role = ${layer}`, p: sql`AND p.work_role = ${layer}` }
    : { bare: sql``, p: sql`` };
  const layerBare = layerWhere.bare;
  const layerP    = layerWhere.p;
  // Translator filter — only meaningful when querying the translations
  // table (field === 'translation'). For non-translation scopes the
  // filter would have nothing to constrain against, so we ignore it
  // there. Empty fragment when not set.
  const translatorT = (translator && field === 'translation')
    ? sql`AND t.translator = ${translator}`
    : sql``;
  // Tag filter — passage-level EXISTS predicate against passage_tags
  // (the ATI-derived curated indexes: simile / name / subject / number).
  // Composes with FTS / vector / layer / pitaka. Two fragments: one for
  // queries where passages is aliased "p", one for the bare passages
  // table reference.
  const tagP = (tagType && tagValue)
    ? sql`AND EXISTS (SELECT 1 FROM passage_tags pt WHERE pt.passage_id = p.id AND pt.tag_type = ${tagType} AND pt.tag_value = ${tagValue})`
    : sql``;
  const tagBare = (tagType && tagValue)
    ? sql`AND EXISTS (SELECT 1 FROM passage_tags pt WHERE pt.passage_id = passages.id AND pt.tag_type = ${tagType} AND pt.tag_value = ${tagValue})`
    : sql``;
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
    : sql`ts_headline('simple_unaccent', COALESCE(original, '') || ' || ' || COALESCE(translation, ''), q, ${HL_OPTS})`;
  const hlPassageRRF = nosnippet
    ? sql`NULL`
    : sql`CASE WHEN fts.id IS NOT NULL
             THEN ts_headline('simple_unaccent',
                    COALESCE(p.original, '') || ' || ' || COALESCE(p.translation, ''),
                    to_tsquery('simple_unaccent', ${tsquery}), ${HL_OPTS})
             ELSE NULL
           END`;
  const hlTranslation = nosnippet
    ? sql`NULL`
    : sql`ts_headline('simple_unaccent', t.text, q, ${HL_OPTS})`;
  const hlTranslationRRF = nosnippet
    ? sql`NULL`
    : sql`CASE WHEN fts.id IS NOT NULL
             THEN ts_headline('simple_unaccent', t.text,
                    to_tsquery('simple_unaccent', ${tsquery}), ${HL_OPTS})
             ELSE NULL
           END`;
  const hlLibrary = nosnippet
    ? sql`NULL`
    : sql`ts_headline('simple_unaccent', body, q, ${HL_OPTS_LIB})`;
  const hlLibraryRRF = nosnippet
    ? sql`NULL`
    : sql`CASE WHEN fts.id IS NOT NULL
             THEN ts_headline('simple_unaccent', a.body,
                    to_tsquery('simple_unaccent', ${tsquery}), ${HL_OPTS_LIB})
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
        return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0, results: [], expanded, hasMore: false, total: 0 };
      }
      rows = await sql`
        SELECT slug AS id, title, author, category, year, source_url,
               'Library' AS canon, slug AS work_slug,
               ts_rank(${FTS_WEIGHTS}, fts_doc, q) AS score,
               ${hlLibrary} AS headline
        FROM articles, to_tsquery('simple_unaccent', ${tsquery}) q
        WHERE source = 'ati' AND fts_doc @@ q
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
      return {
        query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
        results: rows.map(shapeLibrary),
        expanded,
        hasMore: rows.length === limit,
        total: await totalPromise,
      };
    }

    // Meaning mode against articles.embedding (HNSW). Mirrors the
    // passages Meaning branch: embed query, RRF-fuse FTS + vector. If
    // embedding fails, fall back to FTS-only with a warning.
    let qVec;
    try { qVec = await embedQuery(expandEmbeddingQuery(q, parsed)); }
    catch (err) {
      warning = `embed_failed:${err.message}`;
      if (!tsquery) {
        return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0, results: [], expanded, warning, hasMore: false, total: 0 };
      }
      rows = await sql`
        SELECT slug AS id, title, author, category, year, source_url,
               'Library' AS canon, slug AS work_slug,
               ts_rank(${FTS_WEIGHTS}, fts_doc, q) AS score,
               ${hlLibrary} AS headline
        FROM articles, to_tsquery('simple_unaccent', ${tsquery}) q
        WHERE source = 'ati' AND fts_doc @@ q
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
      return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
               results: rows.map(shapeLibrary), expanded, warning, hasMore: rows.length === limit,
               total: await totalPromise };
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
          AND (embedding <=> ${qVecLit}::vector) < 0.7
        ORDER BY embedding <=> ${qVecLit}::vector
        LIMIT ${limit} ${offsetFrag}
      `;
    } else {
      rows = await sql`
        WITH
        fts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(${FTS_WEIGHTS}, fts_doc, q) DESC) AS rnk
          FROM articles, to_tsquery('simple_unaccent', ${tsquery}) q
          WHERE source = 'ati' AND fts_doc @@ q
          LIMIT ${FUSION_POOL}
        ),
        vec AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${qVecLit}::vector) AS rnk
          FROM articles
          WHERE source = 'ati' AND embedding IS NOT NULL
            AND (embedding <=> ${qVecLit}::vector) < 0.7
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
             results: rows.map(shapeLibrary), expanded, hasMore: rows.length === limit,
             total: await totalPromise };
  }

  if ((mode === 'exact' || mode === 'stem') && field === 'translation') {
    // Translation-only search: hit the `translations` table directly,
    // joining each match back to its passage. One row per
    // (passage, translator) tuple — the UI groups them by passage and
    // shows a list of matched translators.
    rows = await sql`
      SELECT p.id, p.citation, p.title, p.title_en, p.canon, p.work_slug,
             p.original, t.text AS translation,
             t.translator, t.source AS translator_source, t.copyright AS translator_copyright,
             t.license AS translator_license, t.source_url AS translator_source_url,
             ts_rank(t.fts_doc, q) AS score,
             ${hlTranslation} AS headline
      FROM translations t
      JOIN passages p ON p.id = t.passage_id,
           to_tsquery('simple_unaccent', ${tsquery}) q
      WHERE t.fts_doc @@ q ${pitakaP} ${layerP} ${translatorT} ${tagP}
      ORDER BY score DESC
      LIMIT ${limit} ${offsetFrag}
    `;
  } else if (mode === 'exact' || mode === 'stem') {
    rows = await sql`
      SELECT id, citation, title, title_en, canon, work_slug, original, translation,
             ${ftsRank} AS score,
             ${hlPassage} AS headline
      FROM passages, to_tsquery('simple_unaccent', ${tsquery}) q
      WHERE ${fts} @@ q ${pitakaBare} ${layerBare} ${tagBare}
      ORDER BY score DESC
      LIMIT ${limit} ${offsetFrag}
    `;
  } else if (field === 'translation') {
    // Meaning mode against the multi-translator corpus. Vector ANN on
    // translations.embedding, RRF-fused with FTS on translations.fts_doc
    // when there's a tsquery. Results carry per-translator metadata so
    // the UI shows "tr. Thanissaro Bhikkhu" etc.
    let qVec;
    try { qVec = await embedQuery(expandEmbeddingQuery(q, parsed)); }
    catch (err) {
      warning = `embed_failed:${err.message}`;
      if (!tsquery) {
        return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0, results: [], expanded, warning, hasMore: false, total: 0 };
      }
      rows = await sql`
        SELECT p.id, p.citation, p.title, p.title_en, p.canon, p.work_slug,
               p.original, t.text AS translation,
               t.translator, t.source AS translator_source, t.copyright AS translator_copyright,
               t.license AS translator_license, t.source_url AS translator_source_url,
               ts_rank(t.fts_doc, q) AS score
        FROM translations t
        JOIN passages p ON p.id = t.passage_id,
             to_tsquery('simple_unaccent', ${tsquery}) q
        WHERE t.fts_doc @@ q ${pitakaP} ${layerP} ${translatorT} ${tagP}
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
      return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
               results: rows.map(shapeResult), expanded, warning, hasMore: rows.length === limit,
               total: await totalPromise };
    }
    const qVecLit = `[${qVec.join(',')}]`;
    if (!tsquery) {
      rows = await sql`
        SELECT p.id, p.citation, p.title, p.title_en, p.canon, p.work_slug,
               p.original, t.text AS translation,
               t.translator, t.source AS translator_source, t.copyright AS translator_copyright,
               t.license AS translator_license, t.source_url AS translator_source_url,
               1.0 / (${RRF_K} + ROW_NUMBER() OVER (ORDER BY t.embedding <=> ${qVecLit}::vector)) AS score
        FROM translations t
        JOIN passages p ON p.id = t.passage_id
        WHERE t.embedding IS NOT NULL
          AND (t.embedding <=> ${qVecLit}::vector) < 0.7
          ${pitakaP} ${layerP} ${translatorT} ${tagP}
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
               to_tsquery('simple_unaccent', ${tsquery}) q
          WHERE t.fts_doc @@ q ${pitakaP} ${layerP} ${translatorT} ${tagP}
          LIMIT ${FUSION_POOL}
        ),
        vec AS (
          SELECT t.id, ROW_NUMBER() OVER (ORDER BY t.embedding <=> ${qVecLit}::vector) AS rnk
          FROM translations t
          JOIN passages p ON p.id = t.passage_id
          WHERE t.embedding IS NOT NULL
            AND (t.embedding <=> ${qVecLit}::vector) < 0.7
            ${pitakaP} ${layerP} ${translatorT} ${tagP}
          ORDER BY t.embedding <=> ${qVecLit}::vector
          LIMIT ${FUSION_POOL}
        )
        SELECT p.id, p.citation, p.title, p.title_en, p.canon, p.work_slug,
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
             results: rows.map(shapeResult), expanded, hasMore: rows.length === limit,
             total: await totalPromise };
  } else {
    // Meaning mode: FTS (if any) + vector ANN, RRF-fused. If embedding fails,
    // fall back to FTS-only with a warning. If tsquery is empty (e.g. all
    // user terms were operator-only), do vector-only.
    let qVec;
    try {
      qVec = await embedQuery(expandEmbeddingQuery(q, parsed));
    } catch (err) {
      warning = `embed_failed:${err.message}`;
      if (!tsquery) {
        return { query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0, results: [], expanded, warning, hasMore: false, total: 0 };
      }
      rows = await sql`
        SELECT id, citation, title, title_en, canon, original, translation,
               ${ftsRank} AS score
        FROM passages, to_tsquery('simple_unaccent', ${tsquery}) q
        WHERE ${fts} @@ q ${pitakaBare} ${layerBare} ${tagBare}
        ORDER BY score DESC
        LIMIT ${limit} ${offsetFrag}
      `;
      return {
        query: q, mode, field, limit, offset, pitaka, took_ms: Date.now() - t0,
        results: rows.map(shapeResult), expanded, warning,
        hasMore: rows.length === limit,
        total: await totalPromise,
      };
    }
    const qVecLit = `[${qVec.join(',')}]`;

    if (!tsquery) {
      // Vector-only: no parseable FTS terms.
      // Vector-only branch — no FTS match to headline against, so no
      // headline column. shapeResult falls back to first-N-chars snippet.
      // Distance < 0.7 clips long-tail noise (see the three-way RRF
      // block below for the rationale).
      rows = await sql`
        SELECT id, citation, title, title_en, canon, work_slug, original, translation,
               1.0 / (${RRF_K} + ROW_NUMBER() OVER (ORDER BY embedding <=> ${qVecLit}::vector)) AS score
        FROM passages
        WHERE embedding IS NOT NULL
          AND (embedding <=> ${qVecLit}::vector) < 0.7
          ${pitakaBare} ${layerBare} ${tagBare}
        ORDER BY embedding <=> ${qVecLit}::vector
        LIMIT ${limit} ${offsetFrag}
      `;
    } else {
      // Three-way RRF for default-scope Meaning:
      //   fts    — literal token / phrase matches (alias-expanded)
      //   vec_p  — passages.embedding ANN (mixed Pali+English content)
      //   vec_t  — translations.embedding ANN, best-translation-per-passage
      //
      // vec_t closes the cross-lingual gap on 11,609 CST passages that
      // embed as pure Pāli. An English query like "clear comprehension"
      // gets weak matches from vec_p (which has to bridge through BGE-M3's
      // Pāli understanding) but strong matches from vec_t (against rich
      // English translation text). RRF fuses all three; in practice the
      // good vec_t hits surface above weak vec_p tail when the query is
      // English-heavy.
      //
      // Distance threshold (`<=> < 0.7`) clips long-tail vector noise. The
      // top-K ANN scan always returns K rows however irrelevant the K-th
      // is; the filter drops rows whose cosine distance to the query
      // vector is worse than 0.7 (cosine sim < 0.3) so a poorly-aimed
      // query returns fewer-but-relevant results instead of junk.
      const VEC_MAX_DIST = 0.7;
      rows = await sql`
        WITH
        fts AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY ${ftsRank} DESC) AS rnk
          FROM passages, to_tsquery('simple_unaccent', ${tsquery}) q
          WHERE ${fts} @@ q ${pitakaBare} ${layerBare} ${tagBare}
          LIMIT ${FUSION_POOL}
        ),
        vec_p AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> ${qVecLit}::vector) AS rnk
          FROM passages
          WHERE embedding IS NOT NULL
            AND (embedding <=> ${qVecLit}::vector) < ${VEC_MAX_DIST}
            ${pitakaBare} ${layerBare} ${tagBare}
          ORDER BY embedding <=> ${qVecLit}::vector
          LIMIT ${FUSION_POOL}
        ),
        vec_t AS (
          SELECT t.passage_id AS id,
                 ROW_NUMBER() OVER (ORDER BY MIN(t.embedding <=> ${qVecLit}::vector)) AS rnk
          FROM translations t
          JOIN passages p ON p.id = t.passage_id
          WHERE t.embedding IS NOT NULL
            AND (t.embedding <=> ${qVecLit}::vector) < ${VEC_MAX_DIST}
            ${pitakaP} ${layerP} ${tagP}
          GROUP BY t.passage_id
          ORDER BY MIN(t.embedding <=> ${qVecLit}::vector)
          LIMIT ${FUSION_POOL}
        ),
        -- vec_blurb — ANN over the curated SuttaCentral blurbs (one short,
        -- densely thematic paragraph per sutta saying what it is *about*).
        -- Mirrors vec_t, but the blurbs table holds one row per passage (PK
        -- passage_id) so no GROUP BY/MIN is needed. Because a blurb is short
        -- and on-topic, its vector isn't diluted by thousands of chars of
        -- surrounding narrative, so an "about this sutta" query (e.g. "how to
        -- behave around families" → SN 16.3) ranks the right sutta high even
        -- when the body-text lanes (fts / vec_p) drown it. Same 0.7 distance
        -- clip as the other vector lanes. ~4k rows: a seq scan is fine while
        -- the blurb HNSW build is deferred past the passages reindex.
        vec_blurb AS (
          SELECT b.passage_id AS id,
                 ROW_NUMBER() OVER (ORDER BY b.embedding <=> ${qVecLit}::vector) AS rnk
          FROM blurbs b
          JOIN passages p ON p.id = b.passage_id
          WHERE b.embedding IS NOT NULL
            AND (b.embedding <=> ${qVecLit}::vector) < ${VEC_MAX_DIST}
            ${pitakaP} ${layerP} ${tagP}
          ORDER BY b.embedding <=> ${qVecLit}::vector
          LIMIT ${FUSION_POOL}
        )
        SELECT p.id, p.citation, p.title, p.title_en, p.canon, p.work_slug, p.original, p.translation,
               -- Length-aware score: dampen very short passages so single-line
               -- Theragāthā / Therīgāthā verses don't dominate the top of broad
               -- thematic queries over substantial sutta passages on the same
               -- topic. The 1 - exp(-len/800) curve is ~0.22 at 200 chars, ~0.47
               -- at 500, ~0.71 at 1000, ~0.92 at 2000, asymptotic to 1. Tuned
               -- aggressively because verse passages (50-300 chars) were
               -- consistently out-RRF'ing canonical suttas (1000+ chars) on
               -- broad thematic queries like 'metta'. Earlier curve (/300) was
               -- too gentle to flip the ordering.
               -- The three BODY-text lanes (fts / vec_p / vec_t) are length-
               -- dampened so short verse passages don't dominate broad thematic
               -- queries. The blurb lane is deliberately OUTSIDE the dampener:
               -- a blurb is an "aboutness" summary, so a sutta whose blurb
               -- matches should surface on that strength however short its body
               -- is — that is the whole point of the lane (surface the
               -- ABOUT-this sutta even when the body-text lanes drown it). The
               -- blurb term still gets the canonicality / primary-text
               -- multipliers below.
               (((COALESCE(1.0 / (${RRF_K} + fts.rnk), 0)
               + COALESCE(1.0 / (${RRF_K} + vec_p.rnk), 0)
               + COALESCE(1.0 / (${RRF_K} + vec_t.rnk), 0))
               * (1.0 - exp(-length(COALESCE(p.original, '') || COALESCE(p.translation, '')) / 800.0))
               + ${BLURB_WEIGHT} * COALESCE(1.0 / (${RRF_K} + vec_blurb.rnk), 0))
               -- Canonicality boost: a 25% multiplier on canonical mula
               -- passages. Without it, the Visuddhimagga's systematic
               -- treatment of mettā (Vism §80, ~3K chars of terminology)
               -- consistently outranks the canonical Karaṇīyamettā Sutta
               -- (Snp 1.8, ~900 chars) on the query "metta" — accurate
               -- but not what most scholars are looking for. 1.25 lifts
               -- the canonical above the commentary without removing
               -- the commentary from results.
               --
               -- Vism is tagged work_role='mula' in the CST work map
               -- (its file is e0101n.nrf, fallback role'd via the
               -- explicit prefix mapping) but its content is
               -- commentary, not canon. Excluding work_slug='pli-vism'
               -- from the boost keeps Vism §80 in results without
               -- giving it the canon-level multiplier.
               * CASE
                   WHEN p.work_role = 'mula' AND p.work_slug <> 'pli-vism' THEN 1.25
                   ELSE 1.0
                 END
               -- Primary-text anchor boost: a 2.5× multiplier on top
               -- of the canonicality boost for the curated ~30 famous
               -- canonical suttas. Compose multiplicatively, so a
               -- primary-text mula passage scores ~3.1× a generic
               -- mula row at the same RRF position. The larger
               -- multiplier (vs 1.5) is necessary because primary
               -- texts like snp1.8 are short verse passages and the
               -- length-aware dampener applies a ~0.6-0.7× factor
               -- that needs to be overcome. The goal: surface the
               -- famous canonical text on a topic in the top few
               -- results, not just the long-tail mula mentions.
               * CASE WHEN p.id = ANY(${[...PRIMARY_TEXTS]}::text[]) THEN 2.5 ELSE 1.0 END) AS score,
               ${hlPassageRRF} AS headline
        FROM passages p
        LEFT JOIN fts       ON fts.id       = p.id
        LEFT JOIN vec_p     ON vec_p.id     = p.id
        LEFT JOIN vec_t     ON vec_t.id     = p.id
        LEFT JOIN vec_blurb ON vec_blurb.id = p.id
        WHERE (fts.id IS NOT NULL OR vec_p.id IS NOT NULL OR vec_t.id IS NOT NULL OR vec_blurb.id IS NOT NULL)
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
    total: await totalPromise,
    ...(warning ? { warning } : {}),
  };
}
