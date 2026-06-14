// Dedup the fine frame vs the existing census and write coding batch files.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const root = 'C:/Dev/Dhamma'
const fine = JSON.parse(readFileSync(`${root}/research/individual-guidance/out/frame_fine.json`, 'utf8'))
const census = JSON.parse(readFileSync(`${root}/public/research/individual-guidance.json`, 'utf8')).instances
const censusIds = new Set()
for (const i of census) for (const id of String(i.id).split(/[\/;,]/).map(s => s.trim())) if (id) censusIds.add(id)

const netNew = fine.filter(r => !censusIds.has(r.id))
const already = fine.length - netNew.length

const dir = `${root}/research/individual-guidance/out/batches`
mkdirSync(dir, { recursive: true })
const SIZE = 15
let n = 0
for (let i = 0; i < netNew.length; i += SIZE) {
  const batch = netNew.slice(i, i + SIZE).map(r => ({
    id: r.id, citation: r.citation, work_slug: r.work_slug, lc: r.lc, rules: r.rules,
    title: r.title, original: r.original,
  }))
  const name = `fine_${String(n).padStart(2, '0')}.json`
  writeFileSync(`${dir}/${name}`, JSON.stringify(batch, null, 1))
  n++
}
console.log(JSON.stringify({ fine_total: fine.length, already_in_census: already, net_new: netNew.length, n_batches: n, batch_size: SIZE }, null, 2))
