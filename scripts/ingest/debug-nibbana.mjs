import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

console.log('--- source_id like nibbāna% (10 rows) ---');
const a = await sql`SELECT source_id, lemma, lemma_lower, pos, definition FROM dictionary_entries WHERE source_id LIKE 'nibbā%' LIMIT 10`;
for (const r of a) console.log(`  ${r.source_id.padEnd(20)} | lemma=${r.lemma.padEnd(20)} | pos=${r.pos}`);

console.log('\n--- lemma_lower like nibbā% (10 rows) ---');
const b = await sql`SELECT source_id, lemma, lemma_lower FROM dictionary_entries WHERE lemma_lower LIKE 'nibbā%' LIMIT 10`;
for (const r of b) console.log(`  ${r.source_id.padEnd(20)} | lemma=${r.lemma}`);

console.log('\n--- exact lemma_lower nibbāna ---');
const c = await sql`SELECT COUNT(*)::int AS n FROM dictionary_entries WHERE lemma_lower = 'nibbāna'`;
console.log(`  count: ${c[0].n}`);

console.log('\n--- all distinct lemma_lower values matching ni%ana ---');
const d = await sql`SELECT DISTINCT lemma_lower FROM dictionary_entries WHERE lemma_lower LIKE 'ni%āna' ORDER BY lemma_lower LIMIT 20`;
for (const r of d) console.log(`  ${r.lemma_lower}`);

await sql.end();
