// Deterministic consistency check for the individual-guidance study (the
// `<topic>-consistency` half of the Coherence pass). Reads only the published JSON.
// Usage: node ig-consistency.mjs
import { readFileSync } from 'node:fs'

const d = JSON.parse(readFileSync('C:/Dev/Dhamma/public/research/individual-guidance.json', 'utf8'))
const ins = d.instances, ag = d.aggregates
const checks = []
const ok = (name, cond, detail = '') => checks.push({ name, pass: !!cond, detail })

const FACETS = new Set(['F1-object-assign', 'F2-modes-types-agency', 'F3-commentary-carita', 'F4-samatha-vipassana', 'F5-commentary-assignment'])
const TIERS = new Set(['sutta', 'abhidhamma', 'para-canon', 'commentary'])
const MODES = new Set(['statement', 'elaboration', 'leading', 'object'])
const CRITS = new Set(['defilement', 'situation', 'temperament', 'capacity', 'unstated'])
const sumObj = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0)
const sumCross = (x) => Object.values(x || {}).reduce((a, row) => a + sumObj(row), 0)

ok('total = instances.length', ins.length === ag.total, `${ins.length} vs ${ag.total}`)
ok('sum(by_facet) = total', sumObj(ag.by_facet) === ag.total, `${sumObj(ag.by_facet)} vs ${ag.total}`)
ok('sum(by_tier) = total', sumObj(ag.by_tier) === ag.total, `${sumObj(ag.by_tier)} vs ${ag.total}`)
ok('criterion_x_tier sums to total', sumCross(ag.criterion_x_tier) === ag.total, `${sumCross(ag.criterion_x_tier)} vs ${ag.total}`)
ok('mode_x_tier sums to total', sumCross(ag.mode_x_tier) === ag.total, `${sumCross(ag.mode_x_tier)} vs ${ag.total}`)

const badFacet = ins.filter(i => !FACETS.has(i.facet)).map(i => i.id)
const badTier = ins.filter(i => !TIERS.has(i.tier)).map(i => i.id)
const badMode = ins.filter(i => !MODES.has(i.mode)).map(i => i.id)
const badCrit = ins.filter(i => !CRITS.has(i.criterion)).map(i => i.id)
ok('every facet in controlled vocab', badFacet.length === 0, badFacet.join(', '))
ok('every tier in controlled vocab', badTier.length === 0, badTier.join(', '))
ok('every mode in controlled vocab', badMode.length === 0, badMode.slice(0, 5).join(', '))
ok('every criterion in controlled vocab', badCrit.length === 0, badCrit.slice(0, 5).join(', '))

const idCounts = ins.reduce((m, i) => (m[i.id] = (m[i.id] || 0) + 1, m), {})
const repeats = Object.entries(idCounts).filter(([, n]) => n > 1)
ok('id repeats are documented census rows only (mn62, cross-faceted)', repeats.every(([id]) => id === 'mn62' || id === 'cst-s0103a.att-dn3_11_p002' || id === 'null'), 'repeats: ' + repeats.map(([id, n]) => `${id}×${n}`).join(', '))

ok('expansion_ledger (H0+H1) = expansion_added', ((ag.expansion_ledger?.H0 || 0) + (ag.expansion_ledger?.H1 || 0)) === ag.expansion_added, `${(ag.expansion_ledger?.H0 || 0) + (ag.expansion_ledger?.H1 || 0)} vs ${ag.expansion_added}`)
ok('verified ledger H0/H1 = expansion h_class tally', (ag.expansion_ledger?.H0 || 0) === ins.filter(i => i.source === 'expansion' && i.h_class === 'H0').length && (ag.expansion_ledger?.H1 || 0) === ins.filter(i => i.source === 'expansion' && i.h_class === 'H1').length, 'ledger matches per-instance h_class')
ok('expansion-tagged count = expansion_added', ins.filter(i => i.source === 'expansion').length === ag.expansion_added, `${ins.filter(i => i.source === 'expansion').length} vs ${ag.expansion_added}`)
ok('meta.version is set', !!d.meta.version, d.meta.version)
ok('corpus_snapshot present', !!d.meta.corpus_snapshot, d.meta.corpus_snapshot)
ok('query_log frame_rules present', (d.meta.query_log?.frame_rules || []).length === 4, String((d.meta.query_log?.frame_rules || []).length))
ok('frame_union matches stated 755', d.meta.query_log?.frame_union === 755, String(d.meta.query_log?.frame_union))

const fails = checks.filter(c => !c.pass)
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  [' + c.detail + ']' : ''}`)
console.log(`\n${fails.length === 0 ? 'ALL PASS' : fails.length + ' FAILED'} (${checks.length} checks)`)
process.exit(fails.length ? 1 : 0)
