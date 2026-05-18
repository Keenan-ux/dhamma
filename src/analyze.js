// Pure-function corpus analysis. No ML, no model. Foundation of v1 Compare.
// Real ingestion-time lemmatization + Pali morphology lands at the standalone
// Postgres stage; this works directly on substring/token matches for mock data.

const TOKEN_SPLIT = /[\s.,;:!?。、，；：！？「」"'()[\]{}]+/;

function tokenize(text) {
  if (!text) return [];
  return text.split(TOKEN_SPLIT).filter(Boolean);
}

function normalize(word) {
  return word.toLowerCase();
}

// Words ignored when building co-occurrence frequencies. Tiny list for v1 —
// will be expanded per-language at ingest time.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'as', 'that', 'this',
  'these', 'those', 'it', 'its', 'when', 'while', 'so', 'too', 'also',
  'across', 'into', 'from', 'each', 'every', 'all', 'any', 'one', 'two',
  'three', 'four', 'five', 'here', 'there', 'how', 'what', 'who', 'whom',
  'his', 'her', 'their', 'our', 'your', 'my',
  'monks', 'monk', 'bhikkhu', 'bhikkhave',
]);

// Total raw occurrences of `term` (case-insensitive substring) inside `text`.
export function countOccurrences(text, term) {
  if (!text || !term) return 0;
  const lc = text.toLowerCase();
  const needle = term.toLowerCase();
  let n = 0;
  let i = -1;
  while ((i = lc.indexOf(needle, i + 1)) !== -1) n++;
  return n;
}

// KWIC (keyword-in-context): for each token that contains `term`, return the
// surrounding tokens within `window` positions.
export function kwic(text, term, window = 8) {
  if (!text || !term) return [];
  const tokens = tokenize(text);
  const needle = term.toLowerCase();
  const out = [];
  tokens.forEach((tok, i) => {
    if (normalize(tok).includes(needle)) {
      const before = tokens.slice(Math.max(0, i - window), i).join(' ');
      const after = tokens.slice(i + 1, Math.min(tokens.length, i + 1 + window)).join(' ');
      out.push({ before, match: tok, after });
    }
  });
  return out;
}

// Per-tradition occurrence counts (sum across passages).
export function frequencyByTradition(passages, term) {
  const counts = new Map();
  for (const p of passages) {
    const hay = `${p.original || ''} ${p.translation || ''}`;
    const n = countOccurrences(hay, term);
    if (n > 0) counts.set(p.tradition, (counts.get(p.tradition) || 0) + n);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tradition, count]) => ({ tradition, count }));
}

// Words appearing within ±window tokens of the search term, scored by frequency.
// Returns a Map of tradition -> sorted [{ word, count }, ...].
export function neighborsByTradition(passages, term, window = 5, topN = 12) {
  const perTradition = new Map();
  for (const p of passages) {
    const hay = `${p.original || ''} ${p.translation || ''}`;
    const tokens = tokenize(hay);
    const needle = term.toLowerCase();
    const counts = perTradition.get(p.tradition) || new Map();
    tokens.forEach((tok, i) => {
      if (!normalize(tok).includes(needle)) return;
      const start = Math.max(0, i - window);
      const end = Math.min(tokens.length, i + window + 1);
      for (let j = start; j < end; j++) {
        if (j === i) continue;
        const w = normalize(tokens[j]).replace(/[^\p{L}\p{N}-]/gu, '');
        if (!w || w.length < 3 || STOPWORDS.has(w)) continue;
        if (normalize(w).includes(needle)) continue; // skip the term itself + inflections
        counts.set(w, (counts.get(w) || 0) + 1);
      }
    });
    perTradition.set(p.tradition, counts);
  }
  const result = new Map();
  for (const [trad, counts] of perTradition) {
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word, count]) => ({ word, count }));
    result.set(trad, sorted);
  }
  return result;
}
