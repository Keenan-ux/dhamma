// Personal annotations index. Lists every note across the corpus,
// grouped by passage, newest-first. Clicking a note jumps to the
// passage reader at the noted segment.
//
// Storage is localStorage via useNotes. No server involvement.
// Matches the Bookmarks tab pattern.

import { useMemo, useState } from 'react';
import useNotes from './useNotes.js';
import { isModifiedClick } from './linkHelpers.js';

export default function NotesView({ onOpenPassage }) {
  const { notes, remove } = useNotes();
  const [filter, setFilter] = useState('');

  // Group notes by passage so the index reads as "DN 22 (3 notes), SN
  // 36.2 (1 note), …" rather than a flat dump that loses the
  // passage-level grouping a scholar usually thinks in.
  const grouped = useMemo(() => {
    const byPassage = new Map();
    const q = filter.trim().toLowerCase();
    for (const n of notes) {
      if (q) {
        const blob = `${n.citation || ''} ${n.title || ''} ${n.title_en || ''} ${n.excerpt || ''} ${n.text || ''}`.toLowerCase();
        if (!blob.includes(q)) continue;
      }
      const key = n.passageId;
      if (!byPassage.has(key)) byPassage.set(key, []);
      byPassage.get(key).push(n);
    }
    // Sort groups by recency of their most recent note.
    return [...byPassage.entries()]
      .map(([passageId, list]) => ({
        passageId,
        citation: list[0].citation,
        title: list[0].title,
        title_en: list[0].title_en,
        work: list[0].work,
        notes: list,
        mostRecent: Math.max(...list.map((n) => n.updatedAt || n.createdAt || 0)),
      }))
      .sort((a, b) => b.mostRecent - a.mostRecent);
  }, [notes, filter]);

  function openAt(passageId, startKey) {
    const href = startKey
      ? `#/read/${encodeURIComponent(passageId)}?focus=${encodeURIComponent(startKey)}`
      : `#/read/${encodeURIComponent(passageId)}`;
    onOpenPassage?.(passageId, startKey, href);
  }

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <div style={pageColumn}>
        <header style={pageHeader}>
          <div style={rule} />
          <h1 style={pageTitle}>Notes</h1>
          <p style={pageSubtitle}>
            {notes.length === 0
              ? 'No notes yet. Select text in any passage reader and pick "Note" to start.'
              : `${notes.length.toLocaleString()} note${notes.length === 1 ? '' : 's'} across ${grouped.length} passage${grouped.length === 1 ? '' : 's'}`}
          </p>
          <div style={rule} />
        </header>

        {notes.length > 0 && (
          <div style={filterRow}>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by citation, title, or text…"
              style={filterInput}
            />
          </div>
        )}

        <div style={groupsWrap}>
          {grouped.map((g) => (
            <section key={g.passageId} style={passageGroup}>
              <a
                href={`#/read/${encodeURIComponent(g.passageId)}`}
                onClick={(e) => {
                  if (isModifiedClick(e)) return;
                  e.preventDefault();
                  openAt(g.passageId, null);
                }}
                style={passageGroupHeader}
              >
                <span style={passageCitation}>{g.citation}</span>
                <span style={passageTitle}>
                  {g.title && <span>{g.title}</span>}
                  {g.title && g.title_en && <span> · </span>}
                  {g.title_en && <em>{g.title_en}</em>}
                  {(g.title || g.title_en) && g.work && <span> · {g.work}</span>}
                  {!g.title && !g.title_en && g.work && <span>{g.work}</span>}
                </span>
              </a>
              <ul style={noteList}>
                {g.notes.map((n) => (
                  <li key={n.id} style={noteItem}>
                    <a
                      href={n.startKey
                        ? `#/read/${encodeURIComponent(g.passageId)}?focus=${encodeURIComponent(n.startKey)}`
                        : `#/read/${encodeURIComponent(g.passageId)}`}
                      onClick={(e) => {
                        if (isModifiedClick(e)) return;
                        e.preventDefault();
                        openAt(g.passageId, n.startKey);
                      }}
                      style={noteItemLink}
                    >
                      {n.startKey && (
                        <span style={noteRangeLabel}>
                          §{n.startKey}{n.endKey && n.endKey !== n.startKey ? `–${n.endKey}` : ''}
                        </span>
                      )}
                      {n.excerpt && (
                        <blockquote style={noteExcerpt}>{truncate(n.excerpt, 220)}</blockquote>
                      )}
                      <p style={noteText}>{n.text}</p>
                      <p style={noteMeta}>{new Date(n.updatedAt || n.createdAt).toLocaleString()}</p>
                    </a>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this note? This cannot be undone.')) remove(n.id);
                      }}
                      style={noteDeleteBtn}
                      aria-label="Delete note"
                      title="Delete this note"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer style={footerWrap}>
          <div style={rule} />
          <p style={attribution}>
            Notes are stored in this browser only. They aren't synced
            to any server. Clearing site data deletes them.
          </p>
        </footer>
      </div>
    </div>
  );
}

function truncate(s, n) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n).trimEnd() + '…';
}

const SERIF = '"Noto Serif", Georgia, serif';
const SANS = 'Outfit, system-ui, sans-serif';

const scrollWrap = {
  position: 'absolute',
  inset: 0,
  overflow: 'auto',
  paddingTop: 56,
};

const pageColumn = {
  maxWidth: 1100,
  margin: 0,
};

const pageHeader = {
  maxWidth: 820,
  margin: '64px auto 0',
  padding: '0 28px',
  textAlign: 'center',
};

const rule = {
  height: 1,
  background: 'rgba(var(--bc-accent-rgb), 0.32)',
  margin: '0 auto',
};

const pageTitle = {
  margin: '24px 0 6px',
  fontFamily: SERIF,
  fontSize: 32,
  fontWeight: 500,
  letterSpacing: '0.26em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-primary)',
  paddingLeft: '0.26em',
};

const pageSubtitle = {
  margin: '0 0 24px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
};

const filterRow = {
  maxWidth: 720,
  margin: '24px auto 0',
  padding: '0 28px',
};

const filterInput = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bc-bg-surface)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  borderRadius: 8,
  fontFamily: SERIF,
  fontSize: 14,
  color: 'var(--bc-text-primary)',
  outline: 'none',
};

