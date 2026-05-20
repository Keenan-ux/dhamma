// Typeset frontmatter of the Tipiṭaka. Replaces the family-tree diagram
// with a classical three-column book-style page: no boxes, no connector
// lines, just typography + thin gold rules. Reads as a printed table of
// contents from a 19th-century Pali typesetter; click any name to drill.
//
// Three columns mirror the canonical Pannyavaro split (Vinaya · Sutta ·
// Abhidhamma). Sub-divisions inside each piṭaka are listed textually.
// Sub-divisions that don't exist as separate works in the corpus (Vinaya
// books, Abhidhamma books — both flat in our schema) render as plain
// text; the live works (Sutta's five nikāyas, Khuddaka's 18 sub-books)
// are clickable.

import { useMemo, useState } from 'react';
import useCorpus from './useCorpus.js';

// PTS-style abbreviations for the 18 books of the Khuddaka Nikāya,
// rendered as a compact inline list under Sutta. Keys are work slugs.
const KHUDDAKA_ABBREV = {
  'pli-kp':   'Khp',
  'pli-dhp':  'Dhp',
  'pli-ud':   'Ud',
  'pli-iti':  'Iti',
  'pli-snp':  'Snp',
  'pli-vv':   'Vv',
  'pli-pv':   'Pv',
  'pli-thag': 'Th',
  'pli-thig': 'Thī',
  'pli-ap':   'Ap',
  'pli-ja':   'Ja',
  'pli-nd':   'Nd',
  'pli-ps':   'Pṭs',
  'pli-bv':   'Bv',
  'pli-cp':   'Cp',
  'pli-mil':  'Mil',
  'pli-ne':   'Net',
  'pli-pe':   'Peṭ',
};

// Vinaya is stored as a flat work in our schema, but the canon itself
// has a known 5-book structure. Listed textually for the diagram.
const VINAYA_BOOKS = [
  'Bhikkhu-vibhaṅga',
  'Bhikkhunī-vibhaṅga',
  'Mahāvagga',
  'Cullavagga',
  'Parivāra',
];

// Same for Abhidhamma — flat in our DB, 7 canonical books in tradition.
const ABHIDHAMMA_BOOKS = [
  'Dhammasaṅgaṇī',
  'Vibhaṅga',
  'Dhātukathā',
  'Puggalapaññatti',
  'Kathāvatthu',
  'Yamaka',
  'Paṭṭhāna',
];

function shortNikaya(name) {
  return name.replace(/\s+Nikāya$/u, '');
}

