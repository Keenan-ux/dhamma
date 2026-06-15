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

import { useEffect, useMemo, useRef, useState } from 'react';
import { isModifiedClick } from './linkHelpers.js';
/* eslint-disable react-hooks/exhaustive-deps */

const ENTRIES = [
  {
    slug: 'awakening',
    title: 'Every Instance of Awakening in the Pāli Canon and Commentary',
    subtitle: 'A census of 2,214 awakening events, classified by what precipitated them.',
    data: '/research/awakening-events.json',
    beings: '/research/awakening-beings.json',
  },
  {
    slug: 'individual-guidance',
    title: 'How an Individual Is Guided Toward Awakening',
    subtitle: 'A census of how the canon and its commentaries match a person to a teaching and a meditation object, with the calm-and-insight question settled on the evidence.',
    data: '/research/individual-guidance.json',
  },
  {
    slug: 'heart-base-and-insight',
    title: 'The Heart-Base, Bhavaṅga, and the Stages of Insight',
    subtitle: 'A three-tier reading of where the seat of mind, the life-continuum, and the insight-ladder come from: sutta silence, an Abhidhamma placeholder, and a commentarial naming.',
    data: '/research/heart-base-and-insight.json',
  },
];

export default function ResearchView() {
  // Initialized straight from the hash so a cold load on
  // #/research/<slug> starts on the entry, not the index.
  const [openSlug, setOpenSlug] = useState(() => {
    const m = window.location.hash.match(/^#\/research\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  });

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

  // Mirror an OPEN entry into the hash. Opening an entry is a real
  // navigation, so it PUSHES — back returns to the research index
  // instead of exiting the tab. This only ever asserts the slug when
  // one is open, so it never clobbers a deep-linked slug while openSlug
  // is transiently null. The back-to-index reset is handled in onBack;
  // Dhamma's writer leaves a non-empty research sub-path alone.
  const prevOpenSlugRef = useRef(openSlug);
  useEffect(() => {
    const prev = prevOpenSlugRef.current;
    prevOpenSlugRef.current = openSlug;
    if (!openSlug) return;
    const want = `#/research/${encodeURIComponent(openSlug)}`;
    if (window.location.hash === want) return;
    if (openSlug !== prev) {
      window.history.pushState(null, '', want);
    } else {
      window.history.replaceState(null, '', want);
    }
  }, [openSlug]);

  // Article-based research (admin-only, from /api/research) — the compiled
  // markdown studies. Listed alongside the bespoke static studies below. This
  // view only renders for admins (Dhamma.jsx gates it), so the fetch is safe.
  const [apiEntries, setApiEntries] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/research', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => { if (!cancelled) setApiEntries(Array.isArray(d.entries) ? d.entries : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const entry = openSlug ? ENTRIES.find((e) => e.slug === openSlug) : null;
  if (entry) {
    const StudyComponent = entry.slug === 'individual-guidance' ? IndividualGuidanceStudy
      : entry.slug === 'heart-base-and-insight' ? HeartBaseStudy
      : AwakeningStudy;
    return (
      <StudyComponent
        entry={entry}
        onBack={() => { setOpenSlug(null); window.history.replaceState(null, '', '#/research'); }}
      />
    );
  }
  if (openSlug && !entry) {
    return (
      <ArticleStudy
        slug={openSlug}
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
        {apiEntries.map((e) => (
          <li key={e.slug} style={itemRow}>
            <a
              href={`#/research/${encodeURIComponent(e.slug)}`}
              onClick={(ev) => { if (isModifiedClick(ev)) return; ev.preventDefault(); setOpenSlug(e.slug); }}
              style={itemLink}
              aria-label={`Open ${e.title}`}
            >
              <span style={itemTitle}>{e.title}</span>
              {e.summary && <span style={itemAuthor}>{e.summary}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// A compiled markdown study (category='research') rendered from /api/research.
// Body is server-built sanitized HTML; we style it via the scoped class below.
function ArticleStudy({ slug, onBack }) {
  const [art, setArt] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    setArt(null); setError(null);
    const ac = new AbortController();
    fetch(`/api/research/${encodeURIComponent(slug)}`, { credentials: 'same-origin', signal: ac.signal })
      .then((r) => { if (!r.ok) throw new Error(r.status === 404 ? 'Not found.' : `HTTP ${r.status}`); return r.json(); })
      .then(setArt)
      .catch((e) => { if (e.name !== 'AbortError') setError(e); });
    return () => ac.abort();
  }, [slug]);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onBack?.(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onBack]);
  return (
    <div data-scroll-root="" style={scrollWrap}>
      <style>{RESEARCH_CSS}</style>
      <article style={articleReadWrap}>
        <button onClick={onBack} style={backBtn} aria-label="Back to Research (Esc)">
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to Research</span>
          <span style={backBtnHint}>Esc</span>
        </button>
        {!art && !error && <p style={hint}>Loading…</p>}
        {error && <p style={errorHint}>Failed to load: {error.message}</p>}
        {art && (
          <>
            <header style={articleHeader}>
              <h1 style={articleHeaderTitle}>{art.title}</h1>
              {art.summary && <p style={articleHeaderAuthor}>{art.summary}</p>}
            </header>
            <div style={articleBody} className="research-article" dangerouslySetInnerHTML={{ __html: art.body || '' }} />
          </>
        )}
      </article>
    </div>
  );
}

const RESEARCH_CSS = `
.research-article h1, .research-article h2, .research-article h3, .research-article h4 { font-family: "Noto Serif", Georgia, serif; color: var(--bc-text-primary); margin: 26px 0 10px; line-height: 1.3; }
.research-article h2 { font-size: 19px; font-weight: 600; }
.research-article h3 { font-size: 16px; font-weight: 600; }
.research-article h4 { font-size: 14.5px; font-weight: 600; }
.research-article p { margin: 0 0 14px; }
.research-article ul, .research-article ol { margin: 0 0 14px; padding-left: 26px; }
.research-article li { margin: 4px 0; }
.research-article code { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 0.86em; background: rgba(var(--bc-accent-rgb),0.10); padding: 1px 4px; border-radius: 3px; }
.research-article pre { background: rgba(var(--bc-accent-rgb),0.07); padding: 12px 14px; border-radius: 6px; overflow-x: auto; }
.research-article pre code { background: none; padding: 0; }
.research-article table { border-collapse: collapse; width: 100%; margin: 8px 0 16px; font-size: 13px; }
.research-article th, .research-article td { border: 1px solid rgba(var(--bc-accent-rgb),0.18); padding: 6px 9px; text-align: left; vertical-align: top; }
.research-article th { background: rgba(var(--bc-accent-rgb),0.06); font-weight: 600; }
.research-article blockquote { border-left: 2px solid rgba(var(--bc-accent-rgb),0.30); padding-left: 14px; margin: 0 0 14px; color: var(--bc-text-secondary); font-style: italic; }
.research-article a { color: var(--bc-accent); }
.research-article hr { border: none; border-top: 1px solid rgba(var(--bc-accent-rgb),0.18); margin: 22px 0; }
`;

const LAYER = {
  mula: { label: 'Canon', full: 'Tipiṭaka (mūla)' },
  attha: { label: 'Comm.', full: 'Commentary (aṭṭhakathā)' },
  tika: { label: 'Sub-comm.', full: 'Sub-commentary (ṭīkā)' },
  anya: { label: 'Extra', full: 'Extra-canonical' },
};
const LAYER_KEYS = ['mula', 'attha', 'tika', 'anya'];

function AwakeningStudy({ entry, onBack }) {
  const [data, setData] = useState(null);
  const [beings, setBeings] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    setData(null); setBeings(null); setError(null);
    const ac = new AbortController();
    fetch(entry.data, { signal: ac.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') setError(e); });
    // The being-classification overlay (deduped individuals + collective
    // taxonomy) is a separate static file; load it best-effort so the study
    // still renders if it is absent.
    if (entry.beings) {
      fetch(entry.beings, { signal: ac.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then(setBeings)
        .catch(() => {});
    }
    return () => ac.abort();
  }, [entry.data, entry.beings]);

  // id -> event index, so the individual / collective lists can resolve an
  // event id back to its citation, layer, and evidence.
  const eventsById = useMemo(() => {
    const m = {};
    if (data) for (const b of data.buckets) for (const e of b.events) m[e.id] = e;
    return m;
  }, [data]);

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
                phrase is not captured). Classification was done by an automated pass over the corpus,
                with an independent re-classification of {data.verification.passages_compared} passages
                agreeing {data.verification.exact_bucket_agreement_pct}% on the exact circumstance and{' '}
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

              {/* A third lens: who attains, not what occasions it. Built from
                  the being-classification overlay (deduped named individuals +
                  a collective taxonomy). Self-hides until the overlay loads. */}
              {beings && beings.individuals && beings.individuals.length > 0 && (
                <>
                  <h2 style={h2}>Table 3. Who awakens: named individuals</h2>
                  <p style={tableCaption}>
                    A third lens, not what occasions awakening but who attains it. Every named
                    person across the events, deduplicated (spelling and title variants merged,
                    multi-person passages split) and counted by how many awakening events name
                    them. Non-human beings (devas, nāgas, and the like) are tagged.{' '}
                    {fmt((beings.individuals || []).length)} distinct individuals; the
                    most-narrated lead. Click a name for its cited events.
                  </p>
                  {beings.individuals.filter((p) => (p.count || 0) >= 2).map((p) => {
                    const key = 'ind:' + p.name;
                    return (
                      <section key={key} style={bucketSection}>
                        <button style={bucketHeader} aria-expanded={!!open[key]} onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}>
                          <span aria-hidden="true" style={{ width: 16, display: 'inline-block' }}>{open[key] ? '▾' : '▸'}</span>
                          <span style={bucketTitle}>
                            {p.name}
                            {p.type && p.type !== 'human' && <span style={typeTag}>{p.type}</span>}
                          </span>
                          <span style={bucketCount}>{fmt(p.count)}</span>
                        </button>
                        {open[key] && (
                          <ol style={evList}>
                            {(p.events || []).map((id) => {
                              const e = eventsById[id];
                              if (!e) return null;
                              return (
                                <li key={id} style={evRow}>
                                  <a href={`#/read/${encodeURIComponent(id)}`} style={evCite} title={`Open ${e.citation} in the reader`}>{e.citation}</a>
                                  <span style={evLayer} title={LAYER[e.layer]?.full || e.layer}>{LAYER[e.layer]?.label || e.layer}</span>
                                  {e.being && <span style={evBeing}>{e.being}</span>}
                                  {e.evidence && <span style={evEvidence}>{e.evidence}</span>}
                                </li>
                              );
                            })}
                          </ol>
                        )}
                      </section>
                    );
                  })}
                  {(() => {
                    const ones = beings.individuals.filter((p) => (p.count || 0) < 2);
                    if (!ones.length) return null;
                    const key = 'ind:__ones__';
                    return (
                      <section key={key} style={bucketSection}>
                        <button style={bucketHeader} aria-expanded={!!open[key]} onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}>
                          <span aria-hidden="true" style={{ width: 16, display: 'inline-block' }}>{open[key] ? '▾' : '▸'}</span>
                          <span style={bucketTitle}>Individuals named in a single event</span>
                          <span style={bucketCount}>{fmt(ones.length)}</span>
                        </button>
                        {open[key] && (
                          <ol style={evList}>
                            {ones.map((p) => {
                              const e = eventsById[(p.events || [])[0]];
                              return (
                                <li key={p.name} style={evRow}>
                                  <span style={evBeing}>{p.name}{p.type && p.type !== 'human' && <span style={typeTag}>{p.type}</span>}</span>
                                  {e && <a href={`#/read/${encodeURIComponent(e.id)}`} style={evCite} title={`Open ${e.citation} in the reader`}>{e.citation}</a>}
                                  {e && <span style={evLayer} title={LAYER[e.layer]?.full || e.layer}>{LAYER[e.layer]?.label || e.layer}</span>}
                                </li>
                              );
                            })}
                          </ol>
                        )}
                      </section>
                    );
                  })()}
                </>
              )}

              {beings && beings.collectives && beings.collectives.length > 0 && (
                <>
                  <h2 style={h2}>Table 4. Collective and anonymous awakenings</h2>
                  <p style={tableCaption}>
                    Events whose subject is a group or an unnamed person, classified by kind.
                    Click a class for its events; each row keeps the original description (a
                    number, an order, an assembly).
                  </p>
                  {beings.collectives.map((c) => {
                    const key = 'col:' + c.class;
                    return (
                      <section key={key} style={bucketSection}>
                        <button style={bucketHeader} aria-expanded={!!open[key]} onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}>
                          <span aria-hidden="true" style={{ width: 16, display: 'inline-block' }}>{open[key] ? '▾' : '▸'}</span>
                          <span style={bucketTitle}>{c.class}</span>
                          <span style={bucketCount}>{fmt(c.count)}</span>
                        </button>
                        {open[key] && (
                          <>
                            {c.blurb && <p style={bucketBlurb}>{c.blurb}</p>}
                            <ol style={evList}>
                              {(c.events || []).map((id) => {
                                const e = eventsById[id];
                                if (!e) return null;
                                return (
                                  <li key={id} style={evRow}>
                                    <a href={`#/read/${encodeURIComponent(id)}`} style={evCite} title={`Open ${e.citation} in the reader`}>{e.citation}</a>
                                    <span style={evLayer} title={LAYER[e.layer]?.full || e.layer}>{LAYER[e.layer]?.label || e.layer}</span>
                                    {e.being && <span style={evBeing}>{e.being}</span>}
                                  </li>
                                );
                              })}
                            </ol>
                          </>
                        )}
                      </section>
                    );
                  })}
                </>
              )}

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

// ---------------------------------------------------------------------------
// Individual-guidance study. Sibling to AwakeningStudy: reads a static dataset
// (public/research/individual-guidance.json) and renders the full paper prose
// plus hyperlinked canon-vs-commentary tables, the H0/H1 warrant ledger, a
// reader's decision-aid, and the complete cited list. The renderer only READS
// the JSON; every analytic number is reproducible from the live corpus.
// ---------------------------------------------------------------------------

const FACETS = [
  { key: 'F1-object-assign', heading: 'B. Assigning a meditation object', short: 'Object assignment' },
  { key: 'F2-modes-types-agency', heading: 'A. The person and the mode of guidance', short: 'Modes, types, agency' },
  { key: 'F3-commentary-carita', heading: 'F. The commentarial temperament matrix', short: 'The carita matrix' },
  { key: 'F4-samatha-vipassana', heading: 'D. Calm and insight', short: 'Calm and insight' },
  { key: 'F5-commentary-assignment', heading: 'G. The commentarial assignment narratives', short: 'Commentarial assignment narratives' },
];

const CRITERION_ORDER = ['defilement', 'situation', 'temperament', 'capacity', 'unstated'];
const CRITERION_LABEL = {
  defilement: 'Defilement (rāga / dosa / moha …)',
  situation: 'Situation (illness, grief, crisis)',
  temperament: 'Temperament (carita)',
  capacity: 'Capacity / understanding-type',
  unstated: 'Unstated',
};
const MODE_ORDER = ['statement', 'elaboration', 'leading', 'object'];
const MODE_LABEL = {
  statement: 'Bare statement',
  elaboration: 'Brief, then elaborated',
  leading: 'Led step by step',
  object: 'Object assigned',
};

// Display label for each of the 15 decidable assignment cells (h_class ∈ {H0, H1}).
const CELL = {
  'kna-mettasutta-nidana-temperament-map': 'Six temperaments mapped to six objects',
  'kna-kullatthera-asubha-charnel': 'Kulla, greed-natured, sent to the charnel ground',
  'mpa-ragacarito-asubha': 'An unnamed greed-natured monk given foulness',
  'sva-dasuttara-temperament-asubha': 'Greed-temperament given foulness (Dasuttara)',
  'dhpa-suvannakara-misassign-then-redkasina': "The goldsmith's son: foulness misassigned, then a red kasiṇa",
  'F3-carita-01-term-origin': 'The Buddha sorts beings into six temperament-groups',
  'F3-carita-02-full-matrix-svdasuttara': 'The full six-cell temperament matrix',
  'F3-cell-greed-asubha': 'Greed → foulness (plus body-mindfulness)',
  'F3-cell-hate-metta-kasina': 'Hate → loving-kindness and the colour kasiṇas',
  'F3-cell-delusion-vism-anapana-vs-svdasuttara-uddesa': 'Delusion → breath, recitation, or dependent origination',
  'F3-cell-speculation-anapanasati': 'Discursive thought → mindfulness of breathing',
  'F3-cell-faith-six-recollections': 'Faith → the six recollections',
  'F3-cell-intelligence-maranasati-fourelement': 'Intelligence → death-mindfulness, four-element analysis',
  'F3-carita-organ-colour-correlation': 'Temperament read from the colour of the heart-blood',
  'F3-cariya-definition': 'The definition of cariyā (conduct)',
};

// The three-tier axis (Sutta / Abhidhamma / Commentary) plus the para-canonical
// Khuddaka bridge, used for the cross-tab table columns and the appendix badge.
const TIER_KEYS = ['sutta', 'abhidhamma', 'para-canon', 'commentary'];
const TIER_COL = {
  sutta: { label: 'Sutta', full: 'Sutta Piṭaka (four Nikāyas + prose Khuddaka)' },
  abhidhamma: { label: 'Abhi.', full: 'Abhidhamma Piṭaka (the seven books)' },
  'para-canon': { label: 'Para-c.', full: 'Para-canonical Khuddaka: Niddesa, Paṭisambhidāmagga, Nettippakaraṇa, Peṭakopadesa' },
  commentary: { label: 'Comm.', full: 'Commentary: aṭṭhakathā, ṭīkā, Visuddhimagga' },
};
// Warrant-tier badge labels for the H0/H1 ledger (read from each cell's warrant_tier).
const WTIER = {
  sutta: { label: 'sutta', title: 'Warranted in the Sutta Piṭaka (four Nikāyas + prose Khuddaka)' },
  abhidhamma: { label: 'abhidhamma', title: 'Warranted in the Abhidhamma Piṭaka' },
  'para-canon': { label: 'para-canon', title: 'Warranted only in the para-canonical Khuddaka (Niddesa, Paṭisambhidāmagga)' },
  none: { label: 'no warrant', title: 'No canonical warrant: a commentarial innovation' },
};

// The reader's decision-aid. Two layers, kept provenance-separate.
const HINDRANCE_MAP = [
  { hindrance: 'Lust or greed (rāga)', antidote: 'Perception of foulness (asubha)', cite: 'an9.3', label: 'AN 9.3' },
  { hindrance: 'Ill will (byāpāda)', antidote: 'Loving-kindness (mettā)', cite: 'an9.3', label: 'AN 9.3' },
  { hindrance: 'Restless, discursive thought (vitakka)', antidote: 'Mindfulness of breathing (ānāpānasati)', cite: 'an9.3', label: 'AN 9.3' },
  { hindrance: 'The conceit "I am" (asmimāna)', antidote: 'Perception of impermanence (aniccasaññā)', cite: 'an9.3', label: 'AN 9.3' },
  { hindrance: 'Delusion (moha)', antidote: 'Wisdom (paññā)', cite: 'an6.107', label: 'AN 6.107' },
];
const CARITA_MATRIX = [
  { carita: 'Greed (rāga)', objects: 'The foulnesses (ten in the Visuddhimagga, eleven in the Mettasutta commentary); mindfulness of the body' },
  { carita: 'Hate (dosa)', objects: 'The four divine abidings; the four colour kasiṇas' },
  { carita: 'Delusion (moha)', objects: 'Mindfulness of breathing; recitation, questioning, listening to the Dhamma' },
  { carita: 'Discursive thought (vitakka)', objects: 'Mindfulness of breathing; the earth kasiṇa' },
  { carita: 'Faith (saddhā)', objects: 'The six recollections (Buddha, Dhamma, Saṅgha, virtue, generosity, deities)' },
  { carita: 'Intelligence (buddhi / ñāṇa)', objects: 'Mindfulness of death; the peaceful; the repulsiveness of food; the four-element analysis' },
];

function Cite({ id, children }) {
  if (!id) return <span style={citeDead} title="No single corpus row (composite cell)">{children}</span>;
  return (
    <a href={`#/read/${encodeURIComponent(id)}`} style={citeLink} title={`Open ${children} in the reader`}>
      {children}
    </a>
  );
}

// Pull resolvable corpus ids out of a free-text warrant string.
const WARRANT_ID_RE = /\b(?:an|sn|mn|dn|ud|snp|thig|thag|iti|dhp|cnd|mnd|pe|ne|ps)\d[\w.]*/gi;
function warrantIds(w) {
  if (!w) return [];
  const m = w.match(WARRANT_ID_RE);
  return m ? Array.from(new Set(m.map((s) => s.toLowerCase()))) : [];
}

function IndividualGuidanceStudy({ entry, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});
  const [drill, setDrill] = useState(null);

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

  const derived = useMemo(() => {
    if (!data) return null;
    const inst = data.instances || [];
    // facet × tier
    const facetByTier = {};
    for (const f of FACETS) facetByTier[f.key] = { sutta: 0, abhidhamma: 0, 'para-canon': 0, commentary: 0 };
    for (const r of inst) {
      const fb = facetByTier[r.facet];
      if (fb && r.tier in fb) fb[r.tier] += 1;
    }
    const byFacet = {};
    for (const f of FACETS) byFacet[f.key] = inst.filter((r) => r.facet === f.key);
    const ledger = inst
      .filter((r) => r.h_class === 'H0' || r.h_class === 'H1')
      .map((r) => ({ ...r, cellLabel: CELL[r.study_label] || r.object || r.citation }));
    // H0 by warrant tier (sutta, abhidhamma, para-canon), then H1 (no warrant)
    const wRank = { sutta: 0, abhidhamma: 1, 'para-canon': 2, none: 3 };
    ledger.sort((a, b) => (wRank[a.warrant_tier] ?? 9) - (wRank[b.warrant_tier] ?? 9));
    return { inst, facetByTier, byFacet, ledger };
  }, [data]);

  const sumTier = (obj) => TIER_KEYS.reduce((s, k) => s + (obj?.[k] || 0), 0);

  // Drill-down: every count cell opens the full hyperlinked list of instances behind it.
  const inst = derived?.inst || [];
  const toggleDrill = (key, title, items) =>
    setDrill((d) => (d && d.key === key ? null : { key, title, items }));
  const cell = (key, title, items, strong) =>
    items.length ? (
      <button type="button" style={strong ? drillNumStrong : drillNum} aria-expanded={drill?.key === key}
        onClick={() => toggleDrill(key, title, items)} title={`Show the ${items.length} instances behind this count`}>
        {fmt(items.length)}
      </button>
    ) : <span style={tdNumDot}>·</span>;
  const renderDrill = (prefix) =>
    drill && drill.key.startsWith(prefix) ? (
      <div style={drillBox}>
        <div style={drillHead}>
          <span style={drillTitle}>{drill.title}</span>
          <span style={drillCount}>{fmt(drill.items.length)} {drill.items.length === 1 ? 'instance' : 'instances'}</span>
          <button type="button" style={drillClose} onClick={() => setDrill(null)}>close ✕</button>
        </div>
        <ol style={drillOl}>
          {drill.items.map((r, i) => (
            <li key={(r.id || 'na') + ':' + i} style={drillLi}>
              <Cite id={r.id}>{r.citation || r.id || '—'}</Cite>
              {r.recipient ? <span style={drillMeta}> · {r.recipient}</span> : null}
              {r.object && !/^unspecified|^unstated/i.test(r.object) ? <span style={drillObj}> · {r.object}</span> : null}
            </li>
          ))}
        </ol>
      </div>
    ) : null;

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

        {data && derived && (
          <>
            <header style={articleHeader}>
              <h1 style={articleHeaderTitle}>{entry.title}</h1>
              <p style={articleHeaderAuthor}>{entry.subtitle}</p>
            </header>

            <div style={articleBody}>
              {/* ABSTRACT */}
              <p style={abstractLead}>
                <span style={abstractTag}>Abstract.</span> When a person in the Pāli tradition is turned
                toward awakening, the tradition does not hand out one practice. It speaks in four registers:
                a bare statement that frees the hearer at once, a brief saying the hearer expands alone, a
                staged leading toward readiness, and the assignment of a definite meditation object. This
                study enumerates those acts of guidance across the live corpus of {fmt(194710)} passages and
                codes each one for its mode, the criterion behind it, the meditative function it serves, and
                its textual layer. The {fmt(derived.inst.length)} instances kept here are drawn from a frame
                of {fmt(755)} candidate passages, the assignments the corpus's vocabulary could surface;
                each candidate received more than one independent coding pass, as an instance or as a reasoned
                exclusion, and every instance is tied to a passage that opens in the reader. The most
                consequential result is structural. Directed assignment is largely a commentarial act: the four
                Nikāyas turn few named persons toward a specific object, while the commentaries record several
                hundred. Of the {fmt(derived.inst.length)} instances, {fmt(data.aggregates?.by_tier?.commentary || 0)} stand
                in the commentary and {fmt((data.aggregates?.by_tier?.sutta || 0) + (data.aggregates?.by_tier?.abhidhamma || 0) + (data.aggregates?.by_tier?.['para-canon'] || 0))} in
                the canon and its para-canonical bridge, a contrast tempered by the difference in indexing grain
                and weighed in its own section. Three further results follow. The canon keys a meditation object
                to the hearer's <em>present defilement or situation</em> (lust to foulness, ill will to love,
                discursive thought to the breath); the keying of an object to a fixed <em>temperament</em>,
                the famous scheme of six <em>caritas</em>, belongs to the commentaries and to the Niddesa,
                not to the four Nikāyas. Tested cell by cell, the commentarial assignment system is faithful
                in principle but innovative in apparatus: of fifteen decidable assignment cells, eight carry a
                canonical warrant and seven do not. And on the disputed question of calm and insight, the canon
                yokes <em>samatha</em> and <em>vipassanā</em>; across the discourses the census reached it
                assigns insight alone, as a standing practice, to no named person, and the two-vehicle,
                dry-insight split is a commentarial construction. The last result confirms, and quantifies,
                a reading argued most sharply by Cousins.
              </p>

              <p style={methodNote}>
                Reproducibility and recall. Every count below is reproducible from the live database, and
                every citation opens its passage. The enumeration does not rest on the search service alone. A
                frame of {fmt(755)} candidate passages was drawn by direct database query over the assignment
                vocabulary: the develop-imperatives paired with a named meditation object, the
                temperament-keyed assignment formula, and the commentarial idiom of giving a person a
                meditation subject. Every candidate was then coded independently more than once, and the
                passages set aside are recorded as reasoned exclusions, so the negatives are auditable beside
                the positives.
                Recall is bounded by that vocabulary and by the corpus edition: an assignment phrased in terms
                the frame did not cover could still be missed, which is why the frame is defined in full and is
                extensible. Within the tradition's own closed lists (the four understanding-types, the antidote
                formula, the six temperaments, the object inventory) the enumeration is saturated, repeated
                passes surfacing no new member, and it was reconciled against the passages cited in the
                secondary literature; saturation here measures structural completeness, not a proof that the
                open corpus holds no further instance. Renderings of commentary and Abhidhamma are the author's
                own, since the corpus carries no published English for those layers; they are checked against
                Ñāṇamoli for the Visuddhimagga and B. C. Law for the Puggalapaññatti.
              </p>

              {/* 1. QUESTION */}
              <h2 style={h2}>The question</h2>
              <p>
                The guiding question is how the Pāli tradition prescribes the guiding of an individual toward
                awakening, across the full range from a bare statement to a step-by-step leading with an
                assigned object, and what connects the kind of person, the kind of discourse given, and the
                object or instruction assigned. The cross-cutting question, asked at every step, is how the
                canon differs from the commentary.
              </p>
              <p>
                Five hypotheses were fixed before the census. (H<sub>A</sub>) Identifying who should receive
                what is, in the canon, a Buddha's perceptual faculty; operational, applicable-in-advance
                criteria are commentarial. (H<sub>B</sub>) The canon matches by defilement and situation; the
                temperament matrix is a commentarial addition, and the word <em>carita</em> does not carry the
                temperament sense in the four Nikāyas (it does in the para-canonical Niddesa, which is why the
                cells warranted there are tiered as resting outside the Nikāyas). (H<sub>D</sub>) The canon presents calm and insight as yoked,
                not as two separate vehicles; the dry-insight split is commentarial. (H<sub>E</sub>) The canon
                gives antidote-pairings and situational sets, not a fixed ordering of objects; sequence is a
                commentarial systematization. The central test, decided cell by cell, sets <strong>H0</strong>,
                that every commentarial assignment has a traceable canonical warrant, against <strong>H1</strong>,
                that the commentary adds assignments with no warrant. The prior expectation, registered in
                advance, was a split rather than a winner.
              </p>

              {/* 2. LITERATURE */}
              <h2 style={h2}>Earlier scholarship</h2>
              <p>
                The relation of calm to insight is the most-discussed question here, and these results enter an
                existing debate rather than open a new one. Bronkhorst (1993) argued that a
                current of pure insight, independent of the absorptions, stands in tension with the older
                mainstream of meditative calm. Vetter (1988) likewise separated an early path of <em>dhyāna</em>
                from a later discriminating insight. Against the separatist reading, Gethin (1992) and Anālayo
                (2003, 2017) read the Nikāya path as an integrated cultivation in which calm and insight are
                developed together. The statement closest to this study is Cousins (1984, 1996): the
                division of practitioners into a <em>samatha-yānika</em> and a <em>vipassanā-yānika</em>, and
                the figure of the dry-insight worker who reaches the goal without the absorptions, is a
                commentarial systematization, not a canonical doctrine. The census tests that claim directly
                and finds for it; section D states the evidence.
              </p>
              <p>
                On the inventory of meditation subjects, Buddhaghosa's Visuddhimagga fixes the forty meditation
                subjects and keys them to the six temperaments. Bapat (1937), comparing the Visuddhimagga with
                the Vimuttimagga preserved in Chinese, showed that the earlier manual counts thirty-eight, not
                forty, and differs in detail, a difference taken from Bapat's comparison and not re-counted
                here; the closed list of forty is therefore a settling, not a given. Ñāṇamoli's translation (1956) remains the standard reference for the Visuddhimagga and
                is the control used here for the author's renderings. On the key term, Crosby, Skilton and Kyaw
                (2019) document that <em>kammaṭṭhāna</em> in its technical sense, a meditation subject, is a
                commentarial usage; in the canon the word means an occupation or place of work. A frozen
                database count confirms this for our corpus and corrects an overstatement in earlier work of
                ours: the word does occur in the four Nikāyas, but in the ordinary sense alone (a livelihood,
                farming or trade or cattle-keeping; the household occupation), with the meditative sense
                effectively confined to the Visuddhimagga.
              </p>
              <p>
                On the typologies, the Puggalapaññatti, the Abhidhamma book of human types translated by Law
                (1922), defines the four understanding-types by the manner in which each comes to realization,
                and so supplies the canonical definition of the guidance modes used here. The reception of these
                schemes in the Burmese insight tradition, through Ledi Sayadaw and the teachers who followed,
                and the anthologies of Nyanaponika and Bodhi, frame how the typologies have been read in
                practice. Shaw (2006) and Kuan (2008) survey the object inventory and the place of mindfulness;
                Stuart (2015) extends the comparative horizon beyond the Pāli. The contribution is not a new
                reading of any of these but an auditable, exhaustive census that confirms the field's prose
                conclusions with counts and pins each to a passage.
              </p>

              {/* 3. METHOD + Table 1 */}
              <h2 style={h2}>Sources and method</h2>
              <p>
                The corpus is the Chaṭṭha Saṅgāyana (CST/VRI) recension as ingested into the project database,
                with SuttaCentral identifiers as the cross-walk and the standard Pāli dictionaries for the
                lexis. CST is used because it is the only layer that carries the full Aṭṭhakathā and Ṭīkā the
                canon-versus-commentary comparison needs; its pagination differs from the PTS editions.
                Searching combined exact and stemmed queries over the original-language field for the Pāli
                object terms and antidote formulas, concept queries over the English field for discovery, and
                the passage and commentary endpoints to follow a sutta to its Aṭṭhakathā. A load-bearing
                negative claim, that a word or sense is absent from a layer, is confirmed by a direct database
                count grouped by textual role rather than by a search impression, because the count is exact
                where the search lane is not; the sense-distribution of <em>kammaṭṭhāna</em> is established
                this way.
              </p>
              <p>
                A guidance instance is a passage in which a teacher directs a specific person or class toward
                awakening by one of four modes: a bare <em>statement</em> on which the hearer breaks through; a
                brief saying the hearer <em>elaborates</em>; a staged <em>leading</em> without one named object;
                or the assignment of a definite meditation <em>object</em>. Each instance is coded for mode,
                object where present, criterion (defilement, situation, temperament, capacity, or unstated),
                recipient and stated features, occasion, meditative function (calm, insight, both, or unstated),
                textual layer, and voice. For a commentarial assignment the warrant field records the canonical
                passage that licenses it, or marks its absence. The classification was done independently more
                than once and the disagreements adjudicated; the boundary cases are the small commentarial cells
                where an object set is canonical but its keying to a temperament is not.
              </p>
              <p>
                Diacritics follow IAST. Citations give the SuttaCentral identifier or the CST row identifier,
                with the traditional abbreviation. Where the corpus has no published English, in the commentary
                and Abhidhamma, the rendering is the author's own gloss and is marked as such in the dataset.
                The Vimuttimagga is reached only through Bapat's study of the Chinese and is treated as a
                secondary witness, not a primary one.
              </p>
              <p>
                The contrast axis has three tiers, not two. The Theravāda canon is not only the suttas: the
                Abhidhamma is the third basket, canonical, and much of what a flat canon-versus-commentary
                split would file as commentary is in fact the commentary systematizing the Abhidhamma. Each
                instance is placed on a four-way scale: Sutta, Abhidhamma, the para-canonical Khuddaka bridge
                (Nettippakaraṇa, Peṭakopadesa, Paṭisambhidāmagga, Niddesa), and Commentary. The Abhidhamma is
                canonical but second: its claim to be the word of the Buddha rests on a commentarial
                origin-account, the Aṭṭhasālinī's narrative of its preaching in the Tāvatiṃsa heaven, so it is
                not collapsed into the sutta tier. The four understanding-types, often read as a sutta
                typology, are in fact from the Puggalapaññatti, an Abhidhamma book, and are placed there.
              </p>

              <h3 style={h3}>Table 1. Guidance instances by analytic group and tier</h3>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Group</th>
                      {TIER_KEYS.map((k) => <th key={k} style={thNum} title={TIER_COL[k].full}>{TIER_COL[k].label}</th>)}
                      <th style={thNum}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FACETS.map((f) => (
                      <tr key={f.key} style={tr}>
                        <td style={tdLeft}>{f.short}</td>
                        {TIER_KEYS.map((k) => <td key={k} style={tdNum}>{cell('t1:' + f.key + ':' + k, f.short + ' · ' + TIER_COL[k].label, inst.filter((r) => r.facet === f.key && r.tier === k))}</td>)}
                        <td style={tdNumStrong}>{cell('t1:' + f.key + ':all', f.short + ' · all tiers', inst.filter((r) => r.facet === f.key), true)}</td>
                      </tr>
                    ))}
                    <tr style={trTotal}>
                      <td style={tdLeft}>All instances</td>
                      {TIER_KEYS.map((k) => <td key={k} style={tdNumStrong}>{cell('t1:all:' + k, 'All instances · ' + TIER_COL[k].label, inst.filter((r) => r.tier === k), true)}</td>)}
                      <td style={tdNumStrong}>{cell('t1:all:all', 'All instances', inst, true)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {renderDrill('t1:')}
              <p style={tableCaption}>
                Column key, the three-tier axis. Sutta = the four Nikāyas and the prose Khuddaka; Abhi. =
                the Abhidhamma Piṭaka, the seven books, canonical but second; Para-c. = the para-canonical
                Khuddaka analytical works (Nettippakaraṇa, Peṭakopadesa, Paṭisambhidāmagga, Niddesa); Comm. =
                aṭṭhakathā, ṭīkā, and the Visuddhimagga.
              </p>

              {/* A. PERSON & MODE + Table 3 */}
              <h2 style={h2}>A. The person and the mode of guidance</h2>
              <p>
                The canon names four kinds of person by the manner in which each comes to understand. The
                Ugghaṭitaññū-sutta (<Cite id="an4.133">AN 4.133</Cite>) lists them: one who understands at
                once, one who understands after detail, one who needs to be led, and one who, in this life,
                only learns the words. The Puggalapaññatti (<Cite id="cst-abh03m2.mul-014">Pp §§148–151</Cite>)
                defines each by its trigger: realization together with the utterance; realization when a brief
                saying is analysed in detail; realization gradually, through recitation, questioning, wise
                attention and good friends; and no realization this life despite much hearing. These
                definitions are themselves the typology of guidance modes. The bare statement matches the
                first type, the brief-then-elaborated saying the second, the staged leading the third.
              </p>
              <p>
                Each mode has its canonical exemplar. Bāhiya (<Cite id="ud1.10">Ud 1.10</Cite>) is freed on a
                single sentence, in the seen only the seen, standing on the road: a statement. Māluṅkyaputta
                (<Cite id="sn35.95">SN 35.95</Cite>) receives the same brief verse, asks to expand it, draws
                out the meaning himself, and attains: elaboration. Upāli (<Cite id="mn56">MN 56</Cite>) is led
                by graded talk, on giving, virtue, heaven, the danger of sense pleasures and the benefit of
                renunciation, until his mind is ready and pliable, and only then is given the teaching peculiar
                to the Buddhas: a leading. The fourth type, the one who does not break through this life, is a
                limit case, not an act of guidance, and is recorded but not enumerated as an instance.
              </p>
              <p>
                Who may guide, and how does a guide know what to give? In the canon the answer is a faculty.
                The Buddha surveys the world with the eye of an Awakened One and sees beings with little dust
                and with much, with keen faculties and with dull, the famous lotus-pond image
                (<Cite id="sn6.1">SN 6.1</Cite>, <Cite id="mn26">MN 26</Cite>); the knowledge of the maturity
                of others' faculties is listed among the Realized One's powers (<Cite id="mn12">MN 12</Cite>).
                This is perception, not a checklist applied in advance, which is exactly what H<sub>A</sub>
                predicted. The para-canonical bridge takes the next step: the Nettippakaraṇa
                (<Cite id="ne4">Nett</Cite>) gives each understanding-type a different content (escape only for
                the first, danger and escape for the second, gratification, danger and escape for the third);
                the Peṭakopadesa (<Cite id="pe8">Peṭ</Cite>) and the Paṭisambhidāmagga
                (<Cite id="ps1.4">Paṭis</Cite>) correlate the types with keen and dull faculties, and gloss
                keen faculties as the person of faith. These texts begin to make the Buddha's perception into a
                teachable scheme, and they sit between the canon and the commentary in doing so.
              </p>

              <h3 style={h3}>Table 2. Mode of guidance, by tier</h3>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Mode</th>
                      {TIER_KEYS.map((k) => <th key={k} style={thNum} title={TIER_COL[k].full}>{TIER_COL[k].label}</th>)}
                      <th style={thNum}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODE_ORDER.map((m) => (
                      <tr key={m} style={tr}>
                        <td style={tdLeft}>{MODE_LABEL[m]}</td>
                        {TIER_KEYS.map((k) => <td key={k} style={tdNum}>{cell('t2:' + m + ':' + k, MODE_LABEL[m] + ' · ' + TIER_COL[k].label, inst.filter((r) => r.mode === m && r.tier === k))}</td>)}
                        <td style={tdNumStrong}>{cell('t2:' + m + ':all', MODE_LABEL[m] + ' · all tiers', inst.filter((r) => r.mode === m), true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderDrill('t2:')}
              <p style={tableCaption}>
                Object-assignment is the most common mode and the only one with a heavy commentarial
                presence; the statement, elaboration and leading modes sit almost entirely in the suttas,
                because the commentary's interest is in which object suits whom.
              </p>

              {/* B. OBJECT ASSIGNMENT */}
              <h2 style={h2}>B. Assigning a meditation object</h2>
              <p>
                The canon's object-assignments turn on a small, closed antidote formula. To Meghiya, harassed
                in the mango grove by thoughts of sense pleasure, ill will and cruelty, the Buddha gives four
                things to develop: foulness to give up greed, love to give up hate, mindfulness of breathing to
                cut off thinking, and the perception of impermanence to uproot the conceit "I am"
                (<Cite id="an9.3">AN 9.3</Cite>, with the Udāna doublet <Cite id="ud4.1">Ud 4.1</Cite> and the
                de-personalised parallel <Cite id="an9.1">AN 9.1</Cite>). The same logic appears as a three-root
                scheme, foulness against greed, love against hate, wisdom against delusion
                (<Cite id="an6.107">AN 6.107</Cite>). The criterion is the defilement, and the formula is
                identical whether the hearer is a named monk or the assembly at large.
              </p>
              <p>
                The directed cases follow the same rule. The Buddha advises Rāhula at length, object by object,
                building the divine abidings and the perception of foulness and impermanence each against its
                defilement, and closing with the sixteen steps of mindfulness of breathing
                (<Cite id="mn62">MN 62</Cite>); he gives Rāhula the same foulness-and-signless instruction in
                verse (<Cite id="snp2.11">Snp 2.11</Cite>). The nun Nandā, attached to her own beauty, is told
                to look at the body as diseased and foul (<Cite id="thig5.4">Thīg 5.4</Cite>, with the parallel
                <Cite id="thig2.1">Thīg 2.1</Cite>). The criterion there is again a defilement, vanity. Two
                cases turn on situation rather than defilement: the gravely ill Girimānanda is healed by hearing
                ten perceptions (<Cite id="an10.60">AN 10.60</Cite>), and after monks who had over-practised
                foulness fell into a suicide crisis near Vesālī, the Buddha reassigns the peaceful, pleasant
                abiding of mindfulness of breathing in its place (<Cite id="sn54.9">SN 54.9</Cite>). That last
                case shows the canon correcting an object that has become harmful, which is assignment by
                circumstance in its clearest form.
              </p>
              <p>
                What the canon does not do is key an object to a fixed personality type. Across these instances
                the criterion is the defilement that is active, the situation that has arisen, or the request
                that was made. The object meets a state, and when the state shifts, as at Vesālī, the object
                shifts with it.
              </p>

              {/* C. PATTERNS + Table (criterion x layer) */}
              <h2 style={h2}>C. What goes with what</h2>
              <p>
                Laying the criteria against the tiers makes the central contrast measurable. Every instance
                keyed to a defilement, and every instance keyed to a situation, is in the suttas. Every
                instance keyed to a temperament is in the commentary. The suttas and the commentary are not
                disagreeing about the objects; they are using different keys. The situation cell is small,
                three instances, and one of them, the element meditations given to Rāhula, sits near the
                boundary with the capacity criterion; the contrast is clean at this count and should be read
                as such.
              </p>
              <h3 style={h3}>Table 3. Criterion of assignment, by tier</h3>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Criterion</th>
                      {TIER_KEYS.map((k) => <th key={k} style={thNum} title={TIER_COL[k].full}>{TIER_COL[k].label}</th>)}
                      <th style={thNum}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CRITERION_ORDER.map((c) => (
                      <tr key={c} style={tr}>
                        <td style={tdLeft}>{CRITERION_LABEL[c]}</td>
                        {TIER_KEYS.map((k) => <td key={k} style={tdNum}>{cell('t3:' + c + ':' + k, CRITERION_LABEL[c] + ' · ' + TIER_COL[k].label, inst.filter((r) => r.criterion === c && r.tier === k))}</td>)}
                        <td style={tdNumStrong}>{cell('t3:' + c + ':all', CRITERION_LABEL[c] + ' · all tiers', inst.filter((r) => r.criterion === c), true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderDrill('t3:')}
              <p style={tableCaption}>
                Defilement and situation are sutta keys; temperament is a commentarial key, though the roots it
                is built on are Abhidhamma (see the carita sharpening in section F). Capacity, the
                understanding-type and faculty axis, runs across all four tiers: it is the one criterion the
                Abhidhamma (the Puggalapaññatti understanding-types) and the para-canonical bridge also carry.
              </p>
              <p>
                Two regularities hold across the enumeration. First, occasion predicts the criterion: a
                defilement that has flared, a sickness, a crisis or a direct request each pulls a matching
                object. Second, the statement and elaboration modes cluster with hearers of keen faculty, the
                ones the typology calls quick, while the leading mode clusters with hearers who must be brought
                to readiness. One expected regularity is absent: there is no canonical pairing of a stable
                personality type with a standing object. That absence is the finding: the gap the commentary
                later fills.
              </p>

              {/* D. SAMATHA-VIPASSANA */}
              <h2 style={h2}>D. Calm and insight: yoked or split</h2>
              <p>
                The load-bearing question is whether the canon prescribes calm and insight as two separate
                practices, or only as a yoked pair. The evidence is consistent. The Yuganaddha-sutta
                (<Cite id="an4.170">AN 4.170</Cite>) lays out four ways to the goal, calm before insight,
                insight before calm, the two in conjunction, and a mind seized by higher states, and all four
                end in the same arising of the path: four entries into one process, not four standing paths.
                The Paṭisambhidāmagga elaborates the same yoking (<Cite id="ps2.1">Paṭis 2.1</Cite>). The
                Saṃyutta names calm and insight together as the single path to the unconditioned
                (<Cite id="sn43.2">SN 43.2</Cite>). Where the canon does type people by these faculties, it does
                so only by the four-person type, and only to restore the missing one: the person with calm but
                not insight is sent to learn insight, the person with insight but not calm to learn calm
                (<Cite id="an4.94">AN 4.94</Cite>, <Cite id="an10.54">AN 10.54</Cite>). This is the test that
                matters. If the canon recognised a standing insight-only vehicle, it would assign insight alone
                to some named individual; across the discourses the census reached, it does not, and that
                pattern is consistent with the integrated reading.
              </p>
              <p>
                The commentary builds something the canon does not state. The sub-commentaries on the
                Yuganaddha-sutta read its first two modes as spoken for two kinds of practitioner, the
                serenity-vehicle worker who first produces access or absorption, and the insight-vehicle worker
                who contemplates the aggregates without producing that serenity
                (<Cite id="cst-s0402t.tik-an4_p622">Mp-pṭ</Cite>). The Visuddhimagga and its sub-commentary name
                the pure-insight-vehicle worker outright (<Cite id="cst-e0102n.mul-63_p006">Vism §63</Cite>,{' '}
                <Cite id="cst-e0104n.att-62_p006">Vism-mhṭ</Cite>), and the Abhidhamma sub-commentary names the
                dry-insight worker, the <em>sukkhavipassaka</em> (<Cite id="cst-abh08t.nrf-100_p027">Abh-pṭ</Cite>),
                and distinguishes the momentary concentration he relies on from the access-and-absorption
                concentration of the other. A transient imbalance the canon tells you to correct becomes, in the
                commentary, a settled type of person and a second vehicle. This is the picture Cousins
                described, now with the canonical loci and the commentarial loci set side by side. These
                commentarial witnesses were confirmed by direct reading of the cited paragraphs rather than by
                a corpus-wide sweep.
              </p>

              {/* E. SEQUENCE */}
              <h2 style={h2}>E. Does the guidance change over time?</h2>
              <p>
                The canon gives pairings and situational sets, and it does grade a single curriculum, most
                clearly in the long advice to Rāhula, which moves through the elements, the divine abidings, the
                perceptions and the sixteen steps of breathing in one sitting (<Cite id="mn62">MN 62</Cite>).
                What it does not give is a fixed order of objects through which every practitioner must pass.
                The fixed sequence is commentarial: virtue, then concentration on one of the forty subjects
                chosen by temperament, then wisdom; the seven purifications; the graded knowledges of insight.
                This matches the registered expectation for H<sub>E</sub>. Sequence, like the temperament key,
                is part of the apparatus the commentary supplies on top of the canonical pairings.
              </p>

              {/* F. CANON VS COMMENTARY + Table 4 (ledger) */}
              <h2 style={h2}>F. Canon and commentary: the warrant ledger</h2>
              <p>
                The commentarial system has two parts that must be judged separately. The object inventory and
                the defilement-antidote keying are inherited from the canon: foulness for greed, love for hate,
                breathing for discursive thought are the Meghiya formula, restated. What the commentary adds is
                the temperament. It sorts beings into six standing types, greed, hate, delusion, discursive
                thought, faith and intelligence, and assigns a standing object to each
                (<Cite id="cst-s0103a.att-dn3_11_p002">Sv-a 11 §2</Cite>,{' '}
                <Cite id="cst-s0505a.att-10_p003">KN-a §10.3</Cite>). The sorting is read back into the canonical
                scene in which the Buddha surveys beings, where the commentary says he made six groups
                (<Cite id="cst-s0102a.att-dn2_1_p218">Sv-a 1 §218</Cite>), though the canonical survey divides by
                dust and faculty, not by these six types.
              </p>
              <p>
                Two features mark the temperament scheme as the commentary's own. One is the
                teacher-diagnosis-then-correction machinery. Sāriputta, reasoning that a young monk must have
                excess lust, assigns foulness; it fails for three months; the Buddha, seeing by his own
                knowledge that the monk had been a goldsmith working red gold for five hundred lives, judges the
                repulsive subject unfit and conjures a golden lotus instead, on which the monk attains at once
                (<Cite id="cst-s0502a.att-234_p003">Dhp-a</Cite>). The other is the diagnostic by which a teacher
                is said to read temperament: the colour of the heart-blood, red for greed, black for hate, the
                colour of dishwater for delusion (<Cite id="cst-abh02a.att-70_p058">Vibh-a §70.58</Cite>). Neither
                the misassignment story nor the physiological diagnostic has any canonical source. They are the
                emblem of the scheme's character: a worked-out craft of matching person to object, resting on a
                reading of the person that the canon never offers.
              </p>
              <p>
                Tested cell by cell, the result is the split the prior expectation named. Of fifteen decidable
                assignment cells, eight carry a canonical warrant and seven do not. Four of the eight rest on the
                four Nikāyas, chiefly the Meghiya antidote formula; the other four rest only on the Khuddaka
                texts that lie outside the four primary Nikāyas, the Cūḷaniddesa (which already keys objects to
                the temperament types of greed, delusion and the rest) and the Paṭisambhidāmagga, and the table
                marks that tier. Two of the four Nikāya-warranted cells are warranted only in their core pairing:
                the addition of mindfulness of the body to the greed cell, and of the three further divine
                abidings and the four colour kasiṇas to the hate cell, has no canonical antidote warrant of its
                own, and the dataset records those additions as unwarranted. The seven cells without any warrant
                are the temperament keying itself, the colour diagnostic, the misassignment machinery, and the
                match of the faith type to the six recollections, where the object set is canonical but its
                keying to a temperament is not.
              </p>
              <p>
                The temperament finding sharpens across the tiers. The three roots the scheme is built on,
                greed, hate and delusion, are Abhidhamma: they are the three unwholesome roots of the
                Dhammasaṅgaṇī and the Vibhaṅga. A three-fold remedy-carita, greed to foulness, hate to love,
                delusion to dependent origination, is already in the para-canonical Nettippakaraṇa and
                Peṭakopadesa, but only on those three roots. The six-fold personality typology, the addition of
                faith, intelligence and discursive thought, the affinity theory, and the object-suitability and
                heart-blood diagnostics, is the commentary's. Where the Abhidhamma does use the word{' '}
                <em>carita</em> (Vibhaṅga §817), it means kamma, the three kinds of formation, not temperament;
                the temperament sense is a commentarial re-coinage.
              </p>

              <h3 style={h3}>Table 4. The warrant ledger: the fifteen decidable assignment cells</h3>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Assignment cell</th>
                      <th style={thLeft}>Source</th>
                      <th style={thLeft}>Canonical warrant</th>
                      <th style={thLeft}>Tier</th>
                      <th style={thLeft}>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {derived.ledger.map((r, i) => {
                      const ids = warrantIds(r.warrant);
                      return (
                        <tr key={r.study_label || i} style={tr}>
                          <td style={tdLeftSm}>{r.cellLabel}</td>
                          <td style={tdLeftSm}><Cite id={r.id}>{r.citation}</Cite></td>
                          <td style={tdLeftSm}>
                            {r.h_class === 'H1'
                              ? <span style={tinyNote}>none</span>
                              : (ids.length
                                  ? ids.map((wid, j) => <span key={wid}>{j ? ', ' : ''}<Cite id={wid}>{wid}</Cite></span>)
                                  : <span style={tinyNote}>{(r.warrant || '').split('(')[0].trim() || 'self'}</span>)}
                          </td>
                          <td style={tdLeftSm}><span style={tierBadge(r.warrant_tier)} title={WTIER[r.warrant_tier].title}>{WTIER[r.warrant_tier].label}</span></td>
                          <td style={tdLeftSm}><span style={hclassBadge(r.h_class)}>{r.h_class === 'H0' ? 'supported (H0)' : 'innovation (H1)'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={tableCaption}>
                Eight cells supported (H0), seven innovations (H1). Of the eight supported, four rest on the
                suttas and four only on the para-canonical Khuddaka, the Cūḷaniddesa and the Paṭisambhidāmagga;
                none rests on the Abhidhamma directly, though the roots the scheme is built on are Abhidhamma.
                Click a source or a warrant to open the passage.
              </p>

              {/* G. THE COMMENTARIAL ASSIGNMENT NARRATIVES */}
              <h2 style={h2}>G. The commentarial assignment narratives</h2>
              <p>
                The ledger judges the temperament scheme as a structure. Beneath it lies a larger body of
                evidence that the first pass reached only in part: the commentaries' own stories of assignment.
                When the candidate frame is drawn in full, the four Nikāyas yield few scenes in which a named
                person is turned toward a definite object, while the commentaries yield several hundred. Of the
                {' '}{fmt(derived.inst.length)} instances in the census, {fmt(data.aggregates?.by_tier?.commentary || 0)}{' '}
                stand in the commentary; the canon's share is the smaller part. Two cautions keep the contrast
                honest. The commentary is stored at paragraph granularity and the suttas at the level of the
                whole discourse, so the raw counts are not a like-for-like measure; but the commentarial
                instances were checked to be distinct events, almost all naming or describing a different
                recipient and falling across many separate commentaries, so the contrast is one of distinct acts
                of assignment and not of one act sliced finer. And one rule of the candidate frame, the idiom of
                giving a person a meditation subject (<em>kammaṭṭhāna</em>), belongs to the commentarial
                register and cannot occur in the Nikāyas, so part of the commentary's lead is built into the
                vocabulary; the canonical lane was therefore drawn on its own terms, by the develop-imperatives
                and the named objects that do occur in the suttas, and still yields the smaller count.
              </p>
              <p>
                These narratives share a shape. A person comes, or is ordained, and a teacher gives a
                meditation subject. At the going-forth the standard gift is the contemplation of the first five
                parts of the body, the skin-pentad, handed to novice after novice, among them the boy Revata
                (<Cite id="cst-s0401a.att-an1_14_p248">Mp</Cite>), the seven-year-old Dabba, and the wanderer
                Subhadda. Beyond that opening the teacher reads the person and corrects. Vakkali's insight does
                not move because his faith runs too strong, and the Buddha, seeing the imbalance, purifies and
                re-gives his subject (<Cite id="cst-s0510a.att-284_p006">Th-a</Cite>). A goldsmith's pupil,
                given foulness by Sāriputta, makes no progress until the subject is changed to an agreeable
                colour (<Cite id="cst-s0502a.att-234_p004">Dhp-a</Cite>). In a recurring teaching method the
                pupil recites the body-parts and reports how the object appears, as repulsiveness, as colour, or
                as elements, and the teacher confirms the subject the report shows to be suitable
                (<Cite id="cst-abh02a.att-70_p089">Vibh-a</Cite>). The criterion in these scenes is most often
                the person's capacity or past habit, read by a teacher, which is the very faculty
                H<sub>A</sub> placed in the canon with the Buddha alone.
              </p>
              <p>
                Counted by warrant, the enlargement does not overturn the ledger; it extends it. Of the
                assignment instances added beyond the first pass, {fmt(data.aggregates?.expansion_warrant?.canonical || 0)}{' '}
                rest on a canonical object or formula, {fmt(data.aggregates?.expansion_warrant?.innovation || 0)}{' '}
                add an object or a keying with no canonical source, and {fmt(data.aggregates?.expansion_warrant?.uncertain || 0)}{' '}
                are left undecided. The shape is the ledger's at scale: the objects the commentary assigns are,
                in the main, the canon's own objects, while what the commentary supplies is the machinery of
                individual diagnosis, the judgement of who should receive which. This warrant reading comes
                from that coding, a distribution rather than the cell-by-cell adjudication the fifteen-cell
                ledger reports, and it is offered as such. Each figure below opens the full list of its
                instances, so the reading is checkable passage by passage.
              </p>

              <h3 style={h3}>Table 5. The expansion by warrant (each figure opens its instances)</h3>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr><th style={thLeft}>Warrant reading</th><th style={thNum}>Instances</th></tr>
                  </thead>
                  <tbody>
                    {[['canonical', 'Rests on a canonical object or formula'], ['innovation', 'Adds an object or keying with no canonical source'], ['uncertain', 'Left undecided']].map(([h, label]) => (
                      <tr key={h} style={tr}>
                        <td style={tdLeft}>{label}</td>
                        <td style={tdNumStrong}>{cell('tw:' + h, label, inst.filter((r) => r.source === 'expansion' && r.h_class === h), true)}</td>
                      </tr>
                    ))}
                    <tr style={trTotal}>
                      <td style={tdLeft}>All instances added beyond the first census</td>
                      <td style={tdNumStrong}>{cell('tw:all', 'All instances added beyond the first census', inst.filter((r) => r.source === 'expansion'), true)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {renderDrill('tw:')}
              <p style={tableCaption}>
                The warrant reading is the coding's, offered as a distribution and not as a second cell-by-cell
                ledger. Open any figure to read its instances and follow each to its passage.
              </p>

              {/* READER'S AID */}
              <h2 style={h2}>A reader's aid: what the sources license</h2>
              <p>
                Readers ask which object suits them. The sources give two different answers, and they must be
                kept apart. The canon offers a rule you can apply yourself, because it keys the object to a
                state you can observe in the moment. The commentary offers a richer scheme, but one its own
                texts say a teacher must apply, not the practitioner. This aid presents both and issues no
                single verdict.
              </p>

              <div style={aidPanel}>
                <div style={aidHeadRow}>
                  <span style={aidTagCanon}>Canon</span>
                  <span style={aidHeadText}>Match the antidote to the hindrance most active now. State, not type; re-check as it shifts.</span>
                </div>
                <div style={tableWrap}>
                  <table style={table}>
                    <thead>
                      <tr><th style={thLeft}>If this is most active now</th><th style={thLeft}>Develop</th><th style={thNum}>Source</th></tr>
                    </thead>
                    <tbody>
                      {HINDRANCE_MAP.map((h) => (
                        <tr key={h.hindrance} style={tr}>
                          <td style={tdLeft}>{h.hindrance}</td>
                          <td style={tdLeft}>{h.antidote}</td>
                          <td style={tdNum}><Cite id={h.cite}>{h.label}</Cite></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={aidNote}>
                  This is the Meghiya antidote logic (<Cite id="an9.3">AN 9.3</Cite>), with the
                  delusion-and-wisdom pairing drawn from the three-root scheme of <Cite id="an6.107">AN 6.107</Cite>:
                  the antidote answers the defilement that is present, and it changes as the defilement changes.
                </p>
              </div>

              <div style={aidPanel}>
                <div style={aidHeadRow}>
                  <span style={aidTagComm}>Commentary</span>
                  <span style={aidHeadText}>The temperament scheme, shown as the texts give it: assigned by a teacher, not self-diagnosed.</span>
                </div>
                <div style={tableWrap}>
                  <table style={table}>
                    <thead>
                      <tr><th style={thLeft}>Temperament (carita)</th><th style={thLeft}>Objects the commentary assigns</th></tr>
                    </thead>
                    <tbody>
                      {CARITA_MATRIX.map((c) => (
                        <tr key={c.carita} style={tr}>
                          <td style={tdLeft}>{c.carita}</td>
                          <td style={tdLeft}>{c.objects}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={aidCaveat}>
                  Caveat from the sources themselves. The commentary holds that temperament is read by a
                  teacher, through long observation or the knowledge of minds, and that the surest reading is a
                  Buddha's faculty; the scheme even offers to read it from the colour of the heart-blood
                  (<Cite id="cst-abh02a.att-70_p058">Vibh-a §70.58</Cite>). It is not meant to be applied to
                  oneself, and the case of the goldsmith's son (<Cite id="cst-s0502a.att-234_p003">Dhp-a</Cite>)
                  shows even Sāriputta misreading it. Treat this column as description, not instruction.
                </p>
              </div>

              {/* DISCUSSION */}
              <h2 style={h2}>Discussion</h2>
              <p>
                The picture is coherent. In the canon, guidance is occasioned and personal: a teacher meets a
                hearer in a state, at a moment, and matches a word or an object to that state. The criterion is
                what is present, a defilement, a sickness, a question, and the identification of who needs what
                is a faculty of perception, not a procedure. The commentary keeps the inventory and the
                antidote logic intact and adds an apparatus on top: a typology of persons, a closed list of
                forty objects, a fixed sequence, and a craft of diagnosis. The apparatus is not arbitrary; it
                systematizes real canonical pairings into something a teacher without the Buddha's eye could
                use. But it adds a claim the canon does not make, that persons come in standing types to which
                standing objects belong.
              </p>
              <p>
                The same shape appears in the calm-and-insight result. The canon treats a deficiency in calm or
                insight as something to be corrected so that the pair is restored; the commentary turns the
                deficiency into a kind of person and a second vehicle. In both cases the move is from state to
                type, from the occasioned to the systematic. Naming that single move is the study's main
                interpretive claim, and the warrant ledger and the criterion table are the evidence for it.
              </p>

              {/* LIMITATIONS */}
              <h2 style={h2}>Limitations</h2>
              <p>
                Recall is bounded and the bound is stated rather than hidden. The enumeration now draws on a
                frame of {fmt(755)} candidate passages built by direct database query over the assignment
                vocabulary, not on the search service, and within the tradition's closed lists and the
                secondary literature's cited passages it reached structural saturation, repeated passes
                surfacing no new member. Structural saturation is not instance-level proof: it cannot show that
                an open corpus holds no further instance phrased in terms the frame did not cover, which is why
                the frame is defined in full and left extensible. The warrant reading of the enlarged
                commentarial set comes from that coding, reported as a distribution rather than adjudicated
                cell by cell in the manner of the fifteen-cell ledger. Several gaps named in the earlier pass
                are now closed and carried in the dataset: the forty objects of the Visuddhimagga and their
                temperament keying are pulled verbatim, the graded death-mindfulness discourses and the directed
                discourse on body-mindfulness are enumerated, and the commentarial back-story in which monks
                frightened by tree-deities are given loving-kindness is recorded as a commentarial assignment.
                Scope is Pāli and Theravāda only; the Vimuttimagga enters through Bapat alone; cross-tradition
                material is out of scope.
              </p>

              {/* CONTRIBUTION */}
              <h2 style={h2}>Contribution</h2>
              <p>
                The lasting contribution is the auditable census itself: every act of guidance in the studied
                range, coded on a fixed scheme, split canon against commentary, with each instance resolving to
                a passage a reader can open and check. On top of that the study offers three results. It
                quantifies the canon-versus-commentary difference in object-assignment as a clean contrast of
                keys, defilement and situation against temperament. It decides the H0/H1 question with a count,
                eight cells warranted and seven not, and it reports the warrant tier rather than collapsing the
                eight into a single canonical voice. And it resolves the calm-and-insight question for this
                corpus in favour of the yoked reading, on the evidence enumerated, including the absence across
                the enumerated discourses of any insight-alone assignment to a named person, confirming and
                quantifying the reading argued most sharply by Cousins and consonant with Gethin and Anālayo.
                Two negatives stand behind this. That the personality typology of the six temperaments is not in
                the four Nikāyas is well evidenced and is the study's most distinctive output. That the word{' '}
                <em>carita</em> never carries the temperament sense in the four Nikāyas is now a counted result
                rather than a reading: across the Sutta Piṭaka the word appears in 554 passages, of which only
                nine carry a temperament compound, and all nine fall outside the four primary Nikāyas, among the
                Khuddaka's analytical and para-canonical works: the Mahā- and Cūḷaniddesa, the Nettippakaraṇa,
                the Peṭakopadesa, and the Milindapañha. The Paṭisambhidāmagga, sometimes taken as the home of
                this terminology, carries none. The remaining occurrences are the verb and the
                good-or-bad-conduct senses. The meditative sense of <em>kammaṭṭhāna</em>, likewise confirmed by
                an exact count, is effectively confined to the Visuddhimagga.
              </p>

              {/* REFERENCES */}
              <h2 style={h2}>References</h2>
              <ol style={refList}>
                <li style={refItem}>Anālayo. 2003. <em>Satipaṭṭhāna: The Direct Path to Realization</em>. Birmingham: Windhorse.</li>
                <li style={refItem}>Anālayo. 2017. <em>Early Buddhist Meditation Studies</em>. Barre: Barre Center for Buddhist Studies.</li>
                <li style={refItem}>Bapat, P. V. 1937. <em>Vimuttimagga and Visuddhimagga: A Comparative Study</em>. Poona.</li>
                <li style={refItem}>Bronkhorst, Johannes. 1993. <em>The Two Traditions of Meditation in Ancient India</em>. Stuttgart: Franz Steiner.</li>
                <li style={refItem}>Buddhaghosa. <em>Visuddhimagga</em>. Chaṭṭha Saṅgāyana edition. Trans. Bhikkhu Ñāṇamoli, <em>The Path of Purification</em>, 1956.</li>
                <li style={refItem}>Cousins, L. S. 1984. "Samatha-yāna and Vipassanā-yāna." In <em>Buddhist Studies in Honour of Hammalava Saddhātissa</em>, 56–68. Nugegoda.</li>
                <li style={refItem}>Cousins, L. S. 1996. "The Origins of Insight Meditation." In <em>The Buddhist Forum IV</em>, ed. T. Skorupski, 35–58. London: SOAS.</li>
                <li style={refItem}>Crosby, Kate, Andrew Skilton, and Pyi Phyo Kyaw. 2019. Studies on kammaṭṭhāna and the borān tradition. <em>Contemporary Buddhism</em> 20.1–2.</li>
                <li style={refItem}>Cūḷaniddesa and Mahāniddesa. Khuddaka Nikāya. Chaṭṭha Saṅgāyana edition.</li>
                <li style={refItem}>Gethin, Rupert. 1992. <em>The Buddhist Path to Awakening</em>. Leiden: Brill.</li>
                <li style={refItem}>Kuan, Tse-fu. 2008. <em>Mindfulness in Early Buddhism</em>. London: Routledge.</li>
                <li style={refItem}>Law, B. C. 1922. <em>Designation of Human Types (Puggala-Paññatti)</em>. London: Pali Text Society.</li>
                <li style={refItem}>Nyanaponika Thera and Bhikkhu Bodhi. 1999. <em>Numerical Discourses of the Buddha</em>. Walnut Creek: AltaMira.</li>
                <li style={refItem}>Shaw, Sarah. 2006. <em>Buddhist Meditation: An Anthology of Texts from the Pāli Canon</em>. London: Routledge.</li>
                <li style={refItem}>Stuart, Daniel M. 2015. <em>A Less Traveled Path</em>. Vienna and Beijing.</li>
                <li style={refItem}>Sujato, Bhikkhu, trans. <em>SuttaCentral</em>. The corpus's English layer for the Nikāyas.</li>
                <li style={refItem}>Vetter, Tilmann. 1988. <em>The Ideas and Meditative Practices of Early Buddhism</em>. Leiden: Brill.</li>
              </ol>

              {/* APPENDIX */}
              <h2 style={h2}>Appendix: the dataset</h2>
              <p style={tableCaption}>
                The complete census, grouped by analytic group. Each citation opens its passage in the reader.
                Open a row for the verbatim Pāli, the translation or author's gloss, the warrant, and the
                verification status. The dataset is versioned ({data.meta.version}), pinned to the corpus
                snapshot of {data.meta.corpus_snapshot}, and published with this study; the design and codebook
                are frozen in the research-design document.
              </p>
              {FACETS.map((f) => {
                const rows = derived.byFacet[f.key];
                const key = 'fac:' + f.key;
                return (
                  <section key={key} style={bucketSection}>
                    <button style={bucketHeader} aria-expanded={!!open[key]} onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}>
                      <span aria-hidden="true" style={{ width: 16, display: 'inline-block' }}>{open[key] ? '▾' : '▸'}</span>
                      <span style={bucketTitle}>{f.short}</span>
                      <span style={bucketCount}>{fmt(rows.length)}</span>
                    </button>
                    {open[key] && (
                      <ol style={evList}>
                        {rows.map((r, i) => {
                          const rkey = (r.study_label || r.id || r.citation) + ':' + i;
                          const ekey = key + ':' + rkey;
                          return (
                            <li key={rkey} style={evRow}>
                              <Cite id={r.id}>{r.citation}</Cite>
                              <span style={evLayer} title={TIER_COL[r.tier]?.full || r.tier}>{TIER_COL[r.tier]?.label || r.tier}</span>
                              {r.h_class === 'H1' && <span style={miniInnov}>H1</span>}
                              <span style={evBeing}>{r.recipient}</span>
                              <button style={evToggle} onClick={() => setOpen((o) => ({ ...o, [ekey]: !o[ekey] }))}>
                                {open[ekey] ? 'hide' : 'evidence'}
                              </button>
                              {open[ekey] && (
                                <div style={evDetail}>
                                  {r.object && <p style={evField}><span style={evFieldKey}>Object.</span> {r.object}</p>}
                                  <p style={evField}><span style={evFieldKey}>Mode.</span> {MODE_LABEL[r.mode] || r.mode}. <span style={evFieldKey}>Criterion.</span> {r.criterion}. <span style={evFieldKey}>Function.</span> {r.function}.</p>
                                  {r.recipient_features && <p style={evField}><span style={evFieldKey}>Features.</span> {r.recipient_features}</p>}
                                  {r.evidence_pali && <p style={evPali}>{r.evidence_pali}</p>}
                                  {r.evidence_en && <p style={evEn}>{r.evidence_en}</p>}
                                  <p style={evMeta}>
                                    <span style={evFieldKey}>Warrant.</span> {r.warrant || (r.h_class === 'H1' ? 'none (commentarial innovation)' : 'self (canonical)')}
                                    {'  ·  '}<span style={evFieldKey}>Provenance.</span> {r.tr_provenance}
                                    {'  ·  '}<span style={evFieldKey}>Verification.</span> {r.verification}
                                  </p>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </section>
                );
              })}

              <p style={footNote}>
                Census {data.meta.version}, {fmt(derived.inst.length)} guidance instances across the live
                corpus of {fmt(194710)} passages, snapshot {data.meta.corpus_snapshot}. Data-availability: the
                dataset, the codebook, and the design are published with this study and reproducible from the
                live database; every citation resolves to a passage in the reader.
              </p>

              {data.meta.query_log && (
                <section style={{ marginTop: 14 }}>
                  <h2 style={h2}>Reproducibility appendix: the exact queries</h2>
                  <p style={methodNote}>
                    This is the full query log. {data.meta.query_log.engine} A reader with database access can
                    paste each predicate and reproduce the count; the frame is the union of the four rules
                    below, and the figures elsewhere in the paper are filters over the instances those rules
                    surfaced. Diacritics follow the corpus (the niggahita is written both ways, ṃ and ṁ, so the
                    predicates list both where it matters).
                  </p>
                  <h3 style={h3}>The candidate frame: {fmt(data.meta.query_log.frame_union)} passages</h3>
                  <div style={tableWrap}>
                    <table style={table}>
                      <thead>
                        <tr><th style={thLeft}>Frame rule</th><th style={thLeft}>Predicate on <code style={codeInline}>passages.original</code></th><th style={thNum}>Hits</th></tr>
                      </thead>
                      <tbody>
                        {data.meta.query_log.frame_rules.map((q, i) => (
                          <tr key={i} style={tr}>
                            <td style={tdLeftSm}>{q.rule}</td>
                            <td style={tdLeftSm}><code style={codeInline}>{q.predicate}</code></td>
                            <td style={tdNum}>{fmt(q.candidates)}</td>
                          </tr>
                        ))}
                        <tr style={trTotal}>
                          <td style={tdLeftSm}>Deduplicated union (the frame)</td>
                          <td style={tdLeftSm}><span style={tinyNote}>distinct passage ids across the four rules</span></td>
                          <td style={tdNumStrong}>{fmt(data.meta.query_log.frame_union)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p style={tableCaption}>
                    Meditation-object vocabulary used by the first two rules (alternation, case-insensitive):{' '}
                    <code style={codeInline}>{data.meta.query_log.meditation_object_vocabulary}</code>
                  </p>
                  <h3 style={h3}>The <em>carita</em> sense-split</h3>
                  <p>
                    Scope: {data.meta.query_log.carita_sense_split.scope}. Any occurrence,{' '}
                    <code style={codeInline}>{data.meta.query_log.carita_sense_split.any_carita}</code>. The
                    temperament compound,{' '}
                    <code style={codeInline}>{data.meta.query_log.carita_sense_split.temperament_compound}</code>.
                    The Paṭisambhidāmagga control,{' '}
                    <code style={codeInline}>{data.meta.query_log.carita_sense_split.paṭisambhidāmagga}</code>.
                    The nine temperament-compound passages, each opening in the reader:
                  </p>
                  <ul style={idList}>
                    {data.meta.query_log.carita_sense_split.nine_ids.map((s) => {
                      const id = s.split(' ')[0];
                      const work = s.slice(s.indexOf('(')) || '';
                      return <li key={id} style={drillLi}><Cite id={id}>{id}</Cite> <span style={drillMeta}>{work}</span></li>;
                    })}
                  </ul>
                  <p style={tableCaption}>{data.meta.query_log.integrity}</p>
                </section>
              )}
            </div>
          </>
        )}
      </article>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Heart-base study. Companion to IndividualGuidanceStudy: a three-tier reading
// (Sutta / Abhidhamma / Commentary) of the seat of mind, bhavaṅga, and the
// insight-ladder. Reads public/research/heart-base-and-insight.json for the
// three-tier table; the paper prose lives inline. Admin-gated via Dhamma.jsx.
// ---------------------------------------------------------------------------

function TierCell({ cell }) {
  if (!cell || (!cell.text && (!cell.cites || !cell.cites.length))) return <td style={tdLeftSm}>·</td>;
  return (
    <td style={tdLeftSm}>
      {cell.text}
      {cell.cites && cell.cites.length > 0 && (
        <span style={{ display: 'block', marginTop: 4 }}>
          {cell.cites.map((c, i) => (
            <span key={c.id}>{i ? ' · ' : ''}<Cite id={c.id}>{c.label}</Cite></span>
          ))}
        </span>
      )}
    </td>
  );
}

function HeartBaseStudy({ entry, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <article style={articleReadWrap}>
        <button onClick={onBack} style={backBtn} aria-label="Back to Research (Esc)">
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to Research</span>
          <span style={backBtnHint}>Esc</span>
        </button>

        {!data && !error && <p style={hint}>Loading…</p>}
        {error && <p style={errorHint}>Failed to load: {error.message}</p>}

        {data && (
          <>
            <header style={articleHeader}>
              <h1 style={articleHeaderTitle}>{entry.title}</h1>
              <p style={articleHeaderAuthor}>{entry.subtitle}</p>
            </header>

            <div style={articleBody}>
              <p style={abstractLead}>
                <span style={abstractTag}>Abstract.</span> Is the heart the seat of mind in the Buddha's
                teaching? Is bhavaṅga, the life-continuum? Is the staged progress-of-insight, with its named
                knowledges, the Buddha's, or a later systematization? This companion to the guidance census
                answers all three on a three-tier reading. The seat of mind is the cleanest case: the suttas
                are silent, the Abhidhamma posits a material base but leaves it un-named, and the commentary
                names it the heart and locates it in the heart's blood. The same shape repeats for the
                life-continuum and for the named insight-ladder: in each, the suttas give the lived practice,
                the Abhidhamma supplies the analytical parts, and the commentary names the organ and assembles
                the machine. For two other structures, the three roots and the analytical categories, the
                suttas already carry the material and the Abhidhamma systematizes rather than originates it.
              </p>
              <p style={methodNote}>
                Every corpus claim is grounded in a passage that opens in the reader. The not-in-the-Abhidhamma
                verdicts rest on negative controls, searches that return nothing across the seven books, which
                are reliable here but sensitive to spelling. The dating and the origin-account of the Abhidhamma
                are secondary scholarship, not corpus-verified. The modern-practice testimony is attributed and
                flagged as not independently verifiable. Renderings of commentary and Abhidhamma are the
                author's own, checked against Ñāṇamoli.
              </p>

              <h2 style={h2}>Two things that frame everything</h2>
              <p>
                First, the contrast has three tiers, not two. The Theravāda canon is not only the suttas: the
                Abhidhamma is the third basket, canonical, and most of what a flat split would call commentary
                is the commentary systematizing the Abhidhamma. The seat of mind, the life-continuum, the three
                roots and the analytical categories are all canonical-Abhidhamma yet absent from the suttas; a
                two-tier scheme either credits them to the suttas or wrongly calls them commentarial inventions.
                The Abhidhamma is canonical but second: the account that makes it the word of the Buddha, its
                preaching in the Tāvatiṃsa heaven, is itself commentarial, so the story that sacralizes the
                Abhidhamma sits a tier above the canon it explains. Critical scholarship dates the seven books
                later than the Nikāyas, growing out of the suttas' doctrinal lists. Either way the suttas are the
                earliest stratum and the Abhidhamma is the first systematizing layer. The para-canonical
                Khuddaka bridge named here, the Niddesa and the Paṭisambhidāmagga and the rest, is this study's
                analytic grouping of works the corpus files under the Sutta basket, not a separately dated stratum.
              </p>
              <p>
                Second, the Buddha's register is to be lived, not pondered: come and see, to be experienced by
                the wise, visible here and now, continuous watching, cultivation, knowing-and-seeing as it is.
                The canon is a path to walk. The named knowledges are a description of the milestones that
                walking passes through. The distinction that matters is not experience against thinking, since
                both the lived dissolution and the named dissolution-knowledge are about experience. It is the
                path the Buddha gave you to walk against the route-map the commentary drew over it. Keeping the
                two apart is what the three-tier reading makes possible.
              </p>

              <h2 style={h2}>The three-tier table</h2>
              <p style={tableCaption}>
                Each structure scored against the four tiers. Every cell's citations open the passage in the
                reader. Column key as in the guidance census: Sutta = the four Nikāyas and prose Khuddaka;
                Abhi. = the Abhidhamma Piṭaka; Para-c. = the para-canonical Khuddaka analytical works
                (Nettippakaraṇa, Peṭakopadesa, Paṭisambhidāmagga, Niddesa); Comm. = aṭṭhakathā, ṭīkā, and the
                Visuddhimagga.
              </p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Structure</th>
                      {TIER_KEYS.map((k) => <th key={k} style={thLeft} title={TIER_COL[k].full}>{TIER_COL[k].label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.structure} style={tr}>
                        <td style={tdLeftSm}><strong>{r.structure}</strong></td>
                        {TIER_KEYS.map((k) => <TierCell key={k} cell={r.cells[k]} />)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 style={h2}>The heart-base (hadaya-vatthu)</h2>
              <p>
                The seat of mind is the cleanest case, because the commentary fills an Abhidhamma blank and says
                so. In the suttas the heart is only an organ in the body-parts list and a figure of speech; it
                is never the seat of thought. The Paṭṭhāna posits a material support for the two mind-elements
                but leaves it un-named (<Cite id="patthana1.1">Paṭṭhāna 1.1</Cite>):
              </p>
              <p style={evPaliBlock}>
                Yaṁ rūpaṁ nissāya manodhātu ca manoviññāṇadhātu ca vattanti, taṁ rūpaṁ … nissayapaccayena
                paccayo.
              </p>
              <p style={evEnBlock}>
                The matter dependent on which the mind-element and the mind-consciousness-element occur, that
                matter is a condition, by way of support, for them. (author's gloss)
              </p>
              <p>
                The Dhammasaṅgaṇī likewise gives each sense-consciousness a base but leaves the
                mind-consciousness base indeterminate (<Cite id="cst-abh01m.mul-078">Dhs §584</Cite>). The
                commentary substitutes the heart (<Cite id="cst-abh03a.att-370_p002">Pañca-a §370</Cite>):
              </p>
              <p style={evPaliBlock}>Ettha ca rūpanti hadayavatthumattameva adhippetaṁ.</p>
              <p style={evEnBlock}>And here, by "matter", only the heart-base is meant. (author's gloss)</p>
              <p>
                The sub-commentary defends the move "from scripture and reason"
                (<Cite id="cst-e0104n.att-16_p024">Vism-mhṭ §16</Cite>), quoting the Paṭṭhāna clause as its
                scripture and noting that the Dhammasaṅgaṇī never stated it. It even physicalizes the base,
                running on the half-handful of blood inside the heart-chamber
                (<Cite id="cst-abh07t.nrf-135_p014">Abh-pṭ §135</Cite>). The word <em>hadaya-vatthu</em>
                does not occur in the canonical Abhidhamma at all. So the heart-as-seat-of-mind is a self-aware
                commentarial naming of an Abhidhamma placeholder: the base is canonical Abhidhamma; only the
                heart-identification and its physiology are the commentary's.
              </p>

              <h2 style={h2}>Bhavaṅga (the life-continuum)</h2>
              <p>
                Bhavaṅga follows the same pattern, one degree milder. The suttas have no life-continuum; the
                nearest analogue is the luminous mind (<Cite id="an1.41-50">AN 1.49–50</Cite>), a figure of
                moral purity with no base and no mechanism. The Paṭṭhāna uses bhavaṅga as a real term, a
                discrete state in the conditional relations (<Cite id="patthana2.1">Paṭṭhāna 2.1</Cite>), but
                with no series and no seat. The commentary builds the full cognitive process, the citta-vīthi,
                in which bhavaṅga vibrates, is arrested, gives way to the cognitive series and returns, and it
                ties bhavaṅga to the heart-base as an object-less life-continuum
                (<Cite id="cst-abh01t.tik-69_p013">Abh-pṭ §69</Cite>). So bhavaṅga is Abhidhamma-canonical and
                commentarially elaborated, not invented: the commentary's genuine surplus is the process model
                and the heart-seat, not the existence of the term.
              </p>

              <h2 style={h2}>The stages of insight</h2>
              <p>
                The staged progress-of-insight is a weave of three differently-sourced strata. What the suttas
                give is the experiential path, coarse-grained: watch rise-and-fall, then impermanence,
                disenchantment, fading, release; the fourth tetrad of mindfulness of breathing watches
                impermanence, fading, cessation, and letting go. These are instructions to live, not stations
                to recognize. The skeleton of the path, the seven purifications, is sutta: MN 24
                (<Cite id="mn24">MN 24</Cite>) enumerates all seven, and the Visuddhimagga is built on them. The
                analytical ground the insight works on, the aggregates, sense-bases, elements and dependent
                origination, is Abhidhamma, the Vibhaṅga's chapters (<Cite id="vb1">Vibh 1</Cite>,{' '}
                <Cite id="vb2">Vibh 2</Cite>, <Cite id="vb6">Vibh 6</Cite>). But the named graded ladder,
                rise-and-fall knowledge, dissolution knowledge, comprehension, equanimity about formations,
                returns nothing across the seven Abhidhamma books; it is first defined in the para-canonical
                Paṭisambhidāmagga (<Cite id="ps1.1">Paṭis 1.1</Cite>), then systematized and refined by the
                Visuddhimagga (<Cite id="cst-e0101n.mul-53_p011">Vism §53</Cite>), which even adds a
                momentary-versus-continuity reading the bare Paṭisambhidāmagga does not spell out
                (<Cite id="cst-e0104n.att-76_p012">Vism-mhṭ §76</Cite>).
              </p>
              <p>
                So the precise case of dissolution-knowledge is this: the observation of dissolution is
                canonical and meant to be walked; numbering it as a fixed station, the fifth knowledge, is the
                para-canonical and commentarial map of that walking. The Visuddhimagga's insight-system is a
                weave of a sutta skeleton, Abhidhamma categories, and a para-canonical staging, assembled,
                populated and graded by the commentary, which even states the weave: two purifications as root,
                five as body, operating on the aggregates, sense-bases, elements and dependent origination as
                their ground (<Cite id="cst-abh08t.nrf-100_p024">Abh-pṭ §100</Cite>). The danger the texts flag,
                and that modern teachers flag, is the same: mistaking a landmark, a pleasant dissolution, for
                the destination.
              </p>

              <h2 style={h2}>The carita scheme across the tiers</h2>
              <p>
                The temperament scheme sharpens across the tiers as it does in the guidance census. The
                three roots are Abhidhamma, the three unwholesome roots of the Dhammasaṅgaṇī and the Vibhaṅga
                (<Cite id="cst-abh02m.mul-226">Vibh §226</Cite>). A three-fold root-carita with a remedy matrix,
                greed to foulness, hate to love, delusion to dependent origination, is already para-canonical, in
                the Nettippakaraṇa and Peṭakopadesa (<Cite id="ne6">Nett §13</Cite>), but only on those three
                roots. The six-fold personality typology, the affinity theory, the object-suitability matrix
                (<Cite id="cst-e0101n.mul-36_p031">Vism III §46</Cite>) and the heart-blood diagnostics
                (<Cite id="cst-abh02a.att-70_p058">Vibh-a §70.58</Cite>) are the commentary's, first set in the
                Aṭṭhakathā (<Cite id="cst-s0201a.att-mn1_3_p261">Ps-a 3 §261</Cite>). Where the Abhidhamma does
                use the word <em>carita</em> (<Cite id="cst-abh02m.mul-149">Vibh §817</Cite>), it means kamma,
                the three kinds of formation, not temperament; the temperament sense is a commentarial re-coinage.
              </p>

              <h2 style={h2}>Modern practice</h2>
              <p>
                In modern lay practice this apparatus is alive. In Goenka's teaching, dissolution (bhaṅga) is a
                sensation-stage, the dissolving of gross sensation into a subtle free-flow, and it is explicitly
                not the goal; the central caution is against taking it as the goal. The heart-base and bhavaṅga
                discernment is taught in the modern Abhidhamma-revival lineages too. Pa-Auk teaches it
                explicitly in its published materials (Pa-Auk Sayadaw, <em>Knowing and Seeing</em>). For
                Goenka the public record, the ten-day discourses and U Ba Khin's published <em>Essentials</em>,
                centres on feeling and does not surface the heart-base; a long-course practitioner reports that
                the heart-base and bhavaṅga work is taught in the non-public long-course discourses. That report
                cannot be independently verified and is recorded as attributed practitioner testimony, not a
                citation. If accurate, it strengthens rather than weakens the reading, since it would mean the
                modern method operationalizes the full Abhidhamma-and-commentary apparatus, not only the
                sensation-sweep.
                Historically the whole apparatus, the sixteen knowledges, the cognitive process, bhavaṅga and
                the heart-base, is the Visuddhimagga and Abhidhamma system revived for mass lay practice by Ledi
                Sayadaw and built out by the twentieth-century Burmese teachers (Erik Braun, <em>The Birth of
                Insight</em>).
              </p>

              <h2 style={h2}>How the heart is integral, and to which tier</h2>
              <p>
                The heart is integral, but to a tier. In the suttas it is not the seat of mind at all; the
                physical base of mind is left unstated. In the Abhidhamma a material base is posited but
                unnamed, and bhavaṅga exists as a bare term. In the commentary, and in the modern
                Abhidhamma-revival practice that teaches it, the heart becomes integral: named, made the seat of
                the life-continuum, located in the heart's blood, and in practice an object of discernment.
                Encountering it in long-course instruction is real; it is a commentarial-to-modern achievement
                layered on an Abhidhamma placeholder and a sutta silence.
              </p>

              <h2 style={h2}>Limits and sources</h2>
              <p>
                The not-in-the-Abhidhamma verdicts rest on negative controls, searches that return nothing
                across the seven books; reliable here but sensitive to spelling and stemming. The dating of the
                Abhidhamma and the account of its origin are secondary and scholarly, not corpus-verified. The
                long-course claim is attributed testimony about confidential material. A few rows, the
                cognitive-process vocabulary of the late manual layer, the dependent-origination half of the
                Vibhaṅga categories, and the Paṭisambhidāmagga classification, are confirmed in direction, with
                the per-row verbatim still to come. Sources for the secondary claims: Frauwallner,
                <em> Studies in Abhidharma Literature</em>; Cousins, <em>Abhidhamma Studies III</em>; Gethin,
                <em> The Foundations of Buddhism</em>; Ronkin, <em>Early Buddhist Metaphysics</em>; Braun,
                <em> The Birth of Insight</em>; Pa-Auk Sayadaw, <em>Knowing and Seeing</em>.
              </p>

              <p style={footNote}>
                Companion to the individual-guidance census, version {data.meta.version}, snapshot{' '}
                {data.meta.corpus_snapshot}. Every corpus citation resolves to a passage in the reader.
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
// Drill-down: clickable count cells + the panel that lists the instances behind a count.
const tdNumDot = { textAlign: 'right', padding: '7px 10px', color: 'var(--bc-text-tertiary)' };
const drillNum = { background: 'transparent', border: 'none', padding: '1px 3px', margin: '-1px -3px', font: 'inherit', fontVariantNumeric: 'tabular-nums', color: 'var(--bc-accent)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 };
const drillNumStrong = { ...drillNum, fontWeight: 600 };
const drillBox = { margin: '4px 0 16px', padding: '12px 14px', borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.45)', background: 'rgba(var(--bc-accent-rgb), 0.045)', borderRadius: 3 };
const drillHead = { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 8 };
const drillTitle = { fontFamily: SERIF, fontWeight: 600, fontSize: 13.5, color: 'var(--bc-text-primary)' };
const drillCount = { fontSize: 12, color: 'var(--bc-text-tertiary)', fontVariantNumeric: 'tabular-nums' };
const drillClose = { marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--bc-text-tertiary)', fontSize: 11.5, letterSpacing: '0.04em', cursor: 'pointer', fontFamily: 'inherit' };
const drillOl = { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '3px 18px', maxHeight: 360, overflowY: 'auto' };
const drillLi = { fontFamily: SERIF, fontSize: 13, lineHeight: 1.5, color: 'var(--bc-text-secondary)' };
const drillMeta = { color: 'var(--bc-text-tertiary)', fontStyle: 'italic' };
const drillObj = { color: 'var(--bc-accent)' };
const codeInline = { fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace', fontSize: 11.5, color: 'var(--bc-text-secondary)', background: 'rgba(var(--bc-accent-rgb), 0.06)', padding: '1px 4px', borderRadius: 3, wordBreak: 'break-word', whiteSpace: 'normal' };
const idList = { listStyle: 'none', margin: '4px 0 12px', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2px 18px' };
const tdNumStrong = { ...tdNum, fontWeight: 600 };
const catLink = { background: 'transparent', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'var(--bc-accent)', cursor: 'pointer', textAlign: 'left', textDecoration: 'underline', textDecorationColor: 'rgba(var(--bc-accent-rgb), 0.4)', textUnderlineOffset: 3 };
const tinyNote = { fontSize: 11, fontStyle: 'italic', color: 'var(--bc-text-tertiary)' };
const typeTag = { marginLeft: 8, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bc-text-tertiary)', border: '1px solid rgba(var(--bc-accent-rgb), 0.2)', borderRadius: 4, padding: '1px 5px', fontWeight: 400, verticalAlign: 'middle' };

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

// --- individual-guidance study additions ---
const abstractLead = { fontFamily: SERIF, fontSize: 15.5, lineHeight: 1.8, color: 'var(--bc-text-primary)', margin: '4px 0 6px' };
const abstractTag = { fontVariant: 'small-caps', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--bc-accent)', marginRight: 6 };
const h3 = { fontFamily: SERIF, fontSize: 14.5, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--bc-text-primary)', margin: '22px 0 8px' };

const citeLink = { color: 'var(--bc-accent)', textDecoration: 'none', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.32)' };
const citeDead = { color: 'var(--bc-text-tertiary)', fontStyle: 'italic', whiteSpace: 'nowrap' };

const tdLeftSm = { textAlign: 'left', padding: '6px 10px', color: 'var(--bc-text-primary)', fontSize: 13, lineHeight: 1.45, verticalAlign: 'top' };

const refList = { fontFamily: SERIF, fontSize: 13.5, lineHeight: 1.6, color: 'var(--bc-text-secondary)', margin: '4px 0 8px', padding: '0 0 0 24px', display: 'flex', flexDirection: 'column', gap: 7 };
const refItem = { paddingLeft: 4 };

const aidPanel = { border: '1px solid rgba(var(--bc-accent-rgb), 0.22)', borderRadius: 8, padding: '16px 18px', margin: '14px 0 18px', background: 'rgba(var(--bc-accent-rgb), 0.04)' };
const aidHeadRow = { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' };
const aidTagCanon = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bc-accent-text)', background: 'var(--bc-accent)', borderRadius: 4, padding: '2px 7px' };
const aidTagComm = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bc-text-secondary)', border: '1px solid rgba(var(--bc-accent-rgb), 0.4)', borderRadius: 4, padding: '2px 7px' };
const aidHeadText = { fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: 'var(--bc-text-secondary)', flex: 1, minWidth: 200 };
const aidNote = { fontSize: 12.5, fontStyle: 'italic', color: 'var(--bc-text-secondary)', borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.28)', paddingLeft: 12, margin: '10px 0 0' };
const aidCaveat = { fontSize: 12.5, color: 'var(--bc-text-secondary)', lineHeight: 1.65, borderLeft: '2px solid rgba(var(--bc-loss-text-rgb), 0.5)', paddingLeft: 12, margin: '10px 0 0' };

const miniInnov = { fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bc-loss-text)', border: '1px solid rgba(var(--bc-loss-text-rgb), 0.4)', borderRadius: 4, padding: '0 5px', marginRight: 8, fontWeight: 600 };
const evToggle = { background: 'transparent', border: 'none', color: 'var(--bc-accent)', font: 'inherit', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationColor: 'rgba(var(--bc-accent-rgb), 0.4)', textUnderlineOffset: 2 };
const evDetail = { margin: '8px 0 4px', padding: '8px 0 8px 14px', borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.22)' };
const evField = { fontFamily: SERIF, fontSize: 13, color: 'var(--bc-text-secondary)', margin: '0 0 6px', lineHeight: 1.55 };
const evFieldKey = { fontVariant: 'small-caps', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--bc-text-tertiary)', marginRight: 4 };
const evPali = { fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, color: 'var(--bc-text-primary)', lineHeight: 1.6, margin: '0 0 6px' };
const evEn = { fontFamily: SERIF, fontSize: 13, color: 'var(--bc-text-secondary)', lineHeight: 1.6, margin: '0 0 6px' };
const evMeta = { fontSize: 11.5, color: 'var(--bc-text-tertiary)', lineHeight: 1.5, margin: 0 };
const evPaliBlock = { fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: 'var(--bc-text-primary)', lineHeight: 1.7, margin: '0 0 6px', paddingLeft: 16, borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.3)' };
const evEnBlock = { fontFamily: SERIF, fontSize: 13.5, color: 'var(--bc-text-secondary)', lineHeight: 1.7, margin: '0 0 14px', paddingLeft: 16 };

function tierBadge(tier) {
  const base = { fontSize: 10.5, letterSpacing: '0.04em', borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap', border: '1px solid' };
  if (tier === 'sutta') return { ...base, color: 'var(--bc-accent)', borderColor: 'rgba(var(--bc-accent-rgb), 0.6)', fontWeight: 600 };
  if (tier === 'abhidhamma') return { ...base, color: 'var(--bc-accent)', borderColor: 'rgba(var(--bc-accent-rgb), 0.5)', borderStyle: 'dashed' };
  if (tier === 'none') return { ...base, color: 'var(--bc-loss-text)', borderColor: 'rgba(var(--bc-loss-text-rgb), 0.4)' };
  return { ...base, color: 'var(--bc-text-tertiary)', borderColor: 'rgba(var(--bc-accent-rgb), 0.25)' };
}
function hclassBadge(h) {
  const base = { fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', borderRadius: 4, padding: '1px 7px', whiteSpace: 'nowrap', border: '1px solid' };
  if (h === 'H0') return { ...base, color: 'var(--bc-accent)', borderColor: 'rgba(var(--bc-accent-rgb), 0.5)', background: 'rgba(var(--bc-accent-rgb), 0.07)' };
  return { ...base, color: 'var(--bc-loss-text)', borderColor: 'rgba(var(--bc-loss-text-rgb), 0.4)', background: 'rgba(var(--bc-loss-text-rgb), 0.06)' };
}
