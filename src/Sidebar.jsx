import useCorpus from './useCorpus.js';

const NAV_ITEMS = [
  { key: 'browse',     label: 'Browse' },
  { key: 'search',     label: 'Search' },
  { key: 'compare',    label: 'Compare' },
  { key: 'dictionary', label: 'Dictionary' },
];

export default function Sidebar({
  activeTraditions,
  toggleTradition,
  traditions = [],
  tab,
  setTab,
}) {
  const { shape } = useCorpus();
  const countByTradition = shape?.passageCountByTradition || new Map();

  return (
    <aside className="dhamma-sidebar" style={wrap}>
      <div style={topGroup}>
        <nav style={navWrap}>
          {NAV_ITEMS.map((item) => {
            const on = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab?.(item.key)}
                style={{
                  ...navBtn,
                  color: on ? 'var(--bc-accent)' : 'var(--bc-text-primary)',
                  background: on ? 'rgba(var(--bc-accent-rgb), 0.08)' : 'transparent',
                  borderLeftColor: on ? 'var(--bc-accent)' : 'transparent',
                  fontWeight: on ? 600 : 500,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <Section title="Corpus">
          {traditions.length === 0 && (
            <div style={placeholderText}>Loading…</div>
          )}
          {/* Hide traditions with zero passages — they're stubs we haven't
              ingested yet (Mahāyāna, Zen) and the count is the only thing
              they could show. Reappear automatically when content lands. */}
          {traditions.filter((t) => (countByTradition.get(t) || 0) > 0).map((t) => {
            const on = activeTraditions.has(t);
            const count = countByTradition.get(t) || 0;
            return (
              <button
                key={t}
                onClick={() => toggleTradition(t)}
                style={{
                  ...row,
                  color: on ? 'var(--bc-text-primary)' : 'var(--bc-text-tertiary)',
                  opacity: on ? 1 : 0.6,
                }}
              >
                <span style={{ ...rowLabel, fontFamily: '"Noto Serif", Georgia, serif' }}>{t}</span>
                <span style={rowCount}>{count.toLocaleString()}</span>
              </button>
            );
          })}
        </Section>
      </div>

      <div style={bottomGroup}>
        <Section title="About">
          <p style={aboutText}>
            Query Buddhist canonical texts across traditions. Pali Tipiṭaka
            via SuttaCentral; Aṭṭhakathā, Ṭīkā and supplementary works via
            VRI/CST. Three Pali dictionaries integrated: DPD (88K
            headwords), DPPN proper names (13K biographies), and PTS
            PED (15K headwords). Mahāyāna and
            Zen branches pending ingest. Search modes: Exact (FTS), Stem
            (alias-bridged), Meaning (BGE-M3 vectors).
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
