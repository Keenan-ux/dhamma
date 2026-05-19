import { useEffect, useState } from 'react';
import TopNav from './TopNav.jsx';
import TabBar from './TabBar.jsx';
import Sidebar from './Sidebar.jsx';
import SearchView from './SearchView.jsx';
import CompareView from './CompareView.jsx';
import BrowseView from './BrowseView.jsx';
import DictionaryView from './DictionaryView.jsx';
import useIsNarrow from './useIsNarrow.js';
import useCorpus from './useCorpus.js';

// Read tab + query + path + leaf + pin from the URL hash on first load
// so refresh and "open this URL" both put the user back where they were.
function parseInitialHash() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return {
    tab:        params.get('tab') || 'browse',
    query:      params.get('q') ?? 'sampajāna',
    searchMode: params.get('mode') || 'stem',
    path:       params.get('path')?.split(',').filter(Boolean) || [],
    leaf:       params.get('leaf') || null,
    pin:        params.get('pin') || null,
  };
}
const INITIAL = parseInitialHash();

export default function Dhamma() {
  const [tab, setTab] = useState(INITIAL.tab);
  const [query, setQuery] = useState(INITIAL.query);
  const [activeTraditions, setActiveTraditions] = useState(() => new Set());
  // Default to Stem mode. Exact-token FTS over Pali rarely matches
  // because the canonical inflections (sampajāno, sampajānakārī, …) are
  // distinct tokens from the dictionary form (sampajāna). Stem mode adds
  // cross-canon alias expansion that's almost always what scholars want.
  const [searchMode, setSearchMode] = useState(INITIAL.searchMode);
  const [browsePath, setBrowsePath] = useState(INITIAL.path);
  const [browseLeafId, setBrowseLeafId] = useState(INITIAL.leaf);
  const [pinnedLeafId, setPinnedLeafId] = useState(INITIAL.pin);
  const [readingMode, setReadingMode] = useState(false);
  const isNarrow = useIsNarrow();

  // Mirror enough state into the URL hash that refresh / shared link
  // restores the same view. replaceState rather than pushState so
  // typing in the search input doesn't fill the back-button history.
  useEffect(() => {
    const params = new URLSearchParams();
    if (tab !== 'browse') params.set('tab', tab);
    if (tab === 'browse') {
      if (browsePath.length) params.set('path', browsePath.join(','));
      if (browseLeafId) params.set('leaf', browseLeafId);
    } else if (tab === 'search') {
      if (query) params.set('q', query);
      if (searchMode && searchMode !== 'stem') params.set('mode', searchMode);
    } else if (tab === 'compare' || tab === 'dictionary') {
      if (query) params.set('q', query);
    }
    if (pinnedLeafId) params.set('pin', pinnedLeafId);

    const hashStr = params.toString();
    const target = hashStr ? `#${hashStr}` : window.location.pathname;
    const current = `${window.location.pathname}${window.location.hash}`;
    const next = hashStr ? `${window.location.pathname}#${hashStr}` : window.location.pathname;
    if (next !== current) {
      window.history.replaceState(null, '', target);
    }
  }, [tab, query, searchMode, browsePath, browseLeafId, pinnedLeafId]);

  const { shape, error: corpusError } = useCorpus();

  // Initialize activeTraditions once the corpus loads — start with all
  // selected. Subsequent toggles narrow the visible set.
  useEffect(() => {
    if (shape && activeTraditions.size === 0) {
      setActiveTraditions(new Set(shape.traditions));
    }
  }, [shape, activeTraditions.size]);

  function toggleTradition(t) {
    setActiveTraditions((cur) => {
      const next = new Set(cur);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  useEffect(() => {
    if (!readingMode) return;
    function onKey(e) { if (e.key === 'Escape') setReadingMode(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [readingMode]);

  useEffect(() => {
    if (readingMode && tab !== 'browse') setTab('browse');
  }, [readingMode, tab]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bc-bg-base)',
        color: 'var(--bc-text-primary)',
        fontFamily: 'Outfit, system-ui, sans-serif',
      }}
    >
      {!readingMode && <TopNav />}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {!readingMode && !isNarrow && (
          <Sidebar
            activeTraditions={activeTraditions}
            toggleTradition={toggleTradition}
            traditions={shape?.traditions || []}
            tab={tab}
            setTab={setTab}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          {/* Primary navigation lives in the sidebar on wide; TabBar is the
              narrow-viewport fallback when the sidebar collapses. */}
          {!readingMode && isNarrow && <TabBar active={tab} onChange={setTab} />}
          <main style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
            {corpusError && (
              <div style={errorBanner}>
                Couldn’t load the corpus index. Search and browse may be unavailable.
              </div>
            )}
            {tab === 'browse' && (
              <BrowseView
                path={browsePath}
                setPath={setBrowsePath}
                leafId={browseLeafId}
                setLeafId={setBrowseLeafId}
                pinnedLeafId={pinnedLeafId}
                setPinnedLeafId={setPinnedLeafId}
                readingMode={readingMode}
                setReadingMode={setReadingMode}
                onSearchTerm={(term) => { setQuery(term); setTab('search'); }}
                onCompareTerm={(term) => { setQuery(term); setTab('compare'); }}
              />
            )}
            {tab === 'search' && (
              <SearchView
                query={query}
                setQuery={setQuery}
                activeTraditions={activeTraditions}
                toggleTradition={toggleTradition}
                showInlineFilters={isNarrow}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
              />
            )}
            {tab === 'compare' && (
              <CompareView term={query} activeTraditions={activeTraditions} />
            )}
            {tab === 'dictionary' && (
              <DictionaryView initialTerm={query} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const errorBanner = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  padding: '8px 16px',
  fontSize: 12,
  background: 'rgba(255, 80, 80, 0.08)',
  color: 'var(--bc-text-secondary)',
  borderBottom: '1px solid rgba(255, 80, 80, 0.20)',
  zIndex: 10,
  textAlign: 'center',
  fontStyle: 'italic',
};
