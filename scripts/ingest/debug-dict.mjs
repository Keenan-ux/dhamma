import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

console.log('--- total counts ---');
const [{ entries }] = await sql`SELECT COUNT(*)::int AS entries FROM dictionary_entries`;
const [{ infls }]   = await sql`SELECT COUNT(*)::int AS infls   FROM dictionary_inflections`;
console.log(`entries: ${entries}, inflections: ${infls}`);

console.log('\n--- nibbāna lemma search ---');
const a = await sql`SELECT id, source_id, lemma, lemma_lower FROM dictionary_entries WHERE lemma_lower LIKE 'nibb%' LIMIT 6`;
for (const r of a) console.log(`  id=${r.id} source_id=${r.source_id} lemma=${r.lemma} lemma_lower=${r.lemma_lower}`);

console.log('\n--- entries where source_id contains sampajāna ---');
const b = await sql`SELECT source_id, lemma FROM dictionary_entries WHERE source_id LIKE 'sampaj%' LIMIT 10`;
for (const r of b) console.log(`  ${r.source_id}  →  lemma=${r.lemma}`);

console.log('\n--- inflection records for sampajāna 1 ---');
const c = await sql`
  SELECT di.surface_lower
  FROM dictionary_inflections di
  JOIN dictionary_entries de ON de.id = di.entry_id
  WHERE de.source_id = 'sampajāna 1'
  ORDER BY di.surface_lower
  LIMIT 30
`;
for (const r of c) console.log(`  ${r.surface_lower}`);

await sql.end();
