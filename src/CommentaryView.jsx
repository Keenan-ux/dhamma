// Typeset frontmatter for the Theravāda commentary corpus (Aṭṭhakathā +
// Ṭīkā). All content is structural / pending — the CST ingest plan in
// TIER_C.md is the source of truth for what will fill these slots.
//
// Shape mirrors the canonical organization: a featured Visuddhimagga
// block at top (standalone masterwork), three columns of per-piṭaka
// commentaries, then a sub-commentaries (Ṭīkā) section at the bottom.
// Every entry is dimmed and labeled "pending" until ingest lands;
// clicking still drills into Browse where the stub work rows live.

import { useState } from 'react';
import useCorpus from './useCorpus.js';
import useIsNarrow from './useIsNarrow.js';

// Canonical Theravāda commentary structure. Names follow the standard PTS /
// SuttaCentral nomenclature; secondary names in subtitles when the
// scholarly community knows them by both (e.g. Sumaṅgalavilāsinī = DN-A).
const VINAYA_COMMENTARIES = [
  { name: 'Samantapāsādikā', subtitle: 'Vinaya commentary' },
];

const SUTTA_COMMENTARIES = [
  { name: 'Sumaṅgalavilāsinī',   subtitle: 'DN commentary' },
  { name: 'Papañcasūdanī',       subtitle: 'MN commentary' },
  { name: 'Sāratthappakāsinī',   subtitle: 'SN commentary' },
  { name: 'Manorathapūraṇī',     subtitle: 'AN commentary' },
  { name: 'Khuddaka commentaries', subtitle: 'Paramatthajotikā I & II, Dhp-A, Ja-A, etc.' },
];

const ABHIDHAMMA_COMMENTARIES = [
  { name: 'Atthasālinī',                   subtitle: 'Dhammasaṅgaṇī commentary' },
  { name: 'Sammohavinodanī',               subtitle: 'Vibhaṅga commentary' },
  { name: 'Pañcappakaraṇa-aṭṭhakathā',     subtitle: 'remaining 5 books' },
];

// Sub-commentaries (Ṭīkā). Listed briefly — full structure shows up once
// the CST ingest's ṭīkā slug list is in the works table.
const TIKA_WORKS = [
  'Līnatthappakāsinī (sutta-piṭaka ṭīkā series)',
  'Sāratthadīpanī (Vinaya ṭīkā)',
  'Mūla-ṭīkā (Abhidhamma ṭīkā)',
  'Anu-ṭīkā (Abhidhamma)',
];

