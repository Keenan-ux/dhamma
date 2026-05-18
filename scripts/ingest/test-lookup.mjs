import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

async function lookup(term) {
  const q = term.toLowerCase();
  let res = await sql`
    SELECT id, lemma, pos, definition FROM dictionary_entries
    WHERE lemma_lower = ${q} AND source = 'dpd'
    LIMIT 5
  `;
  let via = 'lemma';
  if (res.length === 0) {
    res = await sql`
      SELECT DISTINCT ON (de.id) de.id, de.lemma, de.pos, de.definition
      FROM dictionary_inflections di
      JOIN dictionary_entries de ON de.id = di.entry_id
      WHERE di.surface_lower = ${q}
      LIMIT 5
    `;
    via = 'inflection';
  }
  console.log(`\n--- "${term}" via ${via} (${res.length} hits) ---`);
  for (const e of res) console.log(`  ${e.lemma}  (${e.pos || '-'})  ${e.definition.slice(0, 90)}`);
}

await lookup('sampajāna');
await lookup('sampajāno');
await lookup('sati');
await lookup('dhamma');
await lookup('nibbāna');
await lookup('kammāra');

await sql.end();
