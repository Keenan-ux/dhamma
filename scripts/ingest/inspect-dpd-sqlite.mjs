// Inspect DPD's released SQLite to find the inflection lookup table.
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('C:/Dev/Dhamma/scripts/ingest/.cache/dpd-released/dpd.db', { readOnly: true });

console.log('--- tables ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
for (const t of tables) console.log('  ' + t.name);

console.log('\n--- row counts ---');
for (const t of tables) {
  try {
    const c = db.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get();
    console.log(`  ${t.name.padEnd(40)} ${c.n}`);
  } catch (e) {
    console.log(`  ${t.name.padEnd(40)} <error: ${e.message}>`);
  }
}

console.log('\n--- lookup table schema ---');
try {
  const schema = db.prepare(`SELECT sql FROM sqlite_master WHERE name = 'lookup'`).get();
  if (schema) console.log(schema.sql);
} catch (e) {
  console.log('no lookup table');
}

db.close();
