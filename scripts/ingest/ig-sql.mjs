// Generic read-only SQL runner for the individual-guidance comprehensiveness work.
// Usage: DATABASE_URL=... node ig-sql.mjs <file.sql>
// The .sql file may hold multiple statements separated by a line containing only `;;;`.
// Prints a JSON array of { label, rows } (or { label, error }) to stdout.
import postgres from 'postgres'
import { readFileSync } from 'node:fs'

const url = process.env.DATABASE_URL
if (!url) { console.error('set DATABASE_URL'); process.exit(1) }
const sql = postgres(url, { max: 1, idle_timeout: 10, connect_timeout: 30 })

const raw = readFileSync(process.argv[2], 'utf8')
const blocks = raw.split(/\n;;;\n/).map(s => s.trim()).filter(Boolean)
const out = []
for (const b of blocks) {
  // first line beginning with `-- ` is used as the label
  const m = b.match(/^--\s*(.+)$/m)
  const label = m ? m[1].trim() : b.slice(0, 60)
  try {
    const rows = await sql.unsafe(b)
    out.push({ label, rows })
  } catch (e) {
    out.push({ label, error: String(e.message || e) })
  }
}
process.stdout.write(JSON.stringify(out, null, 2))
await sql.end()
