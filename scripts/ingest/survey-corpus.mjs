// Quick survey of distinct canon prefixes in the current corpus.
// Tells us which Khuddaka extras are already ingested without us realizing.

import postgres from 'postgres';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

const rows = await sql`
  SELECT
    regexp_replace(id, '^([a-z][a-z-]*).*', '\\1') AS prefix,
    work_slug,
    COUNT(*)::int AS n,
    MIN(id) AS sample
  FROM passages
  GROUP BY prefix, work_slug
  ORDER BY work_slug, n DESC
`;

const byWork = new Map();
for (const r of rows) {
  if (!byWork.has(r.work_slug)) byWork.set(r.work_slug, []);
  byWork.get(r.work_slug).push(r);
}

for (const [work, prefixes] of byWork.entries()) {
  const total = prefixes.reduce((s, p) => s + Number(p.n), 0);
  console.log(`\n${work}: ${total} total`);
  for (const p of prefixes) {
    console.log(`  ${p.prefix.padEnd(12)} ${String(p.n).padStart(5)}  (e.g. ${p.sample})`);
  }
}

await sql.end();
