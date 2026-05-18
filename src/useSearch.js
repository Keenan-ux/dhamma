// Debounced search hook. 300ms debounce; cancels in-flight requests when
// the query changes (AbortController). Empty/whitespace query → null result.

import { useEffect, useRef, useState } from 'react';
import { searchApi } from './api.js';

const DEBOUNCE_MS = 300;

export default function useSearch({ q, mode, field, limit }) {
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
      searchApi({ q, mode, field, limit, signal: ctrl.signal })
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
  }, [q, mode, field, limit]);

  return { data, loading, error };
}
