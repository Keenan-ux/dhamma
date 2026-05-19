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

export default function Dhamma() {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('sampajāna');
  const [activeTraditions, setActiveTraditions] = useState(() => new Set());
  // Default to Stem mode. Exact-token FTS over Pali rarely matches
  // because the canonical inflections (sampajāno, sampajānakārī, …) are
  // distinct tokens from the dictionary form (sampajāna). Stem mode adds
  // cross-canon alias expansion that's almost always what scholars want.
  const [searchMode, setSearchMode] = useState('stem');
  const [browsePath, setBrowsePath] = useState([]);
  const [browseLeafId, setBrowseLeafId] = useState(null);
  const [pinnedLeafId, setPinnedLeafId] = useState(null);
  const [readingMode, setReadingMode] = useState(false);
  const isNarrow = useIsNarrow();

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
