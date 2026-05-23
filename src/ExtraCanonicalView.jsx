// Typeset frontmatter for Theravāda extra-canonical works (Anya). Pulls
// live data from useCorpus — pli-anya subtree — and renders the works
// as a sortable grid. The corpus is broad (chronicles, grammatical
// treatises, paritta, hymns) and the CST naming doesn't lend itself to
// clean piṭaka-style grouping, so we go with a compact alphabetical
// grid by default.

import { useState } from 'react';
import useCorpus from './useCorpus.js';
import useIsNarrow from './useIsNarrow.js';
import { isModifiedClick, browseHref } from './linkHelpers.js';

export default function ExtraCanonicalView({ onDrill }) {
  const { shape, loading } = useCorpus();
  const [translatedOnly, setTranslatedOnly] = useState(false);
  const isNarrow = useIsNarrow();

  const trad = shape?.tree?.find((t) => t.id === 'theravada');
  const anya = trad?.children?.find((w) => w.id === 'pli-anya');

  if (loading) {
    return <div style={loadingWrap}><p style={loadingHint}>Loading…</p></div>;
  }

  const works = (anya?.children || []).filter((c) => !c.passageId);
  const sorted = [...works].sort((a, b) => a.name.localeCompare(b.name));

  function drill(workId) {
    onDrill?.(['pli-anya', workId]);
  }
  function fmtCount(node) {
    const total = node.total || 0;
    const tr = node.translated || 0;
    if (translatedOnly && tr < total) {
      return `${tr.toLocaleString()} / ${total.toLocaleString()}`;
    }
    return total.toLocaleString();
  }
  function isDim(node) {
    return translatedOnly && (node?.translated || 0) === 0;
  }

  return (
    <div data-scroll-root="" style={scrollWrap}>
     <div style={pageColumn}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Extra-canonical</h1>
        <p style={pageSubtitle}>
          Anya &nbsp;·&nbsp; {(anya?.total || 0).toLocaleString()} passages
          {(anya?.translated || 0) > 0 && (
            <> &nbsp;·&nbsp; {anya.translated.toLocaleString()} translated</>
          )}
          &nbsp;·&nbsp; {works.length} works
        </p>
        <div style={rule} />
      </header>

      <div style={topControls}>
        <label style={toggleLabel}>
          <input
            type="checkbox"
            checked={translatedOnly}
            onChange={(e) => setTranslatedOnly(e.target.checked)}
            style={{ accentColor: 'var(--bc-accent)' }}
          />
          <span>Translated only</span>
        </label>
      </div>

      <ul style={isNarrow ? singleList : grid}>
        {sorted.map((w) => (
          <li key={w.id} style={workItemLi}>
            <a
              href={browseHref(['pli-anya', w.id])}
              style={{ ...workItem, opacity: isDim(w) ? 0.35 : 1 }}
              onClick={(e) => {
                if (isModifiedClick(e)) return;
                e.preventDefault();
                drill(w.id);
              }}
              aria-label={`Open ${w.name}`}
            >
              <span style={workName}>{w.name}</span>
              {w.subtitle && <span style={workSubtitle}>{w.subtitle}</span>}
              <span style={workCount}>{fmtCount(w)}</span>
            </a>
          </li>
        ))}
      </ul>

      <footer style={footerWrap}>
        <div style={rule} />
        <p style={attribution}>
          Extra-canonical works ingested from VRI / CST. Fall outside the
          Tipiṭaka and its aṭṭhakathā / ṭīkā apparatus — chronicles,
          grammatical treatises, paritta, devotional verse, and other
          paracanonical literature.
        </p>
      </footer>
     </div>
    </div>
  );
}

// --- styles ---

const SERIF = '"Noto Serif", Georgia, serif';
const SANS = 'Outfit, system-ui, sans-serif';

const scrollWrap = {
  position: 'absolute',
  inset: 0,
  overflow: 'auto',
  paddingTop: 56,
};

// pageColumn is the outer hug-left container, sized to the widest
// inner block (grid at 1100). It anchors the whole page to scrollWrap's
// left edge so the left margin matches Library's tight gap between
// sidebar and content. Inside this column every sub-block uses
// `margin: ... auto ...` to self-centre, which puts the title, the
// topControls row, and the grid all on the same vertical axis
// regardless of their individual widths.
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
  maxWidth: 580,
};

const pageTitle = {
  margin: '24px 0 6px',
  fontFamily: SERIF,
  fontSize: 32,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-primary)',
  paddingLeft: '0.24em',
};

const pageSubtitle = {
  margin: '0 0 24px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  letterSpacing: '0.02em',
  color: 'var(--bc-text-tertiary)',
};

const topControls = {
  maxWidth: 1100,
  margin: '24px auto 0',
  padding: '0 20px',
  display: 'flex',
  justifyContent: 'center',
};

const toggleLabel = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-secondary)',
  cursor: 'pointer',
};

const grid = {
  maxWidth: 1100,
  margin: '40px auto 0',
  padding: '0 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '28px 32px',
  listStyle: 'none',
  alignItems: 'start',
};

const singleList = {
  maxWidth: 480,
  margin: '32px auto 0',
  padding: '0 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  listStyle: 'none',
};

const workItemLi = {
  listStyle: 'none',
};

const workItem = {
  fontFamily: SERIF,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  alignItems: 'center',
  textAlign: 'center',
  cursor: 'pointer',
  color: 'inherit',
  textDecoration: 'none',
  transition: 'color 120ms ease',
};

const workName = {
  fontFamily: SERIF,
  fontSize: 14,
  letterSpacing: '0.01em',
  color: 'var(--bc-text-secondary)',
  lineHeight: 1.4,
};

const workSubtitle = {
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.4,
};

const workCount = {
  fontFamily: SANS,
  fontSize: 10,
  color: 'var(--bc-text-tertiary)',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.04em',
  marginTop: 2,
};

const footerWrap = {
  maxWidth: 720,
  margin: '72px auto 56px',
  padding: '0 28px',
  textAlign: 'center',
};

const attribution = {
  margin: '24px 0 0',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 11,
  lineHeight: 1.65,
  color: 'var(--bc-text-tertiary)',
};

const loadingWrap = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const loadingHint = {
  margin: 0,
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
};
