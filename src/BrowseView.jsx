import { useEffect, useMemo, useRef, useState } from 'react';
import { pathNames, collectLeaves, pathToLeaf } from './data/corpus.js';
import useCorpus from './useCorpus.js';
import usePassage from './usePassage.js';
import { lookupApi } from './api.js';
import { prepareDppnHtml, groupEntriesBySource, SOURCE_LABEL } from './dictHtml.js';

const DPPN_POPOVER_COLLAPSE_THRESHOLD = 400;

export default function BrowseView({
  path, setPath,
  leafId, setLeafId,
  pinnedLeafId, setPinnedLeafId,
  readingMode, setReadingMode,
  onSearchTerm, onCompareTerm,
}) {
  const columnsScrollRef = useRef(null);
  const { shape, loading: corpusLoading } = useCorpus();
  const tree = shape?.tree || [];

  // Always fetch both potentially-displayed passages; usePassage is a no-op
  // when id is null. Hooks must be unconditional.
  const { data: selectedPassage, loading: selectedLoading } = usePassage(leafId);
  const { data: pinnedPassage } = usePassage(pinnedLeafId);

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
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
        <div style={readingModeWrap}>
          <button onClick={() => setReadingMode(false)} style={exitReadingBtn} aria-label="Exit reading mode (Esc)">
            Exit reading mode  ·  Esc
          </button>
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
              onNavigate={(id) => {
                const newPath = pathToLeaf(top, id);
                if (newPath) setPath(newPath);
                setLeafId(id);
              }}
              onSearchTerm={onSearchTerm}
              onCompareTerm={onCompareTerm}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
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
            <button
              onClick={() => setLeafId(null)}
              style={backBtn}
              aria-label="Back to canon (Esc)"
            >
              <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
              <span>Back to canon</span>
              <span style={backBtnHint}>Esc</span>
            </button>

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
                onNavigate={(id) => {
                  const newPath = pathToLeaf(top, id);
                  if (newPath) setPath(newPath);
                  setLeafId(id);
                }}
                onSearchTerm={onSearchTerm}
                onCompareTerm={onCompareTerm}
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

// Side-by-side parallel reader for passages that have both Pali and an
// English translation. A draggable divider between the two panes lets
// the reader give more real estate to whichever side they're focusing
// on. Each pane keeps the standard Pali / translation typography so the
// stacked-fallback view above stays consistent.
function SideBySideReader({ pali, english }) {
  const [pct, setPct] = useState(50);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  function onPointerDown(e) {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const next = (x / rect.width) * 100;
    // Clamp 20–80 so neither pane can be squashed to unreadable.
    setPct(Math.max(20, Math.min(80, next)));
  }
  function onPointerUp(e) {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  return (
    <div ref={containerRef} style={sideBySideWrap}>
      <div style={{ ...sideBySidePane, flexBasis: `${pct}%` }}>
        <p style={readingOriginal}>{pali}</p>
      </div>
      <div
        style={sideBySideDivider}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title="Drag to resize"
      >
        <div style={sideBySideGrip} />
      </div>
      <div style={{ ...sideBySidePane, flexBasis: `calc(${100 - pct}% - 18px)` }}>
        <p style={{ ...readingTranslation, marginBottom: 18 }}>{english}</p>
      </div>
    </div>
  );
}

// Recursive tree level. Renders rows at this depth; for the row whose id
// matches path[depth], renders its children indented immediately below.
// Clicking a row re-uses `onSelect(depth, node)` from the parent: open
// to drill, click-again on the open row to collapse, click a leaf to
// load the passage.
function TreeLevel({ items, depth, path, leafId, onSelect }) {
  if (!items?.length) return null;
  return (
    <div style={depth === 0 ? undefined : { ...levelInset, animation: 'dhammaColSlide 200ms ease-out' }}>
      {items.map((node) => {
        const isExpanded = path[depth] === node.id;
        const isSelectedLeaf = node.passageId && node.id === leafId;
        const isStub = !!node.stub;
        const isLeaf = !!node.passageId;
        const tone = isStub
          ? 'var(--bc-text-tertiary)'
          : (isExpanded || isSelectedLeaf)
            ? 'var(--bc-accent)'
            : 'var(--bc-text-primary)';
        return (
          <div key={node.id}>
            <button
              onClick={() => onSelect(depth, node)}
              disabled={isStub}
              style={{
                ...row,
                color: tone,
                opacity: isStub ? 0.5 : 1,
                background: (isExpanded || isSelectedLeaf) ? 'rgba(var(--bc-accent-rgb), 0.06)' : 'transparent',
                cursor: isStub ? 'default' : 'pointer',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                <span style={rowName}>{node.name}</span>
                {node.subtitle && <span style={rowSubtitle}>{node.subtitle}</span>}
              </span>
              {!isStub && !isLeaf && (
                <span style={chev} aria-hidden="true">{isExpanded ? '⌃' : '⌄'}</span>
              )}
              {isLeaf && <span style={leafDot} aria-hidden="true">•</span>}
            </button>
            {isExpanded && node.children?.length > 0 && (
              <TreeLevel
                items={node.children}
                depth={depth + 1}
                path={path}
                leafId={leafId}
                onSelect={onSelect}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReadingPanel({
  passage, tree, workBySlug,
  leafId,
  pinnedLeafId, setPinnedLeafId,
  readingMode, setReadingMode,
  onNavigate, onSearchTerm, onCompareTerm,
  compact,
}) {
  const ref = useRef(null);
  const [sel, setSel] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lookup, setLookup] = useState(null); // { term, entries, loading, error }
  const isPinned = pinnedLeafId === leafId;

  // Flat depth-first order across the whole canon — adjacent nav crosses
  // work / canon boundaries so a reader can trace a concept end-to-end.
  const allLeaves = useMemo(() => collectLeaves(tree), [tree]);
  const idx = leafId ? allLeaves.findIndex((n) => n.id === leafId) : -1;
  const prev = idx > 0 ? allLeaves[idx - 1] : null;
  const next = idx >= 0 && idx < allLeaves.length - 1 ? allLeaves[idx + 1] : null;

  // Derive display labels from the corpus tree (server gives us work_slug)
  const workInfo = workBySlug?.get(passage.work_slug);
  const traditionLabel = workInfo?.tradition || '';
  const workLabel = workInfo?.name || '';

  useEffect(() => {
    function onSelChange() {
      const s = window.getSelection();
      if (!s || s.isCollapsed) { setSel(null); return; }
      const text = s.toString().trim();
      if (!text || text.length > 80) { setSel(null); return; }
      const range = s.getRangeAt(0);
      if (!ref.current || !ref.current.contains(range.commonAncestorContainer)) {
        setSel(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setSel({ text, x: rect.left + rect.width / 2, y: rect.top });
      setCopied(false);
    }
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, []);

  function clearSelection() {
    setSel(null);
    window.getSelection()?.removeAllRanges();
  }

  function doSearch() { if (sel?.text) onSearchTerm?.(sel.text); clearSelection(); }
  function doCompare() { if (sel?.text) onCompareTerm?.(sel.text); clearSelection(); }
  async function doCopy() {
    if (!sel?.text) return;
    try {
      await navigator.clipboard.writeText(sel.text);
      setCopied(true);
      setTimeout(clearSelection, 700);
    } catch {
      clearSelection();
    }
  }
  async function doLookup() {
    const term = sel?.text;
    const pos = sel ? { x: sel.x, y: sel.y } : null;
    if (!term || !pos) return;
    setLookup({ term, pos, entries: null, loading: true, error: null });
    clearSelection();
    try {
      const r = await lookupApi({ term });
      setLookup({ term, pos, entries: r.entries || [], loading: false, error: null, matchedVia: r.matched_via });
    } catch (err) {
      setLookup({ term, pos, entries: [], loading: false, error: err.message });
    }
  }

  // Close lookup on outside click / Escape.
  useEffect(() => {
    if (!lookup) return;
    function onKey(e) { if (e.key === 'Escape') setLookup(null); }
    function onDown(e) {
      if (e.target.closest('[data-lookup-panel]') || e.target.closest('[data-sel-popover]')) return;
      setLookup(null);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [lookup]);

  // When both Pali + English exist, drop the single-column reading-width
  // cap so the parallel reader can span the full available content area.
  const hasParallel = !!(passage.original && passage.translation);
  const articleStyle = compact
    ? { ...reading, padding: '12px 0 8px', maxWidth: hasParallel ? '100%' : reading.maxWidth }
    : { ...reading, maxWidth: hasParallel ? '100%' : reading.maxWidth };

  return (
    <article ref={ref} style={articleStyle}>
      {!compact && (
        <nav style={navRow}>
          {prev ? (
            <button onClick={() => onNavigate?.(prev.id)} style={navBtn}>
              <span style={navArrow}>◀</span>
              <span style={navLabel}>
                <span style={navName}>{prev.name}</span>
                {prev.subtitle && <span style={navSubtitle}>{prev.subtitle}</span>}
              </span>
            </button>
          ) : <span />}
          {next ? (
            <button onClick={() => onNavigate?.(next.id)} style={{ ...navBtn, textAlign: 'right' }}>
              <span style={navLabel}>
                <span style={navName}>{next.name}</span>
                {next.subtitle && <span style={navSubtitle}>{next.subtitle}</span>}
              </span>
              <span style={navArrow}>▶</span>
            </button>
          ) : <span />}
        </nav>
      )}

      <header style={readingHeader}>
        <div style={readingCitationLine}>
          <span style={readingCitation}>{passage.citation}</span>
          <span style={readingWork}>
            {passage.title || workLabel}{passage.title && workLabel ? ` · ${workLabel}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {!compact && (
            <button onClick={() => setPinnedLeafId?.(isPinned ? null : leafId)} style={iconAction} title={isPinned ? 'Unpin' : 'Pin to top'}>
              {isPinned ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 4l4 4-6 6v6l-2 2-4-4v-4l-6-6 4-4z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4l4 4-6 6v6l-2 2-4-4v-4l-6-6 4-4z"/></svg>
              )}
            </button>
          )}
          {!compact && !readingMode && (
            <button onClick={() => setReadingMode?.(true)} style={iconAction} title="Reading mode (focus)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4" />
              </svg>
            </button>
          )}
          <div style={readingTradition}>{traditionLabel}</div>
        </div>
      </header>

      {passage.original && passage.translation ? (
        <SideBySideReader pali={passage.original} english={passage.translation} />
      ) : (
        <>
          {passage.original && <p style={readingOriginal}>{passage.original}</p>}
          {passage.translation && <p style={readingTranslation}>{passage.translation}</p>}
        </>
      )}

      <footer style={readingFooter}>
        <span style={readingCanon}>{passage.canon}</span>
        <span style={readingHint}>Select any word for actions.</span>
      </footer>

      {sel && (
        <div
          data-sel-popover
          style={{
            ...selPopover,
            top: Math.max(8, sel.y - 50),
            left: sel.x,
            transform: 'translateX(-50%)',
          }}
        >
          <button onClick={doSearch} style={selBtn}>Search</button>
          <span style={selDot}>·</span>
          <button onClick={doCompare} style={selBtn}>Compare</button>
          <span style={selDot}>·</span>
          <button onClick={doCopy} style={selBtn}>{copied ? 'Copied' : 'Copy'}</button>
          <span style={selDot}>·</span>
          <button onClick={doLookup} style={selBtn} title="Look up in dictionary (DPD + DPPN)">
            Dictionary
          </button>
        </div>
      )}

      {lookup && <LookupPanel lookup={lookup} onClose={() => setLookup(null)} />}
    </article>
  );
}

function LookupPanel({ lookup, onClose }) {
  const { term, pos, entries, loading, error, matchedVia } = lookup;
  // Center horizontally on the original selection x; clamp to viewport.
  const left = Math.max(160, Math.min((pos?.x || 200), (typeof window !== 'undefined' ? window.innerWidth - 160 : 1000)));

  // Flip the panel above the selection when there isn't enough room below.
  // Without this, selections near the bottom of the viewport push the
  // panel off-screen — the maxHeight=70vh setting only adds an internal
  // scrollbar; the panel itself still extends past the fold.
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const selY = pos?.y || 60;
  const spaceBelow = vh - selY;
  const spaceAbove = selY;
  const GAP = 14;
  const MARGIN = 12;
  const flipUp = spaceBelow < 320 && spaceAbove > spaceBelow;
  const positionStyle = flipUp
    ? { bottom: vh - selY + GAP, maxHeight: `min(70vh, ${Math.max(120, spaceAbove - GAP - MARGIN)}px)` }
    : { top: Math.max(60, selY + GAP), maxHeight: `min(70vh, ${Math.max(120, spaceBelow - GAP - MARGIN)}px)` };

  return (
    <div data-lookup-panel style={{ ...lookupPanel, ...positionStyle, left, transform: 'translateX(-50%)' }}>
      <header style={lookupHeader}>
        <span style={lookupTerm}>{term}</span>
        {matchedVia === 'inflection' && entries?.length > 0 && (
          <span style={lookupMatchHint}> &nbsp;→ {entries[0].lemma}</span>
        )}
        {matchedVia === 'compound' && entries?.length > 0 && (
          <span style={lookupMatchHint}> &nbsp;· components in compound</span>
        )}
        {matchedVia === 'english-reverse' && entries?.length > 0 && (
          <span style={lookupMatchHint}> &nbsp;· Pali words meaning this</span>
        )}
        <button onClick={onClose} style={lookupClose} aria-label="Close">×</button>
      </header>
      <div style={lookupBody}>
        {loading && <p style={lookupMeta}>Looking up…</p>}
        {error && <p style={lookupError}>Lookup failed: {error}</p>}
        {!loading && !error && entries && entries.length === 0 && (
          <p style={lookupMeta}>No entry found for <strong>{term}</strong>.</p>
        )}
        {!loading && !error && entries && groupEntriesBySource(entries).map((g) => (
          <section key={g.source} style={lookupGroup}>
            <h3 style={lookupGroupHeader}>
              {SOURCE_LABEL[g.source]?.name || g.source}
            </h3>
            {g.entries.map((e) => <LookupEntry key={e.id} entry={e} />)}
          </section>
        ))}
      </div>
      <div style={lookupSource}>DPD · Bodhirasa · CC-BY-NC-SA · DPPN · Malalasekera (rev. Ānandajoti 2025)</div>
    </div>
  );
}

function LookupEntry({ entry: e }) {
  const [expanded, setExpanded] = useState(false);
  if (e.source === 'dppn') {
    const long = (e.definition || '').length > DPPN_POPOVER_COLLAPSE_THRESHOLD;
    return (
      <article style={lookupEntry}>
        <header style={lookupEntryHeader}>
          <span style={lookupEntryLemma}>{e.source_id || e.lemma}</span>
        </header>
        <div
          style={{ ...lookupDefinition, ...(long && !expanded ? lookupClampedDppn : null) }}
          dangerouslySetInnerHTML={{ __html: prepareDppnHtml(e.definition) }}
        />
        {long && (
          <button onClick={() => setExpanded((x) => !x)} style={lookupExpandBtn}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </article>
    );
  }
  return (
    <article style={lookupEntry}>
      <header style={lookupEntryHeader}>
        <span style={lookupEntryLemma}>{e.lemma}</span>
        {e.pos && <span style={lookupEntryPos}>{e.pos}</span>}
      </header>
      {e.grammar && <p style={lookupGrammar}>{e.grammar}</p>}
      <p style={lookupDefinition}>{e.definition}</p>
      {e.definition_lit && (
        <p style={lookupLiteral}>lit. {e.definition_lit}</p>
      )}
      {e.definition_alt && e.definition_alt !== e.definition && (
        <p style={lookupAlt}>also: {e.definition_alt}</p>
      )}
      <footer style={lookupFooter}>
        {e.sanskrit && <span><em>Skt.</em> {e.sanskrit}</span>}
        {e.root && <span> · <em>root</em> {e.root}</span>}
        {e.construction && <span> · <em>cons.</em> {e.construction}</span>}
      </footer>
      {e.example && (
        <blockquote style={lookupExample}>{e.example}</blockquote>
      )}
    </article>
  );
}

const wrap = { maxWidth: 1200, margin: '0 auto', padding: '24px 28px 48px' };

const lookupPanel = {
  position: 'fixed',
  zIndex: 1200,
  width: 'min(540px, 92vw)',
  maxHeight: '70vh',
  overflowY: 'auto',
  background: 'var(--bc-bg-elevated)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.30)',
  borderRadius: 10,
  boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const lookupHeader = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  padding: '12px 16px 8px',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.20)',
};

const lookupTerm = {
  fontSize: 18,
  fontStyle: 'italic',
  color: 'var(--bc-accent)',
};

const lookupMatchHint = {
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
};

const lookupClose = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontSize: 22,
  cursor: 'pointer',
  padding: '0 4px',
  marginLeft: 'auto',
  lineHeight: 1,
};

const lookupBody = { padding: '8px 16px 12px' };

const lookupEntry = {
  padding: '10px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

const lookupEntryHeader = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  marginBottom: 4,
};

const lookupEntryLemma = {
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--bc-text-primary)',
};

const lookupEntryPos = {
  fontSize: 11,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
  textTransform: 'lowercase',
};

const lookupGrammar = {
  margin: '0 0 6px',
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
};

const lookupDefinition = {
  margin: '6px 0',
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--bc-text-primary)',
};

const lookupLiteral = {
  margin: '4px 0',
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-text-secondary)',
};

const lookupAlt = {
  margin: '4px 0',
  fontSize: 13,
  color: 'var(--bc-text-secondary)',
};

const lookupFooter = {
  margin: '6px 0 4px',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
  display: 'flex',
  gap: 0,
  flexWrap: 'wrap',
};

const lookupExample = {
  margin: '8px 0 4px',
  padding: '6px 10px',
  borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.40)',
  background: 'rgba(255,255,255,0.03)',
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-text-secondary)',
  lineHeight: 1.55,
};

const lookupSource = {
  padding: '6px 16px 10px',
  fontSize: 10,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  textAlign: 'right',
};

const lookupGroup = {
  marginBottom: 8,
};

const lookupGroupHeader = {
  margin: '10px 0 4px',
  padding: '0 0 3px',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  fontSize: 10,
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const lookupClampedDppn = {
  maxHeight: '8em',
  overflow: 'hidden',
  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
};

const lookupExpandBtn = {
  marginTop: 4,
  padding: '2px 0',
  background: 'transparent',
  border: 'none',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--bc-accent)',
  cursor: 'pointer',
};

const lookupMeta = {
  margin: 0,
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
};

const lookupError = {
  margin: 0,
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--bc-loss-text)',
};

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

const iconAction = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'var(--bc-text-tertiary)',
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'color 100ms ease, border-color 100ms ease',
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

// Each nested level indents and gets a faint vertical guide on its
// left edge — standard tree-view feel, makes the hierarchy obvious at
// a glance without bombarding the user with sibling lists at every
// depth like the old stacked-columns layout did.
const levelInset = {
  paddingLeft: 18,
  marginLeft: 16,
  borderLeft: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
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

const row = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'background 100ms ease',
};

const rowName = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 14,
  lineHeight: 1.35,
};

const rowSubtitle = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.3,
};

const chev = { color: 'var(--bc-text-tertiary)', fontSize: 14, marginTop: 1, flexShrink: 0 };
const leafDot = { color: 'var(--bc-accent)', fontSize: 18, lineHeight: 1, marginTop: 4, flexShrink: 0 };

const hintRow = { padding: '24px 0' };

const hint = {
  margin: 0,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
};

const reading = { position: 'relative', padding: '32px 0 16px', maxWidth: 760 };

const readingHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 24,
  paddingBottom: 14,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.22)',
};

const readingCitationLine = { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 };

const readingCitation = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 22,
  color: 'var(--bc-accent)',
};

const readingWork = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
};

const readingTradition = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const readingOriginal = {
  margin: '0 0 18px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 17,
  lineHeight: 1.85,
  color: 'var(--bc-text-primary)',
  userSelect: 'text',
  whiteSpace: 'pre-wrap',
};

const sideBySideWrap = {
  display: 'flex',
  alignItems: 'stretch',
  margin: '0 0 18px',
  // Narrow viewports fall through to stacked via flex-wrap: the divider
  // and pane stay block-level when the viewport can't fit both 320px wide.
};

const sideBySidePane = {
  flex: '0 0 auto',
  minWidth: 0,        // critical: allow shrink below content's natural width
};

const sideBySideDivider = {
  flex: '0 0 18px',
  cursor: 'col-resize',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  touchAction: 'none',
};

const sideBySideGrip = {
  width: 2,
  alignSelf: 'stretch',
  background: 'rgba(var(--bc-accent-rgb), 0.18)',
  borderRadius: 1,
  transition: 'background 120ms ease',
};

const readingTranslation = {
  margin: 0,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 15,
  lineHeight: 1.8,
  color: 'var(--bc-text-secondary)',
  userSelect: 'text',
  whiteSpace: 'pre-wrap',
};

const readingFooter = {
  marginTop: 20,
  paddingTop: 14,
  borderTop: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 16,
};

const readingCanon = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const readingHint = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
};

const selPopover = {
  position: 'fixed',
  zIndex: 1100,
  background: 'var(--bc-bg-elevated)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.35)',
  borderRadius: 8,
  padding: '6px 4px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  whiteSpace: 'nowrap',
};

const selBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-primary)',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  padding: '6px 10px',
  borderRadius: 4,
};

const selDot = { color: 'var(--bc-text-tertiary)', opacity: 0.4, padding: '0 1px', userSelect: 'none' };

const navRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  paddingBottom: 14,
  marginBottom: 18,
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

const navBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '4px 8px',
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-secondary)',
  fontFamily: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
  maxWidth: '45%',
  minWidth: 0,
};

const navArrow = { color: 'var(--bc-text-tertiary)', fontSize: 11, flexShrink: 0 };
const navLabel = { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 };

const navName = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-accent)',
};

const navSubtitle = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
