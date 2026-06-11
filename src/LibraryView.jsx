// Library — non-sutta secondary content ingested from Access to Insight.
//
// Shape:
//   - List of category chips (Study guides · Author essays · Thai · Path
//     to Freedom · Non-canon · Glossary) with counts
//   - Article list below filtered by the active category
//   - Click an article → ArticleView (full reader)
//
// All articles are CC BY-NC 4.0 from accesstoinsight.org. Required
// attribution lives in ArticleView's footer.

import { useEffect, useMemo, useState } from 'react';
import { libraryListApi, libraryArticleApi, translatorsApi } from './api.js';
import { sanitizeDictHtml } from './dictHtml.js';
import { SelectionActions } from './SelectionActions.jsx';
import { useRef } from 'react';
import useIsNarrow from './useIsNarrow.js';
import { isModifiedClick, libraryHref } from './linkHelpers.js';

// Display names for translator slugs that don't read as a name on their own.
// Falls back to the slug if unknown. Mirrors PassageCard's map but expanded
// for the translator-index view where every translator surfaces.
const TRANSLATOR_LABELS = {
  sujato: 'Bhante Sujato',
  thanissaro: 'Thanissaro Bhikkhu',
  walshe: 'Maurice Walshe',
  ireland: 'John D. Ireland',
  olendzki: 'Andrew Olendzki',
  buddharakkhita: 'Acharya Buddharakkhita',
  nyanaponika: 'Nyanaponika Thera',
  nanamoli: 'Ñāṇamoli Thera',
  piyadassi: 'Piyadassi Thera',
  bodhi: 'Bhikkhu Bodhi',
  narada: 'Nārada Thera',
  soma: 'Soma Thera',
  nyanasatta: 'Nyanasatta Thera',
  'sister-uppalavanna': 'Sister Uppalavanna',
  'nanamoli-bodhi': 'Ñāṇamoli & Bodhi',
  horner: 'I. B. Horner',
  hare: 'E. M. Hare',
  'amaravati-sangha': 'Amaravati Sangha',
  nizamis: 'Nizamis',
  hecker: 'Hellmuth Hecker',
  vajira: 'Sister Vajira',
  kelly: 'John Kelly',
  harvey: 'Peter Harvey',
  sonadhammo: 'Sonadhammo',
  kandy: 'Kandy News-Wheel',
  brahmali: 'Bhikkhu Brahmali',
  anandajoti: 'Bhikkhu Ānandajoti',
  kovilo: 'Kovilo Bhikkhu',
  suddhaso: 'Bhante Suddhāso',
  patton: 'Charles Patton',
};

const CATEGORY_LABELS = {
  'study-guide':  'Study guides',
  'author-essay': 'Author essays',
  'thai':         'Thai tradition',
  'ptf':          'Path to Freedom',
  'noncanon':     'Non-canonical',
  'index':        'Curated indexes',
  'glossary':     'Glossary',
  'translators':  'Translators',
};

const CATEGORY_BLURBS = {
  'study-guide':  'Themed guides — Wings to Awakening, Mind Like Fire Unbound, the Four Noble Truths, and others.',
  'author-essay': 'Essays, talks, and writings by 80+ authors: Bodhi, Nyanaponika, Walshe, Thanissaro, and many more.',
  'thai':         'The Thai forest tradition in translation — Ajahn Chah, Ajahn Mun, Ajahn Lee, and successors.',
  'ptf':          'A modern study program guiding the reader through the Pali canon.',
  'noncanon':     'Extra-canonical material — Visuddhimagga, Vinaya excerpts.',
  'index':        'Curated indexes assembled by ATI — similes, names, subjects, titles, numbers, authors, and the suttas.',
  'glossary':     'A supplementary Pali → English term glossary by various contributors.',
  'translators':  'Every distinct translator whose work is indexed across the corpus, with passage counts. Click a name to filter Search by that translator.',
};

