// Build the final verified warrant ledger for the 208 expansion instances:
// the 198 agreed rows + the 10 splits resolved by the coordinator per the prereg
// rule (H0 = canonical object with no carita-typing and no Vism-only apparatus;
// else H1), each split carrying its resolution basis.
import { readFileSync, writeFileSync } from 'node:fs'
const R = 'C:/Dev/Dhamma'
const adj = JSON.parse(readFileSync(`${R}/research/individual-guidance/out/readjud_result.json`, 'utf8')).rows

// Coordinator resolutions for the 10 split-flagged rows.
const SPLIT = {
  'cst-s0514a1.att-2_p166': { h: 'H0', w: 'DN 13', b: 'canonical brahmavihāra subject, DN 13 cultivation formula; no temperament-typing' },
  'cst-s0513a1.att-18_p045': { h: 'H0', w: 'Snp 1.8', b: 'mettā for a distressed/fearful person is the canonical Karaṇīyamettasutta keying' },
  'cst-s0402t.tik-an3_p635': { h: 'H0', w: 'AN 3.123', b: 'reports the canonical Gotamakacetiya teaching; self-warranted' },
  'cst-s0501t.nrf-11_p029': { h: 'H0', w: 'AN 9.3', b: 'clean Meghiya mettā→byāpāda antidote pairing' },
  'cst-vin01t1.tik-6_p034': { h: 'H0', w: 'MN 119', b: 'dvattiṃsākāra (32 parts) is the canonical kāyagatāsati subject; no temperament-typing' },
  'cst-vin05t.nrf-23_p066': { h: 'H0', w: 'MN 119', b: 'tacapañcaka (first 5 parts) canonical paṭikūlamanasikāra; ordination occasion is procedural, not a keying' },
  'cst-vin01t2.tik-59_p114': { h: 'H1', w: 'none', b: 'paṭibhāga-nimitta (counterpart-sign) is Vism VIII apparatus with no canonical counterpart' },
  'cst-vin01t2.tik-85_p006': { h: 'H0', w: 'MN 119', b: 'tacapañcaka canonical body-parts subject; ordination narrative is procedural' },
  'cst-vin02t.tik-216_p007': { h: 'H1', w: 'none', b: 'AN 6.55 warrants only the effort-balance half; the four-nimitta + indriya-samatta apparatus is Vism' },
  'cst-vin11t.nrf-25_p010': { h: 'H0', w: 'MN 119', b: 'tacapañcaka = first five of the 32 parts; canonical kāyagatāsati subject' },
}

// Warrant-id corrections: an adjudicator gave a real canonical verse in a form
// the corpus does not key. asubhāya cittaṁ bhāvehi = SN 8.4 (Ānanda to Vaṅgīsa).
const WARRANT_FIX = { 'thag1225': 'SN 8.4' }
const fixW = (w) => WARRANT_FIX[(w || '').trim().toLowerCase().replace(/\s+/g, '')] || w

const final = {}
for (const r of adj) {
  if (r.h_class === 'FLAG') {
    const s = SPLIT[r.id]
    if (!s) { console.error('UNRESOLVED SPLIT', r.id); continue }
    final[r.id] = { h_class: s.h, warrant_id: fixW(s.w), basis: s.b, split_resolved: true }
  } else {
    final[r.id] = { h_class: r.h_class, warrant_id: fixW(r.warrant_id), basis: r.warrant_basis || '', split_resolved: false }
  }
}
const vals = Object.values(final)
const H0 = vals.filter(v => v.h_class === 'H0').length
const H1 = vals.filter(v => v.h_class === 'H1').length
writeFileSync(`${R}/research/individual-guidance/out/readjud_final.json`, JSON.stringify(final, null, 1))
console.log(JSON.stringify({ total: vals.length, H0, H1, splits_resolved: vals.filter(v => v.split_resolved).length }, null, 2))
