import { useCallback, useEffect, useState } from 'react';

const KEY = 'dhamma:search-history';
const LIMIT = 10;
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, LIMIT) : [];
  } catch { return []; }
}

function write(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr.slice(0, LIMIT)));
  listeners.forEach((fn) => fn());
}

export default function useSearchHistory() {
  const [history, setHistory] = useState(read);

  useEffect(() => {
    const update = () => setHistory(read());
    listeners.add(update);
    return () => listeners.delete(update);
  }, []);

  const push = useCallback((q) => {
    const term = (q || '').trim();
    if (!term) return;
    const cur = read();
    const next = [term, ...cur.filter((x) => x !== term)].slice(0, LIMIT);
    write(next);
  }, []);

  const clear = useCallback(() => write([]), []);

  return { history, push, clear };
}
