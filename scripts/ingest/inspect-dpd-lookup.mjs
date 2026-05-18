import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('C:/Dev/Dhamma/scripts/ingest/.cache/dpd-released/dpd.db', { readOnly: true });

console.log('--- dpd_headwords schema ---');
const hw = db.prepare(`SELECT sql FROM sqlite_master WHERE name='dpd_headwords'`).get();
console.log(hw.sql.split(',').slice(0, 10).join(',\n'));

console.log('\n--- sample lookup rows for sampaj* ---');
const rows = db.prepare(`SELECT lookup_key, headwords FROM lookup WHERE lookup_key LIKE 'sampaj%' LIMIT 12`).all();
for (const r of rows) console.log(`  ${r.lookup_key.padEnd(28)} → headwords: ${r.headwords}`);

console.log('\n--- how many lookups have non-empty headwords? ---');
const c = db.prepare(`SELECT COUNT(*) AS n FROM lookup WHERE headwords != ''`).get();
console.log('  ' + c.n);

console.log('\n--- sample headword row (for one of the IDs above) ---');
const sample = db.prepare(`SELECT id, lemma_1, lemma_2 FROM dpd_headwords WHERE lemma_1 LIKE 'sampajāna%' LIMIT 3`).all();
for (const r of sample) console.log(`  id=${r.id}  lemma_1=${r.lemma_1}  lemma_2=${r.lemma_2}`);

db.close();