export default function CommentaryView({ onDrill }) {
  const { shape, loading } = useCorpus();
  const [translatedOnly, setTranslatedOnly] = useState(false);
  const isNarrow = useIsNarrow();

  // Theravāda → pli-commentary umbrella. Subworks (Visuddhimagga, MN-A,
  // DN-A) are seeded as stubs; future CST ingest swaps them to live.
  const trad = shape?.tree?.find((t) => t.id === 'theravada');
  const commentary = trad?.children?.find((w) => w.id === 'pli-commentary');
  const subcommentary = trad?.children?.find((w) => w.id === 'pli-subcommentary');

  if (loading) {
    return (
      <div style={loadingWrap}>
        <p style={loadingHint}>Loading…</p>
      </div>
    );
  }

  function drill(...ids) {
    onDrill?.(ids);
  }

  return (
    <div style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Commentaries</h1>
        <p style={pageSubtitle}>
          Aṭṭhakathā &amp; Ṭīkā &nbsp;·&nbsp;{' '}
          <span style={pendingMark}>pending ingest</span>
          {commentary && (commentary.total || 0) > 0 && (
            <> &nbsp;·&nbsp; {commentary.total.toLocaleString()} passages</>
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

      {/* Featured Visuddhimagga block — standalone masterwork by
          Buddhaghosa, traditionally not grouped under any piṭaka. */}
      <div style={featuredBlock}>
        <h2
          style={featuredName}
          onClick={() => commentary && drill('pli-commentary', 'pli-vism')}
          role="button"
          tabIndex={0}
        >
          Visuddhimagga
        </h2>
        <p style={featuredSubtitle}>The Path of Purification · Buddhaghosa, 5th c. CE</p>
        <p style={pendingLine}>pending</p>
      </div>

      <div style={isNarrow ? singleCol : threeCol}>
        <section style={column}>
          <h2 style={colHeader}>Vinaya</h2>
          <p style={colKind}>one commentary</p>
          <ul style={textList}>
            {VINAYA_COMMENTARIES.map((c) => (
              <li key={c.name} style={textListItem}>
                <span style={workName}>{c.name}</span>
                <span style={workSubtitle}>{c.subtitle}</span>
                <span style={pendingMark}>pending</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={column}>
          <h2 style={colHeader}>Sutta</h2>
          <p style={colKind}>five nikāya commentaries</p>
          <ul style={textList}>
            {SUTTA_COMMENTARIES.map((c) => (
              <li key={c.name} style={textListItem}>
                <span style={workName}>{c.name}</span>
                <span style={workSubtitle}>{c.subtitle}</span>
                <span style={pendingMark}>pending</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={column}>
          <h2 style={colHeader}>Abhidhamma</h2>
          <p style={colKind}>three commentaries</p>
          <ul style={textList}>
            {ABHIDHAMMA_COMMENTARIES.map((c) => (
              <li key={c.name} style={textListItem}>
                <span style={workName}>{c.name}</span>
                <span style={workSubtitle}>{c.subtitle}</span>
                <span style={pendingMark}>pending</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div style={subcommentaryBlock}>
        <div style={subRule} />
        <h2 style={subHeader}>Sub-commentaries · Ṭīkā</h2>
        <p style={colKind}>by Ānanda, Dhammapāla, and the medieval Sinhala/Burmese ṭīkā tradition</p>
        <ul style={tikaList}>
          {TIKA_WORKS.map((name) => (
            <li key={name} style={tikaItem}>
              <span style={workName}>{name}</span>
              <span style={pendingMark}>pending</span>
            </li>
          ))}
        </ul>
      </div>

      <footer style={footerWrap}>
        <div style={rule} />
        <p style={attribution}>
          Commentary corpus to be ingested from VRI / CST (see <code>TIER_C.md</code>).
          Structural names follow standard PTS / SuttaCentral nomenclature.
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

const subRule = {
  height: 1,
  background: 'rgba(var(--bc-accent-rgb), 0.18)',
  margin: '0 auto 24px',
  maxWidth: 380,
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

const featuredBlock = {
  maxWidth: 560,
  margin: '48px auto 0',
  padding: '0 28px',
  textAlign: 'center',
  opacity: 0.55,
};

const featuredName = {
  margin: 0,
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 500,
  letterSpacing: '0.10em',
  color: 'var(--bc-text-primary)',
  cursor: 'pointer',
  transition: 'color 120ms ease',
};

const featuredSubtitle = {
  margin: '6px 0 0',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 12,
  color: 'var(--bc-text-tertiary)',
};

const threeCol = {
  maxWidth: 1100,
  margin: '40px auto 0',
  padding: '0 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 48,
  alignItems: 'start',
  opacity: 0.65,
};

// Narrow viewport: stack the three commentary columns vertically.
// No piṭaka chip selector here — all rows are 'pending' anyway, so the
// visual cost of scrolling through them is the same as toggling between
// chips, and a continuous read gives a better sense of the full corpus
// scope.
const singleCol = {
  maxWidth: 480,
  margin: '32px auto 0',
  padding: '0 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 36,
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
  margin: '8px 0 16px',
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
  gap: 16,
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
  borderRadius: 0,
};

const pendingLine = {
  margin: '12px 0 0',
  fontFamily: SANS,
  fontSize: 8,
  fontWeight: 600,
  letterSpacing: '0.20em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const subcommentaryBlock = {
  maxWidth: 720,
  margin: '64px auto 0',
  padding: '0 32px',
  textAlign: 'center',
  opacity: 0.55,
};

const subHeader = {
  margin: 0,
  fontFamily: SERIF,
  fontSize: 15,
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-primary)',
};

const tikaList = {
  margin: '16px 0 0',
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const tikaItem = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  alignItems: 'center',
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
