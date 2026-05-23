// One-shot migration: adds passages_embedding_meta, the side table that
// records which gloss-injection pipeline produced each passage's
// current embedding. Lets the re-embed script skip already-done
// passages and lets me audit / re-run a specific gloss version later
// without losing track of what's been done.
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });

await sql`
  CREATE TABLE IF NOT EXISTS passages_embedding_meta (
    passage_id    TEXT PRIMARY KEY REFERENCES passages(id) ON DELETE CASCADE,
    gloss_version TEXT NOT NULL,
    embedded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    n_tokens      INT,
    n_headwords   INT,
    n_unmatched   INT,
    orig_chars    INT,
    gloss_chars   INT,
    input_chars   INT,
    model         TEXT
  )`;
await sql`CREATE INDEX IF NOT EXISTS idx_pem_version ON passages_embedding_meta(gloss_version)`;

const r = await sql`SELECT COUNT(*)::int AS n FROM passages_embedding_meta`;
console.log('passages_embedding_meta rows:', r[0].n);
await sql.end();
