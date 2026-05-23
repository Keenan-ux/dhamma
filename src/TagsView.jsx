// Tags — curated passage_tags from ATI's index-*.html files. Three-tier
// drill-down: type (Simile / Name / Subject / Number) → value → passages.
//
// Data live at /api/tags. Each tier loads on demand:
//   /api/tags                      summary by type (default landing)
//   /api/tags?type=<t>             values + counts within that type
//   /api/tags?type=<t>&value=<v>   passages carrying that tag
//
// Hash routing keeps drill state shareable: /tags/<type>/<value>.

import { useEffect, useMemo, useState } from 'react';
import { tagsApi } from './api.js';
import useIsNarrow from './useIsNarrow.js';

const TYPE_LABELS = {
  name:    'Names',
  subject: 'Subjects',
  simile:  'Similes',
  number:  'Numerical lists',
  title:   'Titles',
};

const TYPE_BLURBS = {
  name:    'Proper names from across the canon — teachers, disciples, kings, devas, places.',
  subject: 'Topical index — concepts, doctrines, practices.',
  simile:  'Similes and metaphors the suttas turn on — ant-hill, lute, raft, archer.',
  number:  'Numerical doctrine lists — three trainings, four foundations, five aggregates, eight winds.',
  title:   'Suttas indexed by title.',
};

const TYPE_ORDER = ['name', 'subject', 'simile', 'number', 'title'];

