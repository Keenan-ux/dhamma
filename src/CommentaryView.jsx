// Typeset frontmatter for the Theravāda commentary corpus (Aṭṭhakathā +
// Ṭīkā). Pulls live data from useCorpus — pli-commentary and
// pli-subcommentary subtrees — and groups each work by the piṭaka it
// comments on (Vinaya / Sutta / Abhidhamma / Standalone), mirroring
// TipitakaView's three-column rhythm.

import { useState } from 'react';
import useCorpus from './useCorpus.js';
import useIsNarrow from './useIsNarrow.js';

// Classify a commentary work by the piṭaka it sits over. Heuristic on
// the slug — works because CST + SuttaCentral ingest both follow the
// "pli-<scope>-attha" / "pli-<scope>-tika" naming. New works that
// don't fit a bucket fall through to 'other' and render in a Misc
// section so they're never silently dropped.
function classifyByPitaka(works) {
  const buckets = { vism: [], vinaya: [], sutta: [], abhidhamma: [], other: [] };
  for (const w of works) {
    const id = w.id;
    if (id.includes('vism')) buckets.vism.push(w);
    else if (/-vin-/.test(id))               buckets.vinaya.push(w);
    else if (/-(dn|mn|sn|an|kn)-/.test(id))  buckets.sutta.push(w);
    else if (/-abh-/.test(id))               buckets.abhidhamma.push(w);
    else                                     buckets.other.push(w);
  }
  return buckets;
}

