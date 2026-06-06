import { useMemo, useRef } from 'react';
import { kwic, neighborsByTradition } from './analyze.js';
import useCompareStats from './useCompareStats.js';
import { SelectionActions } from './SelectionActions.jsx';

// Concordance view — term-frequency by piṭaka, keyword-in-context (KWIC),
// and companion-word analysis for a chosen term. Replaces the older
// per-tradition "Compare" view; in a Pali-only corpus the by-tradition
// breakdown was degenerate, so the analytics surface here speaks to the
// canonical subdivisions the scholar actually cares about.
export default function CompareView({ term, onSearchTerm, onCompareTerm }) {
  const resultsRef = useRef(null);
  const t = (term || '').trim();
  const { data: stats, loading, error } = useCompareStats({ q: t, limit: 50 });

  // Client-side analyses run on the top-50 fetched passages. Aggregates
  // (totalOccurrences, frequencyByPitaka, matchingPassageCount) come
  // from the server and reflect the full corpus.
  const analysis = useMemo(() => {
    if (!stats) return null;
    const passages = stats.passages || [];

    const kwicRows = passages.flatMap((p) =>
      [
        ...kwic(p.original || '', t, 7),
        ...kwic(p.translation || '', t, 7),
      ].map((row) => ({ ...row, citation: p.citation }))
    );

    // Flatten neighborsByTradition into a single ranked list — single
    // tradition in this corpus, no need to keep them split.
    const nMap = neighborsByTradition(passages, t, 5, 10);
    const flatNeighbors = [];
    for (const arr of nMap.values()) flatNeighbors.push(...arr);
    flatNeighbors.sort((a, b) => b.count - a.count);

    return { passages, kwicRows, neighbors: flatNeighbors };
  }, [stats, t]);

  if (!t) {
    return (
      <div data-scroll-root="" style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 }}>
        <div style={wrap}>
          <p style={meta}>Search a term first. Concordance will show its frequency by piṭaka, every occurrence in keyword-in-context (KWIC), and which words tend to appear near it.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-scroll-root="" style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 }}>
        <div style={wrap}>
          <h1 style={h1}>Concordance &nbsp;·&nbsp; <em style={{ color: 'var(--bc-accent)' }}>{t}</em></h1>
          <p style={meta}>Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-scroll-root="" style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 }}>
        <div style={wrap}>
          <h1 style={h1}>Concordance &nbsp;·&nbsp; <em style={{ color: 'var(--bc-accent)' }}>{t}</em></h1>
          <p style={{ ...meta, color: 'var(--bc-loss-text)' }}>Failed: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.matchingPassageCount === 0) {
    // A query of plain ASCII letters is often a Pāli term typed without its
    // diacritics. The concordance is deliberately diacritic-sensitive (folding
    // ā/ṭ/ṃ would conflate distinct words, e.g. anattā vs āṇatti), so a bare 0
    // reads as "absent" when the term may be present under its marked form.
    // Nudge toward it; the dictionary lookup folds, the concordance does not.
    const looksDediacritized = /[a-z]/i.test(t) && [...t].every((c) => c.charCodeAt(0) < 128);
    return (
      <div data-scroll-root="" style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 }}>
        <div style={wrap}>
          <h1 style={h1}>Concordance &nbsp;·&nbsp; <em style={{ color: 'var(--bc-accent)' }}>{t}</em></h1>
          <p style={meta}>
            {looksDediacritized
              ? 'No occurrences. The concordance is diacritic-sensitive; if you typed plain letters, try the marked Pāli form (for example ādīnava, satipaṭṭhāna).'
              : 'No occurrences in the corpus. Try a different inflection or term.'}
          </p>
        </div>
      </div>
    );
  }

  // Per-piṭaka frequency from the server. Older /api/compare-stats
  // returns frequencyByTradition — render whichever shape we got so
  // dev preview (pulling prod API) still shows something readable
  // until the new server lands.
  const freqRows = stats.frequencyByPitaka
    || (stats.frequencyByTradition || []).map((f) => ({
         slug: f.tradition_slug || f.tradition,
         name: f.tradition,
         count: f.count,
       }));
  const maxFreq = Math.max(1, ...freqRows.map((f) => f.count));
  const sampleCount = stats.passages?.length ?? 0;
  const showingSampleNote = stats.matchingPassageCount > sampleCount;
  const freqLabel = stats.frequencyByPitaka ? 'Frequency by piṭaka' : 'Frequency by tradition';

  return (
    <div data-scroll-root="" style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 }}>
      <div style={wrap} ref={resultsRef}>
        <SelectionActions
          containerRef={resultsRef}
          onSearch={onSearchTerm}
          onCompare={onCompareTerm}
        />
        <div style={{ marginBottom: 28 }}>
          <h1 style={h1}>Concordance &nbsp;·&nbsp; <em style={{ color: 'var(--bc-accent)' }}>{t}</em></h1>
          <p style={meta}>
            {stats.totalOccurrences.toLocaleString()} occurrences across{' '}
            {stats.matchingPassageCount.toLocaleString()}{' '}
            {stats.matchingPassageCount === 1 ? 'passage' : 'passages'}.
          </p>
        </div>

        <Section title={freqLabel}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {freqRows.map(({ slug, name, count }) => (
              <div key={slug} style={freqRowStyle}>
                <div style={freqLabelStyle}>{name}</div>
                <div style={freqBarTrack}>
                  <div style={{ ...freqBarFill, width: `${(count / maxFreq) * 100}%` }} />
                </div>
                <div style={freqCount}>{count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Keyword in context"
          subtitle={showingSampleNote
            ? `Every occurrence in the top-${sampleCount} of ${stats.matchingPassageCount.toLocaleString()} matching passages, centered on the term with ±7 words.`
            : `Every occurrence centered on the term with ±7 words context.`}
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
          subtitle="Words within ±5 of the term in the sample. Stopwords filtered, ranked by co-occurrence count."
        >
          {(!analysis?.neighbors || analysis.neighbors.length === 0) ? (
            <p style={{ ...meta, margin: 0 }}>No neighboring words above threshold.</p>
          ) : (
            <div style={neighborGrid}>
              {analysis.neighbors.map(({ word, count }) => (
                <div key={word} style={neighborRow}>
                  <span style={{ fontFamily: '"Noto Serif", Georgia, serif' }}>{word}</span>
                  <span style={{ color: 'var(--bc-text-tertiary)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>×{count}</span>
                </div>
              ))}
            </div>
          )}
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

const wrap = { maxWidth: 1100, margin: 0, padding: '28px 28px 48px' };

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

const freqRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(160px, 1fr) 3fr auto',
  gap: 14,
  alignItems: 'center',
};

const freqLabelStyle = {
  fontSize: 13,
  fontFamily: '"Noto Serif", Georgia, serif',
  color: 'var(--bc-text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const neighborGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  columnGap: 28,
};

const freqBarTrack = { height: 4, background: 'rgba(var(--bc-border-rgb),0.04)', borderRadius: 0, overflow: 'hidden' };
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
  borderBottom: '1px solid rgba(var(--bc-border-rgb),0.04)',
};

const kwicBefore = {
  padding: '10px 12px',
  textAlign: 'right',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  borderBottom: '1px solid rgba(var(--bc-border-rgb),0.04)',
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
  borderBottom: '1px solid rgba(var(--bc-border-rgb),0.04)',
};

const neighborRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '6px 0',
  fontSize: 14,
  color: 'var(--bc-text-secondary)',
  borderBottom: '1px solid rgba(var(--bc-border-rgb),0.03)',
};
