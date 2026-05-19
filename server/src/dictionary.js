// /api/lookup execution. Resolves a surface-form term (the user's
// selection in PassageCard) to dictionary entries.
//
// By default cascades across both 'dpd' (Digital Pali Dictionary —
// lexical) and 'dppn' (Dictionary of Pali Proper Names by
// Malalasekera, rev. Ānandajoti 2025 — biographical) so a single click
// on "Anāthapiṇḍika" returns DPD's lemma entry alongside DPPN's
// biography. Pass source='dpd' (or 'dppn') explicitly to restrict.
//
// The cascade runs per source in parallel; each source independently
// looks for: headword exact → inflection (DPD only) → stem-prefix →
// literal prefix → compound decomposition (DPD only). This is what
// lets "Vesāli" find DPD's vesālī (via inflection) AND DPPN's Vesālī
// (via literal prefix) at the same time. Each source returns up to
// MAX_PER_SOURCE entries; the UI groups by source.
//
// English-reverse search runs as a separate first step when the term
// looks like an English word — selecting "monastery" in a translation
// pane surfaces both DPD's vihāra/ārāma and DPPN's individual
// monasteries (Jetavana, Veluvana, etc.).

import { sql } from './db.js';
import { stemForPrefix } from './paliStem.js';

const MAX_PER_SOURCE = 10;
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

