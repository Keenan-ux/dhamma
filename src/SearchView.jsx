import { useMemo } from 'react';
import { SAMPLE_PASSAGES } from './data/samplePassages.js';
import { stemMatch } from './paliStem.js';
import PassageCard from './PassageCard.jsx';

const TRADITIONS = Array.from(new Set(SAMPLE_PASSAGES.map((p) => p.tradition)));

const MODES = [
  { key: 'exact',   label: 'Exact',   hint: 'Substring match' },
  { key: 'stem',    label: 'Stem',    hint: 'Pali morphology — matches inflections' },
  { key: 'meaning', label: 'Meaning', hint: 'Semantic — ships with corpus ingest (v2)' },
];

function matches(passage, term, mode) {
  const hay = `${passage.original || ''} ${passage.translation || ''} ${passage.title || ''}`;
  if (mode === 'exact') {
    return hay.toLowerCase().includes(term.toLowerCase());
  }
  if (mode === 'stem') {
    // Try stem-match against the full haystack; fall back to substring so
    // longer phrases still resolve when the stem split misses.
    return stemMatch(hay, term) || hay.toLowerCase().includes(term.toLowerCase());
  }
  // Meaning mode: real semantic search needs pgvector. Until v2, mimic with
  // stem-match so the user can preview the UX. Banner above explains.
  return stemMatch(hay, term) || hay.toLowerCase().includes(term.toLowerCase());
}

export default function SearchView({
  query, setQuery,
  activeTraditions, toggleTradition,
  showInlineFilters,
  searchMode, setSearchMode,
}) {
  const q = query ?? '';
  const setQ = setQuery ?? (() => {});
  const mode = searchMode || 'exact';

  const term = q.trim();

  const found = useMemo(() => {
    if (!term) return [];
    return SAMPLE_PASSAGES.filter((p) => {
      if (!activeTraditions.has(p.tradition)) return false;
      return matches(p, term, mode);
    });
  }, [term, mode, activeTraditions]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
      <div style={wrap}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a term across the canon — e.g. sampajāna, satipaṭṭhāna, 正知"
          style={input}
          spellCheck={false}
          autoFocus
        />

        <div style={modeRow}>
          <span style={modeLabel}>Match</span>
          {MODES.map((m) => {
            const on = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSearchMode?.(m.key)}
                title={m.hint}
                style={{
                  ...modeBtn,
                  color: on ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
                  borderBottomColor: on ? 'var(--bc-accent)' : 'transparent',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {mode === 'meaning' && (
          <div style={modeBanner}>
            <strong style={{ color: 'var(--bc-accent)', fontStyle: 'normal' }}>Meaning</strong>
            &nbsp;runs vector search via pgvector — ships with corpus ingest. For now this falls back to <em>Stem</em>, so the surface still works.
          </div>
        )}

        {showInlineFilters && (
          <div style={filterRow}>
            <span style={filterLabel}>Traditions</span>
            {TRADITIONS.map((t) => {
              const on = activeTraditions.has(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTradition(t)}
                  style={{
                    ...filterBtn,
                    color: on ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
                    borderBottomColor: on ? 'var(--bc-accent)' : 'transparent',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}

        {!term && (
          <p style={meta}>Start typing to search. The current corpus is a scaffold of six passages featuring <em>sampajāna</em>; real ingestion lands once the standalone repo is up.</p>
        )}

        {term && found.length === 0 && (
          <p style={meta}>No matches for <strong>{term}</strong> in the visible traditions.</p>
        )}

        {term && found.length > 0 && (
          <p style={meta}>
            <strong style={{ color: 'var(--bc-text-secondary)' }}>{found.length}</strong> {found.length === 1 ? 'passage' : 'passages'} {modeVerb(mode)} <strong style={{ color: 'var(--bc-accent)' }}>{term}</strong>, across {new Set(found.map((m) => m.tradition)).size} {new Set(found.map((m) => m.tradition)).size === 1 ? 'tradition' : 'traditions'}.
          </p>
        )}

        <div>
          {found.map((p, i) => (
            <PassageCard key={p.id} passage={p} highlight={term} first={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function modeVerb(mode) {
  if (mode === 'stem') return 'matching the stem of';
  if (mode === 'meaning') return 'near the meaning of';
  return 'containing';
}

const wrap = { maxWidth: 820, margin: '0 auto', padding: '28px 28px 48px' };

const input = {
  width: '100%',
  padding: '14px 4px',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.35)',
  background: 'transparent',
  color: 'var(--bc-text-primary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 17,
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: 18,
};

const modeRow = {
  display: 'flex',
  gap: 4,
  alignItems: 'baseline',
  marginBottom: 18,
  paddingBottom: 6,
};

const modeLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  marginRight: 12,
};

const modeBtn = {
  padding: '6px 10px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid transparent',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'color 120ms ease, border-color 120ms ease',
};

const modeBanner = {
  fontSize: 12,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.55,
  margin: '0 0 18px',
  paddingBottom: 14,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.14)',
};

const filterRow = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
  alignItems: 'baseline',
  marginBottom: 24,
};

const filterLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  marginRight: 12,
};

const filterBtn = {
  padding: '6px 10px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid transparent',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'color 120ms ease, border-color 120ms ease',
};

const meta = {
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.6,
  margin: '0 0 8px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
};
