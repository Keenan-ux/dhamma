// Seed counts for the individual-guidance census + the load-bearing
// `kammaṭṭhāna` reconfirmation (the "the 40 is not the Buddha's" thesis rests
// on this being zero in the Tipiṭaka-mula layer). Read-only. Run via the proxy:
//   flyctl proxy 15432:5432 --app dhamma-pg
//   DATABASE_URL=postgres://postgres:<pw>@127.0.0.1:15432/dhamma node scripts/ingest/census-seed.mjs

import postgres from 'postgres';

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const sql = postgres(process.env.DATABASE_URL, { max: 2 });

// Pāli stems to profile by layer (work_role). ILIKE on the raw `original` text.
// NOTE: some stems collide (carit ↔ caritā verb; neyy ↔ other -neyya forms) —
// flagged so the census disambiguates, not relied on as final counts.
const STEMS = [
  ['kammaṭṭhān', 'kammaṭṭhāna (RECONFIRM — expect 0 in mula except Vism)'],
  ['kasiṇ',      'kasiṇa (the 10 universal bases)'],
  ['asubh',      'asubha / foulness'],
  ['ānāpān',     'ānāpāna (breath)'],
  ['anussar',    'anussati / recollection (stem anussar-)'],
  ['brahmavihār','brahmavihāra'],
  ['carit',      'carita (COLLIDES with caritā verb — disambiguate)'],
  ['ugghaṭitaññ','ugghaṭitaññū (understanding-type)'],
  ['vipañcitaññ','vipañcitaññū'],
  ['padaparam',  'padaparama'],
];

function snap(rows) {
  // { mula: n, attha: n, tika: n, anya: n, null: n }
  const out = {};
  for (const r of rows) out[r.work_role || 'null'] = Number(r.n);
  return out;
}

try {
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM passages`;
  console.log(`corpus snapshot: ${total} passages`);
  console.log('');
  for (const [stem, label] of STEMS) {
    const rows = await sql`
      SELECT work_role, count(*)::int AS n
      FROM passages WHERE original ILIKE ${'%' + stem + '%'}
      GROUP BY work_role ORDER BY work_role`;
    console.log(`${label}`);
    console.log(`   by layer: ${JSON.stringify(snap(rows))}`);
  }
  // The exact reconfirm the plan names, restricted to true Tipiṭaka-mula
  // (exclude the Visuddhimagga, which is a mula-role CST work but commentarial).
  const kt = await sql`
    SELECT work_role, count(*)::int AS n
    FROM passages WHERE original ILIKE '%kammaṭṭhān%' GROUP BY work_role ORDER BY work_role`;
  console.log('');
  console.log('RECONFIRM kammaṭṭhāna by work_role:', JSON.stringify(snap(kt)));
  const mulaWorks = await sql`
    SELECT work_slug, count(*)::int AS n
    FROM passages WHERE original ILIKE '%kammaṭṭhān%' AND work_role = 'mula'
    GROUP BY work_slug ORDER BY n DESC`;
  console.log('  mula-layer hits by work_slug (expect only Visuddhimagga / none of the four nikāyas):');
  for (const r of mulaWorks) console.log(`    ${r.work_slug}: ${r.n}`);
} finally {
  await sql.end({ timeout: 5 });
}
