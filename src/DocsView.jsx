// Docs — short site documentation ("How search works", "About the
// corpus", "Dictionary coverage"). These live in the same `articles`
// table as the Library, tagged category='docs', and are served by the
// existing /api/library + /api/library/:slug endpoints — so this view
// needs no new backend or api.js helper. Authoring the docs themselves
// is a separate task; until any exist, the index shows a quiet empty
// state rather than an error.

import { useEffect, useRef, useState } from 'react';
import { libraryListApi, libraryArticleApi } from './api.js';
import { sanitizeDictHtml } from './dictHtml.js';
import { SelectionActions } from './SelectionActions.jsx';
import { isModifiedClick } from './linkHelpers.js';

export default function DocsView({ onSearchTerm, onCompareTerm }) {
  const [articles, setArticles] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [openSlug, setOpenSlug] = useState(null);

  // The open doc is tracked in the hash (#/docs/<slug>) so deep links
  // survive reload and the "re-click Docs in the sidebar → return to the
  // index" behaviour works. Mirrors LibraryView's hash handling.
  useEffect(() => {
    function syncFromHash() {
      const m = window.location.hash.match(/^#\/docs\/(.+)$/);
      const next = m ? decodeURIComponent(m[1]) : null;
      setOpenSlug((prev) => (prev === next ? prev : next));
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    if (openSlug) {
      window.history.replaceState(null, '', `#/docs/${encodeURIComponent(openSlug)}`);
    } else {
      window.history.replaceState(null, '', '#/docs');
    }
  }, [openSlug]);

  useEffect(() => {
    const ac = new AbortController();
    libraryListApi({ category: 'docs', limit: 200, signal: ac.signal })
      .then((r) => setArticles(r.articles || []))
      .catch((e) => { if (e.name !== 'AbortError') { setArticles([]); setError(e); } });
    return () => ac.abort();
  }, []);

  if (openSlug) {
    return <DocView slug={openSlug} onBack={() => setOpenSlug(null)} onSearchTerm={onSearchTerm} onCompareTerm={onCompareTerm} />;
  }

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>Docs</h1>
        <p style={pageSubtitle}>
          Notes on how this tool works — search, the corpus, the dictionaries.
        </p>
        <div style={rule} />
      </header>

      {articles === null && <p style={hint}>Loading…</p>}

      {articles && articles.length === 0 && (
        <p style={emptyHint}>
          No documents published yet. Short notes on how search works, what
          the corpus contains, and how the dictionaries are sourced will
          appear here as they are written.
        </p>
      )}

      {articles && articles.length > 0 && (
        <ul style={list}>
          {articles.map((a) => (
            <li key={a.slug} style={itemRow}>
              <a
                href={`#/docs/${encodeURIComponent(a.slug)}`}
                onClick={(e) => { if (isModifiedClick(e)) return; e.preventDefault(); setOpenSlug(a.slug); }}
                style={itemLink}
                aria-label={`Open ${a.title}`}
              >
                <span style={itemTitle}>{a.title}</span>
                {a.author && <span style={itemAuthor}>{a.author}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DocView({ slug, onBack, onSearchTerm, onCompareTerm }) {
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    setArticle(null);
    setError(null);
    const ac = new AbortController();
    libraryArticleApi(slug, { signal: ac.signal })
      .then(setArticle)
      .catch((e) => { if (e.name !== 'AbortError') setError(e); });
    return () => ac.abort();
  }, [slug]);

  // Esc → back to the docs index.
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onBack?.(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onBack]);

  return (
    <div data-scroll-root="" style={scrollWrap}>
      <article ref={ref} style={articleReadWrap}>
        <button onClick={onBack} style={backBtn} aria-label="Back to Docs (Esc)">
          <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
          <span>Back to Docs</span>
          <span style={backBtnHint}>Esc</span>
        </button>

        {!article && !error && <p style={hint}>Loading…</p>}
        {error && <p style={errorHint}>Failed to load: {error.message}</p>}

        {article && (
          <>
            <header style={articleHeader}>
              <h1 style={articleHeaderTitle}>{article.title}</h1>
              {article.author && (
                <p style={articleHeaderAuthor}>by {article.author}{article.year ? `, ${article.year}` : ''}</p>
              )}
            </header>
            <div
              style={articleBody}
              dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(article.body || '') }}
            />
          </>
        )}

        <SelectionActions containerRef={ref} onSearch={onSearchTerm} onCompare={onCompareTerm} />
      </article>
    </div>
  );
}

// --- styles --- (mirrors the Library / Bookmarks academic typesetting:
// serif body, small-caps letter-spaced title, thin gold rules, no chrome)

const SERIF = '"Noto Serif", Georgia, serif';

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

const list = {
  maxWidth: 720,
  margin: '32px 0 64px',
  padding: '0 28px',
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const itemRow = {
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.10)',
};

const itemLink = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 2,
  padding: '12px 0',
  textDecoration: 'none',
  color: 'inherit',
  fontFamily: SERIF,
  cursor: 'pointer',
};

const itemTitle = {
  fontFamily: SERIF,
  fontSize: 15,
  color: 'var(--bc-text-primary)',
  lineHeight: 1.4,
};

const itemAuthor = {
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 12,
  color: 'var(--bc-text-secondary)',
};

const emptyHint = {
  maxWidth: 620,
  margin: '48px auto',
  padding: '0 28px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 14,
  lineHeight: 1.7,
  color: 'var(--bc-text-tertiary)',
  textAlign: 'center',
};

const hint = {
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

const articleBody = {
  fontFamily: SERIF,
  fontSize: 15,
  lineHeight: 1.75,
  color: 'var(--bc-text-primary)',
};
