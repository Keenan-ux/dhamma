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
import { libraryListApi, libraryArticleApi } from './api.js';
import { sanitizeDictHtml } from './dictHtml.js';
import { SelectionActions } from './SelectionActions.jsx';
import { useRef } from 'react';
import useIsNarrow from './useIsNarrow.js';

const CATEGORY_LABELS = {
  'study-guide':  'Study guides',
  'author-essay': 'Author essays',
  'thai':         'Thai tradition',
  'ptf':          'Path to Freedom',
  'noncanon':     'Non-canonical',
  'index':        'Curated indexes',
  'glossary':     'Glossary',
};

const CATEGORY_BLURBS = {
  'study-guide':  'Themed guides — Wings to Awakening, Mind Like Fire Unbound, the Four Noble Truths, and others.',
  'author-essay': 'Essays, talks, and writings by 80+ authors: Bodhi, Nyanaponika, Walshe, Thanissaro, and many more.',
  'thai':         'The Thai forest tradition in translation — Ajahn Chah, Ajahn Mun, Ajahn Lee, and successors.',
  'ptf':          'A modern study program guiding the reader through the Pali canon.',
  'noncanon':     'Extra-canonical material — Visuddhimagga, Vinaya excerpts.',
  'index':        'Curated indexes assembled by ATI — similes, names, subjects, titles, numbers, authors, and the suttas.',
  'glossary':     'A supplementary Pali → English term glossary by various contributors.',
};

const CATEGORY_ORDER = ['study-guide', 'author-essay', 'thai', 'ptf', 'noncanon', 'index', 'glossary'];

export default function LibraryView({ onSearchTerm, onCompareTerm }) {
  const isNarrow = useIsNarrow();
  const [listing, setListing] = useState(null); // { articles, byCategory }
  const [activeCategory, setActiveCategory] = useState('study-guide');
  const [openSlug, setOpenSlug] = useState(null);

  // Restore the open article from hash when this view mounts directly.
  useEffect(() => {
    const m = window.location.hash.match(/^#\/library\/(.+)$/);
    if (m) setOpenSlug(decodeURIComponent(m[1]));
  }, []);

  // Sync hash to open article so deep links work.
  useEffect(() => {
    if (openSlug) {
      window.history.replaceState(null, '', `#/library/${encodeURIComponent(openSlug)}`);
    } else {
      window.history.replaceState(null, '', '#/library');
    }
  }, [openSlug]);

  // Fetch the active category's articles directly — keeps each
  // request small and side-steps the "first sort bucket fills the
  // limit" trap (author-essay alone has 277 entries).
  useEffect(() => {
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
    <div style={scrollWrap}>
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
            {CATEGORY_ORDER.filter((c) => (listing.byCategory[c] || 0) > 0).map((c) => {
              const on = activeCategory === c;
              const n = listing.byCategory[c] || 0;
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

          <ul style={isNarrow ? articleListNarrow : articleListGrid}>
            {activeList.map((a) => (
              <li
                key={a.slug}
                style={articleItem}
                onClick={() => setOpenSlug(a.slug)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenSlug(a.slug); } }}
              >
                <span style={articleTitle}>{a.title}</span>
                {a.author && <span style={articleAuthor}>{a.author}</span>}
                <span style={articleMeta}>
                  {a.year || ''}{a.year && a.body_len ? ' · ' : ''}{a.body_len ? `${Math.round(a.body_len / 1000)}K chars` : ''}
                </span>
              </li>
            ))}
          </ul>

          {activeList.length === 0 && (
            <p style={emptyHint}>No articles ingested in this category.</p>
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
    <div style={scrollWrap}>
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
  color: 'var(--bc-text-tertiary)',
};

const categoryNav = {
  maxWidth: 980,
  margin: '32px auto 16px',
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
  margin: '32px auto 16px',
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
  margin: '0 auto 28px',
  padding: '0 28px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  lineHeight: 1.6,
  textAlign: 'center',
  color: 'var(--bc-text-tertiary)',
};

const articleListGrid = {
  maxWidth: 1100,
  margin: '0 auto 32px',
  padding: '0 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '24px 28px',
  listStyle: 'none',
};

const articleListNarrow = {
  maxWidth: 480,
  margin: '0 auto 32px',
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
  gap: 2,
  cursor: 'pointer',
  padding: '4px 0',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.08)',
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
  margin: '40px auto',
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
  margin: '0 auto',
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

const attribLink = {
  color: 'var(--bc-text-tertiary)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

const loadingHint = {
  margin: '40px auto',
  textAlign: 'center',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
};

const errorHint = {
  margin: '40px auto',
  textAlign: 'center',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-loss-text)',
};
