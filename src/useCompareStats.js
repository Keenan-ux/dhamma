// Debounced /api/compare-stats hook. Mirrors useSearch shape but slower
// debounce (500ms) since the compare query is heavier and the view is
// less keystroke-driven (term typically arrives from a Compare button).

import { useEffect, useRef, useState } from 'react';
import { compareStatsApi } from './api.js';

const DEBOUNCE_MS = 500;

export default function useCompareStats({ q, limit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!q || !q.trim()) {
      if (abortRef.current) abortRef.current.abort();
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    const t = setTimeout(() => {
      compareStatsApi({ q, limit, signal: ctrl.signal })
        .then((r) => {
          if (!ctrl.signal.aborted) { setData(r); setError(null); setLoading(false); }
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          setError(err);
          setData(null);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, limit]);

  return { data, loading, error };
}