export default function TagsView({ onOpenPassage, onSearchWithTag }) {
  const isNarrow = useIsNarrow();
  // summary[type] = count of distinct values
  const [summary, setSummary] = useState(null);
  // activeType: the chip we're viewing values for
  const [activeType, setActiveType] = useState(null);
  // values for activeType: [{ tag_value, n }]
  const [values, setValues] = useState(null);
  // activeValue: when picked, we show passages
  const [activeValue, setActiveValue] = useState(null);
  // passages for active (type, value): [{ passage_id, citation, title, work_slug }]
  const [passages, setPassages] = useState(null);

  // Restore from hash. Shape: #/tags/<type>/<value>
  useEffect(() => {
    const m = window.location.hash.match(/^#\/tags(?:\/([^/]+)(?:\/(.+))?)?$/);
    if (m) {
      if (m[1]) setActiveType(decodeURIComponent(m[1]));
      if (m[2]) setActiveValue(decodeURIComponent(m[2]));
    }
  }, []);

  // Reflect drill state in the hash so deep links survive reload.
  useEffect(() => {
    let h = '#/tags';
    if (activeType) {
      h += '/' + encodeURIComponent(activeType);
      if (activeValue) h += '/' + encodeURIComponent(activeValue);
    }
    if (window.location.hash !== h) window.history.replaceState(null, '', h);
  }, [activeType, activeValue]);

  // Load the type summary once.
  useEffect(() => {
    const ac = new AbortController();
    tagsApi({ signal: ac.signal })
      .then((r) => setSummary(r.summary || []))
      .catch(() => setSummary([]));
    return () => ac.abort();
  }, []);

  // Load values when type changes.
  useEffect(() => {
    if (!activeType) { setValues(null); return; }
    setValues(null);
    const ac = new AbortController();
    tagsApi({ type: activeType, signal: ac.signal })
      .then((r) => setValues(r.values || []))
      .catch(() => setValues([]));
    return () => ac.abort();
  }, [activeType]);

  // Load passages when value changes.
  useEffect(() => {
    if (!activeType || !activeValue) { setPassages(null); return; }
    setPassages(null);
    const ac = new AbortController();
    tagsApi({ type: activeType, value: activeValue, signal: ac.signal })
      .then((r) => setPassages(r.passages || []))
      .catch(() => setPassages([]));
    return () => ac.abort();
  }, [activeType, activeValue]);

  const summaryByType = useMemo(() => {
    const m = new Map();
    for (const r of summary || []) m.set(r.tag_type, r);
    return m;
  }, [summary]);

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Tags</h1>
        <p style={pageSubtitle}>
          Curated indexes from Access to Insight &nbsp;·&nbsp;{' '}
          {summary
            ? `${summary.reduce((s, r) => s + r.total_tags, 0).toLocaleString()} tags across ${summary.length} types`
            : '…'}
        </p>
        <div style={rule} />
      </header>

      {/* Breadcrumb: only visible once user has drilled in. */}
      {(activeType || activeValue) && (
        <nav style={breadcrumb}>
          <button
            onClick={() => { setActiveType(null); setActiveValue(null); }}
            style={crumbLink}
          >
            Tags
          </button>
          {activeType && (
            <>
              <span style={crumbSep}>›</span>
              <button
                onClick={() => setActiveValue(null)}
                style={crumbLink}
              >
                {TYPE_LABELS[activeType] || activeType}
              </button>
            </>
          )}
          {activeValue && (
            <>
              <span style={crumbSep}>›</span>
              <span style={crumbCurrent}>{activeValue}</span>
            </>
          )}
        </nav>
      )}

      {/* Tier 1: types overview */}
      {!activeType && summary && (
        <ul style={typeGrid}>
          {TYPE_ORDER.filter((t) => summaryByType.has(t)).map((t) => {
            const row = summaryByType.get(t);
            return (
              <li
                key={t}
                style={typeCard}
                onClick={() => setActiveType(t)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveType(t); } }}
              >
                <span style={typeName}>{TYPE_LABELS[t] || t}</span>
                <span style={typeBlurb}>{TYPE_BLURBS[t] || ''}</span>
                <span style={typeCount}>
                  {row.distinct_values.toLocaleString()} entries · {row.total_tags.toLocaleString()} tags
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Tier 2: values within active type */}
      {activeType && !activeValue && values && (
        <ul style={valueList}>
          {values.map((v) => (
            <li
              key={v.tag_value}
              style={valueRow}
              onClick={() => setActiveValue(v.tag_value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveValue(v.tag_value); } }}
            >
              <span style={valueName}>{v.tag_value}</span>
              <span style={valueCount}>{v.n}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Tier 3: passages carrying the active (type, value).
          A small "Combine with text query" link at the top jumps the
          user to SearchView with the tag pre-applied, so they can
          narrow the tag's passage list by a keyword query. */}
      {activeType && activeValue && passages && (
        <>
          {onSearchWithTag && passages.length > 0 && (
            <p style={searchHintRow}>
              <button
                type="button"
                onClick={() => onSearchWithTag(`${activeType}:${activeValue}`)}
                style={searchHintBtn}
                title="Open Search with this tag pre-applied"
              >
                ↗ search within this tag
              </button>
              <span style={searchHintText}>
                · combine with a keyword query in Search
              </span>
            </p>
          )}
        <ul style={passageList}>
          {passages.map((p) => (
            <li
              key={p.passage_id}
              style={passageRow}
              onClick={() => onOpenPassage?.(p.passage_id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenPassage?.(p.passage_id); } }}
            >
              <span style={passageCitation}>{p.citation}</span>
              {p.title && <span style={passageTitle}>{p.title}</span>}
            </li>
          ))}
          {passages.length === 0 && (
            <p style={emptyHint}>No passages found for this tag.</p>
          )}
        </ul>
        </>
      )}

      {(!summary || (activeType && !values) || (activeValue && !passages)) && (
        <p style={loadingHint}>Loading…</p>
      )}

      <footer style={footerWrap}>
        <div style={rule} />
        <p style={attribution}>
          Tags derived from the curated indexes in Access to Insight
          (similes, names, subjects, numbers, titles). Each tag links the
          passage to a scholarly term as catalogued by ATI's editors.
        </p>
      </footer>
    </div>
  );
}

// ─── styles ────────────────────────────────────────────────────────────

const SERIF = '"Noto Serif", Georgia, serif';
const SANS = 'Outfit, system-ui, sans-serif';

const scrollWrap = { position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 };

const pageHeader = {
  maxWidth: 820,
  margin: '64px 0 0',
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
  letterSpacing: '0.30em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-primary)',
  paddingLeft: '0.30em',
};

const pageSubtitle = {
  margin: '0 0 24px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
};

const breadcrumb = {
  maxWidth: 980,
  margin: '24px 0 8px',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  flexWrap: 'wrap',
};

const crumbLink = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
  letterSpacing: '0.01em',
};

const crumbSep = { color: 'var(--bc-text-tertiary)', opacity: 0.5 };

const crumbCurrent = {
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 12,
  color: 'var(--bc-accent)',
};

const typeGrid = {
  maxWidth: 880,
  margin: '32px 0 0',
  padding: '0 24px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 20,
  listStyle: 'none',
};

const typeCard = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '20px 22px',
  background: 'var(--bc-bg-surface)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  cursor: 'pointer',
  transition: 'border-color 120ms ease, background 120ms ease',
  fontFamily: SERIF,
};

const typeName = {
  fontFamily: SERIF,
  fontSize: 17,
  fontWeight: 500,
  letterSpacing: '0.04em',
  color: 'var(--bc-text-primary)',
};

const typeBlurb = {
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--bc-text-tertiary)',
};

const typeCount = {
  marginTop: 4,
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  fontVariantNumeric: 'tabular-nums',
};

const valueList = {
  maxWidth: 720,
  margin: '24px 0 0',
  padding: '0 24px',
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const valueRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '10px 8px',
  cursor: 'pointer',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.10)',
  transition: 'background 100ms ease',
  fontFamily: SERIF,
};

const valueName = {
  fontFamily: SERIF,
  fontSize: 14,
  color: 'var(--bc-text-primary)',
  lineHeight: 1.4,
};

const valueCount = {
  fontFamily: SANS,
  fontSize: 10,
  color: 'var(--bc-text-tertiary)',
  letterSpacing: '0.06em',
  fontVariantNumeric: 'tabular-nums',
  flexShrink: 0,
  marginLeft: 12,
};

const passageList = {
  maxWidth: 720,
  margin: '24px 0 0',
  padding: '0 24px',
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const passageRow = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '12px 8px',
  cursor: 'pointer',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.10)',
  fontFamily: SERIF,
};

const passageCitation = {
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 14,
  color: 'var(--bc-accent)',
};

const passageTitle = {
  fontFamily: SERIF,
  fontSize: 12,
  color: 'var(--bc-text-tertiary)',
};

const emptyHint = {
  textAlign: 'center',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  marginTop: 24,
};

const searchHintRow = {
  margin: '0 0 12px',
  fontFamily: SERIF,
  fontSize: 13,
  color: 'var(--bc-text-secondary)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'baseline',
};

const searchHintBtn = {
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  padding: '2px 6px',
  fontFamily: SERIF,
  fontSize: 13,
  color: 'var(--bc-accent)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
  cursor: 'pointer',
};

const searchHintText = {
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
};

const loadingHint = {
  textAlign: 'center',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  margin: '40px 0',
};

const footerWrap = {
  maxWidth: 720,
  margin: '72px 0 56px',
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
