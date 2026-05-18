// Academic typesetting — no card chrome. Each entry sits above a thin gold
// rule, citation in serif italic, body in serif, meta in muted small caps.
// The container is borderless; only the rule above (and the page margin)
// frames it.

import { useState } from 'react';
import { formatCitation } from './citationFormat.js';

export default function PassageCard({ passage, highlight, first }) {
  const [copied, setCopied] = useState(false);

  async function copyCite() {
    try {
      await navigator.clipboard.writeText(formatCitation(passage));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {/* ignore */}
  }

  return (
    <article style={{ ...entryStyle, ...(first ? firstEntryStyle : {}) }}>
      <header style={headerRow}>
        <div style={citationLine}>
          <span style={citation}>{passage.citation}</span>
          <span style={workLine}>{passage.title}{passage.work ? ` · ${passage.work}` : ''}</span>
        </div>
        <div style={traditionLine}>{passage.tradition}</div>
      </header>

      {passage.original && (
        <p style={originalText}>{highlightTerm(passage.original, highlight)}</p>
      )}
      {passage.translation && (
        <p style={translationText}>{highlightTerm(passage.translation, highlight)}</p>
      )}
      {/* Snippet path: search-result cards carry only a short excerpt, not
          full text. Show it in the translation slot if no full text exists. */}
      {!passage.original && !passage.translation && passage.snippet && (
        <p style={translationText}>{highlightTerm(passage.snippet, highlight)}</p>
      )}

      <footer style={footerLine}>
        <span style={canonLabel}>{passage.canon}</span>
        <button onClick={copyCite} style={citeBtn} aria-label="Copy citation">
          {copied ? 'copied' : 'cite'} ↗
        </button>
      </footer>
    </article>
  );
}

function highlightTerm(text, terms) {
  // Accepts a string or an array of strings. Highlights any token whose
  // start matches one of the given terms — so highlighting "sampajāna"
  // also marks "sampajāno", "sampajānassa", "sampajānakārī" etc. This
  // mirrors the server's tsquery prefix-match logic (stem:*) so the
  // visual highlight matches what actually scored the result.
  //
  // For multi-word phrases ("clear comprehension") we keep literal-only
  // matching since the server treats them as positional phrases too.
  if (!terms || (Array.isArray(terms) && terms.length === 0)) return text;
  const list = Array.isArray(terms) ? terms : [terms];
  const patterns = list.map((t) => {
    const esc = String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (/\s/.test(t)) return esc;        // phrase — literal match only
    if (esc.length < 3) return esc;       // very short — avoid noise
    return `${esc}\\p{L}*`;                // prefix-match any Unicode-letter suffix
  }).filter(Boolean);
  if (patterns.length === 0) return text;
  const re      = new RegExp(`(${patterns.join('|')})`, 'giu');
  const isMatch = new RegExp(`^(?:${patterns.join('|')})$`, 'iu');
  const parts = text.split(re);
  return parts.map((p, i) =>
    isMatch.test(p)
      ? <mark key={i} style={mark}>{p}</mark>
      : <span key={i}>{p}</span>
  );
}

const entryStyle = {
  paddingTop: 22,
  marginTop: 22,
  borderTop: '1px solid rgba(var(--bc-accent-rgb), 0.22)',
};

const firstEntryStyle = {
  marginTop: 0,
  paddingTop: 0,
  borderTop: 'none',
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 16,
  marginBottom: 12,
  flexWrap: 'wrap',
};

const citationLine = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
  flex: '1 1 auto',
};

const citation = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 14,
  color: 'var(--bc-accent)',
  letterSpacing: '0.01em',
};

const workLine = {
  fontSize: 12,
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const traditionLine = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  whiteSpace: 'normal',
  textAlign: 'right',
  flex: '0 1 auto',
  maxWidth: '50%',
};

const originalText = {
  margin: '0 0 12px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 15,
  lineHeight: 1.7,
  color: 'var(--bc-text-primary)',
};

const translationText = {
  margin: 0,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13.5,
  lineHeight: 1.65,
  color: 'var(--bc-text-secondary)',
  fontStyle: 'normal',
};

const footerLine = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginTop: 12,
  fontFamily: '"Noto Serif", Georgia, serif',
};

const canonLabel = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  fontFamily: 'Outfit, system-ui, sans-serif',
};

const citeBtn = {
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
  cursor: 'pointer',
  background: 'transparent',
  border: 'none',
  fontFamily: '"Noto Serif", Georgia, serif',
  padding: 0,
};

const mark = {
  background: 'transparent',
  color: 'var(--bc-accent)',
  padding: 0,
  fontWeight: 600,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.5)',
};
