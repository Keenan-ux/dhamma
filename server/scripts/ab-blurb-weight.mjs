// A/B harness for BLURB_WEIGHT (the vec_blurb RRF lane weight in search.js).
// Runs a fixed query set through the REAL runSearch at the weight given by
// $env:BLURB_WEIGHT (search.js reads it), so each invocation tests one weight.
// Weight 0.0 = control (body-lanes-only, the pre-blurb-lane baseline).
//
// Run from C:\Dev\Dhamma\server (DATABASE_URL + MODEL_CACHE_DIR set):
//   $env:BLURB_WEIGHT="1.5"; node scripts/ab-blurb-weight.mjs

import { embedReady } from '../src/embed.js';
import { runSearch } from '../src/search.js';

const W = process.env.BLURB_WEIGHT ?? '(default 2.5)';

// Queries chosen to span the precision/aboutness tradeoff + a primary-text
// anchor + a blurb-recall case. The "expect" note is the scholarly ideal.
const QUERIES = [
  { q: 'purification of view',                 expect: 'MN 24 Rathavinīta (7 purifications)' },
  { q: 'mindfulness of breathing',             expect: 'MN 118 Ānāpānasati' },
  { q: 'loving-kindness meditation',           expect: 'Snp 1.8 Karaṇīyamettā (primary text)' },
  { q: 'the characteristic of not-self',       expect: 'SN 22.59 Anattalakkhaṇa' },
  { q: 'how a layperson should treat family',  expect: 'AN 7.13 / family-conduct suttas (blurb recall)' },
  { q: 'dependent origination',                expect: 'SN 12.x' },
];

await embedReady();
console.log(`\n################ BLURB_WEIGHT = ${W} ################`);
for (const { q, expect } of QUERIES) {
  const res = await runSearch({ q, mode: 'meaning', field: 'all', limit: 6 });
  console.log(`\n[${W}] "${q}"   (ideal: ${expect})`);
  res.results.forEach((r, i) => {
    console.log(`   ${String(i + 1).padStart(2)}. ${(r.citation || '').padEnd(11)} ${(r.title_en || r.title || '').slice(0, 40)}`);
  });
}
console.log(`\n[done weight=${W}]`);
process.exit(0);
