import { useEffect, useMemo, useRef, useState } from 'react';
import { pathNames, pathToLeaf } from './data/corpus.js';
import { tagsApi } from './api.js';
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
  // When the user opens a passage from the Notes index with a focus
  // key, we pass that down to ReadingPanel so it can scroll-to and
  // briefly highlight the specific segment. Cleared once consumed so
  // a later navigation doesn't carry stale focus.
  focusSegment,
  clearFocusSegment,
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

  // ── Audience chip filter ────────────────────────────────────────────────
  // The audience facet (monks / nuns / laypeople / kings / brahmins / devas)
  // is curated in passage_tags. Clicking a chip narrows the browse tree to
  // only the branches that contain passages carrying that tag — the tree-side
  // analogue of collectLeaves restricted to the tag set. State is ephemeral
  // (not URL-persisted) so it never collides with the #/read deep-link router.
  const [audienceFacet, setAudienceFacet] = useState([]);     // [{ tag_value, n }]
  const [activeAudience, setActiveAudience] = useState(null);  // tag_value | null
  const [activeTagIds, setActiveTagIds] = useState(null);      // Set<passage_id> | null
  const [tagLoading, setTagLoading] = useState(false);

  // Load the audience facet once. Cheap (≤6 values); failures degrade to no
  // chip row rather than blocking Browse.
  useEffect(() => {
    let alive = true;
    tagsApi({ type: 'audience' })
      .then((r) => { if (alive) setAudienceFacet(r.values || []); })
      .catch(() => { if (alive) setAudienceFacet([]); });
    return () => { alive = false; };
  }, []);

  // When a chip is active, fetch its passage-id set so we can prune the tree.
  useEffect(() => {
    if (!activeAudience) { setActiveTagIds(null); setTagLoading(false); return; }
    const ac = new AbortController();
    let alive = true;
    setTagLoading(true);
    tagsApi({ type: 'audience', value: activeAudience, signal: ac.signal })
      .then((r) => {
        if (!alive) return;
        setActiveTagIds(new Set((r.passages || []).map((p) => p.passage_id)));
        setTagLoading(false);
      })
      .catch(() => { if (alive) setTagLoading(false); });
    return () => { alive = false; ac.abort(); };
  }, [activeAudience]);

  // Toggle a chip. Activating resets the drill to the root + closes any open
  // leaf so the filtered tree is shown from the top rather than stranded deep
  // in a now-pruned branch.
  function toggleAudience(value) {
    setLeafId(null);
    setPath([]);
    setActiveAudience((cur) => (cur === value ? null : value));
  }

  // The tree actually rendered: full corpus, or pruned to the active tag set.
  // pruneTree keeps a leaf iff its passage is in the set, and an interior node
  // iff it has a surviving descendant. Memoized so the O(tree) walk only runs
  // when the set changes, not on every render. Navigation handlers keep using
  // the full `top` (prev/next spans the whole corpus, not the filtered view).
  const displayTop = useMemo(
    () => (activeTagIds ? pruneTree(top, activeTagIds) : top),
    [top, activeTagIds],
  );

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

  const crumb = pathNames(displayTop, path);

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
                focusSegment={focusSegment}
                clearFocusSegment={clearFocusSegment}
              />
            )}
          </>
        ) : (
          /* No leaf — show the tree drill-down. */
          <>
            {audienceFacet.length > 0 && (
              <div style={chipRow}>
                <span style={chipRowLabel}>Audience</span>
                {audienceFacet.map((f) => {
                  const on = activeAudience === f.tag_value;
                  return (
                    <button
                      key={f.tag_value}
                      onClick={() => toggleAudience(f.tag_value)}
                      style={{ ...chip, ...(on ? chipActive : null) }}
                      aria-pressed={on}
                      title={`Show passages addressed to ${AUDIENCE_LABELS[f.tag_value] || f.tag_value}`}
                    >
                      <span>{AUDIENCE_LABELS[f.tag_value] || f.tag_value}</span>
                      <span style={chipCount}>{f.n}</span>
                    </button>
                  );
                })}
                {activeAudience && (
                  <button onClick={() => toggleAudience(activeAudience)} style={chipClear}>
                    clear ×
                  </button>
                )}
              </div>
            )}

            {activeAudience && (
              <p style={filterNote}>
                {tagLoading
                  ? 'Filtering the tree…'
                  : `Tree narrowed to passages addressed to ${AUDIENCE_LABELS[activeAudience] || activeAudience} · ${activeTagIds?.size ?? 0} passages. Other branches hidden.`}
              </p>
            )}

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
                items={displayTop}
                depth={0}
                path={path}
                leafId={leafId}
                onSelect={selectAt}
              />
            </div>

            {!corpusLoading && displayTop.length > 0 && (
              <div style={hintRow}>
                <p style={hint}>
                  Click a heading to expand, click a leaf{' '}
                  <span style={{ color: 'var(--bc-accent)' }}>•</span> to open the passage.
                </p>
              </div>
            )}

            {activeAudience && !tagLoading && displayTop.length === 0 && (
              <div style={hintRow}>
                <p style={hint}>No passages in the tree carry this audience tag.</p>
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

// Prune a corpus tree to only the branches reaching a passage in `idSet`.
// A leaf survives iff its passage id is in the set; an interior node survives
// iff at least one descendant survives. Returns a new array (shallow-copies
// interior nodes so the original tree is untouched and remains shareable).
function pruneTree(nodes, idSet) {
  const out = [];
  for (const n of nodes || []) {
    if (n.passageId) {
      if (idSet.has(n.id)) out.push(n);
    } else if (n.children?.length) {
      const kids = pruneTree(n.children, idSet);
      if (kids.length) out.push({ ...n, children: kids });
    }
  }
  return out;
}

// Display labels for the curated `audience` tag values. The stored values are
// the lowercase canonical keys (so ?tag=audience:monks works); these are just
// the human-facing chip text.
const AUDIENCE_LABELS = {
  monks: 'Monks',
  nuns: 'Nuns',
  laypeople: 'Laypeople',
  kings: 'Kings',
  brahmins: 'Brahmins',
  devas: 'Devas',
};

const wrap = { maxWidth: 1200, margin: 0, padding: '24px 28px 48px' };

const readingModeWrap = { maxWidth: 720, margin: '0 auto', padding: '40px 28px 64px' };

const exitReadingBtn = {
  background: 'transparent',
  border: '1px solid rgba(var(--bc-border-rgb),0.10)',
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

// Audience chip filter row — sits above the breadcrumb in tree view.
const chipRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 14,
};

const chipRowLabel = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  marginRight: 2,
};

const chip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 12px',
  background: 'transparent',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.28)',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  color: 'var(--bc-text-primary)',
  transition: 'background 100ms ease, border-color 100ms ease',
};

const chipActive = {
  background: 'rgba(var(--bc-accent-rgb), 0.14)',
  borderColor: 'var(--bc-accent)',
  color: 'var(--bc-accent)',
};

const chipCount = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'var(--bc-text-tertiary)',
  fontVariantNumeric: 'tabular-nums',
};

const chipClear = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: '5px 4px',
};

const filterNote = {
  margin: '0 0 14px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 12,
  color: 'var(--bc-text-tertiary)',
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

