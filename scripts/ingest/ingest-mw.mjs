// Ingest the Monier-Williams Sanskrit-English Dictionary (1899) into
// dictionary_entries with source='mw', language='san'. First non-Pali
// dictionary in the cascade; opens the door to Pali↔Sanskrit cognate
// cross-reference and a Mahāyāna corpus down the road.
//
// Source: github.com/sanskrit-lexicon/csl-sqlite releases — mw.zip
// (~27 MB compressed, ~85 MB uncompressed mw.sqlite). The Cologne
// Digital Sanskrit Lexicon's MW digitization. SLP1-encoded headwords
// and Sanskrit citations; we transliterate to IAST so the headwords
// store as `dharma`, `nirvāṇa`, `saṃsāra` etc., matching the convention
// used for Pali.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   curl -sL -o .cache/mw/mw.zip \
//     "https://github.com/sanskrit-lexicon/csl-sqlite/releases/latest/download/mw.zip"
//   (cd .cache/mw && unzip -o mw.zip)
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node ingest-mw.mjs
//
// Notes
// - mw.sqlite has one table `mw(key, lnum, data)`. ~286k rows; ~194k
//   primary entries plus continuations (H1A/H1B/... follow H1 etc.).
//   We group continuations under their parent so one IAST headword
//   homonym = one dictionary_entries row.
// - SLP1 → IAST is char-by-char. Accent marks (/ \ ^) are stripped
//   from <key1>/<key2>/<s>/<s1> tag content; they're for editorial
//   recovery, not display.
// - The XML markup (<H1>, <body>, <lex>, <ls>, <ab>, <info/>, <tail>,
//   <hom>, etc.) survives in the stored definition. The frontend
//   sanitizer (src/dictHtml.js) strips unknown wrapper tags at render
//   time and keeps only inline-typography tags (b/i/em/strong/abbr/
//   p/br/hr/span/sup/sub). We DO rewrite <s>/<s1>/<key1>/<key2>
//   content from SLP1 to IAST here so what reaches the reader is
//   human-readable.
// - language='san' (NOT 'pli'). The /api/lookup endpoint defaults to
//   language='pli'; the smoke check passes ?language=san explicitly.
//
// License: the Cologne digitization is freely redistributable; MW
// itself is long out of copyright (1899). See LICENSE.md in
// sanskrit-lexicon/csl-sqlite for the data attribution.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MW_FILE = path.join(__dirname, '.cache', 'mw', 'mw.sqlite');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
if (!fs.existsSync(MW_FILE)) {
  console.error(`missing ${MW_FILE} — download mw.zip from`);
  console.error('  https://github.com/sanskrit-lexicon/csl-sqlite/releases/latest');
  process.exit(1);
}

// ------------------------------------------------------------------
// SLP1 → IAST. The Cologne data is in SLP1, a 1:1 reversible ASCII
// scheme used by sanskritists. Each character maps to one IAST char
// or digraph. The accent marks (udatta / anudatta / svarita: / \ ^)
// are stripped before transliteration — they're editorial markup
// recovered from the print scans, not part of the surface form.
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// Rewrite the MW XML body into something the frontend sanitizer (which
// strips everything outside b/i/em/strong/abbr/p/br/hr/span/sup/sub)
// can render cleanly.
//
//  - Drop the <h>...</h> header (it's the headword block — the lemma
//    is already stored separately).
//  - Drop the <tail>...</tail> footer (<L>lnum</L><pc>page,col</pc>
//    page references that would otherwise leak in as bare numbers).
//  - Drop <info .../> editorial markers.
//  - Transliterate SLP1 → IAST inside <s>, <s1> (Sanskrit cites) and
//    map them to <i>.
//  - Map <hom>X</hom> homonym number to <sup>X</sup>.
//  - Map <lex>X</lex> grammar/lex info to <em>X</em>.
//  - Other unknown wrappers (<H1>, <body>, <ls>, <ab>, <lang>, <etym>,
//    <gk>, …) are left in place and stripped by the client sanitizer,
//    which preserves their text content.
// ------------------------------------------------------------------
function preparedDefinition(xml) {
  let s = xml;
  s = s.replace(/<h>[\s\S]*?<\/h>/g, '');
  s = s.replace(/<tail>[\s\S]*?<\/tail>/g, '');
  // Self-closing editorial markers — info, listinfo, srs (sandhi-reset
  // separator). srs lives inside Sanskrit-cite tags so it must be
  // stripped *before* the <s>...</s> rewrite below or the cite's text
  // would be split into two non-contiguous pieces our regex can't span.
  s = s.replace(/<(info|listinfo|srs)\b[^>]*\/?>/g, '');
  s = s.replace(/<(s1?)>([^<]*)<\/\1>/g, (_, _tag, inner) => `<i>${slp1ToIast(inner)}</i>`);
  s = s.replace(/<hom>([^<]*)<\/hom>/g, '<sup>$1</sup>');
  s = s.replace(/<lex\b[^>]*>([^<]*)<\/lex>/g, '<em>$1</em>');
  return s;
}

