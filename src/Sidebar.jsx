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
];

// Which nav items belong to the "Corpus" section (browseable canonical
// material) vs the query tools below.
const CORPUS_KEYS = new Set(['tipitaka', 'commentary', 'anya', 'library']);

function NavButton({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...navBtn,
        color: active ? 'var(--bc-accent)' : 'var(--bc-text-primary)',
        background: active ? 'rgba(var(--bc-accent-rgb), 0.08)' : 'transparent',
        borderLeftColor: active ? 'var(--bc-accent)' : 'transparent',
        fontWeight: active ? 600 : 500,
      }}
    >
      {item.label}
    </button>
  );
}

export default function Sidebar({ tab, setTab, onRandomSutta }) {
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
              <NavButton key={item.key} item={item} active={tab === item.key} onClick={() => setTab?.(item.key)} />
            ))}
          </nav>
        </Section>

        {/* Tools: query-style operations on the corpus. No header — the
            visual gap between sections is enough separation. */}
        <nav style={{ ...navWrap, marginTop: 8 }}>
          {NAV_ITEMS.filter((i) => !CORPUS_KEYS.has(i.key)).map((item) => (
            <NavButton key={item.key} item={item} active={tab === item.key} onClick={() => setTab?.(item.key)} />
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

      <div style={bottomGroup}>
        <Section title="About">
          <p style={aboutText}>
            Query the Pali canon. Tipiṭaka via SuttaCentral; Aṭṭhakathā,
            Ṭīkā and supplementary works via VRI/CST. Three Pali
            dictionaries integrated: DPD (88K headwords), DPPN proper
            names (13K biographies), and PTS PED (15K headwords). Search
            modes: Exact (FTS), Stem (alias-bridged), Meaning (BGE-M3
            vectors). Cross-referencing with other Buddhist traditions
            is an open direction as the corpus expands.
          </p>
        </Section>
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
  width: 260,
  flexShrink: 0,
  padding: '28px 20px 28px 24px',
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
