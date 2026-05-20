// Ingest the Edgerton Buddhist Hybrid Sanskrit Dictionary (1953) into
// dictionary_entries with source='bhs', language='san'. Covers the
// transitional Sanskrit forms used in Mahāyāna sūtras and early
// Buddhist Sanskrit literature that pure-classical MW doesn't list
// (e.g. bodhisattva-as-Hybrid-Skt spellings, terms like 'tathāgata-
// garbha', Prajñāpāramitā-specific vocabulary).
//
// Source: github.com/sanskrit-lexicon/csl-sqlite releases — bhs.zip
// (~3 MB compressed, ~12 MB uncompressed bhs.sqlite). The Cologne
// Digital Sanskrit Lexicon's BHS digitization. Same shape as the MW
// distribution: a single `bhs(key, lnum, data)` table with SLP1-
// encoded headwords in <key1>...</key1> and XML bodies. Unlike MW
// there are no continuation rows — all 17,839 entries are <H1>...
// </H1> primaries — so the grouping logic is simpler.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   curl -sL -o .cache/bhs/bhs.zip \
//     "https://github.com/sanskrit-lexicon/csl-sqlite/releases/latest/download/bhs.zip"
//   (cd .cache/bhs && unzip -o bhs.zip)
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-bhs.mjs
//
// Notes
// - The SLP1 → IAST table is identical to MW's (Cologne's encoding
//   convention). The bodies already contain IAST forms in <b> tags
//   (Edgerton's print Roman transliteration), but Sanskrit citations
//   inside <s>/<s1> tags are SLP1 and need rewriting — same as MW.
// - language='san' (NOT 'pli'). Surfaces only when ?language=san is
//   passed, mirroring MW.
// - Edgerton 1953 is in the public domain in the US (pre-1964
//   publication, no renewal); Yale University Press editions are
//   widely redistributable as scholarly reference. The Cologne
//   digitization is freely redistributable; see csl-sqlite LICENSE.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BHS_FILE = path.join(__dirname, '.cache', 'bhs', 'bhs.sqlite');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
if (!fs.existsSync(BHS_FILE)) {
  console.error(`missing ${BHS_FILE} — download bhs.zip from`);
  console.error('  https://github.com/sanskrit-lexicon/csl-sqlite/releases/latest');
  process.exit(1);
}

// SLP1 → IAST. Same table as ingest-mw.mjs — both dictionaries use
// the Cologne SLP1 convention. See ingest-mw.mjs for the rationale on
// accent-mark stripping.
const SLP1_MAP = {
  a: 'a', A: 'ā', i: 'i', I: 'ī', u: 'u', U: 'ū',
  f: 'ṛ', F: 'ṝ', x: 'ḷ', X: 'ḹ',
  e: 'e', E: 'ai', o: 'o', O: 'au',
  M: 'ṃ', H: 'ḥ', '~': 'm̐',
  k: 'k', K: 'kh', g: 'g', G: 'gh', N: 'ṅ',
  c: 'c', C: 'ch', j: 'j', J: 'jh', Y: 'ñ',
  w: 'ṭ', W: 'ṭh', q: 'ḍ', Q: 'ḍh', R: 'ṇ',
  t: 't', T: 'th', d: 'd', D: 'dh', n: 'n',
  p: 'p', P: 'ph', b: 'b', B: 'bh', m: 'm',
  y: 'y', r: 'r', l: 'l', L: 'ḻ', v: 'v',
  S: 'ś', z: 'ṣ', s: 's', h: 'h',
  '|': 'ḻh',
};

function stripAccents(s) {
  return s.replace(/[/\\^]/g, '');
}

function slp1ToIast(slp1) {
  const s = stripAccents(slp1);
  let out = '';
  for (const c of s) out += SLP1_MAP[c] ?? c;
  return out;
}