// ------------------------------------------------------------------
// Connect.
// ------------------------------------------------------------------
const sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 20 });
const mw  = new DatabaseSync(MW_FILE, { readOnly: true });

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

console.log('[mw] verifying schema…');
const [{ exists }] = await sql`
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dictionary_entries') AS exists
`;
if (!exists) {
  console.error('dictionary_entries table not present — apply server/sql/schema.sql first');
  process.exit(1);
}

console.log('[mw] reading mw.sqlite…');
const total = mw.prepare('SELECT COUNT(*) AS n FROM mw').get().n;
console.log(`[mw] ${total} source rows in mw.sqlite`);

// Walk rows in lnum order. A row whose data starts with <H{n}> (no
// trailing letter) opens a new primary entry; <H{n}A>, <H{n}B>, ...
// rows append to the most recent primary as sub-senses.
const PRIMARY_TAG = /^<H\d+>/;
const ANY_H_TAG   = /^<H\d+[A-Z]?>/;

let current = null;
let batch = [];
let inserted = 0;
let primaries = 0;
let continuations = 0;
let orphans = 0;

async function emit() {
  if (!current) return;
  // Build the merged HTML body. Each row's data is one <H?...>...</H?>
  // unit; concatenate them with no extra whitespace.
  const definition = current.bodies.map(preparedDefinition).join('');
  const headword = current.lemma.toLowerCase();
  batch.push({
    source:         'mw',
    source_id:      current.source_id,
    headword_lower: headword,
    lemma:          current.lemma,
    lemma_lower:    headword,
    language:       'san',
    pos:            null,
    grammar:        null,
    definition,
    definition_lit: null,
    definition_alt: null,
    sanskrit:       null,
    construction:   null,
    root:           null,
    example:        null,
    notes:          null,
  });
  current = null;
  if (batch.length >= BATCH) {
    await flushEntries(batch);
    inserted += batch.length;
    batch = [];
    process.stdout.write(`  entries ${inserted}\r`);
  }
}

const iter = mw.prepare('SELECT key, lnum, data FROM mw ORDER BY lnum').iterate();
for (const row of iter) {
  const data = row.data;
  if (!ANY_H_TAG.test(data)) continue; // unknown shape — skip
  const isPrimary = PRIMARY_TAG.test(data);
  if (isPrimary) {
    await emit();
    primaries++;
    current = {
      source_id: String(row.lnum),
      key:       row.key,
      lemma:     slp1ToIast(row.key),
      bodies:    [data],
    };
  } else {
    if (!current || row.key !== current.key) {
      // Continuations should share the parent's key. If the data is
      // ever shuffled out of order, drop the row rather than corrupt
      // the parent. In practice mw.sqlite is well-ordered.
      orphans++;
      continue;
    }
    continuations++;
    current.bodies.push(data);
  }
}
await emit();

if (batch.length) {
  await flushEntries(batch);
  inserted += batch.length;
}

const [{ count }] = await sql`
  SELECT COUNT(*)::int AS count FROM dictionary_entries WHERE source = 'mw'
`;

console.log(`\n[mw] done in ${Math.round((Date.now() - t0) / 1000)}s`);
console.log(`  source rows:       ${total}`);
console.log(`  primary entries:   ${primaries}`);
console.log(`  continuations:     ${continuations}`);
console.log(`  orphans (skipped): ${orphans}`);
console.log(`  inserted/updated:  ${inserted}`);
console.log(`  total source=mw in DB: ${count}`);

await sql.end();
mw.close();
