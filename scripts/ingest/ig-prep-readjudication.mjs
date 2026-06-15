// Prepare the 208 expansion instances for warrant re-adjudication: dump them in
// batches, each instance with the fields a verifier needs to assign a checkable
// H0/H1 + a canonical warrant id.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const R = 'C:/Dev/Dhamma'
const d = JSON.parse(readFileSync(`${R}/public/research/individual-guidance.json`, 'utf8'))
const exp = d.instances.filter(i => i.source === 'expansion').map(i => ({
  id: i.id, citation: i.citation, tier: i.tier, layer: i.layer, voice: i.voice,
  mode: i.mode, object: i.object, criterion: i.criterion,
  recipient: i.recipient, recipient_features: i.recipient_features, occasion: i.occasion,
  function: i.function, evidence_pali: i.evidence_pali,
  warrant_hypothesis: i.warrant, coder_h_class: i.h_class,
}))
const dir = `${R}/research/individual-guidance/out/readjud`
mkdirSync(dir, { recursive: true })
const SIZE = 16
let n = 0
for (let i = 0; i < exp.length; i += SIZE) {
  writeFileSync(`${dir}/batch_${String(n).padStart(2, '0')}.json`, JSON.stringify(exp.slice(i, i + SIZE), null, 1))
  n++
}
console.log(JSON.stringify({ total: exp.length, batches: n, size: SIZE, dir }, null, 2))
