// One-shot fix: 420 rows in the translations table were tagged
// translator='sujato' source='sc' for Vinaya passages (pli-tv-bu-vb-*,
// pli-tv-bi-vb-*) — but Sujato has never translated the Vinaya. The
// content is actually Bhikkhu Brahmali's translation that an earlier
// `backfill-sc-translators.mjs` pass dropped into `passages.translation`
// (noting "translation backfilled from bilara brahmali"), and a
// subsequent pass copied `passages.translation` into the translations
// table as a `sujato` row — losing the attribution metadata.
//
// Symptom: the reader's chip switcher shows "Bhante Sujato" and
// "Bhikkhu Brahmali" but both panels display identical Brahmali text.
//
// Fix: delete the bogus sujato rows. The brahmali rows (inserted by
// ingest-sc-translators.mjs) are correct and stay. `passages.translation`
// stays populated with Brahmali's text so default-scope FTS still
// covers the Vinaya — the reader falls back to that when no per-row
// translation exists, but for these passages it will read brahmali
// from the translations table anyway.
//
// Run:
//   $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
//   node fix-vinaya-sujato-misattrib.mjs            # dry-run
//   node fix-vinaya-sujato-misattrib.mjs --apply

import postgres from 'postgres';
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 10 });

// Bogus sujato rows = sujato/sc rows on Vinaya passages whose text
// matches the brahmali/sc row for the same passage. The text-match
// guard means we only delete rows that are demonstrably mis-attributed
// (identical to Brahmali's). Genuine Sujato rows on these IDs — if any
// ever appear — would have different text and be left alone.
const bogus = await sql`
  SELECT t1.id, t1.passage_id
  FROM translations t1
  JOIN translations t2 ON t1.passage_id = t2.passage_id
  WHERE t1.translator = 'sujato' AND t1.source = 'sc'
    AND t2.translator = 'brahmali' AND t2.source = 'sc'
    AND t1.text = t2.text
    AND t1.passage_id LIKE 'pli-tv-%'
`;
console.log(`[scan] ${bogus.length} bogus sujato rows on Vinaya passages`);
for (const r of bogus.slice(0, 5)) console.log('  ', r.passage_id);
if (bogus.length > 5) console.log('  …');

if (args.apply && bogus.length > 0) {
  const ids = bogus.map((r) => r.id);
  const r = await sql`DELETE FROM translations WHERE id = ANY(${ids})`;
  console.log(`[apply] deleted ${r.count} rows`);
} else if (!args.apply) {
  console.log('[dry-run] re-run with --apply to delete');
}

await sql.end();
