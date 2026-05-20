// /api/lookup execution. Resolves a surface-form term (the user's
// selection in PassageCard, or a query typed in the Dictionary page)
// to dictionary entries.
//
// Three search modes, mirroring the corpus search:
//   - 'exact'   — only headword/lemma exact match (with diacritic fold).
//     Strict. No cascade, no fallback.
//   - 'stem'    — exact + english-reverse + Pali fallback cascade
//     (inflection / stem-prefix / literal prefix / compound). The
//     default; matches everything the legacy lookup did.
//   - 'meaning' — vector ANN over `embedding` (BGE-M3, 1024-dim,
//     shared vector space with passages). Semantic search; lets the
//     reader find Pali words from an English phrase like "the chief
//     disciple known for mindfulness".
//
// By default cascades across four sources:
//   - 'dpd'  — Digital Pali Dictionary (lexical, with inflections)
//   - 'dppn' — Dictionary of Pali Proper Names, Malalasekera 1937
//     rev. Ānandajoti 2025 (biographical)
//   - 'ped'  — PTS Pali-English Dictionary, Rhys Davids & Stede 1921-25
//     (the canonical Western lexicon — cross-reference against DPD on
//     contested word meanings)
//   - 'mw'   — Monier-Williams Sanskrit-English Dictionary (1899). The
//     first non-Pali source; language='san'. Surfaces only when the
//     request specifies language=san — the language filter on each
//     query keeps MW out of pli-only lookups by default.
//   - 'bhs'  — Buddhist Hybrid Sanskrit Dictionary (Edgerton 1953).
//     Companion to MW for the transitional Skt of Mahāyāna sūtras and
//     early Buddhist Sanskrit literature. language='san', same gating.
//   - 'cped' — Concise Pali-English Dictionary (Buddhadatta 1949,
//     ed. Ānandajoti, via Ancient Buddhist Texts). Compact classroom
//     glosses; complements DPD and PED. language='pli', surfaces
//     under default Pali lookups.
// so a single click on "Anāthapiṇḍika" returns DPD's lemma, DPPN's
// biography, and PED's lexical entry side-by-side. Pass source='X'
// (string or comma-list) to restrict.
//
// In stem mode the fallback cascade runs per source in parallel; each
// source independently looks for: headword exact → inflection (DPD
// only) → stem-prefix → literal prefix → compound decomposition (DPD
// only). This is what lets "Vesāli" find DPD's vesālī (via inflection)
// AND DPPN's Vesālī (via literal prefix) at the same time. Each
// source returns up to MAX_PER_SOURCE entries; the UI groups by source.

import { sql } from './db.js';
import { stemForPrefix, foldDiacritics } from './paliStem.js';
import { embedQuery } from './embed.js';

const MAX_PER_SOURCE = 10;
const MAX_TERM_LEN = 60;
const MODES = new Set(['exact', 'stem', 'meaning']);

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

