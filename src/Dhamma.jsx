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

// Path-style hash routing. Keeps URLs short and human-readable.
//
// Shapes:
//   (empty)                          → Browse home
//   #/browse                         → Browse home
//   #/browse/sutta/dn                → Browse expanded to pli-sutta › pli-dn
//   #/read/dn1                       → Read passage dn1 (tree path derived)
//   #/read/cst-s0101a.att-dn1_1      → Read CST commentary passage
//   #/search/<term>                  → Search tab
//   #/dict/<term>                    → Dictionary tab
//   #/compare/<term>                 → Compare tab
//
// Work slugs drop the `pli-` prefix in URLs (subcommentary, an-tika, …)
// since every live work is Pali. Stripped back in on parse.
const WORK_PREFIX = 'pli-';

function shortSlug(slug) {
  return slug?.startsWith(WORK_PREFIX) ? slug.slice(WORK_PREFIX.length) : slug;
}
function longSlug(seg) {
  return seg?.startsWith(WORK_PREFIX) ? seg : WORK_PREFIX + seg;
}

function parseInitialHash() {
  if (typeof window === 'undefined') return {};
  const raw = window.location.hash.replace(/^#\/?/, '');
  const segs = raw.split('/').map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  }).filter(Boolean);
  const out = { tab: 'browse', query: 'sampajāna', searchMode: 'stem', path: [], leaf: null, pin: null };
  if (segs.length === 0) return out;
  const head = segs[0];
  const rest = segs.slice(1);
  if (head === 'browse') {
    out.path = rest.map(longSlug);
  } else if (head === 'read') {
    // /read/<passage-id>. Tree path is filled in by BrowseView once
    // the corpus tree loads (pathToLeaf walks ancestors).
    out.leaf = rest.join('/') || null;
  } else if (head === 'search') {
    out.tab = 'search';
    out.query = rest.join('/') || '';
  } else if (head === 'dict') {
    out.tab = 'dictionary';
    out.query = rest.join('/') || '';
  } else if (head === 'compare') {
    out.tab = 'compare';
    out.query = rest.join('/') || '';
  } else {
    // Unknown — fall back to Browse home.
  }
  return out;
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
    let hash = '';
    const enc = (s) => encodeURIComponent(s).replace(/%20/g, '+');
    if (tab === 'browse') {
      if (browseLeafId) {
        hash = `/read/${enc(browseLeafId)}`;
      } else if (browsePath.length > 0) {
        hash = `/browse/${browsePath.map(shortSlug).map(enc).join('/')}`;
      }
      // else: empty hash for Browse home
    } else if (tab === 'search') {
      hash = query ? `/search/${enc(query)}` : '/search';
    } else if (tab === 'dictionary') {
      hash = query ? `/dict/${enc(query)}` : '/dict';
    } else if (tab === 'compare') {
      hash = query ? `/compare/${enc(query)}` : '/compare';
    }
    const target = hash ? `#${hash}` : window.location.pathname;
    const next = hash ? `${window.location.pathname}#${hash}` : window.location.pathname;
    const current = `${window.location.pathname}${window.location.hash}`;
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
                onCompareTerm={(term) => { setQuery(term); setTab('compare'); }}
              />
            )}
            {tab === 'compare' && (
              <CompareView
                term={query}
                activeTraditions={activeTraditions}
                onSearchTerm={(term) => { setQuery(term); setTab('search'); }}
                onCompareTerm={(term) => setQuery(term)}
              />
            )}
            {tab === 'dictionary' && (
              <DictionaryView
                initialTerm={query}
                onSearchTerm={(term) => { setQuery(term); setTab('search'); }}
                onCompareTerm={(term) => { setQuery(term); setTab('compare'); }}
              />
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
