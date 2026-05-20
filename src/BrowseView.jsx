import { useEffect, useMemo, useRef, useState } from 'react';
import { pathNames, collectLeaves, pathToLeaf } from './data/corpus.js';
import useCorpus from './useCorpus.js';
import usePassage from './usePassage.js';
import { SelectionActions } from './SelectionActions.jsx';
import { passageTranslationsApi } from './api.js';
import { sanitizeDictHtml } from './dictHtml.js';

const TRANSLATOR_LABEL = {
  sujato: 'Bhante Sujato',
  thanissaro: 'Thanissaro Bhikkhu',
  walshe: 'Maurice Walshe',
  ireland: 'John D. Ireland',
  olendzki: 'Andrew Olendzki',
  buddharakkhita: 'Acharya Buddharakkhita',
  nyanaponika: 'Nyanaponika Thera',
  nanamoli: 'Ñāṇamoli Thera',
  piyadassi: 'Piyadassi Thera',
  bodhi: 'Bhikkhu Bodhi',
  narada: 'Nārada Thera',
  soma: 'Soma Thera',
  nyanasatta: 'Nyanasatta Thera',
  'sister-uppalavanna': 'Sister Uppalavanna',
  'nanamoli-bodhi': 'Ñāṇamoli & Bodhi',
  horner: 'I. B. Horner',
  hare: 'E. M. Hare',
  'amaravati-sangha': 'Amaravati Sangha',
  nizamis: 'Nizamis',
  hecker: 'Hellmuth Hecker',
  vajira: 'Sister Vajira',
  kelly: 'John Kelly',
  harvey: 'Peter Harvey',
  sonadhammo: 'Sonadhammo',
  kandy: 'Kandy News-Wheel',
};

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
function SideBySideReader({ pali, english, englishIsHtml }) {
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
        {englishIsHtml ? (
          <div
            style={{ ...readingTranslation, marginBottom: 18 }}
            dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(english) }}
          />
        ) : (
          <p style={{ ...readingTranslation, marginBottom: 18 }}>{english}</p>
        )}
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

  // Multi-translator support: fetch all translations for this passage,
  // let the reader switch between Sujato (default), Thanissaro, etc.
  // The fetched list is ordered by curated position (sujato=0,
  // thanissaro=10, …); first item is the default selection.
  const [translations, setTranslations] = useState(null); // null = loading
  const [selectedTranslator, setSelectedTranslator] = useState(null);
  useEffect(() => {
    if (!passage?.id) return;
    setTranslations(null);
    setSelectedTranslator(null);
    const ac = new AbortController();
    passageTranslationsApi(passage.id, { signal: ac.signal })
      .then((r) => {
        setTranslations(r.translations || []);
        if (r.translations?.length) setSelectedTranslator(r.translations[0].translator);
      })
      .catch(() => { /* if endpoint fails, just fall back to passage.translation */ });
    return () => ac.abort();
  }, [passage?.id]);

  const activeTranslation = translations?.find((t) => t.translator === selectedTranslator);
  const translationText = activeTranslation?.text || passage.translation;
  const translationIsHtml = activeTranslation && activeTranslation.source === 'ati';

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

      {translations && translations.length > 1 && (
        <div style={translatorChipRow} aria-label="Choose translator">
          {translations.map((t) => {
            const on = t.translator === selectedTranslator;
            return (
              <button
                key={t.translator + ':' + t.source}
                onClick={() => setSelectedTranslator(t.translator)}
                style={{
                  ...translatorChip,
                  color: on ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
                  borderColor: on ? 'var(--bc-accent)' : 'rgba(var(--bc-accent-rgb), 0.18)',
                  fontWeight: on ? 600 : 400,
                }}
                title={[
                  TRANSLATOR_LABEL[t.translator] || t.translator,
                  t.source === 'ati' ? '(Access to Insight)' : '(SuttaCentral)',
                  t.copyright,
                ].filter(Boolean).join(' ')}
              >
                {TRANSLATOR_LABEL[t.translator] || t.translator}
                {t.source === 'ati' && <span style={readingAtiBadge}>ATI</span>}
              </button>
            );
          })}
        </div>
      )}

      {passage.original && translationText ? (
        <SideBySideReader
          pali={passage.original}
          english={translationText}
          englishIsHtml={translationIsHtml}
        />
      ) : (
        <>
          {passage.original && <p style={readingOriginal}>{passage.original}</p>}
          {translationText && (
            translationIsHtml
              ? <div style={readingTranslation} dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(translationText) }} />
              : <p style={readingTranslation}>{translationText}</p>
          )}
        </>
      )}

      {activeTranslation && activeTranslation.source === 'ati' && (
        <div style={attribFooter}>
          {activeTranslation.copyright || 'Access to Insight'}{' '}
          · <a href={activeTranslation.source_url} target="_blank" rel="noopener noreferrer" style={attribLink}>
            CC BY-NC 4.0 · accesstoinsight.org
          </a>
          {activeTranslation.notes && <span style={attribNotes}> · {activeTranslation.notes}</span>}
        </div>
      )}

      <footer style={readingFooter}>
        <span style={readingCanon}>{passage.canon}</span>
        <span style={readingHint}>Select any word for actions.</span>
      </footer>

      <SelectionActions
        containerRef={ref}
        onSearch={onSearchTerm}
        onCompare={onCompareTerm}
      />
    </article>
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

const translatorChipRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginBottom: 18,
  paddingBottom: 12,
  borderBottom: '1px dashed rgba(var(--bc-accent-rgb), 0.12)',
};

const translatorChip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  background: 'transparent',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  borderRadius: 999,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'color 100ms ease, border-color 100ms ease',
};

const readingAtiBadge = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.10em',
  padding: '1px 5px',
  borderRadius: 3,
  border: '1px solid rgba(var(--bc-accent-rgb), 0.40)',
  color: 'var(--bc-accent)',
  textTransform: 'uppercase',
  fontFamily: 'Outfit, system-ui, sans-serif',
};

const attribFooter = {
  marginTop: 12,
  padding: '6px 10px',
  borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.18)',
  fontSize: 11,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  lineHeight: 1.5,
};

const attribLink = {
  color: 'var(--bc-text-tertiary)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

const attribNotes = {
  color: 'var(--bc-text-tertiary)',
};

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
