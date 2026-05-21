import { useEffect, useMemo, useRef, useState } from 'react';
import { parseQuery } from './parseQuery.js';
import useSearchHistory from './searchHistory.js';
import useSearch from './useSearch.js';
import useCorpus from './useCorpus.js';
import PassageCard from './PassageCard.jsx';
import { SelectionActions } from './SelectionActions.jsx';

const DIACRITICS = ['ā', 'ī', 'ū', 'ē', 'ō', 'ṃ', 'ṅ', 'ñ', 'ṇ', 'ṭ', 'ḍ', 'ṛ', 'ḷ', 'ṣ', 'ś'];

const MODES = [
  { key: 'exact',   label: 'Exact',   hint: 'Postgres FTS, literal tokens only — sampajāna does not catch sampajāno' },
  { key: 'stem',    label: 'Stem',    hint: 'FTS with Pali inflection bridging — sampajāno, sampajānakārī, sampajānassa all resolve to sampajāna' },
  { key: 'meaning', label: 'Meaning', hint: 'BGE-M3 vector semantic search blended with FTS — finds passages near in meaning, not just by token' },
];

const SCOPES = [
  { key: 'all',         label: 'All' },
  { key: 'title',       label: 'Title' },
  { key: 'original',    label: 'Original' },
  { key: 'translation', label: 'Translation' },
  { key: 'citation',    label: 'Citation' },
  { key: 'library',     label: 'Library' },
];

// Title-only scope doesn't compose with Meaning mode — vectors are on
// the full passage, so semantic similarity doesn't restrict to titles.
// Hide the Title chip when Meaning is active so users can't pick a
// muddled combination.
function scopesFor(mode) {
  if (mode === 'meaning') return SCOPES.filter((s) => s.key !== 'title');
  return SCOPES;
}

