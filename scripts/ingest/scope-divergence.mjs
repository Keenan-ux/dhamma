// Divergence-lane scoping: how many passages carry BOTH a Sujato (sc) and
// >=1 ATI translation, and what does the per-work distribution look like?
// Read-only. Usage:
//   $env:DATABASE_URL = "postgres://dhamma:PASS@localhost:15432/dhamma"
//   node scope-divergence.mjs
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 })

const inventory = await sql`
  SELECT source, count(*)::int AS rows, count(DISTINCT translator)::int AS translators,
         count(DISTINCT passage_id)::int AS passages
  FROM translations GROUP BY source ORDER BY rows DESC`
console.log('== translations inventory ==')
console.table(inventory)

const overlap = await sql`
  SELECT count(DISTINCT t1.passage_id)::int AS passages_with_sujato_and_ati
  FROM translations t1
  WHERE t1.source = 'sc'
    AND EXISTS (SELECT 1 FROM translations t2
                WHERE t2.passage_id = t1.passage_id AND t2.source = 'ati')`
console.log('== overlap ==')
console.table(overlap)

const byWork = await sql`
  SELECT p.work_slug, count(DISTINCT t1.passage_id)::int AS n,
         count(DISTINCT t2.translator)::int AS ati_translators
  FROM translations t1
  JOIN passages p ON p.id = t1.passage_id
  JOIN translations t2 ON t2.passage_id = t1.passage_id AND t2.source = 'ati'
  WHERE t1.source = 'sc'
  GROUP BY p.work_slug ORDER BY n DESC LIMIT 30`
console.log('== overlap by work (top 30) ==')
console.table(byWork)

// multi-ATI passages: >=2 ATI translators on the same passage (3-way+ divergence)
const multi = await sql`
  SELECT count(*)::int AS passages_with_2plus_ati FROM (
    SELECT passage_id FROM translations WHERE source = 'ati'
    GROUP BY passage_id HAVING count(DISTINCT translator) >= 2) x`
console.table(multi)

// alignability probe: typical text lengths on overlapped passages
const lens = await sql`
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY length(t1.text))::int AS sujato_med,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY length(t2.text))::int AS ati_med,
         count(*)::int AS pairs
  FROM translations t1
  JOIN translations t2 ON t2.passage_id = t1.passage_id AND t2.source = 'ati'
  WHERE t1.source = 'sc'`
console.table(lens)

// segments substrate: does passage_sentences cover the overlapped passages?
const segcov = await sql`
  SELECT count(DISTINCT s.passage_id)::int AS overlapped_with_sentences
  FROM passage_sentences s
  WHERE s.passage_id IN (
    SELECT t1.passage_id FROM translations t1
    WHERE t1.source = 'sc' AND EXISTS (
      SELECT 1 FROM translations t2
      WHERE t2.passage_id = t1.passage_id AND t2.source = 'ati'))`
console.table(segcov)

await sql.end()
