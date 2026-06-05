import { useEffect, useRef, useState } from 'react';
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
import NotesView from './NotesView.jsx';
import DocsView from './DocsView.jsx';
import TagsView from './TagsView.jsx';
import DictionaryView from './DictionaryView.jsx';
import useIsNarrow from './useIsNarrow.js';
import useCorpus from './useCorpus.js';
import AboutView from './AboutView.jsx';
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
  // Split off the optional query string first so a translator filter
  // (?translator=thanissaro on /search) doesn't get treated as part of
  // the path. Only /search uses query params right now; other routes
  // ignore anything past the `?`.
  const fullRaw = window.location.hash.replace(/^#\/?/, '');
  const qIdx = fullRaw.indexOf('?');
  const raw = qIdx === -1 ? fullRaw : fullRaw.slice(0, qIdx);
  const queryStr = qIdx === -1 ? '' : fullRaw.slice(qIdx + 1);
  const query = new URLSearchParams(queryStr);
  const segs = raw.split('/').map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  }).filter(Boolean);
  // Default to Meaning. Stem-mode FTS misses cross-language semantic
  // matches (English query against Pali corpus), and after the gloss-
  // injected re-embed Meaning is meaningfully better at surfacing the
  // right passages for most scholar queries. The chosen mode persists
  // in localStorage (see initialSearchMode below).
  const out = { tab: 'tipitaka', query: 'sampajāna', searchMode: 'meaning', path: [], leaf: null, pin: null, searchTranslator: null, searchTag: null, focusSegment: null };
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
  } else if (head === 'notes') {
    out.tab = 'notes';
  } else if (head === 'docs') {
    // DocsView reads the open-doc slug (#/docs/<slug>) from the hash itself.
    out.tab = 'docs';
  } else if (head === 'tags') {
    out.tab = 'tags';
  } else if (head === 'about') {
    out.tab = 'about';
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
    const fs = query.get('focus');
    if (fs) out.focusSegment = fs;
  } else if (head === 'search') {
    out.tab = 'search';
    out.query = rest.join('/') || '';
    const t = query.get('translator');
    if (t) out.searchTranslator = t;
    const tg = query.get('tag');
    if (tg) out.searchTag = tg;
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
  // searchMode persistence: localStorage wins over the INITIAL default
  // so users get their last-picked mode back on reload / new tab. The
  // setter wrapper below mirrors every change back to storage.
  const [searchMode, setSearchModeRaw] = useState(() => {
    if (typeof window === 'undefined') return INITIAL.searchMode;
    try {
      const saved = window.localStorage.getItem('dhamma:searchMode');
      if (saved === 'exact' || saved === 'stem' || saved === 'meaning') return saved;
    } catch { /* localStorage may be unavailable in private mode */ }
    return INITIAL.searchMode;
  });
  const setSearchMode = (mode) => {
    setSearchModeRaw(mode);
    try { window.localStorage.setItem('dhamma:searchMode', mode); } catch { /* ignore */ }
  };
  // Pre-set translator filter — populated when the user clicks a row in
  // the Library "Translators" view, then consumed by SearchView so the
  // landing search is already scoped. Cleared on the next deliberate
  // search-tab visit if not the translator-coverage path.
  const [searchTranslator, setSearchTranslator] = useState(INITIAL.searchTranslator);
  const [searchTag, setSearchTag] = useState(INITIAL.searchTag);
  const [browsePath, setBrowsePath] = useState(INITIAL.path);
  const [browseLeafId, setBrowseLeafId] = useState(INITIAL.leaf);
  const [pinnedLeafId, setPinnedLeafId] = useState(INITIAL.pin);
  // Segment to scroll-to + highlight when opening a passage from the
  // Notes index. Cleared the moment the reader honors it so a later
  // navigation doesn't carry stale focus.
  const [focusSegment, setFocusSegment] = useState(INITIAL.focusSegment);
  const [readingMode, setReadingMode] = useState(false);
  // Search-context highlight: an array of terms (matched user terms +
  // alias expansions) that the reader applies to the open passage. Set
  // when the user clicks a search result; cleared when they navigate
  // from any other entry point (sidebar, bookmarks, random sutta, …).
  const [searchHighlight, setSearchHighlight] = useState({ terms: [], stem: false });

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
        setSearchHighlight({ terms: [], stem: false });
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
  // restores the same view. Uses pushState for *meaningful* navigations
  // (top-level tab change, opening a different passage, drilling to a
  // different tree node) so the browser back button + mobile back
  // gesture walk through the user's actual journey. Falls back to
  // replaceState for in-place state shifts (typing in a search input,
  // toggling the pinned passage) so the back stack doesn't fill with
  // keystroke noise.
  const lastWrittenHashRef = useRef(typeof window !== 'undefined' ? window.location.hash : '');
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
    } else if (tab === 'notes') {
      hash = '/notes';
    } else if (tab === 'docs') {
      // DocsView manages its own /docs/<slug> deep link in-place.
      if (!window.location.hash.startsWith('#/docs/')) hash = '/docs';
    } else if (tab === 'tags') {
      // TagsView manages its own /tags/<type>/<value> deep links.
      if (!window.location.hash.startsWith('#/tags')) hash = '/tags';
    } else if (tab === 'about') {
      hash = '/about';
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
      const qs = [];
      if (searchTranslator) qs.push(`translator=${enc(searchTranslator)}`);
      if (searchTag) qs.push(`tag=${enc(searchTag)}`);
      if (qs.length) hash += `?${qs.join('&')}`;
    } else if (tab === 'dictionary') {
      hash = query ? `/dict/${enc(query)}` : '/dict';
    } else if (tab === 'concordance') {
      hash = query ? `/concordance/${enc(query)}` : '/concordance';
    }
    const target = hash ? `#${hash}` : window.location.pathname;
    const next = hash ? `${window.location.pathname}#${hash}` : window.location.pathname;
    const current = `${window.location.pathname}${window.location.hash}`;
    if (next !== current) {
      // Distinguish "meaningful navigation" (deserves a back-stack
      // entry) from "in-place state shift" (shouldn't). The heuristic
      // compares the route head (#/<head>/…) between the previously-
      // written hash and the new one: if the head changed, or the head
      // is /read or /library and the trailing slug changed, push. Pure
      // /search/<query> keystrokes only change the query suffix → replace.
      const lastHash = lastWrittenHashRef.current || '';
      const headOf = (h) => (h.replace(/^#\/?/, '').split('/')[0] || '');
      const slugOf = (h) => h.replace(/^#\/?/, '').split('/').slice(1).join('/');
      const newHead = headOf(target);
      const oldHead = headOf(lastHash);
      const isMeaningful =
        newHead !== oldHead ||
        ((newHead === 'read' || newHead === 'library' || newHead === 'browse') &&
          slugOf(target) !== slugOf(lastHash));
      if (isMeaningful) {
        window.history.pushState(null, '', target);
      } else {
        window.history.replaceState(null, '', target);
      }
      lastWrittenHashRef.current = target;
    }
  }, [tab, query, searchMode, browsePath, browseLeafId, pinnedLeafId, searchTranslator, searchTag]);

  // Browser back / forward (incl. mobile back gesture) — re-parse the
  // hash and replay it into React state. Without this listener, the
  // router is one-way (state → hash) and back exits the SPA entirely.
  useEffect(() => {
    function onPop() {
      const parsed = parseInitialHash();
      setTab(parsed.tab);
      setQuery(parsed.query);
      setSearchMode(parsed.searchMode);
      setBrowsePath(parsed.path);
      setBrowseLeafId(parsed.leaf);
      setPinnedLeafId(parsed.pin);
      setSearchTranslator(parsed.searchTranslator || null);
      setSearchTag(parsed.searchTag || null);
      setFocusSegment(parsed.focusSegment || null);
      // Don't push a duplicate — sync the ref so the URL effect
      // doesn't try to re-write what the browser just navigated to.
      lastWrittenHashRef.current = window.location.hash;
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const { shape, error: corpusError } = useCorpus();

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
        <TopNav
          tab={effectiveTab}
          setTab={setTab}
          onRandomSutta={handleRandomSutta}
          onHome={() => {
            // Reset to the canonical landing view (Tipiṭaka frontmatter).
            // Clears any in-progress drill / open leaf so the user
            // really lands "home" rather than re-entering wherever they
            // last were inside browse.
            setTab('tipitaka');
            setBrowsePath([]);
            setBrowseLeafId(null);
            setPinnedLeafId(null);
            setReadingMode(false);
          }}
        />
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
                onRandomSutta={handleRandomSutta}
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
                onOpenTranslator={(slug) => {
                  // Clicked a row in the Translator coverage index.
                  // Drop the user into Search with the translator filter
                  // already applied and the scope set to Translation, so
                  // any query they type narrows within that translator's
                  // work. Empty query state in Search still tells them
                  // what's filtered.
                  setQuery('');
                  setSearchTranslator(slug);
                  setTab('search');
                }}
              />
            )}
            {tab === 'bookmarks' && (
              <BookmarksView
                onOpenPassage={(id) => {
                  setSearchHighlight({ terms: [], stem: false });
                  setBrowseLeafId(id);
                  setBrowsePath([]);
                  setTab('browse');
                }}
              />
            )}
            {tab === 'notes' && (
              <NotesView
                onOpenPassage={(id, focusKey) => {
                  setSearchHighlight({ terms: [], stem: false });
                  setBrowseLeafId(id);
                  setBrowsePath([]);
                  setFocusSegment(focusKey || null);
                  setTab('browse');
                }}
              />
            )}
            {tab === 'tags' && (
              <TagsView
                onOpenPassage={(id) => {
                  setSearchHighlight({ terms: [], stem: false });
                  setBrowseLeafId(id);
                  setBrowsePath([]);
                  setTab('browse');
                }}
                onSearchWithTag={(tag) => {
                  setQuery('');
                  setSearchTag(tag);
                  setTab('search');
                }}
              />
            )}
            {tab === 'docs' && (
              <DocsView
                onSearchTerm={(term) => { setQuery(term); setTab('search'); }}
                onCompareTerm={(term) => { setQuery(term); setTab('concordance'); }}
              />
            )}
            {tab === 'about' && <AboutView />}
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
                highlightTerms={searchHighlight.terms}
                highlightStem={searchHighlight.stem}
                focusSegment={focusSegment}
                clearFocusSegment={() => setFocusSegment(null)}
              />
            )}
            {tab === 'search' && (
              <SearchView
                query={query}
                setQuery={setQuery}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                initialTranslator={searchTranslator}
                onClearTranslator={() => setSearchTranslator(null)}
                initialTag={searchTag}
                onClearTag={() => setSearchTag(null)}
                onCompareTerm={(term) => { setQuery(term); setTab('concordance'); }}
                onOpenPassage={(p, highlight) => {
                  // Library hits carry slug as id; route to LibraryView's
                  // article reader instead of the passage reader.
                  if (p && p.library) {
                    window.location.hash = `#/library/${encodeURIComponent(p.id)}`;
                    setTab('library');
                    return;
                  }
                  // Capture the matched terms (+ alias expansions) so the
                  // reader can highlight every occurrence, not just the
                  // ts_headline window. `highlight` is the same array the
                  // PassageCard used for its snippet highlight.
                  if (Array.isArray(highlight) && highlight.length > 0) {
                    setSearchHighlight({
                      terms: highlight,
                      stem: searchMode === 'stem' || searchMode === 'meaning',
                    });
                  } else {
                    setSearchHighlight({ terms: [], stem: false });
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
  background: 'rgba(var(--bc-loss-text-rgb), 0.08)',
  color: 'var(--bc-text-secondary)',
  borderBottom: '1px solid rgba(var(--bc-loss-text-rgb), 0.20)',
  zIndex: 10,
  textAlign: 'center',
  fontStyle: 'italic',
};
