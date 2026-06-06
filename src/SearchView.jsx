import { useEffect, useMemo, useRef, useState } from 'react';
import { parseQuery } from './parseQuery.js';
import useSearchHistory from './searchHistory.js';
import useSearch from './useSearch.js';
import useCorpus from './useCorpus.js';
import useIsNarrow from './useIsNarrow.js';
import PassageCard from './PassageCard.jsx';
import { SelectionActions } from './SelectionActions.jsx';
import { warmApi } from './api.js';

const DIACRITICS = ['ā', 'ī', 'ū', 'ē', 'ō', 'ṃ', 'ṅ', 'ñ', 'ṇ', 'ṭ', 'ḍ', 'ṛ', 'ḷ', 'ṣ', 'ś'];

const MODES = [
  { key: 'exact',   label: 'Exact',   hint: 'Postgres FTS, literal tokens only — sampajāna does not catch sampajāno' },
  { key: 'stem',    label: 'Stem',    hint: 'FTS with Pali inflection bridging — sampajāno, sampajānakārī, sampajānassa all resolve to sampajāna' },
  { key: 'meaning', label: 'Meaning', hint: 'BGE-M3 vector semantic search blended with FTS — finds passages near in meaning, not just by token' },
];

// "Search in" is now strictly the text-field selection. The corpus
// LAYER (canonical vs commentary vs Library) lives in its own chip row
// below, so the two axes — what TEXT to match and which CORPUS LAYER
// to search — can compose freely. (Old build folded Library into this
// row; that mixed two orthogonal concepts.)
const SCOPES = [
  { key: 'all',         label: 'All' },
  { key: 'title',       label: 'Title' },
  { key: 'original',    label: 'Original' },
  { key: 'translation', label: 'Translation' },
  { key: 'citation',    label: 'Citation' },
];

// Corpus layer — passages.work_role for the four canonical/commentarial
// tiers, plus Library for the ATI articles table. 'all' = no constraint
// (everything except Library — i.e. all passage layers). Server-side
// the 'library' value routes into the articles branch and ignores the
// scope/field; the other values add a `work_role = X` predicate.
const LAYERS = [
  { key: 'all',     label: 'All' },
  { key: 'mula',    label: 'Tipiṭaka' },
  { key: 'attha',   label: 'Aṭṭhakathā' },
  { key: 'tika',    label: 'Ṭīkā' },
  { key: 'anya',    label: 'Extra-canonical' },
  { key: 'library', label: 'Library' },
];

// Piṭaka filter — only meaningful when searching the Tipiṭaka (mula).
// 'all' means no filter; the others constrain work_slug to descendants
// of pli-sutta / pli-vinaya / pli-abhidhamma respectively. Server
// already supports this via the ?pitaka= param.
const PITAKAS = [
  { key: 'all',        label: 'All' },
  { key: 'sutta',      label: 'Sutta' },
  { key: 'vinaya',     label: 'Vinaya' },
  { key: 'abhidhamma', label: 'Abhidhamma' },
];

// Title-only scope doesn't compose with Meaning mode — vectors are on
// the full passage, so semantic similarity doesn't restrict to titles.
// Hide the Title chip when Meaning is active so users can't pick a
// muddled combination.
function scopesFor(mode) {
  if (mode === 'meaning') return SCOPES.filter((s) => s.key !== 'title');
  return SCOPES;
}

// Library is a separate corpus (ATI articles, not passages), so when
// the user picks Library the field/piṭaka chips don't apply. Hide the
// Citation field option in Library — articles don't have a citation
// field. Original/Translation/Title also don't map cleanly; for now we
// surface only "All" + "Title" (matches the article's body or title).
function scopesForLayer(mode, layer) {
  const base = scopesFor(mode);
  if (layer === 'library') {
    return base.filter((s) => s.key === 'all' || s.key === 'title');
  }
  return base;
}

