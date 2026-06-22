// Shared selection-actions popover. When the user highlights text inside
// a scoped container, a floating bar appears offering: Search, Compare,
// Copy, Dictionary. Dictionary opens an inline LookupPanel popover with
// the multi-source result; Search and Compare fire callbacks that the
// host view wires up to switch tabs.
//
// Extracted from BrowseView's ReadingPanel so it can be mounted in
// DictionaryView, SearchView, and CompareView too. Pass `hide=['lookup']`
// inside DictionaryView so the button doesn't redundantly point at the
// page the user is already on.

import { useEffect, useRef, useState } from 'react';
import { lookupApi } from './api.js';
import {
  prepareDppnHtml, preparePedHtml, sanitizeDictHtml,
  groupEntriesBySource, SOURCE_LABEL,
} from './dictHtml.js';
import { rangeToSegmentRange } from './browse/segments.js';

const HTML_PREPARERS = { dppn: prepareDppnHtml, ped: preparePedHtml };
const HTML_POPOVER_COLLAPSE_THRESHOLD = 400;
// Longest selection the popover will surface. Short for dictionary
// lookups (single words / short phrases) but generous enough to
// cover a whole sutta sentence for a Note.
const MAX_SELECTION_LENGTH = 600;
// Dictionary action only makes sense for short selections that could
// be a single headword. Longer selections still get Note / Search /
// Compare / Copy.
const DICTIONARY_MAX_LENGTH = 80;

