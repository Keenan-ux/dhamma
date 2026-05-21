import { useEffect, useState } from 'react';
import TopNav from './TopNav.jsx';
import Sidebar from './Sidebar.jsx';
import SearchView from './SearchView.jsx';
import CompareView from './CompareView.jsx';
import BrowseView from './BrowseView.jsx';
import CanonMapView from './CanonMapView.jsx';
import CommentaryView from './CommentaryView.jsx';
import ExtraCanonicalView from './ExtraCanonicalView.jsx';
import LibraryView from './LibraryView.jsx';
import BookmarksView from './BookmarksView.jsx';
import TagsView from './TagsView.jsx';
import DictionaryView from './DictionaryView.jsx';
import useIsNarrow from './useIsNarrow.js';
import useCorpus from './useCorpus.js';
import { randomPassageApi } from './api.js';

// Path-style hash routing. Keeps URLs short and human-readable.
//
// Shapes:
//   (empty)                          → Tipiṭaka frontmatter (default)
//   #/tipitaka                       → Tipiṭaka frontmatter
//   #/commentary                     → Commentary frontmatter
//   #/anya                           → Extra-canonical frontmatter
//   #/browse/sutta/dn                → Browse expanded to pli-sutta › pli-dn
//                                      (kept as the under-the-hood leaf
//                                       drill target until slice 2 lands
//                                       cascading typeset pages)
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
  const out = { tab: 'tipitaka', query: 'sampajāna', searchMode: 'stem', path: [], leaf: null, pin: null };
  if (segs.length === 0) return out;
  const head = segs[0];
  const rest = segs.slice(1);
  if (head === 'tipitaka') {
    out.tab = 'tipitaka';
  } else if (head === 'commentary') {
    out.tab = 'commentary';
  } else if (head === 'anya') {
    out.tab = 'anya';
  } else if (head === 'library') {
    out.tab = 'library';
  } else if (head === 'bookmarks') {
    out.tab = 'bookmarks';
  } else if (head === 'tags') {
    out.tab = 'tags';
  } else if (head === 'browse') {
    // Browse is the leaf-drill fallback until slice 2's cascading typeset
    // pages replace it. Sidebar no longer links here, but URL
    // bookmarks and click-to-drill from frontmatter pages still resolve.
    out.tab = 'browse';
    out.path = rest.map(longSlug);
  } else if (head === 'read') {
    // /read/<passage-id>. Tree path is filled in by BrowseView once
    // the corpus tree loads (pathToLeaf walks ancestors).
    out.tab = 'browse';
    out.leaf = rest.join('/') || null;
  } else if (head === 'search') {
    out.tab = 'search';
    out.query = rest.join('/') || '';
  } else if (head === 'dict') {
    out.tab = 'dictionary';
    out.query = rest.join('/') || '';
  } else if (head === 'concordance' || head === 'compare') {
    // /compare/<term> kept as an alias only for hash-history navigation
    // mid-session; canonical URL is /concordance/<term>.
    out.tab = 'concordance';
    out.query = rest.join('/') || '';
  } else {
    // Unknown — fall back to Tipiṭaka home.
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

  // Random sutta: fetched from the server (filters: has translation,
  // not uddāna, in sutta piṭaka). Single handler shared by Sidebar
  // (desktop) and TopNav slide-in panel (mobile).
  //
  // Setting window.location.hash alone wouldn't update React state —
  // the router is one-way (state → hash) with no hashchange listener.
  // Update state via the same path Bookmarks/Tags use to open a
  // passage; the URL-writing useEffect picks the hash up after.
  const handleRandomSutta = async () => {
    try {
      const { id } = await randomPassageApi({ scope: 'sutta' });
      if (id) {
        setBrowseLeafId(id);
        setBrowsePath([]);  // BrowseView's pathToLeaf fills the tree path
        setTab('browse');
      }
    } catch (err) {
      console.warn('Random sutta failed:', err.message);
    }
  };
  const isNarrow = useIsNarrow();

  // Mirror enough state into the URL hash that refresh / shared link
  // restores the same view. replaceState rather than pushState so
  // typing in the search input doesn't fill the back-button history.
  useEffect(() => {
    let hash = '';
    const enc = (s) => encodeURIComponent(s).replace(/%20/g, '+');
    if (tab === 'tipitaka') {
      hash = '/tipitaka';
    } else if (tab === 'commentary') {
      hash = '/commentary';
    } else if (tab === 'anya') {
      hash = '/anya';
    } else if (tab === 'library') {
      // LibraryView manages its own /library/<slug> deep-link in-place
      // (when an article is open). Don't overwrite that here.
      if (!window.location.hash.startsWith('#/library/')) hash = '/library';
    } else if (tab === 'bookmarks') {
      hash = '/bookmarks';
    } else if (tab === 'tags') {
      // TagsView manages its own /tags/<type>/<value> deep links.
      if (!window.location.hash.startsWith('#/tags')) hash = '/tags';
    } else if (tab === 'browse') {
      if (browseLeafId) {
        hash = `/read/${enc(browseLeafId)}`;
      } else if (browsePath.length > 0) {
        hash = `/browse/${browsePath.map(shortSlug).map(enc).join('/')}`;
      }
      // else: empty hash (BrowseView shouldn't really land here without
      // a path; the corpus frontmatter views are the new entry point)
    } else if (tab === 'search') {
      hash = query ? `/search/${enc(query)}` : '/search';
    } else if (tab === 'dictionary') {
      hash = query ? `/dict/${enc(query)}` : '/dict';
    } else if (tab === 'concordance') {
      hash = query ? `/concordance/${enc(query)}` : '/concordance';
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

  // Sidebar highlight: when actually browsing (drilled into a leaf via
  // Tipiṭaka frontmatter), reflect *which corpus* the user is inside
  // rather than the literal 'browse' tab, which is not in the nav.
  let effectiveTab = tab;
  if (tab === 'browse') {
    const root = browsePath[0];
    if (root === 'pli-tipitaka')   effectiveTab = 'tipitaka';
    else if (root === 'pli-commentary') effectiveTab = 'commentary';
    else if (root === 'pli-subcommentary') effectiveTab = 'commentary';
    else if (root === 'pli-anya')  effectiveTab = 'anya';
    else effectiveTab = 'tipitaka';
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
      {!readingMode && (
        <TopNav tab={effectiveTab} setTab={setTab} onRandomSutta={handleRandomSutta} />
      )}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {!readingMode && !isNarrow && (
          <Sidebar tab={effectiveTab} setTab={setTab} onRandomSutta={handleRandomSutta} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          {/* Narrow viewports get navigation from the TopNav slide-in
              panel — saves horizontal/vertical real estate and matches
              the in-app Settings affordance. */}
          <main style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
            {corpusError && (
              <div style={errorBanner}>
                Couldn’t load the corpus index. Search and browse may be unavailable.
              </div>
            )}
            {tab === 'tipitaka' && (
              <CanonMapView
                onDrill={(path, leafId) => {
                  setBrowsePath(path);
                  setBrowseLeafId(leafId || null);
                  setTab('browse');
                }}
              />
            )}
            {tab === 'commentary' && (
              <CommentaryView
                onDrill={(path, leafId) => {
                  setBrowsePath(path);
                  setBrowseLeafId(leafId || null);
                  setTab('browse');
                }}
              />
            )}
            {tab === 'anya' && (
              <ExtraCanonicalView
                onDrill={(path, leafId) => {
                  setBrowsePath(path);
                  setBrowseLeafId(leafId || null);
                  setTab('browse');
                }}
              />
            )}
            {tab === 'library' && (
              <LibraryView
                onSearchTerm={(term) => { setQuery(term); setTab('search'); }}
                onCompareTerm={(term) => { setQuery(term); setTab('concordance'); }}
              />
            )}
            {tab === 'bookmarks' && (
              <BookmarksView
                onOpenPassage={(id) => {
                  setBrowseLeafId(id);
                  setBrowsePath([]);
                  setTab('browse');
                }}
              />
            )}
            {tab === 'tags' && (
              <TagsView
                onOpenPassage={(id) => {
                  setBrowseLeafId(id);
                  setBrowsePath([]);
                  setTab('browse');
                }}
              />
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
                onCompareTerm={(term) => { setQuery(term); setTab('concordance'); }}
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
                onCompareTerm={(term) => { setQuery(term); setTab('concordance'); }}
                onOpenPassage={(p) => {
                  // Library hits carry slug as id; route to LibraryView's
                  // article reader instead of the passage reader.
                  if (p && p.library) {
                    window.location.hash = `#/library/${encodeURIComponent(p.id)}`;
                    setTab('library');
                    return;
                  }
                  setBrowseLeafId(p?.id ?? p);
                  setBrowsePath([]);
                  setTab('browse');
                }}
              />
            )}
            {tab === 'concordance' && (
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
                onCompareTerm={(term) => { setQuery(term); setTab('concordance'); }}
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