const groupsWrap = {
  maxWidth: 820,
  margin: '32px auto 0',
  padding: '0 28px',
};

const passageGroup = {
  margin: '32px 0',
};

const passageGroupHeader = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  paddingBottom: 12,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  color: 'inherit',
  textDecoration: 'none',
  cursor: 'pointer',
};

const passageCitation = {
  fontFamily: SERIF,
  fontSize: 18,
  fontStyle: 'italic',
  color: 'var(--bc-accent)',
};

const passageTitle = {
  fontFamily: SERIF,
  fontSize: 13,
  color: 'var(--bc-text-secondary)',
};

const noteList = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
};

const noteItem = {
  display: 'flex',
  gap: 8,
  padding: '12px 0',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.08)',
};

const noteItemLink = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: 'inherit',
  textDecoration: 'none',
  cursor: 'pointer',
};

const noteRangeLabel = {
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const noteExcerpt = {
  margin: 0,
  padding: '6px 10px',
  borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.40)',
  background: 'rgba(var(--bc-border-rgb),0.02)',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--bc-text-secondary)',
};

const noteText = {
  margin: 0,
  fontFamily: SERIF,
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--bc-text-primary)',
  whiteSpace: 'pre-wrap',
};

const noteMeta = {
  margin: 0,
  fontFamily: SANS,
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
};

const noteDeleteBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontSize: 18,
  cursor: 'pointer',
  padding: '0 8px',
  alignSelf: 'flex-start',
};

const footerWrap = {
  maxWidth: 720,
  margin: '72px auto 56px',
  padding: '0 28px',
  textAlign: 'center',
};

const attribution = {
  margin: 0,
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 11,
  lineHeight: 1.65,
  color: 'var(--bc-text-tertiary)',
};
