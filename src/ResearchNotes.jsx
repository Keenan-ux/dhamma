// Inline research notes: an admin-only layer for the Research + Explorations
// studies. Select any word or sentence in an open study, choose "Add note", and
// jot a private annotation. Notes are visible only to the operator and to Claude
// (the kind is admin-gated server-side and this layer mounts only for admins, so
// nothing leaks on the PUBLIC explorations pages). The point is a tight reading
// loop: the operator annotates while reading; Claude reads the notes back from
// the database and responds, with no copy-paste between the site and the chat.
//
// Self-contained: its own selection popover + editor + side panel, plus a
// best-effort persistent highlight of noted text via the CSS Custom Highlight
// API (graceful no-op where unsupported; the panel is the reliable surface).

import { useEffect, useRef, useState } from 'react';
import useResearchNotes from './useResearchNotes.js';
import { lookupApi } from './api.js';
import { LookupPanel } from './SelectionActions.jsx';

// Dictionary action only makes sense for short selections (a single Pali
// headword or short phrase), matching the main reader's popover.
const LOOKUP_MAX = 80;

const MAX_SEL = 600;
const HL_NAME = 'research-note';

function articleEl() {
  return typeof document !== 'undefined' ? document.querySelector('[data-scroll-root] article') : null;
}

// The section (<h2>) the selection sits under: the last heading whose top is at
// or above the selection. Headings are in document order, so iterate and stop.
function headingForRange(range) {
  const art = articleEl();
  if (!art) return { heading: '', headingId: '' };
  const hs = Array.prototype.slice.call(art.querySelectorAll('h2'));
  if (!hs.length) return { heading: '', headingId: '' };
  const top = range.getBoundingClientRect().top;
  let best = hs[0];
  for (const h of hs) { if (h.getBoundingClientRect().top - 1 <= top) best = h; else break; }
  return { heading: (best.textContent || '').trim().slice(0, 90), headingId: best.id || '' };
}

// Build a DOM Range spanning the first occurrence of `needle` across the
// article's text nodes (so a quote crossing <em>/<a> still highlights).
// Best-effort: returns null if whitespace differences keep it from matching.
function buildRange(root, needle) {
  if (!root || !needle || needle.length < 3) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let full = '';
  const segs = [];
  let n;
  while ((n = walker.nextNode())) { segs.push({ node: n, start: full.length }); full += (n.nodeValue || ''); }
  const idx = full.indexOf(needle);
  if (idx < 0) return null;
  const end = idx + needle.length;
  let s = null;
  let e = null;
  for (const seg of segs) {
    const segEnd = seg.start + (seg.node.nodeValue || '').length;
    if (s === null && idx >= seg.start && idx < segEnd) s = { node: seg.node, off: idx - seg.start };
    if (e === null && end > seg.start && end <= segEnd) { e = { node: seg.node, off: end - seg.start }; break; }
  }
  if (!s || !e) return null;
  try { const r = document.createRange(); r.setStart(s.node, s.off); r.setEnd(e.node, e.off); return r; } catch { return null; }
}