export default function CanonMapView({ onDrill }) {
  const { shape, loading } = useCorpus();
  const [translatedOnly, setTranslatedOnly] = useState(false);

  const tipitaka = useMemo(() => {
    const trad = shape?.tree?.find((t) => t.id === 'theravada');
    return trad?.children?.find((w) => w.id === 'pli-tipitaka') || null;
  }, [shape]);

  if (loading || !tipitaka) {
    return (
      <div style={loadingWrap}>
        <p style={loadingHint}>Loading the canon…</p>
      </div>
    );
  }

  const piṭakas = (tipitaka.children || []).filter((c) => !c.passageId);
  const vinaya     = piṭakas.find((w) => w.id === 'pli-vinaya');
  const sutta      = piṭakas.find((w) => w.id === 'pli-sutta');
  const abhidhamma = piṭakas.find((w) => w.id === 'pli-abhidhamma');

  const nikayas = (sutta?.children || []).filter((c) => !c.passageId);
  // Canonical order: DN MN SN AN KN. Prod data lacks display_order so the
  // server falls back to alphabetical slug sort; impose canonical order
  // here so the Pannyavaro layout reads correctly.
  const NIKAYA_ORDER = ['pli-dn', 'pli-mn', 'pli-sn', 'pli-an', 'pli-kn'];
  const nikayasOrdered = NIKAYA_ORDER.map((id) => nikayas.find((n) => n.id === id)).filter(Boolean);

  const kn = nikayas.find((n) => n.id === 'pli-kn');
  const khuddakaBooks = (kn?.children || []).filter((c) => !c.passageId);

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

  return (
    <div style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Tipiṭaka</h1>
        <p style={pageSubtitle}>
          the Pali Canon &nbsp;·&nbsp; {tipitaka.total.toLocaleString()} passages
          {(tipitaka.translated || 0) > 0 && (
            <> &nbsp;·&nbsp; {tipitaka.translated.toLocaleString()} translated</>
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

      <div style={threeCol}>
        {/* Vinaya */}
        {vinaya && (
          <section style={column}>
            <h2
              style={{ ...colHeader, opacity: isDim(vinaya) ? 0.35 : 1 }}
              onClick={() => drill(tipitaka.id, vinaya.id)}
              role="button"
              tabIndex={0}
            >
              Vinaya Piṭaka
            </h2>
            <p style={colCount}>{fmtCount(vinaya)} passages</p>
            <p style={colKind}>five books</p>
            <ul style={textList}>
              {VINAYA_BOOKS.map((name) => (
                <li key={name} style={textListItem}>{name}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Sutta */}
        {sutta && (
          <section style={column}>
            <h2
              style={{ ...colHeader, opacity: isDim(sutta) ? 0.35 : 1 }}
              onClick={() => drill(tipitaka.id, sutta.id)}
              role="button"
              tabIndex={0}
            >
              Sutta Piṭaka
            </h2>
            <p style={colCount}>{fmtCount(sutta)} passages</p>
            <p style={colKind}>five collections</p>
            <ul style={textList}>
              {nikayasOrdered.map((n) => (
                <li
                  key={n.id}
                  style={{ ...textListItem, ...nikayaRow, opacity: isDim(n) ? 0.35 : 1 }}
                  onClick={() => drill(tipitaka.id, sutta.id, n.id)}
                  role="button"
                  tabIndex={0}
                >
                  <span style={nikayaName}>{shortNikaya(n.name)} Nikāya</span>
                  <span style={nikayaCount}>{fmtCount(n)}</span>
                </li>
              ))}
            </ul>

            {khuddakaBooks.length > 0 && (
              <>
                <p style={colSubKind}>khuddaka books</p>
                <p style={khuddakaInline}>
                  {khuddakaBooks.map((b, i) => (
                    <span key={b.id}>
                      <span
                        style={{ ...khuddakaTag, opacity: isDim(b) ? 0.35 : 1 }}
                        onClick={() => drill(tipitaka.id, sutta.id, kn.id, b.id)}
                        role="button"
                        tabIndex={0}
                        title={`${b.name} · ${(b.total || 0).toLocaleString()} passages`}
                      >
                        {KHUDDAKA_ABBREV[b.id] || b.name}
                      </span>
                      {i < khuddakaBooks.length - 1 && <span style={dotSep}>&nbsp;·&nbsp;</span>}
                    </span>
                  ))}
                </p>
              </>
            )}
          </section>
        )}

        {/* Abhidhamma */}
        {abhidhamma && (
          <section style={column}>
            <h2
              style={{ ...colHeader, opacity: isDim(abhidhamma) ? 0.35 : 1 }}
              onClick={() => drill(tipitaka.id, abhidhamma.id)}
              role="button"
              tabIndex={0}
            >
              Abhidhamma Piṭaka
            </h2>
            <p style={colCount}>{fmtCount(abhidhamma)} passages</p>
            <p style={colKind}>seven books</p>
            <ul style={textList}>
              {ABHIDHAMMA_BOOKS.map((name) => (
                <li key={name} style={textListItem}>{name}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer style={footerWrap}>
        <div style={rule} />
        <p style={attribution}>
          After Ven. Pannyavaro’s Tipiṭaka diagram (Buddha Dharma Education
          Association, 2000).
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
  fontSize: 38,
  fontWeight: 500,
  letterSpacing: '0.30em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-primary)',
  // Pull the right padding out of letter-spacing so the title looks
  // optically centered despite the extra trailing space.
  paddingLeft: '0.30em',
};

const pageSubtitle = {
  margin: '0 0 24px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  letterSpacing: '0.02em',
  color: 'var(--bc-text-tertiary)',
};

// Quiet control row sitting between the title block and the three-column
// frontmatter. Houses the translation filter, the most-used setting.
const topControls = {
  maxWidth: 820,
  margin: '24px auto 0',
  padding: '0 28px',
  display: 'flex',
  justifyContent: 'center',
};

const threeCol = {
  maxWidth: 1100,
  margin: '32px auto 0',
  padding: '0 32px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 48,
  alignItems: 'start',
};

const column = {
  textAlign: 'center',
  fontFamily: SERIF,
};

const colHeader = {
  margin: 0,
  fontFamily: SERIF,
  fontSize: 17,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-primary)',
  cursor: 'pointer',
  transition: 'color 120ms ease',
};

const colCount = {
  margin: '6px 0 0',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 12,
  color: 'var(--bc-text-tertiary)',
  fontVariantNumeric: 'tabular-nums',
};

const colKind = {
  margin: '22px 0 12px',
  fontFamily: SANS,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.20em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const colSubKind = {
  margin: '20px 0 10px',
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
  gap: 6,
};

const textListItem = {
  fontFamily: SERIF,
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--bc-text-secondary)',
};

const nikayaRow = {
  display: 'inline-flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: 12,
  cursor: 'pointer',
  transition: 'color 120ms ease',
};

const nikayaName = {
  fontFamily: SERIF,
  fontSize: 14,
  letterSpacing: '0.01em',
};

const nikayaCount = {
  fontFamily: SANS,
  fontSize: 10,
  color: 'var(--bc-text-tertiary)',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.04em',
};

const khuddakaInline = {
  margin: 0,
  padding: '0 8px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 12,
  lineHeight: 1.8,
  color: 'var(--bc-text-secondary)',
};

const khuddakaTag = {
  cursor: 'pointer',
  transition: 'color 120ms ease',
};

const dotSep = {
  color: 'var(--bc-text-tertiary)',
  fontStyle: 'normal',
};

const footerWrap = {
  maxWidth: 580,
  margin: '72px auto 56px',
  padding: '0 28px',
  textAlign: 'center',
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

const attribution = {
  margin: 0,
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