export default function CommentaryView({ onDrill }) {
  const { shape, loading } = useCorpus();
  const [translatedOnly, setTranslatedOnly] = useState(false);
  const isNarrow = useIsNarrow();

  const trad = shape?.tree?.find((t) => t.id === 'theravada');
  const commentary    = trad?.children?.find((w) => w.id === 'pli-commentary');
  const subcommentary = trad?.children?.find((w) => w.id === 'pli-subcommentary');

  if (loading) {
    return (
      <div style={loadingWrap}><p style={loadingHint}>Loading…</p></div>
    );
  }

  const attha = classifyByPitaka(commentary?.children?.filter((c) => !c.passageId) || []);
  const tika  = classifyByPitaka(subcommentary?.children?.filter((c) => !c.passageId) || []);

  // Pull out Visuddhimagga as a featured row (standalone masterwork).
  const visuddhimagga = attha.vism[0];

  function drill(...ids) {
    onDrill?.(ids);
  }
  function fmtCount(node) {
    if (!node) return '';
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

  const totalPassages = (commentary?.total || 0) + (subcommentary?.total || 0);
  const totalTranslated = (commentary?.translated || 0) + (subcommentary?.translated || 0);

  function renderWork(work, corpusRoot) {
    return (
      <li
        key={work.id}
        style={{ ...workItem, opacity: isDim(work) ? 0.35 : 1 }}
        onClick={() => drill(corpusRoot, work.id)}
        role="button"
        tabIndex={0}
      >
        <span style={workName}>{work.name}</span>
        {work.subtitle && <span style={workSubtitle}>{work.subtitle}</span>}
        <span style={workCount}>{fmtCount(work)}</span>
      </li>
    );
  }

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Commentaries</h1>
        <p style={pageSubtitle}>
          Aṭṭhakathā &amp; Ṭīkā &nbsp;·&nbsp; {totalPassages.toLocaleString()} passages
          {totalTranslated > 0 && (
            <> &nbsp;·&nbsp; {totalTranslated.toLocaleString()} translated</>
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

      {/* Visuddhimagga as a featured standalone block. */}
      {visuddhimagga && (
        <div style={featuredBlock}>
          <h2
            style={{ ...featuredName, opacity: isDim(visuddhimagga) ? 0.35 : 1 }}
            onClick={() => drill('pli-commentary', visuddhimagga.id)}
            role="button"
            tabIndex={0}
          >
            {visuddhimagga.name}
          </h2>
          {visuddhimagga.subtitle && (
            <p style={featuredSubtitle}>{visuddhimagga.subtitle}</p>
          )}
          <p style={featuredCount}>{fmtCount(visuddhimagga)} passages</p>
        </div>
      )}

      {/* Aṭṭhakathā: per-piṭaka commentaries in three columns. */}
      <h2 style={sectionHeader}>Aṭṭhakathā</h2>
      <p style={sectionSubtitle}>{commentary?.total?.toLocaleString() || 0} passages of commentary on the Tipiṭaka</p>
      <div style={isNarrow ? singleCol : threeCol}>
        {attha.vinaya.length > 0 && (
          <section style={column}>
            <h3 style={colHeader}>Vinaya</h3>
            <ul style={textList}>{attha.vinaya.map((w) => renderWork(w, 'pli-commentary'))}</ul>
          </section>
        )}
        {attha.sutta.length > 0 && (
          <section style={column}>
            <h3 style={colHeader}>Sutta</h3>
            <ul style={textList}>{attha.sutta.map((w) => renderWork(w, 'pli-commentary'))}</ul>
          </section>
        )}
        {attha.abhidhamma.length > 0 && (
          <section style={column}>
            <h3 style={colHeader}>Abhidhamma</h3>
            <ul style={textList}>{attha.abhidhamma.map((w) => renderWork(w, 'pli-commentary'))}</ul>
          </section>
        )}
      </div>
      {attha.other.length > 0 && (
        <div style={miscBlock}>
          <p style={miscLabel}>Other commentaries</p>
          <ul style={miscList}>{attha.other.map((w) => renderWork(w, 'pli-commentary'))}</ul>
        </div>
      )}

      {/* Sub-commentaries (Ṭīkā). */}
      {subcommentary && (subcommentary.total || 0) > 0 && (
        <>
          <h2 style={{ ...sectionHeader, marginTop: 64 }}>Ṭīkā</h2>
          <p style={sectionSubtitle}>
            Sub-commentaries · {subcommentary.total.toLocaleString()} passages
          </p>
          <div style={isNarrow ? singleCol : threeCol}>
            {tika.vinaya.length > 0 && (
              <section style={column}>
                <h3 style={colHeader}>Vinaya</h3>
                <ul style={textList}>{tika.vinaya.map((w) => renderWork(w, 'pli-subcommentary'))}</ul>
              </section>
            )}
            {tika.sutta.length > 0 && (
              <section style={column}>
                <h3 style={colHeader}>Sutta</h3>
                <ul style={textList}>{tika.sutta.map((w) => renderWork(w, 'pli-subcommentary'))}</ul>
              </section>
            )}
            {tika.abhidhamma.length > 0 && (
              <section style={column}>
                <h3 style={colHeader}>Abhidhamma</h3>
                <ul style={textList}>{tika.abhidhamma.map((w) => renderWork(w, 'pli-subcommentary'))}</ul>
              </section>
            )}
          </div>
          {(tika.vism.length > 0 || tika.other.length > 0) && (
            <div style={miscBlock}>
              <p style={miscLabel}>Other sub-commentaries</p>
              <ul style={miscList}>
                {tika.vism.map((w) => renderWork(w, 'pli-subcommentary'))}
                {tika.other.map((w) => renderWork(w, 'pli-subcommentary'))}
              </ul>
            </div>
          )}
        </>
      )}

      <footer style={footerWrap}>
        <div style={rule} />
        <p style={attribution}>
          Commentary corpus ingested from VRI / CST (Chaṭṭha Saṅgāyana
          Tipiṭaka). Author-attribution and dating follow Norman / von
          Hinüber chronologies.
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
  paddingTop: 56,
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

const featuredCount = {
  margin: '6px 0 0',
  fontFamily: SANS,
  fontSize: 11,
  letterSpacing: '0.10em',
  color: 'var(--bc-text-tertiary)',
  fontVariantNumeric: 'tabular-nums',
};

const sectionHeader = {
  maxWidth: 1100,
  margin: '52px auto 4px',
  padding: '0 20px',
  fontFamily: SERIF,
  fontSize: 18,
  fontWeight: 500,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-primary)',
  textAlign: 'center',
};

const sectionSubtitle = {
  maxWidth: 1100,
  margin: '0 auto 24px',
  padding: '0 20px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 12,
  color: 'var(--bc-text-tertiary)',
  textAlign: 'center',
};

const threeCol = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '0 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 48,
  alignItems: 'start',
};

const singleCol = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '0 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
  alignItems: 'stretch',
};

const column = {
  textAlign: 'center',
  fontFamily: SERIF,
};

const colHeader = {
  margin: '0 0 14px',
  fontFamily: SERIF,
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  paddingBottom: 8,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
};

const textList = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const workItem = {
  fontFamily: SERIF,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  alignItems: 'center',
  cursor: 'pointer',
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

const miscBlock = {
  maxWidth: 720,
  margin: '32px auto 0',
  padding: '0 28px',
  textAlign: 'center',
};

const miscLabel = {
  margin: '0 0 14px',
  fontFamily: SANS,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.20em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const miscList = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
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
