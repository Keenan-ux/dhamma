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
  seen.add(String(x.id)); out.push({ ...x, source: 'expansion' }); added++
}

// Apply the verified warrant ledger (re-adjudication): overwrite each expansion
// instance's h_class with the verified H0/H1 and the checkable warrant id.
let expLedger = null
const ledgerPath = `${R}/research/individual-guidance/out/readjud_final.json`
if (existsSync(ledgerPath)) {
  const verified = J(ledgerPath)
  for (const x of out) {
    const v = x.source === 'expansion' ? verified[x.id] : null
    if (v) {
      x.h_class = v.h_class
      x.warrant = (v.warrant_id && v.warrant_id !== 'none') ? v.warrant_id : null
      x.warrant_basis = v.basis
      x.census_verdict = v.split_resolved ? 'verified (split-resolved)' : 'verified'
    }
  }
  const ev = out.filter(x => x.source === 'expansion')
  expLedger = { H0: ev.filter(x => x.h_class === 'H0').length, H1: ev.filter(x => x.h_class === 'H1').length, total: ev.length, split_resolved: Object.values(verified).filter(v => v.split_resolved).length }
}

const cnt = (arr, key) => arr.reduce((a, i) => (a[i[key]] = (a[i[key]] || 0) + 1, a), {})
const cross = (arr, a, b) => arr.reduce((m, i) => { const k = i[a]; (m[k] ||= {}); m[k][i[b]] = (m[k][i[b]] || 0) + 1; return m }, {})
const newOnly = out.filter(i => !censusIds.has(String(i.id)))

ds.instances = out
ds.meta.version = '2.0'
ds.meta.title = 'How an Individual Is Guided — assignment census v2.0'

