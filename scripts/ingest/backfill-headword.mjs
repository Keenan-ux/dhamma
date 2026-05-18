import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

console.log('[backfill] populating headword_lower from source_id…');
// Strip trailing disambiguator. DPD uses both " 1" and " 1.01" formats
// (decimal sub-numbering), so the regex covers digits + dots.
const r = await sql`
  UPDATE dictionary_entries
  SET    headword_lower = LOWER(regexp_replace(source_id, ' [0-9.]+$', ''))
  WHERE  source = 'dpd'
`;
console.log(`  updated ${r.count} rows`);

// Quick sanity check
const tests = ['nibbāna', 'sampajāna', 'dhamma', 'sati', 'kamma'];
for (const t of tests) {
  const rows = await sql`
    SELECT source_id, lemma FROM dictionary_entries
    WHERE headword_lower = ${t.toLowerCase()} AND source = 'dpd'
    LIMIT 3
  `;
  console.log(`  ${t.padEnd(12)} → ${rows.length} hits${rows.length > 0 ? ' (' + rows.map((x) => x.source_id).join(', ') + ')' : ''}`);
}

await sql.end();