export function SelectionActions({
  containerRef,
  scopeSelector,
  hide = [],
  onSearch,
  onCompare,
  onNote,
}) {
  const [sel, setSel] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lookup, setLookup] = useState(null);
  const [noteDraft, setNoteDraft] = useState(null);

  useEffect(() => {
    function onSelChange() {
      const s = window.getSelection();
      if (!s || s.isCollapsed) { setSel(null); return; }
      const text = s.toString().trim();
      if (!text || text.length > MAX_SELECTION_LENGTH) { setSel(null); return; }
      const range = s.getRangeAt(0);
      // Scope to an explicit ref when given, else fall back to a selector query
      // (lets ref-less hosts like the Research/Exploration readers reuse this).
      const container = containerRef?.current
        || (scopeSelector && typeof document !== 'undefined' ? document.querySelector(scopeSelector) : null);
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setSel(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      // Resolve to a segment range when the selection is inside a
      // segment-rendered passage; null otherwise (CST, library,
      // pre-segmented content). The Note editor uses this to decide
      // whether to record a precise range or a whole-passage note.
      const segmentRange = rangeToSegmentRange(range);
      setSel({ text, x: rect.left + rect.width / 2, y: rect.top, segmentRange });
      setCopied(false);
    }
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, [containerRef, scopeSelector]);

  function clearSelection() {
    setSel(null);
    window.getSelection()?.removeAllRanges();
  }

  // Escape dismisses the selection popover (parallels the lookup panel +
  // note editor, so a keyboard user can always back out of the bar).
  useEffect(() => {
    if (!sel) return;
    function onKey(e) { if (e.key === 'Escape') clearSelection(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sel]);

  function doSearch() { if (sel?.text) onSearch?.(sel.text); clearSelection(); }
  function doCompare() { if (sel?.text) onCompare?.(sel.text); clearSelection(); }
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

  function doNote() {
    if (!sel || !onNote) return;
    const draft = {
      text: sel.text,
      pos: { x: sel.x, y: sel.y },
      segmentRange: sel.segmentRange || null,
    };
    setNoteDraft(draft);
    clearSelection();
  }

  // Close the lookup popover on outside click / Escape.
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

  const showSearch  = !hide.includes('search')  && !!onSearch;
  const showCompare = !hide.includes('compare') && !!onCompare;
  const showCopy    = !hide.includes('copy');
  const showLookup  = !hide.includes('lookup') && (sel ? sel.text.length <= DICTIONARY_MAX_LENGTH : false);
  const showNote    = !hide.includes('note')    && !!onNote;

  // Interleave separator dots between the visible buttons only — drives
  // off a small array so the markup adapts cleanly to whichever subset
  // is enabled.
  const items = [];
  if (showSearch)  items.push(<button key="s" onClick={doSearch}  style={selBtn}>Search</button>);
  if (showCompare) items.push(<button key="c" onClick={doCompare} style={selBtn}>Compare</button>);
  if (showCopy)    items.push(<button key="p" onClick={doCopy}    style={selBtn}>{copied ? 'Copied' : 'Copy'}</button>);
  if (showLookup)  items.push(
    <button key="d" onClick={doLookup} style={selBtn} title="Look up in dictionary (DPD + DPPN + PED)">
      Dictionary
    </button>
  );
  if (showNote)    items.push(
    <button key="n" onClick={doNote} style={selBtn} title="Take a note on this passage">
      Note
    </button>
  );

  return (
    <>
      {sel && items.length > 0 && (
        <div
          data-sel-popover
          role="toolbar"
          aria-label="Selection actions"
          style={{
            ...selPopover,
            top: Math.max(8, sel.y - 50),
            left: sel.x,
            transform: 'translateX(-50%)',
          }}
        >
          {items.flatMap((el, i) => i === 0 ? [el] : [<span key={'d' + i} style={selDot}>·</span>, el])}
        </div>
      )}
      {lookup && <LookupPanel lookup={lookup} onClose={() => setLookup(null)} />}
      {noteDraft && (
        <NoteEditor
          draft={noteDraft}
          onSave={(text) => {
            onNote?.({
              excerpt: noteDraft.text,
              segmentRange: noteDraft.segmentRange,
              text,
            });
            setNoteDraft(null);
          }}
          onCancel={() => setNoteDraft(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────── NoteEditor ───────────────────────────────

function NoteEditor({ draft, onSave, onCancel }) {
  const [text, setText] = useState('');
  const taRef = useRef(null);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  // Cmd/Ctrl+Enter saves; Escape cancels. Keeps the editor keyboard-
  // first since note-taking is a typing workflow.
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (text.trim()) onSave?.(text.trim());
    }
  }

  // Same positioning approach as LookupPanel: clamp horizontally,
  // flip above the selection when there's no room below.
  const { pos, text: excerpt, segmentRange } = draft;
  const left = Math.max(220, Math.min((pos?.x || 200), (typeof window !== 'undefined' ? window.innerWidth - 220 : 1000)));
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const selY = pos?.y || 60;
  const spaceBelow = vh - selY;
  const spaceAbove = selY;
  const GAP = 14;
  const flipUp = spaceBelow < 360 && spaceAbove > spaceBelow;
  const positionStyle = flipUp
    ? { bottom: vh - selY + GAP, maxHeight: `min(70vh, ${Math.max(200, spaceAbove - GAP - 12)}px)` }
    : { top: Math.max(60, selY + GAP), maxHeight: `min(70vh, ${Math.max(200, spaceBelow - GAP - 12)}px)` };

  return (
    <div data-note-editor role="dialog" aria-label="New note" style={{ ...noteEditorPanel, ...positionStyle, left, transform: 'translateX(-50%)' }}>
      <header style={noteEditorHeader}>
        <span style={noteEditorLabel}>
          New note
          {segmentRange && (
            <span style={noteEditorRangeHint}>
              &nbsp;· segments {segmentRange.startKey}
              {segmentRange.endKey !== segmentRange.startKey ? `–${segmentRange.endKey}` : ''}
            </span>
          )}
        </span>
        <button onClick={onCancel} style={lookupClose} aria-label="Close">×</button>
      </header>
      <blockquote style={noteEditorExcerpt}>{excerpt}</blockquote>
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Note (Cmd/Ctrl+Enter to save, Esc to cancel)"
        rows={5}
        style={noteEditorTextarea}
      />
      <footer style={noteEditorFooter}>
        <button onClick={onCancel} style={noteEditorBtn}>Cancel</button>
        <button
          onClick={() => { if (text.trim()) onSave?.(text.trim()); }}
          style={{ ...noteEditorBtn, ...noteEditorBtnPrimary, opacity: text.trim() ? 1 : 0.5 }}
          disabled={!text.trim()}
        >
          Save
        </button>
      </footer>
    </div>
  );
}

// ─────────────────────────────── LookupPanel ───────────────────────────────

export function LookupPanel({ lookup, onClose }) {
  const { term, pos, entries, loading, error, matchedVia } = lookup;
  // Center horizontally on the original selection x; clamp to viewport.
  const left = Math.max(160, Math.min((pos?.x || 200), (typeof window !== 'undefined' ? window.innerWidth - 160 : 1000)));

  // Flip the panel above the selection when there isn't enough room
  // below. Without this, selections near the bottom of the viewport
  // push the panel off-screen.
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
    <div data-lookup-panel role="dialog" aria-label={`Dictionary lookup: ${term}`} style={{ ...lookupPanel, ...positionStyle, left, transform: 'translateX(-50%)' }}>
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
      <div style={lookupSource}>DPD · DPPN · PED — see Dictionary page for full attribution</div>
    </div>
  );
}

function LookupEntry({ entry: e }) {
  const [expanded, setExpanded] = useState(false);
  const prepare = HTML_PREPARERS[e.source];
  if (prepare) {
    const long = (e.definition || '').length > HTML_POPOVER_COLLAPSE_THRESHOLD;
    return (
      <article style={lookupEntry}>
        <header style={lookupEntryHeader}>
          <span style={lookupEntryLemma}>{e.source_id || e.lemma}</span>
        </header>
        <div
          style={{ ...lookupDefinition, ...(long && !expanded ? lookupClampedDppn : null) }}
          dangerouslySetInnerHTML={{ __html: prepare(e.definition) }}
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
        <blockquote
          style={lookupExample}
          dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(e.example) }}
        />
      )}
    </article>
  );
}

// ─────────────────────────────── styles ───────────────────────────────

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
  borderBottom: '1px solid rgba(var(--bc-border-rgb),0.05)',
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
  background: 'rgba(var(--bc-border-rgb),0.03)',
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

const lookupGroup = { marginBottom: 8 };

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

// NoteEditor panel — visually parallel to LookupPanel but
// persistent (no outside-click close) and with a textarea + save/
// cancel footer. Used inline by SelectionActions when the user
// clicks "Note" on a selection.
const noteEditorPanel = {
  position: 'fixed',
  zIndex: 1200,
  width: 'min(520px, 92vw)',
  background: 'var(--bc-bg-elevated)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.35)',
  borderRadius: 10,
  boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
  fontFamily: '"Noto Serif", Georgia, serif',
  display: 'flex',
  flexDirection: 'column',
};

const noteEditorHeader = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  padding: '12px 16px 8px',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.20)',
};

const noteEditorLabel = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
  fontFamily: 'Outfit, system-ui, sans-serif',
};