export default function SearchView({
  query, setQuery,
  searchMode, setSearchMode,
  onCompareTerm,
  onOpenPassage,
  // Pre-set translator filter passed in when the user navigates here
  // from the Library "Translator coverage" index. Consumed on mount;
  // user can clear via the chip indicator below the search input.
  initialTranslator,
  onClearTranslator,
  // Pre-set tag filter passed in when the user clicks a tag chip in
  // TagsView or on a passage card. Format is `type:value` (e.g.
  // `simile:Burning house`). Same consume-once-on-mount lifecycle as
  // initialTranslator.
  initialTag,
  onClearTag,
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

  // "Show all" toggle drops the per-row snippet (skips ts_headline server-
  // side) and switches to a flat citation-only list. Per-page jumps from
  // 50 to 500 so the long tail loads in a couple of round-trips. Useful
  // for terms with thousands of hits — "every passage containing sati"
  // as one scrollable column, not paginated through with snippets.
  const [nosnippet, setNosnippet] = useState(false);
  const perPage = nosnippet ? 500 : 50;

  // Corpus layer. 'all' = no constraint (all passage layers); 'library'
  // routes to the articles table. Mula/attha/tika/anya constrain
  // passages.work_role. The piṭaka chip below only makes sense for
  // Tipiṭaka (mula); other layers ignore it.
  const [layer, setLayer] = useState('all');
  const layerParam = layer !== 'all' ? layer : undefined;
  // Translator filter. Pre-populated from initialTranslator on first
  // mount when arriving from the Library "Translator coverage" index.
  // Only applies to translation-scope queries; if the user switches
  // away from that scope the filter still sits in state but is a no-op
  // server-side. Snap scope to 'translation' when a translator is set.
  const [translator, setTranslator] = useState(initialTranslator || null);
  useEffect(() => {
    if (initialTranslator) {
      setTranslator(initialTranslator);
      setScope('translation');
      // Consume the prop once so a subsequent visit to Search doesn't
      // re-apply the same filter unexpectedly. The parent clears its
      // own state via the callback.
      onClearTranslator?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTranslator]);
  const translatorParam = translator || undefined;
  // Tag filter. Pre-populated from initialTag on first mount when
  // arriving from TagsView or a passage tag chip. Tag is a single
  // string of the form `type:value` so the param flow stays uniform
  // with the URL hash format.
  const [tag, setTag] = useState(initialTag || null);
  useEffect(() => {
    if (initialTag) {
      setTag(initialTag);
      onClearTag?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTag]);
  const tagParam = tag || undefined;
  // Display helpers for the tag chip: split the colon-format into
  // human-readable parts. ("simile:Burning house" → type=simile,
  // value=Burning house)
  const tagDisplay = tag && tag.includes(':')
    ? { type: tag.slice(0, tag.indexOf(':')), value: tag.slice(tag.indexOf(':') + 1) }
    : null;
  // Piṭaka filter. 'all' = no filter. Only relevant when layer is the
  // Tipiṭaka (mula) — snap back to 'all' for other layers so the chip
  // state matches the visible row.
  const [pitaka, setPitaka] = useState('all');
  useEffect(() => {
    if (layer !== 'mula' && pitaka !== 'all') setPitaka('all');
  }, [layer, pitaka]);
  const pitakaParam = pitaka !== 'all' ? pitaka : undefined;
  // When the user picks Library, narrow the field/scope options.
  // If their previous field choice no longer applies, snap to 'all'.
  useEffect(() => {
    if (layer === 'library' && scope !== 'all' && scope !== 'title') {
      setScope('all');
    }
  }, [layer, scope]);

  // Filter disclosure — Where / Piṭaka / Search-in / Traditions go behind
  // a "Filters" toggle so the search header doesn't take half the screen
  // on mobile. Match stays visible because it's the most fundamental
  // choice. Default: collapsed on narrow viewports, expanded on wide.
  const isNarrowSV = useIsNarrow();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const showFilters = filtersOpen || !isNarrowSV;

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
  const sentinelRef = useRef(null);

  const { shape } = useCorpus();
  const { history, push } = useSearchHistory();

  const parsed = useMemo(() => parseQuery(q.trim()), [q]);
  // When the user picks Layer=Library, the server reroutes to the articles
  // table regardless of field. Send field='library' to keep the back-compat
  // path working alongside the new layer param.
  const effectiveField = layer === 'library' ? 'library' : scope;
  const { data: result, loading, loadingMore, hasMore, error, loadMore } = useSearch({
    q: q.trim(), mode, field: effectiveField, limit: perPage, nosnippet,
    pitaka: pitakaParam, layer: layerParam, translator: translatorParam, tag: tagParam,
  });

  // Cold-start warm-up. The first Meaning query after a machine wake loads
  // the BGE-M3 ONNX model (tens of seconds to ~100s on shared CPU). Ping
  // /api/warm when the Search view mounts so that load overlaps the user's
  // typing; poll until warm so the "warming" note can clear. One-shot
  // sequence (no steady interval) so we don't fight the machine's auto-stop.
  // embedWarm: null = unknown, false = cold, true = ready.
  const [embedWarm, setEmbedWarm] = useState(null);
  useEffect(() => {
    let alive = true, timer = null, tries = 0;
    const ping = () => {
      warmApi()
        .then((s) => {
          if (!alive) return;
          setEmbedWarm(!!s.warm);
          if (!s.warm && tries++ < 45) timer = setTimeout(ping, 4000);
        })
        .catch(() => { if (alive && tries++ < 8) timer = setTimeout(ping, 4000); });
    };
    ping();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, []);

  // Visible-tradition filter is a display concern only — the server returns
  // the cross-corpus result, and we hide rows whose tradition the user has
  // toggled off in the sidebar.
  const visibleResults = useMemo(() => {
    if (!result?.results) return [];
    // Only Theravāda is ingested, so the per-result tradition filter that
    // lived here is now a no-op. Strip it; result.results is what we show.
    // (When other traditions land, restore a filter step + Traditions chip
    // row — both were committed up to but reverted in this branch.)
    return result.results.map((r) => ({
      ...r,
      work: shape?.workBySlug.get(r.work_slug)?.name || null,
    }));
  }, [result, shape]);

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

  // Infinite-scroll sentinel — IntersectionObserver fires loadMore the
  // moment the bottom-of-results marker enters the viewport. The sentinel
  // only renders while hasMore is true (see JSX below), so the observer
  // reattaches itself across page boundaries.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!hasMore) return;
    if (loadingMore || loading) return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          loadMore();
          break;
        }
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore, loading, loadMore, result?.results.length]);

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
            aria-label="Search the corpus"
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
          {/* Filters disclosure — on narrow viewports the chip rows
              collapse behind a toggle to recover vertical space. On
              wide viewports the rows show inline; the toggle still
              works for users who prefer the minimal layout. The
              summary chip beside the toggle lists non-default active
              filters so the user can see what's narrowing the query
              without expanding. */}
          <div style={filterToggleRow}>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              style={{
                ...filterLabel,
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: showFilters ? 'var(--bc-text-secondary)' : 'var(--bc-text-tertiary)',
              }}
              aria-expanded={showFilters}
              aria-controls="search-filter-rows"
            >
              {showFilters ? 'Filters −' : 'Filters +'}
            </button>
            {!showFilters && (() => {
              // Active-filter summary when collapsed. Only show values
              // that differ from the defaults so the line stays quiet
              // for the common case (no filtering).
              const parts = [];
              if (layer !== 'all') parts.push(LAYERS.find((l) => l.key === layer)?.label);
              if (layer === 'mula' && pitaka !== 'all') parts.push(PITAKAS.find((p) => p.key === pitaka)?.label);
              if (scope !== 'all') parts.push(SCOPES.find((s) => s.key === scope)?.label);
              if (parts.length === 0) return null;
              return <span style={filterSummary}>{parts.filter(Boolean).join(' · ')}</span>;
            })()}
          </div>
          {showFilters && (
            <div id="search-filter-rows">
              {/* Where to search (corpus layer). The Library row sits here
                  instead of in "Search in" so the two axes are visibly
                  separate — corpus layer above, text-field within it below.
                  Piṭaka sub-row only shows when the user is searching the
                  Tipiṭaka (mula). */}
              <FilterRow label="Where" options={LAYERS} active={layer} onChange={setLayer} />
              {layer === 'mula' && (
                <FilterRow label="Piṭaka" options={PITAKAS} active={pitaka} onChange={setPitaka} />
              )}
              <FilterRow label="Search in" options={scopesForLayer(mode, layer)} active={scope} onChange={setScope} />
            </div>
          )}
        </div>

        {!parsed.raw && (
          <p style={meta}>
            Search across the canon. Prefix a term with <code style={code}>-</code> to exclude
            (e.g. <code style={code}>sampajāna -bhikkhu</code>). Wrap a phrase in quotes
            for an exact phrase. Combine with <code style={code}>OR</code> and parentheses
            for boolean queries, e.g. <code style={code}>(sati OR smṛti) -kāya</code>. Use
            {' '}<code style={code}>NEAR/N</code> to require two terms within N words
            (e.g. <code style={code}>sati NEAR/3 sampajāno</code>).
          </p>
        )}

        {parsed.raw && loading && (
          <p style={meta}>
            {mode === 'meaning' && embedWarm === false
              ? 'Warming the semantic index. The first meaning search after an idle period can take up to a minute while the model loads.'
              : 'Searching…'}
          </p>
        )}

        {parsed.raw && error && (
          <p style={errMeta}>Search failed: {error.message}</p>
        )}

        {parsed.raw && !loading && result?.warning && (
          <p style={warnMeta}>Embedding service unavailable; results from FTS only.</p>
        )}

        {/* Active translator-filter chip. Shows the slug being filtered
            with a clear button. Surfaces what's narrowing the query when
            the user arrives from the Library "Translator coverage" view
            or sets the filter manually. Hidden when no translator is
            active. */}
        {translator && (
          <p style={translatorChipRow}>
            <span style={translatorChipLabel}>Filter:</span>
            <span style={translatorChipValue}>tr. {translator}</span>
            <button
              type="button"
              onClick={() => setTranslator(null)}
              style={inlineLink}
              title="Clear the translator filter"
            >
              clear
            </button>
            {!parsed.raw && (
              <span style={translatorChipHint}>
                Type a query to search within their work.
              </span>
            )}
          </p>
        )}

        {/* Active tag-filter chip. Set when the user arrives from
            TagsView or clicks a tag chip on a passage card. */}
        {tagDisplay && (
          <p style={translatorChipRow}>
            <span style={translatorChipLabel}>Filter:</span>
            <span style={translatorChipValue}>{tagDisplay.type}: {tagDisplay.value}</span>
            <button
              type="button"
              onClick={() => setTag(null)}
              style={inlineLink}
              title="Clear the tag filter"
            >
              clear
            </button>
            {!parsed.raw && (
              <span style={translatorChipHint}>
                Type a query to narrow within this tag.
              </span>
            )}
          </p>
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
            {/* Total semantics:
                - exact/stem: server-counted FTS matches = exact total.
                - meaning + FTS > 0: the FTS count is a lower bound on
                  what Meaning surfaces (vector hits add to it). Prefix
                  `≥` so the number reads as the floor.
                - meaning + FTS = 0 (only vector hits): showing "≥ 0"
                  while results sit below it read as broken. Use the
                  loaded count without prefix.
                - meaning vector-only (server returns total=null): fall
                  back to loaded count. */}
            {(() => {
              const fts = typeof result.total === 'number' ? result.total : null;
              const loaded = visibleResults.length;
              let n;
              let prefix = '';
              if (mode === 'meaning') {
                if (fts !== null && fts > 0) { n = fts; prefix = '≥ '; }
                else                          { n = loaded; }
              } else {
                n = fts ?? loaded;
              }
              return (
                <>
                  <strong style={{ color: 'var(--bc-text-secondary)' }}>
                    {prefix}{n.toLocaleString()}
                  </strong>{' '}
                  {n === 1 ? 'passage' : 'passages'}{' '}
                </>
              );
            })()}{modeVerb(mode)}{' '}
            {/* Comma-separated rather than ' + '-joined — the new boolean
                grammar lets `must` contain terms that combined with OR
                instead of AND, and " + " misleadingly implied "all of". */}
            {parsed.must.map((t, i) => (
              <span key={t}>
                <strong style={{ color: 'var(--bc-accent)' }}>{t}</strong>
                {i < parsed.must.length - 1 ? ', ' : ''}
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

        {/* "Show all" toggle moved up here so it stays in reach as infinite
            scroll loads more — the previous bottom-of-list placement kept
            scrolling out of view. Only render when results exist; toggling
            re-fetches at limit=500 with nosnippet=true (flat citation
            list, no per-row ts_headline cost). */}
        {parsed.raw && !loading && !error && visibleResults.length > 0 && (
          <p style={showAllInline}>
            <button
              type="button"
              onClick={() => setNosnippet((v) => !v)}
              style={inlineLink}
              title={nosnippet
                ? 'Restore snippet windows around each match'
                : 'Drop snippets and load all matches as a flat list'}
            >
              {nosnippet ? 'Show snippets' : 'Show all without snippets'}
            </button>
          </p>
        )}

        {/* Hide stale results during a new search to avoid showing previous-
            mode results while the new fetch is in flight. */}
        <div ref={resultsRef}>
          {!loading && visibleResults.map((p, i) => (
            <PassageCard
              key={`${p.id}-${i}`}
              passage={p}
              highlight={highlightTerms}
              first={i === 0}
              // In "Show all without snippets" mode, render the card as a
              // flat citation row (no body block) — turns the page into
              // a scholarly index of every hit.
              compact={nosnippet}
              // Forward the matched-term array so the reader can highlight
              // every occurrence of the search terms (alias-expanded), not
              // just the snippet window that ts_headline returned.
              onOpen={(passage) => onOpenPassage?.(passage, highlightTerms)}
            />
          ))}
        </div>
        {/* Sentinel for infinite-scroll. Renders only while hasMore is true;
            an IntersectionObserver attached in useEffect fires loadMore when
            it scrolls into view (with a 200px rootMargin, so the next page
            starts loading before the user hits the bottom). */}
        {hasMore && !loading && (
          <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
        )}
        {loadingMore && (
          <p style={meta}>Loading more…</p>
        )}
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
  border: '1px solid rgba(var(--bc-border-rgb),0.08)',
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
  background: 'rgba(var(--bc-border-rgb),0.05)',
  padding: '1px 5px',
  borderRadius: 3,
  color: 'var(--bc-text-secondary)',
};

// Inline "Show all without snippets" — sits directly under the result-
// count so it stays in reach even as infinite scroll loads more. The
// older bottom-of-list placement scrolled out of view, forcing users to
// chase it down.
const showAllInline = {
  margin: '4px 0 16px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
};

// Filter disclosure header — "Filters +" toggle on the left with a
// summary of non-default active values trailing on the right.
const filterToggleRow = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  flexWrap: 'wrap',
  margin: '4px 0 6px',
};

const filterSummary = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 12,
  color: 'var(--bc-text-tertiary)',
};

// Active-translator-filter chip row — shows below the diacritics row
// when the user is searching scoped to one translator's work.
const translatorChipRow = {
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: 10,
  margin: '0 0 16px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  color: 'var(--bc-text-secondary)',
};

const translatorChipLabel = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  fontFamily: 'Outfit, system-ui, sans-serif',
};

const translatorChipValue = {
  fontStyle: 'italic',
  color: 'var(--bc-accent)',
};

const translatorChipHint = {
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
};
