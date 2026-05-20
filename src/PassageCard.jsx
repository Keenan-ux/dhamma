// Academic typesetting — no card chrome. Each entry sits above a thin gold
// rule, citation in serif italic, body in serif, meta in muted small caps.
// The container is borderless; only the rule above (and the page margin)
// frames it.

import { useState } from 'react';
import { formatCitation } from './citationFormat.js';

const TRANSLATOR_LABEL = {
  sujato: 'Bhante Sujato',
  thanissaro: 'Thanissaro Bhikkhu',
  walshe: 'Maurice Walshe',
  ireland: 'John D. Ireland',
  olendzki: 'Andrew Olendzki',
  buddharakkhita: 'Acharya Buddharakkhita',
  nyanaponika: 'Nyanaponika Thera',
  nanamoli: 'Ñāṇamoli Thera',
  piyadassi: 'Piyadassi Thera',
  bodhi: 'Bhikkhu Bodhi',
  narada: 'Nārada Thera',
  soma: 'Soma Thera',
  nyanasatta: 'Nyanasatta Thera',
  'sister-uppalavanna': 'Sister Uppalavanna',
  'nanamoli-bodhi': 'Ñāṇamoli & Bodhi',
  horner: 'I. B. Horner',
  hare: 'E. M. Hare',
  'amaravati-sangha': 'Amaravati Sangha',
  nizamis: 'Nizamis',
  hecker: 'Hellmuth Hecker',
  vajira: 'Sister Vajira',
  kelly: 'John Kelly',
  harvey: 'Peter Harvey',
  sonadhammo: 'Sonadhammo',
  kandy: 'Kandy News-Wheel',
};

export default function PassageCard({ passage, highlight, first, onOpen }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function copyCite() {
    try {
      await navigator.clipboard.writeText(formatCitation(passage));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {/* ignore */}
  }

  // Click-to-open. Swallows clicks on nested controls (cite button) and
  // ignores clicks that are part of a text selection (so highlighting a
  // word for dictionary lookup doesn't also navigate away).
  function handleCardClick(e) {
    if (!onOpen) return;
    if (e.target.closest('button')) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;
    onOpen(passage.id);
  }
  function handleCardKey(e) {
    if (!onOpen) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(passage.id);
    }
  }

  const trName = passage.translator ? (TRANSLATOR_LABEL[passage.translator] || passage.translator) : null;

  return (
    <article
      style={{
        ...entryStyle,
        ...(first ? firstEntryStyle : {}),
        ...(onOpen ? clickableStyle : {}),
        ...(onOpen && hovered ? hoverStyle : {}),
      }}
      onClick={handleCardClick}
      onKeyDown={handleCardKey}
      onMouseEnter={onOpen ? () => setHovered(true) : undefined}
      onMouseLeave={onOpen ? () => setHovered(false) : undefined}
      role={onOpen ? 'link' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `Open passage ${passage.citation}` : undefined}
    >
      <header style={headerRow}>
        <div style={citationLine}>
          <span style={citation}>{passage.citation}</span>
          <span style={workLine}>{passage.title}{passage.work ? ` · ${passage.work}` : ''}</span>
          {trName && (
            <span style={translatorBadge} title={passage.translator_source === 'ati' ? 'Access to Insight' : 'SuttaCentral'}>
              tr. {trName}
              {passage.translator_source === 'ati' && <span style={atiBadge}>ATI</span>}
            </span>
          )}
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
        <span style={footerActions}>
          {onOpen && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(passage.id); }}
                style={openBtn}
                aria-label="Open passage in reader"
              >
                open ↗
              </button>
              <span style={footerSep}>·</span>
            </>
          )}
          <button onClick={copyCite} style={citeBtn} aria-label="Copy citation">
            {copied ? 'copied' : 'cite'} ↗
          </button>
        </span>
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

// onOpen-enabled cards become "open" affordances: pointer cursor and a
// faint accent wash on hover. The wash is restrained — the card is a
// scholarly entry, not a button. Negative margin pulls the wash a
// little past the body padding so the hover surface feels intentional.
const clickableStyle = {
  cursor: 'pointer',
  borderRadius: 4,
  margin: '22px -12px 0',
  padding: '22px 12px 0',
  transition: 'background 100ms ease',
};

const hoverStyle = {
  background: 'rgba(var(--bc-accent-rgb), 0.05)',
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

const translatorBadge = {
  fontSize: 11,
  fontStyle: 'italic',
  color: 'var(--bc-accent)',
  fontFamily: '"Noto Serif", Georgia, serif',
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 6,
  marginTop: 2,
};

const atiBadge = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.10em',
  padding: '1px 5px',
  borderRadius: 3,
  border: '1px solid rgba(var(--bc-accent-rgb), 0.40)',
  color: 'var(--bc-accent)',
  textTransform: 'uppercase',
  fontFamily: 'Outfit, system-ui, sans-serif',
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

const footerActions = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 8,
};

const footerSep = {
  color: 'var(--bc-text-tertiary)',
  opacity: 0.4,
};

const openBtn = {
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-accent)',
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
