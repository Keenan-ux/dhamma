// Passage bookmarks. Signed-out: per-device, in localStorage (unchanged).
// Signed-in: synced to the user's account so they follow across devices.
// On sign-in we merge the local list with the server list once (union by id),
// then push every change (debounced). The exported API (has/toggle/remove) is
// unchanged, so call sites don't care whether a user is signed in.
//
// Schema: array of { id, citation, title, work, addedAt } sorted newest-first.

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth.jsx';

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

// Union two lists by id; on collision keep the newer (by addedAt). Newest-first.
function mergeById(a, b) {
  const map = new Map();
  for (const item of [...(a || []), ...(b || [])]) {
    if (!item || !item.id) continue;
    const prev = map.get(item.id);
    if (!prev || (item.addedAt || 0) >= (prev.addedAt || 0)) map.set(item.id, item);
  }
  return Array.from(map.values()).sort((x, y) => (y.addedAt || 0) - (x.addedAt || 0));
}

export default function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState(read);
  const reconciledFor = useRef(null);
  const pushTimer = useRef(null);

  // Debounced push of the whole list to the account (no-op when signed out).
  const pushToServer = useCallback((list) => {
    if (!user) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      fetch('/api/user/bookmarks', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: list }),
      }).catch(() => {});
    }, 600);
  }, [user]);

  const persist = useCallback((list) => { write(list); pushToServer(list); }, [pushToServer]);

  // Cross-tab sync via the storage event (per-device, signed-out or signed-in).
  useEffect(() => {
    function onStorage(e) { if (e.key === KEY) setBookmarks(read()); }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // On sign-in: pull the account list and merge with whatever is local, once.
  useEffect(() => {
    if (!user) { reconciledFor.current = null; return; }
    if (reconciledFor.current === user.id) return;
    reconciledFor.current = user.id;
    let cancelled = false;
    fetch('/api/user/bookmarks', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (cancelled) return;
        const server = Array.isArray(data.items) ? data.items : [];
        setBookmarks((local) => {
          const merged = mergeById(local, server);
          persist(merged);
          return merged;
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, persist]);

  const has = useCallback((id) => bookmarks.some((b) => b.id === id), [bookmarks]);

  const toggle = useCallback((entry) => {
    if (!entry || !entry.id) return;
    setBookmarks((cur) => {
      const exists = cur.some((b) => b.id === entry.id);
      const next = exists
        ? cur.filter((b) => b.id !== entry.id)
        : [{ ...entry, addedAt: Date.now() }, ...cur];
      persist(next);
      return next;
    });
  }, [persist]);

  const remove = useCallback((id) => {
    setBookmarks((cur) => {
      const next = cur.filter((b) => b.id !== id);
      persist(next);
      return next;
    });
  }, [persist]);

  return { bookmarks, has, toggle, remove };
}
