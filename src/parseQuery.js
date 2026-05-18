// Parse a search input into must-have terms, excluded terms, and quoted phrases.
//   `sati -bhikkhu`              → must: [sati], excluded: [bhikkhu]
//   `"clear comprehension"`      → must: [clear comprehension]
//   `mindfulness of breathing`   → must: [mindfulness, breathing]   ('of' filtered)
//
// Whitespace separates tokens. Leading `-` excludes. Quotes group a phrase.
// Bare English stopwords and 1-char tokens are stripped from `must` so the UI
// doesn't highlight them and Search doesn't AND-require them. Stopwords still
// pass through if they appear inside a quoted phrase.

const STOPWORDS = new Set([
  'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'as', 'that', 'this',
  'these', 'those', 'it', 'its', 'the', 'i', 's',
]);

function isStopword(term) {
  if (!term) return true;
  if (term.length < 2) return true;
  // Skip filtering on multi-word terms (phrases) — only single words.
  if (term.includes(' ')) return false;
  return STOPWORDS.has(term.toLowerCase());
}

export function parseQuery(input) {
  if (!input) return { must: [], excluded: [], raw: '' };
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    if (input[i] === ' ') { i++; continue; }
    let isExcluded = false;
    if (input[i] === '-' && i + 1 < input.length && input[i + 1] !== ' ') {
      isExcluded = true;
      i++;
    }
    if (input[i] === '"') {
      const end = input.indexOf('"', i + 1);
      if (end > -1) {
        const term = input.slice(i + 1, end).trim();
        if (term) tokens.push({ term, excluded: isExcluded, phrase: true });
        i = end + 1;
      } else {
        const term = input.slice(i + 1).trim();
        if (term) tokens.push({ term, excluded: isExcluded, phrase: true });
        i = input.length;
      }
    } else {
      const next = input.indexOf(' ', i);
      const end = next === -1 ? input.length : next;
      const term = input.slice(i, end).trim();
      if (term) tokens.push({ term, excluded: isExcluded, phrase: false });
      i = end;
    }
  }
  return {
    must: tokens
      .filter((t) => !t.excluded)
      .filter((t) => t.phrase || !isStopword(t.term))
      .map((t) => t.term),
    excluded: tokens.filter((t) => t.excluded).map((t) => t.term),
    raw: input,
  };
}
