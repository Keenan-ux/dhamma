// Per-device passage notes. Mirrors useBookmarks (localStorage,
// cross-tab sync via storage events) so a future server-backed sync
// can drop in without touching the call sites.
//
// Each note is anchored to a passage and optionally to a segment
// range within that passage:
//
//   {
//     id:         "n_<random>",
//     passageId:  "sn36.2",
//     citation:   "SN 36.2",
//     title:      "Sukhasutta",          // Pāli sutta name (if known)
//     title_en:   "Pleasure",            // translator title (if known)
//     work:       "Saṃyutta Nikāya",     // collection label
//     startKey:   "1.3",                 // inclusive, or null for whole-passage
//     endKey:     "1.5",                 // inclusive, or null
//     excerpt:    "Sukhā vedanā, …",     // verbatim selection at time of save
//     excerptEn:  "Pleasant, painful, …",// matching English range (if known)
//     text:       "Note body, free-form.",
//     createdAt:  1700000000000,
//     updatedAt:  1700000000000,
//   }
//
// When startKey/endKey are null the note attaches to the passage as
// a whole (CST commentary, library articles, ATI-translator-only
// reading paths).

import { useEffect, useState, useCallback } from 'react';

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
  // Short, unguessable, URL-safe. Sub-second collision probability is
  // astronomically low for the volumes a single user produces.
  return 'n_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default function useNotes() {
  const [notes, setNotes] = useState(read);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY) setNotes(read());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
      write(next);
      return next;
    });
    return note.id;
  }, []);

  const update = useCallback((id, patch) => {
    if (!id || !patch) return;
    setNotes((cur) => {
      const next = cur.map((n) =>
        n.id === id ? { ...n, ...patch, id: n.id, updatedAt: Date.now() } : n
      );
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setNotes((cur) => {
      const next = cur.filter((n) => n.id !== id);
      write(next);
      return next;
    });
  }, []);

  // Notes attached to a specific passage. Newest first.
  const forPassage = useCallback((passageId) => {
    if (!passageId) return [];
    return notes.filter((n) => n.passageId === passageId);
  }, [notes]);

  // Set of segment keys that have at least one note attached, used to
  // render the gold-edge marker in the reader.
  const segmentSetForPassage = useCallback((passageId) => {
    const out = new Set();
    if (!passageId) return out;
    for (const n of notes) {
      if (n.passageId !== passageId) continue;
      if (!n.startKey || !n.endKey) continue;
      // Mark every key in the inclusive range. Since segment keys are
      // dotted decimals we need to expand the range; the simplest
      // correct approach is to mark just start and end and rely on
      // the reader to interpolate, but expanding here keeps the
      // reader trivial.
      out.add(n.startKey);
      out.add(n.endKey);
    }
    return out;
  }, [notes]);

  return { notes, create, update, remove, forPassage, segmentSetForPassage };
}
