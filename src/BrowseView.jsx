import { useEffect, useMemo, useRef } from 'react';
import { pathNames, pathToLeaf } from './data/corpus.js';
import useCorpus from './useCorpus.js';
import usePassage from './usePassage.js';
import useIsNarrow from './useIsNarrow.js';
import TreeLevel from './browse/TreeLevel.jsx';
import ReadingPanel from './browse/ReadingPanel.jsx';

export default function BrowseView({
  path, setPath,
  leafId, setLeafId,
  pinnedLeafId, setPinnedLeafId,
  readingMode, setReadingMode,
  onSearchTerm, onCompareTerm,
  // Search-context highlight: an array of terms (matched terms + alias
  // expansions) that the reader should highlight throughout the passage
  // when the user arrived from a search hit. Falls back when the user
  // types in the in-passage find bar.
  highlightTerms,
  highlightStem,
}) {
  const columnsScrollRef = useRef(null);
  const { shape, loading: corpusLoading } = useCorpus();
  const tree = shape?.tree || [];
  const browseIsNarrow = useIsNarrow();

  // Always fetch both potentially-displayed passages; usePassage is a no-op
  // when id is null. Hooks must be unconditional.
  const { data: selectedPassage, loading: selectedLoading } = usePassage(leafId);
  const { data: pinnedPassage } = usePassage(pinnedLeafId);

  // Split-pane: when a pinned passage exists AND a leaf is open AND
  // they're different AND we have room (≥ 880px) — render the two
  // passages side-by-side at full reading chrome instead of stacking
  // the pinned one compact above. Narrow viewports fall back to the
  // stacked layout (no room for two columns of body text).
  const splitPane = !!(
    pinnedPassage && leafId && pinnedLeafId !== leafId && !browseIsNarrow && !readingMode
  );

  // Skip the tradition level entirely — only Theravāda is live, and
  // Mahāyāna/Zen are hidden from the UI until they have passages. All
  // tree traversal in this view (columns, breadcrumb, pathToLeaf for
  // adjacent nav) walks from Theravāda's children as the effective root.
  const top = useMemo(() => {
    const trad = tree.find((t) => t.id === 'theravada');
    return trad?.children || [];
  }, [tree]);

  function selectAt(depth, node) {
    if (node.stub) return;
    if (node.passageId) {
      setLeafId(node.id);
      return;
    }
    if (node.children?.length) {
      // Click the currently-expanded node at this depth → collapse it
      // and everything below. Otherwise replace from this depth on.
      if (path[depth] === node.id) {
        setPath(path.slice(0, depth));
      } else {
        setPath([...path.slice(0, depth), node.id]);
      }
      setLeafId(null);
    }
  }

  // Esc anywhere in Browse with a leaf selected → return to the tree.
  // Tree state (path) is preserved so the drill-down is intact.
  useEffect(() => {
    if (!leafId || readingMode) return;
    function onKey(e) { if (e.key === 'Escape') setLeafId(null); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [leafId, readingMode, setLeafId]);

  // Entering via a shared #/read/<id> URL: derive the tree path from the
  // leaf so clicking Back returns to the correct drill state instead of
  // dropping the user at the top level.
  useEffect(() => {
    if (!leafId) return;
    if (top.length === 0) return;
    if (path.length > 0) return;
    const derived = pathToLeaf(top, leafId);
    if (derived) setPath(derived);
  }, [leafId, top, path.length, setPath]);

  const crumb = pathNames(top, path);

  // Reading mode: hide breadcrumb / columns / pinned, just the selected
  // passage centered. Same usePassage data used in either layout.
  if (readingMode) {
    return (
      <div data-scroll-root="" style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 }}>
        <div style={readingModeWrap}>
          {/* Exit-reading affordance used to sit here as a standalone
              button. It now lives at the top of the sticky chrome
              inside ReadingPanel (as the "← Exit reading mode" row)
              so it collapses with the rest of the reader header on
              scroll, consistent with how back-to-canon behaves in
              the standard reader. */}
          {selectedLoading && <p style={hint}>Loading passage…</p>}
          {!selectedLoading && selectedPassage && (
            <ReadingPanel
              passage={selectedPassage}
              tree={tree}
              workBySlug={shape?.workBySlug}
              leafId={leafId}
              pinnedLeafId={pinnedLeafId}
              setPinnedLeafId={setPinnedLeafId}
              readingMode={readingMode}
              setReadingMode={setReadingMode}
              onBack={() => setReadingMode(false)}
              onNavigate={(id) => {
                const newPath = pathToLeaf(top, id);
                if (newPath) setPath(newPath);
                setLeafId(id);
              }}
              onBrowseToPath={(newPath) => {
                setPath(newPath);
                setLeafId(null);
              }}
              onSearchTerm={onSearchTerm}
              onCompareTerm={onCompareTerm}
              highlightTerms={highlightTerms}
              highlightStem={highlightStem}
            />
          )}
        </div>
      </div>
    );
  }

  // Split-pane layout: two ReadingPanels in independent scroll columns,
  // each at full reader chrome. Rendered above the standard browse
  // viewport so it replaces the wrap padding with full-bleed columns.
  if (splitPane) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={splitToolbar}>
          <button
            onClick={() => setLeafId(null)}
            style={backBtn}
            aria-label="Back to canon (Esc)"
          >
            <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
            <span>Back to canon</span>
            <span style={backBtnHint}>Esc</span>
          </button>
          <div style={splitToolbarLabel}>
            <span style={splitToolbarKicker}>Side-by-side</span>
            <button
              onClick={() => {
                // Swap which passage is primary vs pinned. Both ids are
                // already loaded so this is just a state flip.
                const swap = pinnedLeafId;
                setPinnedLeafId(leafId);
                setLeafId(swap);
              }}
              style={splitSwapBtn}
              title="Swap left ↔ right"
              aria-label="Swap which passage is primary"
            >
              ⇄ swap
            </button>
            <button
              onClick={() => setPinnedLeafId(null)}
              style={splitSwapBtn}
              title="Close right pane"
              aria-label="Close right pane"
            >
              unpin ×
            </button>
          </div>
        </div>
        <div style={splitColumns}>
          <div style={splitColumn}>
            <div style={splitColumnLabel}>
              <span style={splitColumnLabelDot} aria-hidden="true">●</span>
              Primary
            </div>
            {!selectedLoading && selectedPassage && (
              <ReadingPanel
                passage={selectedPassage}
                tree={tree}
                workBySlug={shape?.workBySlug}
                leafId={leafId}
                pinnedLeafId={pinnedLeafId}
                setPinnedLeafId={setPinnedLeafId}
                readingMode={readingMode}
                setReadingMode={setReadingMode}
                inSplitPane
                onNavigate={(id) => {
                  const newPath = pathToLeaf(top, id);
                  if (newPath) setPath(newPath);
                  setLeafId(id);
                }}
                onBrowseToPath={(newPath) => {
                  setPath(newPath);
                  setLeafId(null);
                }}
                onSearchTerm={onSearchTerm}
                onCompareTerm={onCompareTerm}
                highlightTerms={highlightTerms}
                highlightStem={highlightStem}
              />
            )}
          </div>
          <div style={splitColumn}>
            <div style={{ ...splitColumnLabel, ...splitColumnLabelPinned }}>
              <span style={splitColumnLabelDot} aria-hidden="true">⤒</span>
              Pinned
            </div>
            <ReadingPanel
              passage={pinnedPassage}
              tree={tree}
              workBySlug={shape?.workBySlug}
              leafId={pinnedLeafId}
              pinnedLeafId={pinnedLeafId}
              setPinnedLeafId={setPinnedLeafId}
              readingMode={readingMode}
              setReadingMode={setReadingMode}
              inSplitPane
              onNavigate={(id) => {
                // Navigating from the pinned side rebinds the pinned
                // passage rather than the primary — keeps the swap
                // intuition consistent (right column = pinned slot).
                setPinnedLeafId(id);
              }}
              onBrowseToPath={(newPath) => {
                setPath(newPath);
                setLeafId(null);
                setPinnedLeafId(null);
              }}
              onSearchTerm={onSearchTerm}
              onCompareTerm={onCompareTerm}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-scroll-root="" style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 }}>
      <div style={wrap}>
        {pinnedPassage && pinnedLeafId !== leafId && (
          <section style={pinnedSection}>
            <div style={pinnedLabel}>
              <span>Pinned</span>
              <button onClick={() => setPinnedLeafId(null)} style={pinnedClearBtn}>unpin ×</button>
            </div>
            <ReadingPanel
              passage={pinnedPassage}
              tree={tree}
              workBySlug={shape?.workBySlug}
              leafId={pinnedLeafId}
              pinnedLeafId={pinnedLeafId}
              setPinnedLeafId={setPinnedLeafId}
              readingMode={readingMode}
              setReadingMode={setReadingMode}
              compact
              onNavigate={(id) => {
                const newPath = pathToLeaf(top, id);
                if (newPath) setPath(newPath);
                setLeafId(id);
              }}
              onBrowseToPath={(newPath) => {
                setPath(newPath);
                setLeafId(null);
              }}
              onSearchTerm={onSearchTerm}
              onCompareTerm={onCompareTerm}
            />
          </section>
        )}

        {leafId ? (
          /* Leaf selected — replace the tree viewport with the passage.
             Path state is preserved so "Back" returns to the exact drill
             position. Pinned panel still shows above (unless it's the
             same passage we're reading). */
          <>
            {/* Back-to-canon used to render here as a standalone button
                above ReadingPanel. It now lives at the top of the
                sticky reader chrome inside ReadingPanel (desktop only),
                so it collapses + reappears together with the rest of
                the reader header on scroll. */}
            {selectedLoading && <p style={hint}>Loading passage…</p>}
            {!selectedLoading && selectedPassage && (
              <ReadingPanel
                passage={selectedPassage}
                tree={tree}
                workBySlug={shape?.workBySlug}
                leafId={leafId}
                pinnedLeafId={pinnedLeafId}
                setPinnedLeafId={setPinnedLeafId}
                readingMode={readingMode}
                setReadingMode={setReadingMode}
                onBack={() => setLeafId(null)}
                onNavigate={(id) => {
                  const newPath = pathToLeaf(top, id);
                  if (newPath) setPath(newPath);
                  setLeafId(id);
                }}
                onBrowseToPath={(newPath) => {
                  setPath(newPath);
                  setLeafId(null);
                }}
                onSearchTerm={onSearchTerm}
                onCompareTerm={onCompareTerm}
                highlightTerms={highlightTerms}
                highlightStem={highlightStem}
              />
            )}
          </>
        ) : (
          /* No leaf — show the tree drill-down. */
          <>
            {crumb.length > 0 && (
              <nav style={breadcrumb}>
                <BreadcrumbLink onClick={() => { setPath([]); setLeafId(null); }}>Canon</BreadcrumbLink>
                {crumb.map((name, i) => (
                  <span key={i} style={{ display: 'contents' }}>
                    <span style={crumbSep}>›</span>
                    <BreadcrumbLink onClick={() => { setPath(path.slice(0, i + 1)); setLeafId(null); }}>
                      {name}
                    </BreadcrumbLink>
                  </span>
                ))}
              </nav>
            )}

            <div style={columnsScroll} ref={columnsScrollRef}>
              <style>{columnAnimCss}</style>
              <TreeLevel
                items={top}
                depth={0}
                path={path}
                leafId={leafId}
                onSelect={selectAt}
              />
            </div>

            {!corpusLoading && top.length > 0 && (
              <div style={hintRow}>
                <p style={hint}>
                  Click a heading to expand, click a leaf{' '}
                  <span style={{ color: 'var(--bc-accent)' }}>•</span> to open the passage.
                </p>
              </div>
            )}

            {corpusLoading && top.length === 0 && (
              <div style={hintRow}>
                <p style={hint}>Loading corpus…</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BreadcrumbLink({ children, onClick }) {
  return (
    <button onClick={onClick} style={crumbLink}>{children}</button>
  );
}

const wrap = { maxWidth: 1200, margin: '0 auto', padding: '24px 28px 48px' };

const readingModeWrap = { maxWidth: 720, margin: '0 auto', padding: '40px 28px 64px' };

const exitReadingBtn = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'var(--bc-text-tertiary)',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  padding: '6px 12px',
  borderRadius: 999,
  cursor: 'pointer',
  marginBottom: 28,
};

const pinnedSection = {
  marginBottom: 28,
  paddingBottom: 24,
  borderBottom: '1px dashed rgba(var(--bc-accent-rgb), 0.30)',
};

// Split-pane: two ReadingPanels side-by-side, each with its own
// vertical scroll. Used only when viewport ≥ 880px AND both a leaf
// and a pinned passage are open. The toolbar carries the back +
// swap + unpin controls for the whole split.
const splitToolbar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 28px',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  background: 'var(--bc-bg-base)',
  flexShrink: 0,
};

const splitToolbarLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

const splitToolbarKicker = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
};

const splitSwapBtn = {
  background: 'transparent',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.25)',
  color: 'var(--bc-text-tertiary)',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  padding: '5px 10px',
  borderRadius: 999,
  cursor: 'pointer',
};

