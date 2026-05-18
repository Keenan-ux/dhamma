import { useEffect, useMemo, useRef, useState } from 'react';
import { SAMPLE_PASSAGES } from './data/samplePassages.js';
import { stemMatch } from './paliStem.js';
import { parseQuery } from './parseQuery.js';
import useSearchHistory from './searchHistory.js';
import PassageCard from './PassageCard.jsx';

const TRADITIONS = Array.from(new Set(SAMPLE_PASSAGES.map((p) => p.tradition)));
const DIACRITICS = ['ā', 'ī', 'ū', 'ē', 'ō', 'ṃ', 'ṅ', 'ñ', 'ṇ', 'ṭ', 'ḍ', 'ṛ', 'ḷ', 'ṣ', 'ś'];

const MODES = [
  { key: 'exact',   label: 'Exact',   hint: 'Substring match' },
  { key: 'stem',    label: 'Stem',    hint: 'Pali morphology — matches inflections' },
  { key: 'meaning', label: 'Meaning', hint: 'Semantic — ships with corpus ingest (v2)' },
];

const SCOPES = [
  { key: 'all',         label: 'All' },
  { key: 'original',    label: 'Original' },
  { key: 'translation', label: 'Translation' },
  { key: 'citation',    label: 'Citation' },
];

function fieldText(p, scope) {
  if (scope === 'original')    return p.original || '';
  if (scope === 'translation') return p.translation || '';
  if (scope === 'citation')    return [p.citation, p.title, p.work].filter(Boolean).join(' ');
  return `${p.original || ''} ${p.translation || ''} ${p.title || ''} ${p.citation || ''}`;
}

function termHits(hay, term, mode) {
  const lc = hay.toLowerCase();
  if (lc.includes(term.toLowerCase())) return true;
  if (mode === 'exact') return false;
  return stemMatch(hay, term);
}

function passageMatches(passage, parsed, mode, scope) {
  const hay = fieldText(passage, scope);
  for (const t of parsed.excluded) {
    if (termHits(hay, t, mode)) return false;
  }
  if (parsed.must.length === 0) return false;
  return parsed.must.every((t) => termHits(hay, t, mode));
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

  const [scope, setScope] = useState('all');
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const { history, push } = useSearchHistory();

  const parsed = useMemo(() => parseQuery(q.trim()), [q]);

  const found = useMemo(() => {
    if (!parsed.raw) return [];
    return SAMPLE_PASSAGES.filter((p) => {
      if (!activeTraditions.has(p.tradition)) return false;
      return passageMatches(p, parsed, mode, scope);
    });
  }, [parsed, mode, scope, activeTraditions]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (parsed.must.length > 0) push(parsed.raw);
    }, 1200);
    return () => clearTimeout(t);
  }, [parsed, push]);

  useEffect(() => {
    if (!historyOpen) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setHistoryOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [historyOpen]);

  function insertChar(ch) {
    const el = inputRef.current;
    if (!el) { setQ(q + ch); return; }
    const start = el.selectionStart ?? q.length;
    const end = el.selectionEnd ?? q.length;
    const next = q.slice(0, start) + ch + q.slice(end);
    setQ(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + ch.length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
      <div style={wrap}>
        <div style={{ position: 'relative' }} ref={wrapRef}>
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => history.length && setHistoryOpen(true)}
            placeholder='Search — e.g. sampajāna, -bhikkhu, "clear comprehension"'
            style={input}
            spellCheck={false}
            autoFocus
          />
          {historyOpen && history.length > 0 && (
            <div style={historyMenu}>
              <div style={historyLabel}>Recent</div>
              {history.map((h) => (
                <button
                  key={h}
                  onClick={() => { setQ(h); setHistoryOpen(false); inputRef.current?.focus(); }}
                  style={historyItem}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={diacriticsRow} aria-label="Insert Pali diacritic">
          {DIACRITICS.map((ch) => (
            <button key={ch} onClick={() => insertChar(ch)} style={diacriticBtn} title={`Insert ${ch}`}>
              {ch}
            </button>
          ))}
        </div>

        <div style={filterStack}>
          <FilterRow label="Match"     options={MODES}  active={mode}  onChange={setSearchMode} />
          <FilterRow label="Search in" options={SCOPES} active={scope} onChange={setScope} />
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

        {!parsed.raw && (
          <p style={meta}>
            Search across the canon. Prefix a term with <code style={code}>-</code> to exclude
            (e.g. <code style={code}>sampajāna -bhikkhu</code>). Wrap a phrase in quotes for an exact phrase.
          </p>
        )}

        {parsed.raw && found.length === 0 && (
          <p style={meta}>No matches for <strong>{parsed.raw}</strong> in the visible traditions.</p>
        )}

        {parsed.raw && found.length > 0 && (
          <p style={meta}>
            <strong style={{ color: 'var(--bc-text-secondary)' }}>{found.length}</strong>{' '}
            {found.length === 1 ? 'passage' : 'passages'} {modeVerb(mode)}{' '}
            {parsed.must.map((t, i) => (
              <span key={t}>
                <strong style={{ color: 'var(--bc-accent)' }}>{t}</strong>
                {i < parsed.must.length - 1 ? ' + ' : ''}
              </span>
            ))}
            {parsed.excluded.length > 0 && (
              <>
                {' '}without{' '}
                {parsed.excluded.map((t, i) => (
                  <span key={t}>
                    <strong style={{ color: 'var(--bc-loss-text)' }}>{t}</strong>
                    {i < parsed.excluded.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </>
            )}
            , across {new Set(found.map((m) => m.tradition)).size}{' '}
            {new Set(found.map((m) => m.tradition)).size === 1 ? 'tradition' : 'traditions'}.
          </p>
        )}

        <div>
          {found.map((p, i) => (
            <PassageCard key={p.id} passage={p} highlight={parsed.must} first={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterRow({ label, options, active, onChange }) {
  return (
    <div style={filterRow}>
      <span style={filterLabel}>{label}</span>
      {options.map((opt) => {
        const on = active === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange?.(opt.key)}
            title={opt.hint}
            style={{
              ...filterBtn,
              color: on ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
              borderBottomColor: on ? 'var(--bc-accent)' : 'transparent',
            }}
          >
            {opt.label}
          </button>
        );
      })}
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
};

const diacriticsRow = {
  display: 'flex',
  gap: 2,
  flexWrap: 'wrap',
  marginTop: 8,
  marginBottom: 18,
};

const diacriticBtn = {
  width: 30,
  height: 30,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: '1px solid transparent',
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 15,
  cursor: 'pointer',
  borderRadius: 4,
  transition: 'border-color 100ms ease, color 100ms ease',
};

const historyMenu = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  zIndex: 50,
  background: 'var(--bc-bg-elevated)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: 6,
  boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
  display: 'flex',
  flexDirection: 'column',
};

const historyLabel = {
  padding: '6px 10px 4px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const historyItem = {
  textAlign: 'left',
  padding: '8px 10px',
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-primary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 14,
  borderRadius: 4,
  cursor: 'pointer',
};

const filterStack = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginBottom: 18,
};

const filterRow = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
  alignItems: 'baseline',
};

const filterLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  marginRight: 12,
  flexShrink: 0,
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

const meta = {
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.6,
  margin: '0 0 8px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
};

const code = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  background: 'rgba(255,255,255,0.05)',
  padding: '1px 5px',
  borderRadius: 3,
  color: 'var(--bc-text-secondary)',
};
