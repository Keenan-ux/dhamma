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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isModifiedClick } from './linkHelpers.js';
import useIsNarrow from './useIsNarrow.js';
import useScrollHide from './useScrollHide.js';
import { useAuth } from './useAuth.jsx';
import ResearchNotes from './ResearchNotes.jsx';
import { SelectionActions } from './SelectionActions.jsx';
/* eslint-disable react-hooks/exhaustive-deps */

const RESEARCH_ENTRIES = [
  {
    slug: 'awakening',
    title: 'Every Instance of Awakening in the Pāli Canon and Commentary',
    subtitle: 'A census of 2,214 awakening events, classified by what precipitated them.',
    data: '/research/awakening-events.json',
    beings: '/research/awakening-beings.json',
  },
  {
    slug: 'individual-guidance',
    title: 'From Function to Essence',
    subtitle: 'How the early Buddhist teaching is systematized across the textual layers, in the guidance of persons and the description of the world.',
    data: '/research/individual-guidance.json',
  },
  {
    slug: 'heart-base-and-insight',
    title: 'The Heart-Base, Bhavaṅga, and the Stages of Insight',
    subtitle: 'A three-tier reading of where the seat of mind, the life-continuum, and the insight-ladder come from: sutta silence, an Abhidhamma placeholder, and a commentarial naming.',
    data: '/research/heart-base-and-insight.json',
  },
  {
    slug: 'uttarakuru',
    title: 'The People of Uttarakuru',
    subtitle: 'A canon-versus-commentary study of the northern continent’s inhabitants: the cosmos’s most fortunate humans, and by the canon’s own reckoning the worst placed for awakening.',
    data: '/research/uttarakuru.json',
  },
  {
    slug: 'naga',
    title: 'The Nāga as a Class of Being in the Pāli Canon',
    subtitle: 'What the canon holds a nāga to be, its births, its place in the cosmos, and the ceiling that bars it from awakening, and how the commentaries systematize, harden, and explain that picture.',
    data: '/research/naga.json',
  },
];

// Public worked examples — the same renderer, ungated, served from /explorations/*.json
// (outside the /research/*.json admin gate). The Explorations sidebar tab is open to all.
const EXPLORATION_ENTRIES = [
  {
    slug: 'wheel-turning-monarch',
    title: 'The Wheel-Turning Monarch Across the Canon and Its Commentaries',
    subtitle: 'A worked example of researching the corpus: how to find the wheel-turning-monarch passages, and a survey of what turns up across canon and commentary.',
    data: '/explorations/wheel-turning-monarch.json',
  },
  {
    slug: 'vegetarianism',
    title: 'Vegetarianism and Meat-Eating Across the Canon and Its Commentaries',
    subtitle: 'A worked example of researching the corpus: how to find the meat-eating passages, and a survey of where the Pāli stands on vegetarianism across canon and commentary.',
    data: '/explorations/vegetarianism.json',
  },
];

// Two collections, one renderer. `research` is admin-gated (Dhamma.jsx) and shows the
// compiled-article lane; `explorations` is public and static-only.
const COLLECTIONS = {
  research: {
    base: 'research',
    heading: 'Research',
    sub: 'Long-form studies built directly on the corpus. Counts are reproducible from the live database.',
    entries: RESEARCH_ENTRIES,
    showApi: true,
  },
  explorations: {
    base: 'explorations',
    heading: 'Explorations',
    sub: 'Worked examples of researching the canon with this tool: how to find the passages, and a survey of what turns up. Open to all.',
    entries: EXPLORATION_ENTRIES,
    showApi: false,
  },
};

// ── Study contents nav (the "you-are-here" outline) ───────────────────────
// Modeled on the boothcheck report outline, ported to Dhamma's inline-style,
// no-Tailwind house style. Two responsive variants share one data source:
//   • rail (wide)  — a sticky list in the right margin, beside the article.
//   • bar  (narrow) — a collapsible "contents · <current>" disclosure pinned
//     to the top of the scroll region, showing the active section.
// Orientation only: it discovers the sections from the rendered <h2>s inside
// the study's [data-scroll-root], tracks the active one on scroll, and jumps.
// No telemetry (house rule: no analytics).

const outlineLabel = (text) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  // keep it short: drop a trailing "Table N. " stays, but cap length
  return t.length > 38 ? t.slice(0, 36).trim() + '…' : t;
};
const slugify = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'sec';

