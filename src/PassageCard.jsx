// Academic typesetting — no card chrome. Each entry sits above a thin gold
// rule, citation in serif italic, body in serif, meta in muted small caps.
// The container is borderless; only the rule above (and the page margin)
// frames it.

import { useState } from 'react';
import { formatCitation, prettifyVinayaCitation } from './citationFormat.js';
import { isModifiedClick, passageHref } from './linkHelpers.js';

// CST extra-canonical passages carry raw VRI identifiers as their
// citation field — strings like "E0806N-NRF §354" that scholars can't
// read at a glance. Replace the cryptic prefix with the work's
// readable name when available, keeping the § section number intact.
// Pattern: leading alphanumeric block with a hyphen-separated suffix
// like "-NRF" or "-N", followed by whitespace + the rest.
const CST_PREFIX_RE = /^[A-Z]\d+[A-Z]?-[A-Z]+\s+/;
function displayCitation(citation, workName) {
  if (!citation) return citation;
  // Vinaya UID cleanup first — independent of workName.
  const vinaya = prettifyVinayaCitation(citation);
  if (vinaya !== citation) return vinaya;
  if (!workName) return citation;
  if (!CST_PREFIX_RE.test(citation)) return citation;
  const rest = citation.replace(CST_PREFIX_RE, '').trim();
  return rest ? `${workName} ${rest}` : workName;
}

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
  // SuttaCentral CC0 community translators (ingested via
  // ingest-sc-translators.mjs). Brahmali is the main Vinaya translator
  // on SC; the others fill scattered Khuddaka + verse coverage.
  brahmali: 'Bhikkhu Brahmali',
  anandajoti: 'Bhikkhu Ānandajoti',
  kovilo: 'Kovilo Bhikkhu',
  suddhaso: 'Bhante Suddhāso',
  patton: 'Charles Patton',
};

export default function PassageCard({ passage, highlight, first, onOpen, compact }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function copyCite() {
    try {
      await navigator.clipboard.writeText(formatCitation(passage, { translatorName: trName }));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {/* ignore */}
  }

  // Click-to-open. Swallows clicks on nested controls (cite button) and
  // ignores clicks that are part of a text selection (so highlighting a
  // word for dictionary lookup doesn't also navigate away). Modified
  // clicks (Cmd/Ctrl/Shift/middle) fall through to the browser so the
  // user can open the passage in a new tab. Passes the full passage so
  // the parent can route library hits (slug → article reader) vs
  // passage hits (id → passage reader).
  function handleCardClick(e) {
    if (!onOpen) return;
    if (e.target.closest('button')) return;
    if (isModifiedClick(e)) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    onOpen(passage);
  }

  const trName = passage.translator ? (TRANSLATOR_LABEL[passage.translator] || passage.translator) : null;

  // When onOpen is provided we render the whole card as an <a> so the
  // browser exposes a real link target — right-click "Open in New
  // Tab", Cmd-click, middle-click all work natively. When there's no
  // onOpen (e.g. a card embedded inside a reader for context), we
  // fall back to <article> with no link behaviour.
  const Tag = onOpen ? 'a' : 'article';
  const linkAttrs = onOpen ? {
    href: passageHref(passage),
    onClick: handleCardClick,
    'aria-label': `Open passage ${passage.citation}`,
  } : {};

  return (
    <Tag
      style={{
        ...entryStyle,
        ...(first ? firstEntryStyle : {}),
        ...(onOpen ? clickableStyle : {}),
        ...(onOpen ? linkResetStyle : {}),
        ...(onOpen && hovered ? hoverStyle : {}),
      }}
      {...linkAttrs}
      onMouseEnter={onOpen ? () => setHovered(true) : undefined}
      onMouseLeave={onOpen ? () => setHovered(false) : undefined}
    >
      <header style={headerRow}>
        <div style={citationLine}>
          <span style={citation}>{displayCitation(passage.citation, passage.work)}</span>
          {/* Title line. Where the Pāli sutta name + English title are
              populated (SC bilara passages), show "Pāli · English ·
              Work". For passages without sutta-name metadata (e.g. CST
              commentary) fall back to whatever's in `title` plus the
              work label, matching the prior behaviour. */}
          <span style={workLine}>
            {(passage.title || passage.title_en) ? (
              <>
                {passage.title && <span style={titlePali}>{passage.title}</span>}
                {passage.title && passage.title_en && <> · </>}
                {passage.title_en && <span style={titleEn}>{passage.title_en}</span>}
                {passage.work && <> · {passage.work}</>}
              </>
            ) : (
              <>{passage.title}{passage.work ? ` · ${passage.work}` : ''}</>
            )}
          </span>
          {trName && (
            <span style={translatorBadge} title={passage.translator_source === 'ati' ? 'Access to Insight' : 'SuttaCentral'}>
              tr. {trName}
              {passage.translator_source === 'ati' && <span style={atiBadge}>ATI</span>}
            </span>
          )}
        </div>
        {/* Tradition chip retired — only Theravāda is ingested, so the
            "THERAVĀDA" label on every card was redundant clutter. Restore
            this when cross-tradition data lands. */}
      </header>

      {/* Compact mode (driven by the SearchView "Show all without snippets"
          toggle): skip every body block so the card collapses to citation +
          title + work + footer — a flat scholarly index of every hit.
          Otherwise the standard renderings below apply. */}
      {!compact && passage.original && (
        <p style={originalText}>{highlightTerm(passage.original, highlight)}</p>
      )}
      {!compact && passage.translation && (
        <p style={translationText}>{highlightTerm(passage.translation, highlight)}</p>
      )}
      {/* Snippet path: search-result cards carry only a short excerpt, not
          full text. Show it in the translation slot if no full text exists. */}
      {!compact && !passage.original && !passage.translation && passage.snippet && (
        <p style={translationText}>{highlightTerm(passage.snippet, highlight)}</p>
      )}

      <footer style={footerLine}>
        <span style={canonLabel}>{passage.canon}</span>
        <span style={footerActions}>
          {onOpen && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(passage); }}
                style={openBtn}
                aria-label="Open in reader"
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
    </Tag>
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
// Strip the default <a> appearance so a card rendered as an anchor
// reads the same as one rendered as <article>. Browsers still honour
// the href for right-click / Cmd-click / middle-click.
const linkResetStyle = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
};

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

// Pāli sutta name in the card subtitle ("Sukhasutta"). Slightly
// emphasised against the rest of the meta line.
const titlePali = {
  color: 'var(--bc-text-secondary)',
};

// English title in the card subtitle ("Pleasure"). Italic to mark it
// as a translator-given rendering rather than a Pāli name.
const titleEn = {
  fontStyle: 'italic',
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
