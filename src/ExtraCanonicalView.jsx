// Typeset frontmatter for Theravāda extra-canonical works (Anya). These
// fall outside the Tipiṭaka and its commentary apparatus — historical
// chronicles, medieval compendia, and Sinhala/Burmese tradition. All
// stubs until specific ingest plans land; pending marks throughout.

import { useState } from 'react';
import useCorpus from './useCorpus.js';
import useIsNarrow from './useIsNarrow.js';

// Canonical Theravāda extra-canonical works. Two visual groupings —
// chronicles (vaṃsa literature) and compendia / treatises — match how
// the scholarly tradition organizes them.
const CHRONICLES = [
  { name: 'Mahāvaṃsa',          subtitle: 'the Great Chronicle · 5th–6th c. CE' },
  { name: 'Cūḷavaṃsa',          subtitle: 'continuation of the Mahāvaṃsa' },
  { name: 'Dīpavaṃsa',          subtitle: 'earliest Sinhala chronicle · 4th c. CE' },
  { name: 'Sāsanavaṃsa',        subtitle: 'history of the Sāsana · 19th c. Burmese' },
  { name: 'Nikāya-saṅgaha',     subtitle: 'history of the Theravāda nikāyas' },
];

const COMPENDIA = [
  { name: 'Saddhammasaṅgaha',   subtitle: '14th c. compendium of the Dhamma' },
  { name: 'Buddhaghosuppatti',  subtitle: 'Life of Buddhaghosa' },
  { name: 'Abhidhammāvatāra',   subtitle: 'introduction to the Abhidhamma · Buddhadatta' },
  { name: 'Vinayavinicchaya',   subtitle: 'Vinaya digest · Buddhadatta' },
  { name: 'Mohavicchedanī',     subtitle: 'mātikā commentary' },
];

export default function ExtraCanonicalView({ onDrill }) {
  const { shape, loading } = useCorpus();
  const [translatedOnly, setTranslatedOnly] = useState(false);
  const isNarrow = useIsNarrow();

  const trad = shape?.tree?.find((t) => t.id === 'theravada');
  const anya = trad?.children?.find((w) => w.id === 'pli-anya');

  if (loading) {
    return (
      <div style={loadingWrap}>
        <p style={loadingHint}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Extra-canonical</h1>
        <p style={pageSubtitle}>
          Anya &nbsp;·&nbsp; <span style={pendingMark}>pending ingest</span>
          {anya && (anya.total || 0) > 0 && (
            <> &nbsp;·&nbsp; {anya.total.toLocaleString()} passages</>
          )}
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

      <div style={isNarrow ? singleCol : twoCol}>
        <section style={column}>
          <h2 style={colHeader}>Chronicles</h2>
          <p style={colKind}>vaṃsa literature</p>
          <ul style={textList}>
            {CHRONICLES.map((w) => (
              <li key={w.name} style={textListItem}>
                <span style={workName}>{w.name}</span>
                <span style={workSubtitle}>{w.subtitle}</span>
                <span style={pendingMark}>pending</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={column}>
          <h2 style={colHeader}>Compendia &amp; Treatises</h2>
          <p style={colKind}>medieval Theravāda</p>
          <ul style={textList}>
            {COMPENDIA.map((w) => (
              <li key={w.name} style={textListItem}>
                <span style={workName}>{w.name}</span>
                <span style={workSubtitle}>{w.subtitle}</span>
                <span style={pendingMark}>pending</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer style={footerWrap}>
        <div style={rule} />
        <p style={attribution}>
          Extra-canonical works fall outside the Tipiṭaka and its
          aṭṭhakathā / ṭīkā apparatus. Sources and dating follow the
          standard scholarly chronologies (Norman, von Hinüber).
        </p>
      </footer>
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
  maxWidth: 820,
  margin: '24px auto 0',
  padding: '0 28px',
  display: 'flex',
  justifyContent: 'center',
};

const twoCol = {
  maxWidth: 900,
  margin: '48px auto 0',
  padding: '0 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 64,
  alignItems: 'start',
  opacity: 0.65,
};

const singleCol = {
  maxWidth: 480,
  margin: '32px auto 0',
  padding: '0 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 40,
  alignItems: 'stretch',
  opacity: 0.65,
};

const column = {
  textAlign: 'center',
  fontFamily: SERIF,
};

const colHeader = {
  margin: 0,
  fontFamily: SERIF,
  fontSize: 16,
  fontWeight: 500,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-primary)',
};

const colKind = {
  margin: '8px 0 20px',
  fontFamily: SANS,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.20em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const textList = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const textListItem = {
  fontFamily: SERIF,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  alignItems: 'center',
};

const workName = {
  fontFamily: SERIF,
  fontSize: 15,
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

const pendingMark = {
  fontFamily: SANS,
  fontSize: 8,
  fontWeight: 600,
  letterSpacing: '0.20em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  padding: '2px 6px',
  marginTop: 4,
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