const noteEditorRangeHint = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontWeight: 400,
  letterSpacing: 'normal',
  textTransform: 'none',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
};

const noteEditorExcerpt = {
  margin: '12px 16px 0',
  padding: '8px 12px',
  borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.45)',
  background: 'rgba(var(--bc-border-rgb),0.03)',
  fontSize: 13,
  fontStyle: 'italic',
  lineHeight: 1.5,
  color: 'var(--bc-text-secondary)',
  maxHeight: 160,
  overflowY: 'auto',
};

const noteEditorTextarea = {
  margin: '12px 16px 0',
  padding: '10px 12px',
  background: 'var(--bc-bg-surface)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.20)',
  borderRadius: 6,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 14,
  lineHeight: 1.55,
  color: 'var(--bc-text-primary)',
  resize: 'vertical',
  minHeight: 100,
  outline: 'none',
};

const noteEditorFooter = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '12px 16px',
};

const noteEditorBtn = {
  padding: '7px 14px',
  background: 'transparent',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.25)',
  borderRadius: 6,
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--bc-text-primary)',
  cursor: 'pointer',
};

const noteEditorBtnPrimary = {
  background: 'var(--bc-accent)',
  borderColor: 'var(--bc-accent)',
  color: 'var(--bc-accent-text)',
  fontWeight: 600,
};
