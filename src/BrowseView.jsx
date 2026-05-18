import { useEffect, useMemo, useRef, useState } from 'react';
import { pathNames, collectLeaves, pathToLeaf } from './data/corpus.js';
import useCorpus from './useCorpus.js';
import usePassage from './usePassage.js';

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

  const columns = useMemo(() => {
    if (tree.length === 0) return [];
    const out = [tree];
    let level = tree;
    for (const id of path) {
      const node = level.find((n) => n.id === id);
      if (!node) break;
      if (node.children?.length) {
        level = node.children;
        out.push(level);
      } else {
        break;
      }
    }
    return out;
  }, [path, tree]);

  function selectAt(columnIndex, node) {
    if (node.stub) return; // can't drill into stubs
    if (node.passageId) {
      setLeafId(node.id);
      return;
    }
    if (node.children?.length) {
      setPath([...path.slice(0, columnIndex), node.id]);
      setLeafId(null);
    }
  }

  useEffect(() => {
    const el = columnsScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    });
  }, [columns.length]);

  const crumb = pathNames(tree, path);

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
                const newPath = pathToLeaf(tree, id);
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
                const newPath = pathToLeaf(tree, id);
                if (newPath) setPath(newPath);
                setLeafId(id);
              }}
              onSearchTerm={onSearchTerm}
              onCompareTerm={onCompareTerm}
            />
          </section>
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
          <div style={columnsRow}>
            {columns.map((col, ci) => {
              const selectedId = path[ci] ?? null;
              const isNewest = ci === columns.length - 1 && ci > 0;
              return (
                <div key={ci} style={column} className={isNewest ? 'dhamma-col-new' : undefined}>
                  {col.map((node) => {
                    const isSelected = node.id === selectedId || node.id === leafId;
                    const isStub = !!node.stub;
                    const isLeaf = !!node.passageId;
                    return (
                      <button
                        key={node.id}
                        onClick={() => selectAt(ci, node)}
                        disabled={isStub}
                        style={{
                          ...row,
                          color: isSelected
                            ? 'var(--bc-accent)'
                            : isStub
                              ? 'var(--bc-text-tertiary)'
                              : 'var(--bc-text-primary)',
                          opacity: isStub ? 0.5 : 1,
                          background: isSelected ? 'rgba(var(--bc-accent-rgb), 0.06)' : 'transparent',
                          cursor: isStub ? 'default' : 'pointer',
                        }}
                      >
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                          <span style={rowName}>{node.name}</span>
                          {node.subtitle && (
                            <span style={rowSubtitle}>{node.subtitle}</span>
                          )}
                        </span>
                        {!isStub && !isLeaf && (
                          <span style={chev} aria-hidden="true">›</span>
                        )}
                        {isLeaf && (
                          <span style={leafDot} aria-hidden="true">•</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {selectedLoading && (
          <div style={hintRow}>
            <p style={hint}>Loading passage…</p>
          </div>
        )}

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
              const newPath = pathToLeaf(tree, id);
              if (newPath) setPath(newPath);
              setLeafId(id);
            }}
            onSearchTerm={onSearchTerm}
            onCompareTerm={onCompareTerm}
          />
        )}

        {!selectedLoading && !selectedPassage && !leafId && !corpusLoading && (
          <div style={hintRow}>
            <p style={hint}>
              Click through the columns to drill into the canon. Select a leaf{' '}
              <span style={{ color: 'var(--bc-accent)' }}>•</span> to open its passage below.
            </p>
          </div>
        )}

        {corpusLoading && tree.length === 0 && (
          <div style={hintRow}>
            <p style={hint}>Loading corpus…</p>
          </div>
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

  return (
    <article ref={ref} style={compact ? { ...reading, padding: '12px 0 8px' } : reading}>
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

      {passage.original && <p style={readingOriginal}>{passage.original}</p>}
      {passage.translation && <p style={readingTranslation}>{passage.translation}</p>}

      <footer style={readingFooter}>
        <span style={readingCanon}>{passage.canon}</span>
        <span style={readingHint}>Select any word for actions.</span>
      </footer>

      {sel && (
        <div
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
          <button
            disabled
            title="Dictionary lookup ships with corpus ingest (PED, BHS, DDB)"
            style={{ ...selBtn, opacity: 0.35, cursor: 'default' }}
          >
            Dictionary
          </button>
        </div>
      )}
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
  overflowX: 'auto',
  scrollBehavior: 'smooth',
  borderTop: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  maskImage: 'linear-gradient(to right, black, black calc(100% - 24px), transparent)',
  WebkitMaskImage: 'linear-gradient(to right, black, black calc(100% - 24px), transparent)',
};

const columnAnimCss = `
  @keyframes dhammaColSlide {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .dhamma-col-new {
    animation: dhammaColSlide 220ms ease-out;
  }
`;

const columnsRow = { display: 'flex', minHeight: 280, maxHeight: 420 };

const column = {
  minWidth: 240,
  maxWidth: 280,
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid rgba(var(--bc-accent-rgb), 0.10)',
  padding: '8px 0',
  overflowY: 'auto',
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

const chev = { color: 'var(--bc-text-tertiary)', fontSize: 16, marginTop: 1, flexShrink: 0 };
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
