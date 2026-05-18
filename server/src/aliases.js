// Cross-canon term equivalences. Loaded once at boot into an in-memory
// Map — the table is small (15 today, expected hundreds long-term) so
// per-query DB hits are unnecessary. Refresh requires server restart.

import { sql } from './db.js';

let _cache = null;
let _readyPromise = null;

export function aliasesReady() {
  if (!_readyPromise) {
    _readyPromise = (async () => {
      if (!sql) {
        _cache = new Map();
        return;
      }
      const rows = await sql`SELECT term, equivalents FROM aliases`;
      _cache = new Map(rows.map((r) => [r.term.toLowerCase(), r.equivalents]));
      console.log(`[aliases] loaded ${_cache.size} entries`);
    })();
  }
  return _readyPromise;
}

export function aliasesFor(term) {
  if (!_cache) return [];
  return _cache.get(String(term).toLowerCase()) || [];
}
