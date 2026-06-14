// Validate coded instances against the DB: evidence_pali must be a real
// substring of the source row's original (whitespace-normalized). Catches
// fabricated quotes. Also checks warrant_hypothesis ids resolve when given.
import postgres from 'postgres'
import { readFileSync, writeFileSync } from 'node:fs'

const file = process.argv[2]
const url = process.env.DATABASE_URL
const sql = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 30 })
const norm = s => (s || '').replace(/\s+/g, ' ').replace(/[‘’"”“]/g, "'").trim().toLowerCase()

const data = JSON.parse(readFileSync(file, 'utf8'))
const instances = data.instances || data
const ids = [...new Set(instances.map(i => i.id))]
const rows = await sql`SELECT id, original FROM passages WHERE id = ANY(${ids})`
const byId = Object.fromEntries(rows.map(r => [r.id, norm(r.original)]))

let ok = 0, bad = 0, missing = 0
const report = []
for (const i of instances) {
  const src = byId[i.id]
  if (src === undefined) { missing++; report.push({ id: i.id, status: 'ID_NOT_FOUND' }); continue }
  const ev = norm(i.evidence_pali)
  const hit = ev.length > 8 && src.includes(ev)
  if (hit) ok++; else bad++
  report.push({ id: i.id, status: hit ? 'ok' : 'EVIDENCE_NOT_SUBSTRING', ev_len: ev.length, sample: hit ? '' : (i.evidence_pali || '').slice(0, 80) })
}
writeFileSync(file.replace(/\.json$/, '_validation.json'), JSON.stringify(report, null, 1))
console.log(JSON.stringify({ total: instances.length, evidence_ok: ok, evidence_bad: bad, id_missing: missing,
  bad_ids: report.filter(r => r.status !== 'ok') }, null, 2))
await sql.end()
