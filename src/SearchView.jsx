import { useEffect, useMemo, useRef, useState } from 'react';
import { parseQuery } from './parseQuery.js';
import useSearchHistory from './searchHistory.js';
import useSearch from './useSearch.js';
import useCorpus from './useCorpus.js';
import PassageCard from './PassageCard.jsx';
import { SelectionActions } from './SelectionActions.jsx';

const DIACRITICS = ['ā', 'ī', 'ū', 'ē', 'ō', 'ṃ', 'ṅ', 'ñ', 'ṇ', 'ṭ', 'ḍ', 'ṛ', 'ḷ', 'ṣ', 'ś'];

const MODES = [
  { key: 'exact',   label: 'Exact',   hint: 'Postgres FTS, no alias expansion' },
  { key: 'stem',    label: 'Stem',    hint: 'FTS + cross-canon alias bridges (sati ↔ smṛti ↔ 念)' },
  { key: 'meaning', label: 'Meaning', hint: 'Vector ANN + FTS, reciprocal rank fused' },
];

const SCOPES = [
  { key: 'all',         label: 'All' },
  { key: 'original',    label: 'Original' },
  { key: 'translation', label: 'Translation' },
  { key: 'citation',    label: 'Citation' },
];

export default function SearchView({
  query, setQuery,
  activeTraditions, toggleTradition,
  showInlineFilters,
  searchMode, setSearchMode,
  onCompareTerm,
}) {
  const q = query ?? '';
  const setQ = setQuery ?? (() => {});
  const mode = searchMode || 'exact';

  const [scope, setScope] = useState('all');
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const resultsRef = useRef(null);

  const { shape } = useCorpus();
  const { history, push } = useSearchHistory();

  const parsed = useMemo(() => parseQuery(q.trim()), [q]);
  const { data: result, loading, error } = useSearch({
    q: q.trim(), mode, field: scope, limit: 50,
  });

  // Visible-tradition filter is a display concern only — the server returns
  // the cross-corpus result, and we hide rows whose tradition the user has
  // toggled off in the sidebar.
  const visibleResults = useMemo(() => {
    if (!result?.results) return [];
    return result.results.map((r) => ({
      ...r,
      tradition: shape?.workBySlug.get(r.work_slug)?.tradition || null,
      work: shape?.workBySlug.get(r.work_slug)?.name || null,
    })).filter((r) => {
      if (!r.tradition) return true; // unknown tradition → show
      return activeTraditions.has(r.tradition);
    });
  }, [result, shape, activeTraditions]);

  // Highlight terms = user's positive query terms PLUS any aliases the
  // server expanded the query into. Lets the visual highlight catch the
  // cross-canon variants (sampajāna → sampajañña, samprajāna, 正知, etc.)
  // that actually drove the FTS match.
  const highlightTerms = useMemo(() => {
    const set = new Set(parsed.must);
    for (const e of result?.expanded || []) {
      for (const a of e.aliases || []) set.add(a);
    }
    return Array.from(set);
  }, [parsed.must, result]);

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

  const traditions = shape?.traditions || [];

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

        {showInlineFilters && traditions.length > 0 && (
          <div style={filterRow}>
            <span style={filterLabel}>Traditions</span>
            {traditions.map((t) => {
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

        {parsed.raw && loading && (
          <p style={meta}>Searching…</p>
        )}

        {parsed.raw && error && (
          <p style={errMeta}>Search failed: {error.message}</p>
        )}

        {parsed.raw && !loading && result?.warning && (
          <p style={warnMeta}>Embedding service unavailable; results from FTS only.</p>
        )}

        {parsed.raw && !loading && result && !error && mode === 'exact' && visibleResults.length === 0 && (
          <p style={meta}>
            No exact-token match for <strong style={{ color: 'var(--bc-accent)' }}>{parsed.raw}</strong>.
            Pali inflections (e.g. <em>sampajāno</em>, <em>sampajānakārī</em>) are
            distinct FTS tokens from their dictionary form — try{' '}
            <button
              onClick={() => setSearchMode('stem')}
              style={inlineLink}
            >Stem</button>{' '}or{' '}
            <button
              onClick={() => setSearchMode('meaning')}
              style={inlineLink}
            >Meaning</button>{' '}mode.
          </p>
        )}

        {parsed.raw && !loading && result && !error && !(mode === 'exact' && visibleResults.length === 0) && (
          <p style={meta}>
            <strong style={{ color: 'var(--bc-text-secondary)' }}>{visibleResults.length}</strong>{' '}
            {visibleResults.length === 1 ? 'passage' : 'passages'} {modeVerb(mode)}{' '}
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
            {result.results.length > visibleResults.length && (
              <em style={{ color: 'var(--bc-text-tertiary)' }}>
                {' '}— {result.results.length - visibleResults.length} hidden by tradition filter
              </em>
            )}
            .
            {result.expanded?.length > 0 && (
              <span style={{ display: 'block', marginTop: 4, fontStyle: 'italic', color: 'var(--bc-text-tertiary)' }}>
                Also matched via{' '}
                {result.expanded.map((e, i) => (
                  <span key={e.term}>
                    {e.aliases.map((a, j) => (
                      <span key={a}>
                        <strong style={{ color: 'var(--bc-accent)' }}>{a}</strong>
                        {j < e.aliases.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    {i < result.expanded.length - 1 ? '; ' : ''}
                  </span>
                ))}
                .
              </span>
            )}
          </p>
        )}

        {/* Hide stale results during a new search to avoid showing previous-
            mode results while the new fetch is in flight. */}
        <div ref={resultsRef}>
          {!loading && visibleResults.map((p, i) => (
            <PassageCard key={p.id} passage={p} highlight={highlightTerms} first={i === 0} />
          ))}
        </div>
        <SelectionActions
          containerRef={resultsRef}
          onSearch={setQ}
          onCompare={onCompareTerm}
        />
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
  if (mode === 'stem') return 'matching';
  if (mode === 'meaning') return 'near the meaning of';
  return 'containing';
}

const wrap = { maxWidth: 820, margin: 0, padding: '28px 28px 48px' };

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

const meta = {
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.6,
  margin: '0 0 8px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
};

const errMeta = { ...meta, color: 'var(--bc-loss-text)' };
const warnMeta = { ...meta, color: 'var(--bc-accent)' };

const inlineLink = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  color: 'var(--bc-accent)',
  fontFamily: 'inherit',
  fontStyle: 'inherit',
  fontSize: 'inherit',
  cursor: 'pointer',
  textDecoration: 'underline',
};

const code = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  background: 'rgba(255,255,255,0.05)',
  padding: '1px 5px',
  borderRadius: 3,
  color: 'var(--bc-text-secondary)',
};
