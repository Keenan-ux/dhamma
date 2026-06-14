// Passage notes. Signed-out: per-device, in localStorage (unchanged).
// Signed-in: synced to the user's account so they follow across devices. On
// sign-in the local and server lists are merged once (union by id, newer wins);
// every change is pushed (debounced). The exported API is unchanged.
//
// Each note is anchored to a passage and optionally to a segment range:
//
//   {
//     id:         "n_<random>",
//     passageId:  "sn36.2",
//     citation:   "SN 36.2",
//     title:      "Sukhasutta",
//     title_en:   "Pleasure",
//     work:       "Saṃyutta Nikāya",
//     startKey:   "1.3",   // inclusive, or null for whole-passage
//     endKey:     "1.5",   // inclusive, or null
//     excerpt:    "Sukhā vedanā, …",
//     excerptEn:  "Pleasant, painful, …",
//     text:       "Note body, free-form.",
//     createdAt:  1700000000000,
//     updatedAt:  1700000000000,
//   }

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth.jsx';

const KEY = 'dhamma:notes';

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

function randomId() {
  return 'n_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// Union two note lists by id; on collision keep the newer (by updatedAt). Newest-first.
function mergeById(a, b) {
  const map = new Map();
  for (const item of [...(a || []), ...(b || [])]) {
    if (!item || !item.id) continue;
    const prev = map.get(item.id);
    if (!prev || (item.updatedAt || 0) >= (prev.updatedAt || 0)) map.set(item.id, item);
  }
  return Array.from(map.values()).sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0));
}

export default function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState(read);
  const reconciledFor = useRef(null);
  const pushTimer = useRef(null);

  const pushToServer = useCallback((list) => {
    if (!user) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      fetch('/api/user/notes', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: list }),
      }).catch(() => {});
    }, 600);
  }, [user]);

  const persist = useCallback((list) => { write(list); pushToServer(list); }, [pushToServer]);

  useEffect(() => {
    function onStorage(e) { if (e.key === KEY) setNotes(read()); }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!user) { reconciledFor.current = null; return; }
    if (reconciledFor.current === user.id) return;
    reconciledFor.current = user.id;
    let cancelled = false;
    fetch('/api/user/notes', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (cancelled) return;
        const server = Array.isArray(data.items) ? data.items : [];
        setNotes((local) => {
          const merged = mergeById(local, server);
          persist(merged);
          return merged;
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, persist]);

  const create = useCallback((entry) => {
    if (!entry || !entry.passageId) return null;
    const now = Date.now();
    const note = {
      id: randomId(),
      passageId: entry.passageId,
      citation: entry.citation || '',
      title: entry.title || '',
      title_en: entry.title_en || '',
      work: entry.work || '',
      startKey: entry.startKey || null,
      endKey: entry.endKey || null,
      excerpt: entry.excerpt || '',
      excerptEn: entry.excerptEn || '',
      text: entry.text || '',
      createdAt: now,
      updatedAt: now,
    };
    setNotes((cur) => {
      const next = [note, ...cur];
      persist(next);
      return next;
    });
    return note.id;
  }, [persist]);

  const update = useCallback((id, patch) => {
    if (!id || !patch) return;
    setNotes((cur) => {
      const next = cur.map((n) =>
        n.id === id ? { ...n, ...patch, id: n.id, updatedAt: Date.now() } : n
      );
      persist(next);
      return next;
    });
  }, [persist]);

  const remove = useCallback((id) => {
    setNotes((cur) => {
      const next = cur.filter((n) => n.id !== id);
      persist(next);
      return next;
    });
  }, [persist]);

  const forPassage = useCallback((passageId) => {
    if (!passageId) return [];
    return notes.filter((n) => n.passageId === passageId);
  }, [notes]);

  const segmentSetForPassage = useCallback((passageId) => {
    const out = new Set();
    if (!passageId) return out;
    for (const n of notes) {
      if (n.passageId !== passageId) continue;
      if (!n.startKey || !n.endKey) continue;
      out.add(n.startKey);
      out.add(n.endKey);
    }
    return out;
  }, [notes]);

  return { notes, create, update, remove, forPassage, segmentSetForPassage };
}
