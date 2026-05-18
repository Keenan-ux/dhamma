import { useMemo } from 'react';
import { kwic, neighborsByTradition } from './analyze.js';
import useCompareStats from './useCompareStats.js';
import PassageCard from './PassageCard.jsx';

export default function CompareView({ term, activeTraditions }) {
  const t = (term || '').trim();
  const { data: stats, loading, error } = useCompareStats({ q: t, limit: 50 });

  // Client-side analyses run on the top-50 fetched passages. Aggregates
  // (totalOccurrences, frequencyByTradition, matchingPassageCount) come
  // from the server and reflect the full corpus.
  const analysis = useMemo(() => {
    if (!stats) return null;
    const visiblePassages = stats.passages.filter((p) =>
      !activeTraditions || activeTraditions.size === 0 || activeTraditions.has(p.tradition)
    );

    const byTradition = new Map();
    for (const p of visiblePassages) {
      const arr = byTradition.get(p.tradition) || [];
      arr.push(p);
      byTradition.set(p.tradition, arr);
    }

    const kwicRows = visiblePassages.flatMap((p) =>
      [
        ...kwic(p.original || '', t, 7),
        ...kwic(p.translation || '', t, 7),
      ].map((row) => ({ ...row, citation: p.citation, tradition: p.tradition }))
    );

    const neighbors = neighborsByTradition(visiblePassages, t, 5, 10);

    return { visiblePassages, byTradition, kwicRows, neighbors };
  }, [stats, t, activeTraditions]);

  if (!t) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
        <div style={wrap}>
          <p style={meta}>Search a term first. Compare will show frequencies by tradition, side-by-side cards, a concordance (KWIC) view, and what words tend to appear near the term in each tradition.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
        <div style={wrap}>
          <h2 style={h1}>Comparing <em style={{ color: 'var(--bc-accent)' }}>{t}</em></h2>
          <p style={meta}>Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
        <div style={wrap}>
          <h2 style={h1}>Comparing <em style={{ color: 'var(--bc-accent)' }}>{t}</em></h2>
          <p style={{ ...meta, color: 'var(--bc-loss-text)' }}>Failed: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.matchingPassageCount === 0) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
        <div style={wrap}>
          <h2 style={h1}>Comparing <em style={{ color: 'var(--bc-accent)' }}>{t}</em></h2>
          <p style={meta}>No occurrences in the corpus. Try a different inflection or term.</p>
        </div>
      </div>
    );
  }

  const visibleFreq = (stats.frequencyByTradition || [])
    .filter((f) => !activeTraditions || activeTraditions.size === 0 || activeTraditions.has(f.tradition));
  const maxFreq = Math.max(1, ...visibleFreq.map((f) => f.count));
  const sampleCount = stats.passages.length;
  const showingSampleNote = stats.matchingPassageCount > sampleCount;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
      <div style={wrap}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={h1}>Comparing <em style={{ color: 'var(--bc-accent)' }}>{t}</em></h2>
          <p style={meta}>
            {stats.totalOccurrences.toLocaleString()} occurrences across{' '}
            {stats.matchingPassageCount.toLocaleString()}{' '}
            {stats.matchingPassageCount === 1 ? 'passage' : 'passages'} in{' '}
            {stats.frequencyByTradition.length}{' '}
            {stats.frequencyByTradition.length === 1 ? 'tradition' : 'traditions'}.
          </p>
        </div>

        <Section title="Frequency by tradition">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleFreq.map(({ tradition, count }) => (
              <div key={tradition} style={freqRow}>
                <div style={freqLabel}>{tradition}</div>
                <div style={freqBarTrack}>
                  <div style={{ ...freqBarFill, width: `${(count / maxFreq) * 100}%` }} />
                </div>
                <div style={freqCount}>{count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Side by side"
          subtitle={showingSampleNote
            ? `Top ${sampleCount} of ${stats.matchingPassageCount.toLocaleString()} matching passages, ranked by occurrence density.`
            : undefined}
        >
          <div style={columnsGrid}>
            {Array.from(analysis?.byTradition?.entries() || []).map(([trad, passages]) => (
              <div key={trad} style={column}>
                <h3 style={columnHeading}>{trad}</h3>
                <div>
                  {passages.map((p, i) => (
                    <PassageCard key={p.id} passage={p} highlight={t} first={i === 0} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Concordance"
          subtitle={`Every occurrence in the top-${sampleCount} sample, centered on the term with ±7 words context.`}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={kwicTable}>
              <tbody>
                {(analysis?.kwicRows || []).map((row, i) => (
                  <tr key={i}>
                    <td style={kwicCite}>{row.citation}</td>
                    <td style={kwicBefore}>…{row.before}</td>
                    <td style={kwicMatch}>{row.match}</td>
                    <td style={kwicAfter}>{row.after}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Companion words"
          subtitle="Words within ±5 of the term in the sample, by tradition. Stopwords filtered."
        >
          <div style={columnsGrid}>
            {Array.from(analysis?.neighbors?.entries() || []).map(([trad, words]) => (
              <div key={trad} style={column}>
                <h3 style={columnHeading}>{trad}</h3>
                {words.length === 0 ? (
                  <p style={{ ...meta, margin: 0 }}>No neighboring words above threshold.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {words.map(({ word, count }) => (
                      <div key={word} style={neighborRow}>
                        <span style={{ fontFamily: '"Noto Serif", Georgia, serif' }}>{word}</span>
                        <span style={{ color: 'var(--bc-text-tertiary)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>×{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={sectionHeader}>
        <h3 style={sectionTitle}>{title}</h3>
        <div style={sectionRule} />
      </div>
      {subtitle && <p style={{ ...meta, margin: '8px 0 18px' }}>{subtitle}</p>}
      {!subtitle && <div style={{ height: 18 }} />}
      {children}
    </section>
  );
}

const wrap = { maxWidth: 1100, margin: '0 auto', padding: '28px 28px 48px' };

const h1 = {
  margin: 0,
  fontSize: 22,
  fontWeight: 400,
  fontFamily: '"Noto Serif", Georgia, serif',
  color: 'var(--bc-text-heading)',
};

const meta = {
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.6,
  margin: '6px 0 0',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
};

const sectionHeader = { display: 'flex', alignItems: 'center', gap: 14 };

const sectionTitle = {
  margin: 0,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-secondary)',
  flexShrink: 0,
};

const sectionRule = { flex: 1, height: 1, background: 'rgba(var(--bc-accent-rgb), 0.22)' };

const freqRow = {
  display: 'grid',
  gridTemplateColumns: 'minmax(160px, 1fr) 3fr auto',
  gap: 14,
  alignItems: 'center',
};

const freqLabel = {
  fontSize: 13,
  fontFamily: '"Noto Serif", Georgia, serif',
  color: 'var(--bc-text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const freqBarTrack = { height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 0, overflow: 'hidden' };
const freqBarFill = { height: '100%', background: 'var(--bc-accent)' };
const freqCount = { fontSize: 12, color: 'var(--bc-text-tertiary)', fontVariantNumeric: 'tabular-nums', minWidth: 24, textAlign: 'right' };

const columnsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 };
const column = { display: 'flex', flexDirection: 'column', minWidth: 0 };

const columnHeading = {
  margin: '0 0 14px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  paddingBottom: 10,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.22)',
};

const kwicTable = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };

const kwicCite = {
  padding: '10px 12px 10px 0',
  color: 'var(--bc-accent)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 12,
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

const kwicBefore = {
  padding: '10px 12px',
  textAlign: 'right',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

const kwicMatch = {
  padding: '10px 8px',
  textAlign: 'center',
  color: 'var(--bc-accent)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.4)',
};

const kwicAfter = {
  padding: '10px 0 10px 12px',
  textAlign: 'left',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

const neighborRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '6px 0',
  fontSize: 14,
  color: 'var(--bc-text-secondary)',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
};
