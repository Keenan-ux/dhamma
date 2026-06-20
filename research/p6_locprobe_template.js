export const meta = {
  name: 'cpd-location-recall-probe',
  description: 'Control 2: can the model predict comment LOCATIONS from segment structure alone (no Pāli)? Tests positional memory vs content-need.',
  phases: [{ title: 'Probe' }],
}
const SUTTAS = __DATA__   // [{id, segids:[...], k}]
const SCHEMA = { type:'object', additionalProperties:false, required:['predicted_segments'],
  properties:{ predicted_segments:{ type:'array', items:{type:'string'} } } }
function prompt(s, r) {
  return `Sutta ${s.id} consists of these segments, in order:\n${s.segids.join(', ')}\n\nA SuttaCentral translator placed explanatory comments on exactly ${s.k} of these segments. You are NOT given the Pāli text — using only your knowledge of ${s.id}, its structure, and where translators typically comment, predict which ${s.k} segment ids were commented on. Return exactly ${s.k} segment ids from the list above.`
}
phase('Probe')
const results = await pipeline(
  SUTTAS,
  (s) => parallel([0,1].map((r)=>()=>agent(prompt(s,r),{label:`loc ${s.id} #${r}`,phase:'Probe',schema:SCHEMA})))
           .then((preds)=>({ id:s.id, k:s.k, preds }))
)
return { batch:'location-probe', n:results.length, results }