function useStudyOutline(openKey) {
  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const rootRef = useRef(null);
  const elsRef = useRef([]);

  useEffect(() => {
    const root = document.querySelector('[data-scroll-root]');
    rootRef.current = root;
    if (!root) { setSections([]); setActiveId(null); return undefined; }

    const scan = () => {
      const found = Array.prototype.slice.call(root.querySelectorAll('article h2'));
      const seen = {};
      const list = found.map((el, i) => {
        if (!el.id) {
          let id = slugify(el.textContent);
          if (seen[id]) id = id + '-' + i;
          seen[id] = true;
          el.id = id;
        }
        return { id: el.id, label: outlineLabel(el.textContent), el };
      });
      elsRef.current = list;
      setSections((prev) => {
        if (prev.length === list.length && prev.every((p, i) => p.id === list[i].id)) return prev;
        return list.map((s) => ({ id: s.id, label: s.label }));
      });
    };

    const computeActive = () => {
      setScrolled(root.scrollTop > 120);
      const els = elsRef.current;
      if (!els.length) return;
      const line = root.getBoundingClientRect().top + 96;
      let best = els[0].id, bestTop = -Infinity;
      for (const s of els) {
        const top = s.el.getBoundingClientRect().top;
        if (top <= line && top > bestTop) { bestTop = top; best = s.id; }
      }
      setActiveId((p) => (p === best ? p : best));
    };

    let raf = 0;
    const onScroll = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; computeActive(); }); };

    const init = requestAnimationFrame(() => { scan(); computeActive(); });
    let mo = null, deb = 0;
    try {
      mo = new MutationObserver(() => { clearTimeout(deb); deb = setTimeout(() => { scan(); computeActive(); }, 150); });
      mo.observe(root, { childList: true, subtree: true });
    } catch { /* no MutationObserver: initial scan only */ }
    root.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(init); if (raf) cancelAnimationFrame(raf);
      clearTimeout(deb); if (mo) mo.disconnect();
      root.removeEventListener('scroll', onScroll);
    };
  }, [openKey]);

  const jumpTo = useCallback((id) => {
    const root = rootRef.current;
    if (!root) return;
    if (id === '__top__') { try { root.scrollTo({ top: 0, behavior: 'smooth' }); } catch { root.scrollTop = 0; } return; }
    const esc = (window.CSS && CSS.escape) ? CSS.escape(id) : id;
    const el = root.querySelector('#' + esc);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return { sections, activeId, jumpTo, scrolled };
}

const OUTLINE_TOP = { id: '__top__', label: 'overview' };

function StudyOutline({ openKey }) {
  // Rail needs room in the right margin beside the ~916px article (whose right
  // edge sits ~1106px from the viewport left once the sidebar shows); below this
  // the pinned bar is used instead, so the rail never overlaps the prose.
  const narrow = useIsNarrow(1340);
  const { sections, activeId, jumpTo, scrolled } = useStudyOutline(openKey);
  const [open, setOpen] = useState(false);
  // Track the same hide-on-scroll state as the TopNav so the pinned bar rises to
  // the very top when the nav slides away (and drops back under it when it shows),
  // instead of floating at a fixed offset. Paused while the dropdown is open.
  const navHidden = useScrollHide({ paused: open });
  if (!sections || sections.length < 2) return null;
  const entries = [OUTLINE_TOP, ...sections];
  const jump = (id) => { jumpTo(id); setOpen(false); };

  if (narrow) {
    // Show the pinned bar only after the reader scrolls past the header, so it
    // never covers the study's back-button / title at the top.
    if (!scrolled && !open) return null;
    const current = sections.find((s) => s.id === activeId) || sections[0];
    return (
      <div style={{ ...outlineBarWrap, top: navHidden ? 0 : 56, transition: 'top 0.3s ease' }}>
        <button type="button" style={outlineBarBtn} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span>contents{current ? <span style={{ color: 'var(--bc-text-tertiary)' }}> · {current.label}</span> : null}</span>
          <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', color: 'var(--bc-text-tertiary)' }}>▾</span>
        </button>
        {open && (
          <nav style={outlineBarNav} aria-label="study contents">
            {entries.map((e) => (
              <button key={e.id} type="button" onClick={() => jump(e.id)} aria-current={e.id === activeId ? 'true' : undefined} style={outlineEntry(e.id === activeId)}>{e.label}</button>
            ))}
          </nav>
        )}
      </div>
    );
  }
  return (
    <nav style={outlineRail} aria-label="study contents">
      <div style={outlineRailLabel}>contents</div>
      {entries.map((e) => (
        <button key={e.id} type="button" onClick={() => jump(e.id)} aria-current={e.id === activeId ? 'true' : undefined} style={outlineEntry(e.id === activeId)}>{e.label}</button>
      ))}
    </nav>
  );
}

export default function ResearchView({ collection = 'research' }) {
  // One renderer, two collections: the gated Research studies and the public
  // Explorations (worked examples). The collection sets the hash base, the index
  // heading, the entry list, and whether the admin-only compiled-article lane
  // (/api/research) is shown.
  const C = COLLECTIONS[collection] || COLLECTIONS.research;
  const base = C.base;
  // Admin-only inline research notes mount alongside an open study. isAdmin gates
  // them even on the PUBLIC explorations pages, so a non-admin never sees them.
  const { isAdmin } = useAuth();
  const matchSlug = (hash) => {
    const m = hash.match(new RegExp('^#/' + base + '/(.+)$'));
    return m ? decodeURIComponent(m[1]) : null;
  };

  // Initialized straight from the hash so a cold load on #/<base>/<slug>
  // starts on the entry, not the index.
  const [openSlug, setOpenSlug] = useState(() => matchSlug(window.location.hash));

  useEffect(() => {
    function syncFromHash() {
      const next = matchSlug(window.location.hash);
      setOpenSlug((prev) => (prev === next ? prev : next));
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

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
    const want = `#/${base}/${encodeURIComponent(openSlug)}`;
    if (window.location.hash === want) return;
    if (openSlug !== prev) {
      window.history.pushState(null, '', want);
    } else {
      window.history.replaceState(null, '', want);
    }
  }, [openSlug, base]);

  // Article-based research (admin-only, from /api/research) — the compiled
  // markdown studies. Listed alongside the bespoke static studies below. This
  // view only renders for admins (Dhamma.jsx gates it), so the fetch is safe.
  const [apiEntries, setApiEntries] = useState([]);
  useEffect(() => {
    if (!C.showApi) { setApiEntries([]); return; }
    let cancelled = false;
    fetch('/api/research', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => { if (!cancelled) setApiEntries(Array.isArray(d.entries) ? d.entries : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [C.showApi]);

  const entry = openSlug ? C.entries.find((e) => e.slug === openSlug) : null;
  if (entry) {
    const StudyComponent = collection === 'explorations' ? ExplorationStudy
      : entry.slug === 'individual-guidance' ? IndividualGuidanceStudy
      : entry.slug === 'heart-base-and-insight' ? HeartBaseStudy
      : entry.slug === 'uttarakuru' ? UttarakuruStudy
      : entry.slug === 'naga' ? NagaStudy
      : AwakeningStudy;
    return (
      <>
        <StudyComponent
          entry={entry}
          backLabel={C.heading}
          onBack={() => { setOpenSlug(null); window.history.replaceState(null, '', `#/${base}`); }}
        />
        <StudyOutline openKey={collection + ':' + openSlug} />
        {isAdmin ? (
          <ResearchNotes collection={collection} slug={openSlug} studyTitle={entry.title} />
        ) : (
          // Public readers (Explorations) get the dictionary lookup + copy on any
          // selection, the same multi-source popover as the main reader; notes and
          // tab-switching actions are admin-only, so they are hidden here.
          <SelectionActions scopeSelector="[data-scroll-root] article" hide={['search', 'compare', 'note']} />
        )}
      </>
    );
  }
  if (openSlug && !entry && C.showApi) {
    return (
      <ArticleStudy
        slug={openSlug}
        backLabel={C.heading}
        onBack={() => { setOpenSlug(null); window.history.replaceState(null, '', `#/${base}`); }}
      />
    );
  }

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>{C.heading}</h1>
        <p style={pageSubtitle}>{C.sub}</p>
        <div style={rule} />
      </header>

      <ul style={list}>
        {C.entries.map((e) => (
          <li key={e.slug} style={itemRow}>
            <a
              href={`#/${base}/${encodeURIComponent(e.slug)}`}
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
              href={`#/${base}/${encodeURIComponent(e.slug)}`}
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
function ArticleStudy({ slug, onBack, backLabel = 'Research' }) {
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
        <button onClick={onBack} style={backBtn} aria-label={`Back to ${backLabel} (Esc)`}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to {backLabel}</span>
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

function AwakeningStudy({ entry, onBack, backLabel = 'Research' }) {
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
        <button onClick={onBack} style={backBtn} aria-label={`Back to ${backLabel} (Esc)`}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to {backLabel}</span>
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
                An awakening in the Pāli texts is rarely a private event. Far more often a story
                carries it: a listener's mind comes free at the close of a talk, an old monk sings
                the moment his striving ended, a compiler notes in passing that a hearer's dust-free,
                stainless eye of the Dhamma has opened. This study traces awakening across the layers
                of the texts, earliest to latest, and asks three plain questions of every such moment
                in the live corpus ({fmt(194710)} passages): who awakens, when the passage was
                written, and in whose voice the account is given. Of{' '}
                {fmt(data.totals.classified)} passages that carry a stock attainment phrase,{' '}
                {fmt(data.totals.events)} narrate a real awakening; the other {fmt(data.totals.non_events)}{' '}
                use the phrase doctrinally or abstractly and are set aside.
              </p>
              <p style={abstractLead}>
                The walk climbs the strata in order: the early discourses (a thin floor of plainly
                narrated breakthroughs, and the one seam where the Buddha stakes his own awakening);
                the elders' verse (the attainment song, contested in date); the late canon (the bulk,
                carried almost single-handedly by the Apadāna's autobiographical verse); the edge of
                the canon (the paracanonical Milindapañha); and the commentary (the Visuddhimagga, the
                latest layer the survey touches). Of the {fmt(data.totals.events)} awakening events in
                the whole corpus, {fmt(colTotals.mula)} sit in the canonical division, and it is those
                {' '}{fmt(colTotals.mula)} the walk follows. Read across the layers, the events the
                tradition files as canonical turn out to be mostly late by composition and mostly
                narrated about the awakened, not the early Buddha-word the structural label implies.
              </p>
              <p style={methodNote}>
                A note on method. Recall is marker-bounded: an awakening told with no stock phrase is
                not caught here, so every count below is best read as a measured floor rather than a
                closed tally. The classification was checked by an independent re-reading of{' '}
                {data.verification.passages_compared} passages, which agreed on{' '}
                {data.verification.exact_bucket_agreement_pct}% of the exact circumstances and{' '}
                {data.verification.event_agreement_pct}% on whether a passage narrates an event at
                all; the small buckets carry real boundary fuzz. Every count is reproducible from the
                live corpus. In the closing census, click any circumstance to open its complete, cited
                list; each citation opens the passage in the reader.
              </p>

              {/* ----------------------------------------------------------------
                  Chronological spine. Each <h2> below names a textual stratum,
                  earliest to latest, so the contents outline reads diachronically.
                  The by-stratum and attribution tables (v2) are relocated INTO the
                  late-canon and commentary sections respectively. All numbers use
                  the same JSON accesses as before.
                  ---------------------------------------------------------------- */}

              <h2 style={h2}>In the early discourses</h2>
              <p>
                The structural division of the canon invites a particular expectation: that the
                events filed as canonical are, in the main, the old material, the core around which
                the later literature gathered. It does not hold even at the oldest floor. Of the{' '}
                {fmt(colTotals.mula)} events in the canonical division, only{' '}
                {fmt(data.v2 ? data.v2.stratigraphy.mula_early_vs_late['early-canonical'] : 38)}{' '}
                belong to the early discourses and the Udāna (Nikāya prose, 33, and the Udāna, 5).
                These are the awakenings most readers picture when they think of the canon describing
                its goal: a listener sits through a graduated talk and the eye of the Dhamma opens in
                him; a wanderer hears a few words and is freed. They are narrated plainly and briefly,
                by a compiler who does not dwell. The Udāna tells the awakening of Bāhiya
                (<Cite id="ud1.10">UD 1.10</Cite>) in a few flat lines, the same event the late verse
                would later unfold across a chain of lives.
              </p>
              <p>
                This early floor is also the one place in the whole census where the Buddha stakes his
                own awakening. When a text reports an awakening, someone is doing the reporting, and a
                flat note that a mind was freed has no speaker inside it claiming the event. Counting
                only the passages whose words are unmistakably the Buddha's, spoken of his own
                awakening,{' '}
                {data.v2 ? fmt(data.v2.attribution.buddha_vacana) : '17'} rows do this; once the
                duplicate edition-copies of a single discourse are merged they resolve to{' '}
                {data.v2 ? fmt(data.v2.attribution.buddha_vacana_dedup_recollections) : '9'} distinct
                recollections, among them the Bhayabherava and Dvedhāvitakka accounts
                (<Cite id="mn4">MN 4</Cite>, <Cite id="mn19">MN 19</Cite>), the long autobiography to
                Aggivessana (<Cite id="mn36">MN 36</Cite>), the accounts to Prince Bodhi and to
                Saṅgārava (<Cite id="mn85">MN 85</Cite>, <Cite id="mn100">MN 100</Cite>), the
                Verañja discourse the Vinaya repeats as its first occasioning-story
                (<Cite id="an8.11">AN 8.11</Cite>), and the breath-meditation account
                (<Cite id="sn54.8">SN 54.8</Cite>). On this central category three readers working
                independently from the Pāli agreed without a single exception (κ = 1.0). Nor does the
                Buddha speak only of himself here: within the canonical rows he also declares another's
                attainment ({data.v2 ? fmt(data.v2.attribution.buddha_declares_another) : '1'} such
                row, the Buddha telling Mahānāma that Kāḷigodhā's son has entered the stream,{' '}
                <Cite id="sn55.39">SN 55.39</Cite>), with the Nādika destiny-declarations recurring
                across 29 mūla rows beyond it. An earlier reading that recorded no such first-person
                floor at all has been corrected here.
              </p>
              <p style={methodNote}>
                The floor does not prove as much as it might seem. That the Buddha speaks of his
                awakening in these places does not make awakening his doctrinal subject rather than
                his biography; most of the {fmt(colTotals.mula)} canonical events remain the
                compiler's note or the elder's verse. The seam is also a lower bound: the
                seeker-before-the-night frame, searched in its own right, turns up in some 48 places
                across the canon, most of them outside this set.
              </p>

              <h2 style={h2}>In the elders' verse</h2>
              <p>
                Climb one layer and the report shifts key. The Theragāthā and Therīgāthā, 59 events
                between them, are the first stratum where the awakening event becomes the elder's own
                first-person attainment song, closed by a compiler's colophon naming him
                (<Cite>Theragāthā 1.66, Meghiya</Cite>). As a voice it
                stands between the compiler's flat early notice below it and the elaborated life-verse
                above it: the awakened person speaking of his own release after the fact. This stratum
                is genuinely contested in date, archaic in places and late in others, so it is marked
                register-relative rather than forced to one side. The lopsided shape that follows does
                not depend on where it falls, because the Apadāna alone already makes the late material
                the larger part. Read as early rather than late, the floor would grow at most by these
                59; even then the late bulk above stays the larger part.
              </p>

              <h2 style={h2}>In the late canon</h2>
              <p>
                The bulk of the canonical census lives here. The events that carry the canonical tag
                while composing late do not come from the discourses in the main but from the verse
                and exegetical anthologies the tradition gathered into the canon at a later stage. One
                stratum dominates the rest several times over: the Apadāna, 162 events, first-person
                verse in which a named elder traces a past good deed forward to his present release.
                This single late-canonical work supplies more than half of all{' '}
                {fmt(colTotals.mula)} canonical events and more than four times the entire early floor.
                Joined to it are the lineage verse of the Buddhavaṁsa (8,{' '}
                <Cite>Bv 10, Padumabuddhavaṁsa</Cite>), the late exegesis of the
                Niddesa (3, <Cite id="cnd5">Cnd 5</Cite>), the celestial-mansion verse of the
                Vimānavatthu (2), and the Vinaya occasioning-stories (6,{' '}
                <Cite id="pli-tv-kd1">Vin Mahāvagga nidāna</Cite>), where an awakening is staged inside
                a frame-story that explains how a monastic rule came to be laid down. The shape of this
                list is the finding: the place the canon most often files an awakening is not its old
                doctrinal prose but its late autobiographical verse.
              </p>
              <p>
                The structural mūla tag is a position in the edited corpus, not a date. Coding each
                canonical event by the chronological stratum of its work, independently of the
                mūla / aṭṭhakathā / ṭīkā layer, makes the gradient explicit: only{' '}
                {fmt(data.v2 ? data.v2.stratigraphy.mula_early_vs_late['early-canonical'] : 38)} of the{' '}
                {fmt(colTotals.mula)} canonical awakening events are early-canonical; the other{' '}
                {fmt(data.v2 ? data.v2.stratigraphy.mula_early_vs_late['late-or-later'] : 261)} carry
                the mūla tag while coding late-canonical, paracanonical, or commentary-era.
              </p>

              {/* Table 2b relocated: the by-stratum re-split lives in the late-canon section. */}
              {data.v2 && (
                <>
                  <p style={tableCaption}>
                    Table. The canon, re-split by chronological stratum. The single largest canonical
                    class, the Apadāna, is late-canonical autobiographical verse. Full paper:
                    research/awakening/FINDINGS-v2.md.
                  </p>
                  <div style={tableWrap}>
                    <table style={table}>
                      <thead>
                        <tr>
                          <th style={thLeft}>Work (canonical class)</th>
                          <th style={thNum}>Events</th>
                          <th style={thLeft}>Chronological stratum</th>
                          <th style={thLeft}>Layer/stratum disagree</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.v2.stratigraphy.class_strata)
                          .sort((a, b) => b[1].events - a[1].events)
                          .map(([work, d]) => (
                            <tr key={work} style={tr}>
                              <td style={tdLeft}>{work}</td>
                              <td style={tdNum}>{fmt(d.events)}</td>
                              <td style={tdLeft}>{d.stratum}</td>
                              <td style={tdLeft}>{['early-canonical', 'archaic-canonical'].includes(d.stratum) ? 'no' : 'yes'}</td>
                            </tr>
                          ))}
                        <tr style={trTotal}>
                          <td style={tdLeft}>All canonical events</td>
                          <td style={tdNumStrong}>{fmt(colTotals.mula)}</td>
                          <td style={tdLeft}>
                            {fmt(data.v2.stratigraphy.mula_early_vs_late['early-canonical'])} early,{' '}
                            {fmt(data.v2.stratigraphy.mula_early_vs_late['late-or-later'])} late-or-later
                          </td>
                          <td style={tdLeft}>{fmt(data.v2.stratigraphy.mula_early_vs_late.layer_stratum_disagree)} of {fmt(colTotals.mula)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <p>
                It is one thing to read 162 as a number and another to read one of the 162 as a life.
                Consider the elder whose verse opens the Apadāna's collection, the one who went for
                refuge to the Three Refuges (<Cite id="cst-s0510m1.mul-kn10_1">Therāpadāna 25,
                Tisaraṇagamaniya</Cite>). He tells his story from its root: lifetimes ago, in the city
                of Candavatī, he was a man who looked after his mother and his father. That ordinary
                care is the seed of the whole account, and the verse follows its fruit across the long
                round of rebirths down to the life in which the elder says, plainly and in his own
                voice, that he attained arahantship. Set beside the Bāhiya notice from the early floor,
                the difference in key is plain: the same event the early stratum records almost in
                passing, the late verse unfolds across a chain of lives. The biographical impulse, in
                other words, does not wait for the commentary to begin; it is already at work inside
                the late canon, gathering and celebrating the lives of those who awoke.
              </p>

              <h2 style={h2}>On the edge of the canon</h2>
              <p>
                The descent runs one step past the Tipiṭaka into the Milindapañha, 4 events,
                paracanonical dialogue sitting on the very edge of the canon proper, where a later
                author casts doctrine as the give-and-take of a king and a monk
                (<Cite>Mil 3.7.3, Nāgasena's dialogue</Cite>). The voice here is the
                named-disciple dialogue: the awakening is set inside the exchange of King Milinda and
                the elder Nāgasena. It is a thin stratum, kept distinct because it is its own point on
                the timeline, and it carries the line cleanly across the canon's outer boundary into
                the latest material the survey touches.
              </p>

              <h2 style={h2}>In the commentary</h2>
              <p>
                The walk ends at the latest material the survey reaches. The Visuddhimagga, 17 events,
                is classical commentary that the structural shelving nonetheless files as canonical
                (<Cite id="cst-e0102n.mul-4_p042">Vism 4 §42</Cite>), the clearest case where a text's
                structural file and its composition date pull in opposite directions. Its voice is the
                compiler's flat note, a narrator simply reporting that a listener's mind came free, the
                same plain frame that opens the early floor, now arriving many centuries later. By the
                time genuine commentary appears the narrated mode has been running since the late
                canon, layers earlier: the line between a spare doctrinal canon and an elaborating
                commentary is real, but for this subject it falls partly inside the canonical shelf
                itself rather than at its edge.
              </p>

              {/* Table 2c relocated: the attribution split lives in the commentary section,
                  where the four-voices arithmetic completes. */}
              {data.v2 && (
                <>
                  <p style={tableCaption}>
                    Table. Who narrates the awakening (attribution), coded per claim, one row at a
                    time. Most of the {fmt(colTotals.mula)} canonical awakening events are
                    narrated about the awakened, redactor-narrated frames or the awakened elder's own
                    hagiographic verse. But {fmt(data.v2.attribution.buddha_vacana)} rows
                    ({fmt(data.v2.attribution.buddha_vacana_dedup_recollections)} distinct,
                    deduplicated recollections) are the Buddha asserting his own awakening in the first
                    person, and the Buddha also declares others' attainments
                    ({fmt(data.v2.attribution.buddha_declares_another)} within this set; the Nādika
                    destiny declarations across 29 mūla rows beyond it). Confirmed per-row by three
                    independent blind coders (κ = 1.0).
                  </p>
                  <div style={tableWrap}>
                    <table style={table}>
                      <thead>
                        <tr>
                          <th style={thLeft}>Attribution (narrating voice)</th>
                          <th style={thNum}>Events</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.v2.attribution.mula_attribution_split).sort((a, b) => b[1] - a[1])
                          .map(([k, v]) => (
                            <tr key={k} style={tr}>
                              <td style={tdLeft}>{k}</td>
                              <td style={tdNum}>{fmt(v)}</td>
                            </tr>
                          ))}
                        <tr style={trTotal}>
                          <td style={tdLeft}>All canonical events</td>
                          <td style={tdNumStrong}>{fmt(colTotals.mula)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p style={methodNote}>
                    The voices sorted across the five layers resolve into four ways of telling. The
                    elder's own life-verse of the Apadāna carries 162; the disciple's own report of the
                    Theragāthā and Therīgāthā, 59; the compiler's flat note, 46; and the lineage and
                    dialogue verse, 14 (the 10 lineage and frame verse of the Buddhavaṁsa and
                    Vimānavatthu, joined by the 4 dialogue rows of the Milindapañha). These four
                    together carry 281 of the {fmt(colTotals.mula)}. Add the
                    {' '}{fmt(data.v2.attribution.buddha_vacana)} rows of the Buddha's own word and the
                    single row in which he declares another's stream-entry, and the
                    {' '}{fmt(colTotals.mula)} close. In each of the four, the awakening is something a
                    third party records or something the awakened person celebrates after the fact, not
                    the Buddha staking his own awakening as a claim.
                  </p>
                </>
              )}

              {/* ----------------------------------------------------------------
                  The complete census. The data-explorer blocks (by-circumstance
                  tables, who-awakens tables, and the per-bucket cited lists) sit
                  here as <h3> under one trailing <h2>, with every interaction
                  intact.
                  ---------------------------------------------------------------- */}
              <h2 style={h2}>The complete census</h2>
              <p style={tableCaption}>
                The full data explorer behind the walk above. The same {fmt(data.totals.events)} events,
                sorted three further ways: by what occasioned each awakening, by structural layer, and
                by who attained it. Every figure is reproducible from the live corpus, and every cited
                list expands to its rows, each citation opening the passage in the reader.
              </p>

              {/* Table 1: by circumstance */}
              <h3 style={h3}>By precipitating circumstance</h3>
              <p style={tableCaption}>
                Awakening here is overwhelmingly an occasioned event rather than the climax of solitary
                striving. Hearing the Dhamma accounts for{' '}
                {pct(data.buckets.find((b) => b.key === 'HEARING_DHAMMA')?.count, narrated)} of the
                events whose occasion is stated, formal striving for about a quarter, and a discrete
                external trigger (a sight, a fall, a crisis, a change of posture) for only about one in
                fourteen.
              </p>
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

              {/* Table 2: canon vs commentary (the structural layer split) */}
              <h3 style={h3}>By structural layer</h3>
              <p style={tableCaption}>
                Where each kind of awakening is narrated, by structural layer. The canon
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
                  <h3 style={h3}>Who awakens: named individuals</h3>
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
                  <h3 style={h3}>Collective and anonymous awakenings</h3>
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
              <h3 style={h3}>Complete cited list</h3>
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
  { key: 'F1-object-assign', heading: 'B. Assigning a meditation object', short: 'Object assignment (core)' },
  { key: 'F2-modes-types-agency', heading: 'A. The person and the mode of guidance', short: 'Modes, types, agency' },
  { key: 'F3-commentary-carita', heading: 'F. The commentarial temperament matrix', short: 'Object assignment by temperament (carita matrix)' },
  { key: 'F4-samatha-vipassana', heading: 'D. Calm and insight', short: 'Calm and insight' },
  { key: 'F5-commentary-assignment', heading: 'G. The commentarial assignment narratives', short: 'Object assignment (commentarial expansion)' },
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

function CopyCode({ text, label }) {
  const [done, setDone] = useState(false);
  if (!text) return label ? <span style={tinyNote}>{label}</span> : null;
  const copy = () => {
    try { navigator.clipboard?.writeText(text); } catch (e) { /* clipboard unavailable */ }
    setDone(true); setTimeout(() => setDone(false), 1300);
  };
  return (
    <code role="button" tabIndex={0} style={done ? codeCopied : codeCopyable}
      onClick={copy}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); } }}
      title="Click to copy this query">
      {text}{done ? <span style={copiedTag}>✓ copied</span> : null}
    </code>
  );
}

function Cite({ id, children }) {
  if (!id) return <span style={citeDead} title="No single corpus row (composite cell)">{children}</span>;
  return (
    <a href={`#/read/${encodeURIComponent(id)}`} style={citeLink} title={`Open ${children} in the reader`}>
      {children}
    </a>
  );
}

// A composite source cell has no single corpus row (e.g. "Vism cross-ref via
// Mp-a 18 §87; Sv-a 11 §2 (uddesa variant); Nett-a §11.26 (paccayākāra variant)").
// It cannot be one hyperlink, so show only the PRIMARY source named (the part
// before the first ';' or '('), capped, with the full cross-ref on hover.
function shortSource(s) {
  const primary = String(s || '').split(/[;(]/)[0].trim();
  return primary.length > 42 ? primary.slice(0, 40).trim() + '…' : (primary || '·');
}

// Pull resolvable corpus ids out of a free-text warrant string.
const WARRANT_ID_RE = /\b(?:an|sn|mn|dn|ud|snp|thig|thag|iti|dhp|cnd|mnd|pe|ne|ps)\d[\w.]*/gi;
function warrantIds(w) {
  if (!w) return [];
  const m = w.match(WARRANT_ID_RE);
  return m ? Array.from(new Set(m.map((s) => s.toLowerCase()))) : [];
}

function IndividualGuidanceStudy({ entry, onBack, backLabel = 'Research' }) {
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
    // Table 4 is the original curated 15-cell ledger; the 208 verified expansion
    // cells (source==='expansion', also H0/H1) live in Table 5, not here.
    const ledger = inst
      .filter((r) => (r.h_class === 'H0' || r.h_class === 'H1') && r.source !== 'expansion')
      .map((r) => ({ ...r, cellLabel: CELL[r.study_label] || r.object || r.citation }));
    // H0 by warrant tier (sutta, abhidhamma, para-canon), then H1 (no warrant)
    const wRank = { sutta: 0, abhidhamma: 1, 'para-canon': 2, none: 3 };
    ledger.sort((a, b) => (wRank[a.warrant_tier] ?? 9) - (wRank[b.warrant_tier] ?? 9));
    return { inst, facetByTier, byFacet, ledger };
  }, [data]);

  const sumTier = (obj) => TIER_KEYS.reduce((s, k) => s + (obj?.[k] || 0), 0);

  // Drill-down: every count cell opens the full hyperlinked list of instances behind it.
  const inst = derived?.inst || [];
  const frameN = data?.meta?.query_log?.frame_union ?? 755; // candidate-frame size, data-bound
  const expAdded = data?.aggregates?.expansion_added ?? 0;
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
              <Cite id={r.id}>{r.citation || r.id || '·'}</Cite>
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
        <button onClick={onBack} style={backBtn} aria-label={`Back to ${backLabel} (Esc)`}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to {backLabel}</span>
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
                <span style={abstractTag}>Background.</span> The Pāli canon's earliest layer teaches in one
                register. Its later literature teaches in another. The early discourses read what is presently
                the case and answer it as the situation needs. They watch the root now active in a mind, weigh
                how far a person's faculties have ripened, and place the whole world inside the
                fathom-long body. The thousand years of Abhidhamma, commentary, and sub-commentary that follow
                fix that supple teaching into closed systems: standing types and named tiers, closed lists and
                measured quantities. This study began with a narrow question. It asked how the canon matches a
                person to a practice. That question opened onto a larger one, and the larger one became the
                subject. How is an adaptive teaching turned into a fixed one? And is the hardening a single late
                break, or a tendency that recurs as the literature grows?
              </p>
              <p style={abstractLead}>
                <span style={abstractTag}>Methods.</span> The relevant vocabulary is traced across six textual
                strata. They run from the four Nikāyas through the late canon and the Abhidhamma, then the
                para-canonical works, the commentaries, and the sub-commentaries. Two domains are followed: the
                guidance of persons and the description of the world. Every count comes from a query grouped on
                textual stratum against the live corpus. Every term is read in sampled rows before it is trusted.
              </p>
              <p style={abstractLead}>
                <span style={abstractTag}>Results.</span> The move is real. It takes one form, and it recurs at
                more than one jump. Take the guidance of persons first. The canon sorts a mind by its present
                root, and it carries closed rosters keyed to capacity and route; the seven noble persons are one
                such roster. The six-temperament scheme built on <em>carita</em> (a person's settled character)
                is a different thing. It is attested zero times in the four Nikāyas and the seven Abhidhamma
                books. It fixes only in the commentaries. The other threads run the same way. The yoke of calm
                and insight becomes a set of named vehicles. The graded measure of concentration
                (<em>samādhismiṃ mattaso kārī</em>) becomes the named tiers of access and absorption. The first
                absorption, once given as a few felt qualities, becomes a closed inventory of factors. The
                description of the world shows the same shape, on a thinner and freshly-counted sample. The
                kasiṇa the canon offers as a measureless perception (<em>appamāṇa</em>, the boundless pole set
                against the limited) becomes a manufactured disc. The world-sphere (<em>cakkavāḷa</em>), named
                twice in the four Nikāyas, acquires the bounding rim-wall that makes it an object, and its
                measured dimensions, only in the commentary. What the early texts often leave as hyperbolic scale is
                later pinned to exact figures, the world-cycle dated into counted aeons. The hardening is staged
                rather than single. It intensifies again in the sub-commentaries, where the language of own-nature
                (<em>sabhāva</em>) reaches its peak. Most of these transitions localize cleanly to one jump or
                another. A minority run the other way, because the canon already holds fully built typologies
                and sometimes states an exact measure itself, and the tradition now and then refuses a measure
                or disowns its own system.
              </p>
              <p style={abstractLead}>
                <span style={abstractTag}>Conclusion.</span> So the systematization of the teaching is gradual
                and many-staged. It is not a single break between canon and commentary, and it is a tendency
                rather than a law. What stays consistently late is one move: a present function becomes a
                standing type, and an open or hyperbolic formulation becomes a counted, bounded one. The first is
                shown here in detail, across the guidance of persons. The second, in the description of the world,
                is shown on a thinner sample that points the same way. There is a tension internal to the
                tradition in this. A teaching of non-self and impermanence comes, in its later scholarship, to
                lean on the language of own-nature and fixed measure. Why the tendency runs as it does is a further question. It may answer to the
                needs of oral transmission. It may answer to a wider human pull toward concrete and permanent
                knowledge. That lies beyond what the texts can settle, and it is left open. For the practical
                matter this began with, the lower reaches of the path ask less than the later lore implies. The
                machinery that fits a person to a practice is later and firmer in its claims than its canonical
                shelving suggests. So is the cosmos it sits within.
              </p>

              <details style={{ margin: '18px 0 8px' }}>
                <summary style={{ fontVariant: 'small-caps', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--bc-accent)', cursor: 'pointer', fontSize: 13 }}>
                  Reproducibility and recall
                </summary>
                <p style={{ ...methodNote, marginTop: 8 }}>
                Every count below is reproducible from the live database, and
                every citation opens its passage. The enumeration does not rest on the search service alone. A
                frame of {fmt(frameN)} candidate passages was drawn by direct database query over the assignment
                vocabulary: the develop-imperatives paired with a named meditation object, the
                temperament-keyed assignment formula, and the commentarial idiom of giving a person a
                meditation subject. Every candidate was then coded independently more than once, and the
                passages set aside are recorded as reasoned exclusions, so the negatives are auditable beside
                the positives.
                Recall is bounded by that vocabulary and by the corpus edition: an assignment phrased in terms
                the frame did not cover could still be missed, which is why the frame is defined in full and is
                extensible. Beyond the temperament census, the wider reading reported below searched the rival
                vocabularies of person-individuation the word <em>carita</em> does not name (the present-root
                sort, faculty-maturity, learner-type, liberation-mode, dispositional diversity), and every such
                family was sense-audited on sampled rows before its count was trusted, since an abstract term's
                raw count is often a fixed doctrinal list rather than a way of telling persons apart. A
                diacritic-naive substring search compounds that risk in both directions. A bare search for{' '}
                <em>carita</em> returns 224 canonical rows that are all the ordinary conduct word
                (<em>sucarita</em>, <em>duccarita</em>) or the verb "having wandered," with no temperament-type
                among them; the same search is blind to the whole seven-person liberation roster, whose terms
                carry the long vowels and retroflexes a plain search drops, so an early systematized scheme can
                hide in plain sight under the diacritics. The recall floor here is set by reading sampled rows and
                by widening the search to the diacritic-bearing forms, not by any substring tally. Within the
                tradition's own closed lists (the four understanding-types, the antidote formula, the six
                temperaments, the object inventory) the enumeration is saturated, repeated passes surfacing no
                new member, and it was reconciled against the passages cited in the secondary literature;
                saturation here measures structural completeness, not a proof that the open corpus holds no
                further instance. The Khuddaka Nikāya is ingested twice in the corpus, once under each work
                and once under a single catch-all slug; the counts here de-duplicate the catch-all, so the
                disambiguated temperament compound stands at forty-three structurally-canonical rows rather
                than the fifty-three a naive slug tally returns. Where a count appears with different figures
                across the project's working documents, the difference is one of grouping (the corpus carries both
                a work-slug and a structural mula tag, and the Visuddhimagga is slug-Visuddhimagga but
                structurally mula-tagged) or of edition vintage (the commentary and sub-commentary were later
                subdivided into paragraph rows); the headline of each finding holds under every grouping.
                Renderings of commentary and Abhidhamma are the author's own, since the corpus
                carries no published English for those layers; they are checked against Ñāṇamoli for the
                Visuddhimagga and B. C. Law for the Puggalapaññatti.
                </p>
              </details>

              {/* ROADMAP */}
              <p>
                The study began at one corner of this field and widened. It first walks the guidance of persons
                by ascending stratum. In the early discourses a person is read by the mind's present root and by
                the reach of the faculties. In the Abhidhamma persons are sorted under other words while the
                temperament term stays absent. At the para-canonical Khuddaka one word changes its job. In the
                commentaries the temperament type is fixed and a whole design vocabulary blooms. In the
                sub-commentaries temperament is read off the body. Then the survey drops the partition and reads
                the whole field at once, across both domains, for the pattern that crosses the layers: where the
                hardening happens, at which jump, and where it does not. A later section marks the limits of
                saying so. A final section records findings of general importance that fell out of the wider
                reading.
              </p>

              {/* GEN:NARRATIVE-A:START — §§II–IV, generated from FINDINGS-readable.md by gen-narrative.mjs; do not hand-edit */}
              <h2 style={h2}>In the early discourses: read by what is present, and what one can do</h2>
              <p>Long before the six temperaments, the early discourses (the suttas) already individuate persons, and richly, but not by a fixed type. They read what is presently active in a mind and what a person is capable of. The plainest form keys an object to a present defilement: to Meghiya, harassed by thoughts of sense pleasure, ill will, and cruelty, the Buddha gives four things to develop: foulness (<em>asubha</em>) to give up greed, love (<em>mettā</em>) to give up hate, mindfulness of breathing (<em>ānāpānassati</em>) to cut off thinking, and the perception of impermanence (<em>anicca-saññā</em>) to uproot the conceit "I am" (<Cite id="an9.3">AN 9.3</Cite>, with the Udāna doublet <Cite id="ud4.1">Ud 4.1</Cite> and the de-personalised <Cite id="an9.1">AN 9.1</Cite>; the three-root variant <Cite id="an6.107">AN 6.107</Cite>). The pairing is functional, not characterological: it does not say the person is a lustful type. It says that where lust is present, this answers it. The same present-tense reading runs deeper in the way the canon sorts a mind by its currently-active root, "a mind with lust, a mind without lust; a mind with hate; a mind with delusion," the refrain of the contemplation of mind (<Cite id="mn10">MN 10</Cite>), which the Abhidhamma will later carry word for word. This is the engine the temperament grid eventually freezes: the canon reads the root that is present now; the commentary will set it into the standing type <em>rāgacarita</em>.</p>
              <p>Alongside this present-state reading the canon carries several genuine person-typologies, keyed not to temperament but to capacity and to the route a person takes. It sorts people by how quickly they can be taught: the four learners of the Ugghaṭitaññū-sutta, namely one who understands at a hint, one who needs detail, one who must be led, and one who only learns the words (<Cite id="an4.133">AN 4.133</Cite>). It reads the maturity of a person's faculties as one of the Realized One's own powers (<Cite id="mn12">MN 12</Cite>), the perception behind the lotus-pond survey of beings with little dust and much (<Cite id="sn6.1">SN 6.1</Cite>, <Cite id="mn26">MN 26</Cite>), and it waits for a mind made ready and pliable before it gives the teaching peculiar to the Buddhas (<Cite id="mn56">MN 56</Cite>). Most systematized of all, it carries a closed roster of seven noble persons (<em>satta ariyapuggalā</em>), graded by which faculty leads a person and how deep their attainment runs: the one freed both ways (<em>ubhatobhāgavimutta</em>, through the formless attainments and wisdom together), the one freed by wisdom alone (<em>paññāvimutta</em>), the body-witness (<em>kāyasakkhi</em>, who has touched the eight liberations with the body), the one attained-to-view (<em>diṭṭhippatta</em>, led by understanding), the faith-freed (<em>saddhāvimutta</em>, led by faith), and the two still on the path, the Dhamma-follower and the faith-follower (<em>dhammānusārī</em>, <em>saddhānusārī</em>) (<Cite id="mn70">MN 70</Cite>, <Cite id="an7.14">AN 7.14</Cite>). That is seven: a fully built person-typology, canonical and Buddha-voiced. A study that searched only for <em>carita</em> missed it entirely, because every term in it carries the long vowels and retroflexes a plain search drops.</p>
              <p>Two honest qualifications keep this from overreaching. First, the canon does also carry the yoke of calm and insight, <em>yuganaddha</em>, developed together rather than split into vehicles (<Cite id="an4.170">AN 4.170</Cite>), and across the discourses reached it never assigns insight alone, as a standing practice, to a named person; the dry-insight worker is a later figure. Second, two terms that look like early "disposition" vocabulary are in the canon mostly fixed doctrinal lists. <em>Anusaya</em> (latent tendency) names the seven latent defilements every unawakened being carries; <em>cetopariya</em> (the knowledge of others' minds) names the psychic-power item of reading a mind's present state. Neither is a way of telling one person's standing type from another's, and neither is counted here as individuation. What the early layer does, it does by verb and present participle and by rosters keyed to capacity and route. The temperament-type word is simply not here: the six-temperament <em>carita</em> compound is attested zero times in the four Nikāyas.</p>
              <h2 style={h2}>In the Abhidhamma: persons sorted, temperament still absent</h2>
              <p>If a six-temperament classification were canonical anywhere, its natural home would be the Abhidhamma, the seven books that are the canon's own sorting-and-enumerating layer. It is not there. The Abhidhamma sorts persons busily, but under other words. The Puggalapaññatti, the canonical designation of human types (<Cite id="cst-abh03m2.mul-014">Pp §§148–151</Cite>, Abh §14), enumerates kinds of person and defines the four understanding-types by the manner of their realization. The Yamaka carries the present-root sort straight from the discourses, asking of a person whose mind, with lust, arises, whose with hate, whose with delusion (<Cite id="cst-abh03m5.mul-177">Yamaka §177</Cite>). It is the same momentary reading the commentary will later set into a fixed type. And the diversity of beings' dispositions appears among the Buddha's ten powers as <em>nānādhimuttikatā</em>, the knowledge of beings' various resolves. What is absent in every register is the temperament word: zero in the seven Abhidhamma books, and where the word <em>carita</em> does occur (Vibhaṅga §817) it means kamma, the kinds of formation, not temperament. The lesson is exact. What is missing from the Abhidhamma is the temperament word. The typing of persons is not missing at all; this most classificatory layer of the canon does it busily, only never by a six-temperament grid.</p>
              <h2 style={h2}>In the para-canonical Khuddaka: a word changes its job</h2>
              <p>The temperament reading is minted at the para-canonical hinge, and a single word can be watched changing its job. The earliest place the full six-cell matrix appears is not a discourse but a gloss: the Cūḷaniddesa, explaining a verse the brahmin Mogharāja put to the Buddha, has the Buddha <em>know</em> the type of each person before him and match the teaching to the type. The talk on foulness goes to the greed-temperament person, the development of love to the hate-temperament one, and so through the six (<Cite id="cnd19">CND 19</Cite>). This is the birth certificate of the apparatus, ascribed to the Buddha's knowing rather than spoken by him in any Nikāya, and it sits in a layer the field places after the four-Nikāya prose. What makes the same stratum the hinge is that the older sense is alive a few pages away: the Paṭisambhidāmagga, sibling to the Niddesa, uses <em>cariyā</em> to mean exactly the older thing, a mode of conduct. It lists eight <em>cariyā</em>: of the postures, of the sense-bases, of mindfulness, and the rest (<Cite id="ps3.5">PS 3.5</Cite>). The word has not yet settled on "temperament" even in the layer that first deploys it that way. The temperament sense is caught here mid-fork, a re-coinage in progress beside the older conduct sense. It is not a stable canonical meaning the commentary merely tidied up.</p>
              {/* GEN:NARRATIVE-A:END */}
              {data.v2 && data.v2.drift_strip && (() => {
                const ds = data.v2.drift_strip;
                return (
                  <>
                    <h3 style={h3}>The <em>{ds.term}</em> semantic-drift strip</h3>
                    <div style={tableWrap}>
                      <table style={{ ...table, tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: '20%' }} />
                          <col style={{ width: '58%' }} />
                          <col style={{ width: '22%' }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th style={thLeft}>Stratum</th>
                            <th style={thLeft}>Sense at this stratum</th>
                            <th style={thLeft}>Anchor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ds.cells.map((c, i) => (
                            <tr key={i} style={tr}>
                              <td style={tdLeftSm}>{c.stratum_label}</td>
                              <td style={tdLeftSm}>{c.sense}</td>
                              <td style={tdLeftSm}><Cite id={c.anchor?.id}>{c.anchor?.label}</Cite></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ol style={{ margin: '10px 0 0 0', paddingLeft: 20 }}>
                      {ds.drift_points.map((p, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                          <strong>{p.classification}</strong> ({p.from} → {p.to}): {p.note}
                        </li>
                      ))}
                    </ol>
                    <p style={tableCaption}>{ds.summary}</p>
                  </>
                );
              })()}

              {/* GEN:NARRATIVE-B:START — §§V–Findings, generated from FINDINGS-readable.md by gen-narrative.mjs; do not hand-edit */}
              <h2 style={h2}>In the commentaries: the type fixed, the design vocabulary blooms</h2>
              <p>From the para-canonical fork the commentary keeps only the temperament sense and hardens it into a fixed six-cell matrix of person against object, with the machinery for assigning one to the other (<Cite id="cst-s0103a.att-dn3_11_p002">Sv-a 11 §2</Cite>). The Visuddhimagga carries most of it: of the forty-three structurally-canonical rows that hold the disambiguated temperament compound, thirty are the Visuddhimagga, and the technical sense of <em>kammaṭṭhāna</em>, the meditation-subject, is effectively confined there too (134 of 147 rows), as is the closed list of forty subjects. This is the layer where the apparatus is built.</p>
              <p>What the wider reading adds is that the temperament grid does not bloom alone. A whole vocabulary for designing a teaching around a person's standing disposition appears at exactly this stratum and is near-absent below it. The word <em>ajjhāsaya</em>, a person's bent that the teaching is fitted to, occurs four times in the four Nikāyas and then more than seven hundred times in the aṭṭhakathā. The compound <em>āsayānusaya</em>, the knowledge of beings' underlying bent and latent tendency, and <em>veneyya</em>, the beings to be guided, are flatly zero in the canon and bloom only here (the aṭṭhakathā carries the first some fifty-five times, the second over two hundred). The two-vehicle split itself, the calm-vehicle and insight-vehicle practitioner and the dry-insight worker, is zero in the canon and appears only now. The commentary is not merely fixing one grid; it is acquiring a general habit of reading persons as standing types to be matched, a habit the canon did not have.</p>
              <p>That the diagnosis is fallible the commentary shows in a scene it tells against its own foremost analyst. A goldsmith's son ordains under Sāriputta, and the elder, reasoning that the young are full of lust, assigns him the contemplation of foulness (<em>asubha-kammaṭṭhāna</em>). Three months in the forest yield not a single moment of one-pointedness. The Buddha, seeing what inference could not, that the monk had worked beautiful gold for five hundred past lives, judges the repulsive object unfit and gives him a golden lotus to contemplate instead, on which he attains at once (<Cite id="cst-s0502a.att-234_p003">Dhp-a</Cite>, KN-a §234.3). Sāriputta is foremost among the disciples in wisdom, and wisdom is not what fails him here. Reading a person's disposition is a different cognition. It is the knowledge of beings' bent and the ripeness of their faculties, which belongs to the Buddha's powers and not to analysis. The story is the epistemic point in narrative form.</p>
              <p>And in the same breath the manual that fixes the grid declines to certify its most detailed part. The Visuddhimagga describes at length how a teacher might read a pupil's temperament, from how he walks and stands and eats and sleeps, and then takes it back: this method has come down neither in the canon nor in the old commentary, is stated only following the teachers' opinion, and so is not to be relied on as authoritative, <em>na sārato paccetabbaṃ</em> (<Cite id="cst-e0101n.mul-36_p030">Vism §36.30</Cite>). What it offers in place of the disowned method is telling: a teacher who can read minds directly will simply know the pupil's temperament, and one who cannot should ask. The diagnostic is not staked as the kind of knowing the canon reserves for what is directly seen; it is held as serviceable scholastic guidance, taught and kept. The tradition draws that line itself, at the very point where the apparatus is most elaborate.</p>
              <h2 style={h2}>In the sub-commentaries: temperament read off the body</h2>
              <p>The sub-commentary takes the typology one step past the matrix, and it is a vivid one. Reading the heart-blood, the Vibhaṅga-aṭṭhakathā says the blood of a greed-type runs red, of a hate-type dark, of a delusion-type the colour of water in which meat has been washed (<Cite id="cst-abh02a.att-70_p058">Vibh-a §70.58</Cite>). Six heart-blood colours, keyed to the six temperaments. A scheme that began as a way of keying a practice to a present defilement has become, at this end, a physiology: temperament is now something the body itself displays. There is no canonical warrant for this and none in the old commentary either. It is also the stratum where the language of fixed intrinsic nature peaks. The word <em>sabhāva</em>, own-nature, is almost absent in the canon but runs to several thousand occurrences here. The freezing of a person into a type is one local case of a wider hardening of the tradition's whole vocabulary toward fixed essences, a pattern taken up in its own right below.</p>
              <h2 style={h2}>Across the layers: divergence, addition, regression</h2>
              <p>Read stratum by stratum, the field above is a story about one axis more than about chronology. The canon individuates a person by what is presently active or by what they are capable of: a mind's current root, the reach of their faculties, how fast they learn, the route by which they will be freed. The commentary, increasingly, individuates by what a person fixedly is: a standing temperament, a diagnosable type. The deepest pattern is the move from the first to the second, the freezing of a function into an essence. The six-temperament scheme is one instance of it, and once seen this way the scheme stops being the headline and becomes an example.</p>
              <p>Three things follow when the whole field is read at once. The first is a divergence. It is not true that individuation is a late commentarial habit; the precise truth is that fixed-type individuation is late while function-and-route individuation is early. The same split runs through the calm-and-insight material: the yoke of calm and insight is early and shared across the schools, while the two-vehicle and dry-insight typology is the late branch, zero in the canon and blooming in the commentary. It carries the same signature as <em>carita</em>. The second is an addition. The canon already holds fully systematized person-typologies that a <em>carita</em>-shaped search cannot see: the seven noble persons by mode of liberation, the four learners by receptivity, the present-root sort. Every one of them is canonical and several are Buddha-voiced. The canon catalogues persons by route and ceiling and speed; what it lacks is only the catalogue by temperament. The third is a regression of confidence at the point of greatest elaboration: the Visuddhimagga, having built the temperament diagnostic out in full, marks it as not to be relied on, while the canon's own faculty for reading persons, the maturity of another's faculties and the knowledge of their dispositions, is staked under a knowing-formula the temperament grid never claims.</p>
              <h3 style={h3}>Where the hardening happens, and where it does not</h3>
              <p>The divergence, the addition, and the regression can be put more precisely once the vocabulary is counted across the six strata rather than two. One caution first. Each figure below is a count of passages, the paragraph-rows of the ingested edition, that contain the term, not a tally of raw occurrences, and the later strata are several times larger than the canon. So what carries the argument is the qualitative contrast, a term present versus near-absent and the stratum at which it first appears, and not the bare magnitudes. With that held in view, the hardening is not one event. It happens at more than one jump, and it happens in the description of the world as well as in the guidance of persons. Of about two dozen transitions traced this way, roughly two in three localize cleanly to a jump while a real minority run against the trend, so the pattern is a strong tendency, not a law.</p>
              <p>Some of it is already the Abhidhamma's work. The closed factor-analysis of the absorption (<em>jhānaṅga</em>) is absent from the four Nikāyas. It appears first in the seven Abhidhamma books, then multiplies in the commentaries. The change-of-lineage moment (<em>gotrabhū</em>) is barely present in the suttas and becomes a fixture of the Abhidhamma's analysis of the mind, at some two hundred rows there against six in the early canon. Other hardenings wait for the commentaries. Access and absorption concentration (<em>upacāra-samādhi</em>, <em>appanā-samādhi</em>) are named there for the first time, at zero canonical rows before. The temperament compound enters at the late-canonical and para-canonical hinge and fixes only in the commentary. And the own-nature language (<em>sabhāva</em>) climbs at every step, from a handful of canonical rows to some two thousand in the commentaries and near four thousand in the sub-commentaries, where it peaks. The latest layer hardens the hardest.</p>
              <p>The description of the world shows the same shape, on a thinner sample now counted the same way (the gated census is named in the reproducibility note). The kasiṇa that the canon offers as a measureless perception (<em>appamāṇa</em>, the boundless pole set against the limited, <em>paritta</em>) becomes a manufactured clay disc in the commentary, fitted with a counterpart-sign progression the canon does not have. The cosmos follows, and at more than one jump. The early discourses gesture at scale, as in the ten-thousandfold world-system that shakes under a measureless light (<em>appamāṇo obhāso</em>) at the awakening, vast but unbounded; the later layers bound and furnish it. The world-sphere (<em>cakkavāḷa</em>) is named twice in the four Nikāyas, and there it is an open plurality, a succession of world-spheres in a verse of marvels. The enclosing rim-wall that makes it a bounded object (<em>cakkavāḷapabbata</em>) has no canonical warrant at all. It blooms in the commentary and densifies again in the sub-commentary. The eight great hells are named and counted only in a late Jātaka and fixed in the commentary, where Avīci acquires its four gates and heated-iron floor (<em>avīcimahāniraya</em>) and each great hell its ring of sixteen subsidiaries (<em>ussada-niraya</em>). The bare hell-names that look early are homonyms, the disciple Sañjīva, a discourse on times, the king Mahāpatāpa, and not the places. The Buddha's body, left unmeasured in the canon, is given a one-fathom aura (<em>byāmappabhā</em>) in the late verse and an exact eighteen-cubit height in the commentary, each past Buddha drawn to a different cubit-figure. The three realms, named one by one in the suttas, are closed into the exhaustive sense-sphere, fine-material, and immaterial taxonomy (<em>kāmāvacara</em>, <em>rūpāvacara</em>, <em>arūpāvacara</em>) only in the Abhidhamma. And the in-between attainer of the canon, an adjective for one kind of non-returner (<em>antarā-parinibbāyī</em>), hardens into a reified intermediate existence (<em>antarābhava</em>) that the Abhidhamma stages as a dispute and the sub-commentary takes up most of all. The destruction-phase compound <em>kappavināsa</em> is likewise absent from the four Nikāyas and the Abhidhamma, built in the commentary, and carried further in the sub-commentary.</p>
              <p>This register has its own counter-currents, and the census keeps them counted. The canon often states an exact figure already: the lifespans of beings and the lengths of past aeons are numbered in the Buddha's own voice (<Cite id="dn14">DN 14</Cite>, <Cite id="dn26">DN 26</Cite>), and Mount Sineru is given its exact measure, eighty-four thousand <em>yojana</em> broad and deep, in the four Nikāyas themselves (<Cite id="an7.66">AN 7.66</Cite>). What the later strata add is the systematizing of such figures, the dimensioning of the whole cosmic architecture in <em>yojana</em>; the first figure for Sineru is already canonical. The unit <em>yojana</em> is thoroughly canonical, used for ordinary distance. The canon also keeps some things open and the commentary keeps them open too. Whether the world is finite or infinite is a question the Buddha set aside, and no later layer fills it in (the <em>avyākata</em>, <Cite id="an10.95">AN 10.95</Cite>). One early discourse already sorts a measured mind-deliverance from a measureless one and guards the measureless from being bounded (<Cite id="mn127">MN 127</Cite>), and the canon names an explicitly infinite object of its own, the base of the infinity of space (<em>ākāsānañcāyatana</em>). The beginning of saṃsāra is refused a figure (<em>anamatagga</em>) and stays refused; the boundless heart of mettā (<Cite id="snp1.8">Snp 1.8</Cite>) stays boundless, and where the commentary develops it the move is toward more boundlessness rather than less. Even the goal divides this way. The canon's word for the unconditioned is largely privative, the unborn and the unmade (<Cite id="ud8.3">Ud 8.3</Cite>), though it also carries a set of positive epithets (the Asaṅkhata-saṃyutta, SN 43); what the later cosmology adds is the tiered and measured afterworld the early texts do not draw. So the world-description register confirms the persons register's tendency on a smaller sample. Of about two dozen transitions counted this way, roughly three in four localize to a jump and the jumps are several, not one, while a real minority run the other way, the cases the canon already fixed and the cases it refuses to fix.</p>
              <p>Two limits bound this reading and are owed to the reader. The stratum coding is done from a work's place in the tradition's own development, independently of how essentializing its language is, so "essence increases with lateness" is not simply assumed; yet the two are not wholly separable, and the gradient is best read as partly definitional. And the move tracked here, from an open function to a fixed type or measure, is not always sharply distinct from ordinary scholastic elaboration. What marks it as essentialization rather than housekeeping is the shift from a present-tense or relational reading to a standing-property one, plain in the <em>carita</em> and <em>sabhāva</em> cases and visible only by direction in the thinner ones.</p>
              <p>Of the two dozen or so transitions counted this way, most localize to a single jump. A clear minority run against the trend, and they are not few. The canon already carries fully built typologies, so systematization is not simply late. The Abhidhamma sometimes carries an early present-tense reading forward unchanged rather than hardening it. The Visuddhimagga disowns its own most detailed diagnostic. And one canonical signature runs the other way entirely: the explicit declaration that persons differ (<em>puggalavemattatā</em>) is loudest in the early canon and fades in the later layers. So the pattern is a strong tendency with named exceptions, not a law, and the exceptions are the divergence, the addition, and the regression seen from the side of the count.</p>
              <h3 style={h3}>Calm, insight, and how much concentration the path asks</h3>
              <p>The same function-to-essence shape governs the most-disputed corner of this material, the relation of calm (<em>samatha</em>) to insight (<em>vipassanā</em>). The canon treats their balance as a present situation to correct, not as a kind of person. Ānanda's discourse on the pair (<Cite id="an4.170">AN 4.170</Cite>) lays out four routes to the same goal: calm before insight, insight before calm, the two yoked together (<em>yuganaddha</em>), and the mind seized by agitation about the teaching that then settles. A practitioner takes whichever answers what they presently have too much or too little of. So the canon does imply something like a dry and a wet temperament, but only situationally, for the person who already leans one way; it is never made explicit and never made a fixed type. The commentary is what freezes it, into the calm-vehicle and insight-vehicle practitioner and the dry-insight worker (<em>samathayānika</em>, <em>vipassanāyānika</em>, <em>sukkhavipassaka</em>). These are zero in the canon and only in the commentary, the same late signature as <em>carita</em>.</p>
              <p>How much concentration the path requires is read the same way. The graduated trainings (<Cite id="an3.86">AN 3.86</Cite>) grade a person by how far each training is filled out: the stream-enterer and the once-returner fulfil virtue (<em>sīlesu paripūrakārī</em>) but are only doers "to a measure" in concentration and wisdom (<em>samādhismiṃ mattaso kārī</em>); the non-returner fulfils concentration too; only the arahant fulfils all three. A limited concentration suffices for the first two stages of awakening; a full one for the higher. The phrase is not a passing turn: <em>samādhismiṃ mattaso kārī</em> recurs where the canon sorts the nine noble persons who die "with a remainder" by exactly this measure (<Cite id="an9.12">AN 9.12</Cite>, the Lion's Roar with Residue, which maps the gradient onto the grades of non-returner), and the Abhidhamma's Puggalapaññatti then enumerates the persons by it (<Cite id="pp1.3">PP 1.3</Cite>). A second, term-free reading of the same fact sits in the seven noble persons (<Cite id="mn70">MN 70</Cite>, <Cite id="an7.14">AN 7.14</Cite>): the faith-follower and Dhamma-follower reach the lower fruits without the eight liberations (<em>aṭṭha vimokkhā</em>, the deep attainments running from the form-contemplations through the formless states to cessation) that the body-witness has touched with the body, so the canon already lets a person enter the path on less than full absorption. What it never does is fix how much less.</p>
              <p>What that limited concentration is, the canon does not pin to a named tier. It enumerates the four absorptions (<em>jhāna</em>) and the formless attainments as its levels, and it sorts concentration by its object (the signless, the desireless, the empty) and by its reach (limited or exalted, <em>paritta</em> or <em>mahaggata</em>), but it names no fixed rung between an unconcentrated mind and the first absorption. The familiar ladder of preparatory, access, and full concentration (<em>parikamma</em>, <em>upacāra</em>, <em>appanā</em>) is entirely the commentary's: each of the three is attested zero times as a grade of concentration in the four Nikāyas and the seven Abhidhamma books, and so is momentary concentration (<em>khaṇika-samādhi</em>). The word <em>upacāra</em> is canonical, but there it means a vicinity or an approach: the outskirts of a village, the near company of women. The sense "access concentration," a sub-absorption threshold, is a commentarial coinage, found only from the aṭṭhakathā onward (38 rows in the aṭṭhakathā and 22 in the Visuddhimagga, 58 more in the sub-commentary, against zero in the canon). So whether the concentration that carries a stream-enterer is a full absorption or a sub-absorption access is a question the canon leaves open. It grades concentration by degree and stops there; the naming of discrete levels below absorption is, once again, the work of the commentary.</p>
              <p>What the absorptions themselves contain is read the same way. The canon's stock description of the first absorption names four qualities: applied thought and its sustaining (<em>vitakka</em>, <em>vicāra</em>), and the rapture and pleasure born of seclusion (<em>pīti</em>, <em>sukha</em>), in the formula <em>savitakkaṃ savicāraṃ vivekajaṃ pītisukhaṃ</em>, set out in some two hundred canonical rows. The familiar count of <em>five</em> jhāna factors, which adds one-pointedness (<em>cittekaggatā</em>) as a fifth, and the collective term for them (<em>jhānaṅga</em>, "factor of absorption") are the analysis of the Abhidhamma and the commentary, where <em>jhānaṅga</em> outnumbers its scattered canonical uses about ten to one. One-pointedness is canonical in its own right; what is added is its place in a closed inventory of the absorption. So the "limited concentration" of the trainee, <em>samādhismiṃ mattaso kārī</em>, a doer "to a measure," sits in a canon that describes the absorptions by a few felt qualities, beside a commentary that resolves them into a fixed list of factors and a graded ladder of tiers. The difference between a description and a tally runs through the concentration material as it runs through the rest.</p>
              <h3 style={h3}>How much concentration the lower path requires</h3>
              <p>One question sits next to this one and is among the most disputed in modern practice-scholarship: how much concentration the lower fruits actually require. The canon answers with a gradient and never with a floor. The maximalist side has real evidence: right concentration, the eighth factor of the path, is defined in the stock formula as the four absorptions. That formula reads <em>ayaṃ vuccati sammāsamādhi</em>, "this is called right concentration," followed by the jhāna tetrad, in some twenty-eight canonical rows. A reading that makes jhāna the path's concentration is not invented. That stock formula is not the canon's only definition, though. Two others name no absorption at all: noble right concentration is the mind's one-pointedness <em>equipped with the seven path-factors</em> (<Cite id="mn117">MN 117</Cite>, <Cite id="an7.45">AN 7.45</Cite>), fixed by its companions rather than its depth; and the concentration-faculty is the one-pointedness gained <em>by making release the object</em> (<em>vossaggārammaṇaṃ karitvā</em>, <Cite id="sn48.10">SN 48.10</Cite>), fixed by where it is aimed rather than how deep it runs. But the canon constitutes the first fruit elsewhere and otherwise, and three structural facts pull the floor for stream-entry and once-return below full absorption.</p>
              <p>The first is what the lists of stream-entry leave out. The canon itemizes the first fruit more than almost anything else, and jhāna is never a member. The four factors leading to stream-entry are association with good people, hearing the true Dhamma, wise attention, and practice in accordance (<Cite id="dn33">DN 33</Cite>). The four factors of a stream-enterer are confirmed faith in the Buddha, the Dhamma, and the Saṅgha, and the virtues dear to the noble ones. The three fetters dropped are identity-view, doubt, and clinging to rites. Concentration enters these lists only as a direction the virtue points: the noble ones' virtues are described, ninety-two times over, as <em>samādhisaṃvattanika</em>, "conducive to concentration," leading toward it rather than presupposing it. Where the stream-entry factors and the absorptions do co-occur, it is in the long enumerative discourses such as the Saṅgīti (<Cite id="dn33">DN 33</Cite>) that list both among many sets, never one as a member of the other.</p>
              <p>The second is that the canon's main account of how concentration arises makes it an effect, not an entry-ticket. The recurring chain runs from virtue through non-remorse, gladness, rapture, and tranquillity to the line <em>sukhino cittaṃ samādhiyati</em>, "of one who is happy, the mind becomes concentrated" (forty-six rows; the mind "becomes concentrated," <em>samādhiyati</em>, in the passive, sixty-three). The discourse that states it is spoken to Mahānāma the Sakyan, a lay stream-enterer, about the recollections (<em>anussati</em>, the <Cite id="an6.10">AN 6.10</Cite> set led by <em>buddhānussati</em>; <Cite id="an6.10">AN 6.10</Cite>). The concentration of one who has seen the Dhamma is the by-product of the gladness that recollection and virtue produce, not a separately-built absorption. And the proximate condition the canon names for insight is a bare "concentrated mind," <em>samāhite citte yathābhūtaṃ pajānāti</em>, "with the mind concentrated, one knows and sees as it really is" (fifty-eight rows), language of degree rather than a named tier.</p>
              <p>The third is an argument from the ceiling, and it needs stating precisely. The canon's highest attainment is reached in a wisdom-liberated mode that lacks the attainments beyond the four absorptions: the <em>paññāvimutta</em> arahant, who has destroyed the taints by wisdom but does not dwell having touched the eight liberations, the peaceful formless states transcending form, with the body. The wanderer Susīma is told of exactly such arahants and asks whether they dwell in those liberations; the answer is flat, <em>"No hetaṃ, āvuso,"</em> "no, friend" (<Cite id="sn12.70">SN 12.70</Cite>). The seven noble persons encode the same split, the body-witness and the both-ways-freed sit on the side that touches the eight liberations; the wisdom-freed and the rest sit on the side that does not (<Cite id="mn70">MN 70</Cite>). So the secure point is bounded: if even arahantship can be reached without the formless attainments that lie beyond the four jhānas, the lower two fruits can a fortiori dispense with them. The canon does not pin even the jhāna route to the fourth absorption: the Jhānasutta makes the destruction of the taints depend on the first jhāna and upward, each absorption and each formless base through the base of nothingness a platform from which one sees the attainment's own factors as impermanent and turns the mind to the deathless element (<Cite id="an9.36">AN 9.36</Cite>). The familiar sequence that mounts insight from the fourth jhāna is the canon's fullest description of the route, not the lowest platform it allows. Whether arahantship can be reached without even the four jhānas, the fully dry-insight reading, is the harder claim the canon leaves open and the commentary's <em>sukkhavipassaka</em> fills; the weight on the lower-fruit floor is carried less by this a-fortiori than by the gradient, the negative space, and the caused-fruit account above.</p>
              <p>Between these stands the gradient: the trainee is a "doer to a measure" in concentration (<em>samādhismiṃ mattaso kārī</em>, <Cite id="an3.86">AN 3.86</Cite>, <Cite id="an9.12">AN 9.12</Cite>), placed below the concentration-fulfiller, the non-returner, on the very axis in question. The canon's own scale therefore says the lower fruits take less than full concentration; it simply never says how much. That open measure is what the commentary closes, and the terms it closes it with are not in the canon: access concentration (<em>upacāra-samādhi</em>), momentary concentration (<em>khaṇika-samādhi</em>), and absorption concentration as a named tier (<em>appanā-samādhi</em>) are each zero canonical rows, and one-pointedness, the depth-neutral genus of concentration, is canonical in its own right (the broad <em>ekaggatā</em> stem at sixty-four rows; the full compound <em>cittekaggatā</em> is rarer) but is made a property of every mind-moment only in the commentary and Abhidhamma, where the count multiplies. What the canon does supply is a threshold state, not a named tier. Where the Dhamma-eye opens on the spot, the graduated talk first leaves the listener "ready, malleable, free of the hindrances" (<em>kallacitta</em>, <em>muducitta</em>, <em>vinīvaraṇacitta</em>, twenty-five canonical rows), and only then does the dust-free vision arise (<Cite id="dn5">DN 5</Cite>, <Cite id="dn14">DN 14</Cite>, and the Vinaya account of Yasa). That hindrance-free pliancy is the very state the commentary later names access concentration. The canon describes the state and withholds the label. And where the canon frames jhāna itself, it most often frames it as a pleasant abiding here and now (<em>diṭṭhadhammasukhavihāra</em>, over a hundred canonical rows), a dwelling of the accomplished; the doctrine that makes a jhāna the required base for insight (<em>pādaka-jjhāna</em>) is, once again, commentarial and zero in the canon. So the honest description is this: the canon defines the path-factor of concentration as jhāna in its stock formula, constitutes the first fruit by faith, virtue, and view with concentration as a conducive fruit, grades the trainee below the concentration-fulfiller, and reaches even arahantship in a mode without the formless attainments beyond the four jhānas, and it states a gradient while fixing no floor. The underdetermination is real, and it is why the question stays open; the commentary's access concentration is one resolution of it, not a canonical finding.</p>
              <h2 style={h2}>What this means, and what it doesn't</h2>
              <p>If one opens "the canon" to learn how a person is matched to a practice, what gets handed over as the canonical teaching, the six temperaments, the closed forty meditation subjects, the technical sense of <em>kammaṭṭhāna</em>, turns out to be later than the canon and built over a much simpler and much earlier move. That older move is real: the suttas read the root that is present now and the faculties a person actually has, and they fit the teaching to that. The six-temperament grid is a scholastic construction laid over that ground; its central word acquired the temperament sense late; and the tradition's own apex manual, having set the grid out in full, declines to certify its most detailed part. The matching machinery is later, and softer in its own claims, than its canonical shelving implies.</p>
              <p>Several limits bound how far this can be pressed. The dating is relative order, not calendar date; the one firm exception is a hard count: the absence of the temperament compound from the four Nikāyas and the Abhidhamma. The counts are floors recovered by a widening search, and they are edition-relative to the CST recension as ingested; a different segmentation would move the absolute numbers, not the shape. Two of the largest early "disposition" words, <em>anusaya</em> and <em>cetopariya</em>, are mostly fixed doctrinal lists and are not read here as person-typing; the genuinely individuating early vocabulary is the smaller, cleaner set above (the present-root sort, faculty-maturity, the four-learner tetrad, the seven-person liberation roster, and the explicit naming of difference in <em>puggalavemattatā</em>). The function-versus-essence reading is the axis the data cleaves on most sharply. It is offered as the most defensible description of the field, not as a proof.</p>
              <p>One boundary is worth drawing carefully, because the early material draws it itself. Reading one's own present state is canonical and self-directed: a practitioner who sees that lust is presently active develops foulness against it, as Meghiya is taught to (<Cite id="an9.3">AN 9.3</Cite>), and the contemplation of mind has one watch one's own arising root (<Cite id="mn10">MN 10</Cite>). What the texts do not hand to the practitioner is the fixed type. Certifying that one is a greed-temperament person is teacher-assigned. By the Visuddhimagga's own admission it is not reliably available to a teacher without the direct knowledge of another's mind (<em>cetopariyañāṇa</em>): the manual's own fallback is that a teacher who can read minds knows the pupil's temperament directly, while one who cannot is told to ask. So the diagnosis is reliable only with an attainment the canon reserves for what is directly seen, not by the outward reading the manual itself sets out. The canon invites a person to read what is present in them; it does not invite them to read what they are. The further normative question is which object best suits a given person. That, the sources (canon and commentary alike) make a teacher's business and leave openly provisional.</p>
              <p>A word on where this sits in the scholarship, since the disputes it touches are old and well-worked. Whether stream-entry requires jhāna has been argued at length, by Cousins, Gombrich, Gethin, and Shankman among others, and in the exchange between Brahmāli, Sujāto, and Anālayo. The rise of own-nature (<em>sabhāva</em>) language and the charge of a commentarial and Abhidhamma substantialism is the subject of Ronkin's study of early Buddhist metaphysics. The mnemonic shaping of oral transmission is the theme of Allon and Wynne. The lateness of the meditation-subject apparatus has been noted in Cousins's work on the <em>kammaṭṭhāna</em>. The contribution here is not the direction of any of these findings, which is broadly known, but the reproducible cross-stratum count: a single auditable measure of where in the textual layers each move first appears, run the same way for the register of persons and the register of the world, so the gradient can be inspected rather than asserted. The added claim, that these moves share one shape and recur at more than one jump, is what the count is offered to support.</p>
              <p>Two further questions sit outside what the corpus can settle, and are left as questions. The first is when the systematizing began. The trend traced here is within the written record, which starts at the redacted canon and cannot see behind it. It is possible that an even simpler teaching was already being systematized in the centuries of oral transmission before writing, for the plain reason that a teaching must be formulaic and listed to survive memorization at all. If so, the earliest recoverable layer is already a systematized one, and what is measured here is a later, scholastic systematization laid over an earlier, mnemonic one. The second question is why the tendency runs as it does. It may answer to the needs of transmission. It may answer to a wider human pull toward a concrete, permanent, and universal account of things. Neither can be decided from the texts, and neither is claimed.</p>
              <p>One last boundary the study should draw around itself. To trace a tradition's hardening into fixed systems is itself an act of systematization. It reduces a living and many-voiced literature to counts, to axes, and to named jumps, and there is no neutral place to stand. The guard against doing to the texts what the commentators are charged with doing is built into the findings rather than asserted over them. The pattern is reported as a tendency and not a law. The counter-cases are counted rather than waved away. The proposed drivers are left open. The early texts hold even their own teaching as a raft, to be set down once it has carried one across (<Cite id="mn22">MN 22</Cite>), and a study of their later hardening does well to hold its own result the same way.</p>
              <h2 style={h2}>Findings of general importance (beyond this study's question)</h2>
              <p>Patterns the wider reading turned up that matter past the question of person-and-practice, recorded here so they are not lost inside it. Each notes what it is and where it is grounded, and each surfaced from this survey (June 2026); each is a found, evidenced pattern, not a conjecture.</p>
              <h3 style={h3}>G1. A corpus-wide drift from function-language to own-nature language</h3>
              <p>The word <em>sabhāva</em>, own-nature or intrinsic essence, is effectively absent from the canon and runs to the thousands in the commentaries and sub-commentaries (roughly 1,900 in the aṭṭhakathā and 3,950 in the ṭīkā, against a canonical floor near zero, once the unrelated compounds <em>purisabhāva</em> and <em>ekaṃsa-bhāvita</em> are set aside). The freezing of a person's present conduct into a fixed temperament is one local instance of a much larger movement, measurable across the whole corpus, in which the tradition's vocabulary shifts from describing what a thing does to asserting what it is by own-nature. This is a datum for the long-running scholarly question of when Theravāda acquired a substantialist ontology. <em>Where:</em> <em>sabhāva</em> layer split, canon ≈ 0 / attha 1,906 / vism 553 / tika 3,951. <em>Confidence:</em> high.</p>
              <h3 style={h3}>G2. An early canonical principle of assortative association</h3>
              <p>In the Saṃyutta the Buddha states, of beings in general, that by disposition beings flock together and keep company (<em>dhātuso sattā saṃsandanti samenti</em>): the low-minded consort with the low-minded, the virtuous with the virtuous, the faithless with the faithless (<Cite id="sn14.14">SN 14.14</Cite>, running on through the Dutiyavagga; seventeen canonical rows carry the formula). The combining is associative, the company a being seeks and falls into, not kinship or mating. The mechanism is named, a shared <em>dhātu</em> or disposition, and the formula is run through some sixteen dispositions in turn, the faithless, the shameless, the unconscientious, the unlearned, the lazy, the unmindful, the witless, and their opposites, so the canon asserts it as a continuous regularity before any finite catalogue of person-types exists. One guard is owed, because the same collection trades on two senses of the word. A few suttas earlier the Dhātu-saṃyutta uses <em>dhātu</em> in its other, technical sense, the eighteen elements of cognition (the eye-element, the form-element, the eye-consciousness-element, the diversity-of-elements teaching of its first chapter); the homophily formula is the disposition sense, not that one, and the seventeen rows counted here are the disposition formula read on the page, not the element-diversity suttas. So read, the finding is a canonical sociology of association, of interest to anyone studying how a tradition theorizes social grouping, and bearing not at all on the matching of a practice to a person. <em>Where:</em> <Cite id="sn14.14">SN 14.14</Cite> to SN 14.29 (the Dutiyavagga), e.g. <Cite id="sn14.14">SN 14.14</Cite>, SN 14.17, SN 14.25; distinct from the eighteen-element <em>dhātu</em> of SN 14.1 to SN 14.13. <em>Confidence:</em> high.</p>
              <h3 style={h3}>G3. A describe-early, name-late signature in scholastic terminology</h3>
              <p>Repeatedly the practice is canonical while the technical noun that names it is commentarial. The graduated talk is given in the discourses long before "graduated talk" becomes a fixed term; the fitting of a teaching to a hearer's disposition is done before <em>āsayānusaya</em> and <em>ajjhāsaya</em> name it as a design principle; the temperament types are read before <em>carita</em> names them. The tradition first does a thing and only later coins a fixed label and theorizes it. The nominalization itself is the late, datable event. <em>Where:</em> <em>ajjhāsaya</em> 4 canon / 701 attha; <em>āsayānusaya</em> 0 canon / 55 attha; <em>veneyya</em> 0 canon / 212 attha. <em>Confidence:</em> high.</p>
              {/* GEN:NARRATIVE-B:END */}

              {/* ====================== APPENDIX: THE TEMPERAMENT CENSUS ====================== */}
              <h2 style={h2}>Appendix: the temperament census</h2>
              <p style={tableCaption}>
                The auditable data beneath the survey above, kept as an appendix: the original temperament-census
                question and its pre-registered readings, the earlier scholarship, the sources and method, the
                per-facet tables and warrant ledger, the calm-and-insight cells, the stratigraphy and recension
                tables, and the full dataset with every citation opening its passage. These tables are the
                record the narrative draws on, not the argument.
              </p>

              {/* 1. QUESTION */}
              <h3 style={h3}>The census question</h3>
              <p>
                The question this census puts is narrow: how the Pāli tradition guides an individual toward
                awakening, across the full range from a bare statement to a step-by-step leading with an assigned
                object, and what, if anything, connects the kind of person, the kind of discourse given, and the
                object or instruction assigned. The question asked at every step is how the canon differs from
                the commentary.
              </p>
              <p>
                Two readings stand against each other. Both were settled before any instance was read, so that a
                comfortable answer could not shape the count. The reading the data favour is that the guidance
                apparatus is largely the commentary's own work, built on a genuinely canonical seed: in the
                canon, identifying who should receive what looks like a perceptual faculty rather than a
                checklist applied in advance; the matching is keyed to a present defilement or situation, while
                the temperament matrix and the fixed ordering of objects are later additions; the word{' '}
                <em>carita</em> does not seem to carry the temperament sense in the four Nikāyas, though it does
                in the para-canonical Niddesa, which is why cells warranted there are marked as resting outside
                the Nikāyas; and calm and insight read as a yoked pair, with the dry-insight split a
                commentarial construction. The plainer reading, taken as the null, is that the apparatus is
                uniformly commentarial against a uniformly canonical core, with every commentarial assignment
                tracing to a canonical warrant. The prior expectation was a split rather than a clean win for
                either, and that is roughly what the cell-by-cell reading shows.
              </p>

              {/* 2. LITERATURE */}
              <h3 style={h3}>Earlier scholarship</h3>
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
                commentarial systematization, not a canonical doctrine. This survey looks at that claim
                directly and the evidence here is consonant with it; the section on calm and insight sets it out.
              </p>
              <p>
                On the inventory of meditation subjects, Buddhaghosa's Visuddhimagga fixes the forty meditation
                subjects and keys them to the six temperaments. Bapat (1937), comparing the Visuddhimagga with
                the Vimuttimagga preserved in Chinese, showed that the earlier manual counts thirty-eight, not
                forty, and differs in detail, a difference taken from Bapat's comparison and not re-counted
                here; the closed list of forty is therefore a settling, not a given. It is also a selection, not
                an inventory: several meditation objects the canon itself names and assigns fall outside the
                forty altogether, among them the perception-series of impermanence, non-self, and light
                (<em>anicca-</em>, <em>anatta-</em>, and <em>ālokasaññā</em>, each attested dozens of times in
                the Nikāyas and given to named persons, the ten perceptions to Girimānanda at AN 10.60), and the
                seven factors of awakening (<em>bojjhaṅga</em>); the forty fixes a curated set rather than the
                full canonical range. Ñāṇamoli's translation (1956) remains the standard reference for the Visuddhimagga and
                is the control used here for the author's renderings. On the key term, Crosby, Skilton and Kyaw
                (2019) document that <em>kammaṭṭhāna</em> in its technical sense, a meditation subject, is a
                commentarial usage; in the canon the word means an occupation or place of work. A frozen
                database count confirms this for the corpus and corrects an earlier overstatement here: the word
                does occur in the four Nikāyas, but in the ordinary sense alone (a livelihood,
                farming or trade or cattle-keeping; the household occupation), with the meditative sense
                effectively confined to the Visuddhimagga.
              </p>
              <p>
                On the typologies, the Puggalapaññatti, the Abhidhamma book of human types translated by Law
                (1922), defines the four understanding-types by the manner in which each comes to realization,
                and so supplies the canonical definition of the guidance modes used here. The reception of these
                schemes in the Burmese insight tradition, through Ledi Sayadaw and the teachers who followed, and
                the anthologies of Nyanaponika and Bodhi, frame how the typologies have been read in practice.
                Shaw (2006) and Kuan (2008) survey the object inventory and the place of mindfulness; Stuart
                (2015) extends the comparative horizon beyond the Pāli.
              </p>
              <p>
                The six-temperament scheme itself is Buddhaghosa's, set out in the third chapter of the
                Visuddhimagga, and its closest relative, the cognate temperament scheme in the Vimuttimagga
                preserved in Chinese, was placed beside it by Bapat (1937); the scheme's first canonical-shelf
                appearance, in the Cūḷaniddesa, is older still. What the literature has not put on a measured
                footing is how that one famous scheme sits against the canon's other, older ways of typing a
                person, the seven noble persons sorted by their mode of liberation, the four learners sorted by
                receptivity, the present-root analysis of the contemplation of mind. Read together, those are a
                populous early apparatus the temperament scheme is usually discussed apart from. The standing
                debate over <em>sabhāva</em>, whether and when Theravāda acquired a vocabulary of fixed intrinsic
                natures, supplies the wider frame: the freezing of a person into a temperament is one local case
                of it.
              </p>
              <p>
                The contribution is therefore less a new reading of the calm-and-insight debate, which it joins
                on the side of Cousins, than a relocation of the temperament question. It is a measured
                demonstration, auditable passage by passage, that the six-<em>carita</em> scheme is one late
                instance of a broader and largely commentarial habit of fixing persons into standing types, set
                against an early canon that individuates a person richly but by present state, capacity, and
                route rather than by a fixed temperament. The field's prose conclusions about calm and insight
                are confirmed with counts and pinned to passages; the temperament scheme is given the wider
                company it has usually been read without.
              </p>

              <h3 style={h3}>The forty meditation subjects, audited against the canon</h3>
              <p>
                Audited category by category, the forty is not a list of inventions: every one of its seven
                classes has a canonical root. What the commentary does is re-select, re-number, and close. It
                swaps members, putting a light-kasiṇa where the canon's ten end in a consciousness-kasiṇa;
                re-counts others, ten corpse-types for the canon's nine charnel stages, ten recollections for the
                canon's six; fixes a name on a canonical practice (<em>catudhātuvavatthāna</em> for the
                element-analysis); and draws a hard boundary the canon does not, leaving outside it the
                perception-series and the awakening-factors the suttas also assign. So the forty is neither simply
                canonical nor simply invented: it is a canonical body of practice settled into a closed
                commentarial inventory.
              </p>
              <p>
                Carried down to the last member, the pattern is sharper still: of all forty, only one is a
                meditation object the canon does not have at all, the light-kasiṇa (<em>ālokakasiṇa</em>, zero
                canonical rows against nineteen in the Visuddhimagga). Every other member is canonically attested
                as a term and a practice, each colour and element kasiṇa, every corpse-contemplation, all ten
                recollections (the breath at 44 canonical rows, peace, the rarest, at six), the four
                immeasurables, the four formless attainments (200 to 300 rows each), the perception of food's
                repulsiveness, and the element-analysis. The canon's own ten kasiṇas are the eight elements and
                colours plus a space- and a consciousness-kasiṇa (each canonical, twelve and fourteen rows); the
                Visuddhimagga keeps the eight, drops the consciousness-kasiṇa, and puts the light-kasiṇa in its
                place. The list differs, in object, by exactly that one slot, consciousness out and light in. The
                ten <em>asubha</em> are the canon's own charnel vocabulary renumbered from nine cemetery-stages
                to ten corpse-types, and the ten recollections are the canonical six (<Cite id="an6.10">AN 6.10</Cite>)
                closed up with four that are each canonical on their own.
              </p>
              <p>
                The kasiṇa is also used differently on each side, which is the deeper difference. In the canon it
                is a perception-totality, a <em>kasiṇāyatana</em> listed among the attainments and tied mostly to
                the absorptions (54 of its 74 canonical rows sit with <em>jhāna</em>), appearing also among the
                eight bases of mastery (<em>abhibhāyatana</em>) and, less often, beside insight and the
                destruction of the taints. What the canon does not have is a technique for it: the
                counterpart-sign progression the commentary builds, from the preliminary sign through the
                learning-sign to the counterpart-sign (<em>parikamma-</em>, <em>uggaha-</em>,
                <em>paṭibhāganimitta</em>), is zero canonical rows against nearly two hundred in the commentary
                and sub-commentary. The canon names the kasiṇa-objects and uses them as bases of attainment; the
                commentary supplies the step-by-step method that makes them the standard road to absorption.
              </p>
              <p>
                And the perception-series is less excluded from the forty than filed on the other side of it. The
                forty is a list of calm-subjects (<em>samatha-kammaṭṭhāna</em>); the perceptions of impermanence,
                non-self, and light belong to insight, where the canon does assign them (the ten perceptions to
                Girimānanda, <Cite id="an10.60">AN 10.60</Cite>) and where they read as <em>vipassanā</em> rather
                than as objects for absorption. The commentary occasionally treats the perception of impermanence
                as a meditation subject in its own right, but not among the forty, because the forty inventories
                concentration, not insight. So the perceptions are counted by the tradition as subjects; they are
                just not calm-subjects, which is why an inventory of forty calm-subjects leaves them out.
              </p>
              <div style={tableWrap}>
                <table style={{ ...table, tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '34%' }} />
                    <col style={{ width: '40%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={thLeft}>Class (Visuddhimagga)</th>
                      <th style={thLeft}>In the canon?</th>
                      <th style={thLeft}>How the commentary's list differs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={tr}>
                      <td style={tdLeftSm}>Ten kasiṇa (devices)</td>
                      <td style={tdLeftSm}>Yes, the ten <em>kasiṇāyatana</em> (<Cite id="mn77">MN 77</Cite>, <Cite id="an10.25">AN 10.25</Cite>–<Cite id="an10.26">26</Cite>, <Cite id="dn33">DN 33</Cite>)</td>
                      <td style={tdLeftSm}>The canon's ten close with a space- and a consciousness-kasiṇa (each canonical); the Visuddhimagga keeps a space-kasiṇa but drops the consciousness-kasiṇa for a light-kasiṇa (0 canonical rows, 19 in the Visuddhimagga), the one object in the forty with no canonical attestation</td>
                    </tr>
                    <tr style={tr}>
                      <td style={tdLeftSm}>Ten <em>asubha</em> (the unlovely)</td>
                      <td style={tdLeftSm}>Yes, as the nine charnel-ground stages (<em>sīvathika</em>; <Cite id="dn22">DN 22</Cite>, <Cite id="mn10">MN 10</Cite>)</td>
                      <td style={tdLeftSm}>The canon's nine become a different ten, the corpse-decomposition types, in the commentary</td>
                    </tr>
                    <tr style={tr}>
                      <td style={tdLeftSm}>Ten <em>anussati</em> (recollections)</td>
                      <td style={tdLeftSm}>Yes, as the six recollections (<Cite id="an6.10">AN 6.10</Cite>, <Cite id="an6.25">AN 6.25</Cite>); breath, death, body, and peace are added singly elsewhere</td>
                      <td style={tdLeftSm}>The commentary closes the open canonical set at a fixed ten</td>
                    </tr>
                    <tr style={tr}>
                      <td style={tdLeftSm}>Four <em>brahmavihāra</em></td>
                      <td style={tdLeftSm}>Yes, in full</td>
                      <td style={tdLeftSm}>Unchanged</td>
                    </tr>
                    <tr style={tr}>
                      <td style={tdLeftSm}>Four <em>āruppa</em> (formless)</td>
                      <td style={tdLeftSm}>Yes, in full</td>
                      <td style={tdLeftSm}>Unchanged</td>
                    </tr>
                    <tr style={tr}>
                      <td style={tdLeftSm}>Food's repulsiveness</td>
                      <td style={tdLeftSm}>Yes (<em>āhāre paṭikūlasaññā</em>)</td>
                      <td style={tdLeftSm}>Unchanged</td>
                    </tr>
                    <tr style={tr}>
                      <td style={tdLeftSm}>Four-element analysis</td>
                      <td style={tdLeftSm}>Yes, the practice (<em>dhātumanasikāra</em>; <Cite id="mn10">MN 10</Cite>, <Cite id="mn28">MN 28</Cite>, <Cite id="mn140">MN 140</Cite>)</td>
                      <td style={tdLeftSm}>Only the fixed name <em>catudhātuvavatthāna</em> is the commentary's</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={tableCaption}>
                The seven classes of the Visuddhimagga's forty, each against its canonical attestation. The
                kasiṇa, <em>asubha</em>, and <em>anussati</em> rows are where the commentarial list visibly
                re-draws the canonical one; the closed forty also omits canonical objects entirely, the
                perception-series (<em>anicca-</em>, <em>anatta-</em>, <em>ālokasaññā</em>) and the seven
                awakening-factors among them.
              </p>

              {/* 3. METHOD + Table 1 */}
              <h3 style={h3}>Sources and method</h3>
              <p>
                The corpus is the Chaṭṭha Saṅgāyana (CST/VRI) recension as ingested into the project database,
                with SuttaCentral identifiers as the cross-walk and the standard Pāli dictionaries for the
                lexis. CST is used because it is the only layer that carries the full Aṭṭhakathā and Ṭīkā the
                canon-versus-commentary comparison needs; its pagination differs from the PTS editions.
                Searching combined exact and stemmed queries over the original-language field for the Pāli
                object terms and antidote formulas, concept queries over the English field for discovery, and
                the passage and commentary endpoints to follow a sutta to its Aṭṭhakathā. A negative claim, that
                a word or sense is absent from a layer, is confirmed by a direct database count grouped by
                textual role rather than by a search impression, because the count is exact
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
              <p>
                One reading of the table needs a word first, because its rows divide object-assignment by how it
                was gathered, not by where it sits. Assigning a meditation object to a named person runs to 29
                canonical instances against roughly 204 commentarial ones. The canonical 29 are the first
                object-assignment row; the commentarial side is split across three rows, the five curated
                exemplars in that same first row, the ten cells of the temperament matrix, and the 189 narratives
                of the expansion row. So the contrast the survey turns on is 29 against some 204, not the
                29-against-5 that the first row, read by itself, might seem to say. The canon does assign objects
                to named people, to Meghiya, Rāhula, Girimānanda, Nandā; it does so by present situation, and far
                less often than the commentary, which assigns by temperament and at volume.
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
                aṭṭhakathā, ṭīkā, and the Visuddhimagga. The two object-assignment rows and the temperament
                matrix are one category gathered three ways: their commentarial cells sum to about 204, against
                the canon's 29 (see the note above the table), which is the contrast the survey turns on.
              </p>

              {/* A. PERSON & MODE + Table 3 */}
              <h3 style={h3}>A. The person and the mode of guidance</h3>
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
                to the Buddhas: a leading. The fourth type, the one who only learns the words and does not break
                through in this life (<em>padaparama</em>), is a limit case: because no breakthrough occurs there
                is no completed act of guidance to record, so the type is noted here but not counted among the
                instances.
              </p>
              <p>
                Who may guide, and how does a guide know what to give? In the canon the answer is a faculty.
                The Buddha surveys the world with the eye of an Awakened One and sees beings with little dust
                and with much, with keen faculties and with dull, the famous lotus-pond image
                (<Cite id="sn6.1">SN 6.1</Cite>, <Cite id="mn26">MN 26</Cite>); the knowledge of the maturity
                of others' faculties is listed among the Realized One's powers (<Cite id="mn12">MN 12</Cite>).
                This reads as perception rather than a checklist applied in advance. The para-canonical bridge
                takes the next step: the Nettippakaraṇa
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
              <h3 style={h3}>B. Assigning a meditation object</h3>
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
              <h3 style={h3}>C. What goes with what</h3>
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
              <h3 style={h3}>D. Calm and insight: yoked or split</h3>
              <p>
                The central question is whether the canon prescribes calm and insight as two separate
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
              <h3 style={h3}>E. Does the guidance change over time?</h3>
              <p>
                The canon gives pairings and situational sets, and it does grade a single curriculum, most
                clearly in the long advice to Rāhula, which moves through the elements, the divine abidings, the
                perceptions and the sixteen steps of breathing in one sitting (<Cite id="mn62">MN 62</Cite>).
                What it does not give is a fixed order of objects through which every practitioner must pass.
                The fixed sequence is commentarial: virtue, then concentration on one of the forty subjects
                chosen by temperament, then wisdom; the seven purifications; the graded knowledges of insight.
                Sequence, like the temperament key,
                is part of the apparatus the commentary supplies on top of the canonical pairings.
              </p>

              {/* F. CANON VS COMMENTARY + Table 4 (ledger) */}
              <h3 style={h3}>F. Canon and commentary: the warrant ledger</h3>
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
                Read cell by cell, the picture is the expected split rather than a clean win for either side.
                Of fifteen decidable assignment cells, eight carry a canonical warrant and seven do not. Four of the eight rest on the
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
                          <td style={tdLeftSm}>
                            {r.id
                              ? <Cite id={r.id}>{r.citation}</Cite>
                              : <span style={citeDead} title={r.citation}>{shortSource(r.citation)}</span>}
                          </td>
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
                Eight cells carry a canonical warrant, seven do not. Of the eight with a warrant, four rest on the
                suttas and four only on the para-canonical Khuddaka, the Cūḷaniddesa and the Paṭisambhidāmagga;
                none rests on the Abhidhamma directly, though the roots the scheme is built on are Abhidhamma.
                Click a source or a warrant to open the passage.
              </p>

              {/* G. THE COMMENTARIAL ASSIGNMENT NARRATIVES */}
              <h3 style={h3}>G. The commentarial assignment narratives</h3>
              <p>
                The structural shape the abstract opens with sits here. Beneath the fifteen-cell ledger lies
                a larger body: the commentaries' own stories of assignment. Drawn in full, the frame shows the
                four Nikāyas turning few named persons toward a
                definite object while the commentaries record several hundred, which is the commentary-to-canon
                split of Table 1. Two cautions keep that contrast honest. The commentary is stored at paragraph
                granularity and the suttas at the level of the
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
                parts of the body (<em>kesā, lomā, nakhā, dantā, taco</em>, hair of the head, hair of the body,
                nails, teeth, skin). Those five are canonical: they are the opening of the thirty-two-part body
                contemplation taught in the suttas (the <em>dvattiṃsākāra</em> of <Cite id="dn22">DN 22</Cite>
                and the mindfulness-of-the-body discourse <Cite id="mn119">MN 119</Cite>; the five-part phrase
                carries 26 canonical rows). What is the commentary's own is the practice of giving just those
                five, recited in order and in reverse, as a self-standing "root meditation subject"
                (<em>mūlakammaṭṭhāna</em>, a term with no canonical occurrence at all, 0 of its 52 rows in the
                canon) handed to novice after novice at ordination, among them the boy Revata
                (<Cite id="cst-s0401a.att-an1_14_p248">Mp</Cite>), the seven-year-old Dabba, and the wanderer
                Subhadda. "Standard" here means the commentary's codified ordination default, not a fixed first
                gift the canon itself prescribes. Beyond that opening the teacher reads the person and corrects. Vakkali's insight does
                not move because his faith runs too strong, and the Buddha, seeing the imbalance, purifies and
                re-gives his subject (<Cite id="cst-s0510a.att-284_p006">Th-a</Cite>). A goldsmith's pupil,
                given foulness by Sāriputta, makes no progress until the subject is changed to an agreeable
                colour (<Cite id="cst-s0502a.att-234_p004">Dhp-a</Cite>). In a recurring teaching method the
                pupil recites the body-parts and reports how the object appears, as repulsiveness, as colour, or
                as elements, and the teacher confirms the subject the report shows to be suitable
                (<Cite id="cst-abh02a.att-70_p089">Vibh-a</Cite>). The criterion in these scenes is most often
                the person's capacity or past habit, read by a teacher, which is the very faculty
                the canon places with the Buddha alone.
              </p>
              <p>
                Read by warrant, this larger body does not overturn the ledger; it extends it. Each of the
                {' '}{fmt(data.aggregates?.expansion_ledger?.total || 0)} added instances was read again, by two
                independent readers, against the same warranted-or-not question the fifteen-cell ledger asks,
                with the canonical warrant named and checked against the corpus: {fmt(data.aggregates?.expansion_ledger?.H0 || 0)}{' '}
                carry a canonical warrant, resting on a canonical object keyed as the canon keys it, and
                {' '}{fmt(data.aggregates?.expansion_ledger?.H1 || 0)} do not, the keying being the commentary's
                own. The split is close to even, and it falls about where expected: the objects the
                commentary assigns are, in the main, the canon's own, but the apparatus that fits a standing
                object to a standing temperament, and the teacher-diagnosis that reads it, carries no canonical
                warrant. The {fmt(data.aggregates?.expansion_ledger?.split_resolved || 0)}{' '}
                instances the two readers disagreed on were resolved by one stated rule: a canonical object with
                no temperament-typing and no Visuddhimagga-only technique counts as warranted. Each figure below
                opens the full list of its instances, every warrant resolving to a passage.
              </p>

              <h3 style={h3}>Table 5. The expansion warrant ledger (verified; each figure opens its instances)</h3>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr><th style={thLeft}>Verdict</th><th style={thNum}>Instances</th></tr>
                  </thead>
                  <tbody>
                    {[['H0', 'Supported (H0): a canonical warrant, named and checked against the corpus'], ['H1', 'Innovation (H1): the commentary supplies the keying (temperament-typing, teacher-diagnosis, or a Visuddhimagga-only technique)']].map(([h, label]) => (
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
                Each added instance re-adjudicated by two independent readers to a named, corpus-checked
                canonical warrant or to none, by the same test as the fifteen-cell ledger. Open any figure to
                read its instances and follow each warrant to its passage.
              </p>

              {/* READER'S AID */}
              <h3 style={h3}>A reader's aid: what the sources license</h3>
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
              <h3 style={h3}>Discussion</h3>
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
              {/* ---- v2 provenance-signature retrofit (additive; self-hides if absent) ---- */}
              {data.v2 && (() => {
                const v = data.v2;
                return (
                  <section style={{ marginTop: 34 }}>
                    <h3 style={h3}>{v.title}</h3>
                    <p style={methodNote}>{v.subtitle}</p>
                    <p>{v.headline}</p>

                    {Array.isArray(v.stratigraphy) && v.stratigraphy.length > 0 && (
                      <>
                        <h3 style={h3}>The apparatus as a post-canonical stratum</h3>
                        <div style={tableWrap}>
                          <table style={table}>
                            <thead>
                              <tr>
                                <th style={thLeft}>Apparatus element</th>
                                <th style={thLeft}>Chronological stratum</th>
                                <th style={thLeft}>Structural layer</th>
                                <th style={thNum} title="Hits in the four Nikāyas + the seven Abhidhamma books">4-Nik. + Abhi.</th>
                                <th style={thNum}>Layer/stratum disagree</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.stratigraphy.map((r, i) => (
                                <tr key={i} style={tr}>
                                  <td style={tdLeft}>{r.element}</td>
                                  <td style={tdLeftSm}>{r.stratum}</td>
                                  <td style={tdLeftSm}>{r.structural_layer}</td>
                                  <td style={tdNum} title={typeof r.raw_four_nikaya_abhidhamma_hits === 'number' && r.raw_four_nikaya_abhidhamma_hits !== r.four_nikaya_abhidhamma_hits ? `${r.raw_four_nikaya_abhidhamma_hits} raw word-hits, all in the ordinary (non-technical) sense` : undefined}>{fmt(r.four_nikaya_abhidhamma_hits)}</td>
                                  <td style={tdNum}>{r.layer_stratum_disagree ? 'yes' : 'no'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p style={tableCaption}>
                          {v.stratigraphy.map((r, i) => (
                            <span key={i}>{i ? ' · ' : ''}<Cite id={r.anchor?.id}>{r.anchor?.label}</Cite></span>
                          ))}
                        </p>
                      </>
                    )}

                    {/* The carita semantic-drift strip renders inline in the para-canonical section
                        of the narrative above; it is not duplicated here. */}

                    {v.epistemic && (
                      <>
                        <h3 style={h3}>How firmly the texts commit: {v.epistemic.verdict}</h3>
                        <p><em>{v.epistemic.claim}</em></p>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: 20 }}>
                          {v.epistemic.evidence.map((e, i) => <li key={i} style={{ marginBottom: 6 }}>{e}</li>)}
                        </ul>
                        <p style={tableCaption}>
                          Warrant: <Cite id={v.epistemic.anchor?.id}>{v.epistemic.anchor?.label}</Cite>
                        </p>
                      </>
                    )}

                    {v.recension && (
                      <>
                        <h3 style={h3}>How far this reaches beyond the Pāli: {v.recension.verdict}</h3>
                        <div style={tableWrap}>
                          <table style={table}>
                            <thead>
                              <tr>
                                <th style={thLeft}>Feature</th>
                                <th style={thLeft}>Anchor</th>
                                <th style={thLeft}>Code</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.recension.seed_pre_sectarian.map((s, i) => (
                                <tr key={'s' + i} style={tr}>
                                  <td style={tdLeftSm}>{s.feature}</td>
                                  <td style={tdLeftSm}><Cite id={s.anchor?.id}>{s.anchor?.label}</Cite></td>
                                  <td style={tdLeftSm}>{s.code}</td>
                                </tr>
                              ))}
                              <tr style={tr}>
                                <td style={tdLeftSm}>{v.recension.typology_pali_local.feature}</td>
                                <td style={tdLeftSm}><Cite id={v.recension.typology_pali_local.anchor?.id}>{v.recension.typology_pali_local.anchor?.label}</Cite></td>
                                <td style={tdLeftSm}>{v.recension.typology_pali_local.code}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p style={tableCaption}>{v.recension.typology_pali_local.guard}</p>
                      </>
                    )}

                    <p style={methodNote}>{v.method_note}</p>
                  </section>
                );
              })()}

              <h3 style={h3}>Limitations</h3>
              <p>
                Recall is bounded, and the bound is stated rather than hidden. As the method sets out, the
                enumeration rests on a candidate frame built by direct database query rather than on the search
                service; within the tradition's closed lists and the secondary literature it is saturated, but
                that saturation is structural, not a proof that the open corpus holds no further instance
                phrased in terms the frame did not cover. Two notes on method. The warrant ledger for the
                commentarial additions was re-checked against the warranted-or-not test by two independent
                readers, with each warrant named and checked against the corpus; the {fmt(data.aggregates?.expansion_ledger?.split_resolved || 0)}{' '}
                cells they split on were resolved by one stated rule rather than a third pass, and every cell is
                exposed per instance for inspection. And several gaps named in the earlier pass are now closed
                and carried in the dataset: the forty objects of the Visuddhimagga
                and their temperament keying are pulled verbatim, the graded death-mindfulness discourses and
                the directed discourse on body-mindfulness are enumerated, and the commentarial back-story in
                which monks frightened by tree-deities are given loving-kindness is recorded as a commentarial
                assignment. Scope is Pāli and Theravāda only; the Vimuttimagga enters through Bapat alone;
                cross-tradition material is out of scope.
              </p>

              {/* CONTRIBUTION */}
              <h3 style={h3}>Contribution</h3>
              <p>
                The lasting contribution is the auditable census itself: every act of guidance in the studied
                range, coded on a fixed scheme, split canon against commentary, with each instance resolving to
                a passage a reader can open and check. On top of that the study offers three results. It
                quantifies the canon-versus-commentary difference in object-assignment as a clean contrast of
                keys, defilement and situation against temperament. It puts a count to the warranted-or-not question,
                eight cells warranted and seven not, and it reports the warrant tier rather than collapsing the
                eight into a single canonical voice. And for this corpus the calm-and-insight evidence leans
                toward the yoked reading, on the evidence enumerated, including the absence across
                the enumerated discourses of any insight-alone assignment to a named person, which is
                consonant with the reading argued by Cousins, Gethin, and Anālayo.
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
              <h3 style={h3}>References</h3>
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
              <h3 style={h3}>Appendix: the dataset</h3>
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

              {data.meta.query_log && (() => {
                const ql = data.meta.query_log;
                const css = ql.carita_sense_split;
                return (
                <section style={{ marginTop: 14 }}>
                  <h3 style={h3}>Reproducibility appendix: the exact queries</h3>
                  <p style={methodNote}>
                    This is the full query log. {ql.engine} Every query below has a copy button; paste it into
                    a Postgres client on the corpus and the count returns. {ql.note} Diacritics follow the
                    corpus (the niggahita is written both ways, ṃ and ṁ, so the predicates list both where it
                    matters).
                  </p>
                  <h3 style={h3}>1. The candidate frame: {fmt(ql.frame_union)} passages (the four rules whose union is the census)</h3>
                  {ql.frame_rules.map((q, i) => (
                    <div key={i} style={qRow}>
                      <div style={qHead}><span style={qLabel}>{q.rule}</span><span style={qHits}>{fmt(q.candidates)} hits</span></div>
                      <CopyCode text={q.sql} />
                    </div>
                  ))}
                  <p style={tableCaption}>
                    Deduplicated union of the four rules = {fmt(ql.frame_union)} candidate passages, coded down
                    to {fmt(derived.inst.length)} instances. Meditation-object vocabulary used by rule 2
                    (alternation, case-insensitive): <CopyCode text={ql.meditation_object_vocabulary} />
                  </p>
                  <h3 style={h3}>2. Measurement queries (the per-layer footprint that diagnosed the undercount)</h3>
                  {ql.measurement_queries.map((q, i) => (
                    <div key={i} style={qRow}>
                      <div style={qHead}><span style={qLabel}>{q.label}</span></div>
                      <CopyCode text={q.sql} />
                    </div>
                  ))}
                  <h3 style={h3}>3. Targeted queries (specific cells and loci)</h3>
                  {ql.targeted_queries.map((q, i) => (
                    <div key={i} style={qRow}>
                      <div style={qHead}><span style={qLabel}>{q.label}</span></div>
                      <CopyCode text={q.sql} label={q.sql ? '' : '(by-id fetch; follow the citation link)'} />
                    </div>
                  ))}
                  <h3 style={h3}>4. The <em>carita</em> sense-split</h3>
                  <p>Scope: {css.scope}.</p>
                  <div style={qRow}><div style={qHead}><span style={qLabel}>Any occurrence of carita</span><span style={qHits}>{fmt(css.any_carita_count)}</span></div><CopyCode text={css.any_carita_sql} /></div>
                  <div style={qRow}><div style={qHead}><span style={qLabel}>Temperament-typed compound</span><span style={qHits}>{fmt(css.temperament_compound_count)}</span></div><CopyCode text={css.temperament_compound_sql} /></div>
                  <div style={qRow}><div style={qHead}><span style={qLabel}>Paṭisambhidāmagga control</span><span style={qHits}>{fmt(css.paṭisambhidāmagga_count)}</span></div><CopyCode text={css.paṭisambhidāmagga_sql} /></div>
                  <p style={{ ...tableCaption, marginTop: 8 }}>The nine temperament-compound passages, each opening in the reader:</p>
                  <ul style={idList}>
                    {css.nine_ids.map((s) => {
                      const id = s.split(' ')[0];
                      const work = s.slice(s.indexOf('(')) || '';
                      return <li key={id} style={drillLi}><Cite id={id}>{id}</Cite> <span style={drillMeta}>{work}</span></li>;
                    })}
                  </ul>
                  <p style={tableCaption}>{ql.integrity}</p>
                </section>
                );
              })()}

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

function HeartBaseStudy({ entry, onBack, backLabel = 'Research' }) {
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
        <button onClick={onBack} style={backBtn} aria-label={`Back to ${backLabel} (Esc)`}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to {backLabel}</span>
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
                <span style={abstractTag}>Abstract.</span> A meditator in the living Theravāda is often told
                that the mind has a physical seat, the heart-base, a subtle matter lodged in the cavity of the
                heart. Going back to the texts to look for it, one finds the discourses never say so. This
                companion to the guidance census sorts where a term and a concept sit across the three
                composition layers of this literature, the discourses, the seven analytic Abhidhamma books, and
                the commentaries. What the data seem to say, in brief: the name of the heart-base is absent
                from the canon, while the bare concept it names is present in one late canonical book, the
                Paṭṭhāna, left unnamed; the commentary supplies the name and seats the life-continuum upon it.
                The same shape, an early practice with its route-map drawn late, recurs for the life-continuum
                (bhavaṅga) and for the named insight-ladder. For two other structures, the three roots and the
                analytical categories, the suttas already carry the material and the Abhidhamma systematizes
                rather than originates it. This describes a shape across textual layers; it is not a proof
                about what the historical Buddha taught.
              </p>
              <p>
                What follows traces the seat of mind across the layers of this literature, earliest to latest:
                in the discourses, a seat unmentioned; in the Abhidhamma, a base posited yet left unnamed; in
                the commentaries, the base named the heart and posited rather than verified; in the
                sub-commentaries, the tradition naming its own gap; and in reading it now, what the layered
                shape means for a reader who meets the heart-base today as settled doctrine. A trailing section
                opens the full structure-by-structure data beneath that narrative.
              </p>
              <p style={methodNote}>
                A note on method. Every corpus claim is grounded in a passage that opens in the reader, and
                every count is best read as a measured floor: a claim phrased outside the markers searched would
                not be caught. The finding that the name is absent from the seven Abhidhamma books rests on a
                search that returns nothing across them, which is reliable here but sensitive to spelling, and
                was rechecked by grouping on the work rather than the raw passage count. The dating and the
                origin-account of the Abhidhamma are secondary scholarship, not corpus-verified. The
                modern-practice testimony is attributed and flagged as not independently verifiable. Renderings
                of commentary and Abhidhamma that the corpus carries only in Pāli are the author's own gloss,
                checked against Ñāṇamoli.
              </p>
              <p>
                Two things frame everything. First, the contrast has three tiers, not two. The Theravāda canon
                is not only the suttas: the Abhidhamma is the third basket, canonical, and most of what a flat
                split would call commentary is the commentary systematizing the Abhidhamma. The seat of mind,
                the life-continuum, the three roots and the analytical categories are all canonical-Abhidhamma
                yet absent from the suttas; a two-tier scheme either credits them to the suttas or wrongly
                calls them commentarial inventions. Critical scholarship dates the seven books later than the
                Nikāyas, growing out of the suttas' doctrinal lists; either way the suttas are the earliest
                stratum and the Abhidhamma is the first systematizing layer. Second, the Buddha's register is
                to be lived, not pondered: come and see, visible here and now, knowing-and-seeing as it is. The
                canon is a path to walk; the named knowledges are a description of the milestones that walking
                passes through. Keeping the path apart from the route-map the commentary drew over it is what
                the three-tier reading makes possible.
              </p>

              <h2 style={h2}>In the discourses</h2>
              <p>
                The oldest stratum holds the experience and withholds both the seat and the map. In the suttas
                the heart is only an organ in the body-parts list and a figure of speech; it is never the seat
                of thought, and the named heart-base appears zero times in the four Nikāyas. The
                life-continuum (bhavaṅga) is absent here too; its nearest analogue is the luminous mind
                (<Cite id="an1.41-50">AN 1.49–50</Cite>), a figure of moral purity with no base and no
                mechanism. What the discourses do carry is the lived practice over which the later map is
                drawn: the contemplation of rise and fall as a plain present-tense activity, a thing one does
                with no list and no numbered place. That practice, <em>udayabbayānupassī viharati</em>, "he
                dwells contemplating rise and fall," recurs through the four Nikāyas in twenty-five rows. The
                staged progress-of-insight as the suttas give it is the experiential path, coarse-grained:
                watch rise-and-fall, then impermanence, disenchantment, fading, release. The skeleton of the
                path, the seven purifications, is sutta too: MN 24 (<Cite id="mn24">MN 24</Cite>) enumerates
                all seven, and the Visuddhimagga is built on them. These are instructions to live, not stations
                to recognize.
              </p>

              <h2 style={h2}>In the Abhidhamma</h2>
              <p>
                At the second canonical shelf, scholastic rather than narrative, an unnamed material base for
                the mind first appears. Searched as a name, the heart-base is no more present here than in the
                discourses; the word <em>hadaya-vatthu</em> does not occur in the canonical Abhidhamma at all.
                The concept tells a different story. The Paṭṭhāna posits a material support for the two
                mind-elements but leaves it un-named (<Cite id="patthana1.1">Paṭṭhāna 1.1</Cite>):
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
                mind-consciousness base indeterminate (<Cite id="cst-abh01m.mul-078">Dhs §584</Cite>). So the
                concept of a material seat of mind is in the canon, in the analytic layer, but stripped of the
                name and of any identification with the physical heart. Bhavaṅga falls into the same shape: the
                Paṭṭhāna uses it as a real term, a discrete state in the conditional relations
                (<Cite id="patthana2.1">Paṭṭhāna 2.1</Cite>), but with no series and no seat. The elaborate
                process-model built on it, the citta-vīthi, is the commentary's surplus, not the canonical
                term. The analytical ground the insight works on, the aggregates, sense-bases, elements and
                dependent origination, is Abhidhamma, the Vibhaṅga's chapters (<Cite id="vb1">Vibh 1</Cite>,{' '}
                <Cite id="vb2">Vibh 2</Cite>, <Cite id="vb6">Vibh 6</Cite>); the three roots are Abhidhamma
                too, the three unwholesome roots of the Dhammasaṅgaṇī and the Vibhaṅga
                (<Cite id="cst-abh02m.mul-226">Vibh §226</Cite>). But the named graded ladder, rise-and-fall
                knowledge, dissolution knowledge, comprehension, equanimity about formations, returns nothing
                across the seven Abhidhamma books; it is first defined one shelf up, in the para-canonical
                Paṭisambhidāmagga (<Cite id="ps1.1">Paṭis 1.1</Cite>). The early canon has the walking; the
                route-map is drawn afterward.
              </p>

              <h2 style={h2}>In the commentaries</h2>
              <p>
                The classical-commentary layer is where the posited base is finally given a body, named the
                heart, located, and run through the cognitive process. The commentary substitutes the heart
                for the Abhidhamma's anonymous matter (<Cite id="cst-abh03a.att-370_p002">Pañca-a §370</Cite>):
              </p>
              <p style={evPaliBlock}>Ettha ca rūpanti hadayavatthumattameva adhippetaṁ.</p>
              <p style={evEnBlock}>And here, by "matter", only the heart-base is meant. (author's gloss)</p>
              <p>
                It even physicalizes the base, running on the half-handful of blood inside the heart-chamber
                (<Cite id="cst-abh07t.nrf-135_p014">Abh-pṭ §135</Cite>). On bhavaṅga the commentary builds the
                full cognitive process, the citta-vīthi, in which bhavaṅga vibrates, is arrested, gives way to
                the cognitive series and returns, and it ties bhavaṅga to the heart-base as an object-less
                life-continuum (<Cite id="cst-abh01t.tik-69_p013">Abh-pṭ §69</Cite>). The temperament scheme
                sharpens here too: a three-fold root-carita with a remedy matrix, greed to foulness, hate to
                love, delusion to dependent origination, is already para-canonical, in the Nettippakaraṇa and
                Peṭakopadesa (<Cite id="ne6">Nett §13</Cite>), but the six-fold personality typology, the
                affinity theory, the object-suitability matrix (<Cite id="cst-e0101n.mul-36_p031">Vism III
                §46</Cite>) and the heart-blood diagnostics (<Cite id="cst-abh02a.att-70_p058">Vibh-a
                §70.58</Cite>) are the commentary's, first set in the Aṭṭhakathā
                (<Cite id="cst-s0201a.att-mn1_3_p261">Ps-a 3 §261</Cite>). Where the Abhidhamma does use the
                word <em>carita</em> (<Cite id="cst-abh02m.mul-149">Vibh §817</Cite>), it means kamma, not
                temperament; the temperament sense is a commentarial re-coinage. The named insight-ladder is
                systematized and refined here (<Cite id="cst-e0101n.mul-53_p011">Vism §53</Cite>), which even
                adds a momentary-versus-continuity reading the bare Paṭisambhidāmagga does not spell out
                (<Cite id="cst-e0104n.att-76_p012">Vism-mhṭ §76</Cite>), and the commentary even states the
                weave: two purifications as root, five as body, operating on the aggregates, sense-bases,
                elements and dependent origination as their ground
                (<Cite id="cst-abh08t.nrf-100_p024">Abh-pṭ §100</Cite>). At this layer one can also ask with
                what force the claim is made. The heart-base is introduced by the grammar of a posit, an
                analysis of its existence and its supporting function, never under the canon's own test of
                direct knowing that it reserves for the four truths and the ending of the taints; it is stated
                flat and leaned upon.
              </p>

              <h2 style={h2}>In the sub-commentaries</h2>
              <p>
                The latest in-corpus layer is the one that dates the heart-base, by admitting it. A
                sub-commentator stops the exposition and poses the sceptic's question: how is the heart-base to
                be known at all, given that it does not come down in the canonical text? He answers in two
                words, "from scripture and from reason," and then produces, as his scripture, the very
                anonymous Paṭṭhāna clause that never names the heart
                (<Cite id="cst-e0104n.att-16_p024">Vism-mhṭ §16</Cite>), noting that the Dhammasaṅgaṇī never
                stated it. The flag is explicit: the text says the heart-identification is not handed down in
                the canonical text. The tradition is not under the impression that the heart-base is the
                Buddha's plain word; it knows it is not, and says so. The reconciliation runs in a circle, and
                the circle is the evidence: the heart is warranted by the posit, and the posit is what the
                heart was supposed to name. The sub-commentary also physicalizes the base further, seating the
                life-continuum on the heart and running it on the blood within the heart-chamber.
              </p>

              <h2 style={h2}>Reading it now: what this means</h2>
              <p>
                The heart is integral, but to a tier. In the suttas it is not the seat of mind at all; the
                physical base of mind is left unstated. In the Abhidhamma a material base is posited but
                unnamed, and bhavaṅga exists as a bare term. In the commentary, and in the modern
                Abhidhamma-revival practice that teaches it, the heart becomes integral: named, made the seat
                of the life-continuum, located in the heart's blood, and in practice an object of discernment.
                In modern lay practice this apparatus is alive. In Goenka's teaching, dissolution (bhaṅga) is a
                sensation-stage, the dissolving of gross sensation into a subtle free-flow, and it is
                explicitly not the goal; the central caution is against taking it as the goal. The heart-base
                and bhavaṅga discernment is taught in the modern Abhidhamma-revival lineages too. Pa-Auk
                teaches it explicitly in its published materials (Pa-Auk Sayadaw, <em>Knowing and Seeing</em>).
                For Goenka the public record, the ten-day discourses and U Ba Khin's published
                <em> Essentials</em>, centres on feeling and does not surface the heart-base; a long-course
                practitioner reports that the heart-base and bhavaṅga work is taught in the non-public
                long-course discourses. That report cannot be independently verified and is recorded as
                attributed practitioner testimony, not a citation. If accurate, it strengthens rather than
                weakens the reading, since it would mean the modern method operationalizes the full
                Abhidhamma-and-commentary apparatus, not only the sensation-sweep. Historically the whole
                apparatus, the sixteen knowledges, the cognitive process, bhavaṅga and the heart-base, is the
                Visuddhimagga and Abhidhamma system revived for mass lay practice by Ledi Sayadaw and built out
                by the twentieth-century Burmese teachers (Erik Braun, <em>The Birth of Insight</em>). The
                danger the texts flag, and that modern teachers flag, is the same: mistaking a landmark, a
                pleasant dissolution, for the destination. For a meditator told today that the mind has a
                physical base in the heart, the honest report is that the suttas never say so, the canonical
                Abhidhamma posits a seat without naming it, and the heart-identification is a later, scholastic
                naming, stated flat and built upon, and never once put to the canon's own test of direct
                knowing.
              </p>

              <h2 style={h2}>The full data</h2>
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

              {/* ---- v2 provenance-signature retrofit (R3; additive, self-hides if absent) ---- */}
              {data.v2 && (() => {
                const v = data.v2;
                return (
                  <section style={{ marginTop: 34 }}>
                    <h3 style={h3}>{v.title}</h3>
                    <p style={methodNote}>{v.subtitle}</p>
                    <p>{v.headline}</p>

                    {Array.isArray(v.recall_ladder) && v.recall_ladder.length > 0 && (
                      <>
                        <h3 style={h3}>How the search was widened: the named heart-base versus the unnamed posit</h3>
                        <div style={tableWrap}>
                          <table style={table}>
                            <thead>
                              <tr>
                                <th style={thLeft}>Rung</th>
                                <th style={thLeft}>Strategy</th>
                                <th style={thNum}>Yield</th>
                                <th style={thNum}>Δ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.recall_ladder.map((r, i) => (
                                <tr key={i} style={tr}>
                                  <td style={tdLeftSm}>{r.rung}</td>
                                  <td style={tdLeftSm}>{r.strategy}</td>
                                  <td style={tdNum}>{r.yield}</td>
                                  <td style={tdNum}>{r.delta}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p style={tableCaption}>
                          The named heart-base stays at zero in the four Nikāyas and zero in the seven
                          Abhidhamma books; rung 3 surfaces the canonical-Abhidhamma posit the name-search
                          can never find. The concept is canonical even though the name is not.
                        </p>
                      </>
                    )}

                    {Array.isArray(v.stratigraphy) && v.stratigraphy.length > 0 && (
                      <>
                        <h3 style={h3}>Where each element first appears, by composition layer</h3>
                        <div style={tableWrap}>
                          <table style={table}>
                            <thead>
                              <tr>
                                <th style={thLeft}>Element</th>
                                <th style={thLeft}>Chronological stratum</th>
                                <th style={thLeft}>Structural layer</th>
                                <th style={thNum} title="Hits in the four Nikāyas + the seven Abhidhamma books">4-Nik. + Abhi.</th>
                                <th style={thNum}>Layer/stratum disagree</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.stratigraphy.map((r, i) => (
                                <tr key={i} style={tr}>
                                  <td style={tdLeft}>{r.element}</td>
                                  <td style={tdLeftSm}>{r.stratum}</td>
                                  <td style={tdLeftSm}>{r.structural_layer}</td>
                                  <td style={tdNum}>{r.four_nikaya_abhidhamma_hits}</td>
                                  <td style={tdNum}>{r.layer_stratum_disagree ? 'yes' : 'no'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p style={tableCaption}>
                          {v.stratigraphy.map((r, i) => (
                            <span key={i}>{i ? ' · ' : ''}<Cite id={r.anchor?.id}>{r.anchor?.label}</Cite></span>
                          ))}
                        </p>
                      </>
                    )}

                    {v.epistemic && (
                      <>
                        <h3 style={h3}>How firmly the texts commit: {v.epistemic.verdict}</h3>
                        <p><em>{v.epistemic.claim}</em></p>
                        <ul style={{ margin: '6px 0 8px 0', paddingLeft: 20 }}>
                          {v.epistemic.evidence.map((e, i) => <li key={i} style={{ marginBottom: 6 }}>{e}</li>)}
                        </ul>
                        {Array.isArray(v.epistemic.cooccurrence) && (
                          <div style={tableWrap}>
                            <table style={table}>
                              <thead>
                                <tr>
                                  <th style={thLeft}>Verification formula</th>
                                  <th style={thNum}>Rows with both</th>
                                  <th style={thNum}>Min char-gap</th>
                                  <th style={thLeft}>Reading</th>
                                </tr>
                              </thead>
                              <tbody>
                                {v.epistemic.cooccurrence.map((co, i) => (
                                  <tr key={i} style={tr}>
                                    <td style={tdLeftSm}>{co.formula}</td>
                                    <td style={tdNum}>{co.rows_with_both}</td>
                                    <td style={tdNum}>{fmt(co.min_char_gap)}</td>
                                    <td style={tdLeftSm}>{co.reading} <Cite id={co.row?.id}>{co.row?.label}</Cite></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}

                    {Array.isArray(v.absence) && v.absence.length > 0 && (
                      <>
                        <h3 style={h3}>A patterned silence, and the dull explanations cleared away</h3>
                        {v.absence.map((a, i) => (
                          <p key={i} style={{ marginBottom: 8 }}>
                            <strong>The claim left unspoken:</strong> {a.silent_claim}{' '}
                            <strong>Where it would have appeared:</strong> {a.expected_frame}.{' '}
                            <strong>How often the two fall together:</strong> {a.sql_cooccurrence}.{' '}
                            <strong>What this allows one to say:</strong> {a.licensed}{' '}
                            <strong>What it does not allow:</strong> {a.not_licensed}{' '}
                            <em>{a.contrast}</em>
                          </p>
                        ))}
                      </>
                    )}

                    {v.harmonization && (
                      <>
                        <h3 style={h3}>The tradition names its own gap: {v.harmonization.verdict}</h3>
                        <p><em>{v.harmonization.claim}</em></p>
                        <p>Formula: {v.harmonization.formula}.</p>
                        {v.harmonization.witnesses.map((w, i) => (
                          <div key={i} style={{ margin: '6px 0' }}>
                            <p style={evPaliBlock}>{w.pali}</p>
                            <p style={evEnBlock}>{w.en} (<Cite id={w.locus?.id}>{w.locus?.label}</Cite>; scripture adduced: <Cite id={w.adduced_scripture?.id}>{w.adduced_scripture?.label}</Cite>)</p>
                          </div>
                        ))}
                        <p style={tableCaption}>{v.harmonization.note}</p>
                      </>
                    )}

                    {v.recension && (
                      <>
                        <h3 style={h3}>How far this reaches beyond the Pāli: {v.recension.verdict}</h3>
                        <p>
                          <strong>Heart-base.</strong> {v.recension.heart_base.note} {v.recension.heart_base.scholarship}
                        </p>
                        <p>
                          <strong>Insight ladder.</strong> {v.recension.insight_ladder.note} {v.recension.insight_ladder.guard}
                        </p>
                        <p>
                          <strong>Shared seed.</strong> {v.recension.seed_shared.claim}{' '}
                          (<Cite id={v.recension.seed_shared.anchor?.id}>{v.recension.seed_shared.anchor?.label}</Cite>)
                        </p>
                      </>
                    )}

                    {v.prediction_score && (
                      <p style={methodNote}>
                        What this closer reading expected, it largely bore out, with the cross-recensional leg
                        held as untested rather than confirmed.
                      </p>
                    )}
                    <p style={methodNote}>{v.method_note}</p>
                  </section>
                );
              })()}

              <h3 style={h3}>Limits and sources</h3>
              <p>
                The not-in-the-Abhidhamma verdicts rest on negative controls, searches that return nothing
                across the seven books; reliable here but sensitive to spelling and stemming. The dating of the
                Abhidhamma and the account of its origin are secondary and scholarly, not corpus-verified. The
                long-course claim is attributed testimony about confidential material. Three rows an earlier
                pass left partial are now grounded per row in the table above: the cognitive-process vocabulary
                in the Atthasālinī, where the life-continuum, once turned, gives rise to the cognitive-process
                cittas; the element chapter completing the Vibhaṅga's analytical set; and the
                Paṭisambhidāmagga's Ñāṇakathā, which names the insight-ñāṇas. Sources for the secondary claims:
                Frauwallner,
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

// ---------------------------------------------------------------------------
// Uttarakuru study. Sibling to HeartBaseStudy: a canon-versus-commentary matrix
// of the northern continent's inhabitants. Reads public/research/uttarakuru.json
// (a frozen feature matrix + the full passage census + data-bound aggregates).
// Admin-gated via Dhamma.jsx. Counts in the prose are read from the dataset.
// ---------------------------------------------------------------------------

const UBAND = {
  canon: { label: 'Canon', full: 'Tipiṭaka (mūla), canonical voice' },
  para: { label: 'Para-canon', full: 'Visuddhimagga / Milindapañha (mūla role, post-canonical voice)' },
  attha: { label: 'Comm.', full: 'Aṭṭhakathā (commentary)' },
  tika: { label: 'Sub-comm.', full: 'Ṭīkā (sub-commentary)' },
};
const UBAND_KEYS = ['canon', 'para', 'attha', 'tika'];

const UH = {
  'canonical-seed': { label: 'canonical seed', color: 'var(--bc-accent)', border: 'rgba(var(--bc-accent-rgb), 0.6)', solid: true },
  'commentarial-detail': { label: 'commentarial detail', color: 'var(--bc-text-secondary)', border: 'rgba(var(--bc-accent-rgb), 0.3)', solid: false },
  'split': { label: 'split', color: 'var(--bc-accent)', border: 'rgba(var(--bc-accent-rgb), 0.5)', solid: false, dashed: true },
  'commentarial-innovation': { label: 'no canonical warrant', color: 'var(--bc-loss-text)', border: 'rgba(var(--bc-loss-text-rgb), 0.45)', solid: false },
};
function uBadge(h) {
  const c = UH[h] || UH['commentarial-detail'];
  return { fontSize: 10.5, fontWeight: 600, letterSpacing: '0.02em', borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap', border: '1px solid ' + c.border, borderStyle: c.dashed ? 'dashed' : 'solid', color: c.color, background: c.solid ? 'rgba(var(--bc-accent-rgb), 0.07)' : 'transparent' };
}

function UFeatureCell({ cell }) {
  if (!cell || cell.present === 'absent' || (!cell.text && (!cell.cites || !cell.cites.length))) {
    return <td style={tdLeftSm} aria-label="not attested">·</td>;
  }
  return (
    <td style={cell.present === 'oblique' ? { ...tdLeftSm, opacity: 0.82 } : tdLeftSm}>
      {cell.present === 'oblique' && <span style={tinyNote}>(oblique) </span>}
      {cell.text}
      {cell.cites && cell.cites.length > 0 && (
        <span style={{ display: 'block', marginTop: 4 }}>
          {cell.cites.map((c, i) => (
            <span key={c.id + i}>{i ? ' · ' : ''}<Cite id={c.id}>{c.label}</Cite></span>
          ))}
        </span>
      )}
    </td>
  );
}

function UttarakuruStudy({ entry, onBack, backLabel = 'Research' }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});

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

  const bySeg = useMemo(() => {
    const m = { A: [], B: [], C: [] };
    if (data) for (const f of data.features) (m[f.segment] || (m[f.segment] = [])).push(f);
    return m;
  }, [data]);

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <article style={articleReadWrap}>
        <button onClick={onBack} style={backBtn} aria-label={`Back to ${backLabel} (Esc)`}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to {backLabel}</span>
          <span style={backBtnHint}>Esc</span>
        </button>

        {!data && !error && <p style={hint}>Loading…</p>}
        {error && <p style={errorHint}>Failed to load: {error.message}</p>}

        {data && (() => {
          const ag = data.aggregates, dis = data.disambiguation, rel = data.reliability;
          const nFeat = data.features.length, nCensus = data.census.length;
          const vs = ag.voice_split;
          return (
          <>
            <header style={articleHeader}>
              <h1 style={articleHeaderTitle}>{entry.title}</h1>
              <p style={articleHeaderAuthor}>{entry.subtitle}</p>
            </header>

            <div style={articleBody}>
              <p style={abstractLead}>
                <span style={abstractTag}>Abstract.</span> North of the inhabited world, in the geography
                the Pāli texts take for granted, lies Uttarakuru: the northern of the four great continents,
                where no one owns anything, where rice ripens unsown, and where people live a fixed,
                untroubled span. It is easy to file this with the heavens and hells, but the texts place it on
                the human plane, a far country reached only across an ocean. This study traces the continent
                across the layers of the texts, earliest to latest. It gathers every Uttarakuru-bearing
                passage in the corpus ({nCensus} rows), reads {nFeat} distinct features of the continent, and
                asks where the picture of it actually sits and how firmly the texts commit to it. The shape
                that emerges qualifies the familiar division between a thin canon and a thick commentary. The
                picture grows more concrete as the texts grow later, and that deepening seems to be under way
                inside the late canon rather than waiting for the commentary; the geography is stated as
                assumed background and never staked under the canon's own test of directly-verified knowledge;
                and the ethnography is inherited and broadly shared, while the soteriological judgement built
                on it appears, on the evidence to hand, only in the Pāli. The canon supplies the frame, a
                continent of ownerless, long-lived rice-eaters who surpass even the gods in non-grasping yet
                lack the holy life (AN 9.21); the self-ripening rice is the same rice, word for word, as the
                canon's own golden age (DN 27); and the canonical list of inopportune births for the holy life
                never names Uttarakuru at all (AN 8.29). It is the commentary, not the canon, that names the
                Uttarakurukas incapable of the path, groups them with Māra, and reads their effortless virtue
                as the reason it cannot be cultivated. The decisive addition seems to be soteriological rather
                than ethnographic.
              </p>
              <p>
                What follows reads the continent forward through the strata in which it is described,
                earliest to latest: in the early discourses, a name in a list; in the late canon, a place
                described and then visited; in the Abhidhamma, the boundary debated; in the commentaries, the
                place measured and the verdict named; and in the sub-commentaries and the modern reading, the
                bar re-hardened. A trailing section opens the full feature-by-feature census beneath that
                narrative for any reader who wants the underlying enumeration.
              </p>

              {ag.mula_early_vs_late && (
                <div style={aidPanel}>
                  <p style={{ margin: '0 0 8px', fontVariant: 'small-caps', letterSpacing: '0.04em', color: 'var(--bc-accent)', fontWeight: 600 }}>
                    The canonical label conceals a split
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    The structural tag "canonical" marks a row's position in the edited corpus, not its date,
                    and the canon is itself layered. Once a row's chronological stratum is read from its work
                    and register rather than from its shelf, the canonical frame divides: of the{' '}
                    {ag.layer_count.mula} structurally-mūla rows, only{' '}
                    <strong>{ag.mula_early_vs_late['early-canonical']}</strong> read as genuinely
                    early-canonical (the bare name in a list or a comparison); the other{' '}
                    <strong>{ag.mula_early_vs_late['late-or-later']}</strong> carry the canonical tag while
                    reading late-canonical, Abhidhamma, paracanonical, or commentary-era by composition. The
                    literal-place reading is thinner in the terse early registers and more concrete in the
                    later and more narrative ones, a gradient that is partly a restatement of how the strata
                    were defined, and so not, by itself, a proof of change over time.
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    The ethnographic template seems to be shared across traditions (the Aggañña rice has
                    Mahāvastu, Mūlasarvāstivāda, Chinese and Sanskrit parallels); the soteriological judgement
                    has no linked non-Pāli parallel, so on the evidence to hand it reads as local to the Pāli,
                    which is not the same as saying it was invented there. At no stratum does the canon place
                    the geography under its own test of directly-verified knowledge. The place grows more
                    concrete without ever growing more warranted.
                  </p>
                  <p style={{ ...tinyNote, margin: 0 }}>
                    Three readers coded each row's textual layer and stratum independently and reconciled the
                    codings; agreement was high, and highest on the chronological-stratum reading the gradient
                    turns on:{' '}
                    {Object.entries(rel.signature_iaa || {}).map(([k, v], i) => `${i ? ' · ' : ''}${k.replace(/_/g, ' ')} ${v}`).join('')}.
                  </p>
                </div>
              )}
              <p style={methodNote}>
                How these were found, briefly. The search ran over the live canonical and commentarial corpus,
                with the Chaṭṭha Saṅgāyana recension as the base edition; every claim resolves to a live corpus
                row, and clicking any citation opens it in the reader. Counts are read from the dataset, and
                each is a measured floor rather than a closed tally. Where the corpus carries English (the
                SuttaCentral mūla rows) the rendering is Sujato's; the commentary and the Pāli-only
                Visuddhimagga rows carry no English in the corpus, so those renderings are the author's own
                gloss, marked as such and checked against the standard translations. Where the absence of a
                feature is decisive, it was reconfirmed by direct database counts and searched
                concept-first, without the proper name. Three readers coded each feature independently and the
                codings were reconciled; agreement was {rel.unanimous_h0h1} of {rel.features} on the
                canon-versus-commentary reading (Fleiss <em>κ</em> = {rel.fleiss_kappa}, almost perfect) and
                {' '}{rel.warrant_agreement} on the warrant. Every "no canonical warrant" reading means none
                was located, not that none can exist; the limitations note states the recall floor that bounds it.
              </p>

              <h2 style={h2}>In the early discourses</h2>
              <p>
                At the earliest layer the continent is barely more than a name. The most common error a modern
                reader brings to Uttarakuru is to imagine it as a separate world floating in space, or as one
                more destiny in the cycle of rebirth beside the heavens and hells. The early texts draw both
                lines differently. Uttarakuru is one of four continents set in a single ocean around one
                central mountain, and the people born there are <em>manussā</em>, "humans," the same word the
                texts use for human beings here; in the comparison that ranks them, the gods are named as a separate class,
                never folded in with the continent-dwellers. So the early cosmos has a horizontal axis, the
                human plane spread across four continents in their salt sea, and a vertical one, the ladder of
                rebirth-destinies. Uttarakuru sits on the horizontal axis, a far country on the same earth
                reached only across the water, and that placement, not any later detail, is what the early
                canon actually warrants.
              </p>
              <p>
                The early-canonical floor is small and not uniform. Three discourses carry it. In two, the
                Cūḷanikāsutta and the Paṭhamakosalasutta (AN 3.80, AN 10.29), the name does the least possible
                work: Uttarakuru is one entry in a nested cosmology of a thousand world-systems, named off as
                one of the four and nothing more. The third, the Tiṭhānasutta (AN 9.21), is different in kind,
                and already carries the asymmetry the whole question turns on. The Uttarakuru humans surpass
                both the gods of the Thirty-Three and the humans of Jambudīpa in three respects, while
                Jambudīpa surpasses both in three respects of which the third is <em>idha
                brahmacariyavāso</em>, "the holy life is lived here." Even here the inhabitants get only bare
                predicate-words, without mine-making, without possessions, of fixed life-span, and the span,
                though fixed, is given no figure. The early canon offers a named continent, a propertyless
                people, a fixed-but-unmeasured life, and the bare soteriological ranking; nothing is located
                precisely, measured, visited, or described. Once a row's stratum is read from its work rather
                than its shelf, this early floor is the{' '}
                <strong>{ag.mula_early_vs_late['early-canonical']}</strong> of the {ag.layer_count.mula}{' '}
                structurally-canonical rows where shelving and composition agree; the other{' '}
                {ag.mula_early_vs_late['late-or-later']} read later than they are filed.
              </p>
              <p>
                A bare search is a trap, in two ways, and the way the continent was searched is itself part of
                the floor. The exact-match index finds {dis.exact_fts} rows. A substring search with a short
                final <em>u</em> finds {dis.short_u_substring}, but it silently drops the long-<em>ū</em>
                declined forms, <em>uttarakurūnaṃ</em> and <em>uttarakurūsu</em>, and those carry the canonical
                four-continent cosmology (AN 3.80, AN 10.29). Only the stem <em> uttarakur</em> finds the full
                {' '}{dis.by_layer.mula + dis.by_layer.attha + dis.by_layer.tika + dis.by_layer.anya}. The
                lesson is the study's own: a proper-name search is a recall instrument, and a careless one
                under-counts exactly the canonical stratum. And the syllable <em>kuru</em> then blurs three
                different things, which a careful study must keep apart before it counts anything.
              </p>
              <div style={aidPanel}>
                <p style={{ margin: '0 0 8px' }}><strong>Uttarakuru</strong>, the northern continent, the
                  target of this study.</p>
                <p style={{ margin: '0 0 8px' }}><strong>The Kuru country</strong> (<em>janapada</em>) in
                  Jambudīpa, at Kammāsadhamma, where the Buddha "dwells among the Kurus" and teaches the
                  Satipaṭṭhāna suttas. Bare <em>kuru</em> that is not the continent accounts for{' '}
                  {dis.confounds.kuru_not_uttarakuru} rows ({dis.excluded_breakdown.mula} canon,{' '}
                  {dis.excluded_breakdown.attha + dis.excluded_breakdown.tika} commentary,{' '}
                  {dis.excluded_breakdown.anya} extra-canonical), reported here as the blur and excluded.
                  These are a different referent, so excluding them does not bias the Uttarakuru count.</p>
                <p style={{ margin: 0 }}><strong>The <em>kuru-vatta</em></strong>, the moral observance of the
                  Kurudhamma Jātaka ({dis.confounds.kurudhamma_kuruvatta} rows, excluded). The tradition itself
                  fuses all three: see feature C1, where the commentary derives the Kuru country and its
                  five-precept observance from migrants out of Uttarakuru continent.</p>
              </div>

              <h2 style={h2}>In the late canon</h2>
              <p>
                Above the early floor the literal-place reading thickens, and on the corpus's stratum map it
                begins to thicken before any commentary speaks. First the continent is described: located by
                Mount Neru and peopled by humans who eat rice that ripens unsown, in the late protective chant
                of the Āṭānāṭiya (DN 32). The register is the governing fact here, since a protective chant
                tolerates a vivid concretisation that doctrinal-analytical prose does not, and the late canon's
                first solid picture of the place appears inside one. Then the continent is visited: in the
                verse of the Apadāna it is named in a roll of lands the arahants reach, and in the Vinaya's
                frame-narratives it becomes a place the Buddha flies to for alms. In the famine at Verañjā the
                elder Moggallāna offers to lift the whole community to Uttarakuru where the rice ripens unsown,
                and the Buddha forbids it; the land of effortless plenty is refused in favour of staying where
                the going is hard. The measured place, eight thousand yojanas across, and the exact
                thousand-year span belong one layer further out, to the commentary.
              </p>
              <p>
                The picture the late canon supplies is, for the most part, not the Pāli's own invention. Its
                defining motif, a people who neither sow nor plough and eat rice that ripens of itself
                (<em>akaṭṭhapāka-sāli</em>, "unploughed-ripening rice"), is the golden-age rice of the Aggañña
                account recapitulated, and that template is bedrock across recensions, resolving to witnesses
                in the Mahāvastu, a non-Pāli Vinaya, and Chinese. The described container travels too: the
                protective chant that gives Uttarakuru its mountain and its rice resolves to a Chinese
                parallel. But the external witness buys antiquity, not warrant. The described place is still
                flat background inside a ritual chant, never staked under any verification formula, and a
                parallel in another recension does nothing to upgrade that. Two short controls fix where the
                canon stands, and both bear on what later counts as a commentarial addition.
              </p>
              {['agganna_parallel', 'akkhana_control'].map((k) => {
                const blk = data.context[k];
                return (
                  <p key={k} style={aidNote}>
                    {blk.claim}
                    {blk.cites && blk.cites.length > 0 && (
                      <span style={{ display: 'block', marginTop: 4 }}>
                        {blk.cites.map((c, i) => <span key={c.id}>{i ? ' · ' : ''}<Cite id={c.id}>{c.label}</Cite></span>)}
                      </span>
                    )}
                  </p>
                );
              })}
              <p>
                The first control is the self-ripening rice: it is not unique to Uttarakuru, since the
                Aggañña-sutta gives the identical formula for the cosmic golden age, so the ethnography
                recapitulates a canonical template the commentary then echoes. The second, more
                consequentially, is the canonical inopportune-birth list, the eight <em>akkhaṇā asamayā
                brahmacariyavāsāya</em>, which does not name Uttarakuru at all. That list is the engine behind
                AN 9.21's "the holy life is lived here," and the canon runs it without the Uttarakurukas; their
                place in it, on the enumerated evidence, is the commentary's doing. The gradient here is held
                with a guard: the late assignments of DN 32 and the Vinaya alms-flight rest on a chant-genre
                label and a frame-story position, not on a date, and are coded at lower confidence, so the
                deepening is best stated as register-relative rather than as a proven chronology.
              </p>

              <h2 style={h2}>In the Abhidhamma</h2>
              <p>
                Alongside the late-canonical narrative branch runs a second late-canonical branch, scholastic
                rather than descriptive, and it is here that the canon first argues the question its later
                layers will turn into the verdict against Uttarakuru. The category in play is that of the
                <em> acchandika</em>, "lacking the wholesome desire-to-act," and the being <em>abhabba niyāmaṃ
                okkamituṃ</em>, "incapable of entering the path's certainty." It lives in the Kathāvatthu's
                Suddhabrahmacariya discussion, where it is deployed in a reductio aimed at the gods, not at the
                Uttarakurukas. The finding to mark is that within that long passage the disqualifying category
                and the continent's name fall in two wholly separate places: the canon possesses the category
                that will later bar the continent's people, but it spends that category on the devas and never
                joins it to the name. This is the first move of a longer trajectory. The Abhidhamma supplies
                the category; the act of pinning it to the continent waits for the layer above.
              </p>

              <h2 style={h2}>In the commentaries</h2>
              <p>
                Two things happen at the commentarial layer, and they pull in different directions. On the
                descriptive side the continent is finally measured: the Visuddhimagga gives it eight thousand
                yojanas across, each great continent ringed by five hundred small islands, and the canon's bare
                "fixed span" is closed to a figure, "settled at just a thousand years," a number the commentary
                supplied rather than recovered (the one canonical row pairing "a thousand years" with the
                continent assigns those years to a flowering creeper, not to the people). On the soteriological
                side the commentary at last names the verdict, identifying the Uttarakurukas with the
                disqualifying category the Abhidhamma had left unattached. This is the layer where the picture
                is most concrete, and so the right place to gather the thread that has run flat under every
                layer so far: the texts run an elaborate machinery for grading where a being is reborn and for
                marking whether such knowledge is directly seen, and the northern continent is never once
                placed inside it as a thing verified. The place becomes walkable, measurable, peopled, and
                ranked, and through all of it the geography keeps the same flat key. Of everything the texts say
                about Uttarakuru, the verified column is empty.
              </p>
              <p>
                If the descriptive furniture is borrowed, the judgement built on it is, on the evidence to
                hand, not. The whole soteriological load rests on AN 9.21, where the most fortunate humans in
                the cosmos hold precisely the comforts of virtue while the path is reserved for Jambudīpa,
                this continent. In the corpus's reference table this pivotal sutta has no non-Pāli parallel, so
                the specific ranking reads as local to the Pāli, and the move that fixes it sharpest is the
                commentary's. The guard belongs in print: "no linked parallel" is not "Theravāda-invented." A
                missing parallel is evidence about the reference table, which under-covers exactly the
                scholastic and cosmological genre where the likeliest analogue would sit, not affirmative
                evidence about the other early traditions. The right reading is Pāli-local pending
                verification, never Pāli-unique. A second, smaller commentarial move belongs here too: one
                canonical verse of remembered deeds says the speaker was reborn "in the Kurus"
                (<em>kurūsu</em>), which defaults to the Kuru country of the Indian plain, and only the
                commentary reads that locative into the continent. The same habit runs through the study, the
                later layer supplying what the canon leaves bare.
              </p>

              <h2 style={h2}>In the sub-commentaries and modern reading</h2>
              <p>
                The shallow end of the timeline completes the trajectory the canon began and the commentary
                advanced. Where the Kathāvatthu had softened the disqualifying category for the gods, and the
                commentary had pinned it to the Uttarakurukas, the sub-commentary re-hardens it against them,
                grouping the continent's people <em>mārādayo viya</em>, "like Māra and the rest," among those
                for whom the path is closed. In the same layer the continent takes its final shape, the square
                (<em>pīṭha</em>-shaped) continent whose inhabitants' faces match its outline, and the same hand
                finishes the <em>kurūsu</em>-as-Uttarakuru gloss. The full trajectory can now be stated whole:
                the canon debates the bar and softens it for the gods, the commentary identifies the
                Uttarakurukas with the barred category, and the sub-commentary re-hardens the bar against them
                in the same breath the canon had used to relieve the devas.
              </p>
              <p>
                It is worth a word on the vocabulary, because much of it is a modern frame the Pāli does not
                carry. The analytic terms throughout, "ethnography," "cosmology," "plane versus realm," "salt
                water versus space," "literal versus symbolic," are a modern overlay laid over a Pāli that says
                its own words. So is the reception of the nested thousandfold cosmology, the <em>lokadhātu</em>
                {' '}a modern reader is tempted to render "galaxy." And the "fortune, therefore disability"
                reading drawn across these layers is the present author's reconstruction, synthesising glosses
                the commentary supplies separately, the natural virtue, the virtue fixed by rebirth there, the
                lack of the wholesome desire-to-act, into one inference, and flagged as such rather than
                presented as a single canonical or commentarial statement.
              </p>
              <p>
                For a reader who is not a specialist, that last move is the human point. The texts take the
                cosmos's most fortunate humans, with no possessions to quarrel over, a fixed long life, and a
                beauty that never ages, and make them the worst-placed of all for awakening: a virtue that
                arrives automatically with the address is a virtue never undertaken, and a virtue never
                undertaken cannot be cultivated into a path. The fortune is the disability. The most one can
                say with confidence is the smallest thing and the steadiest: the texts grow more sure of what
                Uttarakuru looks like, and never once claim to have seen it. The comfort is real; the path,
                they say, is lived here (<em>idha brahmacariyavāso</em>).
              </p>

              <h2 style={h2}>The complete census</h2>
              <p style={tableCaption}>
                The narrative above rests on a full enumeration of every Uttarakuru-bearing row, scored
                feature by feature. The detail follows for any reader who wants the underlying count: the
                feature matrix across the four textual bands, the canon-versus-commentary tally, the paradox
                read close, and the limits and references. Every citation opens the passage in the reader, and
                every expandable "evidence" panel gives the verbatim Pāli.
              </p>

              <h3 style={h3}>The feature matrix</h3>
              <p style={tableCaption}>
                Each feature scored across four bands. <em>Canon</em> = Tipiṭaka mūla; <em>Para-canon</em> =
                the Visuddhimagga and Milindapañha, which sit in the root-text role but speak with a
                post-canonical voice; <em>Comm.</em> = aṭṭhakathā; <em>Sub-comm.</em> = ṭīkā. Every cell's
                citations open the passage in the reader. The badge gives the canon-versus-commentary verdict;
                "evidence" expands the verbatim Pāli.
              </p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Feature</th>
                      {UBAND_KEYS.map((k) => <th key={k} style={thLeft} title={UBAND[k].full}>{UBAND[k].label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {['A', 'B', 'C'].map((seg) => {
                      const sd = data.segments.find((s) => s.key === seg);
                      const rows = [
                        <tr key={'h' + seg} style={{ background: 'rgba(var(--bc-accent-rgb), 0.05)' }}>
                          <td colSpan={5} style={{ ...tdLeftSm, padding: '9px 10px' }}>
                            <strong>§{seg}. {sd ? sd.title : ''}</strong>
                            <span style={{ display: 'block', ...bucketBlurb, padding: 0, margin: '3px 0 0' }}>{sd ? sd.blurb : ''}</span>
                          </td>
                        </tr>,
                      ];
                      for (const f of (bySeg[seg] || [])) {
                        rows.push(
                          <tr key={f.id} style={tr}>
                            <td style={{ ...tdLeftSm, minWidth: 190 }}>
                              <strong>{f.name}</strong>
                              <span style={{ display: 'block', marginTop: 4 }}>
                                <span style={uBadge(f.h0h1)}>{(UH[f.h0h1] || {}).label || f.h0h1}</span>
                                {f.warrant_label && <span style={{ ...tinyNote, marginLeft: 6 }}>warrant: {f.warrant_label}</span>}
                              </span>
                              {f.verbatim && f.verbatim.length > 0 && (
                                <span style={{ display: 'block', marginTop: 5 }}>
                                  <button style={evToggle} onClick={() => setOpen((o) => ({ ...o, [f.id]: !o[f.id] }))}
                                    aria-expanded={!!open[f.id]}>{open[f.id] ? 'Hide evidence' : 'Evidence'}</button>
                                </span>
                              )}
                            </td>
                            {UBAND_KEYS.map((k) => <UFeatureCell key={k} cell={f.cells[k]} />)}
                          </tr>
                        );
                        if (open[f.id] && f.verbatim) {
                          rows.push(
                            <tr key={f.id + '-ev'}>
                              <td colSpan={5} style={{ padding: '0 10px 6px' }}>
                                <div style={evDetail}>
                                  <p style={{ ...evField, margin: '0 0 8px' }}><span style={evFieldKey}>Gloss.</span> {f.gloss}</p>
                                  {f.verbatim.map((v, i) => (
                                    <div key={i} style={{ marginBottom: 10 }}>
                                      <p style={evPali}>{v.pali}</p>
                                      <p style={evEn}>{v.en}</p>
                                      <p style={evMeta}>
                                        <Cite id={v.id}>{v.label}</Cite>
                                        {' · '}{v.tr_provenance === 'sujato' ? 'tr. Sujato' : v.tr_provenance === 'author' ? "author's gloss" : v.tr_provenance}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      }
                      return rows;
                    })}
                  </tbody>
                </table>
              </div>

              <h3 style={h3}>What the count says</h3>
              <p>
                Of {nFeat} features, {ag.warrant_split.warranted} carry a canonical warrant and
                {' '}{ag.warrant_split.null} do not. Read by class: {ag.h0h1_tally['canonical-seed'] || 0} are
                canonical seeds the commentary elaborates faithfully; {ag.h0h1_tally['commentarial-detail'] || 0}
                {' '}fill a canonical frame with a specific figure; {ag.h0h1_tally['split'] || 0} are splits, where
                the canon gives a category and the commentary supplies a new identification or a hardening; and
                {' '}{ag.h0h1_tally['commentarial-innovation'] || 0} have no located canonical warrant. The
                last group is not random. It clusters in the vivid ethnography, the wish-trees, the perpetual
                climate, the flawless bodies, and in the two hardest soteriological moves: the fixed
                heaven-destiny, and, through the split at feature B3, the explicit ruling that the
                Uttarakurukas are incapable of the path.
              </p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead><tr><th style={thLeft}>Canon-vs-commentary class</th><th style={thNum}>Features</th></tr></thead>
                  <tbody>
                    {['canonical-seed', 'commentarial-detail', 'split', 'commentarial-innovation'].map((h) => (
                      <tr key={h} style={tr}><td style={tdLeft}><span style={uBadge(h)}>{UH[h].label}</span></td><td style={tdNum}>{ag.h0h1_tally[h] || 0}</td></tr>
                    ))}
                    <tr style={trTotal}><td style={tdLeft}>Total</td><td style={tdNum}>{nFeat}</td></tr>
                  </tbody>
                </table>
              </div>
              <p style={tableCaption}>
                The same shape shows in the raw enumeration. Of {nCensus} Uttarakuru-bearing rows, only{' '}
                {vs.canonical} are canonical Tipiṭaka, {vs['para-canon']} are para-canonical
                ({ag.para_subsplit.visuddhimagga} Visuddhimagga, {ag.para_subsplit.milindapanha} Milindapañha,
                which the Burmese tradition counts as canonical, and {ag.para_subsplit['extra-canonical']}{' '}
                other extra-canonical), and {vs.commentary} are commentary or sub-commentary. Two findings
                must be kept apart here. By text mass the picture is overwhelmingly commentarial. By concept,
                the frame is canonical: the frame-bearing DN 32 and the paradox-bearing AN 9.21 both sit among
                those {vs.canonical} rows. Uttarakuru is best described as a small canonical frame carrying a
                large commentarial superstructure.
              </p>

              <h3 style={h3}>The paradox, and who sharpened it</h3>
              <p>
                The hinge is a single sutta. AN 9.21 ranks three groups so that each surpasses the other two in
                three respects. The Uttarakurukas surpass the gods of the Thirty-Three and the humans of
                Jambudīpa by being without mine-making, without possessions, and of fixed lifespan. The gods
                surpass by divine span, beauty, and bliss. And the humans of Jambudīpa surpass both by courage,
                by mindfulness, and by this: that the holy life is lived here (<em>idha brahmacariyavāso</em>).
                The structure carries the thought by itself. Uttarakuru's three superiorities are exactly the
                comforts; Jambudīpa's third is the path. The most fortunate humans in the cosmos hold
                precisely the fruits of virtue, and the path is reserved for Jambudīpa.
              </p>
              <p>
                What the commentary adds is not the paradox but its verdict. The canonical Abhidhamma, in the
                Kathāvatthu's debate on where the holy life is lived, actually <em>softens</em> the "lived
                here": it argues that a non-returner completes the path among the gods of the Pure Abodes, so
                "here" cannot mean Jambudīpa alone. But the relief is carved out for the gods, not for
                Uttarakuru. The commentary then moves the other way. It slots the Uttarakurukas into the class
                of those who lack the very wish to practise (<em>acchandika</em>), declares them incapable of
                entering the path (<em>abhabba</em>), groups them with Māra as lacking the desire for nibbāna,
                and rules that for them the holy life is a thing of no-opportunity, attainable by the gods but
                not by them. The trajectory is not lenient canon hardening into harsh commentary. It is a
                canon that debates and partly softens, and a commentary that re-targets and hardens, precisely
                against Uttarakuru.
              </p>
              <p>
                The reason it gives is the study's quiet centre. Their virtue is real but automatic. The
                Visuddhimagga classes their non-transgression as natural virtue, morality fixed by being
                reborn there; the sub-commentary calls their whole effortless life "accomplished by nature."
                What is accomplished by nature cannot be undertaken, and what cannot be undertaken cannot be
                cultivated into a path. The comfort is not merely a distraction from renunciation. It is the
                structural absence of anything to renounce. That is the bar, seen from inside.
              </p>
              <p>
                This places the study within a known field rather than beside it. Collins read the Pāli
                imagination of felicity as a set of utopias that are, by design, soteriological dead ends, and
                Gethin read the cosmology as a map of meditative and moral states rather than a gazetteer. The
                quantified result here gives both a textual mechanism. The northern utopia is a dead end not
                because the texts say comfort distracts, but because the commentary reclassifies the comfort
                as virtue-by-nature, and virtue-by-nature, having no act behind it, has nothing to develop.
                The contribution is not the observation that Uttarakuru cannot practise, which is old, but the
                located demonstration that the canon supplies the felicity and the frame while the commentary
                supplies the disqualifying verdict and its reason.
              </p>

              <h3 style={h3}>Limitations</h3>
              <p>
                Several limits bound how far any of this can be pressed, and they are better stated than
                smoothed. The deepening-with-lateness gradient is partly definitional: the map that sorts
                works into strata leans on genre and register, and those cues co-vary with concreteness, so the
                gradient cannot by itself prove that the canon's conception of the place changed over time. Two
                of the pivotal late assignments (the protective chant of DN 32, the Vinaya alms-flight) are
                held at lower confidence on exactly that ground. The cross-recensional finding is link-level,
                not feature-level: the corpus bridges out through a reference table rather than through the
                external texts themselves, so a missing parallel for the soteriological judgement is evidence
                about that table, not affirmative evidence about the other early traditions. The recall floor
                is real: the first name search used a short-vowel substring that under-counted the canonical
                cosmology, and the corrected stem plus concept-first passes recovered it without any reading
                flipping, but a search can still miss a passage that names the continent by epithet alone, so
                each "no canonical warrant" means none was located rather than none can exist. The Kathāvatthu
                is canonical but the latest canonical stratum and already argumentative in style, a point the
                reading depends on and states. The wider Indic and Sanskrit Uttarakuru, the Mahābhārata's
                northern paradise and the Abhidharmakośa cosmology, is a horizon named here, not a witness
                used.
              </p>

              <h3 style={h3}>References</h3>
              <div style={refList}>
                <div style={refItem}>Collins, S. 1998. <em>Nirvana and Other Buddhist Felicities: Utopias of the Pali Imaginaire</em>. Cambridge: Cambridge University Press.</div>
                <div style={refItem}>Gethin, R. 1997. "Cosmology and meditation: from the Aggañña Sutta to the Mahāyāna." <em>History of Religions</em> 36.3.</div>
                <div style={refItem}>Kloetzli, R. 1983. <em>Buddhist Cosmology: From Single World System to Pure Land</em>. Delhi: Motilal Banarsidass.</div>
                <div style={refItem}>La Vallée Poussin, L. de. 1911. "Cosmogony and Cosmology (Buddhist)." In <em>Encyclopaedia of Religion and Ethics</em>, vol. 4. Edinburgh: T. & T. Clark.</div>
                <div style={refItem}>Sadakata, A. 1997. <em>Buddhist Cosmology: Philosophy and Origins</em>. Tokyo: Kōsei.</div>
                <div style={refItem}>Reynolds, F. and Reynolds, M. 1982. <em>Three Worlds According to King Ruang</em>. Berkeley: Asian Humanities Press.</div>
                <div style={refItem}>Anālayo, Bhikkhu. 2018. <em>Rebirth in Early Buddhism and Current Research</em>. Boston: Wisdom.</div>
              </div>

              <p style={footNote}>
                Uttarakuru census, version {data.meta.version}, snapshot {data.meta.corpus_snapshot}. Edition:
                {' '}{data.meta.edition} Every corpus citation resolves to a passage in the reader; counts are
                computed from the dataset.
              </p>
            </div>
          </>
          );
        })()}
      </article>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nāga study. Sibling to UttarakuruStudy: what the canon holds a nāga to be
// (ontology + soteriology) and how the commentary systematizes it. Reads
// public/research/naga.json (the referent ledger, the verified spine with
// verbatim evidence, the H0/H1 divergence cells, the full serpent census, and
// data-bound aggregates). Admin-gated. Counts in the prose are read from data.
// ---------------------------------------------------------------------------

const NREF_ORDER = ['serpent', 'elephant', 'person', 'epithet', 'citizen', 'tree', 'nonlexical', 'ambiguous'];
const NREF_LABEL = {
  serpent: 'serpent-being', elephant: 'elephant (the bull-tusker)', person: 'personal name (Nāgasena, Nāgita…)',
  epithet: 'epithet of a sage (folk etym. na + āgu)', citizen: 'citizen / urban (nāgara)', tree: 'tree (ironwood / betel)',
  nonlexical: 'morphological false friend', ambiguous: 'undecidable',
};
const NFACET = {
  birth_mode: 'Mode of birth (the four nāgayoni)', classification: 'Class and plane (animal status)',
  realm_habitat: 'Realm and habitat', lifespan: 'Lifespan and glory', power: 'Powers',
  karma_cause: 'The karma that makes one', diet_predation: 'Diet and predation',
  uposatha: 'Keeping the uposatha', hears_dhamma: 'Hearing the Dhamma, devotion', takes_human_form: 'Taking human form',
  magga_phala_ceiling: 'The path-ceiling', ordination_bar: 'The ordination bar', bodhisatta_as_naga: 'The bodhisatta as nāga',
};
const NSEG = {
  A_ontology: ['birth_mode', 'classification', 'realm_habitat', 'lifespan', 'power', 'karma_cause', 'diet_predation'],
  B_soteriology: ['uposatha', 'hears_dhamma', 'takes_human_form', 'magga_phala_ceiling', 'ordination_bar', 'bodhisatta_as_naga'],
};
function nBadge(v) {
  const m = {
    H0: { label: 'faithful (H0)', color: 'var(--bc-accent)', bg: 'rgba(var(--bc-accent-rgb), 0.07)', border: 'rgba(var(--bc-accent-rgb), 0.6)' },
    H1: { label: 'innovation (H1)', color: 'var(--bc-loss-text)', bg: 'transparent', border: 'rgba(var(--bc-loss-text-rgb), 0.45)' },
  };
  const c = m[v] || { label: v, color: 'var(--bc-text-secondary)', bg: 'transparent', border: 'rgba(var(--bc-accent-rgb), 0.3)' };
  return { fontSize: 10.5, fontWeight: 600, letterSpacing: '0.02em', borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap', border: '1px solid ' + c.border, color: c.color, background: c.bg };
}
const nLayerCols = ['mula', 'attha', 'tika', 'anya'];
const nLayerLabel = { mula: 'Canon', attha: 'Comm.', tika: 'Sub-comm.', anya: 'Extra-can.' };
// chronological strata, earliest to latest — the diachronic spine of the reader
const NSTRAT_ORDER = ['archaic-canonical', 'early-canonical', 'late-canonical', 'abhidhamma-canonical', 'paracanonical', 'classical-commentary', 'sub-commentary'];
const NSTRAT_LABEL = {
  'archaic-canonical': 'Archaic canonical (the oldest verse)',
  'early-canonical': 'Early canonical (sutta prose)',
  'late-canonical': 'Late canonical (KN verse-narrative, Vinaya frames)',
  'abhidhamma-canonical': 'Abhidhamma canonical',
  'paracanonical': 'Paracanonical (outside the Tipiṭaka)',
  'classical-commentary': 'Classical commentary (aṭṭhakathā)',
  'sub-commentary': 'Sub-commentary (ṭīkā)',
};

function NagaStudy({ entry, onBack, backLabel = 'Research' }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});
  const [openFacet, setOpenFacet] = useState({});

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

  const claimRows = useMemo(() => (data ? data.records.filter((r) => r.claim_bearing) : []), [data]);
  const byFacet = useMemo(() => {
    const m = {};
    for (const r of claimRows) (m[r.facet] || (m[r.facet] = [])).push(r);
    return m;
  }, [claimRows]);

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <article style={articleReadWrap}>
        <button onClick={onBack} style={backBtn} aria-label={`Back to ${backLabel} (Esc)`}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to {backLabel}</span>
          <span style={backBtnHint}>Esc</span>
        </button>

        {!data && !error && <p style={hint}>Loading…</p>}
        {error && <p style={errorHint}>Failed to load: {error.message}</p>}

        {data && (() => {
          const m = data.meta, ag = data.aggregates, led = ag.referent_ledger, hl = m.h_lex, iaa = m.iaa, hh = m.h0_h1;
          const strat = m.stratigraphy || {};
          const ev = ag.mula_early_vs_late || {};
          const mulaS = ag.mula_stratum || {};
          const stratSplit = ag.stratum_split || {};
          const sbl = ag.stratum_by_layer || {};
          const stratOrder = (strat.order && strat.order.length ? strat.order : NSTRAT_ORDER);
          const nSerp = data.records.length;
          const nClaim = claimRows.length;
          const candTotal = NREF_ORDER.reduce((s, k) => s + (led[k] ? led[k].total : 0), 0);
          const mulaLayer = (ag.serpent_by_layer && ag.serpent_by_layer.mula) || ((ev['early-canonical'] || 0) + (ev['late-or-later'] || 0));
          const fxl = ag.facet_x_layer;
          const spineBy = (seg) => data.spine.filter((s) => s.segment === seg);
          const spineByStrata = (arr) => data.spine.filter((s) => arr.indexOf(s.stratum) !== -1);
          const facetTotal = (f) => nLayerCols.reduce((s, k) => s + ((fxl[f] && fxl[f][k]) || 0), 0);
          return (
          <>
            <header style={articleHeader}>
              <h1 style={articleHeaderTitle}>{entry.title}</h1>
              <p style={articleHeaderAuthor}>{entry.subtitle}</p>
            </header>

            <div style={articleBody}>
              <p style={abstractLead}>
                <span style={abstractTag}>Abstract.</span> The nāga is the Pāli canon's exemplary liminal
                being: a serpent that keeps the sabbath, hears the Dhamma, and can take human shape, yet
                cannot win the path while it remains a nāga. This study asks what the canon holds a nāga to be,
                ontologically and soteriologically, and how the Aṭṭhakathā and Ṭīkā systematize that picture.
                A first finding is lexical and central: <em>nāga</em> is a heteronym, and a bare search is
                a trap. Of {candTotal} corpus rows carrying a genuine <em>nāga</em>-token, only {led.serpent.total}
                {' '}({Math.round((led.serpent.total / candTotal) * 100)} percent) use it of the serpent-being;
                the rest are the bull-elephant, the monk Nāgasena and his namesakes, the honorific of a sage,
                the citizen (<em>nāgara</em>), and the ironwood tree, over a base of morphological false friends
                (<em>samannāgata</em>, <em>anāgāmī</em>) that swamp the raw string. On the {led.serpent.total}
                {' '}serpent rows ({nClaim} of them asserting an ontological or soteriological claim), the result
                is a measured split, best put as <em>faithful on the bare facts, innovative in the apparatus</em>.
                The canon fixes, in the Buddha's own voice, the four modes of nāga-birth (SN 29), the animal
                (<em>tiracchāna</em>) destination, and the ceiling itself, which it even names
                (<em>nāgā aviruḷhidhammā</em>, "incapable of growth") and enacts in the Vinaya's bar on
                ordaining animals. The commentary supplies the machinery: an Abhidhamma rebirth-linking rooted
                in bad kamma, a water-dwelling frog-eating habitat, the expansion of the disguise-failure
                occasions from two to five, the broadening of "animal" to any non-human down to Sakka, and the
                doctrinal reason for the ceiling, that the nāga is <em>abhabba</em>, incapable of jhāna, insight,
                and path-and-fruit. Of {hh.decidable_cells} decidable canon-to-commentary cells, {hh.H0} are
                faithful and {hh.H1} are located innovations.
              </p>
              <p>
                What follows reads the nāga forward through the strata in which it is described, earliest to
                latest: in the early discourses, the four births and a ceiling left implicit; in the late canon,
                the ceiling named and enacted and the bodhisatta who is a virtuous nāga; in the Abhidhamma and
                the paracanon, the conduct-boundary drawn around the noble one; in the commentaries, the
                apparatus that gives the ceiling its reason; and in the sub-commentaries, the kamma-bookkeeping
                that reconciles a woeful birth with a deva's wealth. A trailing section opens the full
                enumeration, the heteronym table, the stratum counts, the canon-to-commentary cells, and the
                census, beneath that narrative for any reader who wants the underlying count.
              </p>

              {ev['early-canonical'] != null && (
                <div style={aidPanel}>
                  <p style={{ margin: '0 0 8px', fontVariant: 'small-caps', letterSpacing: '0.04em', color: 'var(--bc-accent)', fontWeight: 600 }}>
                    The canonical label conceals a split
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    The structural tag "canon" marks a row's shelf in the edited corpus, not its date, and the
                    canon is itself layered. Once a serpent row's chronological stratum is read from its work and
                    register rather than from its shelf, the canonical frame divides: of the {mulaLayer}{' '}
                    structurally-mūla serpent rows, only <strong>{ev['early-canonical']}</strong> read as
                    genuinely early-canonical (the four births of SN 29, the Udāna's Mucalinda, the oldest
                    verse); the other <strong>{ev['late-or-later']}</strong> carry the canonical tag while
                    reading late-canonical, Abhidhamma, paracanonical, or commentary-era by composition. The
                    sharpest case is the {mulaS['classical-commentary']} rows that are in fact the
                    Visuddhimagga, Buddhaghosa's classical commentary shelved in the corpus as a root text.
                  </p>
                  <p style={{ ...tinyNote, margin: 0 }}>
                    Stratum is coded independently of the mula/attha/tika layer, from each row's work and
                    within-work position. The early-or-archaic assignments that rest on genre or frame-position
                    rather than a secured date (the Vinaya frame-narratives, the late Dīgha protective and
                    assembly texts, the archaic verse collections) are coded at lower confidence, so the
                    deepening is best read as register-relative rather than as a proven chronology.
                  </p>
                </div>
              )}
              <p style={methodNote}>
                Every claim resolves to a live corpus row; click any citation to open it in the reader. Counts
                are read from the dataset. The candidate frame was built by direct database regex over the Pāli
                text, not the search lane, so a count is a count and not a search impression. Where the corpus
                carries English (the SuttaCentral mūla rows) the rendering is Sujato's, who translates
                {' '}<em>nāga</em> as "dragon"; the Vinaya Mahākhandhaka and all commentary carry no English in
                the corpus, so those renderings are the author's own gloss, marked as such and checked against
                Horner's <em>Book of the Discipline</em>. The ambiguous canonical rows were classified blind
                from the Pāli windows; a 124-row subsample was triple-coded to measure reliability, which was
                almost perfect (Fleiss <em>κ</em> = {iaa.fleiss_kappa}, {iaa.all_three_agree} unanimous). The
                remaining ambiguous rows and the commentary were single-coded against that validated codebook.
                The fourteen spine passages were quote-verified against the source; the other
                rows are confirmed to exist as live passages but their quotes were not individually
                re-confirmed. Every "no canonical warrant" verdict is read as located, not absolute; the
                Limitations state the recall floor that bounds it.
              </p>

              <h2 style={h2}>In the early discourses</h2>
              <p>
                Before anything can be placed in time, the word must be disambiguated, and the size of that
                problem is itself a result. A reader who searches the corpus for <em>nāga</em> meets a wall that
                is mostly not about serpents at all: in the canon alone the bare substring occurs in
                {' '}{hl.canon_substring_nāga_rows.mula} rows, but {hl.canon_morphological_noise_pct} percent of
                those are morphological accidents (<em>samannāgata</em>, "endowed with"; <em>anāgāmī</em>,
                "non-returner"), and past that filter the genuine word is still a heteronym with at least five
                live senses. The full sense-by-layer count is given under <em>The full data</em> below; only the
                serpent-being is this study's subject, and the rest of this section reads the earliest layer of
                what the canon says of it.
              </p>
              <p>
                At that earliest layer the ontology of the nāga is compact and is given in the Buddha's voice.
                The Nāgasaṃyutta (SN 29) opens by fixing the four <em>nāgayoni</em>, the four modes by which
                nāgas are born, from an egg, from a womb, from moisture, and spontaneously, and it ranks them,
                the spontaneous highest. The same collection states their nature in three words that recur as
                the object of longing throughout the canon, <em>dīghāyukā vaṇṇavanto sukhabahulā</em>:
                long-lived, beautiful, abounding in happiness. One is reborn among them, SN 29 says, by a precise
                recipe: mixed conduct of body, speech, and mind, plus having heard of the nāgas' glory, plus the
                aspiration to it, plus an act of giving. Its powers, the coils and the hood, the dwelling
                (<em>bhavana</em>) it emerges from, and above all the shape-shift into human form, are shown
                rather than catalogued, most beautifully in the nāga-king Mucalinda who sheltered the newly
                awakened Buddha through seven days of storm and then took the form of a brahmin youth to worship
                him.
              </p>
              <p>
                The ceiling is already present here, but only by implication. SN 29 shows nāgas keeping the
                uposatha, reflecting on their past conduct and resolving to do better; yet the highest a nāga
                aspires to in these discourses is a heavenly rebirth, never the path. The moral nāga of the early
                canon is a being with the fruits of merit reaching toward more of the same, and the limit on it
                is shown by what it is never made to want. Read by stratum rather than by shelf, this early floor
                is the {ev['early-canonical']} of the {mulaLayer} structurally-canonical serpent rows where
                shelving and composition agree, the four-births suttas, the Udāna, and the oldest verse of the
                Suttanipāta and the gāthā collections; the other {ev['late-or-later']} read later than they are
                filed.
              </p>
              {spineByStrata(['early-canonical', 'archaic-canonical']).length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={tableCaption}>The verified early-canonical spine. Each row's citation opens the passage; "evidence" expands the verbatim Pāli.</p>
                  {spineByStrata(['early-canonical', 'archaic-canonical']).map((s) => <NSpineRow key={s.id} s={s} open={open} setOpen={setOpen} />)}
                </div>
              )}

              <h2 style={h2}>In the late canon</h2>
              <p>
                Above that floor two things the early discourses leave implicit are made explicit, and both come
                down inside the later canonical strata. First the cosmological place is fixed. The
                Āṭānāṭiya-sutta sets the nāga-host as one of the four guardian armies of the quarters, beside the
                yakkhas, gandhabbas, and kumbhaṇḍas (<Cite id="dn32">DN 32</Cite>), and the Mahāsamaya lists the
                nāgas among the orders of beings gathered before the Buddha and has him make peace between the
                nāgas and their standing enemy the garuḷa (<Cite id="dn20">DN 20</Cite>). The register is
                decisive here: both are protective and assembly texts, the late-canonical layer of the Dīgha,
                and the nāga's first solid placement in the cosmic census comes inside one.
              </p>
              <p>
                Then the ceiling is named. When an actual nāga, weary of the nāga-birth and longing for human
                state, takes a young man's form and gets himself ordained, the Vinaya's Mahākhandhaka has the
                Buddha tell him, in his own voice, <em>tumhe khottha nāgā aviruḷhidhammā imasmiṁ
                dhammavinaye</em>, "you nāgas are of non-growth-nature in this Dhamma-Vinaya," name the two
                occasions on which a nāga's disguise fails, and lay down that an animal may not be ordained, and
                if ordained must be expelled. The ceiling is therefore not merely enacted by a rule; it is
                named. What this layer does not give is the reason. The Vinaya frame-narratives, like the late
                Dīgha texts, are coded late-canonical at lower confidence, a frame-position label rather than a
                secured date, but the naming itself is unambiguous and canonical.
              </p>
              <p>
                The same stratum carries the bodhisatta who is a virtuous nāga. The Jātakas, gāthā shelved in a
                late-canonical collection, repeatedly make the bodhisatta a nāga-king who keeps the precepts in
                that birth, Campeyya, Bhūridatta, Saṅkhapāla; and the same texts are clear that he does so to
                perfect his virtue toward a future human awakening, never to awaken as a nāga. The Apadāna,
                Buddhavaṃsa, Niddesa, and Khuddakapāṭha add their witnesses in the same late-canonical register.
                This is the layer where the soteriological picture is stated most fully in canonical voice, and
                it is, by composition, late.
              </p>
              {spineByStrata(['late-canonical']).length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={tableCaption}>The verified late-canonical spine.</p>
                  {spineByStrata(['late-canonical']).map((s) => <NSpineRow key={s.id} s={s} open={open} setOpen={setOpen} />)}
                </div>
              )}

              <h2 style={h2}>In the Abhidhamma and the paracanon</h2>
              <p>
                Between the suttas and the commentary sits a thin but real scholastic layer. In the Kathāvatthu's
                Duggatikathā, the discourse on bad destinies, the canon draws a conduct-boundary around the noble
                one: a view-attained person (a stream-enterer) cannot take a nāga-maiden or accept animals
                (<Cite id="kv12.9">KV 12.9</Cite>). The nāga is here fixed not by a new property but by exclusion,
                placed outside the ties a noble disciple may form, which is the soteriological ceiling restated
                as a rule of association. The paracanonical Peṭakopadesa adds the converse image, the Buddha
                teaching devas, nāgas, and yakkhas the Dhamma each in its own tongue (<Cite id="pe2">PE 2</Cite>).
                These are the {mulaS['abhidhamma-canonical'] || 0} Abhidhamma-canonical and
                {' '}{mulaS['paracanonical'] || 0} paracanonical serpent rows shelved as mūla; small in number,
                they are the hinge between the suttas' implicit ceiling and the commentary's explicit doctrine of
                it.
              </p>

              <h2 style={h2}>In the commentaries</h2>
              <p>
                The commentary's additions are detail laid over a canonical frame, and where they go beyond the
                frame they go in one direction, toward system. The Samantapāsādikā gives the nāga an Abhidhamma
                classification the suttas never state, a rebirth-linking consciousness rooted in the result of
                bad kamma, so that for all its deva-like lordship the nāga is technically a woeful rebirth; and
                it furnishes the habitat the suttas leave blank, a creature that moves in water and eats frogs.
                The four-births commentary (the Catuyonivaṇṇanā) sets the nāga's four <em>yoni</em> into a full
                cosmological scheme of who is born how, and cross-refers the canonical four supaṇṇa-births. The
                pattern is the study's thesis in miniature: the canon states that the nāga is born four ways and
                is an animal; the commentary explains, classifies, and furnishes.
              </p>
              <p>
                Here too the canon's named ceiling is at last given its reason. The Samantapāsādikā glosses
                {' '}<em>aviruḷhidhamma</em> by supplying its content: the nāgas are of non-growth-nature
                {' '}<em>because of their incapacity</em> (<em>abhabbattā</em>) <em>for jhāna, insight, and
                path-and-fruit</em>. Two further commentarial moves harden the same wall. The canon gives two
                occasions on which a nāga's disguise fails; the commentary makes them five, adding rebirth, the
                shedding of the skin, and death. And the canon's word <em>tiracchānagata</em>, "animal," is read
                as any non-human whatsoever, "down to Sakka the king of the gods," so that the bar that begins as
                a rule about animals becomes a rule about the not-human. The nāga is thus the clearest single
                case of a principle the canon holds quietly and the commentary states loudly, that a human birth
                is the needed basis for the path.
              </p>
              <p>
                This is also where the layer-and-stratum split bites hardest. The Visuddhimagga's account of
                Moggallāna taming the nāga-king Nandopananda, and its other nāga passages, are shelved in the
                corpus as mūla, root-text, yet they are Buddhaghosa's own fifth-century composition;
                {' '}{mulaS['classical-commentary']} of the canonical-tagged serpent rows are in fact classical
                commentary. Across the full enumeration the same shape holds: the commentary carries the great
                bulk of every facet, and most heavily the facets of furnishing, habitat and power, where there is
                most to invent. The facet-by-layer table is given under <em>The full data</em> below.
              </p>
              {spineByStrata(['classical-commentary']).length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={tableCaption}>The verified commentarial spine, the apparatus laid over the canonical frame.</p>
                  {spineByStrata(['classical-commentary']).map((s) => <NSpineRow key={s.id} s={s} open={open} setOpen={setOpen} />)}
                </div>
              )}

              <h2 style={h2}>In the sub-commentaries and the modern reading</h2>
              <p>
                The shallow end of the timeline does the bookkeeping. The Ṭīkā's main work on the nāga is to
                reconcile a tension the commentary's own classification creates: if the nāga is a woeful
                rebirth, how does it enjoy a deva's wealth, golden colour, and sweet voice? The sub-commentary
                answers that those enjoyments are the fruit of <em>wholesome</em> sense-sphere kamma even within
                the lower destiny, so the mixed lot of the nāga is split cleanly along the kamma that produces
                each half; it places the nāga-realm among the abodes "below," with the hells; and the
                Visuddhimagga-mahāṭīkā keeps the narrative thread, the nāgas Cūḷodara and Mahodara made
                venom-free and established in the refuges and precepts. The sub-commentary completes the
                systematizing the Aṭṭhakathā began, and adds no new bar.
              </p>
              <p>
                The result places the nāga within a field that has long read it as ambiguous, and gives that
                reading a mechanism on an axis the field has not measured. Bloss's study of the Buddha and the
                nāga and DeCaroli's account of spirit-deity religion both locate the nāga's subordination in the
                cultic and narrative register: the pre-Buddhist water-deity converted, tamed, made a protector
                and donor, its worship redirected to the Buddha. That register is real and is not what this study
                counts. This study measures a different axis, the classificatory and soteriological one, what the
                texts say a nāga ontologically is and whether it can win the path; and there the ambiguity is not
                evenly distributed across the tradition. The canon already does the decisive work, classing the
                nāga as an animal and naming its incapacity; the figure is liminal in the suttas, not only in
                later devotion. The commentary's contribution is not the subordination but its system: the
                doctrinal reason (<em>abhabba</em>), the Abhidhamma rebirth-linking, and the generalization of
                the bar from animals to all non-humans. Appleton's reading of the nāga-king Jātakas fits
                precisely here: the bodhisatta can be a virtuous nāga, but his virtue there is always oriented
                toward a future human birth, which is the soteriology of the ceiling told as narrative. The nāga
                is the canon's sharpest image of a being that has the fruits of merit, long life, beauty, and
                happiness, without the one opportunity that matters.
              </p>

              <h2 style={h2}>The full data</h2>
              <p style={tableCaption}>
                The narrative above rests on a full enumeration of every serpent-being row. The detail follows
                for any reader who wants the underlying count: the heteronym disambiguation, the stratum counts
                the diachronic reading turns on, the canon-to-commentary cells read close, the full claim-bearing
                census, and the limits and references. Every citation opens the passage in the reader.
              </p>

              <h3 style={h3}>One word, many beings</h3>
              <p>
                A naive reader who searches the corpus for <em>nāga</em> meets a wall that is mostly not about
                serpents at all. In the canon alone the bare substring occurs in
                {' '}{hl.canon_substring_nāga_rows.mula} rows, but {hl.canon_morphological_noise_pct} percent of
                those are morphological accidents: <em>samannāgata</em> ("endowed with"), <em>anāgata</em>
                {' '}("future"), <em>anāgāmī</em> ("non-returner"), all built on <em>āgata</em> ("come"), in
                which the letters <em>n-ā-g-a</em> are a seam between morphemes and carry no nāga. Past that
                filter the genuine <em>nāga</em>-word is still a heteronym with at least five live senses. The
                table gives the full count across the four textual layers, classified by sense; only the first
                row, the serpent-being, is this study's subject.
              </p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Sense of <em>nāga</em></th>
                      {nLayerCols.map((k) => <th key={k} style={thNum}>{nLayerLabel[k]}</th>)}
                      <th style={thNum}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NREF_ORDER.filter((k) => led[k]).map((k) => (
                      <tr key={k} style={k === 'serpent' ? { ...tr, background: 'rgba(var(--bc-accent-rgb), 0.06)' } : tr}>
                        <td style={tdLeft}>{k === 'serpent' ? <strong>{NREF_LABEL[k]}</strong> : NREF_LABEL[k]}</td>
                        {nLayerCols.map((c) => <td key={c} style={tdNum}>{led[k][c]}</td>)}
                        <td style={tdNum}>{k === 'serpent' ? <strong>{led[k].total}</strong> : led[k].total}</td>
                      </tr>
                    ))}
                    <tr style={trTotal}>
                      <td style={tdLeft}>All genuine <em>nāga</em>-token rows</td>
                      {nLayerCols.map((c) => <td key={c} style={tdNum}>{NREF_ORDER.reduce((s, k) => s + (led[k] ? led[k][c] : 0), 0)}</td>)}
                      <td style={tdNum}>{candTotal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={tableCaption}>
                The serpent-being is {led.serpent.total} of {candTotal} genuine rows, and {led.serpent.mula} of
                the canon's {NREF_ORDER.reduce((s, k) => s + (led[k] ? led[k].mula : 0), 0)}. The two largest
                rival senses are instructive. <em>Person</em> is dominated by the monk Nāgasena of the
                Milindapañha; <em>elephant</em> is the noble tusker of simile, "the king's nāga." Both are why a
                bare count of "nāga in the canon" overstates the serpent by an order of magnitude. That the same
                word names the serpent, the elephant, and the sinless one is not noise to be discarded but a
                fact about the language, recorded here as the study's first finding.
              </p>

              <h3 style={h3}>By textual stratum</h3>
              <p>
                The diachronic reading rests on a chronological stratum coded for every row from its work and
                position, independently of the mula/attha/tika shelf. The table reads the full census by
                stratum, earliest to latest, with the structural layers each stratum draws from. The
                analytically interesting cells are the canonical (mūla) rows that do not read early: of the
                {' '}{mulaLayer} structurally-mūla serpent rows, {ev['early-canonical']} are early-canonical and
                {' '}{ev['late-or-later']} read later than they are shelved ({ev['layer_stratum_disagree']} carry
                a layer-stratum disagreement).
              </p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr><th style={thLeft}>Chronological stratum</th>{nLayerCols.map((k) => <th key={k} style={thNum}>{nLayerLabel[k]}</th>)}<th style={thNum}>Total</th></tr>
                  </thead>
                  <tbody>
                    {stratOrder.filter((k) => stratSplit[k]).map((k) => (
                      <tr key={k} style={tr}>
                        <td style={tdLeft}>{NSTRAT_LABEL[k] || k}</td>
                        {nLayerCols.map((c) => <td key={c} style={tdNum}>{(sbl[k] && sbl[k][c]) || 0}</td>)}
                        <td style={tdNum}>{stratSplit[k]}</td>
                      </tr>
                    ))}
                    <tr style={trTotal}>
                      <td style={tdLeft}>All serpent rows</td>
                      {nLayerCols.map((c) => <td key={c} style={tdNum}>{stratOrder.reduce((s, k) => s + ((sbl[k] && sbl[k][c]) || 0), 0)}</td>)}
                      <td style={tdNum}>{stratOrder.reduce((s, k) => s + (stratSplit[k] || 0), 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={tableCaption}>
                Commentary rows take the structural layer as a coarse stratum (Aṭṭhakathā as classical
                commentary, Ṭīkā as sub-commentary, extra-canonical as paracanonical); the independence is
                decisive within the canonical rows, where {mulaS['classical-commentary']} mūla-shelved rows
                are in fact the Visuddhimagga, {mulaS['late-canonical']} are late-canonical, {mulaS['abhidhamma-canonical'] || 0}
                {' '}Abhidhamma, and {mulaS['paracanonical'] || 0} paracanonical. The register-relative
                assignments are held at lower confidence, as the Limitations note.
              </p>

              <h3 style={h3}>Canon and commentary, cell by cell</h3>
              <p>
                The distributional result has a qualitative mechanism, which a close reading of the decisive
                cells makes precise. These cells are the claims where both a canonical locus and a commentarial
                treatment sit on the verified spine; they are an analyst-selected set, not a warrant-tally over
                every commentarial claim, so the count characterizes the spine, not the whole census. For each
                cell the test is whether a canonical passage warrants what the commentary says. The faithful
                cells (H0) are the bare facts: the four births, the lifespan, the uposatha, the cause of
                rebirth, the shape-shift, all of which the commentary glosses without exceeding. The located
                innovations (H1) cluster, and they cluster tellingly, in the apparatus: the Abhidhamma
                rebirth-linking, the physical habitat, the doctrinal ground of the ceiling, the expanded
                reversion list, and the broadened category of the barred. Across the {hh.decidable_cells}
                {' '}decidable cells, {hh.H0} are faithful and {hh.H1} are located innovations; each "none
                located" refutes a warrant search, not a doctrinal entailment.
              </p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr><th style={thLeft}>Claim</th><th style={thLeft}>Canon</th><th style={thLeft}>Commentary</th><th style={thLeft}>Verdict</th></tr>
                  </thead>
                  <tbody>
                    {data.h0_h1_cells.map((c, i) => (
                      <tr key={i} style={tr}>
                        <td style={tdLeftSm}><strong>{c.cell}</strong><span style={{ ...tinyNote, display: 'block', marginTop: 3 }}>{c.note}</span></td>
                        <td style={tdLeftSm}>{c.canon ? <Cite id={c.canon}>{c.canon}</Cite> : <span style={tinyNote}>none located</span>}</td>
                        <td style={tdLeftSm}>{c.commentary ? <Cite id={c.commentary}>{c.commentary}</Cite> : <span style={tinyNote}>·</span>}</td>
                        <td style={tdLeftSm}><span style={nBadge(c.verdict)}>{(c.verdict === 'H0' ? 'faithful (H0)' : c.verdict === 'H1' ? 'innovation (H1)' : c.verdict)}</span></td>
                      </tr>
                    ))}
                    <tr style={trTotal}><td style={tdLeft} colSpan={3}>Decidable cells: H0 faithful / H1 innovation</td><td style={tdLeftSm}>{hh.H0} / {hh.H1}</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                The same shape appears in the full enumeration, not just the curated cells. Across the
                {' '}{nClaim} claim-bearing serpent passages, the commentary carries the great bulk of every
                facet, and most heavily the facets of furnishing. The table reads the claim-bearing census by
                facet and layer; the ontological facets of habitat and power, where there is most to invent,
                are the most lopsided toward the commentary.
              </p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr><th style={thLeft}>Facet</th>{nLayerCols.map((k) => <th key={k} style={thNum}>{nLayerLabel[k]}</th>)}<th style={thNum}>Total</th></tr>
                  </thead>
                  <tbody>
                    {['A_ontology', 'B_soteriology'].map((seg) => ([
                      <tr key={'h' + seg} style={{ background: 'rgba(var(--bc-accent-rgb), 0.05)' }}>
                        <td colSpan={6} style={{ ...tdLeftSm, padding: '8px 10px' }}>
                          <strong>{seg === 'A_ontology' ? '§A  Ontology, what a nāga is' : '§B  Soteriology, the ceiling'}</strong>
                        </td>
                      </tr>,
                      ...NSEG[seg].filter((f) => fxl[f]).map((f) => (
                        <tr key={f} style={tr}>
                          <td style={tdLeft}>{NFACET[f]}</td>
                          {nLayerCols.map((k) => <td key={k} style={tdNum}>{(fxl[f] && fxl[f][k]) || 0}</td>)}
                          <td style={tdNum}>{facetTotal(f)}</td>
                        </tr>
                      )),
                    ]))}
                  </tbody>
                </table>
              </div>

              <h3 style={h3}>The full census</h3>
              <p style={tableCaption}>
                Every claim-bearing serpent passage, grouped by facet. Counts are from the dataset; each
                citation opens the passage in the reader. Expand a facet to see its instances.
              </p>
              {['A_ontology', 'B_soteriology'].map((seg) => (
                <div key={seg} style={{ marginTop: 6 }}>
                  <p style={{ ...bucketBlurb, margin: '10px 0 4px' }}><strong>{seg === 'A_ontology' ? '§A  Ontology' : '§B  Soteriology'}</strong></p>
                  {NSEG[seg].filter((f) => byFacet[f]).map((f) => (
                    <div key={f} style={{ marginBottom: 4 }}>
                      <button style={evToggle} onClick={() => setOpenFacet((o) => ({ ...o, [f]: !o[f] }))} aria-expanded={!!openFacet[f]}>
                        {openFacet[f] ? '▾' : '▸'} {NFACET[f]} ({byFacet[f].length})
                      </button>
                      {openFacet[f] && (
                        <ul style={{ margin: '4px 0 8px 16px', padding: 0, listStyle: 'none' }}>
                          {byFacet[f].map((r) => (
                            <li key={r.id} style={{ marginBottom: 5, fontSize: 13.5, lineHeight: 1.5 }}>
                              <Cite id={r.id}>{r.citation || r.id}</Cite>
                              <span style={{ ...tinyNote, marginLeft: 6 }}>[{r.layer}{r.stratum ? ' · ' + r.stratum : ''}]</span>
                              {r.claim && <span> {r.claim}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              <h3 style={h3}>Limitations</h3>
              <p>
                This is a high-recall lexical census on the <em>nāga</em>-word with a measured recall floor,
                not a proof of completeness. The frame is the broad <em>nāg</em>-string minus the morphological
                false friends, classified by sense; its floor lies in one place, the material that speaks of
                nāgas under the ordinary snake words (<em>ahi</em>, <em>sappa</em>, <em>āsīvisa</em>,
                <em> uraga</em>, <em>bhujaga</em>) without the term <em>nāga</em>. That floor was measured, not
                only named: a sweep of those words (overwhelmingly literal snakes) found at most six canonical
                rows carrying nāga-being markers under a snake-synonym without a <em>nāga</em>-token, and a
                reconciliation against the named nāga-kings (Mucalinda, Bhūridatta, Erakapatta, Saṅkhapāla,
                Nandopananda, Apalāla, Campeyya) passed, all resolving in the census. The residual is small,
                bounded, and real, and every "no canonical warrant" verdict refutes a located warrant, not a
                doctrinal entailment. A 124-row subsample of the canonical ambiguous rows was triple-coded with
                almost-perfect agreement; the rest of the ambiguous rows and the whole commentary were
                single-coded against that validated codebook, so the commentary's sense-counts carry the
                codebook's reliability but not a per-row second opinion. The warrant-by-cell test is a close
                reading of the central spine, not a tally over every commentarial claim. The chronological
                stratum is coded from each row's work and position; where the assignment rests on genre or
                frame-position rather than a secured date (the Vinaya frame-narratives, the late Dīgha
                protective and assembly texts, the archaic verse), it is held at lower confidence, so the
                deepening-with-lateness reading is register-relative rather than a proven chronology. The voice
                axis (the Buddha versus narrative versus commentary) is an approximate tag from each row's
                source; the canon-versus-commentary layer axis, which carries the argument, is exact. The
                cross-tradition nāga (the Mahāvastu and the Sanskrit Vinaya on ordaining the non-human) and the
                nāga of the relic cult, the natural home of the cultic subordination Bloss describes, are
                horizons named here, not witnesses used.
              </p>

              <h3 style={h3}>References</h3>
              <div style={refList}>
                <div style={refItem}>Vogel, J. P. 1926. <em>Indian Serpent-Lore, or the Nāgas in Hindu Legend and Art</em>. London: Arthur Probsthain.</div>
                <div style={refItem}>Bloss, L. W. 1973. "The Buddha and the Nāga: A Study in Buddhist Folk Religiosity." <em>History of Religions</em> 13.1: 36–53.</div>
                <div style={refItem}>DeCaroli, R. 2004. <em>Haunting the Buddha: Indian Popular Religions and the Formation of Buddhism</em>. New York: Oxford University Press.</div>
                <div style={refItem}>Appleton, N. 2010. <em>Jātaka Stories in Theravāda Buddhism: Narrating the Bodhisatta Path</em>. Farnham: Ashgate.</div>
                <div style={refItem}>Horner, I. B. 1951. <em>The Book of the Discipline (Vinaya-Piṭaka), Vol. IV (Mahāvagga)</em>. London: Luzac.</div>
                <div style={refItem}>Collins, S. 1998. <em>Nirvana and Other Buddhist Felicities: Utopias of the Pali Imaginaire</em>. Cambridge: Cambridge University Press.</div>
                <div style={refItem}>Malalasekera, G. P. 1937–38. <em>Dictionary of Pāli Proper Names</em>. London: John Murray.</div>
              </div>

              <p style={footNote}>
                Nāga census, version {m.version}, snapshot {m.corpus_snapshot}. {nSerp} serpent-being rows,
                {' '}{nClaim} claim-bearing; referent agreement Fleiss <em>κ</em> = {iaa.fleiss_kappa}. Every
                corpus citation resolves to a passage in the reader; counts are computed from the dataset.
              </p>
            </div>
          </>
          );
        })()}
      </article>
    </div>
  );
}

function NSpineRow({ s, open, setOpen }) {
  return (
    <div style={{ borderTop: '1px solid var(--bc-border)', padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{s.claim}</span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
          {s.warrant && <span style={tinyNote}>warrant: <Cite id={s.warrant}>{s.warrant}</Cite></span>}
          <Cite id={s.id}>{s.citation || s.id}</Cite>
          <button style={evToggle} onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))} aria-expanded={!!open[s.id]}>
            {open[s.id] ? 'Hide' : 'Evidence'}
          </button>
        </span>
      </div>
      {open[s.id] && (
        <div style={{ ...evDetail, marginTop: 6 }}>
          {s.evidence_pali && <p style={evPali}>{s.evidence_pali}</p>}
          {s.evidence_en && <p style={evEn}>{s.evidence_en}</p>}
          <p style={evMeta}>
            <Cite id={s.id}>{s.citation || s.id}</Cite>
            {' · '}{s.layer}{s.stratum ? ' · ' + s.stratum : ''}{' · '}
            {s.tr_provenance === 'sujato' ? 'tr. Sujato' : s.tr_provenance === 'author' ? "author's gloss" : (s.tr_provenance || '')}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExplorationStudy — the generic renderer for every public Exploration (the
// Explorations tab). Reads an exploration JSON (public/explorations/<slug>.json)
// and renders it whole: the Overview + method note, the how-to-research preface
// (copy-pastable search recipes, tool pointers, live-tested Meaning-mode
// examples), the corpus-wide vocabulary table, and the thematic strands split by
// textual layer. Fully DATA-DRIVEN: a new exploration is a JSON file plus one
// line in EXPLORATION_ENTRIES, never a code change. Every count is reproducible
// from the live corpus; every citation opens in the reader.
// Schema + authoring method: .claude/skills/dhamma-explore/SKILL.md.
// ---------------------------------------------------------------------------

const EXP_PITAKA = {
  sutta: { label: 'Sutta', full: 'Sutta Piṭaka' },
  abhidhamma: { label: 'Abhi.', full: 'Abhidhamma Piṭaka' },
  vinaya: { label: 'Vin.', full: 'Vinaya Piṭaka' },
  commentary: { label: 'Comm.', full: 'Commentaries (aṭṭhakathā)' },
  subcommentary: { label: 'Sub-c.', full: 'Sub-commentaries (ṭīkā)' },
  anya: { label: 'Extra', full: 'Extra-canonical' },
};

function ExplorationStudy({ entry, onBack, backLabel = 'Explorations' }) {
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

  // Theme × layer matrix, derived from the instance list so the table can never
  // drift from the cited lists below it.
  const derived = useMemo(() => {
    if (!data) return null;
    const themes = data.themes || [];
    const byLayer = {};
    const colTotals = { mula: 0, attha: 0, tika: 0, anya: 0 };
    let total = 0;
    for (const t of themes) {
      const c = { mula: 0, attha: 0, tika: 0, anya: 0 };
      for (const i of (t.instances || [])) {
        if (i.layer in c) { c[i.layer] += 1; colTotals[i.layer] += 1; total += 1; }
      }
      byLayer[t.key] = c;
    }
    return { themes, byLayer, colTotals, total };
  }, [data]);

  function jumpTo(key) {
    setOpen((o) => ({ ...o, [key]: true }));
    requestAnimationFrame(() => {
      const el = sectionRefs.current[key];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const cols = data?.termCounts?.columns || [];
  const sumLayer = (c) => LAYER_KEYS.reduce((s, k) => s + (c?.[k] || 0), 0);

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <article style={articleReadWrap}>
        <button onClick={onBack} style={backBtn} aria-label={`Back to ${backLabel} (Esc)`}>
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to {backLabel}</span>
          <span style={backBtnHint}>Esc</span>
        </button>

        {!data && !error && <p style={hint}>Loading…</p>}
        {error && <p style={errorHint}>Failed to load: {error.message}</p>}

        {data && derived && (
          <>
            <header style={articleHeader}>
              <h1 style={articleHeaderTitle}>{entry.title}</h1>
              <p style={articleHeaderAuthor}>{entry.subtitle}</p>
            </header>

            <div style={articleBody}>
              <p style={abstractLead}>
                <span style={abstractTag}>Overview.</span> {data.overview}
              </p>

              {data.methodNote && <p style={methodNote}>{data.methodNote}</p>}

              {/* HOW TO: the worked-example preface */}
              <h2 style={h2}>How to do this yourself</h2>
              <p>{data.howto.intro}</p>
              {data.howto.recipes.map((r, i) => (
                <div key={i} style={qRow}>
                  <div style={qHead}>
                    <span style={qLabel}>{r.mode} · {r.scope}</span>
                    {typeof r.occ === 'number' && (
                      <span style={qHits}>{fmt(r.occ)} occ · {fmt(r.pass)} passages</span>
                    )}
                  </div>
                  <CopyCode text={r.query} />
                  <p style={recipeNote}>{r.note}</p>
                </div>
              ))}
              <div style={{ margin: '16px 0 0' }}>
                {data.howto.tips.map((t, i) => (
                  <div key={i} style={tipRow}>
                    <span style={tipLabel}>{t.label}.</span> {t.note}
                    {t.path && <CopyCode text={t.path} />}
                  </div>
                ))}
              </div>

              {data.howto.meaning && (
                <>
                  <h3 style={h3}>When you don’t know the Pāli: searching in plain English</h3>
                  <p>{data.howto.meaning.intro}</p>
                  {data.howto.meaning.examples.map((ex, i) => (
                    <div key={i} style={qRow}>
                      <div style={qHead}><span style={qLabel}>{ex.mode} · {ex.scope}</span></div>
                      <CopyCode text={ex.query} />
                      <p style={recipeNote}>
                        {ex.note}{' '}
                        <span style={recipeSurfaces}>Surfaces: {ex.surfaces.map((s, j) => (
                          <span key={s.id}>{j ? ' · ' : ''}<Cite id={s.id}>{s.citation}</Cite></span>
                        ))}.</span>
                      </p>
                    </div>
                  ))}
                  <p style={methodNote}>{data.howto.meaning.limit}</p>
                </>
              )}

              {/* TABLE 1: counts-for-all */}
              <h2 style={h2}>Table 1. The vocabulary, counted across the corpus</h2>
              <p style={tableCaption}>{data.termCounts.note}</p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Term</th>
                      {cols.map((k) => <th key={k} style={thNum} title={EXP_PITAKA[k]?.full}>{EXP_PITAKA[k]?.label || k}</th>)}
                      <th style={thNum}>Occ.</th>
                      <th style={thNum}>Passages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.termCounts.rows.map((r) => (
                      <tr key={r.term} style={tr}>
                        <td style={tdLeft}>
                          <a href={`#/concordance/${encodeURIComponent(r.term)}`} style={citeLink} title={`Open the concordance for ${r.term}`}>{r.term}</a>
                          <span style={tinyNote}> · {r.gloss}</span>
                        </td>
                        {cols.map((k) => <td key={k} style={tdNum}>{r.byPitaka[k] ? fmt(r.byPitaka[k]) : '·'}</td>)}
                        <td style={tdNumStrong}>{fmt(r.occ)}</td>
                        <td style={tdNum}>{fmt(r.pass)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={tableCaption}>Each term links to its Concordance page, where these figures and the keyword-in-context lines are generated live.</p>

              {/* TABLE 2: theme × layer */}
              <h2 style={h2}>Table 2. The strands of the idea, canon against commentary</h2>
              <p style={tableCaption}>
                The {fmt(derived.total)} substantive passages, cross-cut by topic and textual layer. Click a
                strand to open its complete, annotated list below; each citation opens in the reader. Column
                key: Canon = Tipiṭaka (mūla, including the Abhidhamma and the Khuddaka verse); Comm. =
                aṭṭhakathā; Sub-comm. = ṭīkā; Extra = extra-canonical.
              </p>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Strand</th>
                      {LAYER_KEYS.map((k) => <th key={k} style={thNum} title={LAYER[k].full}>{LAYER[k].label}</th>)}
                      <th style={thNum}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {derived.themes.map((t) => {
                      const c = derived.byLayer[t.key];
                      return (
                        <tr key={t.key} style={tr}>
                          <td style={tdLeft}><button style={catLink} onClick={() => jumpTo(t.key)}>{t.label}</button></td>
                          {LAYER_KEYS.map((k) => <td key={k} style={tdNum}>{c[k] ? fmt(c[k]) : '·'}</td>)}
                          <td style={tdNumStrong}>{fmt(sumLayer(c))}</td>
                        </tr>
                      );
                    })}
                    <tr style={trTotal}>
                      <td style={tdLeft}>All strands</td>
                      {LAYER_KEYS.map((k) => <td key={k} style={tdNumStrong}>{fmt(derived.colTotals[k])}</td>)}
                      <td style={tdNumStrong}>{fmt(derived.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={tableCaption}>
                Of the {fmt(derived.total)} passages, {fmt(derived.colTotals.attha + derived.colTotals.tika)} are
                commentarial or sub-commentarial. The canon states the figure; the commentary draws it. Some
                passages (DN 17, DN 26) carry several strands and so appear under more than one.
              </p>

              {/* The complete, lightly-explained cited lists */}
              <h2 style={h2}>The strands in full</h2>
              <p style={tableCaption}>Every passage, grouped by strand. Each citation opens in the reader; each carries a one-line note on what it contributes.</p>
              {derived.themes.map((t) => {
                const c = derived.byLayer[t.key];
                return (
                  <section key={t.key} ref={(el) => { sectionRefs.current[t.key] = el; }} style={bucketSection}>
                    <button style={bucketHeader} aria-expanded={!!open[t.key]} onClick={() => setOpen((o) => ({ ...o, [t.key]: !o[t.key] }))}>
                      <span aria-hidden="true" style={{ width: 16, display: 'inline-block' }}>{open[t.key] ? '▾' : '▸'}</span>
                      <span style={bucketTitle}>{t.label}</span>
                      <span style={bucketCount}>{fmt(sumLayer(c))}</span>
                    </button>
                    {open[t.key] && (
                      <>
                        <p style={bucketBlurb}>{t.blurb}</p>
                        <ol style={evList}>
                          {t.instances.map((i, idx) => (
                            <li key={i.id + ':' + idx} style={evRow}>
                              <a href={`#/read/${encodeURIComponent(i.id)}`} style={evCite} title={`Open ${i.citation} in the reader`}>{i.citation}</a>
                              <span style={evLayer} title={LAYER[i.layer]?.full || i.layer}>{LAYER[i.layer]?.label || i.layer}</span>
                              <span style={evEvidence}>{i.note}</span>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </section>
                );
              })}

              <p style={footNote}>
                {entry.title}, version {data.meta.version}, snapshot {data.meta.corpus_snapshot}. The dataset is
                published with this worked example and reproducible from the live database; every citation resolves to a
                passage in the reader.
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

// Study contents outline (quiet UI chrome, system sans). Positioned relative to
// <main> (the positioned content area): a rail in the right margin on wide
// viewports, a pinned bar at the content-area top on narrow ones.
const OUTLINE_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const outlineRail = { position: 'absolute', top: 64, right: 14, width: 186, zIndex: 6, maxHeight: 'calc(100% - 88px)', overflowY: 'auto', fontFamily: OUTLINE_FONT, fontSize: 12.5, paddingBottom: 12 };
const outlineRailLabel = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--bc-text-tertiary)', opacity: 0.85, margin: '0 0 8px', paddingLeft: 8 };
const outlineBarWrap = { position: 'absolute', top: 56, left: 0, right: 0, zIndex: 14, background: 'var(--bc-bg-base)', borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)', fontFamily: OUTLINE_FONT };
const outlineBarBtn = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bc-text-secondary)', fontFamily: OUTLINE_FONT, fontSize: 13, letterSpacing: '0.04em' };
const outlineBarNav = { padding: '4px 8px 10px', maxHeight: '60vh', overflowY: 'auto', background: 'var(--bc-bg-base)', borderTop: '1px solid rgba(var(--bc-accent-rgb), 0.10)' };
const outlineEntry = (active) => ({ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', borderLeft: `2px solid ${active ? 'var(--bc-accent)' : 'transparent'}`, padding: '3px 0 3px 8px', marginBottom: 1, color: active ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)', fontWeight: active ? 700 : 400, fontFamily: OUTLINE_FONT, fontSize: 12.5, lineHeight: 1.45 });

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

const h2 = { fontFamily: SERIF, fontSize: 17, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--bc-text-primary)', margin: '34px 0 10px', scrollMarginTop: 84 };
const tableCaption = { fontSize: 12.5, fontStyle: 'italic', color: 'var(--bc-text-tertiary)', lineHeight: 1.6, margin: '0 0 12px' };

const tableWrap = { overflowX: 'auto', margin: '6px 0 8px' };
// table-layout:'fixed' gives predictable column widths (columns share the container
// width evenly instead of growing to fit content), so one long source can never widen
// the whole table; overflowWrap:'anywhere' (inherited by every cell) breaks a long
// unbreakable token within its column rather than overflowing. Do NOT add
// wordBreak:'break-word' here: under fixed layout it forces narrow columns to break
// every character. Numeric cells set whiteSpace:'nowrap' and stay on one line.
const table = { width: '100%', borderCollapse: 'collapse', fontFamily: SERIF, fontSize: 14, fontVariantNumeric: 'tabular-nums', tableLayout: 'fixed', overflowWrap: 'anywhere' };
const thLeft = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid rgba(var(--bc-accent-rgb), 0.30)', fontWeight: 600, fontSize: 12.5, letterSpacing: '0.04em', color: 'var(--bc-text-secondary)' };
const thNum = { ...thLeft, textAlign: 'right', whiteSpace: 'nowrap' };
const tr = { borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.10)' };
const trTotal = { borderTop: '2px solid rgba(var(--bc-accent-rgb), 0.30)', fontWeight: 600 };
const tdLeft = { textAlign: 'left', padding: '7px 10px', color: 'var(--bc-text-primary)', overflowWrap: 'anywhere' };
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
// Copy-pastable query rows in the reproducibility appendix: the whole code box is the button.
const codeCopyable = { display: 'block', position: 'relative', fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace', fontSize: 11.5, lineHeight: 1.55, color: 'var(--bc-text-secondary)', background: 'rgba(var(--bc-accent-rgb), 0.06)', border: '1px solid rgba(var(--bc-accent-rgb), 0.18)', borderRadius: 4, padding: '8px 10px', cursor: 'pointer', whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
const codeCopied = { ...codeCopyable, background: 'rgba(var(--bc-accent-rgb), 0.14)', borderColor: 'rgba(var(--bc-accent-rgb), 0.45)' };
const copiedTag = { marginLeft: 8, fontFamily: SERIF, fontSize: 11, fontStyle: 'italic', color: 'var(--bc-accent)' };
const qRow = { margin: '0 0 10px' };
const qHead = { display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 3 };
const qLabel = { fontFamily: SERIF, fontSize: 13, color: 'var(--bc-text-primary)' };
const qHits = { fontSize: 11.5, color: 'var(--bc-text-tertiary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
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
// citeDead is the no-id (composite) case, which can hold a long descriptive source
// ("Vism cross-ref via ..."). It must WRAP (no nowrap) or it overflows its column and
// overlaps neighbours; overflowWrap breaks any long token. citeLink keeps nowrap so a
// real short cite (e.g. "MN 10") never breaks mid-citation in prose.
const citeDead = { color: 'var(--bc-text-tertiary)', fontStyle: 'italic', overflowWrap: 'anywhere' };

const tdLeftSm = { textAlign: 'left', padding: '6px 10px', color: 'var(--bc-text-primary)', fontSize: 13, lineHeight: 1.45, verticalAlign: 'top', overflowWrap: 'anywhere' };

const refList = { fontFamily: SERIF, fontSize: 13.5, lineHeight: 1.6, color: 'var(--bc-text-secondary)', margin: '4px 0 8px', padding: '0 0 0 24px', display: 'flex', flexDirection: 'column', gap: 7 };
const refItem = { paddingLeft: 4 };

// --- wheel-turning-monarch study additions ---
const recipeNote = { fontSize: 12.5, fontStyle: 'italic', color: 'var(--bc-text-secondary)', lineHeight: 1.6, margin: '5px 0 0' };
const tipRow = { fontSize: 13.5, color: 'var(--bc-text-secondary)', lineHeight: 1.7, margin: '0 0 9px' };
const tipLabel = { fontVariant: 'small-caps', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--bc-accent)', marginRight: 2 };
const recipeSurfaces = { fontStyle: 'normal', color: 'var(--bc-text-tertiary)' };

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
