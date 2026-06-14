// Assemble dataset v2.0: existing 55 census + 188 fine + coarse canonical +
// v1.3 additions. Normalize to the census schema, dedup by id, recompute
// aggregates and the expansion warrant-accounting. Keeps the peer-reviewed
// 15-cell H0/H1 ledger intact; reports the expansion separately.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const R = 'C:/Dev/Dhamma'
const J = p => JSON.parse(readFileSync(p, 'utf8'))
// Always build from the frozen v1.2 base (not the live file) so assembly is idempotent.
const ds = J(`${R}/research/individual-guidance/out/individual-guidance.v1.2.backup.json`)
const census = ds.instances
const censusIds = new Set(census.map(i => String(i.id)))

// id -> {citation, work_slug, title} from the frame dumps
const meta = {}
for (const r of J(`${R}/research/individual-guidance/out/frame_fine.json`)) meta[r.id] = r
if (existsSync(`${R}/research/individual-guidance/out/frame_coarse_windows.json`))
  for (const r of J(`${R}/research/individual-guidance/out/frame_coarse_windows.json`)) meta[r.id] = meta[r.id] || r

const word = s => String(s || 'unstated').trim().split(/[\s(/]/)[0].toLowerCase().replace(/[^a-zāīūṅñṭḍṇḷṃ-]/g, '') || 'unstated'
const CRIT = new Set(['defilement', 'situation', 'temperament', 'capacity', 'unstated'])
const layerOf = ws => ws?.endsWith('-attha') ? 'attha' : ws?.endsWith('-tika') ? 'tika' : ws === 'pli-vism' ? 'attha' : ws?.startsWith('pli-cst-') ? 'anya' : ws === 'pli-abhidhamma' ? 'abhidhamma' : 'mula'
const tierOf = ws => (ws?.endsWith('-attha') || ws?.endsWith('-tika') || ws === 'pli-vism') ? 'commentary'
  : ws === 'pli-abhidhamma' ? 'abhidhamma'
  : ['pli-ps', 'pli-ne', 'pli-pe', 'pli-nd', 'pli-mil'].includes(ws) ? 'para-canon' : 'sutta'

function normalize(x, facet) {
  const m = meta[x.id] || {}
  const ws = m.work_slug
  let crit = word(x.criterion); if (!CRIT.has(crit)) crit = 'unstated'
  const hc = x.h_class_guess === 'canonical' ? 'canonical' : x.h_class_guess === 'innovation' ? 'innovation' : 'uncertain'
  const voice = ['buddha', 'commentary', 'other'].includes(x.voice) ? x.voice : (tierOf(ws) === 'sutta' ? 'buddha' : 'commentary')
  const mode = ['statement', 'elaboration', 'leading', 'object'].includes(x.mode) ? x.mode : 'object'
  return {
    id: x.id, study_label: `${facet}:${x.id}`, citation: m.citation || x.citation || x.id,
    layer: layerOf(ws), voice, mode, object: x.object || 'unspecified',
    criterion: crit, recipient: x.recipient || '', recipient_features: x.recipient_features || '',
    occasion: x.occasion || '', function: x.function || 'unstated',
    warrant: (x.warrant_hypothesis && x.warrant_hypothesis !== 'none') ? x.warrant_hypothesis : null,
    h_class: hc, evidence_pali: x.evidence_pali || '', evidence_en: '', tr_provenance: 'author',
    facet, census_verdict: x.verdict_votes || 'instance', confidence: x.confidence || 'medium',
    verification: 'evidence-substring-verified', tier: tierOf(ws),
  }
}

const fine = J(`${R}/research/individual-guidance/out/fine_full.json`).instances.map(x => normalize(x, 'F5-commentary-assignment'))
let coarse = []
if (existsSync(`${R}/research/individual-guidance/out/coarse_full.json`)) {
  // Dedup the canonical lane: KEEP SuttaCentral-id rows (the citable canon) +
  // the one unique CST-mula row (Nanda) with no SC twin present. DROP the
  // cst-s\d+m four-Nikaya CST duplicates of SC suttas already covered, and the
  // cst-e* extra-canonical verse rows (dups of the SC instances / generic verse).
  const KEEP_CST = new Set(['cst-s0509m.mul-kn9_2'])
  coarse = J(`${R}/research/individual-guidance/out/coarse_full.json`).instances
    .filter(x => KEEP_CST.has(x.id) || (!/^cst-s\d+m/.test(x.id) && !/^cst-e/.test(x.id)))
    .map(x => {
      const t = tierOf((meta[x.id] || {}).work_slug)
      const facet = (x.object || '').match(/samath|vipassan|yuganaddh/i) ? 'F4-samatha-vipassana'
        : 'F1-object-assign'
      return normalize(x, facet)
    })
}
const v13 = existsSync(`${R}/research/individual-guidance/out/v13_additions.json`)
  ? J(`${R}/research/individual-guidance/out/v13_additions.json`) : []

// merge: existing census first (authoritative), then new (dedup by id, keep first seen)
const seen = new Set(censusIds), out = [...census]
let added = 0
for (const x of [...v13, ...fine, ...coarse]) {
  if (seen.has(String(x.id))) continue
  seen.add(String(x.id)); out.push(x); added++
}

const cnt = (arr, key) => arr.reduce((a, i) => (a[i[key]] = (a[i[key]] || 0) + 1, a), {})
const cross = (arr, a, b) => arr.reduce((m, i) => { const k = i[a]; (m[k] ||= {}); m[k][i[b]] = (m[k][i[b]] || 0) + 1; return m }, {})
const newOnly = out.filter(i => !censusIds.has(String(i.id)))

ds.instances = out
ds.meta.version = '2.0'
ds.meta.title = 'How an Individual Is Guided — assignment census v2.0'
ds.aggregates = {
  ...ds.aggregates,
  total: out.length, original_census: census.length, expansion_added: added,
  by_facet: cnt(out, 'facet'), by_tier: cnt(out, 'tier'),
  criterion_x_tier: cross(out, 'criterion', 'tier'), mode_x_tier: cross(out, 'mode', 'tier'),
  frame: { candidates: 755, fine: 454, coarse: 301, fine_coded_instances: fine.length, fine_excludes: J(`${R}/research/individual-guidance/out/fine_full.json`).n_excludes },
  expansion_warrant: { canonical: newOnly.filter(i => i.h_class === 'canonical').length, innovation: newOnly.filter(i => i.h_class === 'innovation').length, uncertain: newOnly.filter(i => i.h_class === 'uncertain').length },
}
writeFileSync(`${R}/public/research/individual-guidance.json`, JSON.stringify(ds, null, 1))
console.log(JSON.stringify({ total: out.length, added, by_facet: ds.aggregates.by_facet, by_tier: ds.aggregates.by_tier, expansion_warrant: ds.aggregates.expansion_warrant }, null, 2))
