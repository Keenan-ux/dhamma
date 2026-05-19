// /api/lookup execution. Resolves a surface-form term (the user's
// selection in PassageCard) to dictionary entries:
//   1. Direct lemma match (exact, case-insensitive) — fastest path.
//   2. Inflection lookup — surface_lower → entry_id via the
//      dictionary_inflections table built from DPD's per-headword
//      inflection list.
//   3. Prefix match fallback — if nothing else, return the top few
//      entries whose lemma starts with the term.
//
// Returns up to ~10 entries. UI shows them stacked. Same source can
// have multiple senses (DPD's 'sampajāna 1' vs 'sampajāna 2').

import { sql } from './db.js';
import { stemForPrefix } from './paliStem.js';

const MAX_ENTRIES = 10;
const MAX_TERM_LEN = 60;

function normalize(term) {
  return String(term || '').trim().slice(0, MAX_TERM_LEN).toLowerCase();
}

// Strip common Pali quotation markers and trailing punctuation so the
// user can select a word with surrounding text and still get a lookup.
function clean(term) {
  return term
    .replace(/^[\s.,;:!?'"‘’“”()\[\]{}—–-]+|[\s.,;:!?'"‘’“”()\[\]{}—–-]+$/g, '')
    .trim();
}

export async function runLookup({ term, source = 'dpd', language = 'pli' }) {
  const t0 = Date.now();
  if (!sql) return { term, entries: [], took_ms: 0 };

  const raw = clean(String(term || ''));
  const q = normalize(raw);
  if (!q) return { term: raw, entries: [], took_ms: 0 };

  // 1) Direct headword/lemma match. headword_lower is the bare canonical
  //    form (sampajāna, nibbāna); lemma_lower is DPD's citation form which
  //    for neuter nouns is inflected (nibbānaṃ). Match either to be
  //    lenient on whichever form the user typed.
  let entries = await sql`
    SELECT id, source, source_id, lemma, language, pos, grammar,
           definition, definition_lit, definition_alt,
           sanskrit, construction, root, example, notes
    FROM dictionary_entries
    WHERE (headword_lower = ${q} OR lemma_lower = ${q})
      AND source = ${source} AND language = ${language}
    ORDER BY source_id
    LIMIT ${MAX_ENTRIES}
  `;
  let matchedVia = entries.length > 0 ? 'headword' : null;

  // 2) Inflection lookup
  if (entries.length === 0) {
    entries = await sql`
      SELECT DISTINCT ON (de.id)
             de.id, de.source, de.source_id, de.lemma, de.language, de.pos, de.grammar,
             de.definition, de.definition_lit, de.definition_alt,
             de.sanskrit, de.construction, de.root, de.example, de.notes
      FROM dictionary_inflections di
      JOIN dictionary_entries de ON de.id = di.entry_id
      WHERE di.surface_lower = ${q}
        AND de.source = ${source} AND de.language = ${language}
      ORDER BY de.id
      LIMIT ${MAX_ENTRIES}
    `;
    if (entries.length > 0) matchedVia = 'inflection';
  }

  // 3) Pali-stem-then-prefix fallback. DPD's TSV inflection table only
  //    includes forms with enclitic particles (sampajānoti, sampajānova).
  //    A user-typed bare inflection (sampajāno) won't match exactly, but
  //    its heuristic stem (sampajān) is a prefix of the headword sampajāna.
  if (entries.length === 0 && q.length >= 4) {
    const stem = stemForPrefix(q);
    if (stem && stem.length >= 3) {
      entries = await sql`
        SELECT id, source, source_id, lemma, language, pos, grammar,
               definition, definition_lit, definition_alt,
               sanskrit, construction, root, example, notes
        FROM dictionary_entries
        WHERE (headword_lower LIKE ${stem + '%'} OR lemma_lower LIKE ${stem + '%'})
          AND source = ${source} AND language = ${language}
        ORDER BY LENGTH(COALESCE(headword_lower, lemma_lower)), headword_lower
        LIMIT ${MAX_ENTRIES}
      `;
      if (entries.length > 0) matchedVia = 'stem-prefix';
    }
  }

  // 4) Last resort — literal prefix on user input (catches partial typing)
  if (entries.length === 0 && q.length >= 3) {
    entries = await sql`
      SELECT id, source, source_id, lemma, language, pos, grammar,
             definition, definition_lit, definition_alt,
             sanskrit, construction, root, example, notes
      FROM dictionary_entries
      WHERE (headword_lower LIKE ${q + '%'} OR lemma_lower LIKE ${q + '%'})
        AND source = ${source} AND language = ${language}
      ORDER BY LENGTH(COALESCE(headword_lower, lemma_lower)), headword_lower
      LIMIT ${MAX_ENTRIES}
    `;
    if (entries.length > 0) matchedVia = 'prefix';
  }

  // 5) Compound-decomposition fallback. Many Pali words are productive
  //    compounds (maggādhipati = magga + adhipati, with vowel sandhi)
  //    that DPD doesn't catalog directly. As a last resort, scan for
  //    DPD headwords that appear as substrings of the user's input —
  //    expanded for common sandhi (long vowels ↔ short pairs) so that
  //    e.g. maggādhipatino finds both `magga` and `adhipati`. Limit to
  //    headwords ≥ 4 chars to avoid surfacing every Pali noise word.
  if (entries.length === 0 && q.length >= 5) {
    const variants = new Set([q]);
    if (q.includes('ā')) variants.add(q.replace(/ā/g, 'aa'));
    if (q.includes('ī')) variants.add(q.replace(/ī/g, 'ii'));
    if (q.includes('ū')) variants.add(q.replace(/ū/g, 'uu'));
    const matches = new Map();
    for (const v of variants) {
      const rows = await sql`
        SELECT id, source, source_id, lemma, headword_lower, language, pos, grammar,
               definition, definition_lit, definition_alt,
               sanskrit, construction, root, example, notes
        FROM dictionary_entries
        WHERE LENGTH(COALESCE(headword_lower, lemma_lower)) >= 4
          AND POSITION(COALESCE(headword_lower, lemma_lower) IN ${v}) > 0
          AND source = ${source} AND language = ${language}
        LIMIT 100
      `;
      for (const r of rows) {
        if (!matches.has(r.id)) matches.set(r.id, r);
      }
    }
    entries = [...matches.values()]
      .sort((a, b) => (b.headword_lower?.length || b.lemma.length) - (a.headword_lower?.length || a.lemma.length))
      .slice(0, MAX_ENTRIES);
    if (entries.length > 0) matchedVia = 'compound';
  }

  return {
    term: raw,
    normalized: q,
    matched_via: matchedVia,
    entries: entries.map((e) => ({
      id: e.id,
      source: e.source,
      source_id: e.source_id,
      lemma: e.lemma,
      language: e.language,
      pos: e.pos,
      grammar: e.grammar,
      definition: e.definition,
      definition_lit: e.definition_lit,
      definition_alt: e.definition_alt,
      sanskrit: e.sanskrit,
      construction: e.construction,
      root: e.root,
      example: e.example,
      notes: e.notes,
    })),
    took_ms: Date.now() - t0,
  };
}
