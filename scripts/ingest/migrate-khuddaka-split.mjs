// One-shot migration: promote the 18 Khuddaka sub-works (Milindapañha,
// Jātaka, Theragāthā, etc.) from "everything-under-pli-kn" to their own
// work entries so the Browse view shows them as distinct sub-nodes.
//
// Idempotent. Safe to re-run.
//
// Steps:
//   1. Run the ingest's ensureWorks() to seed the new work entries.
//   2. UPDATE existing passages.work_slug by ID prefix.
//   3. Report the new distribution.
//
// Run from C:\Dev\Dhamma\scripts\ingest:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node migrate-khuddaka-split.mjs

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

// New work entries to seed (Khuddaka sub-works only; the top-level Pali
// hierarchy is already in place from prior ingests).
const NEW_WORKS = [
  ['pli-kp',   'Khuddakapātha',       'pli-kn',  0],
  ['pli-dhp',  'Dhammapada',          'pli-kn',  1],
  ['pli-ud',   'Udāna',               'pli-kn',  2],
  ['pli-iti',  'Itivuttaka',          'pli-kn',  3],
  ['pli-snp',  'Sutta Nipāta',        'pli-kn',  4],
  ['pli-vv',   'Vimānavatthu',        'pli-kn',  5],
  ['pli-pv',   'Petavatthu',          'pli-kn',  6],
  ['pli-thag', 'Theragāthā',          'pli-kn',  7],
  ['pli-thig', 'Therīgāthā',          'pli-kn',  8],
  ['pli-ap',   'Apadāna',             'pli-kn',  9],
  ['pli-ja',   'Jātaka',              'pli-kn', 10],
  ['pli-nd',   'Niddesa',             'pli-kn', 11],
  ['pli-ps',   'Paṭisambhidāmagga',   'pli-kn', 12],
  ['pli-bv',   'Buddhavaṃsa',         'pli-kn', 13],
  ['pli-cp',   'Cariyāpiṭaka',        'pli-kn', 14],
  ['pli-mil',  'Milindapañha',        'pli-kn', 15],
  ['pli-ne',   'Nettippakaraṇa',      'pli-kn', 16],
  ['pli-pe',   'Peṭakopadesa',        'pli-kn', 17],
];

// Passage-id prefix → new work_slug. Order-sensitive: longer / more
// specific prefixes first (so 'thag' matches before 'th' would, etc.).
// Each pattern is matched with id LIKE 'prefix%'.
const ID_TO_WORK = [
  ['tha-ap', 'pli-ap'],   // Therā-apadāna
  ['thi-ap', 'pli-ap'],   // Therī-apadāna
  ['thag',   'pli-thag'],
  ['thig',   'pli-thig'],
  ['snp',    'pli-snp'],
  ['mil',    'pli-mil'],
  ['mnd',    'pli-nd'],   // Mahāniddesa
  ['cnd',    'pli-nd'],   // Cūḷaniddesa
  ['dhp',    'pli-dhp'],
  ['iti',    'pli-iti'],
  ['vv',     'pli-vv'],
  ['pv',     'pli-pv'],
  ['bv',     'pli-bv'],
  ['cp',     'pli-cp'],
  ['ne',     'pli-ne'],
  ['pe',     'pli-pe'],
  ['ja',     'pli-ja'],
  ['kp',     'pli-kp'],
  ['ud',     'pli-ud'],
  ['ps',     'pli-ps'],
];

console.log('[migrate] seeding new Khuddaka sub-work entries…');
for (const [slug, name, parent, order] of NEW_WORKS) {
  await sql`
    INSERT INTO works (slug, tradition_slug, parent_slug, name, display_order)
    VALUES (${slug}, 'theravada', ${parent}, ${name}, ${order})
    ON CONFLICT (slug) DO NOTHING
  `;
}
console.log(`  ${NEW_WORKS.length} work rows ensured`);

console.log('\n[migrate] reassigning passages by id prefix…');
let totalMoved = 0;
for (const [prefix, workSlug] of ID_TO_WORK) {
  // Only touch rows currently bucketed under pli-kn — avoid disturbing
  // anything else that might also happen to start with these letters.
  const result = await sql`
    UPDATE passages
    SET work_slug = ${workSlug}
    WHERE work_slug = 'pli-kn'
      AND id LIKE ${prefix + '%'}
  `;
  if (result.count > 0) {
    console.log(`  ${prefix.padEnd(8)} → ${workSlug.padEnd(10)}  ${result.count} rows`);
    totalMoved += result.count;
  }
}
console.log(`  total moved: ${totalMoved}`);

console.log('\n[migrate] new distribution under pli-kn:');
const rows = await sql`
  SELECT work_slug, COUNT(*)::int AS n
  FROM passages
  WHERE work_slug = 'pli-kn'
     OR work_slug IN (SELECT slug FROM works WHERE parent_slug = 'pli-kn')
  GROUP BY work_slug
  ORDER BY work_slug
`;
for (const r of rows) console.log(`  ${r.work_slug.padEnd(12)} ${r.n}`);

await sql.end();
console.log('\ndone.');
