import { useAuth } from './useAuth.jsx';

const NAV_ITEMS = [
  { key: 'tipitaka',    label: 'Tipiṭaka' },
  { key: 'commentary',  label: 'Commentaries' },
  { key: 'anya',        label: 'Extra-canonical' },
  { key: 'library',     label: 'Library' },
  { key: 'search',      label: 'Search' },
  { key: 'concordance', label: 'Concordance' },
  { key: 'dictionary',  label: 'Dictionary' },
  { key: 'tags',        label: 'Tags' },
  { key: 'bookmarks',   label: 'Bookmarks' },
  { key: 'notes',       label: 'Notes' },
  { key: 'docs',        label: 'Docs' },
  { key: 'research',    label: 'Research' },
];

// Which nav items belong to the "Corpus" section (browseable canonical
// material) vs the query tools below.
const CORPUS_KEYS = new Set(['tipitaka', 'commentary', 'anya', 'library']);

function NavButton({ item, href, active, onClick }) {
  // Rendered as <a href> so the browser's "Open in New Tab" / Cmd-click
  // / middle-click work on sidebar tabs the same way they work on any
  // other link. onClick still drives SPA routing for plain clicks via
  // the parent's handler; modified clicks (handled inside the parent)
  // fall through to the browser.
  return (
    <a
      href={href}
      onClick={onClick}
      style={{
        ...navBtn,
        ...navBtnLinkReset,
        color: active ? 'var(--bc-accent)' : 'var(--bc-text-primary)',
        background: active ? 'rgba(var(--bc-accent-rgb), 0.08)' : 'transparent',
        borderLeftColor: active ? 'var(--bc-accent)' : 'transparent',
        fontWeight: active ? 600 : 500,
      }}
    >
      {item.label}
    </a>
  );
}

