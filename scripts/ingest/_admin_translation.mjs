// One-off: manage the admin-gated PRIVATE translation of Abh §14
// (Catukkapuggalapaññatti, passage cst-abh03m2.mul-014).
//
// The row lives in the normal `translations` table but with
// visibility='private' + owner_email set, so the read-path gate (db.js
// vtT/vtBare) serves it ONLY to its owner and excludes it from every public
// surface (Canon-Map translated count, translator index, translation search,
// reader dropdown for everyone else).
//
// Modes:  columns | insert | verify
// Run via the flyctl proxy (15432:5432 → dhamma-pg):
//   DATABASE_URL="postgres://dhamma:PASS@127.0.0.1:15432/dhamma" \
//     node scripts/ingest/_admin_translation.mjs <mode>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const mode = process.argv[2] || 'verify';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const sql = postgres(process.env.DATABASE_URL, { ssl: false, max: 1, idle_timeout: 5 });

const PASSAGE_ID = 'cst-abh03m2.mul-014';
const TRANSLATOR = 'dhamma';
const SOURCE = 'dhamma';
const OWNER = process.env.ADMIN_OWNER_EMAIL || 'isaac11cyr@gmail.com';
const COPYRIGHT = null;
const NOTES = 'Auditable leave-in-Pāli rendering; established technical terms kept untranslated per the project glossary.';

async function ensureColumns() {
  await sql`ALTER TABLE translations ADD COLUMN IF NOT EXISTS visibility  TEXT NOT NULL DEFAULT 'public'`;
  await sql`ALTER TABLE translations ADD COLUMN IF NOT EXISTS owner_email TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_translations_visibility ON translations(visibility) WHERE visibility <> 'public'`;
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='translations' AND column_name IN ('visibility','owner_email')
    ORDER BY column_name`;
  console.log('columns present:', cols.map((c) => c.column_name).join(', ') || '(none!)');
}

async function insertRow() {
  const text = fs.readFileSync(path.join(ROOT, 'research', '_abh14_translation_en.txt'), 'utf8');
  if (!text || text.length < 1000) { console.error('translation text missing/short:', text.length); process.exit(1); }
  const [p] = await sql`SELECT id FROM passages WHERE id=${PASSAGE_ID}`;
  if (!p) { console.error('passage not found:', PASSAGE_ID); process.exit(1); }
  await sql`
    INSERT INTO translations
      (passage_id, language, translator, source, text, notes, copyright, license, visibility, owner_email, position)
    VALUES
      (${PASSAGE_ID}, 'en', ${TRANSLATOR}, ${SOURCE}, ${text}, ${NOTES}, ${COPYRIGHT}, ${null}, 'private', ${OWNER}, 0)
    ON CONFLICT (passage_id, translator, source) DO UPDATE
      SET text=EXCLUDED.text, notes=EXCLUDED.notes, copyright=EXCLUDED.copyright,
          visibility=EXCLUDED.visibility, owner_email=EXCLUDED.owner_email, position=EXCLUDED.position`;
  console.log('upserted', text.length, 'chars for', PASSAGE_ID);
}

async function verify() {
  // Exactly the predicate the server splices in (vtT/vtBare).
  const ownerRows = await sql`
    SELECT translator, source, visibility, owner_email, length(text) AS len
    FROM translations t
    WHERE passage_id=${PASSAGE_ID} AND (t.visibility='public' OR t.owner_email=${OWNER})`;
  const anonRows = await sql`
    SELECT translator FROM translations t
    WHERE passage_id=${PASSAGE_ID} AND (t.visibility='public' OR t.owner_email=${''})`;
  const [{ pub }] = await sql`
    SELECT count(*)::int AS pub FROM translations WHERE passage_id=${PASSAGE_ID} AND visibility='public'`;
  console.log('OWNER sees   :', JSON.stringify(ownerRows));
  console.log('ANON  sees   :', anonRows.length, 'row(s)');
  console.log('PUBLIC rows  :', pub, '(this is what the public translated_count would add for this passage)');
}

if (mode === 'columns') await ensureColumns();
else if (mode === 'insert') { await ensureColumns(); await insertRow(); await verify(); }
else await verify();
await sql.end();
