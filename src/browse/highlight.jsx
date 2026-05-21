import { paliStem } from '../paliStem.js';

// Escape user input before injecting into a RegExp source.
export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Wrap matches of `find` in <mark> tags. Case-insensitive, Unicode-safe.
// `find` accepts either a string (single term — what the in-passage find
// bar produces) or an array of strings (search-context highlights —
// multiple matched terms + alias-expanded variants from the result set).
// In stem mode, tokens whose paliStem() equals any target stem are
// highlighted (so "sati" catches "satiyā", "satimā", etc.). Returns the
// original text when find is empty so non-find paths stay zero-cost.
export function highlightFind(text, find, stemMode = false) {
  if (!find) return text;
  const terms = Array.isArray(find)
    ? find.filter((t) => t && String(t).trim().length > 0).map(String)
    : (String(find).trim() ? [String(find)] : []);
  if (terms.length === 0) return text;
  if (stemMode) {
    const targetStems = new Set(
      terms.map((t) => paliStem(t.toLowerCase())).filter(Boolean)
    );
    if (targetStems.size === 0) return text;
    const parts = String(text).split(/(\p{L}+)/u);
    return parts.map((p, i) => {
      if (i % 2 === 0) return <span key={i}>{p}</span>;
      return targetStems.has(paliStem(p.toLowerCase()))
        ? <mark key={i} style={findMark}>{p}</mark>
        : <span key={i}>{p}</span>;
    });
  }
  const re = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'giu');
  const parts = String(text).split(re);
  return parts.map((p, i) =>
    i % 2 === 1
      ? <mark key={i} style={findMark}>{p}</mark>
      : <span key={i}>{p}</span>
  );
}

// Wrap Pali word tokens with their DPD gloss (native browser tooltip
// via title=). Words without a gloss render as plain text so the
// passage layout is unchanged.
export function withGlosses(text, glossMap) {
  if (!glossMap || Object.keys(glossMap).length === 0) return text;
  // Split keeping the separators: every odd index is a word token.
  const parts = String(text).split(/(\p{L}+)/u);
  return parts.map((p, i) => {
    if (i % 2 === 0) return <span key={i}>{p}</span>;
    const g = glossMap[p.toLowerCase()];
    if (!g) return <span key={i}>{p}</span>;
    return (
      <span key={i} style={glossWord} title={`${g.headword} — ${g.def} (${g.source.toUpperCase()})`}>
        {p}
      </span>
    );
  });
}

const findMark = {
  background: 'rgba(var(--bc-accent-rgb), 0.22)',
  color: 'inherit',
  padding: '0 2px',
  borderRadius: 2,
};

// Glossed Pali words get a thin dotted underline so the reader knows
// hovering will show the headword + DPD definition. Restrained — most
// Pali words will have a gloss, and a heavy underline becomes a wall.
const glossWord = {
  borderBottom: '1px dotted rgba(var(--bc-accent-rgb), 0.35)',
  cursor: 'help',
};
