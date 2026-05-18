// Apply server/sql/schema.sql to the DB pointed at by DATABASE_URL.
// Useful when adding new tables (e.g. dictionary_entries) without needing
// to redeploy and trigger schema apply via the server's boot path.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA   = path.resolve(__dirname, '..', '..', 'server', 'sql', 'schema.sql');

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

const ddl = fs.readFileSync(SCHEMA, 'utf8');
await sql.unsafe(ddl);
console.log('[schema] applied');

const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
console.log('tables now:', tables.map((r) => r.table_name).join(', '));

await sql.end();
