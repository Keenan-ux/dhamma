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

// Transient connection failures worth retrying at boot. When the app boots
// cold, dhamma-pg may still be waking: the FIRST connection intermittently
// times out (CONNECT_TIMEOUT) or is reset (ECONNRESET) while later
// request-path connections succeed. These are the only errors withDbRetry
// retries — a SQL/lock error (a bad migration, a stale lock) must fail loudly
// and immediately, not be hidden behind five slow retries.
const RETRYABLE_CONN_ERR = /CONNECT_TIMEOUT|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH|EPIPE|Connection terminated|terminating connection/i;

function isRetryableConnError(err) {
  return RETRYABLE_CONN_ERR.test(`${err?.code || ''} ${err?.message || ''}`);
}

// Run a DB op, retrying ONLY on transient connection errors with exponential
// backoff (1s → 2s → 4s → 8s by default). Used at boot for applySchema() and
// the alias load, where the app and dhamma-pg can both be cold and the first
// connection times out while later ones succeed. Non-connection errors (and
// the final attempt's failure) propagate unchanged so callers see the real
// cause. Each retry is logged so a flaky cold boot is visible in flyctl logs.
export async function withDbRetry(label, fn, { attempts = 5, baseMs = 1000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryableConnError(err) || i === attempts - 1) throw err;
      const delay = baseMs * 2 ** i;
      console.warn(`[db] ${label}: attempt ${i + 1}/${attempts} failed (${err.code || err.message}); retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Idempotent schema apply + seeds. Safe on every boot. Runs on the shared
// `sql` pool, which carries a lock_timeout (see above), so a stale lock in
// dhamma-pg makes this throw fast rather than hang the boot. start() binds the
// port BEFORE awaiting this and treats a failure here as non-fatal.
//
// Each statement is wrapped in withDbRetry so a cold-boot connect timeout
// (dhamma-pg still waking) retries instead of silently skipping the migration
// — the residual of the F5 boot-resilience work, where a timed-out boot left
// new tables (auth: users/magic_tokens/user_collections) uncreated until
// someone applied them manually. The first statement bears the brunt of the
// retry; once a connection is established it's pooled, so the rest run warm.
export async function applySchema() {
  if (!sql) return;
  await withDbRetry('applySchema', () => sql.unsafe(fs.readFileSync(SCHEMA_PATH, 'utf8')));
  console.log('[db] schema applied');
  if (fs.existsSync(SEED_ALIASES_PATH)) {
    await withDbRetry('seed-aliases', () => sql.unsafe(fs.readFileSync(SEED_ALIASES_PATH, 'utf8')));
    console.log('[db] aliases seeded');
  }
  if (fs.existsSync(SEED_STUBS_PATH)) {
    await withDbRetry('seed-stubs', () => sql.unsafe(fs.readFileSync(SEED_STUBS_PATH, 'utf8')));
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
