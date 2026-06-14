// Windowed extract of the COARSE canonical frame, directive_obj lane only.
// For each coarse row that pairs a develop/attend directive with an object,
// pull the assignment-bearing sentences (not the whole sutta) + a name flag.
// Dedup vs the existing census; write coarse coding batches.
import postgres from 'postgres'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const root = 'C:/Dev/Dhamma'
const url = process.env.DATABASE_URL
const sql = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 30 })
const OBJ_RX = 'asubh|mettā|mettaṃ|mettaṁ|ānāpān|kasiṇ|aniccasaññ|maraṇasati|maraṇassati|kāyagatā|paṭikūl|dhātumanasikār|buddhānussati|dhammānussati|saṅghānussati|cāgānussati|sīlānussati|devatānussati|anussati|catunnaṃ dhātūnaṃ|catunnaṁ dhātūnaṁ'

const rows = await sql.unsafe(`
WITH p AS (SELECT id, work_slug, citation, title, position, original AS o,
  CASE
   WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
   WHEN work_slug='pli-vinaya' THEN 'vinaya'
   WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
   WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
   ELSE 'sutta' END AS lc FROM passages
   WHERE work_slug NOT LIKE '%-attha' AND work_slug NOT LIKE '%-tika' AND work_slug<>'pli-vism')
SELECT id, work_slug, citation, title, lc, length(o) AS len,
  (SELECT string_agg(left(mm[1],300), '  ⋯  ') FROM regexp_matches(o, '[^.।]*(?:bhāvehi|bhāvetha|bhāveyy|bhāvetabb|manasi kar|manasikar)[^.।]*(?:${OBJ_RX})[^.।]*[.।]','gi') mm) AS windows,
  (SELECT string_agg(left(mm[1],300), '  ⋯  ') FROM regexp_matches(o, '[^.।]*(?:${OBJ_RX})[^.।]*(?:bhāvehi|bhāvetha|bhāveyy|bhāvetabb|manasi kar|manasikar)[^.।]*[.।]','gi') mm) AS windows2,
  (o ~* 'āyasmā|āyasmantaṁ|āyasmato|rāhul|meghiy|nandak|girimānand|pukkusāt|mālukya|bāhiy|moggallān|sāriputt|ānand|nandiy|soṇ|bhaddāl|aṅgulimāl') AS has_name
FROM p
WHERE (o ~* 'bhāvehi|bhāvetha|bhāveyy|bhāvetabb|manasi karohi|manasi karotha|manasikar') AND o ~* '${OBJ_RX}'
ORDER BY lc, work_slug, position
`)

const census = JSON.parse(readFileSync(`${root}/public/research/individual-guidance.json`, 'utf8')).instances
const censusIds = new Set()
for (const i of census) for (const id of String(i.id).split(/[\/;,]/).map(s => s.trim())) if (id) censusIds.add(id)

const recs = rows.map(r => ({
  id: r.id, citation: r.citation, work_slug: r.work_slug, lc: r.lc, title: r.title, len: Number(r.len),
  has_name: r.has_name, in_census: censusIds.has(r.id),
  windows: [r.windows, r.windows2].filter(Boolean).join('  ⋯  ').slice(0, 2400),
}))
const netNew = recs.filter(r => !r.in_census)
mkdirSync(`${root}/research/individual-guidance/out/batches`, { recursive: true })
writeFileSync(`${root}/research/individual-guidance/out/frame_coarse_windows.json`, JSON.stringify(recs, null, 1))
const SIZE = 18
let n = 0
for (let i = 0; i < netNew.length; i += SIZE) {
  writeFileSync(`${root}/research/individual-guidance/out/batches/coarse_${String(n).padStart(2, '0')}.json`,
    JSON.stringify(netNew.slice(i, i + SIZE), null, 1))
  n++
}
console.log(JSON.stringify({
  total: recs.length, with_name: recs.filter(r => r.has_name).length,
  in_census: recs.filter(r => r.in_census).length, net_new: netNew.length,
  by_lc: recs.reduce((a, r) => (a[r.lc] = (a[r.lc] || 0) + 1, a), {}), n_batches: n,
}, null, 2))
await sql.end()