export default function SearchView({
  query, setQuery,
  activeTraditions, toggleTradition,
  showInlineFilters,
  searchMode, setSearchMode,
  onCompareTerm,
  onOpenPassage,
}) {
  const q = query ?? '';
  const setQ = setQuery ?? (() => {});
  const mode = searchMode || 'exact';

  const [scope, setScope] = useState('all');
  // If the user picked Title under another mode then switched to
  // Meaning, snap the scope back to All — Title is hidden under Meaning.
  useEffect(() => {
    if (mode === 'meaning' && scope === 'title') setScope('all');
  }, [mode, scope]);

  // The diacritics row only matters when the user is typing. Reveal on
  // focus, hide on blur — except: clicking a diacritic button briefly
  // blurs the input, so we delay the hide and the diacritic onMouseDown
  // re-focuses before our setTimeout fires. Net effect: row stays
  // visible while the user is composing, vanishes the moment they
  // tab away.
  const [inputFocused, setInputFocused] = useState(false);
  const blurTimerRef = useRef(null);
  function handleInputFocus() {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setInputFocused(true);
    // Deliberately do NOT open the recent-search dropdown on focus —
    // autoFocus fires on mount and the dropdown popping up there is
    // the auto-load behavior we fixed earlier. History opens only on
    // explicit onClick (below).
  }
  function handleInputBlur() {
    blurTimerRef.current = setTimeout(() => setInputFocused(false), 120);
  }
  function preserveFocus() {
    // Mouse-down on a diacritic button: prevent the default focus loss
    // so the input keeps focus and our row stays visible.
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
  }
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

  // No need for a document-level mousedown listener anymore — the
  // backdrop overlay (rendered below) catches off-clicks and dismisses
  // the dropdown without letting the click fall through to the
  // underlying diacritic / filter row. Esc still closes via keyboard.
  useEffect(() => {
    if (!historyOpen) return;
    function onKey(e) { if (e.key === 'Escape') setHistoryOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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
    <div data-scroll-root="" style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 }}>
      <div style={wrap}>
        <div style={{ position: 'relative' }} ref={wrapRef}>
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              // Typing is a "I want to search" signal; the recent
              // dropdown is for "I want to recall an earlier query" —
              // close it as soon as the user starts a new one.
              if (historyOpen) setHistoryOpen(false);
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onClick={() => history.length && setHistoryOpen(true)}
            placeholder='Search — e.g. sampajāna, -bhikkhu, "clear comprehension"'
            style={input}
            spellCheck={false}
            autoFocus
          />
          {/* Auto-focus alone shouldn't pop the dropdown — only an
              explicit input click does. autoFocus exists so the user can
              type immediately, not to surface history they didn't ask for. */}
          {historyOpen && history.length > 0 && (
            <>
              {/* Backdrop catches off-clicks. The dropdown closes
                  without firing whatever button the user might have
                  been aiming at (diacritic, filter, etc.) — they get
                  one click to dismiss, one to interact. */}
              <div
                style={historyBackdrop}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setHistoryOpen(false);
                }}
              />
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
            </>
          )}
        </div>

        {/* Diacritics row reveals only while the input has focus.
            onMouseDown on the buttons preventDefault so the focus
            doesn't bounce to the button (which would hide the row). */}
        {inputFocused && (
          <div style={diacriticsRow} aria-label="Insert Pali diacritic">
            {DIACRITICS.map((ch) => (
              <button
                key={ch}
                onMouseDown={(e) => { e.preventDefault(); preserveFocus(); }}
                onClick={() => insertChar(ch)}
                style={diacriticBtn}
                title={`Insert ${ch}`}
              >
                {ch}
              </button>
            ))}
          </div>
        )}

        <div style={filterStack}>
          <FilterRow label="Match"     options={MODES}  active={mode}  onChange={setSearchMode} />
          {/* Surface the active mode's behavior so the choice isn't a
              cryptic 3-button toggle. Most queries land on Stem; users
              should know what that means without hovering. */}
          <p style={modeHint}>
            {MODES.find((m) => m.key === mode)?.hint}
          </p>
          <FilterRow label="Search in" options={scopesFor(mode)} active={scope} onChange={setScope} />
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
            {(() => {
              // Only show aliases that actually appear in at least one
              // returned result. Hides cross-canon equivalents (Sanskrit
              // samprajāna, Chinese 正知 etc.) that the query expanded
              // into but produced no hits because those traditions
              // aren't ingested. When Mahāyāna/Zen land, the same
              // aliases will start showing up naturally.
              const haystack = (result.results || []).map((r) =>
                [r.original, r.translation, r.snippet, r.citation, r.title].filter(Boolean).join(' ')
              ).join(' ').toLowerCase();
              const filtered = (result.expanded || [])
                .map((e) => ({ ...e, aliases: e.aliases.filter((a) => haystack.includes(a.toLowerCase())) }))
                .filter((e) => e.aliases.length > 0);
              if (filtered.length === 0) return null;
              return (
                <span style={{ display: 'block', marginTop: 4, fontStyle: 'italic', color: 'var(--bc-text-tertiary)' }}>
                  Also matched via{' '}
                  {filtered.map((e, i) => (
                    <span key={e.term}>
                      {e.aliases.map((a, j) => (
                        <span key={a}>
                          <strong style={{ color: 'var(--bc-accent)' }}>{a}</strong>
                          {j < e.aliases.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      {i < filtered.length - 1 ? '; ' : ''}
                    </span>
                  ))}
                  .
                </span>
              );
            })()}
          </p>
        )}

        {/* Hide stale results during a new search to avoid showing previous-
            mode results while the new fetch is in flight. */}
        <div ref={resultsRef}>
          {!loading && visibleResults.map((p, i) => (
            <PassageCard
              key={p.id}
              passage={p}
              highlight={highlightTerms}
              first={i === 0}
              onOpen={onOpenPassage}
            />
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

// Fullscreen click-catch that sits behind the menu but above page
// content. Lets the user dismiss the menu by clicking anywhere outside
// it; preventDefault on mousedown stops the click from also firing on
// whatever button (diacritic / filter) lives underneath.
const historyBackdrop = {
  position: 'fixed',
  inset: 0,
  zIndex: 49,
  background: 'transparent',
  cursor: 'default',
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

const modeHint = {
  margin: '2px 0 4px 64px',
  fontSize: 11,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  lineHeight: 1.4,
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
