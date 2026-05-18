import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

for (const term of ['dhamma', 'sati', 'kamma', 'nibbāna']) {
  console.log(`\n--- source_id LIKE '${term}%' ---`);
  const r = await sql`SELECT source_id, headword_lower, lemma FROM dictionary_entries WHERE source_id LIKE ${term + '%'} LIMIT 8`;
  for (const x of r) console.log(`  source_id=${JSON.stringify(x.source_id)} headword_lower=${JSON.stringify(x.headword_lower)} lemma=${x.lemma}`);
}

await sql.end();