// Per-source fallback cascade. Headword/lemma exact match runs at the
// runLookup level across all sources (step 0) so it can short-circuit
// the english-reverse path when a Pali word was typed without
// diacritics. This per-source cascade picks up where step 0 left off:
// inflection → stem-prefix → literal prefix → compound. Each source
// runs independently so a query that hits DPD via inflection still
// gets a chance to hit DPPN via prefix. Every step also matches the
// diacritic-folded query against the corresponding folded column, so
// "sampajano" can still find DPD's "sampajāno" inflection of "sampajāna".
async function paliCascadeFallback(q, source, language) {
  let entries;
  const qFolded = foldDiacritics(q);

  // 1) Inflection lookup — DPD-specific (DPPN/PED don't decline).
  if (source === 'dpd') {
    entries = await sql`
      SELECT DISTINCT ON (de.id)
             de.id, de.source, de.source_id, de.lemma, de.language, de.pos, de.grammar,
             de.definition, de.definition_lit, de.definition_alt,
             de.sanskrit, de.construction, de.root, de.example, de.notes
      FROM dictionary_inflections di
      JOIN dictionary_entries de ON de.id = di.entry_id
      WHERE (di.surface_lower = ${q} OR di.surface_folded = ${qFolded})
        AND de.source = ${source} AND de.language = ${language}
      ORDER BY de.id
      LIMIT ${MAX_PER_SOURCE}
    `;
    if (entries.length) return { entries, matched_via: 'inflection' };
  }

  // 2) Pali-stem-then-prefix fallback. DPD's TSV inflection table only
  //    includes forms with enclitic particles (sampajānoti, sampajānova).
  //    A user-typed bare inflection (sampajāno) won't match exactly, but
  //    its heuristic stem (sampajān) is a prefix of the headword sampajāna.
  if (q.length >= 4) {
    const stem = stemForPrefix(q);
    if (stem && stem.length >= 3) {
      const stemFolded = foldDiacritics(stem);
      entries = await sql`
        SELECT ${ENTRY_FIELDS}
        FROM dictionary_entries
        WHERE (headword_lower LIKE ${stem + '%'}
            OR lemma_lower LIKE ${stem + '%'}
            OR headword_folded LIKE ${stemFolded + '%'})
          AND source = ${source} AND language = ${language}
        ORDER BY LENGTH(COALESCE(headword_lower, lemma_lower)), headword_lower
        LIMIT ${MAX_PER_SOURCE}
      `;
      if (entries.length) return { entries, matched_via: 'stem-prefix' };
    }
  }

  // 3) Literal prefix on user input — catches partial typing and final-vowel
  //    differences. Crucial for DPPN where the user typing "Vesāli" should
  //    find the entry "Vesālī" (long ī).
  if (q.length >= 3) {
    entries = await sql`
      SELECT ${ENTRY_FIELDS}
      FROM dictionary_entries
      WHERE (headword_lower LIKE ${q + '%'}
          OR lemma_lower LIKE ${q + '%'}
          OR headword_folded LIKE ${qFolded + '%'})
        AND source = ${source} AND language = ${language}
      ORDER BY LENGTH(COALESCE(headword_lower, lemma_lower)), headword_lower
      LIMIT ${MAX_PER_SOURCE}
    `;
    if (entries.length) return { entries, matched_via: 'prefix' };
  }

  // 4) Compound-decomposition — DPD-only. Many Pali words are productive
  //    compounds (maggādhipati = magga + adhipati, with vowel sandhi) that
  //    DPD doesn't catalog directly. Scan for DPD headwords that appear as
  //    substrings of the user's input, expanded for common sandhi (long
  //    vowels ↔ short pairs). Skipped for DPPN/PED to avoid surfacing
  //    every short proper name that happens to be a substring of a compound.
  //    Also tries the folded query so a user typing "sampajano" decomposes
  //    via "sampajana" against DPD's folded headwords.
  if (source === 'dpd' && q.length >= 5) {
    const variants = new Set([q]);
    if (q.includes('ā')) variants.add(q.replace(/ā/g, 'aa'));
    if (q.includes('ī')) variants.add(q.replace(/ī/g, 'ii'));
    if (q.includes('ū')) variants.add(q.replace(/ū/g, 'uu'));
    const matches = new Map();
    for (const v of variants) {
      const vFolded = foldDiacritics(v);
      const rows = await sql`
        SELECT ${ENTRY_FIELDS}, headword_lower
        FROM dictionary_entries
        WHERE LENGTH(COALESCE(headword_lower, lemma_lower)) >= 4
          AND (POSITION(COALESCE(headword_lower, lemma_lower) IN ${v}) > 0
            OR POSITION(headword_folded IN ${vFolded}) > 0)
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

export async function runLookup({ term, source, language = 'pli', mode }) {
  const t0 = Date.now();
  if (!sql) return { term, entries: [], took_ms: 0 };

  const raw = clean(String(term || ''));
  const q = normalize(raw);
  if (!q) return { term: raw, entries: [], took_ms: 0 };

  // Default to lexical (dpd) + proper-name (dppn) + PTS lexicon (ped)
  // + Monier-Williams Sanskrit (mw). MW only matches when language='san'
  // is requested explicitly; under the default language='pli' it's
  // queried but the language filter returns zero rows, so it adds no
  // noise to Pali lookups.
  const sources = !source
    ? ['dpd', 'dppn', 'ped', 'cped', 'mw', 'bhs']
    : Array.isArray(source) ? source
    : String(source).includes(',') ? String(source).split(',').map((s) => s.trim()).filter(Boolean)
    : [String(source)];

  // Mode: undefined / unknown values fall through to 'stem' (the
  // legacy default behavior). Only 'exact' and 'meaning' branch off.
  const m = MODES.has(mode) ? mode : 'stem';

  // Meaning mode: vector ANN over the embedding column, ranked by
  // cosine distance, per source. Skips the lexical cascade entirely.
  //
  // Each source has its own partial HNSW index
  // (idx_dict_embedding_dpd, ..._dppn, ..._ped) so a per-source
  // ORDER BY embedding <=> q LIMIT 10 query uses that source's index
  // directly — no global-vs-filtered candidate-set-too-small problem
  // that the monolithic HNSW had. Sub-second on the small DB box.
  if (m === 'meaning') {
    let qVec;
    try { qVec = await embedQuery(q); }
    catch (err) {
      return { term: raw, normalized: q, matched_via: null, entries: [], took_ms: Date.now() - t0, error: 'embed-failed' };
    }
    const qVecLit = `[${qVec.join(',')}]`;
    const perSource = await Promise.all(sources.map((s) => sql`
      SELECT ${ENTRY_FIELDS},
             (embedding <=> ${qVecLit}::vector) AS distance
      FROM dictionary_entries
      WHERE source = ${s} AND language = ${language}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${qVecLit}::vector
      LIMIT ${MAX_PER_SOURCE}
    `));
    const meaningEntries = perSource.flat();
    return {
      term: raw,
      normalized: q,
      matched_via: 'meaning',
      entries: meaningEntries.map(projectEntry),
      took_ms: Date.now() - t0,
    };
  }

  // Step 0 — exact headword/lemma match across ALL sources. Pulled out
  // of the per-source cascade so it can short-circuit english-reverse
  // when a Pali word was typed without diacritics (sati, dhamma,
  // buddha). Without this, looksEnglish() would treat those as English
  // and miss the canonical DPD lemma whose definition body doesn't
  // happen to contain the Pali word as English prose. Also matches
  // against the diacritic-folded headword so typing `sampajana` finds
  // the canonical `sampajāna` entry.
  const qFolded = foldDiacritics(q);
  const headwordPerSource = await Promise.all(sources.map((s) => sql`
    SELECT ${ENTRY_FIELDS}
    FROM dictionary_entries
    WHERE (headword_lower = ${q}
        OR lemma_lower = ${q}
        OR headword_folded = ${qFolded})
      AND source = ${s} AND language = ${language}
    ORDER BY (headword_lower = ${q} OR lemma_lower = ${q}) DESC, source_id
    LIMIT ${MAX_PER_SOURCE}
  `));
  const headwordEntries = headwordPerSource.flat();
  if (headwordEntries.length > 0) {
    return {
      term: raw,
      normalized: q,
      matched_via: 'headword',
      entries: headwordEntries.map(projectEntry),
      took_ms: Date.now() - t0,
    };
  }

  // Exact mode stops here — no reverse search, no fallback cascade.
  if (m === 'exact') {
    return {
      term: raw,
      normalized: q,
      matched_via: null,
      entries: [],
      took_ms: Date.now() - t0,
    };
  }

  // Step 1 — English → Pali reverse lookup. Only reached when step 0
  // found nothing exact, so we know the term isn't a known headword in
  // any source. Per-source LIMITs keep DPPN biographies from being
  // crowded out by DPD's shorter lemma defs under a single ORDER BY
  // LENGTH.
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
    // Fall through to Pali fallback cascade.
  }

  // Step 2 — per-source fallback cascade (inflection, stem-prefix,
  // literal prefix, compound). Headword already tried in step 0.
  const results = await Promise.all(sources.map((s) => paliCascadeFallback(q, s, language)));
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
