// One-off, idempotent: ensure the auth + per-user tables exist. Normally these
// are created by applySchema() on boot (schema.sql), but if that boot-time apply
// fails transiently (a dhamma-pg connect timeout during a restart), this lets us
// create them deterministically through the proxy. Safe to re-run.
//
//   flyctl proxy 15432:5432 --app dhamma-pg     # another shell
//   DATABASE_URL=postgres://postgres:<pw>@127.0.0.1:15432/dhamma \
//     node scripts/ingest/apply-auth-tables.mjs

import postgres from 'postgres';

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const sql = postgres(process.env.DATABASE_URL, { max: 2 });

try {
  await sql`CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL   PRIMARY KEY,
    email         TEXT        UNIQUE NOT NULL,
    display_name  TEXT,
    is_admin      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
  )`;
  await sql`CREATE TABLE IF NOT EXISTS magic_tokens (
    token_hash  TEXT        PRIMARY KEY,
    email       TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_magic_tokens_email ON magic_tokens (email, created_at)`;
  await sql`CREATE TABLE IF NOT EXISTS user_collections (
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT        NOT NULL,
    items      JSONB       NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, kind)
  )`;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`;
  const present = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','magic_tokens','user_collections') ORDER BY table_name`;
  console.log('auth tables present:', present.map((r) => r.table_name).join(', '));
  console.log('public tables total:', n);
} finally {
  await sql.end({ timeout: 5 });
}