// English text vs Pali text — Pali has diacritics (ā, ī, ū, ṃ, ṅ, ñ,
// ṇ, ṭ, ḍ, ḷ) almost always when written in scholarly transliteration;
// English doesn't. We use this to decide whether to do a forward
// Pali→English lookup or a reverse English→Pali search.
function looksEnglish(s) {
  if (!s || !/^[a-z][a-z\s'\-]*$/i.test(s)) return false;
  return !/[āīūēōṃṁṅñṇṭḍḷḥṛśṣ]/i.test(s);
}

const ENTRY_FIELDS = sql`
  id, source, source_id, lemma, language, pos, grammar,
  definition, definition_lit, definition_alt,
  sanskrit, construction, root, example, notes
`;

function projectEntry(e) {
  return {
    id: e.id, source: e.source, source_id: e.source_id,
    lemma: e.lemma, language: e.language, pos: e.pos, grammar: e.grammar,
    definition: e.definition, definition_lit: e.definition_lit,
    definition_alt: e.definition_alt, sanskrit: e.sanskrit,
    construction: e.construction, root: e.root, example: e.example, notes: e.notes,
  };
}

// Per-source forward (Pali → English) cascade. Returns the first
// non-empty hit set plus the step that produced it; empty if nothing
// matched. Each source runs this independently so a query that hits
// DPD via inflection still gets a chance to hit DPPN via prefix.
async function paliCascade(q, source, language) {
  // 1) Direct headword/lemma match. headword_lower is the bare canonical
  //    form (sampajāna, nibbāna, sāriputta); lemma_lower is DPD's
  //    citation form which for neuter nouns is inflected (nibbānaṃ).
  //    Match either to be lenient on whichever form the user typed.
  let entries = await sql`
    SELECT ${ENTRY_FIELDS}
    FROM dictionary_entries
    WHERE (headword_lower = ${q} OR lemma_lower = ${q})
      AND source = ${source} AND language = ${language}
    ORDER BY source_id
    LIMIT ${MAX_PER_SOURCE}
  `;
  if (entries.length) return { entries, matched_via: 'headword' };

  // 2) Inflection lookup — DPD-specific (DPPN proper names don't decline).
  if (source === 'dpd') {
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
      LIMIT ${MAX_PER_SOURCE}
    `;
    if (entries.length) return { entries, matched_via: 'inflection' };
  }

  // 3) Pali-stem-then-prefix fallback. DPD's TSV inflection table only
  //    includes forms with enclitic particles (sampajānoti, sampajānova).
  //    A user-typed bare inflection (sampajāno) won't match exactly, but
  //    its heuristic stem (sampajān) is a prefix of the headword sampajāna.
  if (q.length >= 4) {
    const stem = stemForPrefix(q);
    if (stem && stem.length >= 3) {
      entries = await sql`
        SELECT ${ENTRY_FIELDS}
        FROM dictionary_entries
        WHERE (headword_lower LIKE ${stem + '%'} OR lemma_lower LIKE ${stem + '%'})
          AND source = ${source} AND language = ${language}
        ORDER BY LENGTH(COALESCE(headword_lower, lemma_lower)), headword_lower
        LIMIT ${MAX_PER_SOURCE}
      `;
      if (entries.length) return { entries, matched_via: 'stem-prefix' };
    }
  }

  // 4) Literal prefix on user input — catches partial typing and final-vowel
  //    differences. Crucial for DPPN where the user typing "Vesāli" should
  //    find the entry "Vesālī" (long ī).
  if (q.length >= 3) {
    entries = await sql`
      SELECT ${ENTRY_FIELDS}
      FROM dictionary_entries
      WHERE (headword_lower LIKE ${q + '%'} OR lemma_lower LIKE ${q + '%'})
        AND source = ${source} AND language = ${language}
      ORDER BY LENGTH(COALESCE(headword_lower, lemma_lower)), headword_lower
      LIMIT ${MAX_PER_SOURCE}
    `;
    if (entries.length) return { entries, matched_via: 'prefix' };
  }

  // 5) Compound-decomposition — DPD-only. Many Pali words are productive
  //    compounds (maggādhipati = magga + adhipati, with vowel sandhi) that
  //    DPD doesn't catalog directly. Scan for DPD headwords that appear as
  //    substrings of the user's input, expanded for common sandhi (long
  //    vowels ↔ short pairs). Skipped for DPPN to avoid surfacing every
  //    short proper name that happens to be a substring of a compound.
  if (source === 'dpd' && q.length >= 5) {
    const variants = new Set([q]);
    if (q.includes('ā')) variants.add(q.replace(/ā/g, 'aa'));
    if (q.includes('ī')) variants.add(q.replace(/ī/g, 'ii'));
    if (q.includes('ū')) variants.add(q.replace(/ū/g, 'uu'));
    const matches = new Map();
    for (const v of variants) {
      const rows = await sql`
        SELECT ${ENTRY_FIELDS}, headword_lower
        FROM dictionary_entries
        WHERE LENGTH(COALESCE(headword_lower, lemma_lower)) >= 4
          AND POSITION(COALESCE(headword_lower, lemma_lower) IN ${v}) > 0
          AND source = ${source} AND language = ${language}
        LIMIT 100
      `;
      for (const r of rows) if (!matches.has(r.id)) matches.set(r.id, r);
    }
    entries = [...matches.values()]
      .sort((a, b) => (b.headword_lower?.length || b.lemma.length) - (a.headword_lower?.length || a.lemma.length))
      .slice(0, MAX_PER_SOURCE);
    if (entries.length) return { entries, matched_via: 'compound' };
  }

  return { entries: [], matched_via: null };
}

// Step-strength order — used to pick a single top-level matched_via
// label when multiple sources each found via different paths.
const MATCH_PRIORITY = ['headword', 'inflection', 'stem-prefix', 'prefix', 'compound', 'english-reverse'];

export async function runLookup({ term, source, language = 'pli' }) {
  const t0 = Date.now();
  if (!sql) return { term, entries: [], took_ms: 0 };

  const raw = clean(String(term || ''));
  const q = normalize(raw);
  if (!q) return { term: raw, entries: [], took_ms: 0 };

  // Default to both lexical (dpd) and proper-name (dppn) sources.
  const sources = !source
    ? ['dpd', 'dppn']
    : Array.isArray(source) ? source
    : String(source).includes(',') ? String(source).split(',').map((s) => s.trim()).filter(Boolean)
    : [String(source)];

  // English → Pali reverse lookup. Short-circuits ahead of the Pali
  // forward path because the compound-substring fallback would match
  // chance Pali fragments inside English words. Queries each source
  // separately so DPPN's long biographies aren't crowded out by DPD's
  // shorter lemma defs under a single ORDER BY LENGTH.
  if (looksEnglish(q) && q.length >= 3) {
    const perSource = await Promise.all(sources.map((s) => sql`
      SELECT ${ENTRY_FIELDS}
      FROM dictionary_entries
      WHERE source = ${s} AND language = ${language}
        AND (definition     ~* ${'\\m' + q + '\\M'}
          OR definition_alt ~* ${'\\m' + q + '\\M'}
          OR definition_lit ~* ${'\\m' + q + '\\M'})
      ORDER BY LENGTH(definition) ASC, lemma_lower ASC
      LIMIT ${MAX_PER_SOURCE}
    `));
    const englishEntries = perSource.flat();
    if (englishEntries.length > 0) {
      return {
        term: raw,
        normalized: q,
        matched_via: 'english-reverse',
        entries: englishEntries.map(projectEntry),
        took_ms: Date.now() - t0,
      };
    }
    // Fall through to Pali path: term might be an un-diacritic'd Pali word.
  }

  // Pali forward cascade — run per source in parallel and merge results.
  const results = await Promise.all(sources.map((s) => paliCascade(q, s, language)));
  const entries = results.flatMap((r) => r.entries);

  // Top-level matched_via: pick the strongest of the per-source results.
  const seen = results.map((r) => r.matched_via).filter(Boolean);
  const matchedVia = seen.length
    ? seen.slice().sort((a, b) => MATCH_PRIORITY.indexOf(a) - MATCH_PRIORITY.indexOf(b))[0]
    : null;

  return {
    term: raw,
    normalized: q,
    matched_via: matchedVia,
    entries: entries.map(projectEntry),
    took_ms: Date.now() - t0,
  };
}
