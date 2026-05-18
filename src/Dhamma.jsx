import { useState } from 'react';
import TopNav from './TopNav.jsx';
import TabBar from './TabBar.jsx';
import Sidebar from './Sidebar.jsx';
import SearchView from './SearchView.jsx';
import CompareView from './CompareView.jsx';
import BrowseView from './BrowseView.jsx';
import useIsNarrow from './useIsNarrow.js';
import { SAMPLE_PASSAGES } from './data/samplePassages.js';

const ALL_TRADITIONS = new Set(SAMPLE_PASSAGES.map((p) => p.tradition));

export default function Dhamma() {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('sampajāna');
  const [activeTraditions, setActiveTraditions] = useState(() => new Set(ALL_TRADITIONS));
  const [searchMode, setSearchMode] = useState('exact'); // 'exact' | 'stem' | 'meaning'
  const [browsePath, setBrowsePath] = useState([]);
  const [browseLeafId, setBrowseLeafId] = useState(null);
  const isNarrow = useIsNarrow();

  function toggleTradition(t) {
    setActiveTraditions((cur) => {
      const next = new Set(cur);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

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
      <TopNav />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {!isNarrow && (
          <Sidebar activeTraditions={activeTraditions} toggleTradition={toggleTradition} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <TabBar active={tab} onChange={setTab} />
          <main
            style={{
              flex: 1,
              minHeight: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {tab === 'browse' && (
              <BrowseView
                path={browsePath}
                setPath={setBrowsePath}
                leafId={browseLeafId}
                setLeafId={setBrowseLeafId}
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
          </main>
        </div>
      </div>
    </div>
  );
}
