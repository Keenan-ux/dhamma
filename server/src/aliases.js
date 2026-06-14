// Cross-canon term equivalences. Loaded once at boot into in-memory
// Maps — the table is small (15 today, expected hundreds long-term)
// so per-query DB hits are unnecessary. Refresh requires server restart.
//
// Two indexes:
//   _byTerm:  canonical term  -> [equivalents]
//   _byEquiv: any equivalent  -> canonical term
//
// aliasesFor() consults both so a query for any equivalent surfaces the
// canonical entry plus its siblings — e.g. searching "loving-kindness"
// finds the mettā row via _byEquiv and expands to mettā + friendliness +
// 慈, the same as searching "mettā" directly. Stem mode and the
// embedding-side query expansion both depend on this bidirectional
// lookup to bridge English ↔ Pāli vocabulary differences.

import { sql, withDbRetry } from './db.js';

let _byTerm = null;
let _byEquiv = null;
let _readyPromise = null;

// Normalize a lookup key. Folds case + collapses any sequence of hyphens,
// underscores, or whitespace runs to a single space. Lets a user query
// of "loving kindness", "loving-kindness", or "LOVING_KINDNESS" all
// match the same alias row. The CANONICAL form stored on each row keeps
// whatever diacritics + hyphens it was seeded with — only the LOOKUP
// key is normalised, not the returned equivalents.
function normalizeKey(s) {
  return String(s).toLowerCase().replace(/[\s\-_]+/g, ' ').trim();
}

export function aliasesReady() {
  if (!_readyPromise) {
    _readyPromise = (async () => {
      if (!sql) {
        _byTerm = new Map();
        _byEquiv = new Map();
        return;
      }
      // Retry transient connect timeouts: at a cold boot dhamma-pg may still
      // be waking, and a failed load here used to leave alias expansion
      // silently disabled until the next restart (Stem/Meaning OR-expansion
      // does nothing without this map).
      const rows = await withDbRetry('aliases load', () => sql`SELECT term, equivalents FROM aliases`);
      _byTerm = new Map();
      _byEquiv = new Map();
      for (const r of rows) {
        const canon = normalizeKey(r.term);
        _byTerm.set(canon, r.equivalents);
        for (const eq of r.equivalents) {
          _byEquiv.set(normalizeKey(eq), canon);
        }
      }
      console.log(`[aliases] loaded ${_byTerm.size} entries`);
    })().catch((err) => {
      // Don't memoize a rejected promise. If the load ultimately fails (all
      // retries exhausted at boot), reset so the NEXT caller — the lazy
      // `await aliasesReady()` in /api/search and /api/lookup — re-attempts a
      // fresh load instead of inheriting a permanently-failed cache that keeps
      // alias expansion off until a restart. Re-throw so this attempt's
      // awaiter still sees the failure.
      _readyPromise = null;
      throw err;
    });
  }
  return _readyPromise;
}

export function aliasesFor(term) {
  if (!_byTerm) return [];
  const key = normalizeKey(term);
  // Direct hit: normalised term matches a canonical row's normalised
  // form — return its equivalents.
  if (_byTerm.has(key)) return _byTerm.get(key);
  // Reverse hit: term matches one of an entry's equivalents (under the
  // same normalisation). Return the canonical plus the OTHER
  // equivalents (so the user-typed word doesn't appear in its own
  // alias list, which would dilute the OR-group).
  const canon = _byEquiv.get(key);
  if (canon) {
    const siblings = _byTerm.get(canon) || [];
    return [canon, ...siblings.filter((s) => normalizeKey(s) !== key)];
  }
  return [];
}
