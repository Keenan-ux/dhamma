// Research notes: the operator's private reading annotations on the Research +
// Explorations studies. Modeled on useNotes.js (the per-passage notes), but the
// collection kind is 'research-notes', which the server gates to ADMINS only.
//
// Signed-in admin: synced to the account (so the notes follow across devices and,
// crucially, are readable by the operator from the database). On first sign-in
// the local + server lists merge once (union by id, newer wins); every change is
// pushed (debounced). Signed-out / non-admin: the UI is never shown, so this hook
// stays inert (local-only).
//
// Each note is anchored to a study (collection + slug) and to the selected quote
// plus the nearest section heading, so it can be jumped back to and so the
// operator knows exactly what passage of the study the note is about:
//
//   {
//     id:         "rn_<random>",
//     collection: "research" | "explorations",
//     slug:       "awakening",
//     studyTitle: "Every Instance of Awakening …",
//     heading:    "In the early discourses",      // nearest <h2> text
//     headingId:  "in-the-early-discourses",       // for jump-to-section
//     excerpt:    "the exact selected quote",
//     text:       "the note body, free-form",
//     status:     "open",                          // "open" | "answered"
//     createdAt:  1700000000000,
//     updatedAt:  1700000000000,
//   }

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth.jsx';

const KEY = 'dhamma:research-notes';

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
  return 'rn_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// Union two lists by id; on collision keep the newer (by updatedAt). Newest-first.
function mergeById(a, b) {
  const map = new Map();
  for (const item of [...(a || []), ...(b || [])]) {
    if (!item || !item.id) continue;
    const prev = map.get(item.id);
    if (!prev || (item.updatedAt || 0) >= (prev.updatedAt || 0)) map.set(item.id, item);
  }
  return Array.from(map.values()).sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0));
}

export default function useResearchNotes() {
  const { user, isAdmin } = useAuth();
  const [notes, setNotes] = useState(read);
  const reconciledFor = useRef(null);
  const pushTimer = useRef(null);

  // Only admins sync to the server (the kind is admin-gated server-side). A
  // non-admin would just 403, so we never push for them.
  const canSync = !!user && !!isAdmin;

  const pushToServer = useCallback((list) => {
    if (!canSync) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      fetch('/api/user/research-notes', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: list }),
      }).catch(() => {});
    }, 600);
  }, [canSync]);

  const persist = useCallback((list) => { write(list); pushToServer(list); }, [pushToServer]);

  useEffect(() => {
    function onStorage(e) { if (e.key === KEY) setNotes(read()); }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!canSync) { reconciledFor.current = null; return; }
    if (reconciledFor.current === user.id) return;
    reconciledFor.current = user.id;
    let cancelled = false;
    fetch('/api/user/research-notes', { credentials: 'same-origin' })
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
  }, [canSync, user, persist]);

  const create = useCallback((entry) => {
    if (!entry || !entry.slug || !entry.text) return null;
    const now = Date.now();
    const note = {
      id: randomId(),
      collection: entry.collection || 'research',
      slug: entry.slug,
      studyTitle: entry.studyTitle || '',
      heading: entry.heading || '',
      headingId: entry.headingId || '',
      excerpt: entry.excerpt || '',
      text: entry.text || '',
      status: 'open',
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

  const forStudy = useCallback((collection, slug) => {
    if (!slug) return [];
    return notes.filter((n) => n.collection === collection && n.slug === slug);
  }, [notes]);

  return { notes, create, update, remove, forStudy };
}
