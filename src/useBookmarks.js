// Per-device passage bookmarks, stored in localStorage. No server
// involvement — scholars on multiple devices keep separate lists.
// Schema: array of { id, citation, title, work, addedAt } sorted
// newest-first. The reader toggles by id; the view reads the whole
// list for browsing.

import { useEffect, useState, useCallback } from 'react';

const KEY = 'dhamma:bookmarks';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota / safari private */ }
}

export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(read);

  // Cross-tab sync via the storage event so a bookmark added in one
  // tab shows up in the other.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY) setBookmarks(read());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const has = useCallback((id) => bookmarks.some((b) => b.id === id), [bookmarks]);

  const toggle = useCallback((entry) => {
    if (!entry || !entry.id) return;
    setBookmarks((cur) => {
      const exists = cur.some((b) => b.id === entry.id);
      const next = exists
        ? cur.filter((b) => b.id !== entry.id)
        : [{ ...entry, addedAt: Date.now() }, ...cur];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setBookmarks((cur) => {
      const next = cur.filter((b) => b.id !== id);
      write(next);
      return next;
    });
  }, []);

  return { bookmarks, has, toggle, remove };
}
