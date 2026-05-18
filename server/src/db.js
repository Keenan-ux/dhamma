import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(__dirname, '..', 'sql', 'schema.sql');

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL not set — db features will fail');
}

export const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, {
      max: 5,
      idle_timeout: 30,
      connect_timeout: 10,
    })
  : null;

// Idempotent schema apply. Safe on every boot.
export async function applySchema() {
  if (!sql) return;
  const ddl = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await sql.unsafe(ddl);
  console.log('[db] schema applied');
}

export async function health() {
  if (!sql) return { connected: false, reason: 'no DATABASE_URL' };
  try {
    const [{ version }]    = await sql`SELECT version()`;
    const [{ has_vector }] = await sql`SELECT count(*) > 0 AS has_vector FROM pg_extension WHERE extname = 'vector'`;
    const [{ tables }]     = await sql`SELECT count(*)::int AS tables FROM information_schema.tables WHERE table_schema = 'public'`;
    const [{ passages }]   = await sql`SELECT count(*)::int AS passages FROM passages`;
    return {
      connected: true,
      postgres: version.split(' ')[1],
      pgvector: has_vector,
      tables,
      passages,
    };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}