export default function Sidebar({ tab, setTab, onRandomSutta }) {
  // Optional auth — gates the admin Research tab and powers the sign-in row.
  const { user, isAdmin } = useAuth();
  // Click-handling helper. Re-clicking the currently-active tab should
  // pop any deep state inside that tab — e.g. an open Library article
  // or a sutta drilled into from Tipiṭaka — and return to the splash.
  // Most views observe URL hash changes, so resetting the hash to the
  // tab's base form is enough to make them snap back. setTab(key) on a
  // no-op (same tab) doesn't trigger any state change, so we push the
  // hash explicitly. The view-side hashchange listeners (e.g. in
  // LibraryView) take it from there.
  const TAB_BASE_HASH = {
    tipitaka:    '#/',
    commentary:  '#/commentary',
    anya:        '#/anya',
    library:     '#/library',
    search:      '#/search',
    concordance: '#/concordance',
    dictionary:  '#/dict',
    tags:        '#/tags',
    bookmarks:   '#/bookmarks',
    notes:       '#/notes',
    docs:        '#/docs',
    research:    '#/research',
    signin:      '#/signin',
    about:       '#/about',
  };
  function handleNavClick(key, e) {
    // Modified clicks (Cmd/Ctrl/Shift/middle) let the browser open the
    // hash href in a new tab — that's what makes the sidebar tabs
    // right-click-able. Plain clicks fall through to SPA routing.
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1)) return;
    if (e) e.preventDefault();
    const isReclick = tab === key;
    setTab?.(key);
    if (isReclick) {
      const base = TAB_BASE_HASH[key];
      if (base && window.location.hash !== base) {
        window.history.pushState(null, '', base);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    }
  }

  return (
    <aside className="dhamma-sidebar" style={wrap}>
      <div style={topGroup}>
        {/* Corpus: the three browseable canonical corpora — Tipiṭaka,
            Commentaries, Extra-canonical. Grouped under a Section header
            so they read as a coherent first-class navigation tier rather
            than a flat list of links. */}
        <Section title="Corpus">
          <nav style={navWrap}>
            {NAV_ITEMS.filter((i) => CORPUS_KEYS.has(i.key)).map((item) => (
              <NavButton key={item.key} item={item} href={TAB_BASE_HASH[item.key]} active={tab === item.key} onClick={(e) => handleNavClick(item.key, e)} />
            ))}
          </nav>
        </Section>

        {/* Tools: query-style operations on the corpus. No header — the
            visual gap between sections is enough separation. */}
        <nav style={{ ...navWrap, marginTop: 8 }}>
          {NAV_ITEMS.filter((i) => !CORPUS_KEYS.has(i.key) && (i.key !== 'research' || isAdmin)).map((item) => (
            <NavButton key={item.key} item={item} href={TAB_BASE_HASH[item.key]} active={tab === item.key} onClick={(e) => handleNavClick(item.key, e)} />
          ))}
          {/* Random sutta: action, not a tab. Picks a passage with an
              English translation from the Sutta piṭaka and opens it in
              the reader. Slight italic + dice glyph distinguishes it
              from the tab rows above. */}
          {onRandomSutta && (
            <button
              onClick={onRandomSutta}
              style={{ ...navBtn, fontStyle: 'italic', color: 'var(--bc-text-secondary)' }}
              aria-label="Open a random sutta"
              title="Open a random sutta"
            >
              <span aria-hidden="true" style={{ marginRight: 8 }}>⚄</span>
              Random sutta
            </button>
          )}
        </nav>

        {/* Tradition filter retired until Mahāyāna or Zen come online.
            With only Theravāda live, the single-row "Theravāda 25,986"
            section read as clutter. When real cross-tradition data
            lands, the filter restores here. */}
      </div>

      {/* Compact "About" pinned to the sidebar foot. The long
          descriptive paragraph that used to live here is now its own
          page at /about — reachable from this link. Pinned to the
          bottom so it doesn't compete with the corpus + tools nav. */}
      <div style={bottomGroup}>
        <a
          href={TAB_BASE_HASH.signin}
          onClick={(e) => handleNavClick('signin', e)}
          title={user ? user.email : 'Sign in to save bookmarks and notes'}
          style={{
            ...navBtn,
            ...navBtnLinkReset,
            color: tab === 'signin' ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
            background: tab === 'signin' ? 'rgba(var(--bc-accent-rgb), 0.08)' : 'transparent',
            borderLeftColor: tab === 'signin' ? 'var(--bc-accent)' : 'transparent',
            fontWeight: tab === 'signin' ? 600 : 500,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: 'Outfit, system-ui, sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user ? (isAdmin ? 'Account · admin' : 'Account') : 'Sign in'}
        </a>
        <a
          href={TAB_BASE_HASH.about}
          onClick={(e) => handleNavClick('about', e)}
          style={{
            ...navBtn,
            ...navBtnLinkReset,
            color: tab === 'about' ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
            background: tab === 'about' ? 'rgba(var(--bc-accent-rgb), 0.08)' : 'transparent',
            borderLeftColor: tab === 'about' ? 'var(--bc-accent)' : 'transparent',
            fontWeight: tab === 'about' ? 600 : 500,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}
        >
          About
        </a>
      </div>
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={sectionHeader}>
        <h3 style={sectionTitle}>{title}</h3>
        <div style={sectionRule} />
      </div>
      <div>{children}</div>
    </section>
  );
}

const wrap = {
  // Sized so the right edge sits ~19px past the TopNav brand
  // ("Dhamma data") right edge — visually tying the sidebar column
  // to the wordmark above it. The 145px content width leaves enough
  // room for "Extra-canonical" (the longest label) plus the nav
  // button's own padding without wrapping.
  width: 145,
  flexShrink: 0,
  // Top padding clears the fixed TopNav (56px) plus the original
  // 28px breathing room. Sidebar background extends to the top of
  // the viewport so the TopNav's backdrop-blur reads on a clean
  // sidebar surface instead of garbage from outside the column.
  padding: '84px 20px 28px 24px',
  borderRight: '1px solid rgba(var(--bc-accent-rgb), 0.14)',
  overflow: 'auto',
  background: 'var(--bc-bg-base)',
  display: 'flex',
  flexDirection: 'column',
};

const topGroup = { flex: 1 };

const bottomGroup = {
  marginTop: 'auto',
  paddingTop: 8,
};

const navWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  marginBottom: 28,
  marginLeft: -24,  // bleed the indicator bar to the sidebar edge
  marginRight: -20,
};

const navBtn = {
  width: '100%',
  textAlign: 'left',
  padding: '9px 20px 9px 21px',
  background: 'transparent',
  border: 'none',
  borderLeft: '3px solid transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 14,
  letterSpacing: '0.01em',
  transition: 'color 120ms ease, background 120ms ease, border-color 120ms ease',
};

// When NavButton renders as <a> instead of <button>, strip the default
// link underline + text colour. boxSizing keeps the 100% width math
// the same as the old button.
const navBtnLinkReset = {
  display: 'block',
  textDecoration: 'none',
  boxSizing: 'border-box',
};

const sectionHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 14,
};

const sectionTitle = {
  margin: 0,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-secondary)',
  flexShrink: 0,
};

const sectionRule = {
  flex: 1,
  height: 1,
  background: 'rgba(var(--bc-accent-rgb), 0.18)',
};

const row = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '7px 0',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'color 120ms ease, opacity 120ms ease',
};

const rowLabel = {
  fontSize: 14,
  fontStyle: 'normal',
  lineHeight: 1.4,
};

const rowCount = {
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
  fontVariantNumeric: 'tabular-nums',
  fontFamily: 'Outfit, system-ui, sans-serif',
};

const placeholderText = {
  fontSize: 12,
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  lineHeight: 1.55,
};

const aboutText = {
  margin: 0,
  fontSize: 13,
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  lineHeight: 1.65,
};