export default function ResearchNotes({ collection, slug, studyTitle }) {
  const { create, remove, update, forStudy } = useResearchNotes();
  const [sel, setSel] = useState(null);
  const [draft, setDraft] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [lookup, setLookup] = useState(null);
  const studyNotes = forStudy(collection, slug);

  // Surface "Add note" when text is selected inside the open study's article.
  useEffect(() => {
    function onSel() {
      const s = window.getSelection();
      if (!s || s.isCollapsed) { setSel(null); return; }
      const text = s.toString().trim();
      if (!text || text.length > MAX_SEL) { setSel(null); return; }
      let range;
      try { range = s.getRangeAt(0); } catch { setSel(null); return; }
      const art = articleEl();
      if (!art || !art.contains(range.commonAncestorContainer)) { setSel(null); return; }
      const rect = range.getBoundingClientRect();
      const { heading, headingId } = headingForRange(range);
      setSel({ text, x: rect.left + rect.width / 2, y: rect.top, heading, headingId });
    }
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [collection, slug]);

  // Best-effort persistent highlight of noted excerpts.
  useEffect(() => {
    if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return undefined;
    let cancelled = false;
    const apply = () => {
      if (cancelled) return;
      try { CSS.highlights.delete(HL_NAME); } catch { /* */ }
      const art = articleEl();
      if (!art || !studyNotes.length) return;
      const ranges = [];
      for (const nte of studyNotes) { const r = buildRange(art, nte.excerpt); if (r) ranges.push(r); }
      if (ranges.length) { try { CSS.highlights.set(HL_NAME, new Highlight(...ranges)); } catch { /* */ } }
    };
    const raf = requestAnimationFrame(apply);
    const t = setTimeout(apply, 650); // the study loads its data async; retry once
    return () => {
      cancelled = true; cancelAnimationFrame(raf); clearTimeout(t);
      try { CSS.highlights.delete(HL_NAME); } catch { /* */ }
    };
  }, [studyNotes, collection, slug]);

  function clearSel() {
    setSel(null);
    try { window.getSelection()?.removeAllRanges(); } catch { /* */ }
  }

  function openDraft() {
    if (!sel) return;
    setDraft({ excerpt: sel.text, heading: sel.heading, headingId: sel.headingId, x: sel.x, y: sel.y });
    clearSel();
  }

  // Dictionary lookup on the selection, the same multi-source popover the main
  // reader uses (DPD + DPPN + PED), so a Pali term in a study resolves in place.
  async function doLookup() {
    const term = sel?.text;
    const pos = sel ? { x: sel.x, y: sel.y } : null;
    if (!term || !pos) return;
    setLookup({ term, pos, entries: null, loading: true, error: null });
    clearSel();
    try {
      const r = await lookupApi({ term });
      setLookup({ term, pos, entries: r.entries || [], loading: false, error: null, matchedVia: r.matched_via });
    } catch (err) {
      setLookup({ term, pos, entries: [], loading: false, error: err.message });
    }
  }

  // Close the lookup popover on Escape / outside click.
  useEffect(() => {
    if (!lookup) return;
    function onKey(e) { if (e.key === 'Escape') setLookup(null); }
    function onDown(e) {
      if (e.target.closest('[data-lookup-panel]') || e.target.closest('[data-rn-popover]')) return;
      setLookup(null);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [lookup]);

  function saveDraft(body) {
    if (!draft || !body.trim()) return;
    create({
      collection, slug, studyTitle,
      heading: draft.heading, headingId: draft.headingId,
      excerpt: draft.excerpt, text: body.trim(),
    });
    setDraft(null);
    setPanelOpen(true);
  }

  function jump(headingId) {
    if (!headingId) return;
    const el = document.getElementById(headingId);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <style>{`::highlight(${HL_NAME}){ background-color: rgba(var(--bc-accent-rgb),0.22); color: inherit; }`}</style>

      {sel && (
        <div data-rn-popover role="toolbar" aria-label="Note actions"
          style={{ ...popover, top: Math.max(8, sel.y - 46), left: sel.x, transform: 'translateX(-50%)' }}>
          <button onClick={openDraft} style={popBtn} title="Take a private note on this selection">✎ Add note</button>
          {sel.text.length <= LOOKUP_MAX && (
            <>
              <span style={popDot}>·</span>
              <button onClick={doLookup} style={popBtn} title="Look up in dictionary (DPD + DPPN + PED)">📖 Define</button>
            </>
          )}
        </div>
      )}

      {draft && <NoteEditor draft={draft} onSave={saveDraft} onCancel={() => setDraft(null)} />}
      {lookup && <LookupPanel lookup={lookup} onClose={() => setLookup(null)} />}

      <button onClick={() => setPanelOpen((o) => !o)} style={fab} aria-expanded={panelOpen}
        title="Your private research notes (only you and Claude can see these)">
        ✎ Notes{studyNotes.length ? ` · ${studyNotes.length}` : ''}
      </button>

      {panelOpen && (
        <div style={panel} role="dialog" aria-label="Research notes">
          <header style={panelHead}>
            <span style={panelTitle}>Notes · this study</span>
            <button onClick={() => setPanelOpen(false)} style={panelClose} aria-label="Close">×</button>
          </header>
          <div style={panelBody}>
            {!studyNotes.length && (
              <p style={panelEmpty}>
                Select any text in the study and choose “Add note”. Notes are private to you and Claude,
                and follow you across devices.
              </p>
            )}
            {studyNotes.map((nte) => (
              <div key={nte.id} style={{ ...noteRow, opacity: nte.status === 'answered' ? 0.62 : 1 }}>
                <blockquote
                  style={{ ...noteQuote, cursor: nte.headingId ? 'pointer' : 'default' }}
                  onClick={() => jump(nte.headingId)}
                  title={nte.headingId ? `Jump to “${nte.heading}”` : undefined}
                >
                  {nte.excerpt}
                </blockquote>
                <p style={noteText}>{nte.text}</p>
                <div style={noteMeta}>
                  {nte.heading && <span style={noteHeading}>{nte.heading}</span>}
                  <span style={{ flex: 1 }} />
                  <button
                    onClick={() => update(nte.id, { status: nte.status === 'answered' ? 'open' : 'answered' })}
                    style={noteMetaBtn}
                    title={nte.status === 'answered' ? 'Mark open' : 'Mark answered'}
                  >
                    {nte.status === 'answered' ? '↺ reopen' : '✓ answered'}
                  </button>
                  <button onClick={() => remove(nte.id)} style={noteMetaBtn} title="Delete note">delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function NoteEditor({ draft, onSave, onCancel }) {
  const [text, setText] = useState('');
  const taRef = useRef(null);
  useEffect(() => { taRef.current?.focus(); }, []);

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); onCancel?.(); }
    else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (text.trim()) onSave?.(text); }
  }

  const left = Math.max(220, Math.min((draft.x || 200), (typeof window !== 'undefined' ? window.innerWidth - 220 : 1000)));
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const selY = draft.y || 60;
  const spaceBelow = vh - selY;
  const flipUp = spaceBelow < 340 && selY > spaceBelow;
  const positionStyle = flipUp
    ? { bottom: vh - selY + 14 }
    : { top: Math.max(60, selY + 14) };

  return (
    <div data-rn-editor role="dialog" aria-label="New research note"
      style={{ ...editor, ...positionStyle, left, transform: 'translateX(-50%)' }}>
      <header style={editorHead}>
        <span style={editorLabel}>New note{draft.heading ? ` · ${draft.heading}` : ''}</span>
        <button onClick={onCancel} style={panelClose} aria-label="Close">×</button>
      </header>
      <blockquote style={editorExcerpt}>{draft.excerpt}</blockquote>
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Note for Claude (Cmd/Ctrl+Enter to save, Esc to cancel)"
        rows={5}
        style={editorTextarea}
      />
      <footer style={editorFooter}>
        <button onClick={onCancel} style={editorBtn}>Cancel</button>
        <button
          onClick={() => { if (text.trim()) onSave?.(text); }}
          style={{ ...editorBtn, ...editorBtnPrimary, opacity: text.trim() ? 1 : 0.5 }}
          disabled={!text.trim()}
        >
          Save
        </button>
      </footer>
    </div>
  );
}

// ─────────────────────────────── styles ───────────────────────────────

const popover = {
  position: 'fixed', zIndex: 1100,
  background: 'var(--bc-bg-elevated)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.35)',
  borderRadius: 8, padding: '4px', boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
  whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 0,
};
const popBtn = {
  background: 'transparent', border: 'none', color: 'var(--bc-text-primary)',
  fontFamily: 'Outfit, system-ui, sans-serif', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', padding: '6px 12px', borderRadius: 4,
};
const popDot = { color: 'var(--bc-text-tertiary)', opacity: 0.4, padding: '0 1px', userSelect: 'none' };

const fab = {
  position: 'fixed', right: 16, bottom: 16, zIndex: 40,
  background: 'var(--bc-bg-elevated)', color: 'var(--bc-text-primary)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.35)', borderRadius: 999,
  padding: '8px 14px', fontFamily: 'Outfit, system-ui, sans-serif', fontSize: 12.5,
  fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
};

const panel = {
  position: 'fixed', right: 16, bottom: 60, zIndex: 1150,
  width: 'min(360px, 92vw)', maxHeight: '64vh', display: 'flex', flexDirection: 'column',
  background: 'var(--bc-bg-elevated)', border: '1px solid rgba(var(--bc-accent-rgb), 0.30)',
  borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.55)', overflow: 'hidden',
};
const panelHead = {
  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
  padding: '11px 14px 8px', borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.20)',
};
const panelTitle = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'var(--bc-accent)', fontFamily: 'Outfit, system-ui, sans-serif',
};
const panelClose = {
  background: 'transparent', border: 'none', color: 'var(--bc-text-tertiary)',
  fontSize: 22, cursor: 'pointer', padding: '0 4px', marginLeft: 'auto', lineHeight: 1,
};
const panelBody = { padding: '6px 14px 12px', overflowY: 'auto' };
const panelEmpty = { fontSize: 12.5, fontStyle: 'italic', color: 'var(--bc-text-tertiary)', lineHeight: 1.6, margin: '8px 0' };

const noteRow = { padding: '10px 0', borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.10)' };
const noteQuote = {
  margin: '0 0 6px', padding: '4px 0 4px 10px', borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.45)',
  fontFamily: '"Noto Serif", Georgia, serif', fontSize: 12.5, fontStyle: 'italic',
  lineHeight: 1.5, color: 'var(--bc-text-secondary)',
};
const noteText = {
  margin: '0 0 6px', fontFamily: 'Outfit, system-ui, sans-serif', fontSize: 13.5,
  lineHeight: 1.55, color: 'var(--bc-text-primary)', whiteSpace: 'pre-wrap',
};
const noteMeta = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 };
const noteHeading = { color: 'var(--bc-text-tertiary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 };
const noteMetaBtn = {
  background: 'transparent', border: 'none', color: 'var(--bc-text-tertiary)',
  fontFamily: 'Outfit, system-ui, sans-serif', fontSize: 11, cursor: 'pointer', padding: '2px 4px',
};

const editor = {
  position: 'fixed', zIndex: 1200, width: 'min(460px, 92vw)', display: 'flex', flexDirection: 'column',
  background: 'var(--bc-bg-elevated)', border: '1px solid rgba(var(--bc-accent-rgb), 0.35)',
  borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
};
const editorHead = {
  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
  padding: '11px 14px 8px', borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.20)',
};
const editorLabel = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--bc-accent)', fontFamily: 'Outfit, system-ui, sans-serif',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%',
};
const editorExcerpt = {
  margin: '10px 14px 0', padding: '7px 11px', borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.45)',
  background: 'rgba(var(--bc-border-rgb),0.04)', fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--bc-text-secondary)',
  maxHeight: 140, overflowY: 'auto',
};
const editorTextarea = {
  margin: '10px 14px 0', padding: '9px 11px', background: 'var(--bc-bg-surface)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.20)', borderRadius: 6,
  fontFamily: 'Outfit, system-ui, sans-serif', fontSize: 14, lineHeight: 1.55,
  color: 'var(--bc-text-primary)', resize: 'vertical', minHeight: 90, outline: 'none',
};
const editorFooter = { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 14px' };
const editorBtn = {
  padding: '7px 14px', background: 'transparent', border: '1px solid rgba(var(--bc-accent-rgb), 0.25)',
  borderRadius: 6, fontFamily: 'Outfit, system-ui, sans-serif', fontSize: 12, fontWeight: 500,
  color: 'var(--bc-text-primary)', cursor: 'pointer',
};
const editorBtnPrimary = { background: 'var(--bc-accent)', borderColor: 'var(--bc-accent)', color: 'var(--bc-accent-text)', fontWeight: 600 };
