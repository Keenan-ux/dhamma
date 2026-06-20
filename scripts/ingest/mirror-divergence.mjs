// Build the local divergence-lane mirror: every passage that carries BOTH a
// Sujato (source='sc') and >=1 ATI translation, with its Pali original, all
// English translations, and the passage_sentences rows (both fields, no
// embeddings) as the alignment substrate. Read-only against dhamma-pg;
// writes research/data/divergence_mirror.json. One-shot, like the DPD mirror.
// Usage:
//   $env:DATABASE_URL = "postgres://dhamma:PASS@localhost:15432/dhamma"
//   node mirror-divergence.mjs
import postgres from 'postgres'
import { writeFileSync } from 'node:fs'

const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 10 })

const ids = (await sql`
  SELECT DISTINCT t1.passage_id AS id
  FROM translations t1
  WHERE t1.source = 'sc'
    AND EXISTS (SELECT 1 FROM translations t2
                WHERE t2.passage_id = t1.passage_id AND t2.source = 'ati')
  ORDER BY 1`).map(r => r.id)
console.log(`overlapped passages: ${ids.length}`)

const mirror = {}
const BATCH = 100
for (let i = 0; i < ids.length; i += BATCH) {
  const chunk = ids.slice(i, i + BATCH)
  const passages = await sql`
    SELECT id, work_slug, citation, title, original
    FROM passages WHERE id = ANY(${chunk})`
  const translations = await sql`
    SELECT passage_id, translator, source, text, license, source_url
    FROM translations WHERE passage_id = ANY(${chunk}) AND source IN ('sc','ati')`
  const sentences = await sql`
    SELECT passage_id, field, position, text
    FROM passage_sentences WHERE passage_id = ANY(${chunk})
    ORDER BY passage_id, field, position`
  for (const p of passages) {
    mirror[p.id] = { work_slug: p.work_slug, citation: p.citation, title: p.title,
                     original: p.original, translations: [], sentences: { original: [], translation: [] } }
  }
  for (const t of translations) {
    mirror[t.passage_id]?.translations.push({
      translator: t.translator, source: t.source, text: t.text,
      license: t.license, source_url: t.source_url })
  }
  for (const s of sentences) {
    mirror[s.passage_id]?.sentences[s.field]?.push(s.text)
  }
  console.log(`  ${Math.min(i + BATCH, ids.length)}/${ids.length}`)
}

await sql.end()
const out = 'C:/Dev/Dhamma/research/data/divergence_mirror.json'
writeFileSync(out, JSON.stringify(mirror), 'utf8')
const n = Object.keys(mirror).length
const nTr = Object.values(mirror).reduce((a, p) => a + p.translations.length, 0)
console.log(`wrote ${out}: ${n} passages, ${nTr} translations`)
