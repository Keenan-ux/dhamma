import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(__dirname, '..', 'sql', 'schema.sql');
const SEED_ALIASES_PATH = path.resolve(__dirname, '..', 'sql', 'seed-aliases.sql');
const SEED_STUBS_PATH = path.resolve(__dirname, '..', 'sql', 'seed-stubs.sql');

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL not set — db features will fail');
}

export const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, {
      max: 5,
      idle_timeout: 30,
      connect_timeout: 10,
      // Per-session statement guards, applied to every pooled connection as
      // startup parameters. lock_timeout is the load-bearing one: Postgres
      // lock waits never time out by default, so a stale lock left by a
      // crashed/idle-in-transaction session in dhamma-pg would make
      // applySchema() (CREATE … IF NOT EXISTS) park on the lock forever at
      // boot — the port would never bind and Fly would cordon the machine
      // until someone restarted dhamma-pg. 10s makes a stale lock fail FAST
      // and loudly instead. statement_timeout is a generous backstop for any
      // other hang; the server is read-only (ingest uses its own client) so
      // nothing legitimate runs near 120s. Both are pure safety — normal reads
      // take only ACCESS SHARE locks, never wait, and finish in well under a
      // second. Tunable via env without a redeploy.
      connection: {
        lock_timeout: process.env.PG_LOCK_TIMEOUT_MS || '10000',
        statement_timeout: process.env.PG_STATEMENT_TIMEOUT_MS || '120000',
      },
    })
  : null;

// Idempotent schema apply + seeds. Safe on every boot. Runs on the shared
// `sql` pool, which carries a lock_timeout (see above), so a stale lock in
// dhamma-pg makes this throw fast rather than hang the boot. start() binds the
// port BEFORE awaiting this and treats a failure here as non-fatal.
export async function applySchema() {
  if (!sql) return;
  await sql.unsafe(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  console.log('[db] schema applied');
  if (fs.existsSync(SEED_ALIASES_PATH)) {
    await sql.unsafe(fs.readFileSync(SEED_ALIASES_PATH, 'utf8'));
    console.log('[db] aliases seeded');
  }
  if (fs.existsSync(SEED_STUBS_PATH)) {
    await sql.unsafe(fs.readFileSync(SEED_STUBS_PATH, 'utf8'));
    console.log('[db] stubs seeded');
  }
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
