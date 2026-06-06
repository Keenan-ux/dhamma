// Research: long-form scholarly studies built on the corpus. Unlike the
// Docs (short how-it-works notes served from the articles table), Research
// entries are self-contained data documents bundled as static JSON under
// /research/. The first entry is the awakening census: every passage in the
// corpus carrying an attainment marker, classified by precipitating
// circumstance and split canon vs commentary.
//
// Index + article, with the open entry tracked in the hash (#/research/<slug>)
// so deep links survive reload and re-clicking the sidebar tab returns to the
// index. Mirrors DocsView / LibraryView hash handling.

import { useEffect, useRef, useState } from 'react';
import { isModifiedClick } from './linkHelpers.js';
/* eslint-disable react-hooks/exhaustive-deps */

const ENTRIES = [
  {
    slug: 'awakening',
    title: 'Every Instance of Awakening in the Pāli Canon and Commentary',
    subtitle: 'A census of 2,214 awakening events, classified by what precipitated them.',
    data: '/research/awakening-events.json',
  },
];

export default function ResearchView() {
  const [openSlug, setOpenSlug] = useState(null);

  useEffect(() => {
    function syncFromHash() {
      const m = window.location.hash.match(/^#\/research\/(.+)$/);
      const next = m ? decodeURIComponent(m[1]) : null;
      setOpenSlug((prev) => (prev === next ? prev : next));
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  // Mirror an OPEN entry into the hash. This only ever asserts the slug when
  // one is open, so it is idempotent under StrictMode's double-invoke and
  // never clobbers a deep-linked slug while openSlug is transiently null. The
  // back-to-index reset is handled in onBack; Dhamma's writer leaves a
  // non-empty research sub-path alone (see Dhamma URL-writing effect).
  useEffect(() => {
    if (!openSlug) return;
    const want = `#/research/${encodeURIComponent(openSlug)}`;
    if (window.location.hash !== want) window.history.replaceState(null, '', want);
  }, [openSlug]);

  const entry = openSlug ? ENTRIES.find((e) => e.slug === openSlug) : null;
  if (entry) {
    return (
      <AwakeningStudy
        entry={entry}
        onBack={() => { setOpenSlug(null); window.history.replaceState(null, '', '#/research'); }}
      />
    );
  }

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Research</h1>
        <p style={pageSubtitle}>
          Long-form studies built directly on the corpus. Counts are reproducible
          from the live database.
        </p>
        <div style={rule} />
      </header>

      <ul style={list}>
        {ENTRIES.map((e) => (
          <li key={e.slug} style={itemRow}>
            <a
              href={`#/research/${encodeURIComponent(e.slug)}`}
              onClick={(ev) => { if (isModifiedClick(ev)) return; ev.preventDefault(); setOpenSlug(e.slug); }}
              style={itemLink}
              aria-label={`Open ${e.title}`}
            >
              <span style={itemTitle}>{e.title}</span>
              <span style={itemAuthor}>{e.subtitle}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const LAYER = {
  mula: { label: 'Canon', full: 'Tipiṭaka (mūla)' },
  attha: { label: 'Comm.', full: 'Commentary (aṭṭhakathā)' },
  tika: { label: 'Sub-comm.', full: 'Sub-commentary (ṭīkā)' },
  anya: { label: 'Extra', full: 'Extra-canonical' },
};
const LAYER_KEYS = ['mula', 'attha', 'tika', 'anya'];

function AwakeningStudy({ entry, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    setData(null); setError(null);
    const ac = new AbortController();
    fetch(entry.data, { signal: ac.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') setError(e); });
    return () => ac.abort();
  }, [entry.data]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onBack?.(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onBack]);

  function jumpTo(key) {
    setOpen((o) => ({ ...o, [key]: true }));
    // Defer scroll until the (now-open) section has rendered its body.
    requestAnimationFrame(() => {
      const el = sectionRefs.current[key];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const narrated = data ? data.totals.events - (data.buckets.find((b) => b.key === 'NOT_STATED')?.count || 0) : 0;
  const sum = (obj) => LAYER_KEYS.reduce((s, k) => s + (obj?.[k] || 0), 0);
  const colTotals = data
    ? LAYER_KEYS.reduce((acc, k) => { acc[k] = data.buckets.reduce((s, b) => s + (b.byLayer[k] || 0), 0); return acc; }, {})
    : {};

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <article style={articleReadWrap}>
        <button onClick={onBack} style={backBtn} aria-label="Back to Research (Esc)">
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to Research</span>
          <span style={backBtnHint}>Esc</span>
        </button>

        {!data && !error && <p style={hint}>Loading the census…</p>}
        {error && <p style={errorHint}>Failed to load: {error.message}</p>}

        {data && (
          <>
            <header style={articleHeader}>
              <h1 style={articleHeaderTitle}>{entry.title}</h1>
              <p style={articleHeaderAuthor}>{entry.subtitle}</p>
            </header>

            <div style={articleBody}>
              <p>
                This study scans the entire live corpus ({fmt(194710)} passages) for every
                attainment marker (arahattaṁ pāpuṇi, cittaṁ vimucci, desanāpariyosāne,
                the path-and-fruit verbs, and their kin), then reads each candidate to decide
                whether it narrates an actual awakening event and, if so, what precipitated it.
                Of {fmt(data.totals.classified)} marker passages, {fmt(data.totals.events)} narrate a
                real awakening event; {fmt(data.totals.non_events)} were doctrinal or abstract uses and
                are set aside.
              </p>
              <p style={{ marginBottom: 4 }}>
                Two headline findings. First, awakening in this corpus is overwhelmingly an
                occasioned event rather than the climax of solitary striving: hearing the Dhamma
                accounts for {pct(data.buckets.find((b) => b.key === 'HEARING_DHAMMA')?.count, narrated)} of
                events whose occasion is stated, formal striving for about a quarter, and a discrete
                external trigger (a sight, a fall, a crisis, a transition between postures) for only
                about one in fourteen. Second, the narrated awakenings live mostly in the
                commentaries, not the canon: see the second table.
              </p>
              <p style={methodNote}>
                Method and confidence: recall is marker-bounded (an awakening narrated with no stock
                phrase is not captured). Classification was done by a 114-agent pass over the corpus;
                an independent re-classification of {data.verification.passages_compared} passages agreed{' '}
                {data.verification.exact_bucket_agreement_pct}% on the exact circumstance and{' '}
                {data.verification.event_agreement_pct}% on whether a passage is an event at all. The
                small buckets carry real boundary fuzz. Every count below is reproducible from the
                live database. Click any circumstance to jump to its complete, cited list; each
                citation opens the passage in the reader.
              </p>

              {/* Table 1: by circumstance */}
              <h2 style={h2}>Table 1. Awakening events by precipitating circumstance</h2>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Circumstance</th>
                      <th style={thNum}>Events</th>
                      <th style={thNum}>% of all</th>
                      <th style={thNum}>% of stated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.buckets.map((b) => (
                      <tr key={b.key} style={tr}>
                        <td style={tdLeft}>
                          <button style={catLink} onClick={() => jumpTo(b.key)}>{b.label}</button>
                          {b.key === 'NOT_STATED' && <span style={tinyNote}> (excluded from “stated” base)</span>}
                        </td>
                        <td style={tdNum}>{fmt(b.count)}</td>
                        <td style={tdNum}>{pct(b.count, data.totals.events)}</td>
                        <td style={tdNum}>{b.key === 'NOT_STATED' ? '·' : pct(b.count, narrated)}</td>
                      </tr>
                    ))}
                    <tr style={trTotal}>
                      <td style={tdLeft}>All events</td>
                      <td style={tdNum}>{fmt(data.totals.events)}</td>
                      <td style={tdNum}>100%</td>
                      <td style={tdNum}></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table 2: canon vs commentary (the crucial split) */}
              <h2 style={h2}>Table 2. Canon versus commentary, by circumstance</h2>
              <p style={tableCaption}>
                The crux of the study: where each kind of awakening is narrated. The canon
                states the Dhamma; the commentaries supply the biography.
              </p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Circumstance</th>
                      {LAYER_KEYS.map((k) => (
                        <th key={k} style={thNum} title={LAYER[k].full}>{LAYER[k].label}</th>
                      ))}
                      <th style={thNum}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.buckets.map((b) => (
                      <tr key={b.key} style={tr}>
                        <td style={tdLeft}>
                          <button style={catLink} onClick={() => jumpTo(b.key)}>{b.label}</button>
                        </td>
                        {LAYER_KEYS.map((k) => (
                          <td key={k} style={tdNum}>{b.byLayer[k] ? fmt(b.byLayer[k]) : '·'}</td>
                        ))}
                        <td style={tdNumStrong}>{fmt(sum(b.byLayer))}</td>
                      </tr>
                    ))}
                    <tr style={trTotal}>
                      <td style={tdLeft}>All events</td>
                      {LAYER_KEYS.map((k) => (
                        <td key={k} style={tdNumStrong}>{fmt(colTotals[k])}</td>
                      ))}
                      <td style={tdNumStrong}>{fmt(data.totals.events)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={tableCaption}>
                Column key: Canon = Tipiṭaka (mūla); Comm. = aṭṭhakathā; Sub-comm. = ṭīkā;
                Extra = extra-canonical. {fmt(colTotals.attha + colTotals.tika)} of {fmt(data.totals.events)} events
                ({pct(colTotals.attha + colTotals.tika, data.totals.events)}) are commentarial;
                only {fmt(colTotals.mula)} ({pct(colTotals.mula, data.totals.events)}) are in the canon itself.
              </p>

              {/* Complete cited lists, one section per circumstance */}
              <h2 style={h2}>Complete cited list</h2>
              <p style={tableCaption}>
                Every event, grouped by circumstance. Each citation opens the passage in the
                reader. The evidence column quotes the phrase that justifies the classification.
              </p>
              {data.buckets.map((b) => (
                <section key={b.key} ref={(el) => { sectionRefs.current[b.key] = el; }} style={bucketSection}>
                  <button
                    style={bucketHeader}
                    aria-expanded={!!open[b.key]}
                    onClick={() => setOpen((o) => ({ ...o, [b.key]: !o[b.key] }))}
                  >
                    <span aria-hidden="true" style={{ width: 16, display: 'inline-block' }}>{open[b.key] ? '▾' : '▸'}</span>
                    <span style={bucketTitle}>{b.label}</span>
                    <span style={bucketCount}>{fmt(b.count)}</span>
                  </button>
                  {open[b.key] && (
                    <>
                      <p style={bucketBlurb}>{b.blurb}</p>
                      <ol style={evList}>
                        {b.events.map((e) => (
                          <li key={e.id} style={evRow}>
                            <a
                              href={`#/read/${encodeURIComponent(e.id)}`}
                              style={evCite}
                              title={`Open ${e.citation} in the reader`}
                            >
                              {e.citation}
                            </a>
                            <span style={evLayer} title={LAYER[e.layer]?.full || e.layer}>{LAYER[e.layer]?.label || e.layer}</span>
                            {e.being && <span style={evBeing}>{e.being}</span>}
                            {e.evidence && <span style={evEvidence}>{e.evidence}</span>}
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </section>
              ))}

              <p style={footNote}>
                Generated {data.generated}. Dataset: {fmt(data.totals.events)} events across{' '}
                {data.buckets.length} circumstance classes. Reproducible from the corpus via the
                attainment-marker query described above.
              </p>
            </div>
          </>
        )}
      </article>
    </div>
  );
}

function fmt(n) { return (n ?? 0).toLocaleString('en-US'); }
function pct(n, d) { if (!d) return '·'; return `${Math.round((100 * (n || 0)) / d)}%`; }

// --- styles (mirrors Docs / Library academic typesetting) ---
const SERIF = '"Noto Serif", Georgia, serif';
const scrollWrap = { position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 };

const pageHeader = { maxWidth: 820, margin: '64px 0 0', padding: '0 28px', textAlign: 'center' };
const rule = { height: 1, background: 'rgba(var(--bc-accent-rgb), 0.32)', margin: '0 auto', maxWidth: 580 };
const pageTitle = {
  margin: '24px 0 6px', fontFamily: SERIF, fontSize: 32, fontWeight: 500,
  letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--bc-text-primary)', paddingLeft: '0.26em',
};
const pageSubtitle = { margin: '0 0 24px', fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: 'var(--bc-text-tertiary)' };
const list = { maxWidth: 720, margin: '32px 0 64px', padding: '0 28px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 };
const itemRow = { borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.10)' };
const itemLink = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '12px 0', textDecoration: 'none', color: 'inherit', fontFamily: SERIF, cursor: 'pointer' };
const itemTitle = { fontFamily: SERIF, fontSize: 16, color: 'var(--bc-text-primary)', lineHeight: 1.4 };
const itemAuthor = { fontFamily: SERIF, fontStyle: 'italic', fontSize: 12, color: 'var(--bc-text-secondary)' };

const hint = { margin: '40px 0', textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: 'var(--bc-text-tertiary)' };
const errorHint = { margin: '40px 0', textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: 'var(--bc-loss-text)' };

const articleReadWrap = { position: 'relative', maxWidth: 860, margin: '0 0', padding: '28px 28px 80px' };
const backBtn = { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: 'var(--bc-text-tertiary)', fontSize: 13, letterSpacing: '0.02em', cursor: 'pointer', padding: '6px 0', marginBottom: 18, fontFamily: 'inherit' };
const backBtnHint = { fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bc-text-tertiary)', border: '1px solid rgba(var(--bc-accent-rgb), 0.18)', borderRadius: 4, padding: '2px 6px' };

const articleHeader = { marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.22)' };
const articleHeaderTitle = { margin: 0, fontFamily: SERIF, fontSize: 26, fontWeight: 500, letterSpacing: '0.01em', color: 'var(--bc-text-primary)', lineHeight: 1.25 };
const articleHeaderAuthor = { margin: '8px 0 0', fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: 'var(--bc-accent)' };
const articleBody = { fontFamily: SERIF, fontSize: 15, lineHeight: 1.75, color: 'var(--bc-text-primary)' };

const methodNote = { fontSize: 13, fontStyle: 'italic', color: 'var(--bc-text-secondary)', lineHeight: 1.7, borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.28)', paddingLeft: 14, margin: '18px 0 8px' };

const h2 = { fontFamily: SERIF, fontSize: 17, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--bc-text-primary)', margin: '34px 0 10px' };
const tableCaption = { fontSize: 12.5, fontStyle: 'italic', color: 'var(--bc-text-tertiary)', lineHeight: 1.6, margin: '0 0 12px' };

const tableWrap = { overflowX: 'auto', margin: '6px 0 8px' };
const table = { width: '100%', borderCollapse: 'collapse', fontFamily: SERIF, fontSize: 14, fontVariantNumeric: 'tabular-nums' };
const thLeft = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid rgba(var(--bc-accent-rgb), 0.30)', fontWeight: 600, fontSize: 12.5, letterSpacing: '0.04em', color: 'var(--bc-text-secondary)' };
const thNum = { ...thLeft, textAlign: 'right', whiteSpace: 'nowrap' };
const tr = { borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.10)' };
const trTotal = { borderTop: '2px solid rgba(var(--bc-accent-rgb), 0.30)', fontWeight: 600 };
const tdLeft = { textAlign: 'left', padding: '7px 10px', color: 'var(--bc-text-primary)' };
const tdNum = { textAlign: 'right', padding: '7px 10px', color: 'var(--bc-text-primary)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' };
const tdNumStrong = { ...tdNum, fontWeight: 600 };
const catLink = { background: 'transparent', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'var(--bc-accent)', cursor: 'pointer', textAlign: 'left', textDecoration: 'underline', textDecorationColor: 'rgba(var(--bc-accent-rgb), 0.4)', textUnderlineOffset: 3 };
const tinyNote = { fontSize: 11, fontStyle: 'italic', color: 'var(--bc-text-tertiary)' };

const bucketSection = { scrollMarginTop: 64, borderTop: '1px solid rgba(var(--bc-accent-rgb), 0.12)' };
const bucketHeader = { display: 'flex', alignItems: 'baseline', gap: 10, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '12px 2px', fontFamily: SERIF, color: 'var(--bc-text-primary)', textAlign: 'left' };
const bucketTitle = { fontSize: 15, fontWeight: 600, flex: 1 };
const bucketCount = { fontSize: 13, color: 'var(--bc-text-tertiary)', fontVariantNumeric: 'tabular-nums' };
const bucketBlurb = { fontSize: 13, fontStyle: 'italic', color: 'var(--bc-text-secondary)', margin: '0 0 10px', paddingLeft: 26 };
const evList = { listStyle: 'decimal', margin: '0 0 16px', padding: '0 0 0 44px', display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--bc-text-tertiary)' };
const evRow = { paddingLeft: 4, lineHeight: 1.5 };
const evCite = { fontFamily: SERIF, fontSize: 13.5, fontWeight: 600, color: 'var(--bc-accent)', textDecoration: 'none', marginRight: 8, whiteSpace: 'nowrap' };
const evLayer = { fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--bc-text-tertiary)', border: '1px solid rgba(var(--bc-accent-rgb), 0.20)', borderRadius: 4, padding: '1px 5px', marginRight: 8, whiteSpace: 'nowrap' };
const evBeing = { fontFamily: SERIF, fontSize: 13.5, fontStyle: 'italic', color: 'var(--bc-text-primary)', marginRight: 8 };
const evEvidence = { fontFamily: SERIF, fontSize: 13, color: 'var(--bc-text-secondary)' };
const footNote = { fontSize: 12, fontStyle: 'italic', color: 'var(--bc-text-tertiary)', marginTop: 28, paddingTop: 14, borderTop: '1px solid rgba(var(--bc-accent-rgb), 0.18)' };
