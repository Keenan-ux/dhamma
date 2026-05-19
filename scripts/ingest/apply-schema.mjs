// Apply server/sql/schema.sql + seed-stubs.sql to the DB pointed at by
// DATABASE_URL. Useful when adding new columns (e.g. source_edition for
// Tier C) without needing to redeploy and trigger schema apply via the
// server's boot path.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA     = path.resolve(__dirname, '..', '..', 'server', 'sql', 'schema.sql');
const SEED_STUBS = path.resolve(__dirname, '..', '..', 'server', 'sql', 'seed-stubs.sql');

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

await sql.unsafe(fs.readFileSync(SCHEMA, 'utf8'));
console.log('[schema] applied');

if (fs.existsSync(SEED_STUBS)) {
  await sql.unsafe(fs.readFileSync(SEED_STUBS, 'utf8'));
  console.log('[seed-stubs] applied');
}

const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
console.log('tables:', tables.map((r) => r.table_name).join(', '));

// Verify tier-C columns landed
const cols = await sql`
  SELECT column_name FROM information_schema.columns
   WHERE table_name='passages' AND column_name IN ('source_edition','xml_div_id','work_role')
   ORDER BY column_name`;
console.log('new passages cols:', cols.map((r) => r.column_name).join(', ') || '(none)');

const [{ total }] = await sql`SELECT count(*)::int AS total FROM passages`;
const [{ sc }]    = await sql`SELECT count(*)::int AS sc FROM passages WHERE source_edition='sc'`;
console.log(`passages: ${total} total, ${sc} marked source_edition='sc'`);

const umbrellas = await sql`
  SELECT slug, name, is_stub FROM works
   WHERE slug IN ('pli-commentary','pli-subcommentary','pli-anya')
   ORDER BY slug`;
console.log('umbrellas:', umbrellas);

await sql.end();