const CATEGORY_ORDER = ['study-guide', 'author-essay', 'thai', 'ptf', 'noncanon', 'index', 'glossary', 'translators'];

export default function LibraryView({ onSearchTerm, onCompareTerm, onOpenTranslator }) {
  const isNarrow = useIsNarrow();
  const [listing, setListing] = useState(null); // { articles, byCategory }
  const [translators, setTranslators] = useState(null); // [{translator, source, passage_count, ...}]
  const [activeCategory, setActiveCategory] = useState('study-guide');
  // Initialized straight from the hash so a cold load on
  // #/library/<slug> never passes through a null state (which would let
  // the hash-writing effect below momentarily clobber the deep link).
  const [openSlug, setOpenSlug] = useState(() => {
    const m = window.location.hash.match(/^#\/library\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  });

  // Fetch the translator-coverage index once on mount. ~16 rows, cheap;
  // the count surfaces in the category chip ("Translators · 16") even
  // before the user opens the section.
  useEffect(() => {
    const ac = new AbortController();
    translatorsApi({ signal: ac.signal })
      .then((r) => setTranslators(r.translators || []))
      .catch(() => setTranslators([]));
    return () => ac.abort();
  }, []);

  // Restore the open article from hash when this view mounts directly,
  // AND on every subsequent hashchange. The hashchange branch is the
  // mechanism that powers "click Library in the sidebar while reading
  // an article → return to the splash": the Sidebar handler pushes the
  // base hash, and we react to it here by clearing openSlug.
  useEffect(() => {
    function syncFromHash() {
      const m = window.location.hash.match(/^#\/library\/(.+)$/);
      const next = m ? decodeURIComponent(m[1]) : null;
      setOpenSlug((prev) => (prev === next ? prev : next));
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  // Sync hash to open article so deep links work. Opening an article
  // (or jumping article → article) is a real navigation, so it PUSHES —
  // the browser back button then closes the article instead of exiting
  // the Library tab entirely. Closing / normalizing replaces in place.
  const prevOpenSlugRef = useRef(openSlug);
  useEffect(() => {
    const prev = prevOpenSlugRef.current;
    prevOpenSlugRef.current = openSlug;
    const want = openSlug ? `#/library/${encodeURIComponent(openSlug)}` : '#/library';
    if (window.location.hash === want) return;
    if (openSlug && openSlug !== prev) {
      window.history.pushState(null, '', want);
    } else {
      window.history.replaceState(null, '', want);
    }
  }, [openSlug]);

  // Fetch the active category's articles directly — keeps each
  // request small and side-steps the "first sort bucket fills the
  // limit" trap (author-essay alone has 277 entries). The 'translators'
  // category is a different shape (no articles, just the translator
  // index loaded above) so we skip the article fetch there.
  useEffect(() => {
    if (activeCategory === 'translators') return;
    const ac = new AbortController();
    libraryListApi({ category: activeCategory, limit: 500, signal: ac.signal })
      .then(setListing)
      .catch(() => setListing({ articles: [], byCategory: {} }));
    return () => ac.abort();
  }, [activeCategory]);

  const articlesByCategory = useMemo(() => {
    const map = new Map();
    for (const a of listing?.articles || []) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category).push(a);
    }
    return map;
  }, [listing]);

  const activeList = articlesByCategory.get(activeCategory) || [];

  if (openSlug) {
    return <ArticleView slug={openSlug} onBack={() => setOpenSlug(null)} onSearchTerm={onSearchTerm} onCompareTerm={onCompareTerm} />;
  }

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Library</h1>
        <p style={pageSubtitle}>
          Secondary literature from Access to Insight &nbsp;·&nbsp;{' '}
          {listing ? Object.values(listing.byCategory).reduce((a, b) => a + b, 0).toLocaleString() : '…'}{' '}
          articles
        </p>
        <div style={rule} />
      </header>

      {!listing && (
        <p style={loadingHint}>Loading…</p>
      )}

      {listing && (
        <>
          <nav
            style={isNarrow ? categoryNavStack : categoryNav}
            aria-label="Article categories"
          >
            {CATEGORY_ORDER.filter((c) => {
              // 'translators' is a pseudo-category — its count comes from
              // the translators index, not from listing.byCategory.
              if (c === 'translators') return (translators?.length || 0) > 0;
              return (listing.byCategory[c] || 0) > 0;
            }).map((c) => {
              const on = activeCategory === c;
              const n = c === 'translators'
                ? (translators?.length || 0)
                : (listing.byCategory[c] || 0);
              return (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  style={isNarrow ? {
                    ...categoryRow,
                    color: on ? 'var(--bc-accent)' : 'var(--bc-text-primary)',
                    background: on ? 'rgba(var(--bc-accent-rgb), 0.06)' : 'transparent',
                    borderLeftColor: on ? 'var(--bc-accent)' : 'transparent',
                    fontWeight: on ? 600 : 400,
                  } : {
                    ...categoryChip,
                    color: on ? 'var(--bc-accent)' : 'var(--bc-text-secondary)',
                    borderColor: on ? 'var(--bc-accent)' : 'rgba(var(--bc-accent-rgb), 0.20)',
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  <span>{CATEGORY_LABELS[c] || c}</span>
                  <span style={isNarrow ? categoryRowCount : categoryCount}>{n.toLocaleString()}</span>
                </button>
              );
            })}
          </nav>

          <p style={categoryBlurb}>
            {CATEGORY_BLURBS[activeCategory]}
          </p>

          {/* Translator-index branch — renders a different shape than the
              article list. Each row links to Search with field=translation
              + translator pre-filled, so a click drops the user into a
              query interface scoped to that translator's work. */}
          {activeCategory === 'translators' ? (
            <ul style={isNarrow ? articleListNarrow : articleListGrid}>
              {(translators || []).map((t) => {
                const label = TRANSLATOR_LABELS[t.translator] || t.translator;
                const sourceLabel = t.source === 'ati' ? 'Access to Insight' : 'SuttaCentral';
                return (
                  <li key={`${t.translator}::${t.source}`} style={articleItemLi}>
                    <a
                      href={`#/search?translator=${encodeURIComponent(t.translator)}`}
                      style={articleItemLink}
                      onClick={(e) => {
                        if (isModifiedClick(e)) return;
                        e.preventDefault();
                        onOpenTranslator?.(t.translator);
                      }}
                      aria-label={`Search ${label}'s translations`}
                    >
                      <span style={articleTitle}>{label}</span>
                      <span style={articleAuthor}>{sourceLabel}</span>
                      <span style={articleMeta}>
                        {t.passage_count.toLocaleString()} passage{t.passage_count === 1 ? '' : 's'}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
          <>
            <ul style={isNarrow ? articleListNarrow : articleListGrid}>
              {activeList.map((a) => (
                <li key={a.slug} style={articleItemLi}>
                  <a
                    href={libraryHref(a.slug)}
                    style={articleItemLink}
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setOpenSlug(a.slug);
                    }}
                    aria-label={`Open article ${a.title}`}
                  >
                    <span style={articleTitle}>{a.title}</span>
                    {a.author && <span style={articleAuthor}>{a.author}</span>}
                    <span style={articleMeta}>
                      {a.year || ''}{a.year && a.body_len ? ' · ' : ''}{a.body_len ? `${Math.round(a.body_len / 1000)}K chars` : ''}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {activeList.length === 0 && (
              <p style={emptyHint}>No articles ingested in this category.</p>
            )}
          </>
          )}
        </>
      )}

      <footer style={footerWrap}>
        <div style={rule} />
        <p style={attribution}>
          All Library content from{' '}
          <a href="https://accesstoinsight.org" target="_blank" rel="noopener noreferrer" style={attribLink}>accesstoinsight.org</a>{' '}
          (offline edition, 2013.12.01.01), licensed under CC BY-NC 4.0.
          Per-article attribution and license restatement appear in each
          article's footer.
        </p>
      </footer>
    </div>
  );
}

function ArticleView({ slug, onBack, onSearchTerm, onCompareTerm }) {
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    setArticle(null);
    setError(null);
    const ac = new AbortController();
    libraryArticleApi(slug, { signal: ac.signal })
      .then(setArticle)
      .catch((err) => setError(err));
    return () => ac.abort();
  }, [slug]);

  // Esc → back to library
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onBack?.(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onBack]);

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <article ref={ref} style={articleReadWrap}>
        <button onClick={onBack} style={backBtn} aria-label="Back to Library (Esc)">
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to Library</span>
          <span style={backBtnHint}>Esc</span>
        </button>

        {!article && !error && (
          <p style={loadingHint}>Loading article…</p>
        )}
        {error && (
          <p style={errorHint}>Failed to load: {error.message}</p>
        )}

        {article && (
          <>
            <header style={articleHeader}>
              <h1 style={articleHeaderTitle}>{article.title}</h1>
              {article.author && (
                <p style={articleHeaderAuthor}>by {article.author}{article.year ? `, ${article.year}` : ''}</p>
              )}
              <p style={articleHeaderCategory}>
                {CATEGORY_LABELS[article.category] || article.category}
              </p>
            </header>

            <div
              style={articleBody}
              dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(article.body) }}
            />

            <footer style={articleFooter}>
              <p style={attribution}>
                {article.copyright || `© Access to Insight`}
                {' · '}
                <a href={article.source_url} target="_blank" rel="noopener noreferrer" style={attribLink}>
                  CC BY-NC 4.0 · accesstoinsight.org
                </a>
              </p>
            </footer>
          </>
        )}

        <SelectionActions
          containerRef={ref}
          onSearch={onSearchTerm}
          onCompare={onCompareTerm}
        />
      </article>
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
  // Unified width with the chip row + article grid so the title block
  // sits visually centered over the content rather than floating in a
  // narrower column above it. Title text still self-centers via the
  // letter-spaced uppercase + textAlign:center.
  maxWidth: 980,
  margin: '64px 0 0',
  padding: '0 28px',
  textAlign: 'center',
};

const rule = {
  height: 1,
  background: 'rgba(var(--bc-accent-rgb), 0.32)',
  // No internal maxWidth — the rule spans the full pageHeader column
  // (currently 980), matching the visual width of the chip row and the
  // article grid below. Previously this was capped at 580, which made
  // the title block look like it sat in a narrower column than the
  // content beneath it.
  margin: '0 auto',
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
  color: 'var(--bc-text-tertiary)',
};

const categoryNav = {
  maxWidth: 980,
  margin: '32px 0 16px',
  padding: '0 20px',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 8,
};

const categoryChip = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 8,
  padding: '7px 14px',
  background: 'transparent',
  border: '1px solid',
  borderRadius: 999,
  fontFamily: SERIF,
  fontSize: 13,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'color 120ms ease, border-color 120ms ease',
};

const categoryCount = {
  fontFamily: SANS,
  fontSize: 10,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--bc-text-tertiary)',
  letterSpacing: '0.06em',
};

// Mobile: stacked vertical list, one row per category. Reads like the
// sidebar nav (left-border indicator on active, faint wash on active
// background) rather than the pill row that wraps awkwardly on narrow
// viewports.
const categoryNavStack = {
  maxWidth: 480,
  margin: '32px 0 16px',
  padding: '0 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const categoryRow = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '11px 14px',
  background: 'transparent',
  border: 'none',
  borderLeft: '3px solid transparent',
  cursor: 'pointer',
  fontFamily: SERIF,
  fontSize: 14,
  letterSpacing: '0.01em',
  textAlign: 'left',
  transition: 'color 120ms ease, background 120ms ease, border-color 120ms ease',
};

const categoryRowCount = {
  fontFamily: SANS,
  fontSize: 10,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--bc-text-tertiary)',
  letterSpacing: '0.06em',
};

const categoryBlurb = {
  maxWidth: 720,
  margin: '0 0 28px',
  padding: '0 28px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  lineHeight: 1.6,
  textAlign: 'center',
  color: 'var(--bc-text-tertiary)',
};

const articleListGrid = {
  // Unified with pageHeader + categoryNav so the page reads as one
  // centered column of content. 980 fits a 3-column auto-fit at
  // ~280px each with comfortable gutters.
  maxWidth: 980,
  margin: '0 0 32px',
  padding: '0 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '24px 28px',
  listStyle: 'none',
};

const articleListNarrow = {
  maxWidth: 480,
  margin: '0 0 32px',
  padding: '0 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  listStyle: 'none',
};

const articleItem = {
  fontFamily: SERIF,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',  // centers title/author/meta within the card cell
  textAlign: 'center',   // also handles inline wrap if a title runs long
  gap: 2,
  cursor: 'pointer',
  padding: '4px 0',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.08)',
  transition: 'color 100ms ease',
};

// Cards are <li><a/></li> so the browser sees a real link target on
// each row. The <li> keeps the bottom rule + flex centring; the <a>
// inherits the rest and strips the default underline/color.
const articleItemLi = {
  listStyle: 'none',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.08)',
};

const articleItemLink = {
  fontFamily: SERIF,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 2,
  cursor: 'pointer',
  padding: '4px 0',
  color: 'inherit',
  textDecoration: 'none',
  transition: 'color 100ms ease',
};

const articleTitle = {
  fontFamily: SERIF,
  fontSize: 15,
  letterSpacing: '0.01em',
  color: 'var(--bc-text-primary)',
  lineHeight: 1.4,
};

const articleAuthor = {
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 12,
  color: 'var(--bc-text-secondary)',
  lineHeight: 1.4,
};

const articleMeta = {
  fontFamily: SANS,
  fontSize: 10,
  color: 'var(--bc-text-tertiary)',
  letterSpacing: '0.06em',
  marginTop: 2,
};

const emptyHint = {
  maxWidth: 720,
  margin: '40px 0',
  padding: '0 28px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  textAlign: 'center',
};

const articleReadWrap = {
  position: 'relative',
  maxWidth: 720,
  margin: '0 0',
  padding: '28px 28px 64px',
};

const backBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontSize: 13,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  padding: '6px 0',
  marginBottom: 18,
  fontFamily: 'inherit',
};

const backBtnHint = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  borderRadius: 4,
  padding: '2px 6px',
};

const articleHeader = {
  marginBottom: 28,
  paddingBottom: 16,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.22)',
};

const articleHeaderTitle = {
  margin: 0,
  fontFamily: SERIF,
  fontSize: 26,
  fontWeight: 500,
  letterSpacing: '0.01em',
  color: 'var(--bc-text-primary)',
  lineHeight: 1.25,
};

const articleHeaderAuthor = {
  margin: '8px 0 0',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 14,
  color: 'var(--bc-accent)',
};

const articleHeaderCategory = {
  margin: '8px 0 0',
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const articleBody = {
  fontFamily: SERIF,
  fontSize: 15,
  lineHeight: 1.75,
  color: 'var(--bc-text-primary)',
};

const articleFooter = {
  marginTop: 40,
  paddingTop: 16,
  borderTop: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
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

const attribLink = {
  color: 'var(--bc-text-tertiary)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

const loadingHint = {
  margin: '40px 0',
  textAlign: 'center',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
};

const errorHint = {
  margin: '40px 0',
  textAlign: 'center',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-loss-text)',
};
