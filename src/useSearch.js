// Search hook with debounced initial fetch + infinite-scroll pagination.
//
// First page fires after a 300ms debounce on q/mode/field/nosnippet change.
// Each subsequent page fetched via loadMore() — typically wired to an
// IntersectionObserver sentinel in the view. Results accumulate across
// pages; resetting any of the query inputs clears the accumulator.
//
// `nosnippet=true` skips server-side ts_headline so very large limits
// stay sub-second; the result snippet falls back to the first ~200 chars
// of translation/original.

import { useCallback, useEffect, useRef, useState } from 'react';
import { searchApi } from './api.js';

const DEBOUNCE_MS = 300;

const EMPTY_STATE = {
  results: [],
  expanded: [],
  warning: null,
  hasMore: false,
  page: 0,
  // True total of matching rows for the active FTS predicate, surfaced
  // so the result-header can say "4,237 passages matching sati" instead
  // of just the loaded-so-far count. Null when the server can't give a
  // meaningful total (vector-only Meaning queries).
  total: null,
};

export default function useSearch({ q, mode, field, limit, nosnippet, pitaka }) {
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  // Snapshot of the query params the latest accumulator belongs to. loadMore
  // refuses to append rows fetched against an older snapshot — guards against
  // race conditions where a stale request lands after the params changed.
  const snapshotRef = useRef({ q: '', mode: '', field: '', nosnippet: false, limit: 0, pitaka: '' });

  useEffect(() => {
    if (!q || !q.trim()) {
      if (abortRef.current) abortRef.current.abort();
      setState(EMPTY_STATE);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const snapshot = { q, mode, field, nosnippet: !!nosnippet, limit, pitaka: pitaka || '' };
    snapshotRef.current = snapshot;

    setLoading(true);
    setLoadingMore(false);
    const t = setTimeout(() => {
      searchApi({ q, mode, field, limit, offset: 0, nosnippet, pitaka, signal: ctrl.signal })
        .then((r) => {
          if (ctrl.signal.aborted) return;
          setState({
            results: r.results || [],
            expanded: r.expanded || [],
            warning: r.warning || null,
            hasMore: !!r.hasMore,
            page: 0,
            total: typeof r.total === 'number' ? r.total : null,
          });
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          setError(err);
          setState(EMPTY_STATE);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, mode, field, nosnippet, limit, pitaka]);

  const loadMore = useCallback(() => {
    const snap = snapshotRef.current;
    if (loading || loadingMore) return;
    if (!state.hasMore) return;
    if (!snap.q) return;

    const nextPage = state.page + 1;
    const offset = nextPage * snap.limit;
    setLoadingMore(true);
    searchApi({
      q: snap.q, mode: snap.mode, field: snap.field,
      limit: snap.limit, offset, nosnippet: snap.nosnippet, pitaka: snap.pitaka || undefined,
    })
      .then((r) => {
        // Drop the response if the user changed query params between the
        // fetch starting and finishing — wouldn't make sense to append
        // results from an outdated query to the current accumulator.
        const now = snapshotRef.current;
        if (now.q !== snap.q || now.mode !== snap.mode || now.field !== snap.field
            || now.nosnippet !== snap.nosnippet || now.limit !== snap.limit
            || now.pitaka !== snap.pitaka) {
          return;
        }
        setState((s) => ({
          ...s,
          results: [...s.results, ...(r.results || [])],
          hasMore: !!r.hasMore,
          page: nextPage,
        }));
        setLoadingMore(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
        setLoadingMore(false);
      });
  }, [loading, loadingMore, state.hasMore, state.page]);

  // Shape the return as a single `data` object so SearchView's existing
  // `result?.results`, `result.expanded` references keep working. `total`
  // rides on the same object so the result-header can switch between
  // server-true-count and loaded-count without prop churn.
  const data = q && q.trim()
    ? { results: state.results, expanded: state.expanded, warning: state.warning, total: state.total }
    : null;

  return { data, loading, loadingMore, hasMore: state.hasMore, error, loadMore };
}
