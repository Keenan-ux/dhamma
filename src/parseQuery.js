// Parse a search input into the legacy `must` / `excluded` / `phrases` lists
// that SearchView consumes for its "matched X + Y" / "without Z" message,
// PLUS an AST `tree` that captures boolean grouping (OR, parens, NOT).
//
// Grammar:
//   sati                       → AND-of-terms (single)
//   sati dhamma                → AND
//   -bhikkhu                   → NOT
//   "clear comprehension"      → phrase
//   sati OR smṛti              → OR  (OR is case-insensitive)
//   (sati OR smṛti) -kāya      → grouping + NOT
//
// The tree representation isn't used by SearchView's display code directly;
// the server consumes it via its own parser to build a tsquery. We mirror
// the same structure here so future client-side highlighting can walk the
// tree and know which leaves were OR-related (e.g. visually grouping
// matched aliases under their parent).

const STOPWORDS = new Set([
  'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'as', 'that', 'this',
  'these', 'those', 'it', 'its', 'the', 'i', 's',
]);

function isStopword(term) {
  if (!term) return true;
  if (term.length < 2) return true;
  if (term.includes(' ')) return false;
  return STOPWORDS.has(term.toLowerCase());
}

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

function parseTokens(tokens) {
  let pos = 0;
  function peek() { return tokens[pos]; }
  function eat() { return tokens[pos++]; }

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
      const inner = parseOr();
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
  return parseOr();
}

function flattenAst(node, out, negated = false) {
  if (!node) return;
  if (node.kind === 'term') {
    if (negated) out.excluded.push(node.value);
    else if (!isStopword(node.value)) out.must.push(node.value);
    return;
  }
  if (node.kind === 'phrase') {
    if (negated) out.excluded.push(node.value);
    else         out.must.push(node.value);
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

export function parseQuery(input) {
  const out = { must: [], excluded: [], raw: input || '', tree: null };
  if (!input) return out;
  const tokens = tokenize(input);
  const tree = parseTokens(tokens);
  out.tree = tree;
  flattenAst(tree, out);
  return out;
}
