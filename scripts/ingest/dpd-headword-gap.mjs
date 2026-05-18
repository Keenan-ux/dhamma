import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('C:/Dev/Dhamma/scripts/ingest/.cache/dpd-released/dpd.db', { readOnly: true });

console.log('--- breakdown of 88864 dpd_headwords by meaning_1 status ---');
const counts = db.prepare(`
  SELECT
    SUM(CASE WHEN meaning_1 IS NULL OR meaning_1 = '' THEN 1 ELSE 0 END) AS empty,
    SUM(CASE WHEN meaning_1 IS NOT NULL AND meaning_1 != '' THEN 1 ELSE 0 END) AS with_meaning,
    COUNT(*) AS total
  FROM dpd_headwords
`).get();
console.log(`  with meaning_1: ${counts.with_meaning}`);
console.log(`  empty meaning_1: ${counts.empty}`);
console.log(`  total: ${counts.total}`);

console.log('\n--- sample empty-meaning entries (what are they?) ---');
const samples = db.prepare(`
  SELECT id, lemma_1, lemma_2, pos, grammar, derived_from, construction
  FROM dpd_headwords
  WHERE meaning_1 IS NULL OR meaning_1 = ''
  LIMIT 10
`).all();
for (const r of samples) {
  console.log(`  id=${r.id} lemma_1=${r.lemma_1} pos=${r.pos}`);
  console.log(`     grammar=${r.grammar}  derived_from=${r.derived_from}  construction=${r.construction}`);
}

db.close();
