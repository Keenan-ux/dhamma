import useCorpus from './useCorpus.js';

export default function Sidebar({ activeTraditions, toggleTradition, traditions = [] }) {
  const { shape } = useCorpus();
  const countByTradition = shape?.passageCountByTradition || new Map();

  return (
    <aside className="dhamma-sidebar" style={wrap}>
      <Section title="Corpus">
        {traditions.length === 0 && (
          <div style={placeholderText}>Loading…</div>
        )}
        {traditions.map((t) => {
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

      <Section title="Dictionaries">
        <div style={placeholderText}>
          PED, BHS, DDB — pending ingestion.
        </div>
      </Section>

      <Section title="About">
        <p style={aboutText}>
          Query Buddhist canonical texts across traditions. Pali Tipiṭaka via
          SuttaCentral; Mahāyāna and Zen branches pending ingest. Search modes:
          Exact (FTS), Stem (alias-bridged), Meaning (BGE-M3 vectors).
        </p>
      </Section>
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