// Rewrite BHS XML for the frontend sanitizer (which keeps only
// b/i/em/strong/abbr/p/br/hr/span/sup/sub and drops everything else).
//
//  - Drop <h>...</h> header (the lemma is stored separately).
//  - Drop <tail>...</tail> footer (Cologne <L>lnum</L><pc>page</pc>
//    print-recovery refs that would otherwise leak in as bare numbers).
//  - Drop <info .../>, <listinfo .../>, <srs/> editorial markers.
//  - Transliterate SLP1 → IAST inside <s>/<s1> Sanskrit cites and
//    map them to <i>.
//  - Map <hom>X</hom> homonym number to <sup>X</sup>.
//  - Map <lex>X</lex> grammar info to <em>X</em>.
//  - <lang>X</lang> (Pali/Skt./Pkt. language labels) → <em>X</em>;
//    BHS uses this prolifically since it cross-references Pali and
//    classical Skt. Without the wrap the sanitizer would still keep
//    the text but readers would lose the visual contrast.
//  - <ls>X</ls> (literature/source citation, e.g. "Mv", "BHSD") and
//    <ab>X</ab> (abbreviation, e.g. "s.v.", "comp.") are left as
//    unknown wrappers; the sanitizer preserves the inner text. Most
//    appear adjacent to a <span class='ls'> page reference that
//    survives as plain <span>.
function preparedDefinition(xml) {
  let s = xml;
  s = s.replace(/<h>[\s\S]*?<\/h>/g, '');
  s = s.replace(/<tail>[\s\S]*?<\/tail>/g, '');
  s = s.replace(/<(info|listinfo|srs)\b[^>]*\/?>/g, '');
  s = s.replace(/<(s1?)>([^<]*)<\/\1>/g, (_, _tag, inner) => `<i>${slp1ToIast(inner)}</i>`);
  s = s.replace(/<hom>([^<]*)<\/hom>/g, '<sup>$1</sup>');
  s = s.replace(/<lex\b[^>]*>([^<]*)<\/lex>/g, '<em>$1</em>');
  s = s.replace(/<lang\b[^>]*>([^<]*)<\/lang>/g, '<em>$1</em>');
  return s;
}

const sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });
const bhs = new DatabaseSync(BHS_FILE, { readOnly: true });

const ENTRY_COLS = [
  'source', 'source_id', 'headword_lower', 'lemma', 'lemma_lower', 'language',
  'pos', 'grammar', 'definition', 'definition_lit', 'definition_alt',
  'sanskrit', 'construction', 'root', 'example', 'notes',
];

const BATCH = 500;

async function flushEntries(batch) {
  await sql`
    INSERT INTO dictionary_entries ${sql(batch, ...ENTRY_COLS)}
    ON CONFLICT (source, source_id) DO UPDATE SET
      headword_lower = EXCLUDED.headword_lower,
      lemma          = EXCLUDED.lemma,
      lemma_lower    = EXCLUDED.lemma_lower,
      language       = EXCLUDED.language,
      pos            = EXCLUDED.pos,
      grammar        = EXCLUDED.grammar,
      definition     = EXCLUDED.definition,
      definition_lit = EXCLUDED.definition_lit,
      definition_alt = EXCLUDED.definition_alt,
      sanskrit       = EXCLUDED.sanskrit,
      construction   = EXCLUDED.construction,
      root           = EXCLUDED.root,
      example        = EXCLUDED.example,
      notes          = EXCLUDED.notes
  `;
}

const t0 = Date.now();

console.log('[bhs] verifying schema…');
const [{ exists }] = await sql`
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dictionary_entries') AS exists
`;
if (!exists) {
  console.error('dictionary_entries table not present — apply server/sql/schema.sql first');
  process.exit(1);
}

console.log('[bhs] reading bhs.sqlite…');
const total = bhs.prepare('SELECT COUNT(*) AS n FROM bhs').get().n;
console.log(`[bhs] ${total} source rows in bhs.sqlite`);

// All rows are <H1>...</H1> primaries — confirmed by a survey of the
// release (0 continuations across 17,839 rows). One row = one entry.
const H_TAG = /^<H\d+>/;

let batch = [];
let inserted = 0;
let primaries = 0;
let skipped = 0;

const iter = bhs.prepare('SELECT key, lnum, data FROM bhs ORDER BY lnum').iterate();
for (const row of iter) {
  if (!H_TAG.test(row.data)) { skipped++; continue; }
  primaries++;
  const lemma = slp1ToIast(row.key);
  const headword = lemma.toLowerCase();
  batch.push({
    source:         'bhs',
    source_id:      String(row.lnum),
    headword_lower: headword,
    lemma,
    lemma_lower:    headword,
    language:       'san',
    pos:            null,
    grammar:        null,
    definition:     preparedDefinition(row.data),
    definition_lit: null,
    definition_alt: null,
    sanskrit:       null,
    construction:   null,
    root:           null,
    example:        null,
    notes:          null,
  });
  if (batch.length >= BATCH) {
    await flushEntries(batch);
    inserted += batch.length;
    batch = [];
    process.stdout.write(`  entries ${inserted}\r`);
  }
}

if (batch.length) {
  await flushEntries(batch);
  inserted += batch.length;
}

const [{ count }] = await sql`
  SELECT COUNT(*)::int AS count FROM dictionary_entries WHERE source = 'bhs'
`;

console.log(`\n[bhs] done in ${Math.round((Date.now() - t0) / 1000)}s`);
console.log(`  source rows:       ${total}`);
console.log(`  primary entries:   ${primaries}`);
console.log(`  skipped:           ${skipped}`);
console.log(`  inserted/updated:  ${inserted}`);
console.log(`  total source=bhs in DB: ${count}`);

await sql.end();
bhs.close();
