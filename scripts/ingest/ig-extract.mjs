// Extract the directed-assignment candidate frame for the individual-guidance
// comprehensive re-census (v2.0). Deterministic; writes auditable JSON dumps.
// Usage: DATABASE_URL=... node ig-extract.mjs
import postgres from 'postgres'
import { writeFileSync, mkdirSync } from 'node:fs'

const OUT = new URL('../../research/individual-guidance/out/', import.meta.url)
mkdirSync(OUT, { recursive: true })
const url = process.env.DATABASE_URL
const sql = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 30 })

const OBJ_RX = 'asubh|mettā|mettaṃ|mettaṁ|ānāpān|kasiṇ|aniccasaññ|maraṇasati|maraṇassati|kāyagatā|paṭikūl|dhātumanasikār|buddhānussati|dhammānussati|saṅghānussati|cāgānussati|sīlānussati|devatānussati|catunnaṃ dhātūnaṃ|catunnaṁ dhātūnaṁ'

const rows = await sql.unsafe(`
WITH p AS (SELECT id, work_slug, citation, title, position, original AS o,
  CASE
   WHEN work_slug LIKE '%-attha' OR work_slug='pli-vism' THEN 'commentary'
   WHEN work_slug LIKE '%-tika' THEN 'subcommentary'
   WHEN work_slug='pli-abhidhamma' THEN 'abhidhamma'
   WHEN work_slug='pli-vinaya' THEN 'vinaya'
   WHEN work_slug IN ('pli-ps','pli-ne','pli-pe','pli-nd','pli-mil') THEN 'para-canon'
   WHEN work_slug LIKE 'pli-cst-%' THEN 'anya'
   ELSE 'sutta' END AS lc FROM passages)
SELECT id, work_slug, citation, title, lc, length(o) AS len, o AS original,
  (lc IN ('commentary','subcommentary','anya') AND o ~* 'kammaṭṭhān' AND o ~* 'adāsi|ācikkhi|kathesi|uggaṇhāpesi|uggaṇhi|ārocesi') AS f_assign,
  ((o ~* 'bhāvehi|bhāvetha|bhāveyyāsi|bhāveyyātha|bhāvetabb' OR o ~* 'manasi karohi|manasi karotha') AND o ~* '${OBJ_RX}') AS f_directive_obj,
  (o ~* 'rāgacaritassa|dosacaritassa|mohacaritassa|vitakkacaritassa|saddhācaritassa|buddhicaritassa|ñāṇacaritassa') AS f_carita,
  (lc IN ('sutta','para-canon','abhidhamma') AND o ~* 'samath' AND o ~* 'vipassan') AS f_samvip
FROM p
WHERE (lc IN ('commentary','subcommentary','anya') AND o ~* 'kammaṭṭhān' AND o ~* 'adāsi|ācikkhi|kathesi|uggaṇhāpesi|uggaṇhi|ārocesi')
   OR ((o ~* 'bhāvehi|bhāvetha|bhāveyyāsi|bhāveyyātha|bhāvetabb' OR o ~* 'manasi karohi|manasi karotha') AND o ~* '${OBJ_RX}')
   OR (o ~* 'rāgacaritassa|dosacaritassa|mohacaritassa|vitakkacaritassa|saddhācaritassa|buddhicaritassa|ñāṇacaritassa')
   OR (lc IN ('sutta','para-canon','abhidhamma') AND o ~* 'samath' AND o ~* 'vipassan')
ORDER BY lc, work_slug, position
`)

const fineLc = new Set(['commentary', 'subcommentary'])
const fine = [], coarse = []
for (const r of rows) {
  const rec = {
    id: r.id, work_slug: r.work_slug, citation: r.citation, title: r.title,
    lc: r.lc, len: Number(r.len),
    rules: [r.f_assign && 'assign', r.f_directive_obj && 'directive_obj', r.f_carita && 'carita', r.f_samvip && 'samvip'].filter(Boolean),
    original: r.original,
  }
  ;(fineLc.has(r.lc) ? fine : coarse).push(rec)
}

writeFileSync(new URL('frame_fine.json', OUT), JSON.stringify(fine, null, 1))
// coarse: store metadata + full text separately (big)
writeFileSync(new URL('frame_coarse.json', OUT), JSON.stringify(coarse, null, 1))
const manifest = {
  generated_against: '194710 passages (2026-06-14)',
  total: rows.length,
  by_lc: rows.reduce((a, r) => (a[r.lc] = (a[r.lc] || 0) + 1, a), {}),
  fine_n: fine.length, coarse_n: coarse.length,
  ids: rows.map(r => ({ id: r.id, lc: r.lc, rules: [r.f_assign && 'assign', r.f_directive_obj && 'directive_obj', r.f_carita && 'carita', r.f_samvip && 'samvip'].filter(Boolean) })),
}
writeFileSync(new URL('frame_manifest.json', OUT), JSON.stringify(manifest, null, 1))
console.log(JSON.stringify({ total: rows.length, fine: fine.length, coarse: coarse.length, by_lc: manifest.by_lc }, null, 2))
await sql.end()
