// One-shot: backfill works.display_order so the browse tree shows the
// canonical Theravāda ordering (DN, MN, SN, AN, KN) instead of falling
// through to alphabetical-by-slug (AN, DN, KN, MN, SN). Also orders the
// top three piṭakas (sutta, vinaya, abhidhamma) and the commentary /
// extra-canonical trees.
//
// Idempotent: safe to re-run. Uses CASE expressions keyed on slug; any
// slug not enumerated is left at 0.
//
// Usage (with flyctl proxy 15432 → dhamma-pg):
//   cd scripts/ingest
//   DATABASE_URL="postgres://dhamma:PASS@localhost:15432/dhamma" \
//     node backfill-display-order.mjs

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: false });

// Canonical orderings. Slugs not listed get display_order=0 and fall
// back to alphabetical by slug — fine for the long tail of CST works
// where canonical sequence is less culturally entrenched.
const ORDERS = [
  // Top-level Pali corpus roots
  { slug: 'pli-tipitaka',    order: 1 },
  { slug: 'pli-commentary',  order: 2 },
  { slug: 'pli-anya',        order: 3 },

  // Tipiṭaka top-level (parent: pli-tipitaka)
  { slug: 'pli-vinaya',      order: 1 },
  { slug: 'pli-sutta',       order: 2 },
  { slug: 'pli-abhidhamma',  order: 3 },

  // Five nikāyas (parent: pli-sutta) — canonical DN MN SN AN KN order
  { slug: 'pli-dn',          order: 1 },
  { slug: 'pli-mn',          order: 2 },
  { slug: 'pli-sn',          order: 3 },
  { slug: 'pli-an',          order: 4 },
  { slug: 'pli-kn',          order: 5 },

  // Commentary nikāya order mirrors sutta order
  { slug: 'pli-dn-a',        order: 1 },
  { slug: 'pli-mn-a',        order: 2 },
  { slug: 'pli-sn-a',        order: 3 },
  { slug: 'pli-an-a',        order: 4 },
  { slug: 'pli-kn-a',        order: 5 },
  { slug: 'pli-vin-a',       order: 6 },
  { slug: 'pli-abh-a',       order: 7 },
  { slug: 'pli-vism',        order: 8 },

  // Ṭīkā (sub-commentary)
  { slug: 'pli-dn-t',        order: 1 },
  { slug: 'pli-mn-t',        order: 2 },
  { slug: 'pli-sn-t',        order: 3 },
  { slug: 'pli-an-t',        order: 4 },
  { slug: 'pli-vin-t',       order: 5 },
  { slug: 'pli-abh-t',       order: 6 },
  { slug: 'pli-vism-t',      order: 7 },
];

async function main() {
  // Diagnostic: show current state for the key roots first.
  const before = await sql`
    SELECT slug, parent_slug, display_order
    FROM works
    WHERE slug IN ('pli-dn','pli-mn','pli-sn','pli-an','pli-kn',
                   'pli-vinaya','pli-sutta','pli-abhidhamma',
                   'pli-tipitaka','pli-commentary','pli-anya')
    ORDER BY parent_slug NULLS FIRST, slug
  `;
  console.log('Before:');
  console.table(before);

  let touched = 0;
  for (const { slug, order } of ORDERS) {
    const res = await sql`
      UPDATE works SET display_order = ${order}
      WHERE slug = ${slug} AND display_order IS DISTINCT FROM ${order}
    `;
    if (res.count > 0) touched += res.count;
  }
  console.log(`Rows updated: ${touched} of ${ORDERS.length} candidates`);

  const after = await sql`
    SELECT slug, parent_slug, display_order
    FROM works
    WHERE slug IN ('pli-dn','pli-mn','pli-sn','pli-an','pli-kn',
                   'pli-vinaya','pli-sutta','pli-abhidhamma',
                   'pli-tipitaka','pli-commentary','pli-anya')
    ORDER BY parent_slug NULLS FIRST, display_order, slug
  `;
  console.log('After:');
  console.table(after);

  await sql.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