const splitColumns = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  // Subtle divider between the two columns — a vertical thin gold
  // rule that matches the rest of the academic typesetting.
  background: 'linear-gradient(to right, transparent calc(50% - 0.5px), rgba(var(--bc-accent-rgb), 0.18) calc(50% - 0.5px), rgba(var(--bc-accent-rgb), 0.18) calc(50% + 0.5px), transparent calc(50% + 0.5px))',
};

const splitColumn = {
  flex: 1,
  minWidth: 0,
  overflow: 'auto',
  padding: '24px 28px 48px',
};

// Tiny kicker above each split-pane column body identifying which
// passage is the primary (the one back/prev/next operate on) vs.
// the pinned companion. Otherwise a swap leaves the user wondering
// which side moved.
const splitColumnLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 18,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
  fontFamily: 'Outfit, system-ui, sans-serif',
};

// Pinned column gets a slightly dimmer label — the primary is the
// "active" side that owns the back-stack + prev/next nav.
const splitColumnLabelPinned = {
  color: 'var(--bc-text-tertiary)',
};

const splitColumnLabelDot = {
  fontSize: 10,
  lineHeight: 1,
};

const pinnedLabel = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
  marginBottom: 6,
};

const pinnedClearBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: 0,
};

const breadcrumb = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  flexWrap: 'wrap',
  marginBottom: 16,
  fontSize: 12,
};

const crumbLink = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
  letterSpacing: '0.01em',
};

const crumbSep = { color: 'var(--bc-text-tertiary)', opacity: 0.5 };

const columnsScroll = {
  scrollBehavior: 'smooth',
  borderTop: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
};

const backBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontSize: 13,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  padding: '6px 0',
  marginBottom: 10,
  fontFamily: 'inherit',
};

const backBtnHint = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  borderRadius: 4,
  padding: '2px 6px',
};

// Each drill-down level slides in from above as a new section beneath
// the previous one — keeps the prior choices visible above for context.
const columnAnimCss = `
  @keyframes dhammaColSlide {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .dhamma-col-new {
    animation: dhammaColSlide 220ms ease-out;
  }
`;

const columnsRow = { display: 'flex', flexDirection: 'column' };

const column = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.10)',
  padding: '8px 0',
};

const hintRow = { padding: '24px 0' };

const hint = {
  margin: 0,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
};

