// Single-passage fetch with module-level Map cache. Repeated reads of the
// same id (browse → reading mode → unpin → re-pin) hit cache, no network.

import { useEffect, useState } from 'react';
import { passageApi } from './api.js';

const _cache = new Map();

export default function usePassage(id) {
  const [data, setData] = useState(() => (id ? _cache.get(id) || null : null));
  const [loading, setLoading] = useState(!!id && !_cache.has(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    if (_cache.has(id)) {
      setData(_cache.get(id));
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    passageApi(id)
      .then((r) => {
        _cache.set(id, r);
        if (alive) { setData(r); setLoading(false); setError(null); }
      })
      .catch((err) => {
        if (alive) { setError(err); setLoading(false); }
      });
    return () => { alive = false; };
  }, [id]);

  return { data, loading, error };
}
