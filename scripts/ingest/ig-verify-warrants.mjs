// Verify the H0 warrant ids resolve to real canonical corpus rows, and flag any
// H0 that rests only on a commentarial (Vism/prose) reference.
import postgres from 'postgres'
import { readFileSync, writeFileSync } from 'node:fs'
const R = 'C:/Dev/Dhamma'
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 15 })
const final = JSON.parse(readFileSync(`${R}/research/individual-guidance/out/readjud_final.json`, 'utf8'))

const SCID = /^(an|sn|mn|dn|ud|snp|iti|dhp|thag|thig|kp|khp|pe|ne|ps|cnd|mnd)\d[\w.]*$/i
const norm = (w) => (w || '').trim().toLowerCase().replace(/\s+/g, '').replace(/^khp/, 'kp')
const h0 = Object.entries(final).filter(([, v]) => v.h_class === 'H0')
const wid = {}
for (const [id, v] of h0) {
  const n = norm(v.warrant_id)
  wid[id] = { raw: v.warrant_id, norm: n, isSc: SCID.test(n) }
}
const distinctSc = [...new Set(Object.values(wid).filter(w => w.isSc).map(w => w.norm))]
const rows = await sql`SELECT id FROM passages WHERE id = ANY(${distinctSc})`
const exist = new Set(rows.map(r => r.id))

const report = { h0_total: h0.length, distinct_sc_warrants: distinctSc.length,
  resolved: distinctSc.filter(x => exist.has(x)),
  unresolved_sc: distinctSc.filter(x => !exist.has(x)),
  h0_resting_on_noncanonical: h0.filter(([id]) => !wid[id].isSc).map(([id]) => ({ id, warrant: wid[id].raw })),
}
writeFileSync(`${R}/research/individual-guidance/out/warrant_verify.json`, JSON.stringify(report, null, 1))
console.log(JSON.stringify({
  h0_total: report.h0_total,
  distinct_sc_warrants: report.distinct_sc_warrants,
  resolved: report.resolved.length,
  unresolved_sc: report.unresolved_sc,
  h0_on_noncanonical_count: report.h0_resting_on_noncanonical.length,
  h0_on_noncanonical: report.h0_resting_on_noncanonical.slice(0, 12),
}, null, 2))
await sql.end()
