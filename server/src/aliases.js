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

import { sql } from './db.js';

let _byTerm = null;
let _byEquiv = null;
let _readyPromise = null;

export function aliasesReady() {
  if (!_readyPromise) {
    _readyPromise = (async () => {
      if (!sql) {
        _byTerm = new Map();
        _byEquiv = new Map();
        return;
      }
      const rows = await sql`SELECT term, equivalents FROM aliases`;
      _byTerm = new Map();
      _byEquiv = new Map();
      for (const r of rows) {
        const canon = r.term.toLowerCase();
        _byTerm.set(canon, r.equivalents);
        for (const eq of r.equivalents) {
          _byEquiv.set(String(eq).toLowerCase(), canon);
        }
      }
      console.log(`[aliases] loaded ${_byTerm.size} entries`);
    })();
  }
  return _readyPromise;
}

export function aliasesFor(term) {
  if (!_byTerm) return [];
  const lower = String(term).toLowerCase();
  // Direct hit: term is the canonical, return its equivalents.
  if (_byTerm.has(lower)) return _byTerm.get(lower);
  // Reverse hit: term is one of the equivalents. Return the canonical
  // plus the OTHER equivalents (so the user-typed word doesn't appear
  // in its own alias list, which would dilute the OR-group).
  const canon = _byEquiv.get(lower);
  if (canon) {
    const siblings = _byTerm.get(canon) || [];
    return [canon, ...siblings.filter((s) => s.toLowerCase() !== lower)];
  }
  return [];
}
