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
import useIsNarrow from './useIsNarrow.js';
import { isModifiedClick, browseHref } from './linkHelpers.js';

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
  const isNarrow = useIsNarrow();
  // On narrow viewports, the three-column grid would force horizontal
  // scroll. Replace it with a piṭaka selector + single column showing
  // just the active piṭaka. Sutta is the default since it's where
  // virtually all reader interest concentrates.
  const [activePitaka, setActivePitaka] = useState('pli-sutta');

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
  // Anchor-click guard. Plain clicks route via the SPA; modified
  // clicks (Cmd/Ctrl/Shift/middle) fall through to the browser so the
  // user can open the drill destination in a new tab.
  function handleAnchorClick(e, ids) {
    if (isModifiedClick(e)) return;
    e.preventDefault();
    drill(...ids);
  }
  // When the filter is on, counts show only the translated portion
  // ("4,669 passages with translation") and entries with zero of those
  // are hidden via isHidden — not just dimmed. That matches what a
  // scholar expects from "Translated only".
  function fmtCount(node) {
    if (!node) return '';
    const total = node.total || 0;
    const tr = node.translated || 0;
    if (translatedOnly) return tr.toLocaleString();
    return total.toLocaleString();
  }
  function isHidden(node) {
    return translatedOnly && (node?.translated || 0) === 0;
  }

  return (
    <div data-scroll-root="" style={scrollWrap}>
     <div style={pageColumn}>
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

      {/* Narrow viewport: chip selector for piṭaka, then one column. */}
      {isNarrow && (
        <div style={pitakaSelector} role="tablist">
          {[vinaya, sutta, abhidhamma].filter(Boolean).map((p) => {
            const on = activePitaka === p.id;
            return (
              <button
                key={p.id}
                role="tab"
                aria-selected={on}
                onClick={() => setActivePitaka(p.id)}
                style={{
                  ...pitakaChip,
                  color: on ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
                  borderColor: on ? 'var(--bc-accent)' : 'rgba(var(--bc-accent-rgb), 0.20)',
                  fontWeight: on ? 600 : 400,
                }}
              >
                {p.name.replace(/\s+Piṭaka$/u, '')}
              </button>
            );
          })}
        </div>
      )}

      <div style={isNarrow ? singleCol : threeCol}>
        {/* Vinaya */}
        {vinaya && !isHidden(vinaya) && (!isNarrow || activePitaka === 'pli-vinaya') && (
          <section style={column}>
            <a
              href={browseHref([tipitaka.id, vinaya.id])}
              style={{ ...colHeader, ...drillLinkReset }}
              onClick={(e) => handleAnchorClick(e, [tipitaka.id, vinaya.id])}
            >
              Vinaya Piṭaka
            </a>
            <p style={colCount}>{fmtCount(vinaya)} passages</p>
            <p style={colKind}>five books</p>
            {/* The 5 books are stored flat under pli-vinaya in our corpus
                (not as separate sub-works), so every book name routes to
                the same drill destination. Click affordance kept so the
                column reads as interactive — matches Sutta visually — and
                the destination is the same Vinaya-wide list either way. */}
            <ul style={textList}>
              {VINAYA_BOOKS.map((name) => (
                <li key={name} style={flatBookRowLi}>
                  <a
                    href={browseHref([tipitaka.id, vinaya.id])}
                    style={{ ...textListItem, ...flatBookRow, ...drillLinkReset }}
                    onClick={(e) => handleAnchorClick(e, [tipitaka.id, vinaya.id])}
                    title="Open Vinaya passages — the five books are not yet separately browsable in the corpus"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sutta */}
        {sutta && !isHidden(sutta) && (!isNarrow || activePitaka === 'pli-sutta') && (
          <section style={column}>
            <a
              href={browseHref([tipitaka.id, sutta.id])}
              style={{ ...colHeader, ...drillLinkReset }}
              onClick={(e) => handleAnchorClick(e, [tipitaka.id, sutta.id])}
            >
              Sutta Piṭaka
            </a>
            <p style={colCount}>{fmtCount(sutta)} passages</p>
            <p style={colKind}>five collections</p>
            <ul style={textList}>
              {nikayasOrdered.filter((n) => !isHidden(n)).map((n) => (
                <li key={n.id} style={flatBookRowLi}>
                  <a
                    href={browseHref([tipitaka.id, sutta.id, n.id])}
                    style={{ ...textListItem, ...nikayaRow, ...drillLinkReset }}
                    onClick={(e) => handleAnchorClick(e, [tipitaka.id, sutta.id, n.id])}
                  >
                    <span style={nikayaName}>{shortNikaya(n.name)} Nikāya</span>
                    <span style={nikayaCount}>{fmtCount(n)}</span>
                  </a>
                </li>
              ))}
            </ul>

          </section>
        )}

        {/* Abhidhamma */}
        {abhidhamma && !isHidden(abhidhamma) && (!isNarrow || activePitaka === 'pli-abhidhamma') && (
          <section style={column}>
            <a
              href={browseHref([tipitaka.id, abhidhamma.id])}
              style={{ ...colHeader, ...drillLinkReset }}
              onClick={(e) => handleAnchorClick(e, [tipitaka.id, abhidhamma.id])}
            >
              Abhidhamma Piṭaka
            </a>
            <p style={colCount}>{fmtCount(abhidhamma)} passages</p>
            <p style={colKind}>seven books</p>
            {/* Same situation as Vinaya — the 7 books are flat in the
                corpus, so each name routes to the same drill destination. */}
            <ul style={textList}>
              {ABHIDHAMMA_BOOKS.map((name) => (
                <li key={name} style={flatBookRowLi}>
                  <a
                    href={browseHref([tipitaka.id, abhidhamma.id])}
                    style={{ ...textListItem, ...flatBookRow, ...drillLinkReset }}
                    onClick={(e) => handleAnchorClick(e, [tipitaka.id, abhidhamma.id])}
                    title="Open Abhidhamma passages — the seven books are not yet separately browsable in the corpus"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Khuddaka books — pulled out of the Sutta column and shown
          centered below all three piṭakas. The 18 sub-books make Sutta
          asymmetric when listed inline; a dedicated full-width row
          reads as the natural continuation of the diagram. On narrow
          viewports only show this when Sutta is the active piṭaka. */}
      {(() => {
        const visible = khuddakaBooks.filter((b) => !isHidden(b));
        if (visible.length === 0) return null;
        if (isNarrow && activePitaka !== 'pli-sutta') return null;
        return (
          <section style={khuddakaSection}>
            <div style={khuddakaRule} />
            <p style={khuddakaHeader}>Khuddaka books</p>
            {/* Flex-wrap so the 18 abbreviations flow onto multiple
                rows on narrow viewports rather than blowing out into a
                horizontal scrollbar. Each tag + dot pair is a single
                inline-flex unit so the separator never wraps alone. */}
            <div style={khuddakaInline}>
              {visible.map((b, i) => (
                <span key={b.id} style={khuddakaCell}>
                  <a
                    href={browseHref([tipitaka.id, sutta.id, kn.id, b.id])}
                    style={{ ...khuddakaTag, ...drillLinkReset }}
                    onClick={(e) => handleAnchorClick(e, [tipitaka.id, sutta.id, kn.id, b.id])}
                    title={`${b.name} · ${(b.total || 0).toLocaleString()} passages${translatedOnly ? ` (${(b.translated || 0).toLocaleString()} translated)` : ''}`}
                  >
                    {KHUDDAKA_ABBREV[b.id] || b.name}
                  </a>
                  {i < visible.length - 1 && <span style={dotSep}>·</span>}
                </span>
              ))}
            </div>
          </section>
        );
      })()}

      <footer style={footerWrap}>
        <div style={rule} />
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
  paddingTop: 56, // clearance for the fixed TopNav
};

// pageColumn is the outer hug-left container, sized to the widest
// inner block (threeCol at 1100). It anchors the whole page to
// scrollWrap's left edge so the left margin matches Library's tight
// gap between sidebar and content. Inside this column every sub-block
// uses `margin: ... auto ...` to self-centre, which puts the title,
// section headers, threeCol, and footer all on the same vertical axis
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
  padding: '0 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 48,
  alignItems: 'start',
};

const singleCol = {
  maxWidth: 480,
  margin: '32px auto 0',
  padding: '0 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  alignItems: 'stretch',
};

const pitakaSelector = {
  maxWidth: 480,
  margin: '24px auto 0',
  padding: '0 24px',
  display: 'flex',
  justifyContent: 'center',
  gap: 6,
};

const pitakaChip = {
  flex: '0 1 auto',
  padding: '8px 14px',
  background: 'transparent',
  border: '1px solid',
  borderRadius: 999,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  transition: 'color 120ms ease, border-color 120ms ease',
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

// Drill targets render as <a href> so the browser exposes a real
// link target on each row. flatBookRowLi wraps each anchor inside
// the <ul> without a default bullet; drillLinkReset strips the
// default <a> underline + colour so anchors read identically to the
// old <h2>/<li> versions.
const flatBookRowLi = {
  listStyle: 'none',
};

const drillLinkReset = {
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
};

const nikayaRow = {
  display: 'inline-flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: 12,
  cursor: 'pointer',
  transition: 'color 120ms ease',
};

// Same affordance as a nikāya row, but slightly dimmer to signal that
// these route to the whole-piṭaka view rather than a book-specific
// drill (Vinaya + Abhidhamma books aren't separated as sub-works in
// the corpus yet).
const flatBookRow = {
  cursor: 'pointer',
  transition: 'color 120ms ease',
  color: 'var(--bc-text-secondary)',
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

// Khuddaka row sits below the three-column piṭaka grid as a centered
// strip. Width is bounded so the pills don't sprawl across a wide
// viewport; they wrap to a couple of lines instead.
const khuddakaSection = {
  maxWidth: 720,
  margin: '48px auto 0',
  padding: '0 32px',
  textAlign: 'center',
};

const khuddakaRule = {
  height: 1,
  background: 'rgba(var(--bc-accent-rgb), 0.22)',
  margin: '0 auto 20px',
  maxWidth: 420,
};

const khuddakaHeader = {
  margin: '0 0 14px',
  fontFamily: SANS,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.20em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const khuddakaInline = {
  margin: 0,
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 14,
  lineHeight: 1.8,
  color: 'var(--bc-text-secondary)',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  rowGap: 4,
};

// Each "tag · " unit is a single inline-flex cell so the separator
// stays welded to its preceding tag and the whole pair wraps together
// rather than the dot stranding at the start of a new line.
const khuddakaCell = {
  display: 'inline-flex',
  alignItems: 'baseline',
  whiteSpace: 'nowrap',
};

const khuddakaTag = {
  cursor: 'pointer',
  transition: 'color 120ms ease',
};

const dotSep = {
  color: 'var(--bc-text-tertiary)',
  fontStyle: 'normal',
  padding: '0 8px',
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
