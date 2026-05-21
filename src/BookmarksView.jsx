// Bookmarks list — local-only. Click any entry to open the passage in
// the reader. Entries sorted newest-first; tap the × to remove.

import useBookmarks from './useBookmarks.js';

export default function BookmarksView({ onOpenPassage }) {
  const { bookmarks, remove } = useBookmarks();

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Bookmarks</h1>
        <p style={pageSubtitle}>
          {bookmarks.length === 0
            ? 'No bookmarks yet. Tap the bookmark icon on any passage to save it here.'
            : `${bookmarks.length} saved · stored locally on this device`}
        </p>
        <div style={rule} />
      </header>

      {bookmarks.length > 0 && (
        <ul style={list}>
          {bookmarks.map((b) => (
            <li key={b.id} style={itemRow}>
              <button
                onClick={() => onOpenPassage?.(b.id)}
                style={itemBtn}
                aria-label={`Open ${b.citation}`}
              >
                <span style={itemCitation}>{b.citation || b.id}</span>
                {b.title && <span style={itemTitle}>{b.title}</span>}
                {b.work && <span style={itemWork}>{b.work}</span>}
                <span style={itemDate}>
                  {new Date(b.addedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </button>
              <button
                onClick={() => remove(b.id)}
                style={removeBtn}
                aria-label="Remove bookmark"
                title="Remove bookmark"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SERIF = '"Noto Serif", Georgia, serif';
const SANS = 'Outfit, system-ui, sans-serif';

const scrollWrap = { position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 };

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
  maxWidth: 580,
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

const list = {
  maxWidth: 720,
  margin: '32px auto 64px',
  padding: '0 28px',
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const itemRow = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  padding: '12px 0',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.10)',
};

const itemBtn = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 2,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: SERIF,
  textAlign: 'left',
  padding: 0,
};

const itemCitation = {
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 14,
  color: 'var(--bc-accent)',
};

const itemTitle = {
  fontFamily: SERIF,
  fontSize: 13,
  color: 'var(--bc-text-primary)',
};

const itemWork = {
  fontFamily: SERIF,
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
};

const itemDate = {
  fontFamily: SANS,
  fontSize: 10,
  letterSpacing: '0.06em',
  color: 'var(--bc-text-tertiary)',
  marginTop: 2,
};

const removeBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontSize: 22,
  cursor: 'pointer',
  padding: '0 6px',
  lineHeight: 1,
};