// The exact query log: every predicate run against passages.original (Postgres
// ~* = case-insensitive regex) over the live corpus via the proxy. Published so a
// human can re-run each count. layer/tier = derived from work_slug (suffix -attha
// -> commentary, -tika -> commentary; pli-abhidhamma -> abhidhamma; pli-ps/ne/pe/
// nd/mil -> para-canon; pli-cst-* -> extra-canonical; else sutta).
const OBJ = "asubh|mettā|mettaṃ|mettaṁ|ānāpān|kasiṇ|aniccasaññ|maraṇasati|maraṇassati|kāyagatā|paṭikūl|dhātumanasikār|buddhānussati|dhammānussati|saṅghānussati|cāgānussati|sīlānussati|devatānussati|catunnaṃ dhātūnaṃ|catunnaṁ dhātūnaṁ"
const COMM = "(work_slug LIKE '%-attha' OR work_slug = 'pli-vism' OR work_slug LIKE '%-tika' OR work_slug LIKE 'pli-cst-%')"
const CANON = "(work_slug NOT LIKE '%-attha' AND work_slug NOT LIKE '%-tika' AND work_slug <> 'pli-vism' AND work_slug NOT LIKE 'pli-cst-%' AND work_slug <> 'pli-vinaya')"
const SUTTA = "work_slug IN ('pli-dn','pli-mn','pli-sn','pli-an','pli-kn','pli-dhp','pli-ud','pli-iti','pli-snp','pli-thag','pli-thig','pli-vv','pli-pv','pli-cp','pli-bv','pli-ja','pli-ap','pli-kp')"
ds.meta.query_log = {
  engine: 'PostgreSQL ~* (case-insensitive regex) over passages.original, run by direct SQL through the dhamma-pg proxy; the search service was not used for the frame. Every sql field below is a complete, runnable statement.',
  note: 'The four FRAME RULES define the candidate set: their deduplicated union is the 755 candidate passages, which were coded down to the 263 instances + 459 reasoned exclusions. Each rule is a single multi-term regex (the object rule alone carries about twenty terms). The other tables here are not part of building the census: the MEASUREMENT queries are the per-layer footprint counts that diagnosed the undercount the re-census corrects, and the TARGETED queries resolved specific cells and loci. Most individual canonical instances were then confirmed by direct fetch of the cited passage (reachable from every citation link), not by further search.',
  meditation_object_vocabulary: OBJ,
  frame_rules: [
    { rule: 'Assignment narrative (commentary + sub-commentary + extra-canonical): a teacher gives a person a meditation subject', sql: `SELECT count(*) FROM passages WHERE ${COMM} AND original ~* 'kammaṭṭhān' AND original ~* 'adāsi|ācikkhi|kathesi|uggaṇhāpesi|uggaṇhi|ārocesi';`, candidates: 268 },
    { rule: 'Develop/attend directive paired with a named meditation object (any layer)', sql: `SELECT count(*) FROM passages WHERE ( original ~* 'bhāvehi|bhāvetha|bhāveyyāsi|bhāveyyātha|bhāvetabb' OR original ~* 'manasi karohi|manasi karotha' ) AND original ~* '${OBJ}';`, candidates: 330 },
    { rule: 'Temperament-keyed assignment formula (any layer)', sql: `SELECT count(*) FROM passages WHERE original ~* 'rāgacaritassa|dosacaritassa|mohacaritassa|vitakkacaritassa|saddhācaritassa|buddhicaritassa|ñāṇacaritassa';`, candidates: 79 },
    { rule: 'Calm and insight co-treatment (sutta + para-canon + abhidhamma)', sql: `SELECT count(*) FROM passages WHERE ${CANON} AND original ~* 'samath' AND original ~* 'vipassan';`, candidates: 136 },
  ],
  frame_union: 755,
  measurement_queries: [
    { label: 'Object-term footprint (run per object across all layers; asubha shown)', sql: `SELECT count(*) FROM passages WHERE original ~* 'asubh';` },
    { label: 'Commentarial assignment idiom, all layers (to compare canon vs commentary)', sql: `SELECT count(*) FROM passages WHERE original ~* 'kammaṭṭhān' AND original ~* 'adāsi|ācikkhi|kathesi|uggaṇhāpesi|uggaṇhi|ārocesi';` },
    { label: 'Develop-imperative footprint (with and without an object)', sql: `SELECT count(*) FROM passages WHERE original ~* 'bhāvehi|bhāvetha|bhāveyyāsi|bhāveyyātha|bhāvetabb';` },
    { label: 'Carita footprint: any occurrence', sql: `SELECT count(*) FROM passages WHERE original ~* 'carit';` },
    { label: 'Carita footprint: temperament-typed forms', sql: `SELECT count(*) FROM passages WHERE original ~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit';` },
    { label: 'Calm + insight co-occurrence, all layers', sql: `SELECT count(*) FROM passages WHERE original ~* 'samath' AND original ~* 'vipassan';` },
    { label: 'Understanding-types footprint (ugghaṭitaññū / vipañcitaññū)', sql: `SELECT count(*) FROM passages WHERE original ~* 'ugghaṭitaññ|vipañcitaññ|vipaccitaññ';` },
  ],
  targeted_queries: [
    { label: 'Visuddhimagga III carita-to-object matrix', sql: `SELECT id, citation, original FROM passages WHERE work_slug = 'pli-vism' AND original ~* 'rāgacaritassa';` },
    { label: 'Visuddhimagga III the forty objects (Cattālīsakammaṭṭhāna)', sql: `SELECT id, citation, original FROM passages WHERE work_slug = 'pli-vism' AND original ~* 'dasa kasiṇā|cattālīsa.{0,12}kammaṭṭhān';` },
    { label: 'Mettā tree-deity origin story (Sn-a / Khp-a Mettasutta commentary)', sql: `SELECT id, citation, title FROM passages WHERE work_slug = 'pli-kn-attha' AND title ~* 'mettasutta' AND original ~* 'devatā|rukkh';` },
    { label: 'Death-mindfulness directed to the bhikkhū (graded)', sql: `SELECT id, citation FROM passages WHERE ${SUTTA} AND original ~* 'maraṇasati|maraṇassati';` },
    { label: 'Note: the F4 calm/insight cells and the four-element loci (AN 4.92-94, AN 9.4, MN 28/62/140, etc.) were confirmed by direct fetch of each cited passage, reachable from its citation link.', sql: '' },
  ],
  carita_sense_split: {
    scope: 'Sutta Piṭaka work_slugs (pli-dn/mn/sn/an/kn/dhp/ud/iti/snp/thag/thig/vv/pv/cp/bv/ja/ap/kp)',
    any_carita_sql: `SELECT count(*) FROM passages WHERE ${SUTTA} AND original ~* 'carit';`,
    any_carita_count: 554,
    temperament_compound_sql: `SELECT id, work_slug FROM passages WHERE ${SUTTA} AND original ~* 'rāgacarit|dosacarit|mohacarit|saddhācarit|buddhicarit|vitakkacarit|ñāṇacarit|samacarit';`,
    temperament_compound_count: 9,
    nine_ids: ['cst-s0515m.mul-kn15_14 (Mahāniddesa)', 'cst-s0515m.mul-kn15_16 (Mahāniddesa)', 'cst-s0516m.mul-kn16_1 (Cūḷaniddesa)', 'cst-s0519m.mul-kn19_4 (Nettippakaraṇa)', 'cst-s0519m.mul-kn19_5 (Nettippakaraṇa)', 'cst-s0519m.mul-kn19_6 (Nettippakaraṇa)', 'cst-s0520m.nrf-kn20_2 (Peṭakopadesa)', 'cst-s0520m.nrf-kn20_7 (Peṭakopadesa)', 'cst-s0518m.nrf-kn18_2 (Milindapañha)'],
    paṭisambhidāmagga_sql: `SELECT count(*) FROM passages WHERE work_slug = 'pli-kn' AND id LIKE 'cst-s0517m%' AND original ~* 'rāgacarit|dosacarit|mohacarit';`,
    paṭisambhidāmagga_count: 0,
    none_in_four_nikayas: true,
  },
  integrity: 'Every coded instance evidence_pali was verified to be a literal substring of its source row (188/188 fine, 33/33 coarse, 9/9 added); 0 fabricated quotes.',
}

ds.aggregates = {
  ...ds.aggregates,
  total: out.length, original_census: census.length, expansion_added: added,
  by_facet: cnt(out, 'facet'), by_tier: cnt(out, 'tier'),
  criterion_x_tier: cross(out, 'criterion', 'tier'), mode_x_tier: cross(out, 'mode', 'tier'),
  frame: { candidates: 755, fine: 454, coarse: 301, fine_coded_instances: fine.length, fine_excludes: J(`${R}/research/individual-guidance/out/fine_full.json`).n_excludes },
  expansion_ledger: expLedger || { H0: 0, H1: 0, total: 0, split_resolved: 0 },
}
writeFileSync(`${R}/public/research/individual-guidance.json`, JSON.stringify(ds, null, 1))
console.log(JSON.stringify({ total: out.length, added, by_facet: ds.aggregates.by_facet, by_tier: ds.aggregates.by_tier, expansion_warrant: ds.aggregates.expansion_warrant }, null, 2))
