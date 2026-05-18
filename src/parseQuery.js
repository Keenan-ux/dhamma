// Parse a search input into must-have terms, excluded terms, and quoted phrases.
//   `sati -bhikkhu`          → must: [sati], excluded: [bhikkhu]
//   `"clear comprehension"`  → must: [clear comprehension]   (treated as one phrase)
//   `sati -arahant -monk`    → must: [sati], excluded: [arahant, monk]
//
// Whitespace separates tokens. Leading `-` excludes. Quotes group a phrase.

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
        if (term) tokens.push({ term, excluded: isExcluded });
        i = end + 1;
      } else {
        const term = input.slice(i + 1).trim();
        if (term) tokens.push({ term, excluded: isExcluded });
        i = input.length;
      }
    } else {
      const next = input.indexOf(' ', i);
      const end = next === -1 ? input.length : next;
      const term = input.slice(i, end).trim();
      if (term) tokens.push({ term, excluded: isExcluded });
      i = end;
    }
  }
  return {
    must:     tokens.filter((t) => !t.excluded).map((t) => t.term),
    excluded: tokens.filter((t) =>  t.excluded).map((t) => t.term),
    raw: input,
  };
}
